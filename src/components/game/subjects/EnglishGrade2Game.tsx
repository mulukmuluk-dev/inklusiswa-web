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

interface EnglishGrade2GameProps {
  levelId: number;
  onLevelComplete: (levelId: number, starsEarned: number) => void;
  accessibilityMode?: string;
}

export function EnglishGrade2Game({ levelId, onLevelComplete, accessibilityMode }: EnglishGrade2GameProps) {
  const [phase, setPhase] = useState<"materi" | "game">("materi");

  // Phase 1 interactive states
  const [activeNumber2, setActiveNumber2] = useState<{ num: number; word: string }>({ num: 21, word: "Twenty-one" });
  const [activeAnimalType, setActiveAnimalType] = useState<"pets" | "wild">("pets");
  const [activeRoom, setActiveRoom] = useState<{ room: string; indo: string; item: string }>({ room: "Bedroom", indo: "Kamar tidur", item: "Bed (Tempat tidur)" });
  const [activeFoodLike, setActiveFoodLike] = useState<{ food: string; like: boolean }>({ food: "Apples", like: true });
  const [activeCloth, setActiveCloth] = useState<{ cloth: string; indo: string }>({ cloth: "Shirt", indo: "Kemeja" });
  const [activeAction, setActiveAction] = useState<{ verb: string; indo: string }>({ verb: "Run", indo: "Berlari" });
  const [activeDemonstrative, setActiveDemonstrative] = useState<string>("This");

  // Phase 2 states
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState<boolean>(false);
  const [wrongAttempts, setWrongAttempts] = useState<number>(0);
  const [showClue, setShowClue] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [questionsList, setQuestionsList] = useState<QuestionItem[]>([]);
  const isProcessingRef = useRef<boolean>(false);

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
    setActiveNumber2({ num: 21, word: "Twenty-one" });
    setActiveAnimalType("pets");
    setActiveRoom({ room: "Bedroom", indo: "Kamar tidur", item: "Bed (Tempat tidur)" });
    setActiveFoodLike({ food: "Apples", like: true });
    setActiveCloth({ cloth: "Shirt", indo: "Kemeja" });
    setActiveAction({ verb: "Run", indo: "Berlari" });
    setActiveDemonstrative("This");

    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setWrongAttempts(0);
    setShowClue(false);
    setIsCompleted(false);
    isProcessingRef.current = false;

    const data = getGrade2EnglishData(levelId);
    setQuestionsList(shuffleQuestions(data));
    speakGlobal(data.conceptText);
  }, [levelId]);

  const levelData = getGrade2EnglishData(levelId);
  const activeQuestions = questionsList.length > 0 ? questionsList : levelData.questions;
  const currentQ = activeQuestions[currentQuestionIndex] || activeQuestions[0];

  useEffect(() => {
    if (phase === "game" && !isCompleted && currentQ) {
      speakGlobal(`Question number ${currentQuestionIndex + 1}. ${currentQ.question}`);
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
      speakGlobal("Excellent! That is correct! " + currentQ.explanation);

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
          speakGlobal(`Well done! You solved all 10 questions and received ${stars} stars!`);
        }
      }, 1400);
    } else {
      const attempts = wrongAttempts + 1;
      setWrongAttempts(attempts);
      if (attempts >= 2) {
        setShowClue(true);
        playClueChime();
        speakGlobal("Clue: The correct answer is highlighted in green. " + currentQ.explanation);
      } else {
        speakGlobal("Not quite right yet. Try once more!");
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
            KELAS 2 SD • LEVEL {levelId} dari 7
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
                speakGlobal(`Question number ${currentQuestionIndex + 1}. ${currentQ.question}`);
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
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Numbers 21 to 100 (Bilangan Puluhan):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
                  {[
                    { num: 21, word: "Twenty-one" },
                    { num: 30, word: "Thirty" },
                    { num: 45, word: "Forty-five" },
                    { num: 50, word: "Fifty" },
                    { num: 60, word: "Sixty" },
                    { num: 75, word: "Seventy-five" },
                    { num: 90, word: "Ninety" },
                    { num: 100, word: "One hundred" },
                  ].map((item) => (
                    <button
                      key={item.num}
                      type="button"
                      onClick={() => {
                        setActiveNumber2(item);
                        playPopSound();
                        speakGlobal(`Number ${item.num}, ${item.word}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] text-center cursor-pointer transition-all ${
                        activeNumber2.num === item.num
                          ? "bg-[#7FD13B] text-white scale-105 shadow-md"
                          : "bg-white text-[#3C632A] hover:bg-[#FFE296]"
                      }`}
                    >
                      <span className="text-base font-black block">{item.num}</span>
                      <span className="text-[11px] font-bold block">{item.word}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {levelId === 2 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Pets vs Wild Animals (Hewan Peliharaan & Liar):
                </span>
                <div className="grid grid-cols-2 gap-3 w-full text-xs">
                  <div className="p-3 bg-white border-2 border-[#3C632A] rounded-xl shadow-sm text-left">
                    <strong className="text-[#3C632A] block mb-1">Pets (Peliharaan):</strong>
                    Cat (Kucing), Dog (Anjing), Rabbit (Kelinci), Bird (Burung), Fish (Ikan).
                  </div>
                  <div className="p-3 bg-white border-2 border-[#3C632A] rounded-xl shadow-sm text-left">
                    <strong className="text-[#C3631D] block mb-1">Wild Animals (Hewan Liar):</strong>
                    Lion (Singa), Tiger (Harimau), Elephant (Gajah), Monkey (Monyet).
                  </div>
                </div>
              </div>
            )}

            {levelId === 3 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Parts of the House (Ruangan di Rumah):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full text-xs">
                  {[
                    { room: "Bedroom", indo: "Kamar Tidur", item: "Bed (Kasur)" },
                    { room: "Kitchen", indo: "Dapur", item: "Stove (Kompor)" },
                    { room: "Living room", indo: "Ruang Tamu", item: "Sofa" },
                    { room: "Bathroom", indo: "Kamar Mandi", item: "Shower" },
                  ].map((r) => (
                    <button
                      key={r.room}
                      type="button"
                      onClick={() => {
                        setActiveRoom(r);
                        playPopSound();
                        speakGlobal(`${r.room}, ${r.indo}. There is a ${r.item}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] text-center cursor-pointer transition-all ${
                        activeRoom.room === r.room ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block">{r.room}</strong>
                      <span className="text-[10px] opacity-80 block">{r.indo}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {levelId === 4 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Expressing Likes: I like / I do not like:
                </span>
                <div className="grid grid-cols-2 gap-2 w-full text-xs">
                  <div className="p-3 bg-white border-2 border-[#3C632A] rounded-xl text-center shadow-sm">
                    <span className="font-black text-[#3C632A] block mb-1">"I like apples"</span>
                    <span className="text-[10px] text-slate-700">Saya suka buah apel</span>
                  </div>
                  <div className="p-3 bg-white border-2 border-[#3C632A] rounded-xl text-center shadow-sm">
                    <span className="font-black text-[#C3631D] block mb-1">"I do not like coffee"</span>
                    <span className="text-[10px] text-slate-700">Saya tidak suka kopi</span>
                  </div>
                </div>
                <div className="text-[11px] font-bold text-[#3C632A] bg-white/70 px-3 py-1 rounded-lg border border-[#3C632A]">
                  Makanan & Minuman: Rice (Nasi), Bread (Roti), Milk (Susu), Water (Air).
                </div>
              </div>
            )}

            {levelId === 5 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Clothes & Accessories (Pakaian & Aksesori):
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 w-full text-xs">
                  {[
                    { cloth: "Shirt", indo: "Kemeja" },
                    { cloth: "T-shirt", indo: "Kaus" },
                    { cloth: "Pants", indo: "Celana" },
                    { cloth: "Dress", indo: "Gaun" },
                    { cloth: "Shoes", indo: "Sepatu" },
                    { cloth: "Hat", indo: "Topi" },
                    { cloth: "Socks", indo: "Kaus Kaki" },
                    { cloth: "Jacket", indo: "Jaket" },
                  ].map((c) => (
                    <button
                      key={c.cloth}
                      type="button"
                      onClick={() => {
                        setActiveCloth(c);
                        playPopSound();
                        speakGlobal(`${c.cloth}. Artinya ${c.indo}`);
                      }}
                      className={`p-2 rounded-xl border-2 border-[#3C632A] text-center cursor-pointer transition-all ${
                        activeCloth.cloth === c.cloth ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block">{c.cloth}</strong>
                      <span className="text-[10px] opacity-80">{c.indo}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {levelId === 6 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Simple Action Verbs (Kata Kerja Aksi Dasar):
                </span>
                <div className="grid grid-cols-3 gap-2 w-full text-xs">
                  {[
                    { verb: "Run", indo: "Berlari" },
                    { verb: "Walk", indo: "Berjalan" },
                    { verb: "Jump", indo: "Melompat" },
                    { verb: "Sit", indo: "Duduk" },
                    { verb: "Read", indo: "Membaca" },
                    { verb: "Write", indo: "Menulis" },
                  ].map((v) => (
                    <button
                      key={v.verb}
                      type="button"
                      onClick={() => {
                        setActiveAction(v);
                        playPopSound();
                        speakGlobal(`Action ${v.verb}, artinya ${v.indo}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] text-center cursor-pointer transition-all ${
                        activeAction.verb === v.verb ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block">{v.verb}</strong>
                      <span className="text-[10px] opacity-80">{v.indo}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {levelId === 7 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Demonstratives (This, That, These, Those):
                </span>
                <div className="grid grid-cols-2 gap-2 w-full text-xs">
                  <div className="p-2.5 bg-white border border-[#3C632A] rounded-xl shadow-sm text-left">
                    <strong className="text-[#3C632A] block">This (Ini - Tunggal dekat)</strong>
                    <span className="text-[10px] text-slate-700">Contoh: "This is a book."</span>
                  </div>
                  <div className="p-2.5 bg-white border border-[#3C632A] rounded-xl shadow-sm text-left">
                    <strong className="text-[#C3631D] block">That (Itu - Tunggal jauh)</strong>
                    <span className="text-[10px] text-slate-700">Contoh: "That is a cat."</span>
                  </div>
                  <div className="p-2.5 bg-white border border-[#3C632A] rounded-xl shadow-sm text-left">
                    <strong className="text-[#3C632A] block">These (Ini - Jamak dekat)</strong>
                    <span className="text-[10px] text-slate-700">Contoh: "These are pencils."</span>
                  </div>
                  <div className="p-2.5 bg-white border border-[#3C632A] rounded-xl shadow-sm text-left">
                    <strong className="text-[#C3631D] block">Those (Itu - Jamak jauh)</strong>
                    <span className="text-[10px] text-slate-700">Contoh: "Those are birds."</span>
                  </div>
                </div>
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
        <div className="w-full max-w-2xl flex-1 flex flex-col items-center justify-center p-8 bg-white/90 border-4 border-[#3C632A] rounded-[28px] shadow-[6px_6px_0px_0px_#3C632A] my-4 text-center animate-in zoom-in-95 duration-300">
          <span className="text-6xl mb-2">🏆</span>
          <h3 className="text-3xl font-black text-[#3C632A] mb-2">
            Misi Selesai!
          </h3>
          <p className="text-lg font-bold text-[#3C632A]/90 mb-4">
            Kamu berhasil menyelesaikan seluruh {levelData.questions.length} soal pada Level {levelId}!
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
        <div className="w-full max-w-2xl flex-1 flex flex-col items-center justify-between my-2">
          
          <div className="w-full bg-white/90 border-4 border-[#3C632A] rounded-2xl p-3 shadow-[4px_4px_0px_0px_#3C632A] mb-4 flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs md:text-sm font-black text-[#3C632A]">
              <span>Tantangan Game: Soal {currentQuestionIndex + 1} dari {levelData.questions.length}</span>
              <span className="bg-[#FFDF59] px-3 py-1 rounded-xl border border-[#3C632A]">
                Skor: {score}
              </span>
            </div>
            <div className="w-full h-4 bg-slate-100 rounded-full border-2 border-[#3C632A] overflow-hidden">
              <div
                className="h-full bg-[#7FD13B] transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / levelData.questions.length) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="w-full bg-[#C3631D] text-[#FFDF59] border-4 border-[#3C632A] p-6 rounded-3xl text-center shadow-[6px_6px_0px_0px_#3C632A] mb-6">
            <p className="text-2xl md:text-3xl font-black leading-snug">
              {currentQ.question}
            </p>
            {showClue && (
              <div className="mt-3 p-3 bg-white/20 border-2 border-[#FFDF59] rounded-xl text-[#FFDF59] text-xs font-black">
                Petunjuk: {currentQ.explanation}
              </div>
            )}
          </div>

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

// ================= DATA SOAL KELAS 2 SD BAHASA INGGRIS (7 LEVEL x 10 SOAL = 70 SOAL) =================
function getGrade2EnglishData(levelId: number): LevelConceptData {
  switch (levelId) {
    case 1:
      return {
        title: "Numbers (21–50/100)",
        conceptText: "Mengenal angka puluhan di atas 20 dalam bahasa Inggris: 21 (twenty-one), 30 (thirty), 40 (forty), 50 (fifty), hingga 100 (one hundred).",
        questions: [
          {
            id: 1,
            question: "Bahasa Inggris dari angka 25 adalah...",
            options: ["Twenty-five", "Twenty-four", "Thirty-five"],
            correctIndex: 0,
            explanation: "25 adalah 'Twenty-five'.",
          },
          {
            id: 2,
            question: "Kata 'Thirty' melambangkan angka...",
            options: ["30", "13", "33"],
            correctIndex: 0,
            explanation: "'Thirty' adalah 30, sedangkan 'thirteen' adalah 13.",
          },
          {
            id: 3,
            question: "Bahasa Inggris dari angka 40 adalah...",
            options: ["Forty", "Fourteen", "Fifty"],
            correctIndex: 0,
            explanation: "Angka 40 dieja 'Forty'.",
          },
          {
            id: 4,
            question: "Berapakah hasil dari 20 + 30 dalam bahasa Inggris?",
            options: ["Fifty", "Forty", "Sixty"],
            correctIndex: 0,
            explanation: "20 + 30 = 50, yaitu 'Fifty'.",
          },
          {
            id: 5,
            question: "Bahasa Inggris dari angka 100 adalah...",
            options: ["One hundred", "One thousand", "Ten hundred"],
            correctIndex: 0,
            explanation: "100 adalah 'One hundred'.",
          },
          {
            id: 6,
            question: "Kata 'Thirty-two' melambangkan angka...",
            options: ["32", "23", "42"],
            correctIndex: 0,
            explanation: "'Thirty-two' adalah angka 32.",
          },
          {
            id: 7,
            question: "Bahasa Inggris dari angka 50 adalah...",
            options: ["Fifty", "Fifteen", "Five"],
            correctIndex: 0,
            explanation: "Angka 50 adalah 'Fifty'.",
          },
          {
            id: 8,
            question: "Urutan setelah 'Twenty-nine' (29) adalah...",
            options: ["Thirty", "Twenty-eight", "Thirty-one"],
            correctIndex: 0,
            explanation: "Setelah 29 adalah 30 (Thirty).",
          },
          {
            id: 9,
            question: "Bahasa Inggris dari angka 21 adalah...",
            options: ["Twenty-one", "Twelve", "Twenty"],
            correctIndex: 0,
            explanation: "21 adalah 'Twenty-one'.",
          },
          {
            id: 10,
            question: "Hasil dari 100 - 50 dalam bahasa Inggris adalah...",
            options: ["Fifty", "Forty", "Sixty"],
            correctIndex: 0,
            explanation: "100 - 50 = 50 (Fifty).",
          },
        ],
      };

    case 2:
      return {
        title: "Animals (Pets & Wild Animals)",
        conceptText: "Mengenal hewan peliharaan (Pets: Cat, Dog, Rabbit, Bird) dan hewan liar (Wild Animals: Lion, Tiger, Elephant, Monkey).",
        questions: [
          {
            id: 1,
            question: "Hewan peliharaan berkaki empat yang suka mengeong adalah...",
            options: ["Cat", "Dog", "Bird"],
            correctIndex: 0,
            explanation: "Kucing adalah 'Cat'.",
          },
          {
            id: 2,
            question: "Hewan liar bertubuh besar dengan belalai panjang adalah...",
            options: ["Elephant", "Lion", "Tiger"],
            correctIndex: 0,
            explanation: "Gajah adalah 'Elephant'.",
          },
          {
            id: 3,
            question: "Bahasa Inggris dari hewan 'Kelinci' adalah...",
            options: ["Rabbit", "Duck", "Horse"],
            correctIndex: 0,
            explanation: "Kelinci adalah 'Rabbit'.",
          },
          {
            id: 4,
            question: "Hewan yang dijuluki raja hutan (King of the Jungle) adalah...",
            options: ["Lion", "Monkey", "Fish"],
            correctIndex: 0,
            explanation: "Singa adalah 'Lion'.",
          },
          {
            id: 5,
            question: "Hewan yang bisa terbang di udara dan bersuara merdu adalah...",
            options: ["Bird", "Tiger", "Rabbit"],
            correctIndex: 0,
            explanation: "Burung adalah 'Bird'.",
          },
          {
            id: 6,
            question: "Bahasa Inggris dari hewan 'Monyet' adalah...",
            options: ["Monkey", "Cow", "Sheep"],
            correctIndex: 0,
            explanation: "Monyet adalah 'Monkey'.",
          },
          {
            id: 7,
            question: "Hewan liar belang oranye dan hitam yang buas adalah...",
            options: ["Tiger", "Cat", "Goat"],
            correctIndex: 0,
            explanation: "Harimau adalah 'Tiger'.",
          },
          {
            id: 8,
            question: "Hewan peliharaan yang hidup di dalam air akuarium adalah...",
            options: ["Fish", "Dog", "Chicken"],
            correctIndex: 0,
            explanation: "Ikan adalah 'Fish'.",
          },
          {
            id: 9,
            question: "Bahasa Inggris dari 'Kuda' adalah...",
            options: ["Horse", "House", "Horn"],
            correctIndex: 0,
            explanation: "Kuda adalah 'Horse'.",
          },
          {
            id: 10,
            question: "Hewan berleher sangat panjang adalah...",
            options: ["Giraffe", "Elephant", "Lion"],
            correctIndex: 0,
            explanation: "Jerapah adalah 'Giraffe'.",
          },
        ],
      };

    case 3:
      return {
        title: "Parts of the House",
        conceptText: "Mengenal ruangan di dalam rumah: Bedroom (kamar tidur), Kitchen (dapur), Living room (ruang tamu), Bathroom (kamar mandi), serta perabotan dasar.",
        questions: [
          {
            id: 1,
            question: "Ruangan tempat kita tidur dan beristirahat adalah...",
            options: ["Bedroom", "Kitchen", "Bathroom"],
            correctIndex: 0,
            explanation: "Kamar tidur adalah 'Bedroom'.",
          },
          {
            id: 2,
            question: "Ibu memasak makanan di ruangan...",
            options: ["Kitchen", "Living room", "Garage"],
            correctIndex: 0,
            explanation: "Dapur adalah 'Kitchen'.",
          },
          {
            id: 3,
            question: "Ruangan tempat kita mandi dan mencuci tangan adalah...",
            options: ["Bathroom", "Dining room", "Bedroom"],
            correctIndex: 0,
            explanation: "Kamar mandi adalah 'Bathroom'.",
          },
          {
            id: 4,
            question: "Ruangan tempat menerima tamu atau berkumpul bersama keluarga adalah...",
            options: ["Living room", "Kitchen", "Bathroom"],
            correctIndex: 0,
            explanation: "Ruang tamu adalah 'Living room'.",
          },
          {
            id: 5,
            question: "Benda tempat kita berbaring dan tidur di kamar tidur adalah...",
            options: ["Bed", "Sofa", "Stove"],
            correctIndex: 0,
            explanation: "Tempat tidur adalah 'Bed'.",
          },
          {
            id: 6,
            question: "Bahasa Inggris dari kursi sofa yang empuk di ruang tamu adalah...",
            options: ["Sofa", "Stove", "Shower"],
            correctIndex: 0,
            explanation: "Sofa disebut 'Sofa'.",
          },
          {
            id: 7,
            question: "Alat untuk memasak di dapur (kompor) dalam bahasa Inggris disebut...",
            options: ["Stove", "Table", "Bed"],
            correctIndex: 0,
            explanation: "Kompor adalah 'Stove'.",
          },
          {
            id: 8,
            question: "Lampu penerang ruangan dalam bahasa Inggris adalah...",
            options: ["Lamp", "Door", "Window"],
            correctIndex: 0,
            explanation: "Lampu adalah 'Lamp'.",
          },
          {
            id: 9,
            question: "Bahasa Inggris dari 'Pintu' adalah...",
            options: ["Door", "Floor", "Roof"],
            correctIndex: 0,
            explanation: "Pintu adalah 'Door'.",
          },
          {
            id: 10,
            question: "Bahasa Inggris dari 'Jendela' adalah...",
            options: ["Window", "Wall", "Ceiling"],
            correctIndex: 0,
            explanation: "Jendela adalah 'Window'.",
          },
        ],
      };

    case 4:
      return {
        title: "Food & Drinks",
        conceptText: "Mengenal makanan dan minuman sehari-hari (Rice, Bread, Milk, Water) serta mengungkapkan rasa suka: 'I like...' atau 'I do not like...'.",
        questions: [
          {
            id: 1,
            question: "Makanan pokok orang Indonesia (nasi) dalam bahasa Inggris adalah...",
            options: ["Rice", "Bread", "Cheese"],
            correctIndex: 0,
            explanation: "Nasi adalah 'Rice'.",
          },
          {
            id: 2,
            question: "Minuman putih sehat yang dihasilkan sapi adalah...",
            options: ["Milk", "Tea", "Coffee"],
            correctIndex: 0,
            explanation: "Susu adalah 'Milk'.",
          },
          {
            id: 3,
            question: "Arti dari kalimat 'I like apples' adalah...",
            options: ["Saya suka apel", "Saya punya apel", "Saya beli apel"],
            correctIndex: 0,
            explanation: "'I like' menyatakan rasa suka (Saya suka).",
          },
          {
            id: 4,
            question: "Arti dari kalimat 'I do not like coffee' adalah...",
            options: ["Saya tidak suka kopi", "Saya minum kopi", "Kopi itu enak"],
            correctIndex: 0,
            explanation: "'I do not like' artinya saya tidak suka.",
          },
          {
            id: 5,
            question: "Bahasa Inggris dari makanan 'Roti' adalah...",
            options: ["Bread", "Cake", "Biscuit"],
            correctIndex: 0,
            explanation: "Roti adalah 'Bread'.",
          },
          {
            id: 6,
            question: "Air putih yang penting diminum setiap hari disebut...",
            options: ["Water", "Juice", "Soda"],
            correctIndex: 0,
            explanation: "Air putih adalah 'Water'.",
          },
          {
            id: 7,
            question: "Bahasa Inggris dari makanan 'Mie' adalah...",
            options: ["Noodles", "Rice", "Meatball"],
            correctIndex: 0,
            explanation: "Mie adalah 'Noodles'.",
          },
          {
            id: 8,
            question: "Minuman teh hangat dalam bahasa Inggris adalah...",
            options: ["Tea", "Coffee", "Milk"],
            correctIndex: 0,
            explanation: "Teh adalah 'Tea'.",
          },
          {
            id: 9,
            question: "Lengkapi kalimat: 'I ... orange juice because it is sweet.'",
            options: ["like", "do not like", "dislike"],
            correctIndex: 0,
            explanation: "Kata 'like' tepat karena jus jeruk rasanya manis.",
          },
          {
            id: 10,
            question: "Bahasa Inggris dari buah pisang adalah...",
            options: ["Banana", "Apple", "Mango"],
            correctIndex: 0,
            explanation: "Pisang adalah 'Banana'.",
          },
        ],
      };

    case 5:
      return {
        title: "Clothes",
        conceptText: "Mengenal nama-nama pakaian dan aksesori: Shirt (kemeja), T-shirt (kaus), Pants (celana), Shoes (sepatu), Hat (topi), Dress (gaun), dan Jacket (jaket).",
        questions: [
          {
            id: 1,
            question: "Benda yang kita pakai di kaki saat pergi ke sekolah adalah...",
            options: ["Shoes", "Hat", "Shirt"],
            correctIndex: 0,
            explanation: "Sepatu adalah 'Shoes'.",
          },
          {
            id: 2,
            question: "Pakaian yang dipakai di kepala untuk melindungi dari sinar matahari adalah...",
            options: ["Hat", "Pants", "Socks"],
            correctIndex: 0,
            explanation: "Topi adalah 'Hat'.",
          },
          {
            id: 3,
            question: "Bahasa Inggris dari 'Kaus' santai berlengan pendek adalah...",
            options: ["T-shirt", "Jacket", "Coat"],
            correctIndex: 0,
            explanation: "Kaus adalah 'T-shirt'.",
          },
          {
            id: 4,
            question: "Bahasa Inggris dari 'Celana panjang' adalah...",
            options: ["Pants", "Shirt", "Dress"],
            correctIndex: 0,
            explanation: "Celana adalah 'Pants' (atau trousers).",
          },
          {
            id: 5,
            question: "Pakaian terusan yang anggun dikenakan anak perempuan adalah...",
            options: ["Dress", "Belt", "Tie"],
            correctIndex: 0,
            explanation: "Gaun terusan adalah 'Dress'.",
          },
          {
            id: 6,
            question: "Kaus kaki yang dipakai sebelum memakai sepatu disebut...",
            options: ["Socks", "Shoes", "Gloves"],
            correctIndex: 0,
            explanation: "Kaus kaki adalah 'Socks'.",
          },
          {
            id: 7,
            question: "Baju hangat yang dipakai saat udara dingin adalah...",
            options: ["Jacket", "T-shirt", "Cap"],
            correctIndex: 0,
            explanation: "Jaket adalah 'Jacket'.",
          },
          {
            id: 8,
            question: "Bahasa Inggris dari pakaian 'Kemeja' berkerah adalah...",
            options: ["Shirt", "Skirt", "Shorts"],
            correctIndex: 0,
            explanation: "Kemeja adalah 'Shirt'.",
          },
          {
            id: 9,
            question: "Rok yang dipakai anak perempuan dalam bahasa Inggris adalah...",
            options: ["Skirt", "Shirt", "Suit"],
            correctIndex: 0,
            explanation: "Rok adalah 'Skirt'.",
          },
          {
            id: 10,
            question: "Arti dari kalimat 'She wears red shoes' adalah...",
            options: ["Dia memakai sepatu merah", "Dia membeli baju merah", "Dia suka warna merah"],
            correctIndex: 0,
            explanation: "'She wears red shoes' artinya dia memakai sepatu merah.",
          },
        ],
      };

    case 6:
      return {
        title: "Simple Actions",
        conceptText: "Mengenal kata kerja aksi dasar: Run (berlari), Walk (berjalan), Jump (melompat), Sit (duduk), Read (membaca), Write (menulis), dan Sleep (tidur).",
        questions: [
          {
            id: 1,
            question: "Kata kerja bahasa Inggris untuk aksi 'Berlari' adalah...",
            options: ["Run", "Walk", "Sleep"],
            correctIndex: 0,
            explanation: "Berlari adalah 'Run'.",
          },
          {
            id: 2,
            question: "Kata kerja untuk aksi 'Membaca buku' adalah...",
            options: ["Read", "Write", "Jump"],
            correctIndex: 0,
            explanation: "Membaca adalah 'Read'.",
          },
          {
            id: 3,
            question: "Bahasa Inggris dari aktivitas 'Menulis' adalah...",
            options: ["Write", "Draw", "Sing"],
            correctIndex: 0,
            explanation: "Menulis adalah 'Write'.",
          },
          {
            id: 4,
            question: "Aktivitas bergerak santai dengan langkah kaki disebut...",
            options: ["Walk", "Run", "Fly"],
            correctIndex: 0,
            explanation: "Berjalan adalah 'Walk'.",
          },
          {
            id: 5,
            question: "Bahasa Inggris dari melompat ke atas adalah...",
            options: ["Jump", "Sit", "Stand"],
            correctIndex: 0,
            explanation: "Melompat adalah 'Jump'.",
          },
          {
            id: 6,
            question: "Arti dari kata aksi 'Sleep' adalah...",
            options: ["Tidur", "Makan", "Minum"],
            correctIndex: 0,
            explanation: "'Sleep' artinya tidur.",
          },
          {
            id: 7,
            question: "Aktivitas memasukkan makanan ke dalam mulut adalah...",
            options: ["Eat", "Drink", "Cook"],
            correctIndex: 0,
            explanation: "Makan adalah 'Eat'.",
          },
          {
            id: 8,
            question: "Aktivitas minum air dalam bahasa Inggris adalah...",
            options: ["Drink", "Eat", "Swim"],
            correctIndex: 0,
            explanation: "Minum adalah 'Drink'.",
          },
          {
            id: 9,
            question: "Arti dari perintah 'Stand up' adalah...",
            options: ["Berdirilah", "Duduklah", "Lompatlah"],
            correctIndex: 0,
            explanation: "'Stand up' artinya berdirilah.",
          },
          {
            id: 10,
            question: "Lengkapi kalimat: 'Birds can fly and frogs can ...'",
            options: ["jump", "read", "write"],
            correctIndex: 0,
            explanation: "Katak bisa melompat (jump).",
          },
        ],
      };

    case 7:
      return {
        title: "Basic Demonstratives",
        conceptText: "Menggunakan kata tunjuk dasar: This (ini - tunggal dekat), That (itu - tunggal jauh), These (ini - jamak dekat), dan Those (itu - jamak jauh).",
        questions: [
          {
            id: 1,
            question: "Kata tunjuk untuk satu benda tunggal yang berada dekat dengan kita adalah...",
            options: ["This", "That", "Those"],
            correctIndex: 0,
            explanation: "'This' digunakan untuk satu benda tunggal yang dekat.",
          },
          {
            id: 2,
            question: "Kata tunjuk untuk satu benda tunggal yang berada jauh dari kita adalah...",
            options: ["That", "This", "These"],
            correctIndex: 0,
            explanation: "'That' digunakan untuk satu benda tunggal yang jauh.",
          },
          {
            id: 3,
            question: "Lengkapi kalimat: '... is an apple on my hand.'",
            options: ["This", "Those", "These"],
            correctIndex: 0,
            explanation: "Karena satu apel di tangan (dekat), gunakan 'This'.",
          },
          {
            id: 4,
            question: "Kata tunjuk untuk banyak benda (jamak) yang berada dekat adalah...",
            options: ["These", "This", "That"],
            correctIndex: 0,
            explanation: "'These' digunakan untuk benda jamak yang dekat.",
          },
          {
            id: 5,
            question: "Kata tunjuk untuk banyak burung (jamak) yang terbang jauh di langit adalah...",
            options: ["Those", "This", "That"],
            correctIndex: 0,
            explanation: "'Those' digunakan untuk banyak benda yang jauh.",
          },
          {
            id: 6,
            question: "Lengkapi kalimat: '... are my pencils.' (banyak pensil di dekat meja kita)",
            options: ["These", "This", "That"],
            correctIndex: 0,
            explanation: "Gunakan 'These are' untuk banyak benda dekat.",
          },
          {
            id: 7,
            question: "Arti dari kalimat 'That is a big car' adalah...",
            options: ["Itu adalah mobil besar", "Ini adalah mobil besar", "Mobil itu melaju"],
            correctIndex: 0,
            explanation: "'That is' artinya 'Itu adalah'.",
          },
          {
            id: 8,
            question: "Perbedaan antara 'This' dan 'These' adalah...",
            options: ["This untuk 1 benda, These untuk lebih dari 1 benda", "This untuk benda jauh, These untuk dekat", "Tidak ada bedanya"],
            correctIndex: 0,
            explanation: "'This' untuk tunggal, 'These' untuk jamak (keduanya posisi dekat).",
          },
          {
            id: 9,
            question: "Pasangan to be yang tepat untuk 'That' adalah...",
            options: ["is", "are", "am"],
            correctIndex: 0,
            explanation: "'That' (tunggal) berpasangan dengan 'is' (That is).",
          },
          {
            id: 10,
            question: "Pasangan to be yang tepat untuk 'Those' adalah...",
            options: ["are", "is", "am"],
            correctIndex: 0,
            explanation: "'Those' (jamak) berpasangan dengan 'are' (Those are).",
          },
        ],
      };

    default:
      return {
        title: "English Level",
        conceptText: "Materi belajar Bahasa Inggris Kelas 2 SD.",
        questions: [],
      };
  }
}
