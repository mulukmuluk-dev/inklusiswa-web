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
  demoVisual?: React.ReactNode;
  questions: QuestionItem[];
}

interface MathGrade6GameProps {
  levelId: number;
  onLevelComplete: (levelId: number, starsEarned: number) => void;
  accessibilityMode?: string;
}

export function MathGrade6Game({ levelId, onLevelComplete, accessibilityMode }: MathGrade6GameProps) {
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

  // Fisher-Yates shuffle algorithm
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

  // Reset on level change
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

    const data = getGrade6LevelData(levelId);
    setQuestionsList(shuffleQuestions(data));
    speakGlobal(data.conceptText);
  }, [levelId]);

  const levelData = getGrade6LevelData(levelId);
  const activeQuestions = questionsList.length > 0 ? questionsList : levelData.questions;
  const currentQ = activeQuestions[currentQuestionIndex] || activeQuestions[0];

  // Narration in game phase
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
            KELAS 6 SD • LEVEL {levelId} dari 10
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
              } else if (!isCompleted && currentQ) {
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

      {/* ================= FASE 1: LABORATORIUM KONSEP INTERAKTIF ================= */}
      {phase === "materi" ? (
        <div className="w-full max-w-2xl flex-1 flex flex-col items-center justify-between p-6 bg-white/80 border-4 border-[#3C632A] rounded-[28px] shadow-[6px_6px_0px_0px_#3C632A] my-2 text-center animate-in fade-in duration-300">
          <div className="space-y-4">
            <span className="px-4 py-1.5 bg-[#C3631D] text-[#FFDF59] font-black text-sm rounded-xl border-2 border-[#3C632A] uppercase tracking-wider">
              FASE 1: LABORATORIUM KONSEP MATERI KELAS 6
            </span>
            <p className="text-2xl md:text-3xl font-black text-[#3C632A] leading-relaxed pt-3">
              {levelData.conceptText}
            </p>
          </div>

          {/* Interactive Math Lab Visualizer per Level */}
          <div className="my-4 p-4 bg-[#FFDF59] border-4 border-[#3C632A] rounded-2xl w-full flex items-center justify-center gap-3">
            {levelId === 1 && (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-4 bg-white/95 p-4 rounded-2xl border-2 border-[#3C632A] text-lg font-black">
                  <span className="text-rose-600 bg-rose-50 px-3 py-1 rounded-xl border border-rose-300">-5</span>
                  <span>&lt;</span>
                  <span className="text-rose-600 bg-rose-50 px-3 py-1 rounded-xl border border-rose-300">-2</span>
                  <span>&lt;</span>
                  <span className="text-[#3C632A] bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-300">0</span>
                  <span>&lt;</span>
                  <span className="text-[#3C632A] bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-300">3</span>
                </div>
                <span className="text-xs sm:text-sm font-black text-[#3C632A] bg-white px-4 py-1 rounded-xl border border-[#3C632A]">
                  Garis Bilangan: Semakin ke kiri posisinya, nilainya semakin kecil!
                </span>
              </div>
            )}

            {levelId === 2 && (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-4 bg-white/95 p-4 rounded-2xl border-2 border-[#3C632A] text-lg sm:text-xl font-black">
                  <span className="text-[#C3631D]">(-4) + 7 = 3</span>
                  <span>•</span>
                  <span className="text-[#7FD13B]">5 - (-3) = 5 + 3 = 8</span>
                </div>
                <span className="text-xs sm:text-sm font-black text-[#3C632A] bg-white px-4 py-1 rounded-xl border border-[#3C632A]">
                  Pengurangan dengan bilangan negatif sama dengan penjumlahan!
                </span>
              </div>
            )}

            {levelId === 3 && (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-4 bg-white/95 p-4 rounded-2xl border-2 border-[#3C632A] text-lg sm:text-xl font-black">
                  <span className="text-[#C3631D]">(-) × (-) = (+)</span>
                  <span>•</span>
                  <span className="text-[#3C632A]">(-) × (+) = (-)</span>
                </div>
                <span className="text-xs sm:text-sm font-black text-[#3C632A] bg-white px-4 py-1 rounded-xl border border-[#3C632A]">
                  Contoh: (-4) × (-5) = 20, dan (-18) : 3 = -6!
                </span>
              </div>
            )}

            {levelId === 4 && (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-3 bg-white/95 p-4 rounded-2xl border-2 border-[#3C632A] text-lg sm:text-xl font-black">
                  <span>1/2 + 0,25 × 2</span>
                  <span>=</span>
                  <span className="bg-[#FFE296] px-3 py-1 rounded-xl border border-[#3C632A]">0,5 + 0,5</span>
                  <span>=</span>
                  <span className="bg-[#7FD13B] text-white px-3 py-1 rounded-xl">1,0</span>
                </div>
                <span className="text-xs sm:text-sm font-black text-[#3C632A] bg-white px-4 py-1 rounded-xl border border-[#3C632A]">
                  Dahulukan operasi perkalian sebelum penjumlahan pecahan!
                </span>
              </div>
            )}

            {levelId === 5 && (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-4 bg-white/95 p-4 rounded-2xl border-2 border-[#3C632A] text-base sm:text-lg font-black flex-wrap justify-center">
                  <span className="text-[#C3631D]">Diameter = 2 × r</span>
                  <span>•</span>
                  <span className="text-[#7FD13B]">Juring: Daerahi 2 jari-jari & busur</span>
                </div>
                <span className="text-xs sm:text-sm font-black text-[#3C632A] bg-white px-4 py-1 rounded-xl border border-[#3C632A]">
                  Tali busur menghubungkan 2 titik pada lengkung lingkaran!
                </span>
              </div>
            )}

            {levelId === 6 && (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-4 bg-white/95 p-4 rounded-2xl border-2 border-[#3C632A] text-lg sm:text-xl font-black">
                  <span className="bg-[#FFE296] px-3 py-1 rounded-xl border border-[#3C632A]">K = 2 × π × r</span>
                  <span>•</span>
                  <span className="bg-[#7FD13B] text-white px-3 py-1 rounded-xl">K = π × d</span>
                </div>
                <span className="text-xs sm:text-sm font-black text-[#3C632A] bg-white px-4 py-1 rounded-xl border border-[#3C632A]">
                  Jari-jari 7 cm: K = 2 × (22/7) × 7 = 44 cm!
                </span>
              </div>
            )}

            {levelId === 7 && (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-4 bg-white/95 p-4 rounded-2xl border-2 border-[#3C632A] text-lg sm:text-xl font-black">
                  <span className="bg-[#FFE296] px-3 py-1 rounded-xl border border-[#3C632A]">Luas = π × r²</span>
                  <span>•</span>
                  <span className="text-[#C3631D]">r = 7 cm ➔ L = 154 cm²</span>
                </div>
                <span className="text-xs sm:text-sm font-black text-[#3C632A] bg-white px-4 py-1 rounded-xl border border-[#3C632A]">
                  Gunakan π = 22/7 untuk kelipatan 7, atau π = 3,14 untuk angka lainnya!
                </span>
              </div>
            )}

            {levelId === 8 && (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-4 bg-white/95 p-4 rounded-2xl border-2 border-[#3C632A] text-base sm:text-lg font-black flex-wrap justify-center">
                  <span className="text-[#C3631D]">Vol. Tabung = π × r² × t</span>
                  <span>•</span>
                  <span className="text-[#7FD13B]">Vol. Prisma = L_alas × t</span>
                </div>
                <span className="text-xs sm:text-sm font-black text-[#3C632A] bg-white px-4 py-1 rounded-xl border border-[#3C632A]">
                  Tabung adalah bangun ruang prisma dengan alas lingkaran!
                </span>
              </div>
            )}

            {levelId === 9 && (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-4 bg-white/95 p-4 rounded-2xl border-2 border-[#3C632A] text-base sm:text-lg font-black flex-wrap justify-center">
                  <span className="text-[#C3631D]">Vol. Kerucut = 1/3 × π × r² × t</span>
                  <span>•</span>
                  <span className="text-[#7FD13B]">Vol. Bola = 4/3 × π × r³</span>
                </div>
                <span className="text-xs sm:text-sm font-black text-[#3C632A] bg-white px-4 py-1 rounded-xl border border-[#3C632A]">
                  Volume kerucut tepat sepertiga dari volume tabung berukuran sama!
                </span>
              </div>
            )}

            {levelId === 10 && (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-4 bg-white/95 p-4 rounded-2xl border-2 border-[#3C632A] text-base sm:text-lg font-black flex-wrap justify-center">
                  <span className="bg-[#FFE296] px-2 py-1 rounded-xl border border-[#3C632A]">Mean = Rata-rata</span>
                  <span className="bg-[#7FD13B] text-white px-2 py-1 rounded-xl">Median = Nilai Tengah</span>
                  <span className="bg-[#C3631D] text-white px-2 py-1 rounded-xl">Modus = Sering Muncul</span>
                </div>
                <span className="text-xs sm:text-sm font-black text-[#3C632A] bg-white px-4 py-1 rounded-xl border border-[#3C632A]">
                  Untuk mencari median, urutkan data dari yang terkecil terlebih dahulu!
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleStartGameChallenge}
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
            Kamu berhasil menyelesaikan seluruh 10 soal tantangan pada Level {levelId}!
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
                Skor: {Math.min(score, 10)}
              </span>
            </div>
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

          {/* PILIHAN JAWABAN (ACAK KIRI, TENGAH, KANAN) */}
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

// ================= DATA SILABUS MATEMATIKA KELAS 6 SD (10 LEVEL x 10 SOAL) =================
function getGrade6LevelData(levelId: number): LevelConceptData {
  switch (levelId) {
    case 1:
      return {
        title: "Mengenal Bilangan Bulat Negatif",
        conceptText: "Bilangan bulat negatif bernilai kurang dari nol dan berada di sebelah kiri pada garis bilangan. Semakin ke kiri posisinya, nilainya semakin kecil. Contoh: -5 < -2.",
        questions: [
          {
            id: 1,
            question: "Kapal selam berada 30 meter di bawah permukaan laut. Dituliskan sebagai bilangan bulat?",
            options: ["-30 meter", "+30 meter", "0 meter"],
            correctIndex: 0,
            explanation: "Kedalaman di bawah permukaan laut dilambangkan tanda minus (-30).",
          },
          {
            id: 2,
            question: "Manakah bilangan yang bernilai paling kecil antara -10, -2, dan 0?",
            options: ["-10", "-2", "0"],
            correctIndex: 0,
            explanation: "Semakin jauh ke kiri dari nol pada garis bilangan, nilainya semakin kecil.",
          },
          {
            id: 3,
            question: "-8 ... -5. Tanda perbandingan yang tepat adalah?",
            options: ["Lebih Kecil (<)", "Lebih Besar (>)", "Sama Dengan (=)"],
            correctIndex: 0,
            explanation: "-8 terletak di sebelah kiri -5, sehingga -8 < -5.",
          },
          {
            id: 4,
            question: "Lawan dari bilangan -15 adalah?",
            options: ["15", "-15", "0"],
            correctIndex: 0,
            explanation: "Lawan dari bilangan negatif adalah bilangan positif yang senilai.",
          },
          {
            id: 5,
            question: "Suhu es batu -4°C dan suhu air mineral 10°C. Mana yang lebih dingin?",
            options: ["Es batu (-4°C)", "Air mineral (10°C)", "Keduanya sama"],
            correctIndex: 0,
            explanation: "Suhu bertanda negatif lebih dingin dibandingkan suhu positif.",
          },
          {
            id: 6,
            question: "Urutkan bilangan berikut dari yang terkecil: -7, 3, -2, 0!",
            options: ["-7, -2, 0, 3", "-2, -7, 0, 3", "3, 0, -2, -7"],
            correctIndex: 0,
            explanation: "Urutan dari paling kiri pada garis bilangan adalah -7, -2, 0, 3.",
          },
          {
            id: 7,
            question: "Bilangan bulat yang terletak tepat 3 langkah di sebelah kiri angka 1 adalah?",
            options: ["-2", "-3", "0"],
            correctIndex: 0,
            explanation: "1 - 3 = -2.",
          },
          {
            id: 8,
            question: "Seorang pedagang mengalami kerugian sebesar Rp50.000. Dituliskan dalam bilangan bulat sebagai?",
            options: ["-Rp50.000", "+Rp50.000", "Rp0"],
            correctIndex: 0,
            explanation: "Kerugian atau penurunan bernilai negatif (-).",
          },
          {
            id: 9,
            question: "Antara angka -1 dan angka 1, bilangan bulat yang berada di tengah-tengahnya adalah?",
            options: ["0", "2", "-2"],
            correctIndex: 0,
            explanation: "Angka 0 adalah batas netral antara -1 dan 1.",
          },
          {
            id: 10,
            question: "Pernyataan yang BENAR mengenai bilangan bulat negatif adalah?",
            options: ["Semakin besar angkanya di belakang minus, nilainya semakin kecil", "Bilangan negatif selalu lebih besar dari 0", "Lawan dari -6 adalah -6"],
            correctIndex: 0,
            explanation: "Sebagai contoh, -100 nilainya jauh lebih kecil dibanding -1.",
          },
        ],
      };

    case 2:
      return {
        title: "Penjumlahan & Pengurangan Bil. Bulat",
        conceptText: "Menjumlahkan dengan bilangan negatif sama dengan mengurangkan: a + (-b) = a - b. Mengurangkan bilangan negatif sama dengan menjumlahkan: a - (-b) = a + b.",
        questions: [
          {
            id: 1,
            question: "7 + (-3) = ...",
            options: ["4", "10", "-4"],
            correctIndex: 0,
            explanation: "7 + (-3) sama dengan 7 - 3 = 4.",
          },
          {
            id: 2,
            question: "(-5) + (-4) = ...",
            options: ["-9", "9", "-1"],
            correctIndex: 0,
            explanation: "Hutang 5 ditambah hutang 4 menjadi hutang 9 (-9).",
          },
          {
            id: 3,
            question: "8 - (-5) = ...",
            options: ["13", "3", "-13"],
            correctIndex: 0,
            explanation: "Pengurangan minus berubah jadi tambah: 8 + 5 = 13.",
          },
          {
            id: 4,
            question: "(-10) + 15 = ...",
            options: ["5", "-5", "-25"],
            correctIndex: 0,
            explanation: "-10 + 15 = 5.",
          },
          {
            id: 5,
            question: "(-6) - 4 = ...",
            options: ["-10", "-2", "2"],
            correctIndex: 0,
            explanation: "-6 dikurangi 4 melangkah ke kiri menjadi -10.",
          },
          {
            id: 6,
            question: "Suhu ruangan mula-mula -2°C lalu dinaikkan 6°C. Berapa suhu sekarang?",
            options: ["4°C", "-8°C", "8°C"],
            correctIndex: 0,
            explanation: "-2 + 6 = 4°C.",
          },
          {
            id: 7,
            question: "(-12) - (-7) = ...",
            options: ["-5", "-19", "5"],
            correctIndex: 0,
            explanation: "-12 + 7 = -5.",
          },
          {
            id: 8,
            question: "15 + (-20) = ...",
            options: ["-5", "5", "35"],
            correctIndex: 0,
            explanation: "15 - 20 = -5.",
          },
          {
            id: 9,
            question: "(-8) + 8 = ...",
            options: ["0", "16", "-16"],
            correctIndex: 0,
            explanation: "Bilangan dijumlahkan dengan lawannya menghasilkan 0.",
          },
          {
            id: 10,
            question: "Suhu di puncak -3°C pada malam hari dan turun lagi 2°C. Suhu saat itu adalah?",
            options: ["-5°C", "-1°C", "1°C"],
            correctIndex: 0,
            explanation: "-3 - 2 = -5°C.",
          },
        ],
      };

    case 3:
      return {
        title: "Perkalian & Pembagian Bil. Bulat",
        conceptText: "Aturan tanda: Dua tanda sama menghasilkan positif (+) × (+) = (+) dan (-) × (-) = (+). Dua tanda berbeda menghasilkan negatif (+) × (-) = (-) dan (-) × (+) = (-).",
        questions: [
          {
            id: 1,
            question: "(-4) × 5 = ...",
            options: ["-20", "20", "-1"],
            correctIndex: 0,
            explanation: "Negatif dikali positif menghasilkan negatif: -20.",
          },
          {
            id: 2,
            question: "(-6) × (-3) = ...",
            options: ["18", "-18", "9"],
            correctIndex: 0,
            explanation: "Negatif dikali negatif menghasilkan positif: 18.",
          },
          {
            id: 3,
            question: "(-24) : 6 = ...",
            options: ["-4", "4", "-6"],
            correctIndex: 0,
            explanation: "Tanda berbeda menghasilkan nilai negatif: -4.",
          },
          {
            id: 4,
            question: "(-30) : (-5) = ...",
            options: ["6", "-6", "25"],
            correctIndex: 0,
            explanation: "Negatif dibagi negatif menghasilkan positif: 6.",
          },
          {
            id: 5,
            question: "8 × (-7) = ...",
            options: ["-56", "56", "-15"],
            correctIndex: 0,
            explanation: "Positif dikali negatif = -56.",
          },
          {
            id: 6,
            question: "(-2) × (-3) × (-4) = ...",
            options: ["-24", "24", "-9"],
            correctIndex: 0,
            explanation: "(-2) × (-3) = 6, lalu 6 × (-4) = -24.",
          },
          {
            id: 7,
            question: "(-50) : 10 = ...",
            options: ["-5", "5", "-500"],
            correctIndex: 0,
            explanation: "-50 : 10 = -5.",
          },
          {
            id: 8,
            question: "0 × (-12) = ...",
            options: ["0", "-12", "12"],
            correctIndex: 0,
            explanation: "Semua bilangan dikalikan dengan nol menghasilkan 0.",
          },
          {
            id: 9,
            question: "Hasil dari (-36) : (-4) × 2 = ...",
            options: ["18", "-18", "9"],
            correctIndex: 0,
            explanation: "(-36) : (-4) = 9, lalu 9 × 2 = 18.",
          },
          {
            id: 10,
            question: "Nilai dari 100 : (-25) = ...",
            options: ["-4", "4", "-5"],
            correctIndex: 0,
            explanation: "100 dibagi -25 adalah -4.",
          },
        ],
      };

    case 4:
      return {
        title: "Campuran Pecahan, Desimal, & Persen",
        conceptText: "Untuk menyelesaikan operasi hitung campuran berbagai bentuk pecahan, ubah semua bilangan ke bentuk yang sama (misal desimal atau pecahan biasa) dan dahulukan perkalian/pembagian.",
        questions: [
          {
            id: 1,
            question: "1/2 + 0,25 = ...",
            options: ["0,75 (3/4)", "0,3", "0,5"],
            correctIndex: 0,
            explanation: "1/2 = 0,5. Maka 0,5 + 0,25 = 0,75.",
          },
          {
            id: 2,
            question: "0,8 - 25% = ...",
            options: ["0,55", "0,6", "0,75"],
            correctIndex: 0,
            explanation: "25% = 0,25. Maka 0,80 - 0,25 = 0,55.",
          },
          {
            id: 3,
            question: "3/4 × 0,2 = ...",
            options: ["0,15 (3/20)", "0,25", "1,5"],
            correctIndex: 0,
            explanation: "0,75 × 0,2 = 0,15.",
          },
          {
            id: 4,
            question: "50% + 1/4 - 0,2 = ...",
            options: ["0,55", "0,45", "0,75"],
            correctIndex: 0,
            explanation: "0,50 + 0,25 - 0,20 = 0,55.",
          },
          {
            id: 5,
            question: "1 1/2 + 0,5 × 2 = ...",
            options: ["2,5", "4", "3"],
            correctIndex: 0,
            explanation: "Dahulukan perkalian: 0,5 × 2 = 1. Lalu 1,5 + 1 = 2,5.",
          },
          {
            id: 6,
            question: "0,6 : 1/5 = ...",
            options: ["3", "0,12", "1,2"],
            correctIndex: 0,
            explanation: "1/5 = 0,2. Maka 0,6 : 0,2 = 3.",
          },
          {
            id: 7,
            question: "Bentuk desimal dari pecahan campuran 1 3/4 adalah?",
            options: ["1,75", "1,25", "1,34"],
            correctIndex: 0,
            explanation: "1 + 3/4 = 1 + 0,75 = 1,75.",
          },
          {
            id: 8,
            question: "20% × 1,5 = ...",
            options: ["0,3", "0,03", "3,0"],
            correctIndex: 0,
            explanation: "0,2 × 1,5 = 0,3.",
          },
          {
            id: 9,
            question: "2 - 0,5 - 25% = ...",
            options: ["1,25", "1,5", "1,75"],
            correctIndex: 0,
            explanation: "2 - 0,5 - 0,25 = 1,25.",
          },
          {
            id: 10,
            question: "3/5 + 40% = ...",
            options: ["1 (100%)", "0,8", "0,7"],
            correctIndex: 0,
            explanation: "3/5 = 60%. Maka 60% + 40% = 100% = 1.",
          },
        ],
      };

    case 5:
      return {
        title: "Unsur-Unsur Lingkaran",
        conceptText: "Unsur-unsur lingkaran meliputi Titik Pusat, Jari-jari (r), Diameter (d = 2r), Busur, Tali Busur, Juring (daerah 2 jari-jari & busur), Tembereng (daerah tali busur & busur), dan Apotema.",
        questions: [
          {
            id: 1,
            question: "Garis lurus penghubung titik pusat dengan lengkung tepi lingkaran disebut?",
            options: ["Jari-jari (r)", "Diameter", "Tali busur"],
            correctIndex: 0,
            explanation: "Jari-jari adalah jarak dari titik pusat ke tepi lingkaran.",
          },
          {
            id: 2,
            question: "Garis lurus membelah lingkaran menjadi dua bagian sama besar melalui pusat adalah?",
            options: ["Diameter (d)", "Busur", "Jari-jari"],
            correctIndex: 0,
            explanation: "Diameter adalah garis tengah yang melintasi titik pusat.",
          },
          {
            id: 3,
            question: "Jika panjang jari-jari lingkaran 7 cm, berapa panjang diameternya?",
            options: ["14 cm (2 × r)", "21 cm", "7 cm"],
            correctIndex: 0,
            explanation: "Diameter = 2 × jari-jari = 2 × 7 = 14 cm.",
          },
          {
            id: 4,
            question: "Daerah dalam lingkaran yang dibatasi oleh dua jari-jari dan sebuah busur disebut?",
            options: ["Juring", "Tembereng", "Apotema"],
            correctIndex: 0,
            explanation: "Juring menyerupai sepotong pizza yang dibatasi 2 jari-jari dan busur.",
          },
          {
            id: 5,
            question: "Daerah dalam lingkaran yang dibatasi oleh sebuah tali busur dan busur disebut?",
            options: ["Tembereng", "Juring", "Titik Pusat"],
            correctIndex: 0,
            explanation: "Daerah antara tali busur dan busur adalah tembereng.",
          },
          {
            id: 6,
            question: "Garis lengkung pada tepi lingkaran dinamakan?",
            options: ["Busur Lingkaran", "Tali Busur", "Diameter"],
            correctIndex: 0,
            explanation: "Garis lengkung lingkaran adalah busur lingkaran.",
          },
          {
            id: 7,
            question: "Garis lurus dari titik pusat tegak lurus ke tali busur disebut?",
            options: ["Apotema", "Juring", "Jari-jari"],
            correctIndex: 0,
            explanation: "Garis apotema tegak lurus menghubungkan titik pusat ke tali busur.",
          },
          {
            id: 8,
            question: "Sebuah lingkaran memiliki diameter 20 cm. Panjang jari-jarinya adalah?",
            options: ["10 cm", "40 cm", "5 cm"],
            correctIndex: 0,
            explanation: "Jari-jari = Diameter / 2 = 20 / 2 = 10 cm.",
          },
          {
            id: 9,
            question: "Garis lurus yang menghubungkan dua titik pada tepi lingkaran disebut?",
            options: ["Tali Busur", "Diameter", "Jari-jari"],
            correctIndex: 0,
            explanation: "Garis penghubung dua titik lingkaran adalah tali busur.",
          },
          {
            id: 10,
            question: "Titik tepat di tengah lingkaran berjarak sama ke semua sisi lingkaran disebut?",
            options: ["Titik Pusat", "Titik Sudut", "Titik Puncak"],
            correctIndex: 0,
            explanation: "Titik pusat adalah titik acuan tengah lingkaran.",
          },
        ],
      };

    case 6:
      return {
        title: "Keliling Lingkaran",
        conceptText: "Rumus Keliling Lingkaran: K = 2 × π × r atau K = π × d. Gunakan π = 22/7 jika r kelipatan 7, atau π = 3,14 jika bukan kelipatan 7.",
        questions: [
          {
            id: 1,
            question: "Rumus keliling lingkaran dengan jari-jari r adalah?",
            options: ["2 × π × r", "π × r × r", "π × r"],
            correctIndex: 0,
            explanation: "Keliling lingkaran = 2 × π × r atau π × d.",
          },
          {
            id: 2,
            question: "Sebuah lingkaran memiliki jari-jari 7 cm. Berapakah kelilingnya? (π = 22/7)",
            options: ["44 cm", "22 cm", "88 cm"],
            correctIndex: 0,
            explanation: "K = 2 × (22/7) × 7 = 44 cm.",
          },
          {
            id: 3,
            question: "Sebuah lingkaran memiliki diameter 14 cm. Berapakah kelilingnya?",
            options: ["44 cm", "28 cm", "88 cm"],
            correctIndex: 0,
            explanation: "K = π × d = (22/7) × 14 = 44 cm.",
          },
          {
            id: 4,
            question: "Lingkaran memiliki jari-jari 10 cm. Berapakah kelilingnya? (π = 3,14)",
            options: ["62,8 cm", "31,4 cm", "314 cm"],
            correctIndex: 0,
            explanation: "K = 2 × 3,14 × 10 = 62,8 cm.",
          },
          {
            id: 5,
            question: "Roda sepeda berdiameter 70 cm berputar 1 kali. Jarak yang ditempuh roda adalah?",
            options: ["220 cm", "140 cm", "440 cm"],
            correctIndex: 0,
            explanation: "K = (22/7) × 70 = 220 cm.",
          },
          {
            id: 6,
            question: "Sebuah lingkaran memiliki jari-jari 21 cm. Berapa kelilingnya?",
            options: ["132 cm", "66 cm", "154 cm"],
            correctIndex: 0,
            explanation: "K = 2 × (22/7) × 21 = 132 cm.",
          },
          {
            id: 7,
            question: "Keliling lingkaran adalah 88 cm. Berapa panjang jari-jarinya? (π = 22/7)",
            options: ["14 cm", "7 cm", "28 cm"],
            correctIndex: 0,
            explanation: "r = 88 / (44/7) = 14 cm.",
          },
          {
            id: 8,
            question: "Nilai pendekatan konstanta π (pi) dalam bentuk pecahan adalah?",
            options: ["22/7", "7/22", "3/14"],
            correctIndex: 0,
            explanation: "Pendekatan π adalah 22/7 atau 3,14.",
          },
          {
            id: 9,
            question: "Lingkaran berdiameter 20 cm memiliki keliling sebesar? (π = 3,14)",
            options: ["62,8 cm", "31,4 cm", "125,6 cm"],
            correctIndex: 0,
            explanation: "K = 3,14 × 20 = 62,8 cm.",
          },
          {
            id: 10,
            question: "Taman lingkaran memiliki jari-jari 35 meter. Keliling taman adalah?",
            options: ["220 meter", "110 meter", "440 meter"],
            correctIndex: 0,
            explanation: "K = 2 × (22/7) × 35 = 220 meter.",
          },
        ],
      };

    case 7:
      return {
        title: "Luas Lingkaran",
        conceptText: "Rumus Luas Lingkaran: L = π × r². Jika diketahui diameter d, cari jari-jari terlebih dahulu (r = d/2). Luas setengah lingkaran = 1/2 × π × r².",
        questions: [
          {
            id: 1,
            question: "Rumus luas lingkaran dengan jari-jari r adalah?",
            options: ["π × r²", "2 × π × r", "π × d"],
            correctIndex: 0,
            explanation: "Luas lingkaran = π × r × r.",
          },
          {
            id: 2,
            question: "Sebuah lingkaran memiliki jari-jari 7 cm. Berapakah luas lingkaran tersebut?",
            options: ["154 cm²", "44 cm²", "77 cm²"],
            correctIndex: 0,
            explanation: "L = (22/7) × 7 × 7 = 154 cm².",
          },
          {
            id: 3,
            question: "Lingkaran memiliki jari-jari 10 cm. Berapakah luasnya? (π = 3,14)",
            options: ["314 cm²", "62,8 cm²", "157 cm²"],
            correctIndex: 0,
            explanation: "L = 3,14 × 10 × 10 = 314 cm².",
          },
          {
            id: 4,
            question: "Sebuah lingkaran memiliki diameter 14 cm. Berapakah luasnya? (r = 7 cm)",
            options: ["154 cm²", "308 cm²", "44 cm²"],
            correctIndex: 0,
            explanation: "r = 7 cm, Luas = (22/7) × 7 × 7 = 154 cm².",
          },
          {
            id: 5,
            question: "Luas setengah lingkaran yang berjari-jari 7 cm adalah?",
            options: ["77 cm² (154 : 2)", "154 cm²", "44 cm²"],
            correctIndex: 0,
            explanation: "Luas 1/2 lingkaran = 154 / 2 = 77 cm².",
          },
          {
            id: 6,
            question: "Lingkaran memiliki jari-jari 14 cm. Berapa luas lingkaran tersebut?",
            options: ["616 cm²", "308 cm²", "154 cm²"],
            correctIndex: 0,
            explanation: "L = (22/7) × 14 × 14 = 616 cm².",
          },
          {
            id: 7,
            question: "Meja bundar berdiameter 20 cm (r = 10 cm). Berapa luas permukaan meja?",
            options: ["314 cm²", "628 cm²", "157 cm²"],
            correctIndex: 0,
            explanation: "L = 3,14 × 10 × 10 = 314 cm².",
          },
          {
            id: 8,
            question: "Luas seperempat (1/4) lingkaran dengan jari-jari 7 cm adalah?",
            options: ["38,5 cm²", "77 cm²", "154 cm²"],
            correctIndex: 0,
            explanation: "L = 154 / 4 = 38,5 cm².",
          },
          {
            id: 9,
            question: "Lingkaran memiliki jari-jari 21 cm. Berapa luas lingkaran tersebut?",
            options: ["1.386 cm²", "616 cm²", "154 cm²"],
            correctIndex: 0,
            explanation: "L = (22/7) × 21 × 21 = 1.386 cm².",
          },
          {
            id: 10,
            question: "Satuan yang baku untuk menyatakan luas lingkaran adalah?",
            options: ["cm² atau m²", "cm atau m", "cm³ atau liter"],
            correctIndex: 0,
            explanation: "Luas selalu menggunakan satuan persegi.",
          },
        ],
      };

    case 8:
      return {
        title: "Prisma, Limas, & Tabung",
        conceptText: "Prisma segitiga memiliki 5 sisi dan 9 rusuk. Tabung adalah prisma dengan alas lingkaran ber-volume V = π × r² × t. Limas segi empat memiliki 5 sisi dan 8 rusuk.",
        questions: [
          {
            id: 1,
            question: "Bangun ruang yang memiliki alas dan tutup lingkaran sama besar dinamakan?",
            options: ["Tabung", "Kerucut", "Bola"],
            correctIndex: 0,
            explanation: "Tabung memiliki alas dan tutup lingkaran kongruen.",
          },
          {
            id: 2,
            question: "Jumlah sisi pada bangun ruang prisma segitiga adalah?",
            options: ["5 sisi", "6 sisi", "4 sisi"],
            correctIndex: 0,
            explanation: "2 sisi segitiga (alas & tutup) + 3 sisi tegak = 5 sisi.",
          },
          {
            id: 3,
            question: "Bangun ruang tabung memiliki rusuk sebanyak?",
            options: ["2 rusuk lengkung", "3 rusuk", "0 rusuk"],
            correctIndex: 0,
            explanation: "Tabung memiliki 2 rusuk lengkung pada lingkaran alas dan tutup.",
          },
          {
            id: 4,
            question: "Rumus volume tabung dengan jari-jari r dan tinggi t adalah?",
            options: ["π × r² × t", "2 × π × r × t", "1/3 × π × r² × t"],
            correctIndex: 0,
            explanation: "Volume tabung = Luas alas × tinggi = π × r² × t.",
          },
          {
            id: 5,
            question: "Tabung dengan jari-jari 7 cm dan tinggi 10 cm memiliki volume sebesar?",
            options: ["1.540 cm³", "154 cm³", "440 cm³"],
            correctIndex: 0,
            explanation: "V = (22/7) × 7 × 7 × 10 = 154 × 10 = 1.540 cm³.",
          },
          {
            id: 6,
            question: "Bangun ruang limas segi empat memiliki titik sudut sebanyak?",
            options: ["5 titik sudut", "8 titik sudut", "6 titik sudut"],
            correctIndex: 0,
            explanation: "4 di alas + 1 di puncak = 5 titik sudut.",
          },
          {
            id: 7,
            question: "Jumlah seluruh rusuk pada prisma segitiga adalah?",
            options: ["9 rusuk", "6 rusuk", "12 rusuk"],
            correctIndex: 0,
            explanation: "3 alas + 3 tutup + 3 tegak = 9 rusuk.",
          },
          {
            id: 8,
            question: "Selimut tabung jika dibuka dan dibentangkan berbentuk bangun?",
            options: ["Persegi Panjang", "Lingkaran", "Segitiga"],
            correctIndex: 0,
            explanation: "Jaring-jaring selimut tabung adalah persegi panjang.",
          },
          {
            id: 9,
            question: "Prisma dengan luas alas 20 cm² dan tinggi 8 cm memiliki volume?",
            options: ["160 cm³", "80 cm³", "40 cm³"],
            correctIndex: 0,
            explanation: "Volume prisma = Luas alas × tinggi = 20 × 8 = 160 cm³.",
          },
          {
            id: 10,
            question: "Bangun ruang yang memiliki satu titik puncak runcing dan sisi tegak segitiga adalah?",
            options: ["Limas", "Prisma", "Balok"],
            correctIndex: 0,
            explanation: "Limas memiliki titik puncak dan sisi tegak segitiga.",
          },
        ],
      };

    case 9:
      return {
        title: "Bangun Ruang Kerucut & Bola",
        conceptText: "Kerucut memiliki 1 alas lingkaran dan 1 titik puncak; volumenya V = 1/3 × π × r² × t. Bola adalah bangun ruang lengkung sempurna tanpa rusuk dan tanpa sudut; V = 4/3 × π × r³.",
        questions: [
          {
            id: 1,
            question: "Bangun ruang kerucut memiliki sisi sebanyak?",
            options: ["2 sisi (alas lingkaran & selimut)", "3 sisi", "1 sisi"],
            correctIndex: 0,
            explanation: "Kerucut memiliki 2 sisi: alas lingkaran dan selimut kerucut.",
          },
          {
            id: 2,
            question: "Rumus volume kerucut dengan jari-jari r dan tinggi t adalah?",
            options: ["1/3 × π × r² × t", "π × r² × t", "4/3 × π × r³"],
            correctIndex: 0,
            explanation: "Volume kerucut adalah sepertiga dari volume tabung.",
          },
          {
            id: 3,
            question: "Topi ulang tahun kerucut merupakan model nyata dari bangun ruang?",
            options: ["Kerucut", "Tabung", "Limas"],
            correctIndex: 0,
            explanation: "Topi caping atau ulang tahun berbentuk kerucut.",
          },
          {
            id: 4,
            question: "Bangun ruang bola memiliki titik sudut sebanyak?",
            options: ["0 (tidak memiliki sudut)", "1", "4"],
            correctIndex: 0,
            explanation: "Bola tidak memiliki titik sudut maupun rusuk.",
          },
          {
            id: 5,
            question: "Kerucut memiliki luas alas 30 cm² dan tinggi 10 cm. Berapa volumenya?",
            options: ["100 cm³ (1/3 × 30 × 10)", "300 cm³", "150 cm³"],
            correctIndex: 0,
            explanation: "V = 1/3 × 30 × 10 = 100 cm³.",
          },
          {
            id: 6,
            question: "Benda di sekitar kita yang berbentuk bola sempurna adalah?",
            options: ["Bola sepak", "Kaleng susu", "Buku tulis"],
            correctIndex: 0,
            explanation: "Bola sepak berbentuk bangun ruang bola.",
          },
          {
            id: 7,
            question: "Jumlah rusuk pada bangun ruang bola adalah?",
            options: ["0 rusuk", "1 rusuk", "Tak hingga"],
            correctIndex: 0,
            explanation: "Bola adalah permukaan lengkung sempurna tanpa rusuk.",
          },
          {
            id: 8,
            question: "Hubungan volume kerucut dan tabung ber-jari-jari dan tinggi sama adalah?",
            options: ["Volume kerucut = 1/3 volume tabung", "Volume kerucut = 1/2 volume tabung", "Volume keduanya sama"],
            correctIndex: 0,
            explanation: "Volume kerucut adalah sepertiga volume tabung seukuran.",
          },
          {
            id: 9,
            question: "Rumus volume bangun ruang bola dengan jari-jari r adalah?",
            options: ["4/3 × π × r³", "π × r²", "2/3 × π × r³"],
            correctIndex: 0,
            explanation: "Volume bola = 4/3 × π × r³.",
          },
          {
            id: 10,
            question: "Titik runcing paling atas pada kerucut dinamakan?",
            options: ["Titik Puncak", "Titik Pusat", "Titik Sudut"],
            correctIndex: 0,
            explanation: "Bagian atas kerucut dinamakan titik puncak.",
          },
        ],
      };

    case 10:
    default:
      return {
        title: "Statistika: Mean, Median, & Modus",
        conceptText: "Statistika data: Mean adalah nilai rata-rata hitung (jumlah data / banyak data). Median adalah nilai tengah setelah data diurutkan. Modus adalah nilai yang paling sering muncul.",
        questions: [
          {
            id: 1,
            question: "Pengertian dari 'Mean' dalam matematika adalah?",
            options: ["Nilai rata-rata hitung data", "Nilai tengah setelah diurutkan", "Nilai yang paling sering muncul"],
            correctIndex: 0,
            explanation: "Mean adalah rata-rata = jumlah data dibagi banyaknya data.",
          },
          {
            id: 2,
            question: "Nilai yang paling sering muncul dari kumpulan data dinamakan?",
            options: ["Modus", "Median", "Mean"],
            correctIndex: 0,
            explanation: "Modus adalah nilai dengan kemunculan/frekuensi terbanyak.",
          },
          {
            id: 3,
            question: "Data nilai ulangan: 6, 7, 8, 8, 9. Modus dari nilai tersebut adalah?",
            options: ["8 (muncul 2 kali)", "7", "9"],
            correctIndex: 0,
            explanation: "Angka 8 muncul paling sering yaitu sebanyak 2 kali.",
          },
          {
            id: 4,
            question: "Nilai tengah dari data yang telah diurutkan dari terkecil ke terbesar disebut?",
            options: ["Median", "Mean", "Modus"],
            correctIndex: 0,
            explanation: "Median adalah nilai tengah data terurut.",
          },
          {
            id: 5,
            question: "Data: 4, 6, 8. Berapakah nilai rata-rata (mean) ketiga data tersebut?",
            options: ["6 ((4 + 6 + 8) / 3)", "8", "18"],
            correctIndex: 0,
            explanation: "18 : 3 = 6.",
          },
          {
            id: 6,
            question: "Tentukan median dari data terurut: 5, 6, 7, 8, 9!",
            options: ["7 (posisi tengah ke-3)", "6", "8"],
            correctIndex: 0,
            explanation: "Angka yang terletak tepat di tengah adalah 7.",
          },
          {
            id: 7,
            question: "Data nilai: 70, 80, 90. Berapakah nilai rata-ratanya?",
            options: ["80", "75", "85"],
            correctIndex: 0,
            explanation: "(70 + 80 + 90) / 3 = 240 / 3 = 80.",
          },
          {
            id: 8,
            question: "Data berat badan: 30, 32, 32, 35, 36. Nilai median dan modusnya adalah?",
            options: ["32 dan 32", "30 dan 35", "32 dan 36"],
            correctIndex: 0,
            explanation: "Nilai tengah adalah 32 dan nilai terbanyak juga 32.",
          },
          {
            id: 9,
            question: "Jika banyak data genap (contoh 4 data: 4, 6, 8, 10), median dicari dengan cara?",
            options: ["Menjumlahkan 2 nilai tengah lalu dibagi 2", "Memilih angka paling kecil", "Memilih angka paling besar"],
            correctIndex: 0,
            explanation: "Median genap = (6 + 8) / 2 = 7.",
          },
          {
            id: 10,
            question: "Nilai ulangan 4 siswa adalah 6, 8, 7, 9. Berapakah rata-rata (mean) mereka?",
            options: ["7,5 (30 / 4)", "8", "7"],
            correctIndex: 0,
            explanation: "(6 + 8 + 7 + 9) / 4 = 30 / 4 = 7,5.",
          },
        ],
      };
  }
}
