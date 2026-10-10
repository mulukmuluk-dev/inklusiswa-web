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

interface IndoGrade2GameProps {
  levelId: number;
  onLevelComplete: (levelId: number, starsEarned: number) => void;
  accessibilityMode?: string;
}

export function IndoGrade2Game({ levelId, onLevelComplete, accessibilityMode }: IndoGrade2GameProps) {
  const [phase, setPhase] = useState<"materi" | "game">("materi");

  // Phase 1 interactive state
  const [activeSign, setActiveSign] = useState<string>(".");
  const [activeSpoWord, setActiveSpoWord] = useState<{ s: string; p: string; o: string }>({
    s: "Siti",
    p: "menyiram",
    o: "bunga",
  });
  const [activeSentenceType, setActiveSentenceType] = useState<string>("Ajakan");

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

  useEffect(() => {
    setPhase("materi");
    setActiveSign(".");
    setActiveSpoWord({ s: "Siti", p: "menyiram", o: "bunga" });
    setActiveSentenceType("Ajakan");

    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setWrongAttempts(0);
    setShowClue(false);
    setIsCompleted(false);
    isProcessingRef.current = false;

    const data = getGrade2LevelData(levelId);
    setQuestionsList(shuffleQuestions(data));
    speakGlobal(data.conceptText);
  }, [levelId]);

  const levelData = getGrade2LevelData(levelId);
  const activeQuestions = questionsList.length > 0 ? questionsList : levelData.questions;
  const currentQ = activeQuestions[currentQuestionIndex] || activeQuestions[0];

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
          speakGlobal(`Luar biasa! Kamu telah menyelesaikan 10 soal Bahasa Indonesia Kelas 2 dan meraih ${stars} bintang!`);
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
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Tanda Baca & Contoh Penggunaannya:
                </span>
                <div className="grid grid-cols-3 gap-2 w-full">
                  {[
                    { sign: ".", label: "Titik (.)", contoh: "Budi membaca buku.", func: "Kalimat berita atau selesai" },
                    { sign: "?", label: "Tanya (?)", contoh: "Siapa namamu?", func: "Menanyakan sesuatu" },
                    { sign: "!", label: "Seru (!)", contoh: "Tolong ambilkan buku!", func: "Perintah atau seruan" },
                  ].map((s) => (
                    <button
                      key={s.sign}
                      type="button"
                      onClick={() => {
                        setActiveSign(s.sign);
                        playPopSound();
                        speakGlobal(`Tanda ${s.label}. Contoh: ${s.contoh}. Digunakan untuk ${s.func}`);
                      }}
                      className={`p-3 rounded-2xl border-2 border-[#3C632A] flex flex-col items-center text-center transition-all cursor-pointer ${
                        activeSign === s.sign ? "bg-[#7FD13B] text-white scale-105 shadow-md" : "bg-white text-[#3C632A] hover:bg-[#FFE296]"
                      }`}
                    >
                      <span className="text-3xl font-black">{s.sign}</span>
                      <span className="text-xs font-black mt-1">{s.label}</span>
                      <span className="text-[10px] mt-1 italic font-medium">"{s.contoh}"</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {levelId === 2 && (
              <div className="w-full flex flex-col items-center space-y-3 text-center">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Kosakata Lingkungan & Permainan Tradisional:
                </span>
                <div className="grid grid-cols-2 gap-2 w-full text-xs font-bold text-slate-800">
                  <div className="p-3 bg-white border-2 border-[#3C632A] rounded-xl shadow-sm text-left">
                    <strong className="text-[#3C632A] block mb-1">Lingkungan Sehat:</strong>
                    Bersih, asri, sejuk, sampah dipilah, selokan lancar tanpa sumbatan.
                  </div>
                  <div className="p-3 bg-white border-2 border-[#3C632A] rounded-xl shadow-sm text-left">
                    <strong className="text-[#C3631D] block mb-1">Permainan Tradisional:</strong>
                    Gobak sodor, egrang, congklak, lompat tali, layang-layang.
                  </div>
                </div>
              </div>
            )}

            {levelId === 3 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Mengenal Pola Kalimat S-P-O:
                </span>
                <div className="flex items-center space-x-2 bg-white p-3 rounded-2xl border-2 border-[#3C632A] w-full justify-center shadow-sm">
                  <div className="p-2 bg-[#FFDF59] rounded-xl border border-[#3C632A] text-center">
                    <span className="text-[10px] font-black block text-[#C3631D]">SUBJEK (S)</span>
                    <span className="text-sm font-black text-[#3C632A]">{activeSpoWord.s}</span>
                  </div>
                  <span className="text-lg font-black text-[#3C632A]">+</span>
                  <div className="p-2 bg-[#7FD13B] text-white rounded-xl border border-[#3C632A] text-center">
                    <span className="text-[10px] font-black block text-emerald-950">PREDIKAT (P)</span>
                    <span className="text-sm font-black">{activeSpoWord.p}</span>
                  </div>
                  <span className="text-lg font-black text-[#3C632A]">+</span>
                  <div className="p-2 bg-[#C3631D] text-white rounded-xl border border-[#3C632A] text-center">
                    <span className="text-[10px] font-black block text-amber-200">OBJEK (O)</span>
                    <span className="text-sm font-black">{activeSpoWord.o}</span>
                  </div>
                </div>
                <div className="text-[11px] font-bold text-[#3C632A] bg-white/70 px-3 py-1 rounded-lg border border-[#3C632A] text-center">
                  Subjek = Pelaku, Predikat = Tindakan atau kegiatan, Objek = Benda yang dikenai kegiatan.
                </div>
              </div>
            )}

            {levelId === 4 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  4 Jenis Kalimat yang Santun:
                </span>
                <div className="grid grid-cols-2 gap-2 w-full text-xs">
                  <div className="p-2.5 bg-white border border-[#3C632A] rounded-xl shadow-sm">
                    <strong>Ajakan:</strong> "Ayo kita belajar bersama!" (kata <em>ayo / mari</em>)
                  </div>
                  <div className="p-2.5 bg-white border border-[#3C632A] rounded-xl shadow-sm">
                    <strong>Perintah:</strong> "Tolong tutup pintunya ya!" (santun dan jelas)
                  </div>
                  <div className="p-2.5 bg-white border border-[#3C632A] rounded-xl shadow-sm">
                    <strong>Penolakan:</strong> "Maaf, saya tidak bisa ikut." (disertai kata <em>maaf</em>)
                  </div>
                  <div className="p-2.5 bg-white border border-[#3C632A] rounded-xl shadow-sm">
                    <strong>Sapaan:</strong> "Selamat pagi, Bu Guru!" (ramah dan hormat)
                  </div>
                </div>
              </div>
            )}

            {levelId === 5 && (
              <div className="w-full flex flex-col items-center space-y-3 text-center">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Huruf Tegak Bersambung:
                </span>
                <div className="p-4 bg-white border-2 border-dashed border-[#3C632A] rounded-2xl w-full shadow-sm">
                  <p className="font-serif italic text-2xl text-[#3C632A] tracking-wider">
                    "Rajin Pangkal Pandai"
                  </p>
                </div>
                <p className="text-[11px] font-bold text-[#3C632A] bg-white/70 px-3 py-1 rounded-lg border border-[#3C632A]">
                  Menulis tegak bersambung menghubungkan garis antar huruf secara mengalir rapi dan indah.
                </p>
              </div>
            )}

            {levelId === 6 && (
              <div className="w-full flex flex-col items-center space-y-3 text-center">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Deklamasi Puisi Anak: "Sahabat Sejati"
                </span>
                <div className="p-3 bg-white rounded-xl border-2 border-[#3C632A] text-xs italic text-slate-800 leading-relaxed text-left shadow-sm">
                  Kau selalu ada di sampingku,<br />
                  Bermain bersama saat gembira,<br />
                  Menghiburku saat bersedih,<br />
                  Terima kasih, sahabat setiaku.
                </div>
                <p className="text-[11px] font-bold text-[#C3631D] bg-white/70 px-3 py-1 rounded-lg border border-[#3C632A]">
                  Membaca puisi dilakukan dengan lafal jelas, intonasi berirama, dan penghayatan ekspresi wajah.
                </p>
              </div>
            )}

            {levelId === 7 && (
              <div className="w-full flex flex-col items-center space-y-3 text-center">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Kata Tanya 5W1H dalam Teks Cerita:
                </span>
                <div className="grid grid-cols-2 gap-2 w-full text-xs text-left">
                  <div className="p-2.5 bg-white rounded-xl border border-[#3C632A] shadow-sm"><strong>Apa:</strong> Menanyakan peristiwa atau benda</div>
                  <div className="p-2.5 bg-white rounded-xl border border-[#3C632A] shadow-sm"><strong>Siapa:</strong> Menanyakan tokoh atau orang</div>
                  <div className="p-2.5 bg-white rounded-xl border border-[#3C632A] shadow-sm"><strong>Di mana:</strong> Menanyakan tempat kejadian</div>
                  <div className="p-2.5 bg-white rounded-xl border border-[#3C632A] shadow-sm"><strong>Kapan:</strong> Menanyakan waktu kejadian</div>
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

function getGrade2LevelData(levelId: number): LevelConceptData {
  switch (levelId) {
    case 1:
      return {
        title: "Tanda Baca & Ejaan",
        conceptText: "Huruf kapital digunakan pada awal kalimat, nama orang, hari, dan bulan. Tanda baca meliputi titik (.), tanda tanya (?), dan tanda seru (!).",
        questions: [
          {
            id: 1,
            question: "Tanda baca yang tepat untuk kalimat tanya 'Di mana rumahmu' adalah...",
            options: ["Tanda tanya (?)", "Tanda titik (.)", "Tanda seru (!)"],
            correctIndex: 0,
            explanation: "Kalimat tanya selalu diakhiri dengan tanda tanya (?).",
          },
          {
            id: 2,
            question: "Manakah penulisan nama hari yang menggunakan huruf kapital dengan benar?",
            options: ["Senin", "senin", "seNin"],
            correctIndex: 0,
            explanation: "Nama hari selalu diawali huruf kapital (Senin).",
          },
          {
            id: 3,
            question: "Tanda baca untuk mengakhiri kalimat perintah 'Tolong ambilkan buku itu' adalah...",
            options: ["Tanda seru (!)", "Tanda tanya (?)", "Tanda koma (,)"],
            correctIndex: 0,
            explanation: "Kalimat perintah atau ajakan yang tegas diakhiri tanda seru (!).",
          },
          {
            id: 4,
            question: "Penulisan nama bulan yang tepat di bawah ini adalah...",
            options: ["Agustus", "agustus", "agustuS"],
            correctIndex: 0,
            explanation: "Nama bulan selalu diawali huruf kapital (Agustus).",
          },
          {
            id: 5,
            question: "Manakah kalimat yang penggunaan huruf kapital dan titiknya paling tepat?",
            options: ["Edo pergi ke pasar pada hari Minggu.", "edo pergi ke pasar pada hari minggu.", "Edo pergi ke pasar pada hari minggu"],
            correctIndex: 0,
            explanation: "Edo (nama orang), Minggu (nama hari) berhuruf kapital, dan diakhiri titik.",
          },
          {
            id: 6,
            question: "Tanda baca koma (,) biasanya digunakan untuk...",
            options: ["Memisahkan rincian benda", "Mengakhiri buku", "Menanyakan kabar"],
            correctIndex: 0,
            explanation: "Tanda koma memisahkan perincian kata dalam satu kalimat.",
          },
          {
            id: 7,
            question: "Kalimat 'Wah, pemandangan ini indah sekali ...' diakhiri tanda...",
            options: ["Tanda seru (!)", "Tanda tanya (?)", "Tanda titik dua (:)"],
            correctIndex: 0,
            explanation: "Kalimat seruan kekaguman diakhiri tanda seru (!).",
          },
          {
            id: 8,
            question: "Penulisan nama orang di tengah kalimat yang benar adalah...",
            options: ["Budi bertemu Siti di sekolah.", "Budi bertemu siti di sekolah.", "budi bertemu siti di sekolah."],
            correctIndex: 0,
            explanation: "Setiap nama orang (Budi, Siti) wajib diawali huruf kapital.",
          },
          {
            id: 9,
            question: "'Kapan paman datang dari desa ...' Tanda baca yang tepat adalah...",
            options: ["Tanda tanya (?)", "Tanda seru (!)", "Tanda titik (.)"],
            correctIndex: 0,
            explanation: "Kata 'Kapan' adalah kata tanya, sehingga membutuhkan tanda tanya (?).",
          },
          {
            id: 10,
            question: "Huruf kapital TIDAK digunakan untuk...",
            options: ["Nama benda umum di tengah kalimat", "Awal kalimat", "Nama orang dan kota"],
            correctIndex: 0,
            explanation: "Benda umum seperti meja, buku, kursi tidak perlu huruf kapital jika di tengah kalimat.",
          },
        ],
      };

    case 2:
      return {
        title: "Kosakata Lingkungan & Kegiatan",
        conceptText: "Mengenal kosakata lingkungan sehat (asri, bersih, selokan), keluarga, cuaca (cerah, mendung, hujan), dan permainan tradisional nusantara.",
        questions: [
          {
            id: 1,
            question: "Lingkungan yang banyak ditumbuhi pohon rindang dan hijau disebut lingkungan yang...",
            options: ["Asri", "Gersang", "Kotor"],
            correctIndex: 0,
            explanation: "Asri berarti indah, sedap dipandang mata dan sejuk karena banyak pepohonan.",
          },
          {
            id: 2,
            question: "Permainan tradisional yang menggunakan bambu tinggi untuk berjalan adalah...",
            options: ["Egrang", "Congklak", "Kelereng"],
            correctIndex: 0,
            explanation: "Egrang adalah permainan berjalan dengan dua bilah bambu berpijakan kaki.",
          },
          {
            id: 3,
            question: "Keadaan langit yang tertutup awan gelap dan matahari tidak terlihat disebut...",
            options: ["Mendung", "Cerah", "Kemarau"],
            correctIndex: 0,
            explanation: "Mendung adalah keadaan langit saat tertutup awan kelabu tanda akan hujan.",
          },
          {
            id: 4,
            question: "Saluran air di pinggir jalan untuk mengalirkan air hujan disebut...",
            options: ["Selokan", "Jembatan", "Pagar"],
            correctIndex: 0,
            explanation: "Selokan atau parit berfungsi mengalirkan air agar tidak terjadi banjir.",
          },
          {
            id: 5,
            question: "Permainan tradisional menggunakan papan berlubang dan biji kerang disebut...",
            options: ["Congklak", "Gobak sodor", "Petak umpet"],
            correctIndex: 0,
            explanation: "Congklak dimainkan di atas papan kayu berlubang dengan biji atau cangkang kerang.",
          },
          {
            id: 6,
            question: "Udara bersih yang belum tercemar oleh asap kendaraan disebut udara yang...",
            options: ["Segar", "Berbau", "Panas"],
            correctIndex: 0,
            explanation: "Udara di daerah asri dan banyak pohon terasa segar dan sehat dihirup.",
          },
          {
            id: 7,
            question: "Benda dari kain yang diterbangkan dengan bantuan angin di lapangan adalah...",
            options: ["Layang-layang", "Egrang", "Gasing"],
            correctIndex: 0,
            explanation: "Layang-layang terbang tinggi melayang ditiup angin.",
          },
          {
            id: 8,
            question: "Lawan kata (antonim) dari kata 'bersih' adalah...",
            options: ["Kotor", "Rapi", "Indah"],
            correctIndex: 0,
            explanation: "Kebalikan dari bersih adalah kotor.",
          },
          {
            id: 9,
            question: "Saat cuaca terik matahari bersinar hangat, cuaca tersebut dinamakan...",
            options: ["Cerah", "Badai", "Mendung"],
            correctIndex: 0,
            explanation: "Cuaca cerah ditandai dengan langit terang dan sinar matahari leluasa menyinari bumi.",
          },
          {
            id: 10,
            question: "Sampah yang membusuk di sungai dapat menyebabkan...",
            options: ["Banjir dan bau tidak sedap", "Ikan bertambah gemuk", "Air menjadi jernih"],
            correctIndex: 0,
            explanation: "Sampah menyumbat aliran air sungai sehingga memicu timbulnya banjir.",
          },
        ],
      };

    case 3:
      return {
        title: "Kalimat Berpola (S-P-O)",
        conceptText: "Kalimat berpola S-P-O terdiri dari Subjek (pelaku), Predikat (kata kerja tindakan), dan Objek (benda yang dikenai perbuatan).",
        questions: [
          {
            id: 1,
            question: "Pada kalimat 'Ibu menggoreng ikan', siapakah yang menjadi Subjek (S)?",
            options: ["Ibu", "Menggoreng", "Ikan"],
            correctIndex: 0,
            explanation: "Subjek adalah pelaku tindakan, yaitu Ibu.",
          },
          {
            id: 2,
            question: "Pada kalimat 'Budi menendang bola', kata 'menendang' berkedudukan sebagai...",
            options: ["Predikat (P)", "Subjek (S)", "Objek (O)"],
            correctIndex: 0,
            explanation: "Predikat adalah kata kerja atau perbuatan yang dilakukan, yaitu 'menendang'.",
          },
          {
            id: 3,
            question: "Pada kalimat 'Kucing menangkap tikus', kata 'tikus' berkedudukan sebagai...",
            options: ["Objek (O)", "Predikat (P)", "Subjek (S)"],
            correctIndex: 0,
            explanation: "Objek adalah benda atau sasaran yang dikenai tindakan, yaitu 'tikus'.",
          },
          {
            id: 4,
            question: "Manakah kalimat yang berpola lengkap Subjek - Predikat - Objek (S-P-O)?",
            options: ["Ayah mencuci mobil.", "Ayah tidur.", "Di halaman rumah."],
            correctIndex: 0,
            explanation: "Ayah (S) mencuci (P) mobil (O) memiliki pola S-P-O lengkap.",
          },
          {
            id: 5,
            question: "Pada kalimat 'Siti memetik bunga', kata 'bunga' merupakan...",
            options: ["Objek (O)", "Subjek (S)", "Predikat (P)"],
            correctIndex: 0,
            explanation: "Bunga adalah sasaran yang dipetik (Objek).",
          },
          {
            id: 6,
            question: "Predikat dalam kalimat biasanya berupa kata...",
            options: ["Kerja (tindakan)", "Benda mati", "Tanya"],
            correctIndex: 0,
            explanation: "Predikat menyatakan perbuatan atau aktivitas yang dilakukan subjek.",
          },
          {
            id: 7,
            question: "Pada kalimat 'Adik meminum susu', kata yang bertindak sebagai Predikat adalah...",
            options: ["Meminum", "Adik", "Susu"],
            correctIndex: 0,
            explanation: "'Meminum' adalah tindakan yang dilakukan adik (Predikat).",
          },
          {
            id: 8,
            question: "Susunan kata 'nasi - Rina - memasak' yang benar menurut pola S-P-O adalah...",
            options: ["Rina memasak nasi.", "Nasi Rina memasak.", "Memasak Rina nasi."],
            correctIndex: 0,
            explanation: "Rina (S) memasak (P) nasi (O).",
          },
          {
            id: 9,
            question: "Pada kalimat 'Petani menanam padi di sawah', siapakah Subjeknya?",
            options: ["Petani", "Menanam", "Padi"],
            correctIndex: 0,
            explanation: "Petani adalah orang yang melakukan tindakan (Subjek).",
          },
          {
            id: 10,
            question: "Kalimat 'Burung terbang.' memiliki pola kalimat...",
            options: ["Subjek - Predikat (S-P)", "Subjek - Objek (S-O)", "Predikat - Objek (P-O)"],
            correctIndex: 0,
            explanation: "Burung (S) terbang (P), belum memiliki objek (pola S-P).",
          },
        ],
      };

    case 4:
      return {
        title: "Jenis-Jenis Kalimat",
        conceptText: "Ada 4 jenis kalimat: Kalimat ajakan (ayo/mari), kalimat perintah (tolong/kerjakan), kalimat penolakan (maaf tidak bisa), dan kalimat sapaan (halo/selamat pagi).",
        questions: [
          {
            id: 1,
            question: "'Ayo kita membersihkan kelas bersama-sama!' Kalimat ini termasuk jenis kalimat...",
            options: ["Ajakan", "Perintah", "Penolakan"],
            correctIndex: 0,
            explanation: "Kalimat yang menggunakan kata 'ayo' atau 'mari' adalah kalimat ajakan.",
          },
          {
            id: 2,
            question: "'Maaf Dayu, aku tidak bisa ikut bermain karena harus menjaga adik.' Kalimat ini adalah kalimat...",
            options: ["Penolakan yang santun", "Ajakan", "Perintah kasar"],
            correctIndex: 0,
            explanation: "Menolak tawaran dengan santun diawali kata 'maaf' dan disertai alasan yang jelas.",
          },
          {
            id: 3,
            question: "'Tolong hapus papan tulis itu, Budi!' Kalimat ini termasuk kalimat...",
            options: ["Perintah santun", "Tanya", "Penolakan"],
            correctIndex: 0,
            explanation: "Meminta seseorang melakukan sesuatu dengan kata 'tolong' adalah kalimat perintah santun.",
          },
          {
            id: 4,
            question: "'Selamat pagi, Pak Guru!' Kalimat ini termasuk kalimat...",
            options: ["Sapaan", "Perintah", "Penolakan"],
            correctIndex: 0,
            explanation: "Menyapa guru saat bertemu merupakan kalimat sapaan yang sopan.",
          },
          {
            id: 5,
            question: "Ciri khas kalimat ajakan adalah menggunakan kata...",
            options: ["Ayo dan Mari", "Jangan dan Dilarang", "Mengapa dan Kapan"],
            correctIndex: 0,
            explanation: "'Ayo' dan 'Mari' adalah penanda utama kalimat ajakan.",
          },
          {
            id: 6,
            question: "Manakah kalimat perintah yang paling santun di bawah ini?",
            options: ["Tolong buang sampah ini ke tempatnya, ya.", "Buang sampah ini sekarang!", "Cepat buang sana!"],
            correctIndex: 0,
            explanation: "Menggunakan kata 'tolong' dan akhiran 'ya' terdengar sangat ramah dan santun.",
          },
          {
            id: 7,
            question: "Siti diajak temannya makan permen, tetapi giginya sakit. Jawaban penolakan yang tepat adalah...",
            options: ["Maaf, gigiku sedang sakit jadi aku tidak makan permen.", "Tidak mau, permenmu jelek!", "Pergi saja kau sendiri!"],
            correctIndex: 0,
            explanation: "Menolak dengan kata 'maaf' dan alasan yang jujur menghargai perasaan teman.",
          },
          {
            id: 8,
            question: "'Mari kita berbaris rapi sebelum masuk kelas.' Kalimat ini mengajak untuk...",
            options: ["Berbaris rapi", "Bermain lari-larian", "Membeli jajanan"],
            correctIndex: 0,
            explanation: "Isi ajakan tersebut adalah berbaris rapi di depan kelas.",
          },
          {
            id: 9,
            question: "Saat bertemu teman di jalan pada sore hari, sapaan yang tepat adalah...",
            options: ["Selamat sore, teman!", "Selamat tidur!", "Selamat makan!"],
            correctIndex: 0,
            explanation: "Sapaan disesuaikan dengan waktu, yaitu selamat sore.",
          },
          {
            id: 10,
            question: "Kalimat perintah biasanya diakhiri dengan tanda baca...",
            options: ["Tanda seru (!)", "Tanda tanya (?)", "Tanda kutip (\")"],
            correctIndex: 0,
            explanation: "Kalimat perintah diakhiri dengan tanda seru (!).",
          },
        ],
      };

    case 5:
      return {
        title: "Menulis Tegak Bersambung",
        conceptText: "Menulis tegak bersambung melatih kelenturan jemari tangan. Huruf ditulis menyambung dari kiri ke kanan secara rapi di dalam buku garis tiga/lima.",
        questions: [
          {
            id: 1,
            question: "Buku khusus yang digunakan untuk latihan menulis tegak bersambung adalah...",
            options: ["Buku garis tiga / garis lima", "Buku gambar polos", "Buku kotak matematika"],
            correctIndex: 0,
            explanation: "Buku garis halus tiga atau lima membantu menjaga proporsi tinggi huruf.",
          },
          {
            id: 2,
            question: "Ciri utama tulisan tegak bersambung adalah...",
            options: ["Huruf-hurufnya saling menyambung dengan garis indah", "Huruf ditulis terpisah jauh", "Huruf dicoret-coret"],
            correctIndex: 0,
            explanation: "Tulisan tegak bersambung menghubungkan ujung huruf satu ke huruf berikutnya.",
          },
          {
            id: 3,
            question: "Manakah huruf yang memiliki tangkai menjulang ke atas (tinggi)?",
            options: ["b, d, h, k, l", "a, c, e, m, n", "g, j, p, q, y"],
            correctIndex: 0,
            explanation: "Huruf b, d, h, k, l memiliki tiang/tangkai yang naik ke atas.",
          },
          {
            id: 4,
            question: "Manakah kelompok huruf yang memiliki ekor menjulur ke bawah garis?",
            options: ["g, j, p, q, y", "b, d, f, h, k", "a, c, e, o, s"],
            correctIndex: 0,
            explanation: "Huruf g, j, p, q, y memiliki ekor yang turun menembus garis bawah.",
          },
          {
            id: 5,
            question: "Manfaat latihan menulis tegak bersambung adalah...",
            options: ["Melatih ketelitian dan motorik halus jemari", "Membuat tangan cepat lelah tanpa hasil", "Supaya pensil cepat habis"],
            correctIndex: 0,
            explanation: "Menulis bersambung melatih koordinasi tangan, mata, dan kesabaran anak.",
          },
          {
            id: 6,
            question: "Saat menulis tegak bersambung, gerakan tangan sebaiknya...",
            options: ["Mengalir lancar dan lentur", "Kaku dan menekan kertas keras-keras", "Gemetar dan terputus-putus"],
            correctIndex: 0,
            explanation: "Goresan tulisan bersambung harus luwes dan tidak terlalu menekan buku.",
          },
          {
            id: 7,
            question: "Huruf kecil yang berada di baris tengah saja tanpa tangkai atas atau ekor adalah...",
            options: ["a, c, e, m, n, o, r, s, u, v, w, x, z", "b, d, h, k", "g, j, y"],
            correctIndex: 0,
            explanation: "Huruf-huruf ini tingginya hanya pas memenuhi garis tengah buku halus.",
          },
          {
            id: 8,
            question: "Saat menyalin kalimat ke huruf tegak bersambung, huruf kapital digunakan pada...",
            options: ["Awal kalimat dan nama orang", "Semua huruf di kalimat", "Akhir kalimat saja"],
            correctIndex: 0,
            explanation: "Kaidah ejaan tetap sama: huruf kapital hanya untuk awal kalimat dan nama diri.",
          },
          {
            id: 9,
            question: "Alat tulis yang paling ideal untuk murid kelas 2 berlatih menulis halus adalah...",
            options: ["Pensil 2B yang runcing", "Spidol tebal permanen", "Cat air dan kuas"],
            correctIndex: 0,
            explanation: "Pensil 2B mudah dikontrol goresannya dan dapat dihapus jika keliru.",
          },
          {
            id: 10,
            question: "Apa arti pepatah yang sering ditulis dalam latihan bersambung: 'Rajin Pangkal Pandai'?",
            options: ["Orang yang rajin belajar pasti akan menjadi pintar", "Orang malas akan beruntung", "Pintar itu bawaan tanpa perlu belajar"],
            correctIndex: 0,
            explanation: "Rajin belajar adalah kunci meraih ilmu dan kepandaian.",
          },
        ],
      };

    case 6:
      return {
        title: "Puisi Anak & Deklamasi",
        conceptText: "Puisi anak ditulis dalam bentuk bait dan baris yang indah. Membaca puisi (deklamasi) membutuhkan lafal yang jelas, intonasi berirama, dan ekspresi penghayatan.",
        questions: [
          {
            id: 1,
            question: "Kumpulan dari beberapa baris dalam sebuah puisi disebut...",
            options: ["Bait", "Paragraf", "Bab"],
            correctIndex: 0,
            explanation: "Bait adalah bagian puisi yang terdiri atas beberapa baris kalimat.",
          },
          {
            id: 2,
            question: "Membaca puisi di depan penonton dengan gaya dan penghayatan disebut...",
            options: ["Deklamasi", "Pidato", "Mendongeng"],
            correctIndex: 0,
            explanation: "Deklamasi adalah pembacaan puisi disertai gerak dan penghayatan ekspresi.",
          },
          {
            id: 3,
            question: "Kejelasan bunyi huruf dan kata saat membaca puisi dinamakan...",
            options: ["Lafal", "Intonasi", "Ekspresi"],
            correctIndex: 0,
            explanation: "Lafal adalah cara seseorang mengucapkan bunyi kata dengan jelas.",
          },
          {
            id: 4,
            question: "Tinggi rendahnya nada suara saat membaca puisi dinamakan...",
            options: ["Intonasi", "Lafal", "Tempo"],
            correctIndex: 0,
            explanation: "Intonasi adalah lagu kalimat atau naik-turunnya nada suara.",
          },
          {
            id: 5,
            question: "Raut muka yang sesuai dengan isi perasaan puisi disebut...",
            options: ["Ekspresi (Mimik wajah)", "Lafal", "Volume"],
            correctIndex: 0,
            explanation: "Ekspresi wajah menggambarkan rasa sedih, gembira, atau kagum dalam puisi.",
          },
          {
            id: 6,
            question: "Bila puisi bertemakan 'Ibu yang Penuh Kasih', ekspresi wajah kita sebaiknya...",
            options: ["Hangat, lembut, dan penuh haru", "Marah-marah sambil melotot", "Tertawa terbahak-bahak"],
            correctIndex: 0,
            explanation: "Puisi kasih sayang dibaca dengan kelembutan rasa cinta dan rasa terima kasih.",
          },
          {
            id: 7,
            question: "Dalam bait puisi: 'Bintang kejora bersinar terang / Menemani malam yang tenang.' Kata yang berima sama di akhir adalah...",
            options: ["Terang dan tenang (akhiran -ang)", "Bintang dan malam", "Kejora dan bersinar"],
            correctIndex: 0,
            explanation: "Kata 'terang' dan 'tenang' berima sama berakhiran bunyi '-ang'.",
          },
          {
            id: 8,
            question: "Persamaan bunyi kata di akhir baris puisi disebut...",
            options: ["Rima", "Tema", "Amanat"],
            correctIndex: 0,
            explanation: "Rima adalah pengulangan bunyi akhir yang memberi irama indah pada puisi.",
          },
          {
            id: 9,
            question: "Orang yang menciptakan karya puisi disebut...",
            options: ["Penyair (Penyair)", "Pelukis", "Penyanyi"],
            correctIndex: 0,
            explanation: "Penyair adalah penulis atau pengarang karya sastra puisi.",
          },
          {
            id: 10,
            question: "Makna kata 'mentari' dalam puisi anak 'Mentari tersenyum di pagi hari' adalah...",
            options: ["Matahari", "Bulan", "Bintang"],
            correctIndex: 0,
            explanation: "Mentari adalah kata puitis yang berarti matahari.",
          },
        ],
      };

    case 7:
      return {
        title: "Teks Narasi Pendek (5W1H)",
        conceptText: "Membaca teks cerita anak dan memahami isinya dengan menjawab pertanyaan: Apa (peristiwa), Siapa (tokoh), Di mana (tempat), Kapan (waktu), dan Mengapa (alasan).",
        questions: [
          {
            id: 1,
            question: "Kata tanya 'Siapa' digunakan untuk menanyakan...",
            options: ["Orang atau tokoh cerita", "Waktu kejadian", "Tempat berlangsung"],
            correctIndex: 0,
            explanation: "Kata 'Siapa' digunakan untuk menanyakan pelaku atau orang yang terlibat.",
          },
          {
            id: 2,
            question: "Kata tanya 'Di mana' digunakan untuk menanyakan...",
            options: ["Tempat terjadinya peristiwa", "Alasan tindakan", "Jumlah barang"],
            correctIndex: 0,
            explanation: "Kata 'Di mana' menanyakan lokasi atau tempat kejadian.",
          },
          {
            id: 3,
            question: "Kata tanya 'Kapan' digunakan untuk menanyakan...",
            options: ["Waktu terjadinya peristiwa", "Nama hewan", "Harga tiket"],
            correctIndex: 0,
            explanation: "Kata 'Kapan' menanyakan hari, jam, atau waktu kejadian.",
          },
          {
            id: 4,
            question: "Kata tanya 'Mengapa' digunakan untuk menanyakan...",
            options: ["Sebab atau alasan terjadinya sesuatu", "Benda yang dibawa", "Nama teman"],
            correctIndex: 0,
            explanation: "Kata 'Mengapa' dijawab dengan kata 'karena' untuk menjelaskan sebab/alasan.",
          },
          {
            id: 5,
            question: "Bacalah cerita singkat: 'Pada hari Minggu, Budi dan Ayah bersepeda di taman kota.' Siapakah yang bersepeda?",
            options: ["Budi dan Ayah", "Ibu dan Adik", "Pak Guru"],
            correctIndex: 0,
            explanation: "Tokoh yang bersepeda di cerita adalah Budi dan Ayah.",
          },
          {
            id: 6,
            question: "Dari cerita di atas, di manakah Budi dan Ayah bersepeda?",
            options: ["Di taman kota", "Di dalam kamar", "Di sawah"],
            correctIndex: 0,
            explanation: "Tempat bersepedanya adalah di taman kota.",
          },
          {
            id: 7,
            question: "Kapan Budi dan Ayah bersepeda?",
            options: ["Pada hari Minggu", "Pada malam hari", "Pada hari Rabu"],
            correctIndex: 0,
            explanation: "Waktu kejadian tertulis jelas: pada hari Minggu.",
          },
          {
            id: 8,
            question: "Kata tanya yang tepat untuk melengkapi: '... cara membuat layang-layang ini?' adalah...",
            options: ["Bagaimana", "Siapa", "Di mana"],
            correctIndex: 0,
            explanation: "Kata 'Bagaimana' menanyakan proses atau cara melakukan sesuatu.",
          },
          {
            id: 9,
            question: "Mengapa kita harus membaca teks cerita dengan cermat?",
            options: ["Agar memahami seluruh isi dan pesan cerita", "Supaya cepat mengantuk", "Agar buku cepat rusak"],
            correctIndex: 0,
            explanation: "Membaca dengan cermat membuat kita dapat menjawab pertanyaan dan menyerap nasihat cerita.",
          },
          {
            id: 10,
            question: "Jawaban 'Karena hujan lebat turun' adalah jawaban yang cocok untuk kata tanya...",
            options: ["Mengapa", "Kapan", "Siapa"],
            correctIndex: 0,
            explanation: "Kata 'karena' merupakan jawaban atas pertanyaan alasan 'Mengapa'.",
          },
        ],
      };

    default:
      return {
        title: "Bahasa Indonesia Kelas 2 SD",
        conceptText: "Materi belajar Bahasa Indonesia dasar Kelas 2 SD.",
        questions: [],
      };
  }
}
