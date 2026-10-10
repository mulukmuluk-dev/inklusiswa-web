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

interface PancasilaGrade5GameProps {
  levelId: number;
  onLevelComplete: (levelId: number, starsEarned: number) => void;
  accessibilityMode?: string;
}

export function PancasilaGrade5Game({ levelId, onLevelComplete, accessibilityMode }: PancasilaGrade5GameProps) {
  const [phase, setPhase] = useState<"materi" | "game">("materi");

  // Phase 1 interactive states
  const [activeHistory, setActiveHistory] = useState<{ body: string; date: string; task: string }>({
    body: "BPUPKI",
    date: "1 Maret - 17 Juli 1945",
    task: "Menyelidiki usaha persiapan kemerdekaan dan merumuskan dasar negara Pancasila.",
  });
  const [activeLawHierarchy, setActiveLawHierarchy] = useState<{ tier: string; doc: string; role: string }>({
    tier: "Tingkat 1 Tertinggi",
    doc: "UUD NRI Tahun 1945",
    role: "Hukum dasar tertulis tertinggi yang menjadi induk segala perundang-undangan.",
  });
  const [activeJobDiversity, setActiveJobDiversity] = useState<{ sector: string; role: string; contribution: string }>({
    sector: "Petani & Nelayan",
    role: "Menghasilkan pangan beras, sayur, ikan",
    contribution: "Memastikan kedaulatan pangan bangsa Indonesia.",
  });
  const [activeArchipelago, setActiveArchipelago] = useState<{ concept: string; meaning: string }>({
    concept: "Wawasan Nusantara",
    meaning: "Cara pandang bangsa Indonesia tentang diri dan lingkungannya sebagai satu kesatuan utuh.",
  });

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

  const levelData = getLevelData(levelId);

  useEffect(() => {
    setPhase("materi");
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setWrongAttempts(0);
    setShowClue(false);
    setIsCompleted(false);
    isProcessingRef.current = false;
    setQuestionsList(shuffleQuestions(levelData));
  }, [levelId]);

  const currentQ = questionsList[currentQuestionIndex] || levelData.questions[0];

  const handleStartGameChallenge = () => {
    playPopSound();
    setPhase("game");
    speakGlobal(`Mulai tantangan Level ${levelId}: ${levelData.title}! Kerjakan 10 soal berikut.`);
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
          speakGlobal(`Luar biasa! Kamu menyelesaikan seluruh 10 soal dan meraih ${stars} bintang!`);
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
        setSelectedOption(null);
        setIsAnswerChecked(false);
        isProcessingRef.current = false;
      }, 1200);
    }
  };

  const handleFinishLevel = () => {
    playSuccessFanfare();
    const finalScore = score;
    let stars = 1;
    if (finalScore >= 9) stars = 3;
    else if (finalScore >= 6) stars = 2;
    onLevelComplete(levelId, stars);
  };

  return (
    <div className="w-full flex flex-col items-center justify-between min-h-[560px] p-4 md:p-8 bg-[#FFE296] rounded-[32px] border-4 border-[#3C632A] text-[#3C632A] shadow-[8px_8px_0px_0px_#3C632A] relative overflow-hidden">
      
      {/* TOP BAR / HEADER */}
      <div className="w-full flex items-center justify-between gap-4 pb-4 border-b-2 border-[#3C632A]/20">
        <div className="flex items-center gap-3">
          <span className="bg-[#C3631D] text-[#FFDF59] text-xs md:text-sm font-black px-3 py-1.5 rounded-xl border-2 border-[#3C632A]">
            KELAS 5 SD • LEVEL {levelId} dari 4
          </span>
          <h2 className="text-lg md:text-2xl font-black text-[#3C632A] hidden sm:block">
            {levelData.title}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              playPopSound();
              if (phase === "materi") {
                speakGlobal(`${levelData.title}. ${levelData.conceptText}`);
              } else {
                speakGlobal(`Soal nomor ${currentQuestionIndex + 1}. ${currentQ.question}`);
              }
            }}
            className="px-4 py-2 bg-[#C3631D] hover:bg-[#A95316] text-[#FFDF59] font-black rounded-xl border-2 border-[#3C632A] shadow-[2px_2px_0px_0px_#3C632A] flex items-center gap-1.5 text-xs md:text-sm transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
            Dengar Suara
          </button>

          {phase === "game" && !isCompleted && (
            <button
              type="button"
              onClick={() => {
                playPopSound();
                setPhase("materi");
              }}
              className="px-3 py-2 bg-[#FFDF59] hover:bg-[#FFE885] text-[#3C632A] font-black rounded-xl border-2 border-[#3C632A] text-xs transition-all cursor-pointer"
            >
              Pelajari Materi
            </button>
          )}
        </div>
      </div>

      {/* BODY CONTENT */}
      {phase === "materi" ? (
        /* ================= FASE 1: LABORATORIUM KONSEP MATERI ================= */
        <div className="w-full max-w-2xl flex-1 flex flex-col items-center justify-between p-6 bg-white/80 border-4 border-[#3C632A] rounded-[28px] shadow-[6px_6px_0px_0px_#3C632A] my-4 text-center">
          <div className="w-full flex flex-col items-center">
            <span className="px-4 py-1.5 bg-[#C3631D] text-[#FFDF59] text-xs font-black rounded-full border-2 border-[#3C632A] tracking-wider uppercase mb-3">
              FASE 1: LABORATORIUM KONSEP MATERI
            </span>
            <h3 className="text-2xl md:text-3xl font-black text-[#3C632A] leading-relaxed pt-3">
              {levelData.title}
            </h3>
            <p className="text-sm md:text-base font-bold text-[#3C632A]/90 mt-2 max-w-xl">
              {levelData.conceptText}
            </p>
          </div>

          {/* Interactive Exploration / Visual Box */}
          <div className="w-full my-4 p-4 bg-[#FFDF59]/40 border-2 border-[#3C632A] rounded-2xl flex flex-col items-center">
            {levelId === 1 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Sejarah Kelahiran Pancasila:
                </span>
                <div className="grid grid-cols-2 gap-2 w-full text-xs">
                  {[
                    { body: "BPUPKI", date: "Maret - Juli 1945", task: "Badan Penyelidik yang merumuskan dasar negara dan rancangan UUD." },
                    { body: "PPKI", date: "18 Agustus 1945", task: "Mengesahkan UUD 1945, memilih Presiden Soekarno & Wapres Hatta." },
                  ].map((org) => (
                    <button
                      key={org.body}
                      type="button"
                      onClick={() => {
                        setActiveHistory(org);
                        playPopSound();
                        speakGlobal(`${org.body} (${org.date}): ${org.task}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeHistory.body === org.body ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-xs">{org.body}</strong>
                      <span className="text-[10px] opacity-80">{org.date}</span>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong>{activeHistory.body} ({activeHistory.date}): </strong>{activeHistory.task}
                </div>
              </div>
            )}

            {levelId === 2 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Hierarki Peraturan Perundang-undangan:
                </span>
                <div className="grid grid-cols-3 gap-2 w-full text-xs">
                  {[
                    { tier: "Tingkat 1 Tertinggi", doc: "UUD NRI 1945", role: "Hukum dasar tertulis tertinggi negara." },
                    { tier: "Tingkat 2", doc: "Undang-Undang / Perppu", role: "Aturan hukum yang disahkan DPR bersama Presiden." },
                    { tier: "Tingkat Daerah", doc: "Peraturan Daerah (Perda)", role: "Aturan spesifik tingkat provinsi & kabupaten/kota." },
                  ].map((law) => (
                    <button
                      key={law.doc}
                      type="button"
                      onClick={() => {
                        setActiveLawHierarchy(law);
                        playPopSound();
                        speakGlobal(`${law.tier}: ${law.doc}. ${law.role}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeLawHierarchy.doc === law.doc ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-xs">{law.doc}</strong>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong>{activeLawHierarchy.tier} - {activeLawHierarchy.doc}: </strong>{activeLawHierarchy.role}
                </div>
              </div>
            )}

            {levelId === 3 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Keragaman Mata Pencaharian:
                </span>
                <div className="grid grid-cols-3 gap-2 w-full text-xs">
                  {[
                    { sector: "Petani & Nelayan", role: "Penyedia Pangan Pokok", contribution: "Memenuhi kebutuhan beras, jagung, sayur, dan ikan." },
                    { sector: "Guru & Dokter", role: "Layanan Pendidikan & Kesehatan", contribution: "Mencerdaskan kehidupan bangsa dan merawat orang sakit." },
                    { sector: "Pedagang & Perajin", role: "Distribusi & Seni Kerajinan", contribution: "Menggerakkan perputaran ekonomi dan melestarikan kerajinan lokal." },
                  ].map((job) => (
                    <button
                      key={job.sector}
                      type="button"
                      onClick={() => {
                        setActiveJobDiversity(job);
                        playPopSound();
                        speakGlobal(`Sektor ${job.sector}: ${job.role}. ${job.contribution}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeJobDiversity.sector === job.sector ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-xs">{job.sector}</strong>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong>{activeJobDiversity.sector} ({activeJobDiversity.role}): </strong>{activeJobDiversity.contribution}
                </div>
              </div>
            )}

            {levelId === 4 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Prinsip Persatuan Wawasan Nusantara:
                </span>
                <div className="grid grid-cols-2 gap-2 w-full text-xs">
                  {[
                    { concept: "Satu Kesatuan Politik & Hukum", meaning: "Seluruh wilayah kepulauan tunduk pada satu hukum nasional dan kedaulatan NKRI." },
                    { concept: "Satu Kesatuan Sosial & Budaya", meaning: "Keragaman budaya adalah kekayaan bersama yang mengokohkan identitas bangsa." },
                  ].map((w) => (
                    <button
                      key={w.concept}
                      type="button"
                      onClick={() => {
                        setActiveArchipelago(w);
                        playPopSound();
                        speakGlobal(`${w.concept}: ${w.meaning}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeArchipelago.concept === w.concept ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-xs">{w.concept}</strong>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong>{activeArchipelago.concept}: </strong>{activeArchipelago.meaning}
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
        /* ================= HASIL SELESAI SOAL ================= */
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
              />
            </div>
          </div>

          {/* KARTU SOAL */}
          <div className="w-full bg-[#C3631D] border-4 border-[#3C632A] rounded-[24px] p-6 shadow-[6px_6px_0px_0px_#3C632A] text-[#FFDF59] text-center my-2">
            {currentQ.visualHelper && (
              <span className="inline-block bg-[#FFDF59] text-[#3C632A] px-3 py-1 rounded-full text-xs font-black uppercase mb-3">
                {currentQ.visualHelper}
              </span>
            )}
            <h3 className="text-xl md:text-2xl font-black leading-snug">
              {currentQ.question}
            </h3>
          </div>

          {/* CLUE BANNER */}
          {showClue && (
            <div className="w-full bg-amber-100 border-2 border-[#C3631D] text-[#C3631D] px-4 py-2 rounded-xl text-xs md:text-sm font-bold text-center my-1 animate-in fade-in">
              Petunjuk: {currentQ.explanation}
            </div>
          )}

          {/* PILIHAN JAWABAN */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 my-3">
            {currentQ.options.map((option, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrectOpt = idx === currentQ.correctIndex;

              let btnStyle = "bg-[#FFDF59] text-[#3C632A] hover:bg-[#FFE885] border-[#3C632A]";
              if (isSelected && isAnswerChecked) {
                btnStyle = isCorrectOpt
                  ? "bg-[#7FD13B] text-white border-[#3C632A] ring-4 ring-white animate-bounce"
                  : "bg-[#EE4D2D] text-white border-[#3C632A] animate-shake";
              } else if (showClue && isCorrectOpt) {
                btnStyle = "bg-[#7FD13B] text-white border-[#3C632A] ring-4 ring-[#7FD13B]/60 animate-pulse";
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isAnswerChecked}
                  onClick={() => handleSelectAnswer(idx)}
                  className={`p-4 rounded-2xl border-4 font-black text-base md:text-lg text-left transition-all cursor-pointer shadow-[3px_3px_0px_0px_#3C632A] hover:scale-[1.02] active:scale-98 ${btnStyle}`}
                >
                  <span className="inline-block w-7 h-7 rounded-full bg-white/80 text-[#3C632A] text-center leading-6 text-sm mr-2 border border-[#3C632A]">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function getLevelData(levelId: number): LevelConceptData {
  switch (levelId) {
    case 1:
      return {
        title: "Pancasila dalam Kehidupan Berbangsa",
        conceptText: "Sejarah lahirnya Pancasila melalui sidang BPUPKI dan disahkan secara resmi oleh PPKI pada tanggal 18 Agustus 1945. Nilai-nilai luhur Pancasila tercantum dalam alinea keempat Pembukaan UUD 1945, meliputi nilai ketuhanan, kemanusiaan, persatuan, kerakyatan yang dipimpin oleh hikmat kebijaksanaan, dan keadilan sosial bagi seluruh rakyat Indonesia.",
        questions: [
          {
            id: 1,
            question: "Lembaga yang mengesahkan Pancasila dan UUD 1945 pada tanggal 18 Agustus 1945 adalah...",
            options: ["PPKI (Panitia Persiapan Kemerdekaan Indonesia)", "BPUPKI", "KNIP", "DPR Gotong Royong"],
            correctIndex: 0,
            explanation: "Pada 18 Agustus 1945, PPKI secara resmi mengesahkan UUD 1945 yang di dalamnya termaktub Pancasila."
          },
          {
            id: 2,
            question: "Rumusan sila-sila Pancasila yang sah dan resmi digunakan hingga saat ini tercantum dalam...",
            options: ["Pembukaan UUD 1945 Alinea Keempat", "Piagam Jakarta naskah asli", "Buku Sutasoma", "Teks Proklamasi"],
            correctIndex: 0,
            explanation: "Rumusan sah Pancasila termaktub secara yuridis formal dalam Alinea IV Pembukaan UUD 1945."
          },
          {
            id: 3,
            question: "Pernyataan 'Bahwa sesungguhnya kemerdekaan itu ialah hak segala bangsa...' termaktub dalam Pembukaan UUD 1945 alinea ke-...",
            options: ["Satu", "Dua", "Tiga", "Empat"],
            correctIndex: 0,
            explanation: "Alinea pertama menegaskan hak kemerdekaan bagi segala bangsa dan penjajahan harus dihapuskan."
          },
          {
            id: 4,
            question: "Ketua Panitia Sembilan yang merumuskan Piagam Jakarta pada 22 Juni 1945 adalah...",
            options: ["Ir. Soekarno", "Drs. Mohammad Hatta", "Mr. A.A. Maramis", "K.H. Wachid Hasyim"],
            correctIndex: 0,
            explanation: "Panitia Sembilan diketuai oleh Ir. Soekarno dengan anggota tokoh-tokoh kebangsaan dan Islam."
          },
          {
            id: 5,
            question: "Pengamalan nilai sila keempat dalam kehidupan berbangsa dan bernegara tercermin dari...",
            options: ["Mengedepankan musyawarah untuk mencapai mufakat dalam menyelesaikan permasalahan publik", "Menggunakan kekerasan dalam menuntut keinginan", "Mementingkan kepentingan kelompok sendiri", "Memboikot pemilu secara anarkis"],
            correctIndex: 0,
            explanation: "Sila keempat mengamanatkan kedaulatan rakyat dan pengambilan keputusan melalui musyawarah mufakat."
          },
          {
            id: 6,
            question: "Salah satu butir pengamalan sila kelima dalam kehidupan bermasyarakat adalah...",
            options: ["Menghargai hasil karya orang lain dan tidak bergaya hidup mewah yang berlebihan", "Memamerkan perhiasan mahal di tempat umum", "Menolak membantu warga miskin", "Membeli barang selundupan"],
            correctIndex: 0,
            explanation: "Sila kelima menekankan keadilan sosial, hidup hemat, dan menghargai karya cipta orang lain."
          },
          {
            id: 7,
            question: "Sikap rela berkorban demi persatuan dan kesatuan bangsa merupakan perwujudan dari sila ke-...",
            options: ["Tiga (Persatuan Indonesia)", "Dua", "Empat", "Satu"],
            correctIndex: 0,
            explanation: "Sila ketiga menempatkan kepentingan dan keselamatan bangsa di atas kepentingan pribadi/golongan."
          },
          {
            id: 8,
            question: "Makna yang terkandung dalam prinsip 'Kemanusiaan yang Adil dan Beradab' adalah...",
            options: ["Mengakui persamaan derajat, hak, dan kewajiban asasi setiap manusia tanpa diskriminasi", "Hanya menyayangi orang yang seagama saja", "Mengutamakan kekayaan materi", "Membeda-bedakan kasta sosial"],
            correctIndex: 0,
            explanation: "Nilai kemanusiaan menjunjung tinggi martabat manusia sebagai makhluk ciptaan Tuhan yang sederajat."
          },
          {
            id: 9,
            question: "Siapakah tokoh yang menjabat sebagai ketua BPUPKI selama perumusan dasar negara?",
            options: ["Dr. K.R.T. Radjiman Wedyodiningrat", "Ir. Soekarno", "Drs. Mohammad Hatta", "Ki Bagoes Hadikoesoemo"],
            correctIndex: 0,
            explanation: "Dr. Radjiman Wedyodiningrat memimpin sidang BPUPKI dan mengajukan pertanyaan dasar negara Indonesia."
          },
          {
            id: 10,
            question: "Fungsi utama Pancasila sebagai ideologi terbuka bagi bangsa Indonesia adalah...",
            options: ["Mampu menyesuaikan perkembangan zaman tanpa kehilangan nilai-nilai dasarnya", "Meniru secara mentah seluruh budaya barat", "Mengubah rumusan silanya setiap tahun", "Menutup diri dari kemajuan ilmu teknologi"],
            correctIndex: 0,
            explanation: "Pancasila sebagai ideologi terbuka bersifat dinamis, relevan menghadapi era modern tanpa luntur jati dirinya."
          }
        ]
      };

    case 2:
      return {
        title: "Kepatuhan terhadap Norma & Hukum",
        conceptText: "Hukum diciptakan untuk menciptakan ketertiban, keadilan, dan perlindungan bagi seluruh warga negara. Dalam tata urutan perundang-undangan di Indonesia, UUD 1945 menduduki tingkatan tertinggi. Kepatuhan terhadap aturan hukum tercermin dalam tertib berlalu lintas, menjaga sarana publik, dan menaati peraturan di tempat umum.",
        questions: [
          {
            id: 1,
            question: "Peraturan perundang-undangan tertinggi dalam sistem hierarki hukum di Negara Republik Indonesia adalah...",
            options: ["Undang-Undang Dasar (UUD) 1945", "Peraturan Pemerintah (PP)", "Peraturan Daerah (Perda)", "Peraturan Desa"],
            correctIndex: 0,
            explanation: "Menurut UU No. 12 Tahun 2011, UUD 1945 berada di urutan teratas dalam hierarki peraturan perundang-undangan."
          },
          {
            id: 2,
            question: "Lembaga negara pembuat undang-undang (legislatif) di tingkat pusat yang beranggotakan wakil rakyat adalah...",
            options: ["Dewan Perwakilan Rakyat (DPR) bersama Presiden", "Mahkamah Agung", "Komisi Pemberantasan Korupsi", "Kepolisian Negara RI"],
            correctIndex: 0,
            explanation: "DPR memegang kekuasaan membentuk UU yang kemudian dibahas dan disetujui bersama Presiden."
          },
          {
            id: 3,
            question: "Kewajiban pengendara sepeda motor saat berkendara di jalan raya demi keselamatan hukum adalah...",
            options: ["Memakai helm standar (SNI) dan memiliki Surat Izin Mengemudi (SIM)", "Menggunakan sandal jepit tanpa helm", "Mengendarai motor di trotoar pejalan kaki", "Memasang knalpot bising yang memekakkan telinga"],
            correctIndex: 0,
            explanation: "Tertib berlalu lintas dengan helm SNI dan SIM menjamin keselamatan diri dan kepatuhan hukum berkendara."
          },
          {
            id: 4,
            question: "Jalur di pinggir jalan raya yang dikhususkan bagi pejalan kaki disebut...",
            options: ["Trotoar", "Jalur Busway", "Bahu jalan tol", "Garis kejut"],
            correctIndex: 0,
            explanation: "Trotoar adalah hak pejalan kaki dan tidak boleh digunakan pedagang liar atau pengendara motor."
          },
          {
            id: 5,
            question: "Sanksi nyata yang diberikan oleh polisi lalu lintas kepada pengendara yang menerobos lampu merah adalah...",
            options: ["Surat tilang dan denda hukum", "Pujian dan hadiah uang", "Diminta berfoto bersama", "Hukuman membersihkan pantai"],
            correctIndex: 0,
            explanation: "Penilangan adalah sanksi hukum nyata atas pelanggaran rambu demi tegaknya disiplin berkendara."
          },
          {
            id: 6,
            question: "Perilaku merusak atau mencoret fasilitas umum seperti halte, jembatan, atau taman kota disebut perbuatan...",
            options: ["Vandalisme yang melanggar hukum", "Apresiasi seni lukis", "Gotong royong publik", "Kreativitas modern"],
            correctIndex: 0,
            explanation: "Vandalisme merusak fasilitas umum dan merupakan tindakan melawan hukum yang merugikan masyarakat."
          },
          {
            id: 7,
            question: "Tujuan utama ditegakkannya hukum yang tegas tanpa pandang bulu di suatu negara adalah mewujudkan...",
            options: ["Keadilan, ketertiban, dan kepastian hukum", "Ketakutan berlebihan bagi rakyat miskin", "Kekuasaan mutlak bagi para pejabat", "Kehancuran perekonomian"],
            correctIndex: 0,
            explanation: "Tujuan hukum adalah menjamin keadilan, ketertiban umum, dan melindungi hak-hak setiap warga negara."
          },
          {
            id: 8,
            question: "Tempat penyeberangan jalan yang ditandai dengan garis-garis putih di atas aspal disebut...",
            options: ["Zebra cross", "Garis batas aman", "Jembatan layang", "Garis start balapan"],
            correctIndex: 0,
            explanation: "Zebra cross adalah marka penyeberangan jalan bagi pejalan kaki yang wajib dihormati pengendara."
          },
          {
            id: 9,
            question: "Sikap kita saat melihat rambu dilarang membuang sampah di area sungai adalah...",
            options: ["Menyimpan sampah tersebut hingga menemukan tempat sampah yang semestinya", "Membuangnya ke sungai saat tidak ada orang yang melihat", "Membakar rambu larangan tersebut", "Menimbun sampah di tepi sungai"],
            correctIndex: 0,
            explanation: "Menjaga kebersihan sungai mencegah pencemaran air dan bahaya bencana banjir bagi warga sekitar."
          },
          {
            id: 10,
            question: "Pernyataan yang tepat tentang kesadaran hukum sejak usia sekolah adalah...",
            options: ["Disiplin menaati peraturan sekolah melatih kita menjadi warga negara yang patuh hukum", "Hukum hanya perlu dipelajari saat sudah dewasa", "Aturan sekolah tidak ada kaitannya dengan hukum negara", "Boleh melanggar aturan bila tidak diketahui guru"],
            correctIndex: 0,
            explanation: "Kedisiplinan di sekolah adalah fondasi utama membentuk karakter warga negara yang sadar dan taat hukum."
          }
        ]
      };

    case 3:
      return {
        title: "Menghargai Keragaman Karakteristik Individu",
        conceptText: "Masyarakat Indonesia majemuk dalam hal mata pencaharian, tingkat ekonomi, latar belakang sosial, dan budaya antardaerah. Setiap profesi saling melengkapi kebutuhan hidup kita. Menghargai perbedaan karakteristik individu dan menjunjung tinggi toleransi dapat mencegah konflik antarkelompok.",
        questions: [
          {
            id: 1,
            question: "Profesi petani, nelayan, peternak, guru, dan pedagang saling membutuhkan karena...",
            options: ["Tidak ada manusia yang dapat memenuhi seluruh kebutuhan hidupnya sendirian", "Semua orang memiliki keahlian yang persis sama", "Mereka tinggal di rumah yang sama", "Pemerintah melarang orang bekerja mandiri"],
            correctIndex: 0,
            explanation: "Manusia adalah makhluk sosial yang saling bergantung dalam rantai pemenuhan kebutuhan pangan, sandang, dan jasa."
          },
          {
            id: 2,
            question: "Sikap yang tepat terhadap teman yang orang tuanya bekerja sebagai petugas kebersihan lingkungan adalah...",
            options: ["Menghormati profesinya karena pekerjaannya sangat mulia dan berjasa bagi masyarakat", "Mengejek pekerjaan orang tuanya", "Menjauhi dan menolak bermain dengannya", "Menyuruhnya membersihkan rumah kita"],
            correctIndex: 0,
            explanation: "Semua profesi halal yang melayani masyarakat patut dihormati dan tidak boleh dipandang rendah."
          },
          {
            id: 3,
            question: "Penyebab utama timbulnya perselisihan atau konflik antarkelompok dalam masyarakat majemuk adalah...",
            options: ["Kurangnya rasa toleransi dan sikap memaksakan kehendak", "Saling tolong menolong saat terkena musibah", "Mengikuti kegiatan kerja bakti bersama", "Saling mengunjungi saat hari raya"],
            correctIndex: 0,
            explanation: "Prasangka buruk, sikap egois, dan intoleransi adalah pemicu utama keretakan kerukunan sosial."
          },
          {
            id: 4,
            question: "Cara efektif meredakan perselisihan paham antara dua kelompok siswa di sekolah adalah...",
            options: ["Mengadakan musyawarah damai dan saling memaafkan dengan mediasi guru", "Menantang duel adu fisik setelah pulang sekolah", "Mengumpulkan kelompok untuk tawuran", "Membakar barang milik lawan"],
            correctIndex: 0,
            explanation: "Mediasi guru dan musyawarah damai mengembalikan keharmonisan serta persahabatan antarmurid."
          },
          {
            id: 5,
            question: "Mata pencaharian masyarakat yang tinggal di wilayah pesisir pantai sebagian besar adalah sebagai...",
            options: ["Nelayan dan petani tambak garam/udang", "Petani sayur teh di pegunungan", "Penebang kayu hutan", "Penambang batu bara"],
            correctIndex: 0,
            explanation: "Kondisi geografis pesisir pantai mendukung kegiatan melaut dan budidaya perikanan laut/tambak."
          },
          {
            id: 6,
            question: "Sikap kita ketika teman kita memiliki kemampuan belajar yang lebih lambat di kelas adalah...",
            options: ["Membantunya belajar dengan sabar tanpa meremehkannya", "Menertawakan saat ia salah menjawab", "Memintanya pindah sekolah", "Mengabaikannya"],
            correctIndex: 0,
            explanation: "Empati dan kesediaan menjadi tutor sebaya mencerminkan kepedulian yang inklusif dan terpuji."
          },
          {
            id: 7,
            question: "Keberagaman status sosial dan ekonomi antarkeluarga di lingkungan rukun warga hendaknya diimbangi dengan...",
            options: ["Semangat gotong royong dan saling tolong-menolong tanpa membeda-bedakan", "Pemisahan pergaulan antara keluarga kaya dan miskin", "Persaingan pamer kekayaan rumah", "Menghina tetangga kurang mampu"],
            correctIndex: 0,
            explanation: "Kekeluargaan dan gotong royong menyatukan warga tanpa memandang status ekonomi."
          },
          {
            id: 8,
            question: "Sikap etnosentrisme yang berlebihan, yaitu menganggap sukunya sendiri paling unggul dan suku lain rendah, berdampak buruk karena...",
            options: ["Memecah belah persatuan dan memicu pertikaian antarsuku", "Memajukan ekonomi nasional", "Menambah teman dari berbagai pulau", "Mengharumkan nama bangsa di dunia"],
            correctIndex: 0,
            explanation: "Etnosentrisme sempit mengancam Bhinneka Tunggal Ika dan memicu permusuhan horizontal."
          },
          {
            id: 9,
            question: "Penyelesaian terbaik atas sengketa batas tanah antarwarga di desa menurut adat musyawarah adalah...",
            options: ["Musyawarah mufakat difasilitasi oleh kepala desa dan tokoh adat", "Baku hantam di balai desa", "Membawa senjata tajam", "Merusak pagar tetangga"],
            correctIndex: 0,
            explanation: "Musyawarah kekeluargaan dengan tokoh desa menghasilkan solusi adil yang menjaga tali silaturahmi."
          },
          {
            id: 10,
            question: "Prinsip utama dalam pergaulan di sekolah yang menghargai keragaman adalah...",
            options: ["Semua murid memiliki hak yang sama untuk dihargai, belajar, dan berkembang", "Murid paling kaya berhak mengatur murid lainnya", "Murid berprestasi boleh merendahkan teman lain", "Murid baru harus menuruti seluruh perintah senior"],
            correctIndex: 0,
            explanation: "Kesetaraan hak dan saling menghargai adalah pondasi lingkungan sekolah yang ramah anak."
          }
        ]
      };

    case 4:
      return {
        title: "Persatuan dan Kesatuan Bangsa",
        conceptText: "Wawasan Nusantara mengajarkan bahwa seluruh kepulauan Indonesia adalah satu kesatuan wilayah, politik, ekonomi, sosial budaya, serta pertahanan dan keamanan. Generasi muda memiliki peran penting dalam menjaga persatuan NKRI dengan aktif dalam kegiatan gotong royong di tingkat kecamatan dan kabupaten.",
        questions: [
          {
            id: 1,
            question: "Cara pandang bangsa Indonesia tentang diri dan tanah airnya sebagai satu kesatuan yang utuh dinamakan...",
            options: ["Wawasan Nusantara", "Politik Luar Negeri", "Globalisasi", "Wawasan Global"],
            correctIndex: 0,
            explanation: "Wawasan Nusantara adalah cara pandang geopolitik Indonesia yang melihat darat, laut, udara sebagai satu kesatuan utuh NKRI."
          },
          {
            id: 2,
            question: "Peristiwa sejarah pada tanggal 28 Oktober 1928 yang menyatukan pemuda seluruh nusantara dalam satu nusa, bangsa, dan bahasa adalah...",
            options: ["Sumpah Pemuda", "Proklamasi Kemerdekaan", "Hari Pahlawan", "Kebangkitan Nasional"],
            correctIndex: 0,
            explanation: "Kongres Pemuda II melahirkan ikrar Sumpah Pemuda yang menjadi tonggak utama persatuan Indonesia."
          },
          {
            id: 3,
            question: "Arti dari semboyan persatuan 'Bersatu kita teguh, bercerai kita runtuh' adalah...",
            options: ["Persatuan melipatgandakan kekuatan, sedangkan perpecahan membawa kehancuran", "Bangunan rumah harus dibangun kokoh", "Kita tidak boleh berpisah dari kelompok saat piknik", "Lebih baik berjalan sendiri-sendiri"],
            correctIndex: 0,
            explanation: "Semboyan ini menegaskan pentingnya solidaritas dan persatuan dalam menghadapi segala ancaman dan tantangan."
          },
          {
            id: 4,
            question: "Contoh peran aktif generasi muda dan pelajar dalam menjaga keutuhan NKRI adalah...",
            options: ["Giat belajar, mencintai kebudayaan nusantara, dan menolak berita hoaks pemecah belah", "Ikut serta dalam aksi tawuran antarsekolah", "Menyebarkan ujaran kebencian di media sosial", "Memusuhi teman yang berbeda agama"],
            correctIndex: 0,
            explanation: "Pelajar menjaga persatuan dengan prestasi, literasi bijak, dan menolak provokasi ujaran kebencian."
          },
          {
            id: 5,
            question: "Kegiatan gotong royong di tingkat kecamatan atau kabupaten seperti penanaman pohon penghijauan bermanfaat untuk...",
            options: ["Mencegah bencana tanah longsor dan mempererat silaturahmi warga", "Menghabiskan anggaran daerah tanpa guna", "Merusak keindahan jalan raya", "Membuat lalu lintas macet"],
            correctIndex: 0,
            explanation: "Penghijauan menjaga kelestarian alam dan menumbuhkan kepedulian lingkungan secara lintas desa."
          },
          {
            id: 6,
            question: "Perwujudan kepulauan nusantara sebagai satu kesatuan ekonomi mengandung arti bahwa...",
            options: ["Kekayaan wilayah nusantara adalah modal dan milik bersama seluruh bangsa Indonesia", "Hasil bumi hanya boleh dinikmati oleh penduduk pulau penghasil saja", "Pulau miskin dibiarkan menderita kelaparan", "Barang dari daerah lain dilarang masuk"],
            correctIndex: 0,
            explanation: "Kesatuan ekonomi menjamin pemerataan kemakmuran dan kebutuhan pangan bagi seluruh rakyat Indonesia."
          },
          {
            id: 7,
            question: "Ketika salah satu daerah di Indonesia tertimpa musibah gempa bumi atau letusan gunung berapi, sikap warga dari daerah lain adalah...",
            options: ["Segera mengirimkan bantuan kemanusiaan dan doa karena kita satu bangsa", "Bersyukur karena musibah tidak menimpa daerah kita", "Mengunggah foto korban untuk mengejek", "Menutup akses bantuan masuk"],
            correctIndex: 0,
            explanation: "Rasa senasib sepenanggungan adalah bukti nyata persatuan dan solidaritas kebangsaan."
          },
          {
            id: 8,
            question: "Ancaman yang paling berbahaya terhadap keutuhan NKRI yang berasal dari dalam negeri sendiri adalah...",
            options: ["Gerakan separatisme dan politik adu domba berbasis SARA", "Bencana cuaca hujan lebat", "Perbedaan menu makanan antardaerah", "Banyaknya bahasa daerah"],
            correctIndex: 0,
            explanation: "Isu SARA (Suku, Agama, Ras, Antargolongan) yang dipolitisasi dapat menyulut perpecahan jika tidak diantisipasi."
          },
          {
            id: 9,
            question: "Peran TNI dan POLRI dalam mempertahankan keutuhan Negara Kesatuan Republik Indonesia adalah sebagai...",
            options: ["Garda terdepan pertahanan negara dan pemelihara keamanan serta ketertiban masyarakat", "Pengelola usaha swasta", "Penyelenggara pesta rakyat", "Pengumpul pajak daerah"],
            correctIndex: 0,
            explanation: "TNI menjaga kedaulatan wilayah negara, sedangkan POLRI memelihara keamanan dan ketertiban masyarakat."
          },
          {
            id: 10,
            question: "Bentuk gotong royong antarwarga lintas agama yang sering dijumpai di Indonesia saat perayaan hari besar adalah...",
            options: ["Pemuda lintas agama ikut menjaga keamanan dan ketertiban di sekitar tempat ibadah", "Melarang perayaan agama lain berlangsung", "Membunyikan petasan di depan gerbang tempat ibadah", "Menutup jalan agar ibadah dibatalkan"],
            correctIndex: 0,
            explanation: "Partisipasi pengamanan perayaan hari raya keagamaan oleh umat agama lain adalah simbol kerukunan khas Indonesia."
          }
        ]
      };

    default:
      return {
        title: "Konsep Dasar Pancasila",
        conceptText: "Pendidikan Pancasila membentuk anak berbudi pekerti luhur, taat aturan, dan cinta tanah air.",
        questions: []
      };
  }
}
