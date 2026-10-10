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

interface EnglishGrade3GameProps {
  levelId: number;
  onLevelComplete: (levelId: number, starsEarned: number) => void;
  accessibilityMode?: string;
}

export function EnglishGrade3Game({ levelId, onLevelComplete, accessibilityMode }: EnglishGrade3GameProps) {
  const [phase, setPhase] = useState<"materi" | "game">("materi");

  // Phase 1 interactive states
  const [activeTimeRoutine, setActiveTimeRoutine] = useState<{ time: string; routine: string; indo: string }>({ time: "06.00", routine: "Six o'clock: Wake up", indo: "Jam 6 tepat: Bangun tidur" });
  const [activeDay, setActiveDay] = useState<{ day: string; indo: string }>({ day: "Monday", indo: "Senin" });
  const [activeWeather, setActiveWeather] = useState<{ weather: string; indo: string; tip: string }>({ weather: "Sunny", indo: "Cerah", tip: "Wear sunglasses" });
  const [activeHobby, setActiveHobby] = useState<{ hobby: string; indo: string }>({ hobby: "Reading", indo: "Membaca buku" });
  const [activePreposition, setActivePreposition] = useState<{ prep: string; example: string; indo: string }>({ prep: "In", example: "The pencil is in the box", indo: "Di dalam kotak" });
  const [activeHaveHas, setActiveHaveHas] = useState<{ subject: string; verb: string; object: string }>({ subject: "I", verb: "have", object: "a new bicycle" });
  const [activeFeeling, setActiveFeeling] = useState<{ emotion: string; indo: string; sentence: string }>({ emotion: "Happy", indo: "Senang", sentence: "I feel happy today!" });

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
    setActiveTimeRoutine({ time: "06.00", routine: "Six o'clock: Wake up", indo: "Jam 6 tepat: Bangun tidur" });
    setActiveDay({ day: "Monday", indo: "Senin" });
    setActiveWeather({ weather: "Sunny", indo: "Cerah", tip: "Wear sunglasses" });
    setActiveHobby({ hobby: "Reading", indo: "Membaca buku" });
    setActivePreposition({ prep: "In", example: "The pencil is in the box", indo: "Di dalam kotak" });
    setActiveHaveHas({ subject: "I", verb: "have", object: "a new bicycle" });
    setActiveFeeling({ emotion: "Happy", indo: "Senang", sentence: "I feel happy today!" });

    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setWrongAttempts(0);
    setShowClue(false);
    setIsCompleted(false);
    isProcessingRef.current = false;

    const data = getGrade3EnglishData(levelId);
    setQuestionsList(shuffleQuestions(data));
    speakGlobal(data.conceptText);
  }, [levelId]);

  const levelData = getGrade3EnglishData(levelId);
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
      speakGlobal("Brilliant! Correct answer! " + currentQ.explanation);

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
          speakGlobal(`Fantastic! You completed all 10 questions and received ${stars} stars!`);
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
            KELAS 3 SD • LEVEL {levelId} dari 7
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
                  Telling Time & Daily Routines:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full text-xs">
                  {[
                    { time: "06.00", routine: "Six o'clock", action: "Wake up" },
                    { time: "06.30", routine: "Half past six", action: "Take a bath" },
                    { time: "07.00", routine: "Seven o'clock", action: "Go to school" },
                  ].map((t) => (
                    <button
                      key={t.time}
                      type="button"
                      onClick={() => {
                        setActiveTimeRoutine({ time: t.time, routine: t.routine, indo: t.action });
                        playPopSound();
                        speakGlobal(`At ${t.routine}, I ${t.action}`);
                      }}
                      className={`p-3 rounded-xl border-2 border-[#3C632A] text-center cursor-pointer transition-all ${
                        activeTimeRoutine.time === t.time ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-sm">{t.time}</strong>
                      <span className="text-[11px] font-bold block">{t.routine}</span>
                      <span className="text-[10px] opacity-80 block">{t.action}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {levelId === 2 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Days of the Week (Nama-Nama Hari):
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 w-full text-xs">
                  {[
                    { day: "Monday", indo: "Senin" },
                    { day: "Tuesday", indo: "Selasa" },
                    { day: "Wednesday", indo: "Rabu" },
                    { day: "Thursday", indo: "Kamis" },
                    { day: "Friday", indo: "Jumat" },
                    { day: "Saturday", indo: "Sabtu" },
                    { day: "Sunday", indo: "Minggu" },
                  ].map((d) => (
                    <button
                      key={d.day}
                      type="button"
                      onClick={() => {
                        setActiveDay(d);
                        playPopSound();
                        speakGlobal(`Day ${d.day}, artinya hari ${d.indo}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] text-center cursor-pointer transition-all ${
                        activeDay.day === d.day ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block">{d.day}</strong>
                      <span className="text-[10px] opacity-80">{d.indo}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {levelId === 3 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Weather & Seasons (Cuaca & Musim):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full text-xs">
                  {[
                    { weather: "Sunny", indo: "Cerah berawan", tip: "Matahari bersinar" },
                    { weather: "Rainy", indo: "Hujan", tip: "Pakai payung / jas hujan" },
                    { weather: "Cloudy", indo: "Mendung", tip: "Banyak awan kelabu" },
                    { weather: "Windy", indo: "Berangin", tip: "Angin bertiup kencang" },
                  ].map((w) => (
                    <button
                      key={w.weather}
                      type="button"
                      onClick={() => {
                        setActiveWeather(w);
                        playPopSound();
                        speakGlobal(`Today is ${w.weather}. Cuaca ${w.indo}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] text-center cursor-pointer transition-all ${
                        activeWeather.weather === w.weather ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block">{w.weather}</strong>
                      <span className="text-[10px] opacity-80">{w.indo}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {levelId === 4 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Hobbies & Free Time Activities:
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 w-full text-xs">
                  {[
                    { hobby: "Swimming", indo: "Berenang" },
                    { hobby: "Reading", indo: "Membaca" },
                    { hobby: "Playing football", indo: "Sepak bola" },
                    { hobby: "Drawing", indo: "Menggambar" },
                    { hobby: "Singing", indo: "Bernyanyi" },
                    { hobby: "Dancing", indo: "Menari" },
                  ].map((h) => (
                    <button
                      key={h.hobby}
                      type="button"
                      onClick={() => {
                        setActiveHobby(h);
                        playPopSound();
                        speakGlobal(`My hobby is ${h.hobby}. Artinya hobi saya ${h.indo}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] text-center cursor-pointer transition-all ${
                        activeHobby.hobby === h.hobby ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block">{h.hobby}</strong>
                      <span className="text-[10px] opacity-80">{h.indo}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {levelId === 5 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Prepositions of Place (Kata Depan Lokasi):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full text-xs">
                  {[
                    { prep: "In", indo: "Di dalam", example: "In the box" },
                    { prep: "On", indo: "Di atas menempel", example: "On the table" },
                    { prep: "Under", indo: "Di bawah", example: "Under the chair" },
                    { prep: "Behind", indo: "Di belakang", example: "Behind the door" },
                    { prep: "In front of", indo: "Di depan", example: "In front of the house" },
                    { prep: "Beside", indo: "Di samping", example: "Beside my friend" },
                  ].map((p) => (
                    <button
                      key={p.prep}
                      type="button"
                      onClick={() => {
                        setActivePreposition(p);
                        playPopSound();
                        speakGlobal(`Preposition ${p.prep}. Contoh: ${p.example}`);
                      }}
                      className={`p-2 rounded-xl border-2 border-[#3C632A] text-center cursor-pointer transition-all ${
                        activePreposition.prep === p.prep ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block">{p.prep}</strong>
                      <span className="text-[10px] opacity-80">{p.indo}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {levelId === 6 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Using Have vs Has (Menyatakan Kepemilikan):
                </span>
                <div className="grid grid-cols-2 gap-3 w-full text-xs">
                  <div className="p-3 bg-white border-2 border-[#3C632A] rounded-xl text-left shadow-sm">
                    <strong className="text-[#3C632A] block mb-1">Gunakan HAVE:</strong>
                    I, You, They, We.<br />
                    <em>"I have two pencils."</em><br />
                    <em>"They have a ball."</em>
                  </div>
                  <div className="p-3 bg-white border-2 border-[#3C632A] rounded-xl text-left shadow-sm">
                    <strong className="text-[#C3631D] block mb-1">Gunakan HAS:</strong>
                    He, She, It (Tunggal).<br />
                    <em>"She has a doll."</em><br />
                    <em>"He has a cat."</em>
                  </div>
                </div>
              </div>
            )}

            {levelId === 7 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Basic Feelings & Emotions (Perasaan & Emosi):
                </span>
                <div className="grid grid-cols-3 gap-2 w-full text-xs">
                  {[
                    { emotion: "Happy", indo: "Senang" },
                    { emotion: "Sad", indo: "Sedih" },
                    { emotion: "Angry", indo: "Marah" },
                    { emotion: "Tired", indo: "Lelah" },
                    { emotion: "Hungry", indo: "Lapar" },
                    { emotion: "Thirsty", indo: "Haus" },
                  ].map((e) => (
                    <button
                      key={e.emotion}
                      type="button"
                      onClick={() => {
                        setActiveFeeling({ emotion: e.emotion, indo: e.indo, sentence: `I feel ${e.emotion.toLowerCase()}` });
                        playPopSound();
                        speakGlobal(`Emotion ${e.emotion}. Artinya ${e.indo}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] text-center cursor-pointer transition-all ${
                        activeFeeling.emotion === e.emotion ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block">{e.emotion}</strong>
                      <span className="text-[10px] opacity-80">{e.indo}</span>
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

// ================= DATA SOAL KELAS 3 SD BAHASA INGGRIS (7 LEVEL x 10 SOAL = 70 SOAL) =================
function getGrade3EnglishData(levelId: number): LevelConceptData {
  switch (levelId) {
    case 1:
      return {
        title: "Time & Daily Routines",
        conceptText: "Membaca jam sederhana: 'o'clock' untuk jam tepat (misal: seven o'clock) dan 'half past' untuk jam lewat 30 menit, serta kosakata rutinitas harian.",
        questions: [
          {
            id: 1,
            question: "Bahasa Inggris dari pukul 07.00 tepat adalah...",
            options: ["Seven o'clock", "Half past seven", "Seven fifteen"],
            correctIndex: 0,
            explanation: "Jam tepat menggunakan 'o'clock', yaitu 'Seven o'clock'.",
          },
          {
            id: 2,
            question: "Pukul 06.30 dalam bahasa Inggris disebut...",
            options: ["Half past six", "Six o'clock", "Half past seven"],
            correctIndex: 0,
            explanation: "Lewat 30 menit menggunakan 'half past', jadi 'Half past six'.",
          },
          {
            id: 3,
            question: "Aktivitas 'Wake up' di pagi hari artinya...",
            options: ["Bangun tidur", "Pergi ke sekolah", "Mandi"],
            correctIndex: 0,
            explanation: "'Wake up' artinya bangun tidur.",
          },
          {
            id: 4,
            question: "Bahasa Inggris dari sarapan pagi adalah...",
            options: ["Eat breakfast", "Eat lunch", "Eat dinner"],
            correctIndex: 0,
            explanation: "Sarapan pagi adalah 'breakfast'.",
          },
          {
            id: 5,
            question: "Lengkapi kalimat: 'I go to school at 7 ...'",
            options: ["o'clock", "half", "past"],
            correctIndex: 0,
            explanation: "Pada pukul 7 tepat: '7 o'clock'.",
          },
          {
            id: 6,
            question: "Aktivitas 'Take a bath' artinya...",
            options: ["Mandi", "Mencuci piring", "Tidur"],
            correctIndex: 0,
            explanation: "'Take a bath' artinya mandi.",
          },
          {
            id: 7,
            question: "Pukul 12.00 siang dalam bahasa Inggris dapat disebut...",
            options: ["Twelve o'clock", "Ten o'clock", "Half past twelve"],
            correctIndex: 0,
            explanation: "Pukul 12 tepat adalah 'Twelve o'clock'.",
          },
          {
            id: 8,
            question: "Arti dari kalimat 'I brush my teeth' adalah...",
            options: ["Saya menggosok gigi", "Saya mencuci muka", "Saya menyisir rambut"],
            correctIndex: 0,
            explanation: "'Brush my teeth' artinya menggosok gigi.",
          },
          {
            id: 9,
            question: "Waktu makan malam disebut...",
            options: ["Dinner", "Lunch", "Breakfast"],
            correctIndex: 0,
            explanation: "Makan malam adalah 'Dinner'.",
          },
          {
            id: 10,
            question: "Arti dari ungkapan 'Go to bed' adalah...",
            options: ["Pergi tidur", "Bangun tidur", "Merapikan kasur"],
            correctIndex: 0,
            explanation: "'Go to bed' artinya pergi tidur.",
          },
        ],
      };

    case 2:
      return {
        title: "Days and Months",
        conceptText: "Menghafal urutan nama-nama hari (Monday to Sunday) dan bulan dalam setahun (January to December).",
        questions: [
          {
            id: 1,
            question: "Hari pertama dalam hari sekolah (Senin) adalah...",
            options: ["Monday", "Sunday", "Friday"],
            correctIndex: 0,
            explanation: "Hari Senin adalah 'Monday'.",
          },
          {
            id: 2,
            question: "Hari Minggu dalam bahasa Inggris disebut...",
            options: ["Sunday", "Saturday", "Thursday"],
            correctIndex: 0,
            explanation: "Hari Minggu adalah 'Sunday'.",
          },
          {
            id: 3,
            question: "Hari setelah 'Wednesday' (Rabu) adalah...",
            options: ["Thursday", "Tuesday", "Friday"],
            correctIndex: 0,
            explanation: "Setelah Rabu adalah Kamis (Thursday).",
          },
          {
            id: 4,
            question: "Bulan pertama dalam kalender Masehi adalah...",
            options: ["January", "February", "December"],
            correctIndex: 0,
            explanation: "Bulan pertama adalah 'January'.",
          },
          {
            id: 5,
            question: "Hari Kemerdekaan Indonesia diperingati pada bulan...",
            options: ["August", "July", "September"],
            correctIndex: 0,
            explanation: "Bulan Agustus adalah 'August'.",
          },
          {
            id: 6,
            question: "Bulan terakhir dalam satu tahun (bulan ke-12) adalah...",
            options: ["December", "November", "October"],
            correctIndex: 0,
            explanation: "Bulan Desember adalah 'December'.",
          },
          {
            id: 7,
            question: "Ada berapakah hari dalam satu minggu (one week)?",
            options: ["Seven days", "Five days", "Ten days"],
            correctIndex: 0,
            explanation: "Satu minggu terdiri dari 7 hari (Seven days).",
          },
          {
            id: 8,
            question: "Hari Jumat dalam bahasa Inggris adalah...",
            options: ["Friday", "Tuesday", "Wednesday"],
            correctIndex: 0,
            explanation: "Hari Jumat adalah 'Friday'.",
          },
          {
            id: 9,
            question: "Ada berapakah jumlah bulan dalam satu tahun (one year)?",
            options: ["Twelve months", "Ten months", "Seven months"],
            correctIndex: 0,
            explanation: "Satu tahun terdiri dari 12 bulan (Twelve months).",
          },
          {
            id: 10,
            question: "Hari Sabtu dalam bahasa Inggris adalah...",
            options: ["Saturday", "Sunday", "Monday"],
            correctIndex: 0,
            explanation: "Hari Sabtu adalah 'Saturday'.",
          },
        ],
      };

    case 3:
      return {
        title: "Weather & Seasons",
        conceptText: "Mengenal kondisi cuaca: Sunny (cerah), Rainy (hujan), Cloudy (berawan), Windy (berangin), serta musim di Indonesia (Dry & Rainy season).",
        questions: [
          {
            id: 1,
            question: "Kondisi cuaca saat air turun dari langit adalah...",
            options: ["Rainy", "Sunny", "Windy"],
            correctIndex: 0,
            explanation: "Cuaca hujan adalah 'Rainy'.",
          },
          {
            id: 2,
            question: "Kondisi cuaca ketika matahari bersinar terang dan hangat adalah...",
            options: ["Sunny", "Rainy", "Snowy"],
            correctIndex: 0,
            explanation: "Cuaca cerah adalah 'Sunny'.",
          },
          {
            id: 3,
            question: "Cuaca saat langit dipenuhi awan kelabu tebal adalah...",
            options: ["Cloudy", "Sunny", "Stormy"],
            correctIndex: 0,
            explanation: "Cuaca berawan/mendung adalah 'Cloudy'.",
          },
          {
            id: 4,
            question: "Bahasa Inggris dari 'Musim kemarau' adalah...",
            options: ["Dry season", "Rainy season", "Winter"],
            correctIndex: 0,
            explanation: "Musim kemarau adalah 'Dry season'.",
          },
          {
            id: 5,
            question: "Bahasa Inggris dari 'Musim hujan' adalah...",
            options: ["Rainy season", "Dry season", "Summer"],
            correctIndex: 0,
            explanation: "Musim hujan adalah 'Rainy season'.",
          },
          {
            id: 6,
            question: "Ketika angin bertiup kencang, cuaca disebut...",
            options: ["Windy", "Sunny", "Foggy"],
            correctIndex: 0,
            explanation: "Cuaca berangin adalah 'Windy'.",
          },
          {
            id: 7,
            question: "Benda yang kita bawa saat cuaca hujan adalah...",
            options: ["Umbrella", "Hat", "Sunglasses"],
            correctIndex: 0,
            explanation: "Payung adalah 'Umbrella'.",
          },
          {
            id: 8,
            question: "Arti dari kalimat 'It is stormy today' adalah...",
            options: ["Hari ini terjadi badai", "Hari ini sangat panas", "Hari ini turun salju"],
            correctIndex: 0,
            explanation: "'Stormy' artinya cuaca badai disertai kilat/petir.",
          },
          {
            id: 9,
            question: "Kacamata hitam (sunglasses) cocok dipakai saat cuaca...",
            options: ["Sunny", "Rainy", "Stormy"],
            correctIndex: 0,
            explanation: "Kacamata hitam dipakai saat terik matahari cerah (Sunny).",
          },
          {
            id: 10,
            question: "Arti kata 'Rainbow' yang muncul setelah hujan reda adalah...",
            options: ["Pelangi", "Matahari", "Petir"],
            correctIndex: 0,
            explanation: "'Rainbow' artinya pelangi.",
          },
        ],
      };

    case 4:
      return {
        title: "Hobbies & Free Time",
        conceptText: "Menyatakan hobi di waktu luang: 'My hobby is swimming', 'I like reading', 'He likes playing football'.",
        questions: [
          {
            id: 1,
            question: "Hobi berenang dalam bahasa Inggris disebut...",
            options: ["Swimming", "Running", "Dancing"],
            correctIndex: 0,
            explanation: "Berenang adalah 'Swimming'.",
          },
          {
            id: 2,
            question: "Hobi membaca buku dalam bahasa Inggris adalah...",
            options: ["Reading", "Writing", "Singing"],
            correctIndex: 0,
            explanation: "Membaca adalah 'Reading'.",
          },
          {
            id: 3,
            question: "Aktivitas menendang bola ke gawang bersama teman disebut...",
            options: ["Playing football", "Playing piano", "Cycling"],
            correctIndex: 0,
            explanation: "Bermain sepak bola adalah 'Playing football'.",
          },
          {
            id: 4,
            question: "Hobi mengayuh sepeda di jalanan sore hari disebut...",
            options: ["Cycling", "Swimming", "Cooking"],
            correctIndex: 0,
            explanation: "Bersepeda adalah 'Cycling'.",
          },
          {
            id: 5,
            question: "Hobi membuat gambar dengan pensil warna adalah...",
            options: ["Drawing", "Singing", "Dancing"],
            correctIndex: 0,
            explanation: "Menggambar adalah 'Drawing'.",
          },
          {
            id: 6,
            question: "Hobi melantunkan nada lagu dengan suara merdu adalah...",
            options: ["Singing", "Cooking", "Reading"],
            correctIndex: 0,
            explanation: "Bernyanyi adalah 'Singing'.",
          },
          {
            id: 7,
            question: "Lengkapi kalimat: 'In my free time, I like to ... books.'",
            options: ["read", "swim", "kick"],
            correctIndex: 0,
            explanation: "Pasangan kata untuk 'books' adalah 'read' (membaca).",
          },
          {
            id: 8,
            question: "Hobi memasak makanan lezat di dapur disebut...",
            options: ["Cooking", "Drawing", "Fishing"],
            correctIndex: 0,
            explanation: "Memasak adalah 'Cooking'.",
          },
          {
            id: 9,
            question: "Aktivitas menangkap ikan di sungai atau laut disebut...",
            options: ["Fishing", "Swimming", "Camping"],
            correctIndex: 0,
            explanation: "Memancing ikan adalah 'Fishing'.",
          },
          {
            id: 10,
            question: "Arti dari kalimat 'My hobby is dancing' adalah...",
            options: ["Hobi saya adalah menari", "Hobi saya menyanyi", "Hobi saya memasak"],
            correctIndex: 0,
            explanation: "'Dancing' artinya menari.",
          },
        ],
      };

    case 5:
      return {
        title: "Basic Prepositions of Place",
        conceptText: "Mengenal preposisi lokasi: In (di dalam), On (di atas menempel), Under (di bawah), Behind (di belakang), In front of (di depan), Beside (di samping).",
        questions: [
          {
            id: 1,
            question: "Buku berada di dalam tas. Kata preposisi yang tepat adalah...",
            options: ["In", "On", "Under"],
            correctIndex: 0,
            explanation: "Di dalam menggunakan 'In' (In the bag).",
          },
          {
            id: 2,
            question: "Cangkir berada di atas meja. Kata preposisi yang tepat adalah...",
            options: ["On", "In", "Under"],
            correctIndex: 0,
            explanation: "Di atas menempel permukaan menggunakan 'On' (On the table).",
          },
          {
            id: 3,
            question: "Kucing bersembunyi di bawah tempat tidur. Kata preposisi yang tepat adalah...",
            options: ["Under", "On", "Behind"],
            correctIndex: 0,
            explanation: "Di bawah menggunakan 'Under' (Under the bed).",
          },
          {
            id: 4,
            question: "Preposisi 'Behind' artinya...",
            options: ["Di belakang", "Di depan", "Di samping"],
            correctIndex: 0,
            explanation: "'Behind' artinya di belakang.",
          },
          {
            id: 5,
            question: "Preposisi 'In front of' artinya...",
            options: ["Di depan", "Di dalam", "Di bawah"],
            correctIndex: 0,
            explanation: "'In front of' artinya di depan.",
          },
          {
            id: 6,
            question: "Arti dari kalimat 'The ball is under the chair' adalah...",
            options: ["Bola ada di bawah kursi", "Bola ada di atas kursi", "Bola ada di dalam kursi"],
            correctIndex: 0,
            explanation: "'Under the chair' artinya di bawah kursi.",
          },
          {
            id: 7,
            question: "Preposisi 'Beside' atau 'Next to' artinya...",
            options: ["Di samping / sebelah", "Di atas", "Di belakang"],
            correctIndex: 0,
            explanation: "'Beside' artinya di samping.",
          },
          {
            id: 8,
            question: "Lengkapi kalimat: 'The teacher stands ... the classroom.' (di depan kelas)",
            options: ["in front of", "under", "behind"],
            correctIndex: 0,
            explanation: "Di depan adalah 'in front of'.",
          },
          {
            id: 9,
            question: "Preposisi 'Between' digunakan untuk menunjukkan posisi...",
            options: ["Di antara dua benda", "Di atas langit", "Di bawah tanah"],
            correctIndex: 0,
            explanation: "'Between' artinya di antara.",
          },
          {
            id: 10,
            question: "Ikan berenang ... the water. Kata preposisi yang tepat adalah...",
            options: ["in", "on", "under"],
            correctIndex: 0,
            explanation: "Ikan berenang di dalam air ('in the water').",
          },
        ],
      };

    case 6:
      return {
        title: "Have vs Has",
        conceptText: "Menyatakan kepemilikan benda: gunakan 'HAVE' untuk subjek I, You, They, We, dan gunakan 'HAS' untuk subjek He, She, It.",
        questions: [
          {
            id: 1,
            question: "Lengkapi kalimat: 'I ... a new pencil.'",
            options: ["have", "has", "is"],
            correctIndex: 0,
            explanation: "Subjek 'I' berpasangan dengan 'have'.",
          },
          {
            id: 2,
            question: "Lengkapi kalimat: 'She ... a cute cat.'",
            options: ["has", "have", "are"],
            correctIndex: 0,
            explanation: "Subjek tunggal 'She' berpasangan dengan 'has'.",
          },
          {
            id: 3,
            question: "Lengkapi kalimat: 'They ... two bicycles.'",
            options: ["have", "has", "am"],
            correctIndex: 0,
            explanation: "Subjek jamak 'They' berpasangan dengan 'have'.",
          },
          {
            id: 4,
            question: "Lengkapi kalimat: 'He ... a blue school bag.'",
            options: ["has", "have", "is"],
            correctIndex: 0,
            explanation: "Subjek tunggal 'He' berpasangan dengan 'has'.",
          },
          {
            id: 5,
            question: "Lengkapi kalimat: 'We ... English class today.'",
            options: ["have", "has", "are"],
            correctIndex: 0,
            explanation: "Subjek 'We' berpasangan dengan 'have'.",
          },
          {
            id: 6,
            question: "Manakah kalimat yang benar?",
            options: ["You have an apple", "You has an apple", "You having an apple"],
            correctIndex: 0,
            explanation: "Subjek 'You' berpasangan dengan 'have'.",
          },
          {
            id: 7,
            question: "Budi (tunggal) mempunyai bola. Kalimat yang tepat adalah...",
            options: ["Budi has a ball", "Budi have a ball", "Budi having a ball"],
            correctIndex: 0,
            explanation: "Budi adalah orang ketiga tunggal (He), sehingga menggunakan 'has'.",
          },
          {
            id: 8,
            question: "Arti dari kalimat 'I have ten fingers' adalah...",
            options: ["Saya memiliki sepuluh jari", "Saya membeli sepuluh jari", "Saya melihat sepuluh jari"],
            correctIndex: 0,
            explanation: "'I have ten fingers' artinya saya memiliki sepuluh jari.",
          },
          {
            id: 9,
            question: "Bentuk negatif dari 'I have' dalam bentuk sederhana adalah...",
            options: ["I do not have", "I has not", "I am not have"],
            correctIndex: 0,
            explanation: "Bentuk negatifnya adalah 'I do not have'.",
          },
          {
            id: 10,
            question: "Lengkapi kalimat: 'An elephant ... big ears.'",
            options: ["has", "have", "is"],
            correctIndex: 0,
            explanation: "'An elephant' adalah tunggal (it), sehingga menggunakan 'has'.",
          },
        ],
      };

    case 7:
      return {
        title: "Basic Feelings & Emotions",
        conceptText: "Mengekspresikan kondisi emosi dan fisik: Happy (senang), Sad (sedih), Angry (marah), Tired (lelah), Hungry (lapar), Thirsty (haus), Sleepy (mengantuk).",
        questions: [
          {
            id: 1,
            question: "Perasaan gembira dan tersenyum bahagia dalam bahasa Inggris adalah...",
            options: ["Happy", "Sad", "Angry"],
            correctIndex: 0,
            explanation: "Senang atau gembira adalah 'Happy'.",
          },
          {
            id: 2,
            question: "Ketika seseorang menangis karena kecewa, ia merasa...",
            options: ["Sad", "Happy", "Tired"],
            correctIndex: 0,
            explanation: "Sedih adalah 'Sad'.",
          },
          {
            id: 3,
            question: "Ketika perut keroncongan dan membutuhkan makanan, kita merasa...",
            options: ["Hungry", "Thirsty", "Sleepy"],
            correctIndex: 0,
            explanation: "Lapar adalah 'Hungry'.",
          },
          {
            id: 4,
            question: "Ketika tenggorokan kering dan butuh minum air, kita merasa...",
            options: ["Thirsty", "Hungry", "Angry"],
            correctIndex: 0,
            explanation: "Haus adalah 'Thirsty'.",
          },
          {
            id: 5,
            question: "Bahasa Inggris dari perasaan 'Marah' adalah...",
            options: ["Angry", "Happy", "Calm"],
            correctIndex: 0,
            explanation: "Marah adalah 'Angry'.",
          },
          {
            id: 6,
            question: "Setelah berolahraga seharian, tubuh terasa lelah. Lelah adalah...",
            options: ["Tired", "Sleepy", "Hungry"],
            correctIndex: 0,
            explanation: "Lelah atau capek adalah 'Tired'.",
          },
          {
            id: 7,
            question: "Mata mengantuk di malam hari dan ingin tidur disebut...",
            options: ["Sleepy", "Hungry", "Angry"],
            correctIndex: 0,
            explanation: "Mengantuk adalah 'Sleepy'.",
          },
          {
            id: 8,
            question: "Arti dari kalimat 'I am happy to meet you' adalah...",
            options: ["Saya senang bertemu denganmu", "Saya lelah bertemu denganmu", "Saya lapar hari ini"],
            correctIndex: 0,
            explanation: "'I am happy to meet you' artinya saya senang bertemu denganmu.",
          },
          {
            id: 9,
            question: "Lengkapi kalimat: 'Drink water if you are ...'",
            options: ["thirsty", "hungry", "angry"],
            correctIndex: 0,
            explanation: "Minumlah air jika kamu haus (thirsty).",
          },
          {
            id: 10,
            question: "Arti kata 'Scared' saat melihat tempat gelap adalah...",
            options: ["Takut", "Berani", "Senang"],
            correctIndex: 0,
            explanation: "'Scared' artinya takut.",
          },
        ],
      };

    default:
      return {
        title: "English Level",
        conceptText: "Materi belajar Bahasa Inggris Kelas 3 SD.",
        questions: [],
      };
  }
}
