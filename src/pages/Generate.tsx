import React, { useState, useRef } from 'react';
import { Upload, FileText, Users, Calendar, Hash, BookOpen, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import OpenAI from 'openai';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const Generate = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [pdfText, setPdfText] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: '',
    abstract: '',
    authors: '',
    publishingYear: new Date().getFullYear().toString(),
    researchGroup: '',
    doi: '',
    keywords: ''
  });

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const extractTextFromPdf = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }
      
      return fullText;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw new Error('Failed to extract text from PDF');
    }
  };

  const checkStorageBucket = async (retries = MAX_RETRIES): Promise<boolean> => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        
        if (bucketsError) {
          console.error(`Attempt ${attempt}: Failed to list buckets:`, bucketsError);
          if (attempt === retries) {
            throw new Error(`Failed to check storage buckets (Error code: ${bucketsError.code || 'unknown'}): ${bucketsError.message}`);
          }
          await delay(RETRY_DELAY);
          continue;
        }

        const podcastsBucket = buckets?.find(bucket => bucket.name === 'podcasts');
        if (!podcastsBucket) {
          if (attempt === retries) {
            throw new Error(
              'Storage bucket "podcasts" not found or not accessible. Please verify:\n\n' +
              '1. The bucket "podcasts" exists in your Supabase project\n' +
              '2. The bucket is set to public\n' +
              '3. Your authentication token has the correct permissions\n' +
              '4. The bucket name is exactly "podcasts" (case-sensitive)\n\n' +
              'If the issue persists, please contact support with error code: BUCKET_NOT_FOUND'
            );
          }
          await delay(RETRY_DELAY);
          continue;
        }

        return true;
      } catch (error) {
        if (attempt === retries) {
          throw error;
        }
        await delay(RETRY_DELAY);
      }
    }
    return false;
  };

  const saveImageToSupabase = async (imageUrl: string, userId: string): Promise<string> => {
    try {
      // Fetch the image through our Edge Function to avoid CORS
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ imageUrl })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to fetch image: ${errorData.error || response.statusText}`);
      }

      const imageBlob = await response.blob();

      // Generate a unique filename with timestamp and random string
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const filename = `${userId}/covers/${timestamp}-${randomString}.png`;

      // Upload to Supabase Storage with retry logic
      let uploadAttempt = 0;
      let uploadSuccess = false;
      let lastError;

      while (uploadAttempt < MAX_RETRIES && !uploadSuccess) {
        try {
          const { error: uploadError } = await supabase.storage
            .from('podcasts')
            .upload(filename, imageBlob, {
              contentType: 'image/png',
              cacheControl: '31536000', // Cache for 1 year
              upsert: false
            });

          if (uploadError) {
            lastError = uploadError;
            uploadAttempt++;
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * uploadAttempt));
            continue;
          }

          uploadSuccess = true;
        } catch (error) {
          lastError = error;
          uploadAttempt++;
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * uploadAttempt));
        }
      }

      if (!uploadSuccess) {
        throw new Error(`Failed to upload image after ${MAX_RETRIES} attempts: ${lastError?.message}`);
      }

      // Get the public URL using the newer format
      const publicUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/podcasts/${filename}`;
      
      // Verify the image is accessible
      const verifyResponse = await fetch(publicUrl, { method: 'HEAD' });
      if (!verifyResponse.ok) {
        throw new Error('Failed to verify image accessibility');
      }

      return publicUrl;
    } catch (error) {
      console.error('Error saving image:', error);
      throw new Error(`Failed to save cover image: ${error.message}`);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setError(null);
        try {
          const text = await extractTextFromPdf(selectedFile);
          setPdfText(text);
        } catch (err) {
          console.error('Error extracting text from PDF:', err);
          setError('Failed to extract text from PDF. Please try again.');
        }
        // Reset the input to allow selecting the same file again
        event.target.value = '';
      }
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
      setError(null);
      try {
        const text = await extractTextFromPdf(droppedFile);
        setPdfText(text);
      } catch (err) {
        console.error('Error extracting text from PDF:', err);
        setError('Failed to extract text from PDF. Please try again.');
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateCoverImagePrompt = async (title: string, abstract: string, keywords: string) => {
    try {
      // First, get key concepts and visual elements from the paper
      const conceptsCompletion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "You are an expert at extracting key visual concepts from academic papers and converting them into clear, concrete imagery. Focus on the main themes, methods, and outcomes that can be represented visually."
          },
          {
            role: "user",
            content: `Extract the key idea from this research paper that could be represented in an image. Focus on concrete, visual elements, not abstract concepts.

Title: ${title}
Abstract: ${abstract}
Keywords: ${keywords}

Format your response as a comma-separated list of visual elements, being as specific as possible.`
          }
        ],
        max_tokens: 150
      });

      const visualConcepts = conceptsCompletion.choices[0].message.content || '';

      // Then, create a detailed DALL-E prompt using these concepts
      const promptCompletion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "You are an expert at creating detailed, specific prompts for DALL-E to generate research paper cover images. Create prompts that are concrete and specific, focusing on visual elements while maintaining a professional, academic aesthetic."
          },
          {
            role: "user",
            content: `Create a detailed DALL-E prompt for a research paper cover image. The image should be professional and suitable for an academic context.

Title: ${title}
Keywords: ${keywords}
Key Visual Concepts: ${visualConcepts}

Requirements:
- Start with the art style/medium
- Include specific visual elements
- Maintain academic professionalism
- Avoid abstract concepts unless they can be represented visually
- Include color scheme suggestions
- Specify composition preferences

Format: Single paragraph, detailed description`
          }
        ],
        max_tokens: 200
      });

      return promptCompletion.choices[0].message.content || '';
    } catch (error) {
      console.error('Error generating image prompt:', error);
      return `Create a professional, abstract cover image for a research paper titled "${title}" with keywords ${keywords}. The image should be modern, clean, and suitable for a podcast cover.`;
    }
  };

  const generatePodcast = async () => {
    try {
      if (!user) {
        throw new Error('You must be logged in to generate a podcast');
      }

      if (!pdfText) {
        throw new Error('No PDF text extracted. Please upload a PDF file first.');
      }

      // Verify storage bucket exists and is accessible with retries
      await checkStorageBucket();

      // Generate an optimized DALL-E prompt
      const imagePrompt = await generateCoverImagePrompt(
        formData.title,
        formData.abstract,
        formData.keywords
      );

      // Generate cover image using DALL-E with the optimized prompt
      const imageResponse = await openai.images.generate({
        model: "dall-e-3",
        prompt: imagePrompt,
        size: "1024x1024",
        quality: "standard",
        style: "natural",
        n: 1,
      });

      const tempImageUrl = imageResponse.data[0].url;
      if (!tempImageUrl) {
        throw new Error('Failed to generate cover image');
      }

      // Save the image to Supabase storage
      const coverImageUrl = await saveImageToSupabase(tempImageUrl, user.id);

      // Generate audio script using GPT-4 with the extracted PDF text
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "You are an expert podcast host who specializes in making academic research accessible and engaging. Your style is conversational, natural, and flows like a real podcast. You never use formal section headers or academic jargon without explanation. You never read abbreviations in parentheses - instead, you naturally incorporate the full terms into your speech. Your tone is warm, enthusiastic, and engaging while maintaining professionalism."
          },
          {
            role: "user",
            content: `Create a natural-sounding podcast script (between 6000-7000 characters) for the following research paper:
              Title: ${formData.title}
              Abstract: ${formData.abstract}
              Authors: ${formData.authors}
              Keywords: ${formData.keywords}
              
              Full Paper Text:
              ${pdfText}
              
              Guidelines for the script:
              1. Start with a professional welcome: "Welcome to a new episode of Orpheus!"
              2. Introduce the paper and authors in a clear, objective manner:
                 - If there is only one author, name the author 
                 - If there are exactly two authors, name both authors
                 - If there are more than two authors, name only the lead author (first author) and refer to others as "colleagues" or "co-authors"
                 - Do not list all authors by name
              3. Explain the research area using precise, accessible language
              4. Present the research findings in a flowing narrative without section headers
              5. Use natural transitions between topics
              6. Explain any technical terms or abbreviations the first time they appear
              7. Never read abbreviations in parentheses - use the full terms
              8. End with a balanced conclusion that summarizes key findings
              9. Close with a measured assessment of the research's implications
              
              Remember: 
              - The script should be between 6000-7000 characters total for a 5-7 minute podcast
              - Make it sound like a professional host speaking naturally, not reading from an academic paper
              - Avoid sensational language, intense adjectives, or hyperbolic claims
              - Never use words like 'groundbreaking', 'exceptional', 'intriguing', 'revolutionary', 'amazing', 'incredible', 'remarkable', 'outstanding', 'brilliant', or similar hyperbolic terms
              - Present findings in a balanced, evidence-based manner
              - Focus on clarity and objectivity rather than dramatic impact
              - Use precise, measured language to describe research outcomes
              - If you need to emphasize importance, use specific data or evidence rather than intense adjectives
              - Only name the lead author and refer to others as colleagues`
          }
        ]
      });

      const script = completion.choices[0].message.content;
      if (!script) {
        throw new Error('Failed to generate script');
      }

      // Generate audio using OpenAI TTS
      const speechResponse = await openai.audio.speech.create({
        model: "gpt-4o-mini-tts",
        voice: "echo",
        input: script,
        instructions: "Speak in a engaging and positive, yet professsional tone that is appealing to an academic audience.",
      });

      const audioBlob = await speechResponse.blob();
      
      // Upload audio file to Supabase Storage with error handling
      const audioFileName = `${user.id}/${Date.now()}-podcast-audio.mp3`;
      const { data: audioData, error: audioUploadError } = await supabase.storage
        .from('podcasts')
        .upload(audioFileName, audioBlob, {
          contentType: 'audio/mpeg',
          cacheControl: '3600',
          upsert: false
        });

      if (audioUploadError) {
        console.error('Audio upload error:', audioUploadError);
        throw new Error(`Failed to upload audio file (Error code: ${audioUploadError.code || 'unknown'}): ${audioUploadError.message}`);
      }

      // Get the public URL for the audio file
      const { data: { publicUrl: audioUrl } } = supabase.storage
        .from('podcasts')
        .getPublicUrl(audioFileName);

      if (!audioUrl) {
        throw new Error('Failed to generate public URL for audio file');
      }

      // Save podcast to database
      const { data: podcastData, error: podcastError } = await supabase
        .from('podcasts')
        .insert([
          {
            title: formData.title,
            abstract: formData.abstract,
            authors: formData.authors,
            publishing_year: parseInt(formData.publishingYear),
            research_group: formData.researchGroup,
            doi: formData.doi || null,
            keywords: formData.keywords,
            cover_image_url: coverImageUrl,
            audio_url: audioUrl,
            script: script,
            user_id: user.id
          }
        ])
        .select()
        .single();

      if (podcastError) {
        throw new Error(`Failed to save podcast (Error code: ${podcastError.code || 'unknown'}): ${podcastError.message}`);
      }

      // Navigate to the podcast page
      navigate(`/podcast/${podcastData.id}`);
    } catch (error: any) {
      console.error('Error generating podcast:', error);
      setError(error.message || 'Failed to generate podcast');
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsGenerating(true);
    setProgress(0);
    setError(null);

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 1000);

    await generatePodcast();

    clearInterval(progressInterval);
    setProgress(100);
    setIsGenerating(false);
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 51 }, (_, i) => currentYear - i);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
        <h1 className="text-2xl font-bold mb-6">Generate Podcast</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 whitespace-pre-line">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* PDF Upload */}
          <div
            onClick={triggerFileInput}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`border-2 ${
              isDragging ? 'border-kit-green bg-kit-green-50' : 'border-dashed border-gray-300'
            } rounded-lg p-6 text-center cursor-pointer transition-colors duration-200 hover:bg-gray-50`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
              id="pdf-upload"
            />
            <div className="flex flex-col items-center">
              <Upload className={`h-12 w-12 ${file ? 'text-kit-green' : 'text-gray-400'} mb-2`} />
              <span className={`${file ? 'text-kit-green font-medium' : 'text-gray-600'}`}>
                {file ? file.name : 'Upload your research paper (PDF)'}
              </span>
              <span className="text-sm text-gray-500 mt-1">
                {file ? 'Click to change file' : 'Click or drag and drop'}
              </span>
            </div>
          </div>

          {/* Paper Details */}
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                <FileText className="inline h-4 w-4 mr-1" />
                Paper Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-kit-green"
                required
              />
            </div>

            <div>
              <label htmlFor="abstract" className="block text-sm font-medium text-gray-700 mb-1">
                Abstract
              </label>
              <textarea
                id="abstract"
                name="abstract"
                value={formData.abstract}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-kit-green"
                required
              />
            </div>

            <div>
              <label htmlFor="authors" className="block text-sm font-medium text-gray-700 mb-1">
                <Users className="inline h-4 w-4 mr-1" />
                Authors
              </label>
              <input
                type="text"
                id="authors"
                name="authors"
                value={formData.authors}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-kit-green"
                required
              />
            </div>

            <div>
              <label htmlFor="publishingYear" className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="inline h-4 w-4 mr-1" />
                Publishing Year
              </label>
              <select
                id="publishingYear"
                name="publishingYear"
                value={formData.publishingYear}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-kit-green"
                required
              >
                {years.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="researchGroup" className="block text-sm font-medium text-gray-700 mb-1">
                Research Group
              </label>
              <select
                id="researchGroup"
                name="researchGroup"
                value={formData.researchGroup}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-kit-green"
                required
              >
                <option value="">Select a group</option>
                <option value="WIN">WIN</option>
                <option value="h-lab">h-lab</option>
              </select>
            </div>

            <div>
              <label htmlFor="doi" className="block text-sm font-medium text-gray-700 mb-1">
                <Hash className="inline h-4 w-4 mr-1" />
                DOI Link (optional)
              </label>
              <input
                type="url"
                id="doi"
                name="doi"
                value={formData.doi}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-kit-green"
              />
            </div>

            <div>
              <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-1">
                <BookOpen className="inline h-4 w-4 mr-1" />
                Keywords
              </label>
              <input
                type="text"
                id="keywords"
                name="keywords"
                value={formData.keywords}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-kit-green"
                required
              />
            </div>
          </div>

          {/* Generate Button */}
          <button
            type="submit"
            disabled={!file || isGenerating}
            className={`w-full py-3 px-4 flex items-center justify-center rounded-md text-white font-medium ${
              !file || isGenerating
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-kit-green hover:bg-kit-green-600'
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                Generating...
              </>
            ) : (
              'Generate Podcast'
            )}
          </button>

          {/* Progress Bar */}
          {isGenerating && (
            <div className="mt-4">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-kit-green transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-center mt-2">
                <p className="text-sm text-gray-600">
                  {progress}% Complete
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Please be patient, podcast generation may take a few minutes...
                </p>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Generate;