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

interface IndoGrade6GameProps {
  levelId: number;
  onLevelComplete: (levelId: number, starsEarned: number) => void;
  accessibilityMode?: string;
}

export function IndoGrade6Game({ levelId, onLevelComplete, accessibilityMode }: IndoGrade6GameProps) {
  const [phase, setPhase] = useState<"materi" | "game">("materi");

  // Phase 1 interactive state
  const [activePidatoPart, setActivePidatoPart] = useState<string>("Pembuka");
  const [activeFormType, setActiveFormType] = useState<string>("Formulir Pendaftaran");

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
    setActivePidatoPart("Pembuka");
    setActiveFormType("Formulir Pendaftaran");

    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setWrongAttempts(0);
    setShowClue(false);
    setIsCompleted(false);
    isProcessingRef.current = false;

    const data = getGrade6LevelData(levelId);
    setQuestionsList(shuffleQuestions(data));
    speakGlobal(data.conceptText);
  }, [levelId]);

  const levelData = getGrade6LevelData(levelId);
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
          speakGlobal(`Luar biasa! Kamu telah menyelesaikan 10 soal Bahasa Indonesia Kelas 6 dan meraih ${stars} bintang!`);
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
            KELAS 6 SD • LEVEL {levelId} dari 6
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
                  Format Laporan Hasil Pengamatan (Observasi):
                </span>
                <div className="p-3 bg-white border-2 border-[#3C632A] rounded-xl w-full text-xs text-left space-y-1 text-slate-800 shadow-sm">
                  <p>• <strong>Objek Pengamatan:</strong> Hal yang diamati (misal: Kebun Hidroponik Sekolah).</p>
                  <p>• <strong>Waktu & Tempat:</strong> Hari Senin, 12 Oktober 2026 di Green House.</p>
                  <p>• <strong>Hasil Pengamatan:</strong> Fakta lapangan yang dicatat secara objektif.</p>
                  <p>• <strong>Kesimpulan:</strong> Intisari fakta hasil observasi.</p>
                </div>
              </div>
            )}

            {levelId === 2 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Struktur Teks Pidato Persuasif:
                </span>
                <div className="grid grid-cols-3 gap-2 w-full">
                  {[
                    { bagian: "Pembuka", isi: "Salam pembuka, puji syukur, dan penghormatan hadirin." },
                    { bagian: "Isi Pidato", isi: "Argumen inti, pesan ajakan persuasif, dan solusi masalah." },
                    { bagian: "Penutup", isi: "Permohonan maaf, simpulan harapan, dan salam penutup." },
                  ].map((p) => (
                    <button
                      key={p.bagian}
                      type="button"
                      onClick={() => {
                        setActivePidatoPart(p.bagian);
                        playPopSound();
                        speakGlobal(`Bagian ${p.bagian} pidato berisi ${p.isi}`);
                      }}
                      className={`p-3 rounded-xl border-2 border-[#3C632A] text-left transition-all cursor-pointer ${
                        activePidatoPart === p.bagian ? "bg-[#7FD13B] text-white scale-102 shadow-md" : "bg-white text-[#3C632A] hover:bg-[#FFE296]"
                      }`}
                    >
                      <span className="text-xs font-black block">{p.bagian}</span>
                      <span className="text-[10px] block opacity-90 mt-1">{p.isi}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {levelId === 3 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Dokumen Resmi: Petunjuk Mengisi Formulir & LJK:
                </span>
                <div className="p-3 bg-white border-2 border-[#3C632A] rounded-xl w-full text-xs text-left space-y-1.5 text-slate-800 shadow-sm">
                  <p>• <strong>Huruf Kapital:</strong> Isilah formulir dengan huruf cetak atau kapital yang jelas.</p>
                  <p>• <strong>Lembar Jawaban Komputer (LJK):</strong> Gunakan pensil 2B dan hitamkan bulatan secara penuh.</p>
                  <p>• <strong>Kode Pos:</strong> 5 digit angka lokasi pengiriman pos.</p>
                </div>
              </div>
            )}

            {levelId === 4 && (
              <div className="w-full flex flex-col items-center space-y-3 text-center">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Piramida Terbalik Struktur Teks Berita:
                </span>
                <div className="w-full space-y-1.5 text-xs font-bold text-slate-800">
                  <div className="p-2.5 bg-[#FFE296] border border-[#3C632A] rounded-xl shadow-sm">
                    1. Kepala Berita (Lead): Memuat inti 5W1H paling penting
                  </div>
                  <div className="p-2 bg-white border border-[#3C632A] rounded-lg w-[85%] mx-auto shadow-sm">
                    2. Tubuh Berita: Kronologi dan penjelasan pendukung
                  </div>
                  <div className="p-1.5 bg-white border border-[#3C632A] rounded-lg w-[70%] mx-auto text-[10px] shadow-sm">
                    3. Ekor Berita: Informasi tambahan pelengkap
                  </div>
                </div>
              </div>
            )}

            {levelId === 5 && (
              <div className="w-full flex flex-col items-center space-y-3">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Membedakan Fiksi vs Nonfiksi & Resensi Buku:
                </span>
                <div className="grid grid-cols-2 gap-2 w-full text-xs">
                  <div className="p-3 bg-white border-2 border-[#3C632A] rounded-xl shadow-sm">
                    <strong className="text-[#3C632A] block mb-1">Teks Fiksi:</strong>
                    Cerita rekaan imajinatif (cerpen, novel, dongeng).
                  </div>
                  <div className="p-3 bg-white border-2 border-[#3C632A] rounded-xl shadow-sm">
                    <strong className="text-[#C3631D] block mb-1">Teks Nonfiksi:</strong>
                    Tulisan berbasis data dan fakta nyata (biografi, ensiklopedia).
                  </div>
                </div>
              </div>
            )}

            {levelId === 6 && (
              <div className="w-full flex flex-col items-center space-y-3 text-center">
                <span className="text-xs font-black uppercase text-[#C3631D] tracking-wider">
                  Karangan Narasi vs Karangan Deskripsi:
                </span>
                <div className="grid grid-cols-2 gap-2 w-full text-xs text-left">
                  <div className="p-3 bg-white rounded-xl border-2 border-[#3C632A] shadow-sm">
                    <strong className="text-[#3C632A] block mb-1">Narasi:</strong>
                    Menceritakan peristiwa urut dari waktu ke waktu (ada tokoh dan alur).
                  </div>
                  <div className="p-3 bg-white rounded-xl border-2 border-[#3C632A] shadow-sm">
                    <strong className="text-[#C3631D] block mb-1">Deskripsi:</strong>
                    Menggambarkan ciri fisik objek secara hidup sehingga pembaca seolah melihat langsung.
                  </div>
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

function getGrade6LevelData(levelId: number): LevelConceptData {
  switch (levelId) {
    case 1:
      return {
        title: "Teks Laporan Hasil Pengamatan (Investigasi)",
        conceptText: "Laporan hasil pengamatan disusun berdasarkan data nyata pengamatan lapangan. Teks harus objektif, jelas, dan memuat waktu, lokasi, objek, hasil observasi, serta kesimpulan.",
        questions: [
          {
            id: 1,
            question: "Ciri utama dari teks laporan hasil pengamatan (investigasi) adalah...",
            options: ["Bersifat objektif dan berdasarkan fakta nyata di lapangan", "Berisi imajinasi khayalan penulis", "Disusun tanpa bukti dan data"],
            correctIndex: 0,
            explanation: "Laporan observasi harus setia pada fakta yang benar-benar disaksikan di lapangan.",
          },
          {
            id: 2,
            question: "Bagian pendahuluan dalam laporan pengamatan umumnya memuat...",
            options: ["Waktu, tempat, dan objek pengamatan", "Daftar menu makanan", "Harga karcis masuk"],
            correctIndex: 0,
            explanation: "Pendahuluan memberikan identitas kapan, di mana, dan apa objek yang diamati.",
          },
          {
            id: 3,
            question: "Laporan pengamatan harus ditulis secara objektif, yang berarti...",
            options: ["Sesuai kenyataan yang ada tanpa dipengaruhi pendapat pribadi", "Dilebih-lebihkan agar heboh", "Hanya mencatat hal yang disukai saja"],
            correctIndex: 0,
            explanation: "Objektif berarti apa adanya berdasarkan data terukur di lapangan.",
          },
          {
            id: 4,
            question: "Bagian akhir dari laporan pengamatan yang memuat intisari temuan adalah...",
            options: ["Kesimpulan", "Lampiran foto saja", "Daftar pertanyaan"],
            correctIndex: 0,
            explanation: "Kesimpulan menyarikan hasil pengamatan secara menyeluruh.",
          },
          {
            id: 5,
            question: "Contoh objek pengamatan yang tepat untuk pelajaran lingkungan sekolah adalah...",
            options: ["Pengelolaan sampah daur ulang di kantin sekolah", "Jadwal penerbangan pesawat", "Harga mobil mewah luar negeri"],
            correctIndex: 0,
            explanation: "Pengelolaan sampah kantin adalah topik nyata yang dapat diobservasi langsung oleh siswa.",
          },
          {
            id: 6,
            question: "Alat bantu yang berguna untuk mendokumentasikan data saat observasi adalah...",
            options: ["Kamera foto dan buku catatan observasi", "Mainan robot", "Buku komik"],
            correctIndex: 0,
            explanation: "Kamera dan lembar catatan merekam bukti autentik hasil pengamatan.",
          },
          {
            id: 7,
            question: "Data hasil pengamatan berupa angka-angka pengukuran sering disajikan dalam bentuk...",
            options: ["Tabel atau grafik data", "Bait puisi", "Dialog komik"],
            correctIndex: 0,
            explanation: "Tabel dan grafik mempermudah pembaca menganalisis data terukur.",
          },
          {
            id: 8,
            question: "Manakah kalimat laporan pengamatan yang bernada objektif?",
            options: ["Tanaman jagung di petak A tumbuh setinggi 45 cm pada minggu ketiga.", "Tanaman jagung itu kelihatannya sangat menyedihkan.", "Mungkin jagung itu tidak mau tumbuh."],
            correctIndex: 0,
            explanation: "Kalimat pertama menyajikan data kuantitatif yang terukur dan objektif.",
          },
          {
            id: 9,
            question: "Setelah melakukan pengamatan, data yang terkumpul harus...",
            options: ["Dianalisis lalu disusun menjadi laporan tertulis yang runtut", "Langsung dibuang ke tempat sampah", "Disimpan di saku tanpa ditulis"],
            correctIndex: 0,
            explanation: "Data observasi diolah dan dilaporkan agar bermanfaat bagi pembaca.",
          },
          {
            id: 10,
            question: "Bahasa dalam teks laporan hasil pengamatan wajib menggunakan...",
            options: ["Kosakata baku dan kalimat efektif", "Bahasa gaul daerah", "Singkatan pesan singkat"],
            correctIndex: 0,
            explanation: "Sebagai teks ilmiah faktual, laporan harus menggunakan kaidah bahasa baku.",
          },
        ],
      };

    case 2:
      return {
        title: "Struktur & Naskah Pidato Persuasif",
        conceptText: "Pidato persuasif bertujuan meyakinkan dan mengajak pendengar melakukan tindakan positif. Strukturnya: Salam Pembuka & Pendahuluan, Isi Pidato (argumen & ajakan), serta Penutup.",
        questions: [
          {
            id: 1,
            question: "Tujuan utama dari pidato persuasif adalah...",
            options: ["Mempengaruhi, meyakinkan, dan mengajak hadirin melakukan sesuatu yang baik", "Membuat hadirin tertidur", "Menghukum pendengar"],
            correctIndex: 0,
            explanation: "Pidato persuasif berfokus menggerakkan hati dan tindakan positif pendengar.",
          },
          {
            id: 2,
            question: "Urutan struktur teks pidato yang tepat adalah...",
            options: ["Pembuka, Isi, dan Penutup", "Isi, Pembuka, dan Kesimpulan", "Penutup, Pembuka, dan Saran"],
            correctIndex: 0,
            explanation: "Struktur standar pidato diawali pembuka, dilanjutkan isi, lalu diakhiri penutup.",
          },
          {
            id: 3,
            question: "Bagian pembuka pidato biasanya berisi...",
            options: ["Salam pembuka, ucapan syukur kepada Tuhan, dan penghormatan hadirin", "Rincian anggaran dana", "Tanda tangan ketua panitia"],
            correctIndex: 0,
            explanation: "Pembuka memberi sapaan hormat dan memanjatkan rasa syukur.",
          },
          {
            id: 4,
            question: "Contoh kalimat ajakan persuasif dalam pidato kebersihan lingkungan adalah...",
            options: ["Marilah kita bersama-sama menjaga kebersihan kelas kita tercinta!", "Saya tidak peduli dengan kelas ini.", "Biar petugas saja yang menyapu."],
            correctIndex: 0,
            explanation: "Kalimat diawali kata ajakan 'marilah' dan bernada semangat gotong royong.",
          },
          {
            id: 5,
            question: "Metode berpidato dengan cara membaca teks naskah lengkap dari awal hingga akhir disebut metode...",
            options: ["Naskah (manuskrip)", "Impromptu (spontan)", "Ekstemporan"],
            correctIndex: 0,
            explanation: "Metode naskah membaca teks tertulis resmi yang telah dipersiapkan.",
          },
          {
            id: 6,
            question: "Metode berpidato dengan membawa catatan garis-garis besar (poin penting) materi disebut...",
            options: ["Ekstemporan", "Memoriter (hafalan)", "Impromptu"],
            correctIndex: 0,
            explanation: "Ekstemporan menggunakan kerangka poin penting sehingga pembicara leluasa berekspresi.",
          },
          {
            id: 7,
            question: "Hal yang perlu diperhatikan seorang orator saat tampil berpidato di podium adalah...",
            options: ["Kontak mata dengan hadirin, artikulasi jelas, dan intonasi tegas", "Membelakangi penonton", "Membaca dengan berbisik-bisik"],
            correctIndex: 0,
            explanation: "Sikap percaya diri dan intonasi yang pas membuat pidato didengarkan dengan khidmat.",
          },
          {
            id: 8,
            question: "Bagian penutup pidato biasanya memuat...",
            options: ["Permohonan maaf atas tutur kata, harapan, dan salam penutup", "Penjelasan rumus baru", "Daftar absen murid"],
            correctIndex: 0,
            explanation: "Penutup menyampaikan permohonan maaf, harapan pesan diterapkan, dan salam.",
          },
          {
            id: 9,
            question: "Istilah bagi orang yang ahli dan berwibawa dalam menyampaikan pidato adalah...",
            options: ["Orator", "Narator", "Moderator"],
            correctIndex: 0,
            explanation: "Orator adalah sebutan bagi tokoh yang mahir berorasi di depan publik.",
          },
          {
            id: 10,
            question: "Sebelum tampil berpidato, latihan yang paling bermanfaat adalah...",
            options: ["Berlatih intonasi dan mimik wajah di depan cermin", "Makan makanan berminyak", "Tidur larut malam"],
            correctIndex: 0,
            explanation: "Berlatih di depan cermin membangun rasa percaya diri dan ritme bicara yang prima.",
          },
        ],
      };

    case 3:
      return {
        title: "Pengisian Formulir & Dokumen Resmi",
        conceptText: "Formulir adalah lembaran isian data pribadi. Pengisian formulir pendaftaran, wesel pos, kartu anggota, slip bank, dan LJK menuntut ketelitian, huruf cetak/kapital, dan kejujuran.",
        questions: [
          {
            id: 1,
            question: "Lembaran yang berisi kolom-kolom isian data diri untuk keperluan tertentu dinamakan...",
            options: ["Formulir", "Majalah", "Resep"],
            correctIndex: 0,
            explanation: "Formulir digunakan untuk mendata identitas seseorang secara resmi.",
          },
          {
            id: 2,
            question: "Huruf yang paling dianjurkan digunakan saat mengisi formulir pendaftaran adalah...",
            options: ["Huruf kapital (huruf cetak)", "Huruf tegak bersambung miring", "Huruf coret"],
            correctIndex: 0,
            explanation: "Huruf cetak/kapital mudah dibaca oleh petugas dan mencegah kesalahan ketik nama.",
          },
          {
            id: 3,
            question: "Data utama yang paling sering dicantumkan pada bagian identitas formulir adalah...",
            options: ["Nama lengkap, tempat tanggal lahir, dan alamat", "Warna baju kesukaan", "Menu sarapan pagi"],
            correctIndex: 0,
            explanation: "Nama, tanggal lahir, dan domisili adalah identitas primer pemohon.",
          },
          {
            id: 4,
            question: "Jenis pensil yang wajib digunakan saat mengisi Lembar Jawaban Komputer (LJK) adalah...",
            options: ["Pensil 2B asli", "Pensil warna merah", "Spidol permanen"],
            correctIndex: 0,
            explanation: "Mesin pemindai (scanner) LJK dikalibrasi membaca kepekatan karbon pensil 2B.",
          },
          {
            id: 5,
            question: "Dokumen yang digunakan untuk mengirimkan uang melalui kantor pos adalah...",
            options: ["Wesel pos", "Kartu pos", "Perangko"],
            correctIndex: 0,
            explanation: "Wesel pos adalah layanan resmi pos untuk pengiriman dana tunai.",
          },
          {
            id: 6,
            question: "Kode pos di Indonesia terdiri dari berapa digit angka?",
            options: ["5 digit angka", "3 digit angka", "10 digit angka"],
            correctIndex: 0,
            explanation: "Kode pos Indonesia berstandar 5 digit angka wilayah.",
          },
          {
            id: 7,
            question: "Formulir yang diisi saat hendak menabung uang di bank disebut...",
            options: ["Slip setoran bank", "Kuitansi sewa", "Faktur belanja"],
            correctIndex: 0,
            explanation: "Slip setoran diisi nasabah untuk mencatat nominal uang yang disetorkan ke rekening.",
          },
          {
            id: 8,
            question: "Akibat fatal jika keliru menuliskan nomor rekening pada slip bank adalah...",
            options: ["Uang bisa salah terkirim ke rekening orang lain", "Uang bertambah ganda", "Bank otomatis tutup"],
            correctIndex: 0,
            explanation: "Ketelitian mengisi nomor rekening sangat penting agar dana sampai ke tujuan yang sah.",
          },
          {
            id: 9,
            question: "Bagian akhir formulir biasanya memerlukan pembuktian sah berupa...",
            options: ["Tanda tangan dan nama terang pemohon", "Cap jempol kaki", "Gambar pemandangan"],
            correctIndex: 0,
            explanation: "Tanda tangan adalah bukti persetujuan dan tanggung jawab kebenaran data.",
          },
          {
            id: 10,
            question: "Sikap yang wajib dimiliki setiap orang saat mengisi formulir data diri adalah...",
            options: ["Jujur, teliti, dan rapi", "Bohong dan asal-asalan", "Mencontek nama teman"],
            correctIndex: 0,
            explanation: "Mengisi data palsu pada dokumen resmi melanggar hukum dan etika.",
          },
        ],
      };

    case 4:
      return {
        title: "Teks Eksplanasi Ilmiah & Teks Berita",
        conceptText: "Teks berita menyajikan informasi faktual terhangat dengan struktur piramida terbalik: Kepala Berita (5W1H), Tubuh Berita, dan Ekor Berita. Berita harus aktual, berimbang, dan akurat.",
        questions: [
          {
            id: 1,
            question: "Struktur penyusunan teks berita yang menempatkan informasi paling penting di awal disebut struktur...",
            options: ["Piramida terbalik", "Lingkaran konsentris", "Segitiga sama sisi"],
            correctIndex: 0,
            explanation: "Piramida terbalik mendahulukan poin paling krusial di kepala berita.",
          },
          {
            id: 2,
            question: "Bagian kepala berita (lead berita) memuat unsur utama yaitu...",
            options: ["Unsur 5W1H (Adiksimba)", "Hanya nama wartawan", "Daftar sponsor"],
            correctIndex: 0,
            explanation: "Kepala berita merangkum apa, siapa, di mana, kapan, mengapa, dan bagaimana peristiwa berlangsung.",
          },
          {
            id: 3,
            question: "Sifat teks berita yang menyajikan peristiwa yang baru saja terjadi disebut...",
            options: ["Aktual (hangat)", "Fiksi", "Kedaluwarsa"],
            correctIndex: 0,
            explanation: "Aktual berarti berita menyangkut kejadian terkini dan terbaru.",
          },
          {
            id: 4,
            question: "Berita harus faktual, artinya isi berita...",
            options: ["Berdasarkan kenyataan peristiwa yang benar-benar terjadi", "Berdasarkan gosip khayalan", "Berdasarkan mimpi semalam"],
            correctIndex: 0,
            explanation: "Faktual berakar dari kata fakta, bukan rekaan imajinasi.",
          },
          {
            id: 5,
            question: "Bagian teks berita yang memuat rincian kronologi pendukung peristiwa disebut...",
            options: ["Tubuh berita (body)", "Ekor berita", "Judul berita"],
            correctIndex: 0,
            explanation: "Tubuh berita memperdalam kronologis dan data penjelas kejadian.",
          },
          {
            id: 6,
            question: "Bagian ekor berita biasanya memuat informasi berupa...",
            options: ["Informasi pelengkap tambahan yang kurang penting", "Intisari paling utama", "Jawaban 5W1H"],
            correctIndex: 0,
            explanation: "Ekor berita berisi informasi pelengkap yang bisa dipotong jika halaman koran sempit.",
          },
          {
            id: 7,
            question: "Teks berita yang tidak memihak salah satu kubu dinamakan teks berita yang...",
            options: ["Netral dan berimbang (cover both sides)", "Memihak", "Subjektif"],
            correctIndex: 0,
            explanation: "Jurnalisme yang baik menyajikan sudut pandang secara adil dan berimbang.",
          },
          {
            id: 8,
            question: "Judul berita (headline) harus dibuat dengan sifat...",
            options: ["Menarik minat pembaca dan mencerminkan inti isi berita", "Sangat panjang berparagraf", "Menyesatkan pembaca"],
            correctIndex: 0,
            explanation: "Judul berita harus ringkas, memikat, dan menggambarkan topik utama secara jujur.",
          },
          {
            id: 9,
            question: "Dalam teks eksplanasi ilmiah tentang pembangkit listrik tenaga air (PLTA), komponen turbin berfungsi untuk...",
            options: ["Mengubah energi gerak air menjadi energi putar pada generator", "Menyerap panas matahari", "Menyaring sampah"],
            correctIndex: 0,
            explanation: "Aliran air memutar turbin yang terhubung ke generator penghasil listrik.",
          },
          {
            id: 10,
            question: "Bagaimana cara kita membedakan berita fakta asli dengan berita bohong (hoaks)?",
            options: ["Memeriksa kejelasan sumber berita dari media terpercaya dan kredibel", "Langsung percaya dan menyebarkannya", "Melihat jumlah tanda seru"],
            correctIndex: 0,
            explanation: "Mengecek keabsahan narasumber dan media resmi adalah benteng menangkal hoaks.",
          },
        ],
      };

    case 5:
      return {
        title: "Cerita Fiksi vs Nonfiksi & Resensi",
        conceptText: "Membedakan teks fiksi (cerpen, novel, dongeng) dengan teks nonfiksi (biografi, buku sejarah, artikel sains). Menulis resensi/ulasan buku memuat identitas, sinopsis, kelebihan, dan kelemahan buku.",
        questions: [
          {
            id: 1,
            question: "Perbedaan mendasar antara buku fiksi dan buku nonfiksi adalah...",
            options: ["Fiksi berdasarkan khayalan imajinasi, sedangkan nonfiksi berdasarkan fakta kenyataan", "Fiksi selalu tebal, nonfiksi selalu tipis", "Nonfiksi selalu bergambar animasi"],
            correctIndex: 0,
            explanation: "Fiksi bersumber dari imajinasi kreatif, sedangkan nonfiksi bertumpu pada fakta dan ilmu.",
          },
          {
            id: 2,
            question: "Contoh karya tulisan yang termasuk ke dalam kategori buku nonfiksi adalah...",
            options: ["Buku biografi tokoh pahlawan nasional", "Cerpen petualangan kurcaci", "Kumpulan dongeng fabel binatang"],
            correctIndex: 0,
            explanation: "Biografi menceritakan riwayat hidup orang nyata berdasarkan fakta sejarah.",
          },
          {
            id: 3,
            question: "Kegiatan menilai, mengulas, dan mengapresiasi kualitas sebuah buku disebut...",
            options: ["Resensi buku (ulasan buku)", "Menjiplak buku", "Membakar buku"],
            correctIndex: 0,
            explanation: "Resensi adalah ulasan pertimbangan mutu keunggulan dan kekurangan karya.",
          },
          {
            id: 4,
            question: "Bagian data identitas buku dalam sebuah resensi meliputi...",
            options: ["Judul, pengarang, penerbit, tahun terbit, dan tebal halaman", "Nama pembaca resensi", "Harga kertas kosong"],
            correctIndex: 0,
            explanation: "Identitas buku memberikan rincian bibliografis lengkap penerbitan buku.",
          },
          {
            id: 5,
            question: "Ringkasan alur cerita dalam teks ulasan novel disebut...",
            options: ["Sinopsis", "Sampiran", "Daftar pustaka"],
            correctIndex: 0,
            explanation: "Sinopsis merangkum ikhtisar garis besar jalan cerita sebuah buku.",
          },
          {
            id: 6,
            question: "Dalam resensi buku, kita mengulas tentang kelebihan dan...",
            options: ["Kelemahan (kekurangan) buku", "Keluarga penulis", "Alamat percetakan"],
            correctIndex: 0,
            explanation: "Resensi yang adil menimbang sisi keunggulan sekaligus hal-hal yang perlu disempurnakan.",
          },
          {
            id: 7,
            question: "Cerita fiksi sejarah (seperti kisah pangeran tempo dulu) memadukan antara...",
            options: ["Latar fakta sejarah dengan tokoh dan percakapan rekaan", "Tabel matematika dengan grafik", "Kamus dengan koran"],
            correctIndex: 0,
            explanation: "Fiksi sejarah mengambil latar waktu peristiwa nyata namun jalan dialognya diimajinasikan.",
          },
          {
            id: 8,
            question: "Manfaat menulis resensi buku bagi pembaca umum adalah...",
            options: ["Memberi pertimbangan sebelum pembaca memutuskan membeli buku", "Membuat pembeli tidak jadi membaca", "Supaya buku tidak laku"],
            correctIndex: 0,
            explanation: "Resensi memandu publik memahami mutu dan kesesuaian bacaan.",
          },
          {
            id: 9,
            question: "Cerita fabel fiksi tetap bermakna penting bagi kehidupan nyata karena...",
            options: ["Mengandung amanat budi pekerti yang dapat diterapkan dalam keseharian", "Hewannya bisa terbang", "Bisa menggantikan buku pelajaran"],
            correctIndex: 0,
            explanation: "Amanat moral dalam karya fiksi menjadi cermin akhlak manusia.",
          },
          {
            id: 10,
            question: "Bahasa yang digunakan dalam teks nonfiksi umumnya bersifat...",
            options: ["Denotatif (makna sebenarnya / lugas)", "Konotatif penuh kiasan", "Penuh teka-teki misterius"],
            correctIndex: 0,
            explanation: "Teks nonfiksi menggunakan makna denotatif untuk menghindari kerancuan tafsir.",
          },
        ],
      };

    case 6:
      return {
        title: "Menulis Karangan Narasi & Deskripsi",
        conceptText: "Menyusun karangan utuh yang padu dengan ejaan, tanda baca, dan paragraf runtut. Karangan narasi berfokus pada urutan alur peristiwa, sedangkan deskripsi melukiskan rincian objek penginderaan.",
        questions: [
          {
            id: 1,
            question: "Karangan yang menceritakan rangkaian peristiwa secara kronologis dari awal hingga akhir dinamakan karangan...",
            options: ["Narasi", "Deskripsi", "Eksposisi"],
            correctIndex: 0,
            explanation: "Karangan narasi berpusat pada jalan cerita dan urutan peristiwa.",
          },
          {
            id: 2,
            question: "Karangan yang menggambarkan suatu objek secara rinci sehingga pembaca seolah melihat, mendengar, atau merasakan sendiri disebut karangan...",
            options: ["Deskripsi", "Narasi", "Argumentasi"],
            correctIndex: 0,
            explanation: "Deskripsi melukiskan detail penginderaan objek (bentuk, warna, suara, suasana).",
          },
          {
            id: 3,
            question: "Langkah pertama dalam menulis karangan utuh adalah...",
            options: ["Menentukan tema dan judul karangan", "Membuat sampul mewah", "Menjilid kertas"],
            correctIndex: 0,
            explanation: "Tema menjadi kompas pemandu alur tulisan sejak awal.",
          },
          {
            id: 4,
            question: "Rancangan poin-poin ide cerita yang disusun sebelum menulis karangan lengkap disebut...",
            options: ["Kerangka karangan (outline)", "Daftar pustaka", "Kamus mini"],
            correctIndex: 0,
            explanation: "Kerangka karangan mencegah penulis mengalami jalan buntu atau tulisan keluar dari topik.",
          },
          {
            id: 5,
            question: "Contoh paragraf deskripsi yang melibatkan indra penglihatan adalah...",
            options: ["Pantai itu berpasir putih bersih dengan air laut berwarna biru jernih.", "Pada pukul delapan pagi kami tiba di stasiun.", "Saya sangat ingin pergi liburan."],
            correctIndex: 0,
            explanation: "Kalimat pertama melukiskan visual warna dan rupa fisik pasir dan air laut.",
          },
          {
            id: 6,
            question: "Paragraf pembuka dalam karangan narasi berfungsi untuk...",
            options: ["Menarik minat pembaca serta mengenalkan tokoh dan latar awal", "Menutup buku", "Menuliskan ucapan terima kasih"],
            correctIndex: 0,
            explanation: "Paragraf pembuka memikat perhatian pembaca untuk meneruskan bacaannya.",
          },
          {
            id: 7,
            question: "Hubungan antarparagraf dalam karangan yang tersusun runtut dan logis dinamakan...",
            options: ["Kepaduan alur (kohesi dan koherensi)", "Konfrontasi", "Komplikasi"],
            correctIndex: 0,
            explanation: "Kohesi dan koherensi menjadikan sebuah karangan enak dibaca dan padu.",
          },
          {
            id: 8,
            question: "Setelah karangan selesai ditulis, tahap akhir yang penting untuk menyempurnakan tulisan adalah...",
            options: ["Menyunting (mengoreksi ejaan, tanda baca, dan kata yang keliru)", "Langsung merobek kertas", "Mengunci tulisan di laci"],
            correctIndex: 0,
            explanation: "Tahap penyuntingan (editing) membersihkan salah ketik dan memperbaiki kalimat janggal.",
          },
          {
            id: 9,
            question: "Tanda petik (\"...\") dalam karangan narasi digunakan untuk mengapit...",
            options: ["Kalimat langsung (dialog percakapan tokoh)", "Nama pengarang", "Angka tahun"],
            correctIndex: 0,
            explanation: "Tanda petik mengapit ucapan langsung yang diujarkan tokoh cerita.",
          },
          {
            id: 10,
            question: "Ciri karangan deskripsi yang baik adalah...",
            options: ["Mampu menghadirkan pengalaman pancaindra secara hidup di benak pembaca", "Bahasanya tidak bermakna", "Sangat pendek tanpa penjelasan ciri"],
            correctIndex: 0,
            explanation: "Deskripsi yang hidup membuat pembaca merasa seakan berada di lokasi objek.",
          },
        ],
      };

    default:
      return {
        title: "Bahasa Indonesia Kelas 6 SD",
        conceptText: "Materi belajar Bahasa Indonesia Kelas 6 SD.",
        questions: [],
      };
  }
}
