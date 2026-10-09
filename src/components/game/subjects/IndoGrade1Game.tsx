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

interface IndoGrade1GameProps {
  levelId: number;
  onLevelComplete: (levelId: number, starsEarned: number) => void;
  accessibilityMode?: string;
}

export function IndoGrade1Game({ levelId, onLevelComplete, accessibilityMode }: IndoGrade1GameProps) {
  // Game Phase: "materi" (Belajar Dulu) or "game" (Main Tantangan)
  const [phase, setPhase] = useState<"materi" | "game">("materi");

  // Phase 1 interactive state
  const [activeVowel, setActiveVowel] = useState<string>("A");
  const [activeWordPair, setActiveWordPair] = useState<{ s1: string; s2: string; result: string; icon: string }>({
    s1: "BU",
    s2: "KU",
    result: "BUKU",
    icon: "📚",
  });
  const [activeMagicWord, setActiveMagicWord] = useState<string>("Tolong");
  const [activeSentence, setActiveSentence] = useState<{ s: string; p: string; o: string }>({
    s: "Budi",
    p: "membaca",
    o: "buku",
  });

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
    setActiveVowel("A");
    setActiveWordPair({ s1: "BU", s2: "KU", result: "BUKU", icon: "📚" });
    setActiveMagicWord("Tolong");
    setActiveSentence({ s: "Budi", p: "membaca", o: "buku" });

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
          speakGlobal(`Luar biasa! Kamu telah menyelesaikan 10 soal Bahasa Indonesia dan meraih ${stars} bintang!`);
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
            BAHASA INDONESIA KELAS 1 SD • LEVEL {levelId} dari 6
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
              <div className="w-full flex flex-col items-center space-y-4">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Klik Huruf Vokal untuk Mendengar Bunyinya:
                </span>
                <div className="flex gap-2 sm:gap-3 flex-wrap justify-center">
                  {[
                    { h: "A", word: "Apel", icon: "🍎" },
                    { h: "I", word: "Ikan", icon: "🐟" },
                    { h: "U", word: "Udang", icon: "🦐" },
                    { h: "E", word: "Elang", icon: "🦅" },
                    { h: "O", word: "Obor", icon: "🔥" },
                  ].map((item) => (
                    <button
                      key={item.h}
                      type="button"
                      onClick={() => {
                        setActiveVowel(item.h);
                        playPopSound();
                        speakGlobal(`Huruf vokal ${item.h}, contohnya ${item.word}`);
                      }}
                      className={`w-14 h-16 sm:w-16 sm:h-20 rounded-2xl border-4 border-[#3C632A] flex flex-col items-center justify-center transition-all cursor-pointer font-black text-2xl shadow-[3px_3px_0px_0px_#3C632A] ${
                        activeVowel === item.h
                          ? "bg-[#FF5685] text-white scale-110 shadow-[5px_5px_0px_0px_#3C632A]"
                          : "bg-[#FFE296] text-[#3C632A] hover:bg-white"
                      }`}
                    >
                      <span>{item.h}</span>
                      <span className="text-xs">{item.icon}</span>
                    </button>
                  ))}
                </div>
                <div className="p-3 bg-teal-50 border-2 border-teal-300 rounded-xl text-center text-xs font-black text-teal-900 w-full">
                  Huruf {activeVowel} menghasilkan bunyi pelafalan vokal yang jelas! Huruf lainnya (B, C, D, ...) adalah huruf konsonan.
                </div>
              </div>
            )}

            {levelId === 2 && (
              <div className="w-full flex flex-col items-center space-y-4">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Merangkai Suku Kata Menjadi Kata Sederhana:
                </span>
                <div className="flex items-center space-x-3 bg-amber-50 p-4 rounded-2xl border-2 border-[#3C632A]">
                  <span className="px-4 py-2 bg-[#FFDF59] rounded-xl font-black text-xl border-2 border-[#3C632A]">
                    {activeWordPair.s1}
                  </span>
                  <span className="text-2xl font-black text-[#C3631D]">+</span>
                  <span className="px-4 py-2 bg-[#FFDF59] rounded-xl font-black text-xl border-2 border-[#3C632A]">
                    {activeWordPair.s2}
                  </span>
                  <span className="text-2xl font-black text-[#3C632A]">=</span>
                  <div className="px-4 py-2 bg-[#7FD13B] text-white rounded-xl font-black text-xl border-2 border-[#3C632A] flex items-center space-x-2">
                    <span>{activeWordPair.result}</span>
                    <span>{activeWordPair.icon}</span>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap justify-center">
                  {[
                    { s1: "BU", s2: "KU", result: "BUKU", icon: "📚" },
                    { s1: "BO", s2: "LA", result: "BOLA", icon: "⚽" },
                    { s1: "ME", s2: "JA", result: "MEJA", icon: "🪑" },
                    { s1: "KA", s2: "KI", result: "KAKI", icon: "🦶" },
                  ].map((w) => (
                    <button
                      key={w.result}
                      type="button"
                      onClick={() => {
                        setActiveWordPair(w);
                        playPopSound();
                        speakGlobal(`${w.s1} ditambah ${w.s2} menjadi kata ${w.result}`);
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-[#FFE296] border-2 border-[#3C632A] rounded-xl text-xs font-black cursor-pointer"
                    >
                      {w.result}
                    </button>
                  ))}
                </div>
                <div className="text-[11px] font-bold text-slate-600 text-center">
                  💡 Tips menulis: Duduk tegak dengan punggung lurus, pegang pensil dengan santai di antara ibu jari dan jari telunjuk!
                </div>
              </div>
            )}

            {levelId === 3 && (
              <div className="w-full flex flex-col items-center space-y-3 text-center">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Kartu Perkenalan Diri yang Santun:
                </span>
                <div className="p-4 bg-yellow-50 border-2 border-[#3C632A] rounded-2xl w-full text-left space-y-1.5 shadow-inner">
                  <p className="text-sm font-extrabold text-[#3C632A]">👋 <strong>Halo, perkenalkan!</strong></p>
                  <p className="text-xs font-bold text-slate-800">• Nama saya: <strong>Hafiz Rizky</strong></p>
                  <p className="text-xs font-bold text-slate-800">• Umur: <strong>7 tahun</strong></p>
                  <p className="text-xs font-bold text-slate-800">• Sekolah: <strong>Kelas 1 SD</strong></p>
                  <p className="text-xs font-bold text-slate-800">• Senang berkenalan dengan teman-teman semua!</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playPopSound();
                    speakGlobal("Halo, perkenalkan! Nama saya Hafiz Rizky. Umur saya 7 tahun. Senang berkenalan denganmu!");
                  }}
                  className="px-4 py-2 bg-[#7FD13B] text-white rounded-xl border-2 border-[#3C632A] text-xs font-black hover:scale-105 transition-transform"
                >
                  🔊 Dengarkan Contoh Perkenalan
                </button>
              </div>
            )}

            {levelId === 4 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Aturan Kalimat Sederhana:
                </span>
                <div className="p-4 bg-emerald-50 border-2 border-[#3C632A] rounded-2xl w-full text-center">
                  <span className="text-lg md:text-xl font-black text-[#3C632A]">
                    <span className="text-[#FF5685] underline">B</span>udi membaca buku<span className="text-[#FF5685] font-black">.</span>
                  </span>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-bold text-emerald-950">
                    <div className="p-2 bg-white rounded-lg border border-emerald-300">
                      🅰️ Huruf kapital (besar) di awal kalimat / nama orang.
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-emerald-300">
                      🛑 Tanda titik (.) di akhir kalimat berita.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {levelId === 5 && (
              <div className="w-full flex flex-col items-center space-y-3 text-center">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Dongeng Fabel: Kancil & Kura-Kura 🦌🐢
                </span>
                <p className="text-xs font-medium text-slate-800 bg-amber-50 p-3 rounded-xl border border-amber-300 leading-relaxed text-left">
                  "Suatu hari, Kancil yang lincah menolong Kura-kura yang terbalik tempurungnya. Kura-kura tersenyum bahagia dan mengucapkan terima kasih. Mereka pun bersahabat dan saling tolong-menolong."
                </p>
                <div className="text-[11px] font-black text-[#C3631D]">
                  🌟 Pesan Cerita: Makhluk hidup harus saling membantu dan tidak boleh sombong.
                </div>
              </div>
            )}

            {levelId === 6 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Pilih 4 Kata Ajaib Sehari-hari:
                </span>
                <div className="grid grid-cols-2 gap-2 w-full">
                  {[
                    { word: "Tolong", icon: "🆘", desc: "Saat butuh bantuan orang lain" },
                    { word: "Maaf", icon: "🙏", desc: "Saat berbuat salah atau keliru" },
                    { word: "Terima Kasih", icon: "🎁", desc: "Saat menerima bantuan / hadiah" },
                    { word: "Permisi", icon: "🚪", desc: "Saat lewat di depan orang lain" },
                  ].map((m) => (
                    <button
                      key={m.word}
                      type="button"
                      onClick={() => {
                        setActiveMagicWord(m.word);
                        playPopSound();
                        speakGlobal(`Kata ajaib ${m.word}. Digunakan ${m.desc}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] flex flex-col items-center text-center cursor-pointer transition-all ${
                        activeMagicWord === m.word
                          ? "bg-[#FF5685] text-white scale-102"
                          : "bg-amber-50 text-[#3C632A] hover:bg-white"
                      }`}
                    >
                      <span className="text-lg">{m.icon}</span>
                      <span className="text-xs font-black">{m.word}</span>
                      <span className="text-[10px] font-medium opacity-80">{m.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tombol Mulai Tantangan */}
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
          
          {/* Progress Bar Soal */}
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

          {/* Pertanyaan Card */}
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

          {/* Pilihan Jawaban (3 Tombol Acak: Kiri, Tengah, Kanan) */}
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

          {/* Tombol Bacakan Ulang */}
          <button
            type="button"
            onClick={() => speakGlobal(`Soal nomor ${currentQuestionIndex + 1}. ${currentQ.question}`)}
            className="text-xs font-extrabold text-[#3C632A] underline hover:opacity-80 flex items-center space-x-1"
          >
            <span>🔊 Bacakan Soal Lagi</span>
          </button>
        </div>
      )}

      {/* ================= FASE SELESAI LEVEL ================= */}
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

// ================= DATA SOAL KELAS 1 SD (6 LEVEL x 10 SOAL = 60 SOAL LENGKAP) =================
function getGrade1LevelData(levelId: number): LevelConceptData {
  switch (levelId) {
    case 1:
      return {
        title: "Mengenal Huruf & Bunyi",
        conceptText: "Huruf alfabet terdiri dari huruf vokal (a, i, u, e, o) dan huruf konsonan (b, c, d, ...). Setiap huruf memiliki nama dan bunyi fonemik tersendiri.",
        questions: [
          {
            id: 1,
            question: "Manakah yang merupakan huruf vokal?",
            visualHelper: "🅰️",
            options: ["A", "B", "C"],
            correctIndex: 0,
            explanation: "Huruf A, I, U, E, dan O adalah huruf vokal.",
          },
          {
            id: 2,
            question: "Huruf awal dari kata 'Apel' adalah...",
            visualHelper: "🍎",
            options: ["A", "P", "L"],
            correctIndex: 0,
            explanation: "Kata 'Apel' diawali dengan huruf A.",
          },
          {
            id: 3,
            question: "Manakah di bawah ini yang merupakan huruf konsonan?",
            visualHelper: "🔤",
            options: ["B", "I", "U"],
            correctIndex: 0,
            explanation: "Huruf B adalah huruf konsonan, sedangkan I dan U adalah vokal.",
          },
          {
            id: 4,
            question: "Huruf awal dari hewan 'Ikan' adalah...",
            visualHelper: "🐟",
            options: ["I", "K", "N"],
            correctIndex: 0,
            explanation: "Kata 'Ikan' dimulai dengan huruf I.",
          },
          {
            id: 5,
            question: "Ada berapakah jumlah huruf vokal dalam abjad bahasa Indonesia?",
            visualHelper: "🖐️",
            options: ["5", "3", "7"],
            correctIndex: 0,
            explanation: "Huruf vokal ada 5, yaitu: a, i, u, e, dan o.",
          },
          {
            id: 6,
            question: "Hewan 'Udang' diawali dengan huruf vokal apa?",
            visualHelper: "🦐",
            options: ["U", "O", "E"],
            correctIndex: 0,
            explanation: "Udang diawali dengan huruf U.",
          },
          {
            id: 7,
            question: "Huruf kapital dari huruf 'b' kecil adalah...",
            visualHelper: "📝",
            options: ["B", "D", "P"],
            correctIndex: 0,
            explanation: "Bentuk huruf besar dari b adalah B.",
          },
          {
            id: 8,
            question: "Huruf awal dari benda 'Buku' adalah...",
            visualHelper: "📚",
            options: ["B", "K", "U"],
            correctIndex: 0,
            explanation: "Kata 'Buku' diawali dengan huruf konsonan B.",
          },
          {
            id: 9,
            question: "Manakah kata yang diawali dengan huruf vokal O?",
            visualHelper: "🔥",
            options: ["Obor", "Bebek", "Kucing"],
            correctIndex: 0,
            explanation: "'Obor' diawali dengan huruf vokal O.",
          },
          {
            id: 10,
            question: "Bunyi huruf pertama pada kata 'Sapi' adalah...",
            visualHelper: "🐄",
            options: ["S", "P", "A"],
            correctIndex: 0,
            explanation: "Kata 'Sapi' diawali bunyi huruf konsonan S.",
          },
        ],
      };

    case 2:
      return {
        title: "Membaca & Menulis Permulaan",
        conceptText: "Huruf dirangkai menjadi suku kata, lalu menjadi kata (misal: b-u + k-u = buku). Saat menulis, duduklah tegak dan pegang pensil dengan benar.",
        questions: [
          {
            id: 1,
            question: "Suku kata 'ba' dan 'tu' jika digabungkan menjadi kata...",
            visualHelper: "🧱",
            options: ["Batu", "Bata", "Tuba"],
            correctIndex: 0,
            explanation: "ba + tu = batu.",
          },
          {
            id: 2,
            question: "Suku kata 'bu' dan 'ku' jika digabung menjadi kata...",
            visualHelper: "📚",
            options: ["Buku", "Buka", "Kuku"],
            correctIndex: 0,
            explanation: "bu + ku = buku.",
          },
          {
            id: 3,
            question: "Bagaimanakah posisi duduk yang baik saat menulis di meja?",
            visualHelper: "🪑",
            options: ["Duduk tegak", "Membungkuk dekat buku", "Tidur di atas meja"],
            correctIndex: 0,
            explanation: "Duduk tegak menjaga kesehatan tulang punggung dan mata kita.",
          },
          {
            id: 4,
            question: "Suku kata 'bo' dan 'la' jika dirangkai membentuk kata apa?",
            visualHelper: "⚽",
            options: ["Bola", "Bolu", "Pola"],
            correctIndex: 0,
            explanation: "bo + la = bola.",
          },
          {
            id: 5,
            question: "Cara memegang pensil yang tepat adalah dijepit dengan jari...",
            visualHelper: "✏️",
            options: ["Ibu jari dan telunjuk", "Semua lima jari mengepal", "Jari kelingking saja"],
            correctIndex: 0,
            explanation: "Pensil dijepit santai antara ibu jari dan jari telunjuk serta ditopang jari tengah.",
          },
          {
            id: 6,
            question: "Kata 'meja' terdiri dari suku kata apa saja?",
            visualHelper: "🪑",
            options: ["me - ja", "m - eja", "mej - a"],
            correctIndex: 0,
            explanation: "Kata 'meja' dipenggal menjadi dua suku kata: me-ja.",
          },
          {
            id: 7,
            question: "Suku kata 'ka' dan 'ki' jika dibaca bersamaan menjadi...",
            visualHelper: "🦶",
            options: ["Kaki", "Kaka", "Kiku"],
            correctIndex: 0,
            explanation: "ka + ki = kaki.",
          },
          {
            id: 8,
            question: "Huruf-huruf 's-u-s-u' jika dibaca bersambung menjadi...",
            visualHelper: "🥛",
            options: ["Susu", "Sapu", "Siku"],
            correctIndex: 0,
            explanation: "s-u (su) dan s-u (su) membentuk kata susu.",
          },
          {
            id: 9,
            question: "Berapa jarak yang ideal antara mata dan buku saat membaca?",
            visualHelper: "👀",
            options: ["Sekitar 30 cm", "Menempel di muka", "1 meter lebih"],
            correctIndex: 0,
            explanation: "Jarak sekitar 30 cm melindungi kesehatan mata agar tidak cepat lelah.",
          },
          {
            id: 10,
            question: "Suku kata 'ma' dan 'ma' membentuk kata panggilan...",
            visualHelper: "👩",
            options: ["Mama", "Mata", "Madu"],
            correctIndex: 0,
            explanation: "ma + ma = mama.",
          },
        ],
      };

    case 3:
      return {
        title: "Perkenalan Diri & Lingkungan",
        conceptText: "Saat memperkenalkan diri, sampaikan nama lengkap, nama panggilan, alamat, dan anggota keluarga dengan suara jelas, senyum, dan sikap santun.",
        questions: [
          {
            id: 1,
            question: "Saat baru pertama kali bertemu teman baru, kita sebaiknya mengucapkan...",
            visualHelper: "🤝",
            options: ["Halo, salam kenal", "Pergi sana", "Diam saja"],
            correctIndex: 0,
            explanation: "Menyapa dengan 'Halo, salam kenal' menunjukkan sikap ramah dan santun.",
          },
          {
            id: 2,
            question: "Informasi utama yang disampaikan saat perkenalan diri adalah...",
            visualHelper: "🗣️",
            options: ["Nama diri", "Harga sepatu", "Nomor sepatu"],
            correctIndex: 0,
            explanation: "Nama adalah identitas utama yang paling penting saat berkenalan.",
          },
          {
            id: 3,
            question: "Keluarga inti di rumah biasanya terdiri dari...",
            visualHelper: "👨‍👩‍👧‍👦",
            options: ["Ayah, Ibu, dan Anak", "Tetangga dan Satpam", "Pedagang dan Pembeli"],
            correctIndex: 0,
            explanation: "Keluarga inti terdiri dari ayah, ibu, dan anak.",
          },
          {
            id: 4,
            question: "Sikap tubuh yang sopan saat memperkenalkan diri adalah...",
            visualHelper: "🧍",
            options: ["Berdiri tegak dan tersenyum", "Membelakangi teman", "Sambil tiduran di lantai"],
            correctIndex: 0,
            explanation: "Berdiri tegak dan tersenyum ramah adalah sikap terpuji.",
          },
          {
            id: 5,
            question: "'Nama panggilanku adalah Budi.' Kata 'Budi' merupakan...",
            visualHelper: "🏷️",
            options: ["Nama orang", "Nama buah", "Nama jalan"],
            correctIndex: 0,
            explanation: "Budi adalah nama orang atau nama panggilan diri.",
          },
          {
            id: 6,
            question: "Jika teman bertanya 'Di mana rumahmu?', teman ingin tahu tentang...",
            visualHelper: "🏠",
            options: ["Alamat rumah", "Nama hewan", "Warna baju"],
            correctIndex: 0,
            explanation: "Pertanyaan tempat tinggal bertujuan mengetahui alamat rumah.",
          },
          {
            id: 7,
            question: "Saudara laki-laki yang lebih muda dari kita disebut...",
            visualHelper: "👦",
            options: ["Adik laki-laki", "Paman", "Kakek"],
            correctIndex: 0,
            explanation: "Saudara yang lebih muda dipanggil adik.",
          },
          {
            id: 8,
            question: "Saudara yang usianya lebih tua dari kita dipanggil...",
            visualHelper: "👧",
            options: ["Kakak", "Adik", "Cucu"],
            correctIndex: 0,
            explanation: "Saudara yang lahir lebih dulu dan lebih tua dipanggil kakak.",
          },
          {
            id: 9,
            question: "Saat teman mengenalkan namanya, kita sebaiknya menyimak dengan...",
            visualHelper: "👂",
            options: ["Mendengarkan baik-baik", "Mengobrol sendiri", "Tutup telinga"],
            correctIndex: 0,
            explanation: "Mendengarkan dengan baik menunjukkan kita menghargai teman.",
          },
          {
            id: 10,
            question: "Orang tua perempuan yang melahirkan dan merawat kita dipanggil...",
            visualHelper: "👩‍👧",
            options: ["Ibu", "Paman", "Bibi"],
            correctIndex: 0,
            explanation: "Orang tua perempuan dipanggil ibu atau mama.",
          },
        ],
      };

    case 4:
      return {
        title: "Kalimat Sederhana",
        conceptText: "Kalimat sederhana terdiri dari 2–3 kata. Kalimat diawali huruf kapital (besar) dan diakhiri tanda baca titik (.) untuk kalimat berita.",
        questions: [
          {
            id: 1,
            question: "Huruf pertama pada awal kalimat harus menggunakan huruf...",
            visualHelper: "🔠",
            options: ["Kapital (Besar)", "Kecil", "Angka"],
            correctIndex: 0,
            explanation: "Awal setiap kalimat selalu menggunakan huruf kapital (huruf besar).",
          },
          {
            id: 2,
            question: "Tanda baca di akhir kalimat berita adalah tanda...",
            visualHelper: "🛑",
            options: ["Titik (.)", "Tanya (?)", "Koma (,)"],
            correctIndex: 0,
            explanation: "Kalimat berita diakhiri dengan tanda titik (.).",
          },
          {
            id: 3,
            question: "Manakah susunan kalimat pendek yang benar dan runtut?",
            visualHelper: "📖",
            options: ["Saya membaca buku.", "Membaca buku saya.", "Buku saya membaca."],
            correctIndex: 0,
            explanation: "'Saya membaca buku.' memiliki susunan subjek-predikat-objek yang teratur.",
          },
          {
            id: 4,
            question: "Penulisan nama orang 'ani' yang tepat pada kalimat adalah...",
            visualHelper: "👧",
            options: ["Ani", "ani", "aNi"],
            correctIndex: 0,
            explanation: "Nama orang selalu diawali dengan huruf kapital (Ani).",
          },
          {
            id: 5,
            question: "Manakah kalimat yang penulisannya paling tepat?",
            visualHelper: "✅",
            options: ["Ibu memasak nasi.", "ibu memasak nasi", "Ibu memasak nasi?"],
            correctIndex: 0,
            explanation: "'Ibu memasak nasi.' diawali huruf kapital dan diakhiri tanda titik.",
          },
          {
            id: 6,
            question: "Kata 'Budi makan roti' terdiri dari berapa kata?",
            visualHelper: "🍞",
            options: ["3 kata", "2 kata", "4 kata"],
            correctIndex: 0,
            explanation: "Ada 3 kata: (1) Budi, (2) makan, (3) roti.",
          },
          {
            id: 7,
            question: "Kalimat 'Adik minum susu.' menceritakan tentang kegiatan...",
            visualHelper: "🥛",
            options: ["Adik minum susu", "Adik tidur siang", "Adik bermain bola"],
            correctIndex: 0,
            explanation: "Isi kalimat tersebut adalah adik yang sedang minum susu.",
          },
          {
            id: 8,
            question: "Lengkapilah kalimat ini: 'Siti menyiram ... di halaman.'",
            visualHelper: "🌸",
            options: ["bunga", "batu", "meja"],
            correctIndex: 0,
            explanation: "Benda yang disiram air di halaman adalah bunga atau tanaman.",
          },
          {
            id: 9,
            question: "Apa fungsi tanda titik (.) di ujung kalimat?",
            visualHelper: "⏹️",
            options: ["Menandakan kalimat sudah selesai", "Menandakan bertanya", "Menandakan marah"],
            correctIndex: 0,
            explanation: "Tanda titik menghentikan atau mengakhiri kalimat.",
          },
          {
            id: 10,
            question: "Manakah pasangan kata yang membentuk kalimat 2 kata yang utuh?",
            visualHelper: "🐈",
            options: ["Kucing tidur.", "Kucing dan.", "Yang tidur."],
            correctIndex: 0,
            explanation: "'Kucing tidur.' adalah kalimat 2 kata yang memiliki makna jelas.",
          },
        ],
      };

    case 5:
      return {
        title: "Mendengarkan Dongeng/Cerita",
        conceptText: "Menyimak dongeng fabel (cerita binatang) melatih daya imajinasi. Setiap dongeng memiliki tokoh hewan, jalan cerita, dan nasihat kebaikan.",
        questions: [
          {
            id: 1,
            question: "Cerita dongeng yang tokoh-tokohnya adalah hewan disebut cerita...",
            visualHelper: "🦊",
            options: ["Fabel", "Kamus", "Berita"],
            correctIndex: 0,
            explanation: "Fabel adalah dongeng yang pelakunya adalah hewan berperilaku seperti manusia.",
          },
          {
            id: 2,
            question: "Dalam dongeng 'Kancil dan Buaya', siapakah tokoh yang cerdik?",
            visualHelper: "🦌",
            options: ["Kancil", "Pohon", "Sungai"],
            correctIndex: 0,
            explanation: "Kancil terkenal sebagai tokoh hewan yang cerdik dalam fabel.",
          },
          {
            id: 3,
            question: "Saat guru membacakan dongeng di depan kelas, kita sebaiknya...",
            visualHelper: "👂",
            options: ["Menyimak dengan tenang", "Bercanda dengan teman", "Tidur di kolong meja"],
            correctIndex: 0,
            explanation: "Menyimak dengan tenang membuat kita memahami isi dan pesan cerita.",
          },
          {
            id: 4,
            question: "Dalam lomba lari antara Kelinci dan Kura-kura, mengapa Kura-kura menang?",
            visualHelper: "🐢",
            options: ["Kura-kura pantang menyerah", "Kura-kura naik sepeda", "Kelinci tidak ikut lari"],
            correctIndex: 0,
            explanation: "Kura-kura terus melangkah tanpa menyerah sementara Kelinci tertidur sombong.",
          },
          {
            id: 5,
            question: "Pesan moral dari cerita Kelinci dan Kura-kura adalah...",
            visualHelper: "⭐",
            options: ["Jangan sombong dan malas", "Boleh mengejek teman", "Lebih baik tidur saat lomba"],
            correctIndex: 0,
            explanation: "Sifat sombong dan meremehkan orang lain akan membawa kerugian.",
          },
          {
            id: 6,
            question: "Tempat terjadinya peristiwa dalam sebuah cerita disebut...",
            visualHelper: "🌳",
            options: ["Latar tempat", "Judul", "Pengarang"],
            correctIndex: 0,
            explanation: "Latar tempat adalah tempat berlangsungnya cerita, misalnya hutan atau sungai.",
          },
          {
            id: 7,
            question: "Tokoh Semut dalam fabel dikenal sebagai hewan yang...",
            visualHelper: "🐜",
            options: ["Rajin bekerja sama", "Suka bermalas-malasan", "Suka berkelahi"],
            correctIndex: 0,
            explanation: "Semut dikenal rajin gotong royong mengumpulkan makanan.",
          },
          {
            id: 8,
            question: "Setelah menyimak cerita, kita dapat menceritakan kembali dengan...",
            visualHelper: "🗣️",
            options: ["Bahasa sendiri secara ringkas", "Menghafal persis seluruh buku", "Mengarang cerita yang lain"],
            correctIndex: 0,
            explanation: "Menceritakan kembali cukup dengan bahasa kita sendiri yang mudah dipahami.",
          },
          {
            id: 9,
            question: "Sifat tokoh yang suka menolong teman dalam dongeng adalah sifat yang...",
            visualHelper: "❤️",
            options: ["Terpuji dan baik", "Jahat", "Tercela"],
            correctIndex: 0,
            explanation: "Suka menolong adalah sifat baik yang patut kita contoh.",
          },
          {
            id: 10,
            question: "Apa tujuan kita mendengarkan dongeng fabel?",
            visualHelper: "📚",
            options: ["Belajar pesan kebaikan dan terhibur", "Supaya mengantuk", "Agar bisa bertengkar"],
            correctIndex: 0,
            explanation: "Dongeng menghibur kita sekaligus mengajarkan pesan moral budi pekerti.",
          },
        ],
      };

    case 6:
      return {
        title: "Ungkapan Sopan Sehari-hari",
        conceptText: "Gunakan 4 kata ajaib dalam pergaulan: Tolong (saat meminta bantuan), Maaf (saat berbuat salah), Terima Kasih (saat menerima bantuan), dan Permisi (saat lewat).",
        questions: [
          {
            id: 1,
            question: "Ketika membutuhkan bantuan orang lain untuk mengambil buku, kita berucap...",
            visualHelper: "🆘",
            options: ["Tolong", "Pergi", "Cepat"],
            correctIndex: 0,
            explanation: "Kata 'Tolong' diucapkan saat kita memohon bantuan secara santun.",
          },
          {
            id: 2,
            question: "Setelah diberi hadiah atau ditolong oleh teman, kita mengucapkan...",
            visualHelper: "🎁",
            options: ["Terima kasih", "Masa bodoh", "Kurang banyak"],
            correctIndex: 0,
            explanation: "'Terima kasih' adalah ungkapan rasa bersyukur dan menghargai orang lain.",
          },
          {
            id: 3,
            question: "Bila kita tidak sengaja menginjak kaki teman, kita harus segera mengucap...",
            visualHelper: "🙏",
            options: ["Maaf", "Biarin", "Hore"],
            correctIndex: 0,
            explanation: "Meminta maaf secara tulus adalah sikap pemberani dan bertanggung jawab.",
          },
          {
            id: 4,
            question: "Ketika hendak lewat di depan orang tua yang sedang duduk, kita mengucapkan...",
            visualHelper: "🚶",
            options: ["Permisi", "Awas", "Minggir"],
            correctIndex: 0,
            explanation: "'Permisi' diucapkan sambil sedikit membungkukkan badan tanda hormat.",
          },
          {
            id: 5,
            question: "Mengucapkan kata tolong, maaf, dan terima kasih adalah contoh sikap...",
            visualHelper: "🌟",
            options: ["Santun dan beradab", "Penakut", "Sombong"],
            correctIndex: 0,
            explanation: "Menggunakan kata-kata santun mencerminkan akhlak terpuji.",
          },
          {
            id: 6,
            question: "Budi meminjam pensil Siti. Apa yang sebaiknya Budi katakan saat meminta izin?",
            visualHelper: "✏️",
            options: ["Bolehkah saya pinjam pensilmu, tolong?", "Pensilmu buat aku saja!", "Cepat berikan pensilmu!"],
            correctIndex: 0,
            explanation: "Meminta izin dengan sopan dan menyertakan kata tolong.",
          },
          {
            id: 7,
            question: "Ibu memberi kue lezat kepada kita. Ucapan yang tepat adalah...",
            visualHelper: "🍰",
            options: ["Terima kasih banyak, Ibu", "Kurang manis kuenya", "Biasa saja rasanya"],
            correctIndex: 0,
            explanation: "Mengucapkan terima kasih kepada ibu adalah bentuk berbakti dan bersyukur.",
          },
          {
            id: 8,
            question: "Saat masuk ke rumah atau ruangan orang lain, sebaiknya kita...",
            visualHelper: "🚪",
            options: ["Mengetuk pintu dan mengucap salam/permisi", "Langsung lari masuk", "Mendobrak pintu"],
            correctIndex: 0,
            explanation: "Mengetuk pintu dan mengucap permisi adalah tata krama masuk ruangan.",
          },
          {
            id: 9,
            question: "Jika teman meminta maaf kepada kita karena tidak sengaja menjatuhkan botol kita, sikap kita...",
            visualHelper: "🤝",
            options: ["Memaafkannya dengan senyum", "Membalas merusak botolnya", "Memarahinya seharian"],
            correctIndex: 0,
            explanation: "Memaafkan kesalahan teman membuat persahabatan tetap rukun dan damai.",
          },
          {
            id: 10,
            question: "Empat kata ajaib dalam percakapan sehari-hari adalah...",
            visualHelper: "✨",
            options: ["Tolong, Maaf, Terima Kasih, Permisi", "Sini, Sana, Pergi, Diam", "Beli, Jual, Bayar, Hutang"],
            correctIndex: 0,
            explanation: "Tolong, Maaf, Terima Kasih, dan Permisi adalah 4 kata ajaib kesantunan.",
          },
        ],
      };

    default:
      return {
        title: "Bahasa Indonesia Kelas 1 SD",
        conceptText: "Materi belajar Bahasa Indonesia dasar.",
        questions: [],
      };
  }
}
