/*
  # Add profiles storage bucket

  1. Changes
    - Create profiles bucket for storing user profile images
    - Set appropriate file size limits and MIME types
    - Add RLS policies for user profile image management

  2. Security
    - Enable RLS on storage.objects
    - Add policies for authenticated users to manage their profile images
*/

-- Create the profiles bucket if it doesn't exist
insert into storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
values (
  'profiles',
  'profiles',
  true, -- make bucket public
  false,
  5242880, -- 5MB file size limit
  array['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- Create policy to allow authenticated users to upload profile images
create policy "Users can upload profile images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'profiles' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Create policy to allow authenticated users to update their profile images
create policy "Users can update their profile images"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'profiles' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Create policy to allow public to read profile images
create policy "Public can read profile images"
  on storage.objects
  for select
  to public
  using (bucket_id = 'profiles');

-- Create policy to allow users to delete their profile images
create policy "Users can delete their profile images"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'profiles' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );