"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import { getActiveSession, setActiveSession } from "@/lib/authSession";
import { isEyeControlEnabled } from "@/lib/accessibility";
import { playEarcon } from "@/hooks/useVoiceControl";
import { usePathname } from "next/navigation";

export function EyeControlOverlay() {
  const webcamRef = useRef<Webcam>(null);
  const pathname = usePathname();

  // State Aktivasi
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [isModelLoading, setIsModelLoading] = useState<boolean>(true);
  const [faceDetected, setFaceDetected] = useState<boolean>(false);

  // Auto-Scan Pilihan Jawaban (Rotasi 5 Detik per Opsi)
  const [scanIndex, setScanIndex] = useState<number>(0);
  const [scanTimeRemainingSec, setScanTimeRemainingSec] = useState<number>(5);
  const [isEyesClosed, setIsEyesClosed] = useState<boolean>(false);
  const [blinkProgress, setBlinkProgress] = useState<number>(0);

  // Navigasi Area Dashboard: "semua" (Unified Putaran Lengkap: Sidebar + Mapel)
  const [dashboardScanArea, setDashboardScanArea] = useState<"semua" | "sidebar" | "mapel">("semua");

  // State Machine Deteksi Kedipan Mata
  const wasEyesClosedRef = useRef<boolean>(false);
  const blinkStartTimeRef = useRef<number | null>(null);
  const longBlinkTriggeredRef = useRef<boolean>(false);
  const lastScanAdvanceTimeRef = useRef<number>(Date.now());
  const currentScannedOptionRef = useRef<HTMLElement | null>(null);
  const lastClickedTimeRef = useRef<number>(0);

  // Deteksi Gestur Merem 2 Detik (Jump Shortcut: Sidebar <-> Hero Section)
  const [blinkPhase, setBlinkPhase] = useState<"idle" | "click" | "jump">("idle");
  const [jumpProgress, setJumpProgress] = useState<number>(0);
  const jumpTriggeredRef = useRef<boolean>(false);
  const clickReadyRef = useRef<boolean>(false);
  const lastJumpTimeRef = useRef<number>(0);
  const [gestureFeedback, setGestureFeedback] = useState<string | null>(null);
  const validTargetsRef = useRef<HTMLElement[]>([]);

  // Koordinat Reticle
  const [gazePos, setGazePos] = useState<{ x: number; y: number }>({ x: 0.5, y: 0.5 });
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [hoveredCardLabel, setHoveredCardLabel] = useState<string>("");

  // Tracking elemen target sebelumnya untuk smooth auto-scroll & pergantian fase
  const prevScannedOptionRef = useRef<HTMLElement | null>(null);
  const lastTargetSignatureRef = useRef<string>("");

  // Pengaturan Overlay UI
  const [isDocked, setIsDocked] = useState<boolean>(true);
  const [isManuallyTurnedOff, setIsManuallyTurnedOff] = useState<boolean>(false);

  // Animasi, FaceMesh & Concurrency Lock
  const animFrameRef = useRef<number | null>(null);
  const faceMeshRef = useRef<any>(null);
  const isProcessingRef = useRef<boolean>(false);
  const lastDetectTimeRef = useRef<number>(0);

  const isDashboard = pathname === "/dashboard" || pathname?.startsWith("/dashboard");

  // Helper aman pembersihan visual marker tanpa querySelectorAll yang invalid
  const clearAllHighlights = useCallback(() => {
    try {
      document.querySelectorAll(".ring-8, .ring-6, [data-gaze-active], .scale-125, [data-no-ring]").forEach((el) => {
        el.classList.remove(
          "ring-8",
          "ring-6",
          "ring-[#FFBA48]",
          "ring-[#73B14C]",
          "scale-[1.03]",
          "scale-105",
          "scale-125",
          "shadow-[0_0_30px_rgba(255,186,72,0.85)]",
          "drop-shadow-[0_0_25px_rgba(255,186,72,1)]"
        );
        el.removeAttribute("data-gaze-active");
      });
    } catch (e) {
      // safe fallback
    }
    currentScannedOptionRef.current = null;
    setHoveredCardId(null);
    setHoveredCardLabel("");
  }, []);

  // 1. Cek apakah sesi siswa mengaktifkan mode kontrol mata (Khusus Siswa Lumpuh Total)
  useEffect(() => {
    if (isManuallyTurnedOff) return;
    const session = getActiveSession();
    if (session && session.role !== "guru" && isEyeControlEnabled(session)) {
      setIsEnabled(true);
      if (typeof window !== "undefined") {
        localStorage.setItem("pintara_eye_control_enabled", "true");
      }
    } else {
      setIsEnabled(false);
    }
  }, [pathname, isManuallyTurnedOff]);

  

  // 3. Update posisi retikel seketika jika ada event scroll di jendela atau scroll container (laptop / overflow-y-auto)
  useEffect(() => {
    if (!isEnabled) return;

    const handleScrollOrResize = () => {
      const el = currentScannedOptionRef.current;
      if (!el || !el.isConnected) return;
      const rect = el.getBoundingClientRect();
      const snapX = (rect.left + rect.width / 2) / window.innerWidth;
      const snapY = (rect.top + rect.height / 2) / window.innerHeight;
      setGazePos({ x: snapX, y: snapY });
    };

    window.addEventListener("scroll", handleScrollOrResize, { capture: true, passive: true });
    window.addEventListener("resize", handleScrollOrResize, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, { capture: true });
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isEnabled]);

  // Helper Pencari Tombol Opsi Kuis Universal (Seluruh 34 Mapel)
  const findQuizOptionButtons = useCallback((targets: HTMLElement[]): HTMLElement[] => {
    const explicit = targets.filter(
      (el) =>
        el.hasAttribute("data-quiz-option") ||
        el.id?.startsWith("quiz-option-") ||
        el.id?.startsWith("exam-") ||
        el.id?.startsWith("latihan-")
    );
    if (explicit.length >= 2) return explicit;

    const gridButtons = targets.filter((el) => {
      if (el.tagName !== "BUTTON") return false;
      if (el.getAttribute("data-voice-command") === "kembali" || el.title?.includes("Suara")) return false;
      const parent = el.parentElement;
      if (!parent) return false;
      const isGrid = parent.classList.contains("grid") || window.getComputedStyle(parent).display === "grid";
      if (!isGrid) return false;
      const siblings = Array.from(parent.querySelectorAll(":scope > button")).filter(
        (b) => !b.hasAttribute("disabled") && (b as HTMLElement).innerText.length < 100
      );
      return siblings.length >= 2 && siblings.length <= 6 && siblings.includes(el);
    });
    if (gridButtons.length >= 2) return gridButtons;

    return [];
  }, []);

  // Helper penentu apakah elemen berada di sidebar navigasi
  const isElementInSidebar = useCallback((el: HTMLElement | null): boolean => {
    if (!el) return false;
    if (el.closest("aside")) return true;
    if (el.getAttribute("data-dashboard-area") === "sidebar") return true;
    if (el.id?.startsWith("sidebar-btn-")) return true;
    return false;
  }, []);

  // Eksekusi Pintasan 3 Kedipan: Berpindah langsung antara Sidebar <-> Hero Section Utama
  const handleSectionJump = useCallback(() => {

    const targets = validTargetsRef.current;
    const currentEl = currentScannedOptionRef.current;
    const isCurrentlyInSidebar = isElementInSidebar(currentEl);

    let nextIdx = -1;
    let destinationName = "";
    let targetElement: HTMLElement | null = null;

    if (targets && targets.length > 0) {
      if (isCurrentlyInSidebar) {
        // Sedang di Sidebar: Cari elemen pertama di Hero Section / Konten Utama
        nextIdx = targets.findIndex((el) => !isElementInSidebar(el));
        destinationName = "Bagian Utama";
      } else {
        // Sedang di Konten Utama: Cari elemen pertama di Menu Sidebar
        nextIdx = targets.findIndex((el) => isElementInSidebar(el));
        destinationName = "Menu Sidebar";
      }

      if (nextIdx !== -1) {
        targetElement = targets[nextIdx];
      }
    }

    // Fallback jika targets di loop belum tersinkronisasi
    if (!targetElement) {
      if (isCurrentlyInSidebar) {
        targetElement = (
          document.getElementById("btn-room-aktif") ||
          document.getElementById("btn-gabung-room") ||
          document.querySelector("main button:not([disabled])") ||
          document.querySelector("[data-dashboard-area='mapel']")
        ) as HTMLElement | null;
        destinationName = "Bagian Utama";
      } else {
        targetElement = (
          document.getElementById("sidebar-btn-sub-kelas") ||
          document.getElementById("sidebar-btn-kelas") ||
          document.getElementById("sidebar-btn-katalog")
        ) as HTMLElement | null;
        destinationName = "Menu Sidebar";
      }

      if (targetElement && targets) {
        const foundIdx = targets.indexOf(targetElement);
        if (foundIdx !== -1) nextIdx = foundIdx;
      }
    }

    if (targetElement) {
      playEarcon("wake");

      if (nextIdx !== -1) {
        setScanIndex(nextIdx);
      }
      lastScanAdvanceTimeRef.current = Date.now();
      setScanTimeRemainingSec(5);

      // Bersihkan highlight lama
      clearAllHighlights();

      currentScannedOptionRef.current = targetElement;
      targetElement.setAttribute("data-gaze-active", "true");
      targetElement.classList.add(
        "ring-8",
        "ring-[#73B14C]",
        "scale-[1.04]",
        "shadow-[0_0_35px_rgba(115,177,76,0.9)]",
        "transition-all",
        "duration-300"
      );

      setTimeout(() => {
        targetElement?.classList.remove("ring-[#73B14C]", "scale-[1.04]");
        targetElement?.classList.add("ring-[#FFBA48]", "scale-[1.03]");
      }, 700);

      // Auto-scroll halus ke tengah layar
      targetElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });

      // Update posisi reticle pointer seketika
      const rect = targetElement.getBoundingClientRect();
      const snapX = (rect.left + rect.width / 2) / window.innerWidth;
      const snapY = (rect.top + rect.height / 2) / window.innerHeight;
      setGazePos({ x: snapX, y: snapY });

      // Tampilkan notifikasi gestur interaktif
      setGestureFeedback(`Merem 2 Detik: Berpindah ke ${destinationName}!`);
      setTimeout(() => {
        setGestureFeedback(null);
      }, 2500);
    }
  }, [isElementInSidebar, clearAllHighlights]);

  // Eksekusi Pilihan Aktif (100% Otomatis via Mata / Tutup Mata ~0.6 Detik)
  const triggerActiveScanSelection = useCallback(() => {
    const target = currentScannedOptionRef.current;
    if (!target) return;

    const now = Date.now();
    if (now - lastClickedTimeRef.current < 1200) return;
    lastClickedTimeRef.current = now;

    playEarcon("success");

    // Efek visual klik sukses (Lingkaran Hijau)
    const isNoRing = target.hasAttribute("data-no-ring") || target.id === "btn-back-home" || target.id === "btn-back-nav";
    if (isNoRing) {
      target.classList.add("scale-125", "drop-shadow-[0_0_25px_rgba(115,177,76,1)]");
      setTimeout(() => {
        target?.classList.remove("scale-125", "drop-shadow-[0_0_25px_rgba(115,177,76,1)]");
      }, 600);
    } else {
      target.classList.remove("ring-[#FFBA48]");
      target.classList.add("ring-8", "ring-[#73B14C]", "scale-105");
      setTimeout(() => {
        target?.classList.remove("ring-8", "ring-[#73B14C]", "scale-105");
      }, 600);
    }

    target.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
    target.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true }));
    target.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    target.click();

    // Reset siklus scan dan LANGSUNG PINDAH PENANDA KE OPSI BERIKUTNYA / SUB-OPSI TERKAIT
    setScanIndex((prev) => prev + 1);
    lastScanAdvanceTimeRef.current = Date.now();
    setScanTimeRemainingSec(5);
  }, []);

  // 4. Loop Rotasi Otomatis (Auto-Scan Terpadu) 5 Detik per Pilihan
  // Siswa Lumpuh tidak butuh tangan: Menu Sidebar (Kelas) & Mapel berputar bergantian secara adil
  useEffect(() => {
    if (!isEnabled) return;

    const scanTimer = setInterval(() => {
      if (typeof window === "undefined") return;



      const onDashboard = pathname === "/dashboard" || !!document.querySelector("[data-dashboard-area]");

      let candidateElements: HTMLElement[] = [];

      // ========================================================
      // 1. PRIORITAS TERTINGGI: FULLSCREEN UJIAN / MISI AKHIR
      // ========================================================
      const keluarUjianBtn = document.getElementById("btn-keluar-ujian") ||
        (Array.from(document.querySelectorAll("button")).find((b) =>
          b.innerText.toLowerCase().includes("keluar ujian")
        ) as HTMLElement | null);

      const isExamFullscreenActive = !!keluarUjianBtn && keluarUjianBtn.offsetParent !== null;

      if (isExamFullscreenActive) {
        // SISWA SEDANG DALAM MODE FULLSCREEN UJIAN
        const isExamSubmitted = document.body.innerText.includes("Ujian Resmi Berhasil Dikumpulkan") ||
          document.body.innerText.includes("Skor Berhasil Dicatat");

        if (isExamSubmitted) {
          candidateElements = [keluarUjianBtn].filter(Boolean) as HTMLElement[];
        } else {
          const currentExamOptions = Array.from(
            document.querySelectorAll("[data-quiz-option], [id^='exam-opt-']")
          ).filter((el) => {
            const h = el as HTMLElement;
            return h.offsetParent !== null && !h.closest(".hidden");
          }) as HTMLElement[];

          const nextBtn = (document.getElementById("btn-exam-next") ||
            document.getElementById("btn-exam-submit")) as HTMLElement | null;

          candidateElements = [
            ...currentExamOptions,
            ...(nextBtn ? [nextBtn] : []),
          ];
        }
      } else {
        // ========================================================
        // 2. PRIORITAS KEDUA: MODAL FLASHCARD (BUKU PINTAR)
        // ========================================================
        const flashcardCloseBtn = document.getElementById("btn-flashcard-close");
        const isFlashcardActive = !!flashcardCloseBtn && flashcardCloseBtn.offsetParent !== null;

        if (isFlashcardActive) {
          const flipBtn = document.getElementById("btn-flashcard-flip");
          const soundBtn = document.getElementById("btn-flashcard-sound");
          const nextCardBtn = document.getElementById("btn-flashcard-next");
          const prevCardBtn = document.getElementById("btn-flashcard-prev");

          candidateElements = [
            ...(flipBtn ? [flipBtn] : []),
            ...(soundBtn ? [soundBtn] : []),
            ...(nextCardBtn ? [nextCardBtn] : []),
            ...(prevCardBtn ? [prevCardBtn] : []),
            ...(flashcardCloseBtn ? [flashcardCloseBtn] : []),
          ];
        } else if (onDashboard) {
          // ========================================================
          // 3. PRIORITAS DASHBOARD UTAMA (SIDEBAR & HERO SECTION)
          // ========================================================
          const latihanOptions = Array.from(
            document.querySelectorAll("[id^='latihan-opt-']")
          ).filter((el) => (el as HTMLElement).offsetParent !== null) as HTMLElement[];

          if (latihanOptions.length >= 2) {
            const isLatihanSubmitted = document.body.innerText.includes("Skor Berhasil Dicatat");
            const submitLatihanBtn = document.getElementById("btn-submit-latihan");

            if (isLatihanSubmitted) {
              const subKelas = document.getElementById("sidebar-btn-sub-kelas");
              const katalogBtn = document.getElementById("sidebar-btn-katalog");
              candidateElements = [
                ...(subKelas ? [subKelas] : []),
                ...(katalogBtn ? [katalogBtn] : []),
              ];
            } else {
              candidateElements = [
                ...latihanOptions,
                ...(submitLatihanBtn ? [submitLatihanBtn] : []),
              ];
            }
          } else {
            const subKelasBtn = document.getElementById("sidebar-btn-sub-kelas");
            const subBukuBtn = document.getElementById("sidebar-btn-sub-buku");
            const subTantanganBtn = document.getElementById("sidebar-btn-sub-tantangan");
            const subUjianBtn = document.getElementById("sidebar-btn-sub-ujian");
            const isInsideKelas = !!subKelasBtn;

            const backHomeBtn = document.getElementById("btn-back-home");
            const kelasBtn = document.getElementById("sidebar-btn-kelas");
            const katalogBtn = document.getElementById("sidebar-btn-katalog");
            const logoutBtn = document.getElementById("sidebar-btn-logout");
            const modeBtn = document.getElementById("sidebar-btn-mode");

            if (isInsideKelas) {
              const subMenus = [subKelasBtn, subBukuBtn, subTantanganBtn, subUjianBtn].filter(Boolean) as HTMLElement[];
              const mainClassButtons = Array.from(
                document.querySelectorAll("main button:not([disabled]), main [data-dashboard-area='hero'], main [data-quiz-option], main [id^='latihan-opt-']")
              ).filter((b) => {
                const el = b as HTMLElement;
                if (el.closest(".fixed.bottom-6")) return false;
                if (el.hasAttribute("data-no-gaze") || el.getAttribute("data-no-gaze") === "true") return false;
                const style = window.getComputedStyle(el);
                return style.display !== "none" && style.visibility !== "hidden";
              }) as HTMLElement[];

              candidateElements = [
                ...(backHomeBtn ? [backHomeBtn] : []),
                ...subMenus,
                ...mainClassButtons,
                ...(katalogBtn ? [katalogBtn] : []),
                ...(kelasBtn ? [kelasBtn] : []),
                ...(modeBtn ? [modeBtn] : []),
                ...(logoutBtn ? [logoutBtn] : []),
              ];
            } else {
              const mapelEls = Array.from(
                document.querySelectorAll("[data-dashboard-area='mapel'], [data-gaze-target]")
              ).filter((el) => !el.hasAttribute("data-no-gaze")) as HTMLElement[];

              candidateElements = [
                ...(backHomeBtn ? [backHomeBtn] : []),
                ...(kelasBtn ? [kelasBtn] : []),
                ...(katalogBtn ? [katalogBtn] : []),
                ...mapelEls,
                ...(modeBtn ? [modeBtn] : []),
                ...(logoutBtn ? [logoutBtn] : []),
              ];
            }
          }
        } else {
          // ========================================================
          // 4. GAME / MATERI ENGINE (/materi/[id])
          // ========================================================
          const startMateriBtn = (
            document.querySelector('[data-gaze-role="start-game"]') ||
            document.getElementById("btn-aku-sudah-paham") ||
            Array.from(document.querySelectorAll("button")).find((b) => {
              const txt = (b as HTMLElement).innerText?.toLowerCase() || "";
              return txt.includes("aku sudah paham");
            })
          ) as HTMLElement | null;

          const materiCard = startMateriBtn
            ? ((startMateriBtn.closest(".animate-in") ||
                startMateriBtn.parentElement) as HTMLElement | null)
            : null;

          const isMateriPhase =
            !!startMateriBtn &&
            (document.body.innerText.includes("PENGENALAN KONSEP MATERI") ||
              document.body.innerText.includes("FASE 1") ||
              !!materiCard);

          const backNavBtn = document.getElementById("btn-back-nav");
          const isGameFinished =
            document.body.innerText.includes("Misi Selesai!") ||
            document.body.innerText.includes("Skor Akhir:");

          if (isMateriPhase && startMateriBtn) {
            const materiContainerEl = materiCard || document.body;
            const innerButtons = Array.from(
              materiContainerEl.querySelectorAll("button:not([disabled])")
            ).filter((b) => {
              const el = b as HTMLElement;
              if (el === startMateriBtn) return false;
              if (el.closest(".fixed.bottom-6")) return false;
              if (el.id === "btn-back-nav" || el.hasAttribute("data-no-gaze")) return false;
              const style = window.getComputedStyle(el);
              return style.display !== "none" && style.visibility !== "hidden";
            }) as HTMLElement[];

            candidateElements = [...innerButtons, startMateriBtn];
          } else if (isGameFinished) {
            const finishButtons = Array.from(
              document.querySelectorAll("button:not([disabled])")
            ).filter((b) => {
              const el = b as HTMLElement;
              if (el.closest(".fixed.bottom-6") || el.hasAttribute("data-no-gaze")) return false;
              return true;
            }) as HTMLElement[];

            candidateElements = [
              ...(backNavBtn ? [backNavBtn] : []),
              ...finishButtons.filter((b) => b !== backNavBtn),
            ];
          } else {
            const allButtons = Array.from(
              document.querySelectorAll(
                "[data-quiz-option], [id^='quiz-option-'], [data-gaze-target^='level-'], [id^='level-button-'], button:not([disabled])"
              )
            ).filter((b) => !b.hasAttribute("data-no-gaze")) as HTMLElement[];

            const quizOptions = findQuizOptionButtons(allButtons);
            if (quizOptions.length >= 2) {
              candidateElements = quizOptions;
            } else {
              const currentLevel = document.querySelector(
                "[data-gaze-current='true']:not([disabled]), [data-gaze-primary='true']:not([disabled])"
              ) as HTMLElement | null;

              const unlockedLevels = Array.from(
                document.querySelectorAll(
                  "[data-gaze-target^='level-']:not([disabled]), [id^='level-button-']:not([disabled])"
                )
              ) as HTMLElement[];

              if (unlockedLevels.length > 0) {
                const orderedLevels = currentLevel
                  ? [currentLevel, ...unlockedLevels.filter((lvl) => lvl !== currentLevel)]
                  : unlockedLevels;

                candidateElements = [
                  ...(backNavBtn ? [backNavBtn] : []),
                  ...orderedLevels,
                ];
              } else {
                candidateElements = allButtons.filter((b) => {
                  if (b.closest(".fixed.bottom-6") || b.hasAttribute("data-no-gaze")) return false;
                  return true;
                });
              }
            }
          }
        }
      }

      // Filter elemen yang valid secara fisik (tanpa membuang elemen yang di bawah lipatan viewport laptop!)
      const validTargets = candidateElements.filter((el) => {
        if (!el.isConnected || el.hasAttribute("data-no-gaze") || el.getAttribute("data-no-gaze") === "true") return false;
        if (el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true") return false;
        if (el.classList.contains("cursor-not-allowed") || el.classList.contains("opacity-60")) return false;
        const style = window.getComputedStyle(el);
        if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 15 && rect.height > 15;
      });

      validTargetsRef.current = validTargets;

      // Deteksi jika set opsi berganti (misal siswa baru berpindah ke Fase Materi atau ke Soal Kuis)
      // Reset scanIndex ke 0 seketika agar penanda langsung membaca ke opsi pertama materi!
      const currentSignature = validTargets
        .map((t) => (t.id || t.innerText || "").slice(0, 15))
        .join("|");
      if (lastTargetSignatureRef.current !== currentSignature) {
        lastTargetSignatureRef.current = currentSignature;
        setScanIndex(0);
        lastScanAdvanceTimeRef.current = Date.now();
      }

      if (validTargets.length > 0) {
        const now = Date.now();
        const elapsed = now - lastScanAdvanceTimeRef.current;
        const remaining = Math.max(0, Math.ceil((5000 - elapsed) / 1000));
        setScanTimeRemainingSec(remaining);

        let activeIdx = scanIndex;
        // Jika 5 detik habis, putar ke opsi berikutnya
        if (elapsed >= 5000) {
          lastScanAdvanceTimeRef.current = now;
          activeIdx = (scanIndex + 1) % validTargets.length;
          setScanIndex(activeIdx);
          playEarcon("wake");
        }

        const safeIdx = activeIdx % validTargets.length;
        const activeOption = validTargets[safeIdx];
        currentScannedOptionRef.current = activeOption;

        // Berikan highlight visual fokus yang tegas pada opsi aktif
        validTargets.forEach((opt, idx) => {
          const isNoRing = opt.hasAttribute("data-no-ring") || opt.id === "btn-back-home" || opt.closest("#btn-back-home") || opt.id === "btn-back-nav" || opt.closest("#btn-back-nav");
          if (idx === safeIdx) {
            opt.setAttribute("data-gaze-active", "true");
            if (isNoRing) {
              // HILANGKAN KOTAK OREN PADA TOMBOL PANAH!
              // Cukup retikel lingkaran kursor di tengah + scale dan glow lembut
              opt.classList.remove("ring-8", "ring-6", "ring-[#FFBA48]", "rounded-2xl");
              opt.classList.add(
                "scale-125",
                "drop-shadow-[0_0_25px_rgba(255,186,72,1)]",
                "transition-all",
                "duration-200"
              );
            } else {
              opt.classList.add(
                "ring-8",
                "ring-[#FFBA48]",
                "scale-[1.03]",
                "shadow-[0_0_30px_rgba(255,186,72,0.85)]",
                "transition-all",
                "duration-200"
              );
            }
          } else {
            opt.removeAttribute("data-gaze-active");
            opt.classList.remove(
              "ring-8",
              "ring-6",
              "ring-[#FFBA48]",
              "ring-[#73B14C]",
              "scale-[1.03]",
              "scale-105",
              "scale-125",
              "shadow-[0_0_30px_rgba(255,186,72,0.85)]",
              "drop-shadow-[0_0_25px_rgba(255,186,72,1)]"
            );
          }
        });

        // ========================================================
        // AUTO-SCROLL OTOMATIS CERDAS (Khusus Laptop Layar Kecil)
        // ========================================================
        // Siswa lumpuh tidak bisa memakai mouse/keyboard untuk scroll.
        // Jika opsi aktif berada di luar area tengah layar, scroll otomatis dengan mulus ke tengah layar!
        const rect = activeOption.getBoundingClientRect();
        const isOutOfComfortZone =
          rect.top < 120 || rect.bottom > window.innerHeight - 100;

        if (isOutOfComfortZone || prevScannedOptionRef.current !== activeOption) {
          activeOption.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "center",
          });
          prevScannedOptionRef.current = activeOption;
        }

        // Posisikan reticle kursor tepat di atas tombol aktif
        const snapX = (rect.left + rect.width / 2) / window.innerWidth;
        const snapY = (rect.top + rect.height / 2) / window.innerHeight;
        setGazePos({ x: snapX, y: snapY });

        const rawLabel =
          activeOption.getAttribute("data-scan-label") ||
          activeOption.getAttribute("data-gaze-label") ||
          activeOption.getAttribute("data-quiz-option") ||
          activeOption.innerText.slice(0, 24);
        const cleanLabel = rawLabel.replace(/\s*\(\d+%\)/g, "").trim();

        setHoveredCardId(`scan-opt-${safeIdx}`);
        setHoveredCardLabel(`${cleanLabel} (${remaining}s)`);
      } else {
        currentScannedOptionRef.current = null;
        setHoveredCardId(null);
        setHoveredCardLabel("");
      }
    }, 200);

    return () => {
      clearInterval(scanTimer);
    };
  }, [isEnabled, scanIndex, pathname, dashboardScanArea, findQuizOptionButtons, clearAllHighlights]);

  // 5. Inisialisasi MediaPipe FaceMesh Lokal (Cepat, Akurat, Tanpa CDN Hang)
  useEffect(() => {
    if (!isEnabled) return;

    let isMounted = true;

    const initFaceMesh = async () => {
      try {
        setIsModelLoading(true);
        const { FaceMesh } = await import("@mediapipe/face_mesh");

        const fm = new FaceMesh({
          locateFile: (file) => `/mediapipe/face_mesh/${file}`,
        });

        fm.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true, // 478 landmarks 3D akurat untuk kelopak mata
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        fm.onResults((results: any) => {
          if (!isMounted) return;

          if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            setFaceDetected(true);
            const landmarks = results.multiFaceLandmarks[0];
            processBlinkDetection(landmarks);
          } else {
            setFaceDetected(false);
          }
        });

        faceMeshRef.current = fm;
        if (isMounted) setIsModelLoading(false);
      } catch (err) {
        console.error("Inisialisasi FaceMesh:", err);
        if (isMounted) setIsModelLoading(false);
      }
    };

    initFaceMesh();

    return () => {
      isMounted = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isEnabled]);

  // 6. Loop deteksi webcam ke FaceMesh dengan Mutex Lock & Safe Throttling
  useEffect(() => {
    if (!isEnabled || isModelLoading) return;

    let active = true;

    const detectLoop = async () => {
      if (!active) return;

      const now = performance.now();
      // Jalankan setiap ~75ms (sekitar 13 FPS, sangat presisi membaca kelopak mata tanpa membebani GPU)
      if (
        now - lastDetectTimeRef.current >= 75 &&
        !isProcessingRef.current &&
        webcamRef.current?.video &&
        faceMeshRef.current
      ) {
        const video = webcamRef.current.video;
        if (video.readyState === 4 && video.videoWidth > 0 && video.videoHeight > 0) {
          isProcessingRef.current = true;
          lastDetectTimeRef.current = now;
          try {
            await faceMeshRef.current.send({ image: video });
          } catch (e) {
            // Abaikan error transien
          } finally {
            isProcessingRef.current = false;
          }
        }
      }

      if (active) {
        animFrameRef.current = requestAnimationFrame(detectLoop);
      }
    };

    animFrameRef.current = requestAnimationFrame(detectLoop);

    return () => {
      active = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isEnabled, isModelLoading]);

  // 7. Kalkulasi Eye Aspect Ratio (EAR) Landmark 3D Akurat (Deteksi Merem Yang Sebenarnya)
  const processBlinkDetection = useCallback(
    (landmarks: any[]) => {
      if (!landmarks || landmarks.length < 478) return;

      // Mata Kanan (Landmark 159, 145, 133, 33)
      const rTop = landmarks[159];
      const rBottom = landmarks[145];
      const rInner = landmarks[133];
      const rOuter = landmarks[33];
      const rH = Math.hypot(rBottom.x - rTop.x, rBottom.y - rTop.y);
      const rW = Math.hypot(rInner.x - rOuter.x, rInner.y - rOuter.y) || 0.01;
      const rEAR = rH / rW;

      // Mata Kiri (Landmark 386, 374, 362, 263)
      const lTop = landmarks[386];
      const lBottom = landmarks[374];
      const lInner = landmarks[362];
      const lOuter = landmarks[263];
      const lH = Math.hypot(lBottom.x - lTop.x, lBottom.y - lTop.y);
      const lW = Math.hypot(lInner.x - lOuter.x, lInner.y - lOuter.y) || 0.01;
      const lEAR = lH / lW;

      const avgEAR = (rEAR + lEAR) / 2;

      // Ambang batas mata tertutup (EAR < 0.165 sangat akurat mengenali mata merem)
      const eyesClosed = avgEAR < 0.165;
      setIsEyesClosed(eyesClosed);

      const now = Date.now();

      // Cooldown setelah eksekusi klik sukses (1.2 detik) atau setelah loncat section (1.5 detik)
      if (now - lastClickedTimeRef.current < 1200 || now - lastJumpTimeRef.current < 1500) {
        blinkStartTimeRef.current = null;
        setBlinkProgress(0);
        setJumpProgress(0);
        setBlinkPhase("idle");
        wasEyesClosedRef.current = eyesClosed;
        return;
      }

      if (eyesClosed) {
        // Transisi: Mata baru saja tertutup
        if (!wasEyesClosedRef.current) {
          wasEyesClosedRef.current = true;
          blinkStartTimeRef.current = now;
          jumpTriggeredRef.current = false;
          clickReadyRef.current = false;
        }

        const closedDuration = now - (blinkStartTimeRef.current || now);

        if (closedDuration < 600) {
          // Fase 1 (0 - 600ms): Mengisi cincin hijau untuk Memilih / Klik
          setBlinkPhase("click");
          const progress = Math.min(100, Math.round((closedDuration / 600) * 100));
          setBlinkProgress(progress);
          setJumpProgress(0);
        } else if (closedDuration >= 600 && closedDuration < 2000) {
          // Fase 2 (600ms - 2000ms): Opsi siap klik jika buka mata, ATAU tahan terus 2 detik untuk LONCAT!
          clickReadyRef.current = true;
          setBlinkPhase("jump");
          setBlinkProgress(100);
          const jProgress = Math.min(100, Math.round(((closedDuration - 600) / 1400) * 100));
          setJumpProgress(jProgress);
        } else if (closedDuration >= 2000 && !jumpTriggeredRef.current) {
          // Fase 3 (Tepat 2000ms / 2 Detik Merem): LONCAT SECTION LANGSUNG!
          jumpTriggeredRef.current = true;
          clickReadyRef.current = false; // Batalkan klik agar tombol tidak terpencet!
          lastJumpTimeRef.current = now;
          setBlinkProgress(0);
          setJumpProgress(0);
          setBlinkPhase("idle");
          handleSectionJump();
        }
      } else {
        // Transisi: Mata kembali terbuka
        if (wasEyesClosedRef.current) {
          const totalDuration = now - (blinkStartTimeRef.current || now);
          wasEyesClosedRef.current = false;
          blinkStartTimeRef.current = null;
          setBlinkProgress(0);
          setJumpProgress(0);
          setBlinkPhase("idle");

          if (jumpTriggeredRef.current) {
            // Baru saja loncat: Reset flag tanpa memicu klik
            jumpTriggeredRef.current = false;
            clickReadyRef.current = false;
          } else if (clickReadyRef.current || (totalDuration >= 500 && totalDuration < 1600)) {
            // Siswa menutup mata ~0.6 detik lalu buka mata: EKSEKUSI KLIK / PILIH!
            clickReadyRef.current = false;
            triggerActiveScanSelection();
          } else {
            // Kedipan biasa sangat singkat (<500ms): Abaikan
            clickReadyRef.current = false;
          }
        }
      }    },
    [triggerActiveScanSelection, handleSectionJump]
  );

  if (!isEnabled && !isManuallyTurnedOff) return null;

  if (isManuallyTurnedOff) {
    return (
      <div className="fixed bottom-6 right-6 z-[9990]">
        <button
          type="button"
          onClick={() => {
            setIsManuallyTurnedOff(false);
            setIsEnabled(true);
            setIsDocked(false);
            if (typeof window !== "undefined") {
              localStorage.setItem("pintara_eye_control_enabled", "true");
              const session = getActiveSession();
              if (session) {
                session.accessibilityConfig = {
                  ...(session.accessibilityConfig || {}),
                  mainMode: "fisik_mata",
                  specificMode: "lumpuh_total",
                  physicalControlMethod: "mata",
                };
                setActiveSession(session);
                localStorage.setItem("pintara_a11y_config", JSON.stringify(session.accessibilityConfig));
              }
            }
            playEarcon("wake");
          }}
          className="px-5 py-3 bg-[#3C632A] hover:bg-[#2F4F20] text-[#FFFFDB] border-3 border-[#FFBA48] rounded-full shadow-md font-black text-xs md:text-sm flex items-center gap-2.5 transition-all cursor-pointer hover:scale-105 active:scale-95"
          title="Aktifkan Kembali Kontrol Mata"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <svg className="w-5 h-5 text-[#FFDF59]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span>Aktifkan Kontrol Mata</span>
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Toast Notifikasi Pintasan Gestur 3 Kedipan */}
      {gestureFeedback && (
        <div className="pointer-events-none fixed top-8 left-1/2 transform -translate-x-1/2 z-[10000] animate-in fade-in slide-in-from-top duration-300">
          <div className="bg-[#3C632A] text-[#FFFFDB] border-4 border-[#FFDF59] shadow-[0_10px_35px_rgba(0,0,0,0.4)] px-7 py-3.5 rounded-full flex items-center space-x-3 text-sm md:text-base font-black">
            <svg className="w-6 h-6 text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/></svg>
            <span>{gestureFeedback}</span>
          </div>
        </div>
      )}



      {/* ======================================================== */}
      {/* 1. RETIKEL FOKUS PADA OPSI AKTIF (AUTO-SCAN POINTER)     */}
      {/* ======================================================== */}
      {hoveredCardId && (
        <div
          className="pointer-events-none fixed z-[9999] transition-all duration-200 ease-out"
          style={{
            left: `${gazePos.x * 100}vw`,
            top: `${gazePos.y * 100}vh`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className="relative flex items-center justify-center">
            {/* Cincin Countdown Rotasi 5 Detik */}
            <svg className="w-16 h-16 transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="26"
                stroke="#CBD5E1"
                strokeWidth="4"
                fill="transparent"
                className="opacity-40"
              />
              <circle
                cx="32"
                cy="32"
                r="26"
                stroke={blinkPhase === "jump" ? "#06B6D4" : blinkProgress > 0 ? "#73B14C" : "#FFBA48"}
                strokeWidth="5"
                fill="transparent"
                strokeDasharray={163.36}
                strokeDashoffset={
                  blinkPhase === "jump"
                    ? 163.36 - (163.36 * jumpProgress) / 100
                    : 163.36 - (163.36 * (blinkProgress > 0 ? blinkProgress : (scanTimeRemainingSec / 5) * 100)) / 100
                }
                strokeLinecap="round"
                className="transition-all duration-100"
              />
            </svg>

            {/* Titik Inti Fokus */}
            <div
              className={`absolute w-5 h-5 rounded-full border-2 border-white shadow-lg transition-all duration-150 ${
                blinkPhase === "jump"
                  ? "bg-[#06B6D4] scale-125 ring-4 ring-[#06B6D4]/50 animate-ping"
                  : blinkProgress > 0
                  ? "bg-[#73B14C] scale-125 ring-4 ring-[#73B14C]/40 animate-pulse"
                  : "bg-[#FFBA48] scale-110 ring-4 ring-[#FFBA48]/40"
              }`}
            />

            {/* Label Informasi Opsi yang Sedang Aktif (Clean Tanpa Emoji) */}
            <div className="absolute top-14 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900/90 text-white text-xs font-black px-3.5 py-1.5 rounded-full shadow-lg border border-slate-700/50 backdrop-blur-sm flex items-center gap-1.5 animate-in fade-in zoom-in duration-100">
              <span
                className={`w-2 h-2 rounded-full ${
                  blinkProgress > 0 ? "bg-[#73B14C] animate-ping" : "bg-[#FFBA48] animate-pulse"
                }`}
              />
              <span>{hoveredCardLabel}</span>
              {blinkPhase === "jump" ? (
                <span className="text-[#06B6D4] font-black">Merem 2s: Loncat Bagian ({jumpProgress}%)</span>
              ) : blinkProgress > 0 ? (
                <span className="text-[#73B14C] font-black">Memilih ({blinkProgress}%) - Buka mata untuk klik</span>
              ) : (
                <span className="text-[#FFBA48] text-[10px]">Pejamkan mata untuk pilih / tahan 2s loncat</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. WIDGET KAMERA KONTROL MATA (SLIDE-DRAWER KE SAMPING)  */}
      {/* ======================================================== */}
      <div
        className={`fixed bottom-6 right-0 z-[9990] flex items-center transition-transform duration-300 ease-in-out ${
          isDocked ? "translate-x-[calc(100%-42px)]" : "translate-x-0"
        }`}
      >
        {/* TAB TOGGLE KAMERA (SATU-SATUNYA TOMBOL UNTUK BUKA/SEMBUNYIKAN PANEL) */}
        <button
          type="button"
          onClick={() => setIsDocked((prev) => !prev)}
          className="w-[42px] bg-[#3C632A] text-[#FFFFDB] border-y-3 border-l-3 border-[#FFBA48] rounded-l-2xl py-4 shadow-[-4px_4px_16px_rgba(0,0,0,0.3)] flex flex-col items-center gap-2.5 cursor-pointer hover:bg-[#2F4F20] transition-all shrink-0 z-10"
          title={isDocked ? "Buka Panel Kamera Sensor" : "Sembunyikan Panel Kamera ke Samping"}
        >
          <svg
            className="w-4 h-4 text-[#FFBA48] transition-transform duration-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isDocked ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
            )}
          </svg>
          <span className="text-[10px] font-black uppercase tracking-wider [writing-mode:vertical-rl] rotate-180 text-[#FFFFDB]">
            Kamera
          </span>
        </button>

        {/* CONTAINER UTAMA (Slide In/Out dengan CSS Transform tanpa unmount video) */}
        <div className="w-72 bg-[#F0FDFA] border-4 border-[#3C632A] rounded-2xl shadow-xl p-4 flex flex-col gap-3 font-sans shrink-0 mr-4">
          {/* Header Status & Tombol Matikan */}
          <div className="flex items-center justify-between border-b-2 border-[#3C632A]/20 pb-2">
            <span className="font-black text-xs text-[#3C632A] flex items-center gap-1.5">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  faceDetected ? "bg-emerald-500 animate-pulse" : "bg-amber-400"
                }`}
              />
              {isModelLoading
                ? "Memuat..."
                : faceDetected
                ? "Wajah Terdeteksi"
                : "Mencari Wajah..."}
            </span>

            {/* Tombol Matikan Fitur (Mematikan sensor mata sepenuhnya) */}
            <button
              type="button"
              onClick={() => {
                clearAllHighlights();
                setIsManuallyTurnedOff(true);
                setIsEnabled(false);
                if (typeof window !== "undefined") {
                  localStorage.removeItem("pintara_eye_control_enabled");
                }
              }}
              className="px-2.5 py-1 bg-[#FF5685] hover:bg-[#E03E6B] text-white font-black text-[11px] rounded-lg border border-[#3C632A] flex items-center gap-1 transition-all cursor-pointer shadow-xs"
              title="Matikan fitur kontrol mata sepenuhnya"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Matikan</span>
            </button>
          </div>

          {/* Video Webcam Box */}
          <div className="relative w-full h-32 bg-slate-900 rounded-xl overflow-hidden border-2 border-[#3C632A]">
            <Webcam
              ref={webcamRef}
              mirrored={true}
              audio={false}
              videoConstraints={{
                width: 320,
                height: 240,
                facingMode: "user",
              }}
              className="w-full h-full object-cover"
            />

            {/* Status Sensor Kedipan */}
            <div className="absolute bottom-2 left-2 right-2 bg-black/75 backdrop-blur-sm px-2.5 py-1.5 rounded-lg flex items-center justify-between text-[11px] font-black text-white border border-white/10">
              <span className="text-slate-300">Sensor Mata:</span>
              <span className={isEyesClosed ? "text-emerald-400 flex items-center gap-1.5 font-black" : "text-amber-300 flex items-center gap-1.5 font-bold"}>
                <span className={`w-2.5 h-2.5 rounded-full ${isEyesClosed ? "bg-emerald-400 animate-ping" : "bg-amber-400"}`} />
                {isEyesClosed
                  ? blinkPhase === "jump"
                    ? `Loncat (${jumpProgress}%)`
                    : `Tutup Mata (${blinkProgress}%)`
                  : "Mata Terbuka"}
              </span>
            </div>
          </div>

          {/* Dashboard Area Switcher (Jika di Dashboard) */}
          {isDashboard && (
            <div className="flex items-center justify-between bg-white/80 p-1.5 rounded-xl border-2 border-[#3C632A]/20 text-[11px] font-black">
              <span className="text-[#3C632A] px-1 text-[10px] uppercase tracking-wider">Area:</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setDashboardScanArea("semua");
                    setScanIndex(0);
                    lastScanAdvanceTimeRef.current = Date.now();
                  }}
                  className={`px-2 py-1 rounded-lg transition-all text-xs font-black cursor-pointer ${
                    dashboardScanArea === "semua"
                      ? "bg-[#3C632A] text-white shadow-sm"
                      : "bg-transparent text-[#3C632A]/70 hover:bg-[#3C632A]/10"
                  }`}
                  title="Putaran otomatis ke Kelas, Mapel & Menu"
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDashboardScanArea("sidebar");
                    setScanIndex(0);
                    lastScanAdvanceTimeRef.current = Date.now();
                  }}
                  className={`px-2 py-1 rounded-lg transition-all text-xs font-black cursor-pointer ${
                    dashboardScanArea === "sidebar"
                      ? "bg-[#3C632A] text-white shadow-sm"
                      : "bg-transparent text-[#3C632A]/70 hover:bg-[#3C632A]/10"
                  }`}
                >
                  Sidebar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDashboardScanArea("mapel");
                    setScanIndex(0);
                    lastScanAdvanceTimeRef.current = Date.now();
                    const katalogBtn = document.getElementById("sidebar-btn-katalog");
                    if (katalogBtn) katalogBtn.click();
                  }}
                  className={`px-2 py-1 rounded-lg transition-all text-xs font-black cursor-pointer ${
                    dashboardScanArea === "mapel"
                      ? "bg-[#3C632A] text-white shadow-sm"
                      : "bg-transparent text-[#3C632A]/70 hover:bg-[#3C632A]/10"
                  }`}
                >
                  Mapel
                </button>
              </div>
            </div>
          )}

          {/* Petunjuk Navigasi Murni Bebas Tangan (Khusus Siswa Lumpuh) */}
          <div className="space-y-2 text-[11px] font-bold text-[#3C632A]">
            <div className="p-2.5 bg-[#FFF9E6] border border-[#3C632A]/25 rounded-xl text-[11px] leading-snug text-[#3C632A] shadow-xs">
              <div className="flex items-center gap-1.5 mb-1.5 font-black text-[#5D3A1A]">
                <svg className="w-3.5 h-3.5 text-[#3C632A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Aksesibilitas Mata (Murni Tanpa Tangan)</span>
              </div>
              <ul className="space-y-1 text-[10.5px] text-[#4B5563]">
                <li className="flex items-start gap-1">
                  <span className="text-[#3C632A] font-black">•</span>
                  <span><strong className="text-[#3C632A]">Cara Memilih:</strong> Pejamkan mata ~0.6 detik lalu buka mata saat pilihan yang diinginkan menyala kuning.</span>
                </li>
                <li className="flex items-start gap-1">
                  <span className="text-[#3C632A] font-black">•</span>
                  <span><strong className="text-[#3C632A]">Loncat Bagian:</strong> Tahan pejamkan mata (merem) selama 2 detik untuk langsung loncat antara Menu Sidebar & Konten Utama / Hero Kelas.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
