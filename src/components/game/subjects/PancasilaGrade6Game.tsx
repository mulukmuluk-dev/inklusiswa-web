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

interface PancasilaGrade6GameProps {
  levelId: number;
  onLevelComplete: (levelId: number, starsEarned: number) => void;
  accessibilityMode?: string;
}

export function PancasilaGrade6Game({ levelId, onLevelComplete, accessibilityMode }: PancasilaGrade6GameProps) {
  const [phase, setPhase] = useState<"materi" | "game">("materi");

  // Phase 1 interactive states
  const [activeBullyAction, setActiveBullyAction] = useState<{ type: string; remedy: string }>({
    type: "Stop Perundungan Fisik & Verbal",
    remedy: "Menolak ejekan, membela korban, dan segera melapor kepada guru atau pihak sekolah.",
  });
  const [activeDemocracy, setActiveDemocracy] = useState<{ step: string; principle: string }>({
    step: "Musyawarah Mufakat",
    principle: "Mendengarkan semua pendapat peserta dan mencari titik temu yang disetujui bersama.",
  });
  const [activeLocalWisdom, setActiveLocalWisdom] = useState<{ wisdom: string; region: string; lesson: string }>({
    wisdom: "Subak",
    region: "Bali",
    lesson: "Sistem irigasi persawahan tradisional berbasis filosofi Tri Hita Karana (harmoni dengan alam & sesama).",
  });
  const [activeSovereignty, setActiveSovereignty] = useState<{ domain: string; guardian: string; studentRole: string }>({
    domain: "Kedaulatan Wilayah (Darat, Laut, Udara)",
    guardian: "TNI & Seluruh Rakyat Indonesia (Sishankamrata)",
    studentRole: "Belajar tekun, disiplin, mencintai produk tanah air, dan menjaga persatuan.",
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
                  Pengamalan Pancasila & Anti-Bullying:
                </span>
                <div className="grid grid-cols-3 gap-2 w-full text-xs">
                  {[
                    { type: "Cegah Cyberbullying", remedy: "Bijak bermedia sosial, tidak menyebarkan fitnah atau komentar kebencian." },
                    { type: "Keadilan Sosial", remedy: "Tidak membeda-bedakan kawan berdasarkan status sosial atau ekonomi." },
                    { type: "Rasa Kemanusiaan", remedy: "Menolong teman yang diintimidasi dan melaporkan kepada bapak/ibu guru." },
                  ].map((item) => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => {
                        setActiveBullyAction(item);
                        playPopSound();
                        speakGlobal(`${item.type}: ${item.remedy}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeBullyAction.type === item.type ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-xs">{item.type}</strong>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong>{activeBullyAction.type}: </strong>{activeBullyAction.remedy}
                </div>
              </div>
            )}

            {levelId === 2 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Tahapan Demokrasi Pancasila:
                </span>
                <div className="grid grid-cols-3 gap-2 w-full text-xs">
                  {[
                    { step: "1. Musyawarah Mufakat", principle: "Mendengarkan aspirasi semua pihak untuk mencapai kata sepakat secara bulat." },
                    { step: "2. Voting (Pemungutan Suara)", principle: "Dilakukan jika mufakat tidak tercapai melalui suara terbanyak yang adil." },
                    { step: "3. Pelaksanaan Bertanggung Jawab", principle: "Menerima hasil keputusan dengan lapang dada dan ikhlas melaksanakannya." },
                  ].map((demo) => (
                    <button
                      key={demo.step}
                      type="button"
                      onClick={() => {
                        setActiveDemocracy(demo);
                        playPopSound();
                        speakGlobal(`${demo.step}: ${demo.principle}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeDemocracy.step === demo.step ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-xs">{demo.step}</strong>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong>{activeDemocracy.step}: </strong>{activeDemocracy.principle}
                </div>
              </div>
            )}

            {levelId === 3 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Kearifan Lokal Nusantara:
                </span>
                <div className="grid grid-cols-3 gap-2 w-full text-xs">
                  {[
                    { wisdom: "Subak", region: "Bali", lesson: "Irigasi sawah demokratis berlandaskan Tri Hita Karana." },
                    { wisdom: "Sasi", region: "Maluku & Papua", lesson: "Larangan adat memanen hasil laut/hutan tertentu demi kelestarian alam." },
                    { wisdom: "Gugur Gunung", region: "Jawa", lesson: "Gotong royong sukarela warga demi kepentingan umum tanpa pamrih." },
                  ].map((wis) => (
                    <button
                      key={wis.wisdom}
                      type="button"
                      onClick={() => {
                        setActiveLocalWisdom(wis);
                        playPopSound();
                        speakGlobal(`Kearifan ${wis.wisdom} dari ${wis.region}: ${wis.lesson}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeLocalWisdom.wisdom === wis.wisdom ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-xs">{wis.wisdom}</strong>
                      <span className="text-[10px] opacity-80">{wis.region}</span>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong>Kearifan {activeLocalWisdom.wisdom} ({activeLocalWisdom.region}): </strong>{activeLocalWisdom.lesson}
                </div>
              </div>
            )}

            {levelId === 4 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Pertahanan & Kedaulatan Bangsa:
                </span>
                <div className="grid grid-cols-2 gap-2 w-full text-xs">
                  {[
                    { domain: "Sistem Pertahanan Semesta (Sishankamrata)", guardian: "TNI sebagai komponen utama, rakyat sebagai komponen cadangan/pendukung.", studentRole: "Pelajar membela negara lewat disiplin, prestasi, dan cinta tanah air." },
                    { domain: "Diplomasi & Perdamaian Dunia", guardian: "Politik luar negeri bebas aktif berdasarkan Pembukaan UUD 1945.", studentRole: "Menghormati bangsa lain dan menjunjung tinggi perdamaian antarbangsa." },
                  ].map((sov) => (
                    <button
                      key={sov.domain}
                      type="button"
                      onClick={() => {
                        setActiveSovereignty(sov);
                        playPopSound();
                        speakGlobal(`${sov.domain}. Peran: ${sov.studentRole}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeSovereignty.domain === sov.domain ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-[11px]">{sov.domain}</strong>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong>{activeSovereignty.domain}: </strong>{activeSovereignty.studentRole}
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
        title: "Pengamalan Nilai-Nilai Pancasila secara Utuh",
        conceptText: "Pengamalan butir-butir Pancasila harus dijalankan secara utuh dan terpadu. Kita harus menegakkan keadilan sosial, menolak diskriminasi, mencegah aksi perundungan (bullying) baik secara verbal, fisik, maupun daring (cyberbullying), serta menjaga keharmonisan masyarakat yang majemuk.",
        questions: [
          {
            id: 1,
            question: "Tindakan perundungan (bullying) di sekolah sangat bertentangan dengan Pancasila, terutama sila ke-...",
            options: ["Dua (Kemanusiaan yang Adil dan Beradab)", "Satu", "Tiga", "Empat"],
            correctIndex: 0,
            explanation: "Perundungan merendahkan martabat kemanusiaan dan merusak rasa keadilan serta persaudaraan."
          },
          {
            id: 2,
            question: "Jika melihat seorang teman sedang diintimidasi atau diejek di media sosial (cyberbullying), sikap kita adalah...",
            options: ["Membela korban, menolak menyebarkannya, dan melaporkan ke guru atau orang tua", "Ikut menyebarkan ejekan tersebut di grup chat", "Menertawakan postingan hinaan tersebut", "Mendukung pelaku perundungan"],
            correctIndex: 0,
            explanation: "Menolak perundungan daring dan melapor ke pihak berwenang/guru melindungi mental korban."
          },
          {
            id: 3,
            question: "Sikap tidak memaksakan agama atau kepercayaan kita kepada orang lain merupakan butir pengamalan dari sila ke-...",
            options: ["Satu (Ketuhanan Yang Maha Esa)", "Dua", "Tiga", "Lima"],
            correctIndex: 0,
            explanation: "Sila pertama mengajarkan kebebasan memeluk keyakinan tanpa ada paksaan dari pihak mana pun."
          },
          {
            id: 4,
            question: "Perilaku hidup sederhana, hemat, dan gemar menabung merupakan cerminan pengamalan sila ke-...",
            options: ["Lima (Keadilan Sosial bagi Seluruh Rakyat Indonesia)", "Satu", "Dua", "Tiga"],
            correctIndex: 0,
            explanation: "Sila kelima melarang pemborosan dan gaya hidup bermewah-mewahan yang melukai rasa keadilan sosial."
          },
          {
            id: 5,
            question: "Menjaga keseimbangan antara hak pribadi dan kewajiban sosial di lingkungan sekolah bertujuan agar...",
            options: ["Tercipta suasana yang harmonis, tertib, dan adil bagi seluruh warga sekolah", "Satu murid dapat berkuasa di atas yang lain", "Sekolah menjadi sepi", "Semua murid bebas melanggar tata tertib"],
            correctIndex: 0,
            explanation: "Keseimbangan hak dan kewajiban menciptakan keadilan sosial di lingkungan pendidikan."
          },
          {
            id: 6,
            question: "Salah satu upaya nyata dalam mencegah intoleransi di pergaulan antarremaja adalah...",
            options: ["Membiasakan dialog santun dan saling menghargai tradisi keagamaan yang berbeda", "Membuat kelompok pertemanan berdasarkan suku tertentu saja", "Melarang teman merayakan hari raya agamanya", "Menghakimi keyakinan orang lain"],
            correctIndex: 0,
            explanation: "Dialog santun dan sikap terbuka memupuk toleransi sejati di tengah keragaman."
          },
          {
            id: 7,
            question: "Pancasila dikatakan sebagai satu kesatuan yang utuh dan bulat (organik) karena...",
            options: ["Kelima sila saling menjiwai, melengkapi, dan tidak dapat dipisahkan satu sama lain", "Sila pertama dapat dihapus jika perlu", "Sila kelima tidak berhubungan dengan sila pertama", "Urutan sila boleh dibolak-balik"],
            correctIndex: 0,
            explanation: "Pancasila adalah sistem nilai terpadu hierarkis yang tiap silanya menjiwai sila-sila berikutnya."
          },
          {
            id: 8,
            question: "Tindakan mendahulukan kepentingan bangsa dan negara di atas kepentingan pribadi atau partai politik mencerminkan sila ke-...",
            options: ["Tiga (Persatuan Indonesia)", "Dua", "Empat", "Satu"],
            correctIndex: 0,
            explanation: "Cinta tanah air dan rela berkorban demi keutuhan bangsa adalah ruh utama Sila ke-3."
          },
          {
            id: 9,
            question: "Saat ada teman yang mengalami musibah kebakaran rumah, bentuk solidaritas Pancasila yang kita berikan adalah...",
            options: ["Menggalang bantuan pakaian layak dan makanan bersama teman-teman sekolah", "Menonton musibah tersebut sambil tertawa", "Menyalahkan korban yang teledor", "Pura-pura tidak mengetahuinya"],
            correctIndex: 0,
            explanation: "Menggalang bantuan meringankan beban sesama adalah wujud nyata gotong royong dan kemanusiaan."
          },
          {
            id: 10,
            question: "Penerapan keadilan sosial di ruang kelas dapat diwujudkan oleh guru dan murid melalui...",
            options: ["Pemberian kesempatan yang sama kepada setiap murid untuk berpendapat dan berprestasi", "Hanya memberi nilai bagus kepada murid yang kaya", "Membeda-bedakan perhatian guru", "Memilih regu piket berdasarkan suku"],
            correctIndex: 0,
            explanation: "Keadilan di kelas berarti kesetaraan kesempatan bagi semua murid untuk maju dan dihargai."
          }
        ]
      };

    case 2:
      return {
        title: "Musyawarah dan Demokrasi",
        conceptText: "Demokrasi Pancasila menjunjung tinggi kedaulatan rakyat yang dipimpin oleh hikmat kebijaksanaan. Pengambilan keputusan bersama diutamakan melalui musyawarah untuk mencapai mufakat. Jika mufakat tidak tercapai, pemungutan suara (voting) dapat dilakukan secara jujur dan adil. Setiap warga memiliki hak mengemukakan pendapat secara santun.",
        questions: [
          {
            id: 1,
            question: "Ciri utama sistem Demokrasi Pancasila yang membedakannya dari demokrasi liberal barat adalah...",
            options: ["Mengutamakan asas musyawarah untuk mencapai mufakat secara kekeluargaan", "Selalu menyelesaikan setiap masalah dengan voting kilat", "Mengabaikan hak kelompok minoritas", "Keputusan mutlak berada di tangan pemodal kaya"],
            correctIndex: 0,
            explanation: "Demokrasi Pancasila bertumpu pada musyawarah mufakat, semangat kekeluargaan, dan hikmat kebijaksanaan."
          },
          {
            id: 2,
            question: "Tujuan utama diadakannya musyawarah dalam sebuah rapat organisasi atau kelas adalah...",
            options: ["Mencapai kesepakatan bersama (mufakat) yang disetujui semua pihak dengan ikhlas", "Mencari siapa yang paling pandai berdebat", "Memenangkan usulan ketua kelas saja", "Menghabiskan waktu jam pelajaran"],
            correctIndex: 0,
            explanation: "Musyawarah bertujuan mencari jalan keluar terbaik yang disepakati bersama demi kepentingan bersama."
          },
          {
            id: 3,
            question: "Jika dalam musyawarah pemilihan ketua regu tidak tercapai kata sepakat secara bulat, langkah demokratis berikutnya adalah...",
            options: ["Melakukan pemungutan suara (voting) secara adil dan terbuka", "Membubarkan regu dan saling bertengkar", "Menunjuk siapa yang paling kuat berkelahi", "Menunda kegiatan selamanya"],
            correctIndex: 0,
            explanation: "Voting ditempuh sebagai jalan keluar konstitusional jika musyawarah mufakat mengalami kebuntuan."
          },
          {
            id: 4,
            question: "Sikap yang wajib kita tunjukkan ketika menyampaikan pendapat dalam sebuah forum musyawarah adalah...",
            options: ["Menyampaikan ide dengan bahasa santun, jelas, dan tidak memotong pembicaraan orang lain", "Berteriak dan memukul meja rapat", "Menghina usulan yang diajukan teman lain", "Memaksa semua orang menyetujui ide kita"],
            correctIndex: 0,
            explanation: "Hak berpendapat harus dijalankan dengan etika santun, menghormati hak bicara peserta lain."
          },
          {
            id: 5,
            question: "Bagaimanakah sikap seorang peserta musyawarah jika usulannya tidak terpilih dalam keputusan final rapat?",
            options: ["Berjiwa besar, menerima keputusan, dan tetap ikut melaksanakan dengan penuh tanggung jawab", "Marah lalu keluar ruangan dan merusak kursi", "Mengajak teman lain untuk memboikot hasil rapat", "Mengejek usulan yang menang"],
            correctIndex: 0,
            explanation: "Kedewasaan berdemokrasi ditunjukkan dengan lapang dada menerima hasil mufakat demi kepentingan bersama."
          },
          {
            id: 6,
            question: "Asas pemilu di Indonesia yang disingkat LUBER dan JURDIL memiliki arti...",
            options: ["Langsung, Umum, Bebas, Rahasia, Jujur, dan Adil", "Lega, Unggul, Bersih, Rapi, Jelas, dan Ikhlas", "Lengkap, Unik, Bersama, Rukun, Jiwa, dan Damai", "Lancar, Utuh, Benar, Rapi, Juara, dan Disiplin"],
            correctIndex: 0,
            explanation: "Luber dan Jurdil adalah asas pemilu demokratis di Indonesia menurut Pasal 22E UUD 1945."
          },
          {
            id: 7,
            question: "Hak kebebasan mengemukakan pendapat di muka umum bagi warga negara Indonesia dijamin oleh UUD 1945 pada pasal...",
            options: ["Pasal 28E ayat (3)", "Pasal 33 ayat (1)", "Pasal 29 ayat (2)", "Pasal 34 ayat (1)"],
            correctIndex: 0,
            explanation: "Pasal 28E ayat (3) UUD 1945 menjamin setiap orang berhak atas kebebasan berserikat, berkumpul, dan mengeluarkan pendapat."
          },
          {
            id: 8,
            question: "Dalam rapat kelas, pemimpin musyawarah yang bijaksana harus bersikap...",
            options: ["Netral, adil, dan memberikan kesempatan berbicara secara merata kepada peserta", "Memihak kepada sahabat dekatnya saja", "Mengabaikan pendapat murid perempuan", "Memutuskan segalanya seorang diri"],
            correctIndex: 0,
            explanation: "Pemimpin musyawarah bertugas memfasilitasi jalannya rapat secara adil tanpa diskriminasi."
          },
          {
            id: 9,
            question: "Salah satu contoh musyawarah mufakat di lingkungan keluarga adalah...",
            options: ["Membicarakan bersama rencana liburan sekolah dan pembagian tugas bersih-bersih rumah", "Ayah memutuskan semuanya tanpa mendengar pendapat ibu dan anak", "Anak memaksa dibelikan gawai baru", "Masing-masing anggota keluarga tidak saling berbicara"],
            correctIndex: 0,
            explanation: "Rembuk keluarga membiasakan anak berdemokrasi dan menyampaikan aspirasi secara sehat sejak dini."
          },
          {
            id: 10,
            question: "Akibat buruk yang akan timbul jika sebuah keputusan bersama diambil secara sepihak dan otoriter adalah...",
            options: ["Muncul ketidakpuasan, kecurigaan, dan hilangnya rasa tanggung jawab bersama", "Semua pihak merasa puas dan bahagia", "Pekerjaan menjadi lebih sempurna", "Terjalin hubungan persaudaraan yang erat"],
            correctIndex: 0,
            explanation: "Keputusan otoriter merusak kepercayaan warga dan memicu konflik penolakan pelaksanaan aturan."
          }
        ]
      };

    case 3:
      return {
        title: "Bhinneka Tunggal Ika di Era Terbuka",
        conceptText: "Di era globalisasi dan era digital yang serba terbuka, arus informasi dan budaya luar negeri masuk dengan cepat. Bangsa Indonesia harus mampu menyaring pengaruh asing, melestarikan kearifan lokal (seperti Subak di Bali, Sasi di Maluku), serta menjaga jati diri budaya bangsa dengan toleransi berskala nasional.",
        questions: [
          {
            id: 1,
            question: "Sikap bijak generasi muda Indonesia dalam menghadapi derasnya arus budaya asing di era internet adalah...",
            options: ["Menyaring (memfilter) budaya luar dan teguh mempertahankan nilai luhur bangsa", "Meniru semua tren luar negeri tanpa berpikir panjang", "Menolak semua teknologi modern", "Malu mengakui kebudayaan asli Indonesia"],
            correctIndex: 0,
            explanation: "Kita harus menyerap ilmu pengetahuan positif sambil tetap melestarikan jati diri dan moral Pancasila."
          },
          {
            id: 2,
            question: "Sistem irigasi persawahan tradisional di Bali yang diakui UNESCO sebagai warisan budaya dunia adalah...",
            options: ["Subak", "Sasi", "Pranata Mangsa", "Gugur Gunung"],
            correctIndex: 0,
            explanation: "Subak adalah kearifan lokal sistem pengairan sawah di Bali yang menjunjung filosofi kebersamaan Tri Hita Karana."
          },
          {
            id: 3,
            question: "Tradisi 'Sasi' di Maluku dan Papua merupakan kearifan lokal yang bertujuan untuk...",
            options: ["Melarang pengambilan hasil laut atau hutan tertentu dalam kurun waktu demi menjaga kelestariannya", "Mengadakan pesta makan ikan besar-besaran tiap hari", "Menjual seluruh hutan adat kepada perusahaan asing", "Melarang warga menanam sayur"],
            correctIndex: 0,
            explanation: "Sasi adalah konservasi adat leluhur yang menjaga biota laut dan pohon hutan agar tidak punah tereksploitasi."
          },
          {
            id: 4,
            question: "Warisan budaya takbenda asli Indonesia berupa seni kain bergambar dan teknik malam lilin yang diakui dunia adalah...",
            options: ["Batik Indonesia", "Kimono", "Hanbok", "Sari"],
            correctIndex: 0,
            explanation: "Batik resmi ditetapkan UNESCO sebagai Masterpieces of the Oral and Intangible Heritage of Humanity sejak 2 Oktober 2009."
          },
          {
            id: 5,
            question: "Sikap kita saat melihat tren media sosial yang mengolok-olok pakaian adat atau bahasa daerah nusantara adalah...",
            options: ["Menolak konten tersebut dan mengedukasi warganet tentang keindahan warisan bangsa", "Ikut membagikan konten ejekan tersebut agar viral", "Merasa senang pakaian adat dihina", "Menghapus identitas budaya daerah kita"],
            correctIndex: 0,
            explanation: "Kita harus membela harkat budaya bangsa di ruang digital dengan aksi positif dan edukatif."
          },
          {
            id: 6,
            question: "Tradisi gotong royong sukarela di kalangan masyarakat Jawa untuk membangun fasilitas umum disebut...",
            options: ["Gugur Gunung / Sambatan", "Ngaben", "Kasada", "Sekaten"],
            correctIndex: 0,
            explanation: "Gugur Gunung adalah gotong royong kerja bakti masyarakat desa secara sukarela demi kepentingan bersama."
          },
          {
            id: 7,
            question: "Dampak buruk sikap konsumerisme dan gaya hidup individualistik yang meniru budaya asing negatif adalah...",
            options: ["Lunturnya kepedulian sosial dan memudarnya semangat gotong royong", "Semakin tingginya rasa persaudaraan", "Meningkatnya ketahanan pangan desa", "Lahirnya banyak pahlawan kebudayaan"],
            correctIndex: 0,
            explanation: "Individualisme membuat orang tidak peduli lingkungan sekitar dan mementingkan diri sendiri."
          },
          {
            id: 8,
            question: "Cara melestarikan lagu daerah nusantara di kalangan murid sekolah dasar di era modern adalah...",
            options: ["Menyanyikan dan mengaransemen lagu daerah dalam paduan suara atau festival musik sekolah", "Melarang lagu daerah dinyanyikan di kelas", "Mengganti lirik lagu daerah dengan kata-kata kasar", "Hanya mendengarkan lagu berbahasa asing"],
            correctIndex: 0,
            explanation: "Membawakan lagu daerah dengan kreasi segar membuat generasi muda mencintai karya seni leluhur."
          },
          {
            id: 9,
            question: "Pentingnya memelihara toleransi antarumat beragama berskala nasional adalah untuk mewujudkan...",
            options: ["Stabilitas keamanan nasional dan ketenteraman hidup seluruh rakyat", "Kemenangan satu kelompok agama tertentu", "Perang saudara antarpulau", "Hancurnya rasa persatuan nasional"],
            correctIndex: 0,
            explanation: "Toleransi nasional adalah pilar utama terciptanya perdamaian dan keutuhan bangsa Indonesia."
          },
          {
            id: 10,
            question: "Alasan utama UNESCO mengakui wayang kulit, keris, angklung, dan gamelan sebagai warisan budaya dunia adalah...",
            options: ["Memiliki nilai filosofis tinggi, keunikan seni, dan sejarah peradaban luhur", "Terbuat dari bahan logam yang mahal harganya", "Dapat dijual dengan harga jutaan dolar", "Hanya bisa dimainkan oleh satu orang"],
            correctIndex: 0,
            explanation: "Warisan budaya Indonesia diakui dunia karena kedalaman filosofi, kearifan pesan moral, dan estetika seninya."
          }
        ]
      };

    case 4:
      return {
        title: "Kedaulatan & Keutuhan NKRI",
        conceptText: "Kedaulatan Negara Kesatuan Republik Indonesia meliputi batas wilayah darat, laut kepulauan, dan ruang udara nasional. Seluruh rakyat memiliki kewajiban bela negara melalui Sishankamrata. Pelajar menjalankan bela negara dengan belajar tekun dan menjaga persatuan, sementara Indonesia aktif menjaga perdamaian kawasan melalui politik luar negeri bebas aktif.",
        questions: [
          {
            id: 1,
            question: "Kedaulatan wilayah suatu negara yang merdeka dan berdaulat mencakup tiga dimensi wilayah, yaitu...",
            options: ["Wilayah darat, wilayah laut perairan, dan wilayah ruang udara", "Hanya wilayah daratan yang ada kotanya", "Hanya pulau-pulau besar", "Wilayah hutan dan sungai saja"],
            correctIndex: 0,
            explanation: "Kedaulatan NKRI membentang atas seluruh daratan, perairan kepulauan (archipelagic waters), dan ruang udara di atasnya."
          },
          {
            id: 2,
            question: "Sistem pertahanan dan keamanan yang melibatkan seluruh rakyat, dipimpin oleh TNI dan POLRI, disebut...",
            options: ["Sishankamrata (Sistem Pertahanan Keamanan Rakyat Semesta)", "Wajib militer asing", "Pasukan gerilya tertutup", "Sistem tentara sewaan"],
            correctIndex: 0,
            explanation: "Sishankamrata menempatkan TNI dan Polri sebagai kekuatan utama, didukung rakyat sebagai kekuatan pendukung."
          },
          {
            id: 3,
            question: "Bentuk upaya bela negara yang paling mendasar bagi seorang siswa sekolah dasar adalah...",
            options: ["Belajar dengan sungguh-sungguh, menaati aturan hukum, dan mencintai tanah air", "Membawa senjata laras panjang ke sekolah", "Ikut serta dalam perang di garis depan", "Menyerang negara tetangga"],
            correctIndex: 0,
            explanation: "Bela negara bagi pelajar diwujudkan melalui penguasaan ilmu, disiplin budi pekerti, dan cinta tanah air."
          },
          {
            id: 4,
            question: "Politik luar negeri yang dianut oleh Negara Kesatuan Republik Indonesia adalah...",
            options: ["Bebas dan Aktif", "Liberal dan Terbuka", "Otoriter dan Tertutup", "Memihak blok barat saja"],
            correctIndex: 0,
            explanation: "Bebas artinya tidak memihak blok kekuatan dunia mana pun; Aktif artinya ikut memelihara perdamaian abadi dunia."
          },
          {
            id: 5,
            question: "Peran nyata bangsa Indonesia dalam mewujudkan perdamaian dan kerja sama kawasan Asia Tenggara diwujudkan melalui pendirian organisasi...",
            options: ["ASEAN (Association of Southeast Asian Nations)", "PBB", "NATO", "Uni Eropa"],
            correctIndex: 0,
            explanation: "Indonesia adalah salah satu dari lima negara pendiri ASEAN melalui Deklarasi Bangkok pada 8 Agustus 1967."
          },
          {
            id: 6,
            question: "Pasukan TNI yang dikirim ke berbagai negara konflik di bawah bendera Perserikatan Bangsa-Bangsa (PBB) dinamakan...",
            options: ["Kontingen Garuda", "Pasukan Singa Putih", "Detasemen Elang Emas", "Batalion Merah Putih"],
            correctIndex: 0,
            explanation: "Kontingen Garuda (Konga) adalah pasukan perdamaian TNI yang bertugas menjaga perdamaian PBB di dunia."
          },
          {
            id: 7,
            question: "Zona Ekonomi Eksklusif (ZEE) yang dimiliki Indonesia memberikan hak berdaulat untuk memanfaatkan sumber daya laut hingga jarak...",
            options: ["200 mil laut dari garis pangkal pantai", "12 mil laut", "3 mil laut", "500 mil laut"],
            correctIndex: 0,
            explanation: "Sesuai UNCLOS 1982, batas ZEE adalah 200 mil laut di mana Indonesia berhak mengelola kekayaan hayati dan mineralnya."
          },
          {
            id: 8,
            question: "Sikap kita ketika terjadi sengketa batas pulau terluar atau perbatasan negara adalah...",
            options: ["Mendukung penyelesaian jalur diplomasi hukum internasional dan memperkuat penjagaan perbatasan", "Menyerahkan pulau tersebut secara sukarela kepada negara asing", "Memusuhi seluruh warga negara tetangga", "Mengabaikannya karena pulaunya sepi"],
            correctIndex: 0,
            explanation: "Kedaulatan perbatasan dipertahankan melalui diplomasi hukum internasional serta patroli penjagaan yang kuat."
          },
          {
            id: 9,
            question: "Tujuan nasional bangsa Indonesia yang tercantum dalam Pembukaan UUD 1945 alinea keempat antara lain adalah...",
            options: ["Melindungi segenap bangsa Indonesia dan seluruh tumpah darah Indonesia serta memajukan kesejahteraan umum", "Menjajah negara-negara kecil di sekitarnya", "Menjadi negara penguasa dunia", "Menguasai seluruh kekayaan negara lain"],
            correctIndex: 0,
            explanation: "Tujuan negara: melindungi segenap bangsa, memajukan kesejahteraan umum, mencerdaskan kehidupan bangsa, dan ikut menjaga perdamaian dunia."
          },
          {
            id: 10,
            question: "Sebagai generasi penerus bangsa, janji yang harus kita rawat dalam mengisi kemerdekaan Indonesia adalah...",
            options: ["Menjaga persatuan dan kesatuan serta mengukir prestasi demi kemajuan martabat NKRI", "Bermalas-malasan dan bergantung pada negara lain", "Membiarkan perpecahan antarsuku", "Menjual kekayaan alam kepada pihak perusak lingkungan"],
            correctIndex: 0,
            explanation: "Mengisi kemerdekaan berarti menjaga keutuhan NKRI dan mengharumkan bangsa dengan prestasi berkeadaban."
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
