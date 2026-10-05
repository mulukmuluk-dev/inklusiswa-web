-- ====================================================================
-- FIX 1: Hapus FK constraint pada profiles.id -> auth.users(id)
-- agar profiles bisa di-insert secara mandiri
-- ====================================================================
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Tambah unique constraint pada email agar bisa upsert berdasarkan email
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_email_key;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);

-- ====================================================================
-- FIX 2: Buat tabel quiz_submissions untuk menyimpan hasil latihan soal
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.quiz_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id TEXT NOT NULL,
    room_code VARCHAR(20),
    student_id UUID, -- Diganti menjadi UUID agar seragam dengan profiles.id
    student_name TEXT NOT NULL,
    quiz_title TEXT NOT NULL,
    total_questions INT NOT NULL DEFAULT 0,
    correct_answers INT NOT NULL DEFAULT 0,
    wrong_answers INT NOT NULL DEFAULT 0,
    score NUMERIC(5,2) NOT NULL DEFAULT 0,
    answers JSONB DEFAULT '{}'::jsonb,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_submissions_room ON public.quiz_submissions(room_code);
ALTER TABLE public.quiz_submissions DISABLE ROW LEVEL SECURITY;

-- ====================================================================
-- FIX 3: Pastikan exam_submissions punya relasi yang longgar (Hapus FK ke profiles jika ada error, Opsional)
-- ====================================================================
ALTER TABLE public.exam_submissions DROP CONSTRAINT IF EXISTS exam_submissions_student_id_fkey;
ALTER TABLE public.exam_submissions DROP CONSTRAINT IF EXISTS exam_submissions_exam_id_fkey;
