import { riskCategoryFromScore } from "../constants";
import type { ProctorEvent, RiskCategory, RiskReportSummary } from "../types";
import {
  computeRiskScoreFromEvents,
  countCriticalEvents,
  countEpisodes,
} from "./risk-scoring";

export class RiskEngine {
  private events: ProctorEvent[] = [];
  private peakScore = 0;

  addEvent(event: ProctorEvent) {
    this.events.push(event);
  }

  setEvents(events: ProctorEvent[]) {
    this.events = [...events];
    this.peakScore = 0;
    const now = Date.now();
    this.peakScore = this.calculateLive(now).score;
  }

  getEvents(): ProctorEvent[] {
    return [...this.events];
  }

  clear() {
    this.events = [];
    this.peakScore = 0;
  }

  calculateLive(now = Date.now()): { score: number; category: RiskCategory } {
    const score = computeRiskScoreFromEvents(this.events, "live", now);
    this.peakScore = Math.max(this.peakScore, score);
    return {
      score,
      category: riskCategoryFromScore(score),
    };
  }

  calculateFinal(now = Date.now()): { score: number; category: RiskCategory } {
    const score = computeRiskScoreFromEvents(this.events, "final", now);
    return {
      score,
      category: riskCategoryFromScore(score),
    };
  }

  getPeakScore(): number {
    return this.peakScore;
  }

  getReportSummary(now = Date.now()): RiskReportSummary {
    const live = this.calculateLive(now);
    const final = this.calculateFinal(now);

    return {
      liveRiskScore: live.score,
      liveRiskCategory: live.category,
      finalRiskScore: final.score,
      finalRiskCategory: final.category,
      peakRiskScore: this.peakScore,
      eventCount: this.events.length,
      episodeCount: countEpisodes(this.events),
      criticalEventCount: countCriticalEvents(this.events),
      recomputable: true,
      computedAt: now,
    };
  }

  /** @deprecated use calculateLive */
  calculate(now = Date.now()) {
    return this.calculateLive(now);
  }
}
