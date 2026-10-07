import Link from "next/link";
import { getClientLearningData } from "@/actions/client/learning";
import { Card } from "@/components/ui/card";
import { programListTitle } from "@/lib/program";
import { formatDurationRu, totalTopicTimeSec } from "@/lib/time-tracking";

export default async function LearnPage() {
  const { topics, profile } = await getClientLearningData();

  return (
    <div className="flex flex-col gap-6">
      <Card title="Назначенные программы">
        {topics.length === 0 ? (
          <p className="text-slate-600">
            Вам пока не назначены программы обучения. Обратитесь к администратору.
          </p>
        ) : (
          <ul className="divide-y divide-slate-200">
            {topics.map((topic) => {
              const moduleIds = new Set(topic.modules.map((m) => m.id));
              const sessions = profile.moduleSessions.filter((s) =>
                moduleIds.has(s.moduleId),
              );
              const totalSec = totalTopicTimeSec(sessions);

              return (
                <li key={topic.id} className="flex items-center justify-between gap-4 py-4">
                  <div>
                    <p className="text-lg font-medium">
                      {programListTitle(topic)}
                    </p>
                    <p className="text-slate-600">
                      Затрачено времени: {formatDurationRu(totalSec)}
                    </p>
                    <p className="text-slate-600">
                      Модулей всего: {topic.moduleCount ?? 0} · Следующий:{" "}
                      {topic.nextModuleOrder ?? 1}
                    </p>
                  </div>
                  <Link
                    href={`/learn/classification/${topic.id}`}
                    className="inline-flex min-h-12 items-center rounded-lg bg-blue-700 px-5 text-lg font-medium text-white hover:bg-blue-800"
                  >
                    Открыть
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
