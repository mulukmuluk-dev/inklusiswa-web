"use client";

import React, { use } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function SubjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const subjectId = resolvedParams.id;
  const kelasParam = searchParams.get("kelas") || "";

  const subjectTitles: Record<string, string> = {
    matematika: "Matematika",
    indonesia: "Bahasa Indonesia",
    inggris: "Bahasa Inggris",
    biologi: "Biologi",
    kimia: "Kimia",
    fisika: "Fisika",
    ekonomi: "Ekonomi",
    sosiologi: "Sosiologi",
    geografi: "Geografi",
    sejarah: "Sejarah",
    pkn: "PKN",
    "cerdas-memilih": "Yuk, Cerdas Memilih!",
  };

  const baseTitle = subjectTitles[subjectId] || subjectId.toUpperCase();
  const title = kelasParam ? `${baseTitle} - ${kelasParam}` : baseTitle;

  return (
    <div 
      className="min-h-screen bg-[#0D9488] bg-cover bg-center bg-no-repeat bg-fixed font-sans text-white relative flex flex-col p-6 overflow-x-hidden"
      style={{ backgroundImage: "url('/images/blackboard_bg.png')" }}
    >
      {/* Tombol Kembali (Panah Kecil Kuning) */}
      <button
        onClick={() => router.back()}
        data-voice-command="kembali"
        className="absolute top-8 left-8 text-[#FFDF59] hover:scale-110 transition-transform flex items-center justify-center p-2 z-50"
        title="Kembali"
      >
        <svg className="w-10 h-10 drop-shadow-md" fill="currentColor" viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
      </button>

      {/* Title Header */}
      <div className="w-full text-center mt-4 mb-8">
         <h1 className="text-3xl md:text-4xl font-black text-[#C3631D] tracking-widest drop-shadow-sm uppercase">
           Materi: {baseTitle}
         </h1>
      </div>

      {/* Main Split Content Area */}
      <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto w-full h-[calc(100vh-140px)]">
        
        {/* LEFT PANEL (Dark Brown) */}
        <div className="w-full lg:w-1/3 bg-[#5D3A1A] rounded-[32px] p-8 flex flex-col shadow-xl">
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <div className="flex flex-col items-center mb-8">
              <div className="w-20 h-20 bg-[#FFDF59]/20 rounded-3xl flex items-center justify-center mb-4 border-4 border-[#FFDF59]">
                <svg className="w-10 h-10 text-[#FFDF59]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72l5 2.73 5-2.73v3.72z"/></svg>
              </div>
              <h2 className="text-2xl font-black text-white text-center">Daftar Bab</h2>
              <p className="text-[#FFDF59] font-bold text-center text-sm mt-2">{kelasParam || "Materi Umum"}</p>
            </div>

            <div className="space-y-4">
              {["1. Konsep Dasar & Teori", "2. Pengenalan Rumus", "3. Latihan Mandiri"].map((chapter, idx) => (
                <button
                  key={idx}
                  className={`w-full text-left p-4 rounded-2xl font-bold transition-all border-4 ${idx === 0 ? "bg-[#C3631D] border-[#FFDF59] text-white" : "bg-white/10 border-transparent text-white/80 hover:bg-white/20"}`}
                >
                  {chapter}
                </button>
              ))}
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t-2 border-white/10">
             <button className="w-full py-4 bg-[#FFDF59] hover:bg-[#FFE296] text-[#5D3A1A] font-black rounded-2xl transition-all shadow-[4px_4px_0px_0px_#C3631D]">
                Mulai Ujian 🚀
             </button>
          </div>
        </div>

        {/* RIGHT PANEL (Burnt Orange) */}
        <div className="flex-1 bg-[#C3631D] rounded-[32px] p-8 shadow-xl flex flex-col relative overflow-hidden">
           <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar text-white">
             <h2 className="text-3xl font-black text-[#FFDF59] mb-6 border-b-4 border-[#FFDF59]/30 pb-4 inline-block">
               Bab 1: Konsep Dasar & Pemahaman Inti {baseTitle}
             </h2>
             
             <div className="space-y-6 text-lg font-bold leading-relaxed">
               <p>
                 Selamat datang di kelas digital aksesibel untuk mata pelajaran <span className="text-[#FFDF59] underline decoration-4 underline-offset-4">{baseTitle}</span>. 
                 Halaman ini dipandu penuh oleh kontrol suara (STT) dan pembaca layar otomatis (TTS).
               </p>
               
               <div className="bg-[#5D3A1A]/40 p-6 rounded-2xl border-4 border-[#5D3A1A]/50">
                 <h3 className="text-xl font-black text-[#FFDF59] mb-3">Rangkuman Pembelajaran</h3>
                 <p className="text-white/90">
                   Pada bab ini, kamu akan mempelajari prinsip-prinsip dasar {title} yang dirancang khusus dengan metode visual, audio earcons, dan pengoperasian adaptif.
                 </p>
                 <p className="mt-4 text-white/90">
                   Ucapkan perintah <span className="bg-[#FFDF59] text-[#5D3A1A] px-3 py-1 rounded-xl mx-1 shadow-sm">baca</span> untuk mendengarkan seluruh isi rangkuman ini dibacakan oleh asisten suara. Ucapkan <span className="bg-[#FFDF59] text-[#5D3A1A] px-3 py-1 rounded-xl mx-1 shadow-sm">kembali</span> untuk kembali.
                 </p>
               </div>

               <p>
                 Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in dui mauris. Vivamus hendrerit arcu sed erat molestie vehicula. Sed auctor neque eu tellus rhoncus ut eleifend nibh porttitor. Ut in nulla enim. Phasellus molestie magna non est bibendum non venenatis nisl tempor.
               </p>
               <p>
                 Suspendisse dictum feugiat nisl ut dapibus. Mauris iaculis porttitor posuere. Praesent id metus massa, ut blandit odio. Proin quis tortor orci. Etiam at risus et justo dignissim congue.
               </p>
             </div>
           </div>
        </div>

      </div>
    </div>
  );
}
