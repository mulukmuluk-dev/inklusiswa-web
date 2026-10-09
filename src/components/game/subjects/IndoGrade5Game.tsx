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

interface IndoGrade5GameProps {
  levelId: number;
  onLevelComplete: (levelId: number, starsEarned: number) => void;
  accessibilityMode?: string;
}

export function IndoGrade5Game({ levelId, onLevelComplete, accessibilityMode }: IndoGrade5GameProps) {
  const [phase, setPhase] = useState<"materi" | "game">("materi");

  // Phase 1 interactive state
  const [activeAffix, setActiveAffix] = useState<string>("me-kan");
  const [activePantunLine, setActivePantunLine] = useState<number>(1);

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
    setActiveAffix("me-kan");
    setActivePantunLine(1);

    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setWrongAttempts(0);
    setShowClue(false);
    setIsCompleted(false);
    isProcessingRef.current = false;

    const data = getGrade5LevelData(levelId);
    setQuestionsList(shuffleQuestions(data));
    speakGlobal(data.conceptText);
  }, [levelId]);

  const levelData = getGrade5LevelData(levelId);
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
          speakGlobal(`Luar biasa! Kamu telah menyelesaikan 10 soal Bahasa Indonesia Kelas 5 dan meraih ${stars} bintang!`);
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
            BAHASA INDONESIA KELAS 5 SD • LEVEL {levelId} dari 6
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
                  Mengenal Imbuhan & Konjungsi:
                </span>
                <div className="grid grid-cols-3 gap-2 w-full">
                  {[
                    { imbuhan: "me-kan", kata: "bersih", hasil: "membersihkan", arti: "Menjadikan bersih" },
                    { imbuhan: "di-i", kata: "sayang", hasil: "disayangi", arti: "Dikenai rasa sayang" },
                    { imbuhan: "ber-an", kata: "lari", hasil: "berlarian", arti: "Banyak yang berlari" },
                  ].map((im) => (
                    <button
                      key={im.imbuhan}
                      type="button"
                      onClick={() => {
                        setActiveAffix(im.imbuhan);
                        playPopSound();
                        speakGlobal(`Imbuhan ${im.imbuhan} pada kata ${im.kata} menjadi ${im.hasil}`);
                      }}
                      className={`p-3 rounded-xl border-2 border-[#3C632A] text-center transition-all ${
                        activeAffix === im.imbuhan ? "bg-[#FF5685] text-white scale-102" : "bg-teal-50 text-[#3C632A]"
                      }`}
                    >
                      <span className="text-xs font-black block">{im.imbuhan}</span>
                      <span className="text-xs font-bold block mt-1">{im.hasil}</span>
                      <span className="text-[10px] block opacity-90 mt-0.5">{im.arti}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {levelId === 2 && (
              <div className="w-full flex flex-col items-center space-y-3 text-center">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Struktur Teks Eksplanasi (Fenomena Alam):
                </span>
                <div className="grid grid-cols-3 gap-2 w-full text-xs font-bold">
                  <div className="p-2.5 bg-yellow-50 border border-yellow-300 rounded-xl">🌋 1. Pernyataan Umum (Identifikasi fenomena)</div>
                  <div className="p-2.5 bg-blue-50 border border-blue-300 rounded-xl">⛓️ 2. Deretan Penjelas (Rangkaian sebab-akibat)</div>
                  <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl">📝 3. Interpretasi (Ulasan / simpulan)</div>
                </div>
              </div>
            )}

            {levelId === 3 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Ciri Bahasa Iklan Persuasif:
                </span>
                <div className="p-4 bg-amber-50 rounded-2xl border-2 border-[#3C632A] w-full text-xs space-y-1.5 text-slate-800">
                  <p>📢 <strong>Persuasif:</strong> Bersifat mengajak atau membujuk pembaca.</p>
                  <p>✨ <strong>Slogan Singkat:</strong> "Sehat Dimulai dari Segelas Susu Segar!"</p>
                  <p>🔑 <strong>Kata Kunci:</strong> Menyoroti keunggulan utama produk/jasa.</p>
                </div>
              </div>
            )}

            {levelId === 4 && (
              <div className="w-full flex flex-col items-center space-y-3 text-center">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Menggali Teks Narasi Sejarah Bangsa:
                </span>
                <div className="p-3 bg-red-50 border-2 border-red-300 rounded-xl w-full text-xs text-left text-slate-800 leading-relaxed">
                  "Pada tanggal 17 Agustus 1945 di Jalan Pegangsaan Timur No. 56 Jakarta, Ir. Soekarno didampingi Drs. Mohammad Hatta membacakan teks Proklamasi Kemerdekaan Indonesia."
                </div>
                <div className="text-[11px] font-bold text-red-900">
                  Informasi sejarah digali dengan aspek: Kapan (17 Agustus 1945), Di mana (Jakarta), Siapa (Soekarno-Hatta), Apa (Proklamasi).
                </div>
              </div>
            )}

            {levelId === 5 && (
              <div className="w-full flex flex-col items-center space-y-3 text-center">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Teknik Membuat Ringkasan Bacaan:
                </span>
                <div className="grid grid-cols-3 gap-2 w-full text-[11px] font-bold">
                  <div className="p-2 bg-slate-100 rounded-lg">1. Baca teks asli berulang kali</div>
                  <div className="p-2 bg-slate-100 rounded-lg">2. Catat gagasan pokok tiap alinea</div>
                  <div className="p-2 bg-slate-100 rounded-lg">3. Rangkai jadi kalimat efektif runtut</div>
                </div>
              </div>
            )}

            {levelId === 6 && (
              <div className="w-full flex flex-col items-center space-y-3 text-center">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Ciri-Ciri Pantun (Rima a-b-a-b):
                </span>
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-300 text-xs text-left w-full space-y-1 font-serif">
                  <p className="text-purple-700 italic">Baris 1 (Sampiran): Berakit-rakit ke hulu (a)</p>
                  <p className="text-purple-700 italic">Baris 2 (Sampiran): Berenang-renang ke tepian (b)</p>
                  <p className="font-bold text-slate-900">Baris 3 (Isi): Bersakit-sakit dahulu (a)</p>
                  <p className="font-bold text-slate-900">Baris 4 (Isi): Bersenang-senang kemudian (b)</p>
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

// ================= DATA SOAL KELAS 5 SD (6 LEVEL x 10 SOAL = 60 SOAL LENGKAP) =================
function getGrade5LevelData(levelId: number): LevelConceptData {
  switch (levelId) {
    case 1:
      return {
        title: "Kalimat Efektif & Ejaan (EYD)",
        conceptText: "Kaidah penulisan kata baku, penggunaan konjungsi (kata hubung: dan, tetapi, karena), serta pembentukan kata berimbuhan (awalan me-, ber-, pe-, akhiran -kan, -i).",
        questions: [
          {
            id: 1,
            question: "Manakah pasangan kata baku dan tidak baku yang benar menurut EYD?",
            visualHelper: "📚",
            options: ["Nasihat (baku) - Nasehat (tidak baku)", "Ijin (baku) - Izin (tidak baku)", "Aktip (baku) - Aktif (tidak baku)"],
            correctIndex: 0,
            explanation: "Bentuk baku yang tepat adalah 'nasihat', bukan nasehat.",
          },
          {
            id: 2,
            question: "Kata dasar 'sapu' jika diberi awalan 'me-' berubah menjadi...",
            visualHelper: "🧹",
            options: ["Menyapu", "Mesapu", "Mensapu"],
            correctIndex: 0,
            explanation: "Huruf s luluh menjadi ny- saat bertemu awalan me- (menyapu).",
          },
          {
            id: 3,
            question: "Kata hubung (konjungsi) yang menyatakan hubungan pertentangan adalah...",
            visualHelper: "⚖️",
            options: ["Tetapi / Namun", "Dan / Serta", "Karena / Sebab"],
            correctIndex: 0,
            explanation: "'Tetapi' dan 'namun' digunakan untuk mempertentangkan dua pernyataan.",
          },
          {
            id: 4,
            question: "Bentuk kata baku untuk alat pengukur panas suhu tubuh adalah...",
            visualHelper: "🌡️",
            options: ["Termometer", "Thermometer", "Termomiter"],
            correctIndex: 0,
            explanation: "Penulisan serapan baku bahasa Indonesia adalah 'termometer'.",
          },
          {
            id: 5,
            question: "Kalimat: 'Budi sangat giat sekali belajar.' Kalimat ini tidak efektif karena...",
            visualHelper: "✂️",
            options: ["Pemborosan kata 'sangat' dan 'sekali' (keduanya bermakna amat)", "Kurang panjang", "Tidak memakai tanda tanya"],
            correctIndex: 0,
            explanation: "Gunakan salah satu: 'sangat giat' atau 'giat sekali'.",
          },
          {
            id: 6,
            question: "Kata dasar 'tulis' jika diberi awalan 'me-' dan akhiran '-kan' menjadi...",
            visualHelper: "✍️",
            options: ["Menuliskan", "Mentuliskan", "Metuliskan"],
            correctIndex: 0,
            explanation: "Huruf t luluh menjadi n- (menuliskan).",
          },
          {
            id: 7,
            question: "Bentuk baku dari kata 'obyek' dan 'kwalitas' adalah...",
            visualHelper: "✅",
            options: ["Objek dan kualitas", "Obyek dan kwalitet", "Objec dan kualitet"],
            correctIndex: 0,
            explanation: "Huruf serapan y diganti j (objek) dan w diganti u (kualitas).",
          },
          {
            id: 8,
            question: "Konjungsi yang menyatakan hubungan sebab-akibat adalah...",
            visualHelper: "🔗",
            options: ["Karena dan sehingga", "Atau dan kecuali", "Lalu dan kemudian"],
            correctIndex: 0,
            explanation: "'Karena' menyatakan sebab, sedangkan 'sehingga' menyatakan akibat.",
          },
          {
            id: 9,
            question: "Kata dasar 'kunci' jika diberi awalan 'me-' menjadi...",
            visualHelper: "🔐",
            options: ["Mengunci", "Menkunci", "Mengkunci"],
            correctIndex: 0,
            explanation: "Huruf k luluh menjadi ng- saat bertemu awalan me- (mengunci).",
          },
          {
            id: 10,
            question: "Penulisan gabungan kata di bawah ini yang baku adalah...",
            visualHelper: "🤝",
            options: ["Kerja sama (terpisah)", "Kerjasama (disambung)", "Kerja-sama"],
            correctIndex: 0,
            explanation: "Gabungan kata tanpa imbuhan ditulis terpisah: 'kerja sama'.",
          },
        ],
      };

    case 2:
      return {
        title: "Teks Penjelasan (Eksplanasi)",
        conceptText: "Teks eksplanasi menjelaskan proses terjadinya fenomena alam (gempa, siklus air, pelangi) atau sosial dengan struktur: Pernyataan Umum, Deretan Penjelas, dan Interpretasi.",
        questions: [
          {
            id: 1,
            question: "Teks yang berisi penjelasan ilmiah mengenai proses terjadinya fenomena alam atau peristiwa sosial dinamakan teks...",
            visualHelper: "🌋",
            options: ["Eksplanasi", "Fabel", "Puisi"],
            correctIndex: 0,
            explanation: "Teks eksplanasi berfokus menjawab pertanyaan 'mengapa' dan 'bagaimana' fenomena terjadi.",
          },
          {
            id: 2,
            question: "Bagian pertama teks eksplanasi yang mengenalkan nama fenomena yang akan dijelaskan adalah...",
            visualHelper: "🌐",
            options: ["Pernyataan umum (identifikasi)", "Deretan penjelas", "Interpretasi"],
            correctIndex: 0,
            explanation: "Pernyataan umum mengenalkan gambaran awal fenomena yang dibahas.",
          },
          {
            id: 3,
            question: "Bagian teks eksplanasi yang menguraikan urutan proses sebab-akibat secara mendalam disebut...",
            visualHelper: "⛓️",
            options: ["Deretan penjelas (rangkaian peristiwa)", "Pernyataan umum", "Daftar isi"],
            correctIndex: 0,
            explanation: "Deretan penjelas membedah proses ilmiah tahap demi tahap.",
          },
          {
            id: 4,
            question: "Fenomena alam pelangi terjadi karena adanya proses...",
            visualHelper: "🌈",
            options: ["Pembiasan cahaya matahari oleh titik-titik air hujan", "Cahaya bulan yang tertutup awan", "Ledakan gunung berapi"],
            correctIndex: 0,
            explanation: "Sinar matahari dibiaskan oleh tetesan air hujan sehingga mengurai warna spektrum.",
          },
          {
            id: 5,
            question: "Ciri utama bahasa yang digunakan dalam teks eksplanasi adalah...",
            visualHelper: "🔬",
            options: ["Faktual (berdasarkan fakta ilmiah) dan objektif", "Bersifat khayalan dongeng", "Menggunakan bahasa lelucon"],
            correctIndex: 0,
            explanation: "Teks eksplanasi berpijak pada prinsip sains dan kenyataan faktual.",
          },
          {
            id: 6,
            question: "Kata hubung kronologis yang lazim digunakan dalam teks eksplanasi siklus air adalah...",
            visualHelper: "💧",
            options: ["Mula-mula, kemudian, setelah itu", "Tetapi, melainkan", "Meskipun, biarpun"],
            correctIndex: 0,
            explanation: "Kata kronologis merangkai urutan evaporasi, kondensasi, dan presipitasi.",
          },
          {
            id: 7,
            question: "Bagian penutup teks eksplanasi yang memuat simpulan atau ulasan penulis disebut...",
            visualHelper: "🏁",
            options: ["Interpretasi (ulasan akhir)", "Pernyataan umum", "Latar belakang"],
            correctIndex: 0,
            explanation: "Interpretasi adalah bagian akhir yang menyimpulkan keseluruhan proses.",
          },
          {
            id: 8,
            question: "Contoh topik fenomena sosial yang dapat ditulis dalam teks eksplanasi adalah...",
            visualHelper: "🏙️",
            options: ["Proses terjadinya urbanisasi penduduk ke kota besar", "Gerhana matahari cincin", "Siklus daur air"],
            correctIndex: 0,
            explanation: "Urbanisasi adalah fenomena sosial masyarakat perkotaan.",
          },
          {
            id: 9,
            question: "Istilah ilmiah 'evaporasi' dalam teks eksplanasi siklus air bermakna...",
            visualHelper: "☁️",
            options: ["Penguapan air akibat panas matahari", "Turunnya butiran air hujan", "Penyerapan air ke tanah"],
            correctIndex: 0,
            explanation: "Evaporasi adalah proses perubahan air cair menjadi uap air.",
          },
          {
            id: 10,
            question: "Tujuan utama seseorang membaca teks eksplanasi adalah...",
            visualHelper: "💡",
            options: ["Memahami proses dan penyebab terjadinya suatu peristiwa ilmiah", "Mencari hiburan cerita lucu", "Membeli produk baru"],
            correctIndex: 0,
            explanation: "Teks eksplanasi memperkaya wawasan pengetahuan sains kita.",
          },
        ],
      };

    case 3:
      return {
        title: "Iklan Media Cetak & Elektronik",
        conceptText: "Iklan bertujuan membujuk (persuasif) masyarakat untuk membeli barang atau memanfaatkan jasa. Ciri iklan: Informatif, slogan menarik, kata kunci jelas, dan visual memikat.",
        questions: [
          {
            id: 1,
            question: "Tujuan utama pembuatan iklan komersial adalah...",
            visualHelper: "📢",
            options: ["Menarik minat masyarakat untuk membeli barang atau menggunakan jasa", "Menceritakan dongeng masa lalu", "Membuat pembaca merasa bingung"],
            correctIndex: 0,
            explanation: "Iklan bertujuan mempromosikan produk/jasa agar dikenal dan diminati konsumen.",
          },
          {
            id: 2,
            question: "Kalimat yang bersifat mengajak, membujuk, atau meyakinkan pembaca disebut kalimat...",
            visualHelper: "🤝",
            options: ["Persuasif", "Naratif", "Deskriptif"],
            correctIndex: 0,
            explanation: "Sifat persuasif menjadi nyawa utama dalam bahasa teks periklanan.",
          },
          {
            id: 3,
            question: "Kalimat pendek yang mencolok, menarik, dan mudah diingat untuk memberitahukan tujuan iklan disebut...",
            visualHelper: "✨",
            options: ["Slogan", "Paragraf", "Daftar isi"],
            correctIndex: 0,
            explanation: "Slogan adalah moto atau semboyan singkat yang melekat kuat di ingatan publik.",
          },
          {
            id: 4,
            question: "Contoh iklan media elektronik adalah iklan yang ditayangkan melalui...",
            visualHelper: "📺",
            options: ["Televisi, radio, dan internet", "Koran dan majalah cetak", "Brosur selebaran kertas"],
            correctIndex: 0,
            explanation: "Media elektronik mencakup tayangan audio-visual radio, TV, dan media digital.",
          },
          {
            id: 5,
            question: "Kata yang menjadi inti atau fokus utama dari suatu pesan iklan disebut...",
            visualHelper: "🔑",
            options: ["Kata kunci (keyword)", "Kata sulit", "Kata sambung"],
            correctIndex: 0,
            explanation: "Kata kunci menonjolkan keunggulan produk (misal: 'alami', 'hemat energi', 'higienis').",
          },
          {
            id: 6,
            question: "Iklan yang dibuat oleh pemerintah untuk mengajak masyarakat hidup sehat (tanpa menjual barang dagangan) disebut...",
            visualHelper: "🏛️",
            options: ["Iklan Layanan Masyarakat (ILM)", "Iklan niaga", "Iklan baris"],
            correctIndex: 0,
            explanation: "ILM mengajak kepedulian sosial, seperti kampanye hemat listrik atau cegah DBD.",
          },
          {
            id: 7,
            question: "Kelebihan utama iklan di media televisi dibandingkan media cetak koran adalah...",
            visualHelper: "🎥",
            options: ["Menampilkan kombinasi gambar bergerak, suara, dan warna yang hidup", "Harganya gratis selamanya", "Teksnya bisa disentuh tangan"],
            correctIndex: 0,
            explanation: "Unsur audio, video, dan visual gerak membuat pesan iklan TV lebih memikat.",
          },
          {
            id: 8,
            question: "Slogan iklan: 'Hemat Energi, Sayangi Bumi!' memiliki makna ajakan untuk...",
            visualHelper: "🌍",
            options: ["Menggunakan energi listrik secara bijak demi kelestarian bumi", "Membuang sampah ke sungai", "Menghabiskan listrik"],
            correctIndex: 0,
            explanation: "Slogan ini mengajak pembaca mematikan listrik yang tidak terpakai.",
          },
          {
            id: 9,
            question: "Unsur penting yang harus ada pada iklan media cetak agar pembaca mudah menghubungi pemasang iklan adalah...",
            visualHelper: "📞",
            options: ["Kontak telepon, alamat, atau media sosial", "Nama pembuat kertas", "Daftar rumus fisika"],
            correctIndex: 0,
            explanation: "Kontak jelas memudahkan calon pembeli melakukan pemesanan produk.",
          },
          {
            id: 10,
            question: "Bahasa iklan harus komunikatif, artinya...",
            visualHelper: "🗣️",
            options: ["Mudah dipahami dan pesannya langsung sampai ke pikiran pembaca", "Menggunakan bahasa asing yang sukar", "Bahasanya sangat berbelit"],
            correctIndex: 0,
            explanation: "Komunikatif berarti pesan tersampaikan jelas tanpa kesalahpahaman.",
          },
        ],
      };

    case 4:
      return {
        title: "Teks Narasi Sejarah Bangsa",
        conceptText: "Teks narasi sejarah menceritakan fakta peristiwa perjuangan masa lampau secara kronologis. Informasi penting digali menggunakan kata tanya: Adiksimba (Apa, Di mana, Kapan, Siapa, Mengapa, Bagaimana).",
        questions: [
          {
            id: 1,
            question: "Teks yang menceritakan peristiwa nyata perjuangan bangsa di masa lampau disebut teks...",
            visualHelper: "📜",
            options: ["Narasi sejarah", "Fabel", "Fiksi ilmiah"],
            correctIndex: 0,
            explanation: "Narasi sejarah mendokumentasikan fakta perjalanan bangsa secara kronologis.",
          },
          {
            id: 2,
            question: "Singkatan 'Adiksimba' yang digunakan untuk membedah teks sejarah terdiri dari...",
            visualHelper: "❓",
            options: ["Apa, Di mana, Kapan, Siapa, Mengapa, Bagaimana", "Aku, Dia, Kamu, Siapa, Mengapa, Berapa", "Awal, Akhir, Latar, Tokoh, Alur, Tema"],
            correctIndex: 0,
            explanation: "Adiksimba adalah padanan kata tanya bahasa Indonesia untuk 5W1H.",
          },
          {
            id: 3,
            question: "Naskah teks Proklamasi Kemerdekaan Indonesia diketik rapi oleh tokoh pemuda bernama...",
            visualHelper: "⌨️",
            options: ["Sayuti Melik", "Sukarni", "Chaeroel Saleh"],
            correctIndex: 0,
            explanation: "Sayuti Melik berjasa mengetik naskah proklamasi setelah dirumuskan Soekarno-Hatta.",
          },
          {
            id: 4,
            question: "Untuk menanyakan latar waktu terjadinya peristiwa Rengasdengklok, kata tanya yang tepat adalah...",
            visualHelper: "⏰",
            options: ["Kapan", "Di mana", "Siapa"],
            correctIndex: 0,
            explanation: "'Kapan' menanyakan hari dan tanggal terjadinya peristiwa sejarah.",
          },
          {
            id: 5,
            question: "Peristiwa sejarah disusun secara 'kronologis', yang bermakna disusun berdasarkan...",
            visualHelper: "⏳",
            options: ["Urutan waktu kejadian dari awal hingga akhir", "Abjad nama pahlawan", "Tingkat ketenaran tokoh"],
            correctIndex: 0,
            explanation: "Kronologis berarti urut sesuai linimasa perjalanan waktu.",
          },
          {
            id: 6,
            question: "Tokoh yang menjahit Bendera Pusaka Sang Saka Merah Putih pertama kali adalah...",
            visualHelper: "🇮🇩",
            options: ["Ibu Fatmawati", "R.A. Kartini", "Cut Nyak Dien"],
            correctIndex: 0,
            explanation: "Ibu Fatmawati menjahit bendera Merah Putih yang dikibarkan saat proklamasi 17 Agustus 1945.",
          },
          {
            id: 7,
            question: "Kata tanya 'Mengapa' dalam teks peristiwa Bandung Lautan Api digunakan untuk menggali...",
            visualHelper: "🔥",
            options: ["Alasan para pejuang membumihanguskan kota Bandung", "Jumlah bambu runcing", "Warna seragam tentara"],
            correctIndex: 0,
            explanation: "Mengapa menggali latar belakang strategi para pejuang agar Bandung tidak dikuasai sekutu.",
          },
          {
            id: 8,
            question: "Nilai luhur yang dapat kita teladani dari para pejuang kemerdekaan adalah...",
            visualHelper: "🎖️",
            options: ["Rela berkorban, cinta tanah air, dan pantang menyerah", "Mementingkan diri sendiri", "Cepat putus asa"],
            correctIndex: 0,
            explanation: "Semangat rela berkorban demi bangsa adalah warisan teladan abadi para pahlawan.",
          },
          {
            id: 9,
            question: "Tempat perumusan naskah Proklamasi Kemerdekaan Indonesia dilakukan di rumah...",
            visualHelper: "🏠",
            options: ["Laksamana Tadashi Maeda", "Jenderal Sudirman", "Pangeran Diponegoro"],
            correctIndex: 0,
            explanation: "Naskah proklamasi dirumuskan di kediaman Laksamana Maeda di Jakarta.",
          },
          {
            id: 10,
            question: "Sumpah Pemuda yang mengikrarkan satu tanah air, bangsa, dan bahasa diikrarkan pada tanggal...",
            visualHelper: "✊",
            options: ["28 Oktober 1928", "17 Agustus 1945", "10 November 1945"],
            correctIndex: 0,
            explanation: "Kongres Pemuda II melahirkan Sumpah Pemuda pada 28 Oktober 1928.",
          },
        ],
      };

    case 5:
      return {
        title: "Membuat Ringkasan & Ikhtisar",
        conceptText: "Ringkasan adalah penyajian singkat karangan panjang dengan mempertahankan urutan isi dan sudut pandang penulis asli, tanpa mengubah inti pesan naskah.",
        questions: [
          {
            id: 1,
            question: "Penyajian kembali sebuah bacaan panjang dalam bentuk yang singkat dan padat dinamakan...",
            visualHelper: "📝",
            options: ["Ringkasan (rangkuman)", "Puisi", "Kamus"],
            correctIndex: 0,
            explanation: "Ringkasan memadatkan bacaan panjang menjadi intisari pokok yang efisien.",
          },
          {
            id: 2,
            question: "Langkah pertama yang mutlak dilakukan sebelum membuat ringkasan adalah...",
            visualHelper: "📖",
            options: ["Membaca naskah asli secara cermat hingga memahami isinya", "Menghitung jumlah halaman", "Mengganti nama pengarang"],
            correctIndex: 0,
            explanation: "Kita harus memahami pesan dan alur penulis asli sebelum dapat merangkumnya.",
          },
          {
            id: 3,
            question: "Hal yang TIDAK boleh diubah saat membuat ringkasan sebuah buku adalah...",
            visualHelper: "🔒",
            options: ["Urutan gagasan pokok dan sudut pandang pengarang asli", "Warna kertas", "Ukuran tulisan"],
            correctIndex: 0,
            explanation: "Ringkasan harus setia mempertahankan gagasan dan pesan pengarang aslinya.",
          },
          {
            id: 4,
            question: "Dalam membuat ringkasan, kalimat-kalimat panjang diubah menjadi...",
            visualHelper: "✂️",
            options: ["Kalimat efektif yang padat dan lugas", "Tanda tanya semua", "Kalimat yang berima"],
            correctIndex: 0,
            explanation: "Menggunakan kalimat efektif memangkas kata-kata yang mubazir.",
          },
          {
            id: 5,
            question: "Perbedaan utama antara ringkasan dan ikhtisar adalah...",
            visualHelper: "⚖️",
            options: ["Ringkasan mempertahankan urutan asli naskah, sedangkan ikhtisar boleh langsung ke inti persoalan", "Ringkasan selalu lebih tebal dari buku aslinya", "Ikhtisar adalah dongeng"],
            correctIndex: 0,
            explanation: "Ikhtisar memberi kebebasan menuliskan intisari tanpa harus terpaku urutan bab.",
          },
          {
            id: 6,
            question: "Kalimat-kalimat penjelas yang berisi contoh-contoh kecil dan ilustrasi saat membuat ringkasan sebaiknya...",
            visualHelper: "🗑️",
            options: ["Dihilangkan atau dipadatkan intinya saja", "Disalin seluruhnya kata demi kata", "Ditambah ceritanya"],
            correctIndex: 0,
            explanation: "Rincian contoh kecil dipangkas agar naskah ringkasan tetap padat dan ringkas.",
          },
          {
            id: 7,
            question: "Manfaat membuat ringkasan materi pelajaran saat belajar ujian adalah...",
            visualHelper: "🧠",
            options: ["Memudahkan mengingat poin-poin penting materi secara cepat", "Membuat buku menjadi rusak", "Agar catatan lebih tebal"],
            correctIndex: 0,
            explanation: "Catatan ringkas memudahkan proses mengulang dan menghafal materi penting.",
          },
          {
            id: 8,
            question: "Perbandingan panjang naskah ringkasan yang ideal umumnya berkisar antara...",
            visualHelper: "📊",
            options: ["Seperlima hingga sepertiga dari panjang teks aslinya", "Sama panjang dengan teks asli", "Lebih panjang dua kali lipat"],
            correctIndex: 0,
            explanation: "Ringkasan biasanya memadatkan teks menjadi sekitar 20-30% panjang aslinya.",
          },
          {
            id: 9,
            question: "Apakah opini atau pendapat pribadi perangkum boleh dimasukkan ke dalam teks ringkasan?",
            visualHelper: "🚫",
            options: ["Tidak boleh, harus objektif sesuai teks pengarang", "Boleh bebas sebanyak-banyaknya", "Wajib ada opini pribadi"],
            correctIndex: 0,
            explanation: "Ringkasan murni mencerminkan pikiran penulis asli, bukan komentar pembaca.",
          },
          {
            id: 10,
            question: "Kunci utama menyusun kerangka ringkasan yang baik adalah mengumpulkan...",
            visualHelper: "🔑",
            options: ["Gagasan utama (ide pokok) dari setiap paragraf", "Semua tanda titik dan koma", "Kata-kata yang paling sulit"],
            correctIndex: 0,
            explanation: "Rangkaian gagasan pokok tiap paragraf membentuk kerangka ringkasan yang solid.",
          },
        ],
      };

    case 6:
      return {
        title: "Pantun & Sastra Tradisional",
        conceptText: "Pantun adalah puisi lama Indonesia dengan ciri: 1 bait terdiri dari 4 baris, tiap baris 8–12 suku kata, bersajak a-b-a-b, baris 1-2 adalah sampiran, dan baris 3-4 adalah isi.",
        questions: [
          {
            id: 1,
            question: "Satu bait pantun tradisional terdiri dari berapa baris (larik)?",
            visualHelper: "4️⃣",
            options: ["4 baris", "2 baris", "6 baris"],
            correctIndex: 0,
            explanation: "Pantun baku terdiri dari 4 baris dalam setiap baitnya.",
          },
          {
            id: 2,
            question: "Pola sajak atau rima akhir pada pantun yang baku adalah...",
            visualHelper: "🎵",
            options: ["a - b - a - b", "a - a - b - b", "a - b - c - d"],
            correctIndex: 0,
            explanation: "Baris pertama bersajak sama dengan baris ketiga, baris kedua sama dengan baris keempat (a-b-a-b).",
          },
          {
            id: 3,
            question: "Baris ke-1 dan ke-2 dalam sebuah bait pantun disebut...",
            visualHelper: "🌿",
            options: ["Sampiran", "Isi", "Amanat"],
            correctIndex: 0,
            explanation: "Dua baris pertama merupakan sampiran pengantar rima bunyi.",
          },
          {
            id: 4,
            question: "Bagian pantun yang memuat maksud, pesan, atau nasihat sebenarnya terletak pada baris...",
            visualHelper: "💎",
            options: ["Baris ke-3 dan ke-4 (Isi)", "Baris ke-1 dan ke-2", "Hanya baris ke-1"],
            correctIndex: 0,
            explanation: "Isi dan pesan moral pantun berada di baris 3 dan 4.",
          },
          {
            id: 5,
            question: "Jumlah suku kata yang ideal dalam setiap baris pantun adalah...",
            visualHelper: "📏",
            options: ["8 hingga 12 suku kata", "2 hingga 4 suku kata", "20 suku kata"],
            correctIndex: 0,
            explanation: "Kaidah pantun membatasi panjang larik antara 8 sampai 12 suku kata.",
          },
          {
            id: 6,
            question: "Lengkapi sampiran pantun ini: 'Bunga mawar bunga melati / Harum baunya di waktu pagi' rima akhirnya berbunyi...",
            visualHelper: "🌸",
            options: ["-ti dan -gi", "-ar dan -ur", "-an dan -in"],
            correctIndex: 0,
            explanation: "Akhiran baris pertama adalah -ti dan baris kedua adalah -gi.",
          },
          {
            id: 7,
            question: "Pantun yang berisi pesan moral, budi pekerti, dan anjuran kebaikan disebut pantun...",
            visualHelper: "🌟",
            options: ["Nasihat", "Jenaka (lucu)", "Teka-teki"],
            correctIndex: 0,
            explanation: "Pantun nasihat bertujuan mendidik budi pekerti pendengarnya.",
          },
          {
            id: 8,
            question: "Pantun yang bertujuan menghibur dengan kelucuan dan tawa disebut pantun...",
            visualHelper: "😄",
            options: ["Jenaka", "Kiasan", "Duka cita"],
            correctIndex: 0,
            explanation: "Pantun jenaka memuat humor yang mengundang senyum dan tawa.",
          },
          {
            id: 9,
            question: "Tradisi saling membalas pantun secara berpasangan dalam kebudayaan Melayu/Betawi disebut...",
            visualHelper: "🗣️",
            options: ["Berbalas pantun (palang pintu)", "Pidato bersama", "Musyawarah desa"],
            correctIndex: 0,
            explanation: "Berbalas pantun mengasah kecerdasan spontan merangkai rima yang jenaka dan bermakna.",
          },
          {
            id: 10,
            question: "Dalam pantun nasihat belajar: 'Tuntutlah ilmu selagi muda / Agar bahagia di hari tua', pesan moralnya adalah...",
            visualHelper: "📚",
            options: ["Rajin belajar sejak dini membawa kebahagiaan masa depan", "Tidak perlu belajar", "Menunggu tua baru membaca"],
            correctIndex: 0,
            explanation: "Pendidikan di usia muda menjadi bekal kesuksesan hidup di masa depan.",
          },
        ],
      };

    default:
      return {
        title: "Bahasa Indonesia Kelas 5 SD",
        conceptText: "Materi belajar Bahasa Indonesia Kelas 5 SD.",
        questions: [],
      };
  }
}
