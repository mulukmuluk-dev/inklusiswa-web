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

interface SeniGrade5GameProps {
  levelId: number;
  onLevelComplete: (levelId: number, starsEarned: number) => void;
  accessibilityMode?: string;
}

export function SeniGrade5Game({ levelId, onLevelComplete, accessibilityMode }: SeniGrade5GameProps) {
  const [phase, setPhase] = useState<"materi" | "game">("materi");

  // Phase 1 interactive states
  const [activeIllustration, setActiveIllustration] = useState<{ kind: string; desc: string }>({
    kind: "Komik Pendek",
    desc: "Rangkaian gambar berurutan yang dilengkapi balon kata untuk menyampaikan cerita humor/edukatif.",
  });
  const [activePenta, setActivePenta] = useState<{ scale: string; tones: string; mood: string }>({
    scale: "Pelog",
    tones: "1 - 3 - 4 - 5 - 7 (Do - Mi - Fa - Sol - Si)",
    mood: "Suasana tenang, hikmat, dan damai khas gamelan Jawa & Bali.",
  });
  const [activeCostume, setActiveCostume] = useState<{ element: string; function: string }>({
    element: "Tata Rias Karakter",
    function: "Mengubah wajah penari menjadi gagah, anggun, atau lucu sesuai watak tarian.",
  });
  const [activeStageArea, setActiveStageArea] = useState<{ zone: string; meaning: string }>({
    zone: "Center Stage (Tengah)",
    meaning: "Pusat perhatian utama penonton saat adegan klimaks atau monolog penting.",
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
                  Ragam Ilustrasi & Batik Jumputan:
                </span>
                <div className="grid grid-cols-3 gap-2 w-full text-xs">
                  {[
                    { kind: "Komik", desc: "Urutan gambar berbalon kata bercerita secara berkesinambungan." },
                    { kind: "Karikatur", desc: "Gambar melebih-lebihkan ciri khas tubuh tokoh untuk pesan sindiran/humor." },
                    { kind: "Batik Jumputan", desc: "Kain putih diikat kencang dengan kelereng lalu dicelup cairan pewarna." },
                  ].map((item) => (
                    <button
                      key={item.kind}
                      type="button"
                      onClick={() => {
                        setActiveIllustration(item);
                        playPopSound();
                        speakGlobal(`${item.kind}: ${item.desc}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeIllustration.kind === item.kind ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-xs">{item.kind}</strong>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong>{activeIllustration.kind}: </strong>{activeIllustration.desc}
                </div>
              </div>
            )}

            {levelId === 2 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Tangga Nada Pentatonis Tradisional:
                </span>
                <div className="grid grid-cols-2 gap-2 w-full text-xs">
                  {[
                    { scale: "Pelog", tones: "1 - 3 - 4 - 5 - 7 (Do-Mi-Fa-Sol-Si)", mood: "Suasana tenang, agung, dan khidmat (Gamelan Jawa & Bali)." },
                    { scale: "Slendro", tones: "1 - 2 - 3 - 5 - 6 (Do-Re-Mi-Sol-La)", mood: "Suasana riang, lincah, gembira, dan bersemangat." },
                  ].map((p) => (
                    <button
                      key={p.scale}
                      type="button"
                      onClick={() => {
                        setActivePenta(p);
                        playPopSound();
                        speakGlobal(`Pentatonis ${p.scale}. Nada: ${p.tones}. ${p.mood}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activePenta.scale === p.scale ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-xs">{p.scale}</strong>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong>Tangga Nada {activePenta.scale} ({activePenta.tones}): </strong>{activePenta.mood}
                </div>
              </div>
            )}

            {levelId === 3 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Tata Rias & Busana Tari Kepahlawanan:
                </span>
                <div className="grid grid-cols-3 gap-2 w-full text-xs">
                  {[
                    { element: "Tata Rias Gagah", function: "Garis alis tebal melengkung tajam dan kumis tegas melambangkan sifat prajurit." },
                    { element: "Busana Tradisi", function: "Kain dodot, ikat pinggang praba, dan rompi perang khas tarian kepahlawanan." },
                    { element: "Pola Zigzag", function: "Formasi penari berselang-seling memperlihatkan kelincahan strategi pertempuran." },
                  ].map((c) => (
                    <button
                      key={c.element}
                      type="button"
                      onClick={() => {
                        setActiveCostume(c);
                        playPopSound();
                        speakGlobal(`${c.element}: ${c.function}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeCostume.element === c.element ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-xs">{c.element}</strong>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong>{activeCostume.element}: </strong>{activeCostume.function}
                </div>
              </div>
            )}

            {levelId === 4 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Tata Panggung (Blocking) & Babak Drama:
                </span>
                <div className="grid grid-cols-3 gap-2 w-full text-xs">
                  {[
                    { zone: "Upstage (Belakang)", meaning: "Area panggung bagian belakang, jauh dari hadapan penonton." },
                    { zone: "Center Stage (Tengah)", meaning: "Titik pusat fokus perhatian untuk adegan inti yang menentukan alur." },
                    { zone: "Downstage (Depan)", meaning: "Area panggung terdekat dengan baris kursi penonton." },
                  ].map((z) => (
                    <button
                      key={z.zone}
                      type="button"
                      onClick={() => {
                        setActiveStageArea(z);
                        playPopSound();
                        speakGlobal(`${z.zone}: ${z.meaning}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeStageArea.zone === z.zone ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-xs">{z.zone}</strong>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong>{activeStageArea.zone}: </strong>{activeStageArea.meaning}
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
        title: "Seni Rupa: Gambar Ilustrasi, Batik Jumputan, dan Kriya Daur Ulang",
        conceptText: "Gambar ilustrasi memperjelas teks (kartun, karikatur, komik). Batik jumputan (ikat celup) dibuat dengan mengikat kelereng/batu kecil pada kain mori lalu mencelupkannya ke pewarna naptol/wantex. Seni kriya 3D dari bahan daur ulang memanfaatkan botol plastik, koran, dan kardus bekas menjadi karya fungsional.",
        questions: [
          {
            id: 1,
            question: "Karya gambar yang berfungsi memperjelas isi cerita, naskah narasi, atau artikel berita disebut gambar...",
            options: ["Ilustrasi", "Perspektif", "Mozaik", "Abstrak polos"],
            correctIndex: 0,
            explanation: "Gambar ilustrasi memperjelas, menghidupkan, dan memperindah suatu tulisan atau cerita naratif."
          },
          {
            id: 2,
            question: "Gambar ilustrasi yang melebih-lebihkan atau mendistorsi ciri fisik seseorang secara lucu untuk tujuan sindiran atau humor disebut...",
            options: ["Karikatur", "Komik strip", "Vignet hiasan", "Foto paspor"],
            correctIndex: 0,
            explanation: "Karikatur menonjolkan ciri fisik unik seseorang secara berlebihan dengan pesan jenaka atau kritik sosial."
          },
          {
            id: 3,
            question: "Teknik pembuatan batik dengan cara mengikat bagian kain secara kencang menggunakan karet atau tali rafia lalu mencelupkannya ke cairan pewarna disebut...",
            options: ["Batik jumputan (ikat celup)", "Batik tulis canting", "Batik cap tembaga", "Batik printing pabrik"],
            correctIndex: 0,
            explanation: "Bagian kain yang diikat erat tidak terkena zat pewarna sehingga menghasilkan motif lingkaran warna-warni yang indah."
          },
          {
            id: 4,
            question: "Gambar komik memiliki ciri khas percakapan tokoh yang diletakkan di dalam wadah teks bernama...",
            options: ["Balon kata (speech bubble)", "Garis horizon", "Titik hilang", "Pita lungsi"],
            correctIndex: 0,
            explanation: "Balon kata memuat dialog atau suara hati tokoh yang menghubungkan gambar dengan narasi."
          },
          {
            id: 5,
            question: "Bahan pengikat yang sering diletakkan di dalam kain saat membuat motif jumputan berbentuk lingkaran bunga adalah...",
            options: ["Kelereng, koin logam, atau batu kerikil", "Kertas tisu basah", "Garam halus", "Minyak goreng"],
            correctIndex: 0,
            explanation: "Benda padat seperti kelereng atau koin diikat erat untuk membentuk pola lingkaran mekar yang rapi."
          },
          {
            id: 6,
            question: "Contoh pembuatan seni kriya 3 dimensi dari bahan daur ulang ramah lingkungan adalah...",
            options: ["Membuat pot tanaman hias dari botol plastik bekas", "Menebang pohon hutan lindung", "Membeli patung marmer impor", "Membakar sampah plastik"],
            correctIndex: 0,
            explanation: "Mendaur ulang botol plastik menjadi pot hias menerapkan prinsip 3R (Reuse, Reduce, Recycle) yang ramah lingkungan."
          },
          {
            id: 7,
            question: "Gambar dekoratif pemanis yang disisipkan di sela-sela halaman kosong pada buku atau majalah dinamakan...",
            options: ["Vignet", "Karikatur", "Komik", "Poster"],
            correctIndex: 0,
            explanation: "Vignet adalah gambar ilustrasi dekoratif pengisi ruang kosong pada tata letak halaman buku."
          },
          {
            id: 8,
            question: "Teknik cetak saring sederhana (sablon) menggunakan alat berupa kain kasa berpori yang direntangkan pada bingkai kayu, yang disebut...",
            options: ["Screen sablon dan rakel", "Canting tulis", "Kuas cat air", "Gunting potong"],
            correctIndex: 0,
            explanation: "Screen kasa dan rakel karet digunakan untuk menyaputkan pasta tinta menembus pola cetak ke kain."
          },
          {
            id: 9,
            question: "Alat tradisional yang digunakan untuk menorehkan cairan malam panas saat membatik tulis adalah...",
            options: ["Canting", "Pena tinta", "Kuas lukis", "Sendok"],
            correctIndex: 0,
            explanation: "Canting memiliki cucuk corong kecil untuk mengalirkan lilin malam membentuk pola batik halus."
          },
          {
            id: 10,
            question: "Manfaat mengolah barang bekas menjadi karya seni kriya yang bernilai estetik adalah...",
            options: ["Mengurangi timbunan sampah lingkungan dan mengasah daya cipta", "Membuat rumah menjadi semakin kotor", "Menghabiskan uang jajan", "Mencemari air sumur"],
            correctIndex: 0,
            explanation: "Kriya daur ulang melatih kepedulian ekologis sekaligus memproduksi benda fungsional yang bernilai ekonomi."
          }
        ]
      };

    case 2:
      return {
        title: "Seni Musik: Tangga Nada Pentatonis dan Musik Tradisional",
        conceptText: "Tangga nada pentatonis hanya memiliki 5 nada pokok per oktaf. Dua laras pentatonis nusantara yang masyhur adalah Pelog (1-3-4-5-7, bernuansa tenang dan hikmat) dan Slendro (1-2-3-5-6, bernuansa lincah dan gembira). Selain itu, kita mempelajari alat musik tradisional seperti Angklung (Jawa Barat), Gamelan (Jawa/Bali), Kolintang (Minahasa), dan Tifa (Papua/Maluku).",
        questions: [
          {
            id: 1,
            question: "Tangga nada yang hanya menggunakan lima nada pokok dalam satu oktaf disebut tangga nada...",
            options: ["Pentatonis", "Diatonis", "Kromatis", "Mayor penuh"],
            correctIndex: 0,
            explanation: "Penta berarti lima; tangga nada pentatonis berbasis 5 nada pokok tanpa nada selingan."
          },
          {
            id: 2,
            question: "Dua laras tangga nada pentatonis yang digunakan dalam gamelan Jawa, Sunda, dan Bali adalah...",
            options: ["Laras Pelog dan Laras Slendro", "Laras Mayor dan Minor", "Laras Sopran dan Bass", "Laras Forte dan Piano"],
            correctIndex: 0,
            explanation: "Gamelan nusantara memiliki dua sistem tala laras utama: laras pelog dan laras slendro."
          },
          {
            id: 3,
            question: "Laras Slendro menghasilkan suasana musik yang terdengar...",
            options: ["Gembira, riang, lincah, dan bersemangat", "Sedih menangis", "Menyeramkan", "Monoton membosankan"],
            correctIndex: 0,
            explanation: "Slendro memiliki jarak interval yang relatif sama rata sehingga memancarkan nuansa riang ceria."
          },
          {
            id: 4,
            question: "Alat musik bambu dari Jawa Barat yang dibunyikan dengan cara digoyangkan (dianclung) dan diakui UNESCO adalah...",
            options: ["Angklung", "Sasando", "Kolintang", "Talempong"],
            correctIndex: 0,
            explanation: "Angklung terbuat dari tabung bambu yang menghasilkan nada merdu saat digetarkan."
          },
          {
            id: 5,
            question: "Alat musik perkusi melodis dari bilah-bilah kayu khas Minahasa, Sulawesi Utara yang dimainkan dengan pemukul berlapis kain adalah...",
            options: ["Kolintang", "Gamelan gong", "Calung bambu", "Tifa"],
            correctIndex: 0,
            explanation: "Kolintang adalah alat musik bilah kayu tradisional Minahasa yang memiliki jangkauan nada luas."
          },
          {
            id: 6,
            question: "Teknik bernyanyi berkelompok di mana kelompok kedua mulai bernyanyi beberapa ketukan menyusul kelompok pertama dengan melodi yang sama dinamakan...",
            options: ["Kanon (nyanyian susul-menyusul)", "Unisono satu suara", "Solo tunggal", "Paduan suara bisu"],
            correctIndex: 0,
            explanation: "Kanon adalah teknik vokal polifoni sederhana di mana melodi dinyanyikan bersahut-sahutan secara indah."
          },
          {
            id: 7,
            question: "Alat musik pukul tradisional menyerupai gendang kecil dari Papua dan Maluku yang terbuat dari kayu bulat berlapisan kulit binatang adalah...",
            options: ["Tifa", "Rebab", "Gambus", "Kecapi"],
            correctIndex: 0,
            explanation: "Tifa adalah instrumen ritmis khas Papua dan Maluku pengiring tarian adat dan upacara sakral."
          },
          {
            id: 8,
            question: "Laras Pelog umumnya menggunakan susunan lima nada pokok, yaitu...",
            options: ["1 - 3 - 4 - 5 - 7 (Ji - Lu - Pat - Mo - Pi)", "1 - 2 - 3 - 4 - 5", "2 - 4 - 6 - 7 - 1", "3 - 5 - 6 - 7 - 2"],
            correctIndex: 0,
            explanation: "Laras pelog Jawa memuat nada 1 (panunggul), 3 (dhadha), 4 (pelog), 5 (lima), dan 7 (barang)."
          },
          {
            id: 9,
            question: "Alat musik dawai tradisional dari Jawa Barat yang dimainkan dengan cara dipetik untuk mengiringi tembang Sunda adalah...",
            options: ["Kecapi", "Suling bambu", "Gong tiup", "Kendang"],
            correctIndex: 0,
            explanation: "Kecapi adalah alat musik dawai petik berdawai banyak yang melantunkan nada tembang Cianjuran/Sunda."
          },
          {
            id: 10,
            question: "Apresiasi yang patut kita berikan terhadap kekayaan alat musik tradisional nusantara adalah...",
            options: ["Mempelajari cara memainkannya dengan tekun dan bangga menampilkan kesenian daerah", "Mengejek musik daerah sebagai musik kuno", "Melarang pertunjukan gamelan", "Menolak mendengarkan lagu daerah"],
            correctIndex: 0,
            explanation: "Pelestarian seni tradisi dimulai dari rasa bangga dan kemauan generasi muda untuk memainkannya."
          }
        ]
      };

    case 3:
      return {
        title: "Seni Tari: Tari Kreasi Bertema Kepahlawanan dan Pola Lantai",
        conceptText: "Tari kreasi bertema kepahlawanan (patriotik) dibawakan dengan gerak gagah, tegas, dan penuh wibawa. Tata rias karakter dan busana prajurit mempertegas perwatakan. Tarian kelompok mengandalkan kekompakan formasi pola lantai variatif seperti garis diagonal, zigzag, dan lengkung kurva.",
        questions: [
          {
            id: 1,
            question: "Gerakan dalam tari bertema kepahlawanan (patriotik) biasanya memiliki sifat yang...",
            options: ["Tegas, gagah, dinamis, dan penuh semangat juang", "Lemah gemulai dan mengantuk", "Sedih berduka", "Lucu menggelikan"],
            correctIndex: 0,
            explanation: "Tema kepahlawanan menuntut dinamika gerak yang tangkas, sorot mata tajam, dan ketegasan tenaga."
          },
          {
            id: 2,
            question: "Properti yang sering digunakan dalam tarian bertema prajurit atau kepahlawanan antara lain...",
            options: ["Busur panah, pedang, tameng (perisai), atau tombak", "Piring porselen", "Kipas lipat sutra", "Payung renda"],
            correctIndex: 0,
            explanation: "Senjata tradisional seperti tameng dan tombak menjadi simbol pertahanan dan keberanian prajurit."
          },
          {
            id: 3,
            question: "Fungsi tata rias (make-up) karakter dalam pertunjukan seni tari adalah...",
            options: ["Mengubah tampilan wajah penari agar sesuai dengan watak tokoh yang ditarikan", "Membuat wajah penari terlihat putih pucat", "Agar penari tidak dikenali temannya", "Menghabiskan waktu rias"],
            correctIndex: 0,
            explanation: "Tata rias karakter mempertegas ekspresi wajah (misal rias ksatria gagah atau putri anggun)."
          },
          {
            id: 4,
            question: "Pola lantai zigzag terbentuk dari susunan garis lurus yang berbelok-belok, melambangkan...",
            options: ["Kelincahan, kewaspadaan, dan dinamika gerak yang tangkas", "Rasa putus asa", "Keheningan malam", "Ketidaksiapan perang"],
            correctIndex: 0,
            explanation: "Formasi zigzag penari mencerminkan strategi pergerakan taktis yang gesit di medan laga."
          },
          {
            id: 5,
            question: "Contoh tari bertema kepahlawanan dari Jawa Timur yang menggambarkan latihan ketangkasan prajurit berkuda adalah...",
            options: ["Tari Jaran Kepang (Kuda Lumping)", "Tari Pendet", "Tari Piring", "Tari Saman"],
            correctIndex: 0,
            explanation: "Tari Jaran Kepang menirukan atraksi barisan prajurit penunggang kuda yang gagah perkasa."
          },
          {
            id: 6,
            question: "Busana tari daerah yang serasi dan nyaman dikenakan berfungsi untuk...",
            options: ["Mendukung keleluasaan penari bergerak sekaligus memperkuat identitas budaya", "Membatasi gerak penari agar kaku", "Membuat penari kepanasan", "Menutupi panggung"],
            correctIndex: 0,
            explanation: "Kostum tari dirancang indah dan fungsional agar penari dapat bermanuver gerak secara optimal."
          },
          {
            id: 7,
            question: "Pola lantai garis melengkung seperti bentuk lengkung ular atau spiral dalam tarian kelompok memberikan kesan...",
            options: ["Mengalir, dinamis, dan saling menyatu erat", "Kaku dan terputus-putus", "Kasar dan menyerang", "Membingungkan"],
            correctIndex: 0,
            explanation: "Lengkungan kurva melambangkan kesinambungan gerak yang cair dan keharmonisan kolektif."
          },
          {
            id: 8,
            question: "Kekompakan (wiraga dan wirama) dalam tari kelompok dinilai dari...",
            options: ["Keserempakan ketukan gerak, ketepatan formasi pola lantai, dan keserasian penari", "Siapa yang paling tinggi melompat sendiri", "Siapa yang memakai baju paling mahal", "Penari yang paling cepat selesai"],
            correctIndex: 0,
            explanation: "Tari kelompok menuntut disiplin formasi dan keselarasan gerak bersama di setiap detik ketukan."
          },
          {
            id: 9,
            question: "Tari Cakalele dari Maluku adalah tarian perang tradisional yang dibawakan dengan membawa properti...",
            options: ["Parang (pedang) dan Salawaku (perisai)", "Piring kaca", "Kipas kertas", "Topeng badut"],
            correctIndex: 0,
            explanation: "Penari Cakalele memegang parang di tangan kanan dan salawaku di tangan kiri dengan teriakan pekik juang."
          },
          {
            id: 10,
            question: "Rasa penjiwaan batiniah yang diwujudkan penari lewat sorot mata dan mimik muka sesuai tema tarian disebut unsur...",
            options: ["Wirasa (penghayatan rasa)", "Wiraga (gerak tubuh)", "Wirama (ketukan musik)", "Wicara (kata-kata)"],
            correctIndex: 0,
            explanation: "Wirasa adalah penghayatan rasa dan emosi batin yang terpancar kuat dari ekspresi penari."
          }
        ]
      };

    case 4:
      return {
        title: "Seni Teater: Naskah Cerita Pengalaman dan Teknik Blocking",
        conceptText: "Menulis naskah drama satu babak dapat diangkat dari pengalaman pribadi atau kehidupan sekolah. Aktor harus menguasai teknik blocking panggung (tata letak gerak: upstage, center stage, downstage) agar tidak menumpuk di satu sisi, serta mampu berimprovisasi dialog secara alami.",
        questions: [
          {
            id: 1,
            question: "Pengaturan posisi berdiri, perpindahan tempat, dan arah hadap pemeran di atas panggung disebut...",
            options: ["Blocking panggung (tata gerak)", "Pola birama", "Kostum peran", "Sinopsis naskah"],
            correctIndex: 0,
            explanation: "Blocking mengatur pergerakan aktor agar komposisi visual panggung seimbang dan enak ditonton."
          },
          {
            id: 2,
            question: "Area panggung yang berada paling dekat dengan penonton disebut area...",
            options: ["Downstage (panggung depan)", "Upstage (panggung belakang)", "Backstage (belakang layar)", "Wings (sayap panggung)"],
            correctIndex: 0,
            explanation: "Downstage adalah bagian panggung yang berada paling depan dekat dengan deretan bangku penonton."
          },
          {
            id: 3,
            question: "Bagian panggung paling tengah yang menjadi titik pusat perhatian utama (fokus visual) penonton dinamakan...",
            options: ["Center stage (tengah panggung)", "Sayap kanan", "Kamar rias", "Pintu masuk panggung"],
            correctIndex: 0,
            explanation: "Center stage memiliki daya tarik visual terkuat di panggung untuk adegan monolog atau klimaks."
          },
          {
            id: 4,
            question: "Tindakan pemeran yang menutupi tubuh pemeran lain dari pandangan penonton di atas panggung disebut kesalahan...",
            options: ["Memblocking lawan main (menutupi)", "Proyeksi suara", "Improvisasi cerdas", "Vokal prima"],
            correctIndex: 0,
            explanation: "Aktor tidak boleh menghalangi (menutupi) lawan mainnya agar semua tokoh tetap terlihat penonton."
          },
          {
            id: 5,
            question: "Kemampuan pemain menciptakan ucapan atau gerak spontan yang selaras dengan situasi cerita tanpa naskah tertulis disebut...",
            options: ["Improvisasi", "Monolog baku", "Hafalan kaku", "Pantomim bisu"],
            correctIndex: 0,
            explanation: "Improvisasi menghidupkan adegan secara spontan dan menyelamatkan pementasan jika lawan main lupa dialog."
          },
          {
            id: 6,
            question: "Tahap dalam naskah drama saat masalah antartokoh mencapai puncak ketegangan tertinggi dinamakan...",
            options: ["Klimaks cerita", "Eksposisi pengenalan", "Resolusi penyelesaian", "Epilog penutup"],
            correctIndex: 0,
            explanation: "Klimaks adalah titik balik peristiwa ketika perselisihan antartokoh mencapai ketegangan paling seru."
          },
          {
            id: 7,
            question: "Petunjuk lakuan dan suasana yang ditulis di dalam tanda kurung pada teks naskah drama disebut...",
            options: ["Kramagung (petunjuk teknis gerak)", "Nama tokoh", "Judul babak", "Daftar pemain"],
            correctIndex: 0,
            explanation: "Kramagung memberi arahan tingkah laku aktor, misal: (berjalan mondar-mandir sambil memegang kepala)."
          },
          {
            id: 8,
            question: "Tema naskah drama sekolah yang sangat baik untuk mengedukasi siswa sekolah dasar adalah tema...",
            options: ["Kejujuran, persahabatan sejati, dan tolong-menolong", "Perkelahian dan balas dendam", "Kekayaan materi berlebihan", "Kecurangan ujian"],
            correctIndex: 0,
            explanation: "Drama anak bertema persahabatan dan budi pekerti menanamkan nilai moral positif bagi penonton."
          },
          {
            id: 9,
            question: "Bagian panggung di sebelah kiri dan kanan yang tersembunyi dari pandangan penonton tempat pemain menunggu giliran masuk disebut...",
            options: ["Sayap panggung (wings / panggung samping)", "Layar depan", "Tengah panggung", "Balkon atas"],
            correctIndex: 0,
            explanation: "Sayap panggung menjadi tempat keluar-masuknya aktor dan pergantian properti secara rahasia."
          },
          {
            id: 10,
            question: "Sikap saling mendengar dan merespons emosi antarpemain teater saat beradu akting disebut...",
            options: ["Interaksi dan chemistry peran", "Persaingan panggung", "Egoisme akting", "Monolog bergantian"],
            correctIndex: 0,
            explanation: "Chemistry yang kuat lahir dari rasa saling percaya dan mendengarkan antarpemain di panggung."
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
