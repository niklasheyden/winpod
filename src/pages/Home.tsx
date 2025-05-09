import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Headphones, Share2, Sparkles, Search, FileUp, AudioWaveform as Waveform } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { useQuery } from '@tanstack/react-query';
import type { Podcast } from '../lib/types';
import PodcastCard from '../components/PodcastCard';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const handleCtaClick = () => {
    if (user) {
      navigate('/generate');
    } else {
      navigate('/auth');
    }
  };

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

      // Filter by selected research group
      if (selectedGroup) {
        query = query.eq('research_group', selectedGroup);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="relative text-center py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-tech-pattern opacity-10"></div>
        <div className="relative">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Transform Research Papers into
            <span className="bg-gradient-to-r from-kit-green to-kit-green-600 bg-clip-text text-transparent">
              {' '}Engaging Podcasts
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            WinPod uses AI to turn academic papers into high-quality audio content, making research more accessible and digestible.
          </p>
          <button
            onClick={handleCtaClick}
            className="inline-flex items-center px-6 py-3 text-lg font-medium bg-kit-green text-white rounded-lg hover:bg-kit-green-600 focus:outline-none focus:ring-2 focus:ring-kit-green focus:ring-offset-2 transition-colors duration-200"
          >
            Generate a Podcast
            <Sparkles className="ml-2 h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Features Section */}
      <div className="px-4 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Transform your research into engaging audio content in three simple steps
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            {/* Upload & Analyze */}
            <div className="group">
              <div className="mb-6 flex justify-center">
                <div className="w-14 h-14 bg-kit-green-50 rounded-2xl flex items-center justify-center transform transition-transform group-hover:scale-110 duration-300">
                  <FileUp className="w-7 h-7 text-kit-green" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Upload & Analyze</h3>
                <p className="text-gray-600">
                  Upload your research paper and let our AI analyze its key components and findings.
                </p>
              </div>
            </div>

            {/* Generate Audio */}
            <div className="group">
              <div className="mb-6 flex justify-center">
                <div className="w-14 h-14 bg-kit-green-50 rounded-2xl flex items-center justify-center transform transition-transform group-hover:scale-110 duration-300">
                  <Waveform className="w-7 h-7 text-kit-green" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Generate Audio</h3>
                <p className="text-gray-600">
                  Convert your paper into a natural-sounding podcast with our advanced text-to-speech technology.
                </p>
              </div>
            </div>

            {/* Share & Learn */}
            <div className="group">
              <div className="mb-6 flex justify-center">
                <div className="w-14 h-14 bg-kit-green-50 rounded-2xl flex items-center justify-center transform transition-transform group-hover:scale-110 duration-300">
                  <Share2 className="w-7 h-7 text-kit-green" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Share & Learn</h3>
                <p className="text-gray-600">
                  Share your research podcast with colleagues and make your findings accessible to a wider audience.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="px-4 py-12">
        <h2 className="text-3xl font-bold text-center mb-8">Latest Research Podcasts</h2>
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search podcasts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-primary pl-10"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedGroup(selectedGroup === 'h-lab' ? null : 'h-lab')}
                className={`btn-secondary ${
                  selectedGroup === 'h-lab' && 'bg-kit-green text-white hover:bg-kit-green-600'
                }`}
              >
                h-lab Papers
              </button>
              <button
                onClick={() => setSelectedGroup(selectedGroup === 'IM' ? null : 'IM')}
                className={`btn-secondary ${
                  selectedGroup === 'IM' && 'bg-kit-green text-white hover:bg-kit-green-600'
                }`}
              >
                IM Papers
              </button>
              <button
                onClick={() => setSelectedGroup(selectedGroup === 'WI-III' ? null : 'WI-III')}
                className={`btn-secondary ${
                  selectedGroup === 'WI-III' && 'bg-kit-green text-white hover:bg-kit-green-600'
                }`}
              >
                WI-III Papers
              </button>
              <button
                onClick={() => setSelectedGroup(selectedGroup === 'DSI' ? null : 'DSI')}
                className={`btn-secondary ${
                  selectedGroup === 'DSI' && 'bg-kit-green text-white hover:bg-kit-green-600'
                }`}
              >
                DSI Papers
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

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-kit-green-600 to-kit-green rounded-2xl p-8 md:p-12 mt-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Make Your Research More Accessible?
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Join researchers from KIT's Institute for Information Systems in transforming how we share academic knowledge.
          </p>
          {!user && (
            <Link
              to="/auth"
              className="inline-flex items-center px-6 py-3 text-lg font-medium bg-white text-kit-green rounded-lg hover:bg-kit-green-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-kit-green transition-colors duration-200"
            >
              Create Your Account
            </Link>
          )}
          {user && (
            <Link
              to="/generate"
              className="inline-flex items-center px-6 py-3 text-lg font-medium bg-white text-kit-green rounded-lg hover:bg-kit-green-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-kit-green transition-colors duration-200"
            >
              Generate a Podcast
              <Sparkles className="ml-2 h-5 w-5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;