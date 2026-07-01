"use client";

import { Button } from "@/components/ui/button";
import { CALIBRATION_STEP_LABELS, RISK_CATEGORY_LABELS } from "../constants";
import { useProctoringEngine } from "../hooks/useProctoringEngine";
import type { ProctorEvent } from "../types";

export function ProctorDebugView() {
  const engine = useProctoringEngine();
  const { liveState, videoRef, canvasRef, cameraError, cameraStatus } = engine;

  const debugPayload = {
    faceDetected: liveState.face.faceDetected,
    faceCount: liveState.face.faceCount,
    headYaw: liveState.face.headYaw,
    headPitch: liveState.face.headPitch,
    headRoll: liveState.face.headRoll,
    irisX: liveState.face.iris.averageIrisX,
    irisY: liveState.face.iris.averageIrisY,
    lookingDirection: liveState.face.lookingDirection,
    attentionState: liveState.attention.attentionState,
    attentionScore: liveState.attention.attentionScore,
    riskScore: liveState.liveRiskScore,
    riskCategory: liveState.liveRiskCategory,
    liveRiskScore: liveState.liveRiskScore,
    finalRiskScore: liveState.finalRiskScore,
    peakRiskScore: liveState.peakRiskScore,
    fps: liveState.face.fps,
    flags: liveState.attention.currentFlags,
    browser: liveState.browser,
    audio: liveState.audio,
    objects: liveState.objects,
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-6 xl:flex-row">
        <div className="flex-1">
          <div className="relative overflow-hidden rounded-2xl bg-slate-900">
            <video ref={videoRef} className="hidden" playsInline muted />
            <canvas
              ref={canvasRef}
              className="h-auto w-full max-w-[720px] rounded-2xl"
            />
            {cameraStatus === "requesting" ? (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 text-lg text-white">
                Запуск камеры…
              </div>
            ) : null}
          </div>
          {cameraError ? (
            <p className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-red-800">
              {cameraError}
            </p>
          ) : null}
          {liveState.calibrating && liveState.calibrationStep ? (
            <p className="mt-3 rounded-lg bg-blue-50 px-4 py-3 text-blue-900">
              Калибровка: {CALIBRATION_STEP_LABELS[liveState.calibrationStep]}
            </p>
          ) : null}
        </div>

        <aside className="w-full shrink-0 rounded-2xl bg-slate-900 p-6 text-green-400 xl:w-[400px]">
          <h2 className="mb-4 text-lg font-semibold text-white">Live данные</h2>
          <dl className="space-y-3 text-sm">
            <Row label="faceDetected" value={String(debugPayload.faceDetected)} />
            <Row label="faceCount" value={String(debugPayload.faceCount)} />
            <Row label="headYaw" value={String(debugPayload.headYaw)} />
            <Row label="headPitch" value={String(debugPayload.headPitch)} />
            <Row label="headRoll" value={String(debugPayload.headRoll)} />
            <Row label="irisX" value={String(debugPayload.irisX)} />
            <Row label="irisY" value={String(debugPayload.irisY)} />
            <Row label="lookingDirection" value={debugPayload.lookingDirection} />
            <Row label="attentionState" value={debugPayload.attentionState} />
            <Row label="attentionScore" value={String(debugPayload.attentionScore)} />
            <Row
              label="liveRiskScore"
              value={String(debugPayload.liveRiskScore)}
              alert={debugPayload.liveRiskScore >= 51}
            />
            <Row
              label="liveRiskCategory"
              value={RISK_CATEGORY_LABELS[debugPayload.riskCategory]}
            />
            <Row
              label="finalRiskScore"
              value={String(debugPayload.finalRiskScore)}
              alert={debugPayload.finalRiskScore >= 51}
            />
            <Row
              label="peakRiskScore"
              value={String(debugPayload.peakRiskScore)}
            />
            <Row label="FPS" value={String(debugPayload.fps)} />
          </dl>
          <pre className="mt-4 max-h-64 overflow-auto rounded-lg bg-black/40 p-3 text-xs">
            {JSON.stringify(debugPayload, null, 2)}
          </pre>
        </aside>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">Управление</h2>
        <div className="flex flex-wrap gap-3">
          <Button type="button" onClick={() => void engine.startCalibration()}>
            Start calibration
          </Button>
          <Button type="button" onClick={() => void engine.startMonitoring()}>
            Start monitoring
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={engine.stopMonitoring}
          >
            Stop monitoring
          </Button>
          <Button type="button" variant="secondary" onClick={engine.resetEvents}>
            Reset events
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={engine.simulateTabHidden}
          >
            Simulate tab switch
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void engine.requestFullscreen()}
          >
            Fullscreen
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void engine.requestScreenShare()}
          >
            Screen share
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              engine.setObjectDetectionEnabled(!engine.objectDetectionEnabled)
            }
          >
            Object detection: {engine.objectDetectionEnabled ? "ON" : "OFF"}
          </Button>
          <Button type="button" variant="secondary" onClick={engine.downloadDebugJson}>
            Export debug JSON
          </Button>
        </div>
      </section>

      {engine.hydrated && liveState.calibrationProfile ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-3 text-lg font-semibold">Калибровка</h2>
          <pre className="overflow-auto rounded-lg bg-slate-50 p-4 text-sm">
            {JSON.stringify(liveState.calibrationProfile, null, 2)}
          </pre>
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">
          Event timeline ({liveState.events.length})
        </h2>
        {liveState.events.length === 0 ? (
          <p className="text-slate-600">Событий пока нет</p>
        ) : (
          <ul className="max-h-96 space-y-2 overflow-auto">
            {[...liveState.events].reverse().map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </ul>
        )}
      </section>

      <p className="text-sm text-slate-500">
        Система не фиксирует «списание» автоматически — только подозрительные
        события и risk score для проверки администратором.
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  alert = false,
}: {
  label: string;
  value: string;
  alert?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-700 pb-2">
      <dt className="text-slate-400">{label}</dt>
      <dd className={`font-mono ${alert ? "text-red-400" : ""}`}>{value}</dd>
    </div>
  );
}

function EventRow({ event }: { event: ProctorEvent }) {
  const time = new Date(event.timestamp).toLocaleTimeString("ru-RU");
  const duration =
    event.durationMs != null
      ? ` · ${(event.durationMs / 1000).toFixed(1)}s`
      : event.endedAt == null && event.startedAt != null
        ? " · ongoing"
        : "";
  const source = event.source ? ` · ${event.source}` : "";

  return (
    <li className="rounded-lg border border-slate-200 px-4 py-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium">{event.type}</span>
        <span className="text-slate-500">
          {time} · {event.severity}
          {source}
          {duration} · exam+{Math.round(event.examTimeMs / 1000)}s
        </span>
      </div>
      {event.snapshotDataUrl ? (
        <p className="mt-1 text-xs text-amber-700">+ webcam snapshot</p>
      ) : null}
    </li>
  );
}
