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

interface EnglishGrade6GameProps {
  levelId: number;
  onLevelComplete: (levelId: number, starsEarned: number) => void;
  accessibilityMode?: string;
}

export function EnglishGrade6Game({ levelId, onLevelComplete, accessibilityMode }: EnglishGrade6GameProps) {
  const [phase, setPhase] = useState<"materi" | "game">("materi");

  // Phase 1 interactive states
  const [activePastVerb, setActivePastVerb] = useState<{ v1: string; v2: string; type: string }>({ v1: "go", v2: "went", type: "Irregular" });
  const [activeFuturePlan, setActiveFuturePlan] = useState<{ form: string; sample: string; indo: string }>({ form: "Will", sample: "I will study hard tomorrow", indo: "Saya akan belajar giat besok" });
  const [activeJunction, setActiveJunction] = useState<{ term: string; indo: string; desc: string }>({ term: "Crossroads", indo: "Perempatan jalan", desc: "Four intersecting roads" });
  const [activeEcoAction, setActiveEcoAction] = useState<{ eco: string; indo: string; benefit: string }>({ eco: "Recycle", indo: "Mendaur ulang sampah", benefit: "Reduces plastic pollution" });
  const [activeDescElement, setActiveDescElement] = useState<{ part: string; purpose: string }>({ part: "Identification", purpose: "Memperkenalkan objek/tokoh yang akan dideskripsikan" });
  const [activeRecountPart, setActiveRecountPart] = useState<{ part: string; functionDesc: string }>({ part: "Orientation", functionDesc: "Latar belakang siapa, di mana, dan kapan peristiwa terjadi" });

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
    setActivePastVerb({ v1: "go", v2: "went", type: "Irregular" });
    setActiveFuturePlan({ form: "Will", sample: "I will study hard tomorrow", indo: "Saya akan belajar giat besok" });
    setActiveJunction({ term: "Crossroads", indo: "Perempatan jalan", desc: "Four intersecting roads" });
    setActiveEcoAction({ eco: "Recycle", indo: "Mendaur ulang sampah", benefit: "Reduces plastic pollution" });
    setActiveDescElement({ part: "Identification", purpose: "Memperkenalkan objek/tokoh yang akan dideskripsikan" });
    setActiveRecountPart({ part: "Orientation", functionDesc: "Latar belakang siapa, di mana, dan kapan peristiwa terjadi" });

    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setWrongAttempts(0);
    setShowClue(false);
    setIsCompleted(false);
    isProcessingRef.current = false;

    const data = getGrade6EnglishData(levelId);
    setQuestionsList(shuffleQuestions(data));
    speakGlobal(data.conceptText);
  }, [levelId]);

  const levelData = getGrade6EnglishData(levelId);
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
      speakGlobal("Sensational! Answer is correct! " + currentQ.explanation);

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
          speakGlobal(`Congratulations Master! You solved all 10 questions and received ${stars} stars!`);
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
        speakGlobal("Not quite right yet. Re-read the question carefully!");
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
            KELAS 6 SD • LEVEL {levelId} dari 6
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
                  Regular vs Irregular Past Verbs (Bentuk Lampau):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full text-xs">
                  {[
                    { v1: "Play", v2: "Played", type: "Regular" },
                    { v1: "Visit", v2: "Visited", type: "Regular" },
                    { v1: "Go", v2: "Went", type: "Irregular" },
                    { v1: "Eat", v2: "Ate", type: "Irregular" },
                  ].map((v) => (
                    <button
                      key={v.v1}
                      type="button"
                      onClick={() => {
                        setActivePastVerb(v);
                        playPopSound();
                        speakGlobal(`Verb 1 ${v.v1} becomes ${v.v2} in past tense`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] text-center cursor-pointer transition-all ${
                        activePastVerb.v1 === v.v1 ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <span className="text-[10px] opacity-75 block">{v.type}</span>
                      <strong className="block text-sm">{v.v1} ➔ {v.v2}</strong>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {levelId === 2 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Future Tense: Will vs Be Going To (Rencana Masa Depan):
                </span>
                <div className="grid grid-cols-2 gap-2 w-full text-xs">
                  <div className="p-3 bg-white border-2 border-[#3C632A] rounded-xl text-left shadow-sm">
                    <strong className="text-[#3C632A] block mb-1">Will (Keputusan spontan / prediksi):</strong>
                    <em>"I will call you tonight."</em><br />
                    <em>"It will rain tomorrow."</em>
                  </div>
                  <div className="p-3 bg-white border-2 border-[#3C632A] rounded-xl text-left shadow-sm">
                    <strong className="text-[#C3631D] block mb-1">Be Going To (Rencana yang sudah pasti):</strong>
                    <em>"I am going to visit Bali next week."</em><br />
                    <em>"She is going to study medicine."</em>
                  </div>
                </div>
              </div>
            )}

            {levelId === 3 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Advanced Directions & Road Signs:
                </span>
                <div className="grid grid-cols-3 gap-2 w-full text-xs">
                  {[
                    { term: "Crossroads", indo: "Perempatan jalan" },
                    { term: "T-junction", indo: "Pertigaan jalan" },
                    { term: "Opposite", indo: "Berseberangan" },
                  ].map((j) => (
                    <button
                      key={j.term}
                      type="button"
                      onClick={() => {
                        setActiveJunction({ term: j.term, indo: j.indo, desc: "" });
                        playPopSound();
                        speakGlobal(`Term ${j.term}, artinya ${j.indo}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] text-center cursor-pointer transition-all ${
                        activeJunction.term === j.term ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block">{j.term}</strong>
                      <span className="text-[10px] opacity-80">{j.indo}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {levelId === 4 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Earth, Space, & Environmental Care:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full text-xs">
                  {[
                    { eco: "Recycle", indo: "Daur ulang sampah" },
                    { eco: "Save water", indo: "Hemat penggunaan air" },
                    { eco: "Plant trees", indo: "Menanam pohon" },
                    { eco: "Solar System", indo: "Tata Surya & 8 Planet" },
                    { eco: "Earth", indo: "Bumi tempat kita tinggal" },
                    { eco: "Atmosphere", indo: "Lapisan pelindung bumi" },
                  ].map((e) => (
                    <div key={e.eco} className="p-2 bg-white border border-[#3C632A] rounded-xl text-center shadow-sm">
                      <strong className="block">{e.eco}</strong>
                      <span className="text-[10px] opacity-80">{e.indo}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {levelId === 5 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Struktur Teks Deskriptif (Descriptive Text):
                </span>
                <div className="grid grid-cols-2 gap-2 w-full text-xs">
                  <div className="p-3 bg-white border-2 border-[#3C632A] rounded-xl text-left shadow-sm">
                    <strong className="text-[#3C632A] block mb-1">1. Identification:</strong>
                    Memperkenalkan benda, orang, atau tempat wisata yang akan dijelaskan.
                  </div>
                  <div className="p-3 bg-white border-2 border-[#3C632A] rounded-xl text-left shadow-sm">
                    <strong className="text-[#C3631D] block mb-1">2. Description:</strong>
                    Menguraikan bagian-bagian, ciri fisik, warna, sifat, dan keunikannya.
                  </div>
                </div>
              </div>
            )}

            {levelId === 6 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Struktur Teks Recount (Pengalaman Masa Lalu):
                </span>
                <div className="grid grid-cols-3 gap-2 w-full text-xs">
                  <div className="p-2.5 bg-white border border-[#3C632A] rounded-xl text-left shadow-sm">
                    <strong>1. Orientation:</strong><br />
                    <span className="text-[10px]">Siapa, kapan, dan di mana peristiwa bermula.</span>
                  </div>
                  <div className="p-2.5 bg-white border border-[#3C632A] rounded-xl text-left shadow-sm">
                    <strong>2. Events:</strong><br />
                    <span className="text-[10px]">Rangkaian kronologi kejadian masa lampau.</span>
                  </div>
                  <div className="p-2.5 bg-white border border-[#3C632A] rounded-xl text-left shadow-sm">
                    <strong>3. Re-orientation:</strong><br />
                    <span className="text-[10px]">Komentar penutup atau kesan perasaan penulis.</span>
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

// ================= DATA SOAL KELAS 6 SD BAHASA INGGRIS (6 LEVEL x 10 SOAL = 60 SOAL) =================
function getGrade6EnglishData(levelId: number): LevelConceptData {
  switch (levelId) {
    case 1:
      return {
        title: "Simple Past Tense",
        conceptText: "Simple Past Tense digunakan untuk menceritakan kejadian di masa lampau: gunakan Verb 2 (regular: played, visited; irregular: went, ate, saw). Keterangan waktu: yesterday, last week, two days ago.",
        questions: [
          {
            id: 1,
            question: "Bentuk Verb 2 (lampau) dari kata kerja 'go' adalah...",
            options: ["went", "goed", "gone"],
            correctIndex: 0,
            explanation: "Bentuk irregular past dari 'go' adalah 'went'.",
          },
          {
            id: 2,
            question: "Lengkapi kalimat: 'Yesterday, we ... football in the rain.'",
            options: ["played", "play", "plays"],
            correctIndex: 0,
            explanation: "Keterangan waktu 'yesterday' memerlukan bentuk lampau 'played'.",
          },
          {
            id: 3,
            question: "Bentuk Verb 2 dari kata kerja 'eat' adalah...",
            options: ["ate", "eated", "eaten"],
            correctIndex: 0,
            explanation: "Bentuk past dari 'eat' adalah 'ate'.",
          },
          {
            id: 4,
            question: "Kata bantu lampau yang digunakan untuk kalimat negatif dan tanya adalah...",
            options: ["Did", "Does", "Do"],
            correctIndex: 0,
            explanation: "Simple past menggunakan kata bantu 'did'.",
          },
          {
            id: 5,
            question: "Bentuk negatif yang benar untuk 'She went to the zoo' adalah...",
            options: ["She did not go to the zoo", "She did not went to the zoo", "She does not go to the zoo"],
            correctIndex: 0,
            explanation: "Setelah 'did not', kata kerja kembali ke bentuk dasar 1 (go).",
          },
          {
            id: 6,
            question: "Lengkapi kalimat: 'Last Sunday, my family ... grandfather in Bandung.'",
            options: ["visited", "visit", "visiting"],
            correctIndex: 0,
            explanation: "'Last Sunday' memerlukan past verb 'visited'.",
          },
          {
            id: 7,
            question: "Bentuk Verb 2 dari kata kerja 'buy' (membeli) adalah...",
            options: ["bought", "buyed", "buys"],
            correctIndex: 0,
            explanation: "Bentuk irregular past dari 'buy' adalah 'bought'.",
          },
          {
            id: 8,
            question: "Lengkapi kalimat tanya: '... you see the fireworks last night?'",
            options: ["Did", "Do", "Are"],
            correctIndex: 0,
            explanation: "Pertanyaan lampau menggunakan kata bantu 'Did'.",
          },
          {
            id: 9,
            question: "Bentuk to be lampau untuk subjek 'I' dan 'He' adalah...",
            options: ["was", "were", "is"],
            correctIndex: 0,
            explanation: "I, He, She, It menggunakan 'was'.",
          },
          {
            id: 10,
            question: "Bentuk to be lampau untuk subjek jamak 'They' dan 'We' adalah...",
            options: ["were", "was", "are"],
            correctIndex: 0,
            explanation: "They, We, You menggunakan 'were'.",
          },
        ],
      };

    case 2:
      return {
        title: "Future Tense (Plans)",
        conceptText: "Menyatakan masa depan dan rencana: gunakan 'will' untuk janji / keputusan spontan dan 'be going to' untuk rencana yang telah disusun sebelumnya.",
        questions: [
          {
            id: 1,
            question: "Lengkapi kalimat: 'I ... visit my grandmother next Sunday.'",
            options: ["will", "did", "was"],
            correctIndex: 0,
            explanation: "'Next Sunday' menunjukkan waktu masa depan, gunakan 'will'.",
          },
          {
            id: 2,
            question: "Pola 'be going to' yang benar untuk subjek 'She' adalah...",
            options: ["She is going to", "She are going to", "She am going to"],
            correctIndex: 0,
            explanation: "Subjek 'She' menggunakan to be 'is' ('She is going to').",
          },
          {
            id: 3,
            question: "Lengkapi kalimat: 'They ... going to travel to Jakarta tomorrow.'",
            options: ["are", "is", "am"],
            correctIndex: 0,
            explanation: "Subjek 'They' menggunakan to be 'are'.",
          },
          {
            id: 4,
            question: "Bentuk singkatan dari 'will not' adalah...",
            options: ["won't", "willn't", "don't"],
            correctIndex: 0,
            explanation: "Singkatan 'will not' adalah 'won't'.",
          },
          {
            id: 5,
            question: "Lengkapi kalimat: 'I am hungry. I think I ... buy a burger.'",
            options: ["will", "am going to", "did"],
            correctIndex: 0,
            explanation: "Keputusan spontan saat itu menggunakan 'will'.",
          },
          {
            id: 6,
            question: "Keterangan waktu yang sering digunakan pada Future Tense adalah...",
            options: ["Tomorrow", "Yesterday", "Last night"],
            correctIndex: 0,
            explanation: "'Tomorrow' (besok) menunjukkan waktu masa depan.",
          },
          {
            id: 7,
            question: "Lengkapi kalimat tanya: '... you help me carry these books?'",
            options: ["Will", "Did", "Are"],
            correctIndex: 0,
            explanation: "Permintaan bantuan masa depan: 'Will you help me...?'.",
          },
          {
            id: 8,
            question: "Arti kalimat 'We are going to have an exam next week' adalah...",
            options: ["Kami akan menghadapi ujian minggu depan", "Kami selesai ujian minggu lalu", "Kami tidak ada ujian"],
            correctIndex: 0,
            explanation: "'We are going to have an exam' menyatakan rencana pasti.",
          },
          {
            id: 9,
            question: "Setelah modal 'will', kata kerja yang digunakan adalah...",
            options: ["Verb 1 dasar", "Verb 2", "Verb-ing"],
            correctIndex: 0,
            explanation: "Setelah 'will' wajib diikuti kata kerja bentuk dasar (bare infinitive).",
          },
          {
            id: 10,
            question: "Arti dari frasa 'Next month' adalah...",
            options: ["Bulan depan", "Bulan lalu", "Bulan ini"],
            correctIndex: 0,
            explanation: "'Next month' artinya bulan depan.",
          },
        ],
      };

    case 3:
      return {
        title: "Direction & Location (Advanced)",
        conceptText: "Membaca denah rute perjalanan kota: Crossroads (perempatan), T-junction (pertigaan), Roundabout (bundaran), Opposite (berseberangan), Next to (sebelah), Between (di antara).",
        questions: [
          {
            id: 1,
            question: "Pertemuan empat ruas jalan raya yang saling bersilangan disebut...",
            options: ["Crossroads", "T-junction", "Bridge"],
            correctIndex: 0,
            explanation: "Perempatan jalan adalah 'Crossroads'.",
          },
          {
            id: 2,
            question: "Pertemuan jalan berbentuk huruf T (pertigaan) disebut...",
            options: ["T-junction", "Crossroads", "Dead end"],
            correctIndex: 0,
            explanation: "Pertigaan jalan adalah 'T-junction'.",
          },
          {
            id: 3,
            question: "Bundaran lalu lintas melingkar di tengah persimpangan kota adalah...",
            options: ["Roundabout", "Sidewalk", "Zebra cross"],
            correctIndex: 0,
            explanation: "Bundaran lalu lintas adalah 'Roundabout'.",
          },
          {
            id: 4,
            question: "Arti preposisi 'Opposite' dalam petunjuk lokasi adalah...",
            options: ["Berseberangan langsung", "Di belakang jauh", "Di dalam gedung"],
            correctIndex: 0,
            explanation: "'Opposite' artinya berhadapan atau berseberangan jalan.",
          },
          {
            id: 5,
            question: "Gedung bank berada di antara kantor pos dan sekolah. Preposisi yang tepat adalah...",
            options: ["Between", "Behind", "Under"],
            correctIndex: 0,
            explanation: "Di antara dua tempat adalah 'Between'.",
          },
          {
            id: 6,
            question: "Area penyeberangan pejalan kaki bermotif garis putih di jalan disebut...",
            options: ["Zebra cross", "Overpass", "Tunnel"],
            correctIndex: 0,
            explanation: "Tempat menyeberang adalah 'Zebra cross'.",
          },
          {
            id: 7,
            question: "Arti dari petunjuk arah 'Take the second turning on your right' adalah...",
            options: ["Ambil belokan kedua di sebelah kananmu", "Belok kanan sekarang", "Jalan lurus terus"],
            correctIndex: 0,
            explanation: "Petunjuk ini mengarahkan ke belokan kedua di sisi kanan.",
          },
          {
            id: 8,
            question: "Trotoar khusus pejalan kaki di tepi jalan disebut...",
            options: ["Sidewalk (Pavement)", "Highway", "Bridge"],
            correctIndex: 0,
            explanation: "Trotoar adalah 'Sidewalk'.",
          },
          {
            id: 9,
            question: "Lengkapi kalimat: 'The hotel is ... to the supermarket.'",
            options: ["next", "opposite", "between"],
            correctIndex: 0,
            explanation: "Pasangan frasa adalah 'next to' (di sebelah).",
          },
          {
            id: 10,
            question: "Arti dari perintah 'Cross the street carefully' adalah...",
            options: ["Seberangilah jalan dengan hati-hati", "Berhentilah di pinggir jalan", "Beloklah ke kanan"],
            correctIndex: 0,
            explanation: "'Cross the street' artinya menyeberangi jalan.",
          },
        ],
      };

    case 4:
      return {
        title: "Earth, Space, & Environment",
        conceptText: "Mengenal tata surya (Sun, Earth, Moon, Planets) dan kepedulian lingkungan: Recycle (daur ulang), Save water (hemat air), Plant trees (menanam pohon), Global warming.",
        questions: [
          {
            id: 1,
            question: "Planet ketiga dalam tata surya yang menjadi tempat tinggal kita adalah...",
            options: ["Earth (Bumi)", "Mars", "Jupiter"],
            correctIndex: 0,
            explanation: "Bumi adalah 'Earth'.",
          },
          {
            id: 2,
            question: "Pusat tata surya yang memancarkan cahaya dan panas adalah...",
            options: ["The Sun (Matahari)", "The Moon", "Earth"],
            correctIndex: 0,
            explanation: "Matahari adalah 'The Sun'.",
          },
          {
            id: 3,
            question: "Satelit alami yang mengitari bumi pada malam hari adalah...",
            options: ["The Moon (Bulan)", "Mars", "Venus"],
            correctIndex: 0,
            explanation: "Bulan adalah 'The Moon'.",
          },
          {
            id: 4,
            question: "Kegiatan mengolah kembali sampah plastik menjadi barang berguna disebut...",
            options: ["Recycle", "Pollute", "Cut"],
            correctIndex: 0,
            explanation: "Daur ulang adalah 'Recycle'.",
          },
          {
            id: 5,
            question: "Tindakan hemat energi: 'Turn off the lights when not in use' artinya...",
            options: ["Matikan lampu saat tidak digunakan", "Nyalakan lampu sepanjang hari", "Beli lampu baru"],
            correctIndex: 0,
            explanation: "Tindakan ini untuk menghemat listrik.",
          },
          {
            id: 6,
            question: "Istilah kenaikan suhu rata-rata bumi akibat efek rumah kaca adalah...",
            options: ["Global warming", "Solar eclipse", "Tsunami"],
            correctIndex: 0,
            explanation: "Pemanasan global adalah 'Global warming'.",
          },
          {
            id: 7,
            question: "Tindakan ramah lingkungan untuk mencegah banjir dan tanah longsor adalah...",
            options: ["Planting trees", "Cutting trees", "Burning plastic"],
            correctIndex: 0,
            explanation: "Menanam pohon (Planting trees) menjaga kelestarian tanah.",
          },
          {
            id: 8,
            question: "Planet terbesar dalam sistem tata surya kita adalah...",
            options: ["Jupiter", "Saturn", "Mercury"],
            correctIndex: 0,
            explanation: "Planet terbesar adalah 'Jupiter'.",
          },
          {
            id: 9,
            question: "Arti semboyan 'Save our Earth' adalah...",
            options: ["Selamatkan bumi kita", "Bersihkan rumah kita", "Jelajahi luar angkasa"],
            correctIndex: 0,
            explanation: "'Save our Earth' adalah seruan menjaga bumi.",
          },
          {
            id: 10,
            question: "Tempat membuang sampah yang benar dalam bahasa Inggris adalah...",
            options: ["Trash bin (Dustbin)", "River", "Road"],
            correctIndex: 0,
            explanation: "Tempat sampah adalah 'Trash bin'.",
          },
        ],
      };

    case 5:
      return {
        title: "Descriptive Text",
        conceptText: "Teks deskripsi mendeskripsikan ciri-ciri khusus orang, tempat, atau hewan. Struktur umum: Identification (pengenalan) dan Description (penjelasan ciri fisik dan sifat).",
        questions: [
          {
            id: 1,
            question: "Tujuan utama dari Descriptive Text adalah...",
            options: ["Menggambarkan objek secara terperinci", "Menceritakan urutan kejadian lucu", "Mengajari cara membuat makanan"],
            correctIndex: 0,
            explanation: "Teks deskripsi mendeskripsikan karakteristik khusus suatu objek.",
          },
          {
            id: 2,
            question: "Bagian pertama pada teks deskripsi yang mengenalkan objek disebut...",
            options: ["Identification", "Description", "Resolution"],
            correctIndex: 0,
            explanation: "Bagian pembuka adalah 'Identification'.",
          },
          {
            id: 3,
            question: "Bagian yang menjelaskan bentuk fisik, warna, ukuran, dan sifat objek disebut...",
            options: ["Description", "Orientation", "Steps"],
            correctIndex: 0,
            explanation: "Uraian ciri-ciri fisik berada di bagian 'Description'.",
          },
          {
            id: 4,
            question: "Tenses yang umumnya mendominasi teks deskripsi adalah...",
            options: ["Simple Present Tense", "Simple Past Tense", "Past Continuous Tense"],
            correctIndex: 0,
            explanation: "Teks deskripsi mendeskripsikan fakta dan ciri nyata menggunakan Simple Present Tense.",
          },
          {
            id: 5,
            question: "Kata sifat (adjectives) sangat banyak digunakan dalam teks deskripsi, contohnya...",
            options: ["Beautiful, big, friendly", "Run, jump, walk", "Yesterday, then, finally"],
            correctIndex: 0,
            explanation: "Kata sifat (adjectives) mendeskripsikan rupa dan sifat.",
          },
          {
            id: 6,
            question: "Kutipan: 'Borobudur is a grand Buddhist temple located in Central Java.' Termasuk bagian...",
            options: ["Identification", "Resolution", "Complication"],
            correctIndex: 0,
            explanation: "Kalimat ini mengenalkan objek candi Borobudur (Identification).",
          },
          {
            id: 7,
            question: "Kutipan: 'It has dark fur, sharp claws, and two bright green eyes.' Termasuk bagian...",
            options: ["Description", "Identification", "Re-orientation"],
            correctIndex: 0,
            explanation: "Mendeskripsikan rincian ciri fisik hewan (Description).",
          },
          {
            id: 8,
            question: "Kata sifat yang tepat untuk mendeskripsikan pemandangan pantai yang elok adalah...",
            options: ["Picturesque / Beautiful", "Angry", "Noisy"],
            correctIndex: 0,
            explanation: "'Picturesque' atau 'Beautiful' berarti indah menawan.",
          },
          {
            id: 9,
            question: "Arti dari kalimat 'My cat has soft fluffy fur' adalah...",
            options: ["Kucing saya memiliki bulu yang lembut dan mengembang", "Kucing saya suka makan ikan", "Kucing saya tidur di sofa"],
            correctIndex: 0,
            explanation: "'Soft fluffy fur' artinya bulu lembut mengembang.",
          },
          {
            id: 10,
            question: "Kata kerja penghubung (linking verb) yang sering dipakai dalam deskripsi adalah...",
            options: ["is, are, has, have", "did, went, ate", "will, shall"],
            correctIndex: 0,
            explanation: "Linking verbs 'is, are, has, have' mendominasi kalimat deskripsi.",
          },
        ],
      };

    case 6:
      return {
        title: "Recount Text",
        conceptText: "Recount Text menceritakan pengalaman pribadi yang terjadi di masa lalu. Struktur teks: Orientation (pengenalan), Events (urutan peristiwa), dan Re-orientation (kesan penutup).",
        questions: [
          {
            id: 1,
            question: "Tujuan utama dari Recount Text adalah...",
            options: ["Menceritakan kembali pengalaman masa lalu", "Membujuk orang membeli barang", "Memberitahu petunjuk resep makanan"],
            correctIndex: 0,
            explanation: "Recount text menceritakan kembali peristiwa atau pengalaman lampau (to retell past events).",
          },
          {
            id: 2,
            question: "Tenses yang digunakan dalam menyusun Recount Text adalah...",
            options: ["Simple Past Tense", "Simple Present Tense", "Future Tense"],
            correctIndex: 0,
            explanation: "Karena peristiwanya sudah terjadi di masa lalu, wajib memakai Simple Past Tense.",
          },
          {
            id: 3,
            question: "Bagian pengenalan tokoh, tempat, dan waktu terjadinya peristiwa disebut...",
            options: ["Orientation", "Events", "Re-orientation"],
            correctIndex: 0,
            explanation: "Bagian pendahuluan adalah 'Orientation'.",
          },
          {
            id: 4,
            question: "Bagian yang berisi rentetan peristiwa yang dialami secara kronologis disebut...",
            options: ["Events", "Identification", "Ingredients"],
            correctIndex: 0,
            explanation: "Rangkaian kejadian berurutan adalah 'Events'.",
          },
          {
            id: 5,
            question: "Bagian penutup yang memuat kesimpulan atau perasaan penulis disebut...",
            options: ["Re-orientation", "Complication", "Orientation"],
            correctIndex: 0,
            explanation: "Bagian akhir/kesan pribadi adalah 'Re-orientation'.",
          },
          {
            id: 6,
            question: "Kata hubung urutan waktu (chronological connectors) yang sering digunakan adalah...",
            options: ["First, then, after that, finally", "Because, although, but", "Which, who, whom"],
            correctIndex: 0,
            explanation: "Konektor urutan waktu: First, then, after that, finally.",
          },
          {
            id: 7,
            question: "Kutipan: 'Last holiday, my family and I went to Pangandaran Beach.' Berada pada bagian...",
            options: ["Orientation", "Resolution", "Re-orientation"],
            correctIndex: 0,
            explanation: "Kalimat pembuka peristiwa masa lalu adalah 'Orientation'.",
          },
          {
            id: 8,
            question: "Kutipan: 'It was a tiring day, but we were very happy.' Berada pada bagian...",
            options: ["Re-orientation", "Orientation", "Event 1"],
            correctIndex: 0,
            explanation: "Ungkapan kesan perasaan di akhir cerita adalah 'Re-orientation'.",
          },
          {
            id: 9,
            question: "Manakah kalimat yang tepat untuk bagian Event pada Recount Text?",
            options: ["Then, we built a sandcastle together", "Then, we will build a sandcastle", "Then, we are building a sandcastle"],
            correctIndex: 0,
            explanation: "Menggunakan kata kerja bentuk lampau 'built'.",
          },
          {
            id: 10,
            question: "Arti dari kata kerja lampau 'spent' dalam 'We spent two hours on the beach' adalah...",
            options: ["Menghabiskan waktu", "Membeli barang", "Menemukan kerang"],
            correctIndex: 0,
            explanation: "'Spent two hours' artinya menghabiskan dua jam.",
          },
        ],
      };

    default:
      return {
        title: "English Level",
        conceptText: "Materi belajar Bahasa Inggris Kelas 6 SD.",
        questions: [],
      };
  }
}
