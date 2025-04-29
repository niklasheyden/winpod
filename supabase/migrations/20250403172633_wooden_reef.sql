/*
  # Create podcasts storage bucket

  1. New Storage Bucket
    - Creates a private storage bucket named 'podcasts'
    - Sets appropriate security policies
  
  2. Security
    - Enables RLS
    - Adds policies for authenticated users to manage their own files
*/

-- Enable storage by creating the storage schema if it doesn't exist
create schema if not exists storage;

-- Create the podcasts bucket if it doesn't exist
insert into storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
values (
  'podcasts',
  'podcasts',
  false, -- private bucket
  false,
  52428800, -- 50MB file size limit
  array['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg']
)
on conflict (id) do nothing;

-- Create policy to allow authenticated users to upload files
create policy "Users can upload podcast files"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'podcasts' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Create policy to allow authenticated users to update their own files
create policy "Users can update their own podcast files"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'podcasts' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Create policy to allow authenticated users to read their own files
create policy "Users can read their own podcast files"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'podcasts' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Create policy to allow authenticated users to delete their own files
create policy "Users can delete their own podcast files"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'podcasts' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Create policy to allow public to read podcast files
create policy "Public can read podcast files"
  on storage.objects
  for select
  to public
  using (bucket_id = 'podcasts');