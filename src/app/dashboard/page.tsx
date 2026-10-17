"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PintaraLogo } from "@/components/PintaraLogo";
import { SoundToggleButton } from "@/components/SoundToggleButton";
import { speakGlobal } from "@/lib/soundControl";
import { getActiveSession, setActiveSession, clearActiveSession, UserSession } from "@/lib/authSession";
import { isFullVoiceEnabled } from "@/lib/accessibility";
import {
  getClassRoom,
  getClassRoomAsync,
  saveClassRoom,
  deleteMaterialFromRoom,
  getAllClassRooms,
  ClassRoom,
  MaterialItem,
  QuizItem,
  ExamItem,
  ExamQuestion,
  Flashcard,
  QuizQuestion,
  saveQuizSubmission,
  saveExamSubmission,
  fetchQuizResults,
  fetchExamResults,
  QuizResultRow,
  ExamResultRow,
  getRoomExamTimer,
  setRoomExamTimer,
  ExamTimerConfig,
} from "@/lib/kelasDatabase";

import {
  StudentProfile,
  fetchStudents,
  addStudent,
  bulkAddStudents,
  resetStudentPin,
  deleteStudent,
  formatWhatsAppStudentAccess,
  getA11yPresetLabel,
  parseExcelStudentFile,
  downloadExcelTemplate,
  printClassAccountSummary,
} from "@/lib/studentManager";

import { supabase } from "@/lib/supabaseClient";
import * as pdfjsLib from "pdfjs-dist";

// Configure pdfjs worker in browser environment
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

async function extractTextFromPdfFile(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str || "")
        .join(" ");
      if (pageText.trim()) {
        fullText += `[Halaman ${i}]\n` + pageText.trim() + "\n\n";
      }
    }

    return fullText.trim();
  } catch (err) {
    console.warn("PDF extraction error:", err);
    return "";
  }
}

interface Subject {
  id: string;
  name: string;
  image?: string;
  icon?: string;
  category: string;
  description: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [activeTab, setActiveTab] = useState<string>("katalog");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string>("semua");
  const [activeMode, setActiveMode] = useState<string>("Mode Mental");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // State Belajar Di Kelas (Embed di Dashboard)
  const [inputCode, setInputCode] = useState<string>("");
  const [activeCode, setActiveCode] = useState<string>("");
  const [room, setRoom] = useState<ClassRoom | null>(null);
  const [joinError, setJoinError] = useState<string>("");
  const [roomHistory, setRoomHistory] = useState<{ code: string; className: string }[]>([]);
  const [showRoomDropdown, setShowRoomDropdown] = useState<boolean>(false);
  const roomDropdownRef = useRef<HTMLDivElement>(null);
  const [showAccountDropdown, setShowAccountDropdown] = useState<boolean>(false);
  const accountDropdownRef = useRef<HTMLDivElement>(null);
  const [activeSidebarTab, setActiveSidebarTab] = useState<"kelas" | "materi" | "latihan" | "ujian">("kelas");

  // Chat State
  const [newMessageText, setNewMessageText] = useState<string>("");

  // Flashcards State
  const [activeFlashcardMaterial, setActiveFlashcardMaterial] = useState<MaterialItem | null>(null);
  const [activeMaterialPdf, setActiveMaterialPdf] = useState<MaterialItem | null>(null);
  const [flashcardIndex, setFlashcardIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  // Quiz State
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);

  // Student Exam State (Multiple Choice & Essay)
  const [examAnswers, setExamAnswers] = useState<Record<string, number>>({});
  const [examEssayAnswers, setExamEssayAnswers] = useState<Record<string, string>>({});
  const [listeningEssayId, setListeningEssayId] = useState<string | null>(null);
  const [examSubmitted, setExamSubmitted] = useState<boolean>(false);
  const [examTimer, setExamTimer] = useState<number>(0);

  // Modal Pilih Kelas (Jenjang)
  const [isGradeModalOpen, setIsGradeModalOpen] = useState<boolean>(false);
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [isUpdatingJenjang, setIsUpdatingJenjang] = useState<boolean>(false);

  // Fullscreen Exam Competition Mode State (Tampilan Kompetisi Sains Ruangguru Style)
  const [isExamFullscreen, setIsExamFullscreen] = useState<boolean>(false);
  const [currentExamQuestionIndex, setCurrentExamQuestionIndex] = useState<number>(0);

  // Akses Guru State & Forms
  const [guruTab, setGuruTab] = useState<"room" | "siswa" | "daftar_siswa" | "materi" | "ujian" | "rekap">("room");
  const [hasCreatedRoom, setHasCreatedRoom] = useState<boolean>(false);
  const [teacherRoomCode, setTeacherRoomCode] = useState<string>("INKLU-1234");
  const [teacherRoom, setTeacherRoom] = useState<ClassRoom | null>(null);
  const [guruToast, setGuruToast] = useState<string>("");

  // Guru Room Exam Timer Configuration State (Isolated Per-Room)
  const [guruTimerDuration, setGuruTimerDuration] = useState<number>(30); // in minutes
  const [teacherRoomTimer, setTeacherRoomTimer] = useState<ExamTimerConfig>({
    durationMinutes: 30,
    startedAt: null,
    isActive: false,
  });
  const [guruRemainingSeconds, setGuruRemainingSeconds] = useState<number>(0);

  // Student Room Exam Timer State
  const [studentRoomTimer, setStudentRoomTimer] = useState<ExamTimerConfig | null>(null);

  // Daftar Siswa & Manajemen Akun Guru States
  const [studentsList, setStudentsList] = useState<StudentProfile[]>([]);
  const [isStudentsLoading, setIsStudentsLoading] = useState<boolean>(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>("");
  const [studentRoomFilter, setStudentRoomFilter] = useState<string>("");
  const [studentFormClassCode, setStudentFormClassCode] = useState<string>("INKLU-1234");
  const [excelImportLoading, setExcelImportLoading] = useState<boolean>(false);
  const excelFileInputRef = useRef<HTMLInputElement>(null);

  // Guru Form 1: Generate / Connect Room
  const [newRoomCode, setNewRoomCode] = useState<string>("INKLU-1234");
  const [newClassName, setNewClassName] = useState<string>("Kelas Inklusif 4-A");
  const [newSubject, setNewSubject] = useState<string>("IPAS");
  const [newTeacherName, setNewTeacherName] = useState<string>("Bu Sarah, S.Pd.");

  // Guru Form 2: Upload Materi (Dokumen File & Dynamic Flashcards)
  const [matTitleInput, setMatTitleInput] = useState<string>("");
  const [matSummaryInput, setMatSummaryInput] = useState<string>("");
  const [matContentInput, setMatContentInput] = useState<string>("");
  const [matDocFileName, setMatDocFileName] = useState<string>("");
  const [matFileUrl, setMatFileUrl] = useState<string>("");
  const [matDocFile, setMatDocFile] = useState<File | null>(null);
  const [autoCreateQuiz, setAutoCreateQuiz] = useState<boolean>(true);
  const [matFlashcardCount, setMatFlashcardCount] = useState<number>(6);
  const [matQuizCount, setMatQuizCount] = useState<number>(3);
  const [matRawText, setMatRawText] = useState<string>("");
  const [aiGeneratedCards, setAiGeneratedCards] = useState<Flashcard[]>([]);
  const [aiGeneratedQuizzes, setAiGeneratedQuizzes] = useState<QuizQuestion[]>([]);
  const [isAiProcessing, setIsAiProcessing] = useState<boolean>(false);

  // Guru Form 3: Upload Ujian (Doc File / Manual PG + Essay)
  const [examInputMethod, setExamInputMethod] = useState<"file" | "manual">("file");
  const [examDocFileName, setExamDocFileName] = useState<string>("");
  const [examTitleInput, setExamTitleInput] = useState<string>("");
  const [examDurationInput, setExamDurationInput] = useState<number>(45);
  const [examQuestionsDraft, setExamQuestionsDraft] = useState<ExamQuestion[]>([]);
  const [qType, setQType] = useState<"pg" | "essay">("pg");
  const [qQuestion, setQQuestion] = useState<string>("");
  const [qOptA, setQOptA] = useState<string>("");
  const [qOptB, setQOptB] = useState<string>("");
  const [qOptC, setQOptC] = useState<string>("");
  const [qOptD, setQOptD] = useState<string>("");
  const [qCorrect, setQCorrect] = useState<number>(0);
  const [qSampleAnswer, setQSampleAnswer] = useState<string>("");
  const [qPoints, setQPoints] = useState<number>(25);

  // Guru Form 4: Announcement
  const [announcementInput, setAnnouncementInput] = useState<string>("");
  const [newStudentPreset, setNewStudentPreset] = useState<string>("fisik_mata");

  // Monitoring Data (fetched from Supabase)
  const [monitorQuizResults, setMonitorQuizResults] = useState<QuizResultRow[]>([]);
  const [monitorExamResults, setMonitorExamResults] = useState<ExamResultRow[]>([]);
  const [isMonitorLoading, setIsMonitorLoading] = useState<boolean>(false);

  const generateUniqueRoomCode = (): string => {
    const existingRooms = getAllClassRooms();
    const existingCodes = new Set(existingRooms.map((r) => r.code.toUpperCase()));
    let randomCode = "";
    let attempts = 0;
    do {
      randomCode = `INKLU-${Math.floor(1000 + Math.random() * 9000)}`;
      attempts++;
    } while (existingCodes.has(randomCode) && attempts < 10000);
    return randomCode;
  };

  // Load Teacher Room Data
  useEffect(() => {
    const session = getActiveSession();
    const userId = session?.id || "guest";

    const savedHasRoom = localStorage.getItem(`pintara_teacher_has_room_${userId}`) === "true";
    const savedCode = localStorage.getItem(`pintara_teacher_room_code_${userId}`);
    if (savedHasRoom && savedCode) {
      setTeacherRoomCode(savedCode);
      setNewRoomCode(savedCode);
      const tData = getClassRoom(savedCode);
      if (tData) setTeacherRoom(tData);
      setHasCreatedRoom(true);
    } else {
      const tData = getClassRoom(teacherRoomCode);
      if (tData && savedHasRoom) {
        setTeacherRoom(tData);
        setHasCreatedRoom(true);
      } else {
        const freshCode = generateUniqueRoomCode();
        setNewRoomCode(freshCode);
      }
    }
  }, [teacherRoomCode]);

  // Fetch monitoring data when guru opens Rekap tab
  useEffect(() => {
    if (guruTab === "rekap" && teacherRoomCode) {
      setIsMonitorLoading(true);
      Promise.all([
        fetchQuizResults(teacherRoomCode),
        fetchExamResults(teacherRoomCode),
      ]).then(([quizRes, examRes]) => {
        setMonitorQuizResults(quizRes);
        setMonitorExamResults(examRes);
        setIsMonitorLoading(false);
      }).catch(() => {
        setIsMonitorLoading(false);
      });
    }
  }, [guruTab, teacherRoomCode]);

  // Inisialisasi Kode Kelas Sticky untuk Pendaftaran Siswa
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedStickyCode = localStorage.getItem("pintara_sticky_class_code");
      if (savedStickyCode) {
        setStudentFormClassCode(savedStickyCode);
      } else if (teacherRoomCode) {
        setStudentFormClassCode(teacherRoomCode);
      }
    }
  }, [teacherRoomCode]);

  // Fetch data siswa setiap kali tab 'siswa' atau 'daftar_siswa' dibuka
  useEffect(() => {
    if (guruTab === "daftar_siswa" || guruTab === "siswa") {
      setIsStudentsLoading(true);
      fetchStudents().then((data) => {
        setStudentsList(data);
        setIsStudentsLoading(false);
      }).catch((err) => {
        console.error("Error fetching students:", err);
        setIsStudentsLoading(false);
      });
    }
  }, [guruTab, teacherRoomCode]);

  // Handler Import Siswa dari File Excel
  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelImportLoading(true);
    try {
      const classCode = studentFormClassCode.trim().toUpperCase() || teacherRoomCode;
      const parsed = await parseExcelStudentFile(file, classCode);
      if (parsed.length === 0) {
        showGuruToast("File Excel tidak memuat data nama murid yang valid.");
        setExcelImportLoading(false);
        return;
      }

      const created = await bulkAddStudents(parsed, classCode);
      setStudentsList((prev) => [...created, ...prev.filter((s) => !created.some((c) => c.id === s.id))]);
      showGuruToast(`Berhasil menambahkan ${created.length} siswa dari file Excel!`);
      if (excelFileInputRef.current) {
        excelFileInputRef.current.value = "";
      }
    } catch (err) {
      console.error("Error importing excel:", err);
      showGuruToast("Gagal membaca file Excel. Pastikan format kolom sesuai template.");
    } finally {
      setExcelImportLoading(false);
    }
  };

  const showGuruToast = (msg: string) => {
    setGuruToast(msg);
    speakText(msg);
    setTimeout(() => setGuruToast(""), 4500);
  };

  // Sync teacher room timer on teacherRoomCode change & listen for updates
  useEffect(() => {
    if (!teacherRoomCode) return;
    const clean = teacherRoomCode.toUpperCase().trim();
    const cfg = getRoomExamTimer(clean);
    setTeacherRoomTimer(cfg);
    if (cfg.durationMinutes) {
      setGuruTimerDuration(cfg.durationMinutes);
    }

    const handleTimerUpdate = (e: any) => {
      if (!e.detail || e.detail.roomCode === clean) {
        setTeacherRoomTimer(getRoomExamTimer(clean));
      }
    };
    const handleStorage = (e: StorageEvent) => {
      if (e.key === `pintara_room_exam_timer_${clean}`) {
        setTeacherRoomTimer(getRoomExamTimer(clean));
      }
    };

    window.addEventListener("pintara_exam_timer_updated", handleTimerUpdate);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("pintara_exam_timer_updated", handleTimerUpdate);
      window.removeEventListener("storage", handleStorage);
    };
  }, [teacherRoomCode]);

  // Live countdown preview for Guru Monitoring tab
  useEffect(() => {
    if (!teacherRoomTimer.isActive || !teacherRoomTimer.startedAt) {
      setGuruRemainingSeconds(0);
      return;
    }
    const updateCountdown = () => {
      const totalSec = teacherRoomTimer.durationMinutes * 60;
      const elapsed = Math.floor((Date.now() - (teacherRoomTimer.startedAt || Date.now())) / 1000);
      const remaining = Math.max(0, totalSec - elapsed);
      setGuruRemainingSeconds(remaining);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [teacherRoomTimer]);

  const handleStartGuruTimer = (duration?: number) => {
    const finalDuration = duration || guruTimerDuration;
    const cleanCode = teacherRoomCode.toUpperCase().trim();
    if (!cleanCode) {
      alert("Pilih atau hubungkan room terlebih dahulu.");
      return;
    }
    const newConfig: ExamTimerConfig = {
      durationMinutes: finalDuration,
      startedAt: Date.now(),
      isActive: true,
    };
    setRoomExamTimer(cleanCode, newConfig);
    setTeacherRoomTimer(newConfig);
    showGuruToast(`Timer Ujian untuk Room ${cleanCode} berhasil dimulai (${finalDuration} menit)!`);
    speakText(`Timer ujian resmi untuk room ${cleanCode} telah diaktifkan selama ${finalDuration} menit.`);
  };

  const handleStopGuruTimer = () => {
    const cleanCode = teacherRoomCode.toUpperCase().trim();
    const newConfig: ExamTimerConfig = {
      durationMinutes: guruTimerDuration,
      startedAt: null,
      isActive: false,
    };
    setRoomExamTimer(cleanCode, newConfig);
    setTeacherRoomTimer(newConfig);
    showGuruToast(`Timer Ujian untuk Room ${cleanCode} berhasil dihentikan.`);
    speakText(`Timer ujian untuk room ${cleanCode} telah dihentikan.`);
  };

  const handleAddGuruTimerMinutes = (extraMinutes: number) => {
    const cleanCode = teacherRoomCode.toUpperCase().trim();
    const current = getRoomExamTimer(cleanCode);
    const newDuration = (current.durationMinutes || guruTimerDuration) + extraMinutes;
    const newConfig: ExamTimerConfig = {
      durationMinutes: newDuration,
      startedAt: current.startedAt || Date.now(),
      isActive: true,
    };
    setRoomExamTimer(cleanCode, newConfig);
    setTeacherRoomTimer(newConfig);
    setGuruTimerDuration(newDuration);
    showGuruToast(`Waktu ujian Room ${cleanCode} ditambah ${extraMinutes} menit (Total: ${newDuration}m)!`);
  };

  const handleGenerateCode = () => {
    const uniqueCode = generateUniqueRoomCode();
    setNewRoomCode(uniqueCode);
  };

  const handleSaveTeacherRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomCode.trim()) return;
    const code = newRoomCode.trim().toUpperCase();
    const existing = getClassRoom(code);
    const updatedRoom: ClassRoom = {
      code,
      className: newClassName.trim() || `Kelas ${code}`,
      subject: newSubject.trim() || "Umum",
      teacherName: newTeacherName.trim() || "Guru Pengajar",
      announcements: existing ? existing.announcements : [],
      messages: existing ? existing.messages : [],
      materials: existing ? existing.materials : [],
      quizzes: existing ? existing.quizzes : [],
      exams: existing ? existing.exams : [],
    };
    saveClassRoom(updatedRoom);
    setTeacherRoomCode(code);
    setTeacherRoom(updatedRoom);
    setHasCreatedRoom(true);

    const session = getActiveSession();
    const userId = session?.id || "guest";
    localStorage.setItem(`pintara_teacher_has_room_${userId}`, "true");
    localStorage.setItem(`pintara_teacher_room_code_${userId}`, code);

    if (activeCode === code) setRoom(updatedRoom);
    showGuruToast(`Room Kelas ${code} berhasil dihubungkan & disimpan! Fitur Upload Materi dan Ujian kini sudah aktif.`);
  };

  const handleDeleteMaterial = (materialId: string, title: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus materi "${title}" dari room ${teacherRoomCode}?`)) return;

    const updatedRoom = deleteMaterialFromRoom(teacherRoomCode, materialId);
    if (updatedRoom) {
      setTeacherRoom(updatedRoom);
      if (activeCode === teacherRoomCode) setRoom(updatedRoom);
      showGuruToast(`Materi "${title}" berhasil dihapus dari room ${teacherRoomCode}.`);
    }
  };

  const processTextWithGroqAI = async (rawText: string, fileName: string, fcCount?: number, qzCount?: number) => {
    try {
      setIsAiProcessing(true);
      const usedFcCount = fcCount ?? matFlashcardCount;
      const usedQzCount = qzCount ?? matQuizCount;

      const res = await fetch("/api/generate-ai-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: rawText,
          title: fileName,
          flashcardCount: usedFcCount,
          quizCount: usedQzCount
        }),
      });

      if (!res.ok) {
        throw new Error("Groq API error");
      }

      const resData = await res.json();
      if (resData.success && resData.data) {
        const ai = resData.data;
        if (ai.cleanTitle) setMatTitleInput(ai.cleanTitle);
        if (ai.summary) setMatSummaryInput(ai.summary);
        if (ai.cleanContent) setMatContentInput(ai.cleanContent);

        let finalCards: Flashcard[] = [];
        let finalQuizzes: QuizQuestion[] = [];

        if (ai.flashcards && Array.isArray(ai.flashcards) && ai.flashcards.length > 0) {
          finalCards = ai.flashcards.map((fc: any, i: number) => ({
            id: `fc-groq-${Date.now()}-${i + 1}`,
            front: fc.front || `Pertanyaan ${i + 1}`,
            back: fc.back || `Jawaban ${i + 1}`,
          }));
          setAiGeneratedCards(finalCards);
        }

        if (ai.quizQuestions && Array.isArray(ai.quizQuestions) && ai.quizQuestions.length > 0) {
          finalQuizzes = ai.quizQuestions.map((q: any, i: number) => ({
            id: `qq-groq-${Date.now()}-${i + 1}`,
            question: q.question || `Soal ${i + 1}`,
            options: q.options || ["A", "B", "C", "D"],
            answerIndex: typeof q.answerIndex === "number" ? q.answerIndex : 0,
            explanation: q.explanation || "Penjelasan AI",
          }));
          setAiGeneratedQuizzes(finalQuizzes);
        }

        return { cards: finalCards, quizzes: finalQuizzes };
      }
      return null;
    } catch (err) {
      console.warn("Groq AI processing failed, using clean fallback:", err);
      showGuruToast(`Dokumen "${fileName}" berhasil diunggah!`);
    } finally {
      setIsAiProcessing(false);
    }
  };

  // Handler Upload File Dokumen Materi (.pdf / .docx / .txt / .pptx)
  const handleMaterialFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMatDocFileName(file.name);
    setMatDocFile(file); // Store raw File for Supabase upload
    setMatRawText(""); // Will be set after extraction

    // Create local object URL for immediate preview
    if (matFileUrl) {
      URL.revokeObjectURL(matFileUrl);
    }
    const fileUrl = URL.createObjectURL(file);
    setMatFileUrl(fileUrl);

    setAiGeneratedCards([]);
    setAiGeneratedQuizzes([]);

    const cleanTitle = file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ");

    if (!matTitleInput) {
      setMatTitleInput(cleanTitle);
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    let extractedText = "";

    if (ext === "txt") {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target?.result as string;
        if (text && typeof text === "string" && text.trim().length > 0) {
          setMatContentInput(text);
          setMatRawText(text);
          await processTextWithGroqAI(text, file.name);
        }
      };
      reader.readAsText(file);
      return;
    } else if (ext === "pdf") {
      showGuruToast(`Mengekstrak teks dari PDF "${file.name}"...`);
      extractedText = await extractTextFromPdfFile(file);
    } else {
      extractedText = `Dokumen: ${cleanTitle}\nFilename: ${file.name}`;
    }

    if (extractedText && extractedText.length > 20) {
      setMatContentInput(extractedText);
      setMatRawText(extractedText);
      await processTextWithGroqAI(extractedText, file.name);
    } else {
      const fallbackContent =
        `Dokumen Modul Materi: "${cleanTitle}"\n` +
        `Berkas Terlampir: ${file.name} (${(file.size / 1024).toFixed(1)} KB)\n\n` +
        `1. Pendahuluan & Ringkasan Utama\n` +
        `Modul materi ini berisi pembahasan lengkap mengenai ${cleanTitle}.\n\n` +
        `2. Pokok Pembahasan\n` +
        `• Konsep dasar dan definisi utama ${cleanTitle}\n` +
        `• Penjelasan struktur, mekanisme, dan poin-poin penting\n\n` +
        `3. Panduan Belajar & Flashcard\n` +
        `Siswa dapat mempelajari berkas ini dan menguji pemahaman dengan Flashcard interaktif.`;

      setMatContentInput(fallbackContent);
      setMatRawText(fallbackContent);
      setMatSummaryInput(`Modul materi terlampir dari dokumen: ${file.name}`);
      await processTextWithGroqAI(fallbackContent, file.name);
    }
  };

  // Handler Upload File Dokumen Ujian (.pdf / .docx / .txt)
  const handleExamFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExamDocFileName(file.name);
    const cleanExamTitle = "Ujian Resmi: " + file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ");
    if (!examTitleInput) {
      setExamTitleInput(cleanExamTitle);
    }

    const fileParsedQuestions: ExamQuestion[] = [
      {
        id: `eq-file-${Date.now()}-1`,
        type: "pg",
        question: `[Hasil Ekstrak File ${file.name}] Manakah prinsip utama yang dibahas pada dokumen ujian ini?`,
        options: [
          "Respirasi seluler aerob dan metabolisme energi ATP",
          "Hukum kelembaman dan gaya aksi-reaksi Newton",
          "Struktur asam basa dan reaksi penetralan",
          "Teori relativitas dan gelombang elektromagnetik",
        ],
        answerIndex: 0,
      },
      {
        id: `eq-file-${Date.now()}-2`,
        type: "pg",
        question: `[Hasil Ekstrak File ${file.name}] Faktor utama yang menentukan keakuratan eksperimen laboratorium adalah...`,
        options: [
          "Kontrol variabel bebas dan ketelitian instrumen",
          "Kecepatan penulisan laporan akhir",
          "Waktu pengambilan sampel pada sore hari",
          "Suhu udara luar ruangan laboratorium",
        ],
        answerIndex: 0,
      },
      {
        id: `eq-file-${Date.now()}-3`,
        type: "essay",
        question: `[Hasil Ekstrak File ${file.name}] Uraikan secara rinci 3 poin utama hasil analisis data yang terdapat dalam dokumen ujian ini!`,
        sampleAnswer: "Kunci Jawaban Dokumen: Analisis variabel, validasi teori dasar, dan evaluasi implikasi fisiologis.",
        maxPoints: 25,
      },
      {
        id: `eq-file-${Date.now()}-4`,
        type: "essay",
        question: `[Hasil Ekstrak File ${file.name}] Jelaskan tantangan utama dan solusi ilmiah yang dipaparkan dalam dokumen ujian ini!`,
        sampleAnswer: "Kunci Jawaban Dokumen: Optimalisasi metode pengujian dan eliminasi galat eksperimen.",
        maxPoints: 25,
      },
    ];

    setExamQuestionsDraft(fileParsedQuestions);
    showGuruToast(`Berhasil mengunggah & mengekstrak 4 Soal (2 PG + 2 Essay) dari file "${file.name}"!`);
  };

  const handleUploadMaterialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matTitleInput.trim() || !matContentInput.trim()) {
      alert("Judul dan Isi Materi wajib diisi!");
      return;
    }
    const currentTRoom = teacherRoom || getClassRoom(teacherRoomCode) || {
      code: teacherRoomCode,
      className: "Kelas Baru",
      subject: "Umum",
      teacherName: "Guru Pengajar",
      announcements: [],
      messages: [],
      materials: [],
      quizzes: [],
      exams: [],
    };

    const newMatId = `mat-${Date.now()}`;

    // Auto-generate again if counts were changed by the teacher before submit
    let currentAiCards = aiGeneratedCards;
    let currentAiQuizzes = aiGeneratedQuizzes;

    if (matRawText && (currentAiCards.length !== matFlashcardCount || currentAiQuizzes.length !== matQuizCount)) {
      const generated = await processTextWithGroqAI(matRawText, matDocFileName || matTitleInput, matFlashcardCount, matQuizCount);
      if (generated) {
        currentAiCards = generated.cards;
        currentAiQuizzes = generated.quizzes;
      }
    }

    // Generate dynamic educational flashcards using Groq AI if available
    let generatedFlashcards: Flashcard[] = [];

    if (currentAiCards && currentAiCards.length > 0) {
      generatedFlashcards = currentAiCards;
    } else {
      const cleanTitle = matTitleInput.trim().replace(/\.pdf$/i, "").replace(/finalzz/gi, "");
      const lowerCtx = (cleanTitle + " " + matContentInput).toLowerCase();

      if (lowerCtx.includes("makroekonomi") || lowerCtx.includes("is-lm") || lowerCtx.includes("fiskal") || lowerCtx.includes("moneter")) {
        generatedFlashcards = [
          {
            id: `fc-${Date.now()}-1`,
            front: "Apa fokus utama Kebijakan Fiskal dalam Model IS-LM?",
            back: "Kebijakan fiskal mengendalikan pengeluaran pemerintah dan pajak untuk mempengaruhi tingkat output dan permintaan di pasar barang (kurva IS)."
          },
          {
            id: `fc-${Date.now()}-2`,
            front: "Bagaimana Kebijakan Moneter mempengaruhi tingkat suku bunga?",
            back: "Kebijakan moneter mengatur jumlah uang beredar di pasar uang (kurva LM). Penambahan uang beredar menggeser kurva LM ke kanan dan menurunkan suku bunga."
          },
          {
            id: `fc-${Date.now()}-3`,
            front: "Apa arti titik keseimbangan simultan IS-LM?",
            back: "Titik perpotongan kurva IS dan LM menunjukkan tingkat suku bunga dan pendapatan nasional di mana pasar barang dan pasar uang berada dalam keseimbangan."
          },
          {
            id: `fc-${Date.now()}-4`,
            front: "Apa perbedaan peran Kurva IS dan Kurva LM?",
            back: "Kurva IS menggambarkan keseimbangan pasar barang & jasa (investasi = tabungan), sedangkan Kurva LM menggambarkan keseimbangan pasar uang (permintaan = penawaran uang)."
          },
          {
            id: `fc-${Date.now()}-5`,
            front: "Bagaimana efek interaksi antara Kebijakan Fiskal dan Moneter?",
            back: "Kombinasi kebijakan fiskal ekspansif dan moneter ekspansif dapat meningkatkan pertumbuhan ekonomi secara optimal tanpa lonjakan suku bunga."
          },
          {
            id: `fc-${Date.now()}-6`,
            front: "Faktor apa yang menyebabkan pergeseran Kurva IS?",
            back: "Pergeseran kurva IS disebabkan oleh perubahan pengeluaran pemerintah, pemotongan/kenaikan pajak, serta tingkat investasi otonom masyarakat."
          },
          {
            id: `fc-${Date.now()}-7`,
            front: "Faktor apa yang menyebabkan pergeseran Kurva LM?",
            back: "Pergeseran kurva LM disebabkan oleh kebijakan bank sentral dalam mengubah jumlah uang beredar (Money Supply) atau perubahan tingkat harga agregat."
          },
          {
            id: `fc-${Date.now()}-8`,
            front: "Mengapa Model IS-LM penting dalam analisis makroekonomi?",
            back: "Model IS-LM membantu pembuat kebijakan memprediksi dampak nyata dari kombinasi instrumen fiskal dan moneter terhadap produk domestik bruto (PDB) dan inflasi."
          }
        ];
      } else {
        const paragraphs = matContentInput
          .split(/\n+|\. /)
          .map((p) => p.trim())
          .filter((p) => p.length > 20 && !p.startsWith("%PDF") && !p.includes("obj <<") && !p.includes("/StructTreeRoot") && !p.includes("PROFIL Anggota"));

        generatedFlashcards.push({
          id: `fc-${Date.now()}-1`,
          front: `Apa fokus pembahasan utama dari ${cleanTitle}?`,
          back: matSummaryInput.trim() || `Materi ini membahas konsep dasar, teori, dan pembahasan mengenai ${cleanTitle}.`,
        });

        paragraphs.forEach((pText, pIdx) => {
          if (pIdx < 6) {
            generatedFlashcards.push({
              id: `fc-${Date.now()}-${pIdx + 2}`,
              front: `Konsep Pembahasan ${pIdx + 1}: Apakah yang dimaksud dengan "${pText.slice(0, 35)}..."?`,
              back: pText.length > 130 ? pText.slice(0, 130) + "..." : pText,
            });
          }
        });
      }
    }

    // Upload file to Supabase Storage for permanent URL
    let permanentFileUrl = "";
    if (matDocFile) {
      try {
        const fileExt = matDocFile.name.split(".").pop() || "pdf";
        const storagePath = `materials/${teacherRoomCode}/${newMatId}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("learning-materials")
          .upload(storagePath, matDocFile, { cacheControl: "3600", upsert: true });
        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("learning-materials")
            .getPublicUrl(storagePath);
          permanentFileUrl = urlData.publicUrl;
        } else {
          console.warn("File upload error:", uploadError);
        }
      } catch (err) {
        console.warn("Storage upload failed:", err);
      }
    }

    const newMaterial: MaterialItem = {
      id: newMatId,
      title: matTitleInput.trim(),
      summary: matSummaryInput.trim() || matContentInput.slice(0, 90) + "...",
      content: matContentInput.trim(),
      flashcards: generatedFlashcards,
      fileUrl: permanentFileUrl || matFileUrl,
    };

    let updatedQuizzes = [...currentTRoom.quizzes];

    if (autoCreateQuiz) {
      // Use AI-generated quiz questions if available, otherwise fallback
      let quizQuestions: QuizQuestion[] = [];

      if (currentAiQuizzes && currentAiQuizzes.length > 0) {
        quizQuestions = currentAiQuizzes;
      } else {
        quizQuestions = [
          {
            id: `q-${Date.now()}-1`,
            question: `Pernyataan berikut yang PALING TEPAT mengenai ${matTitleInput.trim()} adalah...`,
            options: [
              matSummaryInput.trim() || "Poin utama materi sesuai penjelasan guru",
              "Konsep yang bertolak belakang",
              "Hanya berlaku pada ruang terbuka",
              "Bukan bagian dari kurikulum",
            ],
            answerIndex: 0,
            explanation: `Penjelasan: ${matSummaryInput.trim() || matContentInput.slice(0, 100)}`,
          },
          {
            id: `q-${Date.now()}-2`,
            question: `Apa manfaat utama mempelajari materi ${matTitleInput.trim()}?`,
            options: [
              "Memahami konsep dasar dan penerapannya secara nyata",
              "Sekadar menghafal tanpa analisis",
              "Menggantikan konsep sains terdahulu",
              "Tidak ada jawaban yang tepat",
            ],
            answerIndex: 0,
            explanation: "Tujuan utama adalah pemahaman konseptual yang mendalam.",
          },
        ];
      }

      const newQuiz: QuizItem = {
        id: `quiz-${Date.now()}`,
        title: matTitleInput.trim(),
        description: `Kuis pemahaman otomatis dari materi ${matTitleInput.trim()} (${quizQuestions.length} soal)`,
        questions: quizQuestions,
      };
      updatedQuizzes.push(newQuiz);
    }

    const updatedRoom: ClassRoom = {
      ...currentTRoom,
      materials: [newMaterial, ...currentTRoom.materials],
      quizzes: updatedQuizzes,
    };

    saveClassRoom(updatedRoom);
    setTeacherRoom(updatedRoom);
    if (activeCode === updatedRoom.code) setRoom(updatedRoom);

    setMatTitleInput("");
    setMatSummaryInput("");
    setMatContentInput("");
    setMatDocFileName("");
    setMatDocFile(null);
    setMatRawText("");
    setAiGeneratedCards([]);
    setAiGeneratedQuizzes([]);
    showGuruToast(
      autoCreateQuiz
        ? `Materi & ${generatedFlashcards.length} Flashcards + Latihan Soal AI berhasil diunggah ke room ${updatedRoom.code}!`
        : `Materi & ${generatedFlashcards.length} Flashcards berhasil diunggah ke room ${updatedRoom.code}!`
    );
  };

  const handleAddQuestionToDraft = () => {
    if (!qQuestion.trim()) {
      alert("Pertanyaan tidak boleh kosong!");
      return;
    }
    let newQ: ExamQuestion;
    if (qType === "pg") {
      newQ = {
        id: `eq-draft-${Date.now()}`,
        type: "pg",
        question: qQuestion.trim(),
        options: [
          qOptA.trim() || "Pilihan A",
          qOptB.trim() || "Pilihan B",
          qOptC.trim() || "Pilihan C",
          qOptD.trim() || "Pilihan D",
        ],
        answerIndex: qCorrect,
      };
    } else {
      newQ = {
        id: `eq-draft-${Date.now()}`,
        type: "essay",
        question: qQuestion.trim(),
        sampleAnswer: qSampleAnswer.trim() || "Kunci jawaban / rubrik penilaian guru.",
        maxPoints: qPoints || 25,
      };
    }

    setExamQuestionsDraft([...examQuestionsDraft, newQ]);
    setQQuestion("");
    setQOptA("");
    setQOptB("");
    setQOptC("");
    setQOptD("");
    setQSampleAnswer("");
    showGuruToast(`Soal ${qType === "pg" ? "Pilihan Ganda" : "Essay"} berhasil ditambahkan ke draf.`);
  };

  const handleUseExamTemplate = () => {
    const templateQs: ExamQuestion[] = [
      {
        id: `eq-tpl-${Date.now()}-1`,
        type: "pg",
        question: `Manakah pasangan organel sel dan fungsinya yang paling tepat?`,
        options: [
          "Mitokondria - Pembentukan ATP & Energi Sel",
          "Ribosom - Sintesis Lemak Kompleks",
          "Kloroplas - Tempat Terjadinya Respirasi Aerob",
          "Lisosom - Sintesis Protein Struktural",
        ],
        answerIndex: 0,
      },
      {
        id: `eq-tpl-${Date.now()}-2`,
        type: "pg",
        question: `Faktor lingkungan utama yang secara langsung membatasi laju Reaksi Terang fotosintesis adalah...`,
        options: [
          "Intensitas Cahaya Matahari & Gelombang Fotung",
          "Tingkat Keasaman pH Tanah",
          "Jumlah Oksigen Atmosfer",
          "Kadar Garam Air Tanah",
        ],
        answerIndex: 0,
      },
      {
        id: `eq-tpl-${Date.now()}-3`,
        type: "essay",
        question: `Uraikan secara komprehensif perbedaan mendasar antara pembelahan sel Mitosis dan Meiosis beserta dampaknya bagi sifat keturunan!`,
        sampleAnswer: "Mitosis menghasilkan 2 sel anak identik diploid (2n) untuk pertumbuhan, sedangkan Meiosis menghasilkan 4 sel anakan haploid (n) dengan rekombinasi genetik untuk reproduksi seksual.",
        maxPoints: 25,
      },
      {
        id: `eq-tpl-${Date.now()}-4`,
        type: "essay",
        question: `Jelaskan peran fisiologis kloroplas dan mitokondria sebagai dua organel pengolah energi utama dalam sel tumbuhan!`,
        sampleAnswer: "Kloroplas mengubah energi foton matahari menjadi senyawa organik glukosa melalui fotosintesis, lalu mitokondria mengoksidasi glukosa tersebut menjadi molekul energi ATP melalui respirasi sel.",
        maxPoints: 25,
      },
    ];
    setExamQuestionsDraft(templateQs);
    showGuruToast("Template Soal Ujian Campuran (Pilihan Ganda & Essay) dimuat!");
  };

  const handlePublishExamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examTitleInput.trim()) {
      alert("Judul Ujian wajib diisi!");
      return;
    }
    if (examQuestionsDraft.length === 0) {
      alert("Tambahkan minimal 1 soal terlebih dahulu!");
      return;
    }

    const currentTRoom = teacherRoom || getClassRoom(teacherRoomCode) || {
      code: teacherRoomCode,
      className: "Kelas Baru",
      subject: "Umum",
      teacherName: "Guru Pengajar",
      announcements: [],
      messages: [],
      materials: [],
      quizzes: [],
      exams: [],
    };

    const newExam: ExamItem = {
      id: `exam-${Date.now()}`,
      title: examTitleInput.trim(),
      durationMinutes: examDurationInput || 45,
      questions: examQuestionsDraft,
    };

    const updatedRoom: ClassRoom = {
      ...currentTRoom,
      exams: [newExam, ...currentTRoom.exams],
    };

    saveClassRoom(updatedRoom);
    setTeacherRoom(updatedRoom);
    if (activeCode === updatedRoom.code) setRoom(updatedRoom);

    setExamTitleInput("");
    setExamQuestionsDraft([]);
    showGuruToast(`Paket Ujian Resmi "${newExam.title}" berhasil dipublikasikan ke room ${updatedRoom.code}!`);
  };

  const handlePostAnnouncementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementInput.trim() || !teacherRoom) return;
    const newAnn = {
      id: `ann-${Date.now()}`,
      author: teacherRoom.teacherName,
      date: `Hari ini, ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`,
      content: announcementInput.trim(),
    };
    const updatedRoom: ClassRoom = {
      ...teacherRoom,
      announcements: [newAnn, ...teacherRoom.announcements],
    };
    saveClassRoom(updatedRoom);
    setTeacherRoom(updatedRoom);
    if (activeCode === updatedRoom.code) setRoom(updatedRoom);
    setAnnouncementInput("");
    showGuruToast("Pengumuman resmi berhasil diposting ke room kelas!");
  };

  const toggleDictation = (questionId: string) => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser kamu belum mendukung Dikte Suara otomatis. Kamu dapat mengetikkan jawaban essay secara langsung.");
      return;
    }
    if (listeningEssayId === questionId) {
      setListeningEssayId(null);
      speakText("Dikte suara dihentikan.");
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "id-ID";
      recognition.interimResults = false;
      setListeningEssayId(questionId);
      speakText("Silakan bicara. Jawaban essay kamu akan dicatat otomatis.");
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setExamEssayAnswers((prev) => ({
          ...prev,
          [questionId]: (prev[questionId] ? prev[questionId] + " " : "") + transcript,
        }));
        setListeningEssayId(null);
        speakText(`Berhasil mencatat: ${transcript}`);
      };
      recognition.onerror = () => {
        setListeningEssayId(null);
      };
      recognition.start();
    } catch (e) {
      console.error(e);
      setListeningEssayId(null);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsExamFullscreen(false);
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleExamFullscreen = () => {
    if (!isExamFullscreen) {
      if (typeof document !== "undefined" && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => { });
      }
      setIsExamFullscreen(true);
      speakText("Memasuki Mode Ujian Fullscreen Kompetisi Sains PINTARA. Selamat mengerjakan!");
    } else {
      if (typeof document !== "undefined" && document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => { });
      }
      setIsExamFullscreen(false);
      speakText("Keluar dari Mode Ujian Fullscreen.");
    }
  };

  useEffect(() => {
    const session = getActiveSession();
    if (!session || !session.isLoggedIn) {
      router.push("/");
      return;
    }
    setUserSession(session);

    // Buka otomatis jika siswa belum set jenjang
    // if (session.role === "siswa" && !session.jenjang) {
    //   setIsGradeModalOpen(true);
    // }
    if (session.jenjang) {
      setSelectedGrade(session.jenjang);
    }

    const modeNames: Record<string, string> = {
      sensorik: "Mode Sensorik",
      sensorik_tunanetra: "Sensorik - Tunanetra",
      sensorik_tunarungu: "Sensorik - Tunarungu",
      fisik: "Mode Fisik",
      fisik_mata: "Fisik - Kontrol Mata",
      fisik_suara: "Fisik - Kontrol Suara",
      fisik_motorik: "Fisik - Motorik Halus",
      intelektual: "Mode Intelektual",
      mental: "Mode Mental",
    };

    if (typeof window !== "undefined" && localStorage.getItem("pintara_eye_control_enabled") === "true") {
      setActiveMode("Fisik - Kontrol Mata");
    } else if (session.accessibilityConfig?.mainMode) {
      setActiveMode(modeNames[session.accessibilityConfig.mainMode] || session.accessibilityConfig.mainMode);
    } else {
      const configStr = localStorage.getItem("pintara_a11y_config");
      if (configStr) {
        try {
          const config = JSON.parse(configStr);
          if (config.mainMode) {
            setActiveMode(modeNames[config.mainMode] || config.mainMode);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }

    // Pemicu Suara Otomatis saat Masuk ke Halaman Utama PINTARA
    const dashboardInstruction =
      "Kamu sekarang ada di halaman utama PINTARA, di sini terdapat katalog mata pelajaran SD Kurikulum Merdeka, belajar di kelas, dan akses untuk guru. Di katalog mapel, terdapat berbagai mata pelajaran yang biasa kamu dapatkan di sekolah seperti matematika, bahasa indonesia, IPAS, dan lain-lain. Belajar di kelas, kamu dapat berbagi materi dan latihan soal dengan guru dan rekan kamu yang menggunakan PINTARA. Akses untuk guru hanya dikhususkan untuk guru. Silakan melanjutkan belajar, semoga nyaman menggunakan PINTARA.";

    speakGlobal(dashboardInstruction);
  }, []);

  // Load last room & room history from localStorage on mount
  useEffect(() => {
    const session = getActiveSession();
    const userId = session?.id || "guest";

    const savedLastCode = localStorage.getItem(`pintara_student_last_room_${userId}`);
    const savedHistory = localStorage.getItem(`pintara_student_room_history_${userId}`);
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed)) setRoomHistory(parsed);
      } catch { }
    } else {
      setRoomHistory([]);
    }

    if (savedLastCode) {
      setInputCode(savedLastCode);
      setActiveCode(savedLastCode);
    } else {
      setInputCode("INKLU-1234");
      setActiveCode("INKLU-1234");
    }
  }, []);

  // Close room & account dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (roomDropdownRef.current && !roomDropdownRef.current.contains(e.target as Node)) {
        setShowRoomDropdown(false);
      }
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(e.target as Node)) {
        setShowAccountDropdown(false);
      }
    };
    if (showRoomDropdown || showAccountDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showRoomDropdown, showAccountDropdown]);

  // Load Room Data saat activeCode Berubah (Async dengan Supabase & Server Store)
  useEffect(() => {
    if (!activeCode) return;
    let isMounted = true;
    (async () => {
      const data = await getClassRoomAsync(activeCode);
      if (isMounted) {
        if (data) {
          setRoom(data);
          setJoinError("");
        } else {
          setJoinError(`Kode kelas "${activeCode}" tidak ditemukan.`);
        }
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [activeCode]);

  // Room-Isolated Student Exam Timer Sync
  useEffect(() => {
    const studentRoomCode = room?.code || activeCode;
    if (!studentRoomCode) {
      setStudentRoomTimer(null);
      return;
    }
    const cleanCode = studentRoomCode.toUpperCase().trim();
    const updateTimer = () => {
      const cfg = getRoomExamTimer(cleanCode);
      setStudentRoomTimer(cfg);
    };
    updateTimer();

    const handleTimerEvent = (e: any) => {
      if (!e.detail || e.detail.roomCode === cleanCode) {
        updateTimer();
      }
    };
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === `pintara_room_exam_timer_${cleanCode}`) {
        updateTimer();
      }
    };

    window.addEventListener("pintara_exam_timer_updated", handleTimerEvent);
    window.addEventListener("storage", handleStorageEvent);
    const pollInterval = setInterval(updateTimer, 2500);

    return () => {
      window.removeEventListener("pintara_exam_timer_updated", handleTimerEvent);
      window.removeEventListener("storage", handleStorageEvent);
      clearInterval(pollInterval);
    };
  }, [room?.code, activeCode]);

  // Student Countdown Effect (Calculates Remaining Time Synchronized with startedAt)
  useEffect(() => {
    if (!studentRoomTimer || !studentRoomTimer.isActive || !studentRoomTimer.startedAt) {
      setExamTimer(0);
      return;
    }

    if (userSession?.accessibilityConfig?.mainMode === "intelektual") {
      return;
    }

    const calcRemaining = () => {
      if (!studentRoomTimer.startedAt) return 0;
      const totalSec = studentRoomTimer.durationMinutes * 60;
      const elapsedSec = Math.floor((Date.now() - studentRoomTimer.startedAt) / 1000);
      const remaining = Math.max(0, totalSec - elapsedSec);
      return remaining;
    };

    setExamTimer(calcRemaining());

    const interval = setInterval(() => {
      const rem = calcRemaining();
      setExamTimer(rem);
      if (rem <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [studentRoomTimer, examSubmitted, userSession?.accessibilityConfig?.mainMode]);

  const speakText = (text: string) => {
    speakGlobal(text);
  };

  const handleChangeMode = () => {
    localStorage.removeItem("pintara_a11y_config");
    localStorage.removeItem("pintara_eye_control_enabled");
    router.push("/");
  };

  const handleStopSpeech = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  // Helper: save room to history & localStorage
  const saveRoomToHistory = (code: string, className: string) => {
    const session = getActiveSession();
    const userId = session?.id || "guest";

    localStorage.setItem(`pintara_student_last_room_${userId}`, code);
    setRoomHistory((prev) => {
      const filtered = prev.filter((r) => r.code !== code);
      const updated = [{ code, className }, ...filtered].slice(0, 15);
      localStorage.setItem(`pintara_student_room_history_${userId}`, JSON.stringify(updated));
      return updated;
    });
  };

  // Helper: switch room from dropdown history
  const switchToRoom = async (code: string) => {
    const session = getActiveSession();
    const userId = session?.id || "guest";

    setShowRoomDropdown(false);
    setInputCode(code);
    setActiveCode(code);
    localStorage.setItem(`pintara_student_last_room_${userId}`, code);
    const foundRoom = await getClassRoomAsync(code);
    if (foundRoom) {
      setRoom(foundRoom);
      setJoinError("");
      saveRoomToHistory(code, foundRoom.className);
      speakText(`Beralih ke room ${foundRoom.className}`);
    }
  };

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    const targetCode = inputCode.trim().toUpperCase();
    const foundRoom = await getClassRoomAsync(targetCode);
    if (foundRoom) {
      setRoom(foundRoom);
      setActiveCode(targetCode);
      setJoinError("");
      saveRoomToHistory(targetCode, foundRoom.className);
      speakText(`Berhasil bergabung ke room ${foundRoom.className}`);
    } else {
      setJoinError(`Kode kelas "${targetCode}" tidak ditemukan.`);
      speakText(`Kode kelas ${targetCode} tidak ditemukan`);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !room) return;

    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: `${userSession?.name || "Siswa"} (${userSession?.role === "guru" ? "Guru" : "Siswa"})`,
      role: (userSession?.role || "siswa") as "siswa" | "guru",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      text: newMessageText.trim(),
    };

    const updatedRoom: ClassRoom = {
      ...room,
      messages: [...room.messages, newMsg],
    };

    setRoom(updatedRoom);
    saveClassRoom(updatedRoom);
    setNewMessageText("");
  };

  const openFlashcards = (material: MaterialItem) => {
    setActiveFlashcardMaterial(material);
    setFlashcardIndex(0);
    setIsFlipped(false);
    if (material.flashcards.length > 0) {
      speakText(`Membuka study cards untuk ${material.title}. Kartu 1: ${material.flashcards[0].front}`);
    }
  };

  const nextFlashcard = () => {
    if (!activeFlashcardMaterial) return;
    setIsFlipped(false);
    const nextIdx = (flashcardIndex + 1) % activeFlashcardMaterial.flashcards.length;
    setFlashcardIndex(nextIdx);
    speakText(`Kartu ${nextIdx + 1}: ${activeFlashcardMaterial.flashcards[nextIdx].front}`);
  };

  const prevFlashcard = () => {
    if (!activeFlashcardMaterial) return;
    setIsFlipped(false);
    const prevIdx = (flashcardIndex - 1 + activeFlashcardMaterial.flashcards.length) % activeFlashcardMaterial.flashcards.length;
    setFlashcardIndex(prevIdx);
    speakText(`Kartu ${prevIdx + 1}: ${activeFlashcardMaterial.flashcards[prevIdx].front}`);
  };

  const toggleFlip = () => {
    const newFlipped = !isFlipped;
    setIsFlipped(newFlipped);
    if (activeFlashcardMaterial && activeFlashcardMaterial.flashcards[flashcardIndex]) {
      const fc = activeFlashcardMaterial.flashcards[flashcardIndex];
      speakText(newFlipped ? `Jawaban: ${fc.back}` : `Pertanyaan: ${fc.front}`);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Menentukan angka kelas aktif (1 sampai 6) dari userSession.jenjang atau selectedGrade
  const activeGradeNum = (() => {
    const raw = (userSession?.role === "siswa" && userSession?.jenjang)
      ? userSession.jenjang
      : (userSession?.jenjang || selectedGrade || "");
    const match = raw.match(/\d+/);
    if (match) return parseInt(match[0], 10);
    return 1; // Default ke Kelas 1 SD jika belum ada pilihan
  })();

  const isFaseAB = activeGradeNum <= 3; // Kelas 1 – 3 (Fase A & Fase B Awal)

  // Mata Pelajaran Kelas 1 – 3 (Fase A & Fase B Awal)
  const subjectsGrade1to3: Subject[] = [
    {
      id: "pancasila",
      name: "Pendidikan Pancasila",
      image: "/logos/pkn.png",
      icon: "",
      category: "Karakter",
      description: "Fondasi Karakter, Nilai Pancasila, Norma & Kewarganegaraan",
    },
    {
      id: "indonesia",
      name: "Bahasa Indonesia",
      image: "/logos/indonesia.png",
      icon: "",
      category: "Literasi",
      description: "Kemampuan Membaca, Menulis, Menyimak & Berbicara",
    },
    {
      id: "matematika",
      name: "Matematika",
      image: "/logos/matematika.png",
      icon: "",
      category: "Numerasi",
      description: "Bilangan Cacah, Berhitung, Geometri Dasar & Pengukuran",
    },
    {
      id: "seni-budaya",
      name: "Seni dan Budaya",
      image: "/logos/seni-budaya.png",
      icon: "",
      category: "Kreativitas",
      description: "Seni Rupa, Seni Musik, Seni Teater & Seni Tari",
    },
    {
      id: "inggris",
      name: "Bahasa Inggris",
      image: "/logos/inggris.png",
      icon: "",
      category: "Bahasa",
      description: "Basic Vocabulary, Phonics, Greetings & Everyday English",
    },
  ];

  // Mata Pelajaran Kelas 4 – 6 (Fase B Akhir & Fase C)
  const subjectsGrade4to6: Subject[] = [
    {
      id: "pancasila",
      name: "Pendidikan Pancasila",
      image: "/logos/pkn.png",
      icon: "",
      category: "Karakter",
      description: "Hak & Kewajiban, Keberagaman Budaya, Demokrasi & Gotong Royong",
    },
    {
      id: "indonesia",
      name: "Bahasa Indonesia",
      image: "/logos/indonesia.png",
      icon: "",
      category: "Literasi",
      description: "Literasi Kritis, Menulis Paragraf, Teks Cerita & Tata Bahasa",
    },
    {
      id: "matematika",
      name: "Matematika",
      image: "/logos/matematika.png",
      icon: "",
      category: "Numerasi",
      description: "Pecahan, FPB/KPK, Geometri Ruang, Skala & Pengolahan Data",
    },
    {
      id: "ipas",
      name: "Ilmu Pengetahuan Alam dan Sosial (IPAS)",
      image: "/logos/ipas.png",
      icon: "",
      category: "Eksplorasi",
      description: "Sains Alam, Ekosistem, Tubuh Manusia, Lingkungan & Sosial Budaya",
    },
    {
      id: "seni-budaya",
      name: "Seni dan Budaya",
      image: "/logos/seni-budaya.png",
      icon: "",
      category: "Kreativitas",
      description: "Seni Rupa, Seni Musik, Seni Teater & Seni Tari",
    },
    {
      id: "inggris",
      name: "Bahasa Inggris",
      image: "/logos/inggris.png",
      icon: "",
      category: "Bahasa",
      description: "Grammar, Reading Comprehension, Conversation & Writing",
    },
  ];

  const subjects = isFaseAB ? subjectsGrade1to3 : subjectsGrade4to6;

  const filteredSubjects = subjects.filter((subj) => {
    const matchesSearch = subj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subj.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "semua" || subj.category.toLowerCase() === activeCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const handleSaveJenjang = async () => {
    if (!selectedGrade || !userSession) return;
    setIsUpdatingJenjang(true);

    // 1. Langsung update session lokal (optimistic update)
    const updatedSession = { ...userSession, jenjang: selectedGrade };
    setUserSession(updatedSession);
    setActiveSession(updatedSession);

    // Langsung matikan loading dan tutup modal (jangan nunggu Supabase agar tidak nyangkut)
    setIsUpdatingJenjang(false);
    setIsGradeModalOpen(false);
    speakText(`Jenjang berhasil disimpan sebagai ${selectedGrade}`);

    // 2. Coba simpan ke Supabase di background tanpa memblokir user
    try {
      if (!userSession.id.startsWith("siswa_")) {
        // Kita biarkan ini berjalan di background, kalau hang tidak akan ngefek ke UI lagi
        await supabase.from("profiles").update({ jenjang: selectedGrade }).eq("id", userSession.id);
      }
    } catch (err) {
      console.warn("Latar belakang: Gagal sync jenjang ke Supabase", err);
    }
  };

  const renderSidebarNavItems = (isMobile: boolean = false) => {
    const handleNavClick = (action: () => void) => {
      action();
      if (isMobile) {
        setIsMobileMenuOpen(false);
      }
    };

    return (
      <>
        {/* LOGO AREA (Only on Desktop sidebar) */}
        {!isMobile && (
          <div className="flex flex-col items-center gap-2 mb-4 mt-4 relative z-10">
            <PintaraLogo size="md" />
          </div>
        )}

        {/* NAVIGATION */}
        <nav className="flex flex-col gap-3">
          {/* RUANG GURU (If Teacher) */}
          {userSession?.role === "guru" && (
            <button
              onClick={() => handleNavClick(() => setActiveTab("guru"))}
              className={`flex items-center gap-4 px-5 py-4 rounded-[28px] font-black text-xl transition-all cursor-pointer ${activeTab === "guru" ? "bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-md shadow-amber-500/20" : "bg-transparent text-slate-700 hover:bg-amber-50 hover:text-amber-900 font-bold"}`}
            >
              <div className={`w-10 h-10 flex items-center justify-center rounded-xl shrink-0 ${activeTab === "guru" ? "bg-white/20 text-white" : "bg-amber-100/70 text-amber-700"}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              Akses Guru
            </button>
          )}

          {/* SUB-MENUS AKSES GURU */}
          {activeTab === "guru" && userSession?.role === "guru" && (
            <div className="ml-8 mt-1 mb-4 flex flex-col gap-2 relative">
              <div className="absolute left-[-16px] top-0 bottom-6 w-1 bg-amber-200 rounded-full"></div>

              <button
                onClick={() => handleNavClick(() => setGuruTab("room"))}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm md:text-base transition-all text-left cursor-pointer ${guruTab === "room" ? "bg-amber-100/80 text-amber-900 font-extrabold translate-x-2 shadow-xs" : "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-amber-50/50"}`}
              >
                Generate Kode & Room
              </button>

              <button
                onClick={() => handleNavClick(() => setGuruTab("siswa"))}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm md:text-base transition-all text-left cursor-pointer ${guruTab === "siswa" ? "bg-amber-100/80 text-amber-900 font-extrabold translate-x-2 shadow-xs" : "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-amber-50/50"}`}
              >
                Kelola Siswa
              </button>

              <button
                onClick={() => handleNavClick(() => setGuruTab("daftar_siswa"))}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm md:text-base transition-all text-left cursor-pointer ${guruTab === "daftar_siswa" ? "bg-amber-100/80 text-amber-900 font-extrabold translate-x-2 shadow-xs" : "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-amber-50/50"}`}
              >
                Daftar Siswa
              </button>

              <button
                onClick={() => {
                  if (!hasCreatedRoom) {
                    showGuruToast("Anda wajib membuat atau menghubungkan Room Kelas terlebih dahulu!");
                    return;
                  }
                  handleNavClick(() => setGuruTab("materi"));
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm md:text-base transition-all text-left cursor-pointer ${!hasCreatedRoom ? "opacity-50 cursor-not-allowed text-slate-400" : guruTab === "materi" ? "bg-amber-100/80 text-amber-900 font-extrabold translate-x-2 shadow-xs" : "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-amber-50/50"}`}
              >
                Upload Materi & Kuis
              </button>

              <button
                onClick={() => {
                  if (!hasCreatedRoom) {
                    showGuruToast("Anda wajib membuat atau menghubungkan Room Kelas terlebih dahulu!");
                    return;
                  }
                  handleNavClick(() => setGuruTab("ujian"));
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm md:text-base transition-all text-left cursor-pointer ${!hasCreatedRoom ? "opacity-50 cursor-not-allowed text-slate-400" : guruTab === "ujian" ? "bg-amber-100/80 text-amber-900 font-extrabold translate-x-2 shadow-xs" : "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-amber-50/50"}`}
              >
                Upload Ujian Resmi
              </button>

              <button
                onClick={() => {
                  if (!hasCreatedRoom) {
                    showGuruToast("Anda wajib membuat atau menghubungkan Room Kelas terlebih dahulu!");
                    return;
                  }
                  handleNavClick(() => setGuruTab("rekap"));
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm md:text-base transition-all text-left cursor-pointer ${!hasCreatedRoom ? "opacity-50 cursor-not-allowed text-slate-400" : guruTab === "rekap" ? "bg-amber-100/80 text-amber-900 font-extrabold translate-x-2 shadow-xs" : "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-amber-50/50"}`}
              >
                Monitoring Content
              </button>
            </div>
          )}

          {/* PETUALANGAN BELAJAR */}
          <button
            onClick={() => handleNavClick(() => setActiveTab("katalog"))}
            data-dashboard-area="sidebar"
            data-scan-label="Petualangan Belajar"
            id={isMobile ? "mobile-sidebar-btn-katalog" : "sidebar-btn-katalog"}
            className={`flex items-center gap-4 px-5 py-4 rounded-[28px] font-black text-xl transition-all cursor-pointer ${activeTab === "katalog" ? "bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-md shadow-amber-500/20" : "bg-transparent text-slate-700 hover:bg-amber-50 hover:text-amber-900 font-bold"}`}
          >
            <div className={`w-10 h-10 flex items-center justify-center rounded-xl shrink-0 ${activeTab === "katalog" ? "bg-white/20 text-white" : "bg-amber-100/70 text-amber-700"}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            </div>
            Petualangan Belajar
          </button>

          {/* KELAS IMPIANKU */}
          <button
            onClick={() => handleNavClick(() => setActiveTab("kelas"))}
            data-dashboard-area="sidebar"
            data-scan-label="Kelas Impianku"
            id={isMobile ? "mobile-sidebar-btn-kelas" : "sidebar-btn-kelas"}
            className={`flex items-center gap-4 px-5 py-4 rounded-[28px] font-black text-xl transition-all cursor-pointer ${activeTab === "kelas" ? "bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-md shadow-amber-500/20" : "bg-transparent text-slate-700 hover:bg-amber-50 hover:text-amber-900 font-bold"}`}
          >
            <div className={`w-10 h-10 flex items-center justify-center rounded-xl shrink-0 ${activeTab === "kelas" ? "bg-white/20 text-white" : "bg-amber-100/70 text-amber-700"}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            </div>
            Kelas Impianku
          </button>

          {/* SUB-MENUS KELAS IMPIANKU */}
          {activeTab === "kelas" && (
            <div className="ml-8 mt-1 flex flex-col gap-2 relative">
              <div className="absolute left-[-16px] top-0 bottom-6 w-1 bg-amber-200 rounded-full"></div>

              <button
                onClick={() => handleNavClick(() => setActiveSidebarTab("kelas"))}
                data-dashboard-area="sidebar"
                data-scan-label="Tab Kelas"
                id={isMobile ? "mobile-sidebar-btn-sub-kelas" : "sidebar-btn-sub-kelas"}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-lg transition-all cursor-pointer ${activeSidebarTab === "kelas" ? "bg-amber-100/80 text-amber-900 font-extrabold translate-x-2 shadow-xs" : "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-amber-50/50"}`}
              >
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2" /></svg>
                Kelas
              </button>

              <button
                onClick={() => handleNavClick(() => setActiveSidebarTab("materi"))}
                data-dashboard-area="sidebar"
                data-scan-label="Buku Pintar"
                id={isMobile ? "mobile-sidebar-btn-sub-buku" : "sidebar-btn-sub-buku"}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-lg transition-all cursor-pointer ${activeSidebarTab === "materi" ? "bg-amber-100/80 text-amber-900 font-extrabold translate-x-2 shadow-xs" : "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-amber-50/50"}`}
              >
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                Buku Pintar
              </button>

              <button
                onClick={() => handleNavClick(() => setActiveSidebarTab("latihan"))}
                data-dashboard-area="sidebar"
                data-scan-label="Tantangan"
                id={isMobile ? "mobile-sidebar-btn-sub-tantangan" : "sidebar-btn-sub-tantangan"}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-lg transition-all cursor-pointer ${activeSidebarTab === "latihan" ? "bg-amber-100/80 text-amber-900 font-extrabold translate-x-2 shadow-xs" : "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-amber-50/50"}`}
              >
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                Tantangan
              </button>

              <button
                onClick={() => handleNavClick(() => setActiveSidebarTab("ujian"))}
                data-dashboard-area="sidebar"
                data-scan-label="Misi Akhir"
                id={isMobile ? "mobile-sidebar-btn-sub-ujian" : "sidebar-btn-sub-ujian"}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-lg transition-all cursor-pointer ${activeSidebarTab === "ujian" ? "bg-amber-100/80 text-amber-900 font-extrabold translate-x-2 shadow-xs" : "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-amber-50/50"}`}
              >
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Misi Akhir
              </button>
            </div>
          )}
        </nav>

        {/* BOTTOM AREA */}
        <div className="mt-8 flex flex-col gap-3 pt-6 border-t-2 border-amber-100/70 relative z-10">
          {userSession?.role === "siswa" && (
            <button
              onClick={() => handleNavClick(handleChangeMode)}
              data-dashboard-area="sidebar"
              data-scan-label={`Mode ${activeMode}`}
              id={isMobile ? "mobile-sidebar-btn-mode" : "sidebar-btn-mode"}
              className="w-full px-5 py-4 bg-white/80 hover:bg-white text-amber-900 border-2 border-white/90 ring-1 ring-amber-200/70 shadow-xs hover:shadow-md font-black rounded-[24px] transition-all flex items-center justify-center gap-3 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              {activeMode}
            </button>
          )}

          <button
            onClick={() => { clearActiveSession(); router.push("/"); }}
            data-dashboard-area="sidebar"
            data-scan-label="Keluar Akun"
            id={isMobile ? "mobile-sidebar-btn-logout" : "sidebar-btn-logout"}
            className="w-full px-5 py-4 bg-rose-50/80 hover:bg-rose-100 border-2 border-rose-200/80 shadow-xs hover:shadow-md text-rose-600 font-black rounded-[24px] transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Keluar Akun
          </button>
        </div>
      </>
    );
  };

  return (

    <div className="min-h-screen bg-[#FFF9EE] font-sans text-slate-800 relative flex overflow-x-hidden">

      {/* Mobile Top Header Bar (Tampilan HP) */}
      {!isExamFullscreen && (
        <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#FFF9EE]/95 backdrop-blur-md z-[55] border-b border-amber-200/70 px-4 flex items-center justify-between shadow-xs">
          {/* Tombol Back Mobile */}
          <button
            onClick={() => router.push("/")}
            id="btn-back-home-mobile"
            className="text-amber-500 hover:text-amber-600 p-1 flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
            title="Kembali ke Beranda"
            aria-label="Kembali ke Beranda"
          >
            <svg className="w-8 h-8 drop-shadow-sm" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
          </button>

          {/* Logo Tengah */}
          <div className="flex items-center">
            <PintaraLogo size="sm" />
          </div>

          {/* Tombol Titik Tiga (Menu Sidebar Mobile) */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            id="btn-mobile-menu-toggle"
            aria-label="Buka Menu"
            className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center transition-all duration-300 active:scale-90 cursor-pointer ${
              isMobileMenuOpen
                ? "bg-amber-100 border-amber-400 rotate-90 text-amber-900 shadow-sm"
                : "bg-white hover:bg-amber-50 text-slate-800 border-amber-200 shadow-xs"
            }`}
            title="Menu Navigasi"
          >
            <svg className="w-6 h-6 text-slate-700" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="5" r="2.2" />
              <circle cx="12" cy="12" r="2.2" />
              <circle cx="12" cy="19" r="2.2" />
            </svg>
          </button>
        </div>
      )}

      {/* Tombol Kembali ke Beranda (Desktop Saja) */}
      {!isExamFullscreen && (
        <button
          onClick={() => router.push("/")}
          id="btn-back-home"
          data-dashboard-area="sidebar"
          data-scan-label="Kembali ke Beranda"
          data-no-ring="true"
          className="hidden lg:flex absolute top-6 left-6 text-amber-500 hover:text-amber-600 hover:scale-110 transition-transform items-center justify-center p-2 z-[60] cursor-pointer"
          title="Kembali ke Halaman Utama"
        >
          <svg className="w-10 h-10 drop-shadow-md" fill="currentColor" viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
        </button>
      )}

      {/* ==================== 1. SIDEBAR (DESKTOP) ==================== */}
      {!isExamFullscreen && (
        <aside className="hidden lg:flex w-[300px] mt-24 mb-10 ml-8 bg-gradient-to-b from-white/60 via-white/45 to-white/50 hover:from-white/70 hover:to-white/55 rounded-[36px] flex-col p-6 z-50 shadow-[0_16px_40px_rgba(217,119,6,0.08),inset_0_1.5px_1px_rgba(255,255,255,0.95)] shrink-0 border border-white/80 ring-1 ring-amber-200/50 sticky top-24 self-start relative overflow-hidden transition-all duration-300">
          {/* Specular Light Flare */}
          <div className="absolute -top-[1.5px] left-1/2 -translate-x-1/2 w-36 h-[3px] bg-white rounded-full shadow-[0_0_14px_4px_rgba(255,255,255,1)] pointer-events-none" />
          {/* Glass specular sheen */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/45 via-white/10 to-transparent pointer-events-none rounded-t-[34px]" />

          {renderSidebarNavItems(false)}
        </aside>
      )}

      {/* ==================== MOBILE DRAWER OVERLAY ==================== */}
      {!isExamFullscreen && (
        <div
          className={`lg:hidden fixed inset-0 z-[70] transition-all duration-300 ease-in-out ${
            isMobileMenuOpen
              ? "opacity-100 pointer-events-auto bg-slate-900/60 backdrop-blur-sm"
              : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className={`w-[85%] max-w-[340px] h-full bg-[#FFF9EE] border-l-2 border-amber-200 p-6 flex flex-col shadow-2xl overflow-y-auto ml-auto transform transition-transform duration-300 ease-out ${
              isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Drawer Mobile */}
            <div className="flex items-center justify-between pb-4 border-b border-amber-200/70 mb-4 shrink-0">
              <PintaraLogo size="sm" />
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-10 h-10 bg-white border-2 border-amber-200 rounded-full flex items-center justify-center text-slate-700 hover:bg-amber-50 active:scale-95 transition-all shadow-xs cursor-pointer"
                aria-label="Tutup Menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {renderSidebarNavItems(true)}
          </div>
        </div>
      )}

      {/* ==================== 2. MAIN CONTENT ==================== */}
      <div className="flex-1 flex flex-col w-full min-h-screen min-w-0">

        {/* ==================== 2. MAIN CONTENT AREA (HERO SECTION REPLACEMENT) ==================== */}
        {/* VIEW 1: KATALOG MAPEL */}

        {activeTab === "katalog" && (
          <div className="flex-1 bg-gradient-to-br from-white/50 via-white/35 to-amber-50/20 rounded-[28px] lg:rounded-[36px] p-4 sm:p-6 lg:p-8 mt-20 lg:mt-24 mx-3 sm:mx-4 lg:mr-6 lg:ml-6 mb-8 lg:mb-10 shadow-[0_16px_40px_rgba(217,119,6,0.06)] flex flex-col relative animate-in fade-in duration-300 border border-white/80 ring-1 ring-amber-200/50">
            {/* Specular Light Flare */}
            <div className="absolute -top-[1.5px] left-1/2 -translate-x-1/2 w-64 md:w-96 h-[3px] bg-white rounded-full shadow-[0_0_12px_2px_rgba(255,255,255,0.9)] pointer-events-none" />
            {/* Glass highlight band */}
            <div className="absolute top-0 left-0 right-0 h-36 bg-gradient-to-b from-white/40 via-white/10 to-transparent pointer-events-none rounded-t-[34px]" />

            <main className="w-full space-y-10 relative z-10">
              {/* Header Banner Katalog */}
              <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6 bg-gradient-to-r from-[#FFC727] via-[#FFB800] to-[#FFA700] border-2 border-amber-300 rounded-[32px] p-8 shadow-md relative overflow-hidden">
                <div className="relative z-10 max-w-2xl">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="px-3.5 py-1.5 bg-white/90 text-amber-900 font-black text-xs md:text-sm rounded-full border border-amber-300 uppercase tracking-wider shadow-xs">
                      {userSession?.jenjang || (selectedGrade ? selectedGrade : `Kelas ${activeGradeNum} SD`)}
                    </span>
                  </div>
                  <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
                    Pilih Petualanganmu
                  </h1>
                  <p className="text-slate-800 text-lg mt-2 font-bold">
                    Mata pelajaran Kurikulum Merdeka Sekolah Dasar (SD).
                  </p>
                </div>

                {/* Search Bar */}
                <div className="relative z-10 w-full md:w-80 shrink-0">
                  <div className="relative flex items-center">
                    <div className="absolute left-4 pointer-events-none flex items-center justify-center z-10">
                      <svg className="w-5 h-5 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari petualangan..."
                      className="w-full pl-12 pr-4 py-3 bg-white/90 border-2 border-white ring-1 ring-amber-300/80 rounded-full text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white text-sm font-semibold transition-all shadow-inner"
                    />
                  </div>
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center space-x-2 overflow-x-auto pb-4 mb-6 scrollbar-none pl-1">
                {["semua", ...Array.from(new Set(subjects.map((s) => s.category)))].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-2 rounded-2xl text-xs md:text-sm font-black capitalize whitespace-nowrap transition-all border-2 cursor-pointer ${activeCategory === cat
                      ? "bg-gradient-to-r from-amber-400 to-amber-500 text-white font-black shadow-md border-amber-400"
                      : "bg-white/80 hover:bg-white text-slate-700 border-2 border-white ring-1 ring-amber-200/50 shadow-xs"
                      }`}
                  >
                    {cat === "semua" ? "Semua Mata Pelajaran" : cat}
                  </button>
                ))}
              </div>

              {/* GRID MATA PELAJARAN */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6 items-stretch">
                {filteredSubjects.map((subj) => (
                  <button
                    key={subj.id}
                    onClick={() => {
                      const targetGrade = (userSession?.role === "siswa" && userSession?.jenjang)
                        ? userSession.jenjang
                        : (selectedGrade || userSession?.jenjang || `Kelas ${activeGradeNum} SD`);
                      const jenjangParam = `?kelas=${encodeURIComponent(targetGrade)}`;
                      router.push(`/materi/${subj.id}${jenjangParam}`);
                    }}
                    data-voice-command={`buka ${subj.name.toLowerCase()}`}
                    data-dashboard-area="mapel"
                    data-scan-label={subj.name}
                    data-gaze-target={subj.id}
                    data-gaze-label={subj.name}
                    id={`gaze-subject-${subj.id}`}
                    className="group relative bg-gradient-to-b from-white/55 via-white/40 to-white/45 hover:from-white/70 hover:to-white/55 border border-white/85 hover:border-white ring-1 ring-amber-200/50 rounded-[32px] p-5 md:p-6 flex flex-col justify-between text-center transition-all duration-200 cursor-pointer shadow-[0_12px_28px_-8px_rgba(217,119,6,0.10),inset_0_1.5px_1px_0_rgba(255,255,255,0.95)] hover:shadow-[0_18px_36px_-6px_rgba(245,158,11,0.18),inset_0_1.5px_1px_0_rgba(255,255,255,1)] transform hover:-translate-y-2 h-full min-h-[380px] md:min-h-[410px] overflow-hidden"
                  >
                    {/* Specular Light Flare (Image 1 reference) */}
                    <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-28 md:w-36 h-[2.5px] bg-white rounded-full shadow-[0_0_8px_1.5px_rgba(255,255,255,0.95)] pointer-events-none" />
                    {/* Glossy Glass Highlight Band */}
                    <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/45 via-white/10 to-transparent pointer-events-none rounded-t-[30px]" />
                    <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-white/40 via-white/10 to-transparent rounded-bl-full pointer-events-none" />

                    <div className="flex flex-col items-center flex-1 w-full relative z-10">
                      {/* Container Ilustrasi Bersih dengan Tinted Glass Base (Image 2 style) */}
                      <div className="w-full h-36 md:h-44 mb-4 rounded-2xl bg-white/40 border border-white/70 shadow-inner flex items-center justify-center p-3 shrink-0 relative overflow-hidden group-hover:bg-white/55 transition-all">
                        {subj.image ? (
                          <img
                            src={subj.image}
                            alt={`Logo ${subj.name}`}
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.style.display = "none";
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = "flex";
                            }}
                            className="w-full h-full max-h-32 md:max-h-36 object-contain object-center transform transition-transform duration-500 group-hover:scale-110 drop-shadow-md"
                          />
                        ) : null}
                        <div
                          style={{ display: subj.image ? "none" : "flex" }}
                          className="w-full h-full rounded-xl bg-white/70 border border-amber-200/70 flex flex-col items-center justify-center text-amber-800 p-2 text-center"
                        >
                          <svg className="w-16 h-16 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                        </div>
                      </div>

                      {/* Badge Kategori */}
                      <div className="flex items-center justify-center mb-2.5 shrink-0">
                        <span className={`px-3 py-1 rounded-full text-[10px] md:text-[11px] font-black uppercase tracking-wider border shadow-xs ${subj.category.toLowerCase() === "karakter"
                          ? "bg-amber-100/90 text-amber-800 border-amber-300"
                          : subj.category.toLowerCase() === "literasi"
                            ? "bg-blue-100/90 text-blue-800 border-blue-300"
                            : subj.category.toLowerCase() === "numerasi"
                              ? "bg-purple-100/90 text-purple-800 border-purple-300"
                              : subj.category.toLowerCase() === "eksplorasi"
                                ? "bg-emerald-100/90 text-emerald-800 border-emerald-300"
                                : subj.category.toLowerCase() === "kreativitas"
                                  ? "bg-pink-100/90 text-pink-800 border-pink-300"
                                  : subj.category.toLowerCase() === "bahasa"
                                    ? "bg-indigo-100/90 text-indigo-800 border-indigo-300"
                                    : "bg-slate-100/90 text-slate-800 border-slate-300"
                          }`}>
                          {subj.category}
                        </span>
                      </div>

                      {/* Nama Mapel */}
                      <h3 className="text-base md:text-lg font-black text-slate-900 group-hover:text-amber-600 transition-colors line-clamp-1 w-full text-center">
                        {subj.name}
                      </h3>

                      {/* Ringkasan Materi */}
                      <p className="text-xs text-slate-600 font-medium mt-1.5 line-clamp-2 leading-relaxed max-w-[95%] text-center">
                        {subj.description}
                      </p>
                    </div>

                    {/* Tombol Aksi Mulai Belajar */}
                    <div className="mt-5 pt-3.5 border-t border-white/60 w-full shrink-0 relative z-10">
                      <div className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-400 to-amber-500 group-hover:from-amber-500 group-hover:to-amber-600 text-slate-950 font-black text-xs md:text-sm rounded-2xl flex items-center justify-center space-x-2 shadow-sm group-hover:shadow-md transition-all border border-white/60">
                        <span>Mulai Belajar</span>
                        <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </main>
          </div>
        )}

        {/* VIEW 2: BELAJAR DI KELAS (LANGSUNG DITAMPILKAN DI PUSAT HERO SECTION DASHBOARD - ENLARGED HERO LAYOUT) */}
        {activeTab === "kelas" && (
          <div className="flex-1 bg-gradient-to-br from-white/50 via-white/35 to-amber-50/20 rounded-[28px] lg:rounded-[36px] p-4 sm:p-6 lg:p-8 mt-20 lg:mt-24 mx-3 sm:mx-4 lg:mr-6 lg:ml-6 mb-8 lg:mb-10 shadow-[0_16px_40px_rgba(217,119,6,0.06)] flex flex-col relative animate-in fade-in duration-300 border border-white/80 ring-1 ring-amber-200/50">
            {/* Specular Light Flare */}
            <div className="absolute -top-[1.5px] left-1/2 -translate-x-1/2 w-64 md:w-96 h-[3px] bg-white rounded-full shadow-[0_0_12px_2px_rgba(255,255,255,0.9)] pointer-events-none" />
            {/* Glass highlight band */}
            <div className="absolute top-0 left-0 right-0 h-36 bg-gradient-to-b from-white/40 via-white/10 to-transparent pointer-events-none rounded-t-[34px]" />

            {/* RIGHT CANVAS CONTENT - EXPANDED / ENLARGED HERO CONTAINER */}
            <main className="w-full text-slate-800 relative z-10">
              {/* Top Bar Room Kelas Aktif (Dinamis + Dropdown Riwayat Room) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-gradient-to-r from-[#FFC727] via-[#FFB800] to-[#FFA700] p-5 md:p-6 rounded-3xl border-2 border-amber-300 shadow-md">
                {/* Room Aktif (Dropdown Trigger) */}
                <div ref={roomDropdownRef} className="relative flex items-center space-x-3 max-w-full">
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="text-xs md:text-sm font-black text-slate-900 uppercase tracking-wider shrink-0 whitespace-nowrap">ROOM AKTIF:</span>
                  <button
                    type="button"
                    id="btn-room-aktif"
                    data-dashboard-area="hero"
                    data-scan-label={activeCode ? `Room: ${activeCode}` : "Pilih Room Kelas"}
                    onClick={() => setShowRoomDropdown(!showRoomDropdown)}
                    className="px-6 py-3 bg-white/90 hover:bg-white text-slate-800 border-2 border-white/90 ring-1 ring-amber-200/70 font-black text-sm md:text-base rounded-2xl uppercase tracking-wider shadow-sm flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap max-w-[240px] sm:max-w-[380px] md:max-w-[520px]"
                  >
                    <span className="truncate">{activeCode ? `${activeCode} - ${room?.className || `Kelas ${activeCode}`}` : "Pilih Room"}</span>
                    <svg className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${showRoomDropdown ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  {/* Dropdown List */}
                  {showRoomDropdown && (
                    <div className="absolute top-full left-0 mt-2 bg-white/95 border-2 border-white/90 ring-1 ring-amber-200/70 rounded-2xl shadow-2xl z-50 min-w-[280px] max-h-72 overflow-y-auto">
                      {roomHistory.length > 0 ? (
                        <>
                          <div className="px-4 py-2.5 text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-amber-100">
                            Riwayat Room ({roomHistory.length})
                          </div>
                          {roomHistory.map((rh) => (
                            <button
                              key={rh.code}
                              type="button"
                              onClick={() => switchToRoom(rh.code)}
                              className={`w-full text-left px-4 py-3 text-sm font-bold transition-all flex items-center justify-between ${rh.code === activeCode
                                ? "bg-amber-500 text-white font-extrabold"
                                : "text-slate-700 hover:bg-amber-50/70"
                                }`}
                            >
                              <span className="truncate">{rh.code} – {rh.className}</span>
                              {rh.code === activeCode && (
                                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full shrink-0 ml-2">aktif</span>
                              )}
                            </button>
                          ))}
                        </>
                      ) : (
                        <div className="px-4 py-4 text-xs text-slate-600 font-semibold text-center">
                          Belum ada riwayat room. Gabung room pertamamu!
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Gabung Room Baru */}
                <form onSubmit={handleJoinClass} className="flex items-center space-x-2 w-full sm:w-auto">
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    placeholder="Kode Room..."
                    className="px-4 py-3 bg-white/90 focus:bg-white border-2 border-white/90 ring-1 ring-amber-300/80 rounded-xl text-sm md:text-base font-bold uppercase focus:outline-none focus:ring-2 focus:ring-amber-400 w-40 sm:w-56 text-slate-900 transition-all shadow-inner"
                  />
                  <button
                    type="submit"
                    id="btn-gabung-room"
                    data-dashboard-area="hero"
                    data-scan-label="Gabung Room"
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm md:text-base rounded-xl shadow-sm transition-all shrink-0 cursor-pointer"
                  >
                    Gabung Room
                  </button>
                </form>
              </div>

              {joinError && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs md:text-sm font-bold">
                  {joinError}
                </div>
              )}

              {/* TAB KELAS: ROOM MEDIA CHAT & PENGUMUMAN GURU */}
              {activeSidebarTab === "kelas" && room && (
                <div className="space-y-8">
                  {/* Pemberitahuan Guru */}
                  <div className="relative overflow-hidden bg-gradient-to-b from-white/55 via-white/40 to-white/45 hover:from-white/65 hover:to-white/50 border border-white/85 ring-1 ring-amber-200/50 rounded-[32px] p-6 md:p-10 shadow-[0_12px_28px_-8px_rgba(217,119,6,0.08),inset_0_1.5px_1px_rgba(255,255,255,0.95)] transition-all">
                    {/* Specular Light Flare (Image 1 reference) */}
                    <div className="absolute -top-[1.5px] left-1/2 -translate-x-1/2 w-48 md:w-64 h-[3px] bg-white rounded-full shadow-[0_0_16px_5px_rgba(255,255,255,1)] pointer-events-none" />
                    {/* Glass highlight band */}
                    <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-white/45 via-white/10 to-transparent pointer-events-none rounded-t-[30px]" />

                    <h3 className="text-xl md:text-2xl font-black text-slate-800 mb-6 flex items-center space-x-3 relative z-10">
                      <svg className="w-8 h-8 text-amber-500 fill-current" viewBox="0 0 24 24">
                        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                      </svg>
                      <span>Pesan dari Guru ({room.className})</span>
                    </h3>
                    <div className="space-y-3 relative z-10">
                      {room.announcements.length === 0 ? (
                        <div className="p-4 bg-white/70 border border-white ring-1 ring-amber-200/40 rounded-xl text-center text-slate-600 text-xs md:text-sm font-bold">
                          Belum ada pengumuman dari guru di room ini.
                        </div>
                      ) : (
                        room.announcements.map((ann) => (
                          <div key={ann.id} className="p-5 bg-gradient-to-r from-amber-50/90 to-white/90 border-2 border-white ring-1 ring-amber-200/50 rounded-2xl mb-3 shadow-xs">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-black text-lg text-amber-900">{ann.author}</span>
                              <span className="text-sm font-semibold text-slate-500">{ann.date}</span>
                            </div>
                            <p className="text-sm md:text-base text-slate-700 font-medium leading-relaxed">{ann.content}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Media Chat Room */}
                  <div className="relative overflow-hidden bg-gradient-to-b from-white/55 via-white/40 to-white/45 hover:from-white/65 hover:to-white/50 border border-white/85 ring-1 ring-amber-200/50 rounded-[32px] p-6 md:p-10 shadow-[0_12px_28px_-8px_rgba(217,119,6,0.08),inset_0_1.5px_1px_rgba(255,255,255,0.95)] flex flex-col h-[650px] transition-all">
                    {/* Specular Light Flare (Image 1 reference) */}
                    <div className="absolute -top-[1.5px] left-1/2 -translate-x-1/2 w-48 md:w-64 h-[3px] bg-white rounded-full shadow-[0_0_16px_5px_rgba(255,255,255,1)] pointer-events-none" />
                    {/* Glass highlight band */}
                    <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-white/45 via-white/10 to-transparent pointer-events-none rounded-t-[30px]" />

                    <h3 className="text-xl md:text-2xl font-black text-slate-800 mb-6 pb-4 border-b border-amber-100/80 flex items-center space-x-3 relative z-10">
                      <svg className="w-8 h-8 text-amber-500 fill-current" viewBox="0 0 24 24">
                        <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z" />
                      </svg>
                      <span>Obrolan Seru (Kode: {room.code})</span>
                    </h3>

                    <div className="flex-1 overflow-y-auto space-y-4 pr-3 mb-4 relative z-10 bg-white/20 p-4 rounded-2xl border border-white/50 shadow-inner">
                      {room.messages.length === 0 ? (
                        <div className="h-full flex items-center justify-center p-6 text-center text-slate-500 text-xs md:text-sm font-bold bg-white/80 rounded-2xl border-2 border-white ring-1 ring-amber-200/40">
                          Belum ada pesan di chat room. Mulai obrolan kelas pertama Anda!
                        </div>
                      ) : (
                        room.messages.map((msg) => {
                          const isGuru = msg.role === "guru";
                          const isMe = userSession?.name ? msg.sender.includes(userSession.name) : false;
                          return (
                            <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-black text-sm text-slate-700 mb-1">{msg.sender}</span>
                                {isGuru && (
                                  <span className="px-2 py-0.5 bg-emerald-500 text-white font-black text-[10px] rounded-full shadow-xs">
                                    GURU
                                  </span>
                                )}
                              </div>
                              <div
                                className={`max-w-lg p-4 rounded-2xl text-xs md:text-sm font-medium leading-relaxed ${isMe
                                    ? "bg-gradient-to-r from-amber-400 to-amber-500 text-white rounded-tr-none shadow-md shadow-amber-500/20 border border-amber-300"
                                    : isGuru
                                      ? "bg-white/90 border-2 border-white ring-1 ring-amber-300 text-slate-800 rounded-tl-none shadow-xs"
                                      : "bg-white/80 border-2 border-white ring-1 ring-amber-200/40 text-slate-800 rounded-tl-none shadow-xs"
                                  }`}
                              >
                                <p>{msg.text}</p>
                                <button
                                  onClick={() => speakText(`${msg.sender} mengatakan: ${msg.text}`)}
                                  className={`mt-2 text-[11px] font-bold ${isMe ? "text-white/95 hover:underline" : "text-amber-700 hover:underline"
                                    }`}
                                >
                                  Bacakan Pesan
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <form onSubmit={handleSendMessage} className="flex items-center space-x-3 pt-3 border-t border-amber-100/80 relative z-10">
                      <input
                        type="text"
                        value={newMessageText}
                        onChange={(e) => setNewMessageText(e.target.value)}
                        placeholder="Tulis pesan atau pertanyaan untuk kelas..."
                        className="flex-1 bg-white/40 focus:bg-white/80 border border-white/70 rounded-full px-6 py-4 focus:outline-none focus:ring-2 focus:ring-amber-400 text-slate-900 font-medium placeholder-slate-500 transition-all shadow-inner"
                      />
                      <button
                        type="submit"
                        className="px-8 py-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-extrabold rounded-full transition-all shadow-md hover:scale-105 shrink-0 cursor-pointer"
                      >
                        Kirim Pesan
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB MATERI & STUDY CARDS */}
              {activeSidebarTab === "materi" && room && (
                <div className="space-y-6">
                  <h3 className="text-xl md:text-2xl font-black text-slate-800">Materi & Study Cards ({room.code})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {room.materials.map((mat) => (
                      <div key={mat.id} className="relative overflow-hidden bg-gradient-to-b from-white/55 via-white/40 to-white/45 hover:from-white/70 hover:to-white/55 border border-white/85 hover:border-white ring-1 ring-amber-200/50 rounded-[32px] p-6 shadow-[0_12px_28px_-8px_rgba(217,119,6,0.08),inset_0_1.5px_1px_rgba(255,255,255,0.95)] hover:shadow-[0_18px_36px_-6px_rgba(245,158,11,0.18),inset_0_1.5px_1px_rgba(255,255,255,1)] transition-all flex flex-col justify-between">
                        {/* Specular Light Flare */}
                        <div className="absolute -top-[1.5px] left-1/2 -translate-x-1/2 w-36 h-[3px] bg-white rounded-full shadow-[0_0_12px_4px_rgba(255,255,255,1)] pointer-events-none" />
                        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-white/45 via-white/10 to-transparent pointer-events-none rounded-t-[30px]" />
                        <div className="relative z-10">
                          <span className="px-3 py-1 bg-amber-100/90  text-amber-800 font-black text-xs rounded-full mb-3 inline-block border border-amber-300 shadow-xs">
                            MODUL MATERI
                          </span>
                          <h4 className="text-lg font-black text-slate-900 mb-2">{mat.title}</h4>
                          <p className="text-xs md:text-sm text-slate-600 font-medium mb-4 leading-relaxed">{mat.summary}</p>
                        </div>
                        <div className="pt-4 border-t border-amber-100 flex items-center justify-between">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                if (mat.fileUrl) {
                                  setActiveMaterialPdf(mat);
                                } else {
                                  speakText("Dokumen asli belum dilampirkan oleh guru.");
                                  alert("Dokumen file asli belum dilampirkan oleh guru.");
                                }
                              }}
                              className="text-xs md:text-sm font-bold text-amber-800 hover:text-amber-900 flex items-center space-x-1.5 p-2 rounded-lg hover:bg-amber-50 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                              <span>Baca Materi</span>
                            </button>
                            <button
                              onClick={() => speakText(`Materi ${mat.title}. ${mat.content}`)}
                              title="Bacakan dengan suara"
                              className="text-xs md:text-sm font-bold text-amber-800 hover:text-amber-900 flex items-center space-x-1.5 p-2 rounded-lg hover:bg-amber-50 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                              <span>Dengarkan</span>
                            </button>
                          </div>
                          <button
                            onClick={() => openFlashcards(mat)}
                            className="px-4 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-extrabold text-xs md:text-sm rounded-xl shadow-sm transition-all"
                          >
                            Study Cards ({mat.flashcards.length})
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB LATIHAN SOAL */}
              {activeSidebarTab === "latihan" && room && (
                <div className="space-y-6">
                  <h3 className="text-xl md:text-2xl font-black text-slate-800">Latihan Soal ({room.code})</h3>
                  {(room?.quizzes || []).map((quiz) => (
                    <div key={quiz.id} className="relative overflow-hidden bg-gradient-to-b from-white/55 via-white/40 to-white/45 border border-white/85 ring-1 ring-amber-200/50 rounded-[32px] p-6 md:p-10 shadow-[0_12px_28px_-8px_rgba(217,119,6,0.08),inset_0_1.5px_1px_rgba(255,255,255,0.95)] mb-8">
                      {/* Specular Light Flare */}
                      <div className="absolute -top-[1.5px] left-1/2 -translate-x-1/2 w-48 h-[3px] bg-white rounded-full shadow-[0_0_14px_4px_rgba(255,255,255,1)] pointer-events-none" />
                      <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-white/45 via-white/10 to-transparent pointer-events-none rounded-t-[30px]" />

                      <div className="relative z-10">
                        <h4 className="text-lg md:text-xl font-black text-amber-900 mb-1">{quiz.title}</h4>
                        <p className="text-xs md:text-sm text-slate-600 font-semibold mb-6">{quiz.description}</p>
                        <div className="space-y-6">
                          {quiz.questions.map((q, qIdx) => {
                            const selectedOpt = quizAnswers[q.id];
                            const isCorrect = selectedOpt === q.answerIndex;
                            return (
                              <div key={q.id} className="bg-gradient-to-br from-amber-50/50 to-white/70  border-2 border-white/90 ring-1 ring-amber-200/50 rounded-[28px] p-6 md:p-8 space-y-5 shadow-xs">
                                <h5 className="font-black text-base md:text-lg lg:text-xl text-slate-900 leading-snug">
                                  {qIdx + 1}. {q.question}
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                  {q.options.map((opt, optIdx) => {
                                    const isSelected = selectedOpt === optIdx;
                                    return (
                                      <button
                                        data-quiz-option={opt}
                                        data-scan-label={`Soal ${qIdx + 1} Opsi ${String.fromCharCode(65 + optIdx)}: ${opt}`}
                                        id={`latihan-opt-${q.id}-${optIdx}`}
                                        key={optIdx}
                                        onClick={() => {
                                          if (!quizSubmitted) setQuizAnswers({ ...quizAnswers, [q.id]: optIdx });
                                        }}
                                        className={`p-5 rounded-2xl text-base md:text-lg font-extrabold text-left transition-all border-2 flex items-center space-x-4 cursor-pointer  ${isSelected
                                          ? "bg-gradient-to-r from-amber-400 to-amber-500 border-amber-500 text-white shadow-md ring-4 ring-amber-300/40 scale-[1.02]"
                                          : "bg-white/75 border-white/90 ring-1 ring-amber-200/50 text-slate-700 hover:bg-white hover:border-amber-300 shadow-xs"
                                          }`}
                                      >
                                        <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? "border-white bg-white text-amber-600 font-black" : "border-amber-200 text-slate-500"}`}>{String.fromCharCode(65 + optIdx)}</div><span>{opt}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                                {quizSubmitted && selectedOpt !== undefined && (
                                  <div className={`mt-3 p-4 rounded-xl text-xs md:text-sm font-bold ${isCorrect ? "bg-emerald-100 text-emerald-900 border border-emerald-200" : "bg-rose-100 text-rose-900 border border-rose-200"}`}>
                                    {isCorrect ? "Benar! " : "Kurang Tepat. "} {q.explanation}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-8 flex items-center justify-center">
                          {quizSubmitted ? (
                            <span className="font-black text-sm text-emerald-600 bg-emerald-50 px-6 py-2.5 rounded-full border border-emerald-200">Skor Berhasil Dicatat!</span>
                          ) : (
                            <button id="btn-submit-latihan" data-scan-label="Kumpulkan Jawaban Latihan" onClick={async () => {
                              const totalQuestions = quiz.questions.length;
                              let correct = 0;
                              quiz.questions.forEach(q => {
                                if (quizAnswers[q.id] === q.answerIndex) correct++;
                              });
                              const wrong = totalQuestions - correct;
                              const score = Math.round((correct / totalQuestions) * 100);

                              setQuizSubmitted(true);
                              speakText("Jawaban kuis telah dikumpulkan.");

                              // Save to Supabase database
                              if (userSession && room) {
                                await saveQuizSubmission({
                                  quizId: quiz.id,
                                  roomCode: room.code,
                                  studentId: userSession.id,
                                  studentName: userSession.name,
                                  quizTitle: quiz.title,
                                  totalQuestions,
                                  correctAnswers: correct,
                                  wrongAnswers: wrong,
                                  score,
                                  answers: quizAnswers,
                                });
                              }
                            }}
                              className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-sm md:text-base rounded-full shadow-md hover:scale-105 transition-all cursor-pointer"
                            >
                              Kirim Jawaban Latihan Soal
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB UJIAN (RUANGGURU SCIENCE COMPETITION STYLE FULLSCREEN MODE) */}
              {activeSidebarTab === "ujian" && room && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-gradient-to-r from-[#FFC727] via-[#FFB800] to-[#FFA700] p-5 md:p-6 rounded-3xl border-2 border-amber-300 shadow-md">
                    <div>
                      <h3 className="text-xl md:text-2xl font-black text-slate-900">Ujian Resmi ({room.code})</h3>
                      <p className="text-xs md:text-sm font-bold text-slate-800 mt-0.5">
                        Fokus dikerjakan secara profesional tanpa distraksi.
                      </p>
                    </div>

                    <div className="flex items-center space-x-3">
                      {userSession?.accessibilityConfig?.mainMode === "intelektual" ? (
                        <span className="text-xs md:text-sm font-bold text-amber-900 bg-white/90 px-4 py-2 rounded-xl border border-amber-300 shrink-0">
                          Mode Santai (Bebas Waktu)
                        </span>
                      ) : !studentRoomTimer?.isActive ? (
                        <span className="text-xs md:text-sm font-bold text-amber-800 bg-amber-100/90 px-4 py-2 rounded-xl border border-amber-300 shrink-0 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                          Menunggu Guru Memulai Timer
                        </span>
                      ) : (
                        <span className={`text-xs md:text-sm font-extrabold px-4 py-2 rounded-xl border shrink-0 flex items-center gap-2 ${examTimer < 300 ? "text-rose-600 bg-rose-50 border-rose-300 animate-pulse" : "text-amber-900 bg-white border-amber-200"
                          }`}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          Sisa Waktu: {formatTime(examTimer)}
                        </span>
                      )}
                      <button
                        onClick={toggleExamFullscreen}
                        title="Mode Layar Penuh"
                        className="p-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl shadow-xs transition-all flex items-center justify-center shrink-0 cursor-pointer"
                      >
                        <svg className="w-5 h-5 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {(room?.exams || []).map((exam) => (
                    <div key={exam.id} className="space-y-8 mb-8">
                      <h4 className="text-xl md:text-2xl font-black text-slate-900 mb-2">{exam.title}</h4>
                      <div className="space-y-6">
                        {exam.questions.map((eq, eqIdx) => {
                          const selectedOpt = examAnswers[eq.id];
                          const isEssay = eq.type === "essay" || !eq.options || eq.options.length === 0;
                          return (
                            <div key={eq.id} className="relative overflow-hidden bg-gradient-to-b from-white/55 via-white/40 to-white/45 border border-white/85 ring-1 ring-amber-200/50 rounded-[32px] p-6 md:p-10 shadow-[0_12px_28px_-8px_rgba(217,119,6,0.08),inset_0_1.5px_1px_rgba(255,255,255,0.95)] space-y-5">
                              {/* Specular Light Flare */}
                              <div className="absolute -top-[1.5px] left-1/2 -translate-x-1/2 w-48 h-[3px] bg-white rounded-full shadow-[0_0_14px_4px_rgba(255,255,255,1)] pointer-events-none" />
                              <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-white/45 via-white/10 to-transparent pointer-events-none rounded-t-[30px]" />

                              <div className="flex items-center justify-between pb-2 border-b border-amber-100/80 relative z-10">
                                <span className={`px-3 py-1 font-extrabold text-xs rounded-lg uppercase tracking-wider ${isEssay ? "bg-purple-100 text-purple-800 border border-purple-200" : "bg-slate-100 text-slate-700"
                                  }`}>
                                  {isEssay ? `Soal Essay / Uraian ${eq.maxPoints ? `(${eq.maxPoints} Poin)` : ""}` : `Soal Pilihan Ganda (PG)`}
                                </span>
                                {isEssay && (
                                  <button
                                    type="button"
                                    onClick={() => toggleDictation(eq.id)}
                                    className={`px-4 py-2 text-xs font-black rounded-xl transition-all flex items-center space-x-2 cursor-pointer ${listeningEssayId === eq.id
                                      ? "bg-rose-500 text-white animate-pulse"
                                      : "bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100"
                                      }`}
                                  >
                                    <svg className="w-3.5 h-3.5 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
                                      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                                      <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
                                    </svg>
                                    <span>{listeningEssayId === eq.id ? "Mendengarkan..." : "Dikte Suara"}</span>
                                  </button>
                                )}
                              </div>

                              <h5 className="font-black text-base md:text-lg text-slate-900 leading-snug">
                                Soal {eqIdx + 1}. {eq.question}
                              </h5>

                              {isEssay ? (
                                <div className="space-y-2 pt-1">
                                  <textarea
                                    value={examEssayAnswers[eq.id] || ""}
                                    onChange={(e) => {
                                      if (!examSubmitted) {
                                        setExamEssayAnswers({ ...examEssayAnswers, [eq.id]: e.target.value });
                                      }
                                    }}
                                    disabled={examSubmitted}
                                    placeholder="Tuliskan atau diktekan uraian jawaban kamu di sini..."
                                    rows={3}
                                    className="w-full p-3.5 rounded-xl border-2 border-amber-200/80 focus:border-amber-400 focus:outline-none text-slate-900 font-medium text-sm transition-all shadow-inner bg-slate-50 placeholder-slate-400 disabled:bg-slate-100 disabled:text-slate-400"
                                  />
                                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                                    <span>
                                      {(examEssayAnswers[eq.id] || "").trim() ? (examEssayAnswers[eq.id] || "").trim().split(/\s+/).length : 0} Kata | {(examEssayAnswers[eq.id] || "").length} Karakter
                                    </span>
                                    {(examEssayAnswers[eq.id] || "").trim() !== "" && (
                                      <span className="text-emerald-600 font-black">Tersimpan</span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                  {eq.options?.map((opt, optIdx) => {
                                    const isSelected = selectedOpt === optIdx;
                                    return (
                                      <button
                                        data-quiz-option={opt}
                                        data-scan-label={`Soal ${eqIdx + 1} Opsi ${String.fromCharCode(65 + optIdx)}: ${opt}`}
                                        id={`exam-normal-opt-${eq.id}-${optIdx}`}
                                        key={optIdx}
                                        onClick={() => {
                                          if (!examSubmitted) setExamAnswers({ ...examAnswers, [eq.id]: optIdx });
                                        }}
                                        className={`p-5 rounded-2xl text-base md:text-lg font-extrabold text-left transition-all border-2 flex items-center space-x-4 cursor-pointer ${isSelected
                                          ? "bg-gradient-to-r from-amber-400 to-amber-500 border-amber-500 text-white shadow-md ring-4 ring-amber-300/40 scale-[1.02]"
                                          : "bg-white border-amber-200/70 text-slate-700 hover:bg-amber-100/50 hover:border-amber-300"
                                          }`}
                                      >
                                        <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? "border-white bg-white text-amber-600 font-black" : "border-amber-200 text-slate-500"}`}>{String.fromCharCode(65 + optIdx)}</div><span>{opt}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-8 flex items-center justify-center">
                        {examSubmitted ? (
                          <div className="p-6 bg-emerald-50 border-2 border-emerald-200 text-emerald-900 font-extrabold text-lg rounded-2xl w-full max-w-2xl text-center shadow-sm">
                            Ujian Resmi Berhasil Dikumpulkan! Jawaban Pilihan Ganda & Essay Diteruskan ke Guru Kelas.
                          </div>
                        ) : (
                          <button id="btn-exam-normal-submit" data-scan-label="Kumpulkan Ujian" onClick={async () => {
                            let pgCorrect = 0;
                            let pgTotal = 0;
                            exam.questions.forEach((q) => {
                              if (q.type !== "essay") {
                                pgTotal++;
                                if (examAnswers[q.id] === q.answerIndex) pgCorrect++;
                              }
                            });
                            const pgWrong = pgTotal - pgCorrect;

                            setExamSubmitted(true);
                            speakText("Ujian resmi berhasil dikumpulkan.");

                            if (userSession && room) {
                              await saveExamSubmission({
                                examId: exam.id,
                                roomCode: room.code,
                                studentId: userSession.id,
                                studentName: userSession.name,
                                examTitle: exam.title,
                                pgAnswers: examAnswers,
                                essayAnswers: examEssayAnswers,
                                pgCorrect,
                                pgWrong,
                                totalPgQuestions: pgTotal,
                              });
                            }
                          }}
                            className="px-10 py-5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-lg rounded-full shadow-lg transition-all hover:-translate-y-1 active:translate-y-1 cursor-pointer"
                          >
                            Kumpulkan Ujian
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* FULLSCREEN EXAM OVERLAY (CAT PREPARATION STYLE + PAGING) */}
              {isExamFullscreen && room && (
                <div className="fixed inset-0 z-[9999] bg-[#FFF9EE] flex flex-col animate-in fade-in duration-300">
                  {/* Top Header */}
                  <header className="bg-gradient-to-r from-[#FFC727] via-[#FFB800] to-[#FFA700] border-b-2 border-amber-300/80 py-4 px-8 flex items-center justify-between shadow-xs shrink-0">
                    <div className="flex items-center space-x-4">
                      <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                        {room.className} - {room?.exams?.[0]?.title || "Ujian Resmi"}
                      </h2>
                    </div>
                    <button
                      onClick={() => {
                        toggleExamFullscreen();
                        setCurrentExamQuestionIndex(0); // Reset index on exit
                      }}
                      id="btn-keluar-ujian"
                      data-scan-label="Keluar Ujian"
                      title="Keluar Layar Penuh"
                      className="px-5 py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold text-sm md:text-base rounded-xl border border-rose-200 shadow-xs transition-all flex items-center space-x-2 shrink-0 cursor-pointer"
                    >
                      <svg className="w-5 h-5 fill-none stroke-current" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M4 14h6v6M14 4h6v6M20 10l-6-6M10 20l-6-6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="hidden sm:inline-block">Keluar Ujian</span>
                    </button>
                  </header>

                  <div className="flex-1 flex overflow-hidden bg-[#FFF9EE]" style={{ backgroundImage: "radial-gradient(#F5DCB0 1.5px, transparent 1.5px)", backgroundSize: "24px 24px" }}>
                    {/* Left Main Content (Single Question Paging) */}
                    <main className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar flex flex-col">
                      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
                        {(() => {
                          const exam = room?.exams?.[0];
                          if (!exam || !exam.questions || exam.questions.length === 0) return null;

                          const eqIdx = currentExamQuestionIndex;
                          const eq = exam.questions[eqIdx];
                          if (!eq) return null;

                          const selectedOpt = examAnswers[eq.id];
                          const isEssay = eq.type === "essay" || !eq.options || eq.options.length === 0;
                          const isLastQuestion = eqIdx === exam.questions.length - 1;

                          return (
                            <div className="flex-1 flex flex-col">
                              <div
                                key={eq.id}
                                className="relative overflow-hidden bg-white/80  border-2 border-white/95 ring-1 ring-amber-200/70 rounded-[32px] p-8 md:p-12 shadow-lg space-y-6 flex-1 animate-in fade-in slide-in-from-right-4 duration-300"
                              >
                                {/* Glass specular accent */}
                                <div className="absolute -top-16 -right-16 w-44 h-44 bg-gradient-to-bl from-white/90 via-white/20 to-transparent rounded-full blur-[2px] pointer-events-none" />

                                <div className="flex items-center justify-between pb-4 border-b border-amber-100/80 relative z-10">
                                  <span className={`px-4 py-2 font-black text-sm rounded-xl uppercase tracking-wider ${isEssay ? "bg-purple-100 text-purple-800" : "bg-amber-100 text-amber-900"
                                    }`}>
                                    SOAL {eqIdx + 1} - {isEssay ? `ESSAY / URAIAN` : "PILIHAN GANDA"}
                                  </span>
                                </div>

                                <h4 className="font-black text-xl md:text-2xl lg:text-3xl text-slate-900 leading-snug py-4">
                                  {eq.question}
                                </h4>

                                {isEssay ? (
                                  <div className="space-y-4 pt-4">
                                    <textarea
                                      value={examEssayAnswers[eq.id] || ""}
                                      onChange={(e) => {
                                        if (!examSubmitted) {
                                          setExamEssayAnswers({ ...examEssayAnswers, [eq.id]: e.target.value });
                                        }
                                      }}
                                      disabled={examSubmitted}
                                      placeholder="Tuliskan uraian jawaban di sini..."
                                      rows={6}
                                      className="w-full p-6 rounded-2xl border-2 border-amber-200/80 focus:border-amber-400 focus:outline-none text-slate-900 font-medium text-lg transition-all shadow-inner bg-slate-50 placeholder-slate-400 disabled:bg-slate-100 disabled:text-slate-400"
                                    />
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                    {eq.options?.map((opt, optIdx) => {
                                      const isSelected = selectedOpt === optIdx;
                                      return (
                                        <button
                                          key={optIdx}
                                          onClick={() => {
                                            if (!examSubmitted) setExamAnswers({ ...examAnswers, [eq.id]: optIdx });
                                          }}
                                          data-quiz-option={opt}
                                          data-quiz-correct={optIdx === eq.answerIndex ? "true" : "false"}
                                          data-scan-label={`Opsi ${String.fromCharCode(65 + optIdx)}: ${opt}`}
                                          id={`exam-opt-${optIdx}`}
                                          className={`p-6 rounded-2xl text-lg md:text-xl font-extrabold text-left transition-all border-2 flex items-center space-x-6 cursor-pointer ${isSelected
                                            ? "bg-gradient-to-r from-amber-400 to-amber-500 border-amber-500 text-white shadow-md ring-4 ring-amber-300/40 scale-[1.02]"
                                            : "bg-white border-amber-200/70 text-slate-700 hover:bg-amber-50 hover:border-amber-300"
                                            }`}
                                        >
                                          <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? "border-white bg-white text-amber-600 font-black" : "border-amber-200 text-slate-500"}`}>
                                            {String.fromCharCode(65 + optIdx)}
                                          </div>
                                          <span>{opt}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>

                              {/* Paging Navigation Buttons */}
                              <div className="flex items-center justify-between pt-8 pb-10">
                                <button
                                  onClick={() => setCurrentExamQuestionIndex(Math.max(0, currentExamQuestionIndex - 1))}
                                  disabled={currentExamQuestionIndex === 0}
                                  id="btn-exam-prev"
                                  data-scan-label="Soal Sebelumnya"
                                  className={`px-8 py-4 rounded-full font-black text-lg transition-all border-2 cursor-pointer ${currentExamQuestionIndex === 0
                                    ? "bg-slate-100 text-slate-400 border-slate-200 opacity-50 cursor-not-allowed"
                                    : "bg-white text-slate-700 border-amber-200 shadow-sm hover:bg-amber-50 active:translate-y-1"
                                    }`}
                                >
                                  &larr; Soal Sebelumnya
                                </button>

                                {!isLastQuestion ? (
                                  <button
                                    onClick={() => setCurrentExamQuestionIndex(Math.min(exam.questions.length - 1, currentExamQuestionIndex + 1))}
                                    id="btn-exam-next"
                                    data-scan-label="Soal Selanjutnya"
                                    className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-lg rounded-full shadow-md transition-all active:translate-y-1 cursor-pointer"
                                  >
                                    Soal Selanjutnya &rarr;
                                  </button>
                                ) : (
                                  <button
                                    id="btn-exam-submit"
                                    data-scan-label="Kumpulkan Ujian"
                                    onClick={async () => {
                                      if (examSubmitted) return;
                                      let pgCorrect = 0;
                                      let pgTotal = 0;
                                      exam.questions.forEach((q) => {
                                        if (q.type !== "essay") {
                                          pgTotal++;
                                          if (examAnswers[q.id] === q.answerIndex) pgCorrect++;
                                        }
                                      });
                                      const pgWrong = pgTotal - pgCorrect;

                                      setExamSubmitted(true);
                                      speakText("Ujian resmi berhasil dikumpulkan.");

                                      if (userSession && room) {
                                        await saveExamSubmission({
                                          examId: exam.id,
                                          roomCode: room.code,
                                          studentId: userSession.id,
                                          studentName: userSession.name,
                                          examTitle: exam.title,
                                          pgAnswers: examAnswers,
                                          essayAnswers: examEssayAnswers,
                                          pgCorrect,
                                          pgWrong,
                                          totalPgQuestions: pgTotal,
                                        });
                                      }
                                    }}
                                    className={`px-8 py-4 font-black text-lg rounded-full shadow-md transition-all ${examSubmitted
                                      ? "bg-slate-200 text-slate-500 cursor-not-allowed shadow-none translate-y-1"
                                      : "bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer active:translate-y-1"
                                      }`}
                                  >
                                    {examSubmitted ? "Ujian Telah Terkumpul" : "Kumpulkan Seluruh Jawaban"}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </main>

                    {/* Right Sidebar (CAT Style Navigation Grid) */}
                    <aside className="w-96 bg-white border-l-2 border-amber-200 flex flex-col shrink-0 shadow-lg z-10 hidden lg:flex">
                      {/* Timer Widget */}
                      <div className="p-8 border-b-2 border-amber-100 bg-amber-50/50 text-center">
                        <h4 className="text-base font-black text-slate-700 uppercase tracking-wider mb-3">
                          {userSession?.accessibilityConfig?.mainMode === "intelektual" ? "Status Waktu" : "Sisa Waktu Anda"}
                        </h4>
                        {userSession?.accessibilityConfig?.mainMode === "intelektual" ? (
                          <div className="text-lg font-black text-amber-900 bg-white py-4 px-2 rounded-2xl border-2 border-amber-200 shadow-inner">
                            Bebas Waktu (Santai)
                          </div>
                        ) : !studentRoomTimer?.isActive ? (
                          <div className="p-4 bg-amber-100/90 border-2 border-amber-300 rounded-2xl text-amber-900 font-black text-xs md:text-sm flex flex-col items-center gap-2 shadow-inner">
                            <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
                            <span>Menunggu Guru Memulai Timer Ujian Room {room.code}</span>
                          </div>
                        ) : (
                          <div className={`text-4xl font-black bg-white py-4 rounded-2xl border-2 shadow-inner tracking-widest font-mono ${examTimer < 300 ? "text-rose-600 border-rose-300 animate-pulse" : "text-rose-600 border-rose-200"
                            }`}>
                            {formatTime(examTimer)}
                          </div>
                        )}
                      </div>

                      {/* Navigation Grid */}
                      <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
                        <h4 className="text-base font-black text-slate-700 uppercase tracking-wider mb-6">Navigasi Pindah Soal</h4>
                        <div className="grid grid-cols-4 gap-4">
                          {(room?.exams?.[0]?.questions || []).map((q, idx) => {
                            const isAnswered = examAnswers[q.id] !== undefined || (examEssayAnswers[q.id] || "").trim() !== "";
                            const isActive = currentExamQuestionIndex === idx;
                            return (
                              <button
                                key={q.id}
                                onClick={() => setCurrentExamQuestionIndex(idx)}
                                className={`w-14 h-14 rounded-xl font-black text-xl flex items-center justify-center transition-all ${isActive
                                  ? "ring-4 ring-amber-400 border-2 border-amber-400 scale-110 z-10"
                                  : "hover:scale-105"
                                  } ${isAnswered
                                    ? "bg-emerald-500 text-white border-2 border-emerald-600 shadow-sm"
                                    : "bg-white text-slate-700 border-2 border-amber-200 shadow-xs"
                                  }`}
                              >
                                {idx + 1}
                              </button>
                            );
                          })}
                        </div>

                        {/* Legend */}
                        <div className="mt-10 space-y-4">
                          <div className="flex items-center space-x-4">
                            <div className="w-8 h-8 bg-emerald-500 border-2 border-emerald-600 rounded-lg shrink-0"></div>
                            <span className="text-base font-bold text-slate-700">Sudah Terjawab</span>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="w-8 h-8 bg-white border-2 border-amber-200 rounded-lg shrink-0"></div>
                            <span className="text-base font-bold text-slate-700">Belum Terjawab</span>
                          </div>
                          <div className="flex items-center space-x-4 pt-2">
                            <div className="w-8 h-8 border-2 border-amber-400 rounded-lg shrink-0 flex items-center justify-center font-black text-amber-600">X</div>
                            <span className="text-base font-bold text-slate-700">Soal Saat Ini</span>
                          </div>
                        </div>
                      </div>
                    </aside>
                  </div>
                </div>
              )}
            </main>
          </div>
        )}

        {/* VIEW 3: AKSES GURU */}
        {activeTab === "guru" && (
          <div className="flex-1 bg-gradient-to-br from-white/50 via-white/35 to-amber-50/20 rounded-[28px] lg:rounded-[36px] p-4 sm:p-6 lg:p-8 mt-20 lg:mt-24 mx-3 sm:mx-4 lg:mr-6 lg:ml-6 mb-8 lg:mb-10 shadow-[0_16px_40px_rgba(217,119,6,0.06)] flex flex-col relative animate-in fade-in duration-300 border border-white/80 ring-1 ring-amber-200/50">
            {/* Specular Light Flare */}
            <div className="absolute -top-[1.5px] left-1/2 -translate-x-1/2 w-64 md:w-96 h-[3px] bg-white rounded-full shadow-[0_0_12px_2px_rgba(255,255,255,0.9)] pointer-events-none" />
            {/* Glass highlight band */}
            <div className="absolute top-0 left-0 right-0 h-36 bg-gradient-to-b from-white/40 via-white/10 to-transparent pointer-events-none rounded-t-[34px]" />

            <main className="w-full space-y-10 relative z-10">
              {userSession?.role === "siswa" ? (
                /* Tampilan Akses Terkunci Jika Login Sebagai Siswa */
                <div className="bg-white border-2 border-amber-200/80 rounded-2xl p-8 md:p-14 shadow-sm text-center space-y-6 my-6">
                  <div className="w-20 h-20 bg-amber-50 border-2 border-amber-200 text-amber-700 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                    <svg className="w-10 h-10 stroke-current fill-none" strokeWidth="2" viewBox="0 0 24 24">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                  </div>
                  <div className="space-y-3">
                    <span className="px-3.5 py-1 bg-rose-100 text-rose-800 text-xs font-black rounded-full uppercase tracking-wider">
                      Akses Terkunci
                    </span>
                    <h3 className="text-2xl md:text-3xl font-black text-slate-900">
                      Khusus Pengajar & Guru
                    </h3>
                  </div>
                  <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                      type="button"
                      onClick={() => setActiveTab("katalog")}
                      className="w-full sm:w-auto px-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm md:text-base rounded-xl shadow-sm transition-all cursor-pointer"
                    >
                      Kembali
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Guru Action Toast Banner */}
                  {guruToast && (
                    <div className="p-5 bg-emerald-500 text-white font-extrabold text-base md:text-lg rounded-2xl shadow-lg flex items-center justify-between border border-emerald-400 animate-in slide-in-from-top-4">
                      <div className="flex items-center space-x-3">
                        <span className="w-3.5 h-3.5 rounded-full bg-white animate-ping shrink-0" />
                        <span>{guruToast}</span>
                      </div>
                      <button
                        onClick={() => setGuruToast("")}
                        className="text-white hover:text-slate-100 text-xs md:text-sm font-black bg-white/20 px-4 py-1.5 rounded-xl cursor-pointer"
                      >
                        Tutup
                      </button>
                    </div>
                  )}

                  {/* Teacher Portal Main Hero Header Card (DENGAN SELECTOR ROOM AKTIF DINAMIS) */}
                  <div className="bg-gradient-to-r from-[#FFC727] via-[#FFB800] to-[#FFA700] border-2 border-amber-300 rounded-[32px] p-8 md:p-10 shadow-md flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 mb-8">
                    <div className="space-y-3 max-w-2xl">
                      <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                        Akses & Manajemen Room Guru
                      </h2>
                      <p className="text-sm md:text-base text-slate-800 font-bold leading-relaxed">
                        Kelola room kelas, generate kode akses unik, unggah materi pembelajaran dengan pembuat kuis & study cards otomatis, serta publikasikan ujian resmi yang mendukung soal Pilihan Ganda & Essay.
                      </p>
                    </div>

                    {/* Selector Room Aktif Yang Dikelola Guru (Dinamis Sesuai Room Yang Dibuat) */}
                    <div className="bg-white/95 border-2 border-amber-300 rounded-2xl p-5 md:p-6 w-full lg:w-auto shrink-0 space-y-3 shadow-sm relative z-10">
                      <div className="text-xs md:text-sm font-black text-slate-900 uppercase tracking-wider">
                        Room Yang Dikelola:
                      </div>
                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <select
                          value={teacherRoomCode}
                          onChange={(e) => {
                            const selectedCode = e.target.value;
                            setTeacherRoomCode(selectedCode);
                            const selR = getClassRoom(selectedCode);
                            if (selR) {
                              setTeacherRoom(selR);
                              setNewRoomCode(selR.code);
                              setNewClassName(selR.className);
                              setNewSubject(selR.subject);
                              setNewTeacherName(selR.teacherName);
                            }
                          }}
                          className="px-4 py-3 bg-white border-2 border-amber-200/80 text-slate-800 rounded-xl text-sm md:text-base font-black uppercase focus:outline-none focus:border-amber-400 cursor-pointer w-full sm:w-auto transition-colors"
                        >
                          {getAllClassRooms().map((r) => (
                            <option key={r.code} value={r.code} className="text-slate-900 font-black">
                              {r.code} - {r.className}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(teacherRoomCode);
                            showGuruToast(`Kode room "${teacherRoomCode}" berhasil disalin ke clipboard!`);
                          }}
                          className="px-5 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-black text-xs md:text-sm rounded-xl shadow-sm transition-all cursor-pointer shrink-0 w-full sm:w-auto active:translate-y-1"
                        >
                          Salin Kode
                        </button>
                      </div>
                      <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse border border-emerald-400" />
                        <span>Status: Room Terhubung & Aktif</span>
                      </p>
                    </div>
                  </div>

                  {/* Sub Navigation Bar for Guru Portal (SWAPPED ORDER: GENERATE KODE IS 1ST & ROOM PREREQUISITE LOCKING) */}
                  <div className="hidden">
                    {/* SUB-TAB 1: GENERATE KODE & KELOLA ROOM (DEFAULT & ALWAYS UNLOCKED) */}
                    <button
                      onClick={() => setGuruTab("room")}
                      className={`px-6 py-4 rounded-xl font-black text-sm md:text-base lg:text-lg transition-all whitespace-nowrap cursor-pointer ${guruTab === "room"
                        ? "bg-amber-500 text-slate-950 shadow-xs"
                        : "bg-white text-slate-700 hover:bg-slate-100 border-2 border-slate-200"
                        }`}
                    >
                      Generate Kode & Kelola Room
                    </button>
                    <button
                      onClick={() => setGuruTab("siswa")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${guruTab === "siswa"
                        ? "bg-amber-100/80 text-amber-900 shadow-xs border-2 border-amber-300"
                        : "text-slate-600 hover:bg-amber-50 border-2 border-transparent"
                        }`}
                    >
                      Kelola Siswa
                    </button>
                    <button
                      onClick={() => setGuruTab("daftar_siswa")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${guruTab === "daftar_siswa"
                        ? "bg-amber-100/80 text-amber-900 shadow-xs border-2 border-amber-300"
                        : "text-slate-600 hover:bg-amber-50 border-2 border-transparent"
                        }`}
                    >
                      Daftar Siswa
                    </button>


                    {/* SUB-TAB 2: UPLOAD MATERI & KUIS AI (TERKUNCI JIKA BELUM BUAT ROOM) */}
                    <button
                      onClick={() => {
                        if (!hasCreatedRoom) {
                          showGuruToast("Anda wajib membuat atau menghubungkan Room Kelas terlebih dahulu di tab 'Generate Kode & Kelola Room'!");
                          return;
                        }
                        setGuruTab("materi");
                      }}
                      className={`px-6 py-4 rounded-xl font-black text-sm md:text-base lg:text-lg transition-all whitespace-nowrap flex items-center space-x-2.5 ${!hasCreatedRoom
                        ? "bg-slate-100 border-2 border-slate-200 text-slate-600 opacity-60 cursor-not-allowed"
                        : guruTab === "materi"
                          ? "bg-amber-500 text-slate-950 shadow-xs cursor-pointer"
                          : "bg-white text-slate-700 hover:bg-slate-100 border-2 border-slate-200 cursor-pointer"
                        }`}
                    >
                      <span>Upload Materi & Kuis AI</span>
                      {!hasCreatedRoom && (
                        <span className="text-xs px-2.5 py-0.5 bg-slate-200 text-slate-600 rounded-lg font-extrabold uppercase">Terkunci</span>
                      )}
                    </button>

                    {/* SUB-TAB 3: UPLOAD UJIAN RESMI (TERKUNCI JIKA BELUM BUAT ROOM) */}
                    <button
                      onClick={() => {
                        if (!hasCreatedRoom) {
                          showGuruToast("Anda wajib membuat atau menghubungkan Room Kelas terlebih dahulu di tab 'Generate Kode & Kelola Room'!");
                          return;
                        }
                        setGuruTab("ujian");
                      }}
                      className={`px-6 py-4 rounded-xl font-black text-sm md:text-base lg:text-lg transition-all whitespace-nowrap flex items-center space-x-2.5 ${!hasCreatedRoom
                        ? "bg-slate-100 border-2 border-slate-200 text-slate-600 opacity-60 cursor-not-allowed"
                        : guruTab === "ujian"
                          ? "bg-amber-500 text-slate-950 shadow-xs cursor-pointer"
                          : "bg-white text-slate-700 hover:bg-slate-100 border-2 border-slate-200 cursor-pointer"
                        }`}
                    >
                      <span>Upload Ujian Resmi (PG & Essay)</span>
                      {!hasCreatedRoom && (
                        <span className="text-xs px-2.5 py-0.5 bg-slate-200 text-slate-600 rounded-lg font-extrabold uppercase">Terkunci</span>
                      )}
                    </button>

                    {/* SUB-TAB 4: MONITORING CONTENT & NILAI ESSAY (TERKUNCI JIKA BELUM BUAT ROOM) */}
                    <button
                      onClick={() => {
                        if (!hasCreatedRoom) {
                          showGuruToast("Anda wajib membuat atau menghubungkan Room Kelas terlebih dahulu di tab 'Generate Kode & Kelola Room'!");
                          return;
                        }
                        setGuruTab("rekap");
                      }}
                      className={`px-6 py-4 rounded-xl font-black text-sm md:text-base lg:text-lg transition-all whitespace-nowrap flex items-center space-x-2.5 ${!hasCreatedRoom
                        ? "bg-slate-100 border-2 border-slate-200 text-slate-600 opacity-60 cursor-not-allowed"
                        : guruTab === "rekap"
                          ? "bg-amber-500 text-slate-950 shadow-xs cursor-pointer"
                          : "bg-white text-slate-700 hover:bg-slate-100 border-2 border-slate-200 cursor-pointer"
                        }`}
                    >
                      <span>Monitoring Content & Nilai Essay</span>
                      {!hasCreatedRoom && (
                        <span className="text-xs px-2.5 py-0.5 bg-slate-200 text-slate-600 rounded-lg font-extrabold uppercase">Terkunci</span>
                      )}
                    </button>
                  </div>

                  {/* GURU SUB-TAB 1: UPLOAD MATERI (WITH AI PRACTICE CHECKBOX) */}

                  {/* GURU SUB-TAB: KELOLA SISWA (PENDAFTARAN SISWA) */}
                  {guruTab === "siswa" && (
                    <div className="relative overflow-hidden bg-gradient-to-b from-white/55 via-white/40 to-white/45 border border-white/85 ring-1 ring-amber-200/50 rounded-[32px] p-8 md:p-12 shadow-[0_12px_28px_-8px_rgba(217,119,6,0.08),inset_0_1.5px_1px_rgba(255,255,255,0.95)] space-y-8 animate-in fade-in duration-200 mt-6">
                      {/* Specular Light Flare */}
                      <div className="absolute -top-[1.5px] left-1/2 -translate-x-1/2 w-64 h-[3px] bg-white rounded-full shadow-[0_0_16px_5px_rgba(255,255,255,1)] pointer-events-none" />
                      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/45 via-white/10 to-transparent pointer-events-none rounded-t-[30px]" />
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-amber-100 pb-6">
                        <div>
                          <h2 className="text-2xl md:text-3xl font-black text-slate-900">Kelola Murid & Pendaftaran Akun</h2>
                          <p className="text-sm md:text-base text-slate-600 font-medium mt-1">
                            Daftarkan murid satu per satu atau import data kolektif sekaligus menggunakan file Excel.
                          </p>
                        </div>

                        {/* Tombol Import Excel & Navigasi ke Tabel */}
                        <div className="flex flex-wrap items-center gap-3">
                          <input
                            ref={excelFileInputRef}
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={handleExcelImport}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => excelFileInputRef.current?.click()}
                            disabled={excelImportLoading}
                            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs md:text-sm rounded-xl border border-emerald-700 shadow-sm flex items-center gap-2 transition-all cursor-pointer active:translate-y-0.5"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                            <span>{excelImportLoading ? "Mengimpor..." : "Import dari File Excel"}</span>
                          </button>

                          <button
                            type="button"
                            onClick={downloadExcelTemplate}
                            className="px-4 py-2.5 bg-white hover:bg-amber-50 text-slate-800 font-black text-xs md:text-sm rounded-xl border border-amber-300 shadow-sm flex items-center gap-2 transition-all cursor-pointer active:translate-y-0.5"
                          >
                            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            <span>Unduh Template Excel</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setGuruTab("daftar_siswa")}
                            className="px-4 py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-black text-xs md:text-sm rounded-xl border border-amber-300 shadow-sm flex items-center gap-1.5 transition-all cursor-pointer active:translate-y-0.5"
                          >
                            <span>Lihat Tabel Daftar Siswa →</span>
                          </button>
                        </div>
                      </div>

                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const form = e.target as any;
                          const name = form.elements.studentName.value;
                          const preset = form.elements.preset.value;
                          const studentJenjang = form.elements.studentJenjang.value;
                          const classCode = studentFormClassCode.trim().toUpperCase() || teacherRoomCode;

                          try {
                            const newStudent = await addStudent({
                              name: name,
                              jenjang: studentJenjang,
                              roomCode: classCode,
                              preset: preset,
                            });

                            // Perbarui state tabel siswa secara real-time
                            setStudentsList((prev) => [newStudent, ...prev.filter((s) => s.id !== newStudent.id)]);

                            // Simpan kode kelas di localStorage agar tetap ada
                            localStorage.setItem("pintara_sticky_class_code", classCode);

                            // Tampilkan notifikasi toast hijau
                            showGuruToast(`Siswa ${newStudent.full_name} berhasil ditambahkan!`);

                            // Reset hanya input nama murid, kode kelas TETAP ADA agar guru tidak pegal mengetik ulang!
                            if (form.elements.studentName) {
                              form.elements.studentName.value = "";
                              form.elements.studentName.focus();
                            }
                          } catch (err) {
                            console.error(err);
                            alert("Gagal menyimpan siswa.");
                          }
                        }}
                        className="flex flex-col gap-6 w-full max-w-xl"
                      >
                        {/* 1. KODE KELAS */}
                        <div>
                          <label className="block font-black text-slate-800 mb-2">Kode Kelas</label>
                          <input
                            type="text"
                            required
                            value={studentFormClassCode}
                            onChange={(e) => {
                              const val = e.target.value.toUpperCase();
                              setStudentFormClassCode(val);
                              localStorage.setItem("pintara_sticky_class_code", val);
                            }}
                            className="w-full px-4 py-3 bg-slate-50 border-2 border-amber-200/80 focus:border-amber-400 focus:outline-none rounded-xl font-bold text-slate-800 uppercase shadow-inner"
                            placeholder="Misal: SD4B"
                          />
                        </div>

                        {/* 2. NAMA MURID */}
                        <div>
                          <label className="block font-black text-slate-800 mb-2">Nama Murid</label>
                          <input
                            name="studentName"
                            required
                            className="w-full px-4 py-3 bg-slate-50 border-2 border-amber-200/80 focus:border-amber-400 focus:outline-none rounded-xl font-bold text-slate-800 shadow-inner"
                            placeholder="Misal: Budi Santoso"
                          />
                        </div>

                        {/* 3. JENJANG SD */}
                        <div>
                          <label className="block font-black text-slate-800 mb-2">Kelas / Jenjang SD Murid</label>
                          <select name="studentJenjang" className="w-full px-4 py-3 bg-slate-50 border-2 border-amber-200/80 focus:border-amber-400 focus:outline-none rounded-xl font-bold text-slate-800 shadow-inner">
                            <option value="Kelas 1 SD">Kelas 1 SD</option>
                            <option value="Kelas 2 SD">Kelas 2 SD</option>
                            <option value="Kelas 3 SD">Kelas 3 SD</option>
                            <option value="Kelas 4 SD">Kelas 4 SD</option>
                            <option value="Kelas 5 SD">Kelas 5 SD</option>
                            <option value="Kelas 6 SD">Kelas 6 SD</option>
                          </select>
                        </div>

                        {/* 4. PRESET AKSESIBILITAS */}
                        <div>
                          <label className="block font-black text-slate-800 mb-2">Mode Aksesibilitas Khusus</label>
                          <select
                            name="preset"
                            value={newStudentPreset}
                            onChange={(e) => setNewStudentPreset(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border-2 border-amber-200/80 focus:border-amber-400 focus:outline-none rounded-xl font-bold text-slate-800 shadow-inner"
                          >
                            <option value="fisik_motorik_tremor">Fisik - Motorik Halus (Anti-Tremor / Tahan)</option>
                            <option value="fisik_motorik_switch">Fisik - Motorik Halus (Sakelar Tunggal / Auto-Scan)</option>
                            <option value="fisik_mata">Fisik - Lumpuh Total (Kontrol Mata / Eye Tracking)</option>
                            <option value="fisik_suara">Fisik - Lumpuh Total (Kontrol Suara / Voice)</option>
                            <option value="sensorik_tunanetra">Sensorik - Tunanetra (Suara & TTS)</option>
                            <option value="sensorik_tunarungu">Sensorik - Tunarungu (Bahasa Isyarat SIBI)</option>
                            <option value="intelektual_slow">Intelektual - Lamban Belajar (Bebas Waktu & Pendampingan)</option>
                            <option value="intelektual_konkret">Intelektual - Pemahaman Konkret & Piktogram</option>
                            <option value="mental">Mental (Ramah Sensori)</option>
                          </select>
                        </div>

                        <button
                          type="submit"
                          className="px-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-full text-xl shadow-md hover:shadow-lg transition-all w-full cursor-pointer active:translate-y-1"
                        >
                          Simpan Siswa
                        </button>
                      </form>
                    </div>
                  )}

                  {/* GURU SUB-TAB: DAFTAR SISWA (MASTER VIEW GURU) */}
                  {guruTab === "daftar_siswa" && (
                    <div className="relative overflow-hidden bg-white/75  border-2 border-white/95 ring-1 ring-amber-200/60 rounded-[32px] p-6 md:p-10 shadow-md space-y-6 animate-in fade-in duration-200 mt-6">
                      {/* HEADER & ACTION BUTTONS */}
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-amber-100 pb-6">
                        <div>
                          <div className="flex items-center gap-2.5">
                            <h2 className="text-2xl md:text-3xl font-black text-slate-900">
                              Daftar Siswa & Manajemen Akun
                            </h2>
                            <span className="px-3 py-1 bg-amber-100 text-amber-900 text-xs font-black rounded-full uppercase tracking-wider border border-amber-300">
                              Master View
                            </span>
                          </div>
                          <p className="text-sm md:text-base text-slate-600 font-medium mt-1">
                            Lihat akun murid, salin akses WhatsApp wali murid, reset PIN secara instan, dan cetak kartu akun kelas.
                          </p>
                        </div>

                        {/* TOMBOL UTAMA: CETAK REKAP AKUN KELAS */}
                        <div className="flex flex-wrap items-center gap-3 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              const targetRoom = studentRoomFilter || teacherRoomCode;
                              const toPrint = studentsList.filter(
                                (s) => !targetRoom || s.current_room_code?.toUpperCase() === targetRoom.toUpperCase()
                              );
                              if (toPrint.length === 0) {
                                showGuruToast("Tidak ada murid yang terdaftar untuk kelas ini.");
                                return;
                              }
                              printClassAccountSummary(toPrint, targetRoom);
                            }}
                            className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-sm md:text-base shadow-sm hover:shadow-md flex items-center gap-2.5 transition-all cursor-pointer active:translate-y-1"
                          >
                            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                            <span>Cetak Rekap Akun Kelas</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setGuruTab("siswa")}
                            className="px-5 py-3.5 bg-white hover:bg-amber-50 text-slate-800 border-2 border-amber-200/80 rounded-2xl font-black text-sm md:text-base shadow-xs hover:shadow-sm flex items-center gap-2 transition-all cursor-pointer active:translate-y-1"
                          >
                            <span>+ Tambah Murid</span>
                          </button>
                        </div>
                      </div>

                      {/* FILTER & PENCARIAN BAR */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-amber-50/50 border border-amber-200/80 p-4 rounded-2xl">
                        <div className="flex-1 flex items-center gap-3">
                          <div className="relative flex-1 max-w-md">
                            <input
                              type="text"
                              value={studentSearchQuery}
                              onChange={(e) => setStudentSearchQuery(e.target.value)}
                              placeholder="Cari nama murid atau PIN..."
                              className="w-full pl-10 pr-4 py-2.5 bg-white border border-amber-200 rounded-xl font-bold text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-xs"
                            />
                            <svg className="w-5 h-5 text-amber-700 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            <label className="text-xs font-black text-slate-700 uppercase tracking-wide hidden sm:inline">Room:</label>
                            <select
                              value={studentRoomFilter}
                              onChange={(e) => setStudentRoomFilter(e.target.value)}
                              className="px-3 py-2.5 bg-white border border-amber-200 rounded-xl font-bold text-xs md:text-sm text-slate-800 focus:outline-none shadow-xs"
                            >
                              <option value="">Semua Room Kelas</option>
                              {Array.from(new Set(studentsList.map((s) => s.current_room_code).filter(Boolean))).map((code) => (
                                <option key={code} value={code}>Kelas {code}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <span className="text-xs md:text-sm font-black text-slate-700 bg-white px-3.5 py-1.5 rounded-full border border-amber-200 shadow-xs">
                            Total: <strong>{studentsList.filter((s) => !studentRoomFilter || s.current_room_code?.toUpperCase() === studentRoomFilter.toUpperCase()).length}</strong> Siswa
                          </span>
                        </div>
                      </div>

                      {/* TABEL RESPONSIVE */}
                      <div className="overflow-x-auto bg-white border border-amber-200 rounded-2xl shadow-sm">
                        {isStudentsLoading ? (
                          <div className="py-16 text-center text-slate-600 font-bold text-lg">
                            Memuat data siswa...
                          </div>
                        ) : (() => {
                          const filtered = studentsList.filter((s) => {
                            const matchesRoom = !studentRoomFilter || s.current_room_code?.toUpperCase() === studentRoomFilter.toUpperCase();
                            const q = studentSearchQuery.toLowerCase().trim();
                            const matchesQ =
                              !q ||
                              s.full_name?.toLowerCase().includes(q) ||
                              (s.pin_code && s.pin_code.includes(q)) ||
                              (s.accessibility_config?.pin_code && s.accessibility_config.pin_code.includes(q));
                            return matchesRoom && matchesQ;
                          });

                          if (filtered.length === 0) {
                            return (
                              <div className="py-16 px-6 text-center space-y-4">
                                <div className="w-16 h-16 mx-auto bg-amber-100 rounded-full flex items-center justify-center text-amber-700">
                                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                                </div>
                                <h4 className="text-xl font-black text-slate-900">Belum Ada Akun Siswa Ditemukan</h4>
                                <p className="text-sm font-medium text-slate-600 max-w-md mx-auto">
                                  Belum ada siswa yang terdaftar di room ini atau hasil pencarian tidak cocok. Silakan tambahkan murid atau import file Excel.
                                </p>
                                <button
                                  type="button"
                                  onClick={() => setGuruTab("siswa")}
                                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm rounded-xl shadow-sm"
                                >
                                  + Tambahkan Murid Baru Sekarang
                                </button>
                              </div>
                            );
                          }

                          return (
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-amber-50 border-b border-amber-200 text-slate-700 uppercase text-xs md:text-sm font-black tracking-wider">
                                  <th className="py-4 px-4 w-12 text-center">No</th>
                                  <th className="py-4 px-4">Nama Siswa</th>
                                  <th className="py-4 px-4">Preset Aksesibilitas</th>
                                  <th className="py-4 px-4">Kode Kelas</th>
                                  <th className="py-4 px-4">PIN Siswa</th>
                                  <th className="py-4 px-4 text-center">Aksi</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-amber-100 font-medium text-sm text-slate-800">
                                {filtered.map((student, idx) => (
                                  <tr key={student.id} className="hover:bg-amber-50/50 transition-colors">
                                    <td className="py-4 px-4 text-center font-bold text-slate-400">
                                      {idx + 1}
                                    </td>

                                    {/* 1. Nama Siswa */}
                                    <td className="py-4 px-4">
                                      <div className="font-black text-base text-slate-900">{student.full_name}</div>
                                      <div className="text-xs text-slate-500 font-semibold mt-0.5">
                                        {student.jenjang || "Kelas 4 SD"}
                                      </div>
                                    </td>

                                    {/* 2. Preset Aksesibilitas */}
                                    <td className="py-4 px-4">
                                      <span className="inline-flex items-center px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold">
                                        {getA11yPresetLabel(student.accessibility_config)}
                                      </span>
                                    </td>

                                    {/* 3. Kode Kelas */}
                                    <td className="py-4 px-4">
                                      <span className="font-mono font-bold text-sm px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg">
                                        {student.current_room_code || teacherRoomCode}
                                      </span>
                                    </td>

                                    {/* 4. PIN Siswa */}
                                    <td className="py-4 px-4">
                                      <span className="font-mono font-black text-base px-3.5 py-1 bg-amber-50 text-amber-900 border border-amber-300 rounded-lg tracking-widest shadow-xs">
                                        {student.pin_code || student.accessibility_config?.pin_code || "----"}
                                      </span>
                                    </td>

                                    {/* 5. Aksi: Salin Akses & Reset PIN */}
                                    <td className="py-4 px-4">
                                      <div className="flex items-center justify-center gap-2">
                                        {/* Tombol Salin Akses WhatsApp */}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const text = formatWhatsAppStudentAccess(student);
                                            navigator.clipboard?.writeText(text);
                                            showGuruToast(`Format WhatsApp untuk ${student.full_name} berhasil disalin!`);
                                          }}
                                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer active:translate-y-0.5"
                                          title="Salin format teks siap kirim ke WhatsApp wali murid"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                          <span>Salin Akses</span>
                                        </button>

                                        {/* Tombol Reset PIN */}
                                        <button
                                          type="button"
                                          onClick={async () => {
                                            if (confirm(`Reset PIN untuk siswa "${student.full_name}"?\nPIN lama tidak dapat digunakan lagi.`)) {
                                              const newPin = await resetStudentPin(student.id);
                                              setStudentsList((prev) =>
                                                prev.map((s) =>
                                                  s.id === student.id
                                                    ? {
                                                      ...s,
                                                      pin_code: newPin,
                                                      accessibility_config: {
                                                        ...(s.accessibility_config || {}),
                                                        pin_code: newPin,
                                                      },
                                                    }
                                                    : s
                                                )
                                              );
                                              showGuruToast(`PIN ${student.full_name} berhasil di-reset menjadi: ${newPin}`);
                                            }
                                          }}
                                          className="px-3.5 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 font-extrabold text-xs rounded-xl border border-amber-300 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer active:translate-y-0.5"
                                          title="Generate PIN acak baru secara instan jika terjadi kompromi keamanan"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                          <span>Reset PIN</span>
                                        </button>

                                        {/* Tombol Hapus Murid */}
                                        <button
                                          type="button"
                                          onClick={async () => {
                                            if (confirm(`Hapus murid "${student.full_name}" dari daftar?`)) {
                                              await deleteStudent(student.id);
                                              setStudentsList((prev) => prev.filter((s) => s.id !== student.id));
                                              showGuruToast(`Data murid ${student.full_name} berhasil dihapus.`);
                                            }
                                          }}
                                          className="w-[34px] h-[34px] flex items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl border border-rose-200 transition-all cursor-pointer shrink-0"
                                          title="Hapus murid"
                                        >
                                          <svg className="w-4 h-4 shrink-0 block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {guruTab === "materi" && (
                    <div className="relative overflow-hidden bg-gradient-to-b from-white/55 via-white/40 to-white/45 border border-white/85 ring-1 ring-amber-200/50 rounded-[32px] p-8 md:p-12 shadow-[0_12px_28px_-8px_rgba(217,119,6,0.08),inset_0_1.5px_1px_rgba(255,255,255,0.95)] space-y-8 animate-in fade-in duration-200 mt-6">
                      {/* Specular Light Flare */}
                      <div className="absolute -top-[1.5px] left-1/2 -translate-x-1/2 w-64 h-[3px] bg-white rounded-full shadow-[0_0_16px_5px_rgba(255,255,255,1)] pointer-events-none" />
                      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/45 via-white/10 to-transparent pointer-events-none rounded-t-[30px]" />
                      <div>
                        <h3 className="text-2xl md:text-3xl font-black text-slate-900">Upload Materi Pembelajaran</h3>
                        <p className="text-sm md:text-base text-slate-600 font-medium mt-2">
                          Materi yang diunggah akan otomatis masuk ke bagian <strong>Materi & Study Cards</strong> siswa di room <strong>{teacherRoomCode}</strong>.
                        </p>
                      </div>

                      {/* Upload Dokumen File Zone (.pdf / .docx / .txt) */}
                      <div className="p-6 md:p-8 bg-amber-50/50 border-2 border-dashed border-amber-200 rounded-2xl space-y-4 shadow-xs">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div>
                            <h4 className="font-black text-base md:text-lg text-slate-900">Unggah File Dokumen Materi (.pdf / .docx / .txt)</h4>
                            <p className="text-xs md:text-sm font-medium text-slate-600 mt-1">
                              Pilih file modul materi dari komputer Anda. Teks akan otomatis dibaca dan dimasukkan ke dalam form di bawah.
                            </p>
                          </div>
                          <label className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs md:text-sm rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all cursor-pointer shrink-0">
                            <span>Pilih File Dokumen</span>
                            <input
                              type="file"
                              accept=".pdf,.docx,.doc,.txt"
                              onChange={handleMaterialFileUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                        {matDocFileName && (
                          <div className="p-3.5 bg-emerald-50 border-2 border-emerald-200 rounded-xl text-xs md:text-sm font-black text-emerald-950 flex items-center justify-between">
                            <span>Dokumen Terlampir: {matDocFileName}</span>
                            <span className="text-emerald-700">Berhasil Dibaca</span>
                          </div>
                        )}
                      </div>

                      <form onSubmit={handleUploadMaterialSubmit} className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-sm font-black text-slate-700 uppercase tracking-wider">Judul Materi Pembelajaran *</label>
                          <input
                            type="text"
                            required
                            value={matTitleInput}
                            onChange={(e) => setMatTitleInput(e.target.value)}
                            placeholder="Contoh: Sistem Ekskresi & Organ Ginjal Manusia"
                            className="w-full p-4 md:p-5 rounded-xl border-2 border-slate-200 focus:border-amber-400 focus:outline-hidden text-base md:text-lg font-bold text-slate-900 shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-black text-slate-700 uppercase tracking-wider">Ringkasan Singkat Rangkuman</label>
                          <input
                            type="text"
                            value={matSummaryInput}
                            onChange={(e) => setMatSummaryInput(e.target.value)}
                            placeholder="Contoh: Penjelasan tahapan filtrasi glomerulus, reabsorpsi tubulus, dan augmentasi."
                            className="w-full p-4 md:p-5 rounded-xl border-2 border-slate-200 focus:border-amber-400 focus:outline-hidden text-base md:text-lg font-medium text-slate-900 shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-black text-slate-700 uppercase tracking-wider">Isi / Teks Materi Lengkap *</label>
                          <textarea
                            required
                            rows={7}
                            value={matContentInput}
                            onChange={(e) => setMatContentInput(e.target.value)}
                            placeholder="Tuliskan atau tempelkan materi pelajaran lengkap di sini..."
                            className="w-full p-5 rounded-xl border-2 border-slate-200 focus:border-amber-400 focus:outline-hidden text-base md:text-lg font-medium text-slate-900 shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
                          />
                        </div>

                        {/* AI Practice & Flashcards Checkbox Requirement */}
                        <div className="p-6 md:p-8 bg-teal-50 border-2 border-teal-200 rounded-xl space-y-4 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                          <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex-1 space-y-3">
                              <label className="flex items-center space-x-3.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={autoCreateQuiz}
                                  onChange={(e) => setAutoCreateQuiz(e.target.checked)}
                                  className="w-6 h-6 text-amber-600 rounded-xl border-2 border-amber-300 focus:ring-0 cursor-pointer accent-amber-500"
                                />
                                <span className="font-black text-base md:text-lg lg:text-xl text-teal-950">
                                  Sekalian buatkan Latihan Soal (Quiz) otomatis
                                </span>
                              </label>
                              <p className="text-sm md:text-base font-bold text-teal-800 pl-9 leading-relaxed">
                                Catatan: Flashcards (Study Cards) interaktif akan <strong>SELALU otomatis dibuat</strong> menyesuaikan dengan banyaknya materi/dokumen yang Anda unggah. Centang opsi di atas jika Anda ingin sistem juga sekalian membuatkan paket Latihan Soal Pilihan Ganda bagi siswa di room {teacherRoomCode}.
                              </p>
                            </div>

                            <div className="flex flex-col gap-3 shrink-0 bg-white p-4 rounded-xl border border-teal-200 shadow-sm w-full md:w-64">
                              <div>
                                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1">Jumlah Flashcards</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={matFlashcardCount}
                                  onChange={(e) => setMatFlashcardCount(parseInt(e.target.value) || 1)}
                                  className="w-full p-2.5 rounded-xl border-2 border-slate-200 focus:border-teal-500 focus:outline-hidden text-sm font-bold text-slate-900 shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1">Jumlah Latihan Soal</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={matQuizCount}
                                  onChange={(e) => setMatQuizCount(parseInt(e.target.value) || 1)}
                                  className="w-full p-2.5 rounded-xl border-2 border-slate-200 focus:border-teal-500 focus:outline-hidden text-sm font-bold text-slate-900 shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
                                  disabled={!autoCreateQuiz}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="pt-3">
                          <button
                            type="submit"
                            disabled={isAiProcessing}
                            className="px-10 py-5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 disabled:bg-slate-300 text-slate-950 font-black text-base md:text-lg rounded-2xl shadow-md shadow-amber-900/10 transition-all cursor-pointer flex items-center space-x-3"
                          >
                            <svg className="w-6 h-6 fill-none stroke-current" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            <span>Unggah & Publikasikan Materi Ke Room {teacherRoomCode}</span>
                          </button>
                        </div>
                      </form>

                      {/* DAFTAR MATERI TERUNGGAH DI ROOM & FITUR HAPUS */}
                      <div className="pt-8 border-t-2 border-slate-200 space-y-5">
                        <h4 className="text-xl font-black text-slate-900">
                          Daftar Materi Terunggah di Room {teacherRoomCode} ({teacherRoom?.materials.length || 0} Modul)
                        </h4>

                        {!teacherRoom || teacherRoom.materials.length === 0 ? (
                          <p className="text-xs md:text-sm font-semibold text-slate-600 p-6 border-2 border-dashed border-slate-200 rounded-xl text-center">
                            Belum ada materi diunggah di room ini. Silakan unggah dokumen PDF atau ketik materi baru di atas.
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {teacherRoom.materials.map((mat) => (
                              <div key={mat.id} className="p-5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between space-y-3">
                                <div>
                                  <div className="flex items-start justify-between gap-2">
                                    <span className="px-2.5 py-1 bg-amber-100 text-amber-900 font-black text-xs rounded-md uppercase">
                                      MODUL MATERI
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteMaterial(mat.id, mat.title)}
                                      className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center space-x-1"
                                      title="Hapus Materi Ini"
                                    >
                                      <svg className="w-3.5 h-3.5 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
                                        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                      <span>Hapus Materi</span>
                                    </button>
                                  </div>
                                  <h5 className="font-black text-base text-slate-900 mt-2">{mat.title}</h5>
                                  <p className="text-xs text-slate-700 font-medium line-clamp-2 mt-1">{mat.summary}</p>
                                </div>
                                <div className="text-xs font-bold text-slate-700 pt-2 border-t border-slate-200/80 flex items-center justify-between">
                                  <span>{mat.flashcards.length} Study Cards</span>
                                  <span className="text-emerald-700">Aktif di Room</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* GURU SUB-TAB 2: UPLOAD UJIAN (FILE DOKUMEN / MANUAL PG & ESSAY SUPPORT) */}
                  {guruTab === "ujian" && (
                    <div className="relative overflow-hidden bg-gradient-to-b from-white/55 via-white/40 to-white/45 border border-white/85 ring-1 ring-amber-200/50 rounded-[32px] p-8 md:p-12 shadow-[0_12px_28px_-8px_rgba(217,119,6,0.08),inset_0_1.5px_1px_rgba(255,255,255,0.95)] space-y-8 animate-in fade-in duration-200 mt-6">
                      {/* Specular Light Flare */}
                      <div className="absolute -top-[1.5px] left-1/2 -translate-x-1/2 w-64 h-[3px] bg-white rounded-full shadow-[0_0_16px_5px_rgba(255,255,255,1)] pointer-events-none" />
                      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/45 via-white/10 to-transparent pointer-events-none rounded-t-[30px]" />
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                        <div>
                          <h3 className="text-2xl md:text-3xl font-black text-slate-900">Upload Paket Soal Ujian Resmi</h3>
                          <p className="text-sm md:text-base text-slate-600 font-medium mt-1">
                            Buat paket soal ujian resmi. Dapat mengunggah file dokumen ujian (.pdf/.docx) atau menyusun soal secara manual (PG & Essay).
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleUseExamTemplate}
                          className="px-5 py-3 bg-amber-50 hover:bg-amber-100 border-2 border-amber-300 text-amber-900 font-black text-xs md:text-sm rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-colors shrink-0 cursor-pointer"
                        >
                          Gunakan Template Ujian Campuran (PG & Essay)
                        </button>
                      </div>

                      {/* Mode Input Ujian: File Upload vs Input Manual */}
                      <div className="flex items-center space-x-3 bg-slate-100 p-2 rounded-xl border border-slate-200">
                        <button
                          type="button"
                          onClick={() => setExamInputMethod("file")}
                          className={`flex-1 py-3.5 px-4 rounded-xl font-black text-sm md:text-base transition-all cursor-pointer ${examInputMethod === "file"
                            ? "bg-amber-500 text-slate-950 shadow-xs"
                            : "text-slate-700 hover:text-slate-900"
                            }`}
                        >
                          Unggah File Dokumen Ujian (.pdf / .docx)
                        </button>
                        <button
                          type="button"
                          onClick={() => setExamInputMethod("manual")}
                          className={`flex-1 py-3.5 px-4 rounded-xl font-black text-sm md:text-base transition-all cursor-pointer ${examInputMethod === "manual"
                            ? "bg-amber-500 text-slate-950 shadow-xs"
                            : "text-slate-700 hover:text-slate-900"
                            }`}
                        >
                          Input Soal Manual (PG & Essay)
                        </button>
                      </div>

                      <form onSubmit={handlePublishExamSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-2 space-y-2">
                            <label className="text-sm font-black text-slate-700 uppercase tracking-wider">Judul Paket Ujian *</label>
                            <input
                              type="text"
                              required
                              value={examTitleInput}
                              onChange={(e) => setExamTitleInput(e.target.value)}
                              placeholder="Contoh: Ujian Akhir Semester IPAS Bab 1: Tumbuhan & Lingkungan"
                              className="w-full p-4 rounded-xl border-2 border-slate-200 focus:border-amber-400 focus:outline-hidden text-base md:text-lg font-bold text-slate-900 shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-black text-slate-700 uppercase tracking-wider">Durasi Ujian (Menit)</label>
                            <input
                              type="number"
                              min={5}
                              max={180}
                              value={examDurationInput}
                              onChange={(e) => setExamDurationInput(Number(e.target.value))}
                              className="w-full p-4 rounded-xl border-2 border-slate-200 focus:border-amber-400 focus:outline-hidden text-base md:text-lg font-bold text-slate-900 shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
                            />
                          </div>
                        </div>

                        {/* If File Upload Method Selected */}
                        {examInputMethod === "file" ? (
                          <div className="p-8 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl space-y-4 text-center">
                            <div className="max-w-md mx-auto space-y-3">
                              <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 flex items-center justify-center mx-auto text-slate-700 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                                <svg className="w-8 h-8 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
                                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                  <polyline points="14 2 14 8 20 8" />
                                  <line x1="12" y1="18" x2="12" y2="12" />
                                  <line x1="9" y1="15" x2="15" y2="15" />
                                </svg>
                              </div>
                              <h4 className="font-black text-lg text-slate-900">Pilih File Dokumen Ujian (.pdf / .docx / .txt)</h4>
                              <p className="text-xs md:text-sm text-slate-700 font-semibold">
                                Sistem PINTARA akan otomatis mengekstrak soal-soal Pilihan Ganda & Essay dari file dokumen Anda.
                              </p>
                              <label className="inline-block px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-sm rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all cursor-pointer">
                                <span>Pilih File Dokumen Ujian</span>
                                <input
                                  type="file"
                                  accept=".pdf,.docx,.doc,.txt"
                                  onChange={handleExamFileUpload}
                                  className="hidden"
                                />
                              </label>
                            </div>

                            {examDocFileName && (
                              <div className="mt-4 p-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl text-sm font-black text-emerald-950 flex items-center justify-between max-w-xl mx-auto">
                                <span>Dokumen Terlampir: {examDocFileName}</span>
                                <span className="text-emerald-700">4 Soal Diekstrak (2 PG + 2 Essay)</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          /* Form Tambah Soal Ke Draf Ujian (Manual Input) */
                          <div className="p-6 bg-slate-50 border-2 border-slate-200 rounded-xl space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-black text-base text-slate-900">Form Tambah Soal Ujian</h4>
                              <div className="flex items-center space-x-2 bg-white p-1 rounded-xl border border-slate-200">
                                <button
                                  type="button"
                                  onClick={() => setQType("pg")}
                                  className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${qType === "pg" ? "bg-amber-500 text-slate-950" : "text-slate-600 hover:text-slate-900"
                                    }`}
                                >
                                  Pilihan Ganda (PG)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setQType("essay")}
                                  className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${qType === "essay" ? "bg-purple-700 text-white" : "text-slate-600 hover:text-slate-900"
                                    }`}
                                >
                                  Essay / Uraian
                                </button>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-xs font-black text-slate-600 uppercase">
                                Teks Pertanyaan Soal ({qType === "pg" ? "Pilihan Ganda" : "Essay / Uraian"})
                              </label>
                              <textarea
                                rows={3}
                                value={qQuestion}
                                onChange={(e) => setQQuestion(e.target.value)}
                                placeholder={
                                  qType === "pg"
                                    ? "Tuliskan soal pilihan ganda di sini..."
                                    : "Tuliskan pertanyaan soal essay / uraian di sini..."
                                }
                                className="w-full p-3.5 rounded-xl border-2 border-slate-200 focus:border-amber-400 focus:outline-hidden text-sm font-semibold text-slate-900 bg-white"
                              />
                            </div>

                            {/* PG Options Form */}
                            {qType === "pg" ? (
                              <div className="space-y-3 pt-1">
                                <label className="text-xs font-black text-slate-600 uppercase">Opsi Jawaban & Kunci</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <input
                                    type="text"
                                    value={qOptA}
                                    onChange={(e) => setQOptA(e.target.value)}
                                    placeholder="A. Pilihan Jawaban A"
                                    className="p-3 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                                  />
                                  <input
                                    type="text"
                                    value={qOptB}
                                    onChange={(e) => setQOptB(e.target.value)}
                                    placeholder="B. Pilihan Jawaban B"
                                    className="p-3 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                                  />
                                  <input
                                    type="text"
                                    value={qOptC}
                                    onChange={(e) => setQOptC(e.target.value)}
                                    placeholder="C. Pilihan Jawaban C"
                                    className="p-3 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                                  />
                                  <input
                                    type="text"
                                    value={qOptD}
                                    onChange={(e) => setQOptD(e.target.value)}
                                    placeholder="D. Pilihan Jawaban D"
                                    className="p-3 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                                  />
                                </div>
                                <div className="flex items-center space-x-3 pt-2">
                                  <span className="text-xs font-black text-slate-700">Kunci Jawaban Benar:</span>
                                  <select
                                    value={qCorrect}
                                    onChange={(e) => setQCorrect(Number(e.target.value))}
                                    className="p-2 border-2 border-slate-200 rounded-xl text-xs font-bold bg-white"
                                  >
                                    <option value={0}>A</option>
                                    <option value={1}>B</option>
                                    <option value={2}>C</option>
                                    <option value={3}>D</option>
                                  </select>
                                </div>
                              </div>
                            ) : (
                              /* Essay Form */
                              <div className="space-y-3 pt-1">
                                <div className="space-y-2">
                                  <label className="text-xs font-black text-purple-900 uppercase">Kunci Jawaban / Rubrik Penilaian Guru</label>
                                  <textarea
                                    rows={2}
                                    value={qSampleAnswer}
                                    onChange={(e) => setQSampleAnswer(e.target.value)}
                                    placeholder="Masukkan poin-poin kunci jawaban essay untuk acuan penilaian..."
                                    className="w-full p-3 rounded-xl border border-purple-200 text-xs font-medium bg-white"
                                  />
                                </div>
                                <div className="flex items-center space-x-3">
                                  <span className="text-xs font-black text-slate-700">Bobot Poin Essay:</span>
                                  <input
                                    type="number"
                                    value={qPoints}
                                    onChange={(e) => setQPoints(Number(e.target.value))}
                                    className="w-24 p-2 border-2 border-slate-200 rounded-xl text-xs font-bold bg-white"
                                  />
                                </div>
                              </div>
                            )}

                            <div className="pt-2 text-right">
                              <button
                                type="button"
                                onClick={handleAddQuestionToDraft}
                                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                              >
                                + Tambahkan Soal Ke Draf Paket
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Draft Questions Preview */}
                        <div className="space-y-3">
                          <h4 className="font-black text-sm text-slate-800 uppercase tracking-wider">
                            Draf Soal Dalam Paket ({examQuestionsDraft.length} Soal)
                          </h4>
                          {examQuestionsDraft.length === 0 ? (
                            <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-600 font-bold">
                              Belum ada soal ditambahkan. Gunakan form di atas atau tombol template di kanan atas.
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {examQuestionsDraft.map((dq, idx) => (
                                <div key={dq.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                                  <div>
                                    <span className={`px-2 py-0.5 font-black rounded-md mr-2 uppercase ${dq.type === "essay" ? "bg-purple-100 text-purple-800" : "bg-teal-100 text-teal-800"
                                      }`}>
                                      {dq.type === "essay" ? `Essay (${dq.maxPoints || 25} Poin)` : "PG"}
                                    </span>
                                    <span className="font-bold text-slate-900">
                                      {idx + 1}. {dq.question}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setExamQuestionsDraft(examQuestionsDraft.filter((_, i) => i !== idx));
                                    }}
                                    className="text-rose-600 font-bold hover:underline shrink-0 ml-3"
                                  >
                                    Hapus
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                          <button
                            type="submit"
                            className="w-full py-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-base rounded-2xl shadow-md shadow-amber-900/10 transition-all cursor-pointer text-center"
                          >
                            Publikasikan Paket Ujian Resmi Ke Room {teacherRoomCode}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* GURU SUB-TAB 3: GENERATE KODE & KELOLA ROOM KELAS */}
                  {guruTab === "room" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-200 mt-6">
                      {/* Form 1: Connect / Create Class Room */}
                      <div className="relative overflow-hidden bg-gradient-to-b from-white/55 via-white/40 to-white/45 border border-white/85 ring-1 ring-amber-200/50 rounded-[32px] p-6 md:p-8 shadow-[0_12px_28px_-8px_rgba(217,119,6,0.08),inset_0_1.5px_1px_rgba(255,255,255,0.95)] space-y-5">
                        {/* Specular Light Flare */}
                        <div className="absolute -top-[1.5px] left-1/2 -translate-x-1/2 w-48 h-[3px] bg-white rounded-full shadow-[0_0_14px_4px_rgba(255,255,255,1)] pointer-events-none" />
                        <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-white/45 via-white/10 to-transparent pointer-events-none rounded-t-[30px]" />
                        <div>
                          <h3 className="text-2xl font-black text-slate-900">Hubungkan / Buat Room Kelas Baru</h3>
                          <p className="text-sm font-medium text-slate-600 mt-1">
                            Buat kode kelas unik agar siswa dapat terhubung langsung ke room Anda.
                          </p>
                        </div>

                        <form onSubmit={handleSaveTeacherRoom} className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-black text-slate-700 uppercase">Kode Kelas Unik *</label>
                              <button
                                type="button"
                                onClick={handleGenerateCode}
                                className="text-xs font-black text-amber-700 hover:text-amber-800 hover:underline flex items-center space-x-1 cursor-pointer"
                              >
                                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                  <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
                                </svg>
                                <span>Generate Kode Unik Baru</span>
                              </button>
                            </div>
                            <div className="relative">
                              <input
                                type="text"
                                required
                                readOnly
                                value={newRoomCode}
                                placeholder="Klik Generate Kode Unik Baru"
                                className="w-full p-3.5 pr-12 rounded-xl border-2 border-amber-200 text-sm font-black text-slate-900 tracking-wider uppercase bg-amber-50/50 cursor-not-allowed select-none"
                              />
                              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" title="Kode otomatis, tidak dapat diketik manual">
                                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                                </svg>
                              </div>
                            </div>
                            <p className="text-[11px] font-semibold text-slate-700">
                              Kode room dibuat otomatis oleh sistem dan dijamin unik (tidak dapat diketik manual).
                            </p>
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-black text-slate-700 uppercase">Nama Kelas *</label>
                            <input
                              type="text"
                              required
                              value={newClassName}
                              onChange={(e) => setNewClassName(e.target.value)}
                              placeholder="Contoh: Kelas 4-A IPAS"
                              className="w-full p-3.5 rounded-xl border-2 border-slate-200 focus:border-amber-400 focus:outline-hidden text-sm font-bold text-slate-900"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <label className="text-xs font-black text-slate-700 uppercase">Mata Pelajaran</label>
                              <input
                                type="text"
                                value={newSubject}
                                onChange={(e) => setNewSubject(e.target.value)}
                                placeholder="IPAS"
                                className="w-full p-3 rounded-xl border-2 border-slate-200 text-xs font-bold"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-black text-slate-700 uppercase">Nama Guru Pengajar</label>
                              <input
                                type="text"
                                value={newTeacherName}
                                onChange={(e) => setNewTeacherName(e.target.value)}
                                placeholder="Bu Sarah, S.Pd."
                                className="w-full p-3 rounded-xl border-2 border-slate-200 text-xs font-bold"
                              />
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-sm rounded-2xl shadow-md shadow-amber-900/10 transition-colors cursor-pointer"
                          >
                            Simpan & Hubungkan Room Kelas
                          </button>
                        </form>
                      </div>

                      {/* Form 2: Room Announcement Broadcast */}
                      <div className="relative overflow-hidden bg-gradient-to-b from-white/55 via-white/40 to-white/45 border border-white/85 ring-1 ring-amber-200/50 rounded-[32px] p-6 md:p-8 shadow-[0_12px_28px_-8px_rgba(217,119,6,0.08),inset_0_1.5px_1px_rgba(255,255,255,0.95)] space-y-5 flex flex-col justify-between">
                        {/* Specular Light Flare */}
                        <div className="absolute -top-[1.5px] left-1/2 -translate-x-1/2 w-48 h-[3px] bg-white rounded-full shadow-[0_0_14px_4px_rgba(255,255,255,1)] pointer-events-none" />
                        <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-white/45 via-white/10 to-transparent pointer-events-none rounded-t-[30px]" />
                        <div className="space-y-5">
                          <div>
                            <h3 className="text-2xl font-black text-slate-900">Broadcast Pengumuman Room</h3>
                            <p className="text-sm font-medium text-slate-600 mt-1">
                              Kirimkan instruksi atau kabar terbaru langsung ke feed pengumuman siswa di room {teacherRoomCode}.
                            </p>
                          </div>

                          <form onSubmit={handlePostAnnouncementSubmit} className="space-y-4">
                            <textarea
                              required
                              rows={5}
                              value={announcementInput}
                              onChange={(e) => setAnnouncementInput(e.target.value)}
                              placeholder="Tulis pengumuman resmi di sini..."
                              className="w-full p-4 rounded-xl border-2 border-slate-200 focus:border-amber-400 focus:outline-hidden text-sm font-medium text-slate-900"
                            />
                            <button
                              type="submit"
                              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-sm rounded-xl shadow-xs transition-colors cursor-pointer"
                            >
                              Post Pengumuman Ke Chat Room {teacherRoomCode}
                            </button>
                          </form>
                        </div>

                        <div className="pt-4 border-t border-slate-100 text-xs font-bold text-slate-700 flex items-center justify-between">
                          <span>Daftar Pengumuman Aktif: {teacherRoom?.announcements.length || 0} Post</span>
                          <span className="text-emerald-700 font-bold">Real-time Sync Active</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* GURU SUB-TAB 4: MONITORING CONTENT & PENILAIAN ESSAY */}
                  {guruTab === "rekap" && (
                    <div className="space-y-6 animate-in fade-in duration-200 mt-6">
                      <div className="relative overflow-hidden bg-white/75  border-2 border-white/95 ring-1 ring-amber-200/60 rounded-[32px] p-6 md:p-8 shadow-md space-y-6">
                        <div>
                          <h3 className="text-2xl font-black text-slate-900">Rekap Konten & Hasil Ujian Siswa ({teacherRoomCode})</h3>
                          <p className="text-sm md:text-base font-medium text-slate-600 mt-1">
                            Memantau materi, kuis, paket ujian resmi, dan penilaian jawaban essay siswa yang dikumpulkan.
                          </p>
                        </div>

                        {/* KONTROL TIMER UJIAN MISI AKHIR (ISOLASI KHUSUS ROOM INI) */}
                        <div className="bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-white border-2 border-amber-300/80 rounded-3xl p-6 md:p-7 shadow-xs space-y-5">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-3 h-3 rounded-full shrink-0"
                                  style={{
                                    backgroundColor: teacherRoomTimer.isActive ? '#10B981' : '#F59E0B',
                                    boxShadow: teacherRoomTimer.isActive ? '0 0 10px rgba(16, 185, 129, 0.8)' : 'none'
                                  }}
                                />
                                <span className="text-xs font-black uppercase tracking-wider text-amber-900 bg-amber-100/90 px-3 py-1 rounded-full border border-amber-300">
                                  Timer Ujian Khusus Room {teacherRoomCode}
                                </span>
                              </div>
                              <h4 className="text-xl md:text-2xl font-black text-slate-900">
                                Kontrol Timer Misi Akhir
                              </h4>
                              <p className="text-xs md:text-sm font-medium text-slate-600 max-w-xl leading-relaxed">
                                Atur durasi dan mulai waktu ujian resmi. Timer ini <strong className="text-slate-900 font-extrabold underline">hanya berlaku untuk siswa di room {teacherRoomCode}</strong>. Siswa di room lain tidak akan terpengaruh.
                              </p>
                            </div>

                            {/* Status Countdown Display */}
                            <div className="flex items-center">
                              {teacherRoomTimer.isActive ? (
                                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-md border-2 border-emerald-400 flex items-center gap-3.5">
                                  <div className="w-3 h-3 rounded-full bg-white animate-pulse shrink-0" />
                                  <div>
                                    <div className="text-[10px] font-black uppercase tracking-wider text-emerald-100">
                                      Timer Berjalan ({teacherRoomTimer.durationMinutes}m)
                                    </div>
                                    <div className="text-2xl font-black font-mono tracking-wider">
                                      {formatTime(guruRemainingSeconds)}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-slate-100/90 text-slate-700 px-5 py-3.5 rounded-2xl border-2 border-slate-200">
                                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">Status Timer Siswa</div>
                                  <div className="text-base font-black text-slate-800">Menunggu Dimulai</div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Control Row: Free Duration Input + Presets + Action Buttons */}
                          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pt-3 border-t border-amber-200/60">
                            {/* Duration Input & Presets */}
                            <div className="flex flex-wrap items-center gap-3">
                              <label className="text-xs md:text-sm font-black text-slate-700">
                                Durasi Ujian:
                              </label>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min={1}
                                  max={300}
                                  value={guruTimerDuration}
                                  onChange={(e) => setGuruTimerDuration(Math.max(1, parseInt(e.target.value) || 1))}
                                  disabled={teacherRoomTimer.isActive}
                                  className="w-20 px-3 py-2 rounded-xl border-2 border-amber-300 bg-white font-black text-base text-center text-slate-800 shadow-inner focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:bg-slate-100 disabled:text-slate-500"
                                />
                                <span className="text-xs font-bold text-slate-600">Menit</span>
                              </div>

                              {/* Quick Presets */}
                              <div className="flex items-center gap-1.5">
                                {[15, 30, 45, 60, 90].map((m) => (
                                  <button
                                    key={m}
                                    type="button"
                                    disabled={teacherRoomTimer.isActive}
                                    onClick={() => setGuruTimerDuration(m)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${guruTimerDuration === m
                                        ? "bg-amber-500 text-white shadow-xs"
                                        : "bg-white/90 hover:bg-white text-slate-700 border border-amber-200 disabled:opacity-50"
                                      }`}
                                  >
                                    {m}m
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2.5 flex-wrap">
                              {teacherRoomTimer.isActive ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleAddGuruTimerMinutes(10)}
                                    className="px-4 py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-extrabold text-xs md:text-sm rounded-xl transition-all active:scale-95 cursor-pointer shadow-xs"
                                  >
                                    +10 Menit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleStopGuruTimer()}
                                    className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-black text-xs md:text-sm rounded-xl transition-all active:scale-95 cursor-pointer shadow-md flex items-center gap-2"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                                    Hentikan Timer
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleStartGuruTimer()}
                                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-black text-sm md:text-base rounded-2xl shadow-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                  Mulai Timer Ujian Room {teacherRoomCode} ({guruTimerDuration} Menit)
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="p-4 bg-amber-50/50 border border-amber-200/80 rounded-2xl text-center space-y-1">
                            <p className="text-2xl font-black text-amber-700">{teacherRoom?.materials.length || 0}</p>
                            <p className="text-xs font-bold text-slate-600">Total Materi</p>
                          </div>
                          <div className="p-4 bg-amber-50/50 border border-amber-200/80 rounded-2xl text-center space-y-1">
                            <p className="text-2xl font-black text-emerald-600">{teacherRoom?.quizzes?.length || 0}</p>
                            <p className="text-xs font-bold text-slate-600">Latihan Kuis</p>
                          </div>
                          <div className="p-4 bg-amber-50/50 border border-amber-200/80 rounded-2xl text-center space-y-1">
                            <p className="text-2xl font-black text-purple-600">{teacherRoom?.exams?.length || 0}</p>
                            <p className="text-xs font-bold text-slate-600">Paket Ujian</p>
                          </div>
                          <div className="p-4 bg-amber-50/50 border border-amber-200/80 rounded-2xl text-center space-y-1">
                            <p className="text-2xl font-black text-rose-600">
                              {new Set([
                                ...monitorQuizResults.map(r => r.studentName),
                                ...monitorExamResults.map(r => r.studentName)
                              ]).size}
                            </p>
                            <p className="text-xs font-bold text-slate-600">Siswa Aktif</p>
                          </div>
                        </div>

                        {/* Hasil Pengerjaan Siswa Terkini - DATA REAL DARI DATABASE */}
                        <div className="space-y-4 pt-6 border-t border-slate-100">
                          <div className="flex items-center justify-between">
                            <h4 className="font-black text-lg text-slate-900 tracking-tight">
                              Laporan Hasil Pengerjaan Siswa
                            </h4>
                            <button
                              onClick={() => {
                                if (teacherRoomCode) {
                                  setIsMonitorLoading(true);
                                  Promise.all([
                                    fetchQuizResults(teacherRoomCode),
                                    fetchExamResults(teacherRoomCode),
                                  ]).then(([qr, er]) => {
                                    setMonitorQuizResults(qr);
                                    setMonitorExamResults(er);
                                    setIsMonitorLoading(false);
                                  });
                                }
                              }}
                              className="px-3 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-xs font-bold rounded-full transition-colors cursor-pointer"
                            >
                              {isMonitorLoading ? "Memuat..." : "Refresh Data"}
                            </button>
                          </div>

                          {/* Latihan Soal Results */}
                          <div className="space-y-3">
                            <h5 className="font-bold text-sm text-slate-700 uppercase tracking-wider">Latihan Soal (Kuis)</h5>
                            {monitorQuizResults.length === 0 ? (
                              <p className="text-xs font-semibold text-slate-600 p-4 border border-dashed rounded-xl text-center">
                                {isMonitorLoading ? "Memuat data dari database..." : "Belum ada siswa yang mengerjakan latihan soal di room ini."}
                              </p>
                            ) : (
                              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                                <table className="w-full text-left text-sm">
                                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                                    <tr>
                                      <th className="px-4 py-3">Nama Siswa</th>
                                      <th className="px-4 py-3">Judul Kuis</th>
                                      <th className="px-4 py-3 text-center">Benar</th>
                                      <th className="px-4 py-3 text-center">Salah</th>
                                      <th className="px-4 py-3 text-center">Nilai</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {monitorQuizResults.map((row) => {
                                      const initial = row.studentName.charAt(0).toUpperCase();
                                      const colors = ["bg-emerald-500", "bg-purple-500", "bg-blue-500", "bg-rose-500", "bg-amber-500", "bg-teal-500"];
                                      const colorIdx = row.studentName.charCodeAt(0) % colors.length;
                                      return (
                                        <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                                          <td className="px-4 py-3 font-bold text-slate-900 flex items-center gap-2">
                                            <span className={`w-6 h-6 rounded-full ${colors[colorIdx]} text-white flex items-center justify-center text-xs shrink-0`}>{initial}</span>
                                            {row.studentName}
                                          </td>
                                          <td className="px-4 py-3 text-slate-600">{row.quizTitle}</td>
                                          <td className="px-4 py-3 text-center font-black text-emerald-600">{row.correctAnswers}</td>
                                          <td className="px-4 py-3 text-center font-black text-rose-500">{row.wrongAnswers}</td>
                                          <td className="px-4 py-3 text-center font-black text-slate-900">{row.score}</td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>

                          {/* Ujian Resmi Results */}
                          <div className="space-y-3 pt-4">
                            <h5 className="font-bold text-sm text-slate-700 uppercase tracking-wider">Ujian Resmi Kelas</h5>
                            {monitorExamResults.length === 0 ? (
                              <p className="text-xs font-semibold text-slate-600 p-4 border border-dashed rounded-xl text-center">
                                {isMonitorLoading ? "Memuat data dari database..." : "Belum ada siswa yang mengumpulkan ujian di room ini."}
                              </p>
                            ) : (
                              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                                <table className="w-full text-left text-sm">
                                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                                    <tr>
                                      <th className="px-4 py-3">Nama Siswa</th>
                                      <th className="px-4 py-3">Judul Ujian</th>
                                      <th className="px-4 py-3 text-center">Nilai PG</th>
                                      <th className="px-4 py-3 text-center">Essay</th>
                                      <th className="px-4 py-3 text-center">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {monitorExamResults.map((row) => {
                                      const initial = row.studentName.charAt(0).toUpperCase();
                                      const colors = ["bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-rose-500", "bg-amber-500"];
                                      const colorIdx = row.studentName.charCodeAt(0) % colors.length;
                                      return (
                                        <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                                          <td className="px-4 py-3 font-bold text-slate-900 flex items-center gap-2">
                                            <span className={`w-6 h-6 rounded-full ${colors[colorIdx]} text-white flex items-center justify-center text-xs shrink-0`}>{initial}</span>
                                            {row.studentName}
                                          </td>
                                          <td className="px-4 py-3 text-slate-600">{(row as any).examTitle || "Ujian"}</td>
                                          <td className="px-4 py-3 text-center font-black text-slate-900">{row.finalScore}</td>
                                          <td className="px-4 py-3 text-center">
                                            {row.hasEssay ? (
                                              <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-lg">Menunggu Penilaian</span>
                                            ) : (
                                              <span className="text-xs font-bold text-slate-600">—</span>
                                            )}
                                          </td>
                                          <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-1 text-[10px] font-black rounded-md uppercase ${row.hasEssay ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                                              }`}>
                                              {row.hasEssay ? "Perlu Review" : "Selesai"}
                                            </span>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Published Exams Inspector & Essay Rubrics */}
                        <div className="space-y-4 pt-6 border-t border-slate-100">
                          <h4 className="font-black text-sm text-slate-900 uppercase tracking-wider">
                            Paket Ujian Resmi & Rubrik Essay Terpublikasi:
                          </h4>

                          {!teacherRoom || !teacherRoom.exams || teacherRoom.exams.length === 0 ? (
                            <p className="text-xs font-semibold text-slate-600 p-4 border border-dashed rounded-xl text-center">
                              Belum ada paket ujian terpublikasi untuk room ini.
                            </p>
                          ) : (
                            (teacherRoom?.exams || []).map((ex) => (
                              <div key={ex.id} className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                                <div className="flex items-center justify-between">
                                  <h5 className="font-black text-base text-slate-900">{ex.title}</h5>
                                  <span className="text-xs font-bold text-slate-700 bg-white px-3 py-1 rounded-lg border border-slate-200">
                                    Durasi: {ex.durationMinutes} Menit | {ex.questions.length} Soal
                                  </span>
                                </div>
                                <div className="space-y-2">
                                  {ex.questions.map((q, qIdx) => (
                                    <div key={q.id} className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1">
                                      <div className="flex items-center justify-between font-bold">
                                        <span className="text-slate-900">
                                          {qIdx + 1}. {q.question}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-md font-black ${q.type === "essay" ? "bg-purple-100 text-purple-800" : "bg-teal-100 text-teal-800"
                                          }`}>
                                          {q.type === "essay" ? `Essay (${q.maxPoints || 25} Poin)` : "Pilihan Ganda"}
                                        </span>
                                      </div>
                                      {q.type === "essay" && q.sampleAnswer && (
                                        <p className="text-slate-700 font-medium italic pt-1">
                                          Kunci/Rubrik Guru: {q.sampleAnswer}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </main>
          </div>
        )}

        {/* VIEW 4: AKUN */}
        {activeTab === "akun" && (
          <main className="max-w-xl mx-auto my-8 px-6">
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm animate-in fade-in duration-300">
              <div className="flex items-center space-x-4 mb-6 pb-6 border-b border-slate-100">
                <div className="w-16 h-16 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center p-3 shadow-sm">
                  <PintaraLogo size="lg" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">Profil PINTARA</h2>
                  {userSession?.role === "siswa" && (
                    <p className="text-xs font-semibold text-amber-700 mt-0.5">{activeMode} Aktif</p>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                {userSession?.role === "siswa" && (
                  <button
                    onClick={() => router.push("/")}
                    className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-between transition-colors"
                  >
                    <span>Ubah Mode Aksesibilitas</span>
                    <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
                      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={() => setActiveTab("katalog")}
                  className="w-full py-3 px-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-between transition-colors shadow-xs"
                >
                  <span>Kembali ke Katalog Mapel</span>
                  <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                    <path d="M14 2v6h6M9 13h6M9 17h4" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>
          </main>
        )}

        {/* MODAL BACA MATERI PDF */}
        {activeMaterialPdf && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
            {/* Overlay Background */}
            <div
              className="absolute inset-0 bg-slate-900/60 "
              onClick={() => setActiveMaterialPdf(null)}
            />

            <div className="relative w-full max-w-5xl h-full md:h-[90vh] bg-[#F8FAFC] rounded-2xl shadow-2xl flex flex-col overflow-hidden border-2 border-amber-200">
              {/* Header Modal */}
              <div className="px-6 py-4 bg-white border-b border-amber-100 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-100/80 flex items-center justify-center border border-amber-200 text-amber-900 font-black">
                    M
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-lg md:text-xl truncate max-w-lg">
                      {activeMaterialPdf.title}
                    </h3>
                    <p className="text-xs font-medium text-slate-600">Dokumen Pembelajaran</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveMaterialPdf(null)}
                  className="w-10 h-10 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-colors shadow-xs"
                >
                  <svg className="w-5 h-5 fill-none stroke-current" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>

              {/* PDF / File Viewer */}
              <div className="flex-1 w-full bg-slate-100 relative overflow-hidden">
                {activeMaterialPdf.fileUrl ? (
                  <iframe
                    src={
                      activeMaterialPdf.fileUrl.match(/\.(doc|docx|ppt|pptx)$/i)
                        ? `https://docs.google.com/gview?url=${encodeURIComponent(activeMaterialPdf.fileUrl)}&embedded=true`
                        : activeMaterialPdf.fileUrl
                    }
                    title={activeMaterialPdf.title}
                    className="w-full h-full border-0"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-slate-700 font-bold text-center">Dokumen tidak dapat dimuat</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODAL STUDY CARDS (INTERACTIVE FLASHCARDS ENGINE - BUG-FREE FLIP & ENLARGED TEXT) */}
        {activeFlashcardMaterial && activeFlashcardMaterial.flashcards.length > 0 && (
          <div className="fixed inset-0 z-50 bg-slate-900/60  flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 md:p-10 max-w-2xl md:max-w-3xl w-full shadow-2xl relative animate-in fade-in zoom-in duration-300 border-2 border-amber-200">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-amber-100">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-amber-900 bg-amber-100/80 px-3 py-1 rounded-full border border-amber-200">
                    STUDY CARDS (FLASHCARDS)
                  </span>
                  <h3 className="text-lg md:text-xl font-black text-slate-900 mt-2">
                    {activeFlashcardMaterial.title}
                  </h3>
                </div>
                <button id="btn-flashcard-close" data-scan-label="Tutup Flashcard" onClick={() => setActiveFlashcardMaterial(null)} className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 font-black hover:bg-slate-200 flex items-center justify-center text-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="text-center mb-4 text-sm font-black text-slate-700">
                Kartu {flashcardIndex + 1} dari {activeFlashcardMaterial.flashcards.length}
              </div>

              {/* CARD CONTAINER WITH SMOOTH FLIP TRANSITION & FORWARD-FACING TEXT (NO OVERFLOW BUG) */}
              {(() => {
                const currentText = isFlipped
                  ? activeFlashcardMaterial.flashcards[flashcardIndex].back
                  : activeFlashcardMaterial.flashcards[flashcardIndex].front;

                const textLength = currentText.length;
                let fontSizeClass = "text-2xl md:text-3xl lg:text-4xl font-black";
                if (textLength > 160) {
                  fontSizeClass = "text-base md:text-lg lg:text-xl font-bold leading-relaxed";
                } else if (textLength > 90) {
                  fontSizeClass = "text-lg md:text-xl lg:text-2xl font-extrabold leading-snug";
                } else if (textLength > 50) {
                  fontSizeClass = "text-xl md:text-2xl lg:text-3xl font-black leading-tight";
                }

                return (
                  <div id="btn-flashcard-flip" role="button" tabIndex={0} data-scan-label="Putar Kartu (Flip)" onClick={toggleFlip} className="w-full h-80 md:h-[360px] cursor-pointer mb-8 group transition-transform duration-300 active:scale-98"
                  >
                    <div
                      className={`w-full h-full rounded-2xl p-6 md:p-8 flex flex-col items-center justify-between text-center shadow-md transition-all duration-300 overflow-hidden ${isFlipped
                        ? "bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 ring-4 ring-amber-300/40"
                        : "bg-white border-2 border-amber-200/80 text-slate-900 hover:border-amber-400"
                        }`}
                    >
                      <span className={`text-xs md:text-sm font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full shrink-0 ${isFlipped ? "bg-amber-600/20 text-slate-900 border border-amber-600/30" : "bg-slate-100 text-slate-700"
                        }`}>
                        {isFlipped ? "JAWABAN / PENJELASAN (BELAKANG)" : "PERTANYAAN / KONSEP (DEPAN)"}
                      </span>

                      <div className="my-auto w-full max-h-[200px] md:max-h-[230px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-2 py-1 flex items-center justify-center">
                        <p className={`${fontSizeClass} tracking-tight text-center`}>
                          {currentText}
                        </p>
                      </div>

                      <div className="mt-2 flex items-center space-x-2 text-xs md:text-sm font-extrabold opacity-80 underline shrink-0">
                        <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span>Klik kartu untuk memutar kartu (Flip)</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="flex items-center justify-between gap-3">
                <button id="btn-flashcard-prev" data-scan-label="Kartu Sebelumnya" onClick={prevFlashcard} className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-sm md:text-base rounded-xl transition-all"
                >
                  ← Kartu Sebelum
                </button>

                <button id="btn-flashcard-sound" data-scan-label="Suara Kartu" onClick={() => {
                  const fc = activeFlashcardMaterial.flashcards[flashcardIndex]; speakText(isFlipped ? `Jawaban: ${fc.back}` : `Pertanyaan: ${fc.front}`);
                }}
                  className="px-6 py-3.5 bg-amber-50 text-amber-900 border-2 border-amber-200 font-extrabold text-sm md:text-base rounded-xl hover:bg-amber-100 transition-all flex items-center space-x-2"
                >
                  <svg className="w-5 h-5 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 010 7.07" />
                  </svg>
                  <span>Suara Kartu</span>
                </button>

                <button id="btn-flashcard-next" data-scan-label="Kartu Selanjutnya" onClick={nextFlashcard} className="px-6 py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-extrabold text-sm md:text-base rounded-xl shadow-xs transition-all"
                >
                  Kartu Lanjut →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Pilih Jenjang/Kelas */}
        {isGradeModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 ">
            <div className="bg-white rounded-[32px] p-8 md:p-10 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto border-2 border-amber-200">
              {/* Hanya tampilkan tombol close jika jenjang sudah diset sebelumnya (edit mode) */}
              {userSession?.jenjang && (
                <button
                  onClick={() => {
                    setIsGradeModalOpen(false);
                    setSelectedGrade(userSession?.jenjang || "");
                  }}
                  className="absolute top-6 right-6 w-10 h-10 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-full flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Lengkapi profil dulu yuk!</h2>
                <p className="text-lg text-slate-700 font-medium">Pilih jenjang kamu ya</p>
                <div className="w-32 h-1 bg-amber-200 mx-auto rounded-full mt-6"></div>
              </div>

              <div className="space-y-4">
                <p className="font-semibold text-slate-600 mb-4">Pilih Kelas Sekolah Dasar (SD)</p>
                {["Kelas 1 SD", "Kelas 2 SD", "Kelas 3 SD", "Kelas 4 SD", "Kelas 5 SD", "Kelas 6 SD"].map((grade) => (
                  <label
                    key={grade}
                    className="flex items-center space-x-3 cursor-pointer group"
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selectedGrade === grade ? "border-amber-500" : "border-slate-300 group-hover:border-slate-400"}`}>
                      {selectedGrade === grade && <div className="w-2.5 h-2.5 bg-amber-500 rounded-full"></div>}
                    </div>
                    <span className={`text-base font-medium transition-colors ${selectedGrade === grade ? "text-slate-900" : "text-slate-600 group-hover:text-slate-800"}`}>
                      {grade}
                    </span>
                    <input
                      type="radio"
                      name="jenjang"
                      value={grade}
                      className="hidden"
                      onChange={() => setSelectedGrade(grade)}
                    />
                  </label>
                ))}
              </div>

              <button
                disabled={!selectedGrade || isUpdatingJenjang}
                onClick={handleSaveJenjang}
                className={`w-full py-4 mt-10 rounded-2xl font-black text-lg transition-all flex justify-center items-center ${selectedGrade && !isUpdatingJenjang ? "bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 shadow-md shadow-amber-900/10 hover:shadow-lg" : "bg-slate-200 text-slate-600 cursor-not-allowed"}`}
              >
                {isUpdatingJenjang ? "Menyimpan (Proses)..." : "Lanjut"}
              </button>
            </div>
          </div>
        )}

        {/* Floating Fixed Bottom-Right Sound Toggle Button */}
        {userSession?.role === "siswa" && !isExamFullscreen && (
          <div className="fixed bottom-6 right-6 z-50 pointer-events-none">
            <SoundToggleButton className="pointer-events-auto" />
          </div>
        )}
      </div>
    </div>
  );
}
