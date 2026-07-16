"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { submitModuleTestAction } from "@/actions/client/learning";
import { CloseModuleButton } from "@/components/features/client/close-module-button";
import { ModuleTheoryCourse } from "@/components/features/client/module-theory-course";
import { useLiveTheoryTime } from "@/hooks/use-live-theory-time";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MODULE_THEORY_REQUIRED_SEC } from "@/lib/transport";
import { formatDurationRu } from "@/lib/time-tracking";
import "./module-learning-view.css";

type Material = { id: string; title: string; content: string; order: number };
type Option = { id: string; text: string };
type Question = { id: string; text: string; options: Option[] };
type Test = { questions: Question[] } | null;
type BestAttempt = {
  scorePct: number | null;
  passed: boolean | null;
  completedAt: Date | null;
} | null;
type LatestAttempt = {
  id: string;
  scorePct: number | null;
  passed: boolean | null;
  completedAt: Date | null;
  answers: Array<{
    questionId: string;
    selectedOptionId: string | null;
    correctOptionId: string | null;
    isCorrect: boolean;
  }>;
} | null;

type BlockKind = "theory" | "test";
type ViewTab = "theory" | "test";

function introStorageKey(moduleId: string, kind: BlockKind) {
  return `module-intro-${moduleId}-${kind}`;
}

function TestReview({
  questions,
  latestAttempt,
  scorePct,
  passed,
  onRetake,
}: {
  questions: Question[];
  latestAttempt: NonNullable<LatestAttempt>;
  scorePct: number;
  passed: boolean;
  onRetake: () => void;
}) {
  const answerByQuestionId = new Map(
    latestAttempt.answers.map((answer) => [answer.questionId, answer]),
  );

  return (
    <div className="flex flex-col gap-6">
      <p
        className={`rounded-lg px-4 py-3 text-base ${
          passed ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"
        }`}
      >
        Результат: {scorePct}%{" "}
        {passed
          ? "— тест пройден"
          : "— недостаточно для прохождения (нужно 90%)"}
      </p>

      <div className="flex flex-col gap-4">
        {questions.map((question, index) => {
          const answer = answerByQuestionId.get(question.id);
          const selectedId = answer?.selectedOptionId ?? null;
          const correctId = answer?.correctOptionId ?? null;
          const isCorrect = answer?.isCorrect ?? false;

          return (
            <div
              key={question.id}
              className={`test-review-question ${isCorrect ? "is-correct" : "is-wrong"}`}
            >
              <div className="test-review-question-head">
                <p className="mb-0 text-base font-medium text-slate-900">
                  {index + 1}. {question.text}
                </p>
                <span
                  className={`test-review-badge ${isCorrect ? "is-correct" : "is-wrong"}`}
                >
                  {isCorrect ? "Верно" : "Неверно"}
                </span>
              </div>

              <div className="mt-3 flex flex-col gap-2">
                {question.options.map((option) => {
                  const isSelected = option.id === selectedId;
                  const isCorrectOption = option.id === correctId;
                  let className = "test-review-option";
                  if (isCorrectOption) className += " is-correct-option";
                  if (isSelected && !isCorrectOption) className += " is-wrong-option";
                  if (isSelected && isCorrectOption) className += " is-selected-correct";

                  return (
                    <div key={option.id} className={className}>
                      <span className="test-review-option-mark">
                        {isCorrectOption ? "✓" : isSelected ? "✗" : ""}
                      </span>
                      <span>{option.text}</span>
                      {isSelected && !isCorrectOption ? (
                        <span className="test-review-option-hint">ваш ответ</span>
                      ) : null}
                      {isCorrectOption && !isCorrect ? (
                        <span className="test-review-option-hint is-correct-hint">
                          правильный ответ
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="secondary" onClick={onRetake}>
          Пройти тест ещё раз
        </Button>
      </div>
    </div>
  );
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
  latestAttempt,
  completedTheoryTimeSec,
  activeSessionStartedAt,
  scorePct,
  passed,
  showReview = false,
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
  latestAttempt: LatestAttempt;
  completedTheoryTimeSec: number;
  activeSessionStartedAt: string | null;
  theoryTimeSec?: number;
  scorePct?: string;
  passed?: string;
  showReview?: boolean;
}) {
  const hasTest = moduleOrder > 1 && Boolean(test);
  const liveTheoryTimeSec = useLiveTheoryTime(
    completedTheoryTimeSec,
    activeSessionStartedAt,
  );
  const theoryReady = liveTheoryTimeSec >= MODULE_THEORY_REQUIRED_SEC;

  const [activeTab, setActiveTab] = useState<ViewTab>(
    showReview ? "test" : "theory",
  );
  const [theoryIntroOpen, setTheoryIntroOpen] = useState(false);
  const [testIntroOpen, setTestIntroOpen] = useState(false);
  const [theoryUnlocked, setTheoryUnlocked] = useState(false);
  const [testUnlocked, setTestUnlocked] = useState(false);
  const [reviewMode, setReviewMode] = useState(
    Boolean(showReview && latestAttempt),
  );
  const [testError, setTestError] = useState<string | null>(null);

  useEffect(() => {
    const theorySeen = localStorage.getItem(introStorageKey(moduleId, "theory"));
    const testSeen = localStorage.getItem(introStorageKey(moduleId, "test"));
    setTheoryUnlocked(theorySeen === "1");
    setTestUnlocked(testSeen === "1" || Boolean(showReview));
    if (!theorySeen && !showReview) setTheoryIntroOpen(true);
    else if (hasTest && theoryReady && !testSeen && !showReview) {
      setTestIntroOpen(true);
    }
  }, [moduleId, hasTest, theoryReady, showReview]);

  useEffect(() => {
    if (showReview && latestAttempt) {
      setActiveTab("test");
      setReviewMode(true);
      setTestUnlocked(true);
    }
  }, [showReview, latestAttempt]);

  function confirmTheoryIntro() {
    localStorage.setItem(introStorageKey(moduleId, "theory"), "1");
    setTheoryIntroOpen(false);
    setTheoryUnlocked(true);
  }

  function confirmTestIntro() {
    localStorage.setItem(introStorageKey(moduleId, "test"), "1");
    setTestIntroOpen(false);
    setTestUnlocked(true);
    setActiveTab("test");
  }

  function openTestTab() {
    if (!theoryReady) return;
    if (localStorage.getItem(introStorageKey(moduleId, "test")) === "1") {
      setTestUnlocked(true);
      setActiveTab("test");
      return;
    }
    setTestIntroOpen(true);
  }

  function startRetake() {
    setReviewMode(false);
    setTestError(null);
    window.history.replaceState(null, "", `/learn/module/${moduleId}`);
  }

  async function handleTestSubmit(formData: FormData) {
    setTestError(null);
    const result = await submitModuleTestAction(moduleId, formData);
    if (result?.error) {
      setTestError(result.error);
    }
  }

  const reviewScorePct =
    scorePct != null
      ? Number(scorePct)
      : (latestAttempt?.scorePct ?? bestAttempt?.scorePct ?? 0);
  const reviewPassed =
    passed != null ? passed === "1" : Boolean(latestAttempt?.passed);

  return (
    <div className="module-learning">
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

      <div className="module-learning-topbar">
        <Link
          href={`/learn/classification/${topicId}`}
          className="module-learning-back"
        >
          ← К модулям классификации
        </Link>

        {hasTest ? (
          <div className="module-learning-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "theory"}
              className={`module-learning-tab${activeTab === "theory" ? " is-active" : ""}`}
              onClick={() => setActiveTab("theory")}
            >
              Теория
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "test"}
              className={`module-learning-tab${activeTab === "test" ? " is-active" : ""}${!theoryReady ? " is-locked" : ""}`}
              onClick={openTestTab}
              disabled={!theoryReady}
              title={
                !theoryReady
                  ? `Нужно не менее ${formatDurationRu(MODULE_THEORY_REQUIRED_SEC)} на теории`
                  : undefined
              }
            >
              Тест
              {!theoryReady ? (
                <span className="module-learning-tab-badge">🔒</span>
              ) : bestAttempt?.passed ? (
                <span className="module-learning-tab-badge is-passed">✓</span>
              ) : null}
            </button>
          </div>
        ) : null}
      </div>

      {theoryUnlocked && activeTab === "theory" ? (
        <ModuleTheoryCourse
          moduleId={moduleId}
          categoryOrder={categoryOrder}
          moduleOrder={moduleOrder}
          moduleTitle={moduleTitle}
          materials={materials}
          completedTheoryTimeSec={completedTheoryTimeSec}
          activeSessionStartedAt={activeSessionStartedAt}
        />
      ) : null}

      {theoryUnlocked && hasTest && theoryReady && activeTab === "test" ? (
        <Card
          title={`Тест · модуль ${moduleOrder}`}
          actions={
            bestAttempt?.completedAt ? (
              <span className="text-sm text-slate-600">
                Лучшая попытка: {bestAttempt.scorePct ?? 0}%{" "}
                {bestAttempt.passed ? "(пройден)" : ""}
              </span>
            ) : null
          }
        >
          {!testUnlocked ? (
            <div className="flex flex-col gap-4">
              <p className="text-slate-700">
                Перед началом теста ознакомьтесь с правилами прохождения.
              </p>
              <Button type="button" onClick={() => setTestIntroOpen(true)}>
                Начать тест
              </Button>
            </div>
          ) : reviewMode && latestAttempt ? (
            <TestReview
              questions={test!.questions}
              latestAttempt={latestAttempt}
              scorePct={reviewScorePct}
              passed={reviewPassed}
              onRetake={startRetake}
            />
          ) : (
            <form action={handleTestSubmit}>
              <div className="flex flex-col gap-6">
                {testError ? (
                  <p className="rounded-lg bg-red-50 px-4 py-3 text-base text-red-900">
                    {testError}
                  </p>
                ) : null}
                {latestAttempt ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-sm text-slate-700">
                      Последняя попытка: {latestAttempt.scorePct ?? 0}%
                      {latestAttempt.passed ? " (пройден)" : ""}
                    </p>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setReviewMode(true)}
                    >
                      Посмотреть разбор
                    </Button>
                  </div>
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
          )}
        </Card>
      ) : null}

      {moduleOrder === 1 && theoryUnlocked ? (
        <Card title="Тест">
          <p className="text-slate-600">
            В модуле 1 теста нет. Изучите теорию и открывайте следующий модуль.
          </p>
        </Card>
      ) : null}

      {!hasTest && moduleOrder > 1 && theoryUnlocked ? (
        <Card title="Тест">
          <p className="text-slate-600">Тест для этого модуля пока не добавлен.</p>
        </Card>
      ) : null}

      {theoryUnlocked && hasTest && theoryReady && activeTab === "theory" ? (
        <div className="module-learning-test-cta">
          <p>Изучили теорию? Перейдите к проверке знаний.</p>
          <Button type="button" variant="secondary" onClick={openTestTab}>
            Перейти к тесту →
          </Button>
        </div>
      ) : null}

      <CloseModuleButton sessionId={sessionId} />
    </div>
  );
}
