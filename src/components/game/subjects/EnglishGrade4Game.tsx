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

interface EnglishGrade4GameProps {
  levelId: number;
  onLevelComplete: (levelId: number, starsEarned: number) => void;
  accessibilityMode?: string;
}

export function EnglishGrade4Game({ levelId, onLevelComplete, accessibilityMode }: EnglishGrade4GameProps) {
  const [phase, setPhase] = useState<"materi" | "game">("materi");

  // Phase 1 interactive states
  const [activePresentSubject, setActivePresentSubject] = useState<{ sub: string; verb: string; sample: string }>({ sub: "She", verb: "reads", sample: "She reads a storybook every morning" });
  const [activeDetailedTime, setActiveDetailedTime] = useState<{ time: string; read: string; indo: string }>({ time: "07.15", read: "Quarter past seven", indo: "Jam 7 lewat 15 menit" });
  const [activeSubject, setActiveSubject] = useState<{ name: string; desc: string }>({ name: "Science", desc: "Learning about nature, animals, and plants" });
  const [activeJob, setActiveJob] = useState<{ job: string; place: string; duty: string }>({ job: "Doctor", place: "Hospital", duty: "Curing sick people" });
  const [activeDirection, setActiveDirection] = useState<{ dir: string; indo: string }>({ dir: "Turn left", indo: "Belok kiri" });
  const [activeLikeForm, setActiveLikeForm] = useState<{ expr: string; example: string }>({ expr: "Like + V-ing", example: "I like swimming in the pool" });
  const [activeQuantifier, setActiveQuantifier] = useState<{ word: string; rule: string; example: string }>({ word: "Many", rule: "Untuk benda dapat dihitung (countable)", example: "Many books" });

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
    setActivePresentSubject({ sub: "She", verb: "reads", sample: "She reads a storybook every morning" });
    setActiveDetailedTime({ time: "07.15", read: "Quarter past seven", indo: "Jam 7 lewat 15 menit" });
    setActiveSubject({ name: "Science", desc: "Learning about nature, animals, and plants" });
    setActiveJob({ job: "Doctor", place: "Hospital", duty: "Curing sick people" });
    setActiveDirection({ dir: "Turn left", indo: "Belok kiri" });
    setActiveLikeForm({ expr: "Like + V-ing", example: "I like swimming in the pool" });
    setActiveQuantifier({ word: "Many", rule: "Untuk benda dapat dihitung (countable)", example: "Many books" });

    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setWrongAttempts(0);
    setShowClue(false);
    setIsCompleted(false);
    isProcessingRef.current = false;

    const data = getGrade4EnglishData(levelId);
    setQuestionsList(shuffleQuestions(data));
    speakGlobal(data.conceptText);
  }, [levelId]);

  const levelData = getGrade4EnglishData(levelId);
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
      speakGlobal("Terrific! You got it right! " + currentQ.explanation);

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
          speakGlobal(`Outstanding! You finished all 10 questions and received ${stars} stars!`);
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
        speakGlobal("Not quite right yet. Check the explanation and try again!");
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
            KELAS 4 SD • LEVEL {levelId} dari 7
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
                  Simple Present Tense (Aturan Verb + s/es):
                </span>
                <div className="grid grid-cols-2 gap-2 w-full text-xs">
                  <div className="p-3 bg-white border-2 border-[#3C632A] rounded-xl text-left shadow-sm">
                    <strong className="text-[#3C632A] block mb-1">I / You / They / We:</strong>
                    Verb 1 dasar (tanpa akhiran -s).<br />
                    <em>"They play football every Sunday."</em>
                  </div>
                  <div className="p-3 bg-white border-2 border-[#3C632A] rounded-xl text-left shadow-sm">
                    <strong className="text-[#C3631D] block mb-1">He / She / It:</strong>
                    Verb 1 + s / es.<br />
                    <em>"She plays piano every afternoon."</em>
                  </div>
                </div>
              </div>
            )}

            {levelId === 2 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Telling Time: Past, To, & Quarter:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full text-xs">
                  {[
                    { time: "07.15", eng: "Quarter past seven", indo: "Lewat 15 menit" },
                    { time: "07.30", eng: "Half past seven", indo: "Lewat 30 menit" },
                    { time: "07.45", eng: "Quarter to eight", indo: "Kurang 15 menit ke jam 8" },
                    { time: "08.10", eng: "Ten past eight", indo: "Lewat 10 menit" },
                  ].map((t) => (
                    <button
                      key={t.time}
                      type="button"
                      onClick={() => {
                        setActiveDetailedTime({ time: t.time, read: t.eng, indo: t.indo });
                        playPopSound();
                        speakGlobal(`Time ${t.time} is ${t.eng}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] text-center cursor-pointer transition-all ${
                        activeDetailedTime.time === t.time ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-sm">{t.time}</strong>
                      <span className="text-[10px] font-bold block">{t.eng}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {levelId === 3 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  School Subjects (Mata Pelajaran Sekolah):
                </span>
                <div className="grid grid-cols-3 gap-2 w-full text-xs">
                  {[
                    { name: "Math", desc: "Numbers and calculations (Matematika)" },
                    { name: "Science", desc: "Nature and experiments (IPA)" },
                    { name: "English", desc: "Vocabulary and grammar (Bahasa Inggris)" },
                    { name: "Art", desc: "Drawing and crafting (Seni Budaya)" },
                    { name: "PE", desc: "Physical Education and sports (PJOK)" },
                    { name: "Social Studies", desc: "History and geography (IPS)" },
                  ].map((s) => (
                    <button
                      key={s.name}
                      type="button"
                      onClick={() => {
                        setActiveSubject(s);
                        playPopSound();
                        speakGlobal(`Subject ${s.name}. ${s.desc}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] text-center cursor-pointer transition-all ${
                        activeSubject.name === s.name ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block">{s.name}</strong>
                      <span className="text-[10px] opacity-80">{s.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {levelId === 4 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Professions & Workplaces:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full text-xs">
                  {[
                    { job: "Teacher", place: "School", duty: "Teaches students" },
                    { job: "Doctor", place: "Hospital", duty: "Treats patients" },
                    { job: "Chef", place: "Restaurant", duty: "Cooks food" },
                    { job: "Pilot", place: "Airport", duty: "Flies airplanes" },
                  ].map((j) => (
                    <button
                      key={j.job}
                      type="button"
                      onClick={() => {
                        setActiveJob(j);
                        playPopSound();
                        speakGlobal(`A ${j.job} works at a ${j.place} and ${j.duty}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] text-center cursor-pointer transition-all ${
                        activeJob.job === j.job ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block">{j.job}</strong>
                      <span className="text-[10px] opacity-80 block">{j.place}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {levelId === 5 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Places in Town & Giving Directions:
                </span>
                <div className="grid grid-cols-3 gap-2 w-full text-xs">
                  {[
                    { dir: "Turn left", indo: "Belok kiri" },
                    { dir: "Turn right", indo: "Belok kanan" },
                    { dir: "Go straight", indo: "Lurus ke depan" },
                  ].map((d) => (
                    <button
                      key={d.dir}
                      type="button"
                      onClick={() => {
                        setActiveDirection(d);
                        playPopSound();
                        speakGlobal(`Direction ${d.dir}, artinya ${d.indo}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] text-center cursor-pointer transition-all ${
                        activeDirection.dir === d.dir ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block">{d.dir}</strong>
                      <span className="text-[10px] opacity-80">{d.indo}</span>
                    </button>
                  ))}
                </div>
                <div className="text-[11px] font-bold text-[#3C632A] bg-white/70 px-3 py-1 rounded-lg border border-[#3C632A]">
                  Fasilitas Kota: Bank, Hospital (Rumah Sakit), Market (Pasar), Library (Perpustakaan).
                </div>
              </div>
            )}

            {levelId === 6 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Likes and Dislikes (Prefer / Like + V-ing):
                </span>
                <div className="grid grid-cols-2 gap-2 w-full text-xs">
                  <div className="p-3 bg-white border-2 border-[#3C632A] rounded-xl text-left shadow-sm">
                    <strong className="text-[#3C632A] block mb-1">Like + V-ing:</strong>
                    <em>"I like drawing pictures."</em><br />
                    <em>"He likes playing guitar."</em>
                  </div>
                  <div className="p-3 bg-white border-2 border-[#3C632A] rounded-xl text-left shadow-sm">
                    <strong className="text-[#C3631D] block mb-1">Prefer (Lebih Suka):</strong>
                    <em>"I prefer milk to tea."</em><br />
                    <em>(Saya lebih suka susu daripada teh)</em>
                  </div>
                </div>
              </div>
            )}

            {levelId === 7 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Quantifiers (Some, Any, Much, Many):
                </span>
                <div className="grid grid-cols-2 gap-2 w-full text-xs">
                  <div className="p-3 bg-white border-2 border-[#3C632A] rounded-xl text-left shadow-sm">
                    <strong className="text-[#3C632A] block mb-0.5">Many vs Much:</strong>
                    • <strong>Many:</strong> Benda dapat dihitung (Many pens)<br />
                    • <strong>Much:</strong> Benda tidak dapat dihitung (Much water)
                  </div>
                  <div className="p-3 bg-white border-2 border-[#3C632A] rounded-xl text-left shadow-sm">
                    <strong className="text-[#C3631D] block mb-0.5">Some vs Any:</strong>
                    • <strong>Some:</strong> Kalimat positif ("I have some apples")<br />
                    • <strong>Any:</strong> Kalimat negatif / tanya ("Do you have any milk?")
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

// ================= DATA SOAL KELAS 4 SD BAHASA INGGRIS (7 LEVEL x 10 SOAL = 70 SOAL) =================
function getGrade4EnglishData(levelId: number): LevelConceptData {
  switch (levelId) {
    case 1:
      return {
        title: "Simple Present Tense",
        conceptText: "Simple Present Tense digunakan untuk rutinitas sehari-hari dan fakta umum: tambahkan -s/-es untuk subjek He, She, It, dan gunakan do/does untuk kalimat tanya/negatif.",
        questions: [
          {
            id: 1,
            question: "Lengkapi kalimat: 'He ... to school by bicycle every morning.'",
            options: ["goes", "go", "going"],
            correctIndex: 0,
            explanation: "Subjek 'He' membutuhkan kata kerja berakhiran -es ('goes').",
          },
          {
            id: 2,
            question: "Lengkapi kalimat: 'They ... football in the yard every Sunday.'",
            options: ["play", "plays", "playing"],
            correctIndex: 0,
            explanation: "Subjek jamak 'They' menggunakan bentuk dasar 'play'.",
          },
          {
            id: 3,
            question: "Kata bantu tanya yang tepat untuk subjek 'She' adalah...",
            options: ["Does", "Do", "Is"],
            correctIndex: 0,
            explanation: "'Does' digunakan untuk subjek He, She, dan It.",
          },
          {
            id: 4,
            question: "Lengkapi kalimat: '... you like orange juice?'",
            options: ["Do", "Does", "Are"],
            correctIndex: 0,
            explanation: "Subjek 'you' berpasangan dengan kata bantu 'Do'.",
          },
          {
            id: 5,
            question: "Bentuk negatif yang benar untuk 'She likes milk' adalah...",
            options: ["She does not like milk", "She do not like milk", "She is not like milk"],
            correctIndex: 0,
            explanation: "Bentuk negatif untuk 'she' adalah 'does not like'.",
          },
          {
            id: 6,
            question: "Fakta umum: 'The sun ... in the east.'",
            options: ["rises", "rise", "rising"],
            correctIndex: 0,
            explanation: "Matahari adalah subjek tunggal (it), sehingga menggunakan 'rises'.",
          },
          {
            id: 7,
            question: "Lengkapi kalimat: 'My father ... in a big office.'",
            options: ["works", "work", "working"],
            correctIndex: 0,
            explanation: "'My father' (he) berpasangan dengan 'works'.",
          },
          {
            id: 8,
            question: "Lengkapi kalimat tanya: 'Where ... they live?'",
            options: ["do", "does", "are"],
            correctIndex: 0,
            explanation: "Subjek 'they' berpasangan dengan 'do'.",
          },
          {
            id: 9,
            question: "Arti dari kalimat 'Cats like fish' adalah...",
            options: ["Kucing menyukai ikan", "Kucing menangkap ikan", "Kucing makan daging"],
            correctIndex: 0,
            explanation: "Kalimat ini menyatakan fakta umum kesukaan kucing.",
          },
          {
            id: 10,
            question: "Lengkapi kalimat: 'We always ... our teeth before bed.'",
            options: ["brush", "brushes", "brushing"],
            correctIndex: 0,
            explanation: "Subjek 'We' menggunakan kata kerja dasar 'brush'.",
          },
        ],
      };

    case 2:
      return {
        title: "Telling the Time (Detailed)",
        conceptText: "Membaca jam lanjutan: 'past' (lewat menit), 'to' (menuju/kurang menit), 'quarter past' (lewat 15 menit), dan 'quarter to' (kurang 15 menit).",
        questions: [
          {
            id: 1,
            question: "Pukul 08.15 dalam bahasa Inggris disebut...",
            options: ["Quarter past eight", "Quarter to eight", "Half past eight"],
            correctIndex: 0,
            explanation: "Lewat 15 menit adalah 'Quarter past eight'.",
          },
          {
            id: 2,
            question: "Pukul 08.45 (jam 9 kurang 15 menit) dalam bahasa Inggris disebut...",
            options: ["Quarter to nine", "Quarter past eight", "Half past nine"],
            correctIndex: 0,
            explanation: "Kurang 15 menit menuju jam 9 adalah 'Quarter to nine'.",
          },
          {
            id: 3,
            question: "Pukul 07.10 dibaca...",
            options: ["Ten past seven", "Ten to seven", "Seven ten o'clock"],
            correctIndex: 0,
            explanation: "Lewat 10 menit dari jam 7 adalah 'Ten past seven'.",
          },
          {
            id: 4,
            question: "Pukul 09.50 (jam 10 kurang 10 menit) dibaca...",
            options: ["Ten to ten", "Ten past nine", "Nine fifty o'clock"],
            correctIndex: 0,
            explanation: "Kurang 10 menit menuju jam 10 adalah 'Ten to ten'.",
          },
          {
            id: 5,
            question: "Kata 'Quarter' dalam membaca jam bernilai berapa menit?",
            options: ["15 minutes", "30 minutes", "45 minutes"],
            correctIndex: 0,
            explanation: "'Quarter' artinya seperempat jam atau 15 menit.",
          },
          {
            id: 6,
            question: "Kata 'Half past' bernilai berapa menit?",
            options: ["30 minutes", "15 minutes", "20 minutes"],
            correctIndex: 0,
            explanation: "'Half' artinya setengah jam atau 30 menit.",
          },
          {
            id: 7,
            question: "Pukul 03.30 dibaca...",
            options: ["Half past three", "Half to three", "Quarter past three"],
            correctIndex: 0,
            explanation: "Pukul 03.30 adalah 'Half past three'.",
          },
          {
            id: 8,
            question: "Pukul 06.05 dibaca...",
            options: ["Five past six", "Five to six", "Six o'clock five"],
            correctIndex: 0,
            explanation: "Lewat 5 menit adalah 'Five past six'.",
          },
          {
            id: 9,
            question: "Arti dari pertanyaan 'What time is it?' adalah...",
            options: ["Jam berapa sekarang?", "Hari apa sekarang?", "Berapa harganya?"],
            correctIndex: 0,
            explanation: "'What time is it?' digunakan untuk menanyakan waktu saat ini.",
          },
          {
            id: 10,
            question: "Pukul 11.45 dibaca...",
            options: ["Quarter to twelve", "Quarter past eleven", "Quarter to eleven"],
            correctIndex: 0,
            explanation: "11.45 adalah 15 menit menuju jam 12 ('Quarter to twelve').",
          },
        ],
      };

    case 3:
      return {
        title: "School Subjects & Schedules",
        conceptText: "Mengenal mata pelajaran sekolah: Math (Matematika), Science (IPA), English, Indonesian, Art (Seni), PE (Olahraga), serta jadwal mingguan.",
        questions: [
          {
            id: 1,
            question: "Mata pelajaran yang mempelajari hitungan dan angka adalah...",
            options: ["Math", "Science", "History"],
            correctIndex: 0,
            explanation: "Matematika adalah 'Math' (Mathematics).",
          },
          {
            id: 2,
            question: "Mata pelajaran yang mempelajari alam, tumbuhan, dan hewan adalah...",
            options: ["Science", "Art", "Math"],
            correctIndex: 0,
            explanation: "Ilmu Pengetahuan Alam adalah 'Science'.",
          },
          {
            id: 3,
            question: "Mata pelajaran olahraga dan aktivitas fisik di sekolah disingkat...",
            options: ["PE (Physical Education)", "Art", "IT"],
            correctIndex: 0,
            explanation: "Pendidikan jasmani adalah 'PE'.",
          },
          {
            id: 4,
            question: "Mata pelajaran menggambar dan membuat kerajinan tangan adalah...",
            options: ["Art", "Science", "Math"],
            correctIndex: 0,
            explanation: "Seni adalah 'Art'.",
          },
          {
            id: 5,
            question: "Lengkapi kalimat: 'We have English class on ...' (hari Rabu)",
            options: ["Wednesday", "Tuesday", "Monday"],
            correctIndex: 0,
            explanation: "Hari Rabu adalah 'Wednesday'.",
          },
          {
            id: 6,
            question: "Jadwal pelajaran sekolah dalam bahasa Inggris disebut...",
            options: ["Schedule", "Dictionary", "Library"],
            correctIndex: 0,
            explanation: "Jadwal adalah 'Schedule' (atau timetable).",
          },
          {
            id: 7,
            question: "Pertanyaan 'What is your favorite subject?' artinya...",
            options: ["Apa mata pelajaran kesukaanmu?", "Kapan kamu belajar?", "Di mana sekolahmu?"],
            correctIndex: 0,
            explanation: "Kalimat ini menanyakan mata pelajaran favorit.",
          },
          {
            id: 8,
            question: "Mata pelajaran sejarah dan geografi masyarakat disebut...",
            options: ["Social Studies", "Science", "PE"],
            correctIndex: 0,
            explanation: "IPS disebut 'Social Studies'.",
          },
          {
            id: 9,
            question: "Jawaban yang tepat untuk 'What is your favorite subject?' adalah...",
            options: ["My favorite subject is Science", "I like apples", "I go to school at 7"],
            correctIndex: 0,
            explanation: "'My favorite subject is Science' adalah jawaban yang sesuai.",
          },
          {
            id: 10,
            question: "Pelajaran keagamaan di sekolah disebut...",
            options: ["Religion", "Civics", "Music"],
            correctIndex: 0,
            explanation: "Pendidikan agama adalah 'Religion'.",
          },
        ],
      };

    case 4:
      return {
        title: "Professions & Jobs",
        conceptText: "Mengenal berbagai macam profesi: Teacher (guru), Doctor (dokter), Police officer (polisi), Chef (koki), Pilot (pilot), Farmer (petani) dan tempat kerjanya.",
        questions: [
          {
            id: 1,
            question: "Profesi yang bertugas mengajar murid di sekolah adalah...",
            options: ["Teacher", "Doctor", "Pilot"],
            correctIndex: 0,
            explanation: "Guru adalah 'Teacher'.",
          },
          {
            id: 2,
            question: "Tempat kerja seorang dokter (Doctor) adalah...",
            options: ["Hospital", "School", "Restaurant"],
            correctIndex: 0,
            explanation: "Dokter bekerja di rumah sakit (Hospital).",
          },
          {
            id: 3,
            question: "Profesi yang menerbangkan pesawat terbang adalah...",
            options: ["Pilot", "Driver", "Sailor"],
            correctIndex: 0,
            explanation: "Pilot adalah 'Pilot'.",
          },
          {
            id: 4,
            question: "Profesi yang memasak makanan lezat di restoran adalah...",
            options: ["Chef", "Teacher", "Police officer"],
            correctIndex: 0,
            explanation: "Koki adalah 'Chef'.",
          },
          {
            id: 5,
            question: "Petani yang menanam padi dan sayuran di sawah disebut...",
            options: ["Farmer", "Fisherman", "Nurse"],
            correctIndex: 0,
            explanation: "Petani adalah 'Farmer'.",
          },
          {
            id: 6,
            question: "Tempat kerja seorang polisi (Police officer) adalah...",
            options: ["Police station", "Bank", "Market"],
            correctIndex: 0,
            explanation: "Polisi bertugas di kantor polisi (Police station).",
          },
          {
            id: 7,
            question: "Perawat yang membantu dokter merawat orang sakit adalah...",
            options: ["Nurse", "Chef", "Tailor"],
            correctIndex: 0,
            explanation: "Perawat adalah 'Nurse'.",
          },
          {
            id: 8,
            question: "Pertanyaan 'What do you want to be in the future?' menanyakan...",
            options: ["Cita-cita pekerjaan masa depan", "Hobi masa kecil", "Tempat tinggal"],
            correctIndex: 0,
            explanation: "Kalimat ini menanyakan cita-cita di masa depan.",
          },
          {
            id: 9,
            question: "Nelayan yang mencari ikan di laut disebut...",
            options: ["Fisherman", "Farmer", "Driver"],
            correctIndex: 0,
            explanation: "Nelayan adalah 'Fisherman'.",
          },
          {
            id: 10,
            question: "Petugas pemadam kebakaran dalam bahasa Inggris adalah...",
            options: ["Firefighter", "Police officer", "Security"],
            correctIndex: 0,
            explanation: "Pemadam kebakaran adalah 'Firefighter'.",
          },
        ],
      };

    case 5:
      return {
        title: "Places in Town & Directions",
        conceptText: "Mengenal fasilitas umum: Hospital (rumah sakit), Market (pasar), Bank, Library (perpustakaan), dan petunjuk arah: Turn left, Turn right, Go straight.",
        questions: [
          {
            id: 1,
            question: "Petunjuk arah 'Turn left' artinya...",
            options: ["Belok kiri", "Belok kanan", "Jalan lurus"],
            correctIndex: 0,
            explanation: "'Turn left' artinya belok ke arah kiri.",
          },
          {
            id: 2,
            question: "Petunjuk arah 'Turn right' artinya...",
            options: ["Belok kanan", "Belok kiri", "Berhenti"],
            correctIndex: 0,
            explanation: "'Turn right' artinya belok ke arah kanan.",
          },
          {
            id: 3,
            question: "Petunjuk arah 'Go straight' artinya...",
            options: ["Lurus terus", "Putar balik", "Belok kanan"],
            correctIndex: 0,
            explanation: "'Go straight' artinya jalan lurus terus.",
          },
          {
            id: 4,
            question: "Tempat meminjam dan membaca banyak buku disebut...",
            options: ["Library", "Hospital", "Cinema"],
            correctIndex: 0,
            explanation: "Perpustakaan adalah 'Library'.",
          },
          {
            id: 5,
            question: "Tempat menyimpan dan menabung uang yang aman adalah...",
            options: ["Bank", "Market", "Park"],
            correctIndex: 0,
            explanation: "Bank adalah 'Bank'.",
          },
          {
            id: 6,
            question: "Tempat membeli sayuran, buah, dan kebutuhan pokok sehari-hari adalah...",
            options: ["Market", "Hospital", "Post office"],
            correctIndex: 0,
            explanation: "Pasar adalah 'Market'.",
          },
          {
            id: 7,
            question: "Kantor pos tempat mengirim surat dan paket adalah...",
            options: ["Post office", "Police station", "Station"],
            correctIndex: 0,
            explanation: "Kantor pos adalah 'Post office'.",
          },
          {
            id: 8,
            question: "Arti dari pertanyaan 'Where is the hospital?' adalah...",
            options: ["Di mana letak rumah sakit?", "Kapan rumah sakit buka?", "Siapa dokter di sana?"],
            correctIndex: 0,
            explanation: "'Where is...' digunakan untuk menanyakan lokasi tempat.",
          },
          {
            id: 9,
            question: "Taman umum tempat anak-anak bermain ayunan dan berlari adalah...",
            options: ["Park", "Bank", "Hotel"],
            correctIndex: 0,
            explanation: "Taman adalah 'Park'.",
          },
          {
            id: 10,
            question: "Lampu lalu lintas di jalan raya disebut...",
            options: ["Traffic light", "Street lamp", "Car light"],
            correctIndex: 0,
            explanation: "Lampu lalu lintas adalah 'Traffic light'.",
          },
        ],
      };

    case 6:
      return {
        title: "Expressing Likes & Dislikes",
        conceptText: "Menyatakan kesukaan dan ketidaksukaan dengan pola: like + V-ing ('I like dancing'), prefer ('I prefer tea to coffee'), dan dislike.",
        questions: [
          {
            id: 1,
            question: "Pola setelah kata 'like' dapat menggunakan bentuk Verb-ing. Contohnya adalah...",
            options: ["I like swimming", "I like swim", "I like swims"],
            correctIndex: 0,
            explanation: "Pola 'like + V-ing': 'I like swimming'.",
          },
          {
            id: 2,
            question: "Kata 'Prefer' digunakan untuk menyatakan...",
            options: ["Pilihan yang lebih disukai", "Ketidaksukaan mendalam", "Kewajiban tugas"],
            correctIndex: 0,
            explanation: "'Prefer' menyatakan rasa lebih menyukai sesuatu daripada yang lain.",
          },
          {
            id: 3,
            question: "Arti dari kalimat 'I prefer reading to watching TV' adalah...",
            options: ["Saya lebih suka membaca daripada menonton TV", "Saya suka menonton TV saja", "Saya tidak membaca buku"],
            correctIndex: 0,
            explanation: "'Prefer A to B' artinya lebih suka A daripada B.",
          },
          {
            id: 4,
            question: "Lengkapi kalimat: 'He enjoys ... guitar in his free time.'",
            options: ["playing", "play", "plays"],
            correctIndex: 0,
            explanation: "Setelah kata kerja 'enjoy' digunakan bentuk gerund (V-ing) 'playing'.",
          },
          {
            id: 5,
            question: "Kata 'Dislike' memiliki makna yang sama dengan...",
            options: ["Do not like", "Love", "Enjoy"],
            correctIndex: 0,
            explanation: "'Dislike' artinya tidak menyukai (do not like).",
          },
          {
            id: 6,
            question: "Manakah kalimat yang benar?",
            options: ["She likes drawing pictures", "She likes draw pictures", "She like drawing pictures"],
            correctIndex: 0,
            explanation: "Subjek 'She' membutuhkan 'likes' + gerund 'drawing'.",
          },
          {
            id: 7,
            question: "Lengkapi kalimat: 'Do you like ... football?'",
            options: ["playing", "played", "plays"],
            correctIndex: 0,
            explanation: "Gunakan bentuk 'playing' setelah kata kerja 'like'.",
          },
          {
            id: 8,
            question: "Arti kalimat 'I do not mind helping you' adalah...",
            options: ["Saya tidak keberatan membantumu", "Saya tidak mau membantumu", "Saya butuh bantuanmu"],
            correctIndex: 0,
            explanation: "'Do not mind' artinya tidak keberatan.",
          },
          {
            id: 9,
            question: "Lengkapi kalimat: 'They dislike ... spicy food.'",
            options: ["eating", "eat", "eaten"],
            correctIndex: 0,
            explanation: "Gunakan bentuk V-ing 'eating' setelah 'dislike'.",
          },
          {
            id: 10,
            question: "Arti dari 'I love cooking' adalah...",
            options: ["Saya sangat suka memasak", "Saya tidak suka memasak", "Saya sedang memasak"],
            correctIndex: 0,
            explanation: "'Love' menyatakan rasa sangat suka.",
          },
        ],
      };

    case 7:
      return {
        title: "Quantifiers: Some, Any, Much, Many",
        conceptText: "Penggunaan penentu jumlah: 'Many' untuk benda dapat dihitung (countable), 'Much' untuk benda tidak dapat dihitung (uncountable), 'Some' untuk kalimat positif, dan 'Any' untuk kalimat negatif/tanya.",
        questions: [
          {
            id: 1,
            question: "Untuk benda yang dapat dihitung (seperti books, pens), kata jumlah banyak yang digunakan adalah...",
            options: ["Many", "Much", "Little"],
            correctIndex: 0,
            explanation: "'Many' digunakan untuk countable nouns (benda yang bisa dihitung).",
          },
          {
            id: 2,
            question: "Untuk benda cair yang tidak dapat dihitung (seperti water, milk), kata jumlah yang digunakan adalah...",
            options: ["Much", "Many", "Few"],
            correctIndex: 0,
            explanation: "'Much' digunakan untuk uncountable nouns (benda tidak dapat dihitung).",
          },
          {
            id: 3,
            question: "Lengkapi kalimat positif: 'There are ... apples on the table.'",
            options: ["some", "any", "much"],
            correctIndex: 0,
            explanation: "Kalimat positif menggunakan 'some'.",
          },
          {
            id: 4,
            question: "Lengkapi kalimat negatif: 'I do not have ... money left.'",
            options: ["any", "some", "many"],
            correctIndex: 0,
            explanation: "Kalimat negatif menggunakan 'any'.",
          },
          {
            id: 5,
            question: "Lengkapi kalimat tanya: 'Do you have ... brothers?'",
            options: ["any", "some", "much"],
            correctIndex: 0,
            explanation: "Kalimat pertanyaan umum menggunakan 'any'.",
          },
          {
            id: 6,
            question: "Manakah kalimat yang benar?",
            options: ["How many pencils do you have?", "How much pencils do you have?", "How any pencils do you have?"],
            correctIndex: 0,
            explanation: "Pencils adalah countable, jadi gunakan 'How many'.",
          },
          {
            id: 7,
            question: "Untuk menanyakan jumlah air gula, pertanyaan yang tepat adalah...",
            options: ["How much sugar do you need?", "How many sugar do you need?", "How any sugar do you need?"],
            correctIndex: 0,
            explanation: "Sugar adalah uncountable noun, jadi gunakan 'How much'.",
          },
          {
            id: 8,
            question: "Frasa 'A lot of' dapat digunakan untuk...",
            options: ["Benda dapat dihitung maupun tidak dapat dihitung", "Hanya benda cair", "Hanya satu benda"],
            correctIndex: 0,
            explanation: "'A lot of' fleksibel untuk countable maupun uncountable.",
          },
          {
            id: 9,
            question: "Lengkapi kalimat: 'She drinks ... water every day.'",
            options: ["a lot of", "many", "any"],
            correctIndex: 0,
            explanation: "'A lot of water' (banyak air) adalah frasa yang tepat.",
          },
          {
            id: 10,
            question: "Lengkapi kalimat: 'There is not ... milk in the fridge.'",
            options: ["much", "many", "some"],
            correctIndex: 0,
            explanation: "Milk adalah uncountable, bentuk negatifnya menggunakan 'much' (not much milk).",
          },
        ],
      };

    default:
      return {
        title: "English Level",
        conceptText: "Materi belajar Bahasa Inggris Kelas 4 SD.",
        questions: [],
      };
  }
}
