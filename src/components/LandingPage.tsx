"use client";

import React from "react";
import { PintaraLogo } from "./PintaraLogo";

interface LandingPageProps {
  onStart: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div 
      className="min-h-screen font-sans text-slate-900 scroll-smooth bg-[#FFF9EE]"
      style={{ backgroundImage: "radial-gradient(#F5DCB0 1.5px, transparent 1.5px)", backgroundSize: "24px 24px" }}
    >
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b-2 border-amber-200/80 bg-white/90 backdrop-blur-md shadow-xs">
        <div className="flex w-full items-center justify-between gap-3 px-5 py-3 md:px-10 xl:px-16">
          <div className="flex items-center space-x-3 shrink-0 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <div className="p-1"><PintaraLogo size="md" /></div>
          </div>
          <nav aria-label="Navigasi utama" className="hidden items-center gap-3 lg:flex">
            <a className="rounded-full px-5 py-2 text-base font-bold text-slate-700 transition-colors duration-200 hover:bg-amber-100/80 hover:text-amber-950" href="#fitur">Fitur Seru</a>
            <a className="rounded-full px-5 py-2 text-base font-bold text-slate-700 transition-colors duration-200 hover:bg-amber-100/80 hover:text-amber-950" href="#petualangan">Petualangan</a>
            <a className="rounded-full px-5 py-2 text-base font-bold text-slate-700 transition-colors duration-200 hover:bg-amber-100/80 hover:text-amber-950" href="#akses">Mulai Main</a>
          </nav>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onStart}
              className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 px-6 py-2.5 rounded-full text-base font-black shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              Masuk Aplikasi
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* HERO SECTION */}
        <section id="top" className="relative overflow-hidden py-12 md:py-20">
          <div className="relative grid w-full grid-cols-1 gap-10 px-5 md:grid-cols-2 md:gap-14 md:px-10 xl:px-16 items-stretch max-w-7xl mx-auto">
            {/* Left Card: Sunshine Yellow Banner */}
            <div className="relative rounded-[36px] bg-gradient-to-br from-[#FFC727] via-[#FFB800] to-[#FFA700] p-8 md:p-14 z-10 border-2 border-amber-300 shadow-xl shadow-amber-900/10 flex flex-col justify-center">
              <span className="mb-6 w-fit inline-block rounded-full bg-white/90 px-5 py-2 text-sm font-black text-amber-950 border border-amber-200 shadow-xs">
                Belajar Seru untuk Anak SD
              </span>
              <h1 className="m-0 text-[clamp(2.4rem,5.5vw,4.2rem)] font-black leading-[1.08] text-slate-950 tracking-tight">
                Belajar seru seperti bermain di kelas yang ceria
              </h1>
              <p className="mt-6 text-lg md:text-xl font-bold leading-relaxed text-slate-950/85">
                PINTARA mengajak teman-teman mengenal dunia lewat cerita, game, dan kelas ajaib. Setiap petualangan dirancang khusus agar mudah dipahami dan sangat seru!
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <button
                  onClick={onStart}
                  className="bg-slate-950 hover:bg-slate-900 text-white px-8 py-4 rounded-full text-lg font-black shadow-lg shadow-slate-950/20 hover:scale-105 transition-all cursor-pointer"
                >
                  Mulai Petualangan
                </button>
              </div>
            </div>
            
            {/* Right Column: Illustration Card */}
            <figure className="relative m-0 flex w-full flex-col justify-center z-10">
              <div className="aspect-[4/3] w-full rounded-[36px] border-2 border-amber-200/80 bg-white flex items-center justify-center shadow-xl shadow-amber-900/5 overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-amber-100/40" />
                {/* Book & Star SVG Illustration */}
                <div className="relative z-10 flex flex-col items-center justify-center p-8 text-center group-hover:scale-105 transition-transform duration-500">
                  <div className="w-28 h-28 rounded-3xl bg-amber-100/90 border border-amber-200 flex items-center justify-center mb-4 shadow-xs">
                    <svg className="w-16 h-16 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900">Ruang Kelas Masa Depan</h3>
                  <p className="text-slate-600 font-medium text-sm mt-1 max-w-xs">Aksesibilitas lengkap untuk semua anak Indonesia</p>
                </div>
              </div>
              <figcaption className="mt-6 mx-auto md:mr-0 inline-block w-fit rounded-full border-2 border-amber-200 bg-white px-6 py-2.5 text-sm md:text-base font-black text-slate-800 shadow-xs">
                Kelas interaktif yang ceria
              </figcaption>
            </figure>
          </div>
        </section>

        {/* FITUR SECTION */}
        <section id="fitur" className="scroll-mt-24 bg-white/70 backdrop-blur-xs py-20 md:py-28 border-y-2 border-amber-200/60">
          <div className="w-full px-5 md:px-10 xl:px-16 max-w-7xl mx-auto">
            <div className="mb-14 max-w-[60ch] md:mb-16">
              <h2 className="m-0 text-[clamp(2.2rem,4vw,3.2rem)] font-black leading-tight text-slate-900 tracking-tight">
                Satu Tempat, Banyak Petualangan
              </h2>
              <p className="mt-3 text-lg md:text-xl font-bold leading-snug text-amber-800">
                PINTARA punya banyak cara seru untuk belajar. Temukan petualangan yang paling cocok buatmu!
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:gap-8 lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="flex flex-col rounded-[32px] bg-white border-2 border-amber-200/80 p-8 transition-transform duration-200 hover:scale-[1.02] hover:-translate-y-1 shadow-sm hover:shadow-md group">
                <div className="h-16 w-16 rounded-2xl bg-amber-100/90 border border-amber-200 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform shadow-xs">
                  <svg className="w-8 h-8 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                </div>
                <h3 className="m-0 text-xl font-black text-slate-900">Kelas Ajaib</h3>
                <p className="m-0 mt-3 text-sm md:text-base font-medium leading-relaxed text-slate-600">
                  Belajar bersama teman-teman dan guru di kelas virtual yang seru. Ada ruang obrolan yang ceria dan asyik!
                </p>
              </div>

              {/* Feature 2 */}
              <div className="flex flex-col rounded-[32px] bg-white border-2 border-amber-200/80 p-8 transition-transform duration-200 hover:scale-[1.02] hover:-translate-y-1 shadow-sm hover:shadow-md group">
                <div className="h-16 w-16 rounded-2xl bg-amber-100/90 border border-amber-200 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform shadow-xs">
                  <svg className="w-8 h-8 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
                </div>
                <h3 className="m-0 text-xl font-black text-slate-900">Perintah Suara</h3>
                <p className="m-0 mt-3 text-sm md:text-base font-medium leading-relaxed text-slate-600">
                  Tinggal bicara, dan PINTARA akan membantumu membuka buku pintar atau mengerjakan tantangan dengan mudah.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="flex flex-col rounded-[32px] bg-white border-2 border-amber-200/80 p-8 transition-transform duration-200 hover:scale-[1.02] hover:-translate-y-1 shadow-sm hover:shadow-md group">
                <div className="h-16 w-16 rounded-2xl bg-amber-100/90 border border-amber-200 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform shadow-xs">
                  <svg className="w-8 h-8 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" /></svg>
                </div>
                <h3 className="m-0 text-xl font-black text-slate-900">Isyarat Tangan</h3>
                <p className="m-0 mt-3 text-sm md:text-base font-medium leading-relaxed text-slate-600">
                  Gunakan kamera untuk mengendalikan layar hanya dengan gerakan jari ajaibmu! Bebas gerak sesukamu.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* AKSES / MULAI SECTION */}
        <section id="akses" className="scroll-mt-24 py-20 md:py-28">
          <div className="w-full px-5 md:px-10 xl:px-16 max-w-7xl mx-auto">
            <div className="relative overflow-hidden rounded-[36px] bg-gradient-to-r from-amber-400 via-amber-400 to-amber-500 border-2 border-amber-300 p-10 md:p-16 shadow-xl shadow-amber-900/10">
              <div className="relative z-10 text-center md:text-left flex flex-col md:flex-row md:items-center justify-between gap-10">
                <div className="max-w-[46ch]">
                  <h2 className="m-0 text-[clamp(2.2rem,4vw,3.2rem)] font-black leading-tight text-slate-950 tracking-tight">
                    Siap Memulai Petualangan?
                  </h2>
                  <p className="mt-4 text-lg md:text-xl font-bold leading-snug text-slate-900/90">
                    Yuk masuk sekarang dan pilih mode yang paling nyaman buatmu. Temukan keseruan belajar yang sesungguhnya!
                  </p>
                </div>
                <div className="shrink-0">
                  <button
                    onClick={onStart}
                    className="bg-slate-950 hover:bg-slate-900 text-white px-10 py-5 rounded-full text-xl font-black shadow-xl shadow-slate-950/20 hover:scale-105 transition-all cursor-pointer"
                  >
                    Ayo Mulai!
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t-2 border-amber-200/80 bg-white py-12">
        <div className="flex w-full flex-col items-center gap-4 px-5 text-center md:px-10 xl:px-16 max-w-5xl mx-auto">
          <div className="flex items-center space-x-3 shrink-0">
            <div className="p-1"><PintaraLogo size="md" /></div>
          </div>
          <p className="m-0 max-w-[70ch] text-base md:text-lg font-medium leading-relaxed text-slate-600">
            PINTARA membantu teman-teman SD belajar dengan ceria dan mandiri. Dilengkapi dengan kontrol suara, isyarat, dan berbagai mode khusus yang ajaib.
          </p>
          <p className="m-0 mt-2 text-sm font-bold text-slate-500">
            © 2026 PINTARA. Seluruh hak cipta dilindungi.
          </p>
        </div>
      </footer>
    </div>
  );
};
