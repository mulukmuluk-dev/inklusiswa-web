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

interface MathGrade1GameProps {
  levelId: number;
  onLevelComplete: (levelId: number, starsEarned: number) => void;
  accessibilityMode?: string;
}

export function MathGrade1Game({ levelId, onLevelComplete, accessibilityMode }: MathGrade1GameProps) {
  // Game Phase: "materi" (Belajar Dulu) or "game" (Main Tantangan)
  const [phase, setPhase] = useState<"materi" | "game">("materi");

  // Phase 1 interactive sandbox states
  const [materiCount, setMateriCount] = useState<number>(0);
  const [materiSelectedBasket, setMateriSelectedBasket] = useState<"A" | "B" | null>(null);
  const [materiLevel3Revealed, setMateriLevel3Revealed] = useState<boolean>(false);
  const [materiPoppedBalloons, setMateriPoppedBalloons] = useState<number[]>([]);
  const [materiClockHour, setMateriClockHour] = useState<number>(6);

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

  // Level Setup
  useEffect(() => {
    setPhase("materi");
    setMateriCount(0);
    setMateriSelectedBasket(null);
    setMateriLevel3Revealed(false);
    setMateriPoppedBalloons([]);
    setMateriClockHour(6);

    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setWrongAttempts(0);
    setShowClue(false);
    setIsCompleted(false);
    isProcessingRef.current = false;

    const data = getGrade1LevelData(levelId);
    setQuestionsList(shuffleQuestions(data));
    speakGlobal(data.conceptText);
  }, [levelId]);

  const levelData = getGrade1LevelData(levelId);
  const activeQuestions = questionsList.length > 0 ? questionsList : levelData.questions;
  const currentQ = activeQuestions[currentQuestionIndex] || activeQuestions[0];

  // TTS read question in game phase
  useEffect(() => {
    if (phase === "game" && !isCompleted && currentQ) {
      speakGlobal(`Soal nomor ${currentQuestionIndex + 1}. ${currentQ.question}`);
    }
  }, [currentQuestionIndex, phase, isCompleted, currentQ]);

  // Start Challenge (Switch to Phase 2)
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

  // Answer click handler
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
          // Finished all 10 questions
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
      
      {/* Header Info Level */}
      <div className="w-full flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="px-4 py-1.5 bg-[#7FD13B] text-white font-black text-xs md:text-sm rounded-xl border-2 border-[#3C632A]">
            KELAS 1 SD • LEVEL {levelId} dari 10
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
                <div className="flex gap-3 sm:gap-4 flex-wrap justify-center items-center">
                  {Array.from({ length: 3 }).map((_, i) => {
                    const countNames = ["Satu", "Dua", "Tiga"];
                    const isTouched = i < materiCount;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          const next = i + 1;
                          setMateriCount(next);
                          playPopSound();
                          speakGlobal(countNames[i]);
                        }}
                        className={`text-5xl sm:text-6xl p-3 sm:p-4 rounded-2xl border-4 transition-all duration-200 cursor-pointer ${
                          isTouched
                            ? "bg-[#7FD13B] border-[#3C632A] scale-110 shadow-lg ring-4 ring-white/60"
                            : "bg-white/90 border-[#3C632A] hover:scale-110 active:scale-95"
                        }`}
                      >
                        🍌
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xs sm:text-sm font-black text-[#3C632A] bg-white px-5 py-2 rounded-xl border-2 border-[#3C632A] shadow-sm">
                    {materiCount === 0
                      ? "Sentuh pisang di atas satu per satu!"
                      : `Menghitung: ${materiCount} (${["Satu", "Dua", "Tiga"][materiCount - 1]})`}
                  </div>
                  {materiCount > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setMateriCount(0);
                        playPopSound();
                      }}
                      className="px-4 py-2 bg-[#FFDF59] hover:bg-[#FFE296] text-[#3C632A] font-black text-xs sm:text-sm rounded-xl border-2 border-[#3C632A] cursor-pointer"
                    >
                      Hitung Ulang
                    </button>
                  )}
                </div>
              </div>
            )}

            {levelId === 2 && (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex justify-around items-center w-full gap-3 sm:gap-6">
                  <button
                    type="button"
                    onClick={() => {
                      setMateriSelectedBasket("A");
                      playPopSound();
                      speakGlobal("Keranjang A berisi 3 apel. Jumlahnya lebih sedikit.");
                    }}
                    className={`p-4 rounded-2xl border-4 transition-all flex flex-col items-center cursor-pointer ${
                      materiSelectedBasket === "A"
                        ? "bg-[#FFE296] border-[#C3631D] scale-105 shadow-md"
                        : "bg-white/90 border-[#3C632A] hover:scale-105"
                    }`}
                  >
                    <span className="text-xs sm:text-sm font-black text-[#3C632A] mb-1">KERANJANG A</span>
                    <span className="text-2xl sm:text-3xl my-1">🍎🍎🍎</span>
                    <span className="text-xs font-black text-[#C3631D] bg-white px-2 py-0.5 rounded border border-[#3C632A]">3 Apel</span>
                  </button>

                  <span className="text-2xl font-black text-[#C3631D]">&lt;</span>

                  <button
                    type="button"
                    onClick={() => {
                      setMateriSelectedBasket("B");
                      playPopSound();
                      speakGlobal("Keranjang B berisi 6 apel. Jumlahnya LEBIH BANYAK daripada 3 apel!");
                    }}
                    className={`p-4 rounded-2xl border-4 transition-all flex flex-col items-center cursor-pointer ${
                      materiSelectedBasket === "B"
                        ? "bg-[#7FD13B]/40 border-[#3C632A] scale-105 shadow-md ring-4 ring-[#7FD13B]"
                        : "bg-white/90 border-[#3C632A] hover:scale-105"
                    }`}
                  >
                    <span className="text-xs sm:text-sm font-black text-[#3C632A] mb-1">KERANJANG B</span>
                    <span className="text-2xl sm:text-3xl my-1">🍎🍎🍎🍎🍎🍎</span>
                    <span className="text-xs font-black text-white bg-[#7FD13B] px-2 py-0.5 rounded border border-[#3C632A]">6 Apel (LEBIH BANYAK!)</span>
                  </button>
                </div>
                <div className="text-xs sm:text-sm font-black text-[#3C632A] bg-white px-4 py-1.5 rounded-xl border-2 border-[#3C632A]">
                  {materiSelectedBasket === null
                    ? "Sentuh keranjang A atau B untuk membandingkan!"
                    : materiSelectedBasket === "A"
                    ? "Keranjang A = 3 Apel (Lebih Sedikit)"
                    : "Keranjang B = 6 Apel (Lebih Banyak! 6 > 3)"}
                </div>
              </div>
            )}

            {levelId === 3 && (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex gap-2 items-center bg-white/90 p-4 rounded-2xl border-4 border-[#3C632A] shadow-md">
                  <span className="px-3 py-1.5 bg-[#FFDF59] rounded-xl border-2 border-[#3C632A] font-black text-xl text-[#3C632A]">1</span>
                  <span className="text-[#3C632A] font-black">➔</span>
                  <button
                    type="button"
                    onClick={() => {
                      setMateriLevel3Revealed(true);
                      playPopSound();
                      speakGlobal("Hore! Angka 2 berada di antara 1 dan 3. Urutannya adalah 1, 2, 3!");
                    }}
                    className={`px-4 py-1.5 rounded-xl font-black text-xl border-4 transition-all cursor-pointer ${
                      materiLevel3Revealed
                        ? "bg-[#7FD13B] text-white border-[#3C632A] scale-110 shadow-lg"
                        : "bg-[#C3631D] text-[#FFDF59] border-[#3C632A] animate-bounce hover:scale-105"
                    }`}
                  >
                    {materiLevel3Revealed ? "2" : "? (Tekan!)"}
                  </button>
                  <span className="text-[#3C632A] font-black">➔</span>
                  <span className="px-3 py-1.5 bg-[#FFDF59] rounded-xl border-2 border-[#3C632A] font-black text-xl text-[#3C632A]">3</span>
                </div>
                <div className="text-xs sm:text-sm font-black text-[#3C632A] bg-white px-4 py-1.5 rounded-xl border-2 border-[#3C632A]">
                  {materiLevel3Revealed
                    ? "Hebat! Angka 2 melengkapi urutan 1, 2, 3."
                    : "Sentuh gerbong angka [ ? ] untuk melihat angka setelah 1!"}
                </div>
              </div>
            )}

            {levelId === 4 && (
              <div
                onClick={() => {
                  playPopSound();
                  speakGlobal("2 apel ditambah 2 apel digabungkan menjadi 4 apel!");
                }}
                className="flex flex-col items-center gap-2 cursor-pointer hover:scale-105 transition-transform"
              >
                <div className="flex items-center gap-3 bg-white/90 p-4 rounded-2xl border-2 border-[#3C632A] text-2xl sm:text-3xl font-black">
                  <span>🍎🍎</span>
                  <span className="text-[#C3631D]">+</span>
                  <span>🍎🍎</span>
                  <span className="text-[#C3631D]">=</span>
                  <span className="text-[#3C632A] bg-[#FFE296] px-3 py-1 rounded-xl border-2 border-[#3C632A]">4 Apel</span>
                </div>
                <span className="text-xs sm:text-sm font-black text-[#3C632A] bg-white px-4 py-1 rounded-xl border border-[#3C632A]">
                  Sentuh untuk mendengar contoh penjumlahan 2 + 2!
                </span>
              </div>
            )}

            {levelId === 5 && (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex gap-3 bg-white/90 p-4 rounded-2xl border-4 border-[#3C632A] shadow-md justify-center flex-wrap">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const isPopped = materiPoppedBalloons.includes(i);
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          if (isPopped) return;
                          const nextPopped = [...materiPoppedBalloons, i];
                          setMateriPoppedBalloons(nextPopped);
                          playPopSound();
                          const sisa = 5 - nextPopped.length;
                          speakGlobal(`Balon meletup. 5 dikurang ${nextPopped.length} sisa ${sisa} balon.`);
                        }}
                        className="text-4xl sm:text-5xl hover:scale-125 active:scale-95 transition-transform cursor-pointer"
                      >
                        {isPopped ? "⚪" : "🎈"}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xs sm:text-sm font-black text-[#3C632A] bg-white px-5 py-2 rounded-xl border-2 border-[#3C632A]">
                    Sentuh balon untuk meletupkan! Sisa: {5 - materiPoppedBalloons.length} Balon
                  </div>
                  {materiPoppedBalloons.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setMateriPoppedBalloons([]);
                        playPopSound();
                      }}
                      className="px-4 py-2 bg-[#FFDF59] hover:bg-[#FFE296] text-[#3C632A] font-black text-sm rounded-xl border-2 border-[#3C632A] cursor-pointer"
                    >
                      Tiup Ulang Balon
                    </button>
                  )}
                </div>
              </div>
            )}

            {levelId === 6 && (
              <div
                onClick={() => {
                  playPopSound();
                  speakGlobal("Kotak kado memiliki 4 sisi sama panjang, berbentuk Persegi!");
                }}
                className="flex flex-col items-center gap-2 cursor-pointer hover:scale-105 transition-transform"
              >
                <div className="flex items-center gap-4 bg-white/90 p-4 rounded-2xl border-2 border-[#3C632A]">
                  <span className="text-2xl sm:text-3xl font-black text-[#3C632A]">Kotak Kado 🎁</span>
                  <span className="text-2xl font-black text-[#C3631D]">➔</span>
                  <div className="w-20 h-20 border-4 border-[#3C632A] bg-[#7FD13B] text-white flex items-center justify-center font-black text-xs sm:text-sm shadow-md rounded-lg">
                    PERSEGI
                  </div>
                </div>
                <span className="text-xs sm:text-sm font-black text-[#3C632A] bg-white px-4 py-1.5 rounded-xl border border-[#3C632A]">
                  Sentuh untuk mendengar penjelasan bentuk Persegi!
                </span>
              </div>
            )}

            {levelId === 7 && (
              <div
                onClick={() => {
                  playPopSound();
                  speakGlobal("Penggaris B ukurannya lebih panjang dibandingkan Penggaris A!");
                }}
                className="flex flex-col gap-3 w-full max-w-md bg-white/90 p-4 rounded-2xl border-2 border-[#3C632A] cursor-pointer hover:scale-105 transition-transform"
              >
                <div className="flex items-center justify-between text-xs sm:text-sm font-black text-[#3C632A]">
                  <span>Penggaris A (Pendek):</span>
                  <div className="w-24 h-6 bg-[#C3631D] rounded-lg border border-[#3C632A] flex items-center justify-center text-white text-[10px]">📏 15 cm</div>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm font-black text-[#3C632A]">
                  <span>Penggaris B (LEBIH PANJANG):</span>
                  <div className="w-52 h-6 bg-[#7FD13B] rounded-lg border border-[#3C632A] flex items-center justify-center text-white text-[10px]">📏📏 30 cm</div>
                </div>
                <span className="text-center text-xs font-black text-[#3C632A] mt-1">Sentuh untuk membandingkan panjang penggaris!</span>
              </div>
            )}

            {levelId === 8 && (
              <div className="flex flex-col items-center gap-4 w-full">
                <div className="flex items-center gap-3 sm:gap-6">
                  <button
                    type="button"
                    onClick={() => {
                      const newHour = materiClockHour === 1 ? 12 : materiClockHour - 1;
                      setMateriClockHour(newHour);
                      playPopSound();
                      speakGlobal(`Diputar mundur ke Jam ${newHour}.00 Pagi.`);
                    }}
                    className="px-4 py-2.5 bg-[#C3631D] text-[#FFDF59] font-black text-sm sm:text-base rounded-xl border-2 border-[#3C632A] hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer"
                  >
                    Mundur 1 Jam
                  </button>

                  <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full border-4 border-[#3C632A] bg-white flex flex-col items-center justify-center relative shadow-md">
                    {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((hr) => {
                      const angle = hr * 30;
                      const rad = (angle - 90) * (Math.PI / 180);
                      const radius = 68;
                      const x = Math.cos(rad) * radius;
                      const y = Math.sin(rad) * radius;
                      return (
                        <button
                          key={hr}
                          type="button"
                          onClick={() => {
                            setMateriClockHour(hr);
                            playPopSound();
                            speakGlobal(`Jam ${hr}.00 Pagi. Jarum pendek menunjuk ke angka ${hr}.`);
                          }}
                          className={`absolute font-black text-xs sm:text-sm w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                            materiClockHour === hr
                              ? "bg-[#7FD13B] text-white ring-2 ring-[#3C632A] scale-125 z-20 shadow-md"
                              : "text-[#3C632A] hover:bg-[#FFE296]"
                          }`}
                          style={{
                            transform: `translate(${x}px, ${y}px)`,
                          }}
                        >
                          {hr}
                        </button>
                      );
                    })}

                    <div className="w-3.5 h-3.5 bg-[#3C632A] rounded-full z-10"></div>
                    <div
                      className="absolute w-2 h-10 sm:h-12 bg-[#C3631D] rounded-full origin-bottom bottom-1/2 left-1/2 -ml-[4px] transition-transform duration-300 pointer-events-none z-10"
                      style={{ transform: `rotate(${materiClockHour * 30}deg)` }}
                    ></div>
                    <div className="absolute w-1.5 h-14 sm:h-18 bg-[#3C632A] rounded-full origin-bottom bottom-1/2 left-1/2 -ml-[3px] transform rotate-0 pointer-events-none"></div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const newHour = materiClockHour === 12 ? 1 : materiClockHour + 1;
                      setMateriClockHour(newHour);
                      playPopSound();
                      speakGlobal(`Diputar maju ke Jam ${newHour}.00 Pagi.`);
                    }}
                    className="px-4 py-2.5 bg-[#C3631D] text-[#FFDF59] font-black text-sm sm:text-base rounded-xl border-2 border-[#3C632A] hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer"
                  >
                    Maju 1 Jam
                  </button>
                </div>

                <div className="flex items-center gap-3 flex-wrap justify-center">
                  <div className="text-xs sm:text-sm font-black text-[#3C632A] bg-white px-5 py-2 rounded-xl border-2 border-[#3C632A] shadow-sm">
                    Pukul {materiClockHour < 10 ? `0${materiClockHour}` : materiClockHour}.00 {materiClockHour === 6 ? "Pagi (Waktu Bangun Pagi!)" : ""}
                  </div>
                  {materiClockHour !== 6 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setMateriClockHour(6);
                        playPopSound();
                        speakGlobal("Diputar kembali ke Jam 6 Pagi, waktu anak SD bangun pagi.");
                      }}
                      className="px-4 py-2 bg-[#7FD13B] text-white font-black text-xs sm:text-sm rounded-xl border-2 border-[#3C632A] shadow-sm hover:scale-105 cursor-pointer"
                    >
                      Atur ke Jam 6 Pagi
                    </button>
                  ) : (
                    <span className="px-4 py-2 bg-[#7FD13B] text-white font-black text-xs sm:text-sm rounded-xl border-2 border-[#3C632A] shadow-sm animate-pulse">
                      Pas Jam 6 Pagi!
                    </span>
                  )}
                </div>
              </div>
            )}

            {levelId === 9 && (
              <div
                onClick={() => {
                  playPopSound();
                  speakGlobal("1 ikat pensil berisi 10 puluhan, ditambah 2 pensil satuan, totalnya 12.");
                }}
                className="flex items-center gap-3 bg-white/90 p-4 rounded-2xl border-2 border-[#3C632A] cursor-pointer hover:scale-105 transition-transform"
              >
                <span className="px-3 py-1.5 bg-[#C3631D] text-white rounded-xl font-black text-xs sm:text-sm border border-[#3C632A]">1 Ikat (10 Puluhan)</span>
                <span className="text-xl font-black text-[#C3631D]">+</span>
                <span className="px-3 py-1.5 bg-[#7FD13B] text-white rounded-xl font-black text-xs sm:text-sm border border-[#3C632A]">2 Satuan</span>
                <span className="text-xl font-black text-[#C3631D]">=</span>
                <span className="text-2xl font-black text-[#3C632A]">12</span>
              </div>
            )}

            {levelId === 10 && (
              <div
                onClick={() => {
                  playPopSound();
                  speakGlobal("4 ditambah 4 sama dengan 8. Selamat mengikuti Ujian Master!");
                }}
                className="flex items-center gap-3 bg-white/90 p-4 rounded-2xl border-2 border-[#3C632A] cursor-pointer hover:scale-105 transition-transform"
              >
                <span className="text-2xl font-black text-[#3C632A]">4 + 4 = 8</span>
                <span className="px-3 py-1 bg-[#7FD13B] text-white font-black text-xs rounded-xl border border-[#3C632A]">Contoh Master</span>
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

          {/* PILIHAN JAWABAN (ACAK POSISI KIRI, TENGAH, KANAN) */}
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

// ================= DATA SILABUS MATEMATIKA KELAS 1 SD (10 LEVEL x 10 SOAL) =================
function getGrade1LevelData(levelId: number): LevelConceptData {
  switch (levelId) {
    case 1:
      return {
        title: "Petik Apel & Menghitung 1-10",
        conceptText: "Menghitung adalah menyebutkan jumlah benda satu per satu secara berurutan: Satu (1), Dua (2), Tiga (3). Sentuh pisang di bawah untuk latihan menghitung 1-3!",
        questions: [
          {
            id: 1,
            question: "Berapa banyak buah apel berikut?",
            visualHelper: "🍎 🍎 🍎",
            options: ["3 Buah", "2 Buah", "4 Buah"],
            correctIndex: 0,
            explanation: "Terdapat 3 buah apel.",
          },
          {
            id: 2,
            question: "Lambang bilangan dari kata 'Lima' adalah?",
            options: ["5", "4", "6"],
            correctIndex: 0,
            explanation: "Kata 'Lima' ditulis dengan lambang bilangan 5.",
          },
          {
            id: 3,
            question: "Hitung banyak buah jeruk ini!",
            visualHelper: "🍊 🍊 🍊 🍊 🍊",
            options: ["5 Jeruk", "6 Jeruk", "4 Jeruk"],
            correctIndex: 0,
            explanation: "Ada 5 buah jeruk.",
          },
          {
            id: 4,
            question: "Lambang bilangan untuk kata 'Satu' adalah?",
            options: ["1", "2", "0"],
            correctIndex: 0,
            explanation: "Satu ditulis dengan angka 1.",
          },
          {
            id: 5,
            question: "Berapa banyak bintang bersinar ini?",
            visualHelper: "⭐ ⭐",
            options: ["2 Bintang", "1 Bintang", "3 Bintang"],
            correctIndex: 0,
            explanation: "Terdapat 2 bintang.",
          },
          {
            id: 6,
            question: "Lambang bilangan dari kata 'Tujuh' adalah?",
            options: ["7", "8", "6"],
            correctIndex: 0,
            explanation: "Tujuh ditulis dengan angka 7.",
          },
          {
            id: 7,
            question: "Hitung buah stroberi berikut!",
            visualHelper: "🍓 🍓 🍓 🍓",
            options: ["4 Stroberi", "5 Stroberi", "3 Stroberi"],
            correctIndex: 0,
            explanation: "Ada 4 buah stroberi.",
          },
          {
            id: 8,
            question: "Lambang bilangan dari kata 'Sembilan' adalah?",
            options: ["9", "6", "8"],
            correctIndex: 0,
            explanation: "Sembilan ditulis dengan lambang angka 9.",
          },
          {
            id: 9,
            question: "Berapa jumlah buah pisang ini?",
            visualHelper: "🍌 🍌 🍌 🍌 🍌 🍌",
            options: ["6 Pisang", "7 Pisang", "5 Pisang"],
            correctIndex: 0,
            explanation: "Ada 6 buah pisang.",
          },
          {
            id: 10,
            question: "Lambang bilangan dari kata 'Sepuluh' adalah?",
            options: ["10", "1", "100"],
            correctIndex: 0,
            explanation: "Sepuluh ditulis dengan angka 10.",
          },
        ],
      };

    case 2:
      return {
        title: "Lebih Banyak vs Lebih Sedikit",
        conceptText: "Kelompok benda dengan jumlah angka lebih besar berarti LEBIH BANYAK. Misalnya 6 apel lebih banyak daripada 3 apel. Sentuh keranjang di bawah untuk membandingkan!",
        questions: [
          {
            id: 1,
            question: "Keranjang A berisi 4 jeruk, Keranjang B berisi 7 jeruk. Mana yang LEBIH BANYAK?",
            options: ["Keranjang B (7)", "Keranjang A (4)", "Sama Banyak"],
            correctIndex: 0,
            explanation: "7 jeruk lebih banyak daripada 4 jeruk.",
          },
          {
            id: 2,
            question: "8 apel ... daripada 3 apel. Perbandingan yang tepat adalah?",
            options: ["Lebih Banyak", "Lebih Sedikit", "Sama Banyak"],
            correctIndex: 0,
            explanation: "8 apel tentu lebih banyak dari 3 apel.",
          },
          {
            id: 3,
            question: "Manakah kelompok yang LEBIH SEDIKIT?",
            options: ["2 Balon", "6 Balon", "8 Balon"],
            correctIndex: 0,
            explanation: "2 balon adalah jumlah yang paling sedikit.",
          },
          {
            id: 4,
            question: "5 pensil ... 5 pensil. Pernyataan yang benar adalah?",
            options: ["Sama Banyak", "Lebih Banyak", "Lebih Sedikit"],
            correctIndex: 0,
            explanation: "Jumlahnya sama-sama 5, jadi sama banyak.",
          },
          {
            id: 5,
            question: "Mana jumlah yang LEBIH BANYAK: 9 permen atau 6 permen?",
            options: ["9 Permen", "6 Permen", "Sama Banyak"],
            correctIndex: 0,
            explanation: "9 permen lebih banyak daripada 6 permen.",
          },
          {
            id: 6,
            question: "Piring A ada 2 kue, Piring B ada 5 kue. Piring mana yang LEBIH SEDIKIT?",
            options: ["Piring A (2)", "Piring B (5)", "Sama Banyak"],
            correctIndex: 0,
            explanation: "Piring A berisi 2 kue (lebih sedikit).",
          },
          {
            id: 7,
            question: "3 buku ... daripada 5 buku.",
            options: ["Lebih Sedikit", "Lebih Banyak", "Sama Banyak"],
            correctIndex: 0,
            explanation: "3 buku lebih sedikit dibandingkan 5 buku.",
          },
          {
            id: 8,
            question: "10 bintang ... daripada 4 bintang.",
            options: ["Lebih Banyak", "Lebih Sedikit", "Sama Banyak"],
            correctIndex: 0,
            explanation: "10 bintang lebih banyak daripada 4 bintang.",
          },
          {
            id: 9,
            question: "Manakah angka yang LEBIH KECIL dari 5?",
            options: ["3", "6", "8"],
            correctIndex: 0,
            explanation: "3 lebih kecil daripada 5.",
          },
          {
            id: 10,
            question: "Manakah angka yang LEBIH BESAR dari 7?",
            options: ["9", "5", "2"],
            correctIndex: 0,
            explanation: "9 lebih besar daripada 7.",
          },
        ],
      };

    case 3:
      return {
        title: "Kereta Angka 1-10",
        conceptText: "Urutan angka selalu bertambah 1 secara berurutan. Setelah angka 1, urutan berikutnya adalah angka 2, lalu angka 3. Sentuh gerbong [ ? ] untuk membuka angka 2!",
        questions: [
          {
            id: 1,
            question: "Lengkapi urutan gerbong kereta: 1, 2, [ ? ], 4, 5. Angka berapa yang hilang?",
            options: ["Angka 3", "Angka 2", "Angka 6"],
            correctIndex: 0,
            explanation: "Setelah 2 adalah angka 3.",
          },
          {
            id: 2,
            question: "Setelah angka 6, urutan angka berikutnya adalah?",
            options: ["7", "5", "8"],
            correctIndex: 0,
            explanation: "Urutan setelah 6 adalah 7.",
          },
          {
            id: 3,
            question: "Lengkapi urutan angka: 4, 5, 6, [ ? ], 8!",
            options: ["7", "9", "6"],
            correctIndex: 0,
            explanation: "Di antara 6 dan 8 adalah angka 7.",
          },
          {
            id: 4,
            question: "Angka yang tepat sebelum angka 4 adalah?",
            options: ["3", "5", "2"],
            correctIndex: 0,
            explanation: "Satu angka sebelum 4 adalah 3.",
          },
          {
            id: 5,
            question: "7, 8, [ ? ], 10. Angka berapakah yang mengisi gerbong kosong?",
            options: ["9", "6", "8"],
            correctIndex: 0,
            explanation: "Setelah angka 8 adalah angka 9.",
          },
          {
            id: 6,
            question: "Urutkan dari angka terkecil: 3, 1, 2!",
            options: ["1, 2, 3", "3, 2, 1", "2, 1, 3"],
            correctIndex: 0,
            explanation: "Urutan dari paling kecil adalah 1, 2, 3.",
          },
          {
            id: 7,
            question: "Angka yang berada di antara 5 dan 7 adalah?",
            options: ["6", "4", "8"],
            correctIndex: 0,
            explanation: "5, 6, 7. Angka di tengah adalah 6.",
          },
          {
            id: 8,
            question: "Hitung mundur: 5, 4, 3, [ ? ], 1!",
            options: ["2", "0", "6"],
            correctIndex: 0,
            explanation: "Hitung mundur: setelah 3 adalah 2.",
          },
          {
            id: 9,
            question: "Setelah angka 9 adalah angka?",
            options: ["10", "8", "7"],
            correctIndex: 0,
            explanation: "Setelah 9 adalah 10.",
          },
          {
            id: 10,
            question: "2, 3, 4, 5, [ ? ]. Angka selanjutnya adalah?",
            options: ["6", "7", "8"],
            correctIndex: 0,
            explanation: "Setelah 5 adalah 6.",
          },
        ],
      };

    case 4:
      return {
        title: "Penjumlahan Gambar Buah",
        conceptText: "Penjumlahan berarti menggabungkan dua kelompok benda. 2 apel ditambah 2 apel sama dengan 4 apel (2 + 2 = 4). Sentuh buah di bawah untuk mencoba!",
        questions: [
          {
            id: 1,
            question: "Ada 3 apel merah ditambah 2 apel hijau. Berapa total seluruh apel?",
            visualHelper: "🍎🍎🍎 + 🍎🍎 = ?",
            options: ["5 Apel", "4 Apel", "6 Apel"],
            correctIndex: 0,
            explanation: "3 + 2 = 5 apel.",
          },
          {
            id: 2,
            question: "4 + 1 = ...",
            options: ["5", "6", "3"],
            correctIndex: 0,
            explanation: "4 ditambah 1 sama dengan 5.",
          },
          {
            id: 3,
            question: "2 jeruk ditambah 2 jeruk sama dengan berapa?",
            visualHelper: "🍊🍊 + 🍊🍊 = ?",
            options: ["4 Jeruk", "3 Jeruk", "5 Jeruk"],
            correctIndex: 0,
            explanation: "2 + 2 = 4 jeruk.",
          },
          {
            id: 4,
            question: "5 + 3 = ...",
            options: ["8", "7", "9"],
            correctIndex: 0,
            explanation: "5 ditambah 3 sama dengan 8.",
          },
          {
            id: 5,
            question: "1 + 6 = ...",
            options: ["7", "8", "6"],
            correctIndex: 0,
            explanation: "1 + 6 = 7.",
          },
          {
            id: 6,
            question: "Di piring ada 4 donat, ibu menaruh 3 donat lagi. Berapa total donat sekarang?",
            options: ["7 Donat", "6 Donat", "8 Donat"],
            correctIndex: 0,
            explanation: "4 + 3 = 7 donat.",
          },
          {
            id: 7,
            question: "6 + 4 = ...",
            options: ["10", "9", "8"],
            correctIndex: 0,
            explanation: "6 + 4 = 10.",
          },
          {
            id: 8,
            question: "2 + 5 = ...",
            options: ["7", "8", "6"],
            correctIndex: 0,
            explanation: "2 + 5 = 7.",
          },
          {
            id: 9,
            question: "3 + 3 = ...",
            options: ["6", "7", "5"],
            correctIndex: 0,
            explanation: "3 + 3 = 6.",
          },
          {
            id: 10,
            question: "7 + 2 = ...",
            options: ["9", "8", "10"],
            correctIndex: 0,
            explanation: "7 + 2 = 9.",
          },
        ],
      };

    case 5:
      return {
        title: "Pengurangan Balon Terbang",
        conceptText: "Pengurangan berarti mengambil atau membuang sebagian benda. 5 balon dikurang 1 meletup sisa 4 balon (5 - 1 = 4). Sentuh balon di bawah untuk meletupkan!",
        questions: [
          {
            id: 1,
            question: "Ada 6 balon melayang, lalu 2 meletup! Berapa sisa balon yang masih terbang?",
            visualHelper: "🎈🎈🎈🎈 (6 - 2 = ?)",
            options: ["4 Balon", "3 Balon", "5 Balon"],
            correctIndex: 0,
            explanation: "6 - 2 = 4 balon.",
          },
          {
            id: 2,
            question: "Ada 5 balon, 1 meletus. Berapa sisa balon?",
            options: ["4 Balon", "3 Balon", "5 Balon"],
            correctIndex: 0,
            explanation: "5 dikurang 1 sisa 4.",
          },
          {
            id: 3,
            question: "7 - 3 = ...",
            options: ["4", "5", "3"],
            correctIndex: 0,
            explanation: "7 - 3 = 4.",
          },
          {
            id: 4,
            question: "4 - 2 = ...",
            options: ["2", "1", "3"],
            correctIndex: 0,
            explanation: "4 - 2 = 2.",
          },
          {
            id: 5,
            question: "Di dahan ada 8 burung, lalu 3 burung terbang. Sisa burung di dahan adalah?",
            options: ["5 Burung", "4 Burung", "6 Burung"],
            correctIndex: 0,
            explanation: "8 - 3 = 5 burung.",
          },
          {
            id: 6,
            question: "9 - 4 = ...",
            options: ["5", "6", "4"],
            correctIndex: 0,
            explanation: "9 - 4 = 5.",
          },
          {
            id: 7,
            question: "5 - 5 = ...",
            options: ["0", "1", "5"],
            correctIndex: 0,
            explanation: "Jika diambil semuanya, sisanya 0.",
          },
          {
            id: 8,
            question: "10 - 2 = ...",
            options: ["8", "7", "9"],
            correctIndex: 0,
            explanation: "10 - 2 = 8.",
          },
          {
            id: 9,
            question: "Budi punya 6 permen, lalu dimakan 2 permen. Berapa sisa permen Budi?",
            options: ["4 Permen", "3 Permen", "5 Permen"],
            correctIndex: 0,
            explanation: "6 - 2 = 4 permen.",
          },
          {
            id: 10,
            question: "8 - 5 = ...",
            options: ["3", "2", "4"],
            correctIndex: 0,
            explanation: "8 - 5 = 3.",
          },
        ],
      };

    case 6:
      return {
        title: "Mengenal Bangun Datar",
        conceptText: "Bangun datar memiliki bentuk khusus. Kotak kado berbentuk Persegi karena memiliki 4 sisi sama panjang. Sentuh gambar kado di bawah!",
        questions: [
          {
            id: 1,
            question: "Bentuk RODA Sepeda mirip dengan bangun datar apa?",
            options: ["Lingkaran", "Segitiga", "Persegi"],
            correctIndex: 0,
            explanation: "Roda sepeda berbentuk bulat sempurna, dinamakan Lingkaran.",
          },
          {
            id: 2,
            question: "Bangun datar yang memiliki 3 sisi dan 3 sudut adalah?",
            options: ["Segitiga", "Persegi", "Lingkaran"],
            correctIndex: 0,
            explanation: "Segitiga memiliki 3 sisi.",
          },
          {
            id: 3,
            question: "Buku tulis dan pintu rumah biasanya berbentuk bangun datar apa?",
            options: ["Persegi Panjang", "Lingkaran", "Segitiga"],
            correctIndex: 0,
            explanation: "Pintu rumah berbentuk persegi panjang.",
          },
          {
            id: 4,
            question: "Piring makan di meja umumnya berbentuk?",
            options: ["Lingkaran", "Segitiga", "Persegi"],
            correctIndex: 0,
            explanation: "Piring makan umumnya berbentuk lingkaran.",
          },
          {
            id: 5,
            question: "Bangun datar yang memiliki 4 sisi SAMA PANJANG adalah?",
            options: ["Persegi", "Segitiga", "Lingkaran"],
            correctIndex: 0,
            explanation: "Persegi memiliki 4 sisi yang sama panjang.",
          },
          {
            id: 6,
            question: "Potongan pizza berbentuk mirip dengan bangun datar apa?",
            options: ["Segitiga", "Persegi", "Lingkaran"],
            correctIndex: 0,
            explanation: "Satu potongan pizza menyerupai segitiga.",
          },
          {
            id: 7,
            question: "Uang koin logam berbentuk bangun datar?",
            options: ["Lingkaran", "Persegi Panjang", "Segitiga"],
            correctIndex: 0,
            explanation: "Uang koin berbentuk lingkaran bulat.",
          },
          {
            id: 8,
            question: "Kotak kado persegi memiliki berapa sisi?",
            options: ["4 Sisi", "3 Sisi", "5 Sisi"],
            correctIndex: 0,
            explanation: "Persegi memiliki 4 sisi.",
          },
          {
            id: 9,
            question: "Atap rumah tampak depan berbentuk?",
            options: ["Segitiga", "Lingkaran", "Persegi"],
            correctIndex: 0,
            explanation: "Atap rumah umumnya berbentuk segitiga.",
          },
          {
            id: 10,
            question: "Permukaan layar televisi berbentuk?",
            options: ["Persegi Panjang", "Lingkaran", "Segitiga"],
            correctIndex: 0,
            explanation: "Layar televisi berbentuk persegi panjang.",
          },
        ],
      };

    case 7:
      return {
        title: "Membandingkan Panjang Benda",
        conceptText: "Benda yang lebih panjang memiliki ukuran melintang yang lebih jauh. Penggaris B lebih panjang daripada Penggaris A. Sentuh penggaris di bawah!",
        questions: [
          {
            id: 1,
            question: "Pensil A pendek, Pensil B melintang lebih jauh. Pensil mana yang LEBIH PANJANG?",
            options: ["Pensil B", "Pensil A", "Sama Panjang"],
            correctIndex: 0,
            explanation: "Pensil B memiliki ukuran lebih panjang.",
          },
          {
            id: 2,
            question: "Antara jerapah dan kelinci, hewan mana yang LEBIH TINGGI?",
            options: ["Jerapah", "Kelinci", "Sama Tinggi"],
            correctIndex: 0,
            explanation: "Jerapah adalah hewan yang berleher panjang dan lebih tinggi.",
          },
          {
            id: 3,
            question: "Penggaris 30 cm ... daripada penggaris 15 cm.",
            options: ["Lebih Panjang", "Lebih Pendek", "Sama Panjang"],
            correctIndex: 0,
            explanation: "30 cm lebih panjang daripada 15 cm.",
          },
          {
            id: 4,
            question: "Manakah benda yang LEBIH PENDEK: Penghapus atau Penggaris?",
            options: ["Penghapus", "Penggaris", "Sama Panjang"],
            correctIndex: 0,
            explanation: "Penghapus ukurannya lebih pendek.",
          },
          {
            id: 5,
            question: "Pohon kelapa ... daripada rumput di halaman.",
            options: ["Lebih Tinggi", "Lebih Rendah", "Sama Tinggi"],
            correctIndex: 0,
            explanation: "Pohon kelapa jauh lebih tinggi.",
          },
          {
            id: 6,
            question: "Antara mobil bus dan sepeda mini, mana yang LEBIH PANJANG?",
            options: ["Mobil Bus", "Sepeda Mini", "Sama Panjang"],
            correctIndex: 0,
            explanation: "Mobil bus berukuran jauh lebih panjang.",
          },
          {
            id: 7,
            question: "Pensil baru ... daripada pensil yang sudah sering diraut pendek.",
            options: ["Lebih Panjang", "Lebih Pendek", "Sama Panjang"],
            correctIndex: 0,
            explanation: "Pensil baru berukuran lebih panjang.",
          },
          {
            id: 8,
            question: "Tiang bendera ... daripada pagar tanaman sekolah.",
            options: ["Lebih Tinggi", "Lebih Rendah", "Sama Tinggi"],
            correctIndex: 0,
            explanation: "Tiang bendera menjulang lebih tinggi.",
          },
          {
            id: 9,
            question: "Jari telunjuk tangan ... daripada jari kelingking.",
            options: ["Lebih Panjang", "Lebih Pendek", "Sama Panjang"],
            correctIndex: 0,
            explanation: "Jari telunjuk lebih panjang daripada kelingking.",
          },
          {
            id: 10,
            question: "Tali A (5 jengkal) dan Tali B (2 jengkal). Tali mana yang LEBIH PANJANG?",
            options: ["Tali A (5 jengkal)", "Tali B (2 jengkal)", "Sama Panjang"],
            correctIndex: 0,
            explanation: "5 jengkal lebih panjang daripada 2 jengkal.",
          },
        ],
      };

    case 8:
      return {
        title: "Jam Analog & Waktu",
        conceptText: "Jarum pendek menunjukkan angka jam. Anak SD bangun pagi pada pukul 06.00 Pagi. Coba putar jam di bawah ke Pukul 6!",
        questions: [
          {
            id: 1,
            question: "Jam berapa anak SD berangkat sekolah di pagi hari?",
            options: ["Jam 7 Pagi", "Jam 12 Malam", "Jam 3 Sore"],
            correctIndex: 0,
            explanation: "Anak SD berangkat sekolah pukul 07.00 pagi.",
          },
          {
            id: 2,
            question: "Jarum pendek pada jam dinding menunjukkan?",
            options: ["Waktu Jam", "Waktu Menit", "Waktu Detik"],
            correctIndex: 0,
            explanation: "Jarum pendek menunjukkan angka jam.",
          },
          {
            id: 3,
            question: "Jika jarum pendek di angka 8 dan jarum panjang di angka 12, waktu menunjukkan?",
            options: ["Pukul 08.00", "Pukul 12.00", "Pukul 08.12"],
            correctIndex: 0,
            explanation: "Waktu menunjukkan pukul 08.00 tepat.",
          },
          {
            id: 4,
            question: "Saat matahari tepat di atas kepala tengah hari, waktu menunjukkan?",
            options: ["Pukul 12.00 Siang", "Pukul 06.00 Pagi", "Pukul 12.00 Malam"],
            correctIndex: 0,
            explanation: "Tengah hari adalah pukul 12.00 siang.",
          },
          {
            id: 5,
            question: "Jarum panjang di angka 12, jarum pendek di angka 5. Waktu menunjukkan pukul?",
            options: ["Pukul 05.00", "Pukul 12.05", "Pukul 05.12"],
            correctIndex: 0,
            explanation: "Waktu menunjukkan pukul lima tepat (05.00).",
          },
          {
            id: 6,
            question: "Waktu untuk sarapan pagi dilakukan pada?",
            options: ["Pagi Hari", "Malam Hari", "Sore Hari"],
            correctIndex: 0,
            explanation: "Sarapan dilakukan pada pagi hari.",
          },
          {
            id: 7,
            question: "Setelah siang hari, waktu berganti menjadi?",
            options: ["Sore Hari", "Pagi Hari", "Subuh"],
            correctIndex: 0,
            explanation: "Setelah siang adalah sore hari.",
          },
          {
            id: 8,
            question: "Anak-anak tidur malam biasanya pada?",
            options: ["Malam Hari (Jam 9 Malam)", "Siang Hari", "Pagi Hari"],
            correctIndex: 0,
            explanation: "Tidur malam dilakukan pada malam hari.",
          },
          {
            id: 9,
            question: "Jarum pendek di angka 9 dan jarum panjang di angka 12 menunjukkan pukul?",
            options: ["Pukul 09.00", "Pukul 12.00", "Pukul 09.30"],
            correctIndex: 0,
            explanation: "Menunjukkan pukul sembilan tepat (09.00).",
          },
          {
            id: 10,
            question: "Berapa jumlah angka jam pada jam analog dinding?",
            options: ["12 Angka", "24 Angka", "60 Angka"],
            correctIndex: 0,
            explanation: "Jam analog memiliki angka dari 1 sampai 12.",
          },
        ],
      };

    case 9:
      return {
        title: "Nilai Tempat Puluhan & Satuan (11-20)",
        conceptText: "Nilai tempat puluhan: Angka 12 terdiri dari 1 Puluhan (10) dan 2 Satuan (2). Jadi 10 + 2 = 12. Sentuh gambar di bawah!",
        questions: [
          {
            id: 1,
            question: "1 ikat pensil berisi 10 (Puluhan), ditambah 4 pensil satuan. Berapa jumlah seluruhnya?",
            options: ["14", "12", "16"],
            correctIndex: 0,
            explanation: "10 + 4 = 14.",
          },
          {
            id: 2,
            question: "Angka 15 terdiri dari?",
            options: ["1 Puluhan dan 5 Satuan", "5 Puluhan dan 1 Satuan", "15 Puluhan"],
            correctIndex: 0,
            explanation: "15 = 10 (1 Puluhan) + 5 (Satuan).",
          },
          {
            id: 3,
            question: "10 + 7 = ...",
            options: ["17", "18", "16"],
            correctIndex: 0,
            explanation: "10 + 7 = 17.",
          },
          {
            id: 4,
            question: "Pada bilangan 18, angka 1 menempati nilai tempat?",
            options: ["Puluhan", "Satuan", "Ratusan"],
            correctIndex: 0,
            explanation: "Angka 1 bernilai 10 (puluhan).",
          },
          {
            id: 5,
            question: "Pada bilangan 16, angka 6 menempati nilai tempat?",
            options: ["Satuan", "Puluhan", "Ratusan"],
            correctIndex: 0,
            explanation: "Angka 6 berada di belakang, menempati nilai satuan.",
          },
          {
            id: 6,
            question: "1 puluhan ditambah 3 satuan membentuk bilangan?",
            options: ["13", "31", "30"],
            correctIndex: 0,
            explanation: "10 + 3 = 13.",
          },
          {
            id: 7,
            question: "10 + 9 = ...",
            options: ["19", "20", "18"],
            correctIndex: 0,
            explanation: "10 + 9 = 19.",
          },
          {
            id: 8,
            question: "Bilangan 20 terdiri dari?",
            options: ["2 Puluhan dan 0 Satuan", "1 Puluhan dan 0 Satuan", "2 Satuan"],
            correctIndex: 0,
            explanation: "20 = 2 Puluhan (20).",
          },
          {
            id: 9,
            question: "1 ikat sedotan (10) ditambah 2 sedotan satuan menjadi?",
            options: ["12", "20", "10"],
            correctIndex: 0,
            explanation: "10 + 2 = 12.",
          },
          {
            id: 10,
            question: "1 Puluhan + 8 Satuan = ...",
            options: ["18", "81", "108"],
            correctIndex: 0,
            explanation: "10 + 8 = 18.",
          },
        ],
      };

    case 10:
    default:
      return {
        title: "Ujian Master Matematika Kelas 1",
        conceptText: "Latihan konsep Ujian Master: 4 ditambah 4 sama dengan 8 (4 + 4 = 8). Jika sudah paham, tekan tombol Mulai Game!",
        questions: [
          {
            id: 1,
            question: "Berapa 5 ditambah 5?",
            visualHelper: "5 + 5 = ?",
            options: ["10", "8", "12"],
            correctIndex: 0,
            explanation: "5 + 5 = 10.",
          },
          {
            id: 2,
            question: "Berapa 10 dikurang 4?",
            visualHelper: "10 - 4 = ?",
            options: ["6", "5", "7"],
            correctIndex: 0,
            explanation: "10 - 4 = 6.",
          },
          {
            id: 3,
            question: "Urutan angka setelah 7, 8, 9 adalah?",
            options: ["10", "6", "11"],
            correctIndex: 0,
            explanation: "Setelah 9 adalah 10.",
          },
          {
            id: 4,
            question: "Bangun datar yang tidak memiliki sudut adalah?",
            options: ["Lingkaran", "Segitiga", "Persegi"],
            correctIndex: 0,
            explanation: "Lingkaran berbentuk bulat tanpa sudut.",
          },
          {
            id: 5,
            question: "Manakah yang LEBIH BANYAK: 8 buah apel atau 3 buah apel?",
            options: ["8 Buah", "3 Buah", "Sama Banyak"],
            correctIndex: 0,
            explanation: "8 buah lebih banyak daripada 3 buah.",
          },
          {
            id: 6,
            question: "4 + 4 = ...",
            options: ["8", "7", "9"],
            correctIndex: 0,
            explanation: "4 + 4 = 8.",
          },
          {
            id: 7,
            question: "9 - 3 = ...",
            options: ["6", "5", "7"],
            correctIndex: 0,
            explanation: "9 - 3 = 6.",
          },
          {
            id: 8,
            question: "Jam dinding menunjukkan jarum pendek di angka 6 dan jarum panjang di angka 12. Pukul berapakah itu?",
            options: ["Pukul 06.00", "Pukul 12.00", "Pukul 06.12"],
            correctIndex: 0,
            explanation: "Menunjukkan pukul enam tepat (06.00).",
          },
          {
            id: 9,
            question: "1 Puluhan + 6 Satuan sama dengan?",
            options: ["16", "61", "10"],
            correctIndex: 0,
            explanation: "10 + 6 = 16.",
          },
          {
            id: 10,
            question: "7 + 3 = ...",
            options: ["10", "9", "8"],
            correctIndex: 0,
            explanation: "7 + 3 = 10.",
          },
        ],
      };
  }
}
