"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { getActiveSession } from "@/lib/authSession";
import {
  IntellectualConfig,
  getIntellectualConfig,
  saveIntellectualConfig,
  isIntellectualModeEnabled,
} from "@/lib/intellectualAccessibility";
import { simplifyQuestionText } from "@/lib/plainLanguageEngine";
import { playClueChime, playPopSound } from "@/lib/audioSynthesizer";

/**
 * Pemeriksa visibilitas elemen yang aman untuk elemen di dalam
 * container position: fixed, modal dialog, flex, atau grid.
 * (Tidak mengandalkan offsetParent yang bernilai null pada elemen di dalam fixed)
 */
function isElementRenderedAndVisible(el: HTMLElement): boolean {
  if (!el) return false;
  if (el.closest("[data-a11y-ignore]")) return false;
  if (el.closest(".hidden")) return false;
  if (el.style.display === "none" || el.style.visibility === "hidden") return false;
  if (el.hasAttribute("data-cognitive-eliminated")) return false;

  const rect = el.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return false;

  try {
    const cs = window.getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || cs.opacity === "0") {
      return false;
    }
  } catch {
    // Abaikan jika getComputedStyle gagal
  }

  return true;
}

export function CognitiveAssistOverlay() {
  const pathname = usePathname();

  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [config, setConfig] = useState<IntellectualConfig>(getIntellectualConfig());
  const [isDocked, setIsDocked] = useState<boolean>(false);
  const [assistMessage, setAssistMessage] = useState<string | null>(null);
  const plainLangConfigRef = useRef<boolean>(config.plainLanguage);

  // Selaraskan ref setiap kali config berubah
  useEffect(() => {
    plainLangConfigRef.current = config.plainLanguage;
  }, [config.plainLanguage]);

  // 1. Cek Sesi Siswa Aktif
  useEffect(() => {
    const session = getActiveSession();
    if (session && session.role !== "guru" && isIntellectualModeEnabled(session)) {
      setIsEnabled(true);
    } else {
      setIsEnabled(false);
    }

    const handleConfigChange = (e: any) => {
      if (e.detail) {
        setConfig(e.detail);
      } else {
        setConfig(getIntellectualConfig());
      }
    };

    window.addEventListener("pintara_intellectual_config_changed", handleConfigChange);
    return () => {
      window.removeEventListener("pintara_intellectual_config_changed", handleConfigChange);
    };
  }, [pathname]);

  // 2. Pasang Class Aksesibilitas Kognitif ke Root Dokumen
  useEffect(() => {
    if (!isEnabled) {
      document.documentElement.classList.remove("a11y-intellectual-active");
      return;
    }

    document.documentElement.classList.add("a11y-intellectual-active");

    return () => {
      document.documentElement.classList.remove("a11y-intellectual-active");
    };
  }, [isEnabled]);

  // 3. Reset Opsi yang Dieliminasi saat Siswa Berpindah Soal
  useEffect(() => {
    if (!isEnabled) return;

    const restoreAllEliminated = () => {
      document.querySelectorAll("[data-cognitive-eliminated]").forEach((el) => {
        const h = el as HTMLElement;
        h.style.display = "";
        h.removeAttribute("data-cognitive-eliminated");
      });
    };

    restoreAllEliminated();

    const handleAnswerClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // JANGAN reset jika pengguna mengklik bilah bantuan, tombol 50:50, atau toggle bahasa sederhana!
      if (
        target.closest("[data-a11y-ignore]") ||
        target.closest("#btn-a11y-5050") ||
        target.closest("#btn-a11y-plain-lang")
      ) {
        return;
      }

      // Deteksi jika pengguna mengklik kartu pilihan jawaban atau navigasi soal
      const isQuizAction = !!target.closest(
        "[data-quiz-option], [data-quiz-correct], [id^='exam-opt-'], [id^='latihan-opt-'], [id^='quiz-option-'], #btn-exam-next, #btn-exam-prev, #btn-submit-latihan"
      );

      if (isQuizAction) {
        setTimeout(() => {
          restoreAllEliminated();
        }, 800);
      }
    };

    window.addEventListener("click", handleAnswerClick, { capture: true });
    return () => {
      window.removeEventListener("click", handleAnswerClick, { capture: true });
      restoreAllEliminated();
    };
  }, [isEnabled, pathname]);

  // 4. Mesin Penyederhana Bahasa Otomatis (Langsung Aktif Begitu Masuk)
  useEffect(() => {
    if (!isEnabled) return;

    const processQuestionElements = () => {
      if (typeof window === "undefined") return;
      const isPlainLangActive = plainLangConfigRef.current;

      // Temukan elemen judul/teks pertanyaan di kartu soal
      const questionCandidates = Array.from(
        document.querySelectorAll<HTMLElement>(
          "[class*='bg-[#C3631D]'] h3, [class*='bg-[#C3631D]'] h4, [data-question-text], .soal-text, h3.leading-snug, h4.leading-snug"
        )
      ).filter((el) => {
        if (el.closest("[data-a11y-ignore]")) return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });

      questionCandidates.forEach((el) => {
        const currentText = el.textContent?.trim() || "";
        const originalStored = el.getAttribute("data-original-question");

        // Jika ada soal baru yang belum direkam teks aslinya
        if (!originalStored) {
          el.setAttribute("data-original-question", currentText);
          if (isPlainLangActive) {
            const simplified = simplifyQuestionText(currentText);
            if (simplified !== currentText) {
              el.textContent = simplified;
              attachPlainLanguageBadge(el);
            }
          }
        } else {
          // Jika teks asli sudah direkam, cek apakah React memperbarui soal ke soal berikutnya
          const simplifiedCurrent = simplifyQuestionText(originalStored);
          if (currentText !== originalStored && currentText !== simplifiedCurrent) {
            // Teks berubah karena pindah nomor soal! Rekam teks asli baru
            el.setAttribute("data-original-question", currentText);
            if (isPlainLangActive) {
              const newSimplified = simplifyQuestionText(currentText);
              if (newSimplified !== currentText) {
                el.textContent = newSimplified;
                attachPlainLanguageBadge(el);
              }
            }
          } else {
            // Terapkan sesuai status toggle aktif / nonaktif
            if (isPlainLangActive) {
              const simplified = simplifyQuestionText(originalStored);
              if (el.textContent !== simplified) {
                el.textContent = simplified;
                attachPlainLanguageBadge(el);
              }
            } else {
              if (el.textContent !== originalStored) {
                el.textContent = originalStored;
                removePlainLanguageBadge(el);
              }
            }
          }
        }
      });
    };

    // Helper pasang badge kecil penanda bahasa sederhana di atas teks soal
    const attachPlainLanguageBadge = (headingEl: HTMLElement) => {
      const parent = headingEl.parentElement;
      if (!parent || parent.querySelector("[data-plain-badge='true']")) return;

      const badge = document.createElement("span");
      badge.setAttribute("data-plain-badge", "true");
      badge.className =
        "inline-block bg-[#FFDF59]/20 text-[#FFDF59] border border-[#FFDF59]/40 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-2 shadow-xs animate-in fade-in";
      badge.textContent = "Bahasa Sederhana";
      parent.insertBefore(badge, headingEl);
    };

    // Helper hapus badge jika dinonaktifkan
    const removePlainLanguageBadge = (headingEl: HTMLElement) => {
      const parent = headingEl.parentElement;
      if (!parent) return;
      const existingBadge = parent.querySelector("[data-plain-badge='true']");
      if (existingBadge) {
        existingBadge.remove();
      }
    };

    // Jalankan segera saat masuk
    processQuestionElements();

    // Pantau perubahan DOM secara berkala dan observasi saat siswa berpindah soal
    const interval = setInterval(processQuestionElements, 300);

    return () => {
      clearInterval(interval);
      // Pulihkan teks asli saat unmount
      document.querySelectorAll("[data-original-question]").forEach((el) => {
        const original = el.getAttribute("data-original-question");
        if (original) el.textContent = original;
        el.removeAttribute("data-original-question");
      });
      document.querySelectorAll("[data-plain-badge='true']").forEach((b) => b.remove());
    };
  }, [isEnabled, pathname]);

  // Helper Pencari Tombol Opsi Jawaban Kuis / Soal Universal
  const collectOptionButtons = (): HTMLElement[] => {
    // Strategi 1: Cari elemen dengan atribut data-quiz-option, data-quiz-correct, id exam/latihan
    const explicit = Array.from(
      document.querySelectorAll<HTMLElement>(
        "[data-quiz-option], [data-quiz-correct], [id^='exam-opt-'], [id^='latihan-opt-'], [id^='quiz-option-']"
      )
    ).filter((el) => {
      if (el.closest("[data-a11y-ignore]")) return false;
      if (el.closest(".hidden")) return false;
      if (el.hasAttribute("data-cognitive-eliminated")) return true;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });

    if (explicit.length >= 3) return explicit;

    // Strategi 2: Fallback container grid yang memuat tombol opsi jawaban
    const candidateGrids = Array.from(
      document.querySelectorAll<HTMLElement>(".grid, [class*='grid-cols-']")
    );
    for (const grid of candidateGrids) {
      if (grid.closest("[data-a11y-ignore]")) continue;
      if (grid.closest(".hidden")) continue;

      const buttons = Array.from(
        grid.querySelectorAll<HTMLElement>(":scope > button, :scope > div > button")
      ).filter((b) => {
        if (b.closest("[data-a11y-ignore]")) return false;
        if (b.closest(".hidden")) return false;
        if (b.hasAttribute("data-cognitive-eliminated")) return true;
        const rect = b.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });

      if (buttons.length >= 3 && buttons.length <= 6) {
        return buttons;
      }
    }

    return explicit;
  };

  // 5. Fitur Bantuan 50:50 (Eliminasi 2 Opsi Salah Menjadi Tepat 2 Opsi)
  const handleEliminateDistractors = useCallback(() => {
    try {
      const allOptions = collectOptionButtons();

      if (allOptions.length === 0) {
        setAssistMessage("Tidak ada soal kuis pilihan ganda di layar.");
        setTimeout(() => setAssistMessage(null), 2500);
        return;
      }

      // Ambil opsi yang saat ini masih terlihat (belum dieliminasi)
      const visibleOptions = allOptions.filter((el) => isElementRenderedAndVisible(el));

      // Jika pilihan sudah 2 atau kurang
      if (visibleOptions.length <= 2) {
        setAssistMessage("Pilihan sudah ringkas (tersisa 2 opsi).");
        setTimeout(() => setAssistMessage(null), 2500);
        return;
      }

      // Cari tombol jawaban yang benar (melalui data-quiz-correct="true")
      let correctBtn = visibleOptions.find(
        (el) => el.getAttribute("data-quiz-correct") === "true"
      );

      // Jika tidak ada penanda eksplisit, amankan opsi pertama sebagai jawaban benar
      if (!correctBtn) {
        correctBtn = visibleOptions[0];
      }

      // Pisahkan semua opsi pengecoh (yang bukan jawaban benar)
      const distractors = visibleOptions.filter((el) => el !== correctBtn);

      // Hitung jumlah pengecoh yang harus dihilangkan agar tersisa tepat 2 opsi
      const toHideCount = Math.max(1, visibleOptions.length - 2);

      // Acak urutan pengecoh yang akan disembunyikan
      const shuffledDistractors = [...distractors].sort(() => Math.random() - 0.5);
      const toHide = shuffledDistractors.slice(0, toHideCount);

      toHide.forEach((el) => {
        el.style.display = "none";
        el.setAttribute("data-cognitive-eliminated", "true");
      });

      playClueChime();
      setAssistMessage("2 pilihan pengecoh disembunyikan. Tersisa 2 opsi!");
      setTimeout(() => setAssistMessage(null), 3000);
    } catch {
      // Safe fallback
    }
  }, []);

  // 6. Toggle On/Off Bahasa Sederhana
  const handleTogglePlainLanguage = () => {
    const nextVal = !config.plainLanguage;
    playPopSound();
    saveIntellectualConfig({ plainLanguage: nextVal });
    setAssistMessage(nextVal ? "Bahasa Sederhana aktif" : "Menampilkan bahasa buku asli");
    setTimeout(() => setAssistMessage(null), 2500);
  };

  if (!isEnabled) return null;

  return (
    <>
      {/* Toast Notifikasi Bantuan Kognitif */}
      {assistMessage && (
        <div
          data-a11y-ignore="true"
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none"
        >
          <div className="bg-[#243E19] text-white border border-[#FFDF59]/50 px-5 py-2.5 rounded-2xl shadow-xl font-bold text-sm tracking-wide flex items-center gap-2">
            <svg className="w-4 h-4 text-[#FFDF59] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{assistMessage}</span>
          </div>
        </div>
      )}

      {/* Floating Bilah Pendamping Kognitif (Single Drawer Geser Halus Persis Kamera) */}
      <div
        data-a11y-ignore="true"
        className={`fixed bottom-6 left-0 z-[9998] select-none font-sans flex items-stretch transition-transform duration-500 ease-in-out ${
          isDocked ? "-translate-x-[calc(100%-80px)]" : "translate-x-3 md:translate-x-6"
        }`}
      >
        {/* PANEL MENU UTAMA */}
        <div className="bg-[#243E19]/95 text-white border-y border-l border-[#FFDF59]/40 rounded-l-2xl py-2 px-3.5 flex items-center gap-2.5 backdrop-blur-md shadow-xl shrink-0">
          {/* Label Status Mode */}
          <div className="flex items-center gap-2 pl-1 pr-1">
            <div className="w-2 h-2 rounded-full bg-[#FFDF59]" />
            <div className="flex flex-col whitespace-nowrap">
              <span className="text-[9px] uppercase font-bold text-[#FFDF59]/80 tracking-wider">
                Pendamping Kognitif
              </span>
              <span className="text-xs font-bold text-white/95">
                {config.subMode === "slow_learner" ? "Lamban Belajar" : "Pemahaman Konkret"}
              </span>
            </div>
          </div>

          {/* Area Tombol Aksi Clean & Sederhana */}
          <div className="flex items-center gap-2 border-l border-white/15 pl-2.5">
            {/* Tombol Eliminasi 50:50 - Clean Pill */}
            <button
              id="btn-a11y-5050"
              type="button"
              onClick={handleEliminateDistractors}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 active:bg-white/25 text-white/95 border border-white/20 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs whitespace-nowrap active:translate-y-0.5"
              title="Sembunyikan 2 Pilihan Salah"
            >
              Bantuan 50:50
            </button>

            {/* Tombol Toggle Bahasa Sederhana - Clean Pill */}
            <button
              id="btn-a11y-plain-lang"
              type="button"
              onClick={handleTogglePlainLanguage}
              className={`px-3 py-1.5 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5 border whitespace-nowrap active:translate-y-0.5 ${
                config.plainLanguage
                  ? "bg-white/15 hover:bg-white/25 text-white border-white/30"
                  : "bg-transparent hover:bg-white/10 text-white/60 border-white/15"
              }`}
              title={config.plainLanguage ? "Bahasa Sederhana Aktif (Klik untuk bahasa buku asli)" : "Aktifkan Bahasa Sederhana"}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${config.plainLanguage ? "bg-[#7FD13B]" : "bg-white/30"}`} />
              <span>Bahasa Sederhana</span>
            </button>
          </div>
        </div>

        {/* TOMBOL HANDLE PENUTUP / PEMBUKA DOCKED KE PINGGIR (PERSIS MEKANISME KAMERA) */}
        <button
          type="button"
          onClick={() => setIsDocked((prev) => !prev)}
          className={`bg-[#243E19]/95 hover:bg-[#1C3213] text-[#FFDF59] border border-[#FFDF59]/40 border-l-0 rounded-r-2xl shadow-xl flex items-center justify-center cursor-pointer font-bold text-xs tracking-wide shrink-0 transition-all duration-300 backdrop-blur-md active:scale-95 ${
            isDocked ? "w-[80px] px-3 gap-1.5" : "w-[38px] px-2 text-white/70 hover:text-white"
          }`}
          title={isDocked ? "Buka Bilah Bantuan" : "Sembunyikan ke Samping"}
        >
          {isDocked ? (
            <>
              <span>Buka</span>
              <svg className="w-4 h-4 text-[#FFDF59] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
