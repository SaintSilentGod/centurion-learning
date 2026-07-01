"use client";

import { useEffect, useRef, useState } from "react";
import { DEFAULT_AUDIO_CONSTRAINTS } from "../lib/mediapipe";
import {
  analyzeTimeDomain,
  SpeechVadSmoother,
  speechBandRatio,
} from "../lib/speech-vad";
import type { AudioMonitoringState } from "../types";

const INITIAL: AudioMonitoringState = {
  micActive: false,
  volume: 0,
  speechDetected: false,
  speechDurationMs: 0,
  backgroundNoiseHigh: false,
  voiceConfidence: 0,
};

const STATE_UPDATE_MS = 100;

export function useAudioMonitoring(enabled: boolean) {
  const [state, setState] = useState<AudioMonitoringState>(INITIAL);
  const speechStartRef = useRef<number | null>(null);
  const lastStateUpdateRef = useRef(0);
  const vadRef = useRef(new SpeechVadSmoother());

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

        const timeData = new Float32Array(analyser.fftSize);
        const freqData = new Uint8Array(analyser.frequencyBinCount);
        vadRef.current.reset();

        function tick() {
          if (stopped) return;

          analyser.getFloatTimeDomainData(timeData);
          analyser.getByteFrequencyData(freqData);

          const { rms, zeroCrossingRate } = analyzeTimeDomain(timeData);
          const bandRatio = speechBandRatio(
            freqData,
            audioContext!.sampleRate,
            analyser.fftSize,
          );

          const vad = vadRef.current.evaluate({
            rms,
            speechBandRatio: bandRatio,
            zeroCrossingRate,
          });

          const now = Date.now();
          let speechDurationMs = 0;

          if (vad.speechDetected) {
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
              speechDetected: vad.speechDetected,
              speechDurationMs,
              backgroundNoiseHigh: vad.backgroundNoiseHigh,
              voiceConfidence: vad.voiceConfidence,
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
      vadRef.current.reset();
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setState(INITIAL);
      vadRef.current.reset();
    }
  }, [enabled]);

  return { state };
}
