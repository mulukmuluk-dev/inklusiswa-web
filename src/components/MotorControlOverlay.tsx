"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { getActiveSession } from "@/lib/authSession";
import { isEyeControlEnabled } from "@/lib/accessibility";
import {
  MotoricConfig,
  MotoricSubMode,
  getMotoricConfig,
  saveMotoricConfig,
  isMotorControlEnabled,
  playMotoricSound,
} from "@/lib/motoricAccessibility";

interface HoldProgressState {
  active: boolean;
  x: number;
  y: number;
  progress: number;
  target: HTMLElement | null;
}

export function MotorControlOverlay() {
  const pathname = usePathname();

  // State Aktivasi & Konfigurasi
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [config, setConfig] = useState<MotoricConfig>(getMotoricConfig());
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  // State untuk Single-Switch Auto-Scanning
  const [scanIndex, setScanIndex] = useState<number>(0);
  const currentScannedOptionRef = useRef<HTMLElement | null>(null);
  const validTargetsRef = useRef<HTMLElement[]>([]);
  const lastSwitchActionTimeRef = useRef<number>(0);

  // State untuk Tremor Hold-to-Confirm
  const [holdState, setHoldState] = useState<HoldProgressState>({
    active: false,
    x: 0,
    y: 0,
    progress: 0,
    target: null,
  });
  const holdStartTimeRef = useRef<number | null>(null);
  const holdAnimFrameRef = useRef<number | null>(null);
  const holdTargetRef = useRef<HTMLElement | null>(null);
  const isTriggeringClickRef = useRef<boolean>(false);
  const lastConfirmTimeRef = useRef<number>(0);
  const multiTouchActiveRef = useRef<boolean>(false);

  // 1. Sinkronisasi Status Aktivasi Sesi Siswa
  useEffect(() => {
    const session = getActiveSession();
    // Jangan aktif jika role guru atau jika kontrol mata sedang aktif
    if (session && session.role !== "guru" && !isEyeControlEnabled(session)) {
      if (isMotorControlEnabled(session)) {
        setIsEnabled(true);
      } else {
        setIsEnabled(false);
      }
    } else {
      setIsEnabled(false);
    }

    const handleConfigChange = (e: any) => {
      if (e.detail) {
        setConfig(e.detail);
      } else {
        setConfig(getMotoricConfig());
      }
    };

    window.addEventListener("pintara_motoric_config_changed", handleConfigChange);
    return () => {
      window.removeEventListener("pintara_motoric_config_changed", handleConfigChange);
    };
  }, [pathname]);

  // 2. Terapkan Style Basis Motorik & Palm Rejection ke Dokumen
  useEffect(() => {
    if (!isEnabled) {
      document.documentElement.classList.remove("a11y-motoric-active");
      return;
    }

    document.documentElement.classList.add("a11y-motoric-active");

    // Filter sentuhan telapak tangan (Multi-Touch Filter)
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        multiTouchActiveRef.current = true;
        cancelHoldProgress();
      } else {
        multiTouchActiveRef.current = false;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length <= 1) {
        multiTouchActiveRef.current = false;
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("touchcancel", handleTouchEnd, { passive: true });

    return () => {
      document.documentElement.classList.remove("a11y-motoric-active");
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [isEnabled]);

  // Helper Pembersih Highlight Visual Scan
  const clearHighlights = useCallback(() => {
    try {
      document.querySelectorAll("[data-motor-scanned]").forEach((el) => {
        el.removeAttribute("data-motor-scanned");
        el.classList.remove(
          "ring-8",
          "ring-6",
          "ring-[#FFBA48]",
          "ring-[#73B14C]",
          "scale-[1.03]",
          "scale-105",
          "shadow-[0_0_30px_rgba(255,186,72,0.85)]",
          "drop-shadow-[0_0_25px_rgba(255,186,72,1)]"
        );
      });
    } catch {
      // Safe fallback
    }
    currentScannedOptionRef.current = null;
  }, []);

  const isTargetVisible = (el: HTMLElement | null): boolean => {
    if (!el) return false;
    if (el.closest("[data-a11y-ignore]")) return false;
    if (el.closest(".hidden")) return false;
    if (el.hasAttribute("disabled")) return false;
    if (el.style.display === "none" || el.style.visibility === "hidden") return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 10 && rect.height > 10;
  };

  // 3. Mesin Koleksi Elemen Target untuk Single-Switch Auto-Scanning
  const collectCandidateTargets = useCallback((): HTMLElement[] => {
    if (typeof window === "undefined") return [];

    // Prioritas 1: Ujian / Latihan Soal Aktif
    const quizButtons = Array.from(
      document.querySelectorAll(
        "[data-quiz-option], [id^='exam-opt-'], [id^='latihan-opt-'], [data-switch-target]"
      )
    ).filter((el) => isTargetVisible(el as HTMLElement)) as HTMLElement[];

    const submitOrNextBtn = (
      document.getElementById("btn-exam-next") ||
      document.getElementById("btn-exam-submit") ||
      document.getElementById("btn-submit-latihan")
    ) as HTMLElement | null;

    if (quizButtons.length > 0) {
      return [...quizButtons, ...(submitOrNextBtn && isTargetVisible(submitOrNextBtn) ? [submitOrNextBtn] : [])];
    }

    // Prioritas 2: Modal Flashcard
    const flashcardClose = document.getElementById("btn-flashcard-close");
    if (isTargetVisible(flashcardClose)) {
      const flipBtn = document.getElementById("btn-flashcard-flip");
      const nextBtn = document.getElementById("btn-flashcard-next");
      const prevBtn = document.getElementById("btn-flashcard-prev");
      return [
        ...(flipBtn && isTargetVisible(flipBtn) ? [flipBtn] : []),
        ...(nextBtn && isTargetVisible(nextBtn) ? [nextBtn] : []),
        ...(prevBtn && isTargetVisible(prevBtn) ? [prevBtn] : []),
        flashcardClose!,
      ];
    }

    // Prioritas 3: Konten Belajar & Dashboard Utama
    const mainActionButtons = Array.from(
      document.querySelectorAll(
        "main button:not([disabled]), [data-dashboard-area='mapel'], [data-gaze-role='start-game']"
      )
    ).filter((el) => {
      const h = el as HTMLElement;
      if (h.closest("[data-a11y-ignore]")) return false;
      return isTargetVisible(h);
    }) as HTMLElement[];

    // Sidebar Navigasi Siswa
    const sidebarButtons = [
      document.getElementById("btn-back-home"),
      document.getElementById("sidebar-btn-sub-kelas"),
      document.getElementById("sidebar-btn-kelas"),
      document.getElementById("sidebar-btn-katalog"),
    ].filter((b) => isTargetVisible(b)) as HTMLElement[];

    return [...sidebarButtons, ...mainActionButtons];
  }, []);

  // 4. Loop Auto-Scanning Interval (Sub-Mode: single_switch)
  useEffect(() => {
    if (!isEnabled || config.subMode !== "single_switch" || isPaused) {
      clearHighlights();
      return;
    }

    const timer = setInterval(() => {
      const candidates = collectCandidateTargets();
      validTargetsRef.current = candidates;

      if (candidates.length === 0) {
        clearHighlights();
        return;
      }

      setScanIndex((prevIdx) => {
        const nextIdx = (prevIdx + 1) % candidates.length;
        const target = candidates[nextIdx];

        if (target) {
          clearHighlights();
          target.setAttribute("data-motor-scanned", "true");
          target.classList.add(
            "ring-6",
            "ring-[#FFBA48]",
            "scale-[1.03]",
            "shadow-[0_0_30px_rgba(255,186,72,0.85)]",
            "transition-all",
            "duration-200"
          );
          currentScannedOptionRef.current = target;

          // Scroll halus ke tengah
          target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });

          if (config.soundFeedback) {
            playMotoricSound("tick");
          }
        }

        return nextIdx;
      });
    }, config.scanIntervalMs);

    return () => {
      clearInterval(timer);
    };
  }, [isEnabled, config.subMode, config.scanIntervalMs, config.soundFeedback, isPaused, collectCandidateTargets, clearHighlights]);

  // Eksekusi Pilihan pada Elemen yang Sedang Di-scan
  const triggerCurrentScanSelection = useCallback(() => {
    const now = Date.now();
    // Debounce agar tidak terpukul ganda dalam 450ms
    if (now - lastSwitchActionTimeRef.current < 450) return;
    lastSwitchActionTimeRef.current = now;

    const current = currentScannedOptionRef.current;
    if (!current || !current.isConnected) return;

    if (config.soundFeedback) {
      playMotoricSound("confirm");
    }

    // Flash hijau untuk konfirmasi visual
    current.classList.remove("ring-[#FFBA48]");
    current.classList.add("ring-[#73B14C]", "scale-105");

    setTimeout(() => {
      if (current.isConnected) {
        current.classList.remove("ring-[#73B14C]", "scale-105");
        current.classList.add("ring-[#FFBA48]", "scale-[1.03]");
      }
    }, 350);

    // Jalankan klik langsung
    isTriggeringClickRef.current = true;
    current.click();
    setTimeout(() => {
      isTriggeringClickRef.current = false;
    }, 100);
  }, [config.soundFeedback]);

  // 5. Listener Single-Switch: Spacebar / Enter & One-Tap Layar Penuh
  useEffect(() => {
    if (!isEnabled || config.subMode !== "single_switch" || isPaused) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Abaikan jika fokus sedang berada pada input teks atau textarea
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === "input" || activeTag === "textarea") return;

      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        triggerCurrentScanSelection();
      }
    };

    const handleGlobalPointerDown = (e: PointerEvent) => {
      // Abaikan klik yang berasal dari Floating Controller
      const targetEl = e.target as HTMLElement | null;
      if (targetEl?.closest("[data-a11y-ignore]")) return;

      // Cegah aksi bawaan jika sistem sedang di-drive oleh One-Tap Switch
      if (isTriggeringClickRef.current) return;

      e.preventDefault();
      e.stopPropagation();
      triggerCurrentScanSelection();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("pointerdown", handleGlobalPointerDown, { capture: true });

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("pointerdown", handleGlobalPointerDown, { capture: true });
    };
  }, [isEnabled, config.subMode, isPaused, triggerCurrentScanSelection]);

  // 6. Logika Tremor Filter: Hold-to-Confirm dengan Radial Progress
  const cancelHoldProgress = useCallback(() => {
    if (holdAnimFrameRef.current) {
      cancelAnimationFrame(holdAnimFrameRef.current);
      holdAnimFrameRef.current = null;
    }
    holdStartTimeRef.current = null;
    holdTargetRef.current = null;
    setHoldState({
      active: false,
      x: 0,
      y: 0,
      progress: 0,
      target: null,
    });
  }, []);

  useEffect(() => {
    if (!isEnabled || config.subMode !== "tremor_filter") {
      cancelHoldProgress();
      return;
    }

    const isInteractiveElement = (el: HTMLElement | null): HTMLElement | null => {
      if (!el) return null;
      if (el.closest("[data-a11y-ignore]")) return null;

      const interactive = el.closest(
        "button, a, [role='button'], [data-quiz-option], [data-dashboard-area='mapel'], [data-switch-target]"
      ) as HTMLElement | null;

      if (interactive && !interactive.hasAttribute("disabled")) {
        return interactive;
      }
      return null;
    };

    const handlePointerDown = (e: PointerEvent) => {
      // Abaikan jika sedang terdeteksi multi-touch telapak tangan
      if (multiTouchActiveRef.current) return;

      // Jika klik dipicu oleh programatis setelah hold sukses, izinkan lewat
      if (isTriggeringClickRef.current) return;

      const targetEl = e.target as HTMLElement | null;
      const interactive = isInteractiveElement(targetEl);
      if (!interactive) return;

      // Tahan aksi langsung
      e.preventDefault();
      e.stopPropagation();

      const startTime = performance.now();
      holdStartTimeRef.current = startTime;
      holdTargetRef.current = interactive;

      const posX = e.clientX;
      const posY = e.clientY;

      setHoldState({
        active: true,
        x: posX,
        y: posY,
        progress: 0,
        target: interactive,
      });

      const updateProgress = (now: number) => {
        if (!holdStartTimeRef.current || holdTargetRef.current !== interactive) return;

        const elapsed = now - holdStartTimeRef.current;
        const currentProgress = Math.min(100, (elapsed / config.holdDurationMs) * 100);

        setHoldState((prev) => ({
          ...prev,
          progress: currentProgress,
        }));

        if (elapsed >= config.holdDurationMs) {
          // Konfirmasi Berhasil
          if (config.soundFeedback) {
            playMotoricSound("confirm");
          }

          lastConfirmTimeRef.current = Date.now();
          cancelHoldProgress();

          // Picu klik aman
          isTriggeringClickRef.current = true;
          interactive.click();
          setTimeout(() => {
            isTriggeringClickRef.current = false;
          }, 350);
        } else {
          holdAnimFrameRef.current = requestAnimationFrame(updateProgress);
        }
      };

      holdAnimFrameRef.current = requestAnimationFrame(updateProgress);
    };

    const handlePointerUpOrCancel = (e: PointerEvent) => {
      if (isTriggeringClickRef.current) return;

      if (holdStartTimeRef.current) {
        const elapsed = performance.now() - holdStartTimeRef.current;
        if (elapsed < config.holdDurationMs && holdState.active) {
          // Sentuhan terlepas sebelum waktu hold terpenuhi: Batalkan
          if (config.soundFeedback && elapsed > 100) {
            playMotoricSound("cancel");
          }
        }
      }
      cancelHoldProgress();
    };

    window.addEventListener("pointerdown", handlePointerDown, { capture: true });
    window.addEventListener("pointerup", handlePointerUpOrCancel, { capture: true });
    window.addEventListener("pointercancel", handlePointerUpOrCancel, { capture: true });

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown, { capture: true });
      window.removeEventListener("pointerup", handlePointerUpOrCancel, { capture: true });
      window.removeEventListener("pointercancel", handlePointerUpOrCancel, { capture: true });
      cancelHoldProgress();
    };
  }, [isEnabled, config.subMode, config.holdDurationMs, config.soundFeedback, cancelHoldProgress, holdState.active]);

  // Handler Ganti Sub-Mode
  const switchSubMode = (newMode: MotoricSubMode) => {
    clearHighlights();
    cancelHoldProgress();
    const updated = saveMotoricConfig({ subMode: newMode });
    setConfig(updated);
  };

  // Handler Kecepatan Scan
  const cycleScanSpeed = () => {
    const speeds = [1500, 2000, 3000];
    const currentIdx = speeds.indexOf(config.scanIntervalMs);
    const nextSpeed = speeds[(currentIdx + 1) % speeds.length];
    const updated = saveMotoricConfig({ scanIntervalMs: nextSpeed });
    setConfig(updated);
  };

  // Handler Durasi Hold Tremor
  const cycleHoldDuration = () => {
    const durations = [350, 450, 650];
    const currentIdx = durations.indexOf(config.holdDurationMs);
    const nextDuration = durations[(currentIdx + 1) % durations.length];
    const updated = saveMotoricConfig({ holdDurationMs: nextDuration });
    setConfig(updated);
  };

  // Handler Toggle Suara
  const toggleSound = () => {
    const updated = saveMotoricConfig({ soundFeedback: !config.soundFeedback });
    setConfig(updated);
  };

  if (!isEnabled) return null;

  return (
    <>
      {/* 1. Indikator Radial Progress Animasi saat Menahan Sentuhan (Hold-to-Confirm) */}
      {holdState.active && (
        <div
          data-a11y-ignore="true"
          className="fixed pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${holdState.x}px`, top: `${holdState.y}px` }}
        >
          <div className="relative w-16 h-16 flex items-center justify-center bg-[#5D3A1A]/80 backdrop-blur-sm rounded-full shadow-2xl border-2 border-white/60">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 50 50">
              <circle
                cx="25"
                cy="25"
                r="20"
                fill="none"
                stroke="rgba(255, 255, 255, 0.25)"
                strokeWidth="5"
              />
              <circle
                cx="25"
                cy="25"
                r="20"
                fill="none"
                stroke="#FFDF59"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={125.66}
                strokeDashoffset={125.66 - (125.66 * holdState.progress) / 100}
                className="transition-all duration-75"
              />
            </svg>
            <span className="absolute font-black text-xs text-white tracking-wider">
              {Math.round(holdState.progress)}%
            </span>
          </div>
        </div>
      )}

      {/* 2. Floating Controller Bar (Dapat Diminimalkan, Bebas Emoji, Kontrol Mandiri Siswa/Guru) */}
      <div
        data-a11y-ignore="true"
        className="fixed bottom-6 left-6 z-[9998] select-none font-sans"
      >
        <div className="bg-[#3C632A] text-white border-2 border-[#FFDF59] shadow-[0_8px_24px_rgba(0,0,0,0.25)] rounded-2xl p-2.5 flex items-center gap-3 backdrop-blur-md">
          {/* Status Label & Icon Mode */}
          <div className="flex items-center gap-2 pl-2">
            <div className="w-3 h-3 rounded-full bg-[#73B14C] animate-pulse" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-[#FFDF59] tracking-wider">
                Motorik Adaptif
              </span>
              <span className="text-xs font-black">
                {config.subMode === "tremor_filter" && "Anti-Tremor (Tahan)"}
                {config.subMode === "single_switch" && "Sakelar Tunggal"}
                {config.subMode === "standar_besar" && "Target Besar"}
              </span>
            </div>
          </div>

          {!isMinimized && (
            <div className="flex items-center gap-1.5 border-l border-white/20 pl-3">
              {/* Tombol Pindah Sub-Mode */}
              <button
                type="button"
                onClick={() => {
                  if (config.subMode === "tremor_filter") switchSubMode("single_switch");
                  else if (config.subMode === "single_switch") switchSubMode("standar_besar");
                  else switchSubMode("tremor_filter");
                }}
                className="px-2.5 py-1.5 bg-[#FFBA48] hover:bg-[#FFDF59] text-[#5D3A1A] font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-sm"
                title="Ganti Mode Motorik"
              >
                Ganti Mode
              </button>

              {/* Kontrol Khusus Sakelar Tunggal: Pause & Kecepatan */}
              {config.subMode === "single_switch" && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsPaused((prev) => !prev)}
                    className={`px-2.5 py-1.5 font-black text-xs rounded-xl transition-all cursor-pointer ${
                      isPaused
                        ? "bg-[#E6004C] hover:bg-[#CC0043] text-white"
                        : "bg-[#73B14C] hover:bg-[#5E943D] text-white"
                    }`}
                  >
                    {isPaused ? "Lanjutkan" : "Jeda"}
                  </button>

                  <button
                    type="button"
                    onClick={cycleScanSpeed}
                    className="px-2 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                    title="Atur Interval Scan"
                  >
                    {(config.scanIntervalMs / 1000).toFixed(1)}s
                  </button>
                </>
              )}

              {/* Kontrol Khusus Anti-Tremor: Waktu Tahan */}
              {config.subMode === "tremor_filter" && (
                <button
                  type="button"
                  onClick={cycleHoldDuration}
                  className="px-2 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                  title="Atur Waktu Tahan"
                >
                  {(config.holdDurationMs / 1000).toFixed(2)}s
                </button>
              )}

              {/* Toggle Feedback Suara */}
              <button
                type="button"
                onClick={toggleSound}
                className={`px-2 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  config.soundFeedback
                    ? "bg-[#73B14C] text-white"
                    : "bg-white/10 text-white/60 line-through"
                }`}
                title="Suara Penanda"
              >
                Suara
              </button>
            </div>
          )}

          {/* Tombol Minimalkan Bar */}
          <button
            type="button"
            onClick={() => setIsMinimized((prev) => !prev)}
            className="p-1 text-white/70 hover:text-white transition-colors cursor-pointer ml-1"
            title={isMinimized ? "Perluas Kontrol" : "Minimalkan"}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMinimized ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              )}
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
