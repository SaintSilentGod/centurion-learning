"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  archiveClientAction,
  deleteClientAction,
  getClientPasswordAction,
  restoreClientAction,
} from "@/actions/admin/clients";
import { formatFioFromProfile } from "@/lib/format-name";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type ClientRow = {
  id: string;
  firstName: string;
  lastName: string;
  patronymic: string;
  user: { username: string };
  topicAssignments: { topicId: string }[];
};

export function ClientList({
  activeClients,
  archivedClients,
}: {
  activeClients: ClientRow[];
  archivedClients: ClientRow[];
}) {
  const [tab, setTab] = useState<"active" | "archived">("active");
  const clients = tab === "active" ? activeClients : archivedClients;

  return (
    <Card
      title="Клиенты"
      actions={
        <div className="flex gap-2">
          <Button
            type="button"
            variant={tab === "active" ? "primary" : "secondary"}
            onClick={() => setTab("active")}
          >
            Активные ({activeClients.length})
          </Button>
          <Button
            type="button"
            variant={tab === "archived" ? "primary" : "secondary"}
            onClick={() => setTab("archived")}
          >
            Архив ({archivedClients.length})
          </Button>
        </div>
      }
    >
      {clients.length === 0 ? (
        <p className="text-slate-600">
          {tab === "active" ? "Нет активных клиентов" : "Архив пуст"}
        </p>
      ) : (
        <ul className="divide-y divide-slate-200">
          {clients.map((client) => (
            <ClientListItem
              key={client.id}
              client={client}
              archived={tab === "archived"}
            />
          ))}
        </ul>
      )}
    </Card>
  );
}

function ClientListItem({
  client,
  archived,
}: {
  client: ClientRow;
  archived: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [password, setPassword] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const fio = formatFioFromProfile(client);

  useEffect(() => {
    if (!open) {
      setConfirmDelete(false);
      setPassword(null);
      return;
    }

    setPasswordLoading(true);
    void getClientPasswordAction(client.id).then((value) => {
      setPassword(value);
      setPasswordLoading(false);
    });
  }, [open, client.id]);

  function closeMenu() {
    setOpen(false);
    setConfirmDelete(false);
  }

  return (
    <li className="flex items-center justify-between gap-4 py-4">
      <div>
        <p className="text-lg font-medium">{fio}</p>
        <p className="text-slate-600">Логин: {client.user.username}</p>
        <p className="text-slate-600">
          Тем назначено: {client.topicAssignments.length}
        </p>
      </div>

      <div className="relative">
        <Button
          type="button"
          variant="secondary"
          aria-label="Действия"
          onClick={() => setOpen((v) => !v)}
          className="min-w-12 px-3"
        >
          ⋯
        </Button>
        {open ? (
          <>
            <button
              type="button"
              className="fixed inset-0 z-10 cursor-default"
              aria-label="Закрыть меню"
              onClick={closeMenu}
            />
            <div className="absolute right-0 z-20 mt-2 w-72 rounded-lg border border-slate-200 bg-white py-2 shadow-lg">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-sm text-slate-500">Пароль</p>
                {passwordLoading ? (
                  <p className="text-base text-slate-600">Загрузка…</p>
                ) : password ? (
                  <code className="mt-1 block break-all rounded bg-slate-100 px-2 py-1 text-base">
                    {password}
                  </code>
                ) : (
                  <p className="text-base text-slate-600">
                    Недоступен (клиент создан до обновления)
                  </p>
                )}
              </div>

              <Link
                href={`/admin/clients/${client.id}`}
                className="block px-4 py-3 text-base hover:bg-slate-50"
                onClick={closeMenu}
              >
                Подробнее
              </Link>

              {archived ? (
                <form action={restoreClientAction.bind(null, client.id)}>
                  <button
                    type="submit"
                    className="block w-full px-4 py-3 text-left text-base hover:bg-slate-50"
                    onClick={closeMenu}
                  >
                    Вернуть в активные
                  </button>
                </form>
              ) : (
                <form action={archiveClientAction.bind(null, client.id)}>
                  <button
                    type="submit"
                    className="block w-full px-4 py-3 text-left text-base hover:bg-slate-50"
                    onClick={closeMenu}
                  >
                    Архивировать
                  </button>
                </form>
              )}

              {confirmDelete ? (
                <div className="border-t border-slate-100 px-4 py-3">
                  <p className="mb-3 text-base text-slate-800">
                    Удалить клиента «{fio}»? Это действие нельзя отменить.
                  </p>
                  <div className="flex flex-col gap-2">
                    <form action={deleteClientAction.bind(null, client.id)}>
                      <button
                        type="submit"
                        className="w-full rounded-lg bg-red-700 px-4 py-3 text-base font-medium text-white hover:bg-red-800"
                      >
                        Да, удалить
                      </button>
                    </form>
                    <button
                      type="button"
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base hover:bg-slate-50"
                      onClick={() => setConfirmDelete(false)}
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="block w-full px-4 py-3 text-left text-base text-red-700 hover:bg-red-50"
                  onClick={() => setConfirmDelete(true)}
                >
                  Удалить
                </button>
              )}
            </div>
          </>
        ) : null}
      </div>
    </li>
  );
}
