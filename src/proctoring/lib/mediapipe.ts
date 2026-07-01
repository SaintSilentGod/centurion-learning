import { FilesetResolver } from "@mediapipe/tasks-vision";
import { WASM_CDN } from "../constants";

let visionPromise: ReturnType<typeof FilesetResolver.forVisionTasks> | null =
  null;

export function getVisionFileset() {
  if (!visionPromise) {
    visionPromise = FilesetResolver.forVisionTasks(WASM_CDN);
  }
  return visionPromise;
}

export async function createVisionTask<T>(
  factory: (
    vision: Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>>,
  ) => Promise<T>,
): Promise<T> {
  const vision = await getVisionFileset();
  return factory(vision);
}

export const DEFAULT_VIDEO_CONSTRAINTS: MediaTrackConstraints = {
  facingMode: "user",
  width: { ideal: 1280 },
  height: { ideal: 720 },
};

export const DEFAULT_AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
};
