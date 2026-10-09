"use client";

import React, { useState, useEffect } from "react";
import { getSubjectProgress, saveLevelCompletion, SubjectProgress } from "@/lib/gameProgress";
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
import { getActiveSession } from "@/lib/authSession";
import { isTtsMuted, toggleGlobalTts, speakGlobal } from "@/lib/soundControl";

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
  const [selectedGrade, setSelectedGrade] = useState<number>(() => {
    if (kelasParam && (kelasParam.includes("2") || kelasParam.toLowerCase().includes("kelas 2"))) return 2;
    if (kelasParam && (kelasParam.includes("3") || kelasParam.toLowerCase().includes("kelas 3"))) return 3;
    if (kelasParam && (kelasParam.includes("4") || kelasParam.toLowerCase().includes("kelas 4"))) return 4;
    if (kelasParam && (kelasParam.includes("5") || kelasParam.toLowerCase().includes("kelas 5"))) return 5;
    if (kelasParam && (kelasParam.includes("6") || kelasParam.toLowerCase().includes("kelas 6"))) return 6;
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
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [activeAccessibilityMode, setActiveAccessibilityMode] = useState<string>("Standar");

  useEffect(() => {
    setIsMuted(isTtsMuted());
    const progressKey = `${subjectId}-k${selectedGrade}`;
    const initialProgress = getSubjectProgress(progressKey);
    setProgress(initialProgress);

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

  const getMaxLevels = () => {
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

  const handleSoundToggle = () => {
    const muted = toggleGlobalTts();
    setIsMuted(muted);
  };

  return (
    <div
      className="min-h-screen bg-[#0D9488] bg-cover bg-center bg-no-repeat bg-fixed font-sans text-[#3C632A] relative flex flex-col p-4 md:p-6 overflow-x-hidden"
      style={{ backgroundImage: "url('/images/blackboard_bg.png')" }}
    >
      {/* Tombol Panah Kembali di Atas Kiri (Persis Seperti Dashboard Utama PINTARA) */}
      <button
        onClick={() => {
          if (activeLevel !== null) {
            setActiveLevel(null); // Kembali ke peta level
            speakGlobal("Kembali ke peta petualangan.");
          } else {
            onBackToCatalog(); // Kembali ke katalog utama
          }
        }}
        data-voice-command="kembali"
        className="absolute top-6 left-6 text-[#FFBA48] hover:scale-110 transition-transform flex items-center justify-center p-2 z-[60]"
        title="Kembali ke Katalog Utama"
      >
        <svg className="w-10 h-10 drop-shadow-md" fill="currentColor" viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
      </button>

      {/* ================= HERO SECTION UTAMA (KONTAINER KUNING VIBRANT DI BAWAH PANAH) ================= */}
      <div className="flex-1 bg-[#FFBA48] rounded-[32px] p-6 md:p-8 mt-20 mr-4 ml-4 mb-8 shadow-[12px_12px_0px_0px_#3C632A] border-4 border-[#3C632A] flex flex-col relative overflow-hidden animate-in fade-in duration-300">
        
        {/* ================= HEADER INNER BAR (ORANGE KARAMEL) ================= */}
        <div className="w-full bg-[#C3631D] border-4 border-[#3C632A] p-4 md:p-5 rounded-[28px] shadow-[6px_6px_0px_0px_#3C632A] flex items-center justify-between mb-6 shrink-0 text-white flex-wrap gap-3">
          <div className="flex items-center space-x-3 flex-wrap gap-2">
            <h1 className="text-xl md:text-3xl font-black text-[#FFDF59] tracking-tight drop-shadow-sm">
              {subjectTitle}
            </h1>
            
            {/* Grade Switcher */}
            {(subjectId === "matematika" || subjectId === "math" || isIndo) && (
              <div className="flex items-center space-x-2 bg-black/10 p-1 rounded-2xl border border-white/20">
                {[1, 2, 3, 4, 5, 6].map((gr) => (
                  <button
                    key={gr}
                    type="button"
                    onClick={() => {
                      setSelectedGrade(gr);
                      setActiveLevel(null);
                    }}
                    className={`px-3 py-1 font-extrabold text-xs md:text-sm rounded-xl border-2 border-[#3C632A] transition-all cursor-pointer ${
                      selectedGrade === gr
                        ? "bg-[#7FD13B] text-white shadow-sm scale-105"
                        : "bg-white/80 text-[#3C632A] hover:bg-white"
                    }`}
                  >
                    Kelas {gr} SD
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {/* Mute Button */}
            <button
              onClick={handleSoundToggle}
              className={`p-2.5 md:p-3 rounded-2xl border-4 border-[#3C632A] font-black transition-all shadow-[4px_4px_0px_0px_#3C632A] ${
                isMuted ? "bg-rose-500 text-white" : "bg-[#7FD13B] text-white hover:scale-105"
              }`}
              title={isMuted ? "Suara Ditingkam" : "Suara Aktif"}
            >
              {isMuted ? "🔇" : "🔊"}
            </button>

            {/* Stars Count Badge */}
            <div className="flex items-center space-x-1.5 bg-[#FFDF59] text-[#3C632A] font-black px-4 py-2 rounded-2xl border-4 border-[#3C632A] shadow-[4px_4px_0px_0px_#3C632A]">
              <span className="text-xl">⭐</span>
              <span className="text-lg md:text-xl">{progress.totalStars}</span>
            </div>
          </div>
        </div>

        {/* ================= STAGE CONTENT AREA ================= */}
        <div className="flex-1 w-full overflow-y-auto custom-scrollbar flex flex-col items-center justify-center">
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
              ) : (
                <div className="w-full p-10 bg-white/40 border-4 border-[#3C632A] rounded-[32px] text-center space-y-4 shadow-[8px_8px_0px_0px_#3C632A]">
                  <h2 className="text-3xl font-black text-[#3C632A]">
                    🎮 Game Interaktif {subjectTitle}
                  </h2>
                  <p className="text-base font-bold text-[#3C632A]/90">
                    Panggung game modul {subjectTitle} sedang disiapkan.
                  </p>
                  <button
                    onClick={() => onBackToCatalog()}
                    className="px-6 py-3 bg-[#7FD13B] text-white font-black rounded-2xl border-4 border-[#3C632A] shadow-[4px_4px_0px_0px_#3C632A]"
                  >
                    Kembali ke Katalog
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* ================= REWARD CELEBRATION MODAL ================= */}
      {showRewardModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
          <div className="bg-[#FFE296] border-8 border-[#3C632A] rounded-[40px] p-8 md:p-12 max-w-lg w-full text-center shadow-[12px_12px_0px_0px_#3C632A] relative overflow-hidden flex flex-col items-center space-y-6">
            <div className="text-6xl animate-bounce flex justify-center space-x-2">
              <span>⭐</span>
              <span>⭐</span>
              <span>⭐</span>
            </div>

            <h2 className="text-3xl md:text-4xl font-black text-[#3C632A] drop-shadow-sm">
              LUAR BIASA!
            </h2>

            <p className="text-lg font-black text-[#3C632A] leading-relaxed">
              Kamu berhasil menyelesaikan <span className="text-[#C3631D]">Level {activeLevel}</span> dan mendapatkan <span className="text-[#C3631D]">{rewardStars} Bintang Emas</span>!
            </p>

            <button
              onClick={handleNextLevelOrMap}
              className="w-full py-4 bg-[#7FD13B] hover:bg-[#6EB832] border-4 border-[#3C632A] text-white font-black text-xl rounded-[24px] shadow-[4px_4px_0px_0px_#3C632A] hover:scale-105 active:scale-95 transition-all"
            >
              {activeLevel && activeLevel < getMaxLevels() ? "Lanjut Level Berikutnya" : "Kembali ke Peta Level"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
