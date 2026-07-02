import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getModuleData, submitModuleTestAction } from "@/actions/client/learning";
import { CloseModuleButton } from "@/components/features/client/close-module-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function ModulePage({
  params,
  searchParams,
}: {
  params: Promise<{ moduleId: string }>;
  searchParams?: Promise<{ scorePct?: string; passed?: string }>;
}) {
  const { moduleId } = await params;
  const sp = (await searchParams) ?? {};
  const data = await getModuleData(moduleId);
  if (!data) notFound();
  if (data.locked) redirect("/learn");

  const { module, sessionId, bestAttempt } = data;
  if (!module || !sessionId) notFound();

  const material = module.materials[0] ?? null;
  const test = module.test;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/learn/classification/${module.topicId}`}
        className="text-blue-700 hover:underline"
      >
        ← К модулям классификации
      </Link>

      <Card title={`${module.topic.order}.${module.order} ${module.title}`}>
        {material ? (
          <article className="prose prose-lg max-w-none whitespace-pre-wrap text-slate-800">
            <h3 className="mb-4 text-xl font-semibold">{material.title}</h3>
            {material.content}
          </article>
        ) : (
          <p className="text-slate-600">Теория для этого модуля пока не добавлена.</p>
        )}
      </Card>

      {module.order === 1 ? (
        <Card title="Тест">
          <p className="text-slate-600">
            В модуле 1 теста нет. Открывайте следующий модуль.
          </p>
        </Card>
      ) : test ? (
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
          {sp.scorePct ? (
            <p
              className={`mb-4 rounded-lg px-4 py-3 text-base ${
                sp.passed === "1"
                  ? "bg-emerald-50 text-emerald-900"
                  : "bg-amber-50 text-amber-900"
              }`}
            >
              Результат: {sp.scorePct}% {sp.passed === "1" ? "— тест пройден" : "— недостаточно для прохождения (нужно 90%)"}
            </p>
          ) : null}

          <form action={submitModuleTestAction.bind(null, module.id)}>
            <div className="flex flex-col gap-6">
              {test.questions.map((q, idx) => (
                <div key={q.id} className="rounded-lg border border-slate-200 p-4">
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

