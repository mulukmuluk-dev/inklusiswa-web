-- ====================================================================
-- Buat storage bucket untuk file materi pembelajaran
-- Jalankan ini di Supabase SQL Editor
-- ====================================================================

-- 1. Buat bucket "learning-materials" yang bersifat publik
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'learning-materials',
  'learning-materials',
  true,
  52428800, -- 50MB max
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/msword', 'application/vnd.ms-powerpoint', 'text/plain']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Izinkan siapa saja mengupload ke bucket ini (untuk guru)
CREATE POLICY "Allow public uploads to learning-materials"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'learning-materials');

-- 3. Izinkan siapa saja membaca file dari bucket ini (untuk siswa)
CREATE POLICY "Allow public read access to learning-materials"
ON storage.objects FOR SELECT
USING (bucket_id = 'learning-materials');
