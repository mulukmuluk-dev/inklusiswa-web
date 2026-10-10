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

interface PancasilaGrade2GameProps {
  levelId: number;
  onLevelComplete: (levelId: number, starsEarned: number) => void;
  accessibilityMode?: string;
}

export function PancasilaGrade2Game({ levelId, onLevelComplete, accessibilityMode }: PancasilaGrade2GameProps) {
  const [phase, setPhase] = useState<"materi" | "game">("materi");

  // Phase 1 interactive states
  const [activeValue, setActiveValue] = useState<{ val: string; sample: string }>({ val: "Kejujuran", sample: "Mengakui kesalahan dan tidak berbohong kepada orang tua dan guru." });
  const [activeRuleType, setActiveRuleType] = useState<{ type: string; sample: string }>({ type: "Aturan Tertulis", sample: "Tata tertib sekolah, jadwal piket kelas, dan rambu lalu lintas." });
  const [activeDiversity, setActiveDiversity] = useState<{ form: string; note: string }>({ form: "Keragaman Suku", note: "Teman ada yang suku Jawa, Sunda, Batak, Minang, semua rukun bersatu." });
  const [activeNeighbor, setActiveNeighbor] = useState<{ role: string; desc: string }>({ role: "Rukun Tetangga (RT)", desc: "Menjaga keharmonisan dan gotong royong warga di lingkungan sekitar rumah." });

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
    setActiveValue({ val: "Kejujuran", sample: "Mengakui kesalahan dan tidak berbohong kepada orang tua dan guru." });
    setActiveRuleType({ type: "Aturan Tertulis", sample: "Tata tertib sekolah, jadwal piket kelas, dan rambu lalu lintas." });
    setActiveDiversity({ form: "Keragaman Suku", note: "Teman ada yang suku Jawa, Sunda, Batak, Minang, semua rukun bersatu." });
    setActiveNeighbor({ role: "Rukun Tetangga (RT)", desc: "Menjaga keharmonisan dan gotong royong warga di lingkungan sekitar rumah." });

    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setWrongAttempts(0);
    setShowClue(false);
    setIsCompleted(false);
    isProcessingRef.current = false;

    const data = getGrade2PancasilaData(levelId);
    setQuestionsList(shuffleQuestions(data));
    speakGlobal(data.conceptText);
  }, [levelId]);

  const levelData = getGrade2PancasilaData(levelId);
  const activeQuestions = questionsList.length > 0 ? questionsList : levelData.questions;
  const currentQ = activeQuestions[currentQuestionIndex] || activeQuestions[0];

  useEffect(() => {
    if (phase === "game" && !isCompleted && currentQ) {
      speakGlobal(`Pertanyaan nomor ${currentQuestionIndex + 1}. ${currentQ.question}`);
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
      speakGlobal("Hebat! Jawabanmu benar sekali! " + currentQ.explanation);

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
        speakGlobal("Petunjuk: " + currentQ.explanation);
      } else {
        speakGlobal("Belum tepat, coba teliti kembali.");
      }
      setTimeout(() => {
        setSelectedOption(null);
        setIsAnswerChecked(false);
        isProcessingRef.current = false;
      }, 1300);
    }
  };

  const handleFinishLevel = () => {
    const stars = score >= 9 ? 3 : score >= 7 ? 2 : 1;
    onLevelComplete(levelId, stars);
  };

  return (
    <div className="w-full flex flex-col items-center justify-between min-h-[560px] p-4 md:p-8 bg-[#FFE296] rounded-[32px] border-4 border-[#3C632A] text-[#3C632A] shadow-[8px_8px_0px_0px_#3C632A] relative overflow-hidden">
      
      {/* Header Info Level */}
      <div className="w-full flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="px-4 py-1.5 bg-[#7FD13B] text-white font-black text-xs md:text-sm rounded-xl border-2 border-[#3C632A]">
            KELAS 2 SD • LEVEL {levelId} dari 4
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

      {/* ================= FASE 1: LABORATORIUM KONSEP MATERI ================= */}
      {phase === "materi" ? (
        <div className="w-full max-w-2xl flex-1 flex flex-col items-center justify-between p-6 bg-white/80 border-4 border-[#3C632A] rounded-[28px] shadow-[6px_6px_0px_0px_#3C632A] my-2 text-center animate-in fade-in duration-300">
          <div className="space-y-4">
            <span className="px-4 py-1.5 bg-[#C3631D] text-[#FFDF59] font-black text-sm rounded-xl border-2 border-[#3C632A] uppercase tracking-wider">
              FASE 1: LABORATORIUM KONSEP MATERI
            </span>
            <p className="text-2xl md:text-3xl font-black text-[#3C632A] leading-relaxed pt-3">
              {levelData.conceptText}
            </p>
          </div>

          {/* Interactive Visualizer per Level */}
          <div className="my-4 p-4 bg-[#FFDF59] border-4 border-[#3C632A] rounded-2xl w-full flex items-center justify-center gap-3">
            {levelId === 1 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Nilai Luhur Pancasila:
                </span>
                <div className="grid grid-cols-3 gap-2 w-full text-xs">
                  {[
                    { val: "Kejujuran", sample: "Mengakui kesalahan dan tidak berbohong pada siapa pun." },
                    { val: "Tolong-menolong", sample: "Membantu teman dan anggota keluarga yang kesulitan." },
                    { val: "Musyawarah", sample: "Berdiskusi bersama keluarga untuk mencapai mufakat." },
                  ].map((v) => (
                    <button
                      key={v.val}
                      type="button"
                      onClick={() => {
                        setActiveValue(v);
                        playPopSound();
                        speakGlobal(`Nilai ${v.val}: ${v.sample}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeValue.val === v.val ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-xs">{v.val}</strong>
                    </button>
                  ))}
                </div>
                <div className="p-2 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong>{activeValue.val}: </strong>{activeValue.sample}
                </div>
              </div>
            )}

            {levelId === 2 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Jenis Aturan di Sekitar Kita:
                </span>
                <div className="grid grid-cols-2 gap-2 w-full text-xs">
                  {[
                    { type: "Aturan Tertulis", sample: "Tata tertib sekolah, jadwal piket kelas, rambu lalu lintas." },
                    { type: "Aturan Tidak Tertulis", sample: "Mengetuk pintu sebelum masuk, mengucap salam, berbicara santun." },
                  ].map((t) => (
                    <button
                      key={t.type}
                      type="button"
                      onClick={() => {
                        setActiveRuleType(t);
                        playPopSound();
                        speakGlobal(`${t.type}: contohnya ${t.sample}`);
                      }}
                      className={`p-3 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeRuleType.type === t.type ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-sm mb-1">{t.type}</strong>
                      <span className="text-xs opacity-90 block">{t.sample}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {levelId === 3 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Bhinneka Tunggal Ika di Sekolah:
                </span>
                <div className="grid grid-cols-3 gap-2 w-full text-xs">
                  {[
                    { form: "Suku Bangsa", note: "Jawa, Sunda, Batak, Minang, Dayak, Papua hidup rukun." },
                    { form: "Bahasa Daerah", note: "Bahasa daerah beraneka ragam disatukan Bahasa Indonesia." },
                    { form: "Agama & Ibadah", note: "Saling menghormati teman yang berbeda cara beribadahnya." },
                  ].map((d) => (
                    <button
                      key={d.form}
                      type="button"
                      onClick={() => {
                        setActiveDiversity(d);
                        playPopSound();
                        speakGlobal(`Keragaman ${d.form}: ${d.note}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeDiversity.form === d.form ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-xs">{d.form}</strong>
                    </button>
                  ))}
                </div>
                <div className="p-2 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong>{activeDiversity.form}: </strong>{activeDiversity.note}
                </div>
              </div>
            )}

            {levelId === 4 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Peduli Lingkungan & Kerukunan Warga:
                </span>
                <div className="grid grid-cols-3 gap-2 w-full text-xs">
                  {[
                    { role: "Denah Rumah", desc: "Mengenal letak rumah, jalan, dan arah ke sekolah." },
                    { role: "RT & RW", desc: "Rukun Tetangga dan Rukun Warga menjaga persatuan lingkungan." },
                    { role: "Tetangga", desc: "Menyapa dengan senyum dan saling berbagi makanan dengan tetangga." },
                  ].map((n) => (
                    <button
                      key={n.role}
                      type="button"
                      onClick={() => {
                        setActiveNeighbor(n);
                        playPopSound();
                        speakGlobal(`${n.role}: ${n.desc}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeNeighbor.role === n.role ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-xs">{n.role}</strong>
                    </button>
                  ))}
                </div>
                <div className="p-2 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong>{activeNeighbor.role}: </strong>{activeNeighbor.desc}
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
              ></div>
            </div>
          </div>

          {/* PERTANYAAN SOAL */}
          <div className="w-full bg-[#C3631D] text-[#FFDF59] border-4 border-[#3C632A] p-6 md:p-8 rounded-3xl text-center shadow-[6px_6px_0px_0px_#3C632A] mb-6">
            <p className="text-2xl md:text-3xl font-black leading-snug">
              {currentQ.question}
            </p>
            {currentQ.visualHelper && (
              <div className="mt-3 text-2xl font-black text-white bg-black/20 py-2 px-4 rounded-xl inline-block">
                {currentQ.visualHelper}
              </div>
            )}
            {showClue && (
              <div className="mt-3 p-2 bg-[#FFDF59] border-2 border-[#3C632A] rounded-xl text-xs font-bold text-[#3C632A] animate-in fade-in">
                💡 Petunjuk: {currentQ.explanation}
              </div>
            )}
          </div>

          {/* PILIHAN JAWABAN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-4">
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

function getGrade2PancasilaData(levelId: number): LevelConceptData {
  switch (levelId) {
    case 1:
      return {
        title: "Pancasila Dasar Negaraku",
        conceptText: "Pancasila memandu perilaku kita sehari-hari. Kita mengamalkan nilai kejujuran saat berbicara, gemar tolong-menolong kepada teman dan anggota keluarga, serta membiasakan musyawarah saat membuat keputusan bersama di rumah.",
        questions: [
          {
            id: 1,
            question: "Mengakui perbuatan salah dan berkata apa adanya tanpa berbohong merupakan contoh pengamalan nilai...",
            options: ["Kejujuran", "Keserakahan", "Ketidakpedulian", "Kecurangan"],
            correctIndex: 0,
            explanation: "Kejujuran adalah nilai mulia yang membuat kita dipercaya oleh orang tua, guru, dan teman."
          },
          {
            id: 2,
            question: "Simbol sila Pancasila yang bermakna bangsa Indonesia percaya dan bertakwa kepada Tuhan Yang Maha Esa adalah...",
            options: ["Bintang emas", "Rantai emas", "Kepala banteng", "Pohon beringin"],
            correctIndex: 0,
            explanation: "Bintang emas merupakan cahaya spiritual dari Tuhan Yang Maha Esa bagi seluruh bangsa."
          },
          {
            id: 3,
            question: "Berdiskusi bersama seluruh anggota keluarga untuk menentukan tujuan liburan akhir pekan merupakan penerapan...",
            options: ["Musyawarah keluarga", "Perintah sepihak", "Pertengkaran keluarga", "Undian berhadiah"],
            correctIndex: 0,
            explanation: "Musyawarah mencerminkan pengamalan sila ke-4 untuk mencapai keputusan bersama secara mufakat."
          },
          {
            id: 4,
            question: "Membantu adik yang kesulitan merapikan buku pelajarannya merupakan wujud sikap...",
            options: ["Tolong-menolong dan kasih sayang", "Iri hati", "Mengabaikan adik", "Mengejek kekurangan adik"],
            correctIndex: 0,
            explanation: "Tolong-menolong di dalam keluarga menciptakan kerukunan dan kedamaian di rumah."
          },
          {
            id: 5,
            question: "Membagi kue bolu secara adil kepada saudara tanpa memilih kasih merupakan penerapan sila ke-...",
            options: ["Lima (5)", "Satu (1)", "Tiga (3)", "Dua (2)"],
            correctIndex: 0,
            explanation: "Bersikap adil kepada sesama mencerminkan sila kelima Keadilan Sosial bagi Seluruh Rakyat Indonesia."
          },
          {
            id: 6,
            question: "Saat teman sedang menyampaikan pendapatnya dalam musyawarah kelas, sikap kita yang baik adalah...",
            options: ["Mendengarkan dengan tenang dan menghargai", "Memotong pembicaraannya dengan kasar", "Menertawakan pendapatnya", "Keluar dari ruangan"],
            correctIndex: 0,
            explanation: "Menghargai pendapat orang lain adalah etika musyawarah yang sesuai nilai luhur Pancasila."
          },
          {
            id: 7,
            question: "Simbol rantai emas pada perisai Garuda Pancasila memiliki mata rantai berbentuk lingkaran dan segi empat yang melambangkan...",
            options: ["Pria dan wanita yang saling bersatu membantu", "Rantai kapal laut", "Kekuatan senjata perang", "Perhiasan berharga"],
            correctIndex: 0,
            explanation: "Mata rantai segi empat melambangkan pria, sedangkan lingkaran melambangkan wanita yang saling terikat bersatu."
          },
          {
            id: 8,
            question: "Menjaga persatuan dan tidak mudah bertengkar dengan teman sekelas merupakan wujud pengamalan sila ke-...",
            options: ["Tiga (3)", "Satu (1)", "Dua (2)", "Empat (4)"],
            correctIndex: 0,
            explanation: "Sila ke-3 berbunyi Persatuan Indonesia yang mengajarkan kita untuk selalu rukun dan bersatu."
          },
          {
            id: 9,
            question: "Jika kita menemukan uang teman yang terjatuh di lantai kelas, tindakan terpuji yang harus kita lakukan adalah...",
            options: ["Mengembalikannya kepada pemiliknya atau lapor ke guru", "Memasukkannya ke saku sendiri", "Membelanjakannya di kantin", "Menyembunyikannya di tas"],
            correctIndex: 0,
            explanation: "Mengembalikan barang temuan kepada pemiliknya adalah wujud nyata sikap jujur."
          },
          {
            id: 10,
            question: "Sikap tidak memaksakan kehendak kita sendiri kepada orang lain mencerminkan nilai sila ke-...",
            options: ["Empat (4)", "Satu (1)", "Dua (2)", "Tiga (3)"],
            correctIndex: 0,
            explanation: "Sila ke-4 menekankan musyawarah untuk mufakat tanpa memaksakan kehendak pribadi."
          }
        ]
      };

    case 2:
      return {
        title: "Menaati Aturan di Sekitarku",
        conceptText: "Aturan di sekitar kita terdiri dari aturan tertulis (tata tertib sekolah, jadwal piket, rambu) dan aturan tidak tertulis (mengucap salam, sopan santun). Kesepakatan kelas dibuat bersama agar suasana belajar nyaman. Melanggar aturan dapat merugikan diri sendiri dan orang lain.",
        questions: [
          {
            id: 1,
            question: "Aturan yang dicatat resmi dan memiliki sanksi jelas jika dilanggar disebut aturan...",
            options: ["Tertulis", "Tidak tertulis", "Rahasia", "Khayalan"],
            correctIndex: 0,
            explanation: "Aturan tertulis dituangkan dalam bentuk dokumen resmi seperti tata tertib sekolah atau rambu jalan."
          },
          {
            id: 2,
            question: "Contoh aturan tidak tertulis yang bersumber dari norma kesopanan adalah...",
            options: ["Mengetuk pintu dan mengucap salam sebelum masuk rumah", "Memiliki Surat Izin Mengemudi (SIM)", "Membayar pajak kendaraan", "Memakai helm SNI"],
            correctIndex: 0,
            explanation: "Mengetuk pintu dan mengucap salam adalah kebiasaan sopan santun luhur dalam pergaulan."
          },
          {
            id: 3,
            question: "Kesepakatan kelas yang telah diputuskan bersama antara guru dan siswa harus ditaati oleh...",
            options: ["Seluruh siswa dan warga kelas", "Hanya ketua kelas", "Hanya siswa laki-laki", "Hanya guru"],
            correctIndex: 0,
            explanation: "Kesepakatan bersama mengikat seluruh anggota kelas untuk menjaga ketertiban bersama."
          },
          {
            id: 4,
            question: "Akibat langsung jika ada siswa yang tidak mematuhi aturan piket membersihkan kelas adalah...",
            options: ["Kelas menjadi kotor dan teman piket lain merasa terbebani", "Kelas menjadi lebih bersih", "Guru memberikan hadiah", "Siswa tersebut dipuji"],
            correctIndex: 0,
            explanation: "Melanggar jadwal piket merugikan teman sekelompok dan membuat ruangan belajar tidak nyaman."
          },
          {
            id: 5,
            question: "Rambu lalu lintas lampu merah di perempatan jalan mewajibkan semua pengendara untuk...",
            options: ["Berhenti dan menunggu lampu hijau", "Menambah kecepatan kendaraan", "Membunyikan klakson keras", "Berbalik arah sembarangan"],
            correctIndex: 0,
            explanation: "Lampu merah adalah aturan tertulis keselamatan lalu lintas yang mewajibkan kendaraan berhenti."
          },
          {
            id: 6,
            question: "Saat guru sedang berbicara di depan kelas, aturan kesopanan yang benar adalah...",
            options: ["Menyimak dengan baik dan tidak berbicara sendiri", "Bermain pesawat kertas", "Tidur di atas meja", "Keluar kelas tanpa izin"],
            correctIndex: 0,
            explanation: "Mendengarkan guru saat berbicara merupakan bentuk penghormatan murid kepada gurunya."
          },
          {
            id: 7,
            question: "Jika kita tidak sengaja merusakkan pensil milik teman, sikap bertanggung jawab sesuai aturan adalah...",
            options: ["Meminta maaf dengan tulus dan menggantinya", "Menyalahkan orang lain", "Pura-pura tidak tahu", "Marah kepada teman"],
            correctIndex: 0,
            explanation: "Mengakui kelalaian dan meminta maaf merupakan cerminan anak berkarakter jujur dan bertanggung jawab."
          },
          {
            id: 8,
            question: "Tata tertib meminjam buku di perpustakaan sekolah mewajibkan kita untuk...",
            options: ["Merawat buku dan mengembalikannya tepat waktu", "Merobek halaman buku", "Mencoret-coret sampul", "Membawa pulang tanpa izin"],
            correctIndex: 0,
            explanation: "Buku perpustakaan adalah milik bersama yang harus dijaga keutuhannya agar bisa dibaca teman lain."
          },
          {
            id: 9,
            question: "Manfaat utama membiasakan diri hidup taat aturan sejak usia dini adalah...",
            options: ["Terbentuknya pribadi yang disiplin dan dipercaya orang lain", "Menjadi orang yang penakut", "Sering ditegur teman", "Kehilangan kebebasan"],
            correctIndex: 0,
            explanation: "Disiplin aturan menumbuhkan rasa tanggung jawab dan keteraturan dalam meraih cita-cita."
          },
          {
            id: 10,
            question: "Jika di jalan melihat teman membuang sampah sembarangan di selokan, hal terpuji yang kita lakukan adalah...",
            options: ["Mengingatkannya dengan sopan agar membuang ke tempat sampah", "Ikut membuang sampah ke selokan", "Menertawakannya", "Membiarkannya tanpa peduli"],
            correctIndex: 0,
            explanation: "Mengingatkan dengan santun membantu menjaga lingkungan tetap bersih dan bebas banjir."
          }
        ]
      };

    case 3:
      return {
        title: "Bhinneka Tunggal Ika di Sekolah",
        conceptText: "Di sekolah kita bertemu teman dari beragam suku (Jawa, Sunda, Batak, Minang, Dayak, Papua), bahasa daerah, dan agama (Islam, Kristen, Katolik, Hindu, Buddha, Khonghucu). Semboyan Bhinneka Tunggal Ika mengajarkan toleransi, saling menghormati, dan bersatu dalam persahabatan.",
        questions: [
          {
            id: 1,
            question: "Arti dari semboyan bangsa Indonesia 'Bhinneka Tunggal Ika' adalah...",
            options: ["Berbeda-beda tetapi tetap satu jua", "Bersatu kita teguh bercerai kita runtuh", "Maju terus pantang mundur", "Gotong royong bersama"],
            correctIndex: 0,
            explanation: "Bhinneka Tunggal Ika bermakna keberagaman suku, ras, dan agama disatukan dalam satu bangsa Indonesia."
          },
          {
            id: 2,
            question: "Bahasa persatuan yang kita gunakan untuk berkomunikasi dengan teman dari suku yang berbeda adalah...",
            options: ["Bahasa Indonesia", "Bahasa asing", "Bahasa isyarat", "Bahasa daerah masing-masing"],
            correctIndex: 0,
            explanation: "Bahasa Indonesia adalah bahasa nasional pemersatu komunikasi antarsuku di seluruh Nusantara."
          },
          {
            id: 3,
            question: "Sikap toleransi kita saat melihat teman sedang melaksanakan ibadah salat di musala sekolah adalah...",
            options: ["Menjaga ketenangan dan tidak berisik di dekatnya", "Mengajaknya mengobrol saat salat", "Bermain bola di dalam musala", "Menertawakannya"],
            correctIndex: 0,
            explanation: "Menjaga ketenangan saat orang lain beribadah merupakan wujud nyata toleransi beragama."
          },
          {
            id: 4,
            question: "Ada berapa agama resmi yang diakui oleh negara Republik Indonesia?",
            options: ["Enam (6) agama", "Tiga (3) agama", "Empat (4) agama", "Sepuluh (10) agama"],
            correctIndex: 0,
            explanation: "Enam agama resmi di Indonesia adalah Islam, Kristen Protestan, Katolik, Hindu, Buddha, dan Khonghucu."
          },
          {
            id: 5,
            question: "Saat bermain permainan kasti di lapangan, sikap kita dalam memilih anggota regu bermain adalah...",
            options: ["Mau berteman dan bermain dengan siapa saja", "Hanya memilih teman dari satu suku saja", "Hanya mau berteman dengan orang kaya", "Menolak teman yang berkulit gelap"],
            correctIndex: 0,
            explanation: "Bermain tanpa membeda-bedakan suku dan penampilan menciptakan kekompakan dan kegembiraan."
          },
          {
            id: 6,
            question: "Sikap bangga terhadap kebudayaan daerah teman yang menampilkan tarian tradisional di panggung adalah...",
            options: ["Memberikan tepuk tangan meriah dan mengapresiasinya", "Mengejek kostum tariannya", "Meninggalkan aula pertunjukan", "Menutup telinga"],
            correctIndex: 0,
            explanation: "Menonton dan bertepuk tangan bangga memperkuat rasa persaudaraan dan pelestarian seni budaya."
          },
          {
            id: 7,
            question: "Perilaku mengejek asal daerah atau warna kulit teman sekelas dapat menyebabkan...",
            options: ["Pertengkaran dan rusaknya persaudaraan", "Kelas semakin rukun", "Mendapat banyak kawan", "Pujian dari bapak ibu guru"],
            correctIndex: 0,
            explanation: "Perilaku mengejek (bullying) memecah belah pertemanan dan dilarang keras di sekolah."
          },
          {
            id: 8,
            question: "Hari besar keagamaan Idulfitri dirayakan oleh pemeluk agama...",
            options: ["Islam", "Kristen", "Hindu", "Buddha"],
            correctIndex: 0,
            explanation: "Idulfitri adalah hari raya kemenangan umat Islam setelah sebulan penuh berpuasa Ramadan."
          },
          {
            id: 9,
            question: "Hari raya Nyepi yang dirayakan dengan tidak menyalakan api dan tidak beraktivitas keluar rumah adalah hari besar umat...",
            options: ["Hindu", "Katolik", "Khonghucu", "Islam"],
            correctIndex: 0,
            explanation: "Hari raya Nyepi adalah peringatan tahun baru Saka bagi masyarakat pemeluk agama Hindu di Bali."
          },
          {
            id: 10,
            question: "Manfaat hidup rukun di tengah keragaman teman di sekolah adalah...",
            options: ["Banyak sahabat dan suasana belajar menjadi damai", "Sering merasa takut", "Pikiran menjadi cemas", "Nilai pelajaran menurun"],
            correctIndex: 0,
            explanation: "Kerukunan membuat lingkungan sekolah terasa seperti keluarga besar yang saling melindungi."
          }
        ]
      };

    case 4:
      return {
        title: "Aku Peduli Lingkungan",
        conceptText: "Lingkungan tempat tinggal kita terdiri dari rumah, tetangga, serta wilayah Rukun Tetangga (RT) dan Rukun Warga (RW). Mengetahui denah lingkungan membantu kita tidak tersesat. Hidup rukun antartetangga menciptakan lingkungan yang aman, damai, dan harmonis.",
        questions: [
          {
            id: 1,
            question: "Gambar sederhana yang menunjukkan letak suatu tempat atau jalan disebut...",
            options: ["Denah", "Lukisan", "Poster", "Komik"],
            correctIndex: 0,
            explanation: "Denah mempermudah kita mengetahui lokasi rumah, jalan, dan fasilitas umum di sekitar kita."
          },
          {
            id: 2,
            question: "Orang atau keluarga yang tempat tinggalnya bersebelahan atau berdekatan dengan rumah kita disebut...",
            options: ["Tetangga", "Orang asing", "Wisatawan", "Turis"],
            correctIndex: 0,
            explanation: "Tetangga adalah orang terdekat yang siap membantu kita saat membutuhkan pertolongan pertama."
          },
          {
            id: 3,
            question: "Struktur organisasi masyarakat terkecil di lingkungan tempat tinggal yang dipimpin oleh seorang ketua adalah...",
            options: ["Rukun Tetangga (RT)", "Kecamatan", "Kabupaten", "Provinsi"],
            correctIndex: 0,
            explanation: "Rukun Tetangga (RT) menaungi beberapa puluh kepala keluarga dalam satu lingkungan permukiman."
          },
          {
            id: 4,
            question: "Gabungan dari beberapa Rukun Tetangga (RT) membentuk lingkungan organisasi...",
            options: ["Rukun Warga (RW)", "Kelurahan", "Provinsi", "Negara"],
            correctIndex: 0,
            explanation: "Beberapa RT bergabung menjadi satu kesatuan Rukun Warga (RW)."
          },
          {
            id: 5,
            question: "Sikap terpuji saat berpapasan dengan tetangga di jalan perumahan adalah...",
            options: ["Tersenyum dan menyapa dengan ramah", "Memalingkan muka sombong", "Berlari menjauh", "Pura-pura tidak kenal"],
            correctIndex: 0,
            explanation: "Menyapa dengan senyum mempererat tali silaturahmi dan kerukunan bertetangga."
          },
          {
            id: 6,
            question: "Jika ada tetangga dekat yang sedang sakit atau tertimpa musibah, hal yang baik kita lakukan adalah...",
            options: ["Menjenguk dan mendoakan kesembuhannya", "Memutar musik keras-keras", "Menertawakan kemalangannya", "Mengabaikannya"],
            correctIndex: 0,
            explanation: "Menjenguk tetangga yang sakit meringankan beban kesedihannya dan menunjukkan rasa empati."
          },
          {
            id: 7,
            question: "Kegiatan kerja bakti membersihkan selokan kampung yang dilakukan warga bapak-bapak di hari Minggu merupakan contoh...",
            options: ["Gotong royong warga", "Pekerjaan individu berbayar", "Hukuman dari pemerintah", "Perlombaan kampung"],
            correctIndex: 0,
            explanation: "Kerja bakti gotong royong membersihkan selokan mencegah banjir dan bibit penyakit demam berdarah."
          },
          {
            id: 8,
            question: "Pos ronda di lingkungan perumahan warga biasanya digunakan untuk kegiatan...",
            options: ["Ronda malam menjaga keamanan lingkungan", "Tempat membuang sampah", "Kandang hewan ternak", "Toko kelontong"],
            correctIndex: 0,
            explanation: "Pos ronda (Siskamling) adalah pos penjagaan warga untuk mengamankan kampung dari kejahatan."
          },
          {
            id: 9,
            question: "Jika di rumah kita memasak makanan berlebih, sikap bertetangga yang diajarkan dalam Pancasila adalah...",
            options: ["Membagikan sebagian makanan kepada tetangga terdekat", "Membuangnya ke tong sampah", "Menyembunyikannya di lemari", "Memakannya sendiri sampai sakit perut"],
            correctIndex: 0,
            explanation: "Saling berbagi makanan memupuk kasih sayang dan kehangatan persaudaraan antartetangga."
          },
          {
            id: 10,
            question: "Akibat jika warga di suatu kampung tidak saling kenal dan sering bermusuhan adalah...",
            options: ["Lingkungan menjadi tidak aman dan tidak nyaman", "Desa menjadi terkenal di dunia", "Semua warga menjadi kaya", "Rumah menjadi megah"],
            correctIndex: 0,
            explanation: "Bermusuhan membuat lingkungan rawan perpecahan dan hilangnya rasa tolong-menolong."
          }
        ]
      };

    default:
      return {
        title: "Konsep Dasar Pancasila",
        conceptText: "Pendidikan Pancasila membentuk karakter beriman, berbudi pekerti luhur, dan cinta persatuan.",
        questions: []
      };
  }
}
