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

interface IndoGrade2GameProps {
  levelId: number;
  onLevelComplete: (levelId: number, starsEarned: number) => void;
  accessibilityMode?: string;
}

export function IndoGrade2Game({ levelId, onLevelComplete, accessibilityMode }: IndoGrade2GameProps) {
  const [phase, setPhase] = useState<"materi" | "game">("materi");

  // Phase 1 interactive state
  const [activeSign, setActiveSign] = useState<string>(".");
  const [activeSpoWord, setActiveSpoWord] = useState<{ s: string; p: string; o: string }>({
    s: "Siti",
    p: "menyiram",
    o: "bunga",
  });
  const [activeSentenceType, setActiveSentenceType] = useState<string>("Ajakan");

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
    setActiveSign(".");
    setActiveSpoWord({ s: "Siti", p: "menyiram", o: "bunga" });
    setActiveSentenceType("Ajakan");

    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setWrongAttempts(0);
    setShowClue(false);
    setIsCompleted(false);
    isProcessingRef.current = false;

    const data = getGrade2LevelData(levelId);
    setQuestionsList(shuffleQuestions(data));
    speakGlobal(data.conceptText);
  }, [levelId]);

  const levelData = getGrade2LevelData(levelId);
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
          speakGlobal(`Luar biasa! Kamu telah menyelesaikan 10 soal Bahasa Indonesia Kelas 2 dan meraih ${stars} bintang!`);
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
            BAHASA INDONESIA KELAS 2 SD • LEVEL {levelId} dari 7
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
                  Tanda Baca & Contoh Penggunaannya:
                </span>
                <div className="grid grid-cols-3 gap-2 w-full">
                  {[
                    { sign: ".", label: "Titik (.)", contoh: "Budi membaca buku.", func: "Kalimat berita/selesai" },
                    { sign: "?", label: "Tanya (?)", contoh: "Siapa namamu?", func: "Menanyakan sesuatu" },
                    { sign: "!", label: "Seru (!)", contoh: "Tolong ambilkan buku itu!", func: "Perintah / seruan" },
                  ].map((s) => (
                    <button
                      key={s.sign}
                      type="button"
                      onClick={() => {
                        setActiveSign(s.sign);
                        playPopSound();
                        speakGlobal(`Tanda ${s.label}. Contoh: ${s.contoh}. Digunakan untuk ${s.func}`);
                      }}
                      className={`p-3 rounded-2xl border-2 border-[#3C632A] flex flex-col items-center text-center transition-all cursor-pointer ${
                        activeSign === s.sign ? "bg-[#FF5685] text-white scale-105" : "bg-amber-50 text-[#3C632A] hover:bg-white"
                      }`}
                    >
                      <span className="text-3xl font-black">{s.sign}</span>
                      <span className="text-xs font-black mt-1">{s.label}</span>
                      <span className="text-[10px] mt-1 italic">"{s.contoh}"</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {levelId === 2 && (
              <div className="w-full flex flex-col items-center space-y-3 text-center">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Kosakata Lingkungan & Permainan Tradisional:
                </span>
                <div className="grid grid-cols-2 gap-2 w-full text-xs font-bold text-slate-800">
                  <div className="p-3 bg-teal-50 border-2 border-teal-300 rounded-xl">
                    🌿 <strong>Lingkungan Sehat:</strong> Bersih, asri, sejuk, sampah dipilah, selokan lancar.
                  </div>
                  <div className="p-3 bg-purple-50 border-2 border-purple-300 rounded-xl">
                    🪁 <strong>Permainan Tradisional:</strong> Gobak sodor, egrang, congklak, layang-layang.
                  </div>
                </div>
              </div>
            )}

            {levelId === 3 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Mengenal Pola Kalimat S-P-O:
                </span>
                <div className="flex items-center space-x-2 bg-amber-50 p-3 rounded-2xl border-2 border-[#3C632A] w-full justify-center">
                  <div className="p-2 bg-[#FFDF59] rounded-xl border border-[#3C632A] text-center">
                    <span className="text-[10px] font-black block text-[#C3631D]">SUBJEK (S)</span>
                    <span className="text-sm font-black">{activeSpoWord.s}</span>
                  </div>
                  <span className="text-lg font-black">+</span>
                  <div className="p-2 bg-[#7FD13B] text-white rounded-xl border border-[#3C632A] text-center">
                    <span className="text-[10px] font-black block text-emerald-950">PREDIKAT (P)</span>
                    <span className="text-sm font-black">{activeSpoWord.p}</span>
                  </div>
                  <span className="text-lg font-black">+</span>
                  <div className="p-2 bg-[#FF5685] text-white rounded-xl border border-[#3C632A] text-center">
                    <span className="text-[10px] font-black block text-rose-950">OBJEK (O)</span>
                    <span className="text-sm font-black">{activeSpoWord.o}</span>
                  </div>
                </div>
                <div className="text-[11px] font-bold text-slate-600 text-center">
                  Subjek = Orang/pelaku, Predikat = Tindakan/kegiatan, Objek = Benda yang dikenai kegiatan.
                </div>
              </div>
            )}

            {levelId === 4 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  4 Jenis Kalimat yang Santun:
                </span>
                <div className="grid grid-cols-2 gap-2 w-full text-xs">
                  <div className="p-2.5 bg-yellow-50 border border-yellow-300 rounded-xl">
                    🤝 <strong>Ajakan:</strong> "Ayo kita belajar bersama!" (Ada kata <em>ayo/mari</em>)
                  </div>
                  <div className="p-2.5 bg-rose-50 border border-rose-300 rounded-xl">
                    ✋ <strong>Perintah:</strong> "Tolong tutup pintunya ya!" (Santun dan jelas)
                  </div>
                  <div className="p-2.5 bg-blue-50 border border-blue-300 rounded-xl">
                    🙅 <strong>Penolakan:</strong> "Maaf, saya tidak bisa ikut." (Disertai kata <em>maaf</em>)
                  </div>
                  <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl">
                    👋 <strong>Sapaan:</strong> "Selamat pagi, Bu Guru!" (Ramah dan hormat)
                  </div>
                </div>
              </div>
            )}

            {levelId === 5 && (
              <div className="w-full flex flex-col items-center space-y-3 text-center">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Huruf Tegak Bersambung:
                </span>
                <div className="p-4 bg-emerald-50 border-2 border-dashed border-[#3C632A] rounded-2xl w-full">
                  <p className="font-serif italic text-2xl text-[#3C632A] tracking-wider">
                    "Rajin Pangkal Pandai"
                  </p>
                </div>
                <p className="text-[11px] font-bold text-slate-700">
                  Menulis tegak bersambung menghubungkan garis antar huruf secara mengalir rapi dan indah.
                </p>
              </div>
            )}

            {levelId === 6 && (
              <div className="w-full flex flex-col items-center space-y-3 text-center">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Deklamasi Puisi Anak: "Sahabat Sejati"
                </span>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 text-xs italic text-slate-800 leading-relaxed text-left">
                  Kau selalu ada di sampingku,<br />
                  Bermain bersama saat gembira,<br />
                  Menghiburku saat bersedih,<br />
                  Terima kasih, sahabat setiaku.
                </div>
                <p className="text-[11px] font-bold text-[#C3631D]">
                  Membaca puisi dilakukan dengan lafal jelas, intonasi berirama, dan penghayatan ekspresi wajah.
                </p>
              </div>
            )}

            {levelId === 7 && (
              <div className="w-full flex flex-col items-center space-y-3 text-center">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Kata Tanya 5W1H dalam Teks Cerita:
                </span>
                <div className="grid grid-cols-2 gap-2 w-full text-xs text-left">
                  <div className="p-2 bg-teal-50 rounded-lg border border-teal-200">❓ <strong>Apa:</strong> Menanyakan peristiwa/benda</div>
                  <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">👤 <strong>Siapa:</strong> Menanyakan tokoh/orang</div>
                  <div className="p-2 bg-amber-50 rounded-lg border border-amber-200">📍 <strong>Di mana:</strong> Menanyakan tempat</div>
                  <div className="p-2 bg-rose-50 rounded-lg border border-rose-200">⏰ <strong>Kapan:</strong> Menanyakan waktu</div>
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

// ================= DATA SOAL KELAS 2 SD (7 LEVEL x 10 SOAL = 70 SOAL LENGKAP) =================
function getGrade2LevelData(levelId: number): LevelConceptData {
  switch (levelId) {
    case 1:
      return {
        title: "Tanda Baca & Ejaan",
        conceptText: "Huruf kapital digunakan pada awal kalimat, nama orang, hari, dan bulan. Tanda baca meliputi titik (.), tanda tanya (?), dan tanda seru (!).",
        questions: [
          {
            id: 1,
            question: "Tanda baca yang tepat untuk kalimat tanya 'Di mana rumahmu' adalah...",
            visualHelper: "❓",
            options: ["Tanda tanya (?)", "Tanda titik (.)", "Tanda seru (!)"],
            correctIndex: 0,
            explanation: "Kalimat tanya selalu diakhiri dengan tanda tanya (?).",
          },
          {
            id: 2,
            question: "Manakah penulisan nama hari yang menggunakan huruf kapital dengan benar?",
            visualHelper: "📅",
            options: ["Senin", "senin", "seNin"],
            correctIndex: 0,
            explanation: "Nama hari selalu diawali huruf kapital (Senin).",
          },
          {
            id: 3,
            question: "Tanda baca untuk mengakhiri kalimat perintah 'Tolong ambilkan buku itu' adalah...",
            visualHelper: "❗",
            options: ["Tanda seru (!)", "Tanda tanya (?)", "Tanda koma (,)"],
            correctIndex: 0,
            explanation: "Kalimat perintah atau ajakan yang tegas diakhiri tanda seru (!).",
          },
          {
            id: 4,
            question: "Penulisan nama bulan yang tepat di bawah ini adalah...",
            visualHelper: "🗓️",
            options: ["Agustus", "agustus", "agustuS"],
            correctIndex: 0,
            explanation: "Nama bulan selalu diawali huruf kapital (Agustus).",
          },
          {
            id: 5,
            question: "Manakah kalimat yang penggunaan huruf kapital dan titiknya paling tepat?",
            visualHelper: "✅",
            options: ["Edo pergi ke pasar pada hari Minggu.", "edo pergi ke pasar pada hari minggu.", "Edo pergi ke pasar pada hari minggu"],
            correctIndex: 0,
            explanation: "Edo (nama orang), Minggu (nama hari) berhuruf kapital, dan diakhiri titik.",
          },
          {
            id: 6,
            question: "Tanda baca koma (,) biasanya digunakan untuk...",
            visualHelper: "⏸️",
            options: ["Memisahkan rincian benda", "Mengakhiri buku", "Menanyakan kabar"],
            correctIndex: 0,
            explanation: "Tanda koma memisahkan perincian kata dalam satu kalimat.",
          },
          {
            id: 7,
            question: "Kalimat 'Wah, pemandangan ini indah sekali ...' diakhiri tanda...",
            visualHelper: "🌄",
            options: ["Tanda seru (!)", "Tanda tanya (?)", "Tanda titik dua (:)"],
            correctIndex: 0,
            explanation: "Kalimat seruan kekaguman diakhiri tanda seru (!).",
          },
          {
            id: 8,
            question: "Penulisan nama orang di tengah kalimat yang benar adalah...",
            visualHelper: "👤",
            options: ["Budi bertemu Siti di sekolah.", "Budi bertemu siti di sekolah.", "budi bertemu siti di sekolah."],
            correctIndex: 0,
            explanation: "Setiap nama orang (Budi, Siti) wajib diawali huruf kapital.",
          },
          {
            id: 9,
            question: "'Kapan paman datang dari desa ...' Tanda baca yang tepat adalah...",
            visualHelper: "🚂",
            options: ["Tanda tanya (?)", "Tanda seru (!)", "Tanda titik (.)"],
            correctIndex: 0,
            explanation: "Kata 'Kapan' adalah kata tanya, sehingga membutuhkan tanda tanya (?).",
          },
          {
            id: 10,
            question: "Huruf kapital TIDAK digunakan untuk...",
            visualHelper: "❌",
            options: ["Nama benda umum di tengah kalimat", "Awal kalimat", "Nama orang dan kota"],
            correctIndex: 0,
            explanation: "Benda umum seperti meja, buku, kursi tidak perlu huruf kapital jika di tengah kalimat.",
          },
        ],
      };

    case 2:
      return {
        title: "Kosakata Lingkungan & Kegiatan",
        conceptText: "Mengenal kosakata lingkungan sehat (asri, bersih, selokan), keluarga, cuaca (cerah, mendung, hujan), dan permainan tradisional nusantara.",
        questions: [
          {
            id: 1,
            question: "Lingkungan yang banyak ditumbuhi pohon rindang dan hijau disebut lingkungan yang...",
            visualHelper: "🌳",
            options: ["Asri", "Gersang", "Kotor"],
            correctIndex: 0,
            explanation: "Asri berarti indah, sedap dipandang mata dan sejuk karena banyak pepohonan.",
          },
          {
            id: 2,
            question: "Permainan tradisional yang menggunakan bambu tinggi untuk berjalan adalah...",
            visualHelper: "🎋",
            options: ["Egrang", "Congklak", "Kelereng"],
            correctIndex: 0,
            explanation: "Egrang adalah permainan berjalan dengan dua bilah bambu berpijakan kaki.",
          },
          {
            id: 3,
            question: "Keadaan langit yang tertutup awan gelap dan matahari tidak terlihat disebut...",
            visualHelper: "☁️",
            options: ["Mendung", "Cerah", "Kemarau"],
            correctIndex: 0,
            explanation: "Mendung adalah keadaan langit saat tertutup awan kelabu tanda akan hujan.",
          },
          {
            id: 4,
            question: "Saluran air di pinggir jalan untuk mengalirkan air hujan disebut...",
            visualHelper: "🌊",
            options: ["Selokan", "Jembatan", "Pagar"],
            correctIndex: 0,
            explanation: "Selokan atau parit berfungsi mengalirkan air agar tidak terjadi banjir.",
          },
          {
            id: 5,
            question: "Permainan tradisional menggunakan papan berlubang dan biji kerang disebut...",
            visualHelper: "🐚",
            options: ["Congklak", "Gobak sodor", "Petak umpet"],
            correctIndex: 0,
            explanation: "Congklak dimainkan di atas papan kayu berlubang dengan biji atau cangkang kerang.",
          },
          {
            id: 6,
            question: "Udara bersih yang belum tercemar oleh asap kendaraan disebut udara yang...",
            visualHelper: "🍃",
            options: ["Segar", "Berbau", "Panas"],
            correctIndex: 0,
            explanation: "Udara di daerah asri dan banyak pohon terasa segar dan sehat dihirup.",
          },
          {
            id: 7,
            question: "Benda dari kain yang diterbangkan dengan bantuan angin di lapangan adalah...",
            visualHelper: "🪁",
            options: ["Layang-layang", "Egrang", "Gasing"],
            correctIndex: 0,
            explanation: "Layang-layang terbang tinggi melayang ditiup angin.",
          },
          {
            id: 8,
            question: "Lawan kata (antonim) dari kata 'bersih' adalah...",
            visualHelper: "🧹",
            options: ["Kotor", "Rapi", "Indah"],
            correctIndex: 0,
            explanation: "Kebalikan dari bersih adalah kotor.",
          },
          {
            id: 9,
            question: "Saat cuaca terik matahari bersinar hangat, cuaca tersebut dinamakan...",
            visualHelper: "☀️",
            options: ["Cerah", "Badai", "Mendung"],
            correctIndex: 0,
            explanation: "Cuaca cerah ditandai dengan langit terang dan sinar matahari leluasa menyinari bumi.",
          },
          {
            id: 10,
            question: "Sampah yang membusuk di sungai dapat menyebabkan...",
            visualHelper: "⚠️",
            options: ["Banjir dan bau tidak sedap", "Ikan bertambah gemuk", "Air menjadi jernih"],
            correctIndex: 0,
            explanation: "Sampah menyumbat aliran air sungai sehingga memicu timbulnya banjir.",
          },
        ],
      };

    case 3:
      return {
        title: "Kalimat Berpola (S-P-O)",
        conceptText: "Kalimat berpola S-P-O terdiri dari Subjek (pelaku), Predikat (kata kerja tindakan), dan Objek (benda yang dikenai perbuatan).",
        questions: [
          {
            id: 1,
            question: "Pada kalimat 'Ibu menggoreng ikan', siapakah yang menjadi Subjek (S)?",
            visualHelper: "👩‍🍳",
            options: ["Ibu", "Menggoreng", "Ikan"],
            correctIndex: 0,
            explanation: "Subjek adalah pelaku tindakan, yaitu Ibu.",
          },
          {
            id: 2,
            question: "Pada kalimat 'Budi menendang bola', kata 'menendang' berkedudukan sebagai...",
            visualHelper: "⚽",
            options: ["Predikat (P)", "Subjek (S)", "Objek (O)"],
            correctIndex: 0,
            explanation: "Predikat adalah kata kerja atau perbuatan yang dilakukan, yaitu 'menendang'.",
          },
          {
            id: 3,
            question: "Pada kalimat 'Kucing menangkap tikus', kata 'tikus' berkedudukan sebagai...",
            visualHelper: "🐁",
            options: ["Objek (O)", "Predikat (P)", "Subjek (S)"],
            correctIndex: 0,
            explanation: "Objek adalah benda atau sasaran yang dikenai tindakan, yaitu 'tikus'.",
          },
          {
            id: 4,
            question: "Manakah kalimat yang berpola lengkap Subjek - Predikat - Objek (S-P-O)?",
            visualHelper: "📐",
            options: ["Ayah mencuci mobil.", "Ayah tidur.", "Di halaman rumah."],
            correctIndex: 0,
            explanation: "Ayah (S) mencuci (P) mobil (O) memiliki pola S-P-O lengkap.",
          },
          {
            id: 5,
            question: "Pada kalimat 'Siti memetik bunga', kata 'bunga' merupakan...",
            visualHelper: "🌸",
            options: ["Objek (O)", "Subjek (S)", "Predikat (P)"],
            correctIndex: 0,
            explanation: "Bunga adalah sasaran yang dipetik (Objek).",
          },
          {
            id: 6,
            question: "Predikat dalam kalimat biasanya berupa kata...",
            visualHelper: "🏃",
            options: ["Kerja (tindakan)", "Benda mati", "Tanya"],
            correctIndex: 0,
            explanation: "Predikat menyatakan perbuatan atau aktivitas yang dilakukan subjek.",
          },
          {
            id: 7,
            question: "Pada kalimat 'Adik meminum susu', kata yang bertindak sebagai Predikat adalah...",
            visualHelper: "🥛",
            options: ["Meminum", "Adik", "Susu"],
            correctIndex: 0,
            explanation: "'Meminum' adalah tindakan yang dilakukan adik (Predikat).",
          },
          {
            id: 8,
            question: "Susunan kata 'nasi - Rina - memasak' yang benar menurut pola S-P-O adalah...",
            visualHelper: "🍚",
            options: ["Rina memasak nasi.", "Nasi Rina memasak.", "Memasak Rina nasi."],
            correctIndex: 0,
            explanation: "Rina (S) memasak (P) nasi (O).",
          },
          {
            id: 9,
            question: "Pada kalimat 'Petani menanam padi di sawah', siapakah Subjeknya?",
            visualHelper: "🌾",
            options: ["Petani", "Menanam", "Padi"],
            correctIndex: 0,
            explanation: "Petani adalah orang yang melakukan tindakan (Subjek).",
          },
          {
            id: 10,
            question: "Kalimat 'Burung terbang.' memiliki pola kalimat...",
            visualHelper: "🕊️",
            options: ["Subjek - Predikat (S-P)", "Subjek - Objek (S-O)", "Predikat - Objek (P-O)"],
            correctIndex: 0,
            explanation: "Burung (S) terbang (P), belum memiliki objek (pola S-P).",
          },
        ],
      };

    case 4:
      return {
        title: "Jenis-Jenis Kalimat",
        conceptText: "Ada 4 jenis kalimat: Kalimat ajakan (ayo/mari), kalimat perintah (tolong/kerjakan), kalimat penolakan (maaf tidak bisa), dan kalimat sapaan (halo/selamat pagi).",
        questions: [
          {
            id: 1,
            question: "'Ayo kita membersihkan kelas bersama-sama!' Kalimat ini termasuk jenis kalimat...",
            visualHelper: "🤝",
            options: ["Ajakan", "Perintah", "Penolakan"],
            correctIndex: 0,
            explanation: "Kalimat yang menggunakan kata 'ayo' atau 'mari' adalah kalimat ajakan.",
          },
          {
            id: 2,
            question: "'Maaf Dayu, aku tidak bisa ikut bermain karena harus menjaga adik.' Kalimat ini adalah kalimat...",
            visualHelper: "🙅",
            options: ["Penolakan yang santun", "Ajakan", "Perintah kasar"],
            correctIndex: 0,
            explanation: "Menolak tawaran dengan santun diawali kata 'maaf' dan disertai alasan yang jelas.",
          },
          {
            id: 3,
            question: "'Tolong hapus papan tulis itu, Budi!' Kalimat ini termasuk kalimat...",
            visualHelper: "✋",
            options: ["Perintah santun", "Tanya", "Penolakan"],
            correctIndex: 0,
            explanation: "Meminta seseorang melakukan sesuatu dengan kata 'tolong' adalah kalimat perintah santun.",
          },
          {
            id: 4,
            question: "'Selamat pagi, Pak Guru!' Kalimat ini termasuk kalimat...",
            visualHelper: "👋",
            options: ["Sapaan", "Perintah", "Penolakan"],
            correctIndex: 0,
            explanation: "Menyapa guru saat bertemu merupakan kalimat sapaan yang sopan.",
          },
          {
            id: 5,
            question: "Ciri khas kalimat ajakan adalah menggunakan kata...",
            visualHelper: "📢",
            options: ["Ayo dan Mari", "Jangan dan Dilarang", "Mengapa dan Kapan"],
            correctIndex: 0,
            explanation: "'Ayo' dan 'Mari' adalah penanda utama kalimat ajakan.",
          },
          {
            id: 6,
            question: "Manakah kalimat perintah yang paling santun di bawah ini?",
            visualHelper: "✨",
            options: ["Tolong buang sampah ini ke tempatnya, ya.", "Buang sampah ini sekarang!", "Cepat buang sana!"],
            correctIndex: 0,
            explanation: "Menggunakan kata 'tolong' dan akhiran 'ya' terdengar sangat ramah dan santun.",
          },
          {
            id: 7,
            question: "Siti diajak temannya makan permen, tetapi giginya sakit. Jawaban penolakan yang tepat adalah...",
            visualHelper: "🍬",
            options: ["Maaf, gigiku sedang sakit jadi aku tidak makan permen.", "Tidak mau, permenmu jelek!", "Pergi saja kau sendiri!"],
            correctIndex: 0,
            explanation: "Menolak dengan kata 'maaf' dan alasan yang jujur menghargai perasaan teman.",
          },
          {
            id: 8,
            question: "'Mari kita berbaris rapi sebelum masuk kelas.' Kalimat ini mengajak untuk...",
            visualHelper: "🚶",
            options: ["Berbaris rapi", "Bermain lari-larian", "Membeli jajanan"],
            correctIndex: 0,
            explanation: "Isi ajakan tersebut adalah berbaris rapi di depan kelas.",
          },
          {
            id: 9,
            question: "Saat bertemu teman di jalan pada sore hari, sapaan yang tepat adalah...",
            visualHelper: "🌇",
            options: ["Selamat sore, teman!", "Selamat tidur!", "Selamat makan!"],
            correctIndex: 0,
            explanation: "Sapaan disesuaikan dengan waktu, yaitu selamat sore.",
          },
          {
            id: 10,
            question: "Kalimat perintah biasanya diakhiri dengan tanda baca...",
            visualHelper: "❗",
            options: ["Tanda seru (!)", "Tanda tanya (?)", "Tanda kutip (\")"],
            correctIndex: 0,
            explanation: "Kalimat perintah diakhiri dengan tanda seru (!).",
          },
        ],
      };

    case 5:
      return {
        title: "Menulis Tegak Bersambung",
        conceptText: "Menulis tegak bersambung melatih kelenturan jemari tangan. Huruf ditulis menyambung dari kiri ke kanan secara rapi di dalam buku garis tiga/lima.",
        questions: [
          {
            id: 1,
            question: "Buku khusus yang digunakan untuk latihan menulis tegak bersambung adalah...",
            visualHelper: "📒",
            options: ["Buku garis tiga / garis lima", "Buku gambar polos", "Buku kotak matematika"],
            correctIndex: 0,
            explanation: "Buku garis halus tiga atau lima membantu menjaga proporsi tinggi huruf.",
          },
          {
            id: 2,
            question: "Ciri utama tulisan tegak bersambung adalah...",
            visualHelper: "✍️",
            options: ["Huruf-hurufnya saling menyambung dengan garis indah", "Huruf ditulis terpisah jauh", "Huruf dicoret-coret"],
            correctIndex: 0,
            explanation: "Tulisan tegak bersambung menghubungkan ujung huruf satu ke huruf berikutnya.",
          },
          {
            id: 3,
            question: "Manakah huruf yang memiliki tangkai menjulang ke atas (tinggi)?",
            visualHelper: "🦒",
            options: ["b, d, h, k, l", "a, c, e, m, n", "g, j, p, q, y"],
            correctIndex: 0,
            explanation: "Huruf b, d, h, k, l memiliki tiang/tangkai yang naik ke atas.",
          },
          {
            id: 4,
            question: "Manakah kelompok huruf yang memiliki ekor menjulur ke bawah garis?",
            visualHelper: "🐒",
            options: ["g, j, p, q, y", "b, d, f, h, k", "a, c, e, o, s"],
            correctIndex: 0,
            explanation: "Huruf g, j, p, q, y memiliki ekor yang turun menembus garis bawah.",
          },
          {
            id: 5,
            question: "Manfaat latihan menulis tegak bersambung adalah...",
            visualHelper: "🧠",
            options: ["Melatih ketelitian dan motorik halus jemari", "Membuat tangan cepat lelah tanpa hasil", "Supaya pensil cepat habis"],
            correctIndex: 0,
            explanation: "Menulis bersambung melatih koordinasi tangan, mata, dan kesabaran anak.",
          },
          {
            id: 6,
            question: "Saat menulis tegak bersambung, gerakan tangan sebaiknya...",
            visualHelper: "🌊",
            options: ["Mengalir lancar dan lentur", "Kaku dan menekan kertas keras-keras", "Gemetar dan terputus-putus"],
            correctIndex: 0,
            explanation: "Goresan tulisan bersambung harus luwes dan tidak terlalu menekan buku.",
          },
          {
            id: 7,
            question: "Huruf kecil yang berada di baris tengah saja tanpa tangkai atas atau ekor adalah...",
            visualHelper: "📏",
            options: ["a, c, e, m, n, o, r, s, u, v, w, x, z", "b, d, h, k", "g, j, y"],
            correctIndex: 0,
            explanation: "Huruf-huruf ini tingginya hanya pas memenuhi garis tengah buku halus.",
          },
          {
            id: 8,
            question: "Saat menyalin kalimat ke huruf tegak bersambung, huruf kapital digunakan pada...",
            visualHelper: "🔤",
            options: ["Awal kalimat dan nama orang", "Semua huruf di kalimat", "Akhir kalimat saja"],
            correctIndex: 0,
            explanation: "Kaidah ejaan tetap sama: huruf kapital hanya untuk awal kalimat dan nama diri.",
          },
          {
            id: 9,
            question: "Alat tulis yang paling ideal untuk murid kelas 2 berlatih menulis halus adalah...",
            visualHelper: "✏️",
            options: ["Pensil 2B yang runcing", "Spidol tebal permanen", "Cat air dan kuas"],
            correctIndex: 0,
            explanation: "Pensil 2B mudah dikontrol goresannya dan dapat dihapus jika keliru.",
          },
          {
            id: 10,
            question: "Apa arti pepatah yang sering ditulis dalam latihan bersambung: 'Rajin Pangkal Pandai'?",
            visualHelper: "💡",
            options: ["Orang yang rajin belajar pasti akan menjadi pintar", "Orang malas akan beruntung", "Pintar itu bawaan tanpa perlu belajar"],
            correctIndex: 0,
            explanation: "Rajin belajar adalah kunci meraih ilmu dan kepandaian.",
          },
        ],
      };

    case 6:
      return {
        title: "Puisi Anak & Deklamasi",
        conceptText: "Puisi anak ditulis dalam bentuk bait dan baris yang indah. Membaca puisi (deklamasi) membutuhkan lafal yang jelas, intonasi berirama, dan ekspresi penghayatan.",
        questions: [
          {
            id: 1,
            question: "Kumpulan dari beberapa baris dalam sebuah puisi disebut...",
            visualHelper: "📑",
            options: ["Bait", "Paragraf", "Bab"],
            correctIndex: 0,
            explanation: "Bait adalah bagian puisi yang terdiri atas beberapa baris kalimat.",
          },
          {
            id: 2,
            question: "Membaca puisi di depan penonton dengan gaya dan penghayatan disebut...",
            visualHelper: "🎭",
            options: ["Deklamasi", "Pidato", "Mendongeng"],
            correctIndex: 0,
            explanation: "Deklamasi adalah pembacaan puisi disertai gerak dan penghayatan ekspresi.",
          },
          {
            id: 3,
            question: "Kejelasan bunyi huruf dan kata saat membaca puisi dinamakan...",
            visualHelper: "🗣️",
            options: ["Lafal", "Intonasi", "Ekspresi"],
            correctIndex: 0,
            explanation: "Lafal adalah cara seseorang mengucapkan bunyi kata dengan jelas.",
          },
          {
            id: 4,
            question: "Tinggi rendahnya nada suara saat membaca puisi dinamakan...",
            visualHelper: "🎶",
            options: ["Intonasi", "Lafal", "Tempo"],
            correctIndex: 0,
            explanation: "Intonasi adalah lagu kalimat atau naik-turunnya nada suara.",
          },
          {
            id: 5,
            question: "Raut muka yang sesuai dengan isi perasaan puisi disebut...",
            visualHelper: "😊",
            options: ["Ekspresi (Mimik wajah)", "Lafal", "Volume"],
            correctIndex: 0,
            explanation: "Ekspresi wajah menggambarkan rasa sedih, gembira, atau kagum dalam puisi.",
          },
          {
            id: 6,
            question: "Bila puisi bertemakan 'Ibu yang Penuh Kasih', ekspresi wajah kita sebaiknya...",
            visualHelper: "💖",
            options: ["Hangat, lembut, dan penuh haru", "Marah-marah sambil melotot", "Tertawa terbahak-bahak"],
            correctIndex: 0,
            explanation: "Puisi kasih sayang dibaca dengan kelembutan rasa cinta dan rasa terima kasih.",
          },
          {
            id: 7,
            question: "Dalam bait puisi: 'Bintang kejora bersinar terang / Menemani malam yang tenang.' Kata yang berima sama di akhir adalah...",
            visualHelper: "⭐",
            options: ["Terang dan tenang (akhiran -ang)", "Bintang dan malam", "Kejora dan bersinar"],
            correctIndex: 0,
            explanation: "Kata 'terang' dan 'tenang' berima sama berakhiran bunyi '-ang'.",
          },
          {
            id: 8,
            question: "Persamaan bunyi kata di akhir baris puisi disebut...",
            visualHelper: "🎵",
            options: ["Rima", "Tema", "Amanat"],
            correctIndex: 0,
            explanation: "Rima adalah pengulangan bunyi akhir yang memberi irama indah pada puisi.",
          },
          {
            id: 9,
            question: "Orang yang menciptakan karya puisi disebut...",
            visualHelper: "✍️",
            options: ["Penyair (Penyair)", "Pelukis", "Penyanyi"],
            correctIndex: 0,
            explanation: "Penyair adalah penulis atau pengarang karya sastra puisi.",
          },
          {
            id: 10,
            question: "Makna kata 'mentari' dalam puisi anak 'Mentari tersenyum di pagi hari' adalah...",
            visualHelper: "🌞",
            options: ["Matahari", "Bulan", "Bintang"],
            correctIndex: 0,
            explanation: "Mentari adalah kata puitis yang berarti matahari.",
          },
        ],
      };

    case 7:
      return {
        title: "Teks Narasi Pendek (5W1H)",
        conceptText: "Membaca teks cerita anak dan memahami isinya dengan menjawab pertanyaan: Apa (peristiwa), Siapa (tokoh), Di mana (tempat), Kapan (waktu), dan Mengapa (alasan).",
        questions: [
          {
            id: 1,
            question: "Kata tanya 'Siapa' digunakan untuk menanyakan...",
            visualHelper: "👤",
            options: ["Orang atau tokoh cerita", "Waktu kejadian", "Tempat berlangsung"],
            correctIndex: 0,
            explanation: "Kata 'Siapa' digunakan untuk menanyakan pelaku atau orang yang terlibat.",
          },
          {
            id: 2,
            question: "Kata tanya 'Di mana' digunakan untuk menanyakan...",
            visualHelper: "📍",
            options: ["Tempat terjadinya peristiwa", "Alasan tindakan", "Jumlah barang"],
            correctIndex: 0,
            explanation: "Kata 'Di mana' menanyakan lokasi atau tempat kejadian.",
          },
          {
            id: 3,
            question: "Kata tanya 'Kapan' digunakan untuk menanyakan...",
            visualHelper: "⏰",
            options: ["Waktu terjadinya peristiwa", "Nama hewan", "Harga tiket"],
            correctIndex: 0,
            explanation: "Kata 'Kapan' menanyakan hari, jam, atau waktu kejadian.",
          },
          {
            id: 4,
            question: "Kata tanya 'Mengapa' digunakan untuk menanyakan...",
            visualHelper: "💡",
            options: ["Sebab atau alasan terjadinya sesuatu", "Benda yang dibawa", "Nama teman"],
            correctIndex: 0,
            explanation: "Kata 'Mengapa' dijawab dengan kata 'karena' untuk menjelaskan sebab/alasan.",
          },
          {
            id: 5,
            question: "Bacalah cerita singkat: 'Pada hari Minggu, Budi dan Ayah bersepeda di taman kota.' Siapakah yang bersepeda?",
            visualHelper: "🚲",
            options: ["Budi dan Ayah", "Ibu dan Adik", "Pak Guru"],
            correctIndex: 0,
            explanation: "Tokoh yang bersepeda di cerita adalah Budi dan Ayah.",
          },
          {
            id: 6,
            question: "Dari cerita di atas, di manakah Budi dan Ayah bersepeda?",
            visualHelper: "🌳",
            options: ["Di taman kota", "Di dalam kamar", "Di sawah"],
            correctIndex: 0,
            explanation: "Tempat bersepedanya adalah di taman kota.",
          },
          {
            id: 7,
            question: "Kapan Budi dan Ayah bersepeda?",
            visualHelper: "📅",
            options: ["Pada hari Minggu", "Pada malam hari", "Pada hari Rabu"],
            correctIndex: 0,
            explanation: "Waktu kejadian tertulis jelas: pada hari Minggu.",
          },
          {
            id: 8,
            question: "Kata tanya yang tepat untuk melengkapi: '... cara membuat layang-layang ini?' adalah...",
            visualHelper: "🛠️",
            options: ["Bagaimana", "Siapa", "Di mana"],
            correctIndex: 0,
            explanation: "Kata 'Bagaimana' menanyakan proses atau cara melakukan sesuatu.",
          },
          {
            id: 9,
            question: "Mengapa kita harus membaca teks cerita dengan cermat?",
            visualHelper: "📖",
            options: ["Agar memahami seluruh isi dan pesan cerita", "Supaya cepat mengantuk", "Agar buku cepat rusak"],
            correctIndex: 0,
            explanation: "Membaca dengan cermat membuat kita dapat menjawab pertanyaan dan menyerap nasihat cerita.",
          },
          {
            id: 10,
            question: "Jawaban 'Karena hujan lebat turun' adalah jawaban yang cocok untuk kata tanya...",
            visualHelper: "🌧️",
            options: ["Mengapa", "Kapan", "Siapa"],
            correctIndex: 0,
            explanation: "Kata 'karena' merupakan jawaban atas pertanyaan alasan 'Mengapa'.",
          },
        ],
      };

    default:
      return {
        title: "Bahasa Indonesia Kelas 2 SD",
        conceptText: "Materi belajar Bahasa Indonesia dasar Kelas 2 SD.",
        questions: [],
      };
  }
}
