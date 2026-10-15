"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { VoiceControlOverlay } from "@/components/VoiceControlOverlay";
import { SignControlOverlay } from "@/components/SignControlOverlay";
import { EyeControlOverlay } from "@/components/EyeControlOverlay";
import { MotorControlOverlay } from "@/components/MotorControlOverlay";
import { CognitiveAssistOverlay } from "@/components/CognitiveAssistOverlay";
import { MentalControlOverlay } from "@/components/MentalControlOverlay";

/**
 * Gatekeeper untuk seluruh overlay aksesibilitas PINTARA.
 * Memastikan fitur-fitur sensor/kamera/toolbar aksesibilitas HANYA aktif
 * ketika user sudah masuk ke dashboard atau halaman belajar (/dashboard, /materi, /kelas).
 * DI LANDING PAGE (/) SAMA SEKALI TIDAK BOLEH MUNCUL.
 */
export function AccessibilityOverlaysWrapper() {
  const pathname = usePathname();

  // Matikan dan unmount seluruh overlay saat di Landing Page (/)
  if (!pathname || pathname === "/") {
    return null;
  }

  return (
    <>
      <VoiceControlOverlay />
      <SignControlOverlay />
      <EyeControlOverlay />
      <MotorControlOverlay />
      <CognitiveAssistOverlay />
      <MentalControlOverlay />
    </>
  );
}
