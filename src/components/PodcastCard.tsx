import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Play, Pause, Download, Share2, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Podcast } from '../lib/types';
import { useToast } from './Toast';

interface PodcastCardProps {
  podcast: Podcast;
  className?: string;
}

const PodcastCard = ({ podcast, className = '' }: PodcastCardProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { showToast } = useToast();

  const handlePlayPause = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!audioRef.current) {
      try {
        let storagePath = podcast.audio_url;
        if (storagePath.includes('storage/v1/object/public/podcasts/')) {
          storagePath = storagePath.split('storage/v1/object/public/podcasts/')[1];
        }

        const { data, error } = await supabase
          .storage
          .from('podcasts')
          .createSignedUrl(storagePath, 3600);

        if (error) throw error;
        if (!data?.signedUrl) throw new Error('No signed URL received');

        const audio = new Audio(data.signedUrl);
        audio.addEventListener('ended', () => setIsPlaying(false));
        audio.addEventListener('error', () => {
          setAudioError('Error playing audio');
          setIsPlaying(false);
        });
        audioRef.current = audio;
      } catch (error) {
        console.error('Error setting up audio:', error);
        setAudioError('Error loading audio');
        return;
      }
    }

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      try {
        await audioRef.current.play();
      } catch (error) {
        console.error('Error playing audio:', error);
        setAudioError('Error playing audio');
        return;
      }
    }
    setIsPlaying(!isPlaying);
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    try {
      let storagePath = podcast.audio_url;
      if (storagePath.includes('storage/v1/object/public/podcasts/')) {
        storagePath = storagePath.split('storage/v1/object/public/podcasts/')[1];
      }

      const { data, error } = await supabase
        .storage
        .from('podcasts')
        .download(storagePath);

      if (error) throw error;
      if (!data) throw new Error('No data received');

      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${podcast.title}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading audio:', error);
      setAudioError('Error downloading audio');
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    const url = `${window.location.origin}/podcast/${podcast.id}`;
    navigator.clipboard.writeText(url);
    showToast('Podcast link copied to clipboard!');
  };

  return (
    <Link
      to={`/podcast/${podcast.id}`}
      className={`group relative bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 ${className}`}
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={podcast.cover_image_url}
          alt={podcast.title}
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
        
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
          <button
            onClick={handlePlayPause}
            disabled={!!audioError}
            className={`w-10 h-10 flex items-center justify-center rounded-full bg-white/90 hover:bg-white transition-colors ${
              audioError ? 'text-red-500' : 'text-kit-green'
            }`}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/90 hover:bg-white transition-colors text-kit-green"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={handleShare}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/90 hover:bg-white transition-colors text-kit-green"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-2">
          <span className="inline-block px-2 py-1 text-xs font-medium bg-kit-green-50 text-kit-green rounded">
            {podcast.research_group}
          </span>
        </div>
        <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-kit-green transition-colors">
          {podcast.title}
        </h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-1">{podcast.authors}</p>
        
        <div className="flex items-center text-sm text-gray-500">
          <Calendar className="h-4 w-4 mr-1" />
          <span>Published {podcast.publishing_year}</span>
        </div>

        {audioError && (
          <p className="mt-2 text-sm text-red-500">{audioError}</p>
        )}
      </div>
    </Link>
  );
};

export default PodcastCard;