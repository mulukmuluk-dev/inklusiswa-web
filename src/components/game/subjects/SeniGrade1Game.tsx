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

interface SeniGrade1GameProps {
  levelId: number;
  onLevelComplete: (levelId: number, starsEarned: number) => void;
  accessibilityMode?: string;
}

export function SeniGrade1Game({ levelId, onLevelComplete, accessibilityMode }: SeniGrade1GameProps) {
  const [phase, setPhase] = useState<"materi" | "game">("materi");

  // Phase 1 interactive states
  const [activeArtElem, setActiveArtElem] = useState<{ name: string; desc: string }>({
    name: "Garis & Bidang",
    desc: "Garis lurus, lengkung, dan bidang lingkaran atau segitiga membentuk gambar.",
  });
  const [activeSoundType, setActiveSoundType] = useState<{ type: string; sample: string }>({
    type: "Bunyi Alam",
    sample: "Suara kicau burung, desir angin sepoi, dan deburan ombak pantai.",
  });
  const [activeDanceMove, setActiveDanceMove] = useState<{ move: string; desc: string }>({
    move: "Gerak Meniru Pohon",
    desc: "Kedua tangan melambai ke kiri dan ke kanan seperti dahan ditiup angin.",
  });
  const [activeFacial, setActiveFacial] = useState<{ exp: string; action: string }>({
    exp: "Gembira",
    action: "Tersenyum lebar dengan mata berbinar saat mendengar kabar gembira.",
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
            KELAS 1 SD • LEVEL {levelId} dari 4
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
                  Unsur Seni Rupa Dasar:
                </span>
                <div className="grid grid-cols-3 gap-2 w-full text-xs">
                  {[
                    { name: "Warna Dasar", desc: "Merah, Kuning, dan Biru adalah warna primer alami." },
                    { name: "Garis & Bentuk", desc: "Garis lurus, lengkung, dan lingkaran membentuk gambar." },
                    { name: "Kolase Alam", desc: "Menempel daun kering dan ranting di atas kertas gambar." },
                  ].map((item) => (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => {
                        setActiveArtElem(item);
                        playPopSound();
                        speakGlobal(`${item.name}: ${item.desc}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeArtElem.name === item.name ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-xs">{item.name}</strong>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong>{activeArtElem.name}: </strong>{activeArtElem.desc}
                </div>
              </div>
            )}

            {levelId === 2 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Sumber Bunyi & Ritme:
                </span>
                <div className="grid grid-cols-2 gap-2 w-full text-xs">
                  {[
                    { type: "Bunyi Alam", sample: "Suara hujan tik-tik, hembusan angin wus-wus, ombak byur." },
                    { type: "Bunyi Buatan", sample: "Ketukan pintu tok-tok, klakson motor tin-tin, petikan gitar." },
                  ].map((item) => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => {
                        setActiveSoundType(item);
                        playPopSound();
                        speakGlobal(`${item.type}: ${item.sample}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeSoundType.type === item.type ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-xs">{item.type}</strong>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong>{activeSoundType.type}: </strong>{activeSoundType.sample}
                </div>
              </div>
            )}

            {levelId === 3 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Gerak Tubuh & Meniru Alam:
                </span>
                <div className="grid grid-cols-3 gap-2 w-full text-xs">
                  {[
                    { move: "Kupu-Kupu", desc: "Mengepakkan kedua tangan ke atas dan bawah dengan lembut." },
                    { move: "Kelinci Melompat", desc: "Menekuk kedua tangan di dada dan melompat kecil bertempo." },
                    { move: "Pohon Ditiup Angin", desc: "Melambaikan badan dan tangan ke kanan dan kiri." },
                  ].map((m) => (
                    <button
                      key={m.move}
                      type="button"
                      onClick={() => {
                        setActiveDanceMove(m);
                        playPopSound();
                        speakGlobal(`Gerak ${m.move}: ${m.desc}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeDanceMove.move === m.move ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-xs">{m.move}</strong>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong>Gerak {activeDanceMove.move}: </strong>{activeDanceMove.desc}
                </div>
              </div>
            )}

            {levelId === 4 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Mimik Wajah & Pantomim:
                </span>
                <div className="grid grid-cols-3 gap-2 w-full text-xs">
                  {[
                    { exp: "Senang", action: "Wajah tersenyum riang dan mata berbinar-binar." },
                    { exp: "Kaget / Terkejut", action: "Mata membulat dan mulut terbuka membentuk huruf O." },
                    { exp: "Pantomim Makan", action: "Gerak makan makanan lezat tanpa bersuara." },
                  ].map((f) => (
                    <button
                      key={f.exp}
                      type="button"
                      onClick={() => {
                        setActiveFacial(f);
                        playPopSound();
                        speakGlobal(`Ekspresi ${f.exp}: ${f.action}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeFacial.exp === f.exp ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-xs">{f.exp}</strong>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong>Ekspresi {activeFacial.exp}: </strong>{activeFacial.action}
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
        title: "Seni Rupa: Garis, Warna Dasar, dan Kolase Alam",
        conceptText: "Seni rupa dimulai dari mengenal garis lurus, garis lengkung, dan garis zigzag. Warna dasar terdiri dari merah, kuning, dan biru. Kita juga bisa membuat karya kolase indah dengan menempel bahan alami seperti daun kering, bunga gugur, dan ranting kecil.",
        questions: [
          {
            id: 1,
            question: "Warna dasar (primer) yang belum dicampur dengan warna lain terdiri atas warna...",
            options: ["Merah, kuning, dan biru", "Hijau, ungu, dan jingga", "Hitam, abu-abu, dan putih", "Cokelat, emas, dan perak"],
            correctIndex: 0,
            explanation: "Tiga warna primer alami adalah merah, kuning, dan biru."
          },
          {
            id: 2,
            question: "Garis yang meliuk-liuk lembut menyerupai gelombang ombak disebut garis...",
            options: ["Garis lengkung", "Garis lurus patah", "Garis putus-putus", "Garis tebal"],
            correctIndex: 0,
            explanation: "Garis lengkung memberi kesan lentur, dinamis, dan lembut seperti ombak."
          },
          {
            id: 3,
            question: "Karya seni menempel potongan bahan alami seperti daun kering dan biji-bijian pada gambar disebut...",
            options: ["Kolase", "Patung batu", "Ukiran kayu", "Fotografi"],
            correctIndex: 0,
            explanation: "Kolase adalah karya seni rupa dua dimensi yang dibuat dengan teknik menempel berbagai bahan."
          },
          {
            id: 4,
            question: "Permukaan batang pohon terasa kasar saat diraba dengan tangan. Kasar atau halusnya permukaan benda disebut...",
            options: ["Tekstur", "Warna", "Ketukan", "Irama"],
            correctIndex: 0,
            explanation: "Tekstur adalah sifat halus, kasar, atau licinnya permukaan suatu benda saat diraba."
          },
          {
            id: 5,
            question: "Bentuk bidang datar yang memiliki tiga sisi dan tiga sudut runcing adalah bidang...",
            options: ["Segitiga", "Lingkaran bulat", "Persegi panjang", "Tabung"],
            correctIndex: 0,
            explanation: "Bidang segitiga memiliki tiga sisi garis lurus yang saling terhubung."
          },
          {
            id: 6,
            question: "Alat yang kita gunakan untuk merekatkan daun kering pada kertas gambar saat membuat kolase adalah...",
            options: ["Lem kertas", "Kuas cat air", "Gunting tumpul", "Pena"],
            correctIndex: 0,
            explanation: "Lem digunakan sebagai zat perekat agar bahan kolase menempel erat di atas kertas."
          },
          {
            id: 7,
            question: "Jika kita menggambar buah apel yang sudah matang di pohon, warna yang tepat digunakan adalah...",
            options: ["Merah cerah", "Biru tua", "Hitam pekat", "Abu-abu"],
            correctIndex: 0,
            explanation: "Buah apel yang matang umumnya berwarna merah menyala dan segar."
          },
          {
            id: 8,
            question: "Bahan alam yang dapat kita kumpulkan di halaman sekolah untuk membuat kolase adalah...",
            options: ["Daun kering dan ranting kecil", "Kantong plastik bekas", "Pecahan kaca berbahaya", "Kaleng minuman"],
            correctIndex: 0,
            explanation: "Daun kering dan ranting adalah bahan alam yang aman dan ramah lingkungan untuk kolase."
          },
          {
            id: 9,
            question: "Garis lurus yang berdiri tegak dari atas ke bawah dinamakan garis lurus...",
            options: ["Vertikal (tegak)", "Horizontal (mendatar)", "Lingkaran", "Spiral obat nyamuk"],
            correctIndex: 0,
            explanation: "Garis lurus tegak ke atas atau ke bawah disebut garis vertikal."
          },
          {
            id: 10,
            question: "Sikap yang baik setelah kita selesai membuat karya seni rupa di kelas adalah...",
            options: ["Merapikan kembali alat gambar dan membuang sisa guntingan ke tempat sampah", "Meninggalkan meja berantakan", "Mencoret meja teman dengan krayon", "Membuang cat ke lantai"],
            correctIndex: 0,
            explanation: "Menjaga kebersihan dan merapikan alat lukis melatih kedisiplinan dan tanggung jawab."
          }
        ]
      };

    case 2:
      return {
        title: "Seni Musik: Bunyi Alam, Ketukan, dan Ritme",
        conceptText: "Bunyi ada dua macam: bunyi alam yang dihasilkan oleh alam semesta (suara hujan, petir, desir angin) dan bunyi buatan yang dihasilkan oleh manusia atau alat musik (peluit, bel, tepuk tangan). Lagu dapat dinyanyikan dengan tempo cepat yang riang atau lambat yang tenang.",
        questions: [
          {
            id: 1,
            question: "Suara rintik hujan yang jatuh di atas atap seng termasuk jenis...",
            options: ["Bunyi alam", "Bunyi buatan mesin", "Bunyi elektronik", "Bunyi sirene"],
            correctIndex: 0,
            explanation: "Suara rintik hujan dan hembusan angin adalah bunyi alami ciptaan Tuhan."
          },
          {
            id: 2,
            question: "Contoh bunyi buatan yang sengaja dibunyikan oleh manusia menggunakan alat adalah...",
            options: ["Bunyi peluit ditiup wasit", "Suara petir menggelegar", "Kicau burung pipit", "Suara ombak laut"],
            correctIndex: 0,
            explanation: "Peluit adalah alat buatan manusia yang menghasilkan bunyi saat ditiup."
          },
          {
            id: 3,
            question: "Kecepatan ketukan dalam membawakan sebuah lagu disebut...",
            options: ["Tempo", "Warna nada", "Tekstur", "Bait"],
            correctIndex: 0,
            explanation: "Tempo adalah ukuran cepat lambatnya ketukan birama sebuah lagu dinyanyikan."
          },
          {
            id: 4,
            question: "Lagu anak-anak 'Balonku Ada Lima' biasanya dinyanyikan dengan suasana...",
            options: ["Gembira dan ceria", "Sedih menangis", "Marah dan berteriak", "Menakutkan"],
            correctIndex: 0,
            explanation: "Lagu anak-anak umumnya bertempo riang gembira dan menyenangkan hati."
          },
          {
            id: 5,
            question: "Bunyi yang teratur dan berulang secara stabil dinamakan...",
            options: ["Irama atau ritme", "Bising suara motor", "Kegaduhan kelas", "Guntur"],
            correctIndex: 0,
            explanation: "Ritme adalah susunan panjang pendeknya bunyi yang teratur dan berulang."
          },
          {
            id: 6,
            question: "Anggota tubuh kita yang paling mudah digunakan untuk membuat bunyi ketukan sederhana adalah...",
            options: ["Kedua telapak tangan bertepuk", "Mata berkedip", "Hidung bernapas", "Telinga"],
            correctIndex: 0,
            explanation: "Tepukan tangan (prok prok) menghasilkan bunyi ritmis yang menyenangkan untuk bernyanyi."
          },
          {
            id: 7,
            question: "Lagu pengantar tidur bagi adik bayi sebaiknya dinyanyikan dengan tempo...",
            options: ["Lambat dan lembut", "Sangat cepat dan keras", "Berteriak teriak", "Cepat seperti balapan"],
            correctIndex: 0,
            explanation: "Tempo lambat dan lembut menciptakan rasa tenang sehingga adik bayi mudah tertidur nyenyak."
          },
          {
            id: 8,
            question: "Suara detak jarum jam dinding berbunyi...",
            options: ["Tik... tok... tik... tok...", "Dung... dung... plak...", "Kring... kring... kring...", "Byur... byur... byur..."],
            correctIndex: 0,
            explanation: "Jarum jam dinding berdetak teratur dengan bunyi khas tik-tok."
          },
          {
            id: 9,
            question: "Ketika bernyanyi bersama-sama di dalam kelas, sikap kita sebaiknya...",
            options: ["Kompak mengikuti ketukan guru dan tidak berteriak sendiri", "Berteriak paling keras agar teman kalah", "Diam cemberut tidak mau menyanyi", "Menutup telinga"],
            correctIndex: 0,
            explanation: "Bernyanyi bersama menuntut keselarasan irama, kekompakan, dan saling mendengarkan."
          },
          {
            id: 10,
            question: "Bunyi kicauan burung di pagi hari terdengar...",
            options: ["Cuit... cuit... cuit...", "Guk... guk... guk...", "Petok... petok...", "Mbeee... mbeee..."],
            correctIndex: 0,
            explanation: "Burung berkicau merdu dengan tiruan bunyi cuit-cuit di dahan pohon."
          }
        ]
      };

    case 3:
      return {
        title: "Seni Tari: Gerak Tubuh dan Meniru Alam",
        conceptText: "Menari adalah menggerakkan tubuh secara berirama mengikuti ketukan musik. Gerak tari melibatkan kepala (menengok, menggeleng), tangan (melambai, merentang), dan kaki (melangkah, melompat). Kita bisa menirukan gerak alam seperti pepohonan ditiup angin atau gerak lincah hewan.",
        questions: [
          {
            id: 1,
            question: "Unsur utama dalam seni tari yang bergerak secara berirama dan indah adalah...",
            options: ["Gerak tubuh manusia", "Cat lukis", "Kertas origami", "Pensil warna"],
            correctIndex: 0,
            explanation: "Gerak tubuh yang selaras dengan irama ketukan adalah unsur pokok seni tari."
          },
          {
            id: 2,
            question: "Gerakan menirukan kupu-kupu terbang dilakukan dengan cara...",
            options: ["Mengepakkan kedua tangan ke atas dan bawah dengan lembut", "Menghentakkan kedua kaki keras-keras", "Menggelengkan kepala kencang", "Duduk terdiam di lantai"],
            correctIndex: 0,
            explanation: "Kedua tangan direntangkan dan digerakkan perlahan melambangkan sayap kupu-kupu yang anggun."
          },
          {
            id: 3,
            question: "Gerak menirukan katak atau kelinci berpindah tempat adalah gerak...",
            options: ["Melompat dengan kedua kaki", "Merayap di tanah", "Terbang tinggi", "Berenang santai"],
            correctIndex: 0,
            explanation: "Kelinci dan katak bergerak lincah dengan cara melompat berirama."
          },
          {
            id: 4,
            question: "Gerak menirukan pohon ditiup angin sepoi-sepoi dilakukan dengan meliukkan...",
            options: ["Badan dan kedua tangan ke kiri dan kanan dengan santun", "Hanya satu jari tangan", "Mata berputar-putar", "Kaki menendang bola"],
            correctIndex: 0,
            explanation: "Badan dan tangan meliuk lembut menggambarkan dahan pohon yang bergoyang tertiup angin."
          },
          {
            id: 5,
            question: "Bagian tubuh kita yang bergerak saat menengok ke kanan dan ke kiri adalah...",
            options: ["Kepala dan leher", "Lutut kaki", "Jari kaki", "Pinggang"],
            correctIndex: 0,
            explanation: "Gerak menengok dan menggeleng adalah gerak tari dasar bagian kepala."
          },
          {
            id: 6,
            question: "Gerakan tari yang dilakukan dengan mengikuti ketukan hitungan (1, 2, 3, 4) bertujuan agar gerakan menjadi...",
            options: ["Teratur, serempak, dan indah dipandang", "Kacau balau", "Saling bertabrakan dengan teman", "Sangat lambat hingga berhenti"],
            correctIndex: 0,
            explanation: "Ketukan hitungan menjaga keselarasan tempo dan keseragaman gerak tari berkelompok."
          },
          {
            id: 7,
            question: "Contoh gerak menirukan ayam jantan berkokok di pagi hari dalam tari adalah...",
            options: ["Mengibaskan siku tangan di samping badan dan mendongakkan kepala", "Tidur terlentang", "Berjalan merangkak", "Menutup wajah dengan buku"],
            correctIndex: 0,
            explanation: "Siku ditekuk seperti sayap ayam dan kepala mendongak menirukan ayam berkokok gagah."
          },
          {
            id: 8,
            question: "Saat menari bersama teman-teman di atas panggung, sikap penari yang baik adalah...",
            options: ["Tersenyum gembira dan menjaga jarak agar tidak saling menabrak", "Mendorong teman di sebelahnya", "Menangis ketakutan", "Memunggungi penonton"],
            correctIndex: 0,
            explanation: "Ekspresi senyum ramah dan kesadaran ruang membuat pertunjukan tari terasa hidup dan memukau."
          },
          {
            id: 9,
            question: "Gerak mengayunkan kedua tangan ke depan dan ke belakang saat berjalan melambangkan gerak...",
            options: ["Melangkah santai dan gembira", "Tidur di kasur", "Makan sup", "Membaca buku"],
            correctIndex: 0,
            explanation: "Ayunan tangan mengiringi langkah kaki memberikan kesan riang dan bersemangat."
          },
          {
            id: 10,
            question: "Musik yang mengiringi tarian memiliki fungsi penting untuk...",
            options: ["Membantu penari menyesuaikan ketukan dan menghidupkan suasana tari", "Membuat penari pusing", "Mengusir penonton pulang", "Mengurangi keindahan tarian"],
            correctIndex: 0,
            explanation: "Musik iringan memberi panduan tempo serta memperkuat emosi dan makna dalam tarian."
          }
        ]
      };

    case 4:
      return {
        title: "Seni Teater: Mimik Wajah, Suara, dan Pantomim",
        conceptText: "Seni teater adalah seni pertunjukan peran. Kita belajar berekspresi lewat mimik wajah (senang, sedih, kaget), pantomim (gerak bisu bercerita tanpa suara), serta menirukan berbagai karakter binatang dan tokoh dongeng yang lucu dan mendidik.",
        questions: [
          {
            id: 1,
            question: "Perubahan raut wajah yang menunjukkan perasaan seseorang saat bermain peran disebut...",
            options: ["Mimik wajah", "Tempo lagu", "Pola lantai", "Tekstur lukisan"],
            correctIndex: 0,
            explanation: "Mimik wajah mencerminkan emosi tokoh seperti senyum gembira atau dahi berkerut cemberut."
          },
          {
            id: 2,
            question: "Pertunjukan seni peran yang hanya mengandalkan gerak tubuh dan ekspresi wajah tanpa mengeluarkan suara disebut...",
            options: ["Pantomim", "Paduan suara", "Opera menyanyi", "Pembacaan puisi"],
            correctIndex: 0,
            explanation: "Pantomim bercerita secara visual melalui bahasa tubuh dan mimik ekspresif tanpa kata-kata."
          },
          {
            id: 3,
            question: "Ketika memerankan tokoh dongeng kancil yang cerdik dan periang, ekspresi yang tepat adalah...",
            options: ["Tersenyum ceria dan mata berbinar lincah", "Menangis tersedu-sedu", "Cemberut marah", "Tertidur pulas"],
            correctIndex: 0,
            explanation: "Tokoh kancil yang cerdas diperankan dengan senyum cerdik dan tatapan mata yang hidup."
          },
          {
            id: 4,
            question: "Suara tiruan hewan harimau yang sedang mengaum di hutan terdengar...",
            options: ["Auuuum... roar...", "Mbek... mbek...", "Kukuruyuk...", "Cit... cit... cit..."],
            correctIndex: 0,
            explanation: "Auman harimau yang gagah ditirukan dengan suara auum yang berat dan lantang."
          },
          {
            id: 5,
            question: "Gerak pantomim meniup balon besar hingga meletus dapat ditirukan dengan...",
            options: ["Menggembungkan pipi, kedua tangan membesar perlahan, lalu meloncat terkejut saat meletus", "Berjalan lari biasa", "Duduk melipat tangan", "Tidur di meja"],
            correctIndex: 0,
            explanation: "Gerak imajinatif tubuh menirukan balon yang kian mengembang lalu meletus secara dramatis."
          },
          {
            id: 6,
            question: "Benda sederhana yang sering digunakan di atas panggung oleh pemain teater disebut...",
            options: ["Properti panggung", "Pola birama", "Skala nada", "Warna primer"],
            correctIndex: 0,
            explanation: "Properti adalah perlengkapan pendukung adegan seperti topi, tongkat, atau keranjang buah."
          },
          {
            id: 7,
            question: "Saat memerankan tokoh yang sedang terkejut mendengar suara petir, ekspresi wajah kita sebaiknya...",
            options: ["Mata terbuka lebar dan mulut membentuk huruf O", "Tersenyum santai", "Tertawa terbahak-bahak", "Menutup mata tidur"],
            correctIndex: 0,
            explanation: "Raut kaget ditunjukkan dengan mata membelalak dan ekspresi spontan menoleh ke sumber suara."
          },
          {
            id: 8,
            question: "Manfaat berlatih seni peran teater bagi anak sekolah dasar adalah melatih...",
            options: ["Rasa percaya diri, keberanian berbicara, dan empati menghargai orang lain", "Sikap sombong dan penakut", "Kebiasaan berbohong", "Suka bertengkar"],
            correctIndex: 0,
            explanation: "Bermain peran menumbuhkan keberanian tampil di depan publik dan memahami sudut pandang orang lain."
          },
          {
            id: 9,
            question: "Jika teman kita sedang tampil bermain peran di depan kelas, sikap kita yang baik sebagai penonton adalah...",
            options: ["Memperhatikan dengan tenang dan memberikan tepuk tangan meriah setelah selesai", "Mengejek dan menertawakannya saat salah kata", "Berbicara keras di belakang", "Melemparkan botol"],
            correctIndex: 0,
            explanation: "Apresiasi penonton yang santun menyemangati teman yang berani tampil di depan kelas."
          },
          {
            id: 10,
            question: "Menirukan suara kodok bernyanyi saat hujan turun di kolam adalah...",
            options: ["Krik... krik... / Tet-ot... tet-ot...", "Meong... meong...", "Petok... petok...", "Guk... guk..."],
            correctIndex: 0,
            explanation: "Suara kodok di kolam air khas dengan bunyi riang tet-ot tet-ot atau kung-kong."
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
