"use client";

import React from "react";
import { SubjectProgress } from "@/lib/gameProgress";

interface LevelMapProps {
  subjectName: string;
  progress: SubjectProgress;
  onSelectLevel: (levelId: number) => void;
  grade?: number;
}

export function LevelMap({ subjectName, progress, onSelectLevel, grade = 1 }: LevelMapProps) {
  const grade1Levels = [
    { id: 1, title: "Level 1: Petik Apel 1-5" },
    { id: 2, title: "Level 2: Lebih Banyak vs Sedikit" },
    { id: 3, title: "Level 3: Kereta Angka 1-5" },
    { id: 4, title: "Level 4: Penjumlahan Buah" },
    { id: 5, title: "Level 5: Pengurangan Balon" },
    { id: 6, title: "Level 6: Mengenal Bangun Datar" },
    { id: 7, title: "Level 7: Membandingkan Panjang" },
    { id: 8, title: "Level 8: Jam Analog & Waktu" },
    { id: 9, title: "Level 9: Nilai Tempat Puluhan" },
    { id: 10, title: "Level 10: Ujian Master Matematika" },
  ];

  const grade2Levels = [
    { id: 1, title: "Level 1: Membaca Bilangan s.d 999" },
    { id: 2, title: "Level 2: Nilai Tempat Ratusan" },
    { id: 3, title: "Level 3: Membandingkan Bilangan" },
    { id: 4, title: "Level 4: Penjumlahan & Pengurangan" },
    { id: 5, title: "Level 5: Perkalian Berulang" },
    { id: 6, title: "Level 6: Pembagian Berulang" },
    { id: 7, title: "Level 7: Pecahan 1/2, 1/3, 1/4" },
    { id: 8, title: "Level 8: Pengukuran Panjang & Berat" },
    { id: 9, title: "Level 9: Jam Analog & Durasi" },
    { id: 10, title: "Level 10: Geometri & Piktogram Data" },
  ];

  const grade3Levels = [
    { id: 1, title: "Level 1: Membaca Bilangan s.d 10.000" },
    { id: 2, title: "Level 2: Nilai Tempat Ribuan" },
    { id: 3, title: "Level 3: Penjumlahan & Pengurangan" },
    { id: 4, title: "Level 4: Perkalian Bersusun" },
    { id: 5, title: "Level 5: Pembagian Porogapit" },
    { id: 6, title: "Level 6: Pecahan Penyebut Sama" },
    { id: 7, title: "Level 7: Konversi Waktu, Panjang, Berat" },
    { id: 8, title: "Level 8: Mengenal Jenis Sudut" },
    { id: 9, title: "Level 9: Simetri & Keliling Bangun" },
    { id: 10, title: "Level 10: Diagram Batang & Tabel Data" },
  ];

  const levels = grade === 3 ? grade3Levels : grade === 2 ? grade2Levels : grade1Levels;

  return (
    <div className="w-full flex flex-col items-center justify-center p-2 md:p-6 relative">
      
      {/* Map Header Title Banner */}
      <div className="text-center mb-8 max-w-2xl">
        <span className="px-5 py-2 bg-[#C3631D] text-[#FFDF59] font-black text-sm md:text-base rounded-2xl tracking-wider uppercase shadow-[4px_4px_0px_0px_#3C632A] border-4 border-[#3C632A] inline-block mb-3">
          PETA PETUALANGAN BELAJAR (10 LEVEL)
        </span>
        <h2 className="text-3xl md:text-5xl font-black text-[#3C632A] drop-shadow-sm">
          {subjectName}
        </h2>
        <p className="text-[#3C632A] font-extrabold text-sm md:text-lg mt-2">
          Pilih level di bawah untuk memulai pembelajaran!
        </p>
      </div>

      {/* 3-COLUMN GRID LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl w-full px-2">
        {levels.map((lvl) => {
          const isCompleted = progress.completedLevels.includes(lvl.id);
          const isUnlocked = lvl.id === 1 || progress.completedLevels.includes(lvl.id - 1);
          const isCurrent = isUnlocked && !isCompleted;
          const isHardLevel = lvl.id >= 6;

          return (
            <button
              key={lvl.id}
              onClick={() => isUnlocked && onSelectLevel(lvl.id)}
              disabled={!isUnlocked}
              className={`p-6 rounded-[32px] border-4 border-[#3C632A] flex flex-col items-center justify-between text-center transition-all duration-300 relative shadow-[8px_8px_0px_0px_#3C632A] group min-h-[220px] ${
                isCompleted
                  ? "bg-[#7FD13B] text-white hover:scale-105 cursor-pointer"
                  : isCurrent
                  ? "bg-[#FFE296] text-[#3C632A] animate-pulse ring-8 ring-[#7FD13B]/60 hover:scale-105 cursor-pointer"
                  : "bg-slate-200/80 text-slate-500 border-slate-400 cursor-not-allowed opacity-60 shadow-none"
              }`}
            >
              {/* Badge Top Header */}
              <div className="w-full flex items-center justify-between mb-2">
                <span className={`text-xs font-black uppercase px-3 py-1 rounded-xl shadow-sm border-2 border-[#3C632A] ${
                  isHardLevel ? "bg-[#FF5685] text-white" : "bg-[#C3631D] text-white"
                }`}>
                  {isHardLevel ? "Tantangan" : "Dasar"}
                </span>

                {isCompleted ? (
                  <div className="flex items-center space-x-1 bg-[#FFDF59] border-2 border-[#3C632A] px-2.5 py-0.5 rounded-full shadow-sm text-[#3C632A] font-black text-xs">
                    <span>3 Bintang</span>
                  </div>
                ) : !isUnlocked ? (
                  <span className="text-xs font-black bg-slate-300 px-2 py-0.5 rounded-lg border border-slate-500 text-slate-600">
                    Terkunci
                  </span>
                ) : (
                  <span className="text-xs font-black text-white bg-[#7FD13B] px-2.5 py-0.5 rounded-lg border-2 border-[#3C632A]">
                    AKTIF
                  </span>
                )}
              </div>

              {/* Number Circle Badge */}
              <div className={`w-20 h-20 md:w-24 md:h-24 rounded-[24px] border-4 border-[#3C632A] flex flex-col items-center justify-center font-black text-2xl md:text-3xl my-2 shadow-md shrink-0 ${
                isCompleted
                  ? "bg-white text-[#3C632A]"
                  : isCurrent
                  ? "bg-[#FFDF59] text-[#3C632A]"
                  : "bg-slate-300 text-slate-500"
              }`}>
                <span className="text-xs font-extrabold uppercase opacity-75">LEVEL</span>
                <span>{lvl.id}</span>
              </div>

              {/* Title & Status */}
              <div className="w-full mt-2">
                <h3 className={`font-black text-lg md:text-xl leading-snug drop-shadow-sm ${
                  isCompleted ? "text-white" : "text-[#3C632A]"
                }`}>
                  {lvl.title}
                </h3>

                <p className={`text-xs md:text-sm font-extrabold mt-2 ${
                  isCompleted ? "text-amber-100" : "text-[#3C632A]/80"
                }`}>
                  {isCompleted
                    ? "Selesai Sempurna"
                    : isUnlocked
                    ? "Klik Untuk Main"
                    : "Terkunci"}
                </p>
              </div>
            </button>
          );
        })}
      </div>

    </div>
  );
}
