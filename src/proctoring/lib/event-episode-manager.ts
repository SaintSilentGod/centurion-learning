import { EVENT_RISK_CONFIG } from "../constants";
import type {
  EventSource,
  ProctorEvent,
  ProctorEventType,
} from "../types";

type OpenEpisode = {
  eventId: string;
  startedAt: number;
};

export class EventEpisodeManager {
  private events: ProctorEvent[] = [];
  private openEpisodes = new Map<ProctorEventType, OpenEpisode>();
  private lastEpisodeEndAt = new Map<ProctorEventType, number>();
  private lastInstantAt = new Map<ProctorEventType, number>();
  private examStartedAt: number | null = null;

  startExam(startedAt = Date.now()) {
    this.examStartedAt = startedAt;
  }

  stopExam() {
    this.closeAllOpenEpisodes();
    this.examStartedAt = null;
  }

  reset() {
    this.events = [];
    this.openEpisodes.clear();
    this.lastEpisodeEndAt.clear();
    this.lastInstantAt.clear();
    this.examStartedAt = null;
  }

  getEvents(): ProctorEvent[] {
    return [...this.events];
  }

  setEvents(events: ProctorEvent[]) {
    this.events = [...events];
    this.openEpisodes.clear();
    this.lastEpisodeEndAt.clear();
    this.lastInstantAt.clear();
    for (const event of events) {
      if (event.endedAt == null && event.startedAt != null) {
        const config = EVENT_RISK_CONFIG[event.type];
        if (config.eventKind === "sustained") {
          this.openEpisodes.set(event.type, {
            eventId: event.id,
            startedAt: event.startedAt,
          });
        }
      }
      if (event.endedAt != null) {
        this.lastEpisodeEndAt.set(event.type, event.endedAt);
      }
      this.lastInstantAt.set(event.type, event.timestamp);
    }
  }

  /**
   * Log a one-shot instant event (respects cooldown).
   */
  logInstant(
    type: ProctorEventType,
    source: EventSource,
    details: Record<string, unknown> = {},
    options: { confidence?: number; snapshotDataUrl?: string } = {},
  ): ProctorEvent | null {
    const config = EVENT_RISK_CONFIG[type];
    if (config.eventKind !== "instant") return null;

    const now = Date.now();
    const last = this.lastInstantAt.get(type) ?? 0;
    if (config.cooldownMs > 0 && now - last < config.cooldownMs) {
      return null;
    }

    this.lastInstantAt.set(type, now);
    return this.pushEvent(type, source, now, details, options);
  }

  /**
   * Sync sustained episode state — opens one event per episode, closes on inactive.
   */
  syncSustained(
    type: ProctorEventType,
    source: EventSource,
    active: boolean,
    details: Record<string, unknown> = {},
    options: { confidence?: number } = {},
  ): void {
    const config = EVENT_RISK_CONFIG[type];
    if (config.eventKind !== "sustained") return;

    const now = Date.now();
    const open = this.openEpisodes.get(type);

    if (active) {
      if (!open) {
        const lastEnd = this.lastEpisodeEndAt.get(type) ?? 0;
        if (config.cooldownMs > 0 && now - lastEnd < config.cooldownMs) {
          return;
        }

        const event = this.pushEvent(type, source, now, details, {
          ...options,
          startedAt: now,
        });
        this.openEpisodes.set(type, { eventId: event.id, startedAt: now });
      } else {
        const event = this.events.find((e) => e.id === open.eventId);
        if (event) {
          Object.assign(event.details, details);
          if (options.confidence != null) {
            event.confidence = options.confidence;
          }
        }
      }
      return;
    }

    if (open) {
      const event = this.events.find((e) => e.id === open.eventId);
      if (event) {
        event.endedAt = now;
        event.durationMs = now - open.startedAt;
        event.startedAt = event.startedAt ?? open.startedAt;
        this.lastEpisodeEndAt.set(type, now);
      }
      this.openEpisodes.delete(type);
    }
  }

  closeAllOpenEpisodes(now = Date.now()): void {
    for (const [type, open] of this.openEpisodes) {
      const event = this.events.find((e) => e.id === open.eventId);
      if (event) {
        event.endedAt = now;
        event.durationMs = now - open.startedAt;
        event.startedAt = event.startedAt ?? open.startedAt;
        this.lastEpisodeEndAt.set(type, now);
      }
    }
    this.openEpisodes.clear();
  }

  private pushEvent(
    type: ProctorEventType,
    source: EventSource,
    now: number,
    details: Record<string, unknown>,
    options: {
      confidence?: number;
      snapshotDataUrl?: string;
      startedAt?: number;
    } = {},
  ): ProctorEvent {
    const config = EVENT_RISK_CONFIG[type];
    const event: ProctorEvent = {
      id: crypto.randomUUID(),
      type,
      timestamp: now,
      examTimeMs: this.examStartedAt ? now - this.examStartedAt : 0,
      severity: config.severity,
      details,
      source,
      confidence: options.confidence,
      snapshotDataUrl: options.snapshotDataUrl,
      startedAt: options.startedAt,
    };

    this.events.push(event);
    return event;
  }
}
