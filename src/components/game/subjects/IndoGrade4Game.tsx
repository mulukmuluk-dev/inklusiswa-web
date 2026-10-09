"use client";

import React, { useState, useEffect, useRef } from "react";
import { speakGlobal } from "@/lib/soundControl";
import { playPopSound, playSuccessFanfare, playClueChime } from "@/lib/audioSynthesizer";

interface QuestionItem {
  id: number;
  question: string;
  visualHelper?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface LevelConceptData {
  title: string;
  conceptText: string;
  questions: QuestionItem[];
}

interface IndoGrade4GameProps {
  levelId: number;
  onLevelComplete: (levelId: number, starsEarned: number) => void;
  accessibilityMode?: string;
}

export function IndoGrade4Game({ levelId, onLevelComplete, accessibilityMode }: IndoGrade4GameProps) {
  const [phase, setPhase] = useState<"materi" | "game">("materi");

  // Phase 1 interactive state
  const [activeMajas, setActiveMajas] = useState<string>("Personifikasi");
  const [activeLetterPart, setActiveLetterPart] = useState<string>("Salam Pembuka");

  // Phase 2: 10 questions state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState<boolean>(false);
  const [wrongAttempts, setWrongAttempts] = useState<number>(0);
  const [showClue, setShowClue] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [questionsList, setQuestionsList] = useState<QuestionItem[]>([]);
  const isProcessingRef = useRef<boolean>(false);

  // Fisher-Yates shuffle helper
  const shuffleQuestions = (data: LevelConceptData): QuestionItem[] => {
    return data.questions.map((q) => {
      const correctText = q.options[q.correctIndex];
      const newOpts = [...q.options];
      for (let i = newOpts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newOpts[i], newOpts[j]] = [newOpts[j], newOpts[i]];
      }
      return {
        ...q,
        options: newOpts,
        correctIndex: newOpts.indexOf(correctText),
      };
    });
  };

  useEffect(() => {
    setPhase("materi");
    setActiveMajas("Personifikasi");
    setActiveLetterPart("Salam Pembuka");

    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setWrongAttempts(0);
    setShowClue(false);
    setIsCompleted(false);
    isProcessingRef.current = false;

    const data = getGrade4LevelData(levelId);
    setQuestionsList(shuffleQuestions(data));
    speakGlobal(data.conceptText);
  }, [levelId]);

  const levelData = getGrade4LevelData(levelId);
  const activeQuestions = questionsList.length > 0 ? questionsList : levelData.questions;
  const currentQ = activeQuestions[currentQuestionIndex] || activeQuestions[0];

  useEffect(() => {
    if (phase === "game" && !isCompleted && currentQ) {
      speakGlobal(`Soal nomor ${currentQuestionIndex + 1}. ${currentQ.question}`);
    }
  }, [currentQuestionIndex, phase, isCompleted, currentQ]);

  const handleStartGameChallenge = () => {
    playPopSound();
    setPhase("game");
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setWrongAttempts(0);
    setShowClue(false);
    isProcessingRef.current = false;
    setQuestionsList(shuffleQuestions(levelData));
  };

  const handleSelectAnswer = (optionIdx: number) => {
    if (isProcessingRef.current || isAnswerChecked || isCompleted) return;
    isProcessingRef.current = true;
    playPopSound();
    setSelectedOption(optionIdx);

    const isCorrect = optionIdx === currentQ.correctIndex;
    setIsAnswerChecked(true);

    if (isCorrect) {
      playSuccessFanfare();
      const updatedScore = Math.min(score + 1, levelData.questions.length);
      setScore(updatedScore);
      speakGlobal("Hebat! Jawabanmu benar! " + currentQ.explanation);

      setTimeout(() => {
        if (currentQuestionIndex + 1 < levelData.questions.length) {
          setCurrentQuestionIndex((prev) => prev + 1);
          setSelectedOption(null);
          setIsAnswerChecked(false);
          setWrongAttempts(0);
          setShowClue(false);
          isProcessingRef.current = false;
        } else {
          setIsCompleted(true);
          isProcessingRef.current = false;
          const finalScore = updatedScore;
          const stars = finalScore >= 9 ? 3 : finalScore >= 7 ? 2 : 1;
          speakGlobal(`Luar biasa! Kamu telah menyelesaikan 10 soal Bahasa Indonesia Kelas 4 dan meraih ${stars} bintang!`);
        }
      }, 1400);
    } else {
      const attempts = wrongAttempts + 1;
      setWrongAttempts(attempts);
      if (attempts >= 2) {
        setShowClue(true);
        playClueChime();
        speakGlobal("Petunjuk aktif: Jawaban yang tepat disorot warna hijau. " + currentQ.explanation);
      } else {
        speakGlobal("Jawaban belum tepat. Coba perhatikan lagi pertanyaannya!");
      }
      setTimeout(() => {
        setIsAnswerChecked(false);
        setSelectedOption(null);
        isProcessingRef.current = false;
      }, 1200);
    }
  };

  const handleFinishLevel = () => {
    playSuccessFanfare();
    const finalScore = Math.min(score, levelData.questions.length);
    const stars = finalScore >= 9 ? 3 : finalScore >= 7 ? 2 : 1;
    onLevelComplete(levelId, stars);
  };

  return (
    <div className="w-full flex flex-col items-center justify-between min-h-[560px] p-4 md:p-8 bg-[#FFE296] rounded-[32px] border-4 border-[#3C632A] text-[#3C632A] shadow-[8px_8px_0px_0px_#3C632A] relative overflow-hidden">
      
      {/* Header Info Level */}
      <div className="w-full flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center space-x-3">
          <span className="px-4 py-1.5 bg-[#7FD13B] text-white font-black text-xs md:text-sm rounded-xl border-2 border-[#3C632A]">
            BAHASA INDONESIA KELAS 4 SD • LEVEL {levelId} dari 7
          </span>
          <span className="text-xs md:text-sm font-black uppercase text-[#C3631D]">
            {phase === "materi" ? "📖 Tahap 1: Belajar Konsep" : "🎮 Tahap 2: Tantangan 10 Soal"}
          </span>
        </div>

        {phase === "game" && !isCompleted && (
          <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-xl border-2 border-[#3C632A]">
            <span className="text-xs font-black text-[#3C632A]">Skor:</span>
            <span className="text-sm font-black text-[#C3631D]">{score} / {levelData.questions.length}</span>
          </div>
        )}
      </div>

      {/* ================= FASE 1: PENGENALAN KONSEP MATERI ================= */}
      {phase === "materi" && (
        <div className="w-full flex-1 flex flex-col items-center justify-between space-y-6 animate-in fade-in zoom-in duration-300">
          <div className="text-center max-w-2xl">
            <h2 className="text-2xl md:text-4xl font-black text-[#3C632A] drop-shadow-sm mb-2">
              {levelData.title}
            </h2>
            <p className="text-sm md:text-base font-extrabold text-[#3C632A]/90 leading-relaxed bg-white/70 p-4 rounded-2xl border-2 border-[#3C632A]">
              {levelData.conceptText}
            </p>
          </div>

          {/* INTERACTIVE WORKBENCH PER LEVEL */}
          <div className="w-full max-w-xl bg-white p-6 rounded-[28px] border-4 border-[#3C632A] shadow-[6px_6px_0px_0px_#3C632A] flex flex-col items-center">
            {levelId === 1 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Bagan Gagasan Pokok vs Gagasan Pendukung:
                </span>
                <div className="p-3 bg-teal-50 border-2 border-teal-300 rounded-xl w-full text-center">
                  <span className="text-xs font-black text-teal-950 uppercase bg-yellow-200 px-2 py-0.5 rounded">
                    ⭐ Gagasan Pokok (Ide Utama Paragraf)
                  </span>
                </div>
                <div className="w-full grid grid-cols-2 gap-2 text-[11px] font-bold text-slate-700">
                  <div className="p-2 bg-slate-50 border border-slate-300 rounded-lg">
                    📌 Gagasan Pendukung 1: Penjelasan fakta pertama
                  </div>
                  <div className="p-2 bg-slate-50 border border-slate-300 rounded-lg">
                    📌 Gagasan Pendukung 2: Bukti atau contoh pendukung
                  </div>
                </div>
              </div>
            )}

            {levelId === 2 && (
              <div className="w-full flex flex-col items-center space-y-3 text-center">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Struktur Teks Petunjuk (Prosedur):
                </span>
                <div className="grid grid-cols-3 gap-2 w-full text-xs font-bold">
                  <div className="p-2.5 bg-yellow-50 border border-yellow-300 rounded-xl">🎯 1. Tujuan / Judul</div>
                  <div className="p-2.5 bg-blue-50 border border-blue-300 rounded-xl">🛠️ 2. Alat & Bahan</div>
                  <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl">👣 3. Langkah Runtut</div>
                </div>
              </div>
            )}

            {levelId === 3 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Format Laporan Hasil Wawancara:
                </span>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 text-xs text-left space-y-1 w-full text-slate-800">
                  <p>• <strong>Latar Belakang & Tujuan:</strong> Alasan wawancara dilakukan.</p>
                  <p>• <strong>Topik & Narasumber:</strong> Nama dan profesi orang yang diwawancarai.</p>
                  <p>• <strong>Hasil Wawancara:</strong> Rangkuman tanya jawab dengan kalimat efektif.</p>
                  <p>• <strong>Kesimpulan:</strong> Intisari informasi dari narasumber.</p>
                </div>
              </div>
            )}

            {levelId === 4 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Mengenal Majas Dasar (Gaya Bahasa Kiasan):
                </span>
                <div className="grid grid-cols-2 gap-2 w-full">
                  {[
                    { nama: "Personifikasi", desc: "Benda mati berbuat seperti manusia", contoh: "Nyiur melambai di tepi pantai 🌴" },
                    { nama: "Metafora", desc: "Perumpamaan langsung tanpa kata pembanding", contoh: "Ibu adalah pahlawan tanpa tanda jasa 🦸‍♀️" },
                  ].map((m) => (
                    <button
                      key={m.nama}
                      type="button"
                      onClick={() => {
                        setActiveMajas(m.nama);
                        playPopSound();
                        speakGlobal(`Majas ${m.nama}. Contoh: ${m.contoh}`);
                      }}
                      className={`p-3 rounded-xl border-2 border-[#3C632A] text-left transition-all ${
                        activeMajas === m.nama ? "bg-[#FF5685] text-white scale-102" : "bg-teal-50 text-[#3C632A]"
                      }`}
                    >
                      <span className="text-xs font-black block">{m.nama}</span>
                      <span className="text-[10px] opacity-90 block mt-0.5">{m.desc}</span>
                      <span className="text-[10px] italic block mt-1 font-bold">"{m.contoh}"</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {levelId === 5 && (
              <div className="w-full flex flex-col items-center space-y-3 text-center">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  6 Unsur Intrinsik Cerita Fiksi:
                </span>
                <div className="grid grid-cols-3 gap-2 w-full text-[11px] font-bold">
                  <div className="p-2 bg-slate-100 rounded-lg">1. Tema</div>
                  <div className="p-2 bg-slate-100 rounded-lg">2. Tokoh & Watak</div>
                  <div className="p-2 bg-slate-100 rounded-lg">3. Latar (Setting)</div>
                  <div className="p-2 bg-slate-100 rounded-lg">4. Alur (Plot)</div>
                  <div className="p-2 bg-slate-100 rounded-lg">5. Sudut Pandang</div>
                  <div className="p-2 bg-slate-100 rounded-lg">6. Amanat (Pesan)</div>
                </div>
              </div>
            )}

            {levelId === 6 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Bagian-Bagian Surat Pribadi:
                </span>
                <div className="p-3 bg-yellow-50 rounded-xl border border-yellow-300 text-xs w-full text-slate-800 space-y-1">
                  <p>1. Tempat & Tanggal Surat (Jakarta, 10 Oktober 2026)</p>
                  <p>2. Alamat Tujuan (Untuk sahabatku, Rian)</p>
                  <p>3. Salam Pembuka (Halo Rian / Salam manis,)</p>
                  <p>4. Isi Surat (Kabar dan cerita liburan)</p>
                  <p>5. Salam Penutup & Tanda Tangan (Sahabatmu, Budi)</p>
                </div>
              </div>
            )}

            {levelId === 7 && (
              <div className="w-full flex flex-col items-center space-y-3 text-center">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Kamus Besar Bahasa Indonesia (KBBI):
                </span>
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-300 text-xs text-left w-full space-y-1.5 text-purple-950">
                  <p>📖 <strong>Kata Dasar:</strong> Selalu cari kata dasarnya dulu di kamus!</p>
                  <p className="font-mono text-[11px] bg-white p-1.5 rounded border border-purple-200">
                    Contoh: Kata 'memasak' dicari pada huruf <strong>M</strong> di kata dasar <strong>'masak'</strong>.
                  </p>
                  <p>📚 <strong>Tesaurus:</strong> Kamus persamaan kata (sinonim) dan lawan kata (antonim).</p>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleStartGameChallenge}
            className="px-8 py-4 bg-[#7FD13B] hover:bg-[#6EB832] text-white font-black text-lg md:text-xl rounded-2xl border-4 border-[#3C632A] shadow-[4px_4px_0px_0px_#3C632A] hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center space-x-3"
          >
            <span>Mulai Tantangan Soal (10 Soal)</span>
            <span>🚀</span>
          </button>
        </div>
      )}

      {/* ================= FASE 2: TANTANGAN 10 SOAL BERURUTAN ================= */}
      {phase === "game" && !isCompleted && (
        <div className="w-full flex-1 flex flex-col items-center justify-between space-y-6 animate-in fade-in duration-300">
          
          <div className="w-full max-w-xl">
            <div className="flex justify-between text-xs font-black text-[#3C632A] mb-1">
              <span>Soal {currentQuestionIndex + 1} dari {levelData.questions.length}</span>
              <span>{Math.round(((currentQuestionIndex + 1) / levelData.questions.length) * 100)}%</span>
            </div>
            <div className="w-full h-3.5 bg-white rounded-full border-2 border-[#3C632A] overflow-hidden">
              <div
                className="h-full bg-[#7FD13B] transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / levelData.questions.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="w-full max-w-xl bg-white p-6 md:p-8 rounded-[28px] border-4 border-[#3C632A] shadow-[6px_6px_0px_0px_#3C632A] text-center space-y-4">
            {currentQ.visualHelper && (
              <div className="text-5xl md:text-6xl my-2 flex justify-center animate-bounce">
                {currentQ.visualHelper}
              </div>
            )}

            <h3 className="text-lg md:text-2xl font-black text-[#1F2937] leading-relaxed">
              {currentQ.question}
            </h3>

            {showClue && (
              <div className="p-3 bg-teal-50 border-2 border-teal-300 rounded-xl text-teal-900 text-xs font-extrabold animate-pulse">
                💡 Petunjuk: {currentQ.explanation}
              </div>
            )}
          </div>

          <div className="w-full max-w-xl grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            {currentQ.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === currentQ.correctIndex;

              let btnStyle = "bg-white text-[#3C632A] border-4 border-[#3C632A] hover:bg-[#FFE296]";

              if (isAnswerChecked) {
                if (isSelected && isCorrect) {
                  btnStyle = "bg-[#7FD13B] text-white border-4 border-[#3C632A] scale-105 shadow-md";
                } else if (isSelected && !isCorrect) {
                  btnStyle = "bg-rose-500 text-white border-4 border-[#3C632A] animate-shake";
                }
              }

              if (showClue && isCorrect) {
                btnStyle = "bg-[#7FD13B] text-white border-4 border-[#3C632A] ring-4 ring-yellow-400 animate-pulse";
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectAnswer(idx)}
                  disabled={isAnswerChecked}
                  className={`p-4 md:p-5 rounded-2xl font-black text-base md:text-lg text-center transition-all shadow-[4px_4px_0px_0px_#3C632A] cursor-pointer min-h-[70px] flex items-center justify-center ${btnStyle}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => speakGlobal(`Soal nomor ${currentQuestionIndex + 1}. ${currentQ.question}`)}
            className="text-xs font-extrabold text-[#3C632A] underline hover:opacity-80 flex items-center space-x-1"
          >
            <span>🔊 Bacakan Soal Lagi</span>
          </button>
        </div>
      )}

      {isCompleted && (
        <div className="w-full flex-1 flex flex-col items-center justify-center text-center space-y-6 animate-in zoom-in duration-300">
          <div className="text-6xl md:text-7xl animate-bounce">🏆</div>
          <h2 className="text-3xl md:text-4xl font-black text-[#3C632A]">
            Level {levelId} Selesai!
          </h2>
          <p className="text-lg font-bold text-slate-800">
            Kamu menjawab benar <span className="text-[#C3631D] font-black">{score}</span> dari 10 soal!
          </p>

          <div className="flex space-x-2 text-4xl">
            {Array.from({ length: score >= 9 ? 3 : score >= 7 ? 2 : 1 }).map((_, i) => (
              <span key={i}>⭐</span>
            ))}
          </div>

          <button
            onClick={handleFinishLevel}
            className="px-8 py-4 bg-[#7FD13B] hover:bg-[#6EB832] text-white font-black text-xl rounded-2xl border-4 border-[#3C632A] shadow-[4px_4px_0px_0px_#3C632A] hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            Simpan Bintang & Lanjut ⭐
          </button>
        </div>
      )}

    </div>
  );
}

// ================= DATA SOAL KELAS 4 SD (7 LEVEL x 10 SOAL = 70 SOAL LENGKAP) =================
function getGrade4LevelData(levelId: number): LevelConceptData {
  switch (levelId) {
    case 1:
      return {
        title: "Gagasan Pokok & Gagasan Pendukung",
        conceptText: "Gagasan pokok adalah topik utama yang dibahas dalam paragraf, sedangkan gagasan pendukung adalah uraian atau bukti tambahan yang mendukung gagasan pokok.",
        questions: [
          {
            id: 1,
            question: "Gagasan yang mendasari terbentuknya sebuah paragraf dinamakan...",
            visualHelper: "🌟",
            options: ["Gagasan pokok", "Gagasan pendukung", "Kalimat tanya"],
            correctIndex: 0,
            explanation: "Gagasan pokok adalah inti sari pembahasan dalam sebuah paragraf.",
          },
          {
            id: 2,
            question: "Gagasan yang berfungsi menguraikan, memperjelas, atau memberi contoh bagi gagasan pokok disebut...",
            visualHelper: "📌",
            options: ["Gagasan pendukung", "Gagasan pokok", "Judul bacaan"],
            correctIndex: 0,
            explanation: "Gagasan pendukung berisi informasi tambahan yang menguatkan gagasan pokok.",
          },
          {
            id: 3,
            question: "Di manakah posisi gagasan pokok biasanya dapat ditemukan dalam paragraf?",
            visualHelper: "📖",
            options: ["Awal, akhir, atau campuran awal dan akhir paragraf", "Hanya di judul buku", "Di daftar isi"],
            correctIndex: 0,
            explanation: "Gagasan pokok bisa di awal (deduktif), di akhir (induktif), atau campuran.",
          },
          {
            id: 4,
            question: "Bacalah teks: 'Tari Saman adalah tarian tradisional asal Aceh. Tarian ini dimainkan puluhan penari yang duduk berlutut berbanjar dengan gerakan tepukan tangan yang sangat kompak.' Gagasan pokok paragraf tersebut adalah...",
            visualHelper: "💃",
            options: ["Tari Saman tarian tradisional asal Aceh", "Cara duduk penari Saman", "Baju adat penari Aceh"],
            correctIndex: 0,
            explanation: "Kalimat pertama merupakan gagasan pokok tentang identitas Tari Saman.",
          },
          {
            id: 5,
            question: "Dari teks Tari Saman di atas, yang merupakan gagasan pendukung adalah...",
            visualHelper: "👏",
            options: ["Kekompakan gerakan tepukan tangan penari Saman", "Tari Saman berasal dari Aceh", "Sejarah Pulau Sumatera"],
            correctIndex: 0,
            explanation: "Uraian tentang kekompakan gerakan merupakan gagasan pendukung yang menjelaskan tarian tersebut.",
          },
          {
            id: 6,
            question: "Jumlah gagasan pokok dalam satu paragraf idealnya adalah...",
            visualHelper: "1️⃣",
            options: ["Satu", "Tiga", "Lima"],
            correctIndex: 0,
            explanation: "Satu paragraf yang padu hanya memiliki satu gagasan pokok.",
          },
          {
            id: 7,
            question: "Langkah awal yang paling tepat untuk menentukan gagasan pokok adalah...",
            visualHelper: "👓",
            options: ["Membaca seluruh paragraf dengan saksama", "Menghitung jumlah baris", "Menutup buku"],
            correctIndex: 0,
            explanation: "Membaca dengan cermat adalah kunci memahami alur pemikiran penulis.",
          },
          {
            id: 8,
            question: "Ciri-ciri gagasan pendukung adalah...",
            visualHelper: "📑",
            options: ["Berupa uraian perincian, contoh, dan data pelengkap", "Berdiri sendiri tanpa kaitan topik", "Hanya berupa satu kata saja"],
            correctIndex: 0,
            explanation: "Gagasan pendukung menjabarkan hal-hal rinci untuk memperjelas topik.",
          },
          {
            id: 9,
            question: "Jika kalimat-kalimat dalam satu paragraf saling berkaitan erat dan tidak menyimpang, paragraf tersebut memiliki sifat...",
            visualHelper: "🔗",
            options: ["Kepaduan (koherensi)", "Kerancuan", "Kepalsuan"],
            correctIndex: 0,
            explanation: "Kepaduan paragraf tercipta saat semua kalimat saling bertautan mendukung ide pokok.",
          },
          {
            id: 10,
            question: "Gagasan pokok dapat dituangkan secara tersirat maupun...",
            visualHelper: "✍️",
            options: ["Tersurat (tertulis langsung di teks)", "Tersembunyi tanpa kata", "Tertutup tinta"],
            correctIndex: 0,
            explanation: "Tersurat berarti tertulis jelas dalam kalimat utama di teks.",
          },
        ],
      };

    case 2:
      return {
        title: "Struktur Teks Petunjuk/Prosedur",
        conceptText: "Teks prosedur menjelaskan cara membuat atau memakai sesuatu dengan struktur: Judul/Tujuan, Alat & Bahan, serta Langkah-langkah yang berurutan menggunakan kata kerja aktif.",
        questions: [
          {
            id: 1,
            question: "Struktur teks petunjuk umumnya terdiri dari...",
            visualHelper: "🏗️",
            options: ["Tujuan, Bahan/Alat, dan Langkah-langkah", "Tokoh, Watak, dan Latar", "Sampiran dan Isi"],
            correctIndex: 0,
            explanation: "Teks petunjuk memiliki komponen tujuan, bahan/alat yang dibutuhkan, serta langkah kerja.",
          },
          {
            id: 2,
            question: "Kata kerja yang digunakan dalam teks prosedur umumnya berupa kata kerja...",
            visualHelper: "⚡",
            options: ["Imperatif (perintah/tindakan langsung)", "Masa lalu", "Tanya"],
            correctIndex: 0,
            explanation: "Kata kerja imperatif seperti 'masukkan', 'aduklah', 'tekan tombol' menginstruksikan tindakan.",
          },
          {
            id: 3,
            question: "Contoh kalimat petunjuk penggunaan setrika listrik yang benar adalah...",
            visualHelper: "👔",
            options: ["Tancapkan steker kabel ke stopkontak listrik dengan hati-hati", "Siram setrika dengan air mengalir", "Pegang bagian besi panasnya"],
            correctIndex: 0,
            explanation: "Petunjuk harus mengutamakan keselamatan dan cara operasional yang benar.",
          },
          {
            id: 4,
            question: "Kata penghubung penanda urutan waktu dalam teks petunjuk adalah...",
            visualHelper: "⏳",
            options: ["Pertama, kemudian, selanjutnya, terakhir", "Karena, sebab, akibatnya", "Tetapi, namun, melainkan"],
            correctIndex: 0,
            explanation: "Kata penanda urutan memastikan pembaca tidak salah melangkah.",
          },
          {
            id: 5,
            question: "Tujuan penulisan teks petunjuk resep masakan adalah...",
            visualHelper: "🍲",
            options: ["Memandu pembaca mengolah masakan dengan takaran yang pas", "Menghibur pembaca dengan cerita lucu", "Menceritakan sejarah panci"],
            correctIndex: 0,
            explanation: "Resep memandu tahapan memasak agar menghasilkan masakan yang lezat.",
          },
          {
            id: 6,
            question: "Bila salah satu langkah dalam teks prosedur pembuatan mainan dilewati, akibatnya adalah...",
            visualHelper: "⚠️",
            options: ["Hasil mainan bisa gagal atau tidak berfungsi", "Mainan otomatis jadi lebih bagus", "Waktu bertambah cepat tanpa masalah"],
            correctIndex: 0,
            explanation: "Langkah prosedur harus dikerjakan secara runtut agar hasilnya berhasil.",
          },
          {
            id: 7,
            question: "Bagian teks petunjuk yang mencantumkan sendok, gunting, dan kertas origami termasuk ke dalam bagian...",
            visualHelper: "✂️",
            options: ["Alat dan bahan", "Langkah kerja", "Simpulan akhir"],
            correctIndex: 0,
            explanation: "Benda-benda pendukung kegiatan dicantumkan di bagian alat dan bahan.",
          },
          {
            id: 8,
            question: "Penggunaan kalimat dalam teks prosedur harus bersifat objektif dan...",
            visualHelper: "🎯",
            options: ["Jelas serta tidak menimbulkan makna ganda", "Penuh teka-teki misteri", "Bahasanya puitis"],
            correctIndex: 0,
            explanation: "Petunjuk teknis harus lugas agar pembaca tidak bingung.",
          },
          {
            id: 9,
            question: "Manakah kalimat yang menggunakan kata kerja imperatif?",
            visualHelper: "👉",
            options: ["Aduklah larutan tersebut hingga merata!", "Larutan itu sedang diaduk.", "Apakah larutan sudah merata?"],
            correctIndex: 0,
            explanation: "'Aduklah' adalah bentuk kata kerja perintah (imperatif).",
          },
          {
            id: 10,
            question: "Petunjuk pemakaian obat sirup anak biasanya menyertakan informasi...",
            visualHelper: "🥄",
            options: ["Dosis dan aturan minum sesuai usia", "Cara membuat botol kaca", "Resep makanan penutup"],
            correctIndex: 0,
            explanation: "Dosis dan frekuensi minum sangat penting untuk keselamatan konsumsi obat.",
          },
        ],
      };

    case 3:
      return {
        title: "Wawancara Lanjutan & Laporan",
        conceptText: "Menyusun laporan hasil wawancara menggunakan kalimat efektif, kosa kata baku, dan format terstruktur: topik, narasumber, pewawancara, waktu, serta rangkuman hasil.",
        questions: [
          {
            id: 1,
            question: "Ciri kalimat efektif dalam penulisan laporan wawancara adalah...",
            visualHelper: "✍️",
            options: ["Hemat kata, tidak bertele-tele, dan mudah dipahami", "Menggunakan kata kiasan yang rumit", "Sangat panjang hingga berhalaman-halaman"],
            correctIndex: 0,
            explanation: "Kalimat efektif menyampaikan informasi secara lugas, hemat kata, dan tepat sasaran.",
          },
          {
            id: 2,
            question: "Kata di bawah ini yang merupakan kata baku menurut KBBI adalah...",
            visualHelper: "📚",
            options: ["Apotek", "Apotik", "Apotekh"],
            correctIndex: 0,
            explanation: "Bentuk baku yang benar dalam KBBI adalah 'apotek', bukan apotik.",
          },
          {
            id: 3,
            question: "Kata baku untuk sebutan waktu pelaksanaan kegiatan yang tepat adalah...",
            visualHelper: "🗓️",
            options: ["Jadwal", "Jadual", "Jadwalan"],
            correctIndex: 0,
            explanation: "Bentuk baku resmi adalah 'jadwal'.",
          },
          {
            id: 4,
            question: "Bagian laporan wawancara yang memuat alasan mengapa topik tersebut dipilih adalah...",
            visualHelper: "📋",
            options: ["Latar belakang wawancara", "Daftar pustaka", "Lampiran foto saja"],
            correctIndex: 0,
            explanation: "Latar belakang menjelaskan urgensi dan dasar pemilihan topik.",
          },
          {
            id: 5,
            question: "Kalimat: 'Para hadirin sekalian dipersilakan duduk.' Kalimat tersebut tidak efektif karena...",
            visualHelper: "✂️",
            options: ["Pemborosan kata 'para' dan 'sekalian' (keduanya bermakna jamak)", "Tidak ada predikat", "Kurang panjang"],
            correctIndex: 0,
            explanation: "Cukup gunakan 'Hadirin dipersilakan duduk' atau 'Para hadirin dipersilakan duduk'.",
          },
          {
            id: 6,
            question: "Saat menuliskan perkataan narasumber ke dalam bentuk narasi laporan, kita mengubah kutipan langsung menjadi...",
            visualHelper: "🔄",
            options: ["Kalimat tidak langsung", "Kalimat tanya", "Puisi"],
            correctIndex: 0,
            explanation: "Laporan wawancara biasanya dirangkum dalam bentuk kalimat tidak langsung.",
          },
          {
            id: 7,
            question: "Bentuk kata baku dari 'antri' yang benar adalah...",
            visualHelper: "🚶‍♂️",
            options: ["Antre", "Antri", "Antrian"],
            correctIndex: 0,
            explanation: "Sesuai KBBI, bentuk baku adalah 'antre'.",
          },
          {
            id: 8,
            question: "Siapakah pihak yang menjadi narasumber paling tepat untuk topik 'Pengolahan Sampah Organik Menjadi Kompos'?",
            visualHelper: "🌱",
            options: ["Pakar lingkungan atau pegiat bank sampah", "Masinis kereta api", "Penjual tiket bioskop"],
            correctIndex: 0,
            explanation: "Narasumber harus memiliki keahlian yang sesuai dengan topik yang diteliti.",
          },
          {
            id: 9,
            question: "Bagian akhir dari laporan wawancara yang merangkum poin-poin utama disebut...",
            visualHelper: "🏁",
            options: ["Kesimpulan", "Pendahuluan", "Daftar hadir"],
            correctIndex: 0,
            explanation: "Kesimpulan merangkum intisari jawaban narasumber secara padat.",
          },
          {
            id: 10,
            question: "Bentuk baku dari kata 'praktek' adalah...",
            visualHelper: "🩺",
            options: ["Praktik", "Praktek", "Praktikkan"],
            correctIndex: 0,
            explanation: "Kata baku yang tepat adalah 'praktik'.",
          },
        ],
      };

    case 4:
      return {
        title: "Majas & Bahasa Kiasan Dasar",
        conceptText: "Majas adalah gaya bahasa yang memperindah karya sastra. Majas personifikasi mengibaratkan benda mati seperti manusia, sedangkan metafora membandingkan hal secara langsung.",
        questions: [
          {
            id: 1,
            question: "Gaya bahasa yang melekatkan sifat-sifat manusia pada benda mati dinamakan majas...",
            visualHelper: "🌳",
            options: ["Personifikasi", "Metafora", "Hiperbola"],
            correctIndex: 0,
            explanation: "Personifikasi menganggap benda mati dapat berbuat seperti manusia (person).",
          },
          {
            id: 2,
            question: "'Ombak berkejaran di tepi pantai.' Kalimat tersebut menggunakan majas...",
            visualHelper: "🌊",
            options: ["Personifikasi", "Metafora", "Litotes"],
            correctIndex: 0,
            explanation: "Ombak (benda mati) diibaratkan bisa 'berkejaran' seperti anak manusia.",
          },
          {
            id: 3,
            question: "'Raja siang telah terbit di ufuk timur.' Ungkapan 'raja siang' merupakan kiasan untuk...",
            visualHelper: "☀️",
            options: ["Matahari", "Bulan", "Bintang"],
            correctIndex: 0,
            explanation: "Raja siang adalah ungkapan metaforis untuk matahari.",
          },
          {
            id: 4,
            question: "Majas yang membandingkan dua hal secara langsung tanpa kata pembanding (seperti/bagai) disebut majas...",
            visualHelper: "🎭",
            options: ["Metafora", "Personifikasi", "Asosiasi"],
            correctIndex: 0,
            explanation: "Metafora membandingkan dua objek secara langsung, misalnya 'anak emas'.",
          },
          {
            id: 5,
            question: "Ungkapan 'buku adalah jendela dunia' bermakna bahwa...",
            visualHelper: "🪟",
            options: ["Dengan membaca buku kita mengetahui wawasan seluruh dunia", "Buku memiliki kaca transparan", "Buku harus dipasang di dinding"],
            correctIndex: 0,
            explanation: "Metafora ini menggambarkan luasnya pengetahuan yang didapat dari membaca buku.",
          },
          {
            id: 6,
            question: "'Pena menari-nari di atas lembaran kertas putih.' Majas pada kalimat ini adalah...",
            visualHelper: "🖊️",
            options: ["Personifikasi", "Metafora", "Ironi"],
            correctIndex: 0,
            explanation: "Pena diibaratkan dapat 'menari-nari' seperti manusia.",
          },
          {
            id: 7,
            question: "Makna ungkapan 'kutu buku' pada kalimat 'Budi adalah kutu buku di kelas kami' adalah...",
            visualHelper: "🐛",
            options: ["Orang yang sangat gemar dan rajin membaca buku", "Orang yang kepalanya banyak kutu", "Orang yang suka merusak buku"],
            correctIndex: 0,
            explanation: "Kutu buku adalah ungkapan kiasan bagi orang yang sangat rajin membaca.",
          },
          {
            id: 8,
            question: "'Angin malam membelai rambutku dengan lembut.' Kalimat ini menggunakan majas...",
            visualHelper: "🍃",
            options: ["Personifikasi", "Hiperbola", "Metafora"],
            correctIndex: 0,
            explanation: "Angin diibaratkan memiliki tangan yang dapat membelai.",
          },
          {
            id: 9,
            question: "Tujuan pengarang menggunakan majas dalam cerita anak adalah...",
            visualHelper: "🎨",
            options: ["Membuat kalimat lebih hidup, indah, dan menarik diimajinasikan", "Supaya pembaca tidak mengerti", "Agar cerita cepat selesai"],
            correctIndex: 0,
            explanation: "Majas memperkaya imajinasi dan memperindah keindahan bahasa cerita.",
          },
          {
            id: 10,
            question: "Ungkapan 'buah tangan' memiliki arti...",
            visualHelper: "🎁",
            options: ["Oleh-oleh", "Anak kandung", "Kerja keras"],
            correctIndex: 0,
            explanation: "Buah tangan adalah ungkapan yang bermakna oleh-oleh atau bingkisan.",
          },
        ],
      };

    case 5:
      return {
        title: "Fabel & Unsur Intrinsik Cerita",
        conceptText: "Unsur intrinsik cerita fiksi terdiri dari: Tema (gagasan dasar), Tokoh & Penokohan (watak), Latar (tempat/waktu/suasana), Alur (rangkaian peristiwa), Sudut Pandang, dan Amanat.",
        questions: [
          {
            id: 1,
            question: "Ide dasar atau gagasan umum yang menjadi fondasi seluruh cerita disebut...",
            visualHelper: "💡",
            options: ["Tema", "Alur", "Latar"],
            correctIndex: 0,
            explanation: "Tema adalah gagasan pokok yang mendasari jalannya keseluruhan isi cerita.",
          },
          {
            id: 2,
            question: "Cara pengarang menggambarkan sifat dan kepribadian tokoh dalam cerita dinamakan...",
            visualHelper: "👤",
            options: ["Penokohan (perwatakan)", "Alur", "Latar"],
            correctIndex: 0,
            explanation: "Penokohan adalah pelukisan watak tokoh, baik watak baik maupun buruk.",
          },
          {
            id: 3,
            question: "Latar yang menggambarkan perasaan senang, tegang, atau duka dalam cerita disebut latar...",
            visualHelper: "🎭",
            options: ["Suasana", "Tempat", "Waktu"],
            correctIndex: 0,
            explanation: "Latar suasana menggambarkan atmosfer batin peristiwa (tegang, gembira, haru).",
          },
          {
            id: 4,
            question: "Tahapan puncak ketegangan atau masalah terbesar dalam sebuah cerita fiksi disebut...",
            visualHelper: "⚡",
            options: ["Klimaks", "Pengenalan (orientasi)", "Penyelesaian (resolusi)"],
            correctIndex: 0,
            explanation: "Klimaks adalah titik tertinggi konflik dalam alur cerita.",
          },
          {
            id: 5,
            question: "Bagian awal cerita yang mengenalkan tokoh dan latar cerita disebut...",
            visualHelper: "🚪",
            options: ["Orientasi (pengenalan)", "Klimaks", "Koda"],
            correctIndex: 0,
            explanation: "Orientasi berada di awal cerita untuk mengenalkan siapa tokoh dan di mana kejadiannya.",
          },
          {
            id: 6,
            question: "Bila pengarang menggunakan kata 'Aku' dalam menceritakan kisahnya, pengarang memakai sudut pandang...",
            visualHelper: "👁️",
            options: ["Orang pertama", "Orang ketiga", "Orang kedua"],
            correctIndex: 0,
            explanation: "Sudut pandang orang pertama menggunakan kata ganti 'aku' atau 'saya'.",
          },
          {
            id: 7,
            question: "Bagian akhir cerita fabel yang memuat pesan nasihat moral langsung disebut...",
            visualHelper: "⭐",
            options: ["Koda", "Komplikasi", "Orientasi"],
            correctIndex: 0,
            explanation: "Koda adalah penutup fabel yang berisi simpulan amanat dan pelajaran moral.",
          },
          {
            id: 8,
            question: "Dalam fabel 'Burung Gagak yang Haus', gagak memasukkan kerikil ke dalam kendi agar...",
            visualHelper: "🦅",
            options: ["Permukaan air naik sehingga bisa diminum", "Kendi menjadi pecah", "Air berubah warna"],
            correctIndex: 0,
            explanation: "Gagak cerdik memanfaatkan prinsip volume air agar bisa menjangkau air di dasar kendi.",
          },
          {
            id: 9,
            question: "Unsur yang membangun karya sastra dari dalam karya itu sendiri dinamakan unsur...",
            visualHelper: "🏛️",
            options: ["Intrinsik", "Ekstrinsik", "Statistik"],
            correctIndex: 0,
            explanation: "Unsur intrinsik berada di dalam teks (tema, tokoh, alur, latar, amanat).",
          },
          {
            id: 10,
            question: "Tokoh pembantu yang hadir untuk melengkapi cerita disebut tokoh...",
            visualHelper: "👥",
            options: ["Figuran (tambahan)", "Utama", "Penjahat"],
            correctIndex: 0,
            explanation: "Tokoh figuran melengkapi latar dan mendukung dinamika cerita utama.",
          },
        ],
      };

    case 6:
      return {
        title: "Bagian Surat Pribadi",
        conceptText: "Surat pribadi adalah surat yang ditulis kepada teman atau keluarga. Bagiannya: Tempat & tanggal surat, alamat tujuan, salam pembuka, isi surat, salam penutup, dan tanda tangan.",
        questions: [
          {
            id: 1,
            question: "Surat yang dikirimkan kepada teman akrab atau anggota keluarga termasuk ke dalam jenis surat...",
            visualHelper: "✉️",
            options: ["Pribadi (tidak resmi)", "Resmi (dinas)", "Niaga"],
            correctIndex: 0,
            explanation: "Surat pribadi ditujukan untuk keperluan kekeluargaan dan persahabatan.",
          },
          {
            id: 2,
            question: "Penulisan tempat dan tanggal surat yang benar di bawah ini adalah...",
            visualHelper: "📍",
            options: ["Bandung, 10 Mei 2026", "bandung, 10 mei 2026", "Bandung 10 Mei 2026."],
            correctIndex: 0,
            explanation: "Nama kota diawali huruf kapital, dipisahkan tanda koma dengan tanggal tanpa titik di ujung.",
          },
          {
            id: 3,
            question: "Contoh salam pembuka yang biasa digunakan dalam surat pribadi kepada teman adalah...",
            visualHelper: "👋",
            options: ["Salam hangat,", "Dengan hormat,", "Kepada yang terhormat Bapak Kepala Sekolah,"],
            correctIndex: 0,
            explanation: "'Salam hangat,' atau 'Halo temanku,' adalah salam akrab untuk surat pribadi.",
          },
          {
            id: 4,
            question: "Bagian surat pribadi yang berisi maksud dan tujuan utama pengirim menulis surat adalah...",
            visualHelper: "📝",
            options: ["Isi surat", "Alamat surat", "Kop surat"],
            correctIndex: 0,
            explanation: "Isi surat memuat inti pesan, kabar, atau cerita yang ingin disampaikan.",
          },
          {
            id: 5,
            question: "Perbedaan utama antara surat pribadi dan surat resmi dinas adalah...",
            visualHelper: "🏛️",
            options: ["Surat pribadi tidak memerlukan kepala surat (kop surat) dan nomor surat", "Surat pribadi harus dicap stempel dinas", "Surat pribadi tidak boleh ada tanggalnya"],
            correctIndex: 0,
            explanation: "Surat pribadi tidak memakai kop surat, nomor surat, maupun cap lembaga.",
          },
          {
            id: 6,
            question: "Bahasa yang digunakan dalam surat pribadi kepada sahabat sebaya sebaiknya...",
            visualHelper: "🗣️",
            options: ["Santun, akrab, dan bersahabat", "Kasar dan membentak", "Sangat kaku seperti undang-undang"],
            correctIndex: 0,
            explanation: "Surat pribadi bernada hangat dan akrab namun tetap menjunjung kesantunan.",
          },
          {
            id: 7,
            question: "Contoh salam penutup yang cocok untuk surat pribadi kepada saudara adalah...",
            visualHelper: "🤝",
            options: ["Sekian dulu ya, sampai jumpa!", "Hormat kami Kepala Dinas,", "Wajib dibalas segera!"],
            correctIndex: 0,
            explanation: "Salam penutup surat pribadi bernada ramah dan penuh harapan pertemuan.",
          },
          {
            id: 8,
            question: "Benda dari kertas beramplop yang ditempel di amplop sebagai bukti pembayaran ongkos pos adalah...",
            visualHelper: "📮",
            options: ["Prangko", "Materai", "Kupon"],
            correctIndex: 0,
            explanation: "Prangko ditempel pada amplop surat pos konvensional.",
          },
          {
            id: 9,
            question: "Di mana posisi nama pengirim dan tanda tangan diletakkan pada surat pribadi?",
            visualHelper: "✍️",
            options: ["Di pojok kanan atau kiri bawah setelah salam penutup", "Di bagian paling atas halaman", "Di tengah-tengah amplop"],
            correctIndex: 0,
            explanation: "Tanda tangan dan nama terang pengirim berada di akhir surat bagian bawah.",
          },
          {
            id: 10,
            question: "Sebelum surat dimasukkan ke dalam amplop, surat tersebut sebaiknya...",
            visualHelper: "📄",
            options: ["Dilipat rapi dengan tulisan menghadap ke dalam", "Diremas-remas hingga bulat", "Disobek ujungnya"],
            correctIndex: 0,
            explanation: "Melipat rapi surat menghormati penerima dan menjaga kebersihan kertas.",
          },
        ],
      };

    case 7:
      return {
        title: "Kamus & Tesaurus (KBBI)",
        conceptText: "Kamus Besar Bahasa Indonesia (KBBI) digunakan untuk mencari arti kata sukar berdasarkan kata dasarnya. Tesaurus memuat daftar sinonim (persamaan) dan antonim (lawan kata).",
        questions: [
          {
            id: 1,
            question: "Buku acuan resmi untuk mencari arti kata baku dalam bahasa Indonesia adalah...",
            visualHelper: "📖",
            options: ["KBBI (Kamus Besar Bahasa Indonesia)", "Buku atlas dunia", "Katalog belanja"],
            correctIndex: 0,
            explanation: "KBBI adalah rujukan utama kosakata dan makna kata bahasa Indonesia baku.",
          },
          {
            id: 2,
            question: "Untuk mencari arti kata berimbuhan 'berlari' di kamus, kita harus mencari kata dasarnya yaitu...",
            visualHelper: "🏃",
            options: ["Lari (huruf L)", "Ber (huruf B)", "Larian"],
            correctIndex: 0,
            explanation: "Pencarian di kamus selalu berbasis kata dasar tanpa awalan/akhiran.",
          },
          {
            id: 3,
            question: "Buku referensi yang memuat kumpulan kata yang memiliki makna sama (sinonim) disebut...",
            visualHelper: "📚",
            options: ["Tesaurus", "Ensiklopedia", "Komik"],
            correctIndex: 0,
            explanation: "Tesaurus menyajikan daftar sinonim dan keterkaitan makna kata.",
          },
          {
            id: 4,
            question: "Kata dasar dari kata 'menggambar' adalah...",
            visualHelper: "🎨",
            options: ["Gambar", "Meng", "Gambaran"],
            correctIndex: 0,
            explanation: "Kata 'menggambar' mendapat awalan me- dari kata dasar 'gambar'.",
          },
          {
            id: 5,
            question: "Kata-kata di dalam kamus disusun berdasarkan urutan...",
            visualHelper: "🔤",
            options: ["Abjad alfabet (A sampai Z)", "Panjang pendeknya kata", "Tahun penerbitan"],
            correctIndex: 0,
            explanation: "Kamus disusun berurutan menurut alfabet agar mudah dan cepat dicari.",
          },
          {
            id: 6,
            question: "Sinonim (persamaan kata) dari kata 'pandai' adalah...",
            visualHelper: "🧠",
            options: ["Pintar", "Bodoh", "Malas"],
            correctIndex: 0,
            explanation: "Pandai memiliki makna yang setara dengan pintar atau cerdas.",
          },
          {
            id: 7,
            question: "Antonim (lawan kata) dari kata 'rajin' adalah...",
            visualHelper: "😴",
            options: ["Malas", "Pintar", "Giat"],
            correctIndex: 0,
            explanation: "Lawan kata rajin adalah malas.",
          },
          {
            id: 8,
            question: "Untuk mencari kata dasar 'sepatu' dan 'sendok', manakah yang muncul lebih dulu di kamus?",
            visualHelper: "🔍",
            options: ["Sendok (s-e-n lebih dulu dari s-e-p)", "Sepatu", "Keduanya muncul bersamaan"],
            correctIndex: 0,
            explanation: "Huruf ketiga 'n' pada sendok berada sebelum huruf 'p' pada sepatu dalam abjad.",
          },
          {
            id: 9,
            question: "Arti kata 'populasi' dalam kamus yang berkaitan dengan makhluk hidup adalah...",
            visualHelper: "👥",
            options: ["Jumlah keseluruhan penghuni atau individu sejenis di suatu tempat", "Jenis penyakit tanaman", "Alat pengukur udara"],
            correctIndex: 0,
            explanation: "Populasi berarti kumpulan individu sejenis yang mendiami suatu wilayah.",
          },
          {
            id: 10,
            question: "Manfaat membiasakan diri membuka kamus saat menemukan kata sukar adalah...",
            visualHelper: "💡",
            options: ["Memperkaya kosakata dan memahami makna kata secara akurat", "Hanya membuat waktu terbuang", "Bisa menggambar di kamus"],
            correctIndex: 0,
            explanation: "Kamus adalah sahabat belajar untuk memperkaya perbendaharaan kata kita.",
          },
        ],
      };

    default:
      return {
        title: "Bahasa Indonesia Kelas 4 SD",
        conceptText: "Materi belajar Bahasa Indonesia Kelas 4 SD.",
        questions: [],
      };
  }
}
