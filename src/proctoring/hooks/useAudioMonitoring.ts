"use client";

import { useEffect, useRef, useState } from "react";
import { DEFAULT_AUDIO_CONSTRAINTS } from "../lib/mediapipe";
import type { AudioMonitoringState } from "../types";

const INITIAL: AudioMonitoringState = {
  micActive: false,
  volume: 0,
  speechDetected: false,
  speechDurationMs: 0,
  backgroundNoiseHigh: false,
};

const SPEECH_THRESHOLD = 0.045;
const NOISE_THRESHOLD = 0.08;
const STATE_UPDATE_MS = 100;

export function useAudioMonitoring(enabled: boolean) {
  const [state, setState] = useState<AudioMonitoringState>(INITIAL);
  const speechStartRef = useRef<number | null>(null);
  const lastStateUpdateRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let animationId = 0;
    let audioContext: AudioContext | null = null;
    let stream: MediaStream | null = null;
    let stopped = false;

    async function init() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: DEFAULT_AUDIO_CONSTRAINTS,
          video: false,
        });

        if (stopped) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        source.connect(analyser);

        const data = new Uint8Array(analyser.fftSize);

        function tick() {
          if (stopped) return;

          analyser.getByteTimeDomainData(data);

          let sum = 0;
          for (let i = 0; i < data.length; i++) {
            const normalized = (data[i] - 128) / 128;
            sum += normalized * normalized;
          }

          const rms = Math.sqrt(sum / data.length);
          const now = Date.now();
          const speechDetected = rms > SPEECH_THRESHOLD;
          const backgroundNoiseHigh =
            rms > NOISE_THRESHOLD && !speechDetected;

          let speechDurationMs = 0;
          if (speechDetected) {
            if (speechStartRef.current === null) {
              speechStartRef.current = now;
            }
            speechDurationMs = now - speechStartRef.current;
          } else {
            speechStartRef.current = null;
          }

          if (now - lastStateUpdateRef.current >= STATE_UPDATE_MS) {
            lastStateUpdateRef.current = now;
            setState({
              micActive: true,
              volume: Number(rms.toFixed(4)),
              speechDetected,
              speechDurationMs,
              backgroundNoiseHigh,
            });
          }

          animationId = requestAnimationFrame(tick);
        }

        tick();
      } catch {
        if (!stopped) {
          setState({ ...INITIAL, micActive: false });
        }
      }
    }

    void init();

    return () => {
      stopped = true;
      cancelAnimationFrame(animationId);
      stream?.getTracks().forEach((t) => t.stop());
      void audioContext?.close();
      speechStartRef.current = null;
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setState(INITIAL);
    }
  }, [enabled]);

  return { state };
}
