import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useQuery } from '@tanstack/react-query';
import type { Podcast } from '../lib/types';
import EmbeddedPodcastCard from '../components/EmbeddedPodcastCard';

const Embed = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  useEffect(() => {
    // Read the group parameter from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const group = urlParams.get('group');
    if (group === 'h-lab') {
      setSelectedGroup('h-lab');
    }
  }, []);

  const { data: podcasts, isLoading, error } = useQuery<Podcast[]>({
    queryKey: ['embedded-podcasts', searchTerm, selectedGroup],
    queryFn: async () => {
      try {
        let query = supabase
          .from('podcasts')
          .select('*')
          .order('created_at', { ascending: false });

        if (searchTerm) {
          query = query.or(`title.ilike.%${searchTerm}%,abstract.ilike.%${searchTerm}%,authors.ilike.%${searchTerm}%`);
        }

        // Filter by selected research group
        if (selectedGroup) {
          query = query.eq('research_group', selectedGroup);
        }

        const { data, error } = await query;
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
          .winpod-embed .search-container {
            padding: 0.5rem;
            margin-bottom: 0.5rem;
          }
          .winpod-embed .search-input {
            width: 100%;
            padding: 0.5rem 0.75rem 0.5rem 2rem;
            border: 1px solid #e5e7eb;
            border-radius: 0.375rem;
            font-size: 0.875rem;
            outline: none;
            transition: border-color 0.15s ease-in-out;
          }
          .winpod-embed .search-input:focus {
            border-color: #10B981;
            box-shadow: 0 0 0 1px #10B981;
          }
          .winpod-embed .search-icon {
            position: absolute;
            left: 0.75rem;
            top: 50%;
            transform: translateY(-50%);
            color: #9CA3AF;
            width: 1rem;
            height: 1rem;
          }
          .winpod-embed .filter-container {
            display: flex;
            gap: 0.5rem;
            padding: 0 0.5rem 0.5rem;
          }
          .winpod-embed .filter-button {
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
            font-size: 0.75rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s ease-in-out;
          }
          .winpod-embed .filter-button.active {
            background-color: #10B981;
            color: white;
          }
          .winpod-embed .filter-button:not(.active) {
            background-color: #ECFDF5;
            color: #059669;
          }
          .winpod-embed .filter-button:not(.active):hover {
            background-color: #D1FAE5;
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
          .winpod-embed .empty-state {
            text-align: center;
            padding: 1rem;
            color: #6B7280;
            font-size: 0.875rem;
          }
          @media (max-width: 640px) {
            .winpod-embed .grid {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>

      {/* Search and Filter Section */}
      <div className="search-container">
        <div className="relative">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search podcasts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="filter-container">
        <button
          onClick={() => setSelectedGroup(selectedGroup === 'h-lab' ? null : 'h-lab')}
          className={`filter-button ${selectedGroup === 'h-lab' ? 'active' : ''}`}
        >
          h-lab Papers
        </button>
        <button
          onClick={() => setSelectedGroup(selectedGroup === 'IM' ? null : 'IM')}
          className={`filter-button ${selectedGroup === 'IM' ? 'active' : ''}`}
        >
          IM Papers
        </button>
        <button
          onClick={() => setSelectedGroup(selectedGroup === 'WI-III' ? null : 'WI-III')}
          className={`filter-button ${selectedGroup === 'WI-III' ? 'active' : ''}`}
        >
          WI-III Papers
        </button>
        <button
          onClick={() => setSelectedGroup(selectedGroup === 'DSI' ? null : 'DSI')}
          className={`filter-button ${selectedGroup === 'DSI' ? 'active' : ''}`}
        >
          DSI Papers
        </button>
      </div>

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

      {!isLoading && !error && (!podcasts || podcasts.length === 0) && (
        <div className="empty-state">
          No podcasts found. Try adjusting your search or filters.
        </div>
      )}

      {!isLoading && !error && podcasts && podcasts.length > 0 && (
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