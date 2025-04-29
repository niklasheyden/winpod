import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useQuery } from '@tanstack/react-query';
import type { Podcast } from '../lib/types';
import PodcastCard from '../components/PodcastCard';

const Explore = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const { data: podcasts, isLoading, error } = useQuery<Podcast[]>({
    queryKey: ['podcasts', searchTerm, selectedGroup],
    queryFn: async () => {
      let query = supabase
        .from('podcasts')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,abstract.ilike.%${searchTerm}%,authors.ilike.%${searchTerm}%`);
      }

      // Only filter for h-lab, as WIN includes all papers
      if (selectedGroup === 'h-lab') {
        query = query.eq('research_group', 'h-lab');
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="max-w-6xl mx-auto">
      {/* Search and Filter Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-center mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search podcasts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kit-green focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedGroup(selectedGroup === 'WIN' ? null : 'WIN')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedGroup === 'WIN'
                  ? 'bg-kit-green text-white'
                  : 'bg-kit-green-50 text-kit-green-700 hover:bg-kit-green-100'
              }`}
            >
              WIN Papers
            </button>
            <button
              onClick={() => setSelectedGroup(selectedGroup === 'h-lab' ? null : 'h-lab')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedGroup === 'h-lab'
                  ? 'bg-kit-green text-white'
                  : 'bg-kit-green-50 text-kit-green-700 hover:bg-kit-green-100'
              }`}
            >
              h-lab Papers
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kit-green mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading podcasts...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <p className="text-red-600">Failed to load podcasts. Please try again later.</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && (!podcasts || podcasts.length === 0) && (
        <div className="text-center py-12">
          <p className="text-gray-600">No podcasts found. Try adjusting your search or filters.</p>
        </div>
      )}

      {/* Podcasts Grid */}
      {!isLoading && !error && podcasts && podcasts.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {podcasts.map((podcast) => (
            <PodcastCard key={podcast.id} podcast={podcast} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Explore;