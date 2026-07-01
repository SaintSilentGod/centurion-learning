import { ATTENTION_THRESHOLDS_MS } from "../constants";
import type {
  AttentionResult,
  AttentionState,
  CalibrationProfile,
  FaceAnalysisFrame,
  LookingDirection,
  ProctorEventType,
} from "../types";
import { compareToCalibration } from "./calibration";

export type AttentionTrackerState = {
  faceMissingMs: number;
  multipleFacesMs: number;
  headTurnedMs: number;
  gazeAwayMs: number;
  lookingDownMs: number;
  eyesClosedMs: number;
};

export function createAttentionTrackerState(): AttentionTrackerState {
  return {
    faceMissingMs: 0,
    multipleFacesMs: 0,
    headTurnedMs: 0,
    gazeAwayMs: 0,
    lookingDownMs: 0,
    eyesClosedMs: 0,
  };
}

const THRESHOLDS = ATTENTION_THRESHOLDS_MS;

export function updateAttentionTracker(
  state: AttentionTrackerState,
  frame: FaceAnalysisFrame,
  calibration: CalibrationProfile | null,
  deltaMs: number,
): AttentionTrackerState {
  const comparison = compareToCalibration(frame, calibration);
  const looking = calibration ? comparison.lookingDirection : frame.lookingDirection;

  const next = { ...state };

  if (!frame.faceDetected) {
    next.faceMissingMs += deltaMs;
  } else {
    next.faceMissingMs = 0;
  }

  if (frame.multipleFaces) {
    next.multipleFacesMs += deltaMs;
  } else {
    next.multipleFacesMs = 0;
  }

  const headAway =
    looking === "left" || looking === "right" || looking === "up";
  if (headAway) {
    next.headTurnedMs += deltaMs;
  } else {
    next.headTurnedMs = 0;
  }

  const gazeAway =
    looking === "left" || looking === "right" || looking === "up";
  const headCenter = looking === "center" || frame.lookingDirection === "center";

  if (gazeAway && headCenter && frame.faceDetected) {
    next.gazeAwayMs += deltaMs;
  } else if (!gazeAway) {
    next.gazeAwayMs = 0;
  }

  if (looking === "down" && frame.faceDetected) {
    next.lookingDownMs += deltaMs;
  } else {
    next.lookingDownMs = 0;
  }

  if (!frame.eyesOpen && frame.faceDetected) {
    next.eyesClosedMs += deltaMs;
  } else {
    next.eyesClosedMs = 0;
  }

  return next;
}

export function computeAttentionState(
  frame: FaceAnalysisFrame,
  tracker: AttentionTrackerState,
  calibration: CalibrationProfile | null,
): AttentionResult {
  const comparison = compareToCalibration(frame, calibration);
  const looking: LookingDirection = calibration
    ? comparison.lookingDirection
    : frame.lookingDirection;

  const flags: string[] = [];
  let attentionState: AttentionState = "attentive";
  let attentionScore = 100;

  if (!frame.faceDetected) {
    flags.push("face_missing");
    attentionState = "missing";
    attentionScore -= 40;
  }

  if (frame.multipleFaces) {
    flags.push("multiple_faces");
    attentionState = "multiple_faces";
    attentionScore -= 50;
  }

  if (tracker.headTurnedMs >= THRESHOLDS.headTurnedAway) {
    flags.push("head_turned_away");
    attentionScore -= 25;
  }

  if (tracker.gazeAwayMs >= THRESHOLDS.gazeAway) {
    flags.push("gaze_away");
    attentionScore -= 20;
  }

  if (tracker.lookingDownMs >= THRESHOLDS.lookingDown) {
    flags.push("looking_down");
    attentionScore -= 15;
  }

  if (tracker.eyesClosedMs >= THRESHOLDS.eyesClosed) {
    flags.push("eyes_closed");
    attentionScore -= 10;
  }

  if (
    flags.length > 0 &&
    attentionState !== "missing" &&
    attentionState !== "multiple_faces"
  ) {
    attentionState = "distracted";
  }

  if (looking !== "center" && frame.faceDetected && !frame.multipleFaces) {
    attentionScore -= 10;
  }

  return {
    attentionScore: clamp(attentionScore, 0, 100),
    attentionState,
    currentFlags: flags,
  };
}

export type AttentionSustainedSignal = {
  type: ProctorEventType;
  active: boolean;
  details?: Record<string, unknown>;
};

export function getAttentionSustainedSignals(
  tracker: AttentionTrackerState,
  frame: FaceAnalysisFrame,
): AttentionSustainedSignal[] {
  return [
    {
      type: "FACE_MISSING",
      active:
        !frame.faceDetected &&
        tracker.faceMissingMs >= THRESHOLDS.faceMissing,
      details: { faceMissingMs: tracker.faceMissingMs },
    },
    {
      type: "MULTIPLE_FACES",
      active:
        frame.multipleFaces &&
        tracker.multipleFacesMs >= THRESHOLDS.multipleFaces,
      details: { faceCount: frame.faceCount },
    },
    {
      type: "HEAD_TURNED_AWAY",
      active: tracker.headTurnedMs >= THRESHOLDS.headTurnedAway,
      details: { headTurnedMs: tracker.headTurnedMs },
    },
    {
      type: "GAZE_AWAY",
      active:
        tracker.gazeAwayMs >= THRESHOLDS.gazeAway && frame.faceDetected,
      details: { gazeAwayMs: tracker.gazeAwayMs },
    },
    {
      type: "LOOKING_DOWN",
      active:
        tracker.lookingDownMs >= THRESHOLDS.lookingDown && frame.faceDetected,
      details: { lookingDownMs: tracker.lookingDownMs },
    },
    {
      type: "EYES_CLOSED",
      active:
        tracker.eyesClosedMs >= THRESHOLDS.eyesClosed && frame.faceDetected,
      details: { eyesClosedMs: tracker.eyesClosedMs },
    },
  ];
}

/** @deprecated use getAttentionSustainedSignals with episode manager */
export function attentionEventsFromTracker(
  tracker: AttentionTrackerState,
  emitted: Set<string>,
): string[] {
  const triggered: string[] = [];

  if (tracker.faceMissingMs >= THRESHOLDS.faceMissing && !emitted.has("FACE_MISSING")) {
    triggered.push("FACE_MISSING");
  }
  if (tracker.multipleFacesMs >= THRESHOLDS.multipleFaces && !emitted.has("MULTIPLE_FACES")) {
    triggered.push("MULTIPLE_FACES");
  }
  if (tracker.headTurnedMs >= THRESHOLDS.headTurnedAway && !emitted.has("HEAD_TURNED_AWAY")) {
    triggered.push("HEAD_TURNED_AWAY");
  }
  if (tracker.gazeAwayMs >= THRESHOLDS.gazeAway && !emitted.has("GAZE_AWAY")) {
    triggered.push("GAZE_AWAY");
  }
  if (tracker.lookingDownMs >= THRESHOLDS.lookingDown && !emitted.has("LOOKING_DOWN")) {
    triggered.push("LOOKING_DOWN");
  }
  if (tracker.eyesClosedMs >= THRESHOLDS.eyesClosed && !emitted.has("EYES_CLOSED")) {
    triggered.push("EYES_CLOSED");
  }

  return triggered;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
