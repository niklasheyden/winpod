import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { User, Building2, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import type { Podcast, Profile } from '../lib/types';
import PodcastCard from '../components/PodcastCard';

const Profile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch profile data
  const { data: profile, isLoading: isLoadingProfile } = useQuery<Profile>({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('No user');
      
      try {
        // First try to fetch existing profile
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        // If no profile exists, create one
        if (!data && !error) {
          const newProfile: Omit<Profile, 'updated_at'> = {
            id: user.id,
            name: '',
            affiliation: '',
            research_interests: ''
          };

          const { data: createdProfile, error: createError } = await supabase
            .from('profiles')
            .insert([newProfile])
            .select()
            .single();

          if (createError) throw createError;
          return createdProfile;
        }

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error fetching/creating profile:', error);
        throw error;
      }
    },
    enabled: !!user
  });

  const [profileData, setProfileData] = useState<Omit<Profile, 'id' | 'updated_at'>>({
    name: '',
    affiliation: '',
    research_interests: ''
  });

  // Update local state when profile data is loaded
  React.useEffect(() => {
    if (profile) {
      setProfileData({
        name: profile.name || '',
        affiliation: profile.affiliation || '',
        research_interests: profile.research_interests || ''
      });
    }
  }, [profile]);

  const { data: userPodcasts, isLoading: isLoadingPodcasts } = useQuery<Podcast[]>({
    queryKey: ['user-podcasts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('podcasts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const handleSave = async () => {
    if (!user) return;

    try {
      setIsSaving(true);
      setSaveError(null);

      const { error } = await supabase
        .from('profiles')
        .update({
          name: profileData.name,
          affiliation: profileData.affiliation,
          research_interests: profileData.research_interests
        })
        .eq('id', user.id);

      if (error) throw error;

      // Invalidate profile query to refresh data
      queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kit-green"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex-1">
          {saveError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600">{saveError}</p>
            </div>
          )}

          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User className="inline h-4 w-4 mr-1" />
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={profileData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-kit-green"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Building2 className="inline h-4 w-4 mr-1" />
                  Affiliation
                </label>
                <input
                  type="text"
                  name="affiliation"
                  value={profileData.affiliation}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-kit-green"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <BookOpen className="inline h-4 w-4 mr-1" />
                  Research Interests
                </label>
                <textarea
                  name="research_interests"
                  value={profileData.research_interests}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-kit-green"
                />
              </div>
            </div>
          ) : (
            <div>
              <h1 className="text-2xl font-bold mb-2">{profileData.name || 'Anonymous User'}</h1>
              <p className="text-gray-600 mb-2 flex items-center">
                <Building2 className="h-4 w-4 mr-1" />
                {profileData.affiliation || 'No affiliation set'}
              </p>
              <p className="text-gray-600 flex items-center">
                <BookOpen className="h-4 w-4 mr-1" />
                {profileData.research_interests || 'No research interests set'}
              </p>
            </div>
          )}

          <div className="mt-4">
            <button
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              disabled={isSaving}
              className={`px-4 py-2 bg-kit-green text-white rounded-md hover:bg-kit-green-600 flex items-center ${
                isSaving ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSaving && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              )}
              {isEditing ? (isSaving ? 'Saving...' : 'Save Changes') : 'Edit Profile'}
            </button>
          </div>
        </div>
      </div>

      {/* User's Podcasts */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-6">My Podcasts</h2>

        {/* Loading State */}
        {isLoadingPodcasts && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kit-green mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your podcasts...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoadingPodcasts && (!userPodcasts || userPodcasts.length === 0) && (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">You haven't created any podcasts yet.</p>
            <Link
              to="/generate"
              className="inline-block px-4 py-2 bg-kit-green text-white rounded-md hover:bg-kit-green-600"
            >
              Create Your First Podcast
            </Link>
          </div>
        )}

        {/* Podcasts Grid */}
        {!isLoadingPodcasts && userPodcasts && userPodcasts.length > 0 && (
          <div className="grid md:grid-cols-2 gap-6">
            {userPodcasts.map(podcast => (
              <PodcastCard key={podcast.id} podcast={podcast} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;