-- FIX: Storage upload RLS policy for site-media bucket

-- Drop existing policies
DROP POLICY IF EXISTS "Public can read site-media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to site-media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files in site-media" ON storage.objects;

-- Recreate with correct permissions
CREATE POLICY "Public can read site-media"
ON storage.objects FOR SELECT
USING (bucket_id = 'site-media');

CREATE POLICY "Authenticated users can upload to site-media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'site-media');

CREATE POLICY "Users can update own files in site-media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'site-media' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'site-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own files in site-media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'site-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Ensure bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-media', 'site-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- FIX: Sites table RLS (ensure users can insert their own sites)
-- Policies already exist, but let's ensure they're correct

-- Users can insert sites with their own user_id
DROP POLICY IF EXISTS "Users can insert own sites" ON public.sites;
CREATE POLICY "Users can insert own sites"
ON public.sites FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
