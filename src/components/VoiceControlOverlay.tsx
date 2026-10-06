"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useVoiceControl } from "@/hooks/useVoiceControl";
import { getActiveSession } from "@/lib/authSession";
import { isFullVoiceEnabled } from "@/lib/accessibility";

export function VoiceControlOverlay() {
  const [showPanel, setShowPanel] = useState(true);
  const pathname = usePathname();
  const [shouldShow, setShouldShow] = useState(true);

  useEffect(() => {
    // Cek apakah mode aksesibilitas mengharuskan Full Voice Control
    const session = getActiveSession();
    if (session && session.isLoggedIn) {
      setShouldShow(isFullVoiceEnabled(session));
    } else {
      setShouldShow(false);
    }
  }, [pathname]);

  // Kontrol Suara otomatis nyala sesuai dengan shouldShow
  const {
    isListening,
    transcript,
    lastExecuted,
    isSpeaking,
    isSupported,
    statusMessage,
    toggleListening,
  } = useVoiceControl(shouldShow);

  if (!shouldShow) return null;

  if (!isSupported) {
    return (
      <div className="fixed bottom-4 left-4 z-50 bg-red-950 text-red-200 text-xs p-3 rounded-xl border border-red-800 shadow-xl max-w-xs">
        Browser Anda belum mendukung Web Speech API untuk Full Voice Control. Gunakan Google Chrome atau Edge.
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start gap-3">
      {/* Voice Status Pill Button */}
      <button
        onClick={toggleListening}
        className={`flex items-center space-x-4 px-6 py-4 rounded-full text-base md:text-lg font-black shadow-2xl transition-all border-4 transform hover:scale-105 active:scale-95 ${
          isListening
            ? "bg-slate-900 text-white border-blue-500 shadow-blue-500/30"
            : "bg-white text-slate-700 border-slate-300"
        }`}
      >
        <span className="relative flex h-4 w-4">
          {isListening && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          )}
          <span
            className={`relative inline-flex rounded-full h-4 w-4 ${
              isListening ? "bg-blue-500" : "bg-slate-400"
            }`}
          ></span>
        </span>
        <span>
          {isListening
            ? isSpeaking
              ? "Menyebutkan Suara..."
              : "Hentikan Suara"
            : "Nyalakan Suara"}
        </span>
      </button>

      {/* Detail Live Control & Debugging Box */}
      {showPanel && isListening && (
        <div className="bg-slate-900/95 text-white p-4 rounded-2xl shadow-2xl border border-slate-800 max-w-sm backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs text-slate-400 font-bold uppercase tracking-wider">
            <span>Mekanisme Suara PINTARA</span>
            <button
              onClick={() => setShowPanel(false)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="mt-3 space-y-2 text-xs">
            <div>
              <span className="text-slate-400">Status Engine:</span>{" "}
              <span className="font-semibold text-blue-400">{statusMessage}</span>
            </div>

            {transcript && (
              <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/50">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Ucapan Pengguna (Terdeteksi):
                </span>
                <p className="text-white font-mono text-sm mt-0.5">"{transcript}"</p>
              </div>
            )}

            {lastExecuted && (
              <div className="bg-emerald-950/50 p-2.5 rounded-lg border border-emerald-800/50">
                <span className="text-emerald-400 block text-[10px] uppercase font-bold">
                  Aksi Berhasil Dijalankan:
                </span>
                <p className="text-emerald-200 font-semibold mt-0.5">✓ {lastExecuted}</p>
              </div>
            )}

            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
              <span className="text-slate-300 font-semibold">Ucapkan perintah:</span>
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-400">
                <li>"Isi nama dengan Hafiz" / "Masuk"</li>
                <li>"Mode Sensorik" / "Lanjut"</li>
                <li>"Buka Biologi" / "Buka Matematika"</li>
                <li>"Baca" / "Kembali" / "Stop"</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
