"use client";

import { useRouter } from "next/navigation";
import { markApplicationReadAction } from "@/actions/admin/applications";
import { Card } from "@/components/ui/card";
import {
  formatApplicationProgram,
  formatApplicationSource,
} from "@/lib/marketing/applications";

type ApplicationRow = {
  id: string;
  name: string;
  phone: string;
  program: string | null;
  comment: string | null;
  source: string;
  readAt: Date | null;
  createdAt: Date;
};

function formatDateTime(value: Date) {
  return new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ApplicationList({ applications }: { applications: ApplicationRow[] }) {
  const router = useRouter();

  if (applications.length === 0) {
    return (
      <Card title="Заявки с сайта">
        <p className="text-slate-600">Пока нет заявок.</p>
      </Card>
    );
  }

  return (
    <Card title={`Заявки с сайта (${applications.length})`}>
      <div className="flex flex-col gap-3">
        {applications.map((application) => {
          const isUnread = !application.readAt;

          return (
            <details
              key={application.id}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white"
              onToggle={(event) => {
                const details = event.currentTarget;
                if (!details.open || !isUnread) return;
                void markApplicationReadAction(application.id).then(() => {
                  router.refresh();
                });
              }}
            >
              <summary className="cursor-pointer list-none px-4 py-4 [&::-webkit-details-marker]:hidden">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {isUnread ? (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
                          Новая
                        </span>
                      ) : null}
                      <span className="font-semibold text-slate-900">{application.name}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{application.phone}</p>
                  </div>
                  <div className="text-right text-sm text-slate-500">
                    <div>{formatDateTime(application.createdAt)}</div>
                    <div className="mt-1 font-medium text-slate-700">
                      {formatApplicationProgram(application.program)}
                    </div>
                  </div>
                </div>
              </summary>

              <div className="border-t border-slate-100 px-4 py-4 text-sm text-slate-700">
                <dl className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <dt className="text-slate-500">Имя</dt>
                    <dd className="font-medium">{application.name}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Телефон</dt>
                    <dd className="font-medium">
                      <a href={`tel:${application.phone.replace(/\s/g, "")}`} className="text-blue-700 hover:underline">
                        {application.phone}
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Программа</dt>
                    <dd className="font-medium">
                      {formatApplicationProgram(application.program)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Страница</dt>
                    <dd className="font-medium">
                      {formatApplicationSource(application.source)}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-slate-500">Комментарий</dt>
                    <dd className="mt-1 whitespace-pre-wrap rounded-lg bg-slate-50 px-3 py-2">
                      {application.comment?.trim() || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Получена</dt>
                    <dd>{formatDateTime(application.createdAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Просмотрена</dt>
                    <dd>
                      {application.readAt ? formatDateTime(application.readAt) : "Ещё не открывали"}
                    </dd>
                  </div>
                </dl>
              </div>
            </details>
          );
        })}
      </div>
    </Card>
  );
}
