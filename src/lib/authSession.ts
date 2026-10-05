// Helper Manajemen Sesi & Autentikasi User (Siswa & Guru) - PINTARA
import { supabase } from "./supabaseClient";

export interface UserSession {
  id: string;
  name: string;
  emailOrNip: string;
  role: "siswa" | "guru";
  isLoggedIn: boolean;
  createdAt: string;
  roomCode?: string;
  jenjang?: string;
  accessibilityConfig?: {
    mainMode?: string | null;
    specificMode?: string | null;
    physicalControlMethod?: string | null;
  };
}

const SESSION_KEY = "pintara_active_session";

/**
  * Mengambil data sesi pengguna aktif dari localStorage (per profil browser)
  */
export function getActiveSession(): UserSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserSession;
    if (parsed && parsed.isLoggedIn) {
      return parsed;
    }
    return null;
  } catch (e) {
    console.error("Error reading user session:", e);
    return null;
  }
}

/**
  * Menyimpan data sesi pengguna (Siswa / Guru) saat Login / Register
  */
export function setActiveSession(session: UserSession): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (e) {
    console.error("Error saving user session:", e);
  }
}

/**
  * Logout / Hapus Sesi Pengguna
  */
export function clearActiveSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(SESSION_KEY);
    supabase.auth.signOut().catch(() => {});
  } catch (e) {
    console.error("Error clearing user session:", e);
  }
}
