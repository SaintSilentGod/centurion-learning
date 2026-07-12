import Link from "next/link";
import { notFound } from "next/navigation";
import {
  archiveClientAction,
  getClientDetails,
  restoreClientAction,
} from "@/actions/admin/clients";
import { ProctoringToggle } from "@/components/features/admin/proctoring-toggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatFioFromProfile } from "@/lib/format-name";
import { transportTypeLabel } from "@/lib/transport";
import { formatDurationRu } from "@/lib/time-tracking";

export default async function ClientDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getClientDetails(id);
  if (!data) notFound();

  const { client, topicProgress } = data;
  const fio = formatFioFromProfile(client);
  const archived = client.status === "ARCHIVED";

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin" className="text-blue-700 hover:underline">
        ← Назад к списку
      </Link>

      <Card title={fio}>
        <dl className="grid gap-3 text-base md:grid-cols-2">
          <div>
            <dt className="text-slate-500">ФИО</dt>
            <dd className="font-medium">{fio}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Логин</dt>
            <dd className="font-medium">{client.user.username}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Дата рождения</dt>
            <dd className="font-medium">
              {client.dateOfBirth.toLocaleDateString("ru-RU")}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Вид транспорта</dt>
            <dd className="font-medium">{transportTypeLabel(client.transportType)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Статус</dt>
            <dd className="font-medium">
              {archived ? "В архиве" : "Активный"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Создан</dt>
            <dd className="font-medium">
              {client.createdAt.toLocaleDateString("ru-RU")}
            </dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-col gap-4">
          <ProctoringToggle
            clientId={client.id}
            enabled={client.finalTestProctoringEnabled}
          />

          {archived ? (
            <form action={restoreClientAction.bind(null, client.id)}>
              <Button type="submit" variant="secondary">
                Вернуть в активные
              </Button>
            </form>
          ) : (
            <form action={archiveClientAction.bind(null, client.id)}>
              <Button type="submit" variant="danger">
                Архивировать
              </Button>
            </form>
          )}
        </div>
      </Card>

      <Card title="Прогресс по классификациям">
        <ul className="divide-y divide-slate-200">
          {topicProgress.map((topic) => (
            <li key={topic.topicId} className="flex flex-col gap-2 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-lg font-medium">
                  {topic.topicOrder}. {topic.topicTitle}
                </p>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm">
                  Назначена
                </span>
              </div>
              <div className="text-slate-700">
                <p>Время: {formatDurationRu(topic.totalTimeSec)}</p>
                {topic.hasOpenSession ? (
                  <p className="text-amber-700">Сейчас изучает тему</p>
                ) : null}
                {topic.testPassed !== null ? (
                  <p>Тест: {topic.testPassed ? "пройден" : "не пройден"}</p>
                ) : (
                  <p className="text-slate-500">Тест: ещё не проходил</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
