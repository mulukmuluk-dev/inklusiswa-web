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

interface PancasilaGrade4GameProps {
  levelId: number;
  onLevelComplete: (levelId: number, starsEarned: number) => void;
  accessibilityMode?: string;
}

export function PancasilaGrade4Game({ levelId, onLevelComplete, accessibilityMode }: PancasilaGrade4GameProps) {
  const [phase, setPhase] = useState<"materi" | "game">("materi");

  // Phase 1 interactive states
  const [activeLeader, setActiveLeader] = useState<{ figure: string; role: string }>({
    figure: "Ir. Soekarno",
    role: "Menyampaikan pidato 'Lahirnya Pancasila' pada 1 Juni 1945 di sidang BPUPKI.",
  });
  const [activeNorm, setActiveNorm] = useState<{ name: string; source: string; sanction: string }>({
    name: "Norma Agama",
    source: "Wahyu dari Tuhan Yang Maha Esa",
    sanction: "Mendapat dosa dan sanksi di akhirat kelak.",
  });
  const [activeTolerance, setActiveTolerance] = useState<{ topic: string; action: string }>({
    topic: "Toleransi Agama",
    action: "Menghormati teman yang sedang beribadah atau berpuasa tanpa mengganggunya.",
  });
  const [activeRegion, setActiveRegion] = useState<{ level: string; leader: string; area: string }>({
    level: "Kabupaten / Kota",
    leader: "Bupati / Wali Kota",
    area: "Membawahi puluhan kecamatan dalam satu wilayah otonom.",
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
            KELAS 4 SD • LEVEL {levelId} dari 4
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
                  Tokoh Perumus Dasar Negara:
                </span>
                <div className="grid grid-cols-3 gap-2 w-full text-xs">
                  {[
                    { figure: "Ir. Soekarno", role: "Menyampaikan 5 asas dasar negara pada 1 Juni 1945 dan menamakannya Pancasila." },
                    { figure: "Prof. Mohammad Yamin", role: "Mengusulkan 5 asas dasar kebangsaan pada 29 Mei 1945 secara lisan dan tulisan." },
                    { figure: "Prof. Dr. Soepomo", role: "Mengusulkan konsep negara integralistik dan persatuan pada 31 Mei 1945." },
                  ].map((tokoh) => (
                    <button
                      key={tokoh.figure}
                      type="button"
                      onClick={() => {
                        setActiveLeader(tokoh);
                        playPopSound();
                        speakGlobal(`${tokoh.figure}: ${tokoh.role}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeLeader.figure === tokoh.figure ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-xs">{tokoh.figure}</strong>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong>{activeLeader.figure}: </strong>{activeLeader.role}
                </div>
              </div>
            )}

            {levelId === 2 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Empat Jenis Norma dalam Kehidupan:
                </span>
                <div className="grid grid-cols-4 gap-1.5 w-full text-xs">
                  {[
                    { name: "Norma Agama", source: "Wahyu Tuhan", sanction: "Dosa dan sanksi akhirat." },
                    { name: "Kesusilaan", source: "Hati Nurani", sanction: "Rasa bersalah & penyesalan." },
                    { name: "Kesopanan", source: "Kebiasaan Warga", sanction: "Dicela & dikucilkan." },
                    { name: "Hukum", source: "Pemerintah / Negara", sanction: "Denda atau kurungan penjara." },
                  ].map((norma) => (
                    <button
                      key={norma.name}
                      type="button"
                      onClick={() => {
                        setActiveNorm(norma);
                        playPopSound();
                        speakGlobal(`${norma.name} bersumber dari ${norma.source}. Sanksinya: ${norma.sanction}`);
                      }}
                      className={`p-2 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeNorm.name === norma.name ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-[11px]">{norma.name}</strong>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong>{activeNorm.name} (Sumber: {activeNorm.source}): </strong>Sanksi: {activeNorm.sanction}
                </div>
              </div>
            )}

            {levelId === 3 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Sikap Toleransi dan Mencegah Diskriminasi:
                </span>
                <div className="grid grid-cols-3 gap-2 w-full text-xs">
                  {[
                    { topic: "Toleransi Beragama", action: "Menghormati teman yang sedang beribadah tanpa mengganggu atau gaduh." },
                    { topic: "Cegah Diskriminasi", action: "Berteman dengan siapa saja tanpa memandang warna kulit, asal suku, atau kekayaan." },
                    { topic: "Rukun Budaya", action: "Saling belajar kesenian daerah lain dan menghormati dialek bahasa teman." },
                  ].map((t) => (
                    <button
                      key={t.topic}
                      type="button"
                      onClick={() => {
                        setActiveTolerance(t);
                        playPopSound();
                        speakGlobal(`${t.topic}: ${t.action}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeTolerance.topic === t.topic ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-xs">{t.topic}</strong>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong>{activeTolerance.topic}: </strong>{activeTolerance.action}
                </div>
              </div>
            )}

            {levelId === 4 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Jenjang Wilayah NKRI:
                </span>
                <div className="grid grid-cols-3 gap-2 w-full text-xs">
                  {[
                    { level: "Kabupaten", leader: "Bupati", area: "Wilayah administratif tingkat II yang terdiri atas pedesaan & kecamatan." },
                    { level: "Kota", leader: "Wali Kota", area: "Pusat perkotaan yang fokus pada industri dan jasa perdagangan." },
                    { level: "Provinsi", leader: "Gubernur", area: "Membawahi gabungan beberapa kabupaten dan kota di wilayahnya." },
                  ].map((reg) => (
                    <button
                      key={reg.level}
                      type="button"
                      onClick={() => {
                        setActiveRegion(reg);
                        playPopSound();
                        speakGlobal(`Wilayah ${reg.level} dipimpin oleh ${reg.leader}. ${reg.area}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeRegion.level === reg.level ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-xs">{reg.level}</strong>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong>{activeRegion.level} ({activeRegion.leader}): </strong>{activeRegion.area}
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
        title: "Pancasila sebagai Pedoman Hidup",
        conceptText: "Pancasila dirumuskan oleh para pendiri bangsa dalam sidang BPUPKI tahun 1945. Tokoh yang mengusulkan rumusan dasar negara antara lain Mohammad Yamin, Soepomo, dan Ir. Soekarno. Dalam kehidupan sehari-hari, Pancasila menjadi pedoman bertingkah laku dan menyelesaikan masalah melalui musyawarah untuk mencapai mufakat.",
        questions: [
          {
            id: 1,
            question: "Lembaga bentukan yang bertugas mempersiapkan kemerdekaan dan merumuskan dasar negara Indonesia adalah...",
            options: ["BPUPKI (Badan Penyelidik Usaha-Usaha Persiapan Kemerdekaan Indonesia)", "DPR RI", "Komisi Pemilihan Umum", "Organisasi Budi Utomo"],
            correctIndex: 0,
            explanation: "BPUPKI dibentuk untuk menyelidiki dan menyiapkan hal-hal penting menjelang kemerdekaan termasuk dasar negara."
          },
          {
            id: 2,
            question: "Ir. Soekarno menyampaikan pidato rumusan lima dasar negara yang dinamai 'Pancasila' pada tanggal...",
            options: ["1 Juni 1945", "17 Agustus 1945", "28 Oktober 1928", "2 Mei 1908"],
            correctIndex: 0,
            explanation: "Tanggal 1 Juni diperingati sebagai Hari Lahir Pancasila berdasarkan pidato Ir. Soekarno di sidang BPUPKI."
          },
          {
            id: 3,
            question: "Pancasila berfungsi sebagai pandangan hidup bangsa Indonesia, artinya Pancasila...",
            options: ["Menjadi petunjuk arah dalam bersikap dan bertingkah laku sehari-hari", "Hanya dibaca saat upacara bendera", "Buku hiasan di perpustakaan", "Hanya berlaku untuk presiden dan menteri"],
            correctIndex: 0,
            explanation: "Sebagai pedoman hidup, seluruh sikap dan keputusan warga negara harus berlandaskan nilai-nilai Pancasila."
          },
          {
            id: 4,
            question: "Cara terbaik menyelesaikan perbedaan pendapat di kelas saat memilih ketua kelas adalah...",
            options: ["Musyawarah mufakat atau pemungutan suara secara damai", "Berkelahi adu kekuatan", "Memaksa teman memilih sahabat kita", "Mogok belajar bersama"],
            correctIndex: 0,
            explanation: "Sila keempat mengajarkan musyawarah mufakat secara kekeluargaan untuk mengambil keputusan bersama."
          },
          {
            id: 5,
            question: "Sikap yang wajib kita tunjukkan ketika keputusan musyawarah telah disepakati bersama adalah...",
            options: ["Menerima dan melaksanakan hasil keputusan dengan ikhlas dan tanggung jawab", "Menolak keputusan jika usulan kita tidak terpilih", "Mengabaikan hasil musyawarah", "Mencela teman yang memimpin rapat"],
            correctIndex: 0,
            explanation: "Keputusan bersama mengikat seluruh peserta musyawarah untuk dijalankan secara bertanggung jawab."
          },
          {
            id: 6,
            question: "Tokoh bangsa yang mengusulkan lima dasar negara pada hari pertama sidang BPUPKI tanggal 29 Mei 1945 adalah...",
            options: ["Prof. Mohammad Yamin", "Ir. Soekarno", "Drs. Mohammad Hatta", "Ki Hajar Dewantara"],
            correctIndex: 0,
            explanation: "Mohammad Yamin mengusulkan lima asas dasar negara secara lisan dan tertulis pada 29 Mei 1945."
          },
          {
            id: 7,
            question: "Penerapan nilai sila pertama Pancasila dalam pergaulan antarteman yang berbeda keyakinan adalah...",
            options: ["Memberikan kesempatan kepada teman untuk beribadah tepat waktu", "Memaksa teman memeluk agama kita", "Mengajak teman makan siang saat sedang berpuasa", "Melarang teman berdoa"],
            correctIndex: 0,
            explanation: "Menghormati hak ibadah teman adalah wujud pengamalan nilai Ketuhanan Yang Maha Esa."
          },
          {
            id: 8,
            question: "Contoh perilaku yang mencerminkan sila kedua 'Kemanusiaan yang Adil dan Beradab' di sekolah adalah...",
            options: ["Menjenguk dan mendoakan teman yang sedang sakit", "Mengejek kekurangan fisik teman", "Memusuhi teman yang mendapat nilai jelek", "Bersikap curang saat ujian"],
            correctIndex: 0,
            explanation: "Menjenguk teman yang tertimpa musibah/sakit mencerminkan rasa kemanusiaan dan empati luhur."
          },
          {
            id: 9,
            question: "Sikap mengutamakan kepentingan bersama di atas kepentingan pribadi mencerminkan nilai sila ke-...",
            options: ["Tiga (Persatuan Indonesia)", "Satu", "Dua", "Lima"],
            correctIndex: 0,
            explanation: "Rela berkorban demi persatuan dan bangsa adalah butir penting dalam pengamalan sila ke-3."
          },
          {
            id: 10,
            question: "Mengapa para perumus dasar negara bersedia mengubah kalimat pada sila pertama Piagam Jakarta demi persatuan bangsa?",
            options: ["Karena mereka memiliki jiwa toleransi dan mengutamakan keutuhan bangsa", "Karena dipaksa oleh pihak penjajah", "Karena tidak peduli pada isi kalimat", "Karena terburu-buru pulang"],
            correctIndex: 0,
            explanation: "Para pendiri bangsa berjiwa besar mengubah kalimat sila pertama agar seluruh rakyat Indonesia timur tetap bersatu."
          }
        ]
      };

    case 2:
      return {
        title: "Norma dan Konstitusi",
        conceptText: "Norma adalah kaidah atau pedoman bertingkah laku dalam masyarakat. Terdapat empat jenis norma: norma agama, kesusilaan, kesopanan, dan hukum. Konstitusi dasar negara kita adalah Undang-Undang Dasar (UUD) 1945 yang mengatur kehidupan bernegara serta menjamin hak dan kewajiban warga negara.",
        questions: [
          {
            id: 1,
            question: "Pedoman atau peraturan hidup yang mengikat dan memandu tingkah laku manusia di masyarakat disebut...",
            options: ["Norma", "Saran", "Khayalan", "Pikiran"],
            correctIndex: 0,
            explanation: "Norma adalah aturan atau kaidah hidup yang berlaku di masyarakat untuk mewujudkan ketertiban."
          },
          {
            id: 2,
            question: "Norma yang bersumber dari wahyu Tuhan Yang Maha Esa dan sanksinya berupa dosa adalah...",
            options: ["Norma Agama", "Norma Hukum", "Norma Kesopanan", "Norma Kesusilaan"],
            correctIndex: 0,
            explanation: "Norma agama memuat perintah dan larangan dari kitab suci yang bersumber langsung dari Tuhan."
          },
          {
            id: 3,
            question: "Rasa bersalah, menyesal, dan gelisah di dalam hati setelah berbohong kepada orang tua timbul karena melanggar...",
            options: ["Norma Kesusilaan", "Norma Hukum", "Norma Kebiasaan", "Peraturan Jalan Raya"],
            correctIndex: 0,
            explanation: "Norma kesusilaan bersumber dari hati nurani manusia yang membedakan perbuatan baik dan buruk."
          },
          {
            id: 4,
            question: "Contoh penerapan norma kesopanan yang baik saat berbicara dengan guru atau orang tua adalah...",
            options: ["Berbicara santun dengan nada lembut dan sikap hormat", "Membentak dan menyela pembicaraan", "Berbicara sambil membelakangi guru", "Menggunakan kata-kata kasar"],
            correctIndex: 0,
            explanation: "Norma kesopanan lahir dari tata krama adat dan pergaulan santun dalam kehidupan bermasyarakat."
          },
          {
            id: 5,
            question: "Ciri khas norma hukum yang membedakannya secara tegas dari norma lainnya adalah memiliki sifat...",
            options: ["Tegas, mengikat, dan sanksinya dipaksakan oleh aparat negara", "Boleh ditaati boleh dilanggar", "Hanya berupa teguran lisan di hati", "Tidak memiliki sanksi apapun"],
            correctIndex: 0,
            explanation: "Norma hukum dibuat oleh negara dan memiliki sanksi nyata seperti denda, kurungan, atau penjara."
          },
          {
            id: 6,
            question: "Konstitusi tertulis tertinggi yang menjadi pedoman dasar hukum negara Indonesia adalah...",
            options: ["Undang-Undang Dasar (UUD) Negara Republik Indonesia Tahun 1945", "Peraturan RT / RW", "Buku tata tertib sekolah", "Buku harian presiden"],
            correctIndex: 0,
            explanation: "UUD 1945 adalah hukum dasar tertulis tertinggi di Indonesia yang disahkan pada 18 Agustus 1945."
          },
          {
            id: 7,
            question: "Seorang pengendara motor yang menerobos lampu merah melanggar norma...",
            options: ["Norma Hukum", "Norma Kesusilaan", "Norma Adat", "Norma Budi Pekerti"],
            correctIndex: 0,
            explanation: "Lampu lalu lintas adalah aturan hukum negara yang wajib ditaati demi keselamatan berkendara."
          },
          {
            id: 8,
            question: "Hak setiap siswa di lingkungan sekolah antara lain adalah...",
            options: ["Mendapatkan bimbingan ilmu dan perlakuan adil dari guru", "Bebas merusak bangku kelas", "Datang terlambat ke sekolah setiap hari", "Mengejek murid baru"],
            correctIndex: 0,
            explanation: "Setiap murid berhak atas pengajaran bermutu, bimbingan guru, dan perlindungan keamanan di sekolah."
          },
          {
            id: 9,
            question: "Kewajiban utama warga sekolah untuk menjaga ketertiban suasana belajar adalah...",
            options: ["Mematuhi tata tertib sekolah dan memakai seragam rapi", "Menyalakan radio dengan keras di lorong", "Bermain bola di dalam ruang guru", "Membuang sampah ke kolong meja"],
            correctIndex: 0,
            explanation: "Mematuhi tata tertib adalah kewajiban seluruh siswa demi ketertiban kegiatan belajar mengajar."
          },
          {
            id: 10,
            question: "Tujuan utama diterapkannya norma dan aturan dalam kehidupan masyarakat adalah untuk menciptakan...",
            options: ["Ketertiban, keadilan, dan kedamaian hidup bersama", "Kecemasan bagi rakyat miskin", "Pertengkaran antartetangga", "Kebebasan tanpa batas"],
            correctIndex: 0,
            explanation: "Tanpa norma, masyarakat akan kacau balau; norma menjamin keamanan, hak setiap orang, dan keadilan."
          }
        ]
      };

    case 3:
      return {
        title: "Keberagaman Budaya Indonesia",
        conceptText: "Keberagaman sosial budaya di Indonesia dipengaruhi oleh letak geografis strategis, kondisi kepulauan, dan sejarah persinggahan budaya dunia. Sikap toleransi antarumat beragama dan saling menghormati antarsuku sangat penting untuk mencegah diskriminasi dan perundungan dalam pergaulan sehari-hari.",
        questions: [
          {
            id: 1,
            question: "Faktor alamiah yang menyebabkan lahirnya ribuan suku bangsa yang unik dan beragam di Indonesia adalah...",
            options: ["Bentuk wilayah Indonesia yang terdiri atas ribuan pulau terpisah", "Indonesia hanya memiliki satu pulau besar", "Semua wilayah Indonesia memiliki iklim salju", "Bangsa Indonesia tidak pernah berpindah"],
            correctIndex: 0,
            explanation: "Kondisi geografis kepulauan membuat tiap kelompok masyarakat mengembangkan budaya khas masing-masing."
          },
          {
            id: 2,
            question: "Perilaku membeda-bedakan perlakuan terhadap seseorang berdasarkan suku, agama, atau warna kulit disebut...",
            options: ["Diskriminasi", "Toleransi", "Gotong royong", "Asimilasi"],
            correctIndex: 0,
            explanation: "Diskriminasi adalah perlakuan tidak adil yang dilarang karena merusak persatuan dan hak asasi manusia."
          },
          {
            id: 3,
            question: "Enam agama resmi yang diakui di Indonesia adalah Islam, Kristen Protestan, Katolik, Hindu, Buddha, dan...",
            options: ["Khonghucu", "Shinto", "Taoisme", "Animisme"],
            correctIndex: 0,
            explanation: "Agama yang resmi diakui di Indonesia meliputi Islam, Kristen, Katolik, Hindu, Buddha, dan Khonghucu."
          },
          {
            id: 4,
            question: "Tempat ibadah bagi umat Buddha untuk bersembahyang dan berdoa adalah...",
            options: ["Vihara", "Masjid", "Gereja", "Pura"],
            correctIndex: 0,
            explanation: "Umat Buddha beribadah di Vihara, sedangkan Hindu di Pura, Islam di Masjid, dan Kristen di Gereja."
          },
          {
            id: 5,
            question: "Ketika teman sekelas sedang menjalankan ibadah salat zuhur atau doa misa, sikap toleransi kita adalah...",
            options: ["Menjaga ketenangan dan tidak berteriak-teriak di dekat tempat ibadahnya", "Mengajaknya mengobrol saat ia berdoa", "Menyalakan speaker musik keras", "Menyuruhnya berhenti"],
            correctIndex: 0,
            explanation: "Menghormati kekhusyukan ibadah teman mencerminkan toleransi beragama yang luhur."
          },
          {
            id: 6,
            question: "Alat musik petik tradisional Sasando berasal dari daerah...",
            options: ["Nusa Tenggara Timur", "Jawa Barat", "Sumatera Barat", "Kalimantan Tengah"],
            correctIndex: 0,
            explanation: "Sasando adalah alat musik petik berdawai dari daun lontar yang berasal dari Rote, NTT."
          },
          {
            id: 7,
            question: "Sikap kita saat melihat teman diolok-olok karena dialek bicaranya yang kedaerahan adalah...",
            options: ["Membela teman tersebut dan mengingatkan agar saling menghargai logat daerah", "Ikut menertawakannya bersama", "Merekamnya untuk disebarkan", "Meninggalkannya sendirian"],
            correctIndex: 0,
            explanation: "Kita harus mencegah perundungan dan bangga bahwa ragam dialek adalah kekayaan bahasa nusantara."
          },
          {
            id: 8,
            question: "Rumah adat Gadang yang memiliki atap runcing seperti tanduk kerbau (gonjong) berasal dari suku Minangkabau di provinsi...",
            options: ["Sumatera Barat", "Aceh", "Jambi", "Riau"],
            correctIndex: 0,
            explanation: "Rumah Gadang dengan atap gonjong bertanduk kerbau adalah rumah adat Minangkabau, Sumatera Barat."
          },
          {
            id: 9,
            question: "Manfaat utama dari keberagaman budaya bagi sektor pariwisata Indonesia adalah...",
            options: ["Menarik wisatawan mancanegara dan memajukan ekonomi masyarakat lokal", "Membuat bangsa lain menjauh", "Menghabiskan dana negara", "Menimbulkan banyak perang antarwarga"],
            correctIndex: 0,
            explanation: "Keindahan tari, festival, dan kuliner nusantara menjadi daya tarik wisata kelas dunia."
          },
          {
            id: 10,
            question: "Peribahasa 'Di mana bumi dipijak, di sana langit dijunjung' memiliki arti bahwa kita harus...",
            options: ["Menghormati aturan dan adat istiadat setempat di tempat yang kita kunjungi", "Selalu memandang langit saat berjalan", "Menolak aturan desa tempat tinggal", "Merusak adat istiadat warga lokal"],
            correctIndex: 0,
            explanation: "Pepatah ini mengajarkan untuk selalu santun dan menghormati adat istiadat daerah mana pun yang kita singgahi."
          }
        ]
      };

    case 4:
      return {
        title: "Negara Kesatuan Republik Indonesia (NKRI)",
        conceptText: "Negara Kesatuan Republik Indonesia (NKRI) memiliki wilayah yang terbentang luas dari Sabang sampai Merauke, dari Miangas hingga Pulau Rote. Wilayah NKRI terbagi menjadi daerah provinsi, kabupaten/kota, kecamatan, dan kelurahan/desa. Kita bangga menjadi anak Indonesia yang cinta tanah air dan siap menjaga keutuhan bangsa.",
        questions: [
          {
            id: 1,
            question: "Bentuk negara Indonesia sebagaimana tercantum dalam Pasal 1 ayat (1) UUD 1945 adalah...",
            options: ["Negara Kesatuan yang berbentuk Republik", "Kerajaan Monarki", "Negara Serikat / Federal", "Kekaisaran"],
            correctIndex: 0,
            explanation: "Pasal 1 ayat (1) UUD 1945 menegaskan: 'Negara Indonesia ialah Negara Kesatuan, yang berbentuk Republik'."
          },
          {
            id: 2,
            question: "Pemimpin wilayah pemerintahan provinsi di Indonesia adalah seorang...",
            options: ["Gubernur", "Bupati", "Wali Kota", "Camat"],
            correctIndex: 0,
            explanation: "Provinsi dipimpin oleh Gubernur, dibantu oleh Wakil Gubernur dan perangkat daerah provinsi."
          },
          {
            id: 3,
            question: "Perbedaan wilayah kabupaten dan kota adalah kabupaten dipimpin oleh Bupati, sedangkan kota dipimpin oleh...",
            options: ["Wali Kota", "Lurah", "Ketua RT", "Kepala Dusun"],
            correctIndex: 0,
            explanation: "Pemerintahan kota dipimpin oleh seorang Wali Kota."
          },
          {
            id: 4,
            question: "Lagu kebangsaan Negara Kesatuan Republik Indonesia yang diciptakan oleh W.R. Soepratman berjudul...",
            options: ["Indonesia Raya", "Garuda Pancasila", "Bagimu Negeri", "Satu Nusa Satu Bangsa"],
            correctIndex: 0,
            explanation: "Indonesia Raya adalah lagu kebangsaan resmi yang pertama kali diperdengarkan pada Sumpah Pemuda 1928."
          },
          {
            id: 5,
            question: "Bendera kebangsaan Negara Kesatuan Republik Indonesia dinamakan...",
            options: ["Sang Merah Putih", "Bendera Bintang Lima", "Sang Saka Pelangi", "Bendera Garuda"],
            correctIndex: 0,
            explanation: "Sang Merah Putih: merah berarti keberanian dan putih berarti kesucian hati."
          },
          {
            id: 6,
            question: "Kota paling barat di Indonesia yang sering disebut sebagai titik nol kilometer adalah...",
            options: ["Kota Sabang di Pulau Weh, Aceh", "Kota Banda Aceh", "Kota Medan", "Kota Batam"],
            correctIndex: 0,
            explanation: "Sabang adalah kota paling barat, sedangkan Merauke adalah kota di ujung timur Indonesia."
          },
          {
            id: 7,
            question: "Wujud rasa bangga dan cinta tanah air bagi seorang pelajar sekolah dasar antara lain adalah...",
            options: ["Gemar memakai produk dalam negeri dan giat belajar meraih prestasi", "Hanya mau mengonsumsi produk impor dari luar negeri", "Malas mengikuti upacara bendera", "Mencoret lambang negara"],
            correctIndex: 0,
            explanation: "Mencintai produk lokal dan tekun belajar adalah bentuk nyata cinta tanah air pelajar."
          },
          {
            id: 8,
            question: "Sikap yang dapat mengancam keutuhan dan persatuan Negara Kesatuan Republik Indonesia adalah...",
            options: ["Tumbuhnya sikap egois kedaerahan dan saling menghina antarsuku", "Semangat gotong royong warga", "Saling tolong menolong saat bencana", "Mempelajari tarian daerah lain"],
            correctIndex: 0,
            explanation: "Etnosentrisme sempit dan intoleransi dapat memecah belah persatuan NKRI."
          },
          {
            id: 9,
            question: "Batas laut wilayah kepulauan Indonesia secara hukum internasional diperjuangkan melalui Deklarasi...",
            options: ["Deklarasi Djuanda 1957", "Deklarasi Bangkok", "Deklarasi Kemerdekaan", "Konferensi Meja Bundar"],
            correctIndex: 0,
            explanation: "Deklarasi Djuanda (13 Desember 1957) menyatakan laut antarpulau adalah satu kesatuan wilayah NKRI."
          },
          {
            id: 10,
            question: "Sikap yang tepat saat mendengarkan lagu kebangsaan Indonesia Raya dinyanyikan dalam upacara bendera adalah...",
            options: ["Berdiri tegak dengan sikap sempurna dan khidmat", "Duduk bersantai sambil mengobrol", "Berjalan-jalan di lapangan", "Bercanda dengan teman di samping"],
            correctIndex: 0,
            explanation: "Sikap sempurna dan khidmat saat lagu kebangsaan berkumandang adalah tanda penghormatan kedaulatan negara."
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
