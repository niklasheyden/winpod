/*
  # Create podcasts table

  1. New Tables
    - `podcasts`
      - `id` (uuid, primary key)
      - `title` (text)
      - `abstract` (text)
      - `authors` (text)
      - `publishing_year` (integer)
      - `research_group` (text)
      - `doi` (text)
      - `field_of_research` (text)
      - `cover_image_url` (text)
      - `audio_url` (text)
      - `script` (text)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `podcasts` table
    - Add policies for:
      - Users can read all podcasts
      - Users can only create/update/delete their own podcasts
*/

CREATE TABLE IF NOT EXISTS podcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  abstract text NOT NULL,
  authors text NOT NULL,
  publishing_year integer NOT NULL,
  research_group text NOT NULL,
  doi text NOT NULL,
  field_of_research text NOT NULL,
  cover_image_url text NOT NULL,
  audio_url text NOT NULL,
  script text NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE podcasts ENABLE ROW LEVEL SECURITY;

-- Allow users to read all podcasts
CREATE POLICY "Anyone can view podcasts"
  ON podcasts
  FOR SELECT
  TO public
  USING (true);

-- Allow authenticated users to create their own podcasts
CREATE POLICY "Users can create their own podcasts"
  ON podcasts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own podcasts
CREATE POLICY "Users can update their own podcasts"
  ON podcasts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own podcasts
CREATE POLICY "Users can delete their own podcasts"
  ON podcasts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);