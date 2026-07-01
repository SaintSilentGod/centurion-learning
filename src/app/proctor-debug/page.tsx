"use client";

import Link from "next/link";
import { ProctorDebugView } from "@/proctoring/components/ProctorDebugView";

export default function ProctorDebugPage() {
  return (
    <main className="mx-auto min-h-full w-full max-w-7xl px-6 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Proctor Debug</h1>
          <p className="mt-1 text-slate-600">
            Отладка всех сигналов прокторинга: лицо, взгляд, браузер, микрофон,
            объекты, risk score
          </p>
        </div>
        <Link href="/" className="text-base text-blue-700 hover:underline">
          ← На главную
        </Link>
      </div>
      <ProctorDebugView />
    </main>
  );
}
