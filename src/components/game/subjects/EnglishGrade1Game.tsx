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

interface EnglishGrade1GameProps {
  levelId: number;
  onLevelComplete: (levelId: number, starsEarned: number) => void;
  accessibilityMode?: string;
}

export function EnglishGrade1Game({ levelId, onLevelComplete, accessibilityMode }: EnglishGrade1GameProps) {
  // Game Phase: "materi" (Belajar Dulu) or "game" (Main Tantangan)
  const [phase, setPhase] = useState<"materi" | "game">("materi");

  // Phase 1 interactive states
  const [activeGreeting, setActiveGreeting] = useState<string>("Good morning");
  const [activeLetter, setActiveLetter] = useState<{ letter: string; word: string; meaning: string }>({ letter: "A", word: "Apple", meaning: "Apel" });
  const [activeNumber, setActiveNumber] = useState<number>(1);
  const [activeColor, setActiveColor] = useState<{ color: string; hex: string; shape: string }>({ color: "Red", hex: "#EF4444", shape: "Circle" });
  const [activeObject, setActiveObject] = useState<{ name: string; indo: string }>({ name: "Book", indo: "Buku" });
  const [activeBodyPart, setActiveBodyPart] = useState<{ name: string; indo: string; desc: string }>({ name: "Eyes", indo: "Mata", desc: "We see with our eyes" });
  const [activeFamily, setActiveFamily] = useState<{ member: string; indo: string }>({ member: "Father", indo: "Ayah" });

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
    setActiveGreeting("Good morning");
    setActiveLetter({ letter: "A", word: "Apple", meaning: "Apel" });
    setActiveNumber(1);
    setActiveColor({ color: "Red", hex: "#EF4444", shape: "Circle" });
    setActiveObject({ name: "Book", indo: "Buku" });
    setActiveBodyPart({ name: "Eyes", indo: "Mata", desc: "We see with our eyes" });
    setActiveFamily({ member: "Father", indo: "Ayah" });

    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setWrongAttempts(0);
    setShowClue(false);
    setIsCompleted(false);
    isProcessingRef.current = false;

    const data = getGrade1EnglishData(levelId);
    setQuestionsList(shuffleQuestions(data));
    speakGlobal(data.conceptText);
  }, [levelId]);

  const levelData = getGrade1EnglishData(levelId);
  const activeQuestions = questionsList.length > 0 ? questionsList : levelData.questions;
  const currentQ = activeQuestions[currentQuestionIndex] || activeQuestions[0];

  // TTS read question in game phase
  useEffect(() => {
    if (phase === "game" && !isCompleted && currentQ) {
      speakGlobal(`Question number ${currentQuestionIndex + 1}. ${currentQ.question}`);
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
      speakGlobal("Great job! That is correct! " + currentQ.explanation);

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
          speakGlobal(`Awesome! You completed all 10 questions and earned ${stars} stars!`);
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
        speakGlobal("Not quite right yet. Try listening and reading again!");
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
            KELAS 1 SD • LEVEL {levelId} dari 7
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
                  Sentuh Ungkapan Salam & Perkenalan:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
                  {[
                    { eng: "Good morning", indo: "Selamat pagi" },
                    { eng: "Hello", indo: "Halo" },
                    { eng: "Goodbye", indo: "Sampai jumpa" },
                    { eng: "My name is Budi", indo: "Nama saya Budi" },
                  ].map((item) => (
                    <button
                      key={item.eng}
                      type="button"
                      onClick={() => {
                        setActiveGreeting(item.eng);
                        playPopSound();
                        speakGlobal(`${item.eng}. Artinya ${item.indo}`);
                      }}
                      className={`p-3 rounded-xl border-2 border-[#3C632A] flex flex-col items-center text-center cursor-pointer transition-all ${
                        activeGreeting === item.eng
                          ? "bg-[#7FD13B] text-white scale-105 shadow-md"
                          : "bg-white text-[#3C632A] hover:bg-[#FFE296]"
                      }`}
                    >
                      <span className="text-xs font-black">{item.eng}</span>
                      <span className="text-[10px] opacity-90 mt-1 font-medium">{item.indo}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {levelId === 2 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  The Alphabet & Phonics Sound:
                </span>
                <div className="flex gap-2 flex-wrap justify-center">
                  {[
                    { letter: "A", word: "Apple", meaning: "Apel" },
                    { letter: "B", word: "Ball", meaning: "Bola" },
                    { letter: "C", word: "Cat", meaning: "Kucing" },
                    { letter: "D", word: "Dog", meaning: "Anjing" },
                    { letter: "E", word: "Elephant", meaning: "Gajah" },
                  ].map((item) => (
                    <button
                      key={item.letter}
                      type="button"
                      onClick={() => {
                        setActiveLetter(item);
                        playPopSound();
                        speakGlobal(`Letter ${item.letter}. ${item.word}, artinya ${item.meaning}`);
                      }}
                      className={`w-14 h-16 rounded-xl border-2 border-[#3C632A] flex flex-col items-center justify-center cursor-pointer transition-all ${
                        activeLetter.letter === item.letter
                          ? "bg-[#7FD13B] text-white scale-110 shadow-md"
                          : "bg-white text-[#3C632A] hover:bg-[#FFE296]"
                      }`}
                    >
                      <span className="text-2xl font-black">{item.letter}</span>
                      <span className="text-[10px] font-bold text-[#C3631D]">{item.word}</span>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white border border-[#3C632A] rounded-xl text-center text-xs font-bold text-[#3C632A] w-full shadow-sm">
                  Letter {activeLetter.letter} for "{activeLetter.word}" ({activeLetter.meaning})
                </div>
              </div>
            )}

            {levelId === 3 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Numbers 1 to 10 in English:
                </span>
                <div className="grid grid-cols-5 gap-2 w-full">
                  {[
                    { num: 1, text: "One" },
                    { num: 2, text: "Two" },
                    { num: 3, text: "Three" },
                    { num: 4, text: "Four" },
                    { num: 5, text: "Five" },
                    { num: 6, text: "Six" },
                    { num: 7, text: "Seven" },
                    { num: 8, text: "Eight" },
                    { num: 9, text: "Nine" },
                    { num: 10, text: "Ten" },
                  ].map((n) => (
                    <button
                      key={n.num}
                      type="button"
                      onClick={() => {
                        setActiveNumber(n.num);
                        playPopSound();
                        speakGlobal(`Number ${n.num}, ${n.text}`);
                      }}
                      className={`p-2 rounded-xl border-2 border-[#3C632A] text-center cursor-pointer transition-all ${
                        activeNumber === n.num
                          ? "bg-[#7FD13B] text-white scale-105 shadow-md"
                          : "bg-white text-[#3C632A] hover:bg-[#FFE296]"
                      }`}
                    >
                      <span className="text-lg font-black block">{n.num}</span>
                      <span className="text-[10px] font-bold block">{n.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {levelId === 4 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Colors and Shapes (Warna & Bentuk):
                </span>
                <div className="grid grid-cols-3 gap-2 w-full">
                  {[
                    { color: "Red", hex: "#EF4444", shape: "Circle", indo: "Merah - Lingkaran" },
                    { color: "Blue", hex: "#3B82F6", shape: "Square", indo: "Biru - Persegi" },
                    { color: "Green", hex: "#10B981", shape: "Triangle", indo: "Hijau - Segitiga" },
                  ].map((c) => (
                    <button
                      key={c.color}
                      type="button"
                      onClick={() => {
                        setActiveColor(c);
                        playPopSound();
                        speakGlobal(`Color ${c.color}, Shape ${c.shape}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] flex flex-col items-center text-center cursor-pointer transition-all ${
                        activeColor.color === c.color ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full border border-black mb-1" style={{ backgroundColor: c.hex }}></div>
                      <span className="text-xs font-black">{c.color}</span>
                      <span className="text-[10px] opacity-80">{c.shape}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {levelId === 5 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Classroom Objects (Benda di Kelas):
                </span>
                <div className="grid grid-cols-3 gap-2 w-full text-xs">
                  {[
                    { name: "Book", indo: "Buku" },
                    { name: "Pencil", indo: "Pensil" },
                    { name: "Bag", indo: "Tas" },
                    { name: "Chair", indo: "Kursi" },
                    { name: "Desk", indo: "Meja Belajar" },
                    { name: "Eraser", indo: "Penghapus" },
                  ].map((o) => (
                    <button
                      key={o.name}
                      type="button"
                      onClick={() => {
                        setActiveObject(o);
                        playPopSound();
                        speakGlobal(`${o.name}. Artinya ${o.indo}`);
                      }}
                      className={`p-2 rounded-xl border-2 border-[#3C632A] text-center cursor-pointer transition-all ${
                        activeObject.name === o.name ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block">{o.name}</strong>
                      <span className="text-[10px] opacity-80">{o.indo}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {levelId === 6 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  My Body (Anggota Tubuh Bagian Luar):
                </span>
                <div className="grid grid-cols-3 gap-2 w-full text-xs">
                  {[
                    { name: "Eyes", indo: "Mata", desc: "We see with our eyes" },
                    { name: "Ears", indo: "Telinga", desc: "We hear with our ears" },
                    { name: "Nose", indo: "Hidung", desc: "We smell with our nose" },
                    { name: "Mouth", indo: "Mulut", desc: "We speak and eat with our mouth" },
                    { name: "Hands", indo: "Tangan", desc: "We touch and hold with our hands" },
                    { name: "Feet", indo: "Kaki", desc: "We walk and run with our feet" },
                  ].map((b) => (
                    <button
                      key={b.name}
                      type="button"
                      onClick={() => {
                        setActiveBodyPart(b);
                        playPopSound();
                        speakGlobal(`${b.name}. ${b.indo}. ${b.desc}`);
                      }}
                      className={`p-2 rounded-xl border-2 border-[#3C632A] text-center cursor-pointer transition-all ${
                        activeBodyPart.name === b.name ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block">{b.name}</strong>
                      <span className="text-[10px] opacity-80">{b.indo}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {levelId === 7 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Family Members (Anggota Keluarga):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full text-xs">
                  {[
                    { member: "Father", indo: "Ayah" },
                    { member: "Mother", indo: "Ibu" },
                    { member: "Brother", indo: "Saudara Laki-laki" },
                    { member: "Sister", indo: "Saudara Perempuan" },
                  ].map((f) => (
                    <button
                      key={f.member}
                      type="button"
                      onClick={() => {
                        setActiveFamily(f);
                        playPopSound();
                        speakGlobal(`${f.member}. Artinya ${f.indo}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] text-center cursor-pointer transition-all ${
                        activeFamily.member === f.member ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block">{f.member}</strong>
                      <span className="text-[10px] opacity-80">{f.indo}</span>
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
        /* ================= HASIL SELESAI 10 SOAL ================= */
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
        /* ================= FASE 2: TANTANGAN 10 SOAL BERURUTAN ================= */
        <div className="w-full max-w-2xl flex-1 flex flex-col items-center justify-between my-2">
          
          {/* PROGRESS BAR 10 SOAL */}
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

          {/* PERTANYAAN SOAL */}
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

// ================= DATA SOAL KELAS 1 SD BAHASA INGGRIS (7 LEVEL x 10 SOAL = 70 SOAL) =================
function getGrade1EnglishData(levelId: number): LevelConceptData {
  switch (levelId) {
    case 1:
      return {
        title: "Greetings & Introductions",
        conceptText: "Kita menggunakan salam ramah seperti 'Good morning' (Selamat pagi), 'Hello' (Halo), dan 'Goodbye' (Sampai jumpa), serta 'My name is...' untuk memperkenalkan diri.",
        questions: [
          {
            id: 1,
            question: "Apa arti dari ucapan salam 'Good morning'?",
            options: ["Selamat pagi", "Selamat malam", "Sampai jumpa"],
            correctIndex: 0,
            explanation: "'Good morning' artinya selamat pagi.",
          },
          {
            id: 2,
            question: "Bagaimana cara mengatakan 'Nama saya Budi' dalam bahasa Inggris?",
            options: ["My name is Budi", "I am goodbye Budi", "Good night Budi"],
            correctIndex: 0,
            explanation: "Gunakan kalimat 'My name is...' untuk menyebutkan nama diri.",
          },
          {
            id: 3,
            question: "Ucapan saat akan berpisah dengan teman adalah...",
            options: ["Goodbye", "Good morning", "Thank you"],
            correctIndex: 0,
            explanation: "'Goodbye' diucapkan saat kita berpisah.",
          },
          {
            id: 4,
            question: "Jika seseorang menyapa 'Hello!', jawaban yang tepat adalah...",
            options: ["Hello!", "Goodbye!", "Sorry!"],
            correctIndex: 0,
            explanation: "Sapaan 'Hello' dijawab dengan 'Hello' juga.",
          },
          {
            id: 5,
            question: "Apa arti dari kata 'Good afternoon'?",
            options: ["Selamat siang / sore", "Selamat pagi", "Selamat tidur"],
            correctIndex: 0,
            explanation: "'Good afternoon' diucapkan pada siang hingga sore hari.",
          },
          {
            id: 6,
            question: "Lengkapi kalimat perkenalan: 'Hello, my ... is Siti.'",
            options: ["name", "school", "book"],
            correctIndex: 0,
            explanation: "Kata yang tepat adalah 'name' (nama).",
          },
          {
            id: 7,
            question: "Ungkapan 'How are you?' digunakan untuk menanyakan...",
            options: ["Kabar / keadaan", "Nama", "Alamat"],
            correctIndex: 0,
            explanation: "'How are you?' artinya 'Bagaimana kabarmu?'.",
          },
          {
            id: 8,
            question: "Jawaban untuk pertanyaan 'How are you?' adalah...",
            options: ["I am fine, thank you", "Good morning", "Goodbye"],
            correctIndex: 0,
            explanation: "'I am fine, thank you' artinya 'Saya baik-baik saja, terima kasih'.",
          },
          {
            id: 9,
            question: "Apa arti dari kata 'See you later'?",
            options: ["Sampai jumpa lagi", "Selamat pagi", "Terima kasih"],
            correctIndex: 0,
            explanation: "'See you later' artinya sampai jumpa lagi nanti.",
          },
          {
            id: 10,
            question: "Saat berterima kasih kepada orang lain, kita mengucapkan...",
            options: ["Thank you", "Goodbye", "Please"],
            correctIndex: 0,
            explanation: "'Thank you' berarti terima kasih.",
          },
        ],
      };

    case 2:
      return {
        title: "The Alphabet & Phonics",
        conceptText: "Abjad dalam bahasa Inggris (A to Z) memiliki pelafalan bunyi fonemik khusus yang membentuk kata-kata sederhana seperti Cat, Dog, dan Sun.",
        questions: [
          {
            id: 1,
            question: "Huruf pertama dalam alfabet bahasa Inggris adalah...",
            options: ["A", "B", "C"],
            correctIndex: 0,
            explanation: "Huruf pertama adalah huruf A.",
          },
          {
            id: 2,
            question: "Kata 'Apple' diawali dengan huruf...",
            options: ["A", "P", "L"],
            correctIndex: 0,
            explanation: "Kata 'Apple' diawali dengan huruf A.",
          },
          {
            id: 3,
            question: "Huruf 'C' dalam bahasa Inggris dibaca...",
            options: ["Si (/siː/)", "Ke", "Ce"],
            correctIndex: 0,
            explanation: "Huruf C dilafalkan sebagai /siː/.",
          },
          {
            id: 4,
            question: "Hewan kucing dalam bahasa Inggris dieja...",
            options: ["C - A - T", "D - O - G", "B - A - T"],
            correctIndex: 0,
            explanation: "'Cat' dieja C - A - T.",
          },
          {
            id: 5,
            question: "Kata 'Ball' (bola) diawali dengan huruf...",
            options: ["B", "D", "P"],
            correctIndex: 0,
            explanation: "'Ball' diawali dengan huruf B.",
          },
          {
            id: 6,
            question: "Ejaan bahasa Inggris untuk kata 'Matahari' (Sun) adalah...",
            options: ["S - U - N", "S - O - N", "S - A - N"],
            correctIndex: 0,
            explanation: "'Sun' dieja S - U - N.",
          },
          {
            id: 7,
            question: "Huruf terakhir dalam susunan abjad (alfabet) adalah...",
            options: ["Z", "Y", "X"],
            correctIndex: 0,
            explanation: "Huruf terakhir adalah huruf Z.",
          },
          {
            id: 8,
            question: "Kata 'Dog' (anjing) diawali dengan huruf...",
            options: ["D", "B", "P"],
            correctIndex: 0,
            explanation: "'Dog' diawali dengan huruf D.",
          },
          {
            id: 9,
            question: "Huruf vokal dalam alfabet bahasa Inggris adalah...",
            options: ["A, E, I, O, U", "B, C, D, F, G", "X, Y, Z"],
            correctIndex: 0,
            explanation: "Huruf vokal (vowels) adalah A, E, I, O, U.",
          },
          {
            id: 10,
            question: "Kata benda 'Fish' (ikan) diawali dengan huruf...",
            options: ["F", "P", "S"],
            correctIndex: 0,
            explanation: "'Fish' diawali dengan huruf F.",
          },
        ],
      };

    case 3:
      return {
        title: "Numbers (1–10/20)",
        conceptText: "Belajar menghitung angka 1 sampai 10 dan 20 dalam bahasa Inggris: One, Two, Three, Four, Five, Six, Seven, Eight, Nine, Ten, Twenty.",
        questions: [
          {
            id: 1,
            question: "Bahasa Inggris dari angka 1 adalah...",
            options: ["One", "Two", "Three"],
            correctIndex: 0,
            explanation: "Angka 1 adalah 'One'.",
          },
          {
            id: 2,
            question: "Berapakah hasil dari 2 + 1 dalam bahasa Inggris?",
            options: ["Three", "Four", "Two"],
            correctIndex: 0,
            explanation: "2 + 1 = 3, yaitu 'Three'.",
          },
          {
            id: 3,
            question: "Kata 'Five' melambangkan angka...",
            options: ["5", "4", "6"],
            correctIndex: 0,
            explanation: "'Five' adalah angka 5.",
          },
          {
            id: 4,
            question: "Urutan setelah 'Seven' (7) adalah...",
            options: ["Eight", "Six", "Nine"],
            correctIndex: 0,
            explanation: "Setelah 7 (Seven) adalah 8 (Eight).",
          },
          {
            id: 5,
            question: "Bahasa Inggris dari angka 10 adalah...",
            options: ["Ten", "Nine", "Eleven"],
            correctIndex: 0,
            explanation: "Angka 10 adalah 'Ten'.",
          },
          {
            id: 6,
            question: "Berapa jumlah jari pada satu tangan manusia?",
            options: ["Five fingers", "Ten fingers", "Three fingers"],
            correctIndex: 0,
            explanation: "Satu tangan memiliki 5 jari (Five fingers).",
          },
          {
            id: 7,
            question: "Bahasa Inggris dari angka 2 adalah...",
            options: ["Two", "To", "Too"],
            correctIndex: 0,
            explanation: "Angka 2 dieja 'Two'.",
          },
          {
            id: 8,
            question: "Kata 'Four' melambangkan angka...",
            options: ["4", "5", "3"],
            correctIndex: 0,
            explanation: "'Four' adalah angka 4.",
          },
          {
            id: 9,
            question: "Bahasa Inggris dari angka 20 adalah...",
            options: ["Twenty", "Twelve", "Two"],
            correctIndex: 0,
            explanation: "Angka 20 adalah 'Twenty'.",
          },
          {
            id: 10,
            question: "Berapakah hasil dari 5 + 5 dalam bahasa Inggris?",
            options: ["Ten", "Eight", "Nine"],
            correctIndex: 0,
            explanation: "5 + 5 = 10, yaitu 'Ten'.",
          },
        ],
      };

    case 4:
      return {
        title: "Colors & Shapes",
        conceptText: "Mengenal warna dasar (Red, Blue, Green, Yellow) dan bentuk dasar (Circle, Square, Triangle) di lingkungan sekitar kita.",
        questions: [
          {
            id: 1,
            question: "Bahasa Inggris dari warna 'Merah' adalah...",
            options: ["Red", "Blue", "Green"],
            correctIndex: 0,
            explanation: "Warna merah adalah 'Red'.",
          },
          {
            id: 2,
            question: "Warna langit pada siang hari yang cerah adalah...",
            options: ["Blue", "Yellow", "Red"],
            correctIndex: 0,
            explanation: "Langit cerah berwarna biru (Blue).",
          },
          {
            id: 3,
            question: "Bentuk bangun datar 'Lingkaran' dalam bahasa Inggris adalah...",
            options: ["Circle", "Square", "Triangle"],
            correctIndex: 0,
            explanation: "Lingkaran adalah 'Circle'.",
          },
          {
            id: 4,
            question: "Bentuk bangun datar 'Segitiga' dalam bahasa Inggris adalah...",
            options: ["Triangle", "Square", "Rectangle"],
            correctIndex: 0,
            explanation: "Segitiga adalah 'Triangle'.",
          },
          {
            id: 5,
            question: "Bahasa Inggris dari warna 'Kuning' adalah...",
            options: ["Yellow", "Green", "White"],
            correctIndex: 0,
            explanation: "Warna kuning adalah 'Yellow'.",
          },
          {
            id: 6,
            question: "Warna daun pohon yang segar umumnya adalah...",
            options: ["Green", "Black", "Pink"],
            correctIndex: 0,
            explanation: "Daun segar berwarna hijau (Green).",
          },
          {
            id: 7,
            question: "Bangun datar persegi dengan 4 sisi sama panjang adalah...",
            options: ["Square", "Circle", "Oval"],
            correctIndex: 0,
            explanation: "Persegi adalah 'Square'.",
          },
          {
            id: 8,
            question: "Bahasa Inggris dari warna 'Hitam' adalah...",
            options: ["Black", "White", "Brown"],
            correctIndex: 0,
            explanation: "Warna hitam adalah 'Black'.",
          },
          {
            id: 9,
            question: "Warna salju atau susu adalah...",
            options: ["White", "Yellow", "Purple"],
            correctIndex: 0,
            explanation: "Salju dan susu berwarna putih (White).",
          },
          {
            id: 10,
            question: "Bentuk roda sepeda menyerupai bentuk...",
            options: ["Circle", "Triangle", "Square"],
            correctIndex: 0,
            explanation: "Roda sepeda berbentuk lingkaran (Circle).",
          },
        ],
      };

    case 5:
      return {
        title: "Classroom Objects",
        conceptText: "Mengenal nama-nama benda di dalam kelas: Book (buku), Pencil (pensil), Bag (tas), Chair (kursi), Desk (meja), Eraser (penghapus), dan Ruler (penggaris).",
        questions: [
          {
            id: 1,
            question: "Bahasa Inggris dari benda 'Buku' adalah...",
            options: ["Book", "Bag", "Pencil"],
            correctIndex: 0,
            explanation: "'Buku' dalam bahasa Inggris adalah 'Book'.",
          },
          {
            id: 2,
            question: "Alat yang digunakan untuk menulis di buku tulis adalah...",
            options: ["Pencil", "Chair", "Table"],
            correctIndex: 0,
            explanation: "Alat tulis adalah pensil (Pencil).",
          },
          {
            id: 3,
            question: "Benda yang kita gunakan untuk membawa buku ke sekolah adalah...",
            options: ["Bag", "Desk", "Ruler"],
            correctIndex: 0,
            explanation: "Tas sekolah adalah 'Bag'.",
          },
          {
            id: 4,
            question: "Bahasa Inggris dari tempat kita duduk di kelas adalah...",
            options: ["Chair", "Desk", "Door"],
            correctIndex: 0,
            explanation: "Kursi adalah 'Chair'.",
          },
          {
            id: 5,
            question: "Alat untuk menghapus tulisan pensil yang salah adalah...",
            options: ["Eraser", "Ruler", "Pencil"],
            correctIndex: 0,
            explanation: "Penghapus adalah 'Eraser'.",
          },
          {
            id: 6,
            question: "Alat yang digunakan untuk mengukur panjang garis lurus adalah...",
            options: ["Ruler", "Book", "Chair"],
            correctIndex: 0,
            explanation: "Penggaris adalah 'Ruler'.",
          },
          {
            id: 7,
            question: "Bahasa Inggris dari 'Meja belajar' adalah...",
            options: ["Desk", "Bed", "Window"],
            correctIndex: 0,
            explanation: "Meja belajar siswa adalah 'Desk'.",
          },
          {
            id: 8,
            question: "Papan tulis putih di depan kelas disebut...",
            options: ["Whiteboard", "Table", "Floor"],
            correctIndex: 0,
            explanation: "Papan tulis putih adalah 'Whiteboard'.",
          },
          {
            id: 9,
            question: "Arti dari kata 'Open your book' adalah...",
            options: ["Buka bukumu", "Tutup bukumu", "Ambil tasmu"],
            correctIndex: 0,
            explanation: "'Open your book' artinya 'Buka bukumu'.",
          },
          {
            id: 10,
            question: "Arti dari kata 'Sit down' adalah...",
            options: ["Duduklah", "Berdirilah", "Tulislah"],
            correctIndex: 0,
            explanation: "'Sit down' artinya 'Duduklah'.",
          },
        ],
      };

    case 6:
      return {
        title: "My Body",
        conceptText: "Mengenal nama-nama anggota tubuh bagian luar: Eyes (mata), Ears (telinga), Nose (hidung), Mouth (mulut), Hands (tangan), dan Feet (kaki).",
        questions: [
          {
            id: 1,
            question: "Anggota tubuh yang digunakan untuk melihat adalah...",
            options: ["Eyes", "Ears", "Nose"],
            correctIndex: 0,
            explanation: "Mata (Eyes) digunakan untuk melihat.",
          },
          {
            id: 2,
            question: "Anggota tubuh yang digunakan untuk mendengar suara adalah...",
            options: ["Ears", "Mouth", "Feet"],
            correctIndex: 0,
            explanation: "Telinga (Ears) digunakan untuk mendengar.",
          },
          {
            id: 3,
            question: "Bahasa Inggris dari 'Hidung' adalah...",
            options: ["Nose", "Neck", "Knee"],
            correctIndex: 0,
            explanation: "Hidung adalah 'Nose'.",
          },
          {
            id: 4,
            question: "Kita berbicara dan makan menggunakan...",
            options: ["Mouth", "Eyes", "Ears"],
            correctIndex: 0,
            explanation: "Mulut adalah 'Mouth'.",
          },
          {
            id: 5,
            question: "Bahasa Inggris dari 'Tangan' adalah...",
            options: ["Hand", "Foot", "Head"],
            correctIndex: 0,
            explanation: "Tangan adalah 'Hand'.",
          },
          {
            id: 6,
            question: "Kita berjalan dan berlari menggunakan kedua...",
            options: ["Feet", "Hands", "Eyes"],
            correctIndex: 0,
            explanation: "Kaki adalah 'Feet'.",
          },
          {
            id: 7,
            question: "Bahasa Inggris dari 'Kepala' adalah...",
            options: ["Head", "Hand", "Hair"],
            correctIndex: 0,
            explanation: "Kepala adalah 'Head'.",
          },
          {
            id: 8,
            question: "Rambut di kepala kita dalam bahasa Inggris disebut...",
            options: ["Hair", "Hand", "Heart"],
            correctIndex: 0,
            explanation: "Rambut adalah 'Hair'.",
          },
          {
            id: 9,
            question: "Jumlah mata pada manusia normal adalah...",
            options: ["Two eyes", "One eye", "Three eyes"],
            correctIndex: 0,
            explanation: "Manusia memiliki dua mata (Two eyes).",
          },
          {
            id: 10,
            question: "Arti dari perintah 'Touch your nose' adalah...",
            options: ["Sentuh hidungmu", "Tutup matamu", "Buka mulutmu"],
            correctIndex: 0,
            explanation: "'Touch your nose' artinya sentuh hidungmu.",
          },
        ],
      };

    case 7:
      return {
        title: "Family Members",
        conceptText: "Mengenal sebutan anggota keluarga inti: Father (ayah), Mother (ibu), Brother (saudara laki-laki), Sister (saudara perempuan), dan Baby (bayi).",
        questions: [
          {
            id: 1,
            question: "Bahasa Inggris dari kata 'Ayah' adalah...",
            options: ["Father", "Mother", "Sister"],
            correctIndex: 0,
            explanation: "Ayah adalah 'Father'.",
          },
          {
            id: 2,
            question: "Bahasa Inggris dari kata 'Ibu' adalah...",
            options: ["Mother", "Father", "Brother"],
            correctIndex: 0,
            explanation: "Ibu adalah 'Mother'.",
          },
          {
            id: 3,
            question: "Saudara laki-laki dalam bahasa Inggris disebut...",
            options: ["Brother", "Sister", "Uncle"],
            correctIndex: 0,
            explanation: "Saudara laki-laki adalah 'Brother'.",
          },
          {
            id: 4,
            question: "Saudara perempuan dalam bahasa Inggris disebut...",
            options: ["Sister", "Brother", "Father"],
            correctIndex: 0,
            explanation: "Saudara perempuan adalah 'Sister'.",
          },
          {
            id: 5,
            question: "Sebutan untuk orang tua kita (ayah dan ibu) adalah...",
            options: ["Parents", "Children", "Friends"],
            correctIndex: 0,
            explanation: "Orang tua disebut 'Parents'.",
          },
          {
            id: 6,
            question: "Bahasa Inggris dari kakek adalah...",
            options: ["Grandfather", "Grandmother", "Father"],
            correctIndex: 0,
            explanation: "Kakek adalah 'Grandfather'.",
          },
          {
            id: 7,
            question: "Bahasa Inggris dari nenek adalah...",
            options: ["Grandmother", "Mother", "Aunt"],
            correctIndex: 0,
            explanation: "Nenek adalah 'Grandmother'.",
          },
          {
            id: 8,
            question: "Adik kecil yang masih digendong disebut...",
            options: ["Baby", "Father", "Sister"],
            correctIndex: 0,
            explanation: "Bayi adalah 'Baby'.",
          },
          {
            id: 9,
            question: "Arti dari kalimat 'I love my family' adalah...",
            options: ["Saya menyayangi keluarga saya", "Saya pergi ke sekolah", "Saya punya buku"],
            correctIndex: 0,
            explanation: "'I love my family' artinya saya menyayangi keluarga saya.",
          },
          {
            id: 10,
            question: "Paman dalam bahasa Inggris disebut...",
            options: ["Uncle", "Aunt", "Brother"],
            correctIndex: 0,
            explanation: "Paman adalah 'Uncle'.",
          },
        ],
      };

    default:
      return {
        title: "English Level",
        conceptText: "Materi belajar Bahasa Inggris Kelas 1 SD.",
        questions: [],
      };
  }
}
