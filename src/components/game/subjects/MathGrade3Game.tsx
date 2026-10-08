"use client";

import React, { useState, useEffect } from "react";
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

interface MathGrade3GameProps {
  levelId: number;
  onLevelComplete: (levelId: number, starsEarned: number) => void;
  accessibilityMode?: string;
}

export function MathGrade3Game({ levelId, onLevelComplete, accessibilityMode }: MathGrade3GameProps) {
  const [phase, setPhase] = useState<"materi" | "game">("materi");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState<boolean>(false);
  const [wrongAttempts, setWrongAttempts] = useState<number>(0);
  const [showClue, setShowClue] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [questionsList, setQuestionsList] = useState<QuestionItem[]>([]);

  // Sandbox demo states for Phase 1
  const [materiDemoStep, setMateriDemoStep] = useState<number>(0);

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
    setMateriDemoStep(0);

    const data = getGrade3LevelData(levelId);
    setQuestionsList(shuffleQuestions(data));
    speakGlobal(data.conceptText);
  }, [levelId]);

  const levelData = getGrade3LevelData(levelId);
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
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setWrongAttempts(0);
    setShowClue(false);
    setQuestionsList(shuffleQuestions(levelData));
  };

  const handleSelectAnswer = (optionIdx: number) => {
    if (isAnswerChecked || isCompleted) return;
    playPopSound();
    setSelectedOption(optionIdx);

    const isCorrect = optionIdx === currentQ.correctIndex;
    setIsAnswerChecked(true);

    if (isCorrect) {
      playSuccessFanfare();
      setScore((prev) => prev + 1);
      speakGlobal("Hebat! Jawabanmu benar! " + currentQ.explanation);

      setTimeout(() => {
        if (currentQuestionIndex + 1 < levelData.questions.length) {
          setCurrentQuestionIndex((prev) => prev + 1);
          setSelectedOption(null);
          setIsAnswerChecked(false);
          setWrongAttempts(0);
          setShowClue(false);
        } else {
          setIsCompleted(true);
          const finalScore = score + 1;
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
      }, 1200);
    }
  };

  const handleFinishLevel = () => {
    playSuccessFanfare();
    const finalScore = score;
    const stars = finalScore >= 9 ? 3 : finalScore >= 7 ? 2 : 1;
    onLevelComplete(levelId, stars);
  };

  return (
    <div className="w-full flex flex-col items-center justify-between min-h-[560px] p-4 md:p-8 bg-[#FFE296] rounded-[32px] border-4 border-[#3C632A] text-[#3C632A] shadow-[8px_8px_0px_0px_#3C632A] relative overflow-hidden">
      
      {/* HEADER INFO LEVEL */}
      <div className="w-full flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="px-4 py-1.5 bg-[#7FD13B] text-white font-black text-xs md:text-sm rounded-xl border-2 border-[#3C632A]">
            KELAS 3 SD • LEVEL {levelId} dari 10
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

          {/* Interactive Preview Demo per Level */}
          <div className="my-4 p-4 bg-[#FFDF59] border-4 border-[#3C632A] rounded-2xl w-full flex items-center justify-center gap-3">
            {levelId === 1 && (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-3 bg-white/95 p-4 rounded-2xl border-2 border-[#3C632A]">
                  <span className="text-4xl font-black text-[#C3631D]">2.450</span>
                  <span className="text-2xl font-black text-[#3C632A]">➔</span>
                  <span className="text-lg font-black text-[#3C632A]">Dua ribu empat ratus lima puluh</span>
                </div>
                <span className="text-xs sm:text-sm font-black text-[#3C632A] bg-white px-4 py-1 rounded-xl border border-[#3C632A]">
                  2 = Ribuan (2.000), 4 = Ratusan (400), 5 = Puluhan (50), 0 = Satuan
                </span>
              </div>
            )}

            {levelId === 2 && (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-2 flex-wrap justify-center bg-white/95 p-4 rounded-2xl border-2 border-[#3C632A]">
                  <span className="text-2xl font-black text-[#C3631D] px-3 py-1 bg-[#FFE296] rounded-xl border border-[#3C632A]">5.824</span>
                  <span className="text-xl font-black text-[#3C632A]">=</span>
                  <span className="text-sm font-black bg-[#7FD13B] text-white px-3 py-1 rounded-xl">5.000 (Ribuan)</span>
                  <span className="text-sm font-black bg-[#C3631D] text-white px-3 py-1 rounded-xl">800 (Ratusan)</span>
                  <span className="text-sm font-black bg-[#FFDF59] text-[#3C632A] px-3 py-1 rounded-xl border border-[#3C632A]">20 (Puluhan)</span>
                  <span className="text-sm font-black bg-white text-[#3C632A] px-3 py-1 rounded-xl border border-[#3C632A]">4 (Satuan)</span>
                </div>
                <span className="text-xs sm:text-sm font-black text-[#3C632A] bg-white px-4 py-1 rounded-xl border border-[#3C632A]">
                  Nilai angka paling depan adalah ribuan!
                </span>
              </div>
            )}

            {levelId === 3 && (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-3 bg-white/95 p-4 rounded-2xl border-2 border-[#3C632A] text-lg sm:text-xl font-black">
                  <span className="text-[#3C632A]">1.200 + 1.300 = 2.500</span>
                  <span className="text-[#C3631D]">dan</span>
                  <span className="text-[#3C632A]">4.000 - 1.500 = 2.500</span>
                </div>
                <span className="text-xs sm:text-sm font-black text-[#3C632A] bg-white px-4 py-1 rounded-xl border border-[#3C632A]">
                  Hitung bersusun mulai dari satuan paling belakang hingga ribuan!
                </span>
              </div>
            )}

            {levelId === 4 && (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-3 bg-white/95 p-4 rounded-2xl border-2 border-[#3C632A] text-xl font-black">
                  <span className="text-[#C3631D]">24 × 2</span>
                  <span>=</span>
                  <span className="bg-[#FFE296] px-3 py-1 rounded-xl border border-[#3C632A]">(20 × 2) + (4 × 2) = 40 + 8</span>
                  <span>=</span>
                  <span className="bg-[#7FD13B] text-white px-3 py-1 rounded-xl">48</span>
                </div>
                <span className="text-xs sm:text-sm font-black text-[#3C632A] bg-white px-4 py-1 rounded-xl border border-[#3C632A]">
                  Perkalian puluhan bersusun mengalikan satuan lalu puluhannya!
                </span>
              </div>
            )}

            {levelId === 5 && (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-3 bg-white/95 p-4 rounded-2xl border-2 border-[#3C632A] text-xl font-black">
                  <span className="text-[#C3631D]">60 : 3</span>
                  <span>=</span>
                  <span className="bg-[#7FD13B] text-white px-4 py-1.5 rounded-xl border border-[#3C632A]">20</span>
                </div>
                <span className="text-xs sm:text-sm font-black text-[#3C632A] bg-white px-4 py-1 rounded-xl border border-[#3C632A]">
                  Karena 20 × 3 = 60, maka 60 dibagi 3 hasilnya adalah 20!
                </span>
              </div>
            )}

            {levelId === 6 && (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-3 bg-white/95 p-4 rounded-2xl border-2 border-[#3C632A] text-2xl font-black">
                  <span className="bg-[#FFE296] px-3 py-1 rounded-xl border border-[#3C632A]">1/4</span>
                  <span className="text-[#C3631D]">+</span>
                  <span className="bg-[#FFE296] px-3 py-1 rounded-xl border border-[#3C632A]">2/4</span>
                  <span className="text-[#C3631D]">=</span>
                  <span className="bg-[#7FD13B] text-white px-3 py-1 rounded-xl">3/4</span>
                </div>
                <span className="text-xs sm:text-sm font-black text-[#3C632A] bg-white px-4 py-1 rounded-xl border border-[#3C632A]">
                  Penyebut sama tetap 4, jumlahkan pembilangnya: 1 + 2 = 3!
                </span>
              </div>
            )}

            {levelId === 7 && (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-4 bg-white/95 p-4 rounded-2xl border-2 border-[#3C632A] text-sm sm:text-base font-black flex-wrap justify-center">
                  <span className="text-[#C3631D]">1 km = 1.000 m</span>
                  <span className="text-[#3C632A]">•</span>
                  <span className="text-[#C3631D]">1 Jam = 60 Menit</span>
                  <span className="text-[#3C632A]">•</span>
                  <span className="text-[#C3631D]">1 kg = 10 Ons</span>
                </div>
                <span className="text-xs sm:text-sm font-black text-[#3C632A] bg-white px-4 py-1 rounded-xl border border-[#3C632A]">
                  Konversi satuan baku waktu, panjang, dan berat memudahkan pengukuran!
                </span>
              </div>
            )}

            {levelId === 8 && (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-4 bg-white/95 p-4 rounded-2xl border-2 border-[#3C632A] text-center">
                  <div className="p-2 bg-[#FFE296] rounded-xl border border-[#3C632A]">
                    <span className="text-xs font-black block">Sudut Lancip</span>
                    <span className="text-xl">📐 &lt; 90°</span>
                  </div>
                  <div className="p-2 bg-[#7FD13B] text-white rounded-xl border border-[#3C632A]">
                    <span className="text-xs font-black block">Sudut Siku-Siku</span>
                    <span className="text-xl">⯾ = 90°</span>
                  </div>
                  <div className="p-2 bg-[#C3631D] text-white rounded-xl border border-[#3C632A]">
                    <span className="text-xs font-black block">Sudut Tumpul</span>
                    <span className="text-xl">📐 &gt; 90°</span>
                  </div>
                </div>
              </div>
            )}

            {levelId === 9 && (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-4 bg-white/95 p-4 rounded-2xl border-2 border-[#3C632A]">
                  <div className="text-center">
                    <span className="text-xs font-black text-[#3C632A] block">Persegi (Sisi 5 cm)</span>
                    <span className="text-lg font-black text-[#C3631D]">Keliling = 4 × 5 = 20 cm</span>
                  </div>
                </div>
                <span className="text-xs sm:text-sm font-black text-[#3C632A] bg-white px-4 py-1 rounded-xl border border-[#3C632A]">
                  Keliling adalah jumlah panjang seluruh sisi tepi bangun datar!
                </span>
              </div>
            )}

            {levelId === 10 && (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-4 bg-white/95 p-4 rounded-2xl border-2 border-[#3C632A]">
                  <span className="text-base font-black text-[#3C632A]">📊 Diagram Batang & Tabel Data</span>
                  <span className="text-xs font-black bg-[#7FD13B] text-white px-3 py-1 rounded-xl">10 Soal Master</span>
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
            Kamu berhasil menyelesaikan seluruh 10 soal pada Level {levelId}!
          </p>

          <div className="flex items-center gap-2 text-4xl mb-6">
            <span className={score >= 1 ? "opacity-100" : "opacity-30"}>⭐</span>
            <span className={score >= 7 ? "opacity-100" : "opacity-30"}>⭐</span>
            <span className={score >= 9 ? "opacity-100" : "opacity-30"}>⭐</span>
          </div>

          <div className="bg-[#FFDF59] border-2 border-[#3C632A] px-6 py-3 rounded-2xl font-black text-xl text-[#3C632A] mb-6">
            Skor Akhir: {score} dari 10 Soal Benar
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

// ================= DATA SILABUS MATEMATIKA KELAS 3 SD (10 LEVEL x 10 SOAL) =================
function getGrade3LevelData(levelId: number): LevelConceptData {
  switch (levelId) {
    case 1:
      return {
        title: "Membaca Bilangan s.d 10.000",
        conceptText: "Bilangan 4 angka memiliki nilai tempat Ribuan, Ratusan, Puluhan, dan Satuan. Misalnya 2.450 dibaca 'Dua ribu empat ratus lima puluh'.",
        questions: [
          {
            id: 1,
            question: "Lambang bilangan dari 'Tiga ribu dua ratus lima puluh' adalah?",
            options: ["3.250", "3.205", "3.520"],
            correctIndex: 0,
            explanation: "3.250 adalah lambang bilangan tiga ribu dua ratus lima puluh.",
          },
          {
            id: 2,
            question: "Bilangan 4.608 dibaca?",
            options: ["Empat ribu enam ratus delapan", "Empat ribu enam puluh delapan", "Empat ratus enam puluh delapan"],
            correctIndex: 0,
            explanation: "4.608 dibaca empat ribu enam ratus delapan.",
          },
          {
            id: 3,
            question: "Lambang bilangan dari 'Tujuh ribu lima belas' adalah?",
            options: ["7.015", "7.150", "7.105"],
            correctIndex: 0,
            explanation: "Ratusannya nol, jadi ditulis 7.015.",
          },
          {
            id: 4,
            question: "Angka 8.920 dibaca?",
            options: ["Delapan ribu sembilan ratus dua puluh", "Delapan ribu sembilan ratus dua", "Delapan puluh sembilan dua puluh"],
            correctIndex: 0,
            explanation: "8.920 dibaca delapan ribu sembilan ratus dua puluh.",
          },
          {
            id: 5,
            question: "Bilangan tepat sebelum 5.000 adalah?",
            options: ["4.999", "4.990", "5.001"],
            correctIndex: 0,
            explanation: "5.000 dikurang 1 adalah 4.999.",
          },
          {
            id: 6,
            question: "Bilangan tepat setelah 6.899 adalah?",
            options: ["6.900", "6.890", "7.000"],
            correctIndex: 0,
            explanation: "6.899 ditambah 1 sama dengan 6.900.",
          },
          {
            id: 7,
            question: "Lambang bilangan 'Sembilan ribu sembilan ratus sembilan puluh sembilan' adalah?",
            options: ["9.999", "9.909", "9.099"],
            correctIndex: 0,
            explanation: "Ditulis dengan empat angka 9, yaitu 9.999.",
          },
          {
            id: 8,
            question: "Bilangan 10.000 dibaca?",
            options: ["Sepuluh ribu", "Satu juta", "Seratus ribu"],
            correctIndex: 0,
            explanation: "10.000 dibaca sepuluh ribu.",
          },
          {
            id: 9,
            question: "Angka 2.005 dibaca?",
            options: ["Dua ribu lima", "Dua ribu lima puluh", "Dua ratus lima"],
            correctIndex: 0,
            explanation: "2.005 dibaca dua ribu lima.",
          },
          {
            id: 10,
            question: "1.000 jika ditambah 2.000 menghasilkan?",
            options: ["3.000", "2.100", "30.000"],
            correctIndex: 0,
            explanation: "1.000 + 2.000 = 3.000.",
          },
        ],
      };

    case 2:
      return {
        title: "Nilai Tempat Ribuan & Membandingkan",
        conceptText: "Nilai tempat ribuan: Ribuan bernilai ribuan (misal 5.000), Ratusan bernilai ratusan (800), Puluhan (20), dan Satuan (4).",
        questions: [
          {
            id: 1,
            question: "Pada bilangan 5.824, angka 5 menempati nilai tempat?",
            options: ["Ribuan", "Ratusan", "Puluhan"],
            correctIndex: 0,
            explanation: "Angka 5 di paling depan bernilai 5.000 (ribuan).",
          },
          {
            id: 2,
            question: "Nilai angka 7 pada bilangan 3.750 adalah?",
            options: ["700", "7.000", "70"],
            correctIndex: 0,
            explanation: "Angka 7 berada di posisi ratusan, bernilai 700.",
          },
          {
            id: 3,
            question: "Bentuk panjang dari 4.316 adalah?",
            options: ["4.000 + 300 + 10 + 6", "400 + 300 + 10 + 6", "4.000 + 30 + 16"],
            correctIndex: 0,
            explanation: "4.316 = 4.000 + 300 + 10 + 6.",
          },
          {
            id: 4,
            question: "2.450 ... 2.540. Tanda perbandingan yang tepat adalah?",
            options: ["Lebih Kecil (<)", "Lebih Besar (>)", "Sama Dengan (=)"],
            correctIndex: 0,
            explanation: "2.450 lebih kecil dari 2.540 karena ratusan 400 < 500.",
          },
          {
            id: 5,
            question: "6.890 ... 6.809. Tanda perbandingan yang tepat adalah?",
            options: ["Lebih Besar (>)", "Lebih Kecil (<)", "Sama Dengan (=)"],
            correctIndex: 0,
            explanation: "6.890 lebih besar daripada 6.809.",
          },
          {
            id: 6,
            question: "Pada bilangan 9.042, angka 0 menempati nilai tempat?",
            options: ["Ratusan", "Puluhan", "Ribuan"],
            correctIndex: 0,
            explanation: "Angka 0 berada di posisi ratusan.",
          },
          {
            id: 7,
            question: "3 ribuan + 5 ratusan + 2 puluhan + 8 satuan sama dengan?",
            options: ["3.528", "3.258", "5.328"],
            correctIndex: 0,
            explanation: "3.000 + 500 + 20 + 8 = 3.528.",
          },
          {
            id: 8,
            question: "Manakah bilangan yang LEBIH BESAR dari 4.500?",
            options: ["4.750", "4.120", "3.990"],
            correctIndex: 0,
            explanation: "4.750 lebih besar dari 4.500.",
          },
          {
            id: 9,
            question: "Urutkan dari yang terkecil: 1.500, 1.200, 1.800!",
            options: ["1.200, 1.500, 1.800", "1.800, 1.500, 1.200", "1.500, 1.200, 1.800"],
            correctIndex: 0,
            explanation: "Urutan dari paling kecil adalah 1.200, 1.500, lalu 1.800.",
          },
          {
            id: 10,
            question: "Nilai angka 4 pada bilangan 8.941 adalah?",
            options: ["40", "400", "4.000"],
            correctIndex: 0,
            explanation: "Angka 4 menempati puluhan, bernilai 40.",
          },
        ],
      };

    case 3:
      return {
        title: "Penjumlahan & Pengurangan Ribuan",
        conceptText: "Hitung operasi penjumlahan dan pengurangan ribuan dengan cara bersusun pendek mulai dari satuan, puluhan, ratusan, hingga ribuan.",
        questions: [
          {
            id: 1,
            question: "1.250 + 1.300 = ...",
            options: ["2.550", "2.450", "2.650"],
            correctIndex: 0,
            explanation: "1.250 + 1.300 = 2.550.",
          },
          {
            id: 2,
            question: "3.500 + 2.200 = ...",
            options: ["5.700", "5.600", "5.800"],
            correctIndex: 0,
            explanation: "3.500 + 2.200 = 5.700.",
          },
          {
            id: 3,
            question: "4.800 - 1.500 = ...",
            options: ["3.300", "3.200", "3.400"],
            correctIndex: 0,
            explanation: "4.800 - 1.500 = 3.300.",
          },
          {
            id: 4,
            question: "5.750 - 2.250 = ...",
            options: ["3.500", "3.400", "3.600"],
            correctIndex: 0,
            explanation: "5.750 - 2.250 = 3.500.",
          },
          {
            id: 5,
            question: "Di peternakan ada 2.400 ayam petelur dan 1.350 ayam pedaging. Berapa total seluruh ayam?",
            options: ["3.750 ekor", "3.650 ekor", "3.850 ekor"],
            correctIndex: 0,
            explanation: "2.400 + 1.350 = 3.750 ekor.",
          },
          {
            id: 6,
            question: "Toko memiliki 4.500 kg beras, terjual 2.000 kg. Sisa beras toko sekarang adalah?",
            options: ["2.500 kg", "2.000 kg", "3.000 kg"],
            correctIndex: 0,
            explanation: "4.500 - 2.000 = 2.500 kg.",
          },
          {
            id: 7,
            question: "2.150 + 850 = ...",
            options: ["3.000", "2.900", "3.100"],
            correctIndex: 0,
            explanation: "2.150 + 850 = 3.000.",
          },
          {
            id: 8,
            question: "6.900 - 3.400 = ...",
            options: ["3.500", "3.400", "3.600"],
            correctIndex: 0,
            explanation: "6.900 - 3.400 = 3.500.",
          },
          {
            id: 9,
            question: "3.250 + 1.750 = ...",
            options: ["5.000", "4.900", "5.100"],
            correctIndex: 0,
            explanation: "3.250 + 1.750 = 5.000.",
          },
          {
            id: 10,
            question: "7.820 - 4.310 = ...",
            options: ["3.510", "3.410", "3.610"],
            correctIndex: 0,
            explanation: "7.820 - 4.310 = 3.510.",
          },
        ],
      };

    case 4:
      return {
        title: "Perkalian Puluhan & Ratusan",
        conceptText: "Perkalian bersusun pendek dilakukan dengan mengalikan pengali dengan angka satuan terlebih dahulu, kemudian puluhannya. Misalnya 24 × 2 = 48.",
        questions: [
          {
            id: 1,
            question: "12 × 3 = ...",
            options: ["36", "32", "40"],
            correctIndex: 0,
            explanation: "12 × 3 = 36.",
          },
          {
            id: 2,
            question: "25 × 4 = ...",
            options: ["100", "90", "110"],
            correctIndex: 0,
            explanation: "25 × 4 = 100.",
          },
          {
            id: 3,
            question: "Ada 4 kotak pensil, masing-masing berisi 15 pensil. Berapa total seluruh pensil?",
            options: ["60 pensil", "50 pensil", "70 pensil"],
            correctIndex: 0,
            explanation: "4 × 15 = 60 pensil.",
          },
          {
            id: 4,
            question: "30 × 5 = ...",
            options: ["150", "120", "180"],
            correctIndex: 0,
            explanation: "30 × 5 = 150.",
          },
          {
            id: 5,
            question: "22 × 4 = ...",
            options: ["88", "84", "92"],
            correctIndex: 0,
            explanation: "22 × 4 = 88.",
          },
          {
            id: 6,
            question: "50 × 6 = ...",
            options: ["300", "250", "350"],
            correctIndex: 0,
            explanation: "50 × 6 = 300.",
          },
          {
            id: 7,
            question: "Pak Tono memiliki 3 keranjang, tiap keranjang berisi 40 jeruk. Total jeruk adalah?",
            options: ["120 jeruk", "100 jeruk", "140 jeruk"],
            correctIndex: 0,
            explanation: "3 × 40 = 120 jeruk.",
          },
          {
            id: 8,
            question: "16 × 5 = ...",
            options: ["80", "75", "85"],
            correctIndex: 0,
            explanation: "16 × 5 = 80.",
          },
          {
            id: 9,
            question: "100 × 4 = ...",
            options: ["400", "300", "500"],
            correctIndex: 0,
            explanation: "100 × 4 = 400.",
          },
          {
            id: 10,
            question: "15 × 6 = ...",
            options: ["90", "80", "100"],
            correctIndex: 0,
            explanation: "15 × 6 = 90.",
          },
        ],
      };

    case 5:
      return {
        title: "Pembagian Puluhan & Ratusan",
        conceptText: "Pembagian bersusun (porogapit) adalah mencari hasil bagi dengan membagi bilangan dari nilai tempat terbesar. Contoh: 60 : 3 = 20.",
        questions: [
          {
            id: 1,
            question: "48 : 4 = ...",
            options: ["12", "14", "10"],
            correctIndex: 0,
            explanation: "48 dibagi 4 adalah 12.",
          },
          {
            id: 2,
            question: "60 : 5 = ...",
            options: ["12", "15", "10"],
            correctIndex: 0,
            explanation: "60 dibagi 5 adalah 12.",
          },
          {
            id: 3,
            question: "84 : 2 = ...",
            options: ["42", "40", "44"],
            correctIndex: 0,
            explanation: "84 dibagi 2 adalah 42.",
          },
          {
            id: 4,
            question: "Ada 90 permen dibagikan rata ke 3 toples. Berapa isi permen tiap toples?",
            options: ["30 permen", "25 permen", "35 permen"],
            correctIndex: 0,
            explanation: "90 : 3 = 30 permen.",
          },
          {
            id: 5,
            question: "100 : 4 = ...",
            options: ["25", "20", "30"],
            correctIndex: 0,
            explanation: "100 dibagi 4 adalah 25.",
          },
          {
            id: 6,
            question: "75 : 3 = ...",
            options: ["25", "20", "30"],
            correctIndex: 0,
            explanation: "75 dibagi 3 adalah 25.",
          },
          {
            id: 7,
            question: "120 : 6 = ...",
            options: ["20", "25", "15"],
            correctIndex: 0,
            explanation: "120 dibagi 6 adalah 20.",
          },
          {
            id: 8,
            question: "Kakek membagikan 50 buku kepada 5 cucunya sama banyak. Tiap cucu mendapat?",
            options: ["10 buku", "5 buku", "15 buku"],
            correctIndex: 0,
            explanation: "50 : 5 = 10 buku.",
          },
          {
            id: 9,
            question: "96 : 3 = ...",
            options: ["32", "30", "34"],
            correctIndex: 0,
            explanation: "96 dibagi 3 adalah 32.",
          },
          {
            id: 10,
            question: "200 : 5 = ...",
            options: ["40", "50", "30"],
            correctIndex: 0,
            explanation: "200 : 5 = 40.",
          },
        ],
      };

    case 6:
      return {
        title: "Pecahan Berpenyebut Sama",
        conceptText: "Jika dua pecahan memiliki penyebut yang sama, kita hanya menjumlahkan atau mengurangkan angka pembilangnya (angka atas), penyebutnya tetap sama! Contoh: 1/4 + 2/4 = 3/4.",
        questions: [
          {
            id: 1,
            question: "1/5 + 2/5 = ...",
            options: ["3/5", "3/10", "2/5"],
            correctIndex: 0,
            explanation: "Pembilang dijumlahkan (1+2=3), penyebut tetap 5, jadi 3/5.",
          },
          {
            id: 2,
            question: "3/7 + 2/7 = ...",
            options: ["5/7", "5/14", "1/7"],
            correctIndex: 0,
            explanation: "3 + 2 = 5, penyebut tetap 7, hasilnya 5/7.",
          },
          {
            id: 3,
            question: "4/6 - 1/6 = ...",
            options: ["3/6", "5/6", "3/0"],
            correctIndex: 0,
            explanation: "4 - 1 = 3, penyebut tetap 6, hasilnya 3/6.",
          },
          {
            id: 4,
            question: "5/8 - 2/8 = ...",
            options: ["3/8", "7/8", "3/16"],
            correctIndex: 0,
            explanation: "5 - 2 = 3, penyebut tetap 8, hasilnya 3/8.",
          },
          {
            id: 5,
            question: "Ibu memotong semangka jadi 8. Andi makan 2/8 dan Budi makan 3/8. Berapa total semangka yang dimakan?",
            options: ["5/8 bagian", "5/16 bagian", "1/8 bagian"],
            correctIndex: 0,
            explanation: "2/8 + 3/8 = 5/8 bagian.",
          },
          {
            id: 6,
            question: "2/9 + 4/9 = ...",
            options: ["6/9", "6/18", "2/9"],
            correctIndex: 0,
            explanation: "2 + 4 = 6, penyebut tetap 9, hasilnya 6/9.",
          },
          {
            id: 7,
            question: "7/10 - 4/10 = ...",
            options: ["3/10", "3/0", "11/10"],
            correctIndex: 0,
            explanation: "7 - 4 = 3, penyebut tetap 10, hasilnya 3/10.",
          },
          {
            id: 8,
            question: "Pada penjumlahan pecahan berpenyebut sama, apakah angka penyebut (bawah) ikut dijumlahkan?",
            options: ["Tidak, penyebutnya tetap sama", "Ya, harus dijumlahkan", "Kadang-kadang"],
            correctIndex: 0,
            explanation: "Penyebut yang sama tidak ikut dijumlahkan, nilainya tetap.",
          },
          {
            id: 9,
            question: "3/4 - 1/4 = ...",
            options: ["2/4", "1/4", "2/0"],
            correctIndex: 0,
            explanation: "3 - 1 = 2, hasilnya 2/4.",
          },
          {
            id: 10,
            question: "2/6 + 3/6 = ...",
            options: ["5/6", "5/12", "1/6"],
            correctIndex: 0,
            explanation: "2 + 3 = 5, hasilnya 5/6.",
          },
        ],
      };

    case 7:
      return {
        title: "Konversi Satuan Waktu, Panjang, Berat",
        conceptText: "Hubungan antar-satuan baku: 1 jam = 60 menit, 1 km = 1.000 meter, 1 meter = 100 sentimeter, 1 kg = 1.000 gram, 1 kg = 10 ons.",
        questions: [
          {
            id: 1,
            question: "2 jam sama dengan berapa menit?",
            options: ["120 menit", "100 menit", "60 menit"],
            correctIndex: 0,
            explanation: "2 × 60 = 120 menit.",
          },
          {
            id: 2,
            question: "1 kilometer (km) sama dengan berapa meter (m)?",
            options: ["1.000 meter", "100 meter", "10 meter"],
            correctIndex: 0,
            explanation: "1 km = 1.000 meter.",
          },
          {
            id: 3,
            question: "3 meter (m) sama dengan berapa sentimeter (cm)?",
            options: ["300 cm", "30 cm", "3.000 cm"],
            correctIndex: 0,
            explanation: "3 × 100 cm = 300 cm.",
          },
          {
            id: 4,
            question: "1 kilogram (kg) sama dengan berapa ons?",
            options: ["10 ons", "100 ons", "1.000 ons"],
            correctIndex: 0,
            explanation: "1 kg = 10 ons.",
          },
          {
            id: 5,
            question: "2 kilogram (kg) sama dengan berapa gram?",
            options: ["2.000 gram", "200 gram", "20 gram"],
            correctIndex: 0,
            explanation: "2 × 1.000 gram = 2.000 gram.",
          },
          {
            id: 6,
            question: "180 menit sama dengan berapa jam?",
            options: ["3 jam", "2 jam", "4 jam"],
            correctIndex: 0,
            explanation: "180 : 60 = 3 jam.",
          },
          {
            id: 7,
            question: "Jarak rumah ke sekolah adalah 2 km. Berapa meter jarak tersebut?",
            options: ["2.000 meter", "200 meter", "20.000 meter"],
            correctIndex: 0,
            explanation: "2 × 1.000 = 2.000 meter.",
          },
          {
            id: 8,
            question: "500 sentimeter (cm) sama dengan berapa meter?",
            options: ["5 meter", "50 meter", "500 meter"],
            correctIndex: 0,
            explanation: "500 : 100 = 5 meter.",
          },
          {
            id: 9,
            question: "Ibu membeli 20 ons gula. 20 ons sama dengan berapa kilogram (kg)?",
            options: ["2 kg", "20 kg", "200 kg"],
            correctIndex: 0,
            explanation: "20 : 10 = 2 kg.",
          },
          {
            id: 10,
            question: "1 menit sama dengan berapa detik?",
            options: ["60 detik", "100 detik", "30 detik"],
            correctIndex: 0,
            explanation: "1 menit = 60 detik.",
          },
        ],
      };

    case 8:
      return {
        title: "Mengenal Jenis Sudut",
        conceptText: "Sudut terbentuk dari dua garis yang berpotongan. Sudut siku-siku besarnya tepat 90°. Sudut lancip besarnya kurang dari 90° (runcing). Sudut tumpul besarnya lebih dari 90° (melebar).",
        questions: [
          {
            id: 1,
            question: "Sudut yang besarnya tepat 90 derajat dinamakan sudut?",
            options: ["Siku-siku", "Lancip", "Tumpul"],
            correctIndex: 0,
            explanation: "Sudut 90 derajat adalah sudut siku-siku.",
          },
          {
            id: 2,
            question: "Sudut yang lebih kecil dari sudut siku-siku (runcing) dinamakan sudut?",
            options: ["Lancip", "Tumpul", "Lurus"],
            correctIndex: 0,
            explanation: "Sudut kurang dari 90° adalah sudut lancip.",
          },
          {
            id: 3,
            question: "Sudut yang lebih besar dari sudut siku-siku (melebar) dinamakan sudut?",
            options: ["Tumpul", "Lancip", "Siku-siku"],
            correctIndex: 0,
            explanation: "Sudut lebih dari 90° adalah sudut tumpul.",
          },
          {
            id: 4,
            question: "Pojok meja dan sudut bingkai foto biasanya membentuk sudut?",
            options: ["Siku-siku", "Lancip", "Tumpul"],
            correctIndex: 0,
            explanation: "Pojok meja dan bingkai foto membentuk sudut tegak siku-siku.",
          },
          {
            id: 5,
            question: "Ujung pensil yang runcing menyerupai bentuk sudut?",
            options: ["Lancip", "Tumpul", "Siku-siku"],
            correctIndex: 0,
            explanation: "Ujung runcing membentuk sudut lancip.",
          },
          {
            id: 6,
            question: "Jarum jam yang menunjukkan pukul 03.00 tepat membentuk sudut?",
            options: ["Siku-siku (90°)", "Lancip", "Tumpul"],
            correctIndex: 0,
            explanation: "Jarum jam ke 3 dan ke 12 membentuk sudut siku-siku 90°.",
          },
          {
            id: 7,
            question: "Jarum jam yang menunjukkan pukul 05.00 membentuk sudut?",
            options: ["Tumpul", "Lancip", "Siku-siku"],
            correctIndex: 0,
            explanation: "Membuka lebih lebar dari 90°, membentuk sudut tumpul.",
          },
          {
            id: 8,
            question: "Jarum jam yang menunjukkan pukul 01.00 membentuk sudut?",
            options: ["Lancip", "Tumpul", "Siku-siku"],
            correctIndex: 0,
            explanation: "Jaraknya sempit kurang dari 90°, membentuk sudut lancip.",
          },
          {
            id: 9,
            question: "Ketiga sudut pada bangun segitiga sama sisi adalah sudut?",
            options: ["Lancip", "Tumpul", "Siku-siku"],
            correctIndex: 0,
            explanation: "Semua sudut pada segitiga sama sisi berukuran lancip (60°).",
          },
          {
            id: 10,
            question: "Bangun datar persegi memiliki 4 buah sudut yang semuanya berupa sudut?",
            options: ["Siku-siku", "Lancip", "Tumpul"],
            correctIndex: 0,
            explanation: "Persegi memiliki 4 sudut siku-siku sempurna.",
          },
        ],
      };

    case 9:
      return {
        title: "Simetri & Keliling Bangun Datar",
        conceptText: "Simetri lipat membagi bangun menjadi 2 bagian yang saling menutupi pas. Keliling adalah jumlah panjang seluruh sisi tepi bangun datar (misal Persegi = 4 × sisi).",
        questions: [
          {
            id: 1,
            question: "Bangun datar persegi memiliki berapa sumbu simetri lipat?",
            options: ["4 simetri lipat", "2 simetri lipat", "3 simetri lipat"],
            correctIndex: 0,
            explanation: "Persegi memiliki 4 sumbu simetri lipat.",
          },
          {
            id: 2,
            question: "Persegi panjang memiliki berapa sumbu simetri lipat?",
            options: ["2 simetri lipat", "4 simetri lipat", "1 simetri lipat"],
            correctIndex: 0,
            explanation: "Persegi panjang memiliki 2 simetri lipat.",
          },
          {
            id: 3,
            question: "Bangun datar lingkaran memiliki sumbu simetri lipat sebanyak?",
            options: ["Tak terhingga", "4 buah", "10 buah"],
            correctIndex: 0,
            explanation: "Lingkaran dapat dilipat di sembarang garis tengahnya (tak terhingga).",
          },
          {
            id: 4,
            question: "Sebuah persegi memiliki sisi 5 cm. Berapa kelilingnya? (Rumus: 4 × sisi)",
            options: ["20 cm", "25 cm", "15 cm"],
            correctIndex: 0,
            explanation: "4 × 5 cm = 20 cm.",
          },
          {
            id: 5,
            question: "Persegi panjang berukuran panjang 6 cm dan lebar 4 cm. Berapa kelilingnya?",
            options: ["20 cm", "24 cm", "10 cm"],
            correctIndex: 0,
            explanation: "2 × (6 + 4) = 2 × 10 = 20 cm.",
          },
          {
            id: 6,
            question: "Segitiga sama sisi memiliki berapa sumbu simetri lipat?",
            options: ["3 simetri lipat", "1 simetri lipat", "2 simetri lipat"],
            correctIndex: 0,
            explanation: "Segitiga sama sisi memiliki 3 simetri lipat.",
          },
          {
            id: 7,
            question: "Keliling segitiga yang panjang ketiga sisinya 5 cm, 5 cm, dan 5 cm adalah?",
            options: ["15 cm", "25 cm", "10 cm"],
            correctIndex: 0,
            explanation: "5 + 5 + 5 = 15 cm.",
          },
          {
            id: 8,
            question: "Bangun datar yang memiliki simetri putar tak terhingga adalah?",
            options: ["Lingkaran", "Persegi", "Segitiga"],
            correctIndex: 0,
            explanation: "Lingkaran memiliki simetri putar tak terhingga.",
          },
          {
            id: 9,
            question: "Sebuah persegi memiliki sisi 10 cm. Keliling persegi tersebut adalah?",
            options: ["40 cm", "100 cm", "20 cm"],
            correctIndex: 0,
            explanation: "4 × 10 cm = 40 cm.",
          },
          {
            id: 10,
            question: "Jumlah sudut pada bangun persegi panjang adalah?",
            options: ["4 sudut siku-siku", "3 sudut lancip", "4 sudut tumpul"],
            correctIndex: 0,
            explanation: "Persegi panjang memiliki 4 sudut siku-siku.",
          },
        ],
      };

    case 10:
    default:
      return {
        title: "Membaca Tabel & Diagram Batang",
        conceptText: "Diagram batang menyajikan data menggunakan persegi panjang tegak untuk memudahkan membaca dan membandingkan banyak data. Sumbu tegak menunjukkan jumlah data.",
        questions: [
          {
            id: 1,
            question: "Pada diagram batang, tinggi batang tegak menunjukkan?",
            options: ["Jumlah atau frekuensi data", "Warna benda", "Nama benda"],
            correctIndex: 0,
            explanation: "Tinggi batang menunjukkan kuantitas/jumlah data.",
          },
          {
            id: 2,
            question: "Data hobi siswa: Membaca = 8, Olahraga = 12, Menggambar = 6. Hobi yang PALING BANYAK disukai adalah?",
            options: ["Olahraga (12)", "Membaca (8)", "Menggambar (6)"],
            correctIndex: 0,
            explanation: "Olahraga memiliki peminat terbanyak yaitu 12 siswa.",
          },
          {
            id: 3,
            question: "Dari data hobi di atas (8 membaca, 12 olahraga, 6 menggambar), berapa total seluruh siswa?",
            options: ["26 siswa", "24 siswa", "28 siswa"],
            correctIndex: 0,
            explanation: "8 + 12 + 6 = 26 siswa.",
          },
          {
            id: 4,
            question: "Berapa selisih siswa yang suka olahraga (12) dan menggambar (6)?",
            options: ["6 siswa", "4 siswa", "8 siswa"],
            correctIndex: 0,
            explanation: "12 - 6 = 6 siswa.",
          },
          {
            id: 5,
            question: "Data penjualan es krim: Cokelat = 15, Stroberi = 10, Vanila = 20. Rasa es krim apa yang PALING SEDIKIT terjual?",
            options: ["Stroberi (10)", "Cokelat (15)", "Vanila (20)"],
            correctIndex: 0,
            explanation: "Stroberi terjual paling sedikit yaitu 10.",
          },
          {
            id: 6,
            question: "Bentuk penyajian data berupa balok tegak dengan tinggi tertentu dinamakan?",
            options: ["Diagram Batang", "Piktogram", "Garis Bilangan"],
            correctIndex: 0,
            explanation: "Diagram batang menggunakan balok/kolom tegak.",
          },
          {
            id: 7,
            question: "Nilai ulangan matematika Budi: 80, 90, 85, 95. Berapa nilai tertinggi yang diperoleh Budi?",
            options: ["95", "90", "85"],
            correctIndex: 0,
            explanation: "Nilai tertinggi Budi adalah 95.",
          },
          {
            id: 8,
            question: "Berapa selisih antara nilai tertinggi (95) dan nilai terendah (80) pada ulangan Budi?",
            options: ["15", "10", "20"],
            correctIndex: 0,
            explanation: "95 - 80 = 15.",
          },
          {
            id: 9,
            question: "Data buah favorit: Apel = 14, Pisang = 9, Mangga = 14. Buah mana yang disukai oleh jumlah siswa SAMA BANYAK?",
            options: ["Apel dan Mangga", "Apel dan Pisang", "Pisang dan Mangga"],
            correctIndex: 0,
            explanation: "Apel dan Mangga sama-sama disukai oleh 14 siswa.",
          },
          {
            id: 10,
            question: "Penyajian data yang disusun dalam baris dan kolom dinamakan?",
            options: ["Tabel Data", "Peta Konsep", "Diagram Gambar"],
            correctIndex: 0,
            explanation: "Tabel menyusun data secara teratur dalam baris dan kolom.",
          },
        ],
      };
  }
}
