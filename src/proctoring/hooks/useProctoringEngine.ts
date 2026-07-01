"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ATTENTION_THRESHOLDS_MS,
  CALIBRATION_STEP_MS,
  EVENT_RISK_CONFIG,
  RISK_UPDATE_MS,
  UI_UPDATE_MS,
} from "../constants";
import {
  accumulateCalibrationPose,
  CALIBRATION_STEPS,
  createEmptyCalibrationProfile,
  loadCalibrationProfile,
  saveCalibrationProfile,
} from "../lib/calibration";
import {
  computeAttentionState,
  createAttentionTrackerState,
  getAttentionSustainedSignals,
  updateAttentionTracker,
} from "../lib/attention-engine";
import { captureVideoSnapshot, EventLogger } from "../lib/event-logger";
import { RiskEngine } from "../lib/risk-engine";
import { useStableEventHandler } from "../lib/use-stable-handler";
import type {
  AudioMonitoringState,
  BrowserMonitoringState,
  CalibrationProfile,
  CalibrationStep,
  EventSource,
  FaceAnalysisFrame,
  ObjectDetectionState,
  ProctorAttemptReport,
  ProctorEventType,
  ProctorLiveState,
  RiskCategory,
} from "../types";
import { EMPTY_FACE_FRAME } from "./useFaceAnalysis";
import { useAudioMonitoring } from "./useAudioMonitoring";
import { useBrowserMonitoring } from "./useBrowserMonitoring";
import { useCameraStream } from "./useCameraStream";
import { useFaceAnalysis } from "./useFaceAnalysis";
import { useObjectDetection } from "./useObjectDetection";
import { useSingleTabGuard } from "./useSingleTabGuard";

function createInitialLiveState(): ProctorLiveState {
  return {
    face: EMPTY_FACE_FRAME,
    browser: {
      isFullscreen: false,
      isTabVisible: true,
      isWindowFocused: true,
      screenShareActive: false,
      screenShareFullMonitor: false,
      displaySurface: null,
      examTabBlocked: false,
      singleTabEnforced: false,
    },
    audio: {
      micActive: false,
      volume: 0,
      speechDetected: false,
      speechDurationMs: 0,
      backgroundNoiseHigh: false,
      voiceConfidence: 0,
    },
    objects: {
      phoneDetected: false,
      bookDetected: false,
      laptopDetected: false,
      secondPersonDetected: false,
      labels: [],
    },
    attention: {
      attentionScore: 100,
      attentionState: "missing",
      currentFlags: [],
    },
    riskScore: 0,
    riskCategory: "clean",
    liveRiskScore: 0,
    liveRiskCategory: "clean",
    finalRiskScore: 0,
    finalRiskCategory: "clean",
    peakRiskScore: 0,
    events: [],
    calibrationProfile: null,
    monitoring: false,
    calibrating: false,
    calibrationStep: null,
    examTimeMs: 0,
    tabGuardBlocked: false,
  };
}

type RiskSnapshot = {
  liveRiskScore: number;
  liveRiskCategory: RiskCategory;
  finalRiskScore: number;
  finalRiskCategory: RiskCategory;
  peakRiskScore: number;
};

export function useProctoringEngine() {
  const [liveState, setLiveState] = useState<ProctorLiveState>(
    createInitialLiveState,
  );

  const [faceAnalysisEnabled, setFaceAnalysisEnabled] = useState(false);
  const [monitoringEnabled, setMonitoringEnabled] = useState(false);
  const [objectDetectionEnabled, setObjectDetectionEnabled] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const calibratingRef = useRef(false);
  const calibrationStepRef = useRef<CalibrationStep | null>(null);
  const calibrationStepStartedRef = useRef(0);
  const calibrationDraftRef = useRef(createEmptyCalibrationProfile());
  const calibrationProfileRef = useRef<CalibrationProfile | null>(null);

  const faceFrameRef = useRef<FaceAnalysisFrame>(EMPTY_FACE_FRAME);
  const attentionTrackerRef = useRef(createAttentionTrackerState());
  const lastAttentionTickRef = useRef(Date.now());
  const examStartedAtRef = useRef<number | null>(null);

  const browserStateRef = useRef<BrowserMonitoringState>(
    createInitialLiveState().browser,
  );
  const audioStateRef = useRef<AudioMonitoringState>(
    createInitialLiveState().audio,
  );
  const objectsStateRef = useRef<ObjectDetectionState>(
    createInitialLiveState().objects,
  );

  const eventLoggerRef = useRef(new EventLogger());
  const riskEngineRef = useRef(new RiskEngine());
  const riskSnapshotRef = useRef<RiskSnapshot>({
    liveRiskScore: 0,
    liveRiskCategory: "clean",
    finalRiskScore: 0,
    finalRiskCategory: "clean",
    peakRiskScore: 0,
  });

  const attemptMetaRef = useRef({
    attemptId: "",
    userId: "debug-user",
    examId: "debug-exam",
  });

  useEffect(() => {
    attemptMetaRef.current.attemptId = crypto.randomUUID();
    const profile = loadCalibrationProfile();
    calibrationProfileRef.current = profile;
    setHydrated(true);
    if (profile) {
      setLiveState((prev) => ({ ...prev, calibrationProfile: profile }));
    }
  }, []);

  const onTabBlockedRef = useRef<() => void>(() => {});

  const tabGuard = useSingleTabGuard({
    onBlocked: () => onTabBlockedRef.current(),
  });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const onCameraDisconnectRef = useRef<() => void>(() => {});

  const { videoRef, start: startCamera, stop: stopCamera, status, error } =
    useCameraStream({
      onDisconnect: () => onCameraDisconnectRef.current(),
    });

  const registerEvent = useCallback((event: { id: string } | null) => {
    if (event) {
      riskEngineRef.current.addEvent(
        event as ReturnType<EventLogger["getEvents"]>[number],
      );
    }
  }, []);

  const logInstantEvent = useCallback(
    (
      type: ProctorEventType,
      source: EventSource,
      details: Record<string, unknown> = {},
    ) => {
      const video = videoRef.current;
      const isHigh = EVENT_RISK_CONFIG[type].severity === "high";
      const snapshot =
        isHigh && video ? captureVideoSnapshot(video) : undefined;

      const event = eventLoggerRef.current.logInstant(
        type,
        source,
        details,
        snapshot,
      );
      registerEvent(event);
    },
    [registerEvent, videoRef],
  );

  const syncSustainedEvent = useCallback(
    (
      type: ProctorEventType,
      source: EventSource,
      active: boolean,
      details: Record<string, unknown> = {},
    ) => {
      const event = eventLoggerRef.current.syncSustained(
        type,
        source,
        active,
        details,
      );
      registerEvent(event);
    },
    [registerEvent],
  );

  const handleProctorEvent = useStableEventHandler(
    (type: ProctorEventType, details?: Record<string, unknown>) => {
      logInstantEvent(type, "browser", details ?? {});
    },
  );

  const syncEpisodeEvents = useCallback(() => {
    if (!monitoringEnabled) return;

    for (const signal of getAttentionSustainedSignals(
      attentionTrackerRef.current,
      faceFrameRef.current,
    )) {
      syncSustainedEvent(
        signal.type,
        "face",
        signal.active,
        signal.details ?? {},
      );
    }

    const audio = audioStateRef.current;
    syncSustainedEvent("SPEECH_DETECTED", "audio", audio.speechDetected, {
      volume: audio.volume,
      speechDurationMs: audio.speechDurationMs,
      voiceConfidence: audio.voiceConfidence,
    });

    const longSpeechActive =
      audio.speechDetected &&
      audio.speechDurationMs >= ATTENTION_THRESHOLDS_MS.longSpeech;
    syncSustainedEvent("LONG_SPEECH_DETECTED", "audio", longSpeechActive, {
      volume: audio.volume,
      speechDurationMs: audio.speechDurationMs,
    });

    syncSustainedEvent(
      "BACKGROUND_NOISE_HIGH",
      "audio",
      audio.backgroundNoiseHigh,
      { volume: audio.volume },
    );

    const objects = objectsStateRef.current;
    syncSustainedEvent("PHONE_DETECTED", "object", objects.phoneDetected, {
      labels: objects.labels,
    });
    syncSustainedEvent("BOOK_DETECTED", "object", objects.bookDetected, {
      labels: objects.labels,
    });
    syncSustainedEvent(
      "SECOND_PERSON_DETECTED",
      "object",
      objects.secondPersonDetected,
      { labels: objects.labels },
    );
  }, [monitoringEnabled, syncSustainedEvent]);

  const onFaceFrame = useCallback((frame: FaceAnalysisFrame) => {
    faceFrameRef.current = frame;

    if (calibratingRef.current && calibrationStepRef.current && frame.faceDetected) {
      const step = calibrationStepRef.current;
      calibrationDraftRef.current[step] = accumulateCalibrationPose(
        calibrationDraftRef.current[step],
        frame,
      );
    }
  }, []);

  useFaceAnalysis({
    enabled: faceAnalysisEnabled,
    videoRef,
    canvasRef,
    calibrationRef: calibrationProfileRef,
    onFrame: onFaceFrame,
  });

  const browser = useBrowserMonitoring(monitoringEnabled, handleProctorEvent, {
    blockNewTabShortcuts: monitoringEnabled,
  });
  const audio = useAudioMonitoring(monitoringEnabled);
  const objects = useObjectDetection(
    monitoringEnabled && objectDetectionEnabled,
    videoRef,
  );

  useEffect(() => {
    browserStateRef.current = browser.state;
  }, [browser.state]);

  useEffect(() => {
    browser.setExamTabBlocked(tabGuard.isBlocked);
  }, [tabGuard.isBlocked, browser]);

  useEffect(() => {
    audioStateRef.current = audio.state;
  }, [audio.state]);

  useEffect(() => {
    objectsStateRef.current = objects.state;
  }, [objects.state]);

  useEffect(() => {
    const riskTimer = setInterval(() => {
      const now = Date.now();
      const live = riskEngineRef.current.calculateLive(now);
      const final = riskEngineRef.current.calculateFinal(now);
      riskSnapshotRef.current = {
        liveRiskScore: live.score,
        liveRiskCategory: live.category,
        finalRiskScore: final.score,
        finalRiskCategory: final.category,
        peakRiskScore: riskEngineRef.current.getPeakScore(),
      };
    }, RISK_UPDATE_MS);

    return () => clearInterval(riskTimer);
  }, []);

  const syncLiveState = useCallback(() => {
    const now = Date.now();
    const deltaMs = now - lastAttentionTickRef.current;
    lastAttentionTickRef.current = now;

    if (monitoringEnabled) {
      attentionTrackerRef.current = updateAttentionTracker(
        attentionTrackerRef.current,
        faceFrameRef.current,
        calibrationProfileRef.current,
        deltaMs,
      );
      syncEpisodeEvents();
    }

    const attention = computeAttentionState(
      faceFrameRef.current,
      attentionTrackerRef.current,
      calibrationProfileRef.current,
    );

    const risk = riskSnapshotRef.current;

    setLiveState({
      face: faceFrameRef.current,
      browser: browserStateRef.current,
      audio: audioStateRef.current,
      objects: objectsStateRef.current,
      attention,
      riskScore: risk.liveRiskScore,
      riskCategory: risk.liveRiskCategory,
      liveRiskScore: risk.liveRiskScore,
      liveRiskCategory: risk.liveRiskCategory,
      finalRiskScore: risk.finalRiskScore,
      finalRiskCategory: risk.finalRiskCategory,
      peakRiskScore: risk.peakRiskScore,
      events: eventLoggerRef.current.getEvents(),
      calibrationProfile: calibrationProfileRef.current,
      monitoring: monitoringEnabled,
      calibrating: calibratingRef.current,
      calibrationStep: calibrationStepRef.current,
      examTimeMs: examStartedAtRef.current
        ? now - examStartedAtRef.current
        : 0,
      tabGuardBlocked: tabGuard.isBlocked,
    });
  }, [monitoringEnabled, syncEpisodeEvents, tabGuard.isBlocked]);

  useEffect(() => {
    onTabBlockedRef.current = () => {
      logInstantEvent("DUPLICATE_EXAM_TAB", "browser");
      browser.setExamTabBlocked(true);
      syncLiveState();
    };
  }, [browser, logInstantEvent, syncLiveState]);

  useEffect(() => {
    onCameraDisconnectRef.current = () => {
      logInstantEvent("CAMERA_DISCONNECTED", "system", {
        cameraStatus: "disconnected",
      });
      syncLiveState();
    };
  }, [logInstantEvent, syncLiveState]);

  useEffect(() => {
    const uiTimer = setInterval(syncLiveState, UI_UPDATE_MS);
    return () => clearInterval(uiTimer);
  }, [syncLiveState]);

  useEffect(() => {
    if (!calibratingRef.current) return;

    const timer = setInterval(() => {
      const step = calibrationStepRef.current;
      if (!step) return;

      const elapsed = Date.now() - calibrationStepStartedRef.current;
      if (elapsed < CALIBRATION_STEP_MS) return;

      const stepIndex = CALIBRATION_STEPS.indexOf(step);
      const nextStep = CALIBRATION_STEPS[stepIndex + 1];

      if (!nextStep) {
        const profile: CalibrationProfile = {
          ...calibrationDraftRef.current,
          completedAt: Date.now(),
        };
        calibrationProfileRef.current = profile;
        saveCalibrationProfile(profile);
        calibratingRef.current = false;
        calibrationStepRef.current = null;
        setFaceAnalysisEnabled(false);
        logInstantEvent("CALIBRATION_COMPLETED", "system", {
          completedAt: profile.completedAt,
        });
        syncLiveState();
        return;
      }

      calibrationStepRef.current = nextStep;
      calibrationStepStartedRef.current = Date.now();
      syncLiveState();
    }, 200);

    return () => clearInterval(timer);
  }, [liveState.calibrating, logInstantEvent, syncLiveState]);

  const startMonitoring = useCallback(async (): Promise<boolean> => {
    const tabOk = await tabGuard.acquire();
    if (!tabOk) {
      browser.setExamTabBlocked(true);
      syncLiveState();
      return false;
    }

    calibratingRef.current = false;
    calibrationStepRef.current = null;
    await startCamera();
    setFaceAnalysisEnabled(true);
    setMonitoringEnabled(true);
    examStartedAtRef.current = Date.now();
    eventLoggerRef.current.startExam(examStartedAtRef.current);
    attentionTrackerRef.current = createAttentionTrackerState();
    logInstantEvent("MONITORING_STARTED", "system");
    syncLiveState();
    return true;
  }, [browser, logInstantEvent, startCamera, syncLiveState, tabGuard]);

  const stopMonitoring = useCallback(() => {
    setMonitoringEnabled(false);
    setFaceAnalysisEnabled(false);
    setObjectDetectionEnabled(false);
    calibratingRef.current = false;
    calibrationStepRef.current = null;
    eventLoggerRef.current.closeOpenEpisodes();
    logInstantEvent("MONITORING_STOPPED", "system");
    eventLoggerRef.current.stopExam();
    tabGuard.release();
    stopCamera();
    syncLiveState();
  }, [logInstantEvent, stopCamera, syncLiveState, tabGuard]);

  const startCalibration = useCallback(async () => {
    setMonitoringEnabled(false);
    setObjectDetectionEnabled(false);
    await startCamera();
    calibratingRef.current = true;
    calibrationDraftRef.current = createEmptyCalibrationProfile();
    calibrationStepRef.current = "center";
    calibrationStepStartedRef.current = Date.now();
    setFaceAnalysisEnabled(true);
    syncLiveState();
  }, [startCamera, syncLiveState]);

  const resetEvents = useCallback(() => {
    eventLoggerRef.current.reset();
    riskEngineRef.current.clear();
    attentionTrackerRef.current = createAttentionTrackerState();
    riskSnapshotRef.current = {
      liveRiskScore: 0,
      liveRiskCategory: "clean",
      finalRiskScore: 0,
      finalRiskCategory: "clean",
      peakRiskScore: 0,
    };
    syncLiveState();
  }, [syncLiveState]);

  const exportDebugJson = useCallback(() => {
    const now = Date.now();
    const summary = riskEngineRef.current.getReportSummary(now);
    const report: ProctorAttemptReport = {
      ...attemptMetaRef.current,
      startedAt: examStartedAtRef.current ?? now,
      endedAt: now,
      calibrationProfile: calibrationProfileRef.current,
      liveRiskScore: summary.liveRiskScore,
      finalRiskScore: summary.finalRiskScore,
      peakRiskScore: summary.peakRiskScore,
      finalRiskCategory: summary.finalRiskCategory,
      riskSummary: summary,
      events: eventLoggerRef.current.getEvents(),
      snapshots: eventLoggerRef.current.getSnapshots(),
    };

    return JSON.stringify(report, null, 2);
  }, []);

  const downloadDebugJson = useCallback(() => {
    const json = exportDebugJson();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `proctor-debug-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [exportDebugJson]);

  return {
    videoRef,
    canvasRef,
    liveState,
    cameraStatus: status,
    cameraError: error,
    objectDetectionEnabled,
    setObjectDetectionEnabled,
    hydrated,
    startMonitoring,
    stopMonitoring,
    startCalibration,
    resetEvents,
    exportDebugJson,
    downloadDebugJson,
    tabGuardBlocked: tabGuard.isBlocked,
    retryTabGuard: tabGuard.retry,
    requestFullscreen: browser.requestFullscreen,
    requestScreenShare: browser.requestScreenShare,
    simulateTabHidden: browser.simulateTabHidden,
  };
}
