-- ====================================================================
-- INKLUSISWA - SUPABASE COMPLETE DATABASE SCHEMA & SECURITY POLICIES
-- Web Pendidikan Inklusif Bagi Penyandang Disabilitas (Safe Idempotent Script)
-- ====================================================================

-- 1. EXTENSIONS & ENUMS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum Peran Pengguna (Siswa vs Guru)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('siswa', 'guru');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enum Mode Aksesibilitas Disabilitas
DO $$ BEGIN
    CREATE TYPE accessibility_mode AS ENUM ('sensorik', 'fisik', 'intelektual', 'mental');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. TABEL PROFIL PENGGUNA (PROFILES)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'siswa',
    nip_or_nuptk TEXT,
    accessibility_config JSONB DEFAULT '{}'::jsonb,
    current_room_code VARCHAR(20),
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 3. TABEL ROOM KELAS (CLASS_ROOMS)
CREATE TABLE IF NOT EXISTS public.class_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL,
    class_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    teacher_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_class_rooms_code ON public.class_rooms(code);

-- 4. TABEL MATERI PEMBELAJARAN & STUDY CARDS (LEARNING_MATERIALS)
CREATE TABLE IF NOT EXISTS public.learning_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_code VARCHAR(20) REFERENCES public.class_rooms(code) ON DELETE CASCADE,
    title TEXT NOT NULL,
    summary TEXT,
    content TEXT NOT NULL,
    document_url TEXT,
    flashcards JSONB DEFAULT '[]'::jsonb,
    created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_materials_room_code ON public.learning_materials(room_code);

-- 5. TABEL LATIHAN SOAL / KUIS (QUIZZES)
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID REFERENCES public.learning_materials(id) ON DELETE CASCADE,
    room_code VARCHAR(20) REFERENCES public.class_rooms(code) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. TABEL PAKET UJIAN RESMI (EXAMS)
CREATE TABLE IF NOT EXISTS public.exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_code VARCHAR(20) REFERENCES public.class_rooms(code) ON DELETE CASCADE,
    title TEXT NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 45,
    questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exams_room_code ON public.exams(room_code);

-- 7. TABEL JAWABAN & HASIL UJIAN SISWA (EXAM_SUBMISSIONS)
CREATE TABLE IF NOT EXISTS public.exam_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    pg_answers JSONB DEFAULT '{}'::jsonb,
    essay_answers JSONB DEFAULT '{}'::jsonb,
    final_score NUMERIC(5,2),
    essay_grades JSONB DEFAULT '{}'::jsonb,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7b. TABEL JAWABAN & HASIL LATIHAN SOAL / KUIS SISWA (QUIZ_SUBMISSIONS)
CREATE TABLE IF NOT EXISTS public.quiz_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id TEXT NOT NULL,
    room_code VARCHAR(20) REFERENCES public.class_rooms(code) ON DELETE CASCADE,
    student_id TEXT NOT NULL,
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

-- 8. TABEL CHAT & PENGUMUMAN ROOM (ROOM_MESSAGES)
CREATE TABLE IF NOT EXISTS public.room_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_code VARCHAR(20) REFERENCES public.class_rooms(code) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    sender_name TEXT NOT NULL,
    sender_role user_role NOT NULL,
    message_text TEXT NOT NULL,
    is_announcement BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- AUTOMATIC TRIGGER FOR AUTH SYNC (Supabase Auth -> Public Profiles)
-- ====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        role,
        nip_or_nuptk,
        avatar_url
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Pengguna InkluSiswa'),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'siswa'::user_role),
        NEW.raw_user_meta_data->>'nip_or_nuptk',
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url;
    RETURN NEW;
EXCEPTION WHEN unique_violation THEN
    -- Abaikan error jika email bentrok (karena user pernah daftar manual)
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES (SAFE DROP IF EXISTS)
-- ====================================================================
-- ROW LEVEL SECURITY (RLS) DISABLED FOR FULL DEMO ACCESS
-- ====================================================================
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_messages DISABLE ROW LEVEL SECURITY;

-- 1. Profiles Policy
DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Public profiles are viewable by authenticated users" 
ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Class Rooms Policy
DROP POLICY IF EXISTS "Class rooms viewable by all authenticated users" ON public.class_rooms;
CREATE POLICY "Class rooms viewable by all authenticated users" 
ON public.class_rooms FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Only teachers can insert/update class rooms" ON public.class_rooms;
CREATE POLICY "Only teachers can insert/update class rooms" 
ON public.class_rooms FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'guru'
    )
);

-- 3. Learning Materials & Flashcards Policy
DROP POLICY IF EXISTS "Materials viewable by room students and teachers" ON public.learning_materials;
CREATE POLICY "Materials viewable by room students and teachers" 
ON public.learning_materials FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Only teachers can upload materials" ON public.learning_materials;
CREATE POLICY "Only teachers can upload materials" 
ON public.learning_materials FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'guru'
    )
);

-- 4. Exams & Submissions Policy
DROP POLICY IF EXISTS "Exams viewable by authenticated users" ON public.exams;
CREATE POLICY "Exams viewable by authenticated users" 
ON public.exams FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Only teachers can create exams" ON public.exams;
CREATE POLICY "Only teachers can create exams" 
ON public.exams FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'guru'
    )
);

DROP POLICY IF EXISTS "Students can insert their own exam submissions" ON public.exam_submissions;
CREATE POLICY "Students can insert their own exam submissions" 
ON public.exam_submissions FOR INSERT WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Submissions viewable by student or room teacher" ON public.exam_submissions;
CREATE POLICY "Submissions viewable by student or room teacher" 
ON public.exam_submissions FOR SELECT USING (
    auth.uid() = student_id OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'guru'
    )
);
