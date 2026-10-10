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
      <div className="w-full flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="px-4 py-1.5 bg-[#7FD13B] text-white font-black text-xs md:text-sm rounded-xl border-2 border-[#3C632A]">
            KELAS 5 SD • LEVEL {levelId} dari 6
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

      {/* ================= FASE 1: PENGENALAN KONSEP MATERI ================= */}
      {phase === "materi" ? (
        <div className="w-full max-w-2xl flex-1 flex flex-col items-center justify-between p-6 bg-white/80 border-4 border-[#3C632A] rounded-[28px] shadow-[6px_6px_0px_0px_#3C632A] my-2 text-center animate-in fade-in duration-300">
          <div className="space-y-4">
            <span className="px-4 py-1.5 bg-[#C3631D] text-[#FFDF59] font-black text-sm rounded-xl border-2 border-[#3C632A] uppercase tracking-wider">
              FASE 1: PENGENALAN KONSEP MATERI
            </span>
            <p className="text-2xl md:text-3xl font-black text-[#3C632A] leading-relaxed pt-3">
              {levelData.conceptText}
            </p>
          </div>

          {/* Interactive Preview Demo per Level */}
          <div className="my-4 p-4 bg-[#FFDF59] border-4 border-[#3C632A] rounded-2xl w-full flex items-center justify-center gap-3">
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
                      className={`p-3 rounded-xl border-2 border-[#3C632A] text-center transition-all cursor-pointer ${
                        activeAffix === im.imbuhan ? "bg-[#7FD13B] text-white scale-102 shadow-md" : "bg-white text-[#3C632A] hover:bg-[#FFE296]"
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
                  <div className="p-2.5 bg-white border border-[#3C632A] rounded-xl shadow-sm">
                    <strong>1. Pernyataan Umum</strong><br />
                    <span className="text-[10px] font-normal">Identifikasi fenomena</span>
                  </div>
                  <div className="p-2.5 bg-white border border-[#3C632A] rounded-xl shadow-sm">
                    <strong>2. Deretan Penjelas</strong><br />
                    <span className="text-[10px] font-normal">Rangkaian sebab-akibat</span>
                  </div>
                  <div className="p-2.5 bg-white border border-[#3C632A] rounded-xl shadow-sm">
                    <strong>3. Interpretasi</strong><br />
                    <span className="text-[10px] font-normal">Ulasan atau simpulan</span>
                  </div>
                </div>
              </div>
            )}

            {levelId === 3 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Ciri Bahasa Iklan Persuasif:
                </span>
                <div className="p-4 bg-white rounded-2xl border-2 border-[#3C632A] w-full text-xs space-y-1.5 text-slate-800 shadow-sm">
                  <p>• <strong>Persuasif:</strong> Bersifat mengajak atau membujuk pembaca.</p>
                  <p>• <strong>Slogan Singkat:</strong> "Sehat Dimulai dari Segelas Susu Segar!"</p>
                  <p>• <strong>Kata Kunci:</strong> Menyoroti keunggulan utama produk atau jasa.</p>
                </div>
              </div>
            )}

            {levelId === 4 && (
              <div className="w-full flex flex-col items-center space-y-3 text-center">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Menggali Teks Narasi Sejarah Bangsa:
                </span>
                <div className="p-3 bg-white border-2 border-[#3C632A] rounded-xl w-full text-xs text-left text-slate-800 leading-relaxed shadow-sm">
                  "Pada tanggal 17 Agustus 1945 di Jalan Pegangsaan Timur No. 56 Jakarta, Ir. Soekarno didampingi Drs. Mohammad Hatta membacakan teks Proklamasi Kemerdekaan Indonesia."
                </div>
                <div className="text-[11px] font-bold text-[#3C632A] bg-white/70 px-3 py-1 rounded-lg border border-[#3C632A]">
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
                  <div className="p-2.5 bg-white rounded-lg border border-[#3C632A] shadow-sm">1. Baca teks asli berulang kali</div>
                  <div className="p-2.5 bg-white rounded-lg border border-[#3C632A] shadow-sm">2. Catat gagasan pokok tiap alinea</div>
                  <div className="p-2.5 bg-white rounded-lg border border-[#3C632A] shadow-sm">3. Rangkai jadi kalimat efektif runtut</div>
                </div>
              </div>
            )}

            {levelId === 6 && (
              <div className="w-full flex flex-col items-center space-y-3 text-center">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Ciri-Ciri Pantun (Rima a-b-a-b):
                </span>
                <div className="p-3 bg-white rounded-xl border-2 border-[#3C632A] text-xs text-left w-full space-y-1 font-serif shadow-sm">
                  <p className="text-[#C3631D] italic">Baris 1 (Sampiran): Berakit-rakit ke hulu (a)</p>
                  <p className="text-[#C3631D] italic">Baris 2 (Sampiran): Berenang-renang ke tepian (b)</p>
                  <p className="font-bold text-slate-900">Baris 3 (Isi): Bersakit-sakit dahulu (a)</p>
                  <p className="font-bold text-slate-900">Baris 4 (Isi): Bersenang-senang kemudian (b)</p>
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
        /* ================= HASIL SELESAI 10 SOAL ================= */
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
          <div className="w-full bg-[#C3631D] text-[#FFDF59] border-4 border-[#3C632A] p-6 rounded-3xl text-center shadow-[6px_6px_0px_0px_#3C632A] mb-6">
            <p className="text-2xl md:text-3xl font-black leading-snug">
              {currentQ.question}
            </p>
            {showClue && (
              <div className="mt-3 p-3 bg-white/20 border-2 border-[#FFDF59] rounded-xl text-[#FFDF59] text-xs font-black">
                Petunjuk: {currentQ.explanation}
              </div>
            )}
          </div>

          {/* PILIHAN JAWABAN (ACAK POSISI KIRI, TENGAH, KANAN) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mb-4">
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
            options: ["Nasihat (baku) - Nasehat (tidak baku)", "Ijin (baku) - Izin (tidak baku)", "Aktip (baku) - Aktif (tidak baku)"],
            correctIndex: 0,
            explanation: "Bentuk baku yang tepat adalah 'nasihat', bukan nasehat.",
          },
          {
            id: 2,
            question: "Kata dasar 'sapu' jika diberi awalan 'me-' berubah menjadi...",
            options: ["Menyapu", "Mesapu", "Mensapu"],
            correctIndex: 0,
            explanation: "Huruf s luluh menjadi ny- saat bertemu awalan me- (menyapu).",
          },
          {
            id: 3,
            question: "Kata hubung (konjungsi) yang menyatakan hubungan pertentangan adalah...",
            options: ["Tetapi / Namun", "Dan / Serta", "Karena / Sebab"],
            correctIndex: 0,
            explanation: "'Tetapi' dan 'namun' digunakan untuk mempertentangkan dua pernyataan.",
          },
          {
            id: 4,
            question: "Bentuk kata baku untuk alat pengukur panas suhu tubuh adalah...",
            options: ["Termometer", "Thermometer", "Termomiter"],
            correctIndex: 0,
            explanation: "Penulisan serapan baku bahasa Indonesia adalah 'termometer'.",
          },
          {
            id: 5,
            question: "Kalimat: 'Budi sangat giat sekali belajar.' Kalimat ini tidak efektif karena...",
            options: ["Pemborosan kata 'sangat' dan 'sekali' (keduanya bermakna amat)", "Kurang panjang", "Tidak memakai tanda tanya"],
            correctIndex: 0,
            explanation: "Gunakan salah satu: 'sangat giat' atau 'giat sekali'.",
          },
          {
            id: 6,
            question: "Kata dasar 'tulis' jika diberi awalan 'me-' dan akhiran '-kan' menjadi...",
            options: ["Menuliskan", "Mentuliskan", "Metuliskan"],
            correctIndex: 0,
            explanation: "Huruf t luluh menjadi n- (menuliskan).",
          },
          {
            id: 7,
            question: "Bentuk baku dari kata 'obyek' dan 'kwalitas' adalah...",
            options: ["Objek dan kualitas", "Obyek dan kwalitet", "Objec dan kualitet"],
            correctIndex: 0,
            explanation: "Huruf serapan y diganti j (objek) dan w diganti u (kualitas).",
          },
          {
            id: 8,
            question: "Konjungsi yang menyatakan hubungan sebab-akibat adalah...",
            options: ["Karena dan sehingga", "Atau dan kecuali", "Lalu dan kemudian"],
            correctIndex: 0,
            explanation: "'Karena' menyatakan sebab, sedangkan 'sehingga' menyatakan akibat.",
          },
          {
            id: 9,
            question: "Kata dasar 'kunci' jika diberi awalan 'me-' menjadi...",
            options: ["Mengunci", "Menkunci", "Mengkunci"],
            correctIndex: 0,
            explanation: "Huruf k luluh menjadi ng- saat bertemu awalan me- (mengunci).",
          },
          {
            id: 10,
            question: "Penulisan gabungan kata di bawah ini yang baku adalah...",
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
            options: ["Eksplanasi", "Fabel", "Puisi"],
            correctIndex: 0,
            explanation: "Teks eksplanasi berfokus menjawab pertanyaan 'mengapa' dan 'bagaimana' fenomena terjadi.",
          },
          {
            id: 2,
            question: "Bagian pertama teks eksplanasi yang mengenalkan nama fenomena yang akan dijelaskan adalah...",
            options: ["Pernyataan umum (identifikasi)", "Deretan penjelas", "Interpretasi"],
            correctIndex: 0,
            explanation: "Pernyataan umum mengenalkan gambaran awal fenomena yang dibahas.",
          },
          {
            id: 3,
            question: "Bagian teks eksplanasi yang menguraikan urutan proses sebab-akibat secara mendalam disebut...",
            options: ["Deretan penjelas (rangkaian peristiwa)", "Pernyataan umum", "Daftar isi"],
            correctIndex: 0,
            explanation: "Deretan penjelas membedah proses ilmiah tahap demi tahap.",
          },
          {
            id: 4,
            question: "Fenomena alam pelangi terjadi karena adanya proses...",
            options: ["Pembiasan cahaya matahari oleh titik-titik air hujan", "Cahaya bulan yang tertutup awan", "Ledakan gunung berapi"],
            correctIndex: 0,
            explanation: "Sinar matahari dibiaskan oleh tetesan air hujan sehingga mengurai warna spektrum.",
          },
          {
            id: 5,
            question: "Ciri utama bahasa yang digunakan dalam teks eksplanasi adalah...",
            options: ["Faktual (berdasarkan fakta ilmiah) dan objektif", "Bersifat khayalan dongeng", "Menggunakan bahasa lelucon"],
            correctIndex: 0,
            explanation: "Teks eksplanasi berpijak pada prinsip sains dan kenyataan faktual.",
          },
          {
            id: 6,
            question: "Kata hubung kronologis yang lazim digunakan dalam teks eksplanasi siklus air adalah...",
            options: ["Mula-mula, kemudian, setelah itu", "Tetapi, melainkan", "Meskipun, biarpun"],
            correctIndex: 0,
            explanation: "Kata kronologis merangkai urutan evaporasi, kondensasi, dan presipitasi.",
          },
          {
            id: 7,
            question: "Bagian penutup teks eksplanasi yang memuat simpulan atau ulasan penulis disebut...",
            options: ["Interpretasi (ulasan akhir)", "Pernyataan umum", "Latar belakang"],
            correctIndex: 0,
            explanation: "Interpretasi adalah bagian akhir yang menyimpulkan keseluruhan proses.",
          },
          {
            id: 8,
            question: "Contoh topik fenomena sosial yang dapat ditulis dalam teks eksplanasi adalah...",
            options: ["Proses terjadinya urbanisasi penduduk ke kota besar", "Gerhana matahari cincin", "Siklus daur air"],
            correctIndex: 0,
            explanation: "Urbanisasi adalah fenomena sosial masyarakat perkotaan.",
          },
          {
            id: 9,
            question: "Istilah ilmiah 'evaporasi' dalam teks eksplanasi siklus air bermakna...",
            options: ["Penguapan air akibat panas matahari", "Turunnya butiran air hujan", "Penyerapan air ke tanah"],
            correctIndex: 0,
            explanation: "Evaporasi adalah proses perubahan air cair menjadi uap air.",
          },
          {
            id: 10,
            question: "Tujuan utama seseorang membaca teks eksplanasi adalah...",
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
            options: ["Menarik minat masyarakat untuk membeli barang atau menggunakan jasa", "Menceritakan dongeng masa lalu", "Membuat pembaca merasa bingung"],
            correctIndex: 0,
            explanation: "Iklan bertujuan mempromosikan produk/jasa agar dikenal dan diminati konsumen.",
          },
          {
            id: 2,
            question: "Kalimat yang bersifat mengajak, membujuk, atau meyakinkan pembaca disebut kalimat...",
            options: ["Persuasif", "Naratif", "Deskriptif"],
            correctIndex: 0,
            explanation: "Sifat persuasif menjadi nyawa utama dalam bahasa teks periklanan.",
          },
          {
            id: 3,
            question: "Kalimat pendek yang mencolok, menarik, dan mudah diingat untuk memberitahukan tujuan iklan disebut...",
            options: ["Slogan", "Paragraf", "Daftar isi"],
            correctIndex: 0,
            explanation: "Slogan adalah moto atau semboyan singkat yang melekat kuat di ingatan publik.",
          },
          {
            id: 4,
            question: "Contoh iklan media elektronik adalah iklan yang ditayangkan melalui...",
            options: ["Televisi, radio, dan internet", "Koran dan majalah cetak", "Brosur selebaran kertas"],
            correctIndex: 0,
            explanation: "Media elektronik mencakup tayangan audio-visual radio, TV, dan media digital.",
          },
          {
            id: 5,
            question: "Kata yang menjadi inti atau fokus utama dari suatu pesan iklan disebut...",
            options: ["Kata kunci (keyword)", "Kata sulit", "Kata sambung"],
            correctIndex: 0,
            explanation: "Kata kunci menonjolkan keunggulan produk (misal: 'alami', 'hemat energi', 'higienis').",
          },
          {
            id: 6,
            question: "Iklan yang dibuat oleh pemerintah untuk mengajak masyarakat hidup sehat (tanpa menjual barang dagangan) disebut...",
            options: ["Iklan Layanan Masyarakat (ILM)", "Iklan niaga", "Iklan baris"],
            correctIndex: 0,
            explanation: "ILM mengajak kepedulian sosial, seperti kampanye hemat listrik atau cegah DBD.",
          },
          {
            id: 7,
            question: "Kelebihan utama iklan di media televisi dibandingkan media cetak koran adalah...",
            options: ["Menampilkan kombinasi gambar bergerak, suara, dan warna yang hidup", "Harganya gratis selamanya", "Teksnya bisa disentuh tangan"],
            correctIndex: 0,
            explanation: "Unsur audio, video, dan visual gerak membuat pesan iklan TV lebih memikat.",
          },
          {
            id: 8,
            question: "Slogan iklan: 'Hemat Energi, Sayangi Bumi!' memiliki makna ajakan untuk...",
            options: ["Menggunakan energi listrik secara bijak demi kelestarian bumi", "Membuang sampah ke sungai", "Menghabiskan listrik"],
            correctIndex: 0,
            explanation: "Slogan ini mengajak pembaca mematikan listrik yang tidak terpakai.",
          },
          {
            id: 9,
            question: "Unsur penting yang harus ada pada iklan media cetak agar pembaca mudah menghubungi pemasang iklan adalah...",
            options: ["Kontak telepon, alamat, atau media sosial", "Nama pembuat kertas", "Daftar rumus fisika"],
            correctIndex: 0,
            explanation: "Kontak jelas memudahkan calon pembeli melakukan pemesanan produk.",
          },
          {
            id: 10,
            question: "Bahasa iklan harus komunikatif, artinya...",
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
            options: ["Narasi sejarah", "Fabel", "Fiksi ilmiah"],
            correctIndex: 0,
            explanation: "Narasi sejarah mendokumentasikan fakta perjalanan bangsa secara kronologis.",
          },
          {
            id: 2,
            question: "Singkatan 'Adiksimba' yang digunakan untuk membedah teks sejarah terdiri dari...",
            options: ["Apa, Di mana, Kapan, Siapa, Mengapa, Bagaimana", "Aku, Dia, Kamu, Siapa, Mengapa, Berapa", "Awal, Akhir, Latar, Tokoh, Alur, Tema"],
            correctIndex: 0,
            explanation: "Adiksimba adalah padanan kata tanya bahasa Indonesia untuk 5W1H.",
          },
          {
            id: 3,
            question: "Naskah teks Proklamasi Kemerdekaan Indonesia diketik rapi oleh tokoh pemuda bernama...",
            options: ["Sayuti Melik", "Sukarni", "Chaeroel Saleh"],
            correctIndex: 0,
            explanation: "Sayuti Melik berjasa mengetik naskah proklamasi setelah dirumuskan Soekarno-Hatta.",
          },
          {
            id: 4,
            question: "Untuk menanyakan latar waktu terjadinya peristiwa Rengasdengklok, kata tanya yang tepat adalah...",
            options: ["Kapan", "Di mana", "Siapa"],
            correctIndex: 0,
            explanation: "'Kapan' menanyakan hari dan tanggal terjadinya peristiwa sejarah.",
          },
          {
            id: 5,
            question: "Peristiwa sejarah disusun secara 'kronologis', yang bermakna disusun berdasarkan...",
            options: ["Urutan waktu kejadian dari awal hingga akhir", "Abjad nama pahlawan", "Tingkat ketenaran tokoh"],
            correctIndex: 0,
            explanation: "Kronologis berarti urut sesuai linimasa perjalanan waktu.",
          },
          {
            id: 6,
            question: "Tokoh yang menjahit Bendera Pusaka Sang Saka Merah Putih pertama kali adalah...",
            options: ["Ibu Fatmawati", "R.A. Kartini", "Cut Nyak Dien"],
            correctIndex: 0,
            explanation: "Ibu Fatmawati menjahit bendera Merah Putih yang dikibarkan saat proklamasi 17 Agustus 1945.",
          },
          {
            id: 7,
            question: "Kata tanya 'Mengapa' dalam teks peristiwa Bandung Lautan Api digunakan untuk menggali...",
            options: ["Alasan para pejuang membumihanguskan kota Bandung", "Jumlah bambu runcing", "Warna seragam tentara"],
            correctIndex: 0,
            explanation: "Mengapa menggali latar belakang strategi para pejuang agar Bandung tidak dikuasai sekutu.",
          },
          {
            id: 8,
            question: "Nilai luhur yang dapat kita teladani dari para pejuang kemerdekaan adalah...",
            options: ["Rela berkorban, cinta tanah air, dan pantang menyerah", "Mementingkan diri sendiri", "Cepat putus asa"],
            correctIndex: 0,
            explanation: "Semangat rela berkorban demi bangsa adalah warisan teladan abadi para pahlawan.",
          },
          {
            id: 9,
            question: "Tempat perumusan naskah Proklamasi Kemerdekaan Indonesia dilakukan di rumah...",
            options: ["Laksamana Tadashi Maeda", "Jenderal Sudirman", "Pangeran Diponegoro"],
            correctIndex: 0,
            explanation: "Naskah proklamasi dirumuskan di kediaman Laksamana Maeda di Jakarta.",
          },
          {
            id: 10,
            question: "Sumpah Pemuda yang mengikrarkan satu tanah air, bangsa, dan bahasa diikrarkan pada tanggal...",
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
            options: ["Ringkasan (rangkuman)", "Puisi", "Kamus"],
            correctIndex: 0,
            explanation: "Ringkasan memadatkan bacaan panjang menjadi intisari pokok yang efisien.",
          },
          {
            id: 2,
            question: "Langkah pertama yang mutlak dilakukan sebelum membuat ringkasan adalah...",
            options: ["Membaca naskah asli secara cermat hingga memahami isinya", "Menghitung jumlah halaman", "Mengganti nama pengarang"],
            correctIndex: 0,
            explanation: "Kita harus memahami pesan dan alur penulis asli sebelum dapat merangkumnya.",
          },
          {
            id: 3,
            question: "Hal yang TIDAK boleh diubah saat membuat ringkasan sebuah buku adalah...",
            options: ["Urutan gagasan pokok dan sudut pandang pengarang asli", "Warna kertas", "Ukuran tulisan"],
            correctIndex: 0,
            explanation: "Ringkasan harus setia mempertahankan gagasan dan pesan pengarang aslinya.",
          },
          {
            id: 4,
            question: "Dalam membuat ringkasan, kalimat-kalimat panjang diubah menjadi...",
            options: ["Kalimat efektif yang padat dan lugas", "Tanda tanya semua", "Kalimat yang berima"],
            correctIndex: 0,
            explanation: "Menggunakan kalimat efektif memangkas kata-kata yang mubazir.",
          },
          {
            id: 5,
            question: "Perbedaan utama antara ringkasan dan ikhtisar adalah...",
            options: ["Ringkasan mempertahankan urutan asli naskah, sedangkan ikhtisar boleh langsung ke inti persoalan", "Ringkasan selalu lebih tebal dari buku aslinya", "Ikhtisar adalah dongeng"],
            correctIndex: 0,
            explanation: "Ikhtisar memberi kebebasan menuliskan intisari tanpa harus terpaku urutan bab.",
          },
          {
            id: 6,
            question: "Kalimat-kalimat penjelas yang berisi contoh-contoh kecil dan ilustrasi saat membuat ringkasan sebaiknya...",
            options: ["Dihilangkan atau dipadatkan intinya saja", "Disalin seluruhnya kata demi kata", "Ditambah ceritanya"],
            correctIndex: 0,
            explanation: "Rincian contoh kecil dipangkas agar naskah ringkasan tetap padat dan ringkas.",
          },
          {
            id: 7,
            question: "Manfaat membuat ringkasan materi pelajaran saat belajar ujian adalah...",
            options: ["Memudahkan mengingat poin-poin penting materi secara cepat", "Membuat buku menjadi rusak", "Agar catatan lebih tebal"],
            correctIndex: 0,
            explanation: "Catatan ringkas memudahkan proses mengulang dan menghafal materi penting.",
          },
          {
            id: 8,
            question: "Perbandingan panjang naskah ringkasan yang ideal umumnya berkisar antara...",
            options: ["Seperlima hingga sepertiga dari panjang teks aslinya", "Sama panjang dengan teks asli", "Lebih panjang dua kali lipat"],
            correctIndex: 0,
            explanation: "Ringkasan biasanya memadatkan teks menjadi sekitar 20-30% panjang aslinya.",
          },
          {
            id: 9,
            question: "Apakah opini atau pendapat pribadi perangkum boleh dimasukkan ke dalam teks ringkasan?",
            options: ["Tidak boleh, harus objektif sesuai teks pengarang", "Boleh bebas sebanyak-banyaknya", "Wajib ada opini pribadi"],
            correctIndex: 0,
            explanation: "Ringkasan murni mencerminkan pikiran penulis asli, bukan komentar pembaca.",
          },
          {
            id: 10,
            question: "Kunci utama menyusun kerangka ringkasan yang baik adalah mengumpulkan...",
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
            options: ["4 baris", "2 baris", "6 baris"],
            correctIndex: 0,
            explanation: "Pantun baku terdiri dari 4 baris dalam setiap baitnya.",
          },
          {
            id: 2,
            question: "Pola sajak atau rima akhir pada pantun yang baku adalah...",
            options: ["a - b - a - b", "a - a - b - b", "a - b - c - d"],
            correctIndex: 0,
            explanation: "Baris pertama bersajak sama dengan baris ketiga, baris kedua sama dengan baris keempat (a-b-a-b).",
          },
          {
            id: 3,
            question: "Baris ke-1 dan ke-2 dalam sebuah bait pantun disebut...",
            options: ["Sampiran", "Isi", "Amanat"],
            correctIndex: 0,
            explanation: "Dua baris pertama merupakan sampiran pengantar rima bunyi.",
          },
          {
            id: 4,
            question: "Bagian pantun yang memuat maksud, pesan, atau nasihat sebenarnya terletak pada baris...",
            options: ["Baris ke-3 dan ke-4 (Isi)", "Baris ke-1 dan ke-2", "Hanya baris ke-1"],
            correctIndex: 0,
            explanation: "Isi dan pesan moral pantun berada di baris 3 dan 4.",
          },
          {
            id: 5,
            question: "Jumlah suku kata yang ideal dalam setiap baris pantun adalah...",
            options: ["8 hingga 12 suku kata", "2 hingga 4 suku kata", "20 suku kata"],
            correctIndex: 0,
            explanation: "Kaidah pantun membatasi panjang larik antara 8 sampai 12 suku kata.",
          },
          {
            id: 6,
            question: "Lengkapi sampiran pantun ini: 'Bunga mawar bunga melati / Harum baunya di waktu pagi' rima akhirnya berbunyi...",
            options: ["-ti dan -gi", "-ar dan -ur", "-an dan -in"],
            correctIndex: 0,
            explanation: "Akhiran baris pertama adalah -ti dan baris kedua adalah -gi.",
          },
          {
            id: 7,
            question: "Pantun yang berisi pesan moral, budi pekerti, dan anjuran kebaikan disebut pantun...",
            options: ["Nasihat", "Jenaka (lucu)", "Teka-teki"],
            correctIndex: 0,
            explanation: "Pantun nasihat bertujuan mendidik budi pekerti pendengarnya.",
          },
          {
            id: 8,
            question: "Pantun yang bertujuan menghibur dengan kelucuan dan tawa disebut pantun...",
            options: ["Jenaka", "Kiasan", "Duka cita"],
            correctIndex: 0,
            explanation: "Pantun jenaka memuat humor yang mengundang senyum dan tawa.",
          },
          {
            id: 9,
            question: "Tradisi saling membalas pantun secara berpasangan dalam kebudayaan Melayu/Betawi disebut...",
            options: ["Berbalas pantun (palang pintu)", "Pidato bersama", "Musyawarah desa"],
            correctIndex: 0,
            explanation: "Berbalas pantun mengasah kecerdasan spontan merangkai rima yang jenaka dan bermakna.",
          },
          {
            id: 10,
            question: "Dalam pantun nasihat belajar: 'Tuntutlah ilmu selagi muda / Agar bahagia di hari tua', pesan moralnya adalah...",
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
