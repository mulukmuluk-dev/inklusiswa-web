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

interface PancasilaGrade3GameProps {
  levelId: number;
  onLevelComplete: (levelId: number, starsEarned: number) => void;
  accessibilityMode?: string;
}

export function PancasilaGrade3Game({ levelId, onLevelComplete, accessibilityMode }: PancasilaGrade3GameProps) {
  const [phase, setPhase] = useState<"materi" | "game">("materi");

  // Phase 1 interactive states
  const [activeMeaning, setActiveMeaning] = useState<{ sila: string; icon: string; makna: string }>({
    sila: "Sila 1",
    icon: "Bintang Emas",
    makna: "Cahaya ketuhanan yang membimbing bangsa Indonesia untuk saling menghormati agama.",
  });
  const [activeDuty, setActiveDuty] = useState<{ category: string; desc: string }>({
    category: "Hak Anak",
    desc: "Mendapatkan kasih sayang, perlindungan, makanan bergizi, dan pendidikan yang layak.",
  });
  const [activeCulture, setActiveCulture] = useState<{ island: string; example: string }>({
    island: "Jawa & Sunda",
    example: "Batik, Kebaya, Tari Jaipong, alat musik Angklung dan Gamelan.",
  });
  const [activeGov, setActiveGov] = useState<{ unit: string; leader: string; task: string }>({
    unit: "Desa / Kelurahan",
    leader: "Kepala Desa / Lurah",
    task: "Melayani administrasi warga, menjaga keamanan lingkungan, dan memfasilitasi posyandu.",
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
                  Eksplorasi Makna Filosofis Simbol Pancasila:
                </span>
                <div className="grid grid-cols-5 gap-1.5 w-full text-xs">
                  {[
                    { sila: "Sila 1", icon: "Bintang", makna: "Cahaya rohani dari Tuhan Yang Maha Esa untuk setiap insan beriman." },
                    { sila: "Sila 2", icon: "Rantai", makna: "Hubungan persaudaraan antarsesama manusia yang kokoh dan saling membantu." },
                    { sila: "Sila 3", icon: "Beringin", makna: "Pohon peneduh yang melambangkan kesatuan bangsa Indonesia yang kuat." },
                    { sila: "Sila 4", icon: "Banteng", makna: "Jiwa sosial berkumpul untuk bermusyawarah mufakat mengambil keputusan." },
                    { sila: "Sila 5", icon: "Padi & Kapas", makna: "Kebutuhan pangan dan sandang tercukupi merata demi keadilan sosial." },
                  ].map((s) => (
                    <button
                      key={s.sila}
                      type="button"
                      onClick={() => {
                        setActiveMeaning(s);
                        playPopSound();
                        speakGlobal(`${s.sila}: ${s.icon}. ${s.makna}`);
                      }}
                      className={`p-2 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeMeaning.sila === s.sila ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-[11px]">{s.sila}</strong>
                      <span className="text-[10px] opacity-80">{s.icon}</span>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong>{activeMeaning.sila} ({activeMeaning.icon}): </strong>{activeMeaning.makna}
                </div>
              </div>
            )}

            {levelId === 2 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Keseimbangan Hak dan Kewajiban:
                </span>
                <div className="grid grid-cols-2 gap-2 w-full text-xs">
                  {[
                    { category: "Hak Anak", desc: "Mendapatkan kasih sayang keluarga, bimbingan guru, waktu bermain, dan rasa aman." },
                    { category: "Kewajiban Anak", desc: "Belajar dengan tekun, mematuhi tata tertib, menghormati orang tua, dan menjaga kebersihan." },
                  ].map((item) => (
                    <button
                      key={item.category}
                      type="button"
                      onClick={() => {
                        setActiveDuty(item);
                        playPopSound();
                        speakGlobal(`${item.category}: ${item.desc}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeDuty.category === item.category ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-xs">{item.category}</strong>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong>{activeDuty.category}: </strong>{activeDuty.desc}
                </div>
              </div>
            )}

            {levelId === 3 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Ragam Budaya Nusantara:
                </span>
                <div className="grid grid-cols-4 gap-1.5 w-full text-xs">
                  {[
                    { island: "Sumatera", example: "Tari Saman, Rumah Gadang, kain Ulos & Songket." },
                    { island: "Jawa", example: "Batik, Rumah Joglo, Gamelan, Tari Gambyong." },
                    { island: "Bali & NTB", example: "Tari Kecak, Kain Tenun Ikat, Gamelan Gong Kebyar." },
                    { island: "Papua", example: "Rumah Honai, Tari Yospan, Alat musik Tifa." },
                  ].map((c) => (
                    <button
                      key={c.island}
                      type="button"
                      onClick={() => {
                        setActiveCulture(c);
                        playPopSound();
                        speakGlobal(`Budaya ${c.island}: ${c.example}`);
                      }}
                      className={`p-2 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeCulture.island === c.island ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-[11px]">{c.island}</strong>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong>Budaya {activeCulture.island}: </strong>{activeCulture.example}
                </div>
              </div>
            )}

            {levelId === 4 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Tingkatan Wilayah Pemerintahan:
                </span>
                <div className="grid grid-cols-3 gap-2 w-full text-xs">
                  {[
                    { unit: "RT & RW", leader: "Ketua RT / RW", task: "Rukun warga dan administrasi tetangga terdekat." },
                    { unit: "Desa / Kelurahan", leader: "Kades / Lurah", task: "Layanan kantor desa dan fasilitas masyarakat umum." },
                    { unit: "Kecamatan", leader: "Camat", task: "Mengoordinasikan beberapa desa/kelurahan setempat." },
                  ].map((g) => (
                    <button
                      key={g.unit}
                      type="button"
                      onClick={() => {
                        setActiveGov(g);
                        playPopSound();
                        speakGlobal(`${g.unit} dipimpin oleh ${g.leader}. Tugasnya: ${g.task}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] font-bold cursor-pointer transition-all ${
                        activeGov.unit === g.unit ? "bg-[#7FD13B] text-white shadow-md scale-105" : "bg-white text-[#3C632A]"
                      }`}
                    >
                      <strong className="block text-xs">{g.unit}</strong>
                    </button>
                  ))}
                </div>
                <div className="p-2.5 bg-white rounded-xl border-2 border-[#3C632A] text-left text-xs w-full shadow-sm">
                  <strong>{activeGov.unit} ({activeGov.leader}): </strong>{activeGov.task}
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
        title: "Makna Sila-Sila Pancasila",
        conceptText: "Lambang Garuda Pancasila memiliki perisai di dada yang memuat 5 simbol suci: Bintang (Sila 1), Rantai (Sila 2), Pohon Beringin (Sila 3), Kepala Banteng (Sila 4), serta Padi dan Kapas (Sila 5). Setiap sila mengajarkan kita untuk taat beribadah, adil antarsesama, bersatu, gemar bermusyawarah, dan gotong royong.",
        questions: [
          {
            id: 1,
            question: "Makna simbol bintang emas bersudut lima pada sila pertama adalah...",
            options: ["Cahaya kerohanian yang dipancarkan Tuhan kepada manusia", "Penerangan listrik untuk kota", "Hiasan langit malam", "Kemegahan raja di istana"],
            correctIndex: 0,
            explanation: "Bintang emas melambangkan cahaya ketuhanan yang membimbing iman seluruh rakyat Indonesia."
          },
          {
            id: 2,
            question: "Rantai baja pada sila kedua terdiri atas mata rantai berbentuk segi empat dan lingkaran yang bermakna...",
            options: ["Hubungan laki-laki dan perempuan yang saling bersatu membantu", "Rantai borgol hukuman penjara", "Hiasan gelang tangan", "Besi penarik perahu"],
            correctIndex: 0,
            explanation: "Mata rantai segi empat (laki-laki) dan lingkaran (perempuan) saling berkait erat melambangkan kesetaraan dan persatuan."
          },
          {
            id: 3,
            question: "Pohon beringin memiliki sulur dan akar tunggang yang menghunjam kuat ke tanah, melambangkan...",
            options: ["Tempat berteduh dan persatuan seluruh suku bangsa Indonesia", "Hutan rimba yang lebat dan menyeramkan", "Tempat bermain ayunan tali", "Pohon kayu untuk bahan bangunan rumah"],
            correctIndex: 0,
            explanation: "Pohon beringin mencerminkan perlindungan dan keutuhan NKRI bagi seluruh suku bangsa."
          },
          {
            id: 4,
            question: "Kepala banteng dipilih sebagai lambang sila keempat karena banteng merupakan hewan yang...",
            options: ["Suka berkumpul dan berjiwa sosial tinggi dalam musyawarah", "Sangat galak dan suka menyeruduk", "Suka hidup menyendiri di hutan", "Hewan tercepat di padang rumput"],
            correctIndex: 0,
            explanation: "Banteng suka berkumpul, mencerminkan rakyat Indonesia yang bermusyawarah mufakat mengambil keputusan."
          },
          {
            id: 5,
            question: "Simbol padi dan kapas pada sila kelima melambangkan kebutuhan pokok manusia, yaitu...",
            options: ["Pangan (makanan) dan sandang (pakaian) yang merata", "Emas dan perak perhiasan", "Mainan dan kendaraan mewah", "Peralatan elektronik"],
            correctIndex: 0,
            explanation: "Padi menghasilkan beras (pangan) dan kapas menghasilkan kain (sandang) untuk kesejahteraan rakyat."
          },
          {
            id: 6,
            question: "Perilaku yang mencerminkan pengamalan sila kedua (Kemanusiaan yang Adil dan Beradab) di masyarakat adalah...",
            options: ["Menolong korban bencana alam dengan tulus", "Memilih teman yang kaya saja", "Memaksa orang lain mengikuti kehendak kita", "Mengabaikan tetangga yang sakit"],
            correctIndex: 0,
            explanation: "Menolong korban bencana tanpa membeda-bedakan adalah bukti rasa kemanusiaan yang adil dan beradab."
          },
          {
            id: 7,
            question: "Ketika warga desa bekerja bakti memperbaiki jembatan yang rusak, mereka sedang mengamalkan sila ke-...",
            options: ["Tiga (Persatuan Indonesia)", "Satu", "Dua", "Empat"],
            correctIndex: 0,
            explanation: "Kerja bakti dan gotong royong memupuk persatuan dan kerukunan warga (Sila ke-3)."
          },
          {
            id: 8,
            question: "Contoh sikap adil di rumah sesuai dengan sila kelima Pancasila adalah...",
            options: ["Membagi tugas menyapu rumah secara seimbang kepada anak", "Memberikan seluruh uang jajan hanya ke anak sulung", "Menyuruh adik mengerjakan semua tugas kakak", "Menghabiskan lauk pauk sendirian"],
            correctIndex: 0,
            explanation: "Keadilan di rumah terwujud bila hak dan tugas rumah dibagi secara proporsional dan bijaksana."
          },
          {
            id: 9,
            question: "Tulisan semboyan pada pita yang dicengkeram oleh kedua kaki burung Garuda Pancasila berbunyi...",
            options: ["Bhinneka Tunggal Ika", "Ing Ngarsa Sung Tuladha", "Garuda Pancasila Jaya", "Merdeka atau Mati"],
            correctIndex: 0,
            explanation: "Bhinneka Tunggal Ika berarti berbeda-beda tetapi tetap satu jua."
          },
          {
            id: 10,
            question: "Jumlah helai bulu pada leher burung Garuda Pancasila melambangkan tahun kemerdekaan, yaitu berjumlah...",
            options: ["45 helai", "17 helai", "8 helai", "19 helai"],
            correctIndex: 0,
            explanation: "Helai bulu Garuda: 17 pada masing-masing sayap, 8 pada ekor, 19 di bawah perisai, dan 45 di leher (17-8-1945)."
          }
        ]
      };

    case 2:
      return {
        title: "Hak dan Kewajiban",
        conceptText: "Hak adalah segala sesuatu yang berhak kita terima setelah melaksanakan kewajiban. Kewajiban adalah sesuatu yang harus kita kerjakan dengan penuh tanggung jawab. Hak dan kewajiban harus dilaksanakan secara seimbang di rumah, di sekolah, dan di lingkungan masyarakat sekitar.",
        questions: [
          {
            id: 1,
            question: "Sesuatu yang harus kita laksanakan dengan penuh tanggung jawab disebut...",
            options: ["Kewajiban", "Hak", "Hadiah", "Pemberian sukarela"],
            correctIndex: 0,
            explanation: "Kewajiban adalah tugas dan amanah yang wajib kita kerjakan dengan sebaik-baiknya."
          },
          {
            id: 2,
            question: "Contoh hak utama seorang anak ketika berada di rumah adalah...",
            options: ["Mendapatkan kasih sayang dan perlindungan orang tua", "Mencuci semua pakaian orang tua", "Mencari nafkah bekerja", "Membersihkan seluruh rumah sendirian"],
            correctIndex: 0,
            explanation: "Setiap anak berhak mendapatkan kasih sayang, rasa aman, serta pemenuhan nutrisi dari orang tua."
          },
          {
            id: 3,
            question: "Kewajiban siswa di sekolah sebelum mendapatkan nilai pelajaran yang memuaskan adalah...",
            options: ["Belajar dengan rajin dan memperhatikan penjelasan guru", "Menuntut nilai tinggi tanpa pernah belajar", "Bermain gim saat jam pelajaran", "Sering membolos sekolah"],
            correctIndex: 0,
            explanation: "Nilai yang bagus adalah hak yang diperoleh setelah siswa menuntaskan kewajiban belajar dengan tekun."
          },
          {
            id: 4,
            question: "Jika hak dan kewajiban tidak berjalan seimbang, maka yang akan terjadi dalam kehidupan adalah...",
            options: ["Terjadi perselisihan dan kekacauan hidup", "Suasana menjadi semakin damai", "Semua orang merasa gembira", "Pekerjaan cepat selesai"],
            correctIndex: 0,
            explanation: "Ketidakseimbangan hak dan kewajiban memicu rasa iri, ketidakadilan, dan pertikaian sosial."
          },
          {
            id: 5,
            question: "Contoh kewajiban warga terhadap fasilitas umum di desa atau kelurahan adalah...",
            options: ["Menjaga kebersihan dan tidak merusak fasilitas umum", "Mencorat-coret halte bus", "Merusak ayunan di taman bermain", "Mengotori pos ronda"],
            correctIndex: 0,
            explanation: "Merawat fasilitas umum adalah kewajiban bersama agar fasilitas tersebut bisa digunakan dengan baik."
          },
          {
            id: 6,
            question: "Doni ingin haknya bermain sepeda dipenuhi. Sikap Doni terhadap kewajiban belajarnya sebaiknya...",
            options: ["Menyelesaikan tugas PR sekolah terlebih dahulu baru bersepeda", "Bermain sepeda seharian tanpa mengerjakan PR", "Menyuruh teman mengerjakan PR-nya", "Menyembunyikan buku tugasnya"],
            correctIndex: 0,
            explanation: "Kewajiban harus diselesaikan sebelum kita menikmati hak rekreasi atau bermain."
          },
          {
            id: 7,
            question: "Hak setiap siswa di perpustakaan sekolah adalah meminjam buku, sedangkan kewajibannya adalah...",
            options: ["Menjaga buku tidak sobek dan mengembalikannya tepat waktu", "Merobek gambar dari halaman buku", "Membawa pulang buku selamanya", "Mencoret-coret lembaran buku"],
            correctIndex: 0,
            explanation: "Menjaga keutuhan buku dan mengembalikan tepat waktu adalah kewajiban peminjam perpustakaan."
          },
          {
            id: 8,
            question: "Kewajiban kita saat guru sedang menjelaskan materi pelajaran di depan kelas adalah...",
            options: ["Mendengarkan dengan sungguh-sungguh dan tidak membuat gaduh", "Mengobrol keras dengan teman sebangku", "Tidur di meja kelas", "Melemparkan kertas"],
            correctIndex: 0,
            explanation: "Memperhatikan guru yang mengajar adalah bentuk hormat dan kewajiban belajar murid."
          },
          {
            id: 9,
            question: "Mendapatkan lingkungan tempat tinggal yang bersih dan asri adalah...",
            options: ["Hak seluruh warga masyarakat", "Hukuman dari ketua RT", "Beban berat warga", "Kewajiban perangkat desa saja"],
            correctIndex: 0,
            explanation: "Lingkungan yang bersih adalah hak seluruh warga yang terwujud lewat kewajiban gotong royong."
          },
          {
            id: 10,
            question: "Kewajiban anak setelah selesai bermain mainan di rumah adalah...",
            options: ["Merapikan kembali mainan ke dalam tempatnya", "Membiarkan mainan berserakan di lantai", "Menyuruh ibu yang membereskan semuanya", "Membuang mainan keluar jendela"],
            correctIndex: 0,
            explanation: "Merapikan mainan sendiri melatih sikap mandiri dan tanggung jawab anak di rumah."
          }
        ]
      };

    case 3:
      return {
        title: "Keragaman Suku & Budaya",
        conceptText: "Indonesia adalah negara kepulauan yang kaya akan keragaman suku bangsa, adat istiadat, pakaian adat, tarian tradisional, rumah adat, dan alat musik daerah. Meskipun kita memiliki adat dan bahasa yang beraneka rupa, kita tetap satu bangsa Indonesia sesuai semboyan Bhinneka Tunggal Ika.",
        questions: [
          {
            id: 1,
            question: "Semboyan 'Bhinneka Tunggal Ika' diambil dari kitab Sutasoma karangan Mpu Tantular yang artinya...",
            options: ["Berbeda-beda tetapi tetap satu jua", "Bersatu kita teguh bercerai kita runtuh", "Keadilan untuk seluruh rakyat", "Kemenangan adalah segalanya"],
            correctIndex: 0,
            explanation: "Bhinneka Tunggal Ika menegaskan persatuan di tengah keanekaragaman suku dan budaya nusantara."
          },
          {
            id: 2,
            question: "Rumah adat Honai yang berbentuk bundar dengan atap jerami berasal dari daerah...",
            options: ["Papua", "Sumatera Barat", "Jawa Tengah", "Kalimantan Selatan"],
            correctIndex: 0,
            explanation: "Rumah Honai adalah rumah adat khas masyarakat pegunungan di Papua."
          },
          {
            id: 3,
            question: "Tari Saman yang dilakukan secara berkelompok dengan tepukan tangan ritmis berasal dari suku...",
            options: ["Gayo, Aceh", "Baduy, Banten", "Bugis, Sulawesi", "Asmat, Papua"],
            correctIndex: 0,
            explanation: "Tari Saman berasal dari suku Gayo di provinsi Aceh dan diakui UNESCO sebagai warisan dunia."
          },
          {
            id: 4,
            question: "Alat musik petik tradisional Sasando yang terbuat dari daun lontar berasal dari provinsi...",
            options: ["Nusa Tenggara Timur (NTT)", "Jawa Barat", "Sumatera Utara", "Maluku"],
            correctIndex: 0,
            explanation: "Sasando adalah alat musik dawai petik khas Pulau Rote di Nusa Tenggara Timur."
          },
          {
            id: 5,
            question: "Pakaian adat Ulos sering digunakan dalam upacara adat oleh suku...",
            options: ["Batak, Sumatera Utara", "Jawa", "Dayak", "Betawi"],
            correctIndex: 0,
            explanation: "Kain Ulos adalah kain tenun tradisional sakral masyarakat suku Batak."
          },
          {
            id: 6,
            question: "Sikap yang baik ketika menyaksikan penampilan kesenian daerah lain yang belum pernah kita lihat adalah...",
            options: ["Menonton dengan antusias dan menghargai keindahannya", "Menertawakan gerakan tarian tersebut", "Meninggalkan panggung sambil mencemooh", "Menutup telinga karena asing"],
            correctIndex: 0,
            explanation: "Menghargai kesenian daerah lain merupakan bukti cinta dan apresiasi keragaman budaya bangsa."
          },
          {
            id: 7,
            question: "Rumah adat Tongkonan dengan atap melengkung menyerupai perahu berasal dari suku Toraja di provinsi...",
            options: ["Sulawesi Selatan", "Sumatera Selatan", "Kalimantan Tengah", "Bali"],
            correctIndex: 0,
            explanation: "Tongkonan adalah rumah panggung adat suku Toraja di Sulawesi Selatan."
          },
          {
            id: 8,
            question: "Upacara adat pembakaran jenazah di Pulau Bali dikenal dengan nama upacara...",
            options: ["Ngaben", "Rambu Solo", "Sekaten", "Kasada"],
            correctIndex: 0,
            explanation: "Upacara Ngaben adalah upacara pembakaran jenazah umat Hindu di Bali untuk menyucikan roh leluhur."
          },
          {
            id: 9,
            question: "Kekayaan ragam budaya yang dimiliki bangsa Indonesia seharusnya membuat kita merasa...",
            options: ["Bangga dan bersyukur kepada Tuhan", "Malu dan rendah diri", "Ingin memusnahkan budaya daerah", "Menganggap suku sendiri paling hebat"],
            correctIndex: 0,
            explanation: "Keragaman budaya adalah kekayaan dan jati diri luhur bangsa yang patut dibanggakan."
          },
          {
            id: 10,
            question: "Tindakan pelestarian budaya tradisional yang dapat dilakukan murid sekolah dasar adalah...",
            options: ["Belajar menari tarian tradisional atau memainkan alat musik daerah", "Hanya menyukai budaya dari negara asing", "Mengejek pakaian adat daerah", "Melarang teman berbahasa daerah"],
            correctIndex: 0,
            explanation: "Mempelajari tarian dan lagu daerah sejak dini menjaga warisan budaya bangsa agar tidak punah."
          }
        ]
      };

    case 4:
      return {
        title: "Mengenal Wilayah Tempat Tinggal",
        conceptText: "Wilayah tempat tinggal kita dipimpin oleh susunan pemerintahan berjenjang mulai dari RT, RW, Desa/Kelurahan, hingga Kecamatan. Fasilitas umum seperti posyandu, balai desa, jalan desa, dan taman lingkungan dibangun untuk kepentingan bersama yang wajib dijaga dengan semangat gotong royong.",
        questions: [
          {
            id: 1,
            question: "Lembaga pemerintahan terkecil di bawah kelurahan yang terdiri dari beberapa RT adalah...",
            options: ["Rukun Warga (RW)", "Kecamatan", "Kabupaten", "Provinsi"],
            correctIndex: 0,
            explanation: "Beberapa RT (Rukun Tetangga) dihimpun dalam satu satuan RW (Rukun Warga)."
          },
          {
            id: 2,
            question: "Pemimpin di tingkat pemerintahan desa yang dipilih langsung oleh warga desa adalah...",
            options: ["Kepala Desa (Kades)", "Lurah", "Camat", "Bupati"],
            correctIndex: 0,
            explanation: "Kepala Desa dipilih melalui pemilihan kepala desa (Pilkades) oleh masyarakat desa."
          },
          {
            id: 3,
            question: "Perbedaan utama antara Desa dan Kelurahan adalah kelurahan dipimpin oleh seorang Lurah yang merupakan...",
            options: ["Pegawai Negeri Sipil (PNS) yang ditunjuk pemerintah", "Warga yang dipilih lewat pemungutan suara", "Tokoh adat turun-temurun", "Pengusaha di daerah tersebut"],
            correctIndex: 0,
            explanation: "Lurah adalah Pegawai Negeri Sipil (PNS) yang diangkat oleh bupati/wali kota atas usul camat."
          },
          {
            id: 4,
            question: "Wilayah kecamatan merupakan gabungan dari beberapa...",
            options: ["Desa dan Kelurahan", "Kabupaten", "Provinsi", "Negara bagian"],
            correctIndex: 0,
            explanation: "Kecamatan dipimpin oleh Camat dan membawahi sejumlah desa dan kelurahan."
          },
          {
            id: 5,
            question: "Fasilitas kesehatan di tingkat lingkungan desa/kelurahan yang melayani penimbangan balita dan lansia adalah...",
            options: ["Posyandu (Pos Pelayanan Terpadu)", "Kantor Pos", "Pasar Induk", "Stasiun Kereta"],
            correctIndex: 0,
            explanation: "Posyandu adalah pos kesehatan terpadu tingkat RT/RW untuk memantau tumbuh kembang balita."
          },
          {
            id: 6,
            question: "Contoh kegiatan gotong royong yang sering dilakukan oleh warga di lingkungan tempat tinggal adalah...",
            options: ["Kerja bakti membersihkan selokan air menjelang musim hujan", "Bermain gim online bersama", "Membeli barang mewah", "Bersaing membangun pagar tertinggi"],
            correctIndex: 0,
            explanation: "Kerja bakti selokan melancarkan aliran air sehingga mencegah banjir dan sarang nyamuk DBD."
          },
          {
            id: 7,
            question: "Bangunan milik bersama di lingkungan desa yang biasa digunakan untuk musyawarah warga adalah...",
            options: ["Balai warga atau balai desa", "Rumah pribadi ketua RT", "Mall perbelanjaan", "Garasi mobil"],
            correctIndex: 0,
            explanation: "Balai desa/balai warga adalah fasilitas umum pertemuan dan rembuk desa."
          },
          {
            id: 8,
            question: "Batas alam yang sering memisahkan wilayah suatu desa dengan desa tetangga antara lain berupa...",
            options: ["Sungai, bukit, atau persawahan", "Papan reklame jalan", "Garis kapur di jalan", "Toko kelontong"],
            correctIndex: 0,
            explanation: "Batas alam wilayah antardesa dapat berupa aliran sungai, jurang, pegunungan, atau pematang sawah."
          },
          {
            id: 9,
            question: "Tugas utama petugas ronda malam (siskamling) di pos ronda lingkungan adalah...",
            options: ["Menjaga keamanan dan ketertiban lingkungan sekitar warga", "Memutar musik dengan volume keras", "Tidur nyenyak sampai pagi", "Menakut-nakuti pejalan kaki"],
            correctIndex: 0,
            explanation: "Ronda malam menjaga keamanan kampung dari potensi pencurian dan bahaya kebakaran."
          },
          {
            id: 10,
            question: "Sikap kita sebagai warga yang baik ketika melewati pos ronda atau bertemu tetangga di jalan adalah...",
            options: ["Menyapa dengan senyum dan mengucapkan salam dengan santun", "Memalingkan muka dan bersikap sombong", "Berlari kencang menghindar", "Menutup wajah dengan buku"],
            correctIndex: 0,
            explanation: "Menyapa tetangga mempererat silaturahmi, kerukunan, dan rasa kekeluargaan antartetangga."
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
