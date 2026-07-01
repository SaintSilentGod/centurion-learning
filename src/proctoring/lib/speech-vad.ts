/**
 * Lightweight spectral VAD — distinguishes speech-band energy from broadband noise.
 * Swap for Silero ONNX (@ricky0123/vad-web) when bundle size is acceptable.
 */

export type VadSample = {
  /** RMS amplitude 0–1 */
  rms: number;
  /** Fraction of energy in human speech band (~300–3400 Hz) */
  speechBandRatio: number;
  /** Zero-crossing rate — speech tends to be moderate, drilling/impact is erratic */
  zeroCrossingRate: number;
};

export type VadResult = {
  speechDetected: boolean;
  backgroundNoiseHigh: boolean;
  /** 0–1 confidence that the signal is human speech */
  voiceConfidence: number;
};

const MIN_RMS_FOR_SPEECH = 0.018;
const SPEECH_BAND_RATIO_THRESHOLD = 0.38;
const NOISE_RMS_THRESHOLD = 0.1;
const SMOOTHING = 0.35;

export function analyzeTimeDomain(samples: Float32Array): {
  rms: number;
  zeroCrossingRate: number;
} {
  let sum = 0;
  let crossings = 0;
  let prev = samples[0] ?? 0;

  for (let i = 0; i < samples.length; i++) {
    const v = samples[i];
    sum += v * v;
    if (i > 0 && (v >= 0) !== (prev >= 0)) crossings++;
    prev = v;
  }

  const rms = Math.sqrt(sum / samples.length);
  const zeroCrossingRate = crossings / samples.length;
  return { rms, zeroCrossingRate };
}

export function speechBandRatio(
  frequencyData: Uint8Array,
  sampleRate: number,
  fftSize: number,
): number {
  const binWidth = sampleRate / fftSize;
  const lowBin = Math.floor(300 / binWidth);
  const highBin = Math.min(
    frequencyData.length - 1,
    Math.ceil(3400 / binWidth),
  );

  let speechEnergy = 0;
  let totalEnergy = 0;

  for (let i = 0; i < frequencyData.length; i++) {
    const e = frequencyData[i];
    totalEnergy += e;
    if (i >= lowBin && i <= highBin) speechEnergy += e;
  }

  if (totalEnergy === 0) return 0;
  return speechEnergy / totalEnergy;
}

export class SpeechVadSmoother {
  private confidence = 0;

  evaluate(sample: VadSample): VadResult {
    const { rms, speechBandRatio: bandRatio, zeroCrossingRate } = sample;

    const zcrOk = zeroCrossingRate > 0.02 && zeroCrossingRate < 0.35;
    const rawConfidence =
      rms < MIN_RMS_FOR_SPEECH
        ? 0
        : clamp(
            bandRatio * 0.7 +
              (zcrOk ? 0.2 : 0) +
              (rms > MIN_RMS_FOR_SPEECH ? 0.1 : 0),
            0,
            1,
          );

    this.confidence =
      this.confidence * (1 - SMOOTHING) + rawConfidence * SMOOTHING;

    const speechDetected =
      this.confidence >= 0.45 &&
      rms >= MIN_RMS_FOR_SPEECH &&
      bandRatio >= SPEECH_BAND_RATIO_THRESHOLD;

    const backgroundNoiseHigh =
      rms >= NOISE_RMS_THRESHOLD &&
      !speechDetected &&
      bandRatio < 0.25;

    return {
      speechDetected,
      backgroundNoiseHigh,
      voiceConfidence: Number(this.confidence.toFixed(3)),
    };
  }

  reset() {
    this.confidence = 0;
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
