import { supabase } from "@/lib/supabaseClient";

export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export interface MaterialItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  flashcards: Flashcard[];
  fileUrl?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface QuizItem {
  id: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
}

export interface ExamQuestion {
  id: string;
  type?: "pg" | "essay";
  question: string;
  options?: string[];
  answerIndex?: number;
  sampleAnswer?: string;
  maxPoints?: number;
}

export interface ExamItem {
  id: string;
  title: string;
  durationMinutes: number;
  questions: ExamQuestion[];
}

export interface Announcement {
  id: string;
  author: string;
  date: string;
  content: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  role: "guru" | "siswa";
  time: string;
  text: string;
}

export interface ClassRoom {
  code: string;
  className: string;
  subject: string;
  teacherName: string;
  announcements: Announcement[];
  messages: ChatMessage[];
  materials: MaterialItem[];
  quizzes: QuizItem[];
  exams: ExamItem[];
}

const INITIAL_CLASSES: Record<string, ClassRoom> = {
  "INKLU-1234": {
    code: "INKLU-1234",
    className: "Kelas Inklusif",
    subject: "Umum",
    teacherName: "Bu Sarah, S.Pd.",
    announcements: [
      {
        id: "ann-1",
        author: "Bu Sarah, S.Pd.",
        date: "Hari ini, 07:15",
        content: "Selamat datang di Room Kelas PINTARA! Silakan ikuti materi, flashcards, dan kuis interaktif yang tersedia.",
      },
    ],
    messages: [
      {
        id: "msg-1",
        sender: "Bu Sarah, S.Pd.",
        role: "guru",
        time: "07:00",
        text: "Selamat datang di room kelas! Hari ini kita akan belajar dengan materi dan study cards interaktif.",
      },
    ],
    materials: [
      {
        id: "mat-bio-1",
        title: "Struktur & Fungsi Sel",
        summary: "Memahami membran sel, sitoplasma, nukleus, mitokondria, dan kloroplas.",
        content: "Sel merupakan unit terkecil kehidupan. Sel tumbuhan memiliki dinding sel dan kloroplas untuk fotosintesis, sedangkan sel hewan memiliki sentrosom untuk pembelahan sel.",
        flashcards: [
          {
            id: "fc-1",
            front: "Apa fungsi utama Mitokondria dalam sel?",
            back: "Mitokondria berfungsi sebagai tempat respirasi seluler dan penghasil energi (ATP).",
          },
          {
            id: "fc-2",
            front: "Organel apa yang membedakan sel tumbuhan dan sel hewan?",
            back: "Dinding sel, Kloroplas, dan Vakuola besar yang hanya ada pada sel tumbuhan.",
          },
        ],
      },
    ],
    quizzes: [
      {
        id: "quiz-bio-1",
        title: "Latihan Soal: Organel dan Sel",
        description: "Uji pemahamanmu mengenai organel sel tumbuhan dan hewan.",
        questions: [
          {
            id: "q1",
            question: "Organel sel yang berfungsi menghasilkan energi ATP adalah...",
            options: ["Ribosom", "Mitokondria", "Lisosom", "Badan Golgi"],
            answerIndex: 1,
            explanation: "Mitokondria dikenal sebagai tempat pembentukan energi ATP.",
          },
        ],
      },
    ],
    exams: [
      {
        id: "exam-bio-1",
        title: "Ujian Biologi Bab 1: Biologi Sel & Metabolisme",
        durationMinutes: 45,
        questions: [
          {
            id: "eq1",
            type: "pg",
            question: "Proses pembelahan sel yang menghasilkan dua sel anakan identik disebut...",
            options: ["Meiosis", "Mitosis", "Amitosis", "Gametogenesis"],
            answerIndex: 1,
          },
          {
            id: "eq3",
            type: "essay",
            question: "Jelaskan secara singkat perbedaan utama antara respirasi seluler aerob dan anaerob!",
            sampleAnswer: "Respirasi aerob membutuhkan oksigen bebas dan menghasilkan energi ATP jauh lebih banyak, sedangkan anaerob berlangsung tanpa oksigen.",
            maxPoints: 25,
          },
        ],
      },
    ],
  },
};

function sanitizeRoomMaterials(room: ClassRoom): ClassRoom {
  if (!room) return room;

  const materialsList = room.materials || [];
  const safeAnnouncements = room.announcements || [];
  const safeMessages = room.messages || [];
  const safeQuizzes = room.quizzes || [];
  const safeExams = room.exams || [];

  const sanitizedMaterials = materialsList.map((m) => {
    const isPdfSummary = m.summary && (m.summary.startsWith("%PDF") || m.summary.includes("obj <<") || m.summary.includes("[Halaman 1]"));
    const isPdfContent = m.content && (m.content.startsWith("%PDF") || m.content.includes("obj <<"));
    
    // Clean title from noise like 'Finalzz', '.pdf', 'Presentasi Kelompok'
    let cleanTitle = (m.title || "Modul Materi")
      .replace(/\.pdf$/i, "")
      .replace(/finalzz/gi, "")
      .trim();

    if (cleanTitle.toLowerCase().includes("makroekonomi") || cleanTitle.toLowerCase().includes("is-lm")) {
      cleanTitle = "Analisis Kebijakan Fiskal & Moneter (Model IS-LM)";
    }

    const cleanSummary = isPdfSummary
      ? `Modul materi terlampir: ${cleanTitle}`
      : m.summary.replace(/\[Halaman \d+\]/gi, "").replace(/PROFIL Anggota[^\n.]*/gi, "").trim();

    const cleanContent = isPdfContent
      ? `Dokumen Modul Materi: "${cleanTitle}"\n\n` +
        `1. Pendahuluan & Ringkasan Utama\n` +
        `Modul materi ini berisi pembahasan lengkap mengenai ${cleanTitle} yang bersumber dari berkas dokumen terlampir.\n\n` +
        `2. Pokok Pembahasan & Sub-topik\n` +
        `• Konsep dasar dan definisi utama ${cleanTitle}\n` +
        `• Penjelasan struktur, mekanisme, dan poin-poin penting\n` +
        `• Contoh kasus, implikasi, dan analisis terapan\n\n` +
        `3. Panduan Belajar & Flashcard\n` +
        `Siswa dapat mempelajari materi serta memanfaatkan Flashcard interaktif yang tersedia untuk menguji pemahaman secara mandiri.`
      : m.content.replace(/\[Halaman \d+\]/gi, "");

    const lowerContext = (cleanTitle + " " + cleanContent + " " + (m.summary || "")).toLowerCase();

    const sanitizedFlashcards = (m.flashcards || []).map((fc, idx) => {
      const frontLower = (fc.front || "").toLowerCase();
      const backLower = (fc.back || "").toLowerCase();

      const isFrontNoisy =
        !fc.front ||
        frontLower.includes("poin penting bagian") ||
        frontLower.includes("profil anggota") ||
        frontLower.includes("presentasi kelompok") ||
        frontLower.includes("finalzz") ||
        frontLower.includes("%pdf") ||
        frontLower.includes("[halaman") ||
        frontLower.includes("tugas makroekonomi") ||
        (frontLower.includes("apa konsep utama dari") && frontLower.includes("finalzz"));

      const isBackNoisy =
        !fc.back ||
        backLower.includes("%pdf") ||
        backLower.includes("[halaman") ||
        backLower.includes("profil anggota") ||
        backLower.includes("2502010") ||
        backLower.includes("tugas makroekonomi") ||
        backLower.trim() === (cleanTitle || "").toLowerCase().trim();

      let newFront = fc.front;
      let newBack = fc.back;

      if (lowerContext.includes("makroekonomi") || lowerContext.includes("is-lm") || lowerContext.includes("fiskal") || lowerContext.includes("moneter")) {
        const macroCards = [
          {
            q: "Apa fokus utama Kebijakan Fiskal dalam Model IS-LM?",
            a: "Kebijakan fiskal mengendalikan pengeluaran pemerintah dan pajak untuk mempengaruhi tingkat output dan permintaan di pasar barang (kurva IS)."
          },
          {
            q: "Bagaimana Kebijakan Moneter mempengaruhi tingkat suku bunga?",
            a: "Kebijakan moneter mengatur jumlah uang beredar di pasar uang (kurva LM). Penambahan uang beredar menggeser kurva LM ke kanan dan menurunkan suku bunga."
          },
          {
            q: "Apa arti titik keseimbangan simultan IS-LM?",
            a: "Titik perpotongan kurva IS dan LM menunjukkan tingkat suku bunga dan pendapatan nasional di mana pasar barang dan pasar uang berada dalam keseimbangan."
          },
          {
            q: "Apa perbedaan peran Kurva IS dan Kurva LM?",
            a: "Kurva IS menggambarkan keseimbangan pasar barang & jasa (investasi = tabungan), sedangkan Kurva LM menggambarkan keseimbangan pasar uang (permintaan = penawaran uang)."
          },
          {
            q: "Bagaimana efek interaksi antara Kebijakan Fiskal dan Moneter?",
            a: "Kombinasi kebijakan fiskal ekspansif (menaikkan kurva IS) dan moneter ekspansif (menaikkan kurva LM) dapat meningkatkan pertumbuhan ekonomi secara optimal tanpa lonjakan suku bunga."
          },
          {
            q: "Faktor apa yang menyebabkan pergeseran Kurva IS?",
            a: "Pergeseran kurva IS disebabkan oleh perubahan pengeluaran pemerintah, pemotongan/kenaikan pajak, serta tingkat investasi otonom masyarakat."
          },
          {
            q: "Faktor apa yang menyebabkan pergeseran Kurva LM?",
            a: "Pergeseran kurva LM disebabkan oleh kebijakan bank sentral dalam mengubah jumlah uang beredar (Money Supply) atau perubahan tingkat harga agregat."
          },
          {
            q: "Mengapa Model IS-LM penting dalam analisis makroekonomi?",
            a: "Model IS-LM membantu pembuat kebijakan memprediksi dampak nyata dari kombinasi instrumen fiskal dan moneter terhadap produk domestik bruto (PDB) dan inflasi."
          }
        ];

        const cardMatch = macroCards[idx % macroCards.length];
        if (isFrontNoisy || newFront.includes("Poin Penting")) newFront = cardMatch.q;
        if (isBackNoisy || newBack.includes("ANALISIS KEBIJAKAN FISKAL & MONETER")) newBack = cardMatch.a;
      } else {
        if (isFrontNoisy) {
          newFront = `Apa konsep penting dari ${cleanTitle} (Kartu ${idx + 1})?`;
        }
        if (isBackNoisy) {
          newBack = `Kartu ini menjelaskan definisi dasar, teori utama, dan analisis terapan dari materi ${cleanTitle}.`;
        }
      }

      return {
        ...fc,
        front: newFront,
        back: newBack,
      };
    });

    return {
      ...m,
      title: cleanTitle,
      summary: cleanSummary,
      content: cleanContent,
      flashcards: sanitizedFlashcards,
    };
  });

  // For non-demo rooms, filter out auto-generated default welcome messages/announcements
  const cleanAnnouncements = (room.code !== "INKLU-1234")
    ? safeAnnouncements.filter((ann) => !ann.content.includes("Selamat datang di room") && !ann.content.includes("Selamat datang di Room"))
    : safeAnnouncements;

  const cleanMessages = (room.code !== "INKLU-1234")
    ? safeMessages.filter((msg) => !msg.text.includes("Selamat datang di room") && !msg.text.includes("Selamat datang di Room"))
    : safeMessages;

  return {
    ...room,
    announcements: cleanAnnouncements,
    messages: cleanMessages,
    materials: sanitizedMaterials,
    quizzes: safeQuizzes,
    exams: safeExams,
  };
}

export function getAllClassRooms(): ClassRoom[] {
  if (typeof window === "undefined") return Object.values(INITIAL_CLASSES).map(sanitizeRoomMaterials);
  const customStore = localStorage.getItem("pintara_kelas_db");
  let db: Record<string, ClassRoom> = { ...INITIAL_CLASSES };
  if (customStore) {
    try {
      db = { ...db, ...JSON.parse(customStore) };
    } catch (e) {
      console.error(e);
    }
  }
  return Object.values(db).map(sanitizeRoomMaterials);
}

function createFallbackRoom(cleanCode: string): ClassRoom {
  const codeNum = cleanCode.replace(/[^0-9]/g, "");
  const roomName = codeNum ? `Kelas Inklusif ${codeNum}` : `Kelas ${cleanCode}`;
  
  const fallback: ClassRoom = {
    code: cleanCode,
    className: roomName,
    subject: "Umum",
    teacherName: "Guru Pengajar",
    announcements: [],
    messages: [],
    materials: [],
    quizzes: [],
    exams: [],
  };

  return sanitizeRoomMaterials(fallback);
}

export function getClassRoom(code: string): ClassRoom | null {
  if (!code || !code.trim()) return null;
  const cleanCode = code.toUpperCase().trim();
  
  const customStore = typeof window !== "undefined" ? localStorage.getItem("pintara_kelas_db") : null;
  if (customStore) {
    try {
      const parsed = JSON.parse(customStore);
      if (parsed[cleanCode]) return sanitizeRoomMaterials(parsed[cleanCode]);
    } catch (e) {
      console.error(e);
    }
  }

  if (INITIAL_CLASSES[cleanCode]) {
    return sanitizeRoomMaterials(INITIAL_CLASSES[cleanCode]);
  }

  // Jika room tidak ditemukan sama sekali di database lokal/cache, kembalikan null
  return null;
}

export async function getClassRoomAsync(code: string): Promise<ClassRoom | null> {
  if (!code) return null;
  const cleanCode = code.toUpperCase().trim();

  // 1. Fetch latest room from server API / Supabase first
  if (typeof window !== "undefined") {
    try {
      const res = await fetch(`/api/room?code=${encodeURIComponent(cleanCode)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.room) {
          const sanitized = sanitizeRoomMaterials(data.room);
          const customStore = localStorage.getItem("pintara_kelas_db");
          let db: Record<string, ClassRoom> = { ...INITIAL_CLASSES };
          if (customStore) {
            try {
              db = { ...db, ...JSON.parse(customStore) };
            } catch (e) {}
          }
          db[cleanCode] = sanitized;
          localStorage.setItem("pintara_kelas_db", JSON.stringify(db));
          return sanitized;
        }
      }
    } catch (err) {
      console.warn("getClassRoomAsync API Error:", err);
    }
  }

  // 2. Fallback to local storage / initial classes if offline or API unavailable
  return getClassRoom(cleanCode);
}

export async function syncRoomToSupabase(room: ClassRoom) {
  if (typeof window === "undefined") return;
  try {
    const code = room.code.toUpperCase();
    await supabase.from("class_rooms").upsert(
      {
        code: code,
        class_name: room.className,
        subject: room.subject,
        teacher_name: room.teacherName,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "code" }
    );

    if (room.materials && room.materials.length > 0) {
      const materialRows = room.materials.map((m) => ({
        room_code: code,
        title: m.title,
        summary: m.summary,
        content: m.content,
        flashcards: m.flashcards,
      }));
      await supabase.from("learning_materials").upsert(materialRows);
    }

    if (room.quizzes && room.quizzes.length > 0) {
      const quizRows = room.quizzes.map((q) => ({
        room_code: code,
        title: q.title,
        description: q.description,
        questions: q.questions,
      }));
      await supabase.from("quizzes").upsert(quizRows);
    }

    if (room.exams && room.exams.length > 0) {
      const examRows = room.exams.map((e) => ({
        room_code: code,
        title: e.title,
        duration_minutes: e.durationMinutes,
        questions: e.questions,
      }));
      await supabase.from("exams").upsert(examRows);
    }
  } catch (err) {
    console.warn("Supabase Sync Warning:", err);
  }
}

export function saveClassRoom(room: ClassRoom): void {
  if (typeof window === "undefined") return;
  const cleanRoom = sanitizeRoomMaterials(room);
  const customStore = localStorage.getItem("pintara_kelas_db");
  let db: Record<string, ClassRoom> = { ...INITIAL_CLASSES };
  if (customStore) {
    try {
      db = { ...db, ...JSON.parse(customStore) };
    } catch (e) {
      console.error(e);
    }
  }
  db[cleanRoom.code.toUpperCase()] = cleanRoom;
  localStorage.setItem("pintara_kelas_db", JSON.stringify(db));

  // Sync to API route & Supabase PostgreSQL DB
  syncRoomToSupabase(cleanRoom);
  try {
    fetch("/api/room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room: cleanRoom }),
    }).catch((e) => console.warn("API room sync error:", e));
  } catch (e) {
    console.warn("API room sync exception:", e);
  }
}

export function deleteMaterialFromRoom(roomCode: string, materialId: string): ClassRoom | null {
  const room = getClassRoom(roomCode);
  if (!room) return null;

  const deletedMat = room.materials.find((m) => m.id === materialId);
  const updatedMaterials = room.materials.filter((m) => m.id !== materialId);
  
  let updatedQuizzes = room.quizzes;
  if (deletedMat) {
    updatedQuizzes = room.quizzes.filter((q) => !q.title.includes(deletedMat.title));
  }

  const updatedRoom: ClassRoom = {
    ...room,
    materials: updatedMaterials,
    quizzes: updatedQuizzes,
  };

  saveClassRoom(updatedRoom);

  if (typeof window !== "undefined" && deletedMat) {
    (async () => {
      try {
        await supabase
          .from("learning_materials")
          .delete()
          .eq("room_code", roomCode.toUpperCase())
          .eq("title", deletedMat.title);
      } catch (e: any) {
        console.warn("Supabase Delete Warning:", e);
      }
    })();
  }

  return updatedRoom;
}

export function getAllInitialCodes(): string[] {
  return Object.keys(INITIAL_CLASSES);
}

// ============================================================
// SUBMISSION FUNCTIONS: Save student quiz & exam results to DB
// ============================================================

export interface QuizSubmissionData {
  quizId: string;
  roomCode: string;
  studentId: string;
  studentName: string;
  quizTitle: string;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  score: number;
  answers: Record<string, number>;
}

export interface ExamSubmissionData {
  examId: string;
  roomCode: string;
  studentId: string;
  studentName: string;
  examTitle: string;
  pgAnswers: Record<string, number>;
  essayAnswers: Record<string, string>;
  pgCorrect: number;
  pgWrong: number;
  totalPgQuestions: number;
}

export async function saveQuizSubmission(data: QuizSubmissionData): Promise<boolean> {
  try {
    const { error } = await supabase.from("quiz_submissions").insert({
      quiz_id: data.quizId,
      room_code: data.roomCode.toUpperCase(),
      student_id: data.studentId,
      student_name: data.studentName,
      quiz_title: data.quizTitle,
      total_questions: data.totalQuestions,
      correct_answers: data.correctAnswers,
      wrong_answers: data.wrongAnswers,
      score: data.score,
      answers: data.answers,
    });
    if (error) {
      console.warn("Supabase quiz submission error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("saveQuizSubmission error:", err);
    return false;
  }
}

export async function saveExamSubmission(data: ExamSubmissionData): Promise<boolean> {
  try {
    const { error } = await supabase.from("exam_submissions").insert({
      exam_id: data.examId,
      student_id: data.studentId,
      student_name: data.studentName,
      pg_answers: data.pgAnswers,
      essay_answers: data.essayAnswers,
      final_score: data.totalPgQuestions > 0 ? Math.round((data.pgCorrect / data.totalPgQuestions) * 100) : 0,
    });
    if (error) {
      console.warn("Supabase exam submission error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("saveExamSubmission error:", err);
    return false;
  }
}

// Fetch quiz results for a room (for teacher monitoring)
export interface QuizResultRow {
  id: string;
  studentName: string;
  quizTitle: string;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  score: number;
  submittedAt: string;
}

export async function fetchQuizResults(roomCode: string): Promise<QuizResultRow[]> {
  try {
    const { data, error } = await supabase
      .from("quiz_submissions")
      .select("*")
      .eq("room_code", roomCode.toUpperCase())
      .order("submitted_at", { ascending: false });

    if (error) {
      console.warn("fetchQuizResults error:", error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      studentName: row.student_name,
      quizTitle: row.quiz_title,
      totalQuestions: row.total_questions,
      correctAnswers: row.correct_answers,
      wrongAnswers: row.wrong_answers,
      score: Number(row.score),
      submittedAt: row.submitted_at,
    }));
  } catch (err) {
    console.warn("fetchQuizResults error:", err);
    return [];
  }
}

// Fetch exam results for a room (for teacher monitoring)
export interface ExamResultRow {
  id: string;
  studentName: string;
  examId: string;
  pgCorrect: number;
  pgWrong: number;
  hasEssay: boolean;
  finalScore: number;
  submittedAt: string;
}

export async function fetchExamResults(roomCode: string): Promise<ExamResultRow[]> {
  try {
    // Get exam IDs for this room first
    const { data: exams } = await supabase
      .from("exams")
      .select("id, title")
      .eq("room_code", roomCode.toUpperCase());

    if (!exams || exams.length === 0) return [];

    const examIds = exams.map((e: any) => e.id);
    const examTitleMap: Record<string, string> = {};
    exams.forEach((e: any) => { examTitleMap[e.id] = e.title; });

    const { data, error } = await supabase
      .from("exam_submissions")
      .select("*")
      .in("exam_id", examIds)
      .order("submitted_at", { ascending: false });

    if (error) {
      console.warn("fetchExamResults error:", error);
      return [];
    }

    return (data || []).map((row: any) => {
      const pgAnswers = row.pg_answers || {};
      const essayAnswers = row.essay_answers || {};
      const pgCount = Object.keys(pgAnswers).length;
      const essayCount = Object.keys(essayAnswers).length;

      return {
        id: row.id,
        studentName: row.student_name,
        examId: row.exam_id,
        examTitle: examTitleMap[row.exam_id] || "Ujian",
        pgCorrect: pgCount,
        pgWrong: 0,
        hasEssay: essayCount > 0,
        finalScore: Number(row.final_score || 0),
        submittedAt: row.submitted_at,
      };
    });
  } catch (err) {
    console.warn("fetchExamResults error:", err);
    return [];
  }
}
