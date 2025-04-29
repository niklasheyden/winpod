export interface Podcast {
  id: string;
  title: string;
  abstract: string;
  authors: string;
  publishing_year: number;
  research_group: string;
  doi: string | null;
  keywords: string;
  cover_image_url: string;
  audio_url: string;
  script: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  name: string | null;
  affiliation: string | null;
  research_interests: string | null;
  updated_at: string;
}