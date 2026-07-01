export * from "./types";
export * from "./constants";
export { useCameraStream } from "./hooks/useCameraStream";
export { useFaceAnalysis, EMPTY_FACE_FRAME } from "./hooks/useFaceAnalysis";
export { useBrowserMonitoring } from "./hooks/useBrowserMonitoring";
export { useAudioMonitoring } from "./hooks/useAudioMonitoring";
export { useObjectDetection } from "./hooks/useObjectDetection";
export { useProctoringEngine } from "./hooks/useProctoringEngine";
export { RiskEngine } from "./lib/risk-engine";
export { EventLogger } from "./lib/event-logger";
export { EventEpisodeManager } from "./lib/event-episode-manager";
export {
  computeEventContribution,
  computeRiskScoreFromEvents,
  computePeakRiskScore,
  recomputeRiskFromEvents,
  durationMultiplier,
} from "./lib/risk-scoring";
export { computeAttentionState, getAttentionSustainedSignals } from "./lib/attention-engine";
export {
  saveCalibrationProfile,
  loadCalibrationProfile,
} from "./lib/calibration";
export { ProctorDebugView } from "./components/ProctorDebugView";
export { ProctorConsent } from "./components/ProctorConsent";
