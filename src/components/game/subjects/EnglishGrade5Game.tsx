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

interface EnglishGrade5GameProps {
  levelId: number;
  onLevelComplete: (levelId: number, starsEarned: number) => void;
  accessibilityMode?: string;
}

export function EnglishGrade5Game({ levelId, onLevelComplete, accessibilityMode }: EnglishGrade5GameProps) {
  const [phase, setPhase] = useState<"materi" | "game">("materi");

  // Phase 1 interactive states
  const [activeContinuousForm, setActiveContinuousForm] = useState<{ sub: string; tobe: string; ving: string; sample: string }>({ sub: "She", tobe: "is", ving: "reading", sample: "She is reading an English book now" });
  const [activeComparison, setActiveComparison] = useState<{ adj: string; comp: string; sup: string }>({ adj: "Tall", comp: "Taller than", sup: "The tallest" });
  const [activeIllness, setActiveIllness] = useState<{ illness: string; indo: string; advice: string }>({ illness: "Headache", indo: "Sakit kepala", advice: "You should take a rest" });
  const [activeTasteOrder, setActiveTasteOrder] = useState<{ taste: string; food: string; phrase: string }>({ taste: "Sweet", food: "Ice cream", phrase: "Can I have a strawberry ice cream, please?" });
  const [activeTransport, setActiveTransport] = useState<{ mode: string; place: string; ticket: string }>({ mode: "Train", place: "Railway station", ticket: "Buy a train ticket" });
  const [activeStep, setActiveStep] = useState<{ step: number; action: string; verb: string }>({ step: 1, action: "Cut the lemon into halves", verb: "Cut" });

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
    setActiveContinuousForm({ sub: "She", tobe: "is", ving: "reading", sample: "She is reading an English book now" });
    setActiveComparison({ adj: "Tall", comp: "Taller than", sup: "The tallest" });
    setActiveIllness({ illness: "Headache", indo: "Sakit kepala", advice: "You should take a rest" });
    setActiveTasteOrder({ taste: "Sweet", food: "Ice cream", phrase: "Can I have a strawberry ice cream, please?" });
    setActiveTransport({ mode: "Train", place: "Railway station", ticket: "Buy a train ticket" });
    setActiveStep({ step: 1, action: "Cut the lemon into halves", verb: "Cut" });

    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setWrongAttempts(0);
    setShowClue(false);
    setIsCompleted(false);
    isProcessingRef.current = false;

    const data = getGrade5EnglishData(levelId);
    setQuestionsList(shuffleQuestions(data));
    speakGlobal(data.conceptText);
  }, [levelId]);

  const levelData = getGrade5EnglishData(levelId);
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
      speakGlobal("Well done! Correct! " + currentQ.explanation);

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
          speakGlobal(`Superb! You finished all 10 questions and received ${stars} stars!`);
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
        speakGlobal("Not quite right yet. Please listen carefully and try again!");
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
            KELAS 5 SD • LEVEL {levelId} dari 6
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
                  Present Continuous: Subject + is/am/are + V-ing:
                </span>
                <div className="grid grid-cols-3 gap-2 w-full text-xs">
                  {[
                    { sub: "I", tobe: "am", act: "studying", indo: "Saya sedang belajar" },
                    { sub: "She", tobe: "is", act: "reading", indo: "Dia sedang membaca" },
                    { sub: "They", tobe: "are", act: "playing", indo: "Mereka sedang bermain" },
                  ].map((c) => (
                    <button
                      key={c.sub}
                      type="button"
                      onClick={() => {
                        setActiveContinuousForm({ sub: c.sub, tobe: c.tobe, ving: c.act, sample: `${c.sub} ${c.tobe} ${c.act} now` });
                        playPopSound();
                        speakGlobal(`${c.sub} ${c.tobe} ${c.act}. Artinya ${c.indo}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] text-center cursor-pointer transition-all ${
                        activeContinuousForm.sub === c.sub ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-sm">{c.sub} + {c.tobe}</strong>
                      <span className="text-[11px] font-bold block">{c.act}</span>
                      <span className="text-[10px] opacity-80 block">{c.indo}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {levelId === 2 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Degrees of Comparison (Tingkat Perbandingan):
                </span>
                <div className="grid grid-cols-3 gap-2 w-full text-xs">
                  <div className="p-2.5 bg-white border border-[#3C632A] rounded-xl text-center shadow-sm">
                    <strong>Positive:</strong><br />
                    <span>Tall (Tinggi)</span><br />
                    <span>Fast (Cepat)</span>
                  </div>
                  <div className="p-2.5 bg-white border border-[#3C632A] rounded-xl text-center shadow-sm">
                    <strong>Comparative:</strong><br />
                    <span className="text-[#C3631D] font-bold">Taller than</span><br />
                    <span className="text-[#C3631D] font-bold">Faster than</span>
                  </div>
                  <div className="p-2.5 bg-white border border-[#3C632A] rounded-xl text-center shadow-sm">
                    <strong>Superlative:</strong><br />
                    <span className="text-[#7FD13B] font-bold">The tallest</span><br />
                    <span className="text-[#7FD13B] font-bold">The fastest</span>
                  </div>
                </div>
              </div>
            )}

            {levelId === 3 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Health, Illnesses, and Advice (Keluhan Sakit & Saran):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full text-xs">
                  {[
                    { illness: "Headache", indo: "Sakit kepala", advice: "Take medicine" },
                    { illness: "Stomachache", indo: "Sakit perut", advice: "Drink warm water" },
                    { illness: "Toothache", indo: "Sakit gigi", advice: "See a dentist" },
                    { illness: "Cold / Cough", indo: "Flu / Batuk", advice: "Wear a mask" },
                    { illness: "Fever", indo: "Demam panas", advice: "Rest in bed" },
                    { illness: "Sore throat", indo: "Radang tenggorokan", advice: "Drink warm tea" },
                  ].map((h) => (
                    <button
                      key={h.illness}
                      type="button"
                      onClick={() => {
                        setActiveIllness({ illness: h.illness, indo: h.indo, advice: h.advice });
                        playPopSound();
                        speakGlobal(`I have a ${h.illness}. ${h.advice}`);
                      }}
                      className={`p-2 rounded-xl border-2 border-[#3C632A] text-center cursor-pointer transition-all ${
                        activeIllness.illness === h.illness ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block">{h.illness}</strong>
                      <span className="text-[10px] opacity-80 block">{h.indo}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {levelId === 4 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Food Tastes & Ordering (Rasa & Cara Memesan):
                </span>
                <div className="grid grid-cols-4 gap-2 w-full text-xs">
                  {[
                    { taste: "Sweet", indo: "Manis (Cake/Sugar)" },
                    { taste: "Salty", indo: "Asin (Salt/Cheese)" },
                    { taste: "Spicy", indo: "Pedas (Chili)" },
                    { taste: "Sour", indo: "Masam (Lemon)" },
                  ].map((t) => (
                    <div key={t.taste} className="p-2 bg-white border border-[#3C632A] rounded-xl text-center shadow-sm">
                      <strong className="block">{t.taste}</strong>
                      <span className="text-[10px] opacity-80 block">{t.indo}</span>
                    </div>
                  ))}
                </div>
                <div className="p-2 bg-white border-2 border-[#3C632A] rounded-xl text-center text-xs w-full shadow-sm">
                  <strong>Polite Ordering:</strong> "Can I have a glass of orange juice, please?"
                </div>
              </div>
            )}

            {levelId === 5 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Public Transportation & Travel Places:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full text-xs">
                  {[
                    { mode: "Train", place: "Railway station" },
                    { mode: "Airplane", place: "Airport" },
                    { mode: "Ship", place: "Harbor" },
                    { mode: "Bus", place: "Bus stop" },
                  ].map((tr) => (
                    <button
                      key={tr.mode}
                      type="button"
                      onClick={() => {
                        setActiveTransport({ mode: tr.mode, place: tr.place, ticket: `Ticket for ${tr.mode}` });
                        playPopSound();
                        speakGlobal(`We take a ${tr.mode} at the ${tr.place}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] text-center cursor-pointer transition-all ${
                        activeTransport.mode === tr.mode ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block">{tr.mode}</strong>
                      <span className="text-[10px] opacity-80 block">{tr.place}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {levelId === 6 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Procedure Text: How to Make Lemonade:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full text-xs">
                  {[
                    { step: 1, verb: "Cut", text: "Cut the lemon" },
                    { step: 2, verb: "Squeeze", text: "Squeeze the juice" },
                    { step: 3, verb: "Add", text: "Add water and sugar" },
                    { step: 4, verb: "Stir", text: "Stir well and serve" },
                  ].map((s) => (
                    <button
                      key={s.step}
                      type="button"
                      onClick={() => {
                        setActiveStep({ step: s.step, action: s.text, verb: s.verb });
                        playPopSound();
                        speakGlobal(`Step ${s.step}: ${s.text}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] text-center cursor-pointer transition-all ${
                        activeStep.step === s.step ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <span className="text-[10px] font-bold block text-[#C3631D]">Step {s.step}</span>
                      <strong className="block text-xs">{s.verb}</strong>
                      <span className="text-[9px] opacity-80 block">{s.text}</span>
                    </button>
                  ))}
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

// ================= DATA SOAL KELAS 5 SD BAHASA INGGRIS (6 LEVEL x 10 SOAL = 60 SOAL) =================
function getGrade5EnglishData(levelId: number): LevelConceptData {
  switch (levelId) {
    case 1:
      return {
        title: "Present Continuous Tense",
        conceptText: "Menyatakan aktivitas yang sedang berlangsung sekarang: pola subjek + to be (is/am/are) + Verb-ing. Keterangan waktu: now, at the moment, right now.",
        questions: [
          {
            id: 1,
            question: "Lengkapi kalimat: 'She ... reading a book in the library right now.'",
            options: ["is", "are", "am"],
            correctIndex: 0,
            explanation: "Subjek tunggal 'She' menggunakan to be 'is'.",
          },
          {
            id: 2,
            question: "Lengkapi kalimat: 'They ... playing basketball in the yard.'",
            options: ["are", "is", "am"],
            correctIndex: 0,
            explanation: "Subjek jamak 'They' menggunakan to be 'are'.",
          },
          {
            id: 3,
            question: "Bentuk Verb-ing dari kata dasar 'swim' adalah...",
            options: ["swimming", "swiming", "swimmed"],
            correctIndex: 0,
            explanation: "Konsonan ganda pada 'swimming'.",
          },
          {
            id: 4,
            question: "Lengkapi kalimat: 'I ... eating my lunch now.'",
            options: ["am", "is", "are"],
            correctIndex: 0,
            explanation: "Subjek 'I' berpasangan dengan 'am'.",
          },
          {
            id: 5,
            question: "Bentuk negatif dari 'He is sleeping' adalah...",
            options: ["He is not sleeping", "He does not sleeping", "He not sleeping"],
            correctIndex: 0,
            explanation: "Bentuk negatif: to be + not (is not sleeping).",
          },
          {
            id: 6,
            question: "Lengkapi kalimat tanya: '... they listening to the teacher?'",
            options: ["Are", "Is", "Do"],
            correctIndex: 0,
            explanation: "To be untuk 'they' adalah 'Are'.",
          },
          {
            id: 7,
            question: "Arti kalimat 'Mother is cooking in the kitchen' adalah...",
            options: ["Ibu sedang memasak di dapur", "Ibu selesai memasak", "Ibu pergi ke dapur"],
            correctIndex: 0,
            explanation: "Present continuous menyatakan aktivitas yang sedang berlangsung.",
          },
          {
            id: 8,
            question: "Bentuk Verb-ing dari kata 'write' adalah...",
            options: ["writing", "writeing", "written"],
            correctIndex: 0,
            explanation: "Huruf -e dilepas menjadi 'writing'.",
          },
          {
            id: 9,
            question: "Keterangan waktu yang sering dipakai pada Present Continuous adalah...",
            options: ["Now", "Yesterday", "Last year"],
            correctIndex: 0,
            explanation: "'Now' (sekarang) menunjukkan waktu sekarang.",
          },
          {
            id: 10,
            question: "Lengkapi kalimat: 'The birds ... flying high in the sky.'",
            options: ["are", "is", "am"],
            correctIndex: 0,
            explanation: "'The birds' adalah jamak, jadi menggunakan 'are'.",
          },
        ],
      };

    case 2:
      return {
        title: "Adjectives & Degrees of Comparison",
        conceptText: "Tingkat perbandingan kata sifat: Positive (tall), Comparative (taller than, more expensive than), dan Superlative (the tallest, the most expensive).",
        questions: [
          {
            id: 1,
            question: "Bentuk comparative (lebih tinggi) dari kata 'tall' adalah...",
            options: ["taller", "tallest", "more tall"],
            correctIndex: 0,
            explanation: "Kata sifat pendek 1 suku kata ditambahkan -er ('taller than').",
          },
          {
            id: 2,
            question: "Bentuk superlative (paling besar) dari kata 'big' adalah...",
            options: ["the biggest", "bigger", "most big"],
            correctIndex: 0,
            explanation: "Tingkat paling tinggi menggunakan 'the biggest'.",
          },
          {
            id: 3,
            question: "Lengkapi kalimat: 'A cheetah is ... than a turtle.'",
            options: ["faster", "fastest", "fast"],
            correctIndex: 0,
            explanation: "Perbandingan dua hewan menggunakan comparative 'faster than'.",
          },
          {
            id: 4,
            question: "Untuk kata sifat panjang seperti 'expensive' (mahal), bentuk komparatifnya adalah...",
            options: ["more expensive", "expensiver", "most expensive"],
            correctIndex: 0,
            explanation: "Kata sifat lebih dari dua suku kata menggunakan 'more expensive'.",
          },
          {
            id: 5,
            question: "Lengkapi kalimat: 'Mount Everest is ... mountain in the world.'",
            options: ["the highest", "higher", "more high"],
            correctIndex: 0,
            explanation: "Menyatakan paling tinggi di dunia menggunakan 'the highest'.",
          },
          {
            id: 6,
            question: "Bentuk comparative dari kata sifat 'good' (tidak beraturan) adalah...",
            options: ["better", "gooder", "best"],
            correctIndex: 0,
            explanation: "Bentuk tak beraturan dari 'good' adalah 'better than'.",
          },
          {
            id: 7,
            question: "Bentuk superlative dari kata 'good' adalah...",
            options: ["the best", "the goodest", "the better"],
            correctIndex: 0,
            explanation: "Paling baik / terbaik adalah 'the best'.",
          },
          {
            id: 8,
            question: "Lengkapi kalimat: 'An elephant is ... than a cat.'",
            options: ["heavier", "heaviest", "heavy"],
            correctIndex: 0,
            explanation: "Lebih berat menggunakan 'heavier than'.",
          },
          {
            id: 9,
            question: "Arti dari kalimat 'She is as smart as her sister' adalah...",
            options: ["Dia sama pintarnya dengan saudaranya", "Dia lebih pintar", "Dia paling pintar"],
            correctIndex: 0,
            explanation: "Pola 'as ... as' menyatakan tingkat perbandingan setara (sama pintarnya).",
          },
          {
            id: 10,
            question: "Bentuk comparative dari kata 'bad' (buruk) adalah...",
            options: ["worse", "baddest", "more bad"],
            correctIndex: 0,
            explanation: "'Bad' berubah menjadi bentuk tak beraturan 'worse than'.",
          },
        ],
      };

    case 3:
      return {
        title: "Health & Illnesses",
        conceptText: "Mengenal keluhan penyakit: Headache (sakit kepala), Stomachache (sakit perut), Toothache (sakit gigi), Fever (demam), dan memberi saran 'should / should not'.",
        questions: [
          {
            id: 1,
            question: "Keluhan sakit di bagian kepala dalam bahasa Inggris adalah...",
            options: ["Headache", "Stomachache", "Toothache"],
            correctIndex: 0,
            explanation: "Sakit kepala adalah 'Headache'.",
          },
          {
            id: 2,
            question: "Keluhan sakit di bagian perut karena salah makan adalah...",
            options: ["Stomachache", "Headache", "Backache"],
            correctIndex: 0,
            explanation: "Sakit perut adalah 'Stomachache'.",
          },
          {
            id: 3,
            question: "Keluhan rasa nyeri pada gigi berlubang adalah...",
            options: ["Toothache", "Earache", "Fever"],
            correctIndex: 0,
            explanation: "Sakit gigi adalah 'Toothache'.",
          },
          {
            id: 4,
            question: "Kondisi suhu tubuh meningkat panas tinggi disebut...",
            options: ["Fever", "Cough", "Cold"],
            correctIndex: 0,
            explanation: "Demam panas adalah 'Fever'.",
          },
          {
            id: 5,
            question: "Saran yang tepat saat seseorang demam tinggi: 'You ... see a doctor.'",
            options: ["should", "should not", "must not"],
            correctIndex: 0,
            explanation: "'Should' digunakan untuk memberikan anjuran / saran positif.",
          },
          {
            id: 6,
            question: "Saran saat sedang sakit gigi: 'You ... eat too much candy.'",
            options: ["should not", "should", "must"],
            correctIndex: 0,
            explanation: "'Should not' (sebaiknya jangan) makan terlalu banyak permen.",
          },
          {
            id: 7,
            question: "Dokter yang khusus merawat dan mencabut gigi yang sakit adalah...",
            options: ["Dentist", "Surgeon", "Nurse"],
            correctIndex: 0,
            explanation: "Dokter gigi adalah 'Dentist'.",
          },
          {
            id: 8,
            question: "Arti dari kata 'Medicine' adalah...",
            options: ["Obat", "Makanan", "Minuman"],
            correctIndex: 0,
            explanation: "'Medicine' artinya obat.",
          },
          {
            id: 9,
            question: "Keluhan radang di tenggorokan disebut...",
            options: ["Sore throat", "Headache", "Broken bone"],
            correctIndex: 0,
            explanation: "Radang tenggorokan adalah 'Sore throat'.",
          },
          {
            id: 10,
            question: "Arti dari kalimat 'Take a rest' adalah...",
            options: ["Istirahatlah", "Minumlah obat", "Berlarilah"],
            correctIndex: 0,
            explanation: "'Take a rest' artinya beristirahatlah.",
          },
        ],
      };

    case 4:
      return {
        title: "Food, Taste, & Ordering",
        conceptText: "Mengenal rasa makanan: Sweet (manis), Salty (asin), Spicy (pedas), Sour (asam), Bitter (pahit), dan ungkapan memesan makanan santun: 'Can I have...', 'Would you like...'.",
        questions: [
          {
            id: 1,
            question: "Rasa madu dan gula dalam bahasa Inggris adalah...",
            options: ["Sweet", "Salty", "Spicy"],
            correctIndex: 0,
            explanation: "Manis adalah 'Sweet'.",
          },
          {
            id: 2,
            question: "Rasa cabai dan sambal yang membakar lidah adalah...",
            options: ["Spicy", "Sweet", "Sour"],
            correctIndex: 0,
            explanation: "Pedas adalah 'Spicy' (atau hot).",
          },
          {
            id: 3,
            question: "Rasa buah lemon yang segar masam adalah...",
            options: ["Sour", "Sweet", "Salty"],
            correctIndex: 0,
            explanation: "Masam adalah 'Sour'.",
          },
          {
            id: 4,
            question: "Rasa garam dapur adalah...",
            options: ["Salty", "Sweet", "Bitter"],
            correctIndex: 0,
            explanation: "Asin adalah 'Salty'.",
          },
          {
            id: 5,
            question: "Rasa jamu tradisional atau kopi hitam tanpa gula adalah...",
            options: ["Bitter", "Sweet", "Sour"],
            correctIndex: 0,
            explanation: "Pahit adalah 'Bitter'.",
          },
          {
            id: 6,
            question: "Ungkapan santun untuk memesan semangkuk sup di restoran adalah...",
            options: ["Can I have a bowl of soup, please?", "Give me soup now!", "I take soup."],
            correctIndex: 0,
            explanation: "'Can I have ..., please?' adalah ungkapan santun saat memesan.",
          },
          {
            id: 7,
            question: "Pelayan restoran bertanya: 'What would you like to drink?'. Artinya...",
            options: ["Anda ingin minum apa?", "Berapa harga minuman ini?", "Di mana Anda minum?"],
            correctIndex: 0,
            explanation: "Pertanyaan ini menanyakan pesanan minuman yang diinginkan pembeli.",
          },
          {
            id: 8,
            question: "Daftar menu makanan dan harga di restoran disebut...",
            options: ["Menu", "Bill", "Recipe"],
            correctIndex: 0,
            explanation: "Daftar makanan adalah 'Menu'.",
          },
          {
            id: 9,
            question: "Lengkapi kalimat: 'Would you ... some dessert?'",
            options: ["like", "likes", "liking"],
            correctIndex: 0,
            explanation: "Ungkapan tawaran sopan: 'Would you like ...?'.",
          },
          {
            id: 10,
            question: "Setelah selesai makan di restoran, kita meminta nota pembayaran...",
            options: ["Bill", "Menu", "Napkin"],
            correctIndex: 0,
            explanation: "Nota tagihan pembayaran adalah 'Bill' (atau check).",
          },
        ],
      };

    case 5:
      return {
        title: "Public Transportation",
        conceptText: "Mengenal transportasi umum: Bus, Train (kereta api), Airplane (pesawat), Ship (kapal), serta kosakata stasiun, tiket, dan halte.",
        questions: [
          {
            id: 1,
            question: "Kereta api yang berjalan di atas rel rel kereta disebut...",
            options: ["Train", "Bus", "Ship"],
            correctIndex: 0,
            explanation: "Kereta api adalah 'Train'.",
          },
          {
            id: 2,
            question: "Tempat naik dan turun penumpang pesawat terbang adalah...",
            options: ["Airport", "Harbor", "Station"],
            correctIndex: 0,
            explanation: "Bandara adalah 'Airport'.",
          },
          {
            id: 3,
            question: "Tempat bersandarnya kapal laut di pelabuhan disebut...",
            options: ["Harbor", "Airport", "Bus stop"],
            correctIndex: 0,
            explanation: "Pelabuhan adalah 'Harbor' (atau port).",
          },
          {
            id: 4,
            question: "Alat bukti pembayaran untuk dapat menaiki angkutan umum adalah...",
            options: ["Ticket", "Passport", "Map"],
            correctIndex: 0,
            explanation: "Tiket perjalanan adalah 'Ticket'.",
          },
          {
            id: 5,
            question: "Tempat pemberhentian bus di tepi jalan disebut...",
            options: ["Bus stop", "Airport", "Platform"],
            correctIndex: 0,
            explanation: "Halte bus adalah 'Bus stop'.",
          },
          {
            id: 6,
            question: "Transportasi laut besar yang mengarungi samudera adalah...",
            options: ["Ship", "Train", "Bicycle"],
            correctIndex: 0,
            explanation: "Kapal laut adalah 'Ship'.",
          },
          {
            id: 7,
            question: "Orang yang mengemudikan kereta api disebut...",
            options: ["Machinist (Train driver)", "Pilot", "Captain"],
            correctIndex: 0,
            explanation: "Masinis adalah 'Train driver' (machinist).",
          },
          {
            id: 8,
            question: "Arti dari kalimat 'I go to school by bus' adalah...",
            options: ["Saya pergi ke sekolah naik bus", "Saya menunggu bus sekolah", "Saya membeli tiket bus"],
            correctIndex: 0,
            explanation: "'By bus' artinya naik bus.",
          },
          {
            id: 9,
            question: "Ruang tunggu tempat naik kereta di dalam stasiun disebut...",
            options: ["Platform", "Runway", "Dock"],
            correctIndex: 0,
            explanation: "Peron stasiun adalah 'Platform'.",
          },
          {
            id: 10,
            question: "Transportasi umum darat beroda banyak yang membawa puluhan penumpang di kota adalah...",
            options: ["Bus", "Motorcycle", "Canoe"],
            correctIndex: 0,
            explanation: "Bus adalah 'Bus'.",
          },
        ],
      };

    case 6:
      return {
        title: "Simple Procedure Text",
        conceptText: "Membaca teks prosedur sederhana (resep atau instruksi) yang tersusun dari kalimat perintah (imperative verbs: cut, pour, mix, stir, serve).",
        questions: [
          {
            id: 1,
            question: "Tujuan dari teks prosedur (Procedure Text) adalah...",
            options: ["Menjelaskan langkah-langkah membuat sesuatu", "Menceritakan cerita dongeng fiksi", "Menghibur pembaca dengan pantun"],
            correctIndex: 0,
            explanation: "Teks prosedur menjelaskan langkah-langkah kerja berurutan.",
          },
          {
            id: 2,
            question: "Kata kerja perintah 'Pour the water into the glass' artinya...",
            options: ["Tuangkan air ke dalam gelas", "Aduklah air di gelas", "Minumlah air di gelas"],
            correctIndex: 0,
            explanation: "'Pour' artinya menuangkan.",
          },
          {
            id: 3,
            question: "Kata kerja perintah 'Stir well' artinya...",
            options: ["Aduklah hingga rata", "Potonglah rapi", "Gorenglah matang"],
            correctIndex: 0,
            explanation: "'Stir' artinya mengaduk.",
          },
          {
            id: 4,
            question: "Kata sambung urutan pertama dalam teks prosedur adalah...",
            options: ["First", "Finally", "Then"],
            correctIndex: 0,
            explanation: "'First' artinya pertama-tama.",
          },
          {
            id: 5,
            question: "Kata sambung urutan langkah terakhir adalah...",
            options: ["Finally", "First", "Next"],
            correctIndex: 0,
            explanation: "'Finally' atau 'lastly' menandakan langkah penutup / terakhir.",
          },
          {
            id: 6,
            question: "Bagian yang berisi bahan-bahan yang dibutuhkan dalam resep disebut...",
            options: ["Ingredients", "Steps", "Goals"],
            correctIndex: 0,
            explanation: "Bahan-bahan adalah 'Ingredients'.",
          },
          {
            id: 7,
            question: "Kata kerja perintah 'Cut the fruit into small pieces' artinya...",
            options: ["Potonglah buah menjadi potongan kecil", "Cuci buah hingga bersih", "Makanlah buah itu"],
            correctIndex: 0,
            explanation: "'Cut' artinya memotong.",
          },
          {
            id: 8,
            question: "Kata kerja perintah untuk menyalakan kompor atau alat elektronik adalah...",
            options: ["Turn on", "Turn off", "Mix"],
            correctIndex: 0,
            explanation: "'Turn on' artinya menyalakan.",
          },
          {
            id: 9,
            question: "Kata kerja perintah 'Mix the flour and eggs together' artinya...",
            options: ["Campurkan tepung dan telur bersama-sama", "Panggang kue di oven", "Belilah telur di pasar"],
            correctIndex: 0,
            explanation: "'Mix' artinya mencampurkan.",
          },
          {
            id: 10,
            question: "Langkah penutup dalam resep makanan: '... while warm.'",
            options: ["Serve (Sajikan)", "Cut", "Boil"],
            correctIndex: 0,
            explanation: "'Serve' artinya sajikan selagi hangat.",
          },
        ],
      };

    default:
      return {
        title: "English Level",
        conceptText: "Materi belajar Bahasa Inggris Kelas 5 SD.",
        questions: [],
      };
  }
}
