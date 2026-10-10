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

interface SeniGrade2GameProps {
  levelId: number;
  onLevelComplete: (levelId: number, starsEarned: number) => void;
  accessibilityMode?: string;
}

export function SeniGrade2Game({ levelId, onLevelComplete, accessibilityMode }: SeniGrade2GameProps) {
  const [phase, setPhase] = useState<"materi" | "game">("materi");

  // Phase 1 interactive states
  const [activeColorMix, setActiveColorMix] = useState<{ mix: string; result: string; desc: string }>({
    mix: "Merah + Kuning",
    result: "Warna Jingga (Oranye)",
    desc: "Dua warna primer menghasilkan warna sekunder jingga yang hangat cerah.",
  });
  const [activePitch, setActivePitch] = useState<{ note: string; tone: string; desc: string }>({
    note: "Solmisasi Dasar",
    tone: "Do - Re - Mi - Fa - Sol - La - Si - Do'",
    desc: "Tinggi-rendah nada berjenjang dari nada rendah hingga nada tinggi.",
  });
  const [activeDailyAct, setActiveDailyAct] = useState<{ act: string; danceMove: string }>({
    act: "Menyapu Lantai",
    danceMove: "Kedua tangan memegang sapu imajiner, melangkah ke samping secara berirama.",
  });
  const [activeVoiceEmote, setActiveVoiceEmote] = useState<{ emote: string; vocal: string }>({
    emote: "Gembira",
    vocal: "Nada suara ceria, intonasi naik dan bersemangat.",
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
            KELAS 2 SD • LEVEL {levelId} dari 4
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
                  Campuran Warna Primer & Cetak Cap:
                </span>
                <div className="grid grid-cols-3 gap-2 w-full text-xs">
                  {[
                    { mix: "Merah + Kuning", result: "Jingga (Oranye)", desc: "Menghasilkan warna buah jeruk yang segar dan cerah." },
                    { mix: "Kuning + Biru", result: "Warna Hijau", desc: "Menghasilkan warna dedaunan alami yang sejuk." },
                    { mix: "Merah + Biru", result: "Warna Ungu", desc: "Menghasilkan warna buah anggur manis yang elegan." },
                  ].map((item) => (
                    <button
                      key={item.mix}
                      type="button"
                      onClick={() => {
                        setActiveColorMix(item);
                        playPopSound();
                        speakGlobal(`${item.mix} menjadi ${item.result}. ${item.desc}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeColorMix.mix === item.mix ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-xs">{item.mix}</strong>
                      <span className="text-[10px] opacity-80">= {item.result}</span>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong>{activeColorMix.mix} = {activeColorMix.result}: </strong>{activeColorMix.desc}
                </div>
              </div>
            )}

            {levelId === 2 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Alat Musik Ritmis & Solmisasi:
                </span>
                <div className="grid grid-cols-3 gap-2 w-full text-xs">
                  {[
                    { note: "Marakas", tone: "Srek... srek...", desc: "Alat musik ritmis yang digoyangkan dengan butiran biji di dalamnya." },
                    { note: "Tamborin", tone: "Cing... cing...", desc: "Bingkai bundar berlempeng logam kecil yang ditepuk dan digoyang." },
                    { note: "Rebana", tone: "Tung... plak...", desc: "Gendang pipih berbingkai kayu yang dipukul telapak tangan." },
                  ].map((item) => (
                    <button
                      key={item.note}
                      type="button"
                      onClick={() => {
                        setActivePitch(item);
                        playPopSound();
                        speakGlobal(`${item.note}: bunyinya ${item.tone}. ${item.desc}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activePitch.note === item.note ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-xs">{item.note}</strong>
                      <span className="text-[10px] opacity-80">{item.tone}</span>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong>{activePitch.note} ({activePitch.tone}): </strong>{activePitch.desc}
                </div>
              </div>
            )}

            {levelId === 3 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Gerak Maknawi Aktivitas Harian:
                </span>
                <div className="grid grid-cols-3 gap-2 w-full text-xs">
                  {[
                    { act: "Menyapu", danceMove: "Kedua tangan memegang sapu imajiner, melangkah ke samping berirama." },
                    { act: "Menjemur Pakaian", danceMove: "Kedua tangan mengangkat kain ke atas lalu menjepitnya di tali." },
                    { act: "Mendayung Perahu", danceMove: "Badan condong ke depan dan tangan mengayun dayung ke belakang." },
                  ].map((a) => (
                    <button
                      key={a.act}
                      type="button"
                      onClick={() => {
                        setActiveDailyAct(a);
                        playPopSound();
                        speakGlobal(`Aktivitas ${a.act}: ${a.danceMove}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeDailyAct.act === a.act ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-xs">{a.act}</strong>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong>Gerak {activeDailyAct.act}: </strong>{activeDailyAct.danceMove}
                </div>
              </div>
            )}

            {levelId === 4 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Artikulasi & Empat Emosi Dasar:
                </span>
                <div className="grid grid-cols-4 gap-1.5 w-full text-xs">
                  {[
                    { emote: "Senang", vocal: "Suara renyah bersemangat dan tersenyum gembira." },
                    { emote: "Sedih", vocal: "Suara pelan perlahan dan pandangan menunduk sayu." },
                    { emote: "Marah", vocal: "Suara tegas bervolume kuat dan alis bertaut rapat." },
                    { emote: "Takut", vocal: "Suara bergetar ragu dan tubuh sedikit gemetar." },
                  ].map((e) => (
                    <button
                      key={e.emote}
                      type="button"
                      onClick={() => {
                        setActiveVoiceEmote(e);
                        playPopSound();
                        speakGlobal(`Emosi ${e.emote}: ${e.vocal}`);
                      }}
                      className={`p-2 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeVoiceEmote.emote === e.emote ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-[11px]">{e.emote}</strong>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong>Emosi {activeVoiceEmote.emote}: </strong>{activeVoiceEmote.vocal}
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
        title: "Seni Rupa: Warna Sekunder, Pola Garis, dan Cetak Cap",
        conceptText: "Warna sekunder terbentuk dari pencampuran dua warna primer: Merah + Kuning = Jingga, Kuning + Biru = Hijau, Merah + Biru = Ungu. Pola garis geometris (kotak, segitiga) dan organis (daun, awan) dapat digabungkan dengan teknik cetak cap dari pelepah pisang atau cetak jari (finger painting).",
        questions: [
          {
            id: 1,
            question: "Warna sekunder yang dihasilkan dari percampuran warna kuning dan biru adalah...",
            options: ["Warna hijau", "Warna jingga", "Warna ungu", "Warna cokelat"],
            correctIndex: 0,
            explanation: "Kuning dan biru menghasilkan warna sekunder hijau."
          },
          {
            id: 2,
            question: "Jika warna merah dicampurkan secara seimbang dengan warna biru, akan menghasilkan warna...",
            options: ["Warna ungu", "Warna hijau", "Warna jingga", "Warna hitam"],
            correctIndex: 0,
            explanation: "Pencampuran warna merah dan biru menghasilkan warna sekunder ungu."
          },
          {
            id: 3,
            question: "Teknik melukis bebas menggunakan ujung jari tangan yang dicelupkan ke pasta warna disebut...",
            options: ["Finger painting (lukis jari)", "Origami lipat", "Anyaman bambu", "Pahat batu"],
            correctIndex: 0,
            explanation: "Finger painting melatih kebebasan berekspresi dan motorik halus melalui jari tangan."
          },
          {
            id: 4,
            question: "Bahan alam yang dapat dipotong melintang lalu dicelup cat untuk dijadikan stempel cap bunga adalah...",
            options: ["Pelepah daun pisang atau belimbing", "Batu kali yang keras", "Kaca jendela", "Kawat besi"],
            correctIndex: 0,
            explanation: "Penampang pelepah pisang atau buah belimbing memiliki motif alami indah untuk teknik cetak cap."
          },
          {
            id: 5,
            question: "Garis geometris adalah garis yang teratur dan terukur, contohnya adalah bentuk...",
            options: ["Bujur sangkar, lingkaran, dan segitiga", "Garis tumpahan air acak", "Bentuk gumpalan awan", "Bentuk daun layu"],
            correctIndex: 0,
            explanation: "Bentuk geometris memiliki ukuran dan sudut beraturan seperti persegi dan segitiga."
          },
          {
            id: 6,
            question: "Bentuk organis adalah bentuk bebas alami yang sering kita jumpai di alam, misalnya bentuk...",
            options: ["Bentuk daun, batu karang, dan ombak air", "Kotak balok kubus", "Piramida segitiga", "Papan catur"],
            correctIndex: 0,
            explanation: "Bentuk organis meniru lekukan alami alam semesta yang lentur dan tidak bersudut kaku."
          },
          {
            id: 7,
            question: "Pencampuran warna merah dengan kuning menghasilkan warna...",
            options: ["Jingga (oranye)", "Hijau lumut", "Biru muda", "Abu-abu"],
            correctIndex: 0,
            explanation: "Merah dicampur kuning menghasilkan warna sekunder jingga atau oranye."
          },
          {
            id: 8,
            question: "Sebelum melakukan cap pelepah pisang di buku gambar, kita sebaiknya mengoleskan pewarna pada...",
            options: ["Busa atau spons basah sebagai bantalan tinta", "Air yang banyak mengalir", "Lantai kelas", "Pakaian seragam"],
            correctIndex: 0,
            explanation: "Bantalan spons membuat pewarna merata dan hasil cap tidak becek meluber di atas kertas."
          },
          {
            id: 9,
            question: "Susunan garis lurus yang berulang secara rapi dan berselang-seling akan membentuk...",
            options: ["Pola garis berulang (ritme visual)", "Kekacauan gambar", "Goresan rusak", "Bercak kotor"],
            correctIndex: 0,
            explanation: "Pola garis teratur menciptakan ritme dan keindahan dekoratif pada karya seni rupa."
          },
          {
            id: 10,
            question: "Perasaan kita saat melihat hasil lukisan cetak cap yang rapi dan berwarna-warni adalah...",
            options: ["Senang, bangga, dan puas dengan hasil karya sendiri", "Malu dan sedih", "Ingin merobek gambarnya", "Bosan"],
            correctIndex: 0,
            explanation: "Membuat karya seni dengan tangan sendiri menumbuhkan rasa bangga dan percaya diri."
          }
        ]
      };

    case 2:
      return {
        title: "Seni Musik: Tinggi-Rendah Nada dan Alat Musik Ritmis",
        conceptText: "Tangga nada solmisasi (Do, Re, Mi, Fa, Sol, La, Si, Do') mengajarkan susunan nada dari rendah ke tinggi. Alat musik ritmis adalah alat musik yang tidak bernada tetapi mengatur tempo dan irama lagu, seperti marakas, rebana, tamborin, kastanyet, dan tepukan tangan.",
        questions: [
          {
            id: 1,
            question: "Urutan tinggi-rendah nada yang tersusun berjenjang (Do-Re-Mi-Fa-Sol-La-Si-Do) disebut...",
            options: ["Tangga nada solmisasi", "Pola lantai", "Tekstur nada", "Warna primer"],
            correctIndex: 0,
            explanation: "Solmisasi adalah sistem tangga nada dasar untuk melatih kepekaan tinggi-rendah nada lagu."
          },
          {
            id: 2,
            question: "Alat musik yang tidak memiliki nada melodis tetapi berfungsi mengatur ketukan lagu disebut alat musik...",
            options: ["Ritmis", "Melodis", "Harmonis", "Elektronik"],
            correctIndex: 0,
            explanation: "Alat musik ritmis menghasilkan ketukan dan tempo yang stabil bagi penyanyi dan pemain musik."
          },
          {
            id: 3,
            question: "Alat musik ritmis berbentuk labu bundar berisi butiran kecil yang dimainkan dengan cara digoyang-goyangkan adalah...",
            options: ["Marakas", "Pianika", "Seruling bambu", "Gitar petik"],
            correctIndex: 0,
            explanation: "Marakas dimainkan dengan menggoyang-goyangkan gagangnya hingga butiran di dalamnya berbunyi srek-srek."
          },
          {
            id: 4,
            question: "Alat musik ritmis tradisional berupa bingkai kayu bundar beralas kulit lembu yang dipukul dengan telapak tangan adalah...",
            options: ["Rebana", "Biola", "Terompet", "Piano"],
            correctIndex: 0,
            explanation: "Rebana sering dimainkan dalam musik qasidah dan hadrah sebagai instrumen ritmis pukul."
          },
          {
            id: 5,
            question: "Pada tangga nada Do - Re - Mi - Fa - Sol, nada yang terdengar paling tinggi adalah nada...",
            options: ["Sol", "Do", "Re", "Mi"],
            correctIndex: 0,
            explanation: "Dalam urutan Do, Re, Mi, Fa, Sol, nada Sol menduduki tingkatan nada yang paling tinggi di antaranya."
          },
          {
            id: 6,
            question: "Alat musik tamborin dimainkan dengan cara...",
            options: ["Ditepuk dan digoyangkan hingga lempengan logamnya bergemerincing", "Ditiup lubang udaranya", "Dipetik dawainya", "Digesek busurnya"],
            correctIndex: 0,
            explanation: "Tamborin memiliki kepingan logam kecil yang bergemerincing saat ditepuk atau digoyang."
          },
          {
            id: 7,
            question: "Kastanyet adalah sepasang kepingan kayu berbentuk kerang yang dibunyikan dengan cara...",
            options: ["Dikatupkan menggunakan ibu jari dan jari tangan", "Ditiup kencang", "Diinjak kaki", "Diputar di meja"],
            correctIndex: 0,
            explanation: "Kastanyet dibunyikan dengan mengatupkan kedua belah keping kayunya mengikuti ketukan."
          },
          {
            id: 8,
            question: "Manfaat memainkan alat musik ritmis secara bersama-sama dalam satu kelompok kelas adalah melatih...",
            options: ["Kekompakan, disiplin ketukan, dan konsentrasi", "Saling adu keras suara", "Bermain sendiri-sendiri", "Membuat keributan"],
            correctIndex: 0,
            explanation: "Ansambel ritmis melatih pendengaran dan kerja sama regu agar irama terdengar serempak."
          },
          {
            id: 9,
            question: "Tanda ketukan yang berbunyi teratur seperti detak jarum jam dalam lagu disebut...",
            options: ["Ketukan pulsa / birama stabil", "Nada sumbang", "Suara berisik", "Desir angin"],
            correctIndex: 0,
            explanation: "Pulsa adalah rangkaian ketukan dasar yang konstan dan berulang secara stabil sepanjang lagu."
          },
          {
            id: 10,
            question: "Saat menyanyikan nada yang semakin tinggi, pita suara kita akan...",
            options: ["Menyesuaikan getaran nada tinggi secara rileks tanpa berteriak histeris", "Memaksa berteriak kencang", "Menutup mulut rapat", "Berbisik pelan"],
            correctIndex: 0,
            explanation: "Bernyanyi nada tinggi dilakukan dengan pernapasan yang baik tanpa memaksa berteriak serak."
          }
        ]
      };

    case 3:
      return {
        title: "Seni Tari: Gerak Murni dan Gerak Maknawi",
        conceptText: "Gerak tari terbagi menjadi gerak murni (gerak indah tanpa makna tertentu, seperti melambaikan selendang) dan gerak maknawi (gerak yang mengandung arti khusus, seperti menirukan petani mencangkul, ibu menenun, atau menyapu lantai). Semua dirangkai menjadi tarian pendek yang selaras.",
        questions: [
          {
            id: 1,
            question: "Gerak tari yang memiliki arti atau pesan tertentu dari kehidupan manusia disebut gerak...",
            options: ["Gerak maknawi", "Gerak murni", "Gerak kaku", "Gerak diam"],
            correctIndex: 0,
            explanation: "Gerak maknawi menirukan perbuatan nyata manusia yang diolah menjadi gerakan tari berkarakter."
          },
          {
            id: 2,
            question: "Sebaliknya, gerak tari yang semata-mata mengutamakan keindahan gerakan tanpa maksud tertentu dinamakan...",
            options: ["Gerak murni", "Gerak maknawi", "Gerak teater", "Gerak pantomim"],
            correctIndex: 0,
            explanation: "Gerak murni mementingkan keluwesan dan estetika bentuk gerak tubuh penari."
          },
          {
            id: 3,
            question: "Contoh gerak maknawi yang menirukan aktivitas seorang petani di sawah adalah gerak...",
            options: ["Mencangkul tanah dan menabur benih padi", "Mengetik komputer", "Mengemudikan pesawat terbang", "Menonton televisi"],
            correctIndex: 0,
            explanation: "Gerak mencangkul dan menabur benih padi menggambarkan kerja keras petani di sawah."
          },
          {
            id: 4,
            question: "Gerak melambaikan selendang secara anggun ke kanan dan ke kiri termasuk contoh gerak...",
            options: ["Gerak murni", "Gerak maknawi mencuci baju", "Gerak tidur", "Gerak makan"],
            correctIndex: 0,
            explanation: "Melambaikan selendang mengedepankan keindahan dan kelenturan gerak penari (gerak murni)."
          },
          {
            id: 5,
            question: "Gerakan menirukan ibu menjemur pakaian dalam tarian dilakukan dengan...",
            options: ["Mengangkat kedua tangan ke atas tali jemuran dan melangkah anggun", "Melompat berguling di lantai", "Duduk bersila terdiam", "Berlari kencang menghindar"],
            correctIndex: 0,
            explanation: "Kedua tangan diangkat ke atas seolah mengibaskan dan menyampirkan kain basah di jemuran."
          },
          {
            id: 6,
            question: "Koordinasi gerak dalam tari berarti adanya keserasian antara gerak...",
            options: ["Kepala, tangan, badan, kaki, dan iringan musik", "Hanya satu jempol tangan", "Pakaian yang dipakai saja", "Penonton di luar gedung"],
            correctIndex: 0,
            explanation: "Koordinasi tubuh memadukan seluruh anggota badan agar bergerak harmonis mengikuti alunan musik."
          },
          {
            id: 7,
            question: "Menirukan aktivitas nelayan di laut dalam gerak tari dapat diwujudkan dengan gerak...",
            options: ["Mendayung perahu dan menebarkan jala ikan", "Memanjat pohon kelapa", "Mencuci motor", "Memotong kue ulang tahun"],
            correctIndex: 0,
            explanation: "Mendayung perahu dan menarik jala jaring ikan adalah simbol gerak kehidupan nelayan."
          },
          {
            id: 8,
            question: "Penyusunan rangkaian beberapa gerakan tari dari awal hingga akhir pertunjukan disebut...",
            options: ["Koreografi tarian", "Sketsa gambar", "Notasi birama", "Babak naskah"],
            correctIndex: 0,
            explanation: "Koreografi adalah susunan rangkaian ragam gerak tari yang dirancang menjadi satu pertunjukan utuh."
          },
          {
            id: 9,
            question: "Sikap tubuh penari yang baik saat bergerak di atas panggung adalah...",
            options: ["Tegak luwes, percaya diri, dan tersenyum ramah", "Membungkuk lemas dan malu-malu", "Kaku seperti patung es", "Menutup mata"],
            correctIndex: 0,
            explanation: "Postur tubuh yang tegap luwes memancarkan energi positif dan keindahan tarian."
          },
          {
            id: 10,
            question: "Tujuan menarikan gerak aktivitas sehari-hari dalam seni tari adalah untuk...",
            options: ["Mengagumi kerja keras manusia dan melestarikan budaya bangsa", "Mengejek pekerjaan orang lain", "Membuat badan cepat lelah", "Menghabiskan waktu saja"],
            correctIndex: 0,
            explanation: "Tari tematik keseharian menumbuhkan rasa syukur dan apresiasi atas profesi mulia di masyarakat."
          }
        ]
      };

    case 4:
      return {
        title: "Seni Teater: Artikulasi Suara, Peran Mikro, dan Emosi",
        conceptText: "Dalam seni teater, artikulasi adalah kejelasan pelafalan kata huruf vokal (A, I, U, E, O) dan konsonan. Pemain teater belajar bermain peran mikro menggunakan benda sehari-hari sebagai properti, serta mengekspresikan empat emosi dasar: senang, sedih, marah, dan takut.",
        questions: [
          {
            id: 1,
            question: "Kejelasan pengucapan kata demi kata agar dialog mudah didengar dan dipahami penonton disebut...",
            options: ["Artikulasi suara", "Tempo birama", "Pola lantai", "Tekstur lukisan"],
            correctIndex: 0,
            explanation: "Artikulasi yang baik memastikan setiap kata vokal dan konsonan terdengar jelas oleh penonton."
          },
          {
            id: 2,
            question: "Huruf vokal yang harus dilatih dengan membuka rongga mulut secara sempurna adalah huruf...",
            options: ["A, I, U, E, O", "B, C, D, F, G", "X, Y, Z", "K, L, M, N"],
            correctIndex: 0,
            explanation: "Latihan vokal A-I-U-E-O membuka pita suara dan melenturkan otot bibir serta lidah aktor."
          },
          {
            id: 3,
            question: "Empat emosi dasar yang sering diperagakan dalam latihan seni peran adalah...",
            options: ["Senang, sedih, marah, dan takut", "Kaya, miskin, pintar, dan malas", "Panas, dingin, hangat, dan sejuk", "Merah, kuning, hijau, dan biru"],
            correctIndex: 0,
            explanation: "Senang, sedih, marah, dan takut adalah emosi dasar manusia yang mendasari penokohan teater."
          },
          {
            id: 4,
            question: "Saat memerankan tokoh yang sedang marah, ciri vokal dan ekspresi yang tepat adalah...",
            options: ["Nada suara tegas meninggi dan alis mata bertaut rapat", "Tertawa terkikik-kikik", "Berbisik pelan sambil tersenyum", "Menguap mengantuk"],
            correctIndex: 0,
            explanation: "Kemarahan di panggung diekspresikan dengan ketegasan vokal dan sorot mata tajam terfokus."
          },
          {
            id: 5,
            question: "Ketika memerankan adegan sedih karena boneka kesayangan hilang, ekspresi suara yang cocok adalah...",
            options: ["Suara pelan, lirih, dan mata menunduk murung", "Suara berteriak gembira", "Tertawa riang gembira", "Bernyanyi lagu ceria"],
            correctIndex: 0,
            explanation: "Kesedihan diwujudkan melalui tempo lambat, intonasi menurun, dan ekspresi berduka."
          },
          {
            id: 6,
            question: "Bermain peran mikro dengan menggunakan benda harian, misalnya memakai sapu sebagai...",
            options: ["Kuda tunggangan imajiner seorang ksatria", "Bantal tidur empuk", "Piring makan", "Gelas minum"],
            correctIndex: 0,
            explanation: "Imajinasi teater mikro mengubah gagang sapu menjadi kuda tunggangan yang gagah perkasa."
          },
          {
            id: 7,
            question: "Ketika seorang aktor merasa takut saat mendengar suara gemuruh petir, tubuhnya akan...",
            options: ["Meringkuk sedikit gemetar dan mencari tempat berlindung", "Melompat gembira sambil menari", "Tidur terlentang santai", "Tertawa lepas"],
            correctIndex: 0,
            explanation: "Rasa takut direspons tubuh dengan gerakan melindungi diri dan ketegangan otot."
          },
          {
            id: 8,
            question: "Posisi pemain di panggung agar tidak membelakangi penonton saat berdialog disebut menjaga...",
            options: ["Arah hadap panggung (blocking terbuka)", "Jarak lari cepat", "Tinggi badan", "Ketukan musik"],
            correctIndex: 0,
            explanation: "Aktor harus menjaga posisi tubuh terbuka ke arah penonton agar ekspresi wajahnya terlihat jelas."
          },
          {
            id: 9,
            question: "Dialog singkat antara dua orang pemeran di atas panggung disebut percakapan...",
            options: ["Dialog drama", "Monolog sendiri", "Kidung lagu", "Surat kabar"],
            correctIndex: 0,
            explanation: "Dialog adalah percakapan timbal balik antara dua tokoh atau lebih dalam pementasan."
          },
          {
            id: 10,
            question: "Kunci utama keberhasilan pementasan drama mikro di kelas bersama teman adalah...",
            options: ["Kerja sama kelompok, saling menyimak dialog, dan percaya diri", "Saling berebut bicara di depan", "Mengejek teman yang lupa dialog", "Menangis lari keluar kelas"],
            correctIndex: 0,
            explanation: "Saling mendukung dan mendengarkan antarpemain menghasilkan pertunjukan yang harmonis dan seru."
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
