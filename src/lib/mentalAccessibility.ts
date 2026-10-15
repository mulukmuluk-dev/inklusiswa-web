import { UserSession } from "./authSession";

export interface MentalConfig {
  calmTheme: boolean;
  readingRuler: boolean;
  readingMask: boolean;
  reduceSensory: boolean;
  focusMode?: boolean;
}

export const DEFAULT_MENTAL_CONFIG: MentalConfig = {
  calmTheme: true,
  readingRuler: false,
  readingMask: false,
  reduceSensory: true,
  focusMode: false,
};

const STORAGE_KEY_CONFIG = "pintara_mental_config";
const STORAGE_KEY_ENABLED = "pintara_mental_enabled";

export function getMentalConfig(): MentalConfig {
  if (typeof window === "undefined") return { ...DEFAULT_MENTAL_CONFIG };
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (!raw) return { ...DEFAULT_MENTAL_CONFIG };
    const parsed = JSON.parse(raw);
    return {
      calmTheme: typeof parsed.calmTheme === "boolean" ? parsed.calmTheme : DEFAULT_MENTAL_CONFIG.calmTheme,
      readingRuler: typeof parsed.readingRuler === "boolean" ? parsed.readingRuler : DEFAULT_MENTAL_CONFIG.readingRuler,
      readingMask: typeof parsed.readingMask === "boolean" ? parsed.readingMask : DEFAULT_MENTAL_CONFIG.readingMask,
      reduceSensory: typeof parsed.reduceSensory === "boolean" ? parsed.reduceSensory : DEFAULT_MENTAL_CONFIG.reduceSensory,
      focusMode: typeof parsed.focusMode === "boolean" ? parsed.focusMode : DEFAULT_MENTAL_CONFIG.focusMode,
    };
  } catch {
    return { ...DEFAULT_MENTAL_CONFIG };
  }
}

export function saveMentalConfig(config: Partial<MentalConfig>): MentalConfig {
  if (typeof window === "undefined") return { ...DEFAULT_MENTAL_CONFIG, ...config };
  try {
    const current = getMentalConfig();
    const updated: MentalConfig = { ...current, ...config };
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("pintara_mental_config_changed", { detail: updated }));
    return updated;
  } catch {
    return { ...DEFAULT_MENTAL_CONFIG };
  }
}

export function isMentalModeEnabled(session: UserSession | null): boolean {
  if (session && session.role === "guru") return false;

  if (typeof window !== "undefined") {
    if (localStorage.getItem(STORAGE_KEY_ENABLED) === "true") return true;
    const a11yRaw = localStorage.getItem("pintara_a11y_config");
    if (a11yRaw) {
      try {
        const parsed = JSON.parse(a11yRaw);
        if (parsed.mainMode === "mental") {
          return true;
        }
      } catch {}
    }
  }

  if (!session || !session.accessibilityConfig) return false;
  return session.accessibilityConfig.mainMode === "mental";
}
