import type {
  DecayMode,
  EventRiskConfig,
  EventSeverity,
  ProctorEventType,
  RiskCategory,
} from "./types";

export const WASM_CDN =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";

export const FACE_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task";

export const OBJECT_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/latest/efficientdet_lite0.tflite";

export const EVENT_RISK_CONFIG: Record<ProctorEventType, EventRiskConfig> = {
  FACE_MISSING: {
    weight: 15,
    severity: "medium",
    cooldownMs: 8000,
    eventKind: "sustained",
    decayMode: "normal",
    maxContribution: 35,
  },
  MULTIPLE_FACES: {
    weight: 35,
    severity: "high",
    cooldownMs: 10000,
    eventKind: "sustained",
    decayMode: "none",
    maxContribution: 50,
  },
  GAZE_AWAY: {
    weight: 10,
    severity: "low",
    cooldownMs: 12000,
    eventKind: "sustained",
    decayMode: "normal",
    maxContribution: 30,
  },
  LOOKING_DOWN: {
    weight: 15,
    severity: "medium",
    cooldownMs: 12000,
    eventKind: "sustained",
    decayMode: "normal",
    maxContribution: 35,
  },
  HEAD_TURNED_AWAY: {
    weight: 20,
    severity: "medium",
    cooldownMs: 10000,
    eventKind: "sustained",
    decayMode: "normal",
    maxContribution: 40,
  },
  EYES_CLOSED: {
    weight: 8,
    severity: "low",
    cooldownMs: 8000,
    eventKind: "sustained",
    decayMode: "normal",
    maxContribution: 20,
  },
  FULLSCREEN_EXIT: {
    weight: 25,
    severity: "high",
    cooldownMs: 5000,
    eventKind: "instant",
    decayMode: "none",
    maxContribution: 40,
  },
  TAB_HIDDEN: {
    weight: 25,
    severity: "high",
    cooldownMs: 3000,
    eventKind: "instant",
    decayMode: "normal",
    maxContribution: 35,
  },
  WINDOW_BLUR: {
    weight: 15,
    severity: "medium",
    cooldownMs: 4000,
    eventKind: "instant",
    decayMode: "normal",
    maxContribution: 25,
  },
  COPY_ATTEMPT: {
    weight: 20,
    severity: "high",
    cooldownMs: 2000,
    eventKind: "instant",
    decayMode: "none",
    maxContribution: 35,
  },
  PASTE_ATTEMPT: {
    weight: 20,
    severity: "high",
    cooldownMs: 2000,
    eventKind: "instant",
    decayMode: "none",
    maxContribution: 35,
  },
  RIGHT_CLICK: {
    weight: 5,
    severity: "low",
    cooldownMs: 3000,
    eventKind: "instant",
    decayMode: "normal",
  },
  SCREEN_SHARE_STOPPED: {
    weight: 50,
    severity: "high",
    cooldownMs: 0,
    eventKind: "instant",
    decayMode: "none",
    maxContribution: 60,
  },
  SPEECH_DETECTED: {
    weight: 10,
    severity: "low",
    cooldownMs: 15000,
    eventKind: "sustained",
    decayMode: "normal",
    maxContribution: 25,
  },
  LONG_SPEECH_DETECTED: {
    weight: 25,
    severity: "medium",
    cooldownMs: 20000,
    eventKind: "sustained",
    decayMode: "normal",
    maxContribution: 40,
  },
  BACKGROUND_NOISE_HIGH: {
    weight: 12,
    severity: "low",
    cooldownMs: 10000,
    eventKind: "sustained",
    decayMode: "normal",
    maxContribution: 20,
  },
  PHONE_DETECTED: {
    weight: 40,
    severity: "high",
    cooldownMs: 15000,
    eventKind: "sustained",
    decayMode: "none",
    maxContribution: 55,
  },
  BOOK_DETECTED: {
    weight: 30,
    severity: "high",
    cooldownMs: 15000,
    eventKind: "sustained",
    decayMode: "slow",
    maxContribution: 45,
  },
  SECOND_PERSON_DETECTED: {
    weight: 35,
    severity: "high",
    cooldownMs: 15000,
    eventKind: "sustained",
    decayMode: "slow",
    maxContribution: 50,
  },
  CALIBRATION_COMPLETED: {
    weight: 0,
    severity: "low",
    cooldownMs: 0,
    eventKind: "instant",
    decayMode: "normal",
  },
  MONITORING_STARTED: {
    weight: 0,
    severity: "low",
    cooldownMs: 0,
    eventKind: "instant",
    decayMode: "normal",
  },
  MONITORING_STOPPED: {
    weight: 0,
    severity: "low",
    cooldownMs: 0,
    eventKind: "instant",
    decayMode: "normal",
  },
};

/** Cooldown map derived from config (for quick lookup). */
export const EVENT_COOLDOWNS_MS: Record<ProctorEventType, number> =
  Object.fromEntries(
    Object.entries(EVENT_RISK_CONFIG).map(([k, v]) => [k, v.cooldownMs]),
  ) as Record<ProctorEventType, number>;

/** @deprecated use EVENT_RISK_CONFIG */
export const EVENT_WEIGHTS: Record<ProctorEventType, number> =
  Object.fromEntries(
    Object.entries(EVENT_RISK_CONFIG).map(([k, v]) => [k, v.weight]),
  ) as Record<ProctorEventType, number>;

/** @deprecated use EVENT_RISK_CONFIG */
export const EVENT_SEVERITY: Record<ProctorEventType, EventSeverity> =
  Object.fromEntries(
    Object.entries(EVENT_RISK_CONFIG).map(([k, v]) => [k, v.severity]),
  ) as Record<ProctorEventType, EventSeverity>;

export const ATTENTION_THRESHOLDS_MS = {
  faceMissing: 2000,
  multipleFaces: 1000,
  headTurnedAway: 5000,
  gazeAway: 7000,
  lookingDown: 8000,
  eyesClosed: 3000,
  longSpeech: 5000,
} as const;

export const CALIBRATION_STEP_MS = 2000;

export const UI_UPDATE_MS = 150;
export const RISK_UPDATE_MS = 500;
export const OBJECT_DETECT_INTERVAL_MS = 1000;

export const RISK_DECAY_HALF_LIFE_MS = 5 * 60 * 1000;
export const RISK_DECAY_SLOW_HALF_LIFE_MS = 30 * 60 * 1000;
export const RISK_DECAY_FINAL_NORMAL_HALF_LIFE_MS = 15 * 60 * 1000;

export function riskCategoryFromScore(score: number): RiskCategory {
  if (score <= 20) return "clean";
  if (score <= 50) return "light_review";
  if (score <= 80) return "suspicious";
  return "high_risk";
}

export const RISK_CATEGORY_LABELS: Record<RiskCategory, string> = {
  clean: "Чисто (0–20)",
  light_review: "Лёгкая проверка (21–50)",
  suspicious: "Подозрительно (51–80)",
  high_risk: "Высокий риск (81–100)",
};

export const CALIBRATION_STEP_LABELS: Record<string, string> = {
  center: "Смотрите в центр экрана",
  left: "Поверните голову влево",
  right: "Поверните голову вправо",
  up: "Поднимите взгляд вверх",
  down: "Опустите взгляд вниз",
};

export const CRITICAL_EVENT_TYPES: ProctorEventType[] = [
  "SCREEN_SHARE_STOPPED",
  "PHONE_DETECTED",
  "MULTIPLE_FACES",
  "COPY_ATTEMPT",
  "PASTE_ATTEMPT",
  "FULLSCREEN_EXIT",
];

export function getDecayHalfLifeMs(
  mode: "live" | "final",
  decayMode: DecayMode,
): number | null {
  if (mode === "final") {
    if (decayMode === "none") return null;
    if (decayMode === "slow") return RISK_DECAY_SLOW_HALF_LIFE_MS;
    return RISK_DECAY_FINAL_NORMAL_HALF_LIFE_MS;
  }
  if (decayMode === "none") return RISK_DECAY_SLOW_HALF_LIFE_MS;
  if (decayMode === "slow") return RISK_DECAY_SLOW_HALF_LIFE_MS;
  return RISK_DECAY_HALF_LIFE_MS;
}
