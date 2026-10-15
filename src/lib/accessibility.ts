import { UserSession } from "./authSession";

export const isEyeControlEnabled = (session: UserSession | null): boolean => {
  // Guru tidak menggunakan kontrol aksesibilitas siswa
  if (session && session.role === "guru") return false;

  // Cek apakah ada flag aktif di localStorage per profil browser
  if (typeof window !== "undefined") {
    if (localStorage.getItem("pintara_eye_control_enabled") === "true") return true;
    const a11yRaw = localStorage.getItem("pintara_a11y_config");
    if (a11yRaw) {
      try {
        const parsed = JSON.parse(a11yRaw);
        if (parsed.physicalControlMethod === "mata" || parsed.mainMode === "fisik_mata") return true;
      } catch {}
    }
  }

  if (!session || !session.accessibilityConfig) return false;
  
  const { specificMode, physicalControlMethod, mainMode } = session.accessibilityConfig;
  
  // Kontrol Mata diaktifkan HANYA untuk:
  // 1. Lumpuh Total dengan opsi Mata
  if (physicalControlMethod === "mata" || mainMode === "fisik_mata") return true;
  if (specificMode === "lumpuh_total" && physicalControlMethod === "mata") return true;
  
  return false;
};

export const isFullVoiceEnabled = (session: UserSession | null): boolean => {
  // Guru tidak menggunakan kontrol suara siswa
  if (!session || session.role === "guru" || !session.accessibilityConfig) return false;
  
  // Mode Mata dan Mode Isyarat MUTLAK TIDAK BOLEH mengaktifkan kontrol suara
  if (isEyeControlEnabled(session)) return false;

  const { specificMode, physicalControlMethod, mainMode } = session.accessibilityConfig;
  if (physicalControlMethod === "mata" || mainMode === "fisik_mata") return false;
  if (physicalControlMethod === "isyarat" || mainMode === "sensorik_tunarungu") return false;
  
  // Full Voice Control diaktifkan HANYA untuk:
  // 1. Tunanetra
  if (specificMode === "tunanetra" || mainMode === "sensorik_tunanetra") return true;
  
  // 2. Lumpuh Total dengan opsi Suara
  if (specificMode === "lumpuh_total" && physicalControlMethod === "suara") return true;
  
  return false;
};

export { isMotorControlEnabled } from "./motoricAccessibility";
export { isIntellectualModeEnabled, getIntellectualConfig } from "./intellectualAccessibility";
export { isMentalModeEnabled, getMentalConfig } from "./mentalAccessibility";



