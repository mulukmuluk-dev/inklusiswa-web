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

interface SeniGrade3GameProps {
  levelId: number;
  onLevelComplete: (levelId: number, starsEarned: number) => void;
  accessibilityMode?: string;
}

export function SeniGrade3Game({ levelId, onLevelComplete, accessibilityMode }: SeniGrade3GameProps) {
  const [phase, setPhase] = useState<"materi" | "game">("materi");

  // Phase 1 interactive states
  const [activeCraft, setActiveCraft] = useState<{ technique: string; desc: string }>({
    technique: "Gambar Dekoratif",
    desc: "Menghias permukaan benda dengan motif flora (tumbuhan) dan fauna (hewan) yang disederhanakan.",
  });
  const [activeMeter, setActiveMeter] = useState<{ birama: string; beat: string; sample: string }>({
    birama: "Birama 4/4",
    beat: "1 - 2 - 3 - 4",
    sample: "Lagu Indonesia Raya dan lagu daerah dengan 4 ketukan teratur per ruas birama.",
  });
  const [activeDanceLevel, setActiveDanceLevel] = useState<{ lvl: string; pos: string; sample: string }>({
    lvl: "Level Sedang",
    pos: "Badan berdiri setengah membungkuk atau lutut ditekuk (mendak)",
    sample: "Posisi dasar tari tradisional Jawa dan Bali.",
  });
  const [activePuppet, setActivePuppet] = useState<{ type: string; story: string }>({
    type: "Boneka Tangan",
    story: "Menggerakkan karakter binatang dalam dongeng Kancil dan Buaya dengan jari tangan.",
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
            KELAS 3 SD • LEVEL {levelId} dari 4
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
                  Teknik Seni Rupa Dekoratif & Mozaik:
                </span>
                <div className="grid grid-cols-3 gap-2 w-full text-xs">
                  {[
                    { technique: "Gambar Dekoratif", desc: "Menghias permukaan benda dengan stilasi motif daun, bunga, atau burung merak." },
                    { technique: "Seni Mozaik", desc: "Menempel potongan kecil kertas warna, pecahan keramik, atau biji-bijian sejenis." },
                    { technique: "Seni Montase", desc: "Menggabungkan beberapa gambar jadi dari majalah bekas membentuk tema baru." },
                  ].map((item) => (
                    <button
                      key={item.technique}
                      type="button"
                      onClick={() => {
                        setActiveCraft(item);
                        playPopSound();
                        speakGlobal(`${item.technique}: ${item.desc}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeCraft.technique === item.technique ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-xs">{item.technique}</strong>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong>{activeCraft.technique}: </strong>{activeCraft.desc}
                </div>
              </div>
            )}

            {levelId === 2 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Notasi Angka & Birama:
                </span>
                <div className="grid grid-cols-3 gap-2 w-full text-xs">
                  {[
                    { birama: "Birama 2/4", beat: "2 Ketukan", sample: "Lagu bertempo mars lincah (Hari Merdeka)." },
                    { birama: "Birama 3/4", beat: "3 Ketukan", sample: "Irama wals mengayun anggun (Burung Tantina)." },
                    { birama: "Birama 4/4", beat: "4 Ketukan", sample: "Irama umum stabil (Indonesia Raya, Halo-Halo Bandung)." },
                  ].map((m) => (
                    <button
                      key={m.birama}
                      type="button"
                      onClick={() => {
                        setActiveMeter(m);
                        playPopSound();
                        speakGlobal(`${m.birama} terdiri dari ${m.beat}. Contoh: ${m.sample}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeMeter.birama === m.birama ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-xs">{m.birama}</strong>
                      <span className="text-[10px] opacity-80">{m.beat}</span>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong>{activeMeter.birama} ({activeMeter.beat}): </strong>{activeMeter.sample}
                </div>
              </div>
            )}

            {levelId === 3 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Tiga Level Gerak Tari & Pola Lantai:
                </span>
                <div className="grid grid-cols-3 gap-2 w-full text-xs">
                  {[
                    { lvl: "Level Tinggi", pos: "Berjinjit, melompat, atau mengangkat tangan ke atas.", sample: "Gerak terbang burung enggang." },
                    { lvl: "Level Sedang", pos: "Berdiri tegak atau lutut ditekuk (mendak).", sample: "Posisi dasar tari tradisional." },
                    { lvl: "Level Rendah", pos: "Duduk bersimpuh atau bersila di lantai panggung.", sample: "Tari Saman dari Aceh." },
                  ].map((lvl) => (
                    <button
                      key={lvl.lvl}
                      type="button"
                      onClick={() => {
                        setActiveDanceLevel(lvl);
                        playPopSound();
                        speakGlobal(`${lvl.lvl}: ${lvl.pos}. Contoh: ${lvl.sample}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeDanceLevel.lvl === lvl.lvl ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-xs">{lvl.lvl}</strong>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong>{activeDanceLevel.lvl}: </strong>{activeDanceLevel.pos} (Contoh: {activeDanceLevel.sample})
                </div>
              </div>
            )}

            {levelId === 4 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Media Teater Boneka & Cerita Rakyat:
                </span>
                <div className="grid grid-cols-2 gap-2 w-full text-xs">
                  {[
                    { type: "Boneka Tangan", story: "Kain flanel dibentuk karakter binatang atau tokoh manusia, digerakkan jari tangan." },
                    { type: "Wayang Kertas", story: "Gambar tokoh cerita rakyat yang ditempel pada tangkai lidi bambu." },
                  ].map((p) => (
                    <button
                      key={p.type}
                      type="button"
                      onClick={() => {
                        setActivePuppet(p);
                        playPopSound();
                        speakGlobal(`${p.type}: ${p.story}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activePuppet.type === p.type ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-xs">{p.type}</strong>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong>{activePuppet.type}: </strong>{activePuppet.story}
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
        title: "Seni Rupa: Gambar Dekoratif, Mozaik, dan Origami",
        conceptText: "Gambar dekoratif adalah karya seni rupa menghias bidang dengan motif stilasi flora (tumbuhan) atau fauna (hewan). Mozaik dibuat dengan menempel kepingan kecil bahan sejenis (kertas, biji, keramik). Selain itu, kita belajar seni melipat kertas (origami) dan membentuk plastisin/lempung menjadi bentuk tiga dimensi.",
        questions: [
          {
            id: 1,
            question: "Gambar hiasan yang disederhanakan dari bentuk tumbuhan atau hewan tanpa menghilangkan keindahannya disebut...",
            options: ["Gambar dekoratif", "Gambar pemandangan alam", "Foto rontgen", "Peta geografi"],
            correctIndex: 0,
            explanation: "Gambar dekoratif memadukan garis, warna, dan motif flora/fauna yang disederhanakan secara indah."
          },
          {
            id: 2,
            question: "Karya seni dua dimensi yang dibuat dengan menempel kepingan bahan sejenis (seperti biji jagung atau potongan kertas warna) disebut...",
            options: ["Mozaik", "Patung batu", "Ukiran kayu", "Batik celup"],
            correctIndex: 0,
            explanation: "Mozaik disusun dari potongan atau kepingan kecil bahan sejenis pada suatu bidang pola."
          },
          {
            id: 3,
            question: "Seni tradisional melipat kertas dari Jepang yang menghasilkan bentuk burung atau bunga dinamakan...",
            options: ["Origami", "Kaligrafi", "Anyaman", "Pahat"],
            correctIndex: 0,
            explanation: "Origami adalah seni melipat selembar kertas persegi menjadi berbagai bentuk kreasi unik tanpa digunting."
          },
          {
            id: 4,
            question: "Karya seni menggabungkan beberapa gambar jadi dari majalah atau koran bekas menjadi satu komposisi baru disebut...",
            options: ["Montase", "Mozaik", "Kolase", "Sketsa"],
            correctIndex: 0,
            explanation: "Montase adalah susunan karya seni yang dirakit dari guntingan gambar-gambar yang sudah ada sebelumnya."
          },
          {
            id: 5,
            question: "Bahan lunak dan plastis yang mudah ditekan dan dibentuk menjadi miniatur hewan atau buah adalah...",
            options: ["Plastisin atau lempung tanah liat", "Batu granit keras", "Besi baja", "Kaca tebal"],
            correctIndex: 0,
            explanation: "Plastisin dan tanah liat bersifat elastis sehingga mudah dibentuk menjadi karya seni rupa 3 dimensi."
          },
          {
            id: 6,
            question: "Motif flora dalam gambar dekoratif terinspirasi dari keindahan alam berupa...",
            options: ["Bunga, daun, dan sulur ranting tumbuhan", "Burung dan ikan", "Bintang dan bulan", "Gedung dan mobil"],
            correctIndex: 0,
            explanation: "Flora berarti segala jenis tumbuhan, seperti bunga mawar, daun teratai, atau sulur tanaman."
          },
          {
            id: 7,
            question: "Motif fauna dalam ragam hias dekoratif biasanya mengambil contoh dari hewan...",
            options: ["Burung merak, kupu-kupu, dan ikan mas", "Bunga mawar dan melati", "Awan dan petir", "Pohon beringin"],
            correctIndex: 0,
            explanation: "Fauna berarti alam hewani, seperti burung elang, merak, kupu-kupu, atau ikan hias."
          },
          {
            id: 8,
            question: "Saat membuat mozaik menggunakan biji-bijian, lem yang paling cocok digunakan agar merekat kuat adalah...",
            options: ["Lem kayu putih (lem PVA)", "Air biasa", "Minyak goreng", "Tepung basah"],
            correctIndex: 0,
            explanation: "Lem kayu atau lem PVA memiliki daya rekat yang kuat untuk menempelkan biji-bijian di atas kertas tebal/kayu."
          },
          {
            id: 9,
            question: "Bentuk patung kecil dari plastisin memiliki ukuran panjang, lebar, dan tinggi sehingga disebut karya seni rupa...",
            options: ["Tiga dimensi (3D)", "Dua dimensi (2D)", "Satu dimensi", "Garis lurus saja"],
            correctIndex: 0,
            explanation: "Karya seni 3 dimensi memiliki volume ruang yang dapat dilihat dan disentuh dari segala arah."
          },
          {
            id: 10,
            question: "Kerapian melipat sudut-sudut kertas pada origami akan menghasilkan bentuk yang...",
            options: ["Simetris, presisi, dan indah", "Robek dan berkerut", "Kusut tidak teratur", "Tidak berbentuk"],
            correctIndex: 0,
            explanation: "Ketepatan lipatan pada garis sudut menghasilkan karya origami yang simetris dan rapi."
          }
        ]
      };

    case 2:
      return {
        title: "Seni Musik: Simbol Not Angka, Birama, dan Unisono",
        conceptText: "Notasi angka menggunakan simbol angka 1 sampai 7 (1=do, 2=re, 3=mi, 4=fa, 5=sol, 6=la, 7=si, titik di atas berarti nada tinggi). Birama menunjukkan ketukan birama (2/4, 3/4, 4/4). Bernyanyi secara 'unisono' berarti bernyanyi bersama-sama dalam satu suara yang kompak dan serempak.",
        questions: [
          {
            id: 1,
            question: "Dalam sistem notasi angka, angka '1' dan angka '5' berturut-turut dibaca sebagai nada...",
            options: ["Do dan Sol", "Re dan Fa", "Mi dan La", "Fa dan Si"],
            correctIndex: 0,
            explanation: "Notasi angka: 1=do, 2=re, 3=mi, 4=fa, 5=sol, 6=la, 7=si."
          },
          {
            id: 2,
            question: "Tanda titik di atas not angka (contoh: 1̇) menandakan bahwa nada tersebut dinyanyikan...",
            options: ["Satu oktaf lebih tinggi", "Satu oktaf lebih rendah", "Berhenti bernyanyi", "Sangat lambat"],
            correctIndex: 0,
            explanation: "Tanda titik di atas angka melambangkan nada tinggi, sedangkan titik di bawah melambangkan nada rendah."
          },
          {
            id: 3,
            question: "Birama 3/4 berarti dalam setiap ruas birama terdapat...",
            options: ["Tiga ketukan berirama", "Dua ketukan", "Empat ketukan", "Enam ketukan"],
            correctIndex: 0,
            explanation: "Birama 3/4 memiliki tiga ketukan dalam satu birama, contohnya irama tari wals."
          },
          {
            id: 4,
            question: "Bernyanyi secara 'unisono' memiliki arti bahwa seluruh penyanyi menyanyikan lagu...",
            options: ["Secara serempak dalam satu alunan suara (melodi yang sama)", "Masing-masing menyanyikan lagu yang berbeda", "Tanpa menggunakan suara sama sekali", "Hanya satu orang saja yang boleh bernyanyi"],
            correctIndex: 0,
            explanation: "Unisono adalah bernyanyi secara bersama-sama dalam satu melodi suara yang seragam."
          },
          {
            id: 5,
            question: "Lagu wajib nasional 'Hari Merdeka' ciptaan H. Mutahar memiliki birama...",
            options: ["2/4 bertempo cepat dan gagah (marcia)", "3/4 lambat", "6/8 sedih", "1/4"],
            correctIndex: 0,
            explanation: "Lagu Hari Merdeka berbirama 2/4 dengan tempo mars yang menggelegar dan bersemangat."
          },
          {
            id: 6,
            question: "Angka '0' (nol) pada susunan teks notasi angka berfungsi sebagai...",
            options: ["Tanda diam (istirahat tanpa bunyi)", "Nada paling tinggi", "Lagu selesai", "Tepukan tangan"],
            correctIndex: 0,
            explanation: "Angka 0 adalah tanda diam di mana penyanyi tidak mengeluarkan suara selama nilai ketukannya."
          },
          {
            id: 7,
            question: "Lagu daerah 'Gundhul-Gundhul Pacul' berasal dari provinsi...",
            options: ["Jawa Tengah", "Sumatera Barat", "Kalimantan Barat", "Papua"],
            correctIndex: 0,
            explanation: "Gundhul-Gundhul Pacul adalah lagu daerah anak-anak yang populer dari Jawa Tengah."
          },
          {
            id: 8,
            question: "Garis tegak lurus yang memisahkan satu ruas birama dengan ruas birama berikutnya pada partitur disebut...",
            options: ["Garis birama", "Garis cakrawala", "Garis pelangi", "Garis nada dasar"],
            correctIndex: 0,
            explanation: "Garis birama membatasi ruas birama yang berisi jumlah ketukan sesuai tanda birama lagu."
          },
          {
            id: 9,
            question: "Lagu 'Burung Tantina' dan 'Ampar-Ampar Pisang' masing-masing berasal dari daerah...",
            options: ["Maluku dan Kalimantan Selatan", "Aceh dan Bali", "Jawa Timur dan NTT", "Papua dan Jakarta"],
            correctIndex: 0,
            explanation: "Burung Tantina (Sio Tantina) berasal dari Maluku, Ampar-Ampar Pisang dari Kalimantan Selatan."
          },
          {
            id: 10,
            question: "Sikap pernapasan yang paling baik saat bernyanyi agar suara tidak mudah serak dan bertenaga adalah...",
            options: ["Pernapasan diafragma (pernapasan perut bagian bawah)", "Menahan napas di tenggorokan", "Tersengal-sengal di dada", "Bernapas dari hidung saja"],
            correctIndex: 0,
            explanation: "Pernapasan diafragma menampung udara lebih stabil dan menghasilkan suara merdu tanpa tekanan tenggorokan."
          }
        ]
      };

    case 3:
      return {
        title: "Seni Tari: Level Gerak Tari, Dinamika, dan Pola Lantai",
        conceptText: "Level gerak tari dibagi menjadi: Level Tinggi (berjinjit, melompat), Level Sedang (berdiri tegak, posisi lutut mendak), dan Level Rendah (duduk bersimpuh di lantai). Pola lantai adalah garis lintasan yang dilalui penari, seperti pola garis lurus (horizontal, vertikal, diagonal) dan melengkung (lingkaran).",
        questions: [
          {
            id: 1,
            question: "Tari Saman dari Aceh yang dilakukan oleh sekelompok penari sambil duduk berlutut rapat di lantai panggung menggunakan level gerak...",
            options: ["Level rendah", "Level tinggi", "Level terbang", "Level sedang"],
            correctIndex: 0,
            explanation: "Gerak tari yang menyentuh atau bertumpu di lantai panggung seperti duduk berlutut termasuk level rendah."
          },
          {
            id: 2,
            question: "Gerakan penari yang melompat tinggi ke udara atau melangkah dengan berjinjit di atas ujung kaki menggunakan level gerak...",
            options: ["Level tinggi", "Level rendah", "Level tanah", "Level datar"],
            correctIndex: 0,
            explanation: "Level tinggi ditandai dengan posisi tubuh menjulang ke atas seperti berjinjit atau melayang melompat."
          },
          {
            id: 3,
            question: "Posisi penari berdiri tegak dengan lutut ditekuk sedikit (posisi mendak pada tari Jawa) termasuk level gerak...",
            options: ["Level sedang", "Level rendah", "Level tinggi", "Level bebas"],
            correctIndex: 0,
            explanation: "Posisi berdiri wajar dengan lutut agak ditekuk merupakan level sedang pada tarian tradisional."
          },
          {
            id: 4,
            question: "Garis imajiner yang dilalui oleh penari saat berpindah formasi di atas panggung disebut...",
            options: ["Pola lantai", "Pola birama", "Pola sulur", "Pola warna"],
            correctIndex: 0,
            explanation: "Pola lantai adalah lintasan atau formasi barisan yang dibentuk penari dalam menyajikan tarian."
          },
          {
            id: 5,
            question: "Pola lantai di mana para penari berbaris lurus sejajar dari kiri ke kanan panggung disebut pola garis...",
            options: ["Horizontal (mendatar)", "Vertikal (ke depan)", "Lingkaran", "Zig-zag"],
            correctIndex: 0,
            explanation: "Garis horizontal membentang lurus mendatar dari sisi panggung kiri ke sisi kanan."
          },
          {
            id: 6,
            question: "Pola lantai lingkaran melambangkan kebersamaan dan persatuan yang erat, contohnya terlihat pada tari...",
            options: ["Tari Kecak dari Bali", "Tari Perang Papua", "Tari Jaipong solo", "Tari Gambyong"],
            correctIndex: 0,
            explanation: "Tari Kecak dibawakan puluhan penari pria yang duduk melingkar mengelilingi api unggun."
          },
          {
            id: 7,
            question: "Perubahan kuat dan lembutnya tenaga dalam membawakan gerakan tari disebut...",
            options: ["Dinamika tenaga tari", "Tempo lagu", "Notasi balok", "Ukuran panggung"],
            correctIndex: 0,
            explanation: "Dinamika gerak membuat tarian tidak monoton, memadukan hentakan bertenaga kuat dan gerak gemulai lembut."
          },
          {
            id: 8,
            question: "Gerak tangan penari yang membuka dan merentang ke samping kiri dan kanan secara berirama memberikan kesan...",
            options: ["Lapang, megah, dan bersahabat", "Sempit dan takut", "Marah dan mengancam", "Sedih berduka"],
            correctIndex: 0,
            explanation: "Rentangan tangan yang luas memancarkan keagungan, keramahan, dan keterbukaan."
          },
          {
            id: 9,
            question: "Jika formasi penari membentuk sudut miring dari pojok depan ke pojok belakang panggung, pola lantai tersebut adalah...",
            options: ["Pola diagonal", "Pola lingkaran", "Pola spiral", "Pola kubus"],
            correctIndex: 0,
            explanation: "Pola diagonal membentuk garis miring yang menghubungkan sudut silang panggung pertunjukan."
          },
          {
            id: 10,
            question: "Tujuan variasi perpindahan pola lantai dalam tarian kelompok adalah agar pertunjukan...",
            options: ["Menarik, dinamis, dan tidak membosankan penonton", "Membuat penari tersesat", "Menghabiskan tenaga", "Panggung roboh"],
            correctIndex: 0,
            explanation: "Pola lantai yang bervariasi memperkaya tata visual gerak dan memperindah komposisi panggung."
          }
        ]
      };

    case 4:
      return {
        title: "Seni Teater: Dialog Cerita Rakyat dan Wayang Kertas",
        conceptText: "Seni teater kelas 3 mengeksplorasi cerita rakyat nusantara (seperti Malin Kundang, Si Kancil, Bawang Merah Bawang Putih). Siswa berlatih dialog peran pendek yang santun serta menggunakan media teatrikal kreatif seperti boneka tangan dan wayang kertas bertangkai lidi.",
        questions: [
          {
            id: 1,
            question: "Cerita tradisional yang diwariskan secara turun-temurun di suatu daerah di Indonesia disebut...",
            options: ["Cerita rakyat (folklore)", "Berita koran", "Laporan tugas", "Iklan radio"],
            correctIndex: 0,
            explanation: "Cerita rakyat memuat pesan moral luhur dan nilai budi pekerti yang diwariskan para leluhur."
          },
          {
            id: 2,
            question: "Pesan moral penting dari cerita rakyat 'Malin Kundang' dari Sumatera Barat adalah...",
            options: ["Kita harus berbakti dan tidak boleh durhaka kepada ibu kandung", "Boleh melupakan orang tua saat sudah kaya", "Harus berlayar ke luar negeri", "Menolak pulang ke kampung"],
            correctIndex: 0,
            explanation: "Kisah Malin Kundang mengajarkan penghormatan tertinggi kepada orang tua yang membesarkan kita."
          },
          {
            id: 3,
            question: "Wayang sederhana yang dibuat dari gambar tokoh pada karton tebal dan diberi tangkai lidi untuk dimainkan disebut...",
            options: ["Wayang kertas / wayang karton", "Wayang kulit kerbau", "Wayang orang", "Boneka porselen"],
            correctIndex: 0,
            explanation: "Wayang kertas adalah media teater boneka kreatif yang mudah dibuat oleh siswa sekolah dasar."
          },
          {
            id: 4,
            question: "Saat memainkan boneka tangan di panggung boneka, pemain biasanya bersembunyi di balik...",
            options: ["Kotak panggung boneka (kelir kain layar)", "Di depan penonton", "Di luar gedung", "Di atas atap"],
            correctIndex: 0,
            explanation: "Pemain bersembunyi di balik sekat panggung agar perhatian penonton tertuju penuh pada gerak boneka."
          },
          {
            id: 5,
            question: "Ketika memerankan tokoh raksasa jahat dalam dongeng, intonasi suara yang digunakan sebaiknya...",
            options: ["Besar, berat, dan bernada menggelegar", "Kecil melengking seperti burung", "Sangat pelan berbisik", "Menangis tersedu-sedu"],
            correctIndex: 0,
            explanation: "Karakter raksasa digambarkan dengan warna suara berat, dalam, dan berwibawa menakutkan."
          },
          {
            id: 6,
            question: "Dalam percakapan teater, tanggapan yang diberikan seorang pemain terhadap ucapan lawan mainnya disebut...",
            options: ["Respons dialog", "Monolog sendiri", "Skrip mentah", "Pola lantai"],
            correctIndex: 0,
            explanation: "Respons dialog yang tanggap dan tepat waktu menjaga jalannya cerita tetap hidup dan alami."
          },
          {
            id: 7,
            question: "Tokoh 'Bawang Putih' dalam cerita rakyat Bawang Merah Bawang Putih memiliki watak yang...",
            options: ["Baik hati, sabar, dan rajin menolong", "Jahat dan sombong", "Pemarah dan licik", "Malas dan serakah"],
            correctIndex: 0,
            explanation: "Bawang Putih adalah tokoh protagonis yang berhati mulia, sabar, dan selalu bersyukur."
          },
          {
            id: 8,
            question: "Sebelum mementaskan drama boneka di kelas, langkah penting yang wajib dilakukan kelompok adalah...",
            options: ["Membaca naskah dan berlatih peran bersama secara rutin", "Langsung tampil tanpa persiapan", "Membeli perlengkapan mahal", "Bermain gim sendiri-sendiri"],
            correctIndex: 0,
            explanation: "Latihan rutin mematangkan pemahaman alur cerita dan memupuk kekompakan antarpemain."
          },
          {
            id: 9,
            question: "Tiruan bunyi langkah kaki kuda yang sedang berlari kencang di panggung teater dapat dibuat dengan...",
            options: ["Mengetukkan dua tempurung kelapa secara berirama", "Meniup peluit", "Menggesek penggaris plastik", "Merobek kertas"],
            correctIndex: 0,
            explanation: "Efek suara (sound effect) tempurung kelapa menghasilkan suara tapak kaki kuda (klotok-klotok) yang realistis."
          },
          {
            id: 10,
            question: "Sikap saling menghormati antarpemain teater saat berada di panggung tampak ketika...",
            options: ["Memberi kesempatan lawan main menyelesaikan dialognya tanpa memotong tiba-tiba", "Mendorong teman agar jatuh", "Berbicara lebih keras menutupi suara teman", "Meninggalkan panggung sendirian"],
            correctIndex: 0,
            explanation: "Etika panggung yang baik menjamin setiap tokoh dapat menyampaikan perannya secara utuh."
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
