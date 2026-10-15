"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { getActiveSession } from "@/lib/authSession";
import {
  MentalConfig,
  getMentalConfig,
  saveMentalConfig,
  isMentalModeEnabled,
} from "@/lib/mentalAccessibility";
import { playCalmTone, playPopSound } from "@/lib/audioSynthesizer";

type BreathPhase = "inhale" | "hold" | "exhale";

export function MentalControlOverlay() {
  const pathname = usePathname();

  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [config, setConfig] = useState<MentalConfig>(getMentalConfig());
  const [isDocked, setIsDocked] = useState<boolean>(false);
  const [isBreathingOpen, setIsBreathingOpen] = useState<boolean>(false);

  // Posisi kursor (X & Y) serta lebar layar untuk Penggaris Baca & Masker Baca
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 600, y: 300 });
  const [windowWidth, setWindowWidth] = useState<number>(1200);

  // Status Latihan Tarik Napas
  const [breathPhase, setBreathPhase] = useState<BreathPhase>("inhale");
  const [breathCount, setBreathCount] = useState<number>(4);
  const [cyclesCompleted, setCyclesCompleted] = useState<number>(0);

  // 1. Cek Sesi Siswa Aktif (Hanya aktif di dashboard/platform belajar, BUKAN landing page)
  useEffect(() => {
    if (!pathname || pathname === "/") {
      setIsEnabled(false);
      return;
    }

    const session = getActiveSession();
    if (session && session.role !== "guru" && isMentalModeEnabled(session)) {
      setIsEnabled(true);
    } else {
      setIsEnabled(false);
    }

    const handleConfigChange = (e: any) => {
      if (e.detail) {
        setConfig(e.detail);
      } else {
        setConfig(getMentalConfig());
      }
    };

    window.addEventListener("pintara_mental_config_changed", handleConfigChange);
    return () => {
      window.removeEventListener("pintara_mental_config_changed", handleConfigChange);
    };
  }, [pathname]);

  // 2. Terapkan Class Ramah Sensori ke Root Dokumen
  useEffect(() => {
    if (!isEnabled) {
      document.documentElement.classList.remove("a11y-mental-active");
      return;
    }

    document.documentElement.classList.add("a11y-mental-active");

    return () => {
      document.documentElement.classList.remove("a11y-mental-active");
    };
  }, [isEnabled]);

  // 3. Pelacak Kursor (X & Y) & Ukuran Layar untuk Penggaris Baca Komdigi
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize);

    if (!isEnabled || (!config.readingRuler && !config.readingMask)) {
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      let clientX = 0;
      let clientY = 0;
      if ("touches" in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ("clientX" in e) {
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
      }
      if (clientX > 0 || clientY > 0) {
        setMousePos({ x: clientX, y: clientY });
      }
    };

    window.addEventListener("mousemove", handlePointerMove, { passive: true });
    window.addEventListener("touchmove", handlePointerMove, { passive: true });

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("touchmove", handlePointerMove);
    };
  }, [isEnabled, config.readingRuler, config.readingMask]);

  // 4. Mainkan nada harmonik saat fase napas berganti
  useEffect(() => {
    if (!isBreathingOpen) return;
    if (breathPhase === "inhale") {
      playCalmTone(432); // A4 432Hz nada alami rileks
    } else if (breathPhase === "hold") {
      playCalmTone(540); // C#5
    } else if (breathPhase === "exhale") {
      playCalmTone(384); // G4 nada turun lembut
    }
  }, [isBreathingOpen, breathPhase]);

  // 5. Timer Siklus Tarik Napas Tenang (4s Hirup, 2s Tahan, 4s Hembuskan)
  useEffect(() => {
    if (!isBreathingOpen) return;

    const interval = setInterval(() => {
      setBreathCount((prev) => {
        if (prev > 1) {
          return prev - 1;
        }

        if (breathPhase === "inhale") {
          setBreathPhase("hold");
          return 2;
        } else if (breathPhase === "hold") {
          setBreathPhase("exhale");
          return 4;
        } else {
          setBreathPhase("inhale");
          setCyclesCompleted((c) => c + 1);
          return 4;
        }
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isBreathingOpen, breathPhase]);

  // Handler Toggle Penggaris Baca
  const handleToggleRuler = () => {
    const nextState = !config.readingRuler;
    saveMentalConfig({ readingRuler: nextState });
    playPopSound();
  };

  // Handler Toggle Masker Baca
  const handleToggleMask = () => {
    const nextState = !config.readingMask;
    saveMentalConfig({ readingMask: nextState });
    playPopSound();
  };

  // Handler Modal Tarik Napas
  const handleOpenBreathing = () => {
    setBreathPhase("inhale");
    setBreathCount(4);
    setCyclesCompleted(0);
    setIsBreathingOpen(true);
    playPopSound();
  };

  const handleCloseBreathing = () => {
    setIsBreathingOpen(false);
    playPopSound();
  };

  if (!isEnabled || !pathname || pathname === "/") return null;

  // Perhitungan Geometri Penggaris Baca Kontras Tinggi (Persis Komdigi)
  const barWidth = Math.min(840, Math.max(320, windowWidth - 40));
  const barHeight = 16;
  const radius = 8;
  const triWidth = 32;
  const triHeight = 16;

  // Letak horizontal batang penggaris (dipusatkan ke kursor, dibatasi tepi layar)
  const barLeft = Math.max(16, Math.min(windowWidth - barWidth - 16, mousePos.x - barWidth / 2));
  // Posisi horizontal ujung segitiga relatif terhadap batang
  const triX = Math.max(radius + triWidth / 2, Math.min(barWidth - radius - triWidth / 2, mousePos.x - barLeft));

  const rulerPath = `
    M ${radius} 0
    L ${triX - triWidth / 2} 0
    L ${triX} ${-triHeight}
    L ${triX + triWidth / 2} 0
    L ${barWidth - radius} 0
    A ${radius} ${radius} 0 0 1 ${barWidth} ${radius}
    A ${radius} ${radius} 0 0 1 ${barWidth - radius} ${barHeight}
    L ${radius} ${barHeight}
    A ${radius} ${radius} 0 0 1 0 ${radius}
    A ${radius} ${radius} 0 0 1 ${radius} 0
    Z
  `;

  return (
    <>
      {/* 1. PENGGARIS BACA KONTRAS TINGGI PERSIS KOMDIGI (Hitam Pekat, Bingkai Kuning Tebal & Panah Penunjuk Kalimat) */}
      {config.readingRuler && (
        <div
          data-a11y-ignore="true"
          className="fixed top-0 left-0 pointer-events-none z-[9999] transition-transform duration-75 ease-out select-none"
          style={{
            transform: `translate3d(${barLeft}px, ${mousePos.y}px, 0)`,
            filter: "drop-shadow(0 6px 14px rgba(0, 0, 0, 0.6))",
            willChange: "transform",
          }}
        >
          <svg
            width={barWidth + 8}
            height={barHeight + triHeight + 8}
            viewBox={`-4 ${-triHeight - 4} ${barWidth + 8} ${barHeight + triHeight + 8}`}
            style={{ width: `${barWidth + 8}px`, height: `${barHeight + triHeight + 8}px` }}
            className="overflow-visible"
          >
            <path
              d={rulerPath}
              fill="#000000"
              stroke="#FFE500"
              strokeWidth="3.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
        </div>
      )}

      {/* 2. MASKER BACA (READING MASK) - Meredupkan Area Sekitar, Menyisakan Celah Kalimat */}
      {config.readingMask && (
        <div data-a11y-ignore="true" className="pointer-events-none">
          {/* Masker Bagian Atas */}
          <div
            className="fixed top-0 left-0 w-full bg-slate-950/45 z-[9989] transition-[height] duration-75 ease-out pointer-events-none"
            style={{ height: `${Math.max(0, mousePos.y - 45)}px` }}
          />
          {/* Garis Batas Atas Kuning Tebal */}
          <div
            className="fixed left-0 w-full h-[3px] bg-[#FFE500] shadow-sm z-[9989] transition-[top] duration-75 ease-out pointer-events-none"
            style={{ top: `${Math.max(0, mousePos.y - 45)}px` }}
          />

          {/* Garis Batas Bawah Kuning Tebal */}
          <div
            className="fixed left-0 w-full h-[3px] bg-[#FFE500] shadow-sm z-[9989] transition-[top] duration-75 ease-out pointer-events-none"
            style={{ top: `${mousePos.y + 45}px` }}
          />
          {/* Masker Bagian Bawah */}
          <div
            className="fixed left-0 w-full bg-slate-950/45 z-[9989] transition-[top] duration-75 ease-out pointer-events-none"
            style={{
              top: `${mousePos.y + 45}px`,
              bottom: 0,
              height: `calc(100vh - ${mousePos.y + 45}px)`,
            }}
          />
        </div>
      )}

      {/* 3. MODAL PANDUAN TARIK NAPAS (PALET ALAMI PINTARA: TACTILE CLASSROOM, ANTI AI SLOP) */}
      {isBreathingOpen && (
        <div
          data-a11y-ignore="true"
          className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-300"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mental-breathing-title"
        >
          <div className="bg-slate-900 text-white border-2 border-amber-300 rounded-[36px] p-6 md:p-10 max-w-lg w-full shadow-2xl flex flex-col items-center text-center relative">
            {/* Header Badge */}
            <div className="flex items-center gap-2 px-4 py-1.5 bg-amber-400/20 border border-amber-400/40 rounded-full mb-3">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span id="mental-breathing-title" className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                Jeda Pernapasan Tenang
              </span>
            </div>

            <h3 className="text-2xl md:text-3xl font-black text-white leading-tight mb-2">
              Ambil Waktu Sejenak
            </h3>
            <p className="text-xs md:text-sm text-white/80 max-w-sm mb-6 leading-relaxed">
              Bernapas teratur membantu merilekskan otot, meredakan rasa cemas, dan mengembalikan fokus belajar.
            </p>

            {/* Lingkaran Napas */}
            <div className="my-4 relative flex items-center justify-center w-60 h-60">
              {/* Cincin Luar */}
              <div
                className={`absolute inset-0 rounded-full border-4 border-amber-400/30 transition-all duration-[3800ms] ease-in-out ${
                  breathPhase === "inhale"
                    ? "scale-110 bg-amber-400/15"
                    : breathPhase === "hold"
                    ? "scale-105 bg-amber-400/25"
                    : "scale-75 bg-amber-400/5"
                }`}
              />

              {/* Lingkaran Inti */}
              <div
                className={`w-40 h-40 rounded-full border-4 border-amber-300 shadow-xl flex flex-col items-center justify-center transition-all duration-[3800ms] ease-in-out ${
                  breathPhase === "inhale"
                    ? "scale-115 bg-amber-600"
                    : breathPhase === "hold"
                    ? "scale-115 bg-amber-700 ring-8 ring-amber-400/30"
                    : "scale-85 bg-slate-800"
                }`}
              >
                <span className="text-4xl md:text-5xl font-black text-amber-300">
                  {breathCount}
                </span>
                <span className="text-[11px] uppercase font-bold tracking-widest text-white/90 mt-1">
                  {breathPhase === "inhale" && "Tarik Napas"}
                  {breathPhase === "hold" && "Tahan"}
                  {breathPhase === "exhale" && "Hembuskan"}
                </span>
              </div>
            </div>

            {/* Petunjuk Aksi Ramah */}
            <div className="space-y-1 mb-8 mt-2">
              <p className="text-base font-bold text-amber-300">
                {breathPhase === "inhale" && "Tarik napas perlahan melalui hidung..."}
                {breathPhase === "hold" && "Tahan sejenak, rasakan pundak dan lehermu rileks..."}
                {breathPhase === "exhale" && "Hembuskan perlahan melalui mulut dengan tenang..."}
              </p>
              {cyclesCompleted > 0 && (
                <p className="text-xs font-semibold text-white/60 pt-1">
                  Telah menyelesaikan {cyclesCompleted} putaran pernapasan
                </p>
              )}
            </div>

            {/* Tombol Lanjut Belajar */}
            <button
              type="button"
              onClick={handleCloseBreathing}
              className="w-full py-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-base rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer active:translate-y-1"
            >
              Lanjut Belajar
            </button>
          </div>
        </div>
      )}

      {/* 4. FLOATING BILAH PENDAMPING MENTAL (DRAWER GESER HALUS PERSIS KAMERA) */}
      <div
        data-a11y-ignore="true"
        className={`fixed bottom-6 left-0 z-[9998] select-none font-sans flex items-stretch transition-transform duration-500 ease-in-out ${
          isDocked ? "-translate-x-[calc(100%-80px)]" : "translate-x-3 md:translate-x-6"
        }`}
      >
        {/* PANEL MENU UTAMA */}
        <div className="bg-slate-900/95 text-white border-y border-l border-amber-300/40 rounded-l-2xl py-2 px-3.5 flex items-center gap-2.5 backdrop-blur-md shadow-xl shrink-0">
          {/* Label Status Mode */}
          <div className="flex items-center gap-2 pl-1 pr-1">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <div className="flex flex-col whitespace-nowrap">
              <span className="text-[9px] uppercase font-bold text-amber-400 tracking-wider">
                Mode Mental
              </span>
              <span className="text-xs font-bold text-white/95">
                Ramah Sensori
              </span>
            </div>
          </div>

          {/* Area Tombol Aksi Clean & Sederhana */}
          <div className="flex items-center gap-2 border-l border-white/15 pl-2.5">
            {/* Tombol Penggaris Baca */}
            <button
              id="btn-mental-ruler"
              type="button"
              onClick={handleToggleRuler}
              className={`px-3 py-1.5 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5 border whitespace-nowrap active:translate-y-0.5 ${
                config.readingRuler
                  ? "bg-amber-400 text-slate-950 border-amber-400"
                  : "bg-white/10 hover:bg-white/20 text-white/80 border-white/20"
              }`}
              title="Aktifkan penggaris pemandu membaca baris teks"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${config.readingRuler ? "bg-slate-950" : "bg-white/40"}`} />
              <span>Penggaris Baca</span>
            </button>

            {/* Tombol Masker Baca */}
            <button
              id="btn-mental-mask"
              type="button"
              onClick={handleToggleMask}
              className={`px-3 py-1.5 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5 border whitespace-nowrap active:translate-y-0.5 ${
                config.readingMask
                  ? "bg-amber-400 text-slate-950 border-amber-400"
                  : "bg-white/10 hover:bg-white/20 text-white/80 border-white/20"
              }`}
              title="Aktifkan celah sorot untuk membaca 1 baris kalimat"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${config.readingMask ? "bg-slate-950" : "bg-white/40"}`} />
              <span>Masker Baca</span>
            </button>

            {/* Tombol Tarik Napas */}
            <button
              id="btn-mental-breathe"
              type="button"
              onClick={handleOpenBreathing}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 active:bg-white/25 text-white/95 border border-white/20 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs whitespace-nowrap active:translate-y-0.5 flex items-center gap-1.5"
              title="Latihan pernapasan rileks sejenak"
            >
              <svg className="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>Tarik Napas</span>
            </button>
          </div>
        </div>

        {/* TOMBOL HANDLE PENUTUP / PEMBUKA DOCKED KE PINGGIR */}
        <button
          type="button"
          onClick={() => setIsDocked((prev) => !prev)}
          className={`bg-slate-900/95 hover:bg-slate-800 text-amber-300 border border-amber-300/40 border-l-0 rounded-r-2xl shadow-xl flex items-center justify-center cursor-pointer font-bold text-xs tracking-wide shrink-0 transition-all duration-300 backdrop-blur-md active:scale-95 ${
            isDocked ? "w-[80px] px-3 gap-1.5" : "w-[38px] px-2 text-white/70 hover:text-white"
          }`}
          title={isDocked ? "Buka Bilah Bantuan" : "Sembunyikan ke Samping"}
        >
          {isDocked ? (
            <>
              <span>Buka</span>
              <svg className="w-4 h-4 text-amber-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </>
          ) : (
            <svg className="w-4 h-4 text-white/80 hover:text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          )}
        </button>
      </div>
    </>
  );
}
