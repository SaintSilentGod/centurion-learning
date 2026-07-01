import { EVENT_RISK_CONFIG } from "../constants";
import { EventEpisodeManager } from "./event-episode-manager";
import type {
  EventSource,
  ProctorEvent,
  ProctorEventType,
  ProctorSnapshot,
} from "../types";

export class EventLogger {
  private episodeManager = new EventEpisodeManager();
  private snapshots: ProctorSnapshot[] = [];

  startExam(startedAt = Date.now()) {
    this.episodeManager.startExam(startedAt);
  }

  stopExam() {
    this.episodeManager.stopExam();
  }

  logInstant(
    type: ProctorEventType,
    source: EventSource,
    details: Record<string, unknown> = {},
    snapshotDataUrl?: string,
    confidence?: number,
  ): ProctorEvent | null {
    const event = this.episodeManager.logInstant(type, source, details, {
      confidence,
      snapshotDataUrl,
    });

    if (event && snapshotDataUrl && event.severity === "high") {
      this.snapshots.push({
        id: crypto.randomUUID(),
        eventId: event.id,
        type: "webcam",
        dataUrl: snapshotDataUrl,
        timestamp: event.timestamp,
      });
    }

    return event;
  }

  syncSustained(
    type: ProctorEventType,
    source: EventSource,
    active: boolean,
    details: Record<string, unknown> = {},
    confidence?: number,
  ): ProctorEvent | null {
    const before = this.episodeManager.getEvents().length;
    this.episodeManager.syncSustained(type, source, active, details, {
      confidence,
    });
    const after = this.episodeManager.getEvents();
    if (after.length > before) {
      return after[after.length - 1];
    }
    return null;
  }

  closeOpenEpisodes() {
    this.episodeManager.closeAllOpenEpisodes();
  }

  /** @deprecated use logInstant */
  log(
    type: ProctorEventType,
    details: Record<string, unknown> = {},
    snapshotDataUrl?: string,
  ): ProctorEvent {
    const source = (details.source as EventSource | undefined) ?? "system";
    const event =
      this.logInstant(type, source, details, snapshotDataUrl) ??
      ({
        id: crypto.randomUUID(),
        type,
        timestamp: Date.now(),
        examTimeMs: 0,
        severity: EVENT_RISK_CONFIG[type].severity,
        details,
        snapshotDataUrl,
        source,
      } satisfies ProctorEvent);
    return event;
  }

  getEvents() {
    return this.episodeManager.getEvents();
  }

  getSnapshots() {
    return [...this.snapshots];
  }

  reset() {
    this.episodeManager.reset();
    this.snapshots = [];
  }

  exportJson() {
    return JSON.stringify(
      {
        events: this.getEvents(),
        snapshots: this.snapshots.map((s) => ({
          ...s,
          dataUrl: `${s.dataUrl.slice(0, 48)}…`,
        })),
      },
      null,
      2,
    );
  }
}

export function captureVideoSnapshot(
  video: HTMLVideoElement,
  width = 320,
): string | undefined {
  if (video.videoWidth === 0) return undefined;

  const canvas = document.createElement("canvas");
  const scale = width / video.videoWidth;
  canvas.width = width;
  canvas.height = Math.round(video.videoHeight * scale);

  const ctx = canvas.getContext("2d");
  if (!ctx) return undefined;

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.7);
}
