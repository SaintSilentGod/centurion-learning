import { LANDMARK } from "./head-pose";
import type { IrisMetrics } from "../types";

type Point = { x: number; y: number };

function normalizeBetween(value: number, min: number, max: number): number {
  if (max - min === 0) return 0.5;
  return clamp((value - min) / (max - min), 0, 1);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function irisForEye(
  landmarks: Point[],
  outerIdx: number,
  innerIdx: number,
  upperIdx: number,
  lowerIdx: number,
  irisIdx: number,
): { x: number; y: number } {
  const outer = landmarks[outerIdx];
  const inner = landmarks[innerIdx];
  const upper = landmarks[upperIdx];
  const lower = landmarks[lowerIdx];
  const iris = landmarks[irisIdx];

  if (!outer || !inner || !upper || !lower || !iris) {
    return { x: 0.5, y: 0.5 };
  }

  const minX = Math.min(outer.x, inner.x);
  const maxX = Math.max(outer.x, inner.x);
  const minY = Math.min(upper.y, lower.y);
  const maxY = Math.max(upper.y, lower.y);

  return {
    x: Number(normalizeBetween(iris.x, minX, maxX).toFixed(4)),
    y: Number(normalizeBetween(iris.y, minY, maxY).toFixed(4)),
  };
}

export function computeIrisMetrics(landmarks: Point[]): IrisMetrics {
  const left = irisForEye(
    landmarks,
    LANDMARK.leftEyeOuter,
    LANDMARK.leftEyeInner,
    LANDMARK.leftEyeUpper,
    LANDMARK.leftEyeLower,
    LANDMARK.leftIris,
  );

  const right = irisForEye(
    landmarks,
    LANDMARK.rightEyeOuter,
    LANDMARK.rightEyeInner,
    LANDMARK.rightEyeUpper,
    LANDMARK.rightEyeLower,
    LANDMARK.rightIris,
  );

  return {
    irisXLeft: left.x,
    irisYLeft: left.y,
    irisXRight: right.x,
    irisYRight: right.y,
    averageIrisX: Number(((left.x + right.x) / 2).toFixed(4)),
    averageIrisY: Number(((left.y + right.y) / 2).toFixed(4)),
  };
}

export function gazeDirectionFromIris(
  iris: IrisMetrics,
  calibrationCenter?: { irisX: number; irisY: number },
): "left" | "right" | "up" | "down" | "center" {
  const baseX = calibrationCenter?.irisX ?? 0.5;
  const baseY = calibrationCenter?.irisY ?? 0.5;
  const dx = iris.averageIrisX - baseX;
  const dy = iris.averageIrisY - baseY;

  if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) return "center";
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? "right" : "left";
  }
  return dy > 0 ? "down" : "up";
}
