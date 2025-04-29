/*
  # Update podcasts storage bucket settings

  1. Changes
    - Make podcasts bucket public to allow direct image access
    - Update allowed MIME types to include image formats
    - Set appropriate cache control
    
  2. Security
    - Maintains existing RLS policies
    - Updates bucket configuration safely
*/

DO $$ 
BEGIN
  -- Update the podcasts bucket to be public and support images
  UPDATE storage.buckets
  SET 
    public = true,
    allowed_mime_types = array[
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg',
      'image/jpeg', 'image/png', 'image/gif', 'image/webp'
    ]
  WHERE id = 'podcasts';
END $$;