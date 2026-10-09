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

interface IndoGrade3GameProps {
  levelId: number;
  onLevelComplete: (levelId: number, starsEarned: number) => void;
  accessibilityMode?: string;
}

export function IndoGrade3Game({ levelId, onLevelComplete, accessibilityMode }: IndoGrade3GameProps) {
  const [phase, setPhase] = useState<"materi" | "game">("materi");

  // Phase 1 interactive state
  const [activeDirection, setActiveDirection] = useState<string>("Utara");
  const [activeCharacterRole, setActiveCharacterRole] = useState<string>("Protagonis");

  // Phase 2: 10 questions state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState<boolean>(false);
  const [wrongAttempts, setWrongAttempts] = useState<number>(0);
  const [showClue, setShowClue] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [questionsList, setQuestionsList] = useState<QuestionItem[]>([]);
  const isProcessingRef = useRef<boolean>(false);

  // Fisher-Yates shuffle helper
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
    setActiveDirection("Utara");
    setActiveCharacterRole("Protagonis");

    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setWrongAttempts(0);
    setShowClue(false);
    setIsCompleted(false);
    isProcessingRef.current = false;

    const data = getGrade3LevelData(levelId);
    setQuestionsList(shuffleQuestions(data));
    speakGlobal(data.conceptText);
  }, [levelId]);

  const levelData = getGrade3LevelData(levelId);
  const activeQuestions = questionsList.length > 0 ? questionsList : levelData.questions;
  const currentQ = activeQuestions[currentQuestionIndex] || activeQuestions[0];

  useEffect(() => {
    if (phase === "game" && !isCompleted && currentQ) {
      speakGlobal(`Soal nomor ${currentQuestionIndex + 1}. ${currentQ.question}`);
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
          speakGlobal(`Luar biasa! Kamu telah menyelesaikan 10 soal Bahasa Indonesia Kelas 3 dan meraih ${stars} bintang!`);
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
        setIsAnswerChecked(false);
        setSelectedOption(null);
        isProcessingRef.current = false;
      }, 1200);
    }
  };

  const handleFinishLevel = () => {
    playSuccessFanfare();
    const finalScore = Math.min(score, levelData.questions.length);
    const stars = finalScore >= 9 ? 3 : finalScore >= 7 ? 2 : 1;
    onLevelComplete(levelId, stars);
  };

  return (
    <div className="w-full flex flex-col items-center justify-between min-h-[560px] p-4 md:p-8 bg-[#FFE296] rounded-[32px] border-4 border-[#3C632A] text-[#3C632A] shadow-[8px_8px_0px_0px_#3C632A] relative overflow-hidden">
      
      {/* Header Info Level */}
      <div className="w-full flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center space-x-3">
          <span className="px-4 py-1.5 bg-[#7FD13B] text-white font-black text-xs md:text-sm rounded-xl border-2 border-[#3C632A]">
            BAHASA INDONESIA KELAS 3 SD • LEVEL {levelId} dari 6
          </span>
          <span className="text-xs md:text-sm font-black uppercase text-[#C3631D]">
            {phase === "materi" ? "📖 Tahap 1: Belajar Konsep" : "🎮 Tahap 2: Tantangan 10 Soal"}
          </span>
        </div>

        {phase === "game" && !isCompleted && (
          <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-xl border-2 border-[#3C632A]">
            <span className="text-xs font-black text-[#3C632A]">Skor:</span>
            <span className="text-sm font-black text-[#C3631D]">{score} / {levelData.questions.length}</span>
          </div>
        )}
      </div>

      {/* ================= FASE 1: PENGENALAN KONSEP MATERI ================= */}
      {phase === "materi" && (
        <div className="w-full flex-1 flex flex-col items-center justify-between space-y-6 animate-in fade-in zoom-in duration-300">
          <div className="text-center max-w-2xl">
            <h2 className="text-2xl md:text-4xl font-black text-[#3C632A] drop-shadow-sm mb-2">
              {levelData.title}
            </h2>
            <p className="text-sm md:text-base font-extrabold text-[#3C632A]/90 leading-relaxed bg-white/70 p-4 rounded-2xl border-2 border-[#3C632A]">
              {levelData.conceptText}
            </p>
          </div>

          {/* INTERACTIVE WORKBENCH PER LEVEL */}
          <div className="w-full max-w-xl bg-white p-6 rounded-[28px] border-4 border-[#3C632A] shadow-[6px_6px_0px_0px_#3C632A] flex flex-col items-center">
            {levelId === 1 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Menemukan Ide Pokok Paragraf:
                </span>
                <div className="p-4 bg-teal-50 border-2 border-teal-300 rounded-2xl w-full text-xs text-left leading-relaxed text-slate-800">
                  <span className="bg-yellow-200 font-black px-1 rounded">"Kucing adalah hewan peliharaan yang sangat bersih."</span> Kucing suka menjilati bulunya agar terhindar dari kotoran. Selain itu, kucing juga memiliki lidah yang berduri halus untuk menyisir bulunya sendiri.
                </div>
                <div className="text-[11px] font-bold text-teal-900 bg-white p-2 rounded-xl border border-teal-200 text-center w-full">
                  🌟 Ide Pokok di atas berada di kalimat pertama: <strong>Kucing adalah hewan yang bersih.</strong> Kalimat lainnya adalah kalimat penjelas.
                </div>
              </div>
            )}

            {levelId === 2 && (
              <div className="w-full flex flex-col items-center space-y-3 text-center">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Membaca Arah Mata Angin pada Denah:
                </span>
                <div className="grid grid-cols-4 gap-2 w-full">
                  {[
                    { dir: "Utara", icon: "⬆️", desc: "Arah atas peta" },
                    { dir: "Timur", icon: "➡️", desc: "Matahari terbit (kanan)" },
                    { dir: "Selatan", icon: "⬇️", desc: "Arah bawah peta" },
                    { dir: "Barat", icon: "⬅️", desc: "Matahari terbenam (kiri)" },
                  ].map((d) => (
                    <button
                      key={d.dir}
                      type="button"
                      onClick={() => {
                        setActiveDirection(d.dir);
                        playPopSound();
                        speakGlobal(`Arah mata angin ${d.dir}, yaitu ${d.desc}`);
                      }}
                      className={`p-2.5 rounded-xl border-2 border-[#3C632A] flex flex-col items-center cursor-pointer transition-all ${
                        activeDirection === d.dir ? "bg-[#FF5685] text-white scale-105" : "bg-amber-50 text-[#3C632A]"
                      }`}
                    >
                      <span className="text-xl">{d.icon}</span>
                      <span className="text-xs font-black">{d.dir}</span>
                    </button>
                  ))}
                </div>
                <div className="text-[11px] font-bold text-slate-700">
                  Denah membantu kita menemukan lokasi tempat tanpa tersesat dengan petunjuk arah yang runtut.
                </div>
              </div>
            )}

            {levelId === 3 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Tokoh & Watak Cerita Rakyat Nusantara:
                </span>
                <div className="grid grid-cols-2 gap-2 w-full text-xs">
                  <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl">
                    😇 <strong>Protagonis:</strong> Tokoh berwatak baik, suka menolong, jujur (contoh: Bawang Putih).
                  </div>
                  <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl">
                    😈 <strong>Antagonis:</strong> Tokoh penentang berwatak jahat, sombong, serakah (contoh: Bawang Merah).
                  </div>
                </div>
              </div>
            )}

            {levelId === 4 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Langkah Melakukan Wawancara:
                </span>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 text-xs text-left space-y-1 text-slate-800 w-full">
                  <p>1. Menentukan tema & narasumber yang ahli.</p>
                  <p>2. Menyiapkan daftar pertanyaan (5W1H).</p>
                  <p>3. Bertanya dengan bahasa santun dan menyapa ramah.</p>
                  <p>4. Mencatat jawaban dan mengucapkan terima kasih.</p>
                </div>
              </div>
            )}

            {levelId === 5 && (
              <div className="w-full flex flex-col items-center space-y-3 text-center">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Membaca Teks Informatif: Perubahan Wujud Benda
                </span>
                <div className="grid grid-cols-3 gap-2 w-full text-[11px] font-bold">
                  <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">🧊 Mencair: Padat ke cair (es meleleh)</div>
                  <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg">💨 Menguap: Cair ke gas (air mendidih)</div>
                  <div className="p-2 bg-teal-50 border border-teal-200 rounded-lg">❄️ Membeku: Cair ke padat (air jadi es)</div>
                </div>
              </div>
            )}

            {levelId === 6 && (
              <div className="w-full flex flex-col items-center space-y-3 text-center">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Puisi & Ungkapan Perasaan Cinta Lingkungan:
                </span>
                <div className="p-3 bg-yellow-50 rounded-xl border border-yellow-300 text-xs italic text-slate-800 leading-relaxed text-left">
                  Gunung biru berdiri tegak,<br />
                  Sawah hijau membentang luas,<br />
                  Betapa agung ciptaan Tuhan,<br />
                  Kan kujaga sepanjang masa.
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleStartGameChallenge}
            className="px-8 py-4 bg-[#7FD13B] hover:bg-[#6EB832] text-white font-black text-lg md:text-xl rounded-2xl border-4 border-[#3C632A] shadow-[4px_4px_0px_0px_#3C632A] hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center space-x-3"
          >
            <span>Mulai Tantangan Soal (10 Soal)</span>
            <span>🚀</span>
          </button>
        </div>
      )}

      {/* ================= FASE 2: TANTANGAN 10 SOAL BERURUTAN ================= */}
      {phase === "game" && !isCompleted && (
        <div className="w-full flex-1 flex flex-col items-center justify-between space-y-6 animate-in fade-in duration-300">
          
          <div className="w-full max-w-xl">
            <div className="flex justify-between text-xs font-black text-[#3C632A] mb-1">
              <span>Soal {currentQuestionIndex + 1} dari {levelData.questions.length}</span>
              <span>{Math.round(((currentQuestionIndex + 1) / levelData.questions.length) * 100)}%</span>
            </div>
            <div className="w-full h-3.5 bg-white rounded-full border-2 border-[#3C632A] overflow-hidden">
              <div
                className="h-full bg-[#7FD13B] transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / levelData.questions.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="w-full max-w-xl bg-white p-6 md:p-8 rounded-[28px] border-4 border-[#3C632A] shadow-[6px_6px_0px_0px_#3C632A] text-center space-y-4">
            {currentQ.visualHelper && (
              <div className="text-5xl md:text-6xl my-2 flex justify-center animate-bounce">
                {currentQ.visualHelper}
              </div>
            )}

            <h3 className="text-lg md:text-2xl font-black text-[#1F2937] leading-relaxed">
              {currentQ.question}
            </h3>

            {showClue && (
              <div className="p-3 bg-teal-50 border-2 border-teal-300 rounded-xl text-teal-900 text-xs font-extrabold animate-pulse">
                💡 Petunjuk: {currentQ.explanation}
              </div>
            )}
          </div>

          <div className="w-full max-w-xl grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            {currentQ.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === currentQ.correctIndex;

              let btnStyle = "bg-white text-[#3C632A] border-4 border-[#3C632A] hover:bg-[#FFE296]";

              if (isAnswerChecked) {
                if (isSelected && isCorrect) {
                  btnStyle = "bg-[#7FD13B] text-white border-4 border-[#3C632A] scale-105 shadow-md";
                } else if (isSelected && !isCorrect) {
                  btnStyle = "bg-rose-500 text-white border-4 border-[#3C632A] animate-shake";
                }
              }

              if (showClue && isCorrect) {
                btnStyle = "bg-[#7FD13B] text-white border-4 border-[#3C632A] ring-4 ring-yellow-400 animate-pulse";
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectAnswer(idx)}
                  disabled={isAnswerChecked}
                  className={`p-4 md:p-5 rounded-2xl font-black text-base md:text-lg text-center transition-all shadow-[4px_4px_0px_0px_#3C632A] cursor-pointer min-h-[70px] flex items-center justify-center ${btnStyle}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => speakGlobal(`Soal nomor ${currentQuestionIndex + 1}. ${currentQ.question}`)}
            className="text-xs font-extrabold text-[#3C632A] underline hover:opacity-80 flex items-center space-x-1"
          >
            <span>🔊 Bacakan Soal Lagi</span>
          </button>
        </div>
      )}

      {isCompleted && (
        <div className="w-full flex-1 flex flex-col items-center justify-center text-center space-y-6 animate-in zoom-in duration-300">
          <div className="text-6xl md:text-7xl animate-bounce">🏆</div>
          <h2 className="text-3xl md:text-4xl font-black text-[#3C632A]">
            Level {levelId} Selesai!
          </h2>
          <p className="text-lg font-bold text-slate-800">
            Kamu menjawab benar <span className="text-[#C3631D] font-black">{score}</span> dari 10 soal!
          </p>

          <div className="flex space-x-2 text-4xl">
            {Array.from({ length: score >= 9 ? 3 : score >= 7 ? 2 : 1 }).map((_, i) => (
              <span key={i}>⭐</span>
            ))}
          </div>

          <button
            onClick={handleFinishLevel}
            className="px-8 py-4 bg-[#7FD13B] hover:bg-[#6EB832] text-white font-black text-xl rounded-2xl border-4 border-[#3C632A] shadow-[4px_4px_0px_0px_#3C632A] hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            Simpan Bintang & Lanjut ⭐
          </button>
        </div>
      )}

    </div>
  );
}

// ================= DATA SOAL KELAS 3 SD (6 LEVEL x 10 SOAL = 60 SOAL LENGKAP) =================
function getGrade3LevelData(levelId: number): LevelConceptData {
  switch (levelId) {
    case 1:
      return {
        title: "Ide Pokok Paragraf Sederhana",
        conceptText: "Ide pokok atau gagasan utama adalah inti pikiran dari sebuah paragraf. Ide pokok sering terletak di awal kalimat (deduktif) atau di akhir kalimat (induktif).",
        questions: [
          {
            id: 1,
            question: "Gagasan yang menjadi inti atau pokok pembahasan dalam suatu paragraf disebut...",
            visualHelper: "💡",
            options: ["Ide pokok (Gagasan utama)", "Kalimat tanya", "Judul buku"],
            correctIndex: 0,
            explanation: "Ide pokok merupakan gagasan penting yang menjadi dasar pengembangan paragraf.",
          },
          {
            id: 2,
            question: "Paragraf yang ide pokoknya terletak di awal kalimat disebut paragraf...",
            visualHelper: "⬆️",
            options: ["Deduktif", "Induktif", "Naratif"],
            correctIndex: 0,
            explanation: "Paragraf deduktif menempatkan kalimat utama di awal paragraf.",
          },
          {
            id: 3,
            question: "Kalimat-kalimat yang menjelaskan atau menguraikan ide pokok disebut...",
            visualHelper: "📝",
            options: ["Kalimat pengembang (penjelas)", "Kalimat seru", "Kalimat perintah"],
            correctIndex: 0,
            explanation: "Kalimat penjelas berfungsi memperjelas dan melengkapi kalimat utama.",
          },
          {
            id: 4,
            question: "Bacalah teks: 'Olahraga lari pagi sangat bermanfaat bagi kesehatan jantung. Lari pagi juga memperkuat otot kaki.' Ide pokoknya adalah...",
            visualHelper: "🏃",
            options: ["Manfaat olahraga lari pagi", "Harga sepatu lari", "Nama-nama otot manusia"],
            correctIndex: 0,
            explanation: "Teks tersebut membahas berbagai manfaat dari kegiatan lari pagi.",
          },
          {
            id: 5,
            question: "Dalam satu paragraf yang baik, biasanya memiliki ide pokok sebanyak...",
            visualHelper: "1️⃣",
            options: ["Satu ide pokok", "Lima ide pokok", "Sepuluh ide pokok"],
            correctIndex: 0,
            explanation: "Satu paragraf yang padu hanya memiliki satu ide pokok utama.",
          },
          {
            id: 6,
            question: "Paragraf yang kalimat utamanya berada di akhir paragraf disebut paragraf...",
            visualHelper: "⬇️",
            options: ["Induktif", "Deduktif", "Ekstraktif"],
            correctIndex: 0,
            explanation: "Induktif meletakkan simpulan/ide pokok di kalimat paling akhir.",
          },
          {
            id: 7,
            question: "Bagaimana cara mudah menemukan ide pokok dalam paragraf pendek?",
            visualHelper: "🔍",
            options: ["Membaca seluruh kalimat dengan cermat", "Hanya membaca kata pertama saja", "Menghitung jumlah titik"],
            correctIndex: 0,
            explanation: "Membaca seksama membantu kita mengenali apa hal utama yang sedang dibicarakan.",
          },
          {
            id: 8,
            question: "Bacalah: 'Wortel kaya vitamin A. Sayur bayam mengandung zat besi. Aneka sayuran sangat menyehatkan tubuh.' Ide pokoknya adalah...",
            visualHelper: "🥕",
            options: ["Sayuran menyehatkan tubuh", "Wortel berwarna oranye", "Bayam tumbuh di air"],
            correctIndex: 0,
            explanation: "Inti pembahasannya adalah bahwa aneka sayuran memberi manfaat kesehatan tubuh.",
          },
          {
            id: 9,
            question: "Kalimat yang memuat ide pokok paragraf disebut sebagai...",
            visualHelper: "⭐",
            options: ["Kalimat utama", "Kalimat penjelas", "Kalimat penutup saja"],
            correctIndex: 0,
            explanation: "Kalimat utama adalah tempat bersandarnya ide pokok paragraf.",
          },
          {
            id: 10,
            question: "Jika kalimat penjelas keluar dari topik ide pokok, maka paragraf tersebut...",
            visualHelper: "⚠️",
            options: ["Tidak padu (kurang baik)", "Sangat sempurna", "Menjadi puisi"],
            correctIndex: 0,
            explanation: "Semua kalimat dalam satu paragraf harus saling mendukung dan padu.",
          },
        ],
      };

    case 2:
      return {
        title: "Teks Petunjuk & Arahan",
        conceptText: "Teks petunjuk memuat langkah-langkah kerja atau panduan arah lokasi secara runtut dan jelas agar pembaca dapat melakukan sesuatu dengan benar.",
        questions: [
          {
            id: 1,
            question: "Teks yang berisi tahapan dan panduan melakukan sesuatu secara berurutan disebut teks...",
            visualHelper: "📋",
            options: ["Petunjuk (prosedur)", "Dongeng", "Puisi"],
            correctIndex: 0,
            explanation: "Teks petunjuk memandu pembaca langkah demi langkah melakukan suatu kegiatan.",
          },
          {
            id: 2,
            question: "Bahasa yang digunakan dalam teks petunjuk sebaiknya...",
            visualHelper: "🗣️",
            options: ["Jelas, singkat, dan runtut", "Berbelit-belit dan panjang", "Bahasa kiasan yang sulit dipahami"],
            correctIndex: 0,
            explanation: "Teks petunjuk harus mudah dipahami dan langkah-langkahnya berurutan.",
          },
          {
            id: 3,
            question: "Pada gambar denah, arah 'Utara' selalu menunjuk ke arah...",
            visualHelper: "🧭",
            options: ["Atas", "Bawah", "Kiri"],
            correctIndex: 0,
            explanation: "Sesuai konvensi peta dan denah, arah Utara mengarah ke bagian atas.",
          },
          {
            id: 4,
            question: "Urutan petunjuk mencuci tangan yang benar adalah...",
            visualHelper: "🧼",
            options: ["Basahi air, beri sabun, gosok sela jari, bilas bersih", "Bilas air, langsung makan, beri sabun", "Beri sabun kering, lap handuk"],
            correctIndex: 0,
            explanation: "Langkah mencuci tangan diawali membasahi tangan lalu menggosok sabun ke seluruh jari.",
          },
          {
            id: 5,
            question: "Gambar sederhana yang menunjukkan letak suatu tempat atau ruangan disebut...",
            visualHelper: "🗺️",
            options: ["Denah", "Lukisan", "Komik"],
            correctIndex: 0,
            explanation: "Denah adalah peta sederhana yang menunjukkan letak ruangan, jalan, atau gedung.",
          },
          {
            id: 6,
            question: "Kata perintah yang sering muncul dalam teks petunjuk obat adalah...",
            visualHelper: "💊",
            options: ["Minumlah setelah makan", "Tidurlah seharian", "Buanglah obatnya"],
            correctIndex: 0,
            explanation: "Aturan minum obat biasanya mencantumkan petunjuk 'minumlah sesudah makan'.",
          },
          {
            id: 7,
            question: "Matahari terbit dari arah mana?",
            visualHelper: "🌅",
            options: ["Timur", "Barat", "Selatan"],
            correctIndex: 0,
            explanation: "Matahari selalu terbit di sebelah Timur dan tenggelam di sebelah Barat.",
          },
          {
            id: 8,
            question: "Jika menghadap ke arah Utara, maka tangan kanan kita menunjuk ke arah...",
            visualHelper: "🧭",
            options: ["Timur", "Barat", "Selatan"],
            correctIndex: 0,
            explanation: "Bila menghadap Utara, sebelah kanan adalah Timur dan sebelah kiri adalah Barat.",
          },
          {
            id: 9,
            question: "Apa akibat jika kita tidak mengikuti petunjuk penggunaan alat elektronik?",
            visualHelper: "⚠️",
            options: ["Alat bisa rusak atau membahayakan diri", "Alat menjadi bertambah canggih", "Hemat listrik"],
            correctIndex: 0,
            explanation: "Mengabaikan petunjuk pemakaian alat berbahaya dan bisa merusak alat.",
          },
          {
            id: 10,
            question: "Dalam petunjuk membuat teh manis, langkah pertama yang dilakukan adalah...",
            visualHelper: "☕",
            options: ["Menyiapkan cangkir, teh, gula, dan air hangat", "Membuang air hangat ke lantai", "Meminum air tanpa gelas"],
            correctIndex: 0,
            explanation: "Tahap awal dari setiap petunjuk membuat sesuatu adalah menyiapkan bahan dan alat.",
          },
        ],
      };

    case 3:
      return {
        title: "Dongeng & Cerita Rakyat",
        conceptText: "Cerita rakyat nusantara (fabel, legenda, mite) mengandung unsur tokoh, watak (protagonis/antagonis), latar tempat/waktu, dan amanat (pesan moral budi pekerti).",
        questions: [
          {
            id: 1,
            question: "Pesan moral atau nasihat kebaikan yang ingin disampaikan pengarang melalui cerita disebut...",
            visualHelper: "💎",
            options: ["Amanat", "Latar", "Alur"],
            correctIndex: 0,
            explanation: "Amanat adalah nilai kebaikan dan budi pekerti yang dapat dipetik pembaca.",
          },
          {
            id: 2,
            question: "Tokoh utama yang memiliki watak baik dan disenangi pembaca disebut tokoh...",
            visualHelper: "😇",
            options: ["Protagonis", "Antagonis", "Tritagonis"],
            correctIndex: 0,
            explanation: "Tokoh protagonis berwatak baik, jujur, setia, dan menjadi teladan.",
          },
          {
            id: 3,
            question: "Tokoh yang memiliki sifat jahat dan menjadi penentang tokoh baik disebut tokoh...",
            visualHelper: "😈",
            options: ["Antagonis", "Protagonis", "Figuran"],
            correctIndex: 0,
            explanation: "Tokoh antagonis berwatak buruk atau jahat dalam cerita.",
          },
          {
            id: 4,
            question: "Cerita rakyat yang mengisahkan asal-usul terjadinya suatu tempat atau danau disebut...",
            visualHelper: "🌋",
            options: ["Legenda", "Fabel", "Kamus"],
            correctIndex: 0,
            explanation: "Legenda menceritakan riwayat asal usul daerah, misalnya Legenda Danau Toba.",
          },
          {
            id: 5,
            question: "Dalam cerita rakyat 'Malin Kundang', apa kesalahan terbesar Malin Kundang?",
            visualHelper: "🚢",
            options: ["Durhaka dan tidak mengakui ibu kandungnya", "Lupa membawa perahu", "Bermain layang-layang"],
            correctIndex: 0,
            explanation: "Malin Kundang dikutuk menjadi batu karena sombong dan durhaka kepada ibunya.",
          },
          {
            id: 6,
            question: "Kapan dan di mana cerita berlangsung dalam sebuah karya fiksi disebut...",
            visualHelper: "🏰",
            options: ["Latar (setting)", "Tema", "Amanat"],
            correctIndex: 0,
            explanation: "Latar mencakup waktu, tempat, dan suasana berlangsungnya cerita.",
          },
          {
            id: 7,
            question: "Watak tokoh Bawang Merah dalam dongeng Bawang Merah Bawang Putih adalah...",
            visualHelper: "😠",
            options: ["Iri hati dan pemalas", "Rajin dan sabar", "Suka menolong"],
            correctIndex: 0,
            explanation: "Bawang Merah berwatak iri, sombong, dan suka menyuruh Bawang Putih.",
          },
          {
            id: 8,
            question: "Jalan cerita dari awal, pertengahan, hingga akhir penyelesaian dinamakan...",
            visualHelper: "🛤️",
            options: ["Alur (plot)", "Latar", "Tokoh"],
            correctIndex: 0,
            explanation: "Alur adalah rangkaian jalannya cerita yang saling berhubungan sebab-akibat.",
          },
          {
            id: 9,
            question: "Amanat cerita Malin Kundang bagi anak-anak adalah...",
            visualHelper: "❤️",
            options: ["Harus selalu berbakti dan menyayangi orang tua", "Boleh melupakan ibu jika sudah kaya", "Jangan naik kapal laut"],
            correctIndex: 0,
            explanation: "Sebagai anak, kita wajib menghormati dan berbakti kepada orang tua sepanjang hayat.",
          },
          {
            id: 10,
            question: "Cerita fabel hewan yang saling tolong menolong mengajarkan sikap...",
            visualHelper: "🤝",
            options: ["Gotong royong dan setia kawan", "Suka berkelahi", "Mementingkan diri sendiri"],
            correctIndex: 0,
            explanation: "Karakter hewan fabel mengajarkan indahnya kebersamaan dan tolong-menolong.",
          },
        ],
      };

    case 4:
      return {
        title: "Wawancara Sederhana",
        conceptText: "Wawancara adalah kegiatan tanya jawab antara pewawancara dan narasumber. Gunakan kata tanya 5W1H (apa, siapa, di mana, kapan, mengapa, bagaimana) dengan sopan.",
        questions: [
          {
            id: 1,
            question: "Orang yang memberikan informasi atau menjawab pertanyaan saat wawancara disebut...",
            visualHelper: "🎤",
            options: ["Narasumber", "Pewawancara", "Penonton"],
            correctIndex: 0,
            explanation: "Narasumber adalah orang yang ahli atau dipercaya untuk memberikan informasi.",
          },
          {
            id: 2,
            question: "Orang yang mengajukan daftar pertanyaan dalam kegiatan wawancara disebut...",
            visualHelper: "📝",
            options: ["Pewawancara", "Narasumber", "Pembaca"],
            correctIndex: 0,
            explanation: "Pewawancara adalah orang yang bertugas memandu dan bertanya.",
          },
          {
            id: 3,
            question: "Sebelum melakukan wawancara, hal utama yang harus disiapkan adalah...",
            visualHelper: "📋",
            options: ["Daftar pertanyaan yang runtut dan alat tulis", "Makanan ringan", "Mainan"],
            correctIndex: 0,
            explanation: "Menyiapkan daftar pertanyaan membuat wawancara terarah dan fokus pada topik.",
          },
          {
            id: 4,
            question: "Kata tanya yang tepat untuk menanyakan alasan atau sebab narasumber adalah...",
            visualHelper: "❓",
            options: ["Mengapa", "Kapan", "Di mana"],
            correctIndex: 0,
            explanation: "'Mengapa' menanyakan alasan atau latar belakang suatu tindakan.",
          },
          {
            id: 5,
            question: "Kata tanya yang tepat untuk menanyakan cara merawat tanaman hias adalah...",
            visualHelper: "🌱",
            options: ["Bagaimana", "Kapan", "Siapa"],
            correctIndex: 0,
            explanation: "'Bagaimana' menanyakan proses, langkah-langkah, atau cara kerja.",
          },
          {
            id: 6,
            question: "Sikap yang baik ketika narasumber sedang memberikan penjelasan adalah...",
            visualHelper: "👂",
            options: ["Mendengarkan dengan saksama dan mencatat", "Memotong pembicaraan narasumber", "Bermain ponsel"],
            correctIndex: 0,
            explanation: "Mendengarkan tanpa memotong pembicaraan menunjukkan rasa hormat kepada narasumber.",
          },
          {
            id: 7,
            question: "Setelah wawancara selesai dilaksanakan, pewawancara wajib mengucapkan...",
            visualHelper: "🙏",
            options: ["Terima kasih atas waktu dan penjelasannya", "Sudah selesai, saya pulang!", "Penjelasannya kurang bagus"],
            correctIndex: 0,
            explanation: "Mengucapkan terima kasih adalah etika wajib penutup wawancara.",
          },
          {
            id: 8,
            question: "Jika ingin mewawancarai dokter cilik di sekolah, tema yang sesuai adalah...",
            visualHelper: "🩺",
            options: ["Kesehatan dan kebersihan lingkungan sekolah", "Cara membuat mobil balap", "Harga tiket bioskop"],
            correctIndex: 0,
            explanation: "Dokter cilik menguasai bidang kesehatan dan kebersihan di lingkungan sekolah.",
          },
          {
            id: 9,
            question: "Kata tanya 'Kapan' cocok digunakan untuk menanyakan hal...",
            visualHelper: "⏰",
            options: ["Waktu panen tanaman padi", "Jumlah karung beras", "Nama petani"],
            correctIndex: 0,
            explanation: "Kata 'Kapan' menanyakan waktu, seperti hari, tanggal, atau jam panen.",
          },
          {
            id: 10,
            question: "Bahasa yang digunakan saat berbicara dengan narasumber yang lebih tua adalah...",
            visualHelper: "✨",
            options: ["Bahasa Indonesia yang baku dan santun", "Bahasa gaul yang kasar", "Berteriak-teriak"],
            correctIndex: 0,
            explanation: "Wawancara resmi menggunakan bahasa Indonesia yang santun dan beradab.",
          },
        ],
      };

    case 5:
      return {
        title: "Membaca Intensif & Ekstensif",
        conceptText: "Membaca intensif dilakukan secara cermat mendalam untuk memahami teks ilmiah populer tentang cuaca, perubahan wujud benda, energi alternatif, dan makhluk hidup.",
        questions: [
          {
            id: 1,
            question: "Kegiatan membaca secara bersungguh-sungguh untuk memahami detail isi bacaan disebut membaca...",
            visualHelper: "🔍",
            options: ["Intensif", "Cepat sambil lalu", "Sekilas"],
            correctIndex: 0,
            explanation: "Membaca intensif bertujuan memahami setiap informasi secara mendalam.",
          },
          {
            id: 2,
            question: "Perubahan wujud benda dari zat cair menjadi zat padat disebut...",
            visualHelper: "❄️",
            options: ["Membeku", "Mencair", "Menguap"],
            correctIndex: 0,
            explanation: "Air yang dimasukkan ke freezer akan membeku menjadi es padat.",
          },
          {
            id: 3,
            question: "Perubahan wujud benda dari zat padat menjadi cair karena dipanaskan disebut...",
            visualHelper: "🕯️",
            options: ["Mencair (meleleh)", "Mengembun", "Menyublim"],
            correctIndex: 0,
            explanation: "Lilin atau es batu yang terkena panas akan mencair.",
          },
          {
            id: 4,
            question: "Benda gas yang berubah menjadi titik-titik air di pagi hari disebut peristiwa...",
            visualHelper: "💧",
            options: ["Mengembun", "Menguap", "Membeku"],
            correctIndex: 0,
            explanation: "Uap air di udara malam berubah menjadi titik embun di dedaunan pagi.",
          },
          {
            id: 5,
            question: "Matahari merupakan sumber energi terbesar bagi bumi yang menghasilkan...",
            visualHelper: "☀️",
            options: ["Energi panas dan cahaya", "Energi dingin", "Energi suara"],
            correctIndex: 0,
            explanation: "Matahari memancarkan panas untuk menghangatkan bumi dan cahaya untuk fotosintesis.",
          },
          {
            id: 6,
            question: "Ciri makhluk hidup bernapas adalah...",
            visualHelper: "🫁",
            options: ["Menghirup oksigen dan menghembuskan udara", "Hanya diam tidak bergerak", "Tidak membutuhkan makanan"],
            correctIndex: 0,
            explanation: "Semua makhluk hidup bernapas untuk mempertahankan kelangsungan hidupnya.",
          },
          {
            id: 7,
            question: "Energi alternatif yang memanfaatkan hembusan angin untuk memutar kincir adalah...",
            visualHelper: "🌬️",
            options: ["Energi angin", "Energi minyak bumi", "Energi batu bara"],
            correctIndex: 0,
            explanation: "Angin adalah energi alternatif ramah lingkungan dan tidak pernah habis.",
          },
          {
            id: 8,
            question: "Setelah membaca teks bacaan tentang energi, kita dapat membuat ringkasan dengan cara...",
            visualHelper: "✍️",
            options: ["Mencatat gagasan penting tiap paragraf", "Menyalin ulang seluruh buku", "Mengganti judulnya saja"],
            correctIndex: 0,
            explanation: "Ringkasan dibuat dari rangkuman ide-ide pokok setiap paragraf.",
          },
          {
            id: 9,
            question: "Tumbuhan hijau memasak makanannya sendiri melalui proses...",
            visualHelper: "🌿",
            options: ["Fotosintesis", "Penyerbukan", "Perkecambahan"],
            correctIndex: 0,
            explanation: "Fotosintesis membutuhkan cahaya matahari, air, klorofil, dan karbon dioksida.",
          },
          {
            id: 10,
            question: "Manfaat membaca teks informatif secara rutin adalah...",
            visualHelper: "📚",
            options: ["Menambah wawasan dan ilmu pengetahuan", "Membuat mata lelah tanpa hasil", "Mengurangi kosakata"],
            correctIndex: 0,
            explanation: "Membaca teks memperkaya wawasan pengetahuan umum kita setiap hari.",
          },
        ],
      };

    case 6:
      return {
        title: "Puisi & Ungkapan Perasaan",
        conceptText: "Menulis puisi anak berdasarkan pengalaman pribadi (keluarga, alam, cita-cita) dan membacakannya dengan lafal jelas, intonasi berirama, dan penghayatan ekspresi.",
        questions: [
          {
            id: 1,
            question: "Puisi yang ditulis berdasarkan apa yang kita alami dalam kehidupan sehari-hari disebut puisi bertema...",
            visualHelper: "📝",
            options: ["Pengalaman pribadi", "Khayalan fiksi belaka", "Berita koran"],
            correctIndex: 0,
            explanation: "Pengalaman pribadi menjadi inspirasi paling tulus untuk menulis puisi.",
          },
          {
            id: 2,
            question: "Pilihan kata yang indah dan bermakna dalam menulis puisi disebut...",
            visualHelper: "💎",
            options: ["Diksi", "Ejaan", "Tanda baca"],
            correctIndex: 0,
            explanation: "Diksi adalah pemilihan kata yang tepat dan puitis untuk menyampaikan rasa.",
          },
          {
            id: 3,
            question: "Saat membacakan puisi tentang perjuangan pahlawan kemerdekaan, nada intonasi kita sebaiknya...",
            visualHelper: "🔥",
            options: ["Semangat dan berkobar-kobar", "Malu-malu dan berbisik", "Mengantuk dan lemas"],
            correctIndex: 0,
            explanation: "Puisi perjuangan membutuhkan intonasi lantang, tegas, dan penuh semangat.",
          },
          {
            id: 4,
            question: "Lafal 'vokal' dalam membaca puisi berarti mengucapkan huruf...",
            visualHelper: "🗣️",
            options: ["A, I, U, E, O dengan mulut terbuka jelas", "Tertutup rapat tanpa suara", "Bersiul saja"],
            correctIndex: 0,
            explanation: "Artikulasi vokal yang jelas membuat pendengar memahami kata demi kata puisi.",
          },
          {
            id: 5,
            question: "Gerakan tubuh dan tangan yang mendukung penghayatan saat membaca puisi disebut...",
            visualHelper: "💃",
            options: ["Gestur (gerak tubuh)", "Lafal", "Intonasi"],
            correctIndex: 0,
            explanation: "Gestur adalah gerak tangan atau tubuh yang selaras dengan pesan puisi.",
          },
          {
            id: 6,
            question: "Dalam baris puisi: 'Angin berbisik di pucuk cemara.' Kata 'berbisik' mengibaratkan angin seperti...",
            visualHelper: "🌲",
            options: ["Manusia yang bersuara pelan", "Batu yang diam", "Ikan di laut"],
            correctIndex: 0,
            explanation: "Menggambarkan benda mati berperilaku seperti manusia adalah gaya bahasa puitis.",
          },
          {
            id: 7,
            question: "Karya puisi biasanya ditulis dalam bentuk...",
            visualHelper: "📜",
            options: ["Bait dan baris", "Paragraf panjang bersambung", "Tabel daftar nilai"],
            correctIndex: 0,
            explanation: "Bentuk fisik puisi tersusun atas bait-bait yang berisi larik/baris kalimat.",
          },
          {
            id: 8,
            question: "Apa yang harus diperhatikan sebelum tampil membacakan puisi di panggung?",
            visualHelper: "🎭",
            options: ["Memahami makna isi puisi dan berlatih intonasi", "Menghafal rumus matematika", "Tidur di atas panggung"],
            correctIndex: 0,
            explanation: "Memahami isi puisi membuat kita bisa menghayati ekspresi dan mimik wajah dengan pas.",
          },
          {
            id: 9,
            question: "Jika isi puisi bercerita tentang kehilangan hewan peliharaan tersayang, raut muka kita sebaiknya...",
            visualHelper: "😢",
            options: ["Sedih dan penuh haru", "Tertawa riang", "Marah membentak"],
            correctIndex: 0,
            explanation: "Mimik muka harus mencerminkan rasa duka dan kehilangan.",
          },
          {
            id: 10,
            question: "Menulis puisi tentang keindahan alam Indonesia menumbuhkan rasa...",
            visualHelper: "🇮🇩",
            options: ["Cinta tanah air dan syukur kepada Tuhan", "Ingin merusak hutan", "Benci pada negeri sendiri"],
            correctIndex: 0,
            explanation: "Puisi keindahan tanah air membangkitkan rasa bangga dan cinta tanah air.",
          },
        ],
      };

    default:
      return {
        title: "Bahasa Indonesia Kelas 3 SD",
        conceptText: "Materi belajar Bahasa Indonesia dasar Kelas 3 SD.",
        questions: [],
      };
  }
}
