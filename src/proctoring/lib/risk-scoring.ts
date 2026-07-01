import {
  CRITICAL_EVENT_TYPES,
  EVENT_RISK_CONFIG,
  getDecayHalfLifeMs,
  riskCategoryFromScore,
} from "../constants";
import type { ProctorEvent, ProctorEventType, RiskCategory } from "../types";

export type RiskScoreMode = "live" | "final";

/** Duration multiplier for sustained episodes. */
export function durationMultiplier(durationMs: number): number {
  if (durationMs < 5000) return 1;
  if (durationMs < 15000) return 1.25;
  if (durationMs < 30000) return 1.5;
  if (durationMs < 60000) return 2;
  return 2.5;
}

function severityMultiplier(severity: ProctorEvent["severity"]): number {
  if (severity === "high") return 1;
  if (severity === "medium") return 0.85;
  return 0.65;
}

function effectiveDurationMs(event: ProctorEvent, now: number): number {
  if (event.durationMs != null && event.durationMs > 0) {
    return event.durationMs;
  }
  if (event.startedAt != null) {
    const end = event.endedAt ?? now;
    return Math.max(0, end - event.startedAt);
  }
  return 0;
}

function decayFactor(
  ageMs: number,
  mode: RiskScoreMode,
  decayMode: "normal" | "slow" | "none",
): number {
  const halfLife = getDecayHalfLifeMs(mode, decayMode);
  if (halfLife == null) return 1;
  return Math.pow(0.5, ageMs / halfLife);
}

/**
 * Pure contribution for one event — safe to run on backend from raw event log.
 */
export function computeEventContribution(
  event: ProctorEvent,
  mode: RiskScoreMode,
  now = Date.now(),
): number {
  const config = EVENT_RISK_CONFIG[event.type];
  if (!config || config.weight <= 0) return 0;

  const ageMs = Math.max(0, now - event.timestamp);
  const decay = decayFactor(ageMs, mode, config.decayMode);
  const durationMs = effectiveDurationMs(event, now);
  const durationMult =
    config.eventKind === "sustained"
      ? durationMultiplier(durationMs)
      : 1;

  let contribution =
    config.weight *
    decay *
    severityMultiplier(event.severity) *
    durationMult;

  if (event.confidence != null && event.confidence > 0) {
    contribution *= 0.5 + event.confidence * 0.5;
  }

  if (config.maxContribution != null) {
    contribution = Math.min(contribution, config.maxContribution);
  }

  return contribution;
}

export function computeRiskScoreFromEvents(
  events: ProctorEvent[],
  mode: RiskScoreMode,
  now = Date.now(),
): number {
  let score = 0;
  for (const event of events) {
    score += computeEventContribution(event, mode, now);
  }
  return Math.min(100, Math.round(score));
}

export type RecomputedRiskScores = {
  liveRiskScore: number;
  liveRiskCategory: RiskCategory;
  finalRiskScore: number;
  finalRiskCategory: RiskCategory;
  peakRiskScore: number;
};

/**
 * Backend-ready: recompute all risk scores from immutable raw events.
 * Never trust client-sent finalRiskScore — always call this server-side.
 */
/** Sample live score at event boundaries to approximate peak (backend-safe). */
export function computePeakRiskScore(
  events: ProctorEvent[],
  now = Date.now(),
): number {
  const sampleTimes = new Set<number>([now]);
  for (const event of events) {
    sampleTimes.add(event.timestamp);
    if (event.startedAt != null) sampleTimes.add(event.startedAt);
    if (event.endedAt != null) sampleTimes.add(event.endedAt);
  }

  let peak = 0;
  for (const t of sampleTimes) {
    peak = Math.max(peak, computeRiskScoreFromEvents(events, "live", t));
  }
  return peak;
}

export function recomputeRiskFromEvents(
  events: ProctorEvent[],
  now = Date.now(),
): RecomputedRiskScores {
  const liveRiskScore = computeRiskScoreFromEvents(events, "live", now);
  const finalRiskScore = computeRiskScoreFromEvents(events, "final", now);
  const peakRiskScore = computePeakRiskScore(events, now);

  return {
    liveRiskScore,
    liveRiskCategory: riskCategoryFromScore(liveRiskScore),
    finalRiskScore,
    finalRiskCategory: riskCategoryFromScore(finalRiskScore),
    peakRiskScore,
  };
}

export function countEpisodes(events: ProctorEvent[]): number {
  return events.filter(
    (e) =>
      EVENT_RISK_CONFIG[e.type].eventKind === "sustained" &&
      e.durationMs != null &&
      e.durationMs > 0,
  ).length;
}

export function countCriticalEvents(events: ProctorEvent[]): number {
  return events.filter((e) =>
    CRITICAL_EVENT_TYPES.includes(e.type as ProctorEventType),
  ).length;
}
