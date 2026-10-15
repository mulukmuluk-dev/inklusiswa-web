import { UserSession } from "./authSession";

export type IntellectualSubMode = "slow_learner" | "piktogram_konkret";

export interface IntellectualConfig {
  subMode: IntellectualSubMode;
  hideTimer: boolean;
  reduceOptions: boolean;
  secondChance: boolean;
  showHints: boolean;
  plainLanguage: boolean;
}

export const DEFAULT_INTELLECTUAL_CONFIG: IntellectualConfig = {
  subMode: "slow_learner",
  hideTimer: true,
  reduceOptions: false,
  secondChance: true,
  showHints: true,
  plainLanguage: true,
};

const STORAGE_KEY_CONFIG = "pintara_intellectual_config";
const STORAGE_KEY_ENABLED = "pintara_intellectual_enabled";

export function getIntellectualConfig(): IntellectualConfig {
  if (typeof window === "undefined") return { ...DEFAULT_INTELLECTUAL_CONFIG };
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (!raw) return { ...DEFAULT_INTELLECTUAL_CONFIG };
    const parsed = JSON.parse(raw);
    return {
      subMode: parsed.subMode || DEFAULT_INTELLECTUAL_CONFIG.subMode,
      hideTimer: typeof parsed.hideTimer === "boolean" ? parsed.hideTimer : DEFAULT_INTELLECTUAL_CONFIG.hideTimer,
      reduceOptions: typeof parsed.reduceOptions === "boolean" ? parsed.reduceOptions : DEFAULT_INTELLECTUAL_CONFIG.reduceOptions,
      secondChance: typeof parsed.secondChance === "boolean" ? parsed.secondChance : DEFAULT_INTELLECTUAL_CONFIG.secondChance,
      showHints: typeof parsed.showHints === "boolean" ? parsed.showHints : DEFAULT_INTELLECTUAL_CONFIG.showHints,
      plainLanguage: typeof parsed.plainLanguage === "boolean" ? parsed.plainLanguage : DEFAULT_INTELLECTUAL_CONFIG.plainLanguage,
    };
  } catch {
    return { ...DEFAULT_INTELLECTUAL_CONFIG };
  }
}

export function saveIntellectualConfig(config: Partial<IntellectualConfig>): IntellectualConfig {
  if (typeof window === "undefined") return { ...DEFAULT_INTELLECTUAL_CONFIG, ...config };
  try {
    const current = getIntellectualConfig();
    const updated: IntellectualConfig = { ...current, ...config };
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("pintara_intellectual_config_changed", { detail: updated }));
    return updated;
  } catch {
    return { ...DEFAULT_INTELLECTUAL_CONFIG, ...config };
  }
}

export function isIntellectualModeEnabled(session: UserSession | null): boolean {
  if (session && session.role === "guru") return false;

  if (typeof window !== "undefined") {
    if (localStorage.getItem(STORAGE_KEY_ENABLED) === "true") return true;
    const a11yRaw = localStorage.getItem("pintara_a11y_config");
    if (a11yRaw) {
      try {
        const parsed = JSON.parse(a11yRaw);
        if (parsed.mainMode === "intelektual") {
          return true;
        }
      } catch {}
    }
  }

  if (!session || !session.accessibilityConfig) return false;
  return session.accessibilityConfig.mainMode === "intelektual";
}
