import type {
  CalibrationPose,
  CalibrationProfile,
  CalibrationStep,
  FaceAnalysisFrame,
  LookingDirection,
} from "../types";

export function emptyCalibrationPose(): CalibrationPose {
  return {
    headYaw: 0,
    headPitch: 0,
    headRoll: 0,
    irisX: 0.5,
    irisY: 0.5,
    samples: 0,
  };
}

export function accumulateCalibrationPose(
  current: CalibrationPose,
  frame: FaceAnalysisFrame,
): CalibrationPose {
  const n = current.samples;
  const next = n + 1;
  const blend = (prev: number, value: number) =>
    n === 0 ? value : (prev * n + value) / next;

  return {
    headYaw: blend(current.headYaw, frame.headYaw),
    headPitch: blend(current.headPitch, frame.headPitch),
    headRoll: blend(current.headRoll, frame.headRoll),
    irisX: blend(current.irisX, frame.iris.averageIrisX),
    irisY: blend(current.irisY, frame.iris.averageIrisY),
    samples: next,
  };
}

export function createEmptyCalibrationProfile(): Omit<
  CalibrationProfile,
  "completedAt"
> {
  return {
    center: emptyCalibrationPose(),
    left: emptyCalibrationPose(),
    right: emptyCalibrationPose(),
    up: emptyCalibrationPose(),
    down: emptyCalibrationPose(),
  };
}

export const CALIBRATION_STEPS: CalibrationStep[] = [
  "center",
  "left",
  "right",
  "up",
  "down",
];

export function compareToCalibration(
  frame: FaceAnalysisFrame,
  profile: CalibrationProfile | null,
): {
  headDeltaYaw: number;
  headDeltaPitch: number;
  irisDeltaX: number;
  irisDeltaY: number;
  lookingDirection: LookingDirection;
  /** Head moved off-center but iris still tracks the screen. */
  isGazeDissociated: boolean;
} {
  if (!profile || !frame.faceDetected) {
    return {
      headDeltaYaw: 0,
      headDeltaPitch: 0,
      irisDeltaX: 0,
      irisDeltaY: 0,
      lookingDirection: frame.lookingDirection,
      isGazeDissociated: false,
    };
  }

  const base = profile.center;
  const headDeltaYaw = frame.headYaw - base.headYaw;
  const headDeltaPitch = frame.headPitch - base.headPitch;
  const irisDeltaX = frame.iris.averageIrisX - base.irisX;
  const irisDeltaY = frame.iris.averageIrisY - base.irisY;

  let lookingDirection: LookingDirection = "center";
  let directionFromHead = false;

  if (headDeltaYaw > getStepDelta(profile, "right", "headYaw", 8)) {
    lookingDirection = "right";
    directionFromHead = true;
  } else if (headDeltaYaw < -getStepDelta(profile, "left", "headYaw", 8)) {
    lookingDirection = "left";
    directionFromHead = true;
  } else if (headDeltaPitch > getStepDelta(profile, "down", "headPitch", 8)) {
    lookingDirection = "down";
    directionFromHead = true;
  } else if (headDeltaPitch < -getStepDelta(profile, "up", "headPitch", 8)) {
    lookingDirection = "up";
    directionFromHead = true;
  } else if (Math.abs(irisDeltaX) > 0.12 || Math.abs(irisDeltaY) > 0.12) {
    if (Math.abs(irisDeltaX) > Math.abs(irisDeltaY)) {
      lookingDirection = irisDeltaX > 0 ? "right" : "left";
    } else {
      lookingDirection = irisDeltaY > 0 ? "down" : "up";
    }
  }

  const headDeviated = lookingDirection !== "center";
  const irisNearCenter =
    Math.abs(irisDeltaX) < 0.09 && Math.abs(irisDeltaY) < 0.09;
  const isGazeDissociated =
    directionFromHead && headDeviated && irisNearCenter;

  return {
    headDeltaYaw,
    headDeltaPitch,
    irisDeltaX,
    irisDeltaY,
    lookingDirection,
    isGazeDissociated,
  };
}

function getStepDelta(
  profile: CalibrationProfile,
  step: CalibrationStep,
  key: keyof CalibrationPose,
  fallback: number,
): number {
  const center = profile.center[key] as number;
  const target = profile[step][key] as number;
  const delta = Math.abs(target - center);
  return delta > 0 ? delta * 0.65 : fallback;
}

export const CALIBRATION_STORAGE_KEY = "centurion-proctor-calibration";

export function saveCalibrationProfile(profile: CalibrationProfile) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CALIBRATION_STORAGE_KEY, JSON.stringify(profile));
}

export function loadCalibrationProfile(): CalibrationProfile | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(CALIBRATION_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CalibrationProfile;
  } catch {
    return null;
  }
}
