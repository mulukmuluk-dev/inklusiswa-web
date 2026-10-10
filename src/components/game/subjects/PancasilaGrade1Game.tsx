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

interface PancasilaGrade1GameProps {
  levelId: number;
  onLevelComplete: (levelId: number, starsEarned: number) => void;
  accessibilityMode?: string;
}

export function PancasilaGrade1Game({ levelId, onLevelComplete, accessibilityMode }: PancasilaGrade1GameProps) {
  const [phase, setPhase] = useState<"materi" | "game">("materi");

  // Phase 1 interactive states
  const [activeSymbol, setActiveSymbol] = useState<{ sila: string; icon: string; bunyi: string }>({
    sila: "Sila 1",
    icon: "Bintang Emas",
    bunyi: "Ketuhanan Yang Maha Esa",
  });
  const [activeRule, setActiveRule] = useState<{ place: string; sample: string }>({
    place: "Di Rumah",
    sample: "Merapikan tempat tidur dan berdoa sebelum makan.",
  });
  const [activeDiff, setActiveDiff] = useState<{ topic: string; desc: string }>({
    topic: "Ciri Fisik",
    desc: "Ada yang berambut keriting atau lurus, semua ciptaan Tuhan yang baik.",
  });
  const [activeEnv, setActiveEnv] = useState<{ act: string; benefit: string }>({
    act: "Membuang Sampah",
    benefit: "Lingkungan kelas dan rumah menjadi bersih dan sehat.",
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
                  Mengenal 5 Simbol Garuda Pancasila:
                </span>
                <div className="grid grid-cols-5 gap-1.5 w-full text-xs">
                  {[
                    { sila: "Sila 1", icon: "Bintang", bunyi: "Ketuhanan Yang Maha Esa" },
                    { sila: "Sila 2", icon: "Rantai", bunyi: "Kemanusiaan yang Adil dan Beradab" },
                    { sila: "Sila 3", icon: "Beringin", bunyi: "Persatuan Indonesia" },
                    { sila: "Sila 4", icon: "Banteng", bunyi: "Kerakyatan yang Dipimpin oleh Hikmat Kebijaksanaan..." },
                    { sila: "Sila 5", icon: "Padi Kapas", bunyi: "Keadilan Sosial bagi Seluruh Rakyat Indonesia" },
                  ].map((s) => (
                    <button
                      key={s.sila}
                      type="button"
                      onClick={() => {
                        setActiveSymbol(s);
                        playPopSound();
                        speakGlobal(`${s.sila} lambangnya ${s.icon}. Bunyinya: ${s.bunyi}`);
                      }}
                      className={`p-2 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeSymbol.sila === s.sila ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-[11px]">{s.sila}</strong>
                      <span className="text-[10px] opacity-80">{s.icon}</span>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong>{activeSymbol.sila} ({activeSymbol.icon}): </strong>{activeSymbol.bunyi}
                </div>
              </div>
            )}

            {levelId === 2 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Aturan Tertib Sehari-hari:
                </span>
                <div className="grid grid-cols-2 gap-2 w-full text-xs">
                  {[
                    { place: "Aturan di Rumah", sample: "Merapikan tempat tidur, mencuci tangan sebelum makan, dan patuh pada orang tua." },
                    { place: "Aturan di Sekolah", sample: "Memakai seragam rapi, mendengarkan guru, dan tertib saat jam pelajaran." },
                  ].map((r) => (
                    <button
                      key={r.place}
                      type="button"
                      onClick={() => {
                        setActiveRule(r);
                        playPopSound();
                        speakGlobal(`${r.place}: ${r.sample}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeRule.place === r.place ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-xs">{r.place}</strong>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong>{activeRule.place}: </strong>{activeRule.sample}
                </div>
              </div>
            )}

            {levelId === 3 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Kita Berbeda tetapi Bersahabat:
                </span>
                <div className="grid grid-cols-3 gap-2 w-full text-xs">
                  {[
                    { topic: "Ciri Fisik", desc: "Rambut lurus atau keriting, berkulit cerah atau sawo matang, semua teman baik kita." },
                    { topic: "Hobi Berbeda", desc: "Ada yang suka menggambar, bernyanyi, atau berolahraga, kita saling mendukung." },
                    { topic: "Saling Menghargai", desc: "Bermain bersama secara rukun tanpa mengejek teman." },
                  ].map((d) => (
                    <button
                      key={d.topic}
                      type="button"
                      onClick={() => {
                        setActiveDiff(d);
                        playPopSound();
                        speakGlobal(`${d.topic}: ${d.desc}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeDiff.topic === d.topic ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-xs">{d.topic}</strong>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong>{activeDiff.topic}: </strong>{activeDiff.desc}
                </div>
              </div>
            )}

            {levelId === 4 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Menjaga Kebersihan Lingkungan:
                </span>
                <div className="grid grid-cols-3 gap-2 w-full text-xs">
                  {[
                    { act: "Buang Sampah", benefit: "Membuang sampah ke tempat sampah agar kelas selalu bersih dan rapi." },
                    { act: "Piket Kelas", benefit: "Menyapu dan menghapus papan tulis bersama teman secara gotong royong." },
                    { act: "Rawat Tanaman", benefit: "Menyiram tanaman pot di sekolah agar tumbuh subur dan asri." },
                  ].map((e) => (
                    <button
                      key={e.act}
                      type="button"
                      onClick={() => {
                        setActiveEnv(e);
                        playPopSound();
                        speakGlobal(`${e.act}: ${e.benefit}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeEnv.act === e.act ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-xs">{e.act}</strong>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong>{activeEnv.act}: </strong>{activeEnv.benefit}
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
        title: "Aku Cinta Pancasila",
        conceptText: "Lambang negara kita adalah Garuda Pancasila. Di dadanya terdapat perisai dengan 5 simbol sila: Bintang (Sila 1), Rantai (Sila 2), Pohon Beringin (Sila 3), Kepala Banteng (Sila 4), serta Padi dan Kapas (Sila 5). Kita mengamalkannya dengan rajin berdoa dan gemar berbagi.",
        questions: [
          {
            id: 1,
            question: "Lambang negara Indonesia yang gagah perkasa adalah burung...",
            options: ["Garuda Pancasila", "Merpati Putih", "Cendrawasih", "Elang Jawa"],
            correctIndex: 0,
            explanation: "Burung Garuda Pancasila adalah lambang resmi negara Republik Indonesia."
          },
          {
            id: 2,
            question: "Simbol sila pertama Pancasila 'Ketuhanan Yang Maha Esa' adalah gambar...",
            options: ["Bintang emas bersudut lima", "Rantai baja", "Pohon beringin", "Kepala banteng"],
            correctIndex: 0,
            explanation: "Bintang emas bersudut lima adalah simbol sila pertama Pancasila."
          },
          {
            id: 3,
            question: "Simbol sila kedua Pancasila 'Kemanusiaan yang adil dan beradab' adalah...",
            options: ["Mata rantai emas", "Pohon beringin", "Bintang", "Padi dan kapas"],
            correctIndex: 0,
            explanation: "Rantai melambangkan persatuan dan saling tolong-menolong antarsesama manusia."
          },
          {
            id: 4,
            question: "Pohon beringin yang rindang merupakan simbol Pancasila sila ke-...",
            options: ["Tiga (Persatuan Indonesia)", "Satu", "Dua", "Empat"],
            correctIndex: 0,
            explanation: "Pohon beringin melambangkan tempat berteduh dan persatuan seluruh rakyat Indonesia."
          },
          {
            id: 5,
            question: "Simbol sila keempat Pancasila yang melambangkan musyawarah berkumpul adalah...",
            options: ["Kepala banteng", "Bintang", "Padi dan kapas", "Rantai"],
            correctIndex: 0,
            explanation: "Banteng hewan sosial yang suka berkumpul, melambangkan musyawarah mufakat."
          },
          {
            id: 6,
            question: "Simbol sila kelima Pancasila 'Keadilan sosial bagi seluruh rakyat Indonesia' adalah...",
            options: ["Padi dan kapas", "Bintang emas", "Kepala banteng", "Pohon beringin"],
            correctIndex: 0,
            explanation: "Padi dan kapas melambangkan kebutuhan pangan dan sandang seluruh rakyat secara adil."
          },
          {
            id: 7,
            question: "Contoh sikap sederhana di rumah yang sesuai dengan sila pertama adalah...",
            options: ["Berdoa sebelum makan dan tidur", "Bermain tanpa henti", "Menolak disuruh orang tua", "Membuang makanan"],
            correctIndex: 0,
            explanation: "Berdoa adalah ungkapan rasa syukur dan taat beribadah kepada Tuhan Yang Maha Esa."
          },
          {
            id: 8,
            question: "Contoh pengamalan sila kedua di sekolah ketika teman lupa membawa pensil adalah...",
            options: ["Meminjamkan pensil cadangan kita", "Menertawakannya", "Menyuruhnya pulang", "Menyembunyikan pensil kita"],
            correctIndex: 0,
            explanation: "Berbagi dan menolong teman yang membutuhkan adalah sikap terpuji sila kedua."
          },
          {
            id: 9,
            question: "Ada berapa sila di dalam dasar negara Pancasila?",
            options: ["Lima sila", "Tiga sila", "Tujuh sila", "Sepuluh sila"],
            correctIndex: 0,
            explanation: "Pancasila terdiri dari kata panca (lima) dan sila (dasar), jadi ada lima sila."
          },
          {
            id: 10,
            question: "Sikap kita ketika mendengar teman membacakan teks Pancasila di upacara bendera adalah...",
            options: ["Berdiri tegak dan mendengarkan dengan khidmat", "Mengobrol dan bercanda", "Duduk di rumput lapangan", "Berlari ke kantin"],
            correctIndex: 0,
            explanation: "Kita harus bersikap khidmat dan berdiri tegak saat mengucap teks Pancasila."
          }
        ]
      };

    case 2:
      return {
        title: "Aku Anak yang Patuh Aturan",
        conceptText: "Aturan adalah kesepakatan agar hidup kita tertib, aman, dan rukun. Di rumah ada aturan merapikan mainan dan tidur tepat waktu. Di sekolah ada tata tertib memakai seragam rapi dan datang sebelum bel berbunyi. Anak yang patuh aturan disayangi semua orang.",
        questions: [
          {
            id: 1,
            question: "Tujuan dibuatnya aturan di rumah dan di sekolah adalah agar kehidupan menjadi...",
            options: ["Tertib, teratur, dan damai", "Kacau balau", "Penuh pertengkaran", "Membosankan"],
            correctIndex: 0,
            explanation: "Aturan membimbing kita hidup rukun, teratur, disiplin, dan saling menyayangi."
          },
          {
            id: 2,
            question: "Contoh aturan yang baik setelah bangun tidur di pagi hari adalah...",
            options: ["Merapikan tempat tidur sendiri", "Langsung bermain gawai hp", "Menangis keras", "Menumpuk selimut berantakan"],
            correctIndex: 0,
            explanation: "Merapikan tempat tidur melatih kita mandiri dan bertanggung jawab sejak kecil."
          },
          {
            id: 3,
            question: "Sebelum berangkat ke sekolah, hal yang harus kita lakukan kepada orang tua adalah...",
            options: ["Berpamitan dan mencium tangan ayah dan ibu", "Pergi diam-diam", "Berteriak dari luar pagar", "Marah-marah"],
            correctIndex: 0,
            explanation: "Berpamitan adalah tanda santun dan memohon doa restu kepada orang tua."
          },
          {
            id: 4,
            question: "Tata tertib di sekolah saat guru sedang menerangkan pelajaran di depan kelas adalah...",
            options: ["Mendengarkan dengan tertib dan tenang", "Bercanda dengan teman sebangku", "Tidur di atas meja", "Makan permen diam-diam"],
            correctIndex: 0,
            explanation: "Mendengarkan guru saat menjelaskan adalah tanda hormat dan tertib belajar."
          },
          {
            id: 5,
            question: "Jika kita ingin bertanya atau berbicara di ruang kelas, sikap tertib yang benar adalah...",
            options: ["Mengacungkan tangan kanan terlebih dahulu", "Berteriak keras memotong guru", "Memukul-mukul meja", "Melempar kertas"],
            correctIndex: 0,
            explanation: "Mengacungkan tangan sebelum berbicara menunjukkan adab kesopanan yang baik."
          },
          {
            id: 6,
            question: "Akibat jika kita tidur larut malam setiap hari adalah...",
            options: ["Bangun kesiangan dan terlambat ke sekolah", "Tubuh semakin bugar", "Mendapat nilai bagus", "Dipuji oleh guru"],
            correctIndex: 0,
            explanation: "Tidur larut malam merusak kesehatan dan membuat kita terlambat masuk sekolah."
          },
          {
            id: 7,
            question: "Saat bel tanda masuk sekolah berbunyi, semua murid harus segera...",
            options: ["Berbaris rapi di depan kelas lalu masuk tertib", "Bermain kejar-kejaran di lapangan", "Pergi jajan ke luar sekolah", "Pulang ke rumah"],
            correctIndex: 0,
            explanation: "Berbaris rapi melatih kedisiplinan murid sebelum memulai kegiatan belajar."
          },
          {
            id: 8,
            question: "Setelah selesai makan bersama keluarga di meja makan, sikap anak yang mandiri adalah...",
            options: ["Membawa piring kotor sendiri ke tempat cuci piring", "Meninggalkan piring kotor di lantai", "Menyuruh adik mencucikannya", "Membuang sendok"],
            correctIndex: 0,
            explanation: "Meletakkan piring kotor ke tempat cuci membantu meringankan tugas orang tua."
          },
          {
            id: 9,
            question: "Sepatu yang dilepas setelah pulang dari sekolah sebaiknya diletakkan di...",
            options: ["Rak sepatu dengan rapi", "Tengah ruang tamu", "Atas kasur", "Halaman luar"],
            correctIndex: 0,
            explanation: "Menyimpan sepatu di rak sepatu membuat rumah terlihat rapi dan sepatu tidak cepat kotor."
          },
          {
            id: 10,
            question: "Anak yang senantiasa mematuhi aturan dan tata tertib akan menjadi anak yang...",
            options: ["Disiplin dan disukai banyak teman", "Dijauhi guru", "Sering dihukum", "Sombong"],
            correctIndex: 0,
            explanation: "Anak yang disiplin dan taat aturan membawa kedamaian dan disenangi semua orang."
          }
        ]
      };

    case 3:
      return {
        title: "Kita Berbeda tetapi Sama",
        conceptText: "Tuhan menciptakan kita berbeda-beda. Ada teman laki-laki dan perempuan, rambut keriting dan lurus, kulit cerah dan gelap. Hobi dan makanan kesukaan kita juga bisa berbeda. Meskipun berbeda, kita semua bersahabat rukun dan saling menyayangi.",
        questions: [
          {
            id: 1,
            question: "Meskipun memiliki ciri fisik yang berbeda-beda, kita semua adalah ciptaan...",
            options: ["Tuhan Yang Maha Esa", "Mesin pabrik", "Robot canggih", "Boneka"],
            correctIndex: 0,
            explanation: "Setiap manusia diciptakan unik dan istimewa oleh Tuhan Yang Maha Esa."
          },
          {
            id: 2,
            question: "Sikap kita terhadap teman yang memiliki bentuk rambut keriting atau kulit berbeda adalah...",
            options: ["Menghargai dan tetap berteman akrab", "Mengejek dan menertawakannya", "Menjauhinya saat istirahat", "Tidak mau duduk sebangku"],
            correctIndex: 0,
            explanation: "Kita tidak boleh mengejek ciri fisik teman karena semua orang sama derajatnya."
          },
          {
            id: 3,
            question: "Edo gemar bermain sepak bola, sedangkan Siti gemar menggambar. Sikap Edo kepada Siti sebaiknya...",
            options: ["Menghargai hobi Siti", "Memaksa Siti bermain bola", "Merusak buku gambar Siti", "Mengejek hobi Siti"],
            correctIndex: 0,
            explanation: "Setiap anak berhak memiliki hobi yang disukainya tanpa dipaksa orang lain."
          },
          {
            id: 4,
            question: "Jika di kelas ada teman baru yang berasal dari daerah lain dan logat bicaranya berbeda, kita harus...",
            options: ["Menyambut dengan ramah dan mengajaknya berteman", "Menirukan bicaranya untuk mengejek", "Menolaknya masuk kelas", "Menyuruhnya pindah"],
            correctIndex: 0,
            explanation: "Sikap ramah membuat teman baru merasa nyaman dan senang di sekolah."
          },
          {
            id: 5,
            question: "Di kelas 1 ada murid laki-laki dan murid perempuan. Mereka harus saling...",
            options: ["Menghormati dan rukun bermain bersama", "Bermusuhan dan bertengkar", "Saling mengejek", "Membuat kelompok terpisah"],
            correctIndex: 0,
            explanation: "Murid laki-laki dan perempuan harus saling menjaga dan bekerja sama dengan baik."
          },
          {
            id: 6,
            question: "Manfaat memiliki banyak teman yang memiliki kegemaran berbeda adalah...",
            options: ["Belajar hal-hal baru dan pergaulan menyenangkan", "Menjadi sering bertengkar", "Tidak bisa belajar", "Kelas menjadi berisik"],
            correctIndex: 0,
            explanation: "Keragaman kegemaran membuat kita bisa saling berbagi ilmu dan pengalaman baru."
          },
          {
            id: 7,
            question: "Ketika teman kita merayakan hari raya agamanya, sikap toleransi kita adalah...",
            options: ["Mengucapkan selamat dan tidak mengganggu", "Membuat gaduh di dekat rumahnya", "Melarangnya beribadah", "Mengejek pakaian ibadahnya"],
            correctIndex: 0,
            explanation: "Menghormati ibadah teman adalah wujud nyata persaudaraan dan kerukunan beragama."
          },
          {
            id: 8,
            question: "Semboyan persatuan bangsa kita yang berarti berbeda-beda tetapi tetap satu adalah...",
            options: ["Bhinneka Tunggal Ika", "Tut Wuri Handayani", "Gotong Royong", "Pancasila Jaya"],
            correctIndex: 0,
            explanation: "Bhinneka Tunggal Ika mengajarkan bahwa keberagaman adalah kekayaan persatuan kita."
          },
          {
            id: 9,
            question: "Jika melihat teman terjatuh saat lari di lapangan, perbuatan yang benar adalah...",
            options: ["Membantunya berdiri dan menolongnya", "Menertawakannya bersama teman lain", "Membiarkannya menangis sendirian", "Menyalahkannya karena jatuh"],
            correctIndex: 0,
            explanation: "Menolong teman yang kesusahan adalah bukti rasa sayang antarteman."
          },
          {
            id: 10,
            question: "Kerukunan di dalam ruang kelas akan membuat suasana belajar menjadi...",
            options: ["Tenang, nyaman, dan menyenangkan", "Menakutkan dan tegang", "Membosankan", "Kacau balau"],
            correctIndex: 0,
            explanation: "Kelas yang rukun dan bebas perundungan membuat semua murid senang belajar."
          }
        ]
      };

    case 4:
      return {
        title: "Aku Cinta Lingkungan Sekitar",
        conceptText: "Rumah dan sekolah adalah tempat kita tinggal dan belajar. Kita harus menjaga kebersihan bagian-bagian rumah (kamar, dapur, halaman) dan sekolah (kelas, lapangan, toilet). Dengan gotong royong membersihkan kelas, pekerjaan berat menjadi ringan dan lingkungan menjadi asri.",
        questions: [
          {
            id: 1,
            question: "Ruangan di sekolah yang digunakan murid dan guru untuk belajar sehari-hari adalah...",
            options: ["Ruang kelas", "Kantin sekolah", "Gudang barang", "Tempat parkir"],
            correctIndex: 0,
            explanation: "Ruang kelas adalah tempat utama kegiatan belajar mengajar yang harus selalu dijaga kebersihannya."
          },
          {
            id: 2,
            question: "Kegiatan membersihkan ruang kelas bersama-sama oleh kelompok regu piket disebut...",
            options: ["Gotong royong piket kelas", "Lomba individu", "Bermain petak umpet", "Hukuman guru"],
            correctIndex: 0,
            explanation: "Piket kelas dilakukan bersama-sama secara gotong royong agar kelas bersih dan rapi."
          },
          {
            id: 3,
            question: "Manfaat membersihkan kelas secara gotong royong bersama teman adalah...",
            options: ["Pekerjaan cepat selesai dan terasa ringan", "Pekerjaan menjadi semakin lama", "Menghabiskan banyak tenaga", "Semua teman menjadi lelah"],
            correctIndex: 0,
            explanation: "Gotong royong membuat tugas membersihkan papan tulis dan menyapu lantai jadi lebih cepat selesai."
          },
          {
            id: 4,
            question: "Alat kebersihan yang digunakan untuk membersihkan debu dan kotoran di lantai adalah...",
            options: ["Sapu dan pengki", "Ember dan gayung", "Gunting kertas", "Kuas lukis"],
            correctIndex: 0,
            explanation: "Sapu lidi atau ijuk digunakan untuk menyapu kotoran ke pengki penampung sampah."
          },
          {
            id: 5,
            question: "Sampah daun kering di halaman sekolah termasuk jenis sampah...",
            options: ["Organik (alami)", "Plastik", "Kaca berbahaya", "Logam kaleng"],
            correctIndex: 0,
            explanation: "Daun kering dan sisa makanan adalah sampah organik yang dapat membusuk menjadi pupuk kompos."
          },
          {
            id: 6,
            question: "Setelah selesai makan bekal makanan di jam istirahat, bungkus plastik makanan harus...",
            options: ["Dibuang ke tempat sampah", "Ditaruh di bawah meja teman", "Dilempar ke atap kantin", "Ditinggalkan di lapangan"],
            correctIndex: 0,
            explanation: "Menjaga kebersihan sekolah dimulai dari disiplin membuang sampah sendiri ke tempat sampah."
          },
          {
            id: 7,
            question: "Menyiram tanaman pot di depan kelas secara teratur bertujuan agar...",
            options: ["Tanaman tumbuh subur dan berbunga indah", "Tanaman menjadi cepat layu", "Halaman menjadi becek", "Pot tanaman pecah"],
            correctIndex: 0,
            explanation: "Tanaman hijau membutuhkan air untuk tumbuh dan memperindah lingkungan sekolah."
          },
          {
            id: 8,
            question: "Setelah menggunakan toilet sekolah, hal yang wajib kita lakukan adalah...",
            options: ["Menyiram air sampai bersih dan mencuci tangan", "Langsung keluar tanpa menyiram", "Mencoret dinding toilet", "Membiarkan keran air tumpah"],
            correctIndex: 0,
            explanation: "Menyiram toilet hingga bersih menjaga kesehatan bersama dan mencegah bau tak sedap."
          },
          {
            id: 9,
            question: "Lingkungan rumah yang bersih dan rapi akan membuat keluarga kita menjadi...",
            options: ["Sehat dan betah di rumah", "Mudah terserang penyakit", "Merasa tidak nyaman", "Banyak sarang nyamuk"],
            correctIndex: 0,
            explanation: "Rumah yang bersih bebas dari debu dan kuman sehingga seluruh keluarga sehat."
          },
          {
            id: 10,
            question: "Sikap kita saat melihat ada sampah berserakan di lorong sekolah adalah...",
            options: ["Mengambilnya lalu memasukkannya ke tempat sampah", "Melompati sampah tersebut", "Menyuruh teman lain memungutnya", "Pura-pura tidak melihat"],
            correctIndex: 0,
            explanation: "Kepedulian memungut sampah tanpa disuruh mencerminkan cinta pada kebersihan sekolah."
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
