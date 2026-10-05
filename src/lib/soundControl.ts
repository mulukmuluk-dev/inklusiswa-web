"use client";

// Helper function to check if TTS sound is globally muted
export function isTtsMuted(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("pintara_tts_muted") === "true";
}

import { getActiveSession } from "./authSession";
import { isFullVoiceEnabled } from "./accessibility";

// Global sound speak function that respects global mute setting
export function speakGlobal(text: string, onEnd?: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  
  const isLoginPage = window.location.pathname === "/";
  const session = getActiveSession();
  const voiceEnabled = isLoginPage || (session?.isLoggedIn && isFullVoiceEnabled(session));

  if (!voiceEnabled || isTtsMuted()) {
    window.speechSynthesis.cancel();
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "id-ID";
  utterance.rate = 0.95;
  
  if (onEnd) {
    utterance.onend = onEnd;
  }
  
  window.speechSynthesis.speak(utterance);
}

// Global sound toggle function
export function toggleGlobalTts(): boolean {
  if (typeof window === "undefined") return false;
  
  const currentMuted = isTtsMuted();
  const newMuted = !currentMuted;
  
  if (newMuted) {
    localStorage.setItem("pintara_tts_muted", "true");
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  } else {
    localStorage.removeItem("pintara_tts_muted");
    speakGlobal("Suara telah diaktifkan kembali.");
  }
  
  // Dispatch custom event so all pages/components can re-render mute button state instantly
  window.dispatchEvent(new CustomEvent("pintara_tts_mute_change", { detail: { muted: newMuted } }));
  return newMuted;
}
