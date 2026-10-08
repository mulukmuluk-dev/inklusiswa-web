"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { isFullVoiceEnabled } from "@/lib/accessibility";
import { useRouter } from "next/navigation";
import { PintaraLogo } from "@/components/PintaraLogo";
import { SoundToggleButton } from "@/components/SoundToggleButton";
import { speakGlobal } from "@/lib/soundControl";
import { getActiveSession, UserSession } from "@/lib/authSession";
import {
  getClassRoom,
  getClassRoomAsync,
  saveClassRoom,
  ClassRoom,
  MaterialItem,
  Flashcard,
  QuizItem,
  ExamItem,
  saveQuizSubmission,
  saveExamSubmission,
} from "@/lib/kelasDatabase";

export default function KelasPage() {
  const router = useRouter();
  const [userSession, setUserSession] = useState<UserSession | null>(null);

  // State Kode Kelas & Active Room Data
  const [inputCode, setInputCode] = useState<string>("");
  const [activeCode, setActiveCode] = useState<string>("");
  const [room, setRoom] = useState<ClassRoom | null>(null);
  const [joinError, setJoinError] = useState<string>("");

  // State Tab Navigasi Sidebar (Foto Reference Layout)
  const [activeSidebarTab, setActiveSidebarTab] = useState<"kelas" | "materi" | "latihan" | "ujian">("kelas");

  // State Chat Media Room
  const [newMessageText, setNewMessageText] = useState<string>("");

  // State Flashcards Modal (Study Cards)
  const [activeFlashcardMaterial, setActiveFlashcardMaterial] = useState<MaterialItem | null>(null);
  const [activeMaterialPdf, setActiveMaterialPdf] = useState<MaterialItem | null>(null);
  const [flashcardIndex, setFlashcardIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  // State Latihan Soal Interactive Quiz
  const [activeQuiz, setActiveQuiz] = useState<QuizItem | null>(null);
  const [activeQuizIndex, setActiveQuizIndex] = useState<number>(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);

  // State Ujian Interactive Exam
  const [activeExam, setActiveExam] = useState<ExamItem | null>(null);
  const [examAnswers, setExamAnswers] = useState<Record<string, number>>({});
  const [examEssayAnswers, setExamEssayAnswers] = useState<Record<string, string>>({});
  const [listeningEssayId, setListeningEssayId] = useState<string | null>(null);
  const [examSubmitted, setExamSubmitted] = useState<boolean>(false);
  const [examTimer, setExamTimer] = useState<number>(2700); // 45 menit dalam detik

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

  // Load last room from localStorage on mount
  useEffect(() => {
    setUserSession(getActiveSession());
    const savedLastCode = localStorage.getItem("pintara_student_last_room");
    if (savedLastCode) {
      setInputCode(savedLastCode);
      setActiveCode(savedLastCode);
    } else {
      setInputCode("INKLU-1234");
      setActiveCode("INKLU-1234");
    }
  }, []);

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

  // Timer Ujian Countdown
  useEffect(() => {
    let timerId: NodeJS.Timeout;
    if (activeExam && !examSubmitted && examTimer > 0) {
      timerId = setInterval(() => {
        setExamTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timerId);
  }, [activeExam, examSubmitted, examTimer]);

  // Handler Join Kode Kelas
  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    const targetCode = inputCode.trim().toUpperCase();
    const foundRoom = await getClassRoomAsync(targetCode);
    if (foundRoom) {
      setRoom(foundRoom);
      setActiveCode(targetCode);
      setJoinError("");
      // Save to localStorage (last room + room history)
      localStorage.setItem("pintara_student_last_room", targetCode);
      const savedHistory = localStorage.getItem("pintara_student_room_history");
      let history: { code: string; className: string }[] = [];
      try { history = savedHistory ? JSON.parse(savedHistory) : []; } catch {}
      history = [{ code: targetCode, className: foundRoom.className }, ...history.filter(r => r.code !== targetCode)].slice(0, 15);
      localStorage.setItem("pintara_student_room_history", JSON.stringify(history));
      speakText(`Berhasil bergabung ke room ${foundRoom.className}`);
    } else {
      setJoinError(`Kode kelas "${targetCode}" tidak ditemukan.`);
      speakText(`Kode kelas ${targetCode} tidak ditemukan`);
    }
  };

  // Handler Kirim Chat
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

  // Helper TTS Reader untuk Aksesibilitas Suara
  const speakText = (text: string) => {
    speakGlobal(text);
  };

  // Handler Study Cards (Flashcards)
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

  // Format detik ke MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 font-sans flex flex-col md:flex-row overflow-x-hidden">
      {/* ==================== 1. SIDEBAR NAVIGASI KIRI ==================== */}
      <aside className="w-full md:w-72 lg:w-80 bg-white border-r border-slate-200/80 p-6 flex flex-col justify-between shrink-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)] z-20">
        <div>
          {/* Header Profile Box (Background Putih pada Logo & Teks 'Halo!') */}
          <div className="flex items-center space-x-3 bg-slate-50 border border-slate-200 p-3.5 rounded-2xl mb-8 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
            <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center p-1.5 shrink-0">
              <PintaraLogo size="md" />
            </div>
            <div className="overflow-hidden">
              <h2 className="font-black text-slate-900 text-base tracking-tight truncate">Halo!</h2>
              <p className="text-xs font-bold text-[#0066CC] truncate">Siap belajar hari ini?</p>
            </div>
          </div>

          {/* Navigation Links dengan Icon Elegan Hitam Putih */}
          <div className="space-y-2">
            <div className="px-3 text-[10px] font-black uppercase text-slate-600 tracking-wider mb-2">
              Menu Utama Kelas
            </div>

            {/* Nav 1: Kelas (Wave lines icon) */}
            <button
              onClick={() => setActiveSidebarTab("kelas")}
              data-voice-command="buka kelas"
              className={`w-full flex items-center space-x-3.5 px-4 py-3.5 rounded-2xl font-extrabold text-sm transition-all ${
                activeSidebarTab === "kelas"
                  ? "bg-[#0066CC] text-white shadow-[0_4px_12px_rgba(0,0,0,0.05)] shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <svg className="w-5 h-5 fill-none stroke-current shrink-0" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M2 9c3-3 6-3 9 0s6 3 9 0" strokeLinecap="round" />
                <path d="M2 15c3-3 6-3 9 0s6 3 9 0" strokeLinecap="round" />
              </svg>
              <span>Kelas</span>
            </button>

            {/* Nav 2: Materi & Study Cards (Catatan document icon) */}
            <button
              onClick={() => setActiveSidebarTab("materi")}
              data-voice-command="buka materi"
              className={`w-full flex items-center space-x-3.5 px-4 py-3.5 rounded-2xl font-extrabold text-sm transition-all ${
                activeSidebarTab === "materi"
                  ? "bg-[#0066CC] text-white shadow-[0_4px_12px_rgba(0,0,0,0.05)] shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <svg className="w-5 h-5 fill-none stroke-current shrink-0" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                <path d="M14 2v6h6M9 13h6M9 17h4" strokeLinecap="round" />
              </svg>
              <span>Materi & Study Cards</span>
            </button>

            {/* Nav 3: Latihan Soal (Analitik bar chart icon) */}
            <button
              onClick={() => setActiveSidebarTab("latihan")}
              data-voice-command="buka latihan soal"
              className={`w-full flex items-center space-x-3.5 px-4 py-3.5 rounded-2xl font-extrabold text-sm transition-all ${
                activeSidebarTab === "latihan"
                  ? "bg-[#0066CC] text-white shadow-[0_4px_12px_rgba(0,0,0,0.05)] shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <svg className="w-5 h-5 fill-none stroke-current shrink-0" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <path d="M7 16v-3M12 16v-6M17 16v-9" strokeLinecap="round" strokeWidth="2.5" />
              </svg>
              <span>Latihan Soal</span>
            </button>

            {/* Nav 4: Ujian (Clock icon) */}
            <button
              onClick={() => setActiveSidebarTab("ujian")}
              data-voice-command="buka ujian"
              className={`w-full flex items-center space-x-3.5 px-4 py-3.5 rounded-2xl font-extrabold text-sm transition-all ${
                activeSidebarTab === "ujian"
                  ? "bg-[#0066CC] text-white shadow-[0_4px_12px_rgba(0,0,0,0.05)] shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <svg className="w-5 h-5 fill-none stroke-current shrink-0" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 3" strokeLinecap="round" />
              </svg>
              <span>Ujian</span>
            </button>
          </div>
        </div>

        {/* Bottom Navigation Utilities */}
        <div className="pt-6 border-t border-slate-200 space-y-2">
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
          >
            <span>← Ke Katalog Mapel</span>
          </button>
        </div>
      </aside>

      {/* ==================== 2. MAIN CONTENT AREA ==================== */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto overflow-y-auto">
        {/* Top Header Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          {/* Status System Badge */}
          <div className="flex items-center space-x-3">
            <span className="px-3.5 py-1 bg-[#0066CC]/10 border border-[#0066CC]/20 text-[#0066CC] text-xs font-black rounded-full tracking-wide uppercase">
              ● SISTEM NORMAL
            </span>
            <span className="text-slate-600 text-xs font-bold">PINTARA Classroom Engine v2.0</span>
          </div>

          {/* Form Kode Kelas Integration (Sistem Kode Kelas Central) */}
          <form onSubmit={handleJoinClass} className="flex items-center space-x-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-56">
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="Masukkan Kode Kelas..."
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs md:text-sm font-bold text-slate-900 uppercase placeholder:normal-case focus:outline-none focus:ring-2 focus:ring-[#0066CC]/30"
              />
            </div>
            <button
              type="submit"
              data-voice-command="gabung kelas"
              className="px-5 py-2.5 bg-[#0066CC] hover:bg-[#0052A3] text-white font-bold text-xs md:text-sm rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all shrink-0"
            >
              Gabung Kode
            </button>
          </form>
        </div>

        {/* Join Class Error Alert */}
        {joinError && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-xs font-semibold flex items-center justify-between">
            <span>{joinError}</span>
          </div>
        )}

        {/* Room Header Info Card */}
        {room && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 mb-8 shadow-[0_4px_12px_rgba(0,0,0,0.05)] relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#0066CC]/10 via-teal-50/20 to-transparent rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center space-x-2 mb-1">
                <span className="px-2.5 py-0.5 bg-[#0066CC] text-white font-black text-[10px] rounded-md tracking-wider">
                  KODE: {room.code}
                </span>
                <span className="text-xs font-bold text-slate-700">• {room.subject}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                {room.className}
              </h1>
              <p className="text-xs md:text-sm text-slate-700 font-semibold mt-1">
                Pengajar: <span className="text-[#0066CC] font-extrabold">{room.teacherName}</span>
              </p>
            </div>

            <div className="relative z-10 flex items-center space-x-2">
              <span className="px-3 py-1.5 bg-teal-50 text-[#0066CC] border border-[#0F9DB6]/30 text-xs font-extrabold rounded-xl">
                Media Chat Aktif
              </span>
            </div>
          </div>
        )}

        {/* ==================== TAB 1: KELAS (ROOM CHAT & PENGUMUMAN GURU) ==================== */}
        {activeSidebarTab === "kelas" && room && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* PEMBERITAHUAN GURU (TEACHER ANNOUNCEMENT FEED) */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-black text-slate-900">Pemberitahuan Guru</h2>
                </div>
                <span className="text-xs font-bold text-[#0066CC] bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-100">
                  {room.announcements.length} Pengumuman
                </span>
              </div>

              <div className="space-y-3">
                {room.announcements.map((ann) => (
                  <div key={ann.id} className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-extrabold text-xs text-slate-900">{ann.author}</span>
                      <span className="text-[11px] font-semibold text-slate-600">{ann.date}</span>
                    </div>
                    <p className="text-xs md:text-sm text-slate-700 font-medium leading-relaxed">
                      {ann.content}
                    </p>
                    <button
                      onClick={() => speakText(`Pengumuman dari ${ann.author}. ${ann.content}`)}
                      className="mt-2 text-[11px] font-bold text-[#0066CC] hover:underline flex items-center space-x-1"
                    >
                      <span>Dengarkan Pengumuman</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* MEDIA CHAT ROOM (RUANG OBROLAN KELAS INTERAKTIF) */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.05)] flex flex-col h-[520px]">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-black text-slate-900">Ruang Obrolan Kelas ({room.code})</h2>
                </div>
                <span className="text-xs font-semibold text-slate-600">Interaksi Real-time</span>
              </div>

              {/* Chat Thread Messages Box */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
                {room.messages.map((msg) => {
                  const isGuru = msg.role === "guru";
                  const isMe = userSession?.name ? msg.sender.includes(userSession.name) : false;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-bold text-[11px] text-slate-700">{msg.sender}</span>
                        {isGuru && (
                          <span className="px-2 py-0.2 bg-[#0066CC] text-white font-extrabold text-[9px] rounded-full uppercase">
                            GURU
                          </span>
                        )}
                        <span className="text-[10px] text-slate-600">{msg.time}</span>
                      </div>
                      <div
                        className={`max-w-md p-3.5 rounded-2xl text-xs md:text-sm font-medium leading-relaxed relative group ${
                          isMe
                            ? "bg-[#0066CC] text-white rounded-tr-none shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
                            : isGuru
                            ? "bg-teal-50 border border-teal-200 text-slate-900 rounded-tl-none"
                            : "bg-slate-100 border border-slate-200 text-slate-800 rounded-tl-none"
                        }`}
                      >
                        <p>{msg.text}</p>
                        <button
                          onClick={() => speakText(`${msg.sender} mengatakan: ${msg.text}`)}
                          className={`mt-1.5 text-[10px] font-bold flex items-center space-x-1 ${
                            isMe ? "text-cyan-100 hover:text-white" : "text-[#0066CC] hover:underline"
                          }`}
                        >
                          <span>Bacakan Pesan</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chat Form Input */}
              <form onSubmit={handleSendMessage} className="flex items-center space-x-2 pt-3 border-t border-slate-100">
                <input
                  type="text"
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  placeholder="Ketik pesan atau pertanyaan untuk kelas..."
                  className="flex-1 px-4 py-3 bg-[#F1F5F9] border border-slate-200 rounded-2xl text-xs md:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0066CC]/30"
                />
                <button
                  type="submit"
                  className="px-5 py-3 bg-[#0066CC] hover:bg-[#0052A3] text-white font-bold rounded-2xl text-xs md:text-sm shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all shrink-0"
                >
                  Kirim Pesan
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ==================== TAB 2: MATERI & STUDY CARDS ==================== */}
        {activeSidebarTab === "materi" && room && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <h2 className="text-xl md:text-2xl font-black text-slate-900">Materi & Study Cards ({room.code})</h2>
              <span className="text-xs font-bold text-slate-700">{room.materials.length} Modul Pembelajaran</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {room.materials.map((mat) => (
                <div key={mat.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.05)] flex flex-col justify-between hover:border-[#0066CC] transition-all">
                  <div>
                    <div className="inline-flex items-center px-2.5 py-0.5 bg-[#0066CC]/10 text-[#0066CC] font-extrabold text-[10px] rounded-md uppercase mb-2">
                      MODUL MATERI
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mb-2">{mat.title}</h3>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed mb-3">
                      {mat.summary}
                    </p>
                    <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs text-slate-700 leading-relaxed font-medium mb-4">
                      {mat.content}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
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
                        className="text-xs font-bold text-slate-600 hover:text-[#0066CC] flex items-center space-x-1.5 p-2 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                        <span>Baca Materi</span>
                      </button>
                      
                      {isFullVoiceEnabled(userSession) && (
                        <button
                          onClick={() => speakText(`Materi ${mat.title}. ${mat.content}`)}
                          title="Bacakan dengan suara"
                          className="text-xs font-bold text-slate-600 hover:text-[#0066CC] flex items-center space-x-1.5 p-2 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                          <span>Dengarkan Materi</span>
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => openFlashcards(mat)}
                      data-voice-command="buka study cards"
                      className="px-4 py-2 bg-[#0066CC] hover:bg-[#0052A3] text-white font-bold text-xs rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] flex items-center space-x-1.5 transition-all"
                    >
                      <span>Study Cards ({mat.flashcards.length})</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== TAB 3: LATIHAN SOAL ==================== */}
        {activeSidebarTab === "latihan" && room && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <h2 className="text-xl md:text-2xl font-black text-slate-900">Latihan Soal Interaktif ({room.code})</h2>
              <span className="text-xs font-bold text-slate-700">{(room?.quizzes || []).length} Paket Soal</span>
            </div>

            {/* Quiz Tabs Selector */}
            {room.quizzes && room.quizzes.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {room.quizzes.map((quiz, index) => (
                  <button
                    key={quiz.id}
                    onClick={() => {
                      setActiveQuizIndex(index);
                      setQuizAnswers({}); // reset answers when switching tab
                      setQuizSubmitted(false);
                    }}
                    className={`px-6 py-3 rounded-2xl font-bold text-sm whitespace-nowrap transition-all ${
                      activeQuizIndex === index 
                        ? "bg-[#0066CC] text-white shadow-[0_4px_12px_rgba(0,0,0,0.05)]" 
                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    Latihan Soal {index + 1}
                  </button>
                ))}
              </div>
            )}

            {room.quizzes && room.quizzes.length > 0 ? (
              <div key={room.quizzes[activeQuizIndex].id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.05)] animate-in slide-in-from-right-4 duration-300">
                <div className="mb-6 pb-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">{room.quizzes[activeQuizIndex].title}</h3>
                    <p className="text-xs text-slate-700 font-medium mt-1">{room.quizzes[activeQuizIndex].description}</p>
                  </div>
                  <button
                    onClick={() => speakText(`Latihan Soal ${room.quizzes[activeQuizIndex].title}. ${room.quizzes[activeQuizIndex].description}`)}
                    className="px-3.5 py-1.5 bg-slate-100 text-slate-700 hover:text-[#0066CC] font-bold text-xs rounded-xl self-start md:self-auto"
                  >
                    Dengarkan Instruksi Soal
                  </button>
                </div>

                {/* Questions List */}
                <div className="space-y-8">
                  {room.quizzes[activeQuizIndex].questions.map((q, qIdx) => {
                    const selectedOpt = quizAnswers[q.id];
                    const isCorrect = selectedOpt === q.answerIndex;
                    return (
                      <div key={q.id} className="p-6 md:p-8 bg-slate-50 border-2 border-slate-200 rounded-3xl space-y-5 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                        <div className="flex items-start justify-between">
                          <h4 className="font-black text-lg md:text-xl lg:text-2xl text-slate-900 leading-snug">
                            {qIdx + 1}. {q.question}
                          </h4>
                          <button
                            onClick={() => speakText(`Soal nomor ${qIdx + 1}: ${q.question}`)}
                            className="text-xs md:text-sm font-extrabold text-[#0066CC] hover:underline shrink-0 ml-3"
                          >
                            Bacakan Soal
                          </button>
                        </div>

                        {/* Options */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                          {q.options.map((opt, optIdx) => {
                            const isSelected = selectedOpt === optIdx;
                            return (
                              <button
                                key={optIdx}
                                onClick={() => {
                                  if (!quizSubmitted) {
                                    setQuizAnswers({ ...quizAnswers, [q.id]: optIdx });
                                  }
                                }}
                                className={`p-5 md:p-6 rounded-2xl text-base md:text-lg lg:text-xl font-extrabold text-left transition-all duration-200 border-2 flex items-center justify-between ${
                                  isSelected
                                    ? "bg-[#0066CC] border-[#0066CC] text-white shadow-[0_4px_12px_rgba(0,0,0,0.05)] ring-4 ring-[#0066CC]/20 scale-[1.01]"
                                    : "bg-white border-slate-200 text-slate-900 hover:border-[#0066CC] hover:bg-slate-50"
                                }`}
                              >
                                <span>
                                  {String.fromCharCode(65 + optIdx)}. {opt}
                                </span>
                                {isSelected && <span className="font-black ml-2">✓</span>}
                              </button>
                            );
                          })}
                        </div>

                        {/* Explanation after submission */}
                        {quizSubmitted && selectedOpt !== undefined && (
                          <div className={`p-4 rounded-2xl text-base md:text-lg font-black ${isCorrect ? "bg-emerald-100 border border-emerald-300 text-emerald-950" : "bg-rose-100 border border-rose-300 text-rose-950"}`}>
                            {isCorrect ? "Benar! " : "Kurang Tepat. "} {q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Submit Quiz Action */}
                <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
                  {quizSubmitted ? (
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
                      <div className="flex-1">
                        <span className="font-black text-base md:text-lg text-[#0066CC] block mb-1">
                          Kuis Selesai! Skor Kamu Berhasil Dicatat.
                        </span>
                        <p className="text-sm font-bold text-slate-700">
                          {(() => {
                            let correct = 0;
                            room.quizzes[activeQuizIndex].questions.forEach(q => {
                              if (quizAnswers[q.id] === q.answerIndex) correct++;
                            });
                            return `Kamu menjawab benar ${correct} dari ${room.quizzes[activeQuizIndex].questions.length} soal.`;
                          })()}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setQuizSubmitted(false);
                          setQuizAnswers({});
                        }}
                        className="px-6 py-3.5 bg-slate-200 text-slate-800 font-extrabold text-sm md:text-base rounded-2xl hover:bg-slate-300 w-full sm:w-auto"
                      >
                        Ulangi Kuis
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={async () => {
                        const quiz = room.quizzes[activeQuizIndex];
                        const totalQuestions = quiz.questions.length;
                        const answeredQuestions = Object.keys(quizAnswers).length;
                        if (answeredQuestions < totalQuestions) {
                          alert(`Anda baru menjawab ${answeredQuestions} dari ${totalQuestions} soal.`);
                          return;
                        }
                        
                        // Calculate score
                        let correct = 0;
                        quiz.questions.forEach(q => {
                          if (quizAnswers[q.id] === q.answerIndex) correct++;
                        });
                        const wrong = totalQuestions - correct;
                        const score = Math.round((correct / totalQuestions) * 100);

                        setQuizSubmitted(true);
                        speakText("Kuis selesai dikerjakan. Hasil jawaban kamu telah diperiksa.");

                        // Save to Supabase database
                        if (userSession && activeCode) {
                          await saveQuizSubmission({
                            quizId: quiz.id,
                            roomCode: activeCode,
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
                      className="px-8 py-4 bg-[#0066CC] hover:bg-[#0052A3] text-white font-black text-base md:text-lg rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all ml-auto w-full md:w-auto"
                    >
                      Kirim Jawaban Latihan Soal
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
                <p className="text-slate-700 font-bold">Belum ada latihan soal yang diunggah.</p>
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 4: UJIAN ==================== */}
        {activeSidebarTab === "ujian" && room && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl md:text-3xl font-black text-slate-900">Ujian Resmi Kelas ({room.code})</h2>
              <span className="text-sm font-bold text-slate-700">{(room?.exams || []).length} Ujian Terjadwal</span>
            </div>

            {!room?.exams || room.exams.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center max-w-md mx-auto my-8">
                <h3 className="text-xl font-black text-slate-900">Belum Ada Ujian Terjadwal</h3>
                <p className="text-sm text-slate-700 font-medium mt-1">
                  Guru kelas belum mengunggah paket soal ujian resmi untuk kode room {room.code}.
                </p>
              </div>
            ) : (
              (room?.exams || []).map((exam) => (
                <div key={exam.id} className="bg-white border-2 border-slate-200 rounded-3xl p-6 md:p-10 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                  {/* Exam Header Bar with Timer */}
                  <div className="mb-8 pb-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <span className="px-3 py-1 bg-rose-500 text-white font-black text-xs rounded-md tracking-wider uppercase mb-2 inline-block">
                        UJIAN RESMI BERWAKTU
                      </span>
                      <h3 className="text-xl md:text-2xl font-black text-slate-900">{exam.title}</h3>
                    </div>

                    <div className="flex items-center space-x-3 bg-rose-50 border-2 border-rose-200 px-5 py-2.5 rounded-2xl">
                      <div>
                        <p className="text-xs font-bold text-rose-800 uppercase">Sisa Waktu</p>
                        <p className="text-base font-black text-rose-700 tracking-wider">
                          {formatTime(examTimer)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Exam Questions List */}
                  <div className="space-y-8">
                    {exam.questions.map((eq, eqIdx) => {
                      const selectedOpt = examAnswers[eq.id];
                      const isEssay = eq.type === "essay" || !eq.options || eq.options.length === 0;
                      return (
                        <div key={eq.id} className="p-6 md:p-8 bg-slate-50 border-2 border-slate-200 rounded-3xl space-y-5 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                            <span className={`px-3 py-1 font-extrabold text-xs rounded-lg uppercase tracking-wider ${
                              isEssay ? "bg-purple-100 text-purple-800 border border-purple-200" : "bg-slate-200 text-slate-700"
                            }`}>
                              {isEssay ? `Soal Essay / Uraian ${eq.maxPoints ? `(${eq.maxPoints} Poin)` : ""}` : `Soal Pilihan Ganda (PG)`}
                            </span>
                            {isEssay && (
                              <button
                                type="button"
                                onClick={() => toggleDictation(eq.id)}
                                className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer ${
                                  listeningEssayId === eq.id
                                    ? "bg-rose-500 text-white animate-pulse shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
                                    : "bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100"
                                }`}
                              >
                                <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
                                  <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                                  <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
                                </svg>
                                <span>{listeningEssayId === eq.id ? "Mendengarkan..." : "Dikte Suara (Speech-to-Text)"}</span>
                              </button>
                            )}
                          </div>

                          <h4 className="font-black text-lg md:text-xl lg:text-2xl text-slate-900 leading-snug">
                            Soal {eqIdx + 1}. {eq.question}
                          </h4>

                          {isEssay ? (
                            <div className="space-y-3 pt-2">
                              <textarea
                                value={examEssayAnswers[eq.id] || ""}
                                onChange={(e) => {
                                  if (!examSubmitted) {
                                    setExamEssayAnswers({ ...examEssayAnswers, [eq.id]: e.target.value });
                                  }
                                }}
                                disabled={examSubmitted}
                                placeholder="Tuliskan atau diktekan uraian jawaban kamu secara lengkap di sini..."
                                rows={4}
                                className="w-full p-4 md:p-5 rounded-2xl border-2 border-slate-200 focus:border-[#0066CC] focus:outline-hidden text-slate-900 font-medium text-base transition-all shadow-inner bg-white disabled:bg-slate-100"
                              />
                              <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
                                <span>
                                  {(examEssayAnswers[eq.id] || "").trim() ? (examEssayAnswers[eq.id] || "").trim().split(/\s+/).length : 0} Kata | {(examEssayAnswers[eq.id] || "").length} Karakter
                                </span>
                                {(examEssayAnswers[eq.id] || "").trim() !== "" && (
                                  <span className="text-emerald-600 font-black flex items-center space-x-1">
                                    <span>✓ Jawaban Essay Tersimpan</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                              {eq.options?.map((opt, optIdx) => {
                                const isSelected = selectedOpt === optIdx;
                                return (
                                  <button
                                    key={optIdx}
                                    onClick={() => {
                                      if (!examSubmitted) {
                                        setExamAnswers({ ...examAnswers, [eq.id]: optIdx });
                                      }
                                    }}
                                    className={`p-5 md:p-6 rounded-2xl text-base md:text-lg lg:text-xl font-extrabold text-left transition-all duration-200 border-2 flex items-center justify-between ${
                                      isSelected
                                        ? "bg-[#0066CC] border-[#0066CC] text-white shadow-[0_4px_12px_rgba(0,0,0,0.05)] ring-4 ring-[#0066CC]/20 scale-[1.01]"
                                        : "bg-white border-slate-200 text-slate-900 hover:border-[#0066CC] hover:bg-slate-50"
                                    }`}
                                  >
                                    <span>
                                      {String.fromCharCode(65 + optIdx)}. {opt}
                                    </span>
                                    {isSelected && <span className="font-black ml-2">✓</span>}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Submit Exam Button */}
                  <div className="mt-8 pt-6 border-t border-slate-200 flex items-center justify-between">
                    {examSubmitted ? (
                      <div className="p-5 bg-teal-50 border-2 border-teal-200 text-teal-950 font-black text-lg rounded-2xl w-full text-center">
                        Ujian Telah Dikumpulkan! Jawaban Ujian Berhasil Diteruskan ke Guru Kelas.
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setExamSubmitted(true);
                          speakText("Ujian resmi berhasil dikumpulkan. Terima kasih telah menyelesaikan ujian tepat waktu.");
                        }}
                        className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all"
                      >
                        Kumpulkan Ujian Sekarang
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* ==================== 3. MODAL STUDY CARDS (INTERACTIVE 3D FLASHCARDS ENGINE) ==================== */}
      
      {/* MODAL BACA MATERI PDF */}
      {activeMaterialPdf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
          {/* Overlay Background */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            onClick={() => setActiveMaterialPdf(null)}
          />
          
          <div className="relative w-full max-w-5xl h-full md:h-[90vh] bg-[#F8FAFC] rounded-3xl shadow-2xl flex flex-col overflow-hidden border-4 border-slate-200">
            {/* Header Modal */}
            <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-600 font-black">
                  M
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg md:text-xl truncate max-w-lg">
                    {activeMaterialPdf.title}
                  </h3>
                  <p className="text-xs font-bold text-slate-700">Dokumen Pembelajaran</p>
                </div>
              </div>
              <button
                onClick={() => setActiveMaterialPdf(null)}
                className="w-10 h-10 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-colors shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
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

      {activeFlashcardMaterial && activeFlashcardMaterial.flashcards.length > 0 && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative animate-in fade-in zoom-in duration-300">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#0066CC] bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-100">
                  STUDY CARDS (FLASHCARDS 3D)
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  {activeFlashcardMaterial.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveFlashcardMaterial(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Flashcard Counter Badge */}
            <div className="text-center mb-3 text-xs font-bold text-slate-600">
              Kartu {flashcardIndex + 1} dari {activeFlashcardMaterial.flashcards.length}
            </div>

            {/* 3D Flip Card Container */}
            {(() => {
              const currentText = isFlipped
                ? activeFlashcardMaterial.flashcards[flashcardIndex].back
                : activeFlashcardMaterial.flashcards[flashcardIndex].front;

              const textLength = currentText.length;
              let fontSizeClass = "text-xl md:text-2xl font-black";
              if (textLength > 160) {
                fontSizeClass = "text-sm md:text-base font-bold leading-relaxed";
              } else if (textLength > 90) {
                fontSizeClass = "text-base md:text-lg font-extrabold leading-normal";
              }

              return (
                <div
                  onClick={toggleFlip}
                  className="w-full h-72 md:h-[300px] cursor-pointer perspective-1000 mb-6 group"
                >
                  <div
                    className={`w-full h-full rounded-3xl p-6 flex flex-col items-center justify-between text-center shadow-lg transition-transform duration-500 transform-style-3d overflow-hidden ${
                      isFlipped
                        ? "bg-gradient-to-br from-[#0066CC] to-[#0F9DB6] text-white rotate-y-180"
                        : "bg-white border-2 border-[#0066CC]/30 text-slate-900 hover:border-[#0066CC]"
                    }`}
                  >
                    <span className="text-[11px] font-black uppercase tracking-wider opacity-80 shrink-0">
                      {isFlipped ? "JAWABAN / PENJELASAN (SISI BELAKANG)" : "PERTANYAAN / KONSEP (SISI DEPAN)"}
                    </span>

                    <div className="my-auto w-full max-h-[170px] md:max-h-[200px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-2 py-1 flex items-center justify-center">
                      <p className={`${fontSizeClass} leading-relaxed text-center`}>
                        {currentText}
                      </p>
                    </div>

                    <span className="mt-2 text-[10px] font-extrabold opacity-70 underline shrink-0">
                      Klik kartu untuk memutar (Flip)
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Controls Row */}
            <div className="flex items-center justify-between">
              <button
                onClick={prevFlashcard}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all"
              >
                ← Kartu Sebelum
              </button>

              <button
                onClick={() => {
                  const fc = activeFlashcardMaterial.flashcards[flashcardIndex];
                  speakText(isFlipped ? `Jawaban: ${fc.back}` : `Pertanyaan: ${fc.front}`);
                }}
                className="px-4 py-2.5 bg-teal-50 text-[#0066CC] border border-teal-200 font-extrabold text-xs rounded-xl hover:bg-teal-100 transition-all"
              >
                Suara Kartu
              </button>

              <button
                onClick={nextFlashcard}
                className="px-4 py-2.5 bg-[#0066CC] hover:bg-[#0052A3] text-white font-bold text-xs rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all"
              >
                Kartu Lanjut →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
