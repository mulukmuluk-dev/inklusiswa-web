"use client";

import React from "react";
import { PintaraLogo } from "./PintaraLogo";

interface LandingPageProps {
  onStart: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-[#FFFFDB] font-sans text-[#3C632A] scroll-smooth">
      {/* HEADER (Bright Orange/Yellow) */}
      <header className="sticky top-0 z-50 border-b-4 border-[#3C632A] bg-[#FFBA48]">
        <div className="flex w-full items-center justify-between gap-3 px-5 py-3 md:px-10 xl:px-16">
          <div className="flex items-center space-x-3 shrink-0 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
            {/* Logo transparent so it shows #FFBA48 */}
            <div className="p-1"><PintaraLogo size="md" /></div>
          </div>
          <nav aria-label="Navigasi utama" className="hidden items-center gap-2 lg:flex">
            <a className="rounded-full px-4 py-1.5 text-[24px] font-black text-[#3C632A] transition-colors duration-200 hover:bg-[#3C632A] hover:text-[#FFFFDB]" href="#fitur">Fitur Seru</a>
            <a className="rounded-full px-4 py-1.5 text-[24px] font-black text-[#3C632A] transition-colors duration-200 hover:bg-[#3C632A] hover:text-[#FFFFDB]" href="#petualangan">Petualangan</a>
            <a className="rounded-full px-4 py-1.5 text-[24px] font-black text-[#3C632A] transition-colors duration-200 hover:bg-[#3C632A] hover:text-[#FFFFDB]" href="#akses">Mulai Main</a>
          </nav>
          <div className="flex items-center gap-2">
            <a
              href="#akses"
              className="group relative inline-block min-h-[50px] overflow-hidden rounded-full border-4 border-[#3C632A] bg-[#FF784E] px-[24px] py-[6px] text-center text-[24px] font-black text-[#FFFFDB] transition-colors duration-300 shadow-[4px_4px_0px_0px_#3C632A]"
            >
              <span className="relative z-10">Masuk Aplikasi</span>
              <span className="absolute inset-0 z-0 w-0 rounded-full bg-[#3C632A] transition-all duration-300 group-hover:w-full"></span>
            </a>
          </div>
        </div>
      </header>

      <main>
        {/* HERO SECTION (Blackboard Background) */}
        <section 
          id="top" 
          className="relative overflow-hidden bg-cover bg-center bg-no-repeat bg-[#73B14C]"
          style={{ backgroundImage: "url('/images/blackboard_bg.png')" }}
        >
          {/* Overlay for better readability */}
          <div className="absolute inset-0 bg-black/10 pointer-events-none"></div>
          
          <div className="relative grid w-full grid-cols-1 gap-10 px-5 py-16 md:grid-cols-2 md:gap-14 md:px-10 md:py-28 xl:px-16 items-stretch">
            {/* Left Card: Vibrant Yellow (Like Header) */}
            <div className="relative rounded-[28px] bg-[#FFBA48] p-8 md:p-12 z-10 border-4 border-[#3C632A] shadow-[8px_8px_0px_0px_#3C632A] flex flex-col justify-center">
              <p className="mb-6 w-fit inline-block rounded-full bg-white px-5 py-2 text-[19px] font-black text-[#FF784E] border-4 border-[#3C632A] shadow-[4px_4px_0px_0px_#3C632A]">
                Belajar Seru untuk Anak SD
              </p>
              <h1 className="m-0 text-[clamp(2.8rem,7vw,5rem)] font-black leading-[1.05] text-[#3C632A]">
                Belajar seru seperti bermain di kelas yang ceria
              </h1>
              <p className="mt-6 text-[22px] font-bold leading-relaxed text-[#3C632A]">
                PINTARA mengajak teman-teman mengenal dunia lewat cerita, game, dan kelas ajaib. Setiap petualangan dirancang khusus agar mudah dipahami dan sangat seru!
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <button
                  onClick={onStart}
                  className="group relative inline-block min-h-[56px] overflow-hidden rounded-full border-4 border-[#3C632A] bg-white px-[36px] py-[14px] text-center text-[22px] font-black transition-colors duration-300 text-[#3C632A] hover:text-white shadow-[6px_6px_0px_0px_#3C632A]"
                >
                  <span className="relative z-10">Mulai Petualangan</span>
                  <span className="absolute inset-0 z-0 w-0 rounded-full bg-[#73B14C] transition-all duration-300 group-hover:w-full"></span>
                </button>
              </div>
            </div>
            
            {/* Right Column: Illustration Frame */}
            <figure className="relative m-0 flex w-full flex-col justify-center z-10">
              <div className="aspect-[4/3] w-full rounded-[28px] border-4 border-[#3C632A] bg-[#FFFFDB] flex items-center justify-center shadow-[12px_12px_0px_0px_#3C632A] overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#FFE296]/60 to-[#FFBA48]/60" />
                {/* Fun SVG Illustration for kids */}
                <svg className="w-56 h-56 text-[#FF5685] z-10 group-hover:scale-110 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <figcaption className="mt-6 mx-auto md:mr-0 inline-block w-fit rounded-full border-4 border-[#3C632A] bg-[#FFBA48] px-6 py-3 text-[20px] font-black text-[#3C632A] shadow-[6px_6px_0px_0px_#3C632A] rotate-2">
                Kelas interaktif yang ceria
              </figcaption>
            </figure>
          </div>
        </section>

        {/* FITUR SECTION */}
        <section id="fitur" className="scroll-mt-24 bg-[#FFFFDB] py-20 md:py-32 border-b-4 border-[#3C632A]">
          <div className="w-full px-5 md:px-10 xl:px-16">
            <div className="mb-14 max-w-[60ch] md:mb-20">
              <h2 className="m-0 text-[clamp(2.2rem,4vw,3.2rem)] font-black leading-tight text-[#3C632A]">
                Satu Tempat, Banyak Petualangan
              </h2>
              <p className="mt-4 text-[22px] font-bold leading-snug text-[#FF784E]">
                PINTARA punya banyak cara seru untuk belajar. Temukan petualangan yang paling cocok buatmu!
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:gap-10 lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="flex flex-col rounded-[24px] bg-[#FFE296] border-4 border-[#3C632A] p-8 transition-transform duration-200 hover:scale-[1.02] hover:-translate-y-2 shadow-[8px_8px_0px_0px_#3C632A] group">
                <div className="h-20 w-20 rounded-2xl bg-[#FF5685] border-4 border-[#3C632A] flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform shadow-[4px_4px_0px_0px_#3C632A]">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                </div>
                <h3 className="m-0 text-[1.6rem] font-black text-[#3C632A]">Kelas Ajaib</h3>
                <p className="m-0 mt-3 text-[19px] font-bold leading-relaxed text-[#3C632A]">
                  Belajar bersama teman-teman dan guru di kelas virtual yang seru. Ada ruang obrolan yang ceria dan asyik!
                </p>
              </div>

              {/* Feature 2 */}
              <div className="flex flex-col rounded-[24px] bg-[#FFE296] border-4 border-[#3C632A] p-8 transition-transform duration-200 hover:scale-[1.02] hover:-translate-y-2 shadow-[8px_8px_0px_0px_#3C632A] group">
                <div className="h-20 w-20 rounded-2xl bg-[#FFBA48] border-4 border-[#3C632A] flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform shadow-[4px_4px_0px_0px_#3C632A]">
                  <svg className="w-10 h-10 text-[#3C632A]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
                </div>
                <h3 className="m-0 text-[1.6rem] font-black text-[#3C632A]">Perintah Suara</h3>
                <p className="m-0 mt-3 text-[19px] font-bold leading-relaxed text-[#3C632A]">
                  Tinggal bicara, dan PINTARA akan membantumu membuka buku pintar atau mengerjakan tantangan dengan mudah.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="flex flex-col rounded-[24px] bg-[#FFE296] border-4 border-[#3C632A] p-8 transition-transform duration-200 hover:scale-[1.02] hover:-translate-y-2 shadow-[8px_8px_0px_0px_#3C632A] group">
                <div className="h-20 w-20 rounded-2xl bg-[#73B14C] border-4 border-[#3C632A] flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform shadow-[4px_4px_0px_0px_#3C632A]">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" /></svg>
                </div>
                <h3 className="m-0 text-[1.6rem] font-black text-[#3C632A]">Isyarat Tangan</h3>
                <p className="m-0 mt-3 text-[19px] font-bold leading-relaxed text-[#3C632A]">
                  Gunakan kamera untuk mengendalikan layar hanya dengan gerakan jari ajaibmu! Bebas gerak sesukamu.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* AKSES / MULAI SECTION */}
        <section id="akses" className="scroll-mt-24 bg-[#73B14C] py-20 md:py-32">
          <div className="w-full px-5 md:px-10 xl:px-16">
            <div className="relative overflow-hidden rounded-[32px] bg-[#FFE296] border-4 border-[#3C632A] p-10 md:p-16 shadow-[12px_12px_0px_0px_#3C632A]">
              <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/40"></div>
              <div className="relative z-10 text-center md:text-left flex flex-col md:flex-row md:items-center justify-between gap-10">
                <div className="max-w-[46ch]">
                  <h2 className="m-0 text-[clamp(2.2rem,4vw,3.2rem)] font-black leading-tight text-[#3C632A]">
                    Siap Memulai Petualangan?
                  </h2>
                  <p className="mt-4 text-[22px] font-bold leading-snug text-[#FF784E]">
                    Yuk masuk sekarang dan pilih mode yang paling nyaman buatmu. Temukan keseruan belajar yang sesungguhnya!
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <button
                    onClick={onStart}
                    className="group relative inline-block min-h-[64px] cursor-pointer overflow-hidden rounded-full border-4 border-[#3C632A] bg-white px-[42px] py-[16px] text-center text-[24px] font-black text-[#3C632A] transition-colors duration-300 hover:text-white shadow-[6px_6px_0px_0px_#3C632A]"
                  >
                    <span className="relative z-[2]">Ayo Mulai!</span>
                    <span className="absolute inset-0 z-0 w-0 rounded-full bg-[#FF5685] transition-all duration-300 group-hover:w-full"></span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t-4 border-[#3C632A] bg-[#FFBA48] py-12">
        <div className="flex w-full flex-col items-center gap-6 px-5 text-center md:px-10 xl:px-16">
          {/* Logo transparent so it shows #FFBA48 */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="p-1"><PintaraLogo size="md" /></div>
          </div>
          <p className="m-0 max-w-[70ch] text-[22px] font-bold leading-relaxed text-[#3C632A]">
            PINTARA membantu teman-teman SD belajar dengan ceria dan mandiri. Dilengkapi dengan kontrol suara, isyarat, dan berbagai mode khusus yang ajaib.
          </p>
          <p className="m-0 mt-2 text-[20px] font-black text-[#3C632A]">
            © 2026 PINTARA
          </p>
        </div>
      </footer>
    </div>
  );
};
