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
  const isEnglish = subjectName.toLowerCase().includes("inggris") || subjectName.toLowerCase().includes("english");
  const isIpas = subjectName.toLowerCase().includes("ipas") || subjectName.toLowerCase().includes("ilmu pengetahuan alam") || subjectName.toLowerCase().includes("alam dan sosial");
  const isPancasila = subjectName.toLowerCase().includes("pancasila") || subjectName.toLowerCase().includes("pkn");
  const isSeni = subjectName.toLowerCase().includes("seni") || subjectName.toLowerCase().includes("budaya") || subjectName.toLowerCase().includes("sbk");

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

  const englishGrade1Levels = [
    { id: 1, title: "Level 1: Greetings & Introductions" },
    { id: 2, title: "Level 2: The Alphabet & Phonics" },
    { id: 3, title: "Level 3: Numbers (1–10 / 20)" },
    { id: 4, title: "Level 4: Colors & Shapes" },
    { id: 5, title: "Level 5: Classroom Objects" },
    { id: 6, title: "Level 6: My Body" },
    { id: 7, title: "Level 7: Family Members" },
  ];

  const englishGrade2Levels = [
    { id: 1, title: "Level 1: Numbers (21–50 / 100)" },
    { id: 2, title: "Level 2: Animals (Pets & Wild Animals)" },
    { id: 3, title: "Level 3: Parts of the House & Furniture" },
    { id: 4, title: "Level 4: Food & Drinks (Likes / Dislikes)" },
    { id: 5, title: "Level 5: Clothes & Accessories" },
    { id: 6, title: "Level 6: Simple Action Verbs" },
    { id: 7, title: "Level 7: Basic Demonstratives (This/That)" },
  ];

  const englishGrade3Levels = [
    { id: 1, title: "Level 1: Time & Daily Routines" },
    { id: 2, title: "Level 2: Days and Months" },
    { id: 3, title: "Level 3: Weather & Seasons" },
    { id: 4, title: "Level 4: Hobbies & Free Time" },
    { id: 5, title: "Level 5: Basic Prepositions of Place" },
    { id: 6, title: "Level 6: Expressing Possession (Have/Has)" },
    { id: 7, title: "Level 7: Basic Feelings & Emotions" },
  ];

  const englishGrade4Levels = [
    { id: 1, title: "Level 1: Simple Present Tense (Do/Does)" },
    { id: 2, title: "Level 2: Telling the Time (Detailed)" },
    { id: 3, title: "Level 3: School Subjects & Schedules" },
    { id: 4, title: "Level 4: Professions & Workplaces" },
    { id: 5, title: "Level 5: Places in Town & Basic Directions" },
    { id: 6, title: "Level 6: Expressing Likes & Dislikes" },
    { id: 7, title: "Level 7: Quantifiers (Some, Any, Much, Many)" },
  ];

  const englishGrade5Levels = [
    { id: 1, title: "Level 1: Present Continuous Tense" },
    { id: 2, title: "Level 2: Adjectives & Degrees of Comparison" },
    { id: 3, title: "Level 3: Health & Illnesses" },
    { id: 4, title: "Level 4: Food, Taste, & Ordering" },
    { id: 5, title: "Level 5: Public Transportation & Travel" },
    { id: 6, title: "Level 6: Simple Procedure Text & Imperatives" },
  ];

  const englishGrade6Levels = [
    { id: 1, title: "Level 1: Simple Past Tense (Past Verbs)" },
    { id: 2, title: "Level 2: Future Tense & Plans (Will/Going to)" },
    { id: 3, title: "Level 3: Advanced Direction & Map Reading" },
    { id: 4, title: "Level 4: Earth, Space, & Environment Care" },
    { id: 5, title: "Level 5: Descriptive Text & Structures" },
    { id: 6, title: "Level 6: Recount Text & Past Experiences" },
  ];

  const ipasGrade4Levels = [
    { id: 1, title: "Level 1: Bagian Tubuh Tumbuhan & Fungsinya" },
    { id: 2, title: "Level 2: Wujud Zat & Perubahannya" },
    { id: 3, title: "Level 3: Gaya di Sekitar Kita" },
    { id: 4, title: "Level 4: Transformasi Energi" },
    { id: 5, title: "Level 5: Cerita tentang Daerahku" },
    { id: 6, title: "Level 6: Keragaman Budaya & Kearifan Lokal" },
    { id: 7, title: "Level 7: Kegiatan Ekonomi & Kebutuhan Manusia" },
    { id: 8, title: "Level 8: Norma & Adat Istiadat" },
  ];

  const ipasGrade5Levels = [
    { id: 1, title: "Level 1: Cahaya & Penglihatan" },
    { id: 2, title: "Level 2: Bunyi & Pendengaran" },
    { id: 3, title: "Level 3: Ekosistem & Keseimbangan Lingkungan" },
    { id: 4, title: "Level 4: Magnet, Listrik, & Teknologi" },
    { id: 5, title: "Level 5: Struktur Bumi & Perubahannya" },
    { id: 6, title: "Level 6: Warisan Budaya & Sejarah Nusantara" },
    { id: 7, title: "Level 7: Kondisi Geografis Indonesia" },
    { id: 8, title: "Level 8: Perekonomian & Sumber Daya Alam" },
  ];

  const ipasGrade6Levels = [
    { id: 1, title: "Level 1: Sistem Gerak Manusia" },
    { id: 2, title: "Level 2: Sistem Organ Tubuh Manusia" },
    { id: 3, title: "Level 3: Perkembangbiakan Makhluk Hidup" },
    { id: 4, title: "Level 4: Tata Surya & Alam Semesta" },
    { id: 5, title: "Level 5: Sejarah Perjuangan Bangsa" },
    { id: 6, title: "Level 6: Geografi Regional & Global (ASEAN)" },
    { id: 7, title: "Level 7: Kerja Sama Antarnegara & Globalisasi" },
    { id: 8, title: "Level 8: Kelestarian Lingkungan & Isu Global" },
  ];

  const pancasilaGrade1Levels = [
    { id: 1, title: "Level 1: Aku Cinta Pancasila" },
    { id: 2, title: "Level 2: Aku Anak yang Patuh Aturan" },
    { id: 3, title: "Level 3: Kita Berbeda tetapi Sama" },
    { id: 4, title: "Level 4: Aku Cinta Lingkungan Sekitar" },
  ];

  const pancasilaGrade2Levels = [
    { id: 1, title: "Level 1: Pancasila Dasar Negaraku" },
    { id: 2, title: "Level 2: Menaati Aturan di Sekitarku" },
    { id: 3, title: "Level 3: Bhinneka Tunggal Ika di Sekolah" },
    { id: 4, title: "Level 4: Aku Peduli Lingkungan" },
  ];

  const pancasilaGrade3Levels = [
    { id: 1, title: "Level 1: Makna Sila-Sila Pancasila" },
    { id: 2, title: "Level 2: Hak dan Kewajiban" },
    { id: 3, title: "Level 3: Keragaman Suku & Budaya" },
    { id: 4, title: "Level 4: Mengenal Wilayah Tempat Tinggal" },
  ];

  const pancasilaGrade4Levels = [
    { id: 1, title: "Level 1: Pancasila sebagai Pedoman Hidup" },
    { id: 2, title: "Level 2: Norma dan Konstitusi" },
    { id: 3, title: "Level 3: Keberagaman Budaya Indonesia" },
    { id: 4, title: "Level 4: Negara Kesatuan Republik Indonesia (NKRI)" },
  ];

  const pancasilaGrade5Levels = [
    { id: 1, title: "Level 1: Pancasila dalam Kehidupan Berbangsa" },
    { id: 2, title: "Level 2: Kepatuhan terhadap Norma & Hukum" },
    { id: 3, title: "Level 3: Menghargai Keragaman Karakteristik Individu" },
    { id: 4, title: "Level 4: Persatuan dan Kesatuan Bangsa" },
  ];

  const pancasilaGrade6Levels = [
    { id: 1, title: "Level 1: Pengamalan Nilai-Nilai Pancasila secara Utuh" },
    { id: 2, title: "Level 2: Musyawarah dan Demokrasi" },
    { id: 3, title: "Level 3: Bhinneka Tunggal Ika di Era Terbuka" },
    { id: 4, title: "Level 4: Kedaulatan & Keutuhan NKRI" },
  ];

  const seniGrade1Levels = [
    { id: 1, title: "Level 1: Seni Rupa - Garis, Warna, & Kolase Alam" },
    { id: 2, title: "Level 2: Seni Musik - Bunyi Alam & Ritme Stabil" },
    { id: 3, title: "Level 3: Seni Tari - Gerak Tubuh & Meniru Alam" },
    { id: 4, title: "Level 4: Seni Teater - Mimik Wajah & Pantomim" },
  ];

  const seniGrade2Levels = [
    { id: 1, title: "Level 1: Seni Rupa - Warna Sekunder & Cap Cetak" },
    { id: 2, title: "Level 2: Seni Musik - Solmisasi & Alat Musik Ritmis" },
    { id: 3, title: "Level 3: Seni Tari - Gerak Maknawi & Aktivitas Harian" },
    { id: 4, title: "Level 4: Seni Teater - Artikulasi & Emosi Dasar" },
  ];

  const seniGrade3Levels = [
    { id: 1, title: "Level 1: Seni Rupa - Gambar Dekoratif & Mozaik" },
    { id: 2, title: "Level 2: Seni Musik - Notasi Angka, Birama, & Unisono" },
    { id: 3, title: "Level 3: Seni Tari - Level Gerak, Dinamika, & Pola Lantai" },
    { id: 4, title: "Level 4: Seni Teater - Dialog Cerita Rakyat & Wayang Kertas" },
  ];

  const seniGrade4Levels = [
    { id: 1, title: "Level 1: Seni Rupa - Gambar Perspektif & Kriya Anyaman" },
    { id: 2, title: "Level 2: Seni Musik - Tangga Nada Diatonis & Pianika" },
    { id: 3, title: "Level 3: Seni Tari - Tari Kreasi Daerah & Properti Tari" },
    { id: 4, title: "Level 4: Seni Teater - Karakterisasi Tokoh & Proyeksi Suara" },
  ];

  const seniGrade5Levels = [
    { id: 1, title: "Level 1: Seni Rupa - Gambar Ilustrasi & Batik Jumputan" },
    { id: 2, title: "Level 2: Seni Musik - Tangga Nada Pentatonis & Musik Tradisi" },
    { id: 3, title: "Level 3: Seni Tari - Tari Kreasi Kepahlawanan & Tata Rias" },
    { id: 4, title: "Level 4: Seni Teater - Naskah Pengalaman & Blocking Panggung" },
  ];

  const seniGrade6Levels = [
    { id: 1, title: "Level 1: Seni Rupa - Poster Persuasif, Arsir, & Seni Patung" },
    { id: 2, title: "Level 2: Seni Musik - Struktur Lagu & Musik Ansambel" },
    { id: 3, title: "Level 3: Seni Tari - Tari Kreasi Utuh & Iringan Tradisi" },
    { id: 4, title: "Level 4: Seni Teater - Manajemen Produksi Pementasan" },
  ];

  const mathLevels = grade === 6 ? grade6Levels : grade === 5 ? grade5Levels : grade === 4 ? grade4Levels : grade === 3 ? grade3Levels : grade === 2 ? grade2Levels : grade1Levels;
  const indoLevels = grade === 6 ? indoGrade6Levels : grade === 5 ? indoGrade5Levels : grade === 4 ? indoGrade4Levels : grade === 3 ? indoGrade3Levels : grade === 2 ? indoGrade2Levels : indoGrade1Levels;
  const englishLevels = grade === 6 ? englishGrade6Levels : grade === 5 ? englishGrade5Levels : grade === 4 ? englishGrade4Levels : grade === 3 ? englishGrade3Levels : grade === 2 ? englishGrade2Levels : englishGrade1Levels;
  const ipasLevels = grade === 6 ? ipasGrade6Levels : grade === 5 ? ipasGrade5Levels : ipasGrade4Levels;
  const pancasilaLevels = grade === 6 ? pancasilaGrade6Levels : grade === 5 ? pancasilaGrade5Levels : grade === 4 ? pancasilaGrade4Levels : grade === 3 ? pancasilaGrade3Levels : grade === 2 ? pancasilaGrade2Levels : pancasilaGrade1Levels;
  const seniLevels = grade === 6 ? seniGrade6Levels : grade === 5 ? seniGrade5Levels : grade === 4 ? seniGrade4Levels : grade === 3 ? seniGrade3Levels : grade === 2 ? seniGrade2Levels : seniGrade1Levels;

  const levels = isSeni ? seniLevels : isPancasila ? pancasilaLevels : isIpas ? ipasLevels : isEnglish ? englishLevels : isIndo ? indoLevels : mathLevels;

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
