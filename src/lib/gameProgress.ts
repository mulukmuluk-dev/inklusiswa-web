"use client";

import { getActiveSession } from "./authSession";
import { supabase } from "./supabaseClient";

export interface SubjectProgress {
  subjectId: string;
  completedLevels: number[]; // e.g. [1, 2]
  totalStars: number;
  lastUpdated: string;
}

/**
 * Mendapatkan progres mata pelajaran saat ini dari LocalStorage (instan 0ms).
 */
export function getSubjectProgress(subjectId: string): SubjectProgress {
  if (typeof window === "undefined") {
    return { subjectId, completedLevels: [], totalStars: 0, lastUpdated: new Date().toISOString() };
  }

  const session = getActiveSession();
  const userId = session?.id || "guest";
  const key = `pintara_game_progress_${userId}_${subjectId}`;
  const saved = localStorage.getItem(key);

  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // fallback
    }
  }

  return { subjectId, completedLevels: [], totalStars: 0, lastUpdated: new Date().toISOString() };
}

/**
 * Menyimpan progres level yang baru diselesaikan:
 * 1. Simpan ke LocalStorage seketika (optimistic update 0ms)
 * 2. Sinkronisasikan ke Supabase database di background jika siswa login
 */
export function saveLevelCompletion(subjectId: string, levelId: number, starsEarned: number = 3): SubjectProgress {
  const current = getSubjectProgress(subjectId);
  const updatedLevels = Array.from(new Set([...current.completedLevels, levelId])).sort((a, b) => a - b);
  const updatedStars = Math.max(current.totalStars, updatedLevels.length * 3);

  const updated: SubjectProgress = {
    subjectId,
    completedLevels: updatedLevels,
    totalStars: updatedStars,
    lastUpdated: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    const session = getActiveSession();
    const userId = session?.id || "guest";
    const key = `pintara_game_progress_${userId}_${subjectId}`;
    localStorage.setItem(key, JSON.stringify(updated));

    // Kirim event update lokal
    window.dispatchEvent(new CustomEvent("pintara_game_progress_updated", { detail: updated }));

    // Sinkronisasi ke database Supabase
    if (session?.id && session.id !== "guest" && !session.id.startsWith("guest_")) {
      syncProgressToDatabase(session.id, updated).catch((err) => {
        console.warn("Background game progress sync error:", err);
      });
    }
  }

  return updated;
}

/**
 * Sinkronisasi progres ke tabel profiles di Supabase database.
 */
async function syncProgressToDatabase(userId: string, progress: SubjectProgress): Promise<void> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("accessibility_config")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.warn("Gagal membaca profil untuk sync progres:", error);
      return;
    }

    const currentConfig = data?.accessibility_config || {};
    const gameProgress = currentConfig.game_progress || {};
    
    // Merge existing remote levels if any
    const existingRemote = gameProgress[progress.subjectId] as SubjectProgress | undefined;
    const mergedLevels = Array.from(
      new Set([...(existingRemote?.completedLevels || []), ...progress.completedLevels])
    ).sort((a, b) => a - b);

    const mergedProgress: SubjectProgress = {
      subjectId: progress.subjectId,
      completedLevels: mergedLevels,
      totalStars: Math.max(existingRemote?.totalStars || 0, progress.totalStars, mergedLevels.length * 3),
      lastUpdated: progress.lastUpdated,
    };

    gameProgress[progress.subjectId] = mergedProgress;

    await supabase
      .from("profiles")
      .update({
        accessibility_config: {
          ...currentConfig,
          game_progress: gameProgress,
        },
      })
      .eq("id", userId);
  } catch (e) {
    console.warn("Error syncProgressToDatabase:", e);
  }
}

/**
 * Mengambil progres terbaru dari database Supabase (cross-device restoration),
 * lalu menggabungkannya dengan data lokal.
 */
export async function loadSubjectProgressWithRemote(
  subjectId: string,
  onRemoteLoaded?: (progress: SubjectProgress) => void
): Promise<SubjectProgress> {
  const local = getSubjectProgress(subjectId);

  if (typeof window === "undefined") return local;

  const session = getActiveSession();
  if (!session?.id || session.id === "guest" || session.id.startsWith("guest_")) {
    return local;
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("accessibility_config")
      .eq("id", session.id)
      .maybeSingle();

    if (error || !data) return local;

    const gameProgress = data.accessibility_config?.game_progress;
    const remote = gameProgress?.[subjectId] as SubjectProgress | undefined;

    if (remote && remote.completedLevels && remote.completedLevels.length > 0) {
      // Merge local and remote
      const mergedLevels = Array.from(
        new Set([...local.completedLevels, ...remote.completedLevels])
      ).sort((a, b) => a - b);

      const mergedStars = Math.max(local.totalStars, remote.totalStars || 0, mergedLevels.length * 3);

      const merged: SubjectProgress = {
        subjectId,
        completedLevels: mergedLevels,
        totalStars: mergedStars,
        lastUpdated: remote.lastUpdated || local.lastUpdated,
      };

      // Simpan ke localStorage agar offline / refresh berikutnya tetap konsisten
      const key = `pintara_game_progress_${session.id}_${subjectId}`;
      localStorage.setItem(key, JSON.stringify(merged));

      if (onRemoteLoaded) {
        onRemoteLoaded(merged);
      }

      return merged;
    }
  } catch (err) {
    console.warn("Gagal load remote progress:", err);
  }

  return local;
}
