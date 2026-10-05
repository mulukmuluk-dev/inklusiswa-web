-- ====================================================================
-- INKLUSISWA - SCRIPT DISABLE ROW LEVEL SECURITY (RLS) SUPABASE
-- Salin seluruh isi skrip ini dan Jalankan (Run) di Supabase SQL Editor
-- URL SQL Editor: https://supabase.com/dashboard/project/ehyndleirfokwzmikwjq/sql/new
-- ====================================================================

-- 1. Matikan RLS di seluruh tabel publik agar Anon Key bisa melakukan INSERT/SELECT/UPDATE/DELETE
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_messages DISABLE ROW LEVEL SECURITY;

-- 2. Kebijakan Opsional: Izinkan Seluruh Akses Publik (Pembersihan Policy Lama)
DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Class rooms viewable by all authenticated users" ON public.class_rooms;
DROP POLICY IF EXISTS "Only teachers can insert/update class rooms" ON public.class_rooms;
DROP POLICY IF EXISTS "Materials viewable by room students and teachers" ON public.learning_materials;
DROP POLICY IF EXISTS "Only teachers can upload materials" ON public.learning_materials;
DROP POLICY IF EXISTS "Exams viewable by authenticated users" ON public.exams;
DROP POLICY IF EXISTS "Only teachers can create exams" ON public.exams;
DROP POLICY IF EXISTS "Students can insert their own exam submissions" ON public.exam_submissions;
DROP POLICY IF EXISTS "Submissions viewable by student or room teacher" ON public.exam_submissions;

-- 3. Konfirmasi Status RLS (Hasil harus menampilkan row_security = false)
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
