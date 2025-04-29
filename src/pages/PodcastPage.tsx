import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Pause, Download, Share2, Calendar, Users, BookOpen, Trash2, Edit } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import type { Podcast } from '../lib/types';
import { useToast } from '../components/Toast';
import EditPodcastForm from '../components/EditPodcastForm';

const PodcastPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { showToast } = useToast();

  const { data: podcast, isLoading, error } = useQuery<Podcast>({
    queryKey: ['podcast', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('podcasts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    }
  });

  useEffect(() => {
    const getSignedUrl = async () => {
      setAudioError(null);
      if (podcast?.audio_url) {
        try {
          let storagePath = podcast.audio_url;
          if (storagePath.includes('storage/v1/object/public/podcasts/')) {
            storagePath = storagePath.split('storage/v1/object/public/podcasts/')[1];
          }

          const { data, error } = await supabase
            .storage
            .from('podcasts')
            .createSignedUrl(storagePath, 3600);

          if (error) {
            throw new Error(`Error getting signed URL: ${error.message}`);
          }

          if (!data?.signedUrl) {
            throw new Error('No signed URL received from storage');
          }

          setAudioUrl(data.signedUrl);
        } catch (error) {
          console.error('Error processing audio URL:', error);
          setAudioError(error instanceof Error ? error.message : 'Error loading audio file');
          setAudioUrl(null);
        }
      }
    };

    getSignedUrl();
  }, [podcast]);

  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current;

      const handleTimeUpdate = () => {
        setProgress((audio.currentTime / audio.duration) * 100);
      };

      const handleLoadedMetadata = () => {
        setDuration(audio.duration);
      };

      const handleEnded = () => {
        setIsPlaying(false);
        setProgress(0);
        audio.currentTime = 0;
      };

      const handleError = (e: ErrorEvent) => {
        console.error('Audio element error:', e);
        setAudioError('Error playing audio file');
        setIsPlaying(false);
      };

      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);

      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('error', handleError);
      };
    }
  }, [audioUrl]);

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(error => {
          console.error('Error playing audio:', error);
          setAudioError('Failed to play audio file');
          setIsPlaying(false);
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = Number(e.target.value);
    setProgress(newProgress);
    if (audioRef.current) {
      audioRef.current.currentTime = (newProgress / 100) * audioRef.current.duration;
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('Podcast link copied to clipboard!');
  };

  const handleDownload = async () => {
    if (!podcast?.audio_url) return;

    try {
      let storagePath = podcast.audio_url;
      if (storagePath.includes('storage/v1/object/public/podcasts/')) {
        storagePath = storagePath.split('storage/v1/object/public/podcasts/')[1];
      }

      const { data, error } = await supabase
        .storage
        .from('podcasts')
        .download(storagePath);

      if (error) {
        console.error('Error downloading audio:', error);
        return;
      }

      if (data) {
        const url = URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${podcast.title}.mp3`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading audio:', error);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!podcast || !user || user.id !== podcast.user_id) return;

    try {
      setIsDeleting(true);
      setDeleteError(null);

      let audioPath = podcast.audio_url;
      if (audioPath.includes('storage/v1/object/public/podcasts/')) {
        audioPath = audioPath.split('storage/v1/object/public/podcasts/')[1];
      }

      const { error: storageError } = await supabase
        .storage
        .from('podcasts')
        .remove([audioPath]);

      if (storageError) {
        console.error('Error deleting audio file:', storageError);
      }

      const { error: dbError } = await supabase
        .from('podcasts')
        .delete()
        .eq('id', podcast.id);

      if (dbError) throw dbError;

      queryClient.invalidateQueries({ queryKey: ['podcasts'] });
      queryClient.invalidateQueries({ queryKey: ['user-podcasts'] });
      navigate('/');
      showToast('Podcast deleted successfully');
    } catch (error) {
      console.error('Error deleting podcast:', error);
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete podcast');
      setIsDeleting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kit-green"></div>
      </div>
    );
  }

  if (error || !podcast) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load podcast. Please try again later.</p>
      </div>
    );
  }

  const canEdit = user && user.id === podcast.user_id;

  return (
    <div className="max-w-4xl mx-auto">
      {deleteError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{deleteError}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="relative h-64 md:h-96">
          <img
            src={podcast.cover_image_url}
            alt={podcast.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{podcast.title}</h1>
            <p className="text-lg opacity-90">{podcast.authors}</p>
          </div>
        </div>

        <div className="p-6">
          {audioUrl && (
            <audio
              ref={audioRef}
              src={audioUrl}
              preload="metadata"
              onError={() => setAudioError('Error loading audio file')}
            />
          )}
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={handlePlayPause}
              disabled={!audioUrl || !!audioError}
              className={`w-12 h-12 flex items-center justify-center rounded-full text-white transition-colors ${
                audioUrl && !audioError ? 'bg-kit-green hover:bg-kit-green-600' : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>
            <div className="flex-1">
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={handleProgressChange}
                disabled={!audioUrl || !!audioError}
                className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                  audioUrl && !audioError ? 'bg-gray-200' : 'bg-gray-100 cursor-not-allowed'
                }`}
              />
            </div>
            <span className="text-gray-600 min-w-[4rem]">
              {formatTime(duration * (progress / 100))} / {formatTime(duration)}
            </span>
          </div>

          {audioError && (
            <div className="text-red-600 mb-4 text-sm">
              {audioError}
            </div>
          )}

          <div className="flex gap-4">
            {podcast.doi && (
              <a
                href={podcast.doi}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-kit-green text-white rounded-md hover:bg-kit-green-600"
              >
                <BookOpen className="w-4 h-4" />
                View Paper
              </a>
            )}
            {audioUrl && (
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-kit-green text-white rounded-md hover:bg-kit-green-600"
              >
                <Download className="w-4 h-4" />
                Download Audio
              </button>
            )}
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
            {canEdit && (
              <>
                <button
                  onClick={() => setShowEditForm(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-kit-green text-kit-green rounded-md hover:bg-kit-green-50 ml-auto"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={handleDeleteClick}
                  disabled={isDeleting}
                  className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50"
                >
                  {isDeleting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-8">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-kit-green" />
                <span className="text-gray-700">{podcast.publishing_year}</span>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-kit-green" />
                <span className="text-gray-700">{podcast.authors}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-500 mb-1">Keywords</div>
            <div className="text-gray-700">{podcast.keywords}</div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">Abstract</h2>
          <div className="prose max-w-none">
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">{podcast.abstract}</p>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Delete Podcast</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this podcast? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditForm && podcast && (
        <EditPodcastForm
          podcast={podcast}
          onClose={() => setShowEditForm(false)}
        />
      )}
    </div>
  );
};

export default PodcastPage;