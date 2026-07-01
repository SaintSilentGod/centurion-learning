"use client";

import { useEffect, useRef, useState } from "react";
import { ObjectDetector } from "@mediapipe/tasks-vision";
import { OBJECT_DETECT_INTERVAL_MS, OBJECT_MODEL_URL } from "../constants";
import { createVisionTask } from "../lib/mediapipe";
import type { ObjectDetectionState } from "../types";

const INITIAL: ObjectDetectionState = {
  phoneDetected: false,
  bookDetected: false,
  laptopDetected: false,
  secondPersonDetected: false,
  labels: [],
};

const PHONE_LABELS = ["cell phone", "mobile phone", "phone"];
const BOOK_LABELS = ["book"];
const LAPTOP_LABELS = ["laptop", "notebook"];
const PERSON_LABEL = "person";

async function createObjectDetector() {
  try {
    return await createVisionTask((vision) =>
      ObjectDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: OBJECT_MODEL_URL,
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        scoreThreshold: 0.45,
        maxResults: 5,
      }),
    );
  } catch {
    return createVisionTask((vision) =>
      ObjectDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: OBJECT_MODEL_URL,
          delegate: "CPU",
        },
        runningMode: "VIDEO",
        scoreThreshold: 0.45,
        maxResults: 5,
      }),
    );
  }
}

export function useObjectDetection(
  enabled: boolean,
  videoRef: React.RefObject<HTMLVideoElement | null>,
) {
  const [state, setState] = useState<ObjectDetectionState>(INITIAL);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let intervalId = 0;
    let detector: ObjectDetector | null = null;
    let cancelled = false;

    async function init() {
      try {
        detector = await createObjectDetector();
      } catch (error) {
        console.warn("[proctor] Object detection unavailable:", error);
        return;
      }

      if (cancelled) {
        detector.close();
        return;
      }

      intervalId = window.setInterval(() => {
        const video = videoRef.current;
        if (!video || !detector || video.videoWidth === 0) return;

        try {
          const results = detector.detectForVideo(video, performance.now());
          const labels = results.detections
            .map((d) => d.categories?.[0]?.categoryName?.toLowerCase() ?? "")
            .filter(Boolean);

          const phoneDetected = labels.some((l) =>
            PHONE_LABELS.some((p) => l.includes(p)),
          );
          const bookDetected = labels.some((l) =>
            BOOK_LABELS.some((b) => l.includes(b)),
          );
          const laptopDetected = labels.some((l) =>
            LAPTOP_LABELS.some((p) => l.includes(p)),
          );
          const personCount = labels.filter((l) =>
            l.includes(PERSON_LABEL),
          ).length;
          const secondPersonDetected = personCount > 1;

          setState({
            phoneDetected,
            bookDetected,
            laptopDetected,
            secondPersonDetected,
            labels,
          });
        } catch (error) {
          console.warn("[proctor] Object detection frame failed:", error);
        }
      }, OBJECT_DETECT_INTERVAL_MS);
    }

    void init();

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      detector?.close();
    };
  }, [enabled, videoRef]);

  useEffect(() => {
    if (!enabled) {
      setState(INITIAL);
    }
  }, [enabled]);

  return { state };
}
