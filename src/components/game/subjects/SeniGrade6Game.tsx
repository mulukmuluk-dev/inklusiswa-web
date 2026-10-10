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

interface SeniGrade6GameProps {
  levelId: number;
  onLevelComplete: (levelId: number, starsEarned: number) => void;
  accessibilityMode?: string;
}

export function SeniGrade6Game({ levelId, onLevelComplete, accessibilityMode }: SeniGrade6GameProps) {
  const [phase, setPhase] = useState<"materi" | "game">("materi");

  // Phase 1 interactive states
  const [activePoster, setActivePoster] = useState<{ element: string; requirement: string }>({
    element: "Slogan Persuasif",
    requirement: "Kalimat singkat, padat, berima, dan mudah diingat masyarakat.",
  });
  const [activeSongPart, setActiveSongPart] = useState<{ part: string; function: string }>({
    part: "Intro (Pengantar)",
    function: "Melodi pembuka lagu sebelum vokal masuk untuk membangun suasana.",
  });
  const [activeStageCraft, setActiveStageCraft] = useState<{ area: string; role: string }>({
    area: "Tata Panggung & Properti",
    role: "Dekorasi latar belakang visual yang menggambarkan waktu dan lokasi cerita tarian.",
  });
  const [activeCrewRole, setActiveCrewRole] = useState<{ team: string; task: string }>({
    team: "Tata Lampu (Lighting)",
    task: "Mengatur pencahayaan panggung, sorot fokus karakter (spotlight), dan atmosfer emosi.",
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
            KELAS 6 SD • LEVEL {levelId} dari 4
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
                  Pembuatan Poster & Patung 3D:
                </span>
                <div className="grid grid-cols-3 gap-2 w-full text-xs">
                  {[
                    { element: "Poster Persuasif", requirement: "Perpaduan gambar menarik dan tulisan ajakan yang mencolok mata." },
                    { element: "Arsiran Gelap-Terang", requirement: "Goresan garis pensil rapat/renggang menciptakan efek volume 3 dimensi." },
                    { element: "Memahat Sabun", requirement: "Teknik mengurangi bahan menggunakan pisau tumpul/alat ukir sederhana." },
                  ].map((p) => (
                    <button
                      key={p.element}
                      type="button"
                      onClick={() => {
                        setActivePoster(p);
                        playPopSound();
                        speakGlobal(`${p.element}: ${p.requirement}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activePoster.element === p.element ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-xs">{p.element}</strong>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong>{activePoster.element}: </strong>{activePoster.requirement}
                </div>
              </div>
            )}

            {levelId === 2 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Struktur Lagu & Musik Ansambel:
                </span>
                <div className="grid grid-cols-4 gap-1.5 w-full text-xs">
                  {[
                    { part: "Intro", function: "Melodi pengantar pembuka lagu." },
                    { part: "Verse", function: "Bait lirik utama pembangun alur cerita." },
                    { part: "Chorus (Reff)", function: "Puncak inti pesan lagu yang diulang." },
                    { part: "Coda", function: "Bagian melodi penutup ekor lagu." },
                  ].map((s) => (
                    <button
                      key={s.part}
                      type="button"
                      onClick={() => {
                        setActiveSongPart(s);
                        playPopSound();
                        speakGlobal(`Bagian ${s.part}: ${s.function}`);
                      }}
                      className={`p-2 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeSongPart.part === s.part ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-[11px]">{s.part}</strong>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong>Bagian {activeSongPart.part}: </strong>{activeSongPart.function}
                </div>
              </div>
            )}

            {levelId === 3 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Manajemen Panggung Tari Tradisi:
                </span>
                <div className="grid grid-cols-3 gap-2 w-full text-xs">
                  {[
                    { area: "Tata Panggung", role: "Dekorasi latar belakang artistik yang membangun atmosfer cerita tarian." },
                    { area: "Iringan Musik", role: "Penyelarasan ritme gerak dengan alunan gamelan/tabuhan tradisi." },
                    { area: "Kostum & Aksesori", role: "Kain batik, mahkota jamang, dan pending emas yang mempertegas estetika." },
                  ].map((item) => (
                    <button
                      key={item.area}
                      type="button"
                      onClick={() => {
                        setActiveStageCraft(item);
                        playPopSound();
                        speakGlobal(`${item.area}: ${item.role}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeStageCraft.area === item.area ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-xs">{item.area}</strong>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong>{activeStageCraft.area}: </strong>{activeStageCraft.role}
                </div>
              </div>
            )}

            {levelId === 4 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Manajemen Produksi Pementasan Teater:
                </span>
                <div className="grid grid-cols-3 gap-2 w-full text-xs">
                  {[
                    { team: "Tata Suara (Audio)", task: "Mengatur kejernihan mikrofon dan efek suara pendukung suasana adegan." },
                    { team: "Tata Lampu (Lighting)", task: "Menyorot titik fokus aktor dan mengubah warna cahaya sesuai emosi cerita." },
                    { team: "Pimpinan Panggung", task: "Mengoordinasikan keluar masuk pemain dan pergantian properti secara tepat." },
                  ].map((t) => (
                    <button
                      key={t.team}
                      type="button"
                      onClick={() => {
                        setActiveCrewRole(t);
                        playPopSound();
                        speakGlobal(`Tim ${t.team}: ${t.task}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeCrewRole.team === t.team ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-xs">{t.team}</strong>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong>{activeCrewRole.team}: </strong>{activeCrewRole.task}
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
        title: "Seni Rupa: Poster Persuasif, Arsiran Gelap-Terang, dan Seni Patung",
        conceptText: "Poster persuasif dirancang untuk mengajak masyarakat berbuat positif (menjaga lingkungan, rajin membaca) menggunakan slogan menarik dan gambar kontras. Gambar bentuk memanfaatkan teknik arsir gelap-terang (gradasi bayangan). Seni patung 3D dibuat dengan teknik memahat bahan lunak (sabun batangan), membutsir plastisin, atau mengecor gips.",
        questions: [
          {
            id: 1,
            question: "Karya seni rupa terapan yang memadukan gambar mencolok dan teks slogan ajakan untuk dipasang di tempat umum disebut...",
            options: ["Poster", "Sketsa pensil", "Buku novel", "Notasi partitur"],
            correctIndex: 0,
            explanation: "Poster dipasang di tempat strategis untuk menyampaikan pesan persuasif secara cepat dan menarik."
          },
          {
            id: 2,
            question: "Ciri kalimat slogan yang baik dan efektif pada sebuah poster lingkungan adalah...",
            options: ["Singkat, padat, mudah diingat, dan bersifat mengajak (persuasif)", "Sangat panjang hingga berparagraf-paragraf", "Menggunakan bahasa asing yang sulit dipahami", "Berupa deretan angka rumit"],
            correctIndex: 0,
            explanation: "Kalimat poster harus lugas dan menggugah kesadaran masyarakat dalam sekali baca."
          },
          {
            id: 3,
            question: "Teknik membuat bayangan gelap-terang pada gambar bentuk dengan menggoreskan garis-garis pensil sejajar atau menyilang disebut teknik...",
            options: ["Arsir (hatching / cross-hatching)", "Cetak saring", "Kolase daun", "Pewarnaan wantex"],
            correctIndex: 0,
            explanation: "Teknik arsir mengatur kerapatan garis pensil untuk memunculkan ilusi kedalaman bayangan dan volume objek 3D."
          },
          {
            id: 4,
            question: "Teknik membuat patung dengan cara mengurangi bagian bahan secara perlahan menggunakan pisau ukir kecil pada sabun batangan dinamakan...",
            options: ["Teknik memahat (carving)", "Teknik mencetak (cor)", "Teknik merakit", "Teknik anyaman"],
            correctIndex: 0,
            explanation: "Memahat adalah teknik subtraktif (mengurangi) bahan padat hingga diperoleh wujud patung yang diinginkan."
          },
          {
            id: 5,
            question: "Teknik membutsir dalam pembuatan patung tanah liat atau plastisin dilakukan dengan cara...",
            options: ["Menambah dan mengurangi bahan sedikit demi sedikit menggunakan sudip butsir", "Membakar bahan hingga meleleh", "Memotong bahan dengan gergaji mesin", "Menghancurkan bahan hingga bubuk"],
            correctIndex: 0,
            explanation: "Butsir adalah alat bantu pembentuk patung berbahan lunak dengan menambah dan mengurangi massa."
          },
          {
            id: 6,
            question: "Teknik mencetak patung dengan menuangkan adonan cair (seperti bubur gips atau semen putih) ke dalam cetakan cetak dinamakan teknik...",
            options: ["Pengecoran (teknik cor / casting)", "Teknik jahit", "Teknik sulam", "Teknik batik tulis"],
            correctIndex: 0,
            explanation: "Teknik cor menuangkan bahan cair ke dalam rongga cetakan negatif hingga mengeras menjadi patung utuh."
          },
          {
            id: 7,
            question: "Karya seni patung digolongkan ke dalam karya seni rupa tiga dimensi murni karena...",
            options: ["Memiliki volume panjang, lebar, dan tinggi serta dapat dinikmati dari berbagai sudut pandang", "Hanya bisa dilihat dari arah depan saja", "Digambar di atas selembar kertas tipis", "Hanya berupa garis lurus"],
            correctIndex: 0,
            explanation: "Patung memiliki massa ruang nyata tiga dimensi yang dapat disentuh dan dinikmati dari segala arah."
          },
          {
            id: 8,
            question: "Kombinasi warna yang paling tepat untuk teks dan latar belakang poster agar mudah terbaca dari kejauhan adalah...",
            options: ["Kontras tinggi (misal tulisan kuning emas di atas latar biru gelap)", "Warna sama-sama samar (tulisan abu-abu di atas putih)", "Warna gelap di atas gelap", "Warna transparan"],
            correctIndex: 0,
            explanation: "Kontras warna yang kuat memastikan keterbacaan (legibility) teks poster tetap jelas dari jarak jauh."
          },
          {
            id: 9,
            question: "Alat sederhana yang aman digunakan siswa kelas 6 untuk mengukir miniatur hewan dari sabun mandi batangan adalah...",
            options: ["Sudip kayu atau pisau plastisin tumpul", "Gergaji mesin besar", "Kapak besi tajam", "Palu godam"],
            correctIndex: 0,
            explanation: "Sudip kayu tumpul atau tusuk gigi tebal aman digunakan anak untuk mengukir sabun mandi batangan."
          },
          {
            id: 10,
            question: "Pesan moral pada poster bertema kebangsaan 'Cintailah Produk Buatan Indonesia' bertujuan untuk...",
            options: ["Menumbuhkan kebanggaan nasional dan memajukan perekonomian bangsa", "Menolak berteman dengan orang asing", "Melarang orang bepergian", "Mengharuskan hidup serba hemat"],
            correctIndex: 0,
            explanation: "Membeli produk dalam negeri memperkuat kedaulatan ekonomi dan wujud nyata cinta tanah air."
          }
        ]
      };

    case 2:
      return {
        title: "Seni Musik: Struktur Lagu dan Musik Ansambel Campuran",
        conceptText: "Struktur bentuk lagu terdiri atas: Intro (pembuka), Verse (bait cerita), Chorus / Reff (inti lagu), Bridge (jembatan transisi), dan Coda (ekor penutup). Ansambel musik campuran memadukan instrumen ritmis (tamborin, kendang), melodis (rekorder, pianika), dan harmonis (gitar akustik, keyboard) dalam kesatuan orkestrasi.",
        questions: [
          {
            id: 1,
            question: "Bagian melodi pembuka yang dimainkan sebelum vokal penyanyi masuk pada sebuah lagu disebut...",
            options: ["Intro (introduksi)", "Coda", "Chorus", "Verse"],
            correctIndex: 0,
            explanation: "Intro berfungsi mempersiapkan pendengar dan memberi patokan nada dasar serta tempo bagi penyanyi."
          },
          {
            id: 2,
            question: "Bagian lagu yang memuat puncak emosi dan inti pesan utama yang biasanya diulang-ulang disebut...",
            options: ["Chorus / Refrain (Reff)", "Intro", "Interlude", "Coda"],
            correctIndex: 0,
            explanation: "Refrain atau chorus adalah bagian lagu yang paling mudah diingat dan menjadi klimaks pesan lagu."
          },
          {
            id: 3,
            question: "Bagian penutup melodi di akhir lagu yang menandai lagu telah selesai dinamakan...",
            options: ["Coda (ekor lagu)", "Verse pertama", "Intro", "Bridge"],
            correctIndex: 0,
            explanation: "Coda adalah bagian akhir penutup lagu yang mengantarkan alunan musik menuju hening penyelesaian."
          },
          {
            id: 4,
            question: "Penyajian musik secara bersama-sama dengan menggunakan gabungan berbagai jenis instrumen musik (ritmis, melodis, harmonis) dinamakan...",
            options: ["Ansambel musik campuran", "Konser solo tunggal", "Monolog vokal", "Kidung tunggal"],
            correctIndex: 0,
            explanation: "Ansambel campuran memadukan instrumen gesek, tiup, petik, dan pukul dalam harmoni padu."
          },
          {
            id: 5,
            question: "Alat musik yang berfungsi memainkan akor pengiring dan menghasilkan harmoni paduan nada sekaligus adalah alat musik...",
            options: ["Harmonis (seperti gitar dan keyboard)", "Ritmis murni", "Tiup bersiul", "Peluit wasit"],
            correctIndex: 0,
            explanation: "Instrumen harmonis dapat membunyikan beberapa nada secara serentak membentuk akor pengiring melodi."
          },
          {
            id: 6,
            question: "Bagian melodi peralihan tanpa vokal yang menghubungkan bait verse menuju chorus di tengah lagu disebut...",
            options: ["Interlude", "Outro", "Judul lagu", "Bait pertama"],
            correctIndex: 0,
            explanation: "Interlude adalah selingan instrumen di tengah lagu sebelum memasuki bait atau reff berikutnya."
          },
          {
            id: 7,
            question: "Dalam kelompok musik ansambel sekolah, pemain pianika dan rekorder berperan membawakan fungsi...",
            options: ["Melodi utama lagu (instrumen melodis)", "Hanya pengatur ketukan birama", "Penyanyi latar bisu", "Penonton konser"],
            correctIndex: 0,
            explanation: "Pianika dan rekorder bertugas memainkan untaian melodi lagu yang selaras dengan vokal."
          },
          {
            id: 8,
            question: "Orang yang memimpin sebuah grup paduan suara atau orkestra musik di depan panggung dinamakan...",
            options: ["Dirigen (konduktor)", "Sutradara film", "Kameramen", "Kurator seni"],
            correctIndex: 0,
            explanation: "Dirigen memimpin tempo, dinamika suara, dan ekspresi kelompok musik melalui isyarat tangan dan tongkat baton."
          },
          {
            id: 9,
            question: "Faktor terpenting dalam keberhasilan pertunjukan ansambel musik gabungan adalah...",
            options: ["Keseimbangan volume antarinstrumen dan kedisiplinan menjaga tempo bersama", "Bermain sekeras mungkin agar instrumen lain tenggelam", "Masing-masing bermain dengan tempo berbeda", "Berhenti sebelum lagu selesai"],
            correctIndex: 0,
            explanation: "Harmoni ansambel terwujud bila tidak ada instrumen yang mendominasi berlebihan dan tempo terjaga stabil."
          },
          {
            id: 10,
            question: "Lagu daerah Maluku 'Rasa Sayange' memiliki struktur pantun berbalas yang dinyanyikan dengan tempo...",
            options: ["Moderato (sedang riang gembira)", "Largo (sangat lambat sedih)", "Grave (berat)", "Adagio"],
            correctIndex: 0,
            explanation: "Rasa Sayange dinyanyikan secara riang gembira dengan tempo sedang untuk mengungkapkan rasa kasih sayang dan persaudaraan."
          }
        ]
      };

    case 3:
      return {
        title: "Seni Tari: Tari Kreasi Utuh, Iringan Tradisi, dan Tata Panggung",
        conceptText: "Menyajikan tari kreasi tunggal atau kelompok dalam skala utuh memadukan unsur: wiraga (teknik gerak), wirama (ketepatan ketukan musik gamelan/tradisi), wirasa (penjiwaan karakter), tata rias busana, properti panggung, serta tata artistik panggung yang memukau penonton.",
        questions: [
          {
            id: 1,
            question: "Tiga unsur pokok (tiga W) yang wajib dikuasai seorang penari dalam seni tari tradisional nusantara adalah...",
            options: ["Wiraga, Wirama, dan Wirasa", "Wicara, Wacana, dan Warta", "Warna, Wujud, dan Waktu", "Wajah, Wadah, dan Warga"],
            correctIndex: 0,
            explanation: "Wiraga adalah keterampilan gerak raga, Wirama adalah ketepatan irama musik, dan Wirasa adalah penjiwaan batiniah."
          },
          {
            id: 2,
            question: "Tarian yang diciptakan dan dibawakan oleh seorang penari saja dari awal hingga akhir pertunjukan disebut tari...",
            options: ["Tari tunggal (solo)", "Tari berpasangan (duet)", "Tari massal kelompok", "Tari kolosal"],
            correctIndex: 0,
            explanation: "Tari tunggal menuntut kekuatan karakter, stamina fisik, dan penguasaan panggung yang mandiri."
          },
          {
            id: 3,
            question: "Tari Klana Topeng dari Jawa menggambarkan raja yang berwatak gagah dan angkuh. Ciri khas properti yang dikenakan penari adalah...",
            options: ["Topeng kayu berwajah merah dengan kumis tebal melintang", "Kipas kertas", "Piring porselen", "Payung renda"],
            correctIndex: 0,
            explanation: "Wajah topeng merah menyala dengan mata melotot melambangkan watak raja Klana Sewandana yang berangasan dan gagah."
          },
          {
            id: 4,
            question: "Latar belakang visual di panggung pertunjukan tari yang menggambarkan suasana alam (seperti lukisan candi atau hutan) disebut...",
            options: ["Setting / backdrop panggung", "Kain kafan", "Layar tancap bioskop", "Papan pengumuman"],
            correctIndex: 0,
            explanation: "Backdrop panggung memperkuat latar tempat dan waktu berlangsungnya cerita dalam pertunjukan tari."
          },
          {
            id: 5,
            question: "Iringan tari internal adalah musik pengiring yang bunyinya dihasilkan dari tubuh penari itu sendiri, contohnya adalah...",
            options: ["Tepukan tangan, petikan jari, dan nyanyian vokal penari Tari Saman", "Alunan rekaman kaset tape", "Petikan biola di luar panggung", "Gesekan cello pemusik"],
            correctIndex: 0,
            explanation: "Iringan internal bersumber langsung dari tepukan dada, paha, dan syair yang dilantunkan para penari."
          },
          {
            id: 6,
            question: "Sebaliknya, iringan tari eksternal adalah iringan musik yang berasal dari...",
            options: ["Pemain musik atau rekaman instrumen di luar gerakan penari", "Tepukan tangan penari sendiri", "Hentakan kaki penari", "Suara napas penari"],
            correctIndex: 0,
            explanation: "Iringan eksternal dimainkan oleh kelompok nayaga/pemain musik gamelan di samping panggung."
          },
          {
            id: 7,
            question: "Desain lantai tari yang simetris memberikan kesan panggung yang terasa...",
            options: ["Kokoh, seimbang, tenang, dan formal", "Goyah dan runtuh", "Kacau balau", "Lucu menggelikan"],
            correctIndex: 0,
            explanation: "Komposisi pola lantai simetris memberikan rasa ketertiban, keseimbangan, dan keagungan ritual."
          },
          {
            id: 8,
            question: "Aksesoris kepala penari wanita Jawa yang berbentuk hiasan rambut melengkung ke atas berhiaskan bunga melati dinamakan...",
            options: ["Cunduk mentul dan ronce melati", "Topi koboi", "Bando plastik", "Peci hitam"],
            correctIndex: 0,
            explanation: "Cunduk mentul dipasang di sanggul penari dan bergoyang lembut mengikuti gerak kepala penari."
          },
          {
            id: 9,
            question: "Peran kostum tari yang membedakan satu karakter ksatria dengan karakter raksasa terlihat jelas pada...",
            options: ["Warna kain, corak motif, dan bentuk hiasan kepala", "Bahan benang jahit yang tidak terlihat", "Harga kain di pasar", "Merk benang"],
            correctIndex: 0,
            explanation: "Ksatria berbusana kain prada halus, sedangkan raksasa mengenakan busana bercorak garang dan mencolok."
          },
          {
            id: 10,
            question: "Sikap penari yang paling penting saat menyajikan tari kelompok berskala utuh adalah...",
            options: ["Menjaga kebersamaan rasa, saling mengontrol tempo, dan rendah hati", "Mementingkan diri sendiri agar paling menonjol", "Mengejek penari lain yang keliru", "Menolak latihan bersama"],
            correctIndex: 0,
            explanation: "Keindahan tari kelompok lahir dari keharmonisan kolektif yang dipupuk dengan kerendahan hati dan latihan tekun."
          }
        ]
      };

    case 4:
      return {
        title: "Seni Teater: Manajemen Produksi dan Pementasan Drama",
        conceptText: "Pementasan drama berskala utuh membutuhkan kerja sama tim produksi: Sutradara, Pimpinan Panggung (Stage Manager), Tim Tata Panggung (Artistik), Tata Lampu (Lighting), Tata Suara (Sound), dan Tata Busana/Rias. Tahapan produksi meliputi membaca naskah (reading), blocking adegan, gladi resik, hingga pementasan di hadapan publik.",
        questions: [
          {
            id: 1,
            question: "Tahap awal latihan teater di mana seluruh pemeran duduk bersama membaca dan membedah dialog naskah disebut tahap...",
            options: ["Reading (pembacaan naskah)", "Gladi resik panggung", "Pentas perdana", "Pemberian penghargaan"],
            correctIndex: 0,
            explanation: "Tahap reading membedah karakter tokoh, latar cerita, dan memastikan artikulasi dialog tepat sebelum bergerak di panggung."
          },
          {
            id: 2,
            question: "Latihan menyeluruh di atas panggung dengan tata lampu, kostum lengkap, dan properti persis seperti pementasan sesungguhnya dinamakan...",
            options: ["Gladi resik (general rehearsal)", "Latihan pemanasan otot", "Ujian sekolah", "Rapat anggaran"],
            correctIndex: 0,
            explanation: "Gladi resik memastikan seluruh unsur artistik dan teknis berjalan sempurna tanpa kendala sebelum ditonton publik."
          },
          {
            id: 3,
            question: "Petugas yang bertanggung jawab mengatur sorotan cahaya lampu panggung, warna gel cahaya, dan efek kegelapan pementasan adalah tim...",
            options: ["Tata lampu (lighting designer)", "Tata boga makanan", "Keamanan parkir", "Penjual tiket"],
            correctIndex: 0,
            explanation: "Tata lampu menghidupkan suasana waktu (siang/malam), cuaca (badai), serta mengarahkan fokus perhatian penonton (spotlight)."
          },
          {
            id: 4,
            question: "Orang yang bertanggung jawab memimpin seluruh kelancaran di belakang panggung saat pementasan berlangsung dinamakan...",
            options: ["Pimpinan panggung (stage manager)", "Pemeran utama", "Penonton baris depan", "Penyiar berita"],
            correctIndex: 0,
            explanation: "Stage manager mengatur keluar masuk aktor, kesiapan properti panggung, dan aba-aba aba-aba teknis selama pementasan."
          },
          {
            id: 5,
            question: "Fungsi tata musik dan efek suara (sound effect) dalam pementasan drama teater adalah untuk...",
            options: ["Membangun emosi ketegangan, kesedihan, atau kegembiraan adegan", "Memekakkan telinga penonton", "Menutupi suara aktor utama", "Mengusir penonton pulang"],
            correctIndex: 0,
            explanation: "Musik dan efek bunyi memperkuat daya dramatis cerita sehingga penonton hanyut dalam suasana lakon."
          },
          {
            id: 6,
            question: "Ketika lampu panggung padam total secara perlahan menandai berakhirnya suatu babak cerita, istilah teaternya adalah...",
            options: ["Blackout (padam gelap)", "Spotlight terang", "Intro lagu", "Kanon vokal"],
            correctIndex: 0,
            explanation: "Blackout digunakan untuk mengganti properti panggung atau menandai perpindahan babak/waktu cerita."
          },
          {
            id: 7,
            question: "Tema pementasan teater bertema kelestarian lingkungan dapat mengisahkan tentang...",
            options: ["Perjuangan warga desa menyelamatkan hutan dari penebang liar", "Kisah persaingan belanja barang mewah", "Pamer gawai telepon pintar", "Bermain gim komputer seharian"],
            correctIndex: 0,
            explanation: "Tema lingkungan menumbuhkan kepedulian ekologis generasi muda terhadap hutan dan bumi kita."
          },
          {
            id: 8,
            question: "Sesi penghormatan terakhir di mana seluruh aktor dan tim panggung maju bersama memberi hormat kepada penonton di akhir pentas disebut...",
            options: ["Curtain call (penghormatan panggung)", "Blackout", "Reading naskah", "Audisi pemain"],
            correctIndex: 0,
            explanation: "Curtain call adalah momen bahagia saat seluruh pendukung pertunjukan menerima tepuk tangan apresiasi penonton."
          },
          {
            id: 9,
            question: "Buku kecil atau selembar pamflet yang dibagikan kepada penonton berisi sinopsis cerita dan daftar nama pemeran drama disebut...",
            options: ["Buku panduan pementasan (program book / leaflet)", "Buku rapor", "Kamus bahasa", "Koran harian"],
            correctIndex: 0,
            explanation: "Program book membantu penonton memahami sinopsis lakon serta mengapresiasi nama-nama kru dan aktor yang tampil."
          },
          {
            id: 10,
            question: "Nilai luhur terbesar yang didapatkan siswa melalui penyelenggaraan produksi teater bersama di sekolah adalah melatih...",
            options: ["Gotong royong, tanggung jawab, disiplin waktu, dan apresiasi karya bersama", "Sikap egois dan ingin terkenal sendiri", "Suka menyalahkan orang lain", "Meninggalkan tugas sekolah"],
            correctIndex: 0,
            explanation: "Teater adalah seni kolaborasi paripurna yang menyatukan berbagai talenta dalam satu tujuan karya bersama."
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
