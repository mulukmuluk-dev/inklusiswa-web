"use client";

import React, { useState, useEffect } from "react";
import { getSubjectProgress, saveLevelCompletion, loadSubjectProgressWithRemote, SubjectProgress } from "@/lib/gameProgress";
import { LevelMap } from "./LevelMap";
import { MathGrade1Game } from "./subjects/MathGrade1Game";
import { MathGrade2Game } from "./subjects/MathGrade2Game";
import { MathGrade3Game } from "./subjects/MathGrade3Game";
import { MathGrade4Game } from "./subjects/MathGrade4Game";
import { MathGrade5Game } from "./subjects/MathGrade5Game";
import { MathGrade6Game } from "./subjects/MathGrade6Game";
import { IndoGrade1Game } from "./subjects/IndoGrade1Game";
import { IndoGrade2Game } from "./subjects/IndoGrade2Game";
import { IndoGrade3Game } from "./subjects/IndoGrade3Game";
import { IndoGrade4Game } from "./subjects/IndoGrade4Game";
import { IndoGrade5Game } from "./subjects/IndoGrade5Game";
import { IndoGrade6Game } from "./subjects/IndoGrade6Game";
import { EnglishGrade1Game } from "./subjects/EnglishGrade1Game";
import { EnglishGrade2Game } from "./subjects/EnglishGrade2Game";
import { EnglishGrade3Game } from "./subjects/EnglishGrade3Game";
import { EnglishGrade4Game } from "./subjects/EnglishGrade4Game";
import { EnglishGrade5Game } from "./subjects/EnglishGrade5Game";
import { EnglishGrade6Game } from "./subjects/EnglishGrade6Game";
import { IpasGrade4Game } from "./subjects/IpasGrade4Game";
import { IpasGrade5Game } from "./subjects/IpasGrade5Game";
import { IpasGrade6Game } from "./subjects/IpasGrade6Game";
import { PancasilaGrade1Game } from "./subjects/PancasilaGrade1Game";
import { PancasilaGrade2Game } from "./subjects/PancasilaGrade2Game";
import { PancasilaGrade3Game } from "./subjects/PancasilaGrade3Game";
import { PancasilaGrade4Game } from "./subjects/PancasilaGrade4Game";
import { PancasilaGrade5Game } from "./subjects/PancasilaGrade5Game";
import { PancasilaGrade6Game } from "./subjects/PancasilaGrade6Game";
import { SeniGrade1Game } from "./subjects/SeniGrade1Game";
import { SeniGrade2Game } from "./subjects/SeniGrade2Game";
import { SeniGrade3Game } from "./subjects/SeniGrade3Game";
import { SeniGrade4Game } from "./subjects/SeniGrade4Game";
import { SeniGrade5Game } from "./subjects/SeniGrade5Game";
import { SeniGrade6Game } from "./subjects/SeniGrade6Game";
import { getActiveSession } from "@/lib/authSession";
import { speakGlobal } from "@/lib/soundControl";

interface GameEngineStageProps {
  subjectId: string;
  subjectTitle: string;
  kelasParam?: string;
  onBackToCatalog: () => void;
}

export function GameEngineStage({
  subjectId,
  subjectTitle,
  kelasParam,
  onBackToCatalog,
}: GameEngineStageProps) {
  const [activeLevel, setActiveLevel] = useState<number | null>(null);
  const [userSession, setUserSession] = useState(() => getActiveSession());
  const [selectedGrade, setSelectedGrade] = useState<number>(() => {
    const session = getActiveSession();
    const rawGrade = (session?.role === "siswa" && session?.jenjang)
      ? session.jenjang
      : (kelasParam || session?.jenjang || "");
    const match = rawGrade.match(/\d+/);
    if (match) return parseInt(match[0], 10);
    if (subjectId === "ipas" || subjectId === "ipa" || subjectId === "ips") return 4;
    return 1;
  });
  const [progress, setProgress] = useState<SubjectProgress>({
    subjectId,
    completedLevels: [],
    totalStars: 0,
    lastUpdated: new Date().toISOString(),
  });
  const [showRewardModal, setShowRewardModal] = useState<boolean>(false);
  const [rewardStars, setRewardStars] = useState<number>(3);
  const [activeAccessibilityMode, setActiveAccessibilityMode] = useState<string>("Standar");

  useEffect(() => {
    const progressKey = `${subjectId}-k${selectedGrade}`;
    const initialProgress = getSubjectProgress(progressKey);
    setProgress(initialProgress);

    // Sinkronisasi otomatis data progres dari cloud database Supabase
    loadSubjectProgressWithRemote(progressKey, (remote) => {
      setProgress(remote);
    });

    // Get session mode
    const session = getActiveSession();
    if (session?.accessibilityConfig?.mainMode) {
      setActiveAccessibilityMode(session.accessibilityConfig.mainMode);
    }
  }, [subjectId, selectedGrade]);

  const handleLevelSelect = (levelId: number) => {
    setActiveLevel(levelId);
  };

  const handleLevelComplete = (levelId: number, starsEarned: number) => {
    const progressKey = `${subjectId}-k${selectedGrade}`;
    const updated = saveLevelCompletion(progressKey, levelId, starsEarned);
    setProgress(updated);
    setRewardStars(starsEarned);
    setShowRewardModal(true);
  };

  const isIndo = subjectId === "indonesia" || subjectId === "bahasa-indonesia";
  const isEnglish = subjectId === "inggris" || subjectId === "bahasa-inggris" || subjectId === "english";
  const isIpas = subjectId === "ipas" || subjectId === "ipa" || subjectId === "ips";
  const isPancasila = subjectId === "pancasila" || subjectId === "pkn" || subjectId === "pendidikan-pancasila";
  const isSeni = subjectId === "seni-budaya" || subjectId === "seni" || subjectId === "sbk";

  const getMaxLevels = () => {
    if (isSeni) return 4;
    if (isPancasila) return 4;
    if (isIpas) return 8;
    if (isEnglish) {
      if (selectedGrade === 5 || selectedGrade === 6) return 6;
      return 7;
    }
    if (isIndo) {
      if (selectedGrade === 2 || selectedGrade === 4) return 7;
      return 6;
    }
    return 10;
  };

  const handleNextLevelOrMap = () => {
    setShowRewardModal(false);
    const maxLvl = getMaxLevels();
    if (activeLevel && activeLevel < maxLvl) {
      setActiveLevel(activeLevel + 1);
    } else {
      setActiveLevel(null); // Back to map
    }
  };

  return (
    <div
      className="min-h-screen bg-[#0D9488] bg-cover bg-center bg-no-repeat bg-fixed font-sans text-[#3C632A] relative flex flex-col p-4 md:p-6 overflow-x-hidden"
      style={{ backgroundImage: "url('/images/blackboard_bg.png')" }}
    >
      {/* Tombol Kembali (Panah Asli Seperti di Dashboard Utama) */}
      <button
        onClick={() => {
          if (activeLevel !== null) {
            setActiveLevel(null); // Kembali ke peta level
            speakGlobal("Kembali ke peta petualangan.");
          } else {
            onBackToCatalog(); // Kembali ke katalog utama petualangan belajar
          }
        }}
        id="btn-back-nav"
        data-scan-label={activeLevel !== null ? "Kembali ke Peta Level" : "Kembali ke Petualangan Belajar"}
        data-voice-command="kembali"
        data-no-ring="true"
        aria-label={activeLevel !== null ? "Kembali ke Peta Level" : "Kembali ke Petualangan Belajar"}
        className="absolute top-6 left-6 text-[#FFBA48] hover:scale-110 transition-transform flex items-center justify-center p-2 z-[60] cursor-pointer"
        title={activeLevel !== null ? "Kembali ke Peta Level" : "Kembali ke Petualangan Belajar"}
      >
        <svg className="w-10 h-10 drop-shadow-md" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
        </svg>
      </button>

      {/* ================= HERO SECTION UTAMA (KONTAINER KUNING VIBRANT DI BAWAH PANAH) ================= */}
      <div className="flex-1 bg-[#FFBA48] rounded-[32px] p-6 md:p-8 mt-20 mr-4 ml-4 mb-8 shadow-xl border-4 border-[#3C632A] flex flex-col relative overflow-hidden animate-in fade-in duration-300">
        
        {/* Kontainer Scroll Utama: Mencakup header hingga bagian bawah sehingga scrollbar membentang penuh dari paling atas */}
        <main className="flex-1 w-full overflow-y-auto custom-scrollbar pr-2 flex flex-col items-center justify-start space-y-6">
          
          {/* ================= HEADER INNER BAR (ORANGE KARAMEL) ================= */}
          <div className="w-full bg-[#C3631D] border-4 border-[#3C632A] p-4 md:p-5 rounded-[28px] shadow-md flex items-center justify-between shrink-0 text-white flex-wrap gap-3">
            <div className="flex items-center space-x-3 flex-wrap gap-2">
              <h1 className="text-xl md:text-3xl font-black text-[#FFDF59] tracking-tight drop-shadow-sm">
                {subjectTitle}
              </h1>
              
              {/* Static Grade Badge */}
              <div className="flex items-center space-x-2 bg-black/20 px-3.5 py-1.5 rounded-2xl border-2 border-white/30 shadow-inner">
                <span className="text-[#FFDF59] font-black text-xs md:text-sm uppercase tracking-wider drop-shadow-sm">
                  Kelas {selectedGrade} SD
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Stars Count Badge */}
              <div className="flex items-center space-x-1.5 bg-[#FFDF59] text-[#3C632A] font-black px-4 py-2 rounded-2xl border-4 border-[#3C632A] shadow-sm">
                <svg className="w-5 h-5 text-amber-500 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                <span className="text-lg md:text-xl">{progress.totalStars}</span>
              </div>
            </div>
          </div>

          {/* ================= STAGE CONTENT AREA ================= */}
          <div className="w-full flex-1 flex flex-col items-center justify-start">
            {activeLevel === null ? (
              <LevelMap
                subjectName={`${subjectTitle} - Kelas ${selectedGrade} SD`}
                progress={progress}
                grade={selectedGrade}
                onSelectLevel={handleLevelSelect}
              />
            ) : (
            <div className="w-full flex flex-col items-center justify-center">
              {subjectId === "matematika" || subjectId === "math" ? (
                selectedGrade === 6 ? (
                  <MathGrade6Game
                    levelId={activeLevel}
                    onLevelComplete={handleLevelComplete}
                    accessibilityMode={activeAccessibilityMode}
                  />
                ) : selectedGrade === 5 ? (
                  <MathGrade5Game
                    levelId={activeLevel}
                    onLevelComplete={handleLevelComplete}
                    accessibilityMode={activeAccessibilityMode}
                  />
                ) : selectedGrade === 4 ? (
                  <MathGrade4Game
                    levelId={activeLevel}
                    onLevelComplete={handleLevelComplete}
                    accessibilityMode={activeAccessibilityMode}
                  />
                ) : selectedGrade === 3 ? (
                  <MathGrade3Game
                    levelId={activeLevel}
                    onLevelComplete={handleLevelComplete}
                    accessibilityMode={activeAccessibilityMode}
                  />
                ) : selectedGrade === 2 ? (
                  <MathGrade2Game
                    levelId={activeLevel}
                    onLevelComplete={handleLevelComplete}
                    accessibilityMode={activeAccessibilityMode}
                  />
                ) : (
                  <MathGrade1Game
                    levelId={activeLevel}
                    onLevelComplete={handleLevelComplete}
                    accessibilityMode={activeAccessibilityMode}
                  />
                )
              ) : isIndo ? (
                selectedGrade === 6 ? (
                  <IndoGrade6Game
                    levelId={activeLevel}
                    onLevelComplete={handleLevelComplete}
                    accessibilityMode={activeAccessibilityMode}
                  />
                ) : selectedGrade === 5 ? (
                  <IndoGrade5Game
                    levelId={activeLevel}
                    onLevelComplete={handleLevelComplete}
                    accessibilityMode={activeAccessibilityMode}
                  />
                ) : selectedGrade === 4 ? (
                  <IndoGrade4Game
                    levelId={activeLevel}
                    onLevelComplete={handleLevelComplete}
                    accessibilityMode={activeAccessibilityMode}
                  />
                ) : selectedGrade === 3 ? (
                  <IndoGrade3Game
                    levelId={activeLevel}
                    onLevelComplete={handleLevelComplete}
                    accessibilityMode={activeAccessibilityMode}
                  />
                ) : selectedGrade === 2 ? (
                  <IndoGrade2Game
                    levelId={activeLevel}
                    onLevelComplete={handleLevelComplete}
                    accessibilityMode={activeAccessibilityMode}
                  />
                ) : (
                  <IndoGrade1Game
                    levelId={activeLevel}
                    onLevelComplete={handleLevelComplete}
                    accessibilityMode={activeAccessibilityMode}
                  />
                )
              ) : isEnglish ? (
                selectedGrade === 6 ? (
                  <EnglishGrade6Game
                    levelId={activeLevel}
                    onLevelComplete={handleLevelComplete}
                    accessibilityMode={activeAccessibilityMode}
                  />
                ) : selectedGrade === 5 ? (
                  <EnglishGrade5Game
                    levelId={activeLevel}
                    onLevelComplete={handleLevelComplete}
                    accessibilityMode={activeAccessibilityMode}
                  />
                ) : selectedGrade === 4 ? (
                  <EnglishGrade4Game
                    levelId={activeLevel}
                    onLevelComplete={handleLevelComplete}
                    accessibilityMode={activeAccessibilityMode}
                  />
                ) : selectedGrade === 3 ? (
                  <EnglishGrade3Game
                    levelId={activeLevel}
                    onLevelComplete={handleLevelComplete}
                    accessibilityMode={activeAccessibilityMode}
                  />
                ) : selectedGrade === 2 ? (
                  <EnglishGrade2Game
                    levelId={activeLevel}
                    onLevelComplete={handleLevelComplete}
                    accessibilityMode={activeAccessibilityMode}
                  />
                ) : (
                  <EnglishGrade1Game
                    levelId={activeLevel}
                    onLevelComplete={handleLevelComplete}
                    accessibilityMode={activeAccessibilityMode}
                  />
                )
              ) : isIpas ? (
                selectedGrade === 6 ? (
                  <IpasGrade6Game
                    levelId={activeLevel}
                    onLevelComplete={handleLevelComplete}
                    accessibilityMode={activeAccessibilityMode}
                  />
                ) : selectedGrade === 5 ? (
                  <IpasGrade5Game
                    levelId={activeLevel}
                    onLevelComplete={handleLevelComplete}
                    accessibilityMode={activeAccessibilityMode}
                  />
                ) : (
                  <IpasGrade4Game
                    levelId={activeLevel}
                    onLevelComplete={handleLevelComplete}
                    accessibilityMode={activeAccessibilityMode}
                  />
                )
              ) : isPancasila ? (
                selectedGrade === 6 ? (
                  <PancasilaGrade6Game
                    levelId={activeLevel}
                    onLevelComplete={handleLevelComplete}
                    accessibilityMode={activeAccessibilityMode}
                  />
                ) : selectedGrade === 5 ? (
                  <PancasilaGrade5Game
                    levelId={activeLevel}
                    onLevelComplete={handleLevelComplete}
                    accessibilityMode={activeAccessibilityMode}
                  />
                ) : selectedGrade === 4 ? (
                  <PancasilaGrade4Game
                    levelId={activeLevel}
                    onLevelComplete={handleLevelComplete}
                    accessibilityMode={activeAccessibilityMode}
                  />
                ) : selectedGrade === 3 ? (
                  <PancasilaGrade3Game
                    levelId={activeLevel}
                    onLevelComplete={handleLevelComplete}
                    accessibilityMode={activeAccessibilityMode}
                  />
                ) : selectedGrade === 2 ? (
                  <PancasilaGrade2Game
                    levelId={activeLevel}
                    onLevelComplete={handleLevelComplete}
                    accessibilityMode={activeAccessibilityMode}
                  />
                ) : (
                  <PancasilaGrade1Game
                    levelId={activeLevel}
                    onLevelComplete={handleLevelComplete}
                    accessibilityMode={activeAccessibilityMode}
                  />
                )
              ) : isSeni ? (
                selectedGrade === 6 ? (
                  <SeniGrade6Game
                    levelId={activeLevel}
                    onLevelComplete={handleLevelComplete}
                    accessibilityMode={activeAccessibilityMode}
                  />
                ) : selectedGrade === 5 ? (
                  <SeniGrade5Game
                    levelId={activeLevel}
                    onLevelComplete={handleLevelComplete}
                    accessibilityMode={activeAccessibilityMode}
                  />
                ) : selectedGrade === 4 ? (
                  <SeniGrade4Game
                    levelId={activeLevel}
                    onLevelComplete={handleLevelComplete}
                    accessibilityMode={activeAccessibilityMode}
                  />
                ) : selectedGrade === 3 ? (
                  <SeniGrade3Game
                    levelId={activeLevel}
                    onLevelComplete={handleLevelComplete}
                    accessibilityMode={activeAccessibilityMode}
                  />
                ) : selectedGrade === 2 ? (
                  <SeniGrade2Game
                    levelId={activeLevel}
                    onLevelComplete={handleLevelComplete}
                    accessibilityMode={activeAccessibilityMode}
                  />
                ) : (
                  <SeniGrade1Game
                    levelId={activeLevel}
                    onLevelComplete={handleLevelComplete}
                    accessibilityMode={activeAccessibilityMode}
                  />
                )
              ) : (
                <div className="w-full p-10 bg-white/40 border-4 border-[#3C632A] rounded-[32px] text-center space-y-4 shadow-xl">
                  <h2 className="text-3xl font-black text-[#3C632A]">
                    Game Interaktif {subjectTitle}
                  </h2>
                  <p className="text-base font-bold text-[#3C632A]/90">
                    Panggung game modul {subjectTitle} sedang disiapkan.
                  </p>
                  <button
                    onClick={() => onBackToCatalog()}
                    className="px-6 py-3 bg-[#7FD13B] text-white font-black rounded-2xl border-4 border-[#3C632A] shadow-md hover:shadow-lg"
                  >
                    Kembali ke Katalog
                  </button>
                </div>
              )}
            </div>
          )}
          </div>
        </main>

      </div>

      {/* ================= REWARD CELEBRATION MODAL ================= */}
      {showRewardModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
          <div className="bg-[#FFE296] border-8 border-[#3C632A] rounded-[40px] p-8 md:p-12 max-w-lg w-full text-center shadow-2xl relative overflow-hidden flex flex-col items-center space-y-6">
            <div className="animate-bounce flex justify-center space-x-3">
              <svg className="w-12 h-12 text-amber-500 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
              <svg className="w-14 h-14 text-amber-500 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
              <svg className="w-12 h-12 text-amber-500 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
            </div>

            <h2 className="text-3xl md:text-4xl font-black text-[#3C632A] drop-shadow-sm">
              LUAR BIASA!
            </h2>

            <p className="text-lg font-black text-[#3C632A] leading-relaxed">
              Kamu berhasil menyelesaikan <span className="text-[#C3631D]">Level {activeLevel}</span> dan mendapatkan <span className="text-[#C3631D]">{rewardStars} Bintang Emas</span>!
            </p>

            <button
              onClick={handleNextLevelOrMap}
              data-gaze-primary="true"
              data-gaze-label={activeLevel && activeLevel < getMaxLevels() ? "Lanjut Level" : "Peta Level"}
              className="w-full py-4 bg-[#7FD13B] hover:bg-[#6EB832] border-4 border-[#3C632A] text-white font-black text-xl rounded-[24px] shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all"
            >
              {activeLevel && activeLevel < getMaxLevels() ? "Lanjut Level Berikutnya" : "Kembali ke Peta Level"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
