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

  const grade4Levels = [
    { id: 1, title: "Level 1: Bilangan Besar s.d 999.999" },
    { id: 2, title: "Level 2: Pecahan Senilai, Desimal, %" },
    { id: 3, title: "Level 3: Faktor, Kelipatan, Prima" },
    { id: 4, title: "Level 4: Penentuan FPB dan KPK" },
    { id: 5, title: "Level 5: Pembulatan & Penaksiran" },
    { id: 6, title: "Level 6: Operasi Hitung Campuran" },
    { id: 7, title: "Level 7: Pecahan Beda Penyebut" },
    { id: 8, title: "Level 8: Keliling & Luas Rumus Baku" },
    { id: 9, title: "Level 9: Garis & Sudut Busur Derajat" },
    { id: 10, title: "Level 10: Diagram Batang & Tabel Data" },
  ];

  const grade5Levels = [
    { id: 1, title: "Level 1: Penjumlahan & Pengurangan Pecahan" },
    { id: 2, title: "Level 2: Perkalian & Pembagian Pecahan" },
    { id: 3, title: "Level 3: Operasi Hitung Desimal & Persen" },
    { id: 4, title: "Level 4: Perbandingan Senilai & Besaran" },
    { id: 5, title: "Level 5: Perhitungan Skala Peta & Denah" },
    { id: 6, title: "Level 6: Hubungan Jarak, Waktu, Kecepatan" },
    { id: 7, title: "Level 7: Volume, Waktu, & Debit Air" },
    { id: 8, title: "Level 8: Jaring-Jaring Kubus & Balok" },
    { id: 9, title: "Level 9: Menghitung Volume Kubus & Balok" },
    { id: 10, title: "Level 10: Diagram Garis & Tabel Frekuensi" },
  ];

  const grade6Levels = [
    { id: 1, title: "Level 1: Mengenal Bilangan Bulat Negatif" },
    { id: 2, title: "Level 2: Penjumlahan & Pengurangan Bil. Bulat" },
    { id: 3, title: "Level 3: Perkalian & Pembagian Bil. Bulat" },
    { id: 4, title: "Level 4: Campuran Pecahan, Desimal, %" },
    { id: 5, title: "Level 5: Unsur-Unsur Lingkaran" },
    { id: 6, title: "Level 6: Keliling Lingkaran" },
    { id: 7, title: "Level 7: Luas Lingkaran" },
    { id: 8, title: "Level 8: Prisma, Limas, & Tabung" },
    { id: 9, title: "Level 9: Bangun Ruang Kerucut & Bola" },
    { id: 10, title: "Level 10: Statistika: Mean, Median, Modus" },
  ];

  const isIndo = subjectName.toLowerCase().includes("indonesia");

  const indoGrade1Levels = [
    { id: 1, title: "Level 1: Mengenal Huruf & Bunyi" },
    { id: 2, title: "Level 2: Membaca & Menulis Permulaan" },
    { id: 3, title: "Level 3: Perkenalan Diri & Lingkungan" },
    { id: 4, title: "Level 4: Kalimat Sederhana" },
    { id: 5, title: "Level 5: Mendengarkan Dongeng & Cerita" },
    { id: 6, title: "Level 6: Ungkapan Sopan Sehari-hari" },
  ];

  const indoGrade2Levels = [
    { id: 1, title: "Level 1: Tanda Baca & Ejaan" },
    { id: 2, title: "Level 2: Kosakata Lingkungan & Kegiatan" },
    { id: 3, title: "Level 3: Kalimat Berpola (S-P-O)" },
    { id: 4, title: "Level 4: Jenis-Jenis Kalimat" },
    { id: 5, title: "Level 5: Menulis Tegak Bersambung" },
    { id: 6, title: "Level 6: Puisi Anak & Deklamasi" },
    { id: 7, title: "Level 7: Teks Narasi Pendek (5W1H)" },
  ];

  const indoGrade3Levels = [
    { id: 1, title: "Level 1: Ide Pokok Paragraf Sederhana" },
    { id: 2, title: "Level 2: Teks Petunjuk & Arahan" },
    { id: 3, title: "Level 3: Dongeng & Cerita Rakyat" },
    { id: 4, title: "Level 4: Wawancara Sederhana" },
    { id: 5, title: "Level 5: Membaca Intensif & Ekstensif" },
    { id: 6, title: "Level 6: Puisi & Ungkapan Perasaan" },
  ];

  const indoGrade4Levels = [
    { id: 1, title: "Level 1: Gagasan Pokok & Pendukung" },
    { id: 2, title: "Level 2: Struktur Teks Petunjuk/Prosedur" },
    { id: 3, title: "Level 3: Wawancara Lanjutan & Laporan" },
    { id: 4, title: "Level 4: Majas & Bahasa Kiasan Dasar" },
    { id: 5, title: "Level 5: Fabel & Unsur Intrinsik Cerita" },
    { id: 6, title: "Level 6: Bagian Surat Pribadi" },
    { id: 7, title: "Level 7: Kamus & Tesaurus (KBBI)" },
  ];

  const indoGrade5Levels = [
    { id: 1, title: "Level 1: Kalimat Efektif & Ejaan (EYD)" },
    { id: 2, title: "Level 2: Teks Eksplanasi Fenomena" },
    { id: 3, title: "Level 3: Bahasa Iklan & Slogan Persuasif" },
    { id: 4, title: "Level 4: Teks Narasi Sejarah Bangsa" },
    { id: 5, title: "Level 5: Membuat Ringkasan & Ikhtisar" },
    { id: 6, title: "Level 6: Pantun & Sastra Tradisional" },
  ];

  const indoGrade6Levels = [
    { id: 1, title: "Level 1: Teks Laporan Hasil Pengamatan" },
    { id: 2, title: "Level 2: Struktur & Naskah Pidato Persuasif" },
    { id: 3, title: "Level 3: Pengisian Formulir & Dokumen Resmi" },
    { id: 4, title: "Level 4: Teks Eksplanasi & Teks Berita" },
    { id: 5, title: "Level 5: Cerita Fiksi vs Nonfiksi & Resensi" },
    { id: 6, title: "Level 6: Menulis Karangan Narasi & Deskripsi" },
  ];

  const mathLevels = grade === 6 ? grade6Levels : grade === 5 ? grade5Levels : grade === 4 ? grade4Levels : grade === 3 ? grade3Levels : grade === 2 ? grade2Levels : grade1Levels;
  const indoLevels = grade === 6 ? indoGrade6Levels : grade === 5 ? indoGrade5Levels : grade === 4 ? indoGrade4Levels : grade === 3 ? indoGrade3Levels : grade === 2 ? indoGrade2Levels : indoGrade1Levels;
  const levels = isIndo ? indoLevels : mathLevels;

  return (
    <div className="w-full flex flex-col items-center justify-center p-2 md:p-6 relative">
      
      {/* Map Header Title Banner */}
      <div className="text-center mb-8 max-w-2xl">
        <span className="px-5 py-2 bg-[#C3631D] text-[#FFDF59] font-black text-sm md:text-base rounded-2xl tracking-wider uppercase shadow-[4px_4px_0px_0px_#3C632A] border-4 border-[#3C632A] inline-block mb-3">
          PETA PETUALANGAN BELAJAR ({levels.length} LEVEL)
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
          const isHardLevel = lvl.id > Math.ceil(levels.length / 2);

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
