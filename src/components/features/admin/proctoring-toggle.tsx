"use client";

import { toggleFinalTestProctoringAction } from "@/actions/admin/clients";

export function ProctoringToggle({
  clientId,
  enabled,
}: {
  clientId: string;
  enabled: boolean;
}) {
  const action = toggleFinalTestProctoringAction.bind(null, clientId);

  return (
    <form action={action} className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 px-4 py-3">
      <div>
        <p className="text-base font-medium text-slate-900">
          Включить систему прокторинга для финального теста
        </p>
        <p className="text-sm text-slate-600">
          {enabled ? "Прокторинг включён" : "Прокторинг выключен"}
        </p>
      </div>
      <button
        type="submit"
        role="switch"
        aria-checked={enabled}
        className={`relative h-8 w-14 shrink-0 rounded-full transition ${
          enabled ? "bg-blue-700" : "bg-slate-300"
        }`}
        aria-label="Переключить прокторинг для финального теста"
      >
        <span
          className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${
            enabled ? "left-7" : "left-1"
          }`}
        />
      </button>
    </form>
  );
}
