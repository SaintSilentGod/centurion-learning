"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_VIDEO_CONSTRAINTS } from "../lib/mediapipe";
import type { CameraStreamStatus } from "../types";

type UseCameraStreamOptions = {
  autoStart?: boolean;
  videoConstraints?: MediaTrackConstraints;
  onDisconnect?: (reason: "ended" | "muted") => void;
};

export function useCameraStream(options: UseCameraStreamOptions = {}) {
  const {
    autoStart = false,
    videoConstraints = DEFAULT_VIDEO_CONSTRAINTS,
    onDisconnect,
  } = options;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startPromiseRef = useRef<Promise<MediaStream | null> | null>(null);
  const onDisconnectRef = useRef(onDisconnect);

  const [status, setStatus] = useState<CameraStreamStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onDisconnectRef.current = onDisconnect;
  }, [onDisconnect]);

  const attachTrackHandlers = useCallback((stream: MediaStream) => {
    for (const track of stream.getVideoTracks()) {
      track.onended = () => {
        streamRef.current = null;
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        setStatus("disconnected");
        setError("Камера отключена во время сессии.");
        onDisconnectRef.current?.("ended");
      };

      track.onmute = () => {
        setStatus("disconnected");
        setError("Видеопоток с камеры прерван.");
        onDisconnectRef.current?.("muted");
      };
    }
  }, []);

  const stop = useCallback(() => {
    startPromiseRef.current = null;
    streamRef.current?.getTracks().forEach((track) => {
      track.onended = null;
      track.onmute = null;
      track.stop();
    });
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStatus("idle");
    setError(null);
  }, []);

  const start = useCallback(async () => {
    if (streamRef.current?.active) {
      return streamRef.current;
    }

    if (startPromiseRef.current) {
      return startPromiseRef.current;
    }

    const promise = (async () => {
      setStatus("requesting");
      setError(null);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false,
        });

        streamRef.current = stream;
        attachTrackHandlers(stream);

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
      } finally {
        startPromiseRef.current = null;
      }
    })();

    startPromiseRef.current = promise;
    return promise;
  }, [attachTrackHandlers, videoConstraints]);

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
