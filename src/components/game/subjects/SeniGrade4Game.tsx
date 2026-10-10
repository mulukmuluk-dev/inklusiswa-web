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

interface SeniGrade4GameProps {
  levelId: number;
  onLevelComplete: (levelId: number, starsEarned: number) => void;
  accessibilityMode?: string;
}

export function SeniGrade4Game({ levelId, onLevelComplete, accessibilityMode }: SeniGrade4GameProps) {
  const [phase, setPhase] = useState<"materi" | "game">("materi");

  // Phase 1 interactive states
  const [activePersp, setActivePersp] = useState<{ concept: string; rule: string }>({
    concept: "Perspektif Satu Titik Hilang",
    rule: "Benda yang letaknya dekat terlihat besar, semakin jauh terlihat semakin kecil hingga menghilang di satu titik.",
  });
  const [activeScale, setActiveScale] = useState<{ scale: string; mood: string; interval: string }>({
    scale: "Diatonis Mayor",
    mood: "Riang, bersemangat, ceria (Contoh: Maju Tak Gentar)",
    interval: "1 - 1 - 1/2 - 1 - 1 - 1 - 1/2",
  });
  const [activeProp, setActiveProp] = useState<{ dance: string; prop: string; region: string }>({
    dance: "Tari Piring",
    prop: "Sepasang piring porselen diayunkan lincah tanpa terjatuh",
    region: "Minangkabau, Sumatera Barat",
  });
  const [activeRole, setActiveRole] = useState<{ type: string; trait: string; vocal: string }>({
    type: "Tokoh Protagonis",
    trait: "Tokoh utama berwatak baik hati, jujur, dan membela kebenaran.",
    vocal: "Vokal hangat, jelas, dan percaya diri.",
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
                  Prinsip Perspektif & Anyaman:
                </span>
                <div className="grid grid-cols-3 gap-2 w-full text-xs">
                  {[
                    { concept: "Titik Hilang", rule: "Semua garis sejajar tampak menyatu di satu titik di garis cakrawala." },
                    { concept: "Proporsi Bentuk", rule: "Perbandingan ukuran bagian benda agar terlihat serasi dan realistis." },
                    { concept: "Anyaman Kertas", rule: "Menyusun pita lungsi dan pakan secara bersilangan membentuk pola indah." },
                  ].map((p) => (
                    <button
                      key={p.concept}
                      type="button"
                      onClick={() => {
                        setActivePersp(p);
                        playPopSound();
                        speakGlobal(`${p.concept}: ${p.rule}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activePersp.concept === p.concept ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-xs">{p.concept}</strong>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong>{activePersp.concept}: </strong>{activePersp.rule}
                </div>
              </div>
            )}

            {levelId === 2 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Tangga Nada Diatonis & Pianika:
                </span>
                <div className="grid grid-cols-2 gap-2 w-full text-xs">
                  {[
                    { scale: "Diatonis Mayor", mood: "Ceria & Bersemangat (Contoh: Indonesia Raya, Halo-Halo Bandung)", interval: "Interval: 1 - 1 - 1/2 - 1 - 1 - 1 - 1/2" },
                    { scale: "Diatonis Minor", mood: "Syahdu, Sedih, Khidmat (Contoh: Mengheningkan Cipta, Gugur Bunga)", interval: "Interval: 1 - 1/2 - 1 - 1 - 1/2 - 1 - 1" },
                  ].map((s) => (
                    <button
                      key={s.scale}
                      type="button"
                      onClick={() => {
                        setActiveScale(s);
                        playPopSound();
                        speakGlobal(`Tangga nada ${s.scale}. Suasana: ${s.mood}. ${s.interval}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeScale.scale === s.scale ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-xs">{s.scale}</strong>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong>{activeScale.scale}: </strong>{activeScale.mood} ({activeScale.interval})
                </div>
              </div>
            )}

            {levelId === 3 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Properti Tari Tradisional Daerah:
                </span>
                <div className="grid grid-cols-3 gap-2 w-full text-xs">
                  {[
                    { dance: "Tari Piring", prop: "Piring porselen di kedua telapak tangan.", region: "Sumatera Barat" },
                    { dance: "Tari Kipas Pakarena", prop: "Kipas lipat yang dikibaskan anggun.", region: "Sulawesi Selatan" },
                    { dance: "Tari Jaipong", prop: "Selendang (sampur) yang disampirkan di pundak.", region: "Jawa Barat" },
                  ].map((d) => (
                    <button
                      key={d.dance}
                      type="button"
                      onClick={() => {
                        setActiveProp(d);
                        playPopSound();
                        speakGlobal(`${d.dance} dari ${d.region}. Propertinya: ${d.prop}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeProp.dance === d.dance ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-xs">{d.dance}</strong>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong>{activeProp.dance} ({activeProp.region}): </strong>{activeProp.prop}
                </div>
              </div>
            )}

            {levelId === 4 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Karakterisasi Tokoh Drama:
                </span>
                <div className="grid grid-cols-3 gap-2 w-full text-xs">
                  {[
                    { type: "Protagonis", trait: "Tokoh utama berwatak baik hati dan jujur.", vocal: "Vokal bersahabat dan tegas." },
                    { type: "Antagonis", trait: "Tokoh penentang berwatak jahat atau dengki.", vocal: "Vokal sinis atau mengancam." },
                    { type: "Tritagonis", trait: "Tokoh penengah yang bijaksana dan mendamaikan.", vocal: "Vokal teduh dan tenang." },
                  ].map((r) => (
                    <button
                      key={r.type}
                      type="button"
                      onClick={() => {
                        setActiveRole(r);
                        playPopSound();
                        speakGlobal(`${r.type}: ${r.trait}. ${r.vocal}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeRole.type === r.type ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-xs">{r.type}</strong>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong>{activeRole.type}: </strong>{activeRole.trait} ({activeRole.vocal})
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
        title: "Seni Rupa: Gambar Perspektif dan Kriya Anyaman",
        conceptText: "Teknik perspektif satu titik hilang digunakan untuk menggambar pemandangan atau jalan raya: benda yang dekat digambar besar, semakin jauh semakin kecil menuju satu titik lenyap. Kriya anyaman dibuat dengan menyusun pita lungsi dan pakan secara bersilangan dari kertas atau bilah bambu.",
        questions: [
          {
            id: 1,
            question: "Prinsip utama dalam menggambar perspektif satu titik hilang adalah bahwa benda yang letaknya semakin jauh dari mata pengamat akan terlihat...",
            options: ["Semakin kecil dan menyempit menuju satu titik", "Semakin besar dan melebar", "Tetap sama ukurannya", "Berubah menjadi lingkaran"],
            correctIndex: 0,
            explanation: "Perspektif menciptakan kesan kedalaman ruang 3D pada bidang datar 2D."
          },
          {
            id: 2,
            question: "Titik pertemuan garis-garis semu pada batas terjauh pandangan mata (cakrawala) dalam gambar perspektif dinamakan...",
            options: ["Titik hilang (vanishing point)", "Titik pusat lingkaran", "Titik potong garis", "Titik tumpu"],
            correctIndex: 0,
            explanation: "Titik hilang adalah titik temu di mana objek tampak mengecil hingga tak terhingga di garis horizon."
          },
          {
            id: 3,
            question: "Garis batas antara permukaan bumi atau laut dengan kubah langit disebut garis...",
            options: ["Horizon (garis cakrawala)", "Garis khatulistiwa", "Garis lintang", "Garis bujur"],
            correctIndex: 0,
            explanation: "Garis horizon memisahkan daratan/lautan dengan langit dan menjadi letak titik hilang."
          },
          {
            id: 4,
            question: "Karya kerajinan tangan yang dibuat dengan menyilangkan bilah-bilah bahan secara teratur disebut...",
            options: ["Seni anyaman", "Seni batik tulis", "Seni grafiti", "Seni kaligrafi"],
            correctIndex: 0,
            explanation: "Anyaman adalah teknik kriya menyusupkan pakan dan lungsi secara selang-seling."
          },
          {
            id: 5,
            question: "Dalam teknik menganyam, pita bilah yang dipasang membujur (tegak lurus) sebagai kerangka dasar disebut...",
            options: ["Pita lungsi", "Pita pakan", "Pita perekat", "Pita pengukur"],
            correctIndex: 0,
            explanation: "Pita lungsi berdiri tegak lurus, sedangkan pita pakan disusupkan melintang mendatar."
          },
          {
            id: 6,
            question: "Bahan alam dari tumbuhan yang sangat terkenal digunakan untuk membuat perabot anyaman di Indonesia adalah...",
            options: ["Bilah bambu dan rotan", "Daun pepaya basah", "Kayu jati gelondongan", "Batu karang"],
            correctIndex: 0,
            explanation: "Bambu dan rotan bersifat lentur, ulet, dan kuat sehingga sangat ideal untuk anyaman."
          },
          {
            id: 7,
            question: "Perbandingan ukuran bagian-bagian suatu benda dengan ukuran keseluruhan benda dalam seni rupa disebut...",
            options: ["Proporsi", "Irama nada", "Tempo", "Level gerak"],
            correctIndex: 0,
            explanation: "Proporsi adalah perbandingan matematis bentuk agar objek tampak harmonis dan alami."
          },
          {
            id: 8,
            question: "Motif ragam hias nusantara yang berbentuk garis pilin ganda atau kait yang saling bertautan adalah motif...",
            options: ["Motif pilin atau meander", "Motif kotak catur", "Motif garis polos", "Motif awan kartun"],
            correctIndex: 0,
            explanation: "Motif pilin dan meander adalah ragam hias geometris kuno yang banyak dijumpai pada kain dan ukiran nusantara."
          },
          {
            id: 9,
            question: "Contoh hasil karya kriya anyaman yang biasa digunakan untuk wadah nasi tradisional adalah...",
            options: ["Bakul nasi (besek / ceting bambu)", "Panci aluminium", "Gelas kaca", "Ember plastik"],
            correctIndex: 0,
            explanation: "Bakul dan besek bambu adalah wadah makanan tradisional hasil keterampilan anyaman."
          },
          {
            id: 10,
            question: "Keseimbangan dalam komposisi gambar dapat dicapai jika penempatan objek di sisi kiri dan kanan bidang gambar terasa...",
            options: ["Serasi dan seimbang berat visualnya", "Sangat berat di sebelah kiri saja", "Kosong sama sekali", "Menumpuk di pojok bawah"],
            correctIndex: 0,
            explanation: "Komposisi yang seimbang memberikan rasa nyaman dan keindahan artistik yang utuh bagi pemirsa."
          }
        ]
      };

    case 2:
      return {
        title: "Seni Musik: Tangga Nada Diatonis dan Musik Melodis",
        conceptText: "Tangga nada diatonis terdiri dari 7 nada. Tangga nada Diatonis Mayor bersuasana ceria dan bersemangat (interval: 1-1-1/2-1-1-1-1/2), sedangkan Diatonis Minor bersuasana syahdu atau sedih. Alat musik melodis seperti pianika dan rekorder dimainkan dengan artikulasi, intonasi, dan penjarian (fingering) yang tepat.",
        questions: [
          {
            id: 1,
            question: "Susunan tangga nada diatonis mayor memiliki pola jarak interval...",
            options: ["1 - 1 - 1/2 - 1 - 1 - 1 - 1/2", "1 - 1/2 - 1 - 1 - 1/2 - 1 - 1", "1 - 1 - 1 - 1 - 1 - 1 - 1", "1/2 - 1/2 - 1 - 1 - 1 - 1/2 - 1/2"],
            correctIndex: 0,
            explanation: "Interval tangga nada mayor adalah 1 - 1 - 1/2 - 1 - 1 - 1 - 1/2 dengan nada dasar Do."
          },
          {
            id: 2,
            question: "Ciri khas lagu yang menggunakan tangga nada diatonis mayor adalah dinyanyikan dengan suasana...",
            options: ["Riang gembira, bersemangat, dan penuh optimisme", "Sedih, murung, dan berduka", "Mengantuk", "Menakutkan"],
            correctIndex: 0,
            explanation: "Tangga nada mayor menghasilkan suasana gembira, dinamis, dan bersemangat."
          },
          {
            id: 3,
            question: "Contoh lagu wajib nasional yang menggunakan tangga nada diatonis minor karena bertema syahdu dan khidmat adalah...",
            options: ["Mengheningkan Cipta dan Gugur Bunga", "Halo-Halo Bandung", "Maju Tak Gentar", "Dari Sabang Sampai Merauke"],
            correctIndex: 0,
            explanation: "Lagu Gugur Bunga dan Mengheningkan Cipta menggunakan tangga nada minor bertempo khidmat dan syahdu."
          },
          {
            id: 4,
            question: "Alat musik tiup bertuts seperti piano kecil yang ditiup melalui pipa selang udara adalah...",
            options: ["Pianika", "Gitar akustik", "Gendang beleq", "Angklung"],
            correctIndex: 0,
            explanation: "Pianika adalah instrumen melodis tiup berbilah tuts yang umum dipelajari di sekolah dasar."
          },
          {
            id: 5,
            question: "Alat musik yang berfungsi membawakan melodi lagu (memiliki susunan nada Do, Re, Mi, Fa, Sol, La, Si) disebut alat musik...",
            options: ["Melodis", "Ritmis tanpa nada", "Pukul tak bernada", "Perkusi dasar"],
            correctIndex: 0,
            explanation: "Instrumen melodis mampu memainkan rangkaian melodi nada secara lengkap."
          },
          {
            id: 6,
            question: "Ketepatan tinggi-rendah nada yang dibunyikan oleh penyanyi atau instrumen musik disebut...",
            options: ["Intonasi", "Tempo", "Birama", "Resonansi"],
            correctIndex: 0,
            explanation: "Intonasi adalah ketepatan membidik frekuensi nada agar tidak terdengar fals atau sumbang."
          },
          {
            id: 7,
            question: "Tanda dinamika 'Forte' (f) dan 'Piano' (p) dalam lembar partitur lagu memiliki arti berturut-turut...",
            options: ["Dinyanyikan keras (forte) dan lembut (piano)", "Dinyanyikan cepat dan lambat", "Berhenti dan bernyanyi lagi", "Tinggi dan rendah"],
            correctIndex: 0,
            explanation: "Forte (f) berarti dinyanyikan dengan volume keras; Piano (p) berarti dinyanyikan secara lembut."
          },
          {
            id: 8,
            question: "Pada alat musik rekorder sopran, lubang nada yang berada di bagian belakang tabung ditutup menggunakan...",
            options: ["Ibu jari tangan kiri", "Kelingking kanan", "Telunjuk kanan", "Jari manis"],
            correctIndex: 0,
            explanation: "Ibu jari tangan kiri bertugas menutup atau membuka lubang oktaf di bagian belakang rekorder."
          },
          {
            id: 9,
            question: "Lagu anak bertangga nada mayor 'Bintang Kecil' diawali dan biasanya diakhiri dengan nada dasar...",
            options: ["Do (C)", "Fa (F)", "Si (B)", "Re (D)"],
            correctIndex: 0,
            explanation: "Lagu bertangga nada mayor natural diawali dan diselesaikan pada nada tonika Do (C)."
          },
          {
            id: 10,
            question: "Sikap badan yang benar saat meniup rekorder atau pianika sambil duduk adalah...",
            options: ["Punggung tegak, bahu rileks, dan siku membuka wajar", "Membungkuk membungkuk ke meja", "Menunduk rapat ke lantai", "Bersandar malas"],
            correctIndex: 0,
            explanation: "Duduk tegak rileks melancarkan aliran pernapasan diafragma saat meniup instrumen."
          }
        ]
      };

    case 3:
      return {
        title: "Seni Tari: Tari Kreasi Daerah dan Properti Tari",
        conceptText: "Tari kreasi daerah berpijak pada gerak tradisi yang dikembangkan dengan sentuhan koreografi baru. Tarian daerah sering memanfaatkan properti khas seperti selendang (sampur), kipas, piring, atau payung, dipadukan dengan ragam gerak kaki-tangan tradisi serta perubahan pola lantai yang dinamis.",
        questions: [
          {
            id: 1,
            question: "Tarian daerah yang dikembangkan dari gerak tradisional dengan variasi koreografi baru sesuai zaman disebut tari...",
            options: ["Tari kreasi daerah", "Tari modern barat", "Tari balet", "Tari jalanan"],
            correctIndex: 0,
            explanation: "Tari kreasi daerah berakar pada nilai gerak tari tradisi nusantara namun dikemas secara segar."
          },
          {
            id: 2,
            question: "Properti utama yang digunakan oleh penari dalam Tari Piring dari Minangkabau adalah...",
            options: ["Dua buah piring porselen di kedua telapak tangan", "Selendang panjang", "Kipas anyaman", "Topeng kayu"],
            correctIndex: 0,
            explanation: "Tari Piring memukau dengan atraksi memutar piring di telapak tangan tanpa terjatuh."
          },
          {
            id: 3,
            question: "Tari Kipas Pakarena yang melambangkan kelembutan dan kesantunan wanita berasal dari daerah...",
            options: ["Gowa, Sulawesi Selatan", "Banda Aceh", "Denpasar, Bali", "Banjarmasin"],
            correctIndex: 0,
            explanation: "Tari Kipas Pakarena adalah tarian tradisional khas masyarakat Gowa di Sulawesi Selatan."
          },
          {
            id: 4,
            question: "Sampur atau selendang dalam tari tradisional Jawa dan Sunda dimainkan dengan gerakan mengibaskan selendang yang disebut gerak...",
            options: ["Seblak atau ngoreh sampur", "Mendak", "Trisig", "Tanjak"],
            correctIndex: 0,
            explanation: "Seblak sampur adalah gerak menyibak atau melempar ujung selendang ke belakang pundak/samping."
          },
          {
            id: 5,
            question: "Gerakan melangkah kecil-kecil dan cepat dengan berjinjit dalam tari tradisional Jawa disebut...",
            options: ["Trisig", "Sembahan", "Kenser", "Ukel"],
            correctIndex: 0,
            explanation: "Trisig adalah gerak perpindahan tempat dengan lari-lari kecil berjinjit yang sangat lincah."
          },
          {
            id: 6,
            question: "Fungsi utama properti tari yang dibawa oleh penari adalah untuk...",
            options: ["Memperkuat karakter tarian dan memperjelas pesan tema tarian", "Membuat tangan penari pegal", "Menutupi kesalahan gerak penari", "Menambah beban penari"],
            correctIndex: 0,
            explanation: "Properti tari menjadi simbol penguat tema seperti tombak untuk kepahlawanan atau piring untuk kesuburan."
          },
          {
            id: 7,
            question: "Tari Merak dari Jawa Barat terinspirasi dari keindahan gerak burung merak. Properti khas tari ini adalah...",
            options: ["Sayap bermotif bulu merak dan mahkota kepala (garuda mungkur)", "Topeng monyet", "Kuda lumping", "Keranjang bambu"],
            correctIndex: 0,
            explanation: "Penari Tari Merak mengenakan selendang bersayap motif bulu merak yang dapat dibentangkan indah."
          },
          {
            id: 8,
            question: "Pola lantai garis melengkung dalam tarian memberikan kesan psikologis yang...",
            options: ["Lembut, lentur, dan manis", "Kaku dan tegas", "Menyeramkan", "Terburu-buru"],
            correctIndex: 0,
            explanation: "Garis lengkung (lingkaran, angka 8) memberi nuansa kelembutan, keluwesan, dan kekeluargaan."
          },
          {
            id: 9,
            question: "Gerak memutar pergelangan tangan ke arah luar atau ke dalam pada tari tradisional Jawa dinamakan gerak...",
            options: ["Ukel", "Mendak", "Panggel", "Nggroda"],
            correctIndex: 0,
            explanation: "Ukel adalah ragam gerak dasar memutar pergelangan tangan secara luwes dan anggun."
          },
          {
            id: 10,
            question: "Keselarasan antara gerak tubuh penari dengan alunan musik pengiring dinamakan unsur...",
            options: ["Wirama (irama)", "Wiraga (raga)", "Wirasa (rasa)", "Wicara (kata)"],
            correctIndex: 0,
            explanation: "Wirama menuntut kesesuaian ketukan gerak tari dengan tempo musik iringan."
          }
        ]
      };

    case 4:
      return {
        title: "Seni Teater: Karakterisasi Tokoh dan Proyeksi Suara",
        conceptText: "Karakter tokoh dalam drama dibagi menjadi: Protagonis (tokoh baik/utama), Antagonis (tokoh penentang/jahat), dan Tritagonis (tokoh penengah). Aktor melatih pernapasan diafragma dan proyeksi suara agar vokal terdengar lantang dan berwibawa di seluruh gedung pertunjukan.",
        questions: [
          {
            id: 1,
            question: "Tokoh utama dalam drama yang membela kebenaran dan memiliki sifat budi pekerti luhur disebut tokoh...",
            options: ["Protagonis", "Antagonis", "Figuran", "Pengecut"],
            correctIndex: 0,
            explanation: "Tokoh protagonis adalah tokoh sentral yang memperjuangkan kebaikan dan kebenaran cerita."
          },
          {
            id: 2,
            question: "Tokoh penentang protagonis yang memiliki sifat iri, jahat, atau curang dinamakan tokoh...",
            options: ["Antagonis", "Protagonis", "Tritagonis", "Sutradara"],
            correctIndex: 0,
            explanation: "Tokoh antagonis menciptakan konflik dalam alur drama dengan menentang tokoh protagonis."
          },
          {
            id: 3,
            question: "Teknik melontarkan suara vokal dari rongga tubuh agar terdengar jelas dan menjangkau penonton baris belakang disebut...",
            options: ["Proyeksi suara", "Pola lantai", "Tekstur nada", "Artikulasi murni"],
            correctIndex: 0,
            explanation: "Proyeksi suara melatih daya jangkau vokal tanpa harus berteriak histeris yang merusak pita suara."
          },
          {
            id: 4,
            question: "Tokoh netral yang bertindak sebagai pendamai atau penasihat bijak saat terjadi perselisihan tokoh disebut...",
            options: ["Tritagonis", "Antagonis", "Pemeran pengganti", "Penonton"],
            correctIndex: 0,
            explanation: "Tritagonis berperan sebagai pihak ketiga penengah yang bijak dan berwawasan luas."
          },
          {
            id: 5,
            question: "Latihan pernapasan yang paling efektif untuk memperkuat ketahanan vokal seorang aktor adalah pernapasan...",
            options: ["Pernapasan diafragma", "Pernapasan dada atas", "Pernapasan pundak", "Menahan napas"],
            correctIndex: 0,
            explanation: "Pernapasan diafragma memberikan daya dorong udara yang stabil dan bertenaga penuh bagi aktor."
          },
          {
            id: 6,
            question: "Orang yang memimpin jalannya latihan dan mengarahkan akting seluruh pemain teater dinamakan...",
            options: ["Sutradara", "Produser modal", "Penonton setia", "Kameramen"],
            correctIndex: 0,
            explanation: "Sutradara bertindak sebagai pengarah artistik dan penafsir utama naskah lakon pementasan."
          },
          {
            id: 7,
            question: "Naskah tertulis yang memuat alur cerita, petunjuk adegan, dan dialog antartokoh disebut...",
            options: ["Naskah drama (skenario)", "Surat kabar", "Buku kamus", "Daftar hadir"],
            correctIndex: 0,
            explanation: "Naskah drama adalah panduan utama cerita yang berisi nama tokoh, dialog, dan petunjuk lakuan (kramagung)."
          },
          {
            id: 8,
            question: "Perubahan intonasi suara saat bertanya atau menyatakan kemarahan dalam dialog drama disebut...",
            options: ["Modulasi dan intonasi vokal", "Pola birama", "Ketukan pulsa", "Gerak trisig"],
            correctIndex: 0,
            explanation: "Modulasi vokal memberi warna emosi hidup pada kalimat dialog agar tidak terdengar datar membosankan."
          },
          {
            id: 9,
            question: "Drama pendek yang mengangkat kisah dunia binatang yang bertingkah laku seperti manusia disebut...",
            options: ["Fabel", "Mite", "Hikayat", "Biografi"],
            correctIndex: 0,
            explanation: "Fabel adalah cerita fiksi mendidik dengan tokoh-tokoh binatang yang berkarakter moral."
          },
          {
            id: 10,
            question: "Saat terjadi kesalahan kecil di atas panggung (misal properti jatuh), sikap aktor yang profesional adalah...",
            options: ["Tetap tenang berimprovisasi melanjutkan peran sesuai situasi tanpa panik", "Menangis dan lari ke belakang panggung", "Menyalahkan penonton", "Menghentikan drama seketika"],
            correctIndex: 0,
            explanation: "Improvisasi spontan yang cerdas menjaga kelangsungan pertunjukan teater di hadapan penonton."
          }
        ]
      };

    default:
      return {
        title: "Konsep Dasar Seni Budaya",
        conceptText: "Seni Budaya mengasah kreativitas melalui seni rupa, seni musik, seni tari, dan seni teater.",
        questions: []
      };
  }
}
