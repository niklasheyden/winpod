/*
  # Update podcasts table fields

  1. Changes
    - Make DOI field nullable
    - Rename field_of_research to keywords
    
  2. Security
    - Maintains existing RLS policies
*/

DO $$ 
BEGIN
  -- Make DOI nullable
  ALTER TABLE podcasts 
  ALTER COLUMN doi DROP NOT NULL;

  -- Rename field_of_research to keywords
  ALTER TABLE podcasts 
  RENAME COLUMN field_of_research TO keywords;
END $$;