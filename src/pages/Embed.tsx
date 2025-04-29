import React from 'react';
import { supabase } from '../lib/supabase';
import { useQuery } from '@tanstack/react-query';
import type { Podcast } from '../lib/types';
import EmbeddedPodcastCard from '../components/EmbeddedPodcastCard';

const Embed = () => {
  const { data: podcasts, isLoading, error } = useQuery<Podcast[]>({
    queryKey: ['embedded-podcasts'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('podcasts')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error('Error fetching podcasts for embed:', err);
        return [];
      }
    }
  });

  return (
    <div className="winpod-embed">
      <style>
        {`
          .winpod-embed {
            font-family: system-ui, -apple-system, sans-serif;
            max-width: 100%;
            margin: 0;
            padding: 0;
            background-color: transparent;
          }
          .winpod-embed * {
            box-sizing: border-box;
          }
          .winpod-embed .grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1.5rem;
            padding: 0.5rem;
          }
          .winpod-embed .bg-kit-green {
            background-color: #10B981;
          }
          .winpod-embed .text-kit-green {
            color: #10B981;
          }
          .winpod-embed .bg-kit-green-50 {
            background-color: #ECFDF5;
          }
          .winpod-embed .hover\\:text-kit-green:hover {
            color: #059669;
          }
          .winpod-embed .hover\\:bg-kit-green-50:hover {
            background-color: #D1FAE5;
          }
          @media (max-width: 640px) {
            .winpod-embed .grid {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>

      {isLoading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kit-green mx-auto"></div>
        </div>
      )}

      {error && (
        <div className="text-center py-4 text-red-600">
          Failed to load podcasts
        </div>
      )}

      {!isLoading && !error && podcasts && (
        <div className="grid">
          {podcasts.map((podcast) => (
            <EmbeddedPodcastCard key={podcast.id} podcast={podcast} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Embed; 