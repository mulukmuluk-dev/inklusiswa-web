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
  demoVisual: React.ReactNode;
  questions: QuestionItem[];
}

interface MathGrade2GameProps {
  levelId: number;
  onLevelComplete: (levelId: number, starsEarned: number) => void;
  accessibilityMode?: string;
}

export function MathGrade2Game({ levelId, onLevelComplete, accessibilityMode }: MathGrade2GameProps) {
  const [phase, setPhase] = useState<"materi" | "game">("materi");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState<boolean>(false);
  const [wrongAttempts, setWrongAttempts] = useState<number>(0);
  const [showClue, setShowClue] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [questionsList, setQuestionsList] = useState<QuestionItem[]>([]);
  const isProcessingRef = useRef<boolean>(false);

  // Sandbox demo states for Phase 1
  const [materiPlaceValueBreakdown, setMateriPlaceValueBreakdown] = useState<boolean>(false);
  const [materiCompareChoice, setMateriCompareChoice] = useState<string | null>(null);
  const [materiClockHour, setMateriClockHour] = useState<number>(4);
  const [materiMultiplyCount, setMateriMultiplyCount] = useState<number>(2);

  // Helper untuk mengacak opsi jawaban (Fisher-Yates shuffle) agar tidak selalu di kiri
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

  // Reset when levelId changes
  useEffect(() => {
    setPhase("materi");
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setWrongAttempts(0);
    setShowClue(false);
    setIsCompleted(false);
    isProcessingRef.current = false;

    setMateriPlaceValueBreakdown(false);
    setMateriCompareChoice(null);
    setMateriClockHour(4);
    setMateriMultiplyCount(2);

    const data = getLevelData(levelId);
    setQuestionsList(shuffleQuestions(data));
    speakGlobal(data.conceptText);
  }, [levelId]);

  const levelData = getLevelData(levelId);
  const activeQuestions = questionsList.length > 0 ? questionsList : levelData.questions;
  const currentQ = activeQuestions[currentQuestionIndex] || activeQuestions[0];

  // Read question voice on question change in game phase
  useEffect(() => {
    if (phase === "game" && !isCompleted && currentQ) {
      speakGlobal(`Soal nomor ${currentQuestionIndex + 1}. ${currentQ.question}`);
    }
  }, [currentQuestionIndex, phase, isCompleted, currentQ]);

  const handleStartGame = () => {
    playPopSound();
    setPhase("game");
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setWrongAttempts(0);
    setShowClue(false);
    isProcessingRef.current = false;
    // Acak ulang susunan opsi saat permainan dimulai
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
          // Completed all 10 questions!
          setIsCompleted(true);
          isProcessingRef.current = false;
          const finalScore = updatedScore;
          const stars = finalScore >= 9 ? 3 : finalScore >= 7 ? 2 : 1;
          speakGlobal(`Luar biasa! Kamu telah menyelesaikan 10 soal dan meraih ${stars} bintang!`);
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
      
      {/* HEADER INFO LEVEL */}
      <div className="w-full flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="px-4 py-1.5 bg-[#7FD13B] text-white font-black text-xs md:text-sm rounded-xl border-2 border-[#3C632A]">
            KELAS 2 SD • LEVEL {levelId} dari 10
          </span>
          <h2 className="text-lg md:text-xl font-black text-[#3C632A] drop-shadow-sm">
            {levelData.title}
          </h2>
        </div>

        <div className="flex items-center space-x-2">
          {phase === "game" && !isCompleted && (
            <button
              type="button"
              onClick={() => {
                setPhase("materi");
                speakGlobal(levelData.conceptText);
              }}
              className="px-3.5 py-2 bg-[#FFDF59] text-[#3C632A] font-black text-xs rounded-xl border-2 border-[#3C632A] shadow-sm hover:scale-105 transition-all cursor-pointer"
            >
              Pelajari Materi
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (phase === "materi") {
                speakGlobal(levelData.conceptText);
              } else if (!isCompleted) {
                speakGlobal(`Soal nomor ${currentQuestionIndex + 1}. ${currentQ.question}`);
              }
            }}
            className="px-4 py-2 bg-[#C3631D] hover:bg-[#B25615] text-[#FFDF59] font-black text-xs md:text-sm rounded-xl border-2 border-[#3C632A] shadow-[3px_3px_0px_0px_#3C632A] transition-all flex items-center space-x-2 cursor-pointer"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
            <span>Dengar Suara</span>
          </button>
        </div>
      </div>

      {/* ================= FASE 1: PENGENALAN KONSEP MATERI ================= */}
      {phase === "materi" ? (
        <div className="w-full max-w-2xl flex-1 flex flex-col items-center justify-between p-6 bg-white/80 border-4 border-[#3C632A] rounded-[28px] shadow-[6px_6px_0px_0px_#3C632A] my-2 text-center animate-in fade-in duration-300">
          <div className="space-y-4">
            <span className="px-4 py-1.5 bg-[#C3631D] text-[#FFDF59] font-black text-sm rounded-xl border-2 border-[#3C632A] uppercase tracking-wider">
              FASE 1: PENGENALAN KONSEP MATERI
            </span>
            <p className="text-2xl md:text-3xl font-black text-[#3C632A] leading-relaxed pt-3">
              {levelData.conceptText}
            </p>
          </div>

          {/* Interactive Preview Demo */}
          <div className="my-4 p-4 bg-[#FFDF59] border-4 border-[#3C632A] rounded-2xl w-full flex items-center justify-center gap-3">
            {levelId === 1 && (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-3 bg-white/95 p-4 rounded-2xl border-2 border-[#3C632A]">
                  <span className="text-4xl font-black text-[#C3631D]">235</span>
                  <span className="text-2xl font-black text-[#3C632A]">➔</span>
                  <span className="text-xl font-black text-[#3C632A]">Dua ratus tiga puluh lima</span>
                </div>
                <span className="text-xs sm:text-sm font-black text-[#3C632A] bg-white px-4 py-1.5 rounded-xl border border-[#3C632A]">
                  2 = Ratusan (200), 3 = Puluhan (30), 5 = Satuan (5)
                </span>
              </div>
            )}

            {levelId === 2 && (
              <div className="flex flex-col items-center gap-3 w-full">
                <div
                  onClick={() => {
                    setMateriPlaceValueBreakdown(!materiPlaceValueBreakdown);
                    playPopSound();
                    speakGlobal("426 sama dengan 4 Ratusan ditambah 2 Puluhan ditambah 6 Satuan!");
                  }}
                  className="flex items-center gap-2 flex-wrap justify-center bg-white/95 p-4 rounded-2xl border-2 border-[#3C632A] cursor-pointer hover:scale-105 transition-all"
                >
                  <span className="text-3xl font-black text-[#C3631D] px-3 py-1 bg-[#FFE296] rounded-xl border border-[#3C632A]">426</span>
                  <span className="text-2xl font-black text-[#3C632A]">=</span>
                  <span className="text-base font-black bg-[#7FD13B] text-white px-3 py-1 rounded-xl">400 (Ratusan)</span>
                  <span className="text-xl font-black text-[#3C632A]">+</span>
                  <span className="text-base font-black bg-[#C3631D] text-white px-3 py-1 rounded-xl">20 (Puluhan)</span>
                  <span className="text-xl font-black text-[#3C632A]">+</span>
                  <span className="text-base font-black bg-[#FFDF59] text-[#3C632A] px-3 py-1 rounded-xl border border-[#3C632A]">6 (Satuan)</span>
                </div>
                <span className="text-xs sm:text-sm font-black text-[#3C632A] bg-white px-4 py-1 rounded-xl border border-[#3C632A]">
                  Sentuh kartu di atas untuk mendengar pemecahan nilai tempat!
                </span>
              </div>
            )}

            {levelId === 3 && (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-4 bg-white/95 p-4 rounded-2xl border-2 border-[#3C632A]">
                  <div className="p-3 bg-[#FFE296] border-2 border-[#3C632A] rounded-xl text-center">
                    <span className="text-xs font-black text-[#3C632A] block">KOTAK A</span>
                    <span className="text-2xl font-black text-[#C3631D]">240</span>
                  </div>
                  <span className="text-3xl font-black text-[#C3631D]">&lt;</span>
                  <div className="p-3 bg-[#7FD13B]/30 border-2 border-[#3C632A] rounded-xl text-center">
                    <span className="text-xs font-black text-[#3C632A] block">KOTAK B</span>
                    <span className="text-2xl font-black text-[#3C632A]">310</span>
                  </div>
                </div>
                <span className="text-xs sm:text-sm font-black text-[#3C632A] bg-white px-4 py-1 rounded-xl border border-[#3C632A]">
                  240 lebih kecil dari 310 karena ratusan 200 lebih sedikit dari 300!
                </span>
              </div>
            )}

            {levelId === 4 && (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-3 bg-white/95 p-4 rounded-2xl border-2 border-[#3C632A] text-xl font-black">
                  <span className="text-[#3C632A]">120 + 50 = 170</span>
                  <span className="text-[#C3631D]">dan</span>
                  <span className="text-[#3C632A]">250 - 40 = 210</span>
                </div>
                <span className="text-xs sm:text-sm font-black text-[#3C632A] bg-white px-4 py-1 rounded-xl border border-[#3C632A]">
                  Jumlahkan dan kurangkan angka ratusan serta puluhan secara teratur!
                </span>
              </div>
            )}

            {levelId === 5 && (
              <div className="flex flex-col items-center gap-3 w-full">
                <div
                  onClick={() => {
                    playPopSound();
                    speakGlobal("2 dikali 3 sama dengan 3 ditambah 3, hasilnya 6!");
                  }}
                  className="flex items-center gap-3 bg-white/95 p-4 rounded-2xl border-2 border-[#3C632A] text-xl sm:text-2xl font-black cursor-pointer hover:scale-105 transition-all"
                >
                  <span className="text-[#C3631D]">2 × 3</span>
                  <span>=</span>
                  <span className="bg-[#FFE296] px-3 py-1 rounded-xl border border-[#3C632A]">3 + 3</span>
                  <span>=</span>
                  <span className="bg-[#7FD13B] text-white px-3 py-1 rounded-xl border border-[#3C632A]">6</span>
                </div>
                <span className="text-xs sm:text-sm font-black text-[#3C632A] bg-white px-4 py-1 rounded-xl border border-[#3C632A]">
                  Perkalian adalah penjumlahan berulang angka yang sama!
                </span>
              </div>
            )}

            {levelId === 6 && (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-3 bg-white/95 p-4 rounded-2xl border-2 border-[#3C632A] text-lg sm:text-xl font-black flex-wrap justify-center">
                  <span className="text-[#C3631D]">8 : 2</span>
                  <span>=</span>
                  <span className="bg-[#FFE296] px-3 py-1 rounded-xl border border-[#3C632A]">8 - 2 - 2 - 2 - 2 = 0</span>
                  <span>➔</span>
                  <span className="bg-[#7FD13B] text-white px-3 py-1 rounded-xl">Hasil: 4</span>
                </div>
                <span className="text-xs sm:text-sm font-black text-[#3C632A] bg-white px-4 py-1 rounded-xl border border-[#3C632A]">
                  Pembagian adalah pengurangan berulang sampai habis bernilai 0!
                </span>
              </div>
            )}

            {levelId === 7 && (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-4 bg-white/95 p-4 rounded-2xl border-2 border-[#3C632A]">
                  <div className="flex flex-col items-center">
                    <span className="text-3xl">🍉</span>
                    <span className="text-xs font-black text-[#3C632A]">1 Semangka Utuh</span>
                  </div>
                  <span className="text-2xl font-black text-[#C3631D]">➔ Dipotong 2 ➔</span>
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-[#7FD13B] text-white rounded-xl font-black text-sm border border-[#3C632A]">1/2 (Setengah)</div>
                    <div className="p-2 bg-[#7FD13B] text-white rounded-xl font-black text-sm border border-[#3C632A]">1/2 (Setengah)</div>
                  </div>
                </div>
                <span className="text-xs sm:text-sm font-black text-[#3C632A] bg-white px-4 py-1 rounded-xl border border-[#3C632A]">
                  Pecahan terbentuk jika dipotong sama besar!
                </span>
              </div>
            )}

            {levelId === 8 && (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-6 bg-white/95 p-4 rounded-2xl border-2 border-[#3C632A] text-sm sm:text-base font-black">
                  <div className="flex flex-col items-center">
                    <span className="text-[#C3631D] text-lg font-black">1 Meter (m)</span>
                    <span className="text-[#3C632A]">= 100 Sentimeter (cm)</span>
                  </div>
                  <div className="h-8 w-0.5 bg-[#3C632A]/30"></div>
                  <div className="flex flex-col items-center">
                    <span className="text-[#C3631D] text-lg font-black">1 Kilogram (kg)</span>
                    <span className="text-[#3C632A]">= 1.000 Gram (g)</span>
                  </div>
                </div>
                <span className="text-xs sm:text-sm font-black text-[#3C632A] bg-white px-4 py-1 rounded-xl border border-[#3C632A]">
                  Satuan baku memudahkan pengukuran panjang dan berat secara tepat!
                </span>
              </div>
            )}

            {levelId === 9 && (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-4 bg-white/95 p-4 rounded-2xl border-2 border-[#3C632A]">
                  <div className="w-24 h-24 rounded-full border-4 border-[#3C632A] bg-white relative flex items-center justify-center">
                    <span className="absolute top-1 text-[10px] font-black text-[#3C632A]">12</span>
                    <span className="absolute right-1 text-[10px] font-black text-[#3C632A]">3</span>
                    <span className="absolute bottom-1 text-[10px] font-black text-[#3C632A]">6</span>
                    <span className="absolute left-1 text-[10px] font-black text-[#3C632A]">9</span>
                    <div className="w-2 h-2 bg-[#3C632A] rounded-full z-10"></div>
                    {/* Hour Hand at 4 */}
                    <div className="absolute w-1.5 h-6 bg-[#C3631D] origin-bottom bottom-1/2 left-1/2 -ml-[3px] transform rotate-[120deg]"></div>
                    {/* Minute Hand at 12 */}
                    <div className="absolute w-1 h-9 bg-[#3C632A] origin-bottom bottom-1/2 left-1/2 -ml-[2px] transform rotate-0"></div>
                  </div>
                  <div className="text-left font-black text-[#3C632A]">
                    <div className="text-xl text-[#C3631D]">Pukul 04.00</div>
                    <div className="text-xs">Jarum pendek ke 4, jarum panjang ke 12.</div>
                    <div className="text-xs text-[#7FD13B] mt-1">1 Jam = 60 Menit</div>
                  </div>
                </div>
              </div>
            )}

            {levelId === 10 && (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-4 bg-white/95 p-4 rounded-2xl border-2 border-[#3C632A]">
                  <div className="flex flex-col items-center p-2 bg-[#FFE296] rounded-xl border border-[#3C632A]">
                    <span className="text-base font-black text-[#3C632A]">Segitiga</span>
                    <span className="text-xs text-[#C3631D]">3 Sisi & 3 Sudut</span>
                  </div>
                  <span className="text-xl font-black text-[#3C632A]">+</span>
                  <div className="flex flex-col items-center p-2 bg-[#7FD13B]/30 rounded-xl border border-[#3C632A]">
                    <span className="text-base font-black text-[#3C632A]">Tabel Piktogram</span>
                    <span className="text-xs text-[#3C632A]">1 Gambar = Nilai Tertentu</span>
                  </div>
                </div>
                <span className="text-xs sm:text-sm font-black text-[#3C632A] bg-white px-4 py-1 rounded-xl border border-[#3C632A]">
                  Sentuh tombol di bawah untuk memulai 10 soal tantangan!
                </span>
              </div>
            )}
          </div>

          {/* Selalu aktif dan dapat diklik */}
          <button
            type="button"
            onClick={handleStartGame}
            className="w-full py-5 bg-[#7FD13B] hover:bg-[#6EB832] active:scale-95 text-white border-4 border-[#3C632A] font-black text-2xl sm:text-3xl rounded-[28px] shadow-[4px_4px_0px_0px_#3C632A] transition-all cursor-pointer relative z-20 mt-4"
          >
            Aku Sudah Paham, Mulai Game
          </button>
        </div>
      ) : isCompleted ? (
        /* ================= HASIL SELESAI 10 SOAL ================= */
        <div className="w-full max-w-2xl flex-1 flex flex-col items-center justify-center p-8 bg-white/90 border-4 border-[#3C632A] rounded-[28px] shadow-[6px_6px_0px_0px_#3C632A] my-4 text-center animate-in zoom-in-95 duration-300">
          <span className="text-6xl mb-2">🏆</span>
          <h3 className="text-3xl font-black text-[#3C632A] mb-2">
            Misi Selesai!
          </h3>
          <p className="text-lg font-bold text-[#3C632A]/90 mb-4">
            Kamu berhasil menyelesaikan seluruh 10 soal pada Level {levelId}!
          </p>

          <div className="flex items-center gap-2 text-4xl mb-6">
            <span className={score >= 1 ? "opacity-100" : "opacity-30"}>⭐</span>
            <span className={score >= 7 ? "opacity-100" : "opacity-30"}>⭐</span>
            <span className={score >= 9 ? "opacity-100" : "opacity-30"}>⭐</span>
          </div>

          <div className="bg-[#FFDF59] border-2 border-[#3C632A] px-6 py-3 rounded-2xl font-black text-xl text-[#3C632A] mb-6">
            Skor Akhir: {Math.min(score, levelData.questions.length)} dari {levelData.questions.length} Soal Benar
          </div>

          <button
            type="button"
            onClick={handleFinishLevel}
            className="px-8 py-4 bg-[#7FD13B] hover:bg-[#6EB832] text-white font-black text-xl rounded-2xl border-4 border-[#3C632A] shadow-[4px_4px_0px_0px_#3C632A] hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            Lanjut & Simpan Bintang
          </button>
        </div>
      ) : (
        /* ================= FASE 2: TANTANGAN 10 SOAL BERURUTAN ================= */
        <div className="w-full max-w-2xl flex-1 flex flex-col items-center justify-between my-2">
          
          {/* PROGRESS BAR 10 SOAL */}
          <div className="w-full bg-white/90 border-4 border-[#3C632A] rounded-2xl p-3 shadow-[4px_4px_0px_0px_#3C632A] mb-4 flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs md:text-sm font-black text-[#3C632A]">
              <span>Tantangan Game: Soal {currentQuestionIndex + 1} dari 10</span>
              <span className="bg-[#FFDF59] px-3 py-1 rounded-xl border border-[#3C632A]">
                Skor: {score}
              </span>
            </div>
            {/* Progress track */}
            <div className="w-full h-4 bg-slate-100 rounded-full border-2 border-[#3C632A] overflow-hidden">
              <div
                className="h-full bg-[#7FD13B] transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / 10) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* PERTANYAAN SOAL */}
          <div className="w-full bg-[#C3631D] text-[#FFDF59] border-4 border-[#3C632A] p-6 rounded-3xl text-center shadow-[6px_6px_0px_0px_#3C632A] mb-6">
            <p className="text-2xl md:text-3xl font-black leading-snug">
              {currentQ.question}
            </p>
            {currentQ.visualHelper && (
              <div className="mt-3 text-2xl font-black text-white bg-black/20 py-2 px-4 rounded-xl inline-block">
                {currentQ.visualHelper}
              </div>
            )}
          </div>

          {/* PILIHAN JAWABAN */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mb-4">
            {currentQ.options.map((optText, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrectOpt = idx === currentQ.correctIndex;

              let btnClass = "bg-[#FFDF59] hover:bg-[#FFE296] text-[#3C632A]";
              if (isSelected && isAnswerChecked) {
                btnClass = isCorrectOpt
                  ? "bg-[#7FD13B] text-white ring-4 ring-white animate-bounce"
                  : "bg-rose-500 text-white animate-shake";
              } else if (showClue && isCorrectOpt) {
                btnClass = "bg-[#7FD13B] text-white ring-8 ring-[#7FD13B]/60 animate-pulse scale-105";
              }

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectAnswer(idx)}
                  disabled={isAnswerChecked}
                  className={`p-5 rounded-2xl border-4 border-[#3C632A] font-black text-xl md:text-2xl transition-all shadow-[4px_4px_0px_0px_#3C632A] hover:scale-105 active:scale-95 cursor-pointer text-center ${btnClass}`}
                >
                  {optText}
                </button>
              );
            })}
          </div>

        </div>
      )}

    </div>
  );
}

// ================= DATA SILABUS MATEMATIKA KELAS 2 SD (10 LEVEL x 10 SOAL) =================
function getLevelData(levelId: number): LevelConceptData {
  switch (levelId) {
    case 1:
      return {
        title: "Membaca Bilangan s.d 999",
        conceptText: "Bilangan cacah tiga angka terdiri dari Ratusan, Puluhan, dan Satuan. Misalnya 235 dibaca 'Dua ratus tiga puluh lima'.",
        demoVisual: null,
        questions: [
          {
            id: 1,
            question: "Lambang bilangan dari 'Tiga ratus empat puluh dua' adalah?",
            options: ["342", "324", "432"],
            correctIndex: 0,
            explanation: "342 adalah lambang bilangan tiga ratus empat puluh dua.",
          },
          {
            id: 2,
            question: "Angka 517 dibaca?",
            options: ["Lima ratus tujuh belas", "Lima ratus satu tujuh", "Lima puluh tujuh belas"],
            correctIndex: 0,
            explanation: "517 dibaca lima ratus tujuh belas.",
          },
          {
            id: 3,
            question: "Angka yang berada di antara 679 dan 681 adalah?",
            options: ["680", "678", "682"],
            correctIndex: 0,
            explanation: "Setelah 679 adalah 680, baru kemudian 681.",
          },
          {
            id: 4,
            question: "Manakah lambang bilangan untuk 'Tujuh ratus delapan'?",
            options: ["780", "708", "788"],
            correctIndex: 1,
            explanation: "708 dibaca tujuh ratus delapan (puluhannya nol).",
          },
          {
            id: 5,
            question: "Bilangan 899 jika ditambah 1 menjadi?",
            options: ["900", "890", "990"],
            correctIndex: 0,
            explanation: "899 ditambah 1 sama dengan 900.",
          },
          {
            id: 6,
            question: "Nama bilangan dari 450 adalah?",
            options: ["Empat ratus lima puluh", "Empat ratus lima", "Empat puluh lima"],
            correctIndex: 0,
            explanation: "450 dibaca empat ratus lima puluh.",
          },
          {
            id: 7,
            question: "Urutkan dari yang terkecil: 215, 210, 220!",
            options: ["210, 215, 220", "220, 215, 210", "215, 210, 220"],
            correctIndex: 0,
            explanation: "Urutan dari paling kecil adalah 210, 215, lalu 220.",
          },
          {
            id: 8,
            question: "Angka 605 dibaca?",
            options: ["Enam ratus lima", "Enam ratus lima puluh", "Enam puluh lima"],
            correctIndex: 0,
            explanation: "605 dibaca enam ratus lima.",
          },
          {
            id: 9,
            question: "Lambang bilangan 'Sembilan ratus sembilan puluh sembilan' adalah?",
            options: ["999", "909", "990"],
            correctIndex: 0,
            explanation: "Sembilan ratus sembilan puluh sembilan ditulis 999.",
          },
          {
            id: 10,
            question: "Bilangan tepat sebelum 500 adalah?",
            options: ["499", "490", "501"],
            correctIndex: 0,
            explanation: "Satu angka sebelum 500 adalah 499.",
          },
        ],
      };

    case 2:
      return {
        title: "Nilai Tempat Ratusan, Puluhan, Satuan",
        conceptText: "Nilai tempat menentukan besar angka: Ratusan bernilai ratusan (misal 400), Puluhan bernilai puluhan (20), dan Satuan bernilai satuan (6).",
        demoVisual: null,
        questions: [
          {
            id: 1,
            question: "Pada bilangan 735, angka 7 menempati nilai tempat?",
            options: ["Ratusan", "Puluhan", "Satuan"],
            correctIndex: 0,
            explanation: "Angka 7 di depan bernilai 700 (ratusan).",
          },
          {
            id: 2,
            question: "Nilai angka 8 pada bilangan 284 adalah?",
            options: ["80", "800", "8"],
            correctIndex: 0,
            explanation: "Angka 8 berada di tengah, menempati nilai puluhan (80).",
          },
          {
            id: 3,
            question: "5 ratusan + 3 puluhan + 9 satuan sama dengan?",
            options: ["539", "593", "359"],
            correctIndex: 0,
            explanation: "500 + 30 + 9 membentuk angka 539.",
          },
          {
            id: 4,
            question: "Pada bilangan 604, nilai tempat puluhan ditempati oleh angka?",
            options: ["0", "6", "4"],
            correctIndex: 0,
            explanation: "Angka 0 berada di posisi puluhan.",
          },
          {
            id: 5,
            question: "Bentuk panjang dari 842 adalah?",
            options: ["800 + 40 + 2", "80 + 40 + 2", "800 + 4 + 2"],
            correctIndex: 0,
            explanation: "842 diuraikan menjadi 800 + 40 + 2.",
          },
          {
            id: 6,
            question: "Pada angka 379, angka yang menempati nilai satuan adalah?",
            options: ["9", "7", "3"],
            correctIndex: 0,
            explanation: "Angka paling belakang (9) adalah satuan.",
          },
          {
            id: 7,
            question: "Nilai dari 400 + 70 + 5 adalah?",
            options: ["475", "457", "745"],
            correctIndex: 0,
            explanation: "400 + 70 + 5 = 475.",
          },
          {
            id: 8,
            question: "Pada bilangan 912, angka 1 bernilai?",
            options: ["10", "100", "1"],
            correctIndex: 0,
            explanation: "Angka 1 berada di puluhan, nilainya 10.",
          },
          {
            id: 9,
            question: "Angka 6 pada bilangan 651 bernilai?",
            options: ["600", "60", "6"],
            correctIndex: 0,
            explanation: "Angka 6 di posisi ratusan bernilai 600.",
          },
          {
            id: 10,
            question: "7 ratusan + 0 puluhan + 3 satuan membentuk bilangan?",
            options: ["703", "730", "307"],
            correctIndex: 0,
            explanation: "700 + 0 + 3 = 703.",
          },
        ],
      };

    case 3:
      return {
        title: "Membandingkan Bilangan Ratusan",
        conceptText: "Bandingkan angka ratusan terlebih dahulu. Jika ratusannya sama, bandingkan puluhannya. Gunakan tanda Lebih Besar (>), Lebih Kecil (<), atau Sama Dengan (=).",
        demoVisual: null,
        questions: [
          {
            id: 1,
            question: "352 ... 325. Tanda perbandingan yang tepat adalah?",
            options: ["Lebih Besar (>)", "Lebih Kecil (<)", "Sama Dengan (=)"],
            correctIndex: 0,
            explanation: "352 lebih besar dari 325 karena 50 lebih besar dari 20.",
          },
          {
            id: 2,
            question: "640 ... 640. Tanda perbandingan yang tepat adalah?",
            options: ["Sama Dengan (=)", "Lebih Besar (>)", "Lebih Kecil (<)"],
            correctIndex: 0,
            explanation: "Kedua bilangan memiliki nilai yang sama persis.",
          },
          {
            id: 3,
            question: "419 ... 481. Tanda perbandingan yang tepat adalah?",
            options: ["Lebih Kecil (<)", "Lebih Besar (>)", "Sama Dengan (=)"],
            correctIndex: 0,
            explanation: "419 lebih kecil daripada 481.",
          },
          {
            id: 4,
            question: "Manakah bilangan yang LEBIH BESAR dari 750?",
            options: ["785", "712", "699"],
            correctIndex: 0,
            explanation: "785 memiliki nilai lebih besar dari 750.",
          },
          {
            id: 5,
            question: "Manakah bilangan yang LEBIH KECIL dari 500?",
            options: ["489", "501", "550"],
            correctIndex: 0,
            explanation: "489 kurang dari 500.",
          },
          {
            id: 6,
            question: "823 ... 832. Tanda yang tepat adalah?",
            options: ["Lebih Kecil (<)", "Lebih Besar (>)", "Sama Dengan (=)"],
            correctIndex: 0,
            explanation: "823 lebih kecil dari 832 (20 < 30).",
          },
          {
            id: 7,
            question: "Manakah pernyataan yang BENAR?",
            options: ["615 > 605", "420 < 410", "730 > 750"],
            correctIndex: 0,
            explanation: "615 memang lebih besar daripada 605.",
          },
          {
            id: 8,
            question: "901 ... 899. Tanda yang tepat adalah?",
            options: ["Lebih Besar (>)", "Lebih Kecil (<)", "Sama Dengan (=)"],
            correctIndex: 0,
            explanation: "900-an tentu lebih besar dari 800-an.",
          },
          {
            id: 9,
            question: "Bilangan yang PALING BESAR di antara berikut adalah?",
            options: ["762", "726", "672"],
            correctIndex: 0,
            explanation: "762 adalah angka terbesar.",
          },
          {
            id: 10,
            question: "Bilangan yang PALING KECIL di antara berikut adalah?",
            options: ["309", "390", "319"],
            correctIndex: 0,
            explanation: "309 adalah yang paling kecil karena puluhannya nol.",
          },
        ],
      };

    case 4:
      return {
        title: "Penjumlahan & Pengurangan Ratusan",
        conceptText: "Operasi hitung ratusan dilakukan dengan menjumlahkan atau mengurangkan satuan dengan satuan, puluhan dengan puluhan, dan ratusan dengan ratusan.",
        demoVisual: null,
        questions: [
          {
            id: 1,
            question: "135 + 120 = ...",
            options: ["255", "245", "265"],
            correctIndex: 0,
            explanation: "135 + 120 = 255.",
          },
          {
            id: 2,
            question: "260 + 134 = ...",
            options: ["394", "384", "404"],
            correctIndex: 0,
            explanation: "260 + 134 = 394.",
          },
          {
            id: 3,
            question: "485 - 130 = ...",
            options: ["355", "345", "365"],
            correctIndex: 0,
            explanation: "485 - 130 = 355.",
          },
          {
            id: 4,
            question: "378 - 253 = ...",
            options: ["125", "135", "115"],
            correctIndex: 0,
            explanation: "378 - 253 = 125.",
          },
          {
            id: 5,
            question: "310 + 240 = ...",
            options: ["550", "540", "560"],
            correctIndex: 0,
            explanation: "310 + 240 = 550.",
          },
          {
            id: 6,
            question: "Ibu memiliki 150 butir telur, lalu membeli lagi 125 butir. Total telur ibu adalah?",
            options: ["275 butir", "265 butir", "285 butir"],
            correctIndex: 0,
            explanation: "150 + 125 = 275 butir telur.",
          },
          {
            id: 7,
            question: "Di toko ada 450 buku. Terjual 200 buku. Sisa buku sekarang adalah?",
            options: ["250 buku", "200 buku", "300 buku"],
            correctIndex: 0,
            explanation: "450 - 200 = 250 buku.",
          },
          {
            id: 8,
            question: "500 + 350 = ...",
            options: ["850", "800", "900"],
            correctIndex: 0,
            explanation: "500 + 350 = 850.",
          },
          {
            id: 9,
            question: "670 - 240 = ...",
            options: ["430", "420", "440"],
            correctIndex: 0,
            explanation: "670 - 240 = 430.",
          },
          {
            id: 10,
            question: "425 + 72 = ...",
            options: ["497", "487", "507"],
            correctIndex: 0,
            explanation: "425 + 72 = 497.",
          },
        ],
      };

    case 5:
      return {
        title: "Perkalian sebagai Penjumlahan Berulang",
        conceptText: "Perkalian adalah menjumlahkan bilangan yang sama secara berulang. Misalnya 3 x 4 artinya ada 3 kelompok yang masing-masing berisi 4 (4 + 4 + 4 = 12).",
        demoVisual: null,
        questions: [
          {
            id: 1,
            question: "4 x 3 artinya penjumlahan berulang dari?",
            options: ["3 + 3 + 3 + 3", "4 + 4 + 4", "4 + 3"],
            correctIndex: 0,
            explanation: "4 x 3 artinya angka 3 dijumlahkan sebanyak 4 kali.",
          },
          {
            id: 2,
            question: "Bentuk perkalian dari 5 + 5 + 5 adalah?",
            options: ["3 x 5", "5 x 3", "5 x 5"],
            correctIndex: 0,
            explanation: "Ada 3 buah angka 5, sehingga ditulis 3 x 5.",
          },
          {
            id: 3,
            question: "Hasil dari 3 x 4 adalah?",
            options: ["12", "10", "14"],
            correctIndex: 0,
            explanation: "4 + 4 + 4 = 12.",
          },
          {
            id: 4,
            question: "2 x 6 = ...",
            options: ["12", "8", "14"],
            correctIndex: 0,
            explanation: "6 + 6 = 12.",
          },
          {
            id: 5,
            question: "Ada 4 piring, setiap piring berisi 2 donat. Berapa jumlah seluruh donat?",
            options: ["8 donat", "6 donat", "10 donat"],
            correctIndex: 0,
            explanation: "4 x 2 = 8 donat.",
          },
          {
            id: 6,
            question: "5 x 2 = ...",
            options: ["10", "7", "12"],
            correctIndex: 0,
            explanation: "2 + 2 + 2 + 2 + 2 = 10.",
          },
          {
            id: 7,
            question: "Bentuk penjumlahan berulang dari 2 x 7 adalah?",
            options: ["7 + 7", "2 + 2", "7 + 2"],
            correctIndex: 0,
            explanation: "2 x 7 adalah angka 7 dijumlahkan 2 kali (7 + 7).",
          },
          {
            id: 8,
            question: "3 x 3 = ...",
            options: ["9", "6", "12"],
            correctIndex: 0,
            explanation: "3 + 3 + 3 = 9.",
          },
          {
            id: 9,
            question: "Ada 5 kantong, masing-masing berisi 4 permen. Berapa total seluruh permen?",
            options: ["20 permen", "15 permen", "25 permen"],
            correctIndex: 0,
            explanation: "5 x 4 = 20 permen.",
          },
          {
            id: 10,
            question: "4 x 5 = ...",
            options: ["20", "25", "15"],
            correctIndex: 0,
            explanation: "5 + 5 + 5 + 5 = 20.",
          },
        ],
      };

    case 6:
      return {
        title: "Pembagian sebagai Pengurangan Berulang",
        conceptText: "Pembagian adalah membagi bilangan dengan mengurangkannya secara berulang sampai habis bernilai 0. Misalnya 12 : 3 = 12 - 3 - 3 - 3 - 3 = 0 (sebanyak 4 kali, jadi 12 : 3 = 4).",
        demoVisual: null,
        questions: [
          {
            id: 1,
            question: "12 : 3 dihitung dengan pengurangan: 12 - 3 - 3 - 3 - 3 = 0. Berapa hasilnya?",
            options: ["4", "3", "5"],
            correctIndex: 0,
            explanation: "Angka 3 dikurangkan sebanyak 4 kali, maka hasilnya 4.",
          },
          {
            id: 2,
            question: "Hasil dari 10 : 2 adalah?",
            options: ["5", "4", "6"],
            correctIndex: 0,
            explanation: "10 dikurang 2 sebanyak 5 kali sampai nol, jadi 10 : 2 = 5.",
          },
          {
            id: 3,
            question: "Ada 15 permen dibagikan sama banyak kepada 3 anak. Berapa permen untuk tiap anak?",
            options: ["5 permen", "4 permen", "6 permen"],
            correctIndex: 0,
            explanation: "15 : 3 = 5 permen tiap anak.",
          },
          {
            id: 4,
            question: "Hasil dari 16 : 4 = ...",
            options: ["4", "5", "3"],
            correctIndex: 0,
            explanation: "16 : 4 = 4.",
          },
          {
            id: 5,
            question: "6 : 2 = ...",
            options: ["3", "4", "2"],
            correctIndex: 0,
            explanation: "6 : 2 = 3.",
          },
          {
            id: 6,
            question: "20 apel dimasukkan ke dalam 4 keranjang sama banyak. Berapa isi tiap keranjang?",
            options: ["5 apel", "4 apel", "6 apel"],
            correctIndex: 0,
            explanation: "20 : 4 = 5 apel.",
          },
          {
            id: 7,
            question: "Hasil dari 18 : 3 = ...",
            options: ["6", "5", "7"],
            correctIndex: 0,
            explanation: "18 : 3 = 6.",
          },
          {
            id: 8,
            question: "14 : 2 = ...",
            options: ["7", "6", "8"],
            correctIndex: 0,
            explanation: "14 : 2 = 7.",
          },
          {
            id: 9,
            question: "Bentuk pengurangan berulang dari 9 : 3 adalah?",
            options: ["9 - 3 - 3 - 3 = 0", "9 - 3 = 6", "3 - 3 - 3 = 0"],
            correctIndex: 0,
            explanation: "9 - 3 - 3 - 3 = 0 (3 kali pengurangan).",
          },
          {
            id: 10,
            question: "Hasil dari 24 : 4 = ...",
            options: ["6", "5", "7"],
            correctIndex: 0,
            explanation: "24 : 4 = 6.",
          },
        ],
      };

    case 7:
      return {
        title: "Pecahan Sederhana (1/2, 1/3, 1/4)",
        conceptText: "Pecahan terjadi ketika satu benda utuh dipotong menjadi beberapa bagian SAMA BESAR. Dipotong 2 sama besar bernilai 1/2 (Setengah), dipotong 3 bernilai 1/3, dipotong 4 bernilai 1/4.",
        demoVisual: null,
        questions: [
          {
            id: 1,
            question: "Sebuah kue dipotong menjadi 2 bagian SAMA BESAR. Setiap bagian bernilai?",
            options: ["1/2", "1/3", "1/4"],
            correctIndex: 0,
            explanation: "Satu dari dua bagian sama besar bernilai 1/2 (setengah).",
          },
          {
            id: 2,
            question: "Sebuah pizza dipotong menjadi 4 bagian sama besar. Satu potong bernilai?",
            options: ["1/4", "1/2", "1/3"],
            correctIndex: 0,
            explanation: "Satu dari empat potong sama besar bernilai 1/4 (seperempat).",
          },
          {
            id: 3,
            question: "Pecahan 1/2 sering disebut juga dengan istilah?",
            options: ["Setengah", "Sepertiga", "Seperempat"],
            correctIndex: 0,
            explanation: "1/2 adalah pecahan setengah.",
          },
          {
            id: 4,
            question: "Sebuah pita dibagi menjadi 3 bagian sama panjang. Satu bagian pita bernilai?",
            options: ["1/3", "1/2", "1/4"],
            correctIndex: 0,
            explanation: "Satu bagian dari tiga potongan sama panjang bernilai 1/3.",
          },
          {
            id: 5,
            question: "Pada pecahan 1/4, angka 1 di bagian atas disebut?",
            options: ["Pembilang", "Penyebut", "Pembagi"],
            correctIndex: 0,
            explanation: "Angka atas adalah pembilang, angka bawah adalah penyebut.",
          },
          {
            id: 6,
            question: "Pada pecahan 1/3, angka 3 di bagian bawah disebut?",
            options: ["Penyebut", "Pembilang", "Satuan"],
            correctIndex: 0,
            explanation: "Angka di bawah tanda per disebut penyebut.",
          },
          {
            id: 7,
            question: "Manakah pecahan yang bernilai SEPEREMPAT?",
            options: ["1/4", "1/2", "1/3"],
            correctIndex: 0,
            explanation: "1/4 dibaca satu per empat atau seperempat.",
          },
          {
            id: 8,
            question: "Ibu memotong melon menjadi 2 bagian yang TIDAK sama besar. Apakah bisa disebut 1/2?",
            options: ["Tidak, karena potongannya harus sama besar", "Ya, selalu setengah", "Ya, bebas ukurannya"],
            correctIndex: 0,
            explanation: "Syarat pecahan adalah pembagian harus sama besar.",
          },
          {
            id: 9,
            question: "Pecahan 1/3 dibaca?",
            options: ["Satu per tiga (Sepertiga)", "Tiga per satu", "Setengah"],
            correctIndex: 0,
            explanation: "1/3 dibaca satu per tiga atau sepertiga.",
          },
          {
            id: 10,
            question: "Manakah potongan kue yang PALING BESAR jika dibagi rata?",
            options: ["1/2 bagian", "1/3 bagian", "1/4 bagian"],
            correctIndex: 0,
            explanation: "Makin sedikit pembaginya (hanya dibagi 2), makin besar bagian kuenya (1/2 > 1/3 > 1/4).",
          },
        ],
      };

    case 8:
      return {
        title: "Pengukuran Panjang (cm, m) & Berat (g, kg)",
        conceptText: "Panjang benda diukur dengan sentimeter (cm) atau meter (m). 1 meter = 100 cm. Berat benda diukur dengan gram (g) atau kilogram (kg). 1 kg = 1.000 gram.",
        demoVisual: null,
        questions: [
          {
            id: 1,
            question: "1 meter (m) sama dengan berapa sentimeter (cm)?",
            options: ["100 cm", "10 cm", "1.000 cm"],
            correctIndex: 0,
            explanation: "1 meter = 100 sentimeter.",
          },
          {
            id: 2,
            question: "Alat yang paling tepat untuk mengukur panjang buku tulis adalah?",
            options: ["Penggaris", "Timbangan", "Jam dinding"],
            correctIndex: 0,
            explanation: "Penggaris digunakan untuk mengukur panjang benda kecil.",
          },
          {
            id: 3,
            question: "Berat beras 1 kilogram (kg) sama dengan berapa gram?",
            options: ["1.000 gram", "100 gram", "10 gram"],
            correctIndex: 0,
            explanation: "1 kg setara dengan 1.000 gram.",
          },
          {
            id: 4,
            question: "Satuan baku yang paling tepat untuk mengukur tinggi pintu rumah adalah?",
            options: ["Meter (m)", "Gram (g)", "Detik"],
            correctIndex: 0,
            explanation: "Pintu rumah diukur menggunakan satuan meter (m).",
          },
          {
            id: 5,
            question: "Alat untuk menimbang berat buah-buahan di pasar adalah?",
            options: ["Timbangan", "Meteran gulung", "Termometer"],
            correctIndex: 0,
            explanation: "Timbangan digunakan untuk mengukur berat benda.",
          },
          {
            id: 6,
            question: "2 meter (m) sama dengan berapa sentimeter (cm)?",
            options: ["200 cm", "20 cm", "2.000 cm"],
            correctIndex: 0,
            explanation: "2 x 100 cm = 200 cm.",
          },
          {
            id: 7,
            question: "Benda mana yang biasanya diukur dengan satuan sentimeter (cm)?",
            options: ["Pensil", "Jalan raya", "Lapangan sepak bola"],
            correctIndex: 0,
            explanation: "Pensil memiliki ukuran puluhan sentimeter.",
          },
          {
            id: 8,
            question: "3 kilogram (kg) sama dengan berapa gram?",
            options: ["3.000 gram", "300 gram", "30 gram"],
            correctIndex: 0,
            explanation: "3 x 1.000 = 3.000 gram.",
          },
          {
            id: 9,
            question: "Manakah yang LEBIH BERAT: 1 kg apel atau 500 gram apel?",
            options: ["1 kg apel", "500 gram apel", "Sama berat"],
            correctIndex: 0,
            explanation: "1 kg (1.000 g) tentu lebih berat dari 500 gram.",
          },
          {
            id: 10,
            question: "300 cm sama dengan berapa meter?",
            options: ["3 meter", "30 meter", "300 meter"],
            correctIndex: 0,
            explanation: "300 dibagi 100 = 3 meter.",
          },
        ],
      };

    case 9:
      return {
        title: "Jam Analog & Durasi Waktu",
        conceptText: "Jarum pendek menunjukkan jam, jarum panjang menunjukkan menit. 1 jam = 60 menit. Setengah jam = 30 menit. Jika jarum panjang di angka 12, waktu tepat jam tersebut.",
        demoVisual: null,
        questions: [
          {
            id: 1,
            question: "Jika jarum pendek menunjuk angka 3 dan jarum panjang menunjuk angka 12, maka waktu menunjukkan pukul?",
            options: ["Pukul 03.00", "Pukul 12.03", "Pukul 03.12"],
            correctIndex: 0,
            explanation: "Jarum pendek di 3 dan panjang di 12 adalah tepat Pukul 03.00.",
          },
          {
            id: 2,
            question: "1 jam sama dengan berapa menit?",
            options: ["60 menit", "100 menit", "30 menit"],
            correctIndex: 0,
            explanation: "1 jam terdiri dari 60 menit.",
          },
          {
            id: 3,
            question: "Jarum pendek di antara angka 2 dan 3, jarum panjang di angka 6. Waktu menunjukkan pukul?",
            options: ["Pukul 02.30 (Setengah tiga)", "Pukul 03.30", "Pukul 02.06"],
            correctIndex: 0,
            explanation: "Jarum panjang di angka 6 menandakan lebih 30 menit (Pukul 02.30).",
          },
          {
            id: 4,
            question: "Budi mulai belajar pukul 08.00 dan selesai pukul 10.00. Berapa lama durasi Budi belajar?",
            options: ["2 jam", "1 jam", "3 jam"],
            correctIndex: 0,
            explanation: "Dari jam 8 sampai jam 10 adalah 2 jam.",
          },
          {
            id: 5,
            question: "Setengah jam sama dengan berapa menit?",
            options: ["30 menit", "15 menit", "45 menit"],
            correctIndex: 0,
            explanation: "Setengah dari 60 menit adalah 30 menit.",
          },
          {
            id: 6,
            question: "Jarum jam yang bergerak lebih lambat dan berukuran lebih pendek menunjukkan?",
            options: ["Jam", "Menit", "Detik"],
            correctIndex: 0,
            explanation: "Jarum pendek menunjukkan waktu jam.",
          },
          {
            id: 7,
            question: "Pukul 07.00 pagi ditambah 1 jam ke depan menjadi pukul?",
            options: ["08.00 pagi", "09.00 pagi", "06.00 pagi"],
            correctIndex: 0,
            explanation: "7 + 1 = 8.",
          },
          {
            id: 8,
            question: "Jika jarum panjang menunjuk angka 12 dan jarum pendek menunjuk angka 9, waktu menunjukkan pukul?",
            options: ["Pukul 09.00", "Pukul 12.09", "Pukul 09.12"],
            correctIndex: 0,
            explanation: "Waktu menunjukkan pukul sembilan tepat (09.00).",
          },
          {
            id: 9,
            question: "Pukul 21.00 malam sama dengan jam berapa?",
            options: ["Jam 9 malam", "Jam 8 malam", "Jam 10 malam"],
            correctIndex: 0,
            explanation: "21.00 dikurang 12 adalah jam 9 malam.",
          },
          {
            id: 10,
            question: "Ani bermain sepeda dari pukul 16.00 sampai 17.00. Ani bermain selama berapa menit?",
            options: ["60 menit (1 jam)", "30 menit", "120 menit"],
            correctIndex: 0,
            explanation: "Durasi 1 jam sama dengan 60 menit.",
          },
        ],
      };

    case 10:
    default:
      return {
        title: "Geometri & Piktogram Data",
        conceptText: "Bangun datar memiliki sisi dan sudut (misal segitiga 3 sisi, persegi 4 sisi). Piktogram adalah penyajian data menggunakan gambar benda dengan nilai tertentu.",
        demoVisual: null,
        questions: [
          {
            id: 1,
            question: "Bangun datar yang memiliki 3 sisi dan 3 sudut adalah?",
            options: ["Segitiga", "Persegi", "Lingkaran"],
            correctIndex: 0,
            explanation: "Segitiga dibentuk oleh 3 sisi dan memiliki 3 sudut.",
          },
          {
            id: 2,
            question: "Persegi memiliki berapa sisi yang sama panjang?",
            options: ["4 sisi", "3 sisi", "5 sisi"],
            correctIndex: 0,
            explanation: "Persegi memiliki 4 sisi yang semuanya sama panjang.",
          },
          {
            id: 3,
            question: "Bangun datar yang tidak memiliki sudut (hanya 1 sisi lengkung) adalah?",
            options: ["Lingkaran", "Persegi panjang", "Segitiga"],
            correctIndex: 0,
            explanation: "Lingkaran dibentuk oleh satu garis lengkung tanpa titik sudut.",
          },
          {
            id: 4,
            question: "Titik pertemuan antara dua sisi bangun datar dinamakan?",
            options: ["Titik sudut", "Garis tengah", "Keliling"],
            correctIndex: 0,
            explanation: "Pertemuan dua garis sisi membentuk titik sudut.",
          },
          {
            id: 5,
            question: "Kotak kardus kado dan dadu merupakan contoh bangun ruang?",
            options: ["Kubus / Balok", "Kerucut", "Bola"],
            correctIndex: 0,
            explanation: "Kardus dan dadu berbentuk kubus atau balok.",
          },
          {
            id: 6,
            question: "Bola sepak dan kelereng memiliki bentuk bangun ruang?",
            options: ["Bola", "Tabung", "Prisma"],
            correctIndex: 0,
            explanation: "Benda bulat sempurna adalah bangun ruang bola.",
          },
          {
            id: 7,
            question: "Pada piktogram, 1 gambar apel mewakili 2 buah apel. Jika ada 3 gambar apel, total apel adalah?",
            options: ["6 buah apel", "5 buah apel", "3 buah apel"],
            correctIndex: 0,
            explanation: "3 x 2 = 6 buah apel.",
          },
          {
            id: 8,
            question: "Kaleng susu dan drum minyak berbentuk bangun ruang?",
            options: ["Tabung", "Kubus", "Limas"],
            correctIndex: 0,
            explanation: "Kaleng susu memiliki alas dan tutup lingkaran, berbentuk tabung.",
          },
          {
            id: 9,
            question: "Persegi panjang memiliki berapa sudut siku-siku?",
            options: ["4 sudut", "3 sudut", "2 sudut"],
            correctIndex: 0,
            explanation: "Persegi panjang memiliki 4 sudut siku-siku.",
          },
          {
            id: 10,
            question: "Pada diagram gambar, 1 buku mewakili 5 buku. Jika ada 4 gambar buku, total buku adalah?",
            options: ["20 buku", "15 buku", "25 buku"],
            correctIndex: 0,
            explanation: "4 x 5 = 20 buku.",
          },
        ],
      };
  }
}
