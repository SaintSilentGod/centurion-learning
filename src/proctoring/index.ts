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
export { SpeechVadSmoother, analyzeTimeDomain, speechBandRatio } from "./lib/speech-vad";
export {
  computeAttentionState,
  getAttentionSustainedSignals,
} from "./lib/attention-engine";
export {
  saveCalibrationProfile,
  loadCalibrationProfile,
} from "./lib/calibration";
export { useSingleTabGuard, probeExamTabAvailable } from "./hooks/useSingleTabGuard";
export { ProctorDebugView } from "./components/ProctorDebugView";
export { SingleTabBlocker } from "./components/SingleTabBlocker";
export {
  holdExamTabLock,
  waitForExamTabLock,
  isNewTabShortcut,
  EXAM_TAB_LOCK_NAME,
} from "./lib/single-tab-guard";
export { ProctorConsent } from "./components/ProctorConsent";
