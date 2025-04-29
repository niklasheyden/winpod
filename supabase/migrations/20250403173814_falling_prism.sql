/*
  # Create storage bucket and policies

  1. Storage Setup
    - Creates storage schema if it doesn't exist
    - Creates 'podcasts' bucket with:
      - Private access
      - 50MB file size limit
      - Allowed audio MIME types

  2. Security Policies
    - Users can upload their own podcast files
    - Users can update their own podcast files
    - Users can read their own podcast files
    - Users can delete their own podcast files
    - Public can read all podcast files
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

-- Create policies if they don't exist using DO blocks
DO $$
BEGIN
    -- Upload policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Users can upload podcast files'
    ) THEN
        create policy "Users can upload podcast files"
            on storage.objects
            for insert
            to authenticated
            with check (
                bucket_id = 'podcasts' AND
                (storage.foldername(name))[1] = auth.uid()::text
            );
    END IF;

    -- Update policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Users can update their own podcast files'
    ) THEN
        create policy "Users can update their own podcast files"
            on storage.objects
            for update
            to authenticated
            using (
                bucket_id = 'podcasts' AND
                (storage.foldername(name))[1] = auth.uid()::text
            );
    END IF;

    -- Read policy for authenticated users
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Users can read their own podcast files'
    ) THEN
        create policy "Users can read their own podcast files"
            on storage.objects
            for select
            to authenticated
            using (
                bucket_id = 'podcasts' AND
                (storage.foldername(name))[1] = auth.uid()::text
            );
    END IF;

    -- Delete policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Users can delete their own podcast files'
    ) THEN
        create policy "Users can delete their own podcast files"
            on storage.objects
            for delete
            to authenticated
            using (
                bucket_id = 'podcasts' AND
                (storage.foldername(name))[1] = auth.uid()::text
            );
    END IF;

    -- Public read policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Public can read podcast files'
    ) THEN
        create policy "Public can read podcast files"
            on storage.objects
            for select
            to public
            using (bucket_id = 'podcasts');
    END IF;
END
$$;