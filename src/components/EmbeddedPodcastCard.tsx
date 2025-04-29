import React from 'react';
import { Play, Calendar } from 'lucide-react';
import type { Podcast } from '../lib/types';

interface EmbeddedPodcastCardProps {
  podcast: Podcast;
}

const EmbeddedPodcastCard = ({ podcast }: EmbeddedPodcastCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300">
      <div className="relative h-48 overflow-hidden">
        <img
          src={podcast.cover_image_url}
          alt={podcast.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
        
        <div className="absolute bottom-4 left-4 right-4">
          <a
            href={`${window.location.origin}/podcast/${podcast.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/90 hover:bg-white transition-colors text-kit-green"
          >
            <Play className="w-5 h-5" />
          </a>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-2">
          <span className="inline-block px-2 py-1 text-xs font-medium bg-kit-green-50 text-kit-green rounded">
            {podcast.research_group}
          </span>
        </div>
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">
          <a
            href={`${window.location.origin}/podcast/${podcast.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-kit-green transition-colors"
          >
            {podcast.title}
          </a>
        </h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-1">{podcast.authors}</p>
        
        <div className="flex items-center text-sm text-gray-500">
          <Calendar className="h-4 w-4 mr-1" />
          <span>Published {podcast.publishing_year}</span>
        </div>
      </div>
    </div>
  );
};

export default EmbeddedPodcastCard; 