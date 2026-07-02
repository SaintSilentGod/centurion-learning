import Link from "next/link";
import { notFound } from "next/navigation";
import { getClassificationModules } from "@/actions/client/learning";
import { Card } from "@/components/ui/card";

export default async function ClassificationPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const { topicId } = await params;
  const data = await getClassificationModules(topicId);
  if (!data) notFound();

  const { topic, modules } = data;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/learn" className="text-blue-700 hover:underline">
        ← К списку классификаций
      </Link>

      <Card title={`${topic.order}. ${topic.title}`}>
        {modules.length === 0 ? (
          <p className="text-slate-600">Модули пока не добавлены.</p>
        ) : (
          <ul className="divide-y divide-slate-200">
            {modules.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-4 py-4">
                <div>
                  <p className="text-lg font-medium">
                    {m.order}. {m.title}
                  </p>
                  <p className="text-slate-600">
                    {m.passed ? "Пройден" : m.unlocked ? "Доступен" : "Закрыт"}
                  </p>
                </div>
                {m.unlocked ? (
                  <Link
                    href={`/learn/module/${m.id}`}
                    className="inline-flex min-h-12 items-center rounded-lg bg-blue-700 px-5 text-lg font-medium text-white hover:bg-blue-800"
                  >
                    Открыть
                  </Link>
                ) : (
                  <span className="inline-flex min-h-12 items-center rounded-lg bg-slate-100 px-5 text-lg font-medium text-slate-500">
                    Закрыт
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

