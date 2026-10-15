import { UserSession } from "./authSession";

export type MotoricSubMode = "tremor_filter" | "single_switch" | "standar_besar";

export interface MotoricConfig {
  subMode: MotoricSubMode;
  holdDurationMs: number;
  scanIntervalMs: number;
  soundFeedback: boolean;
  palmRejection: boolean;
}

export const DEFAULT_MOTORIC_CONFIG: MotoricConfig = {
  subMode: "tremor_filter",
  holdDurationMs: 450,
  scanIntervalMs: 2000,
  soundFeedback: true,
  palmRejection: true,
};

const STORAGE_KEY_CONFIG = "pintara_motoric_config";
const STORAGE_KEY_ENABLED = "pintara_motor_control_enabled";

export function getMotoricConfig(): MotoricConfig {
  if (typeof window === "undefined") return { ...DEFAULT_MOTORIC_CONFIG };
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (!raw) return { ...DEFAULT_MOTORIC_CONFIG };
    const parsed = JSON.parse(raw);
    return {
      subMode: parsed.subMode || DEFAULT_MOTORIC_CONFIG.subMode,
      holdDurationMs: typeof parsed.holdDurationMs === "number" ? parsed.holdDurationMs : DEFAULT_MOTORIC_CONFIG.holdDurationMs,
      scanIntervalMs: typeof parsed.scanIntervalMs === "number" ? parsed.scanIntervalMs : DEFAULT_MOTORIC_CONFIG.scanIntervalMs,
      soundFeedback: typeof parsed.soundFeedback === "boolean" ? parsed.soundFeedback : DEFAULT_MOTORIC_CONFIG.soundFeedback,
      palmRejection: typeof parsed.palmRejection === "boolean" ? parsed.palmRejection : DEFAULT_MOTORIC_CONFIG.palmRejection,
    };
  } catch {
    return { ...DEFAULT_MOTORIC_CONFIG };
  }
}

export function saveMotoricConfig(config: Partial<MotoricConfig>): MotoricConfig {
  if (typeof window === "undefined") return { ...DEFAULT_MOTORIC_CONFIG, ...config };
  try {
    const current = getMotoricConfig();
    const updated: MotoricConfig = { ...current, ...config };
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("pintara_motoric_config_changed", { detail: updated }));
    return updated;
  } catch {
    return { ...DEFAULT_MOTORIC_CONFIG, ...config };
  }
}

export function isMotorControlEnabled(session: UserSession | null): boolean {
  if (session && session.role === "guru") return false;

  if (typeof window !== "undefined") {
    if (localStorage.getItem(STORAGE_KEY_ENABLED) === "true") return true;
    const a11yRaw = localStorage.getItem("pintara_a11y_config");
    if (a11yRaw) {
      try {
        const parsed = JSON.parse(a11yRaw);
        if (
          parsed.mainMode === "fisik_motorik" ||
          parsed.specificMode === "kesulitan_tangan" ||
          parsed.physicalControlMethod === "motorik"
        ) {
          return true;
        }
      } catch {}
    }
  }

  if (!session || !session.accessibilityConfig) return false;

  const { specificMode, physicalControlMethod, mainMode } = session.accessibilityConfig;
  if (
    mainMode === "fisik_motorik" ||
    specificMode === "kesulitan_tangan" ||
    physicalControlMethod === "motorik"
  ) {
    return true;
  }

  return false;
}

export function playMotoricSound(type: "tick" | "confirm" | "cancel") {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === "tick") {
      // Bip singkat lembut saat perpindahan fokus auto-scan
      osc.type = "sine";
      osc.frequency.setValueAtTime(520, now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === "confirm") {
      // Nada konfirmasi ramah C5 -> G5
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(783.99, now + 0.07);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === "cancel") {
      // Nada pembatalan lembut
      osc.type = "triangle";
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.setValueAtTime(240, now + 0.06);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    }
  } catch {
    // Audio context safe fallback
  }
}
