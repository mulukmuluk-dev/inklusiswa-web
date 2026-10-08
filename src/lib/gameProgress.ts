"use client";

import { getActiveSession } from "./authSession";

export interface SubjectProgress {
  subjectId: string;
  completedLevels: number[]; // e.g. [1, 2]
  totalStars: number;
  lastUpdated: string;
}

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

export function saveLevelCompletion(subjectId: string, levelId: number, starsEarned: number = 3): SubjectProgress {
  const current = getSubjectProgress(subjectId);
  const updatedLevels = Array.from(new Set([...current.completedLevels, levelId]));
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

    // Notify listeners if any
    window.dispatchEvent(new CustomEvent("pintara_game_progress_updated", { detail: updated }));
  }

  return updated;
}
