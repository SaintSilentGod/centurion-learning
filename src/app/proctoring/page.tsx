"use client";

import Link from "next/link";
import { useState } from "react";
import { ProctorConsent } from "@/proctoring/components/ProctorConsent";
import { useProctoringEngine } from "@/proctoring/hooks/useProctoringEngine";
import { CALIBRATION_STEP_LABELS, RISK_CATEGORY_LABELS } from "@/proctoring/constants";

export default function ProctoringRuntimePage() {
  const [consented, setConsented] = useState(false);
  const engine = useProctoringEngine();
  const { liveState } = engine;

  if (!consented) {
    return (
      <main className="mx-auto flex min-h-full max-w-3xl flex-col gap-6 px-6 py-12">
        <Link href="/" className="text-blue-700 hover:underline">
          ← На главную
        </Link>
        <ProctorConsent
          onAccept={() => setConsented(true)}
          onDecline={() => setConsented(false)}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-full max-w-3xl flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold">Прокторинг экзамена</h1>
        <p className="mt-1 text-slate-600">
          Runtime-модуль для реального экзамена. Сначала калибровка, затем
          мониторинг.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-lg">
          Live risk: <strong>{liveState.liveRiskScore}</strong> (
          {RISK_CATEGORY_LABELS[liveState.liveRiskCategory]})
        </p>
        <p className="text-slate-600">
          Final: {liveState.finalRiskScore} · Peak: {liveState.peakRiskScore} ·
          Событий: {liveState.events.length} · Время:{" "}
          {Math.round(liveState.examTimeMs / 1000)} сек
        </p>
        {liveState.calibrating && liveState.calibrationStep ? (
          <p className="mt-2 text-blue-700">
            {CALIBRATION_STEP_LABELS[liveState.calibrationStep]}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="min-h-12 rounded-lg bg-blue-700 px-5 text-white hover:bg-blue-800"
          onClick={() => void engine.startCalibration()}
        >
          Калибровка
        </button>
        <button
          type="button"
          className="min-h-12 rounded-lg bg-green-700 px-5 text-white hover:bg-green-800"
          onClick={async () => {
            await engine.requestFullscreen();
            await engine.requestScreenShare();
            await engine.startMonitoring();
          }}
        >
          Начать экзамен
        </button>
        <button
          type="button"
          className="min-h-12 rounded-lg border border-slate-300 px-5 hover:bg-slate-50"
          onClick={engine.stopMonitoring}
        >
          Завершить
        </button>
        <Link
          href="/proctor-debug"
          className="inline-flex min-h-12 items-center rounded-lg border border-slate-300 px-5 hover:bg-slate-50"
        >
          Debug UI
        </Link>
      </div>
    </main>
  );
}
