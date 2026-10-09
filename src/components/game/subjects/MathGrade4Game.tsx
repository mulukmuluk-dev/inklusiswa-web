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

interface MathGrade4GameProps {
  levelId: number;
  onLevelComplete: (levelId: number, starsEarned: number) => void;
  accessibilityMode?: string;
}

export function MathGrade4Game({ levelId, onLevelComplete, accessibilityMode }: MathGrade4GameProps) {
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

    const data = getGrade4LevelData(levelId);
    setQuestionsList(shuffleQuestions(data));
    speakGlobal(data.conceptText);
  }, [levelId]);

  const levelData = getGrade4LevelData(levelId);
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
            KELAS 4 SD • LEVEL {levelId} dari 10
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
              FASE 1: LABORATORIUM KONSEP MATERI
            </span>
            <p className="text-2xl md:text-3xl font-black text-[#3C632A] leading-relaxed pt-3">
              {levelData.conceptText}
            </p>
          </div>

          {/* Interactive Math Lab Visualizer per Level */}
          <div className="my-4 p-4 bg-[#FFDF59] border-4 border-[#3C632A] rounded-2xl w-full flex items-center justify-center gap-3">
            {levelId === 1 && (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-3 bg-white/95 p-4 rounded-2xl border-2 border-[#3C632A]">
                  <span className="text-3xl font-black text-[#C3631D]">125.400</span>
                  <span className="text-2xl font-black text-[#3C632A]">➔</span>
                  <span className="text-base font-black text-[#3C632A]">Seratus dua puluh lima ribu empat ratus</span>
                </div>
                <span className="text-xs sm:text-sm font-black text-[#3C632A] bg-white px-4 py-1 rounded-xl border border-[#3C632A]">
                  1 Ratus Ribuan (100.000) + 2 Puluh Ribuan (20.000) + 5 Ribuan (5.000) + 4 Ratusan (400)
                </span>
              </div>
            )}

            {levelId === 2 && (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-3 bg-white/95 p-4 rounded-2xl border-2 border-[#3C632A] text-xl font-black flex-wrap justify-center">
                  <span className="bg-[#FFE296] px-3 py-1 rounded-xl border border-[#3C632A]">1/2</span>
                  <span>=</span>
                  <span className="bg-[#FFE296] px-3 py-1 rounded-xl border border-[#3C632A]">2/4</span>
                  <span>=</span>
                  <span className="bg-[#7FD13B] text-white px-3 py-1 rounded-xl">0,5</span>
                  <span>=</span>
                  <span className="bg-[#C3631D] text-white px-3 py-1 rounded-xl">50%</span>
                </div>
                <span className="text-xs sm:text-sm font-black text-[#3C632A] bg-white px-4 py-1 rounded-xl border border-[#3C632A]">
                  Pecahan biasa, desimal, dan persen merepresentasikan nilai yang setara!
                </span>
              </div>
            )}

            {levelId === 3 && (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-4 bg-white/95 p-4 rounded-2xl border-2 border-[#3C632A]">
                  <div className="text-center">
                    <span className="text-xs font-black text-[#3C632A] block">Bilangan Prima &lt; 10</span>
                    <span className="text-2xl font-black text-[#C3631D]">2, 3, 5, 7</span>
                  </div>
                  <div className="h-8 w-0.5 bg-[#3C632A]/30"></div>
                  <div className="text-center">
                    <span className="text-xs font-black text-[#3C632A] block">Faktor dari 6</span>
                    <span className="text-2xl font-black text-[#7FD13B]">1, 2, 3, 6</span>
                  </div>
                </div>
              </div>
            )}

            {levelId === 4 && (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-4 bg-white/95 p-4 rounded-2xl border-2 border-[#3C632A] text-base sm:text-lg font-black">
                  <span className="text-[#C3631D]">FPB (12, 18) = 6</span>
                  <span className="text-[#3C632A]">•</span>
                  <span className="text-[#7FD13B]">KPK (4, 6) = 12</span>
                </div>
                <span className="text-xs sm:text-sm font-black text-[#3C632A] bg-white px-4 py-1 rounded-xl border border-[#3C632A]">
                  FPB mencari faktor pembagi terbesar, KPK mencari kelipatan terkecil bersama!
                </span>
              </div>
            )}

            {levelId === 5 && (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-3 bg-white/95 p-4 rounded-2xl border-2 border-[#3C632A] text-xl font-black">
                  <span className="text-[#C3631D]">48 ≈ 50</span>
                  <span className="text-[#3C632A]">dan</span>
                  <span className="text-[#3C632A]">123 ≈ 120</span>
                </div>
                <span className="text-xs sm:text-sm font-black text-[#3C632A] bg-white px-4 py-1 rounded-xl border border-[#3C632A]">
                  Angka satuan &ge; 5 dibulatkan ke atas, &lt; 5 dibulatkan ke bawah!
                </span>
              </div>
            )}

            {levelId === 6 && (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-3 bg-white/95 p-4 rounded-2xl border-2 border-[#3C632A] text-lg sm:text-xl font-black">
                  <span className="text-[#3C632A]">20 + 5 × 4 = 20 + 20 = </span>
                  <span className="bg-[#7FD13B] text-white px-3 py-1 rounded-xl">40</span>
                </div>
                <span className="text-xs sm:text-sm font-black text-[#3C632A] bg-white px-4 py-1 rounded-xl border border-[#3C632A]">
                  Aturan urutan hitung: dahulukan perkalian dan pembagian sebelum penjumlahan!
                </span>
              </div>
            )}

            {levelId === 7 && (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-3 bg-white/95 p-4 rounded-2xl border-2 border-[#3C632A] text-xl font-black">
                  <span>1/2 + 1/4</span>
                  <span>➔</span>
                  <span className="bg-[#FFE296] px-3 py-1 rounded-xl border border-[#3C632A]">2/4 + 1/4</span>
                  <span>=</span>
                  <span className="bg-[#7FD13B] text-white px-3 py-1 rounded-xl">3/4</span>
                </div>
                <span className="text-xs sm:text-sm font-black text-[#3C632A] bg-white px-4 py-1 rounded-xl border border-[#3C632A]">
                  Samakan penyebut menggunakan KPK sebelum menjumlahkan pecahan!
                </span>
              </div>
            )}

            {levelId === 8 && (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-4 bg-white/95 p-4 rounded-2xl border-2 border-[#3C632A] text-sm sm:text-base font-black flex-wrap justify-center">
                  <span className="text-[#C3631D]">Persegi: Luas = s × s</span>
                  <span className="text-[#3C632A]">•</span>
                  <span className="text-[#7FD13B]">Persegi Panjang: Luas = p × l</span>
                </div>
                <span className="text-xs sm:text-sm font-black text-[#3C632A] bg-white px-4 py-1 rounded-xl border border-[#3C632A]">
                  Gunakan rumus baku untuk menghitung luas dan keliling bangun datar!
                </span>
              </div>
            )}

            {levelId === 9 && (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-4 bg-white/95 p-4 rounded-2xl border-2 border-[#3C632A] text-sm sm:text-base font-black">
                  <div className="p-2 bg-[#FFE296] rounded-xl border border-[#3C632A] text-center">
                    <span>Garis Sejajar</span>
                    <span className="block text-xl">═</span>
                  </div>
                  <div className="p-2 bg-[#7FD13B] text-white rounded-xl border border-[#3C632A] text-center">
                    <span>Garis Berpotongan</span>
                    <span className="block text-xl">╳</span>
                  </div>
                  <div className="p-2 bg-[#C3631D] text-white rounded-xl border border-[#3C632A] text-center">
                    <span>Busur Sudut</span>
                    <span className="block text-xl">📐 (0° - 180°)</span>
                  </div>
                </div>
              </div>
            )}

            {levelId === 10 && (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-4 bg-white/95 p-4 rounded-2xl border-2 border-[#3C632A]">
                  <span className="text-base font-black text-[#3C632A]">📊 Interpretasi Data & Diagram Batang</span>
                  <span className="text-xs font-black bg-[#7FD13B] text-white px-3 py-1 rounded-xl">Analisis Taktis</span>
                </div>
                <span className="text-xs sm:text-sm font-black text-[#3C632A] bg-white px-4 py-1 rounded-xl border border-[#3C632A]">
                  Sentuh tombol di bawah untuk memulai 10 soal tantangan!
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
            Kamu berhasil menyelesaikan seluruh 10 soal analitis pada Level {levelId}!
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

// ================= DATA SILABUS MATEMATIKA KELAS 4 SD (10 LEVEL x 10 SOAL) =================
function getGrade4LevelData(levelId: number): LevelConceptData {
  switch (levelId) {
    case 1:
      return {
        title: "Bilangan Besar s.d Ratusan Ribu",
        conceptText: "Bilangan hingga ratusan ribu terdiri dari nilai tempat Ratus Ribuan, Puluh Ribuan, Ribuan, Ratusan, Puluhan, dan Satuan. Contoh: 125.400 dibaca 'Seratus dua puluh lima ribu empat ratus'.",
        questions: [
          {
            id: 1,
            question: "Lambang bilangan dari 'Dua ratus lima puluh ribu rupiah' adalah?",
            options: ["Rp250.000", "Rp205.000", "Rp25.000"],
            correctIndex: 0,
            explanation: "Dua ratus lima puluh ribu ditulis 250.000.",
          },
          {
            id: 2,
            question: "Bilangan 145.200 dibaca?",
            options: ["Seratus empat puluh lima ribu dua ratus", "Seratus empat puluh lima ribu dua puluh", "Seratus lima puluh empat ribu dua ratus"],
            correctIndex: 0,
            explanation: "145.200 dibaca seratus empat puluh lima ribu dua ratus.",
          },
          {
            id: 3,
            question: "Pada bilangan 375.420, angka 7 menempati nilai tempat?",
            options: ["Puluh Ribuan (70.000)", "Ratus Ribuan (700.000)", "Ribuan (7.000)"],
            correctIndex: 0,
            explanation: "Angka 7 bernilai 70.000 di nilai tempat puluh ribuan.",
          },
          {
            id: 4,
            question: "Nilai angka 8 pada bilangan 812.350 adalah?",
            options: ["800.000", "80.000", "8.000"],
            correctIndex: 0,
            explanation: "Angka 8 berada di posisi ratus ribuan bernilai 800.000.",
          },
          {
            id: 5,
            question: "4 ratus ribuan + 2 puluh ribuan + 5 ribuan + 3 ratusan sama dengan?",
            options: ["425.300", "420.530", "452.300"],
            correctIndex: 0,
            explanation: "400.000 + 20.000 + 5.000 + 300 = 425.300.",
          },
          {
            id: 6,
            question: "350.000 ... 349.999. Tanda perbandingan yang tepat adalah?",
            options: ["Lebih Besar (>)", "Lebih Kecil (<)", "Sama Dengan (=)"],
            correctIndex: 0,
            explanation: "350.000 lebih besar 1 angka dari 349.999.",
          },
          {
            id: 7,
            question: "Bilangan tepat setelah 199.999 adalah?",
            options: ["200.000", "199.900", "200.001"],
            correctIndex: 0,
            explanation: "199.999 ditambah 1 adalah 200.000.",
          },
          {
            id: 8,
            question: "Bentuk panjang dari 124.500 adalah?",
            options: ["100.000 + 20.000 + 4.000 + 500", "10.000 + 2.000 + 400 + 500", "100.000 + 24.000 + 50"],
            correctIndex: 0,
            explanation: "124.500 diuraikan menjadi 100.000 + 20.000 + 4.000 + 500.",
          },
          {
            id: 9,
            question: "Urutkan dari yang terkecil: 120.000, 115.000, 125.000!",
            options: ["115.000, 120.000, 125.000", "125.000, 120.000, 115.000", "120.000, 115.000, 125.000"],
            correctIndex: 0,
            explanation: "Urutan dari paling kecil adalah 115.000, lalu 120.000, dan 125.000.",
          },
          {
            id: 10,
            question: "Pada bilangan 504.210, angka 0 menempati nilai tempat?",
            options: ["Puluh Ribuan", "Ratus Ribuan", "Ribuan"],
            correctIndex: 0,
            explanation: "Angka 0 berada di posisi puluh ribuan.",
          },
        ],
      };

    case 2:
      return {
        title: "Pecahan Senilai, Desimal, & Persen",
        conceptText: "Pecahan senilai bernilai sama meski angka pembilang dan penyebutnya berbeda. Contoh: 1/2 sama dengan 2/4, sama dengan 0,5, dan sama dengan 50%.",
        questions: [
          {
            id: 1,
            question: "Pecahan yang senilai dengan 1/2 adalah?",
            options: ["2/4", "1/4", "3/4"],
            correctIndex: 0,
            explanation: "1/2 dikalikan 2/2 menghasilkan 2/4.",
          },
          {
            id: 2,
            question: "Bentuk pecahan paling sederhana dari 4/8 adalah?",
            options: ["1/2", "2/3", "1/4"],
            correctIndex: 0,
            explanation: "4 dan 8 sama-sama dibagi 4 menghasilkan 1/2.",
          },
          {
            id: 3,
            question: "Bentuk desimal dari pecahan 1/4 adalah?",
            options: ["0,25", "0,5", "0,75"],
            correctIndex: 0,
            explanation: "1 dibagi 4 sama dengan 0,25.",
          },
          {
            id: 4,
            question: "Bentuk persen (%) dari pecahan 1/2 adalah?",
            options: ["50%", "25%", "75%"],
            correctIndex: 0,
            explanation: "1/2 × 100% = 50%.",
          },
          {
            id: 5,
            question: "Bentuk persen dari pecahan 3/4 adalah?",
            options: ["75%", "50%", "30%"],
            correctIndex: 0,
            explanation: "3/4 × 100% = 75%.",
          },
          {
            id: 6,
            question: "Bentuk pecahan campuran dari 7/3 adalah?",
            options: ["2 1/3", "1 4/3", "3 1/2"],
            correctIndex: 0,
            explanation: "7 dibagi 3 adalah 2 dengan sisa 1, ditulis 2 1/3.",
          },
          {
            id: 7,
            question: "Bentuk desimal dari pecahan 3/10 adalah?",
            options: ["0,3", "0,03", "3,0"],
            correctIndex: 0,
            explanation: "3/10 = 0,3.",
          },
          {
            id: 8,
            question: "Pecahan senilai dari 2/3 jika pembilang dan penyebut dikali 3 adalah?",
            options: ["6/9", "5/6", "6/6"],
            correctIndex: 0,
            explanation: "(2×3)/(3×3) = 6/9.",
          },
          {
            id: 9,
            question: "Bentuk pecahan biasa dari pecahan campuran 1 1/2 adalah?",
            options: ["3/2", "2/3", "1/2"],
            correctIndex: 0,
            explanation: "(1×2 + 1)/2 = 3/2.",
          },
          {
            id: 10,
            question: "25% jika diubah menjadi pecahan biasa paling sederhana adalah?",
            options: ["1/4", "1/2", "2/5"],
            correctIndex: 0,
            explanation: "25/100 disederhanakan menjadi 1/4.",
          },
        ],
      };

    case 3:
      return {
        title: "Faktor, Kelipatan, & Bilangan Prima",
        conceptText: "Faktor adalah bilangan yang habis membagi suatu bilangan. Kelipatan adalah hasil perkalian bilangan. Bilangan prima adalah bilangan yang hanya memiliki 2 faktor (1 dan dirinya sendiri).",
        questions: [
          {
            id: 1,
            question: "Faktor dari bilangan 6 adalah?",
            options: ["1, 2, 3, 6", "1, 6", "2, 4, 6"],
            correctIndex: 0,
            explanation: "Bilangan 6 habis dibagi oleh 1, 2, 3, dan 6.",
          },
          {
            id: 2,
            question: "Manakah yang merupakan kelompok bilangan prima di bawah 10?",
            options: ["2, 3, 5, 7", "1, 2, 3, 5", "2, 4, 6, 8"],
            correctIndex: 0,
            explanation: "2, 3, 5, dan 7 adalah bilangan prima di bawah 10.",
          },
          {
            id: 3,
            question: "Mengapa angka 1 bukan termasuk bilangan prima?",
            options: ["Karena hanya memiliki 1 faktor", "Karena angka ganjil", "Karena terlalu kecil"],
            correctIndex: 0,
            explanation: "Syarat bilangan prima harus memiliki tepat 2 faktor berbeda.",
          },
          {
            id: 4,
            question: "Kelipatan dari bilangan 4 adalah?",
            options: ["4, 8, 12, 16, 20", "2, 4, 6, 8", "1, 2, 4"],
            correctIndex: 0,
            explanation: "4, 8, 12, 16, 20 adalah hasil kali bilangan 4.",
          },
          {
            id: 5,
            question: "Manakah bilangan berikut yang BUKAN bilangan prima?",
            options: ["9 (habis dibagi 3)", "7", "5"],
            correctIndex: 0,
            explanation: "9 bukan prima karena memiliki 3 faktor (1, 3, 9).",
          },
          {
            id: 6,
            question: "Bilangan prima genap satu-satunya di dunia adalah angka?",
            options: ["2", "4", "0"],
            correctIndex: 0,
            explanation: "Angka 2 adalah satu-satunya bilangan prima yang genap.",
          },
          {
            id: 7,
            question: "Semua faktor dari bilangan 12 adalah?",
            options: ["1, 2, 3, 4, 6, 12", "1, 2, 6, 12", "2, 4, 6, 12"],
            correctIndex: 0,
            explanation: "12 habis dibagi 1, 2, 3, 4, 6, dan 12.",
          },
          {
            id: 8,
            question: "Tiga bilangan kelipatan pertama dari 5 adalah?",
            options: ["5, 10, 15", "1, 5, 10", "10, 15, 20"],
            correctIndex: 0,
            explanation: "5, 10, 15 adalah kelipatan awal dari 5.",
          },
          {
            id: 9,
            question: "Apakah angka 13 merupakan bilangan prima?",
            options: ["Ya, hanya habis dibagi 1 dan 13", "Tidak, bukan prima", "Hanya angka ganjil biasa"],
            correctIndex: 0,
            explanation: "13 adalah bilangan prima.",
          },
          {
            id: 10,
            question: "Kelompok bilangan prima di antara 10 dan 20 adalah?",
            options: ["11, 13, 17, 19", "11, 15, 17, 19", "13, 15, 17"],
            correctIndex: 0,
            explanation: "15 bukan prima (habis dibagi 3 dan 5).",
          },
        ],
      };

    case 4:
      return {
        title: "Penentuan FPB dan KPK",
        conceptText: "FPB (Faktor Persekutuan Terbesar) adalah faktor persekutuan bernilai paling besar. KPK (Kelipatan Persekutuan Terkecil) adalah kelipatan persekutuan terkecil yang sama.",
        questions: [
          {
            id: 1,
            question: "FPB dari bilangan 6 dan 8 adalah?",
            options: ["2", "4", "6"],
            correctIndex: 0,
            explanation: "Faktor 6 = 1,2,3,6. Faktor 8 = 1,2,4,8. FPB = 2.",
          },
          {
            id: 2,
            question: "KPK dari bilangan 4 dan 6 adalah?",
            options: ["12", "24", "8"],
            correctIndex: 0,
            explanation: "Kelipatan 4 = 4,8,12... Kelipatan 6 = 6,12... KPK = 12.",
          },
          {
            id: 3,
            question: "FPB dari 12 dan 18 adalah?",
            options: ["6", "3", "12"],
            correctIndex: 0,
            explanation: "Faktor persekutuan terbesar dari 12 dan 18 adalah 6.",
          },
          {
            id: 4,
            question: "KPK dari 3 dan 5 adalah?",
            options: ["15", "10", "30"],
            correctIndex: 0,
            explanation: "Karena 3 dan 5 prima, KPK = 3 × 5 = 15.",
          },
          {
            id: 5,
            question: "Lampu A menyala tiap 4 detik, Lampu B tiap 6 detik. Tiap berapa detik keduanya menyala bersama?",
            options: ["12 detik (KPK)", "24 detik", "10 detik"],
            correctIndex: 0,
            explanation: "KPK dari 4 dan 6 adalah 12 detik.",
          },
          {
            id: 6,
            question: "Ibu membagi 12 kue dan 16 permen ke kantong sama banyak. Kantong terbanyak yang dibutuhkan adalah?",
            options: ["4 kantong (FPB)", "6 kantong", "8 kantong"],
            correctIndex: 0,
            explanation: "FPB dari 12 dan 16 adalah 4.",
          },
          {
            id: 7,
            question: "FPB dari 10 dan 20 adalah?",
            options: ["10", "5", "20"],
            correctIndex: 0,
            explanation: "10 habis membagi 20, jadi FPB = 10.",
          },
          {
            id: 8,
            question: "KPK dari 6 dan 8 adalah?",
            options: ["24", "48", "16"],
            correctIndex: 0,
            explanation: "Kelipatan persekutuan terkecil dari 6 dan 8 adalah 24.",
          },
          {
            id: 9,
            question: "FPB dari dua bilangan prima 3 dan 7 adalah?",
            options: ["1", "3", "7"],
            correctIndex: 0,
            explanation: "Dua bilangan prima saling asing hanya memiliki faktor bersama 1.",
          },
          {
            id: 10,
            question: "KPK dari bilangan 2, 3, dan 4 adalah?",
            options: ["12", "24", "6"],
            correctIndex: 0,
            explanation: "KPK dari 2, 3, 4 adalah 12.",
          },
        ],
      };

    case 5:
      return {
        title: "Pembulatan & Penaksiran Hasil Hitung",
        conceptText: "Pembulatan mempermudah penaksiran hasil hitung cepat. Jika angka satuan/puluhan kurang dari 5 dibulatkan ke bawah; jika 5 atau lebih dibulatkan ke atas.",
        questions: [
          {
            id: 1,
            question: "Pembulatan bilangan 47 ke puluhan terdekat adalah?",
            options: ["50", "40", "45"],
            correctIndex: 0,
            explanation: "Satuan 7 >= 5, dibulatkan naik menjadi 50.",
          },
          {
            id: 2,
            question: "Pembulatan bilangan 123 ke puluhan terdekat adalah?",
            options: ["120", "130", "100"],
            correctIndex: 0,
            explanation: "Satuan 3 < 5, dibulatkan turun menjadi 120.",
          },
          {
            id: 3,
            question: "Pembulatan bilangan 368 ke ratusan terdekat adalah?",
            options: ["400", "300", "370"],
            correctIndex: 0,
            explanation: "Puluhan 6 >= 5, dibulatkan naik ke 400.",
          },
          {
            id: 4,
            question: "Pembulatan bilangan 249 ke ratusan terdekat adalah?",
            options: ["200", "300", "250"],
            correctIndex: 0,
            explanation: "Puluhan 4 < 5, dibulatkan turun ke 200.",
          },
          {
            id: 5,
            question: "Taksiran hasil dari 48 + 31 ke puluhan terdekat adalah?",
            options: ["80 (50 + 30)", "70", "90"],
            correctIndex: 0,
            explanation: "48 dibulatkan jadi 50, 31 jadi 30. 50 + 30 = 80.",
          },
          {
            id: 6,
            question: "Taksiran hasil kali 19 × 28 ke puluhan terdekat adalah?",
            options: ["600 (20 × 30)", "500", "400"],
            correctIndex: 0,
            explanation: "20 × 30 = 600.",
          },
          {
            id: 7,
            question: "Pembulatan bilangan 1.780 ke ribuan terdekat adalah?",
            options: ["2.000", "1.000", "1.800"],
            correctIndex: 0,
            explanation: "Ratusan 7 >= 5, dibulatkan ke 2.000.",
          },
          {
            id: 8,
            question: "Pembulatan bilangan 4.250 ke ribuan terdekat adalah?",
            options: ["4.000", "5.000", "4.300"],
            correctIndex: 0,
            explanation: "Ratusan 2 < 5, dibulatkan turun ke 4.000.",
          },
          {
            id: 9,
            question: "Taksiran hasil pengurangan 89 - 42 ke puluhan terdekat adalah?",
            options: ["50 (90 - 40)", "40", "60"],
            correctIndex: 0,
            explanation: "90 - 40 = 50.",
          },
          {
            id: 10,
            question: "Angka 75 jika dibulatkan ke puluhan terdekat menjadi?",
            options: ["80", "70", "75"],
            correctIndex: 0,
            explanation: "Angka 5 dibulatkan ke atas menjadi 80.",
          },
        ],
      };

    case 6:
      return {
        title: "Operasi Hitung Campuran",
        conceptText: "Hierarki aturan operasi hitung: 1. Operasi di dalam tanda kurung; 2. Perkalian dan Pembagian; 3. Penjumlahan dan Pengurangan (dihitung urut dari kiri).",
        questions: [
          {
            id: 1,
            question: "20 + 5 × 4 = ...",
            options: ["40", "100", "45"],
            correctIndex: 0,
            explanation: "Dahulukan perkalian: 5 × 4 = 20, lalu 20 + 20 = 40.",
          },
          {
            id: 2,
            question: "(15 + 5) × 2 = ...",
            options: ["40", "25", "30"],
            correctIndex: 0,
            explanation: "Dahulukan tanda kurung: 15 + 5 = 20, lalu 20 × 2 = 40.",
          },
          {
            id: 3,
            question: "50 - 20 : 5 = ...",
            options: ["46", "6", "54"],
            correctIndex: 0,
            explanation: "Dahulukan pembagian: 20 : 5 = 4, lalu 50 - 4 = 46.",
          },
          {
            id: 4,
            question: "10 × 4 : 2 = ...",
            options: ["20", "40", "10"],
            correctIndex: 0,
            explanation: "Kali dan bagi setara, hitung dari kiri: 10 × 4 = 40, 40 : 2 = 20.",
          },
          {
            id: 5,
            question: "30 + 10 - 15 = ...",
            options: ["25", "35", "20"],
            correctIndex: 0,
            explanation: "Hitung dari kiri: 30 + 10 = 40, 40 - 15 = 25.",
          },
          {
            id: 6,
            question: "100 - (25 × 2) = ...",
            options: ["50", "150", "75"],
            correctIndex: 0,
            explanation: "Dalam kurung: 25 × 2 = 50, lalu 100 - 50 = 50.",
          },
          {
            id: 7,
            question: "12 + 18 : 3 × 2 = ...",
            options: ["24", "20", "15"],
            correctIndex: 0,
            explanation: "18 : 3 = 6, 6 × 2 = 12, lalu 12 + 12 = 24.",
          },
          {
            id: 8,
            question: "8 × (10 - 5) = ...",
            options: ["40", "75", "35"],
            correctIndex: 0,
            explanation: "Dalam kurung: 10 - 5 = 5, lalu 8 × 5 = 40.",
          },
          {
            id: 9,
            question: "45 : 9 + 7 = ...",
            options: ["12", "15", "9"],
            correctIndex: 0,
            explanation: "45 : 9 = 5, lalu 5 + 7 = 12.",
          },
          {
            id: 10,
            question: "(30 - 10) : (2 + 3) = ...",
            options: ["4", "5", "6"],
            correctIndex: 0,
            explanation: "20 : 5 = 4.",
          },
        ],
      };

    case 7:
      return {
        title: "Pecahan Berpenyebut Berbeda",
        conceptText: "Untuk menjumlahkan atau mengurangkan pecahan dengan penyebut berbeda, carilah KPK dari penyebut-penyebutnya terlebih dahulu untuk menyamakannya.",
        questions: [
          {
            id: 1,
            question: "1/2 + 1/4 = ...",
            options: ["3/4", "2/6", "1/6"],
            correctIndex: 0,
            explanation: "KPK penyebut adalah 4: 2/4 + 1/4 = 3/4.",
          },
          {
            id: 2,
            question: "1/3 + 1/6 = ...",
            options: ["3/6 (1/2)", "2/9", "1/9"],
            correctIndex: 0,
            explanation: "KPK 6: 2/6 + 1/6 = 3/6 atau 1/2.",
          },
          {
            id: 3,
            question: "3/4 - 1/2 = ...",
            options: ["1/4", "2/2", "2/4"],
            correctIndex: 0,
            explanation: "3/4 - 2/4 = 1/4.",
          },
          {
            id: 4,
            question: "2/5 + 1/10 = ...",
            options: ["5/10 (1/2)", "3/15", "3/10"],
            correctIndex: 0,
            explanation: "4/10 + 1/10 = 5/10 = 1/2.",
          },
          {
            id: 5,
            question: "Langkah pertama menjumlahkan pecahan yang penyebutnya berbeda adalah?",
            options: ["Menyamakan penyebutnya menggunakan KPK", "Menjumlahkan pembilangnya langsung", "Mengalikan penyebutnya"],
            correctIndex: 0,
            explanation: "Wajib menyamakan penyebut terlebih dahulu.",
          },
          {
            id: 6,
            question: "2/3 - 1/6 = ...",
            options: ["3/6 (1/2)", "1/3", "1/6"],
            correctIndex: 0,
            explanation: "4/6 - 1/6 = 3/6 = 1/2.",
          },
          {
            id: 7,
            question: "1/4 + 2/3 = ...",
            options: ["11/12", "3/7", "3/12"],
            correctIndex: 0,
            explanation: "KPK 12: 3/12 + 8/12 = 11/12.",
          },
          {
            id: 8,
            question: "5/6 - 1/2 = ...",
            options: ["2/6 (1/3)", "4/4", "3/6"],
            correctIndex: 0,
            explanation: "5/6 - 3/6 = 2/6 = 1/3.",
          },
          {
            id: 9,
            question: "1/2 + 1/3 = ...",
            options: ["5/6", "2/5", "1/5"],
            correctIndex: 0,
            explanation: "KPK 6: 3/6 + 2/6 = 5/6.",
          },
          {
            id: 10,
            question: "4/5 - 3/10 = ...",
            options: ["5/10 (1/2)", "1/5", "7/10"],
            correctIndex: 0,
            explanation: "8/10 - 3/10 = 5/10 = 1/2.",
          },
        ],
      };

    case 8:
      return {
        title: "Keliling & Luas Rumus Baku",
        conceptText: "Rumus baku bangun datar: Persegi (K = 4 × s, L = s × s); Persegi Panjang (K = 2 × (p + l), L = p × l); Segitiga (L = 1/2 × a × t).",
        questions: [
          {
            id: 1,
            question: "Rumus luas persegi dengan panjang sisi s adalah?",
            options: ["s × s", "4 × s", "2 × s"],
            correctIndex: 0,
            explanation: "Luas persegi = sisi × sisi.",
          },
          {
            id: 2,
            question: "Sebuah persegi memiliki sisi 6 cm. Berapa luas persegi tersebut?",
            options: ["36 cm²", "24 cm²", "12 cm²"],
            correctIndex: 0,
            explanation: "6 × 6 = 36 cm².",
          },
          {
            id: 3,
            question: "Persegi panjang memiliki panjang 8 cm dan lebar 5 cm. Berapa luasnya?",
            options: ["40 cm²", "26 cm²", "13 cm²"],
            correctIndex: 0,
            explanation: "Luas = p × l = 8 × 5 = 40 cm².",
          },
          {
            id: 4,
            question: "Keliling persegi panjang dengan panjang 10 cm dan lebar 4 cm adalah?",
            options: ["28 cm", "40 cm", "14 cm"],
            correctIndex: 0,
            explanation: "Keliling = 2 × (10 + 4) = 28 cm.",
          },
          {
            id: 5,
            question: "Rumus luas segitiga dengan alas a dan tinggi t adalah?",
            options: ["1/2 × a × t", "a × t", "a + t"],
            correctIndex: 0,
            explanation: "Luas segitiga = 1/2 × alas × tinggi.",
          },
          {
            id: 6,
            question: "Segitiga memiliki alas 10 cm dan tinggi 6 cm. Luas segitiga tersebut adalah?",
            options: ["30 cm²", "60 cm²", "16 cm²"],
            correctIndex: 0,
            explanation: "1/2 × 10 × 6 = 30 cm².",
          },
          {
            id: 7,
            question: "Keliling persegi yang memiliki sisi 8 cm adalah?",
            options: ["32 cm", "64 cm", "16 cm"],
            correctIndex: 0,
            explanation: "Keliling = 4 × 8 = 32 cm.",
          },
          {
            id: 8,
            question: "Sebuah persegi memiliki luas 25 cm². Berapa panjang sisinya?",
            options: ["5 cm", "10 cm", "12,5 cm"],
            correctIndex: 0,
            explanation: "Akar kuadrat dari 25 adalah 5 cm.",
          },
          {
            id: 9,
            question: "Satuan baku untuk menyatakan ukuran luas adalah?",
            options: ["Satuan persegi (cm² atau m²)", "Satuan panjang (cm atau m)", "Gram"],
            correctIndex: 0,
            explanation: "Luas selalu menggunakan satuan persegi.",
          },
          {
            id: 10,
            question: "Sebuah persegi panjang memiliki luas 50 cm² dan panjang 10 cm. Berapa lebarnya?",
            options: ["5 cm", "40 cm", "25 cm"],
            correctIndex: 0,
            explanation: "Lebar = Luas : panjang = 50 : 10 = 5 cm.",
          },
        ],
      };

    case 9:
      return {
        title: "Garis & Sudut Busur Derajat",
        conceptText: "Hubungan antargaris: Garis sejajar tidak pernah berpotongan; garis berpotongan bertemu di 1 titik; garis berimpit saling menutupi. Alat ukur sudut: Busur derajat (°).",
        questions: [
          {
            id: 1,
            question: "Dua garis yang memiliki arah sama dan tidak akan pernah bertemu disebut garis?",
            options: ["Sejajar", "Berpotongan", "Berimpit"],
            correctIndex: 0,
            explanation: "Garis sejajar berjarak konstan dan tidak pernah bertemu.",
          },
          {
            id: 2,
            question: "Dua garis yang saling bertemu dan memotong di satu titik dinamakan garis?",
            options: ["Berpotongan", "Sejajar", "Lurus"],
            correctIndex: 0,
            explanation: "Garis yang bertemu di satu titik adalah garis berpotongan.",
          },
          {
            id: 3,
            question: "Rel kereta api merupakan contoh nyata dua garis yang saling?",
            options: ["Sejajar", "Berpotongan", "Tegak lurus"],
            correctIndex: 0,
            explanation: "Kedua rel kereta api selalu sejajar.",
          },
          {
            id: 4,
            question: "Alat baku yang digunakan untuk mengukur besar sudut dinamakan?",
            options: ["Busur Derajat", "Penggaris Lurus", "Jangka"],
            correctIndex: 0,
            explanation: "Busur derajat digunakan untuk mengukur besar sudut dalam derajat.",
          },
          {
            id: 5,
            question: "Besar sudut siku-siku adalah tepat?",
            options: ["90°", "180°", "45°"],
            correctIndex: 0,
            explanation: "Sudut siku-siku besarnya tepat 90 derajat.",
          },
          {
            id: 6,
            question: "Besar sudut satu putaran penuh lingkaran adalah?",
            options: ["360°", "180°", "90°"],
            correctIndex: 0,
            explanation: "Satu putaran penuh = 360°.",
          },
          {
            id: 7,
            question: "Dua garis yang berpotongan dan membentuk sudut 90° dinamakan garis?",
            options: ["Berpotongan Tegak Lurus", "Berimpit", "Sejajar Miring"],
            correctIndex: 0,
            explanation: "Membentuk sudut 90° berarti tegak lurus.",
          },
          {
            id: 8,
            question: "Besar sudut lurus (setengah putaran) adalah?",
            options: ["180°", "90°", "360°"],
            correctIndex: 0,
            explanation: "Sudut lurus besarnya 180°.",
          },
          {
            id: 9,
            question: "Sudut yang besarnya antara 0° dan 90° dinamakan sudut?",
            options: ["Lancip", "Tumpul", "Refleks"],
            correctIndex: 0,
            explanation: "Sudut kurang dari 90° adalah sudut lancip.",
          },
          {
            id: 10,
            question: "Dua garis yang terletak pada satu lintasan dan saling menutupi dinamakan?",
            options: ["Berimpit", "Sejajar", "Berpotongan"],
            correctIndex: 0,
            explanation: "Garis berimpit menempel tepat pada satu lintasan garis yang sama.",
          },
        ],
      };

    case 10:
    default:
      return {
        title: "Diagram Batang & Interpretasi Tabel",
        conceptText: "Interpretasi data melibatkan membaca nilai tertinggi, nilai terendah, selisih, dan tren kenaikan/penurunan data dari tabel dan diagram batang.",
        questions: [
          {
            id: 1,
            question: "Data nilai matematika: Nilai 70 (4 anak), Nilai 80 (10 anak), Nilai 90 (6 anak). Nilai yang paling banyak diperoleh siswa adalah?",
            options: ["Nilai 80 (10 anak)", "Nilai 90 (6 anak)", "Nilai 70 (4 anak)"],
            correctIndex: 0,
            explanation: "Nilai 80 memiliki frekuensi terbanyak yaitu 10 anak.",
          },
          {
            id: 2,
            question: "Dari data nilai di atas (4 anak 70, 10 anak 80, 6 anak 90), berapa total seluruh siswa?",
            options: ["20 siswa", "18 siswa", "24 siswa"],
            correctIndex: 0,
            explanation: "4 + 10 + 6 = 20 siswa.",
          },
          {
            id: 3,
            question: "Berapa selisih siswa yang mendapat nilai 80 (10 anak) dan nilai 70 (4 anak)?",
            options: ["6 anak", "4 anak", "8 anak"],
            correctIndex: 0,
            explanation: "10 - 4 = 6 anak.",
          },
          {
            id: 4,
            question: "Data produksi beras: Januari = 40 ton, Februari = 60 ton, Maret = 50 ton. Bulan apa produksi beras tertinggi?",
            options: ["Februari (60 ton)", "Maret (50 ton)", "Januari (40 ton)"],
            correctIndex: 0,
            explanation: "Bulan Februari mencatat produksi tertinggi yaitu 60 ton.",
          },
          {
            id: 5,
            question: "Berapa total produksi beras selama 3 bulan tersebut (40 ton, 60 ton, 50 ton)?",
            options: ["150 ton", "140 ton", "160 ton"],
            correctIndex: 0,
            explanation: "40 + 60 + 50 = 150 ton.",
          },
          {
            id: 6,
            question: "Berapa kenaikan produksi beras dari bulan Januari (40 ton) ke Februari (60 ton)?",
            options: ["20 ton", "10 ton", "30 ton"],
            correctIndex: 0,
            explanation: "60 - 40 = 20 ton kenaikan.",
          },
          {
            id: 7,
            question: "Pengunjung perpustakaan: Senin = 25, Selasa = 30, Rabu = 20, Kamis = 35. Hari apa pengunjung paling sepi?",
            options: ["Rabu (20)", "Senin (25)", "Selasa (30)"],
            correctIndex: 0,
            explanation: "Hari Rabu pengunjung paling sedikit yaitu 20 orang.",
          },
          {
            id: 8,
            question: "Berapa selisih pengunjung teramai (Kamis = 35) dan paling sepi (Rabu = 20)?",
            options: ["15 orang", "10 orang", "20 orang"],
            correctIndex: 0,
            explanation: "35 - 20 = 15 orang.",
          },
          {
            id: 9,
            question: "Bagian pada diagram batang yang menunjukkan kategori data (nama kelompok) disebut?",
            options: ["Sumbu mendatar (horizontal)", "Sumbu tegak (vertikal)", "Judul legenda"],
            correctIndex: 0,
            explanation: "Kategori diletakkan di sumbu mendatar.",
          },
          {
            id: 10,
            question: "Mengapa penyajian data dalam bentuk diagram batang sangat bermanfaat?",
            options: ["Memudahkan melihat perbandingan data secara visual", "Menghemat kertas", "Membuat data lebih rumit"],
            correctIndex: 0,
            explanation: "Diagram batang memudahkan perbandingan kuantitas data sekilas.",
          },
        ],
      };
  }
}
