"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { isTtsMuted, toggleGlobalTts } from "@/lib/soundControl";
import { getActiveSession } from "@/lib/authSession";
import { isFullVoiceEnabled } from "@/lib/accessibility";

interface SoundToggleButtonProps {
  className?: string;
}

export function SoundToggleButton({ className = "" }: SoundToggleButtonProps) {
  const [muted, setMuted] = useState<boolean>(false);
  const pathname = usePathname();
  const [shouldShow, setShouldShow] = useState<boolean>(true);

  useEffect(() => {
    if (pathname === "/") {
      setShouldShow(true);
    } else {
      const session = getActiveSession();
      if (session && session.isLoggedIn) {
        setShouldShow(isFullVoiceEnabled(session));
      } else {
        setShouldShow(false);
      }
    }

    setMuted(isTtsMuted());

    const handleMuteChange = (e: any) => {
      if (e.detail?.muted !== undefined) {
        setMuted(e.detail.muted);
      } else {
        setMuted(isTtsMuted());
      }
    };

    window.addEventListener("pintara_tts_mute_change", handleMuteChange);
    return () => window.removeEventListener("pintara_tts_mute_change", handleMuteChange);
  }, [pathname]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newMuted = toggleGlobalTts();
    setMuted(newMuted);
  };

  if (!shouldShow) return null;

  return (
    <button
      type="button"
      onClick={handleClick}
      data-voice-command={muted ? "nyalakan suara" : "hentikan suara"}
      className={`px-5 py-2.5 active:scale-95 text-white font-extrabold text-xs md:text-sm rounded-full shadow-md transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer border border-white/40 ${
        muted
          ? "bg-[#006E9C] hover:bg-[#00587E] shadow-[#006E9C]/25"
          : "bg-[#E6004C] hover:bg-[#CC0043] shadow-[#E6004C]/25"
      } ${className}`}
      title={muted ? "Nyalakan Suara" : "Hentikan Suara"}
    >
      {muted ? (
        <>
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
          <span>Nyalakan Suara</span>
        </>
      ) : (
        <>
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
          <span>Hentikan Suara</span>
        </>
      )}
    </button>
  );
}
