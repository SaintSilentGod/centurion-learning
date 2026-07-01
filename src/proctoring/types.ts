export type LookingDirection =
  | "center"
  | "left"
  | "right"
  | "up"
  | "down"
  | "unknown";

export type AttentionState =
  | "attentive"
  | "distracted"
  | "missing"
  | "multiple_faces";

export type RiskCategory = "clean" | "light_review" | "suspicious" | "high_risk";

export type EventSeverity = "low" | "medium" | "high";

export type EventSource = "face" | "audio" | "browser" | "object" | "system";

export type EventKind = "instant" | "sustained";

export type DecayMode = "normal" | "slow" | "none";

export type ProctorEventType =
  | "FACE_MISSING"
  | "MULTIPLE_FACES"
  | "GAZE_AWAY"
  | "LOOKING_DOWN"
  | "HEAD_TURNED_AWAY"
  | "EYES_CLOSED"
  | "FULLSCREEN_EXIT"
  | "TAB_HIDDEN"
  | "WINDOW_BLUR"
  | "COPY_ATTEMPT"
  | "PASTE_ATTEMPT"
  | "RIGHT_CLICK"
  | "SCREEN_SHARE_STOPPED"
  | "SCREEN_SHARE_INVALID"
  | "DRAG_DROP_ATTEMPT"
  | "CAMERA_DISCONNECTED"
  | "DUPLICATE_EXAM_TAB"
  | "NEW_TAB_SHORTCUT"
  | "SPEECH_DETECTED"
  | "LONG_SPEECH_DETECTED"
  | "BACKGROUND_NOISE_HIGH"
  | "PHONE_DETECTED"
  | "BOOK_DETECTED"
  | "SECOND_PERSON_DETECTED"
  | "CALIBRATION_COMPLETED"
  | "MONITORING_STARTED"
  | "MONITORING_STOPPED";

export type EventRiskConfig = {
  weight: number;
  severity: EventSeverity;
  cooldownMs: number;
  eventKind: EventKind;
  decayMode: DecayMode;
  maxContribution?: number;
};

export type CalibrationPose = {
  headYaw: number;
  headPitch: number;
  headRoll: number;
  irisX: number;
  irisY: number;
  samples: number;
};

export type CalibrationProfile = {
  center: CalibrationPose;
  left: CalibrationPose;
  right: CalibrationPose;
  up: CalibrationPose;
  down: CalibrationPose;
  completedAt: number;
};

export type CalibrationStep = keyof Omit<CalibrationProfile, "completedAt">;

export type IrisMetrics = {
  irisXLeft: number;
  irisYLeft: number;
  irisXRight: number;
  irisYRight: number;
  averageIrisX: number;
  averageIrisY: number;
};

export type FaceAnalysisFrame = {
  faceDetected: boolean;
  faceCount: number;
  multipleFaces: boolean;
  faceMissingDurationMs: number;
  headYaw: number;
  headPitch: number;
  headRoll: number;
  eyesOpen: boolean;
  blinkDetected: boolean;
  lookingDirection: LookingDirection;
  attentionState: AttentionState;
  iris: IrisMetrics;
  fps: number;
  timestamp: number;
};

export type BrowserMonitoringState = {
  isFullscreen: boolean;
  isTabVisible: boolean;
  isWindowFocused: boolean;
  screenShareActive: boolean;
  /** True when the user shared the full monitor, not just a tab/window. */
  screenShareFullMonitor: boolean;
  displaySurface: "monitor" | "window" | "browser" | "unknown" | null;
  /** True when another tab holds the exam lock or this tab lost it. */
  examTabBlocked: boolean;
  singleTabEnforced: boolean;
};

export type AudioMonitoringState = {
  micActive: boolean;
  volume: number;
  speechDetected: boolean;
  speechDurationMs: number;
  backgroundNoiseHigh: boolean;
  /** 0–1 VAD confidence for human speech */
  voiceConfidence: number;
};

export type ObjectDetectionState = {
  phoneDetected: boolean;
  bookDetected: boolean;
  laptopDetected: boolean;
  secondPersonDetected: boolean;
  labels: string[];
};

export type AttentionResult = {
  attentionScore: number;
  attentionState: AttentionState;
  currentFlags: string[];
};

export type ProctorEvent = {
  id: string;
  type: ProctorEventType;
  timestamp: number;
  examTimeMs: number;
  severity: EventSeverity;
  details: Record<string, unknown>;
  snapshotDataUrl?: string;
  startedAt?: number;
  endedAt?: number;
  durationMs?: number;
  source?: EventSource;
  confidence?: number;
};

export type ProctorSnapshot = {
  id: string;
  eventId: string;
  type: "webcam" | "screen";
  dataUrl: string;
  timestamp: number;
};

export type RiskReportSummary = {
  liveRiskScore: number;
  liveRiskCategory: RiskCategory;
  finalRiskScore: number;
  finalRiskCategory: RiskCategory;
  peakRiskScore: number;
  eventCount: number;
  episodeCount: number;
  criticalEventCount: number;
  /** Backend must recompute finalRiskScore from raw events — never trust client-only. */
  recomputable: true;
  computedAt: number;
};

export type ProctorAttemptReport = {
  attemptId: string;
  userId: string;
  examId: string;
  startedAt: number;
  endedAt: number | null;
  calibrationProfile: CalibrationProfile | null;
  liveRiskScore: number;
  finalRiskScore: number;
  peakRiskScore: number;
  finalRiskCategory: RiskCategory;
  riskSummary: RiskReportSummary;
  events: ProctorEvent[];
  snapshots: ProctorSnapshot[];
};

export type ProctorLiveState = {
  face: FaceAnalysisFrame;
  browser: BrowserMonitoringState;
  audio: AudioMonitoringState;
  objects: ObjectDetectionState;
  attention: AttentionResult;
  /** @deprecated use liveRiskScore */
  riskScore: number;
  /** @deprecated use liveRiskCategory */
  riskCategory: RiskCategory;
  liveRiskScore: number;
  liveRiskCategory: RiskCategory;
  finalRiskScore: number;
  finalRiskCategory: RiskCategory;
  peakRiskScore: number;
  events: ProctorEvent[];
  calibrationProfile: CalibrationProfile | null;
  monitoring: boolean;
  calibrating: boolean;
  calibrationStep: CalibrationStep | null;
  examTimeMs: number;
  tabGuardBlocked: boolean;
};

export type CameraStreamStatus =
  | "idle"
  | "requesting"
  | "active"
  | "disconnected"
  | "error";
