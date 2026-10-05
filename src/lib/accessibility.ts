import { UserSession } from "./authSession";

export const isFullVoiceEnabled = (session: UserSession | null): boolean => {
  if (!session || !session.accessibilityConfig) return false;
  
  const { specificMode, physicalControlMethod } = session.accessibilityConfig;
  
  // Full Voice Control diaktifkan HANYA untuk:
  // 1. Tunanetra
  if (specificMode === "tunanetra") return true;
  
  // 2. Lumpuh Total dengan opsi Suara
  if (specificMode === "lumpuh_total" && physicalControlMethod === "suara") return true;
  
  return false;
};
