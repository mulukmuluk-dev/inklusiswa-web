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

interface MathGrade5GameProps {
  levelId: number;
  onLevelComplete: (levelId: number, starsEarned: number) => void;
  accessibilityMode?: string;
}

export function MathGrade5Game({ levelId, onLevelComplete, accessibilityMode }: MathGrade5GameProps) {
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

    const data = getGrade5LevelData(levelId);
    setQuestionsList(shuffleQuestions(data));
    speakGlobal(data.conceptText);
  }, [levelId]);

  const levelData = getGrade5LevelData(levelId);
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
            KELAS 5 SD • LEVEL {levelId} dari 10
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
              FASE 1: LABORATORIUM KONSEP MATERI KELAS 5
            </span>
            <p className="text-2xl md:text-3xl font-black text-[#3C632A] leading-relaxed pt-3">
              {levelData.conceptText}
            </p>
          </div>

          {/* Interactive Math Lab Visualizer per Level */}
          <div className="my-4 p-4 bg-[#FFDF59] border-4 border-[#3C632A] rounded-2xl w-full flex items-center justify-center gap-3">
            {levelId === 1 && (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-3 bg-white/95 p-4 rounded-2xl border-2 border-[#3C632A] text-xl font-black">
                  <span>2/3 + 1/4</span>
                  <span>➔</span>
                  <span className="bg-[#FFE296] px-3 py-1 rounded-xl border border-[#3C632A]">8/12 + 3/12</span>
                  <span>=</span>
                  <span className="bg-[#7FD13B] text-white px-3 py-1 rounded-xl">11/12</span>
                </div>
                <span className="text-xs sm:text-sm font-black text-[#3C632A] bg-white px-4 py-1 rounded-xl border border-[#3C632A]">
                  Samakan penyebut dengan KPK (KPK dari 3 dan 4 adalah 12)!
                </span>
              </div>
            )}

            {levelId === 2 && (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-3 bg-white/95 p-4 rounded-2xl border-2 border-[#3C632A] text-xl font-black flex-wrap justify-center">
                  <span className="bg-[#FFE296] px-3 py-1 rounded-xl border border-[#3C632A]">2/3 × 3/5</span>
                  <span>=</span>
                  <span className="text-[#C3631D]">(2×3)/(3×5) = 6/15</span>
                  <span>=</span>
                  <span className="bg-[#7FD13B] text-white px-3 py-1 rounded-xl">2/5</span>
                </div>
                <span className="text-xs sm:text-sm font-black text-[#3C632A] bg-white px-4 py-1 rounded-xl border border-[#3C632A]">
                  Untuk pembagian pecahan, kalikan dengan kebalikan pecahan kedua (dibalik pembilang dan penyebut)!
                </span>
              </div>
            )}

            {levelId === 3 && (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-4 bg-white/95 p-4 rounded-2xl border-2 border-[#3C632A] text-xl font-black">
                  <span className="text-[#C3631D]">0,4 × 0,2 = 0,08</span>
                  <span className="text-[#3C632A]">•</span>
                  <span className="text-[#7FD13B]">25% = 0,25</span>
                </div>
                <span className="text-xs sm:text-sm font-black text-[#3C632A] bg-white px-4 py-1 rounded-xl border border-[#3C632A]">
                  Pada perkalian desimal, jumlahkan banyaknya angka di belakang koma!
                </span>
              </div>
            )}

            {levelId === 4 && (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-4 bg-white/95 p-4 rounded-2xl border-2 border-[#3C632A] text-lg sm:text-xl font-black">
                  <span>A : B = 2 : 3</span>
                  <span>➔</span>
                  <span className="text-[#C3631D]">Jika A = 10, maka B = (3/2) × 10 = 15</span>
                </div>
                <span className="text-xs sm:text-sm font-black text-[#3C632A] bg-white px-4 py-1 rounded-xl border border-[#3C632A]">
                  Perbandingan senilai: jika besaran pertama bertambah, besaran kedua ikut bertambah sebanding!
                </span>
              </div>
            )}

            {levelId === 5 && (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-3 bg-white/95 p-4 rounded-2xl border-2 border-[#3C632A] text-lg sm:text-xl font-black">
                  <span className="text-[#C3631D]">Skala 1 : 100.000</span>
                  <span>➔</span>
                  <span className="text-[#3C632A]">1 cm di peta = 100.000 cm (1 km) sebenarnya</span>
                </div>
                <span className="text-xs sm:text-sm font-black text-[#3C632A] bg-white px-4 py-1 rounded-xl border border-[#3C632A]">
                  Jarak Sebenarnya = Jarak Peta × Nilai Skala!
                </span>
              </div>
            )}

            {levelId === 6 && (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-4 bg-white/95 p-4 rounded-2xl border-2 border-[#3C632A] text-lg sm:text-xl font-black">
                  <span className="bg-[#FFE296] px-3 py-1 rounded-xl border border-[#3C632A]">Jarak = K × W</span>
                  <span>•</span>
                  <span className="bg-[#7FD13B] text-white px-3 py-1 rounded-xl">Kecepatan = J / W</span>
                </div>
                <span className="text-xs sm:text-sm font-black text-[#3C632A] bg-white px-4 py-1 rounded-xl border border-[#3C632A]">
                  Contoh: Jarak 120 km ditempuh 2 jam, maka Kecepatan = 120 : 2 = 60 km/jam!
                </span>
              </div>
            )}

            {levelId === 7 && (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-4 bg-white/95 p-4 rounded-2xl border-2 border-[#3C632A] text-lg sm:text-xl font-black">
                  <span className="bg-[#FFE296] px-3 py-1 rounded-xl border border-[#3C632A]">Debit = Volume / Waktu</span>
                  <span>•</span>
                  <span className="bg-[#7FD13B] text-white px-3 py-1 rounded-xl">Volume = Debit × Waktu</span>
                </div>
                <span className="text-xs sm:text-sm font-black text-[#3C632A] bg-white px-4 py-1 rounded-xl border border-[#3C632A]">
                  Contoh: 60 liter air mengalir dalam 2 menit, Debit = 60 : 2 = 30 liter/menit!
                </span>
              </div>
            )}

            {levelId === 8 && (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-4 bg-white/95 p-4 rounded-2xl border-2 border-[#3C632A] text-base sm:text-lg font-black flex-wrap justify-center">
                  <span className="text-[#C3631D]">Kubus: 6 sisi persegi identik</span>
                  <span>•</span>
                  <span className="text-[#7FD13B]">Balok: 6 sisi (3 pasang persegi panjang)</span>
                </div>
                <span className="text-xs sm:text-sm font-black text-[#3C632A] bg-white px-4 py-1 rounded-xl border border-[#3C632A]">
                  Keduanya sama-sama memiliki 12 rusuk dan 8 titik sudut!
                </span>
              </div>
            )}

            {levelId === 9 && (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-4 bg-white/95 p-4 rounded-2xl border-2 border-[#3C632A] text-base sm:text-lg font-black flex-wrap justify-center">
                  <span className="text-[#C3631D]">Vol. Kubus = s × s × s</span>
                  <span>•</span>
                  <span className="text-[#7FD13B]">Vol. Balok = p × l × t</span>
                  <span className="bg-[#FFE296] px-2 py-0.5 rounded-lg border border-[#3C632A] text-xs">1 dm³ = 1 Liter</span>
                </div>
                <span className="text-xs sm:text-sm font-black text-[#3C632A] bg-white px-4 py-1 rounded-xl border border-[#3C632A]">
                  Kubus rusuk 3 cm: Volume = 3 × 3 × 3 = 27 cm³!
                </span>
              </div>
            )}

            {levelId === 10 && (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-4 bg-white/95 p-4 rounded-2xl border-2 border-[#3C632A]">
                  <span className="text-base font-black text-[#3C632A]">📈 Diagram Garis & Analisis Frekuensi Data</span>
                  <span className="text-xs font-black bg-[#7FD13B] text-white px-3 py-1 rounded-xl">Analisis Taktis</span>
                </div>
                <span className="text-xs sm:text-sm font-black text-[#3C632A] bg-white px-4 py-1 rounded-xl border border-[#3C632A]">
                  Diagram garis sangat ideal untuk melihat fluktuasi dan tren perubahan data dari waktu ke waktu!
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

// ================= DATA SILABUS MATEMATIKA KELAS 5 SD (10 LEVEL x 10 SOAL) =================
function getGrade5LevelData(levelId: number): LevelConceptData {
  switch (levelId) {
    case 1:
      return {
        title: "Penjumlahan & Pengurangan Pecahan",
        conceptText: "Untuk menjumlahkan atau mengurangkan pecahan biasa maupun campuran dengan penyebut berbeda, samakan penyebutnya menggunakan KPK terlebih dahulu.",
        questions: [
          {
            id: 1,
            question: "1/2 + 1/3 = ...",
            options: ["5/6", "2/5", "1/5"],
            correctIndex: 0,
            explanation: "KPK penyebut 6: 3/6 + 2/6 = 5/6.",
          },
          {
            id: 2,
            question: "3/4 - 1/2 = ...",
            options: ["1/4", "2/4", "2/2"],
            correctIndex: 0,
            explanation: "3/4 - 2/4 = 1/4.",
          },
          {
            id: 3,
            question: "2/5 + 3/10 = ...",
            options: ["7/10", "5/15", "5/10"],
            correctIndex: 0,
            explanation: "4/10 + 3/10 = 7/10.",
          },
          {
            id: 4,
            question: "1 1/2 + 2 1/4 = ...",
            options: ["3 3/4", "3 2/6", "4 1/4"],
            correctIndex: 0,
            explanation: "1 2/4 + 2 1/4 = 3 3/4.",
          },
          {
            id: 5,
            question: "5/6 - 1/3 = ...",
            options: ["3/6 (1/2)", "4/3", "2/6"],
            correctIndex: 0,
            explanation: "5/6 - 2/6 = 3/6 atau 1/2.",
          },
          {
            id: 6,
            question: "2 3/5 - 1 1/5 = ...",
            options: ["1 2/5", "1 4/5", "2 2/5"],
            correctIndex: 0,
            explanation: "(2 - 1) + (3/5 - 1/5) = 1 2/5.",
          },
          {
            id: 7,
            question: "Ibu membeli 1/2 kg tepung dan 3/4 kg gula. Berapa total belanjaan Ibu?",
            options: ["1 1/4 kg (5/4 kg)", "4/6 kg", "1 kg"],
            correctIndex: 0,
            explanation: "2/4 + 3/4 = 5/4 = 1 1/4 kg.",
          },
          {
            id: 8,
            question: "7/8 - 3/4 = ...",
            options: ["1/8", "4/4", "4/8"],
            correctIndex: 0,
            explanation: "7/8 - 6/8 = 1/8.",
          },
          {
            id: 9,
            question: "2/3 + 1/6 = ...",
            options: ["5/6", "3/9", "1/2"],
            correctIndex: 0,
            explanation: "4/6 + 1/6 = 5/6.",
          },
          {
            id: 10,
            question: "3 - 1 1/3 = ...",
            options: ["1 2/3", "2 1/3", "1 1/3"],
            correctIndex: 0,
            explanation: "2 3/3 - 1 1/3 = 1 2/3.",
          },
        ],
      };

    case 2:
      return {
        title: "Perkalian & Pembagian Pecahan",
        conceptText: "Pada perkalian pecahan, kalikan pembilang dengan pembilang dan penyebut dengan penyebut. Pada pembagian pecahan, kalikan dengan kebalikan pecahan kedua.",
        questions: [
          {
            id: 1,
            question: "1/2 × 2/3 = ...",
            options: ["1/3 (2/6)", "3/5", "2/5"],
            correctIndex: 0,
            explanation: "(1×2)/(2×3) = 2/6 disederhanakan menjadi 1/3.",
          },
          {
            id: 2,
            question: "3/4 × 4/5 = ...",
            options: ["3/5", "7/9", "12/15"],
            correctIndex: 0,
            explanation: "Angka 4 dicoret: 3/5.",
          },
          {
            id: 3,
            question: "2/3 : 1/2 = ...",
            options: ["4/3 (1 1/3)", "2/6", "1/3"],
            correctIndex: 0,
            explanation: "2/3 × 2/1 = 4/3 = 1 1/3.",
          },
          {
            id: 4,
            question: "1/4 : 2 = ...",
            options: ["1/8", "2/4", "1/2"],
            correctIndex: 0,
            explanation: "1/4 × 1/2 = 1/8.",
          },
          {
            id: 5,
            question: "5 × 1/5 = ...",
            options: ["1", "5/25", "25"],
            correctIndex: 0,
            explanation: "5/5 = 1.",
          },
          {
            id: 6,
            question: "3/5 × 10 = ...",
            options: ["6", "15", "30"],
            correctIndex: 0,
            explanation: "(3 × 10) / 5 = 30 / 5 = 6.",
          },
          {
            id: 7,
            question: "4/7 : 2/7 = ...",
            options: ["2", "8/49", "1/2"],
            correctIndex: 0,
            explanation: "4/7 × 7/2 = 4/2 = 2.",
          },
          {
            id: 8,
            question: "Paman punya 6 liter minyak, dimasukkan ke botol 1/2 liter. Berapa botol yang dibutuhkan?",
            options: ["12 botol (6 : 1/2)", "3 botol", "8 botol"],
            correctIndex: 0,
            explanation: "6 × 2/1 = 12 botol.",
          },
          {
            id: 9,
            question: "2 1/2 × 2 = ...",
            options: ["5", "4 1/2", "4"],
            correctIndex: 0,
            explanation: "5/2 × 2 = 5.",
          },
          {
            id: 10,
            question: "3/4 : 3/8 = ...",
            options: ["2", "1/2", "9/32"],
            correctIndex: 0,
            explanation: "3/4 × 8/3 = 8/4 = 2.",
          },
        ],
      };

    case 3:
      return {
        title: "Operasi Hitung Desimal & Persen",
        conceptText: "Operasi hitung desimal memerlukan pelurusan koma saat penjumlahan/pengurangan, serta penghitungan jumlah desimal pada perkalian. 1% artinya 1/100 = 0,01.",
        questions: [
          {
            id: 1,
            question: "0,35 + 0,42 = ...",
            options: ["0,77", "0,7", "0,87"],
            correctIndex: 0,
            explanation: "Luruskan koma: 0,35 + 0,42 = 0,77.",
          },
          {
            id: 2,
            question: "1,5 - 0,75 = ...",
            options: ["0,75", "0,85", "1,25"],
            correctIndex: 0,
            explanation: "1,50 - 0,75 = 0,75.",
          },
          {
            id: 3,
            question: "0,4 × 0,5 = ...",
            options: ["0,2 (0,20)", "0,02", "2,0"],
            correctIndex: 0,
            explanation: "4 × 5 = 20, dengan 2 angka di belakang koma menjadi 0,20 = 0,2.",
          },
          {
            id: 4,
            question: "2,4 : 2 = ...",
            options: ["1,2", "0,12", "12"],
            correctIndex: 0,
            explanation: "2,4 dibagi 2 adalah 1,2.",
          },
          {
            id: 5,
            question: "15% + 25% = ...",
            options: ["40%", "30%", "50%"],
            correctIndex: 0,
            explanation: "15% + 25% = 40%.",
          },
          {
            id: 6,
            question: "Berapa 20% dari Rp50.000?",
            options: ["Rp10.000", "Rp5.000", "Rp20.000"],
            correctIndex: 0,
            explanation: "20/100 × 50.000 = Rp10.000.",
          },
          {
            id: 7,
            question: "0,6 + 25% = ...",
            options: ["0,85", "0,31", "31%"],
            correctIndex: 0,
            explanation: "25% = 0,25. Maka 0,6 + 0,25 = 0,85.",
          },
          {
            id: 8,
            question: "3,75 - 1,2 = ...",
            options: ["2,55", "2,73", "1,55"],
            correctIndex: 0,
            explanation: "3,75 - 1,20 = 2,55.",
          },
          {
            id: 9,
            question: "0,12 × 10 = ...",
            options: ["1,2", "12", "0,012"],
            correctIndex: 0,
            explanation: "Dikalikan 10 koma mundur 1 langkah menjadi 1,2.",
          },
          {
            id: 10,
            question: "4,8 : 0,6 = ...",
            options: ["8", "0,8", "80"],
            correctIndex: 0,
            explanation: "48 : 6 = 8.",
          },
        ],
      };

    case 4:
      return {
        title: "Perbandingan Senilai & Dua Besaran",
        conceptText: "Perbandingan senilai menunjukkan dua besaran yang jika salah satu membesar, besaran lainnya ikut membesar sebanding. Contoh: 2 : 3 sama nilainya dengan 10 : 15.",
        questions: [
          {
            id: 1,
            question: "Perbandingan kelereng Andi dan Budi adalah 2 : 3. Jika kelereng Andi 10 butir, kelereng Budi adalah?",
            options: ["15 butir", "12 butir", "20 butir"],
            correctIndex: 0,
            explanation: "(3/2) × 10 = 15 butir.",
          },
          {
            id: 2,
            question: "Bentuk paling sederhana dari perbandingan 12 : 18 adalah?",
            options: ["2 : 3", "3 : 4", "1 : 2"],
            correctIndex: 0,
            explanation: "Kedua angka sama-sama dibagi 6 menghasilkan 2 : 3.",
          },
          {
            id: 3,
            question: "Perbandingan umur Ayah dan Kakak 7 : 3. Jika umur Kakak 15 tahun, umur Ayah adalah?",
            options: ["35 tahun", "40 tahun", "30 tahun"],
            correctIndex: 0,
            explanation: "(7/3) × 15 = 35 tahun.",
          },
          {
            id: 4,
            question: "Harga 3 buku tulis adalah Rp15.000. Berapa harga 5 buku tulis yang sama?",
            options: ["Rp25.000", "Rp20.000", "Rp30.000"],
            correctIndex: 0,
            explanation: "Harga 1 buku = Rp5.000. Maka 5 buku = Rp25.000.",
          },
          {
            id: 5,
            question: "1 liter bensin cukup untuk 10 km. Berapa jarak yang ditempuh dengan 4 liter bensin?",
            options: ["40 km", "30 km", "50 km"],
            correctIndex: 0,
            explanation: "4 × 10 = 40 km.",
          },
          {
            id: 6,
            question: "Perbandingan siswa pria dan wanita 3 : 4. Jika total siswa 28 orang, jumlah siswa pria adalah?",
            options: ["12 anak (3/7 × 28)", "16 anak", "14 anak"],
            correctIndex: 0,
            explanation: "Total bagian = 3 + 4 = 7. Pria = 3/7 × 28 = 12 anak.",
          },
          {
            id: 7,
            question: "Perbandingan uang Rina dan Sinta 4 : 5. Selisih uang mereka Rp5.000. Berapa uang Rina?",
            options: ["Rp20.000", "Rp25.000", "Rp15.000"],
            correctIndex: 0,
            explanation: "Selisih bagian = 5 - 4 = 1. Uang Rina = 4 × Rp5.000 = Rp20.000.",
          },
          {
            id: 8,
            question: "Bentuk paling sederhana dari perbandingan 20 : 25 adalah?",
            options: ["4 : 5", "2 : 3", "5 : 6"],
            correctIndex: 0,
            explanation: "Keduanya dibagi 5 menghasilkan 4 : 5.",
          },
          {
            id: 9,
            question: "Resep kue butuh 2 butir telur untuk 100 gram tepung. Berapa telur untuk 300 gram tepung?",
            options: ["6 butir", "4 butir", "8 butir"],
            correctIndex: 0,
            explanation: "300/100 × 2 = 6 butir telur.",
          },
          {
            id: 10,
            question: "Perbandingan mangga matang dan mentah 5 : 2. Jika mangga matang ada 25 buah, mangga mentah ada?",
            options: ["10 buah", "15 buah", "5 buah"],
            correctIndex: 0,
            explanation: "(2/5) × 25 = 10 buah.",
          },
        ],
      };

    case 5:
      return {
        title: "Perhitungan Skala Peta & Denah",
        conceptText: "Skala adalah perbandingan antara jarak pada peta/denah dengan jarak sebenarnya. Rumus: Skala = Jarak Peta : Jarak Sebenarnya.",
        questions: [
          {
            id: 1,
            question: "Skala 1 : 500.000 artinya 1 cm di peta mewakili jarak sebenarnya sejauh?",
            options: ["5 km (500.000 cm)", "50 km", "0,5 km"],
            correctIndex: 0,
            explanation: "500.000 cm = 5.000 m = 5 km.",
          },
          {
            id: 2,
            question: "Jarak dua kota di peta 4 cm dengan skala 1 : 1.000.000. Jarak sebenarnya adalah?",
            options: ["40 km", "4 km", "400 km"],
            correctIndex: 0,
            explanation: "4 × 1.000.000 cm = 4.000.000 cm = 40 km.",
          },
          {
            id: 3,
            question: "Jarak sebenarnya 60 km. Jika digambar dengan skala 1 : 2.000.000, jarak pada peta adalah?",
            options: ["3 cm", "6 cm", "2 cm"],
            correctIndex: 0,
            explanation: "60 km = 6.000.000 cm. Jarak peta = 6.000.000 : 2.000.000 = 3 cm.",
          },
          {
            id: 4,
            question: "Rumus baku untuk mencari nilai Skala adalah?",
            options: ["Jarak Peta : Jarak Sebenarnya", "Jarak Sebenarnya : Jarak Peta", "Jarak Peta × Jarak Sebenarnya"],
            correctIndex: 0,
            explanation: "Skala = Jarak Peta dibagi Jarak Sebenarnya.",
          },
          {
            id: 5,
            question: "Panjang lapangan di denah 5 cm dengan skala 1 : 200. Berapa panjang lapangan sebenarnya?",
            options: ["10 meter (1.000 cm)", "100 meter", "20 meter"],
            correctIndex: 0,
            explanation: "5 × 200 cm = 1.000 cm = 10 meter.",
          },
          {
            id: 6,
            question: "Jarak peta 6 cm mewakili jarak sebenarnya 12 km. Skala peta tersebut adalah?",
            options: ["1 : 200.000", "1 : 120.000", "1 : 2.000.000"],
            correctIndex: 0,
            explanation: "12 km = 1.200.000 cm. Skala = 6 : 1.200.000 = 1 : 200.000.",
          },
          {
            id: 7,
            question: "Skala 1 : 50 pada denah rumah artinya 1 cm pada gambar mewakili?",
            options: ["50 cm ukuran sebenarnya", "5 meter", "500 cm"],
            correctIndex: 0,
            explanation: "1 cm di gambar mewakili 50 cm sebenarnya.",
          },
          {
            id: 8,
            question: "Jarak dua desa di peta 8 cm dengan skala 1 : 25.000. Jarak sebenarnya adalah?",
            options: ["2 km (200.000 cm)", "20 km", "0,2 km"],
            correctIndex: 0,
            explanation: "8 × 25.000 = 200.000 cm = 2 km.",
          },
          {
            id: 9,
            question: "Jarak sebenarnya 50 km digambar pada peta sepanjang 5 cm. Berapa skala petanya?",
            options: ["1 : 1.000.000", "1 : 500.000", "1 : 100.000"],
            correctIndex: 0,
            explanation: "50 km = 5.000.000 cm. Skala = 5 : 5.000.000 = 1 : 1.000.000.",
          },
          {
            id: 10,
            question: "Tinggi gedung pada denah 10 cm dengan skala 1 : 500. Berapa tinggi gedung sebenarnya?",
            options: ["50 meter (5.000 cm)", "500 meter", "5 meter"],
            correctIndex: 0,
            explanation: "10 × 500 cm = 5.000 cm = 50 meter.",
          },
        ],
      };

    case 6:
      return {
        title: "Kecepatan (Jarak, Waktu, & Kecepatan)",
        conceptText: "Hubungan jarak (J), waktu tempuh (W), dan kecepatan (K) dirumuskan: J = K × W, K = J : W, dan W = J : K.",
        questions: [
          {
            id: 1,
            question: "Mobil melaju menempuh jarak 120 km dalam waktu 2 jam. Berapa kecepatan rata-rata mobil?",
            options: ["60 km/jam", "50 km/jam", "70 km/jam"],
            correctIndex: 0,
            explanation: "Kecepatan = 120 km : 2 jam = 60 km/jam.",
          },
          {
            id: 2,
            question: "Budi bersepeda dengan kecepatan 15 km/jam selama 3 jam. Berapa jarak yang ditempuh Budi?",
            options: ["45 km", "30 km", "50 km"],
            correctIndex: 0,
            explanation: "Jarak = 15 × 3 = 45 km.",
          },
          {
            id: 3,
            question: "Kereta api menempuh jarak 180 km dengan kecepatan 60 km/jam. Berapa lama waktu perjalanannya?",
            options: ["3 jam", "2 jam", "4 jam"],
            correctIndex: 0,
            explanation: "Waktu = 180 : 60 = 3 jam.",
          },
          {
            id: 4,
            question: "Rumus untuk menghitung Kecepatan (K) adalah?",
            options: ["Jarak dibagi Waktu (J : W)", "Jarak dikali Waktu", "Waktu dibagi Jarak"],
            correctIndex: 0,
            explanation: "Kecepatan = Jarak / Waktu.",
          },
          {
            id: 5,
            question: "Sebuah bus menempuh jarak 150 km dalam waktu 2,5 jam. Kecepatan bus tersebut adalah?",
            options: ["60 km/jam", "50 km/jam", "75 km/jam"],
            correctIndex: 0,
            explanation: "150 : 2,5 = 60 km/jam.",
          },
          {
            id: 6,
            question: "Ayah berangkat pukul 07.00 dan tiba pukul 09.00 (lama 2 jam). Jika kecepatan 50 km/jam, jaraknya?",
            options: ["100 km", "120 km", "80 km"],
            correctIndex: 0,
            explanation: "Jarak = 50 × 2 = 100 km.",
          },
          {
            id: 7,
            question: "Kecepatan 36 km/jam sama nilainya dengan berapa meter/detik?",
            options: ["10 m/detik", "20 m/detik", "5 m/detik"],
            correctIndex: 0,
            explanation: "36.000 meter : 3.600 detik = 10 m/detik.",
          },
          {
            id: 8,
            question: "Jarak 6 km ditempuh Budi dalam 0,5 jam (30 menit). Berapa kecepatan bersepeda Budi?",
            options: ["12 km/jam", "10 km/jam", "6 km/jam"],
            correctIndex: 0,
            explanation: "6 : 0,5 = 12 km/jam.",
          },
          {
            id: 9,
            question: "Rumus untuk menghitung Waktu tempuh (W) adalah?",
            options: ["Jarak dibagi Kecepatan (J : K)", "Kecepatan dibagi Jarak", "Jarak dikali Kecepatan"],
            correctIndex: 0,
            explanation: "Waktu = Jarak / Kecepatan.",
          },
          {
            id: 10,
            question: "Pesawat terbang dengan kecepatan 500 km/jam selama 2 jam. Total jarak penerbangannya adalah?",
            options: ["1.000 km", "800 km", "1.200 km"],
            correctIndex: 0,
            explanation: "Jarak = 500 × 2 = 1.000 km.",
          },
        ],
      };

    case 7:
      return {
        title: "Debit Aliran Air (Volume, Waktu, & Debit)",
        conceptText: "Debit adalah banyaknya volume zat cair yang mengalir per satuan waktu. Rumus: Debit = Volume : Waktu, Volume = Debit × Waktu.",
        questions: [
          {
            id: 1,
            question: "Sebuah kran mengalirkan air 60 liter dalam waktu 3 menit. Berapa debit aliran air kran?",
            options: ["20 liter/menit", "30 liter/menit", "15 liter/menit"],
            correctIndex: 0,
            explanation: "Debit = 60 liter : 3 menit = 20 liter/menit.",
          },
          {
            id: 2,
            question: "Debit pipa air adalah 10 liter/detik. Berapa volume air yang dialirkan selama 5 detik?",
            options: ["50 liter", "15 liter", "25 liter"],
            correctIndex: 0,
            explanation: "Volume = 10 × 5 = 50 liter.",
          },
          {
            id: 3,
            question: "Bak mandi volume 120 liter diisi air dengan debit 30 liter/menit. Berapa menit hingga penuh?",
            options: ["4 menit", "5 menit", "3 menit"],
            correctIndex: 0,
            explanation: "Waktu = 120 : 30 = 4 menit.",
          },
          {
            id: 4,
            question: "Rumus untuk menghitung Debit (D) adalah?",
            options: ["Volume dibagi Waktu (V : W)", "Volume dikali Waktu", "Waktu dibagi Volume"],
            correctIndex: 0,
            explanation: "Debit = Volume / Waktu.",
          },
          {
            id: 5,
            question: "1 liter air sama nilainya dengan berapa cm³ (mililiter)?",
            options: ["1.000 cm³", "100 cm³", "10.000 cm³"],
            correctIndex: 0,
            explanation: "1 liter = 1 dm³ = 1.000 cm³.",
          },
          {
            id: 6,
            question: "Air mengalir dengan debit 2 liter/detik. Selama 1 menit (60 detik), berapa volume air yang mengalir?",
            options: ["120 liter", "60 liter", "200 liter"],
            correctIndex: 0,
            explanation: "2 × 60 = 120 liter.",
          },
          {
            id: 7,
            question: "Sebuah selang mengisi ember 30 liter dalam waktu 10 menit. Berapakah debit selang air tersebut?",
            options: ["3 liter/menit", "300 liter/menit", "2 liter/menit"],
            correctIndex: 0,
            explanation: "30 : 10 = 3 liter/menit.",
          },
          {
            id: 8,
            question: "Satuan yang lazim digunakan untuk menyatakan debit adalah?",
            options: ["liter/menit atau m³/detik", "km/jam", "kg/menit"],
            correctIndex: 0,
            explanation: "Debit adalah volume per satuan waktu.",
          },
          {
            id: 9,
            question: "Kolam ikan 600 liter diisi air dengan debit 20 liter/menit. Berapa lama waktu pengisiannya?",
            options: ["30 menit", "20 menit", "40 menit"],
            correctIndex: 0,
            explanation: "600 : 20 = 30 menit.",
          },
          {
            id: 10,
            question: "Debit air 120 liter/menit sama dengan berapa liter/detik?",
            options: ["2 liter/detik (120 : 60)", "12 liter/detik", "20 liter/detik"],
            correctIndex: 0,
            explanation: "120 liter / 60 detik = 2 liter/detik.",
          },
        ],
      };

    case 8:
      return {
        title: "Jaring-Jaring Kubus & Balok",
        conceptText: "Kubus tersusun dari 6 sisi bujur sangkar (persegi) yang identik, memiliki 12 rusuk sama panjang, dan 8 titik sudut. Balok tersusun dari 3 pasang persegi panjang yang saling berhadapan.",
        questions: [
          {
            id: 1,
            question: "Jumlah sisi pada bangun ruang kubus adalah?",
            options: ["6 sisi persegi sama besar", "4 sisi", "8 sisi"],
            correctIndex: 0,
            explanation: "Kubus memiliki 6 sisi persegi kongruen.",
          },
          {
            id: 2,
            question: "Sebuah kubus memiliki titik sudut sebanyak?",
            options: ["8 titik sudut", "6 titik sudut", "12 titik sudut"],
            correctIndex: 0,
            explanation: "Kubus memiliki 8 buah titik sudut.",
          },
          {
            id: 3,
            question: "Jumlah seluruh rusuk pada bangun ruang balok adalah?",
            options: ["12 rusuk", "8 rusuk", "6 rusuk"],
            correctIndex: 0,
            explanation: "Balok memiliki 12 rusuk (4 panjang, 4 lebar, 4 tinggi).",
          },
          {
            id: 4,
            question: "Sifat sisi-sisi yang berhadapan pada bangun ruang balok adalah?",
            options: ["Sama besar dan sejajar", "Berbeda ukuran", "Tegak lurus"],
            correctIndex: 0,
            explanation: "Sisi yang berhadapan pada balok selalu kongruen dan sejajar.",
          },
          {
            id: 5,
            question: "Jaring-jaring kubus terdiri dari rangkaian berapa buah persegi?",
            options: ["6 buah persegi", "4 buah persegi", "8 buah persegi"],
            correctIndex: 0,
            explanation: "Ada 6 persegi yang membentuk jaring-jaring kubus.",
          },
          {
            id: 6,
            question: "Berapa banyak pasang sisi yang sama bentuk dan ukurannya pada bangun balok?",
            options: ["3 pasang", "4 pasang", "2 pasang"],
            correctIndex: 0,
            explanation: "Balok memiliki 3 pasang sisi yang berhadapan sama luas.",
          },
          {
            id: 7,
            question: "Jika sisi alas kubus berada di bawah, maka sisi tutup atas kubus adalah sisi yang?",
            options: ["Berhadapan langsung dengan alas", "Bersebelahan dengan alas", "Di samping kiri alas"],
            correctIndex: 0,
            explanation: "Tutup kubus berhadapan dengan alas kubus.",
          },
          {
            id: 8,
            question: "Kubus merupakan bentuk istimewa dari balok yang memiliki keistimewaan berupa?",
            options: ["Semua rusuknya sama panjang", "Tidak memiliki sudut", "Memiliki 8 sisi"],
            correctIndex: 0,
            explanation: "Kubus adalah balok dengan panjang = lebar = tinggi.",
          },
          {
            id: 9,
            question: "Sudut pertemuan antarrusuk tegak dan mendatar pada kubus besarnya adalah?",
            options: ["90° (Sudut siku-siku)", "60°", "180°"],
            correctIndex: 0,
            explanation: "Semua sudut pojok kubus adalah siku-siku 90°.",
          },
          {
            id: 10,
            question: "Benda nyata di sekitar kita yang berbentuk bangun ruang kubus adalah?",
            options: ["Dadu permainan", "Buku tulis", "Kotak pasta gigi"],
            correctIndex: 0,
            explanation: "Dadu berbentuk kubus sempurna.",
          },
        ],
      };

    case 9:
      return {
        title: "Menghitung Volume Kubus & Balok",
        conceptText: "Rumus volume kubus: V = s × s × s = s³. Rumus volume balok: V = p × l × t. Hubungan satuan baku: 1 dm³ = 1 Liter, 1 m³ = 1.000 Liter.",
        questions: [
          {
            id: 1,
            question: "Rumus untuk menghitung volume kubus dengan panjang rusuk s adalah?",
            options: ["s × s × s (s³)", "6 × s", "s × s"],
            correctIndex: 0,
            explanation: "Volume kubus = rusuk × rusuk × rusuk.",
          },
          {
            id: 2,
            question: "Sebuah kubus memiliki panjang rusuk 4 cm. Berapa volume kubus tersebut?",
            options: ["64 cm³ (4 × 4 × 4)", "16 cm³", "24 cm³"],
            correctIndex: 0,
            explanation: "4 × 4 × 4 = 64 cm³.",
          },
          {
            id: 3,
            question: "Rumus menghitung volume balok dengan panjang p, lebar l, dan tinggi t adalah?",
            options: ["p × l × t", "p + l + t", "2 × (p + l + t)"],
            correctIndex: 0,
            explanation: "Volume balok = panjang × lebar × tinggi.",
          },
          {
            id: 4,
            question: "Balok berukuran panjang 10 cm, lebar 5 cm, dan tinggi 4 cm. Berapa volumenya?",
            options: ["200 cm³", "100 cm³", "400 cm³"],
            correctIndex: 0,
            explanation: "10 × 5 × 4 = 200 cm³.",
          },
          {
            id: 5,
            question: "Sebuah kubus memiliki panjang rusuk 5 cm. Berapakah volume kubus tersebut?",
            options: ["125 cm³", "25 cm³", "150 cm³"],
            correctIndex: 0,
            explanation: "5 × 5 × 5 = 125 cm³.",
          },
          {
            id: 6,
            question: "Akuarium balok berukuran panjang 60 cm, lebar 40 cm, dan tinggi 30 cm. Volume air maksimalnya?",
            options: ["72.000 cm³ (72 Liter)", "130 cm³", "7.200 cm³"],
            correctIndex: 0,
            explanation: "60 × 40 × 30 = 72.000 cm³ = 72 Liter.",
          },
          {
            id: 7,
            question: "1 dm³ sama nilainya dengan satuan volume?",
            options: ["1 Liter", "10 Liter", "100 Liter"],
            correctIndex: 0,
            explanation: "1 desimeter kubik (dm³) setara tepat dengan 1 Liter.",
          },
          {
            id: 8,
            question: "Sebuah kubus memiliki volume 27 cm³. Berapa panjang rusuk kubus tersebut?",
            options: ["3 cm", "9 cm", "6 cm"],
            correctIndex: 0,
            explanation: "Akar pangkat tiga dari 27 adalah 3 cm.",
          },
          {
            id: 9,
            question: "Balok volume 150 cm³, panjang 10 cm, lebar 5 cm. Berapakah tinggi balok tersebut?",
            options: ["3 cm (150 : 50)", "5 cm", "4 cm"],
            correctIndex: 0,
            explanation: "Tinggi = Volume : (p × l) = 150 : 50 = 3 cm.",
          },
          {
            id: 10,
            question: "Kubus dengan panjang rusuk 10 cm memiliki volume sebesar?",
            options: ["1.000 cm³ (1 Liter)", "100 cm³", "10.000 cm³"],
            correctIndex: 0,
            explanation: "10 × 10 × 10 = 1.000 cm³ = 1 Liter.",
          },
        ],
      };

    case 10:
    default:
      return {
        title: "Penyajian Data & Diagram Garis",
        conceptText: "Diagram garis sangat tepat untuk menyajikan data berkala yang berubah dari waktu ke waktu. Tabel frekuensi memudahkan menghitung nilai yang paling sering muncul (modus).",
        questions: [
          {
            id: 1,
            question: "Diagram yang paling tepat untuk menyajikan data perkembangan suhu pasien dari jam ke jam adalah?",
            options: ["Diagram Garis", "Diagram Lingkaran", "Piktogram"],
            correctIndex: 0,
            explanation: "Diagram garis paling cocok untuk data berkelanjutan dari waktu ke waktu.",
          },
          {
            id: 2,
            question: "Data nilai: 70 (3 anak), 80 (8 anak), 90 (4 anak), 100 (1 anak). Total seluruh siswa adalah?",
            options: ["16 siswa", "15 siswa", "18 siswa"],
            correctIndex: 0,
            explanation: "3 + 8 + 4 + 1 = 16 siswa.",
          },
          {
            id: 3,
            question: "Dari data di atas (70: 3, 80: 8, 90: 4, 100: 1), nilai yang paling banyak diperoleh siswa adalah?",
            options: ["Nilai 80 (8 anak)", "Nilai 90", "Nilai 70"],
            correctIndex: 0,
            explanation: "Nilai 80 memiliki frekuensi terbanyak yaitu 8 anak.",
          },
          {
            id: 4,
            question: "Penjualan sepeda: Senin 5, Selasa 8, Rabu 6, Kamis 10. Kenaikan penjualan tertinggi terjadi pada hari?",
            options: ["Kamis (naik 4 unit)", "Selasa", "Rabu"],
            correctIndex: 0,
            explanation: "Dari Rabu (6) ke Kamis (10) terjadi kenaikan tertinggi yaitu 4 unit.",
          },
          {
            id: 5,
            question: "Berapa selisih penjualan sepeda terendah (Senin = 5) dan tertinggi (Kamis = 10)?",
            options: ["5 unit", "4 unit", "6 unit"],
            correctIndex: 0,
            explanation: "10 - 5 = 5 unit.",
          },
          {
            id: 6,
            question: "Cara pengumpulan data dengan membagikan daftar pertanyaan tertulis kepada responden dinamakan?",
            options: ["Angket / Kuesioner", "Wawancara langsung", "Observasi"],
            correctIndex: 0,
            explanation: "Daftar pertanyaan tertulis adalah angket atau kuesioner.",
          },
          {
            id: 7,
            question: "Garis mendatar (sumbu horizontal) pada diagram garis biasanya menyatakan?",
            options: ["Waktu atau Kategori Data", "Jumlah Frekuensi", "Nilai Ujian"],
            correctIndex: 0,
            explanation: "Sumbu horizontal menyatakan waktu atau kategori data.",
          },
          {
            id: 8,
            question: "Garis tegak (sumbu vertikal) pada diagram garis biasanya menyatakan?",
            options: ["Jumlah Frekuensi / Kuantitas", "Hari", "Nama Siswa"],
            correctIndex: 0,
            explanation: "Sumbu vertikal menunjukkan jumlah frekuensi atau nilai besaran data.",
          },
          {
            id: 9,
            question: "Berat badan: 32 kg (2 anak), 34 kg (5 anak), 36 kg (3 anak). Berapa anak dengan berat lebih dari 32 kg?",
            options: ["8 anak (5 + 3)", "5 anak", "10 anak"],
            correctIndex: 0,
            explanation: "5 anak (34 kg) + 3 anak (36 kg) = 8 anak.",
          },
          {
            id: 10,
            question: "Tujuan utama menyajikan data dalam bentuk tabel atau diagram adalah?",
            options: ["Mempermudah membaca dan menganalisis informasi secara cepat", "Menghemat kertas", "Membuat data lebih rumit"],
            correctIndex: 0,
            explanation: "Penyajian data visual mempermudah pemahaman dan analisis informasi secara cepat.",
          },
        ],
      };
  }
}
