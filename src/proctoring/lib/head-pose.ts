import type { LookingDirection } from "../types";

/** MediaPipe Face Landmarker indices */
export const LANDMARK = {
  noseTip: 1,
  leftEyeOuter: 33,
  leftEyeInner: 133,
  rightEyeOuter: 263,
  rightEyeInner: 362,
  leftEyeUpper: 159,
  leftEyeLower: 145,
  rightEyeUpper: 386,
  rightEyeLower: 374,
  leftIris: 468,
  rightIris: 473,
} as const;

type Point = { x: number; y: number; z?: number };

export function matrixToEulerDegrees(matrix: number[]): {
  yaw: number;
  pitch: number;
  roll: number;
} {
  if (matrix.length < 16) {
    return { yaw: 0, pitch: 0, roll: 0 };
  }

  const m00 = matrix[0];
  const m10 = matrix[4];
  const m20 = matrix[8];
  const m21 = matrix[9];
  const m22 = matrix[10];

  const pitch = Math.asin(-clamp(m20, -1, 1));
  const yaw = Math.atan2(m10, m22);
  const roll = Math.atan2(m00, m21);

  const toDeg = (rad: number) => Number(((rad * 180) / Math.PI).toFixed(2));

  return {
    yaw: toDeg(yaw),
    pitch: toDeg(pitch),
    roll: toDeg(roll),
  };
}

export function estimateHeadPoseFromLandmarks(landmarks: Point[]): {
  yaw: number;
  pitch: number;
  roll: number;
} {
  const nose = landmarks[LANDMARK.noseTip];
  const leftEye = landmarks[LANDMARK.leftEyeOuter];
  const rightEye = landmarks[LANDMARK.rightEyeOuter];

  if (!nose || !leftEye || !rightEye) {
    return { yaw: 0, pitch: 0, roll: 0 };
  }

  const eyeCenterX = (leftEye.x + rightEye.x) / 2;
  const eyeCenterY = (leftEye.y + rightEye.y) / 2;

  const yaw = Number((nose.x - eyeCenterX).toFixed(4));
  const pitch = Number((nose.y - eyeCenterY).toFixed(4));
  const roll = Number(
    (
      (Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * 180) /
      Math.PI
    ).toFixed(2),
  );

  return { yaw, pitch, roll };
}

export function resolveHeadPose(
  landmarks: Point[],
  transformMatrix?: number[],
): { yaw: number; pitch: number; roll: number } {
  if (transformMatrix && transformMatrix.length >= 16) {
    return matrixToEulerDegrees(transformMatrix);
  }
  return estimateHeadPoseFromLandmarks(landmarks);
}

export function estimateLookingDirection(
  yaw: number,
  pitch: number,
  useDegrees: boolean,
): LookingDirection {
  if (useDegrees) {
    if (yaw > 12) return "right";
    if (yaw < -12) return "left";
    if (pitch > 10) return "down";
    if (pitch < -8) return "up";
    return "center";
  }

  if (yaw > 0.035) return "right";
  if (yaw < -0.035) return "left";
  if (pitch > 0.085) return "down";
  if (pitch < -0.04) return "up";
  return "center";
}

export function eyesOpenFromBlendshapes(
  blendshapes: Array<{ categoryName: string; score: number }> | undefined,
): { eyesOpen: boolean; blinkDetected: boolean } {
  if (!blendshapes?.length) {
    return { eyesOpen: true, blinkDetected: false };
  }

  const map = new Map(blendshapes.map((b) => [b.categoryName, b.score]));
  const blinkLeft = map.get("eyeBlinkLeft") ?? 0;
  const blinkRight = map.get("eyeBlinkRight") ?? 0;
  const blink = Math.max(blinkLeft, blinkRight);

  return {
    eyesOpen: blink < 0.55,
    blinkDetected: blink > 0.65,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
