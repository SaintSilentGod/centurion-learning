"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_VIDEO_CONSTRAINTS } from "../lib/mediapipe";
import type { CameraStreamStatus } from "../types";

type UseCameraStreamOptions = {
  autoStart?: boolean;
  videoConstraints?: MediaTrackConstraints;
};

export function useCameraStream(options: UseCameraStreamOptions = {}) {
  const { autoStart = false, videoConstraints = DEFAULT_VIDEO_CONSTRAINTS } =
    options;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStreamStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStatus("idle");
  }, []);

  const start = useCallback(async () => {
    setStatus("requesting");
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setStatus("active");
      return stream;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.name === "NotAllowedError"
            ? "Доступ к камере отклонён. Разрешите камеру в настройках браузера."
            : err.message
          : "Не удалось получить доступ к камере";
      setError(message);
      setStatus("error");
      return null;
    }
  }, [videoConstraints]);

  useEffect(() => {
    if (autoStart) {
      void start();
    }
    return stop;
  }, [autoStart, start, stop]);

  return {
    videoRef,
    streamRef,
    status,
    error,
    start,
    stop,
    isActive: status === "active",
  };
}
