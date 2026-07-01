"use client";

import { useEffect, useRef } from "react";
import {
  DrawingUtils,
  FaceLandmarker,
  type FaceLandmarkerResult,
} from "@mediapipe/tasks-vision";
import { FACE_MODEL_URL } from "../constants";
import { createVisionTask } from "../lib/mediapipe";
import { LANDMARK } from "../lib/head-pose";
import {
  estimateLookingDirection,
  eyesOpenFromBlendshapes,
  resolveHeadPose,
} from "../lib/head-pose";
import { computeIrisMetrics, gazeDirectionFromIris } from "../lib/iris-gaze";
import type { CalibrationProfile, FaceAnalysisFrame } from "../types";
import { compareToCalibration } from "../lib/calibration";

export const EMPTY_FACE_FRAME: FaceAnalysisFrame = {
  faceDetected: false,
  faceCount: 0,
  multipleFaces: false,
  faceMissingDurationMs: 0,
  headYaw: 0,
  headPitch: 0,
  headRoll: 0,
  eyesOpen: true,
  blinkDetected: false,
  lookingDirection: "unknown",
  attentionState: "missing",
  iris: {
    irisXLeft: 0.5,
    irisYLeft: 0.5,
    irisXRight: 0.5,
    irisYRight: 0.5,
    averageIrisX: 0.5,
    averageIrisY: 0.5,
  },
  fps: 0,
  timestamp: 0,
};

type UseFaceAnalysisOptions = {
  enabled: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
  calibrationRef?: React.RefObject<CalibrationProfile | null>;
  onFrame?: (frame: FaceAnalysisFrame) => void;
};

export function useFaceAnalysis({
  enabled,
  videoRef,
  canvasRef,
  calibrationRef,
  onFrame,
}: UseFaceAnalysisOptions) {
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const frameRef = useRef<FaceAnalysisFrame>(EMPTY_FACE_FRAME);
  const faceMissingSinceRef = useRef<number | null>(null);
  const lastFpsTimeRef = useRef(performance.now());
  const onFrameRef = useRef(onFrame);

  useEffect(() => {
    onFrameRef.current = onFrame;
  }, [onFrame]);

  useEffect(() => {
    if (!enabled) return;

    let animationId = 0;
    let cancelled = false;

    async function createLandmarker() {
      try {
        return await createVisionTask((vision) =>
          FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: FACE_MODEL_URL,
              delegate: "GPU",
            },
            runningMode: "VIDEO",
            numFaces: 2,
            outputFaceBlendshapes: true,
            outputFacialTransformationMatrixes: true,
          }),
        );
      } catch {
        return createVisionTask((vision) =>
          FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: FACE_MODEL_URL,
              delegate: "CPU",
            },
            runningMode: "VIDEO",
            numFaces: 2,
            outputFaceBlendshapes: true,
            outputFacialTransformationMatrixes: true,
          }),
        );
      }
    }

    async function init() {
      const landmarker = await createLandmarker();

      if (cancelled) {
        landmarker.close();
        return;
      }

      landmarkerRef.current = landmarker;
      loop();
    }

    function loop() {
      const video = videoRef.current;
      const landmarker = landmarkerRef.current;

      if (!video || !landmarker || cancelled) return;

      const now = performance.now();

      if (video.videoWidth > 0) {
        const results = landmarker.detectForVideo(video, now);
        drawOverlay(video, canvasRef?.current, results);

        const faceCount = results.faceLandmarks.length;
        const faceDetected = faceCount > 0;
        const timestamp = Date.now();

        if (!faceDetected) {
          if (faceMissingSinceRef.current === null) {
            faceMissingSinceRef.current = timestamp;
          }
        } else {
          faceMissingSinceRef.current = null;
        }

        const faceMissingDurationMs = faceMissingSinceRef.current
          ? timestamp - faceMissingSinceRef.current
          : 0;

        let frame: FaceAnalysisFrame = {
          ...EMPTY_FACE_FRAME,
          faceDetected,
          faceCount,
          multipleFaces: faceCount > 1,
          faceMissingDurationMs,
          fps: Math.min(
            120,
            Math.round(1000 / Math.max(now - lastFpsTimeRef.current, 1)),
          ),
          timestamp,
        };

        if (faceDetected) {
          const landmarks = results.faceLandmarks[0];
          const matrix =
            results.facialTransformationMatrixes?.[0]?.data ??
            results.facialTransformationMatrixes?.[0];

          const matrixData = Array.isArray(matrix)
            ? matrix
            : matrix && "length" in matrix
              ? Array.from(matrix as ArrayLike<number>)
              : undefined;

          const pose = resolveHeadPose(landmarks, matrixData);
          const useDegrees = Boolean(matrixData && matrixData.length >= 16);
          const iris = computeIrisMetrics(landmarks);
          const blendshapeCategories =
            results.faceBlendshapes?.[0]?.categories?.map((c) => ({
              categoryName: c.categoryName ?? "",
              score: c.score ?? 0,
            })) ?? [];

          const { eyesOpen, blinkDetected } =
            eyesOpenFromBlendshapes(blendshapeCategories);

          const irisDirection = gazeDirectionFromIris(
            iris,
            calibrationRef?.current?.center,
          );
          const lookingDirection = calibrationRef?.current
            ? compareToCalibration(
                {
                  ...frame,
                  headYaw: pose.yaw,
                  headPitch: pose.pitch,
                  headRoll: pose.roll,
                  iris,
                  faceDetected: true,
                } as FaceAnalysisFrame,
                calibrationRef.current,
              ).lookingDirection
            : irisDirection !== "center"
              ? irisDirection
              : estimateLookingDirection(pose.yaw, pose.pitch, useDegrees);

          let attentionState: FaceAnalysisFrame["attentionState"] = "attentive";
          if (!faceDetected) attentionState = "missing";
          else if (faceCount > 1) attentionState = "multiple_faces";
          else if (lookingDirection !== "center") attentionState = "distracted";

          frame = {
            ...frame,
            headYaw: pose.yaw,
            headPitch: pose.pitch,
            headRoll: pose.roll,
            eyesOpen,
            blinkDetected,
            lookingDirection,
            attentionState,
            iris,
          };
        }

        frameRef.current = frame;
        onFrameRef.current?.(frame);
        lastFpsTimeRef.current = now;
      }

      animationId = requestAnimationFrame(loop);
    }

    void init();

    return () => {
      cancelled = true;
      cancelAnimationFrame(animationId);
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
    };
  }, [enabled, videoRef, canvasRef, calibrationRef]);

  return { frameRef };
}

function drawOverlay(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement | null | undefined,
  results: FaceLandmarkerResult,
) {
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const drawingUtils = new DrawingUtils(ctx);

  for (const landmarks of results.faceLandmarks) {
    drawingUtils.drawConnectors(
      landmarks,
      FaceLandmarker.FACE_LANDMARKS_TESSELATION,
      { color: "#60a5fa55", lineWidth: 0.5 },
    );
    drawingUtils.drawConnectors(
      landmarks,
      FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
      { color: "#34d399", lineWidth: 1.5 },
    );
    drawingUtils.drawConnectors(
      landmarks,
      FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
      { color: "#34d399", lineWidth: 1.5 },
    );
    drawingUtils.drawConnectors(
      landmarks,
      FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
      { color: "#fbbf24", lineWidth: 1 },
    );

    for (const idx of [LANDMARK.leftIris, LANDMARK.rightIris]) {
      const point = landmarks[idx];
      if (!point) continue;
      ctx.beginPath();
      ctx.fillStyle = "#f472b6";
      ctx.arc(
        point.x * canvas.width,
        point.y * canvas.height,
        4,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  }

  const nose = results.faceLandmarks[0]?.[LANDMARK.noseTip];
  if (nose) {
    ctx.fillStyle = "#ffffffcc";
    ctx.font = "16px system-ui";
    ctx.fillText(
      "▲ голова",
      nose.x * canvas.width - 30,
      nose.y * canvas.height - 30,
    );
  }
}
