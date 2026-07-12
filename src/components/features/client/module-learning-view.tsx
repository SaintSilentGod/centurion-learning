"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { submitModuleTestAction } from "@/actions/client/learning";
import { CloseModuleButton } from "@/components/features/client/close-module-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MODULE_THEORY_REQUIRED_SEC } from "@/lib/transport";
import { formatDurationRu } from "@/lib/time-tracking";

type Material = { id: string; title: string; content: string; order: number };
type Option = { id: string; text: string };
type Question = { id: string; text: string; options: Option[] };
type Test = { questions: Question[] } | null;
type BestAttempt = {
  scorePct: number | null;
  passed: boolean | null;
  completedAt: Date | null;
} | null;

type BlockKind = "theory" | "test";

function introStorageKey(moduleId: string, kind: BlockKind) {
  return `module-intro-${moduleId}-${kind}`;
}

function BlockIntroModal({
  kind,
  categoryOrder,
  moduleOrder,
  onConfirm,
}: {
  kind: BlockKind;
  categoryOrder: number;
  moduleOrder: number;
  onConfirm: () => void;
}) {
  const isTheory = kind === "theory";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">
          {isTheory ? "Теоретический блок" : "Тестовый блок"}
        </h2>
        <p className="text-base leading-relaxed text-slate-700">
          {isTheory ? (
            <>
              Сейчас вы будете просматривать теоретический блок модуля {moduleOrder}{" "}
              категории {categoryOrder}. Необходимое затрачивание времени для
              теоретического блока — 2 часа. Это нужно, чтобы перейти к тестовой
              части этого модуля.
            </>
          ) : (
            <>
              Сейчас вы приступите к тестовой части модуля {moduleOrder} категории{" "}
              {categoryOrder}. Для успешного прохождения необходимо набрать не менее
              90% правильных ответов.
            </>
          )}
        </p>
        <Button type="button" className="mt-5 w-full" onClick={onConfirm}>
          Продолжить
        </Button>
      </div>
    </div>
  );
}

export function ModuleLearningView({
  moduleId,
  sessionId,
  categoryOrder,
  moduleOrder,
  moduleTitle,
  topicId,
  materials,
  test,
  bestAttempt,
  theoryTimeSec,
  scorePct,
  passed,
}: {
  moduleId: string;
  sessionId: string;
  categoryOrder: number;
  moduleOrder: number;
  moduleTitle: string;
  topicId: string;
  materials: Material[];
  test: Test;
  bestAttempt: BestAttempt;
  theoryTimeSec: number;
  scorePct?: string;
  passed?: string;
}) {
  const hasTest = moduleOrder > 1 && Boolean(test);
  const theoryReady = theoryTimeSec >= MODULE_THEORY_REQUIRED_SEC;

  const [theoryIntroOpen, setTheoryIntroOpen] = useState(false);
  const [testIntroOpen, setTestIntroOpen] = useState(false);
  const [theoryUnlocked, setTheoryUnlocked] = useState(false);
  const [testUnlocked, setTestUnlocked] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);

  useEffect(() => {
    const theorySeen = localStorage.getItem(introStorageKey(moduleId, "theory"));
    const testSeen = localStorage.getItem(introStorageKey(moduleId, "test"));
    setTheoryUnlocked(theorySeen === "1");
    setTestUnlocked(testSeen === "1");
    if (!theorySeen) setTheoryIntroOpen(true);
    else if (hasTest && theoryReady && !testSeen) setTestIntroOpen(true);
  }, [moduleId, hasTest, theoryReady]);

  function confirmTheoryIntro() {
    localStorage.setItem(introStorageKey(moduleId, "theory"), "1");
    setTheoryIntroOpen(false);
    setTheoryUnlocked(true);
  }

  function confirmTestIntro() {
    localStorage.setItem(introStorageKey(moduleId, "test"), "1");
    setTestIntroOpen(false);
    setTestUnlocked(true);
  }

  function openTestIntro() {
    if (!theoryReady) return;
    if (localStorage.getItem(introStorageKey(moduleId, "test")) === "1") {
      setTestUnlocked(true);
      return;
    }
    setTestIntroOpen(true);
  }

  async function handleTestSubmit(formData: FormData) {
    setTestError(null);
    const result = await submitModuleTestAction(moduleId, formData);
    if (result?.error) {
      setTestError(result.error);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {theoryIntroOpen ? (
        <BlockIntroModal
          kind="theory"
          categoryOrder={categoryOrder}
          moduleOrder={moduleOrder}
          onConfirm={confirmTheoryIntro}
        />
      ) : null}
      {testIntroOpen ? (
        <BlockIntroModal
          kind="test"
          categoryOrder={categoryOrder}
          moduleOrder={moduleOrder}
          onConfirm={confirmTestIntro}
        />
      ) : null}

      <Link
        href={`/learn/classification/${topicId}`}
        className="text-blue-700 hover:underline"
      >
        ← К модулям классификации
      </Link>

      {theoryUnlocked ? (
        <Card title={`${categoryOrder}.${moduleOrder} ${moduleTitle}`}>
          {materials.length > 0 ? (
            <div className="flex flex-col gap-8">
              {materials.map((material) => (
                <article
                  key={material.id}
                  className="prose prose-lg max-w-none whitespace-pre-wrap text-slate-800"
                >
                  <h3 className="mb-4 text-xl font-semibold">{material.title}</h3>
                  {material.content}
                </article>
              ))}
            </div>
          ) : (
            <p className="text-slate-600">Теория для этого модуля пока не добавлена.</p>
          )}
          <p className="mt-4 text-sm text-slate-600">
            Время на теории: {formatDurationRu(theoryTimeSec)} /{" "}
            {formatDurationRu(MODULE_THEORY_REQUIRED_SEC)}
            {!theoryReady ? " — для доступа к тесту нужно не менее 2 часов" : ""}
          </p>
        </Card>
      ) : null}

      {moduleOrder === 1 ? (
        <Card title="Тест">
          <p className="text-slate-600">
            В модуле 1 теста нет. Открывайте следующий модуль.
          </p>
        </Card>
      ) : hasTest ? (
        <Card
          title="Тест"
          actions={
            bestAttempt?.completedAt ? (
              <span className="text-sm text-slate-600">
                Лучшая попытка: {bestAttempt.scorePct ?? 0}%{" "}
                {bestAttempt.passed ? "(пройден)" : ""}
              </span>
            ) : null
          }
        >
          {!theoryReady ? (
            <p className="text-amber-800">
              Тест откроется после изучения теории не менее 2 часов. Сейчас:{" "}
              {formatDurationRu(theoryTimeSec)}.
            </p>
          ) : !testUnlocked ? (
            <Button type="button" onClick={openTestIntro}>
              Перейти к тесту
            </Button>
          ) : (
            <>
              {scorePct ? (
                <p
                  className={`mb-4 rounded-lg px-4 py-3 text-base ${
                    passed === "1"
                      ? "bg-emerald-50 text-emerald-900"
                      : "bg-amber-50 text-amber-900"
                  }`}
                >
                  Результат: {scorePct}%{" "}
                  {passed === "1"
                    ? "— тест пройден"
                    : "— недостаточно для прохождения (нужно 90%)"}
                </p>
              ) : null}

              <form action={handleTestSubmit}>
                <div className="flex flex-col gap-6">
                  {testError ? (
                    <p className="rounded-lg bg-red-50 px-4 py-3 text-base text-red-900">
                      {testError}
                    </p>
                  ) : null}
                  {test!.questions.map((q, idx) => (
                    <div
                      key={q.id}
                      className="rounded-lg border border-slate-200 p-4"
                    >
                      <p className="mb-3 text-base font-medium text-slate-900">
                        {idx + 1}. {q.text}
                      </p>
                      <div className="flex flex-col gap-2">
                        {q.options.map((o) => (
                          <label key={o.id} className="flex cursor-pointer gap-3">
                            <input
                              type="radio"
                              name={`q_${q.id}`}
                              value={o.id}
                              className="mt-1 h-4 w-4"
                              required
                            />
                            <span className="text-slate-800">{o.text}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  <Button type="submit">Отправить тест</Button>
                  <p className="text-sm text-slate-600">
                    Для открытия следующего модуля нужно набрать минимум 90%.
                  </p>
                </div>
              </form>
            </>
          )}
        </Card>
      ) : (
        <Card title="Тест">
          <p className="text-slate-600">Тест для этого модуля пока не добавлен.</p>
        </Card>
      )}

      <CloseModuleButton sessionId={sessionId} />
    </div>
  );
}
