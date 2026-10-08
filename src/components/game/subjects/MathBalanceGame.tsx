"use client";

import React, { useState, useEffect } from "react";
import { speakGlobal } from "@/lib/soundControl";
import { playPopSound, playSuccessFanfare, playClueChime } from "@/lib/audioSynthesizer";

interface MathBalanceGameProps {
  levelId: number;
  onLevelComplete: (levelId: number, starsEarned: number) => void;
  accessibilityMode?: string;
}

export function MathBalanceGame({ levelId, onLevelComplete, accessibilityMode }: MathBalanceGameProps) {
  // Game states per level
  const [leftCount, setLeftCount] = useState<number>(0);
  const [rightCount, setRightCount] = useState<number>(0);
  const [targetCount, setTargetCount] = useState<number>(0);
  const [wrongAttempts, setWrongAttempts] = useState<number>(0);
  const [showClue, setShowClue] = useState<boolean>(false);
  const [listeningVoice, setListeningVoice] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string>("");
  const [hasWon, setHasWon] = useState<boolean>(false);

  // Setup level specific parameters (Level 1 - 10)
  useEffect(() => {
    setWrongAttempts(0);
    setShowClue(false);
    setFeedbackMsg("");
    setHasWon(false);

    let promptText = "";
    let initialMsg = "";

    switch (levelId) {
      case 1:
        setLeftCount(5);
        setRightCount(2);
        setTargetCount(5);
        promptText = "Level 1: Sisi kiri ada 5 apel. Sisi kanan ada 2. Tambahkan 3 lagi agar seimbang 5!";
        initialMsg = "Tambahkan apel ke sisi kanan agar seimbang dengan 5!";
        break;

      case 2:
        setLeftCount(8);
        setRightCount(0);
        setTargetCount(8);
        promptText = "Level 2: Target angka adalah 8. Susun balok di kanan hingga pas 8!";
        initialMsg = "Pilih kombinasi balok (+1, +2, +5) untuk mencapai angka 8!";
        break;

      case 3:
        setLeftCount(9);
        setRightCount(3);
        setTargetCount(9);
        promptText = "Level 3: Sisi kiri bernilai 9. Sisi kanan bernilai 3. Tambahkan 6 lagi agar seimbang!";
        initialMsg = "Seimbangkan timbangan dengan menambahkan angka 6 di kanan!";
        break;

      case 4:
        setLeftCount(12);
        setRightCount(4);
        setTargetCount(12);
        promptText = "Level 4: Sisi kiri 12. Sisi kanan 4. Tambahkan 8 lagi!";
        initialMsg = "Tambahkan balok/apel di kanan hingga nilainya 12!";
        break;

      case 5:
        setLeftCount(15);
        setRightCount(5);
        setTargetCount(15);
        promptText = "Level 5: Evaluasi Seimbang Cepat. Target nilai adalah 15!";
        initialMsg = "Seimbangkan timbangan dengan menambah 10 di sisi kanan!";
        break;

      case 6:
        // LEVEL PENGURANGAN / SUBTRACTION
        setLeftCount(6);
        setRightCount(10); // Kanan keberatan!
        setTargetCount(6);
        promptText = "Level 6 Pengurangan: Sisi kanan keberatan (10 apel)! Kurangi beban kanan agar pas bernilai 6.";
        initialMsg = "Sisi kanan keberatan (10)! Gunakan tombol kurangi (-2, -4) agar seimbang 6!";
        break;

      case 7:
        // LEVEL KOTAK MISTERI (VARIABLE X)
        setLeftCount(9);
        setRightCount(2); // Kotak misteri 🎁 + 2 = 9 => X = 7
        setTargetCount(9);
        promptText = "Level 7 Kotak Misteri: Ada kotak hadiah X di kiri. Sisi kanan bernilai 9. Berapa nilai kotak misteri tersebut?";
        initialMsg = "Pecahkan nilai Kotak Misteri 🎁 di kiri agar seimbang dengan 9!";
        break;

      case 8:
        // LEVEL PERKALIAN VISUAL (3 x 4 = 12)
        setLeftCount(12);
        setRightCount(0);
        setTargetCount(12);
        promptText = "Level 8 Perkalian: Susun 3 kelompok berisi 4 balok untuk mencapai total 12!";
        initialMsg = "Gunakan tombol kelipatan (+3, +4) untuk membentuk 12!";
        break;

      case 9:
        // LEVEL DUAL BALANCE
        setLeftCount(14);
        setRightCount(6);
        setTargetCount(14);
        promptText = "Level 9 Timbangan Ganda: Kiri 14, Kanan 6. Tambahkan 8 lagi!";
        initialMsg = "Tantangan Lanjut! Seimbangkan 14 di kiri dengan 6 di kanan.";
        break;

      case 10:
        // LEVEL BOS MASTER MATEMATIKA
        setLeftCount(20);
        setRightCount(5);
        setTargetCount(20);
        promptText = "Level 10 Ujian Bos: Sisi kiri bernilai 20. Sisi kanan baru bernilai 5. Tambahkan 15 lagi untuk memenangkan gelar Master Matematika!";
        initialMsg = "👑 UJIAN BOS MASTER: Seimbangkan 20 di kanan untuk meraih Mahkota Master!";
        break;

      default:
        setLeftCount(5);
        setRightCount(2);
        setTargetCount(5);
        promptText = "Level Matematika Seimbang.";
        initialMsg = "Seimbangkan timbangan!";
        break;
    }

    speakGlobal(promptText);
    setFeedbackMsg(initialMsg);
  }, [levelId]);

  // Determine correct needed change
  const isSubtractionLevel = levelId === 6;
  const neededValue = Math.abs(targetCount - rightCount);
  const isBalanced = leftCount === rightCount;

  const handleApplyValue = (val: number) => {
    if (hasWon) return;

    playPopSound();
    const newRight = isSubtractionLevel ? rightCount - val : rightCount + val;
    setRightCount(newRight);

    if (newRight === targetCount) {
      // SUCCESS!
      setHasWon(true);
      playSuccessFanfare();
      const winMsg = `Hore! Timbangan seimbang! Nilainya pas ${targetCount}. Kamu luar biasa!`;
      setFeedbackMsg("🎉 Hore! Timbangan Berhasil Seimbang Sempurna!");
      speakGlobal(winMsg);

      // Trigger pop up modal after 600ms
      setTimeout(() => {
        onLevelComplete(levelId, 3);
      }, 600);

    } else if ((!isSubtractionLevel && newRight > targetCount) || (isSubtractionLevel && newRight < targetCount)) {
      // Overload or underload - without harsh penalty
      const newAttempts = wrongAttempts + 1;
      setWrongAttempts(newAttempts);

      if (newAttempts >= 2) {
        setShowClue(true);
        playClueChime();
        setFeedbackMsg("💡 Petunjuk: Tekan tombol 'Reset' lalu pilih angka " + neededValue);
        speakGlobal("Petunjuk visual aktif. Tekan reset lalu pilih angka " + neededValue);
      } else {
        setFeedbackMsg("Belum pas seimbang! Tekan 'Reset' untuk mengulangi.");
        speakGlobal("Belum pas. Kamu bisa menekan reset untuk mengulangi.");
      }
    } else {
      const neededNow = Math.abs(targetCount - newRight);
      speakGlobal(`Bagus! Nilai kanan sekarang ${newRight}. Tinggal ${neededNow} lagi agar seimbang.`);
    }
  };

  const handleResetRight = () => {
    if (hasWon) return;
    playPopSound();
    let initialRight = 0;
    if (levelId === 1) initialRight = 2;
    else if (levelId === 3) initialRight = 3;
    else if (levelId === 4) initialRight = 4;
    else if (levelId === 5) initialRight = 5;
    else if (levelId === 6) initialRight = 10;
    else if (levelId === 7) initialRight = 2;
    else if (levelId === 9) initialRight = 6;
    else if (levelId === 10) initialRight = 5;

    setRightCount(initialRight);
    setFeedbackMsg("Timbangan kanan direset. Silakan coba lagi!");
    speakGlobal("Timbangan kanan telah dikosongkan kembali.");
  };

  // Voice Input Helper
  const handleVoiceInput = () => {
    if (hasWon) return;
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Browser kamu belum mendukung input suara. Silakan gunakan tombol di layar.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "id-ID";
      setListeningVoice(true);
      speakGlobal("Silakan sebutkan angka yang ingin digunakan.");

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setListeningVoice(false);
        const parsedNum = parseInt(transcript.replace(/[^0-9]/g, ""), 10);
        if (!isNaN(parsedNum) && parsedNum > 0) {
          handleApplyValue(parsedNum);
        } else {
          speakGlobal(`Mengendalikan angka ${transcript}. Silakan sebutkan angka yang pas.`);
        }
      };

      recognition.onerror = () => {
        setListeningVoice(false);
      };

      recognition.start();
    } catch {
      setListeningVoice(false);
    }
  };

  // Compute rotation angle (-15deg to +15deg)
  const diff = rightCount - leftCount;
  const rotationDeg = Math.max(-15, Math.min(15, diff * 3));

  // Determine manipulative choices per level
  const buttonValues = isSubtractionLevel 
    ? [2, 4, 5] 
    : levelId === 7 
    ? [3, 5, 7] 
    : levelId === 8 
    ? [3, 4, 6] 
    : levelId === 10 
    ? [5, 10, 15] 
    : [1, 2, 3, 5];

  return (
    <div className="w-full flex flex-col items-center justify-between min-h-[500px] p-4 md:p-8 bg-gradient-to-b from-amber-500/20 via-orange-600/10 to-transparent rounded-[36px] border-4 border-amber-400/40 text-white shadow-2xl relative overflow-hidden">
      
      {/* Level Header Info */}
      <div className="w-full flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="px-4 py-1.5 bg-[#FFDF59] text-[#5D3A1A] font-black text-xs md:text-sm rounded-full shadow-md">
            LEVEL {levelId} dari 10
          </span>
          <h2 className="text-lg md:text-xl font-black text-[#FFDF59] drop-shadow-md">
            {levelId === 1 && "🍎 Timbangan Apel Ajaib"}
            {levelId === 2 && "🧱 Balok Nilai Tempat"}
            {levelId === 3 && "⚖️ Penjumlahan Seimbang"}
            {levelId === 4 && "🍏 Penjumlahan Tiga Suku"}
            {levelId === 5 && "🎯 Evaluasi Seimbang Cepat"}
            {levelId === 6 && "➖ Pengurangan & Pengosongan Beban"}
            {levelId === 7 && "🎁 Variabel Kotak Misteri X"}
            {levelId === 8 && "✖️ Kelipatan & Perkalian Balok"}
            {levelId === 9 && "⚖️ Timbangan Ganda"}
            {levelId === 10 && "👑 Ujian Bos Master Matematika"}
          </h2>
        </div>

        {/* Replay Voice Helper Button */}
        <button
          onClick={() => {
            const prompt = `Level ${levelId}. Nilai kiri ${leftCount}, nilai kanan ${rightCount}.`;
            speakGlobal(prompt);
          }}
          className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-[#5D3A1A] font-black text-xs md:text-sm rounded-2xl shadow-lg transition-all flex items-center space-x-2"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
          <span>Dengar Instruksi</span>
        </button>
      </div>

      {/* Instructional Feedback Banner (KONSISTEN UKURAN BANNER LAYOUT) */}
      <div className={`w-full max-w-2xl border-4 p-4 rounded-2xl text-center shadow-lg mb-6 transition-colors flex items-center justify-center min-h-[64px] ${
        hasWon ? "bg-[#5D3A1A]/95 border-[#7FD13B]" : "bg-[#5D3A1A]/90 border-[#FFDF59]"
      }`}>
        <p className="text-sm md:text-lg font-black text-[#FFDF59] leading-snug">
          {feedbackMsg}
        </p>
      </div>

      {/* ================= VISUAL BALANCE SCALE ENGINE ================= */}
      <div className="relative w-full max-w-2xl h-64 md:h-72 my-4 flex flex-col items-center justify-end">
        {/* Scale Beam */}
        <div 
          className="relative w-4/5 h-4 bg-amber-800 border-2 border-amber-300 rounded-full transition-transform duration-700 ease-out shadow-xl flex items-center justify-between px-2"
          style={{ transform: `rotate(${rotationDeg}deg)` }}
        >
          {/* Left Pan Platform */}
          <div className="absolute -left-10 -top-24 w-32 md:w-40 flex flex-col items-center">
            {/* Hanging Chains */}
            <div className="w-full flex justify-between px-4 h-16">
              <div className="w-1 bg-amber-300/80 h-full" />
              <div className="w-1 bg-amber-300/80 h-full" />
            </div>
            {/* Pan Dish & Items */}
            <div className="w-full bg-[#FFDF59] border-4 border-[#C3631D] rounded-b-3xl p-3 shadow-2xl flex flex-wrap items-center justify-center gap-1.5 min-h-[70px]">
              {levelId === 7 && <span className="text-3xl">🎁</span>}
              {Array.from({ length: leftCount - (levelId === 7 ? 2 : 0) }).map((_, i) => (
                <span key={i} className="text-xl md:text-2xl animate-bounce" style={{ animationDelay: `${i * 0.08}s` }}>
                  {levelId === 2 || levelId === 8 ? "🧱" : "🍎"}
                </span>
              ))}
            </div>
            <span className="mt-2 px-3 py-1 bg-[#5D3A1A] text-[#FFDF59] font-black text-xs md:text-sm rounded-full border border-[#FFDF59]">
              Nilai: {leftCount}
            </span>
          </div>

          {/* Right Pan Platform */}
          <div className="absolute -right-10 -top-24 w-32 md:w-40 flex flex-col items-center">
            {/* Hanging Chains */}
            <div className="w-full flex justify-between px-4 h-16">
              <div className="w-1 bg-amber-300/80 h-full" />
              <div className="w-1 bg-amber-300/80 h-full" />
            </div>
            {/* Pan Dish & Items (HIJAU SERASI PINTARA SAAT SEIMBANG) */}
            <div className={`w-full border-4 rounded-b-3xl p-3 shadow-2xl flex flex-wrap items-center justify-center gap-1.5 min-h-[70px] transition-colors ${
              isBalanced ? "bg-[#7FD13B] border-[#3C632A]" : "bg-[#FFDF59] border-[#C3631D]"
            }`}>
              {Array.from({ length: rightCount }).map((_, i) => (
                <span key={i} className="text-xl md:text-2xl animate-bounce" style={{ animationDelay: `${i * 0.08}s` }}>
                  {levelId === 2 || levelId === 8 ? "🧱" : "🍎"}
                </span>
              ))}
            </div>
            <span className="mt-2 px-3 py-1 bg-[#5D3A1A] text-[#FFDF59] font-black text-xs md:text-sm rounded-full border border-[#FFDF59]">
              Nilai: {rightCount}
            </span>
          </div>
        </div>

        {/* Fulcrum Stand Base */}
        <div className="w-0 h-0 border-l-[30px] border-l-transparent border-r-[30px] border-r-transparent border-b-[90px] border-b-amber-900 shadow-2xl relative z-0">
          <div className="absolute -bottom-2 -left-12 w-24 h-4 bg-amber-950 rounded-full" />
        </div>
      </div>

      {/* ================= CONTROLS & MANIPULATIVE BUTTONS (LENGKAP DAN TETAP ADA) ================= */}
      <div className="w-full max-w-xl bg-[#5D3A1A]/90 border-4 border-amber-400/40 p-4 md:p-5 rounded-3xl mt-4 flex flex-col items-center space-y-3">
        <span className="text-xs md:text-sm font-extrabold text-[#FFDF59] uppercase tracking-wider">
          {isSubtractionLevel ? "Pilih Angka Untuk Dikurangi (-):" : "Pilih Benda/Angka Untuk Ditambahkan (+):"}
        </span>

        {/* Manipulative Options */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {buttonValues.map((num) => {
            const isTargetClue = showClue && num === neededValue;
            return (
              <button
                key={num}
                onClick={() => handleApplyValue(num)}
                disabled={hasWon}
                className={`px-5 py-2.5 md:px-6 md:py-3.5 rounded-2xl font-black text-base md:text-xl transition-all duration-300 border-4 flex items-center space-x-1.5 shadow-lg ${
                  hasWon
                    ? "opacity-60 cursor-not-allowed bg-[#FFDF59] border-[#C3631D] text-[#5D3A1A]"
                    : isTargetClue
                    ? "bg-amber-300 border-amber-100 text-[#5D3A1A] animate-pulse ring-8 ring-amber-300/50 scale-110 shadow-[0_0_25px_rgba(255,223,89,0.9)]"
                    : "bg-[#FFDF59] hover:bg-[#FFE296] border-[#C3631D] text-[#5D3A1A] hover:scale-105 active:scale-95"
                }`}
              >
                <span>{isSubtractionLevel ? `-${num}` : `+${num}`}</span>
                <span className="text-lg">{levelId === 2 || levelId === 8 ? "🧱" : "🍎"}</span>
              </button>
            );
          })}
        </div>

        {/* Action Row: Reset & Voice Input */}
        <div className="flex items-center justify-center gap-3 pt-1 w-full">
          <button
            onClick={handleResetRight}
            disabled={hasWon}
            className={`px-4 py-2 bg-rose-600 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1 ${
              hasWon ? "opacity-50 cursor-not-allowed" : "hover:bg-rose-500"
            }`}
          >
            <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            <span>Reset</span>
          </button>

          <button
            onClick={handleVoiceInput}
            disabled={hasWon}
            className={`px-4 py-2 rounded-xl font-black text-xs shadow-md transition-all flex items-center space-x-1.5 ${
              hasWon
                ? "opacity-50 cursor-not-allowed bg-teal-600 text-white"
                : listeningVoice
                ? "bg-rose-500 text-white animate-pulse"
                : "bg-teal-500 hover:bg-teal-400 text-white border-2 border-teal-200"
            }`}
          >
            <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"/></svg>
            <span>{listeningVoice ? "Mendengarkan..." : "Jawab via Suara"}</span>
          </button>
        </div>
      </div>

    </div>
  );
}
