"use client";

import { useEffect, useState, useActionState } from "react";
import {
  createClientAction,
  suggestLoginAction,
  suggestPasswordAction,
  type CreateClientState,
} from "@/actions/admin/clients";
import { suggestUsername } from "@/lib/auth/username";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

type Topic = { id: string; order: number; title: string };

const initialState: CreateClientState = {};

export function CreateClientForm({ topics }: { topics: Topic[] }) {
  const [state, formAction, pending] = useActionState(
    createClientAction,
    initialState,
  );
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginTouched, setLoginTouched] = useState(false);
  const [allSelected, setAllSelected] = useState(false);

  useEffect(() => {
    if (loginTouched || !firstName.trim() || !lastName.trim()) return;

    const local = suggestUsername(firstName, lastName);
    setUsername(local);

    void suggestLoginAction(firstName, lastName).then((unique) => {
      if (!loginTouched) setUsername(unique);
    });
  }, [firstName, lastName, loginTouched]);

  async function handleRandomPassword() {
    const generated = await suggestPasswordAction();
    setPassword(generated);
  }

  if (state.success && state.credentials) {
    return (
      <Card title="Клиент создан">
        <div className="space-y-3 text-base">
          <p>
            <span className="font-medium">ФИО:</span> {state.credentials.fullName}
          </p>
          <p>
            <span className="font-medium">Логин:</span>{" "}
            <code className="rounded bg-slate-100 px-2 py-1">
              {state.credentials.username}
            </code>
          </p>
          <p>
            <span className="font-medium">Пароль:</span>{" "}
            <code className="rounded bg-slate-100 px-2 py-1">
              {state.credentials.password}
            </code>
          </p>
          <p className="text-slate-600">
            Сохраните данные и передайте их клиенту. Пароль повторно показан не
            будет.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Новый клиент">
      <form action={formAction} className="flex flex-col gap-5">
        <div className="grid gap-5 md:grid-cols-3">
          <Input
            name="lastName"
            label="Фамилия"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
          <Input
            name="firstName"
            label="Имя"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <Input name="patronymic" label="Отчество" required />
        </div>

        <Input name="dateOfBirth" label="Дата рождения" type="date" required />

        <div className="grid gap-5 md:grid-cols-2">
          <Input
            name="username"
            label="Логин"
            required
            value={username}
            onChange={(e) => {
              setLoginTouched(true);
              setUsername(e.target.value.toLowerCase());
            }}
            placeholder="vi742"
          />
          <div className="flex flex-col gap-2">
            <Input
              name="password"
              label="Пароль"
              type="text"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
            />
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={handleRandomPassword}
            >
              Случайный пароль (15 символов)
            </Button>
          </div>
        </div>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-base font-medium text-slate-800">
            Назначить классификации
          </legend>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setAllSelected((v) => !v)}
            >
              {allSelected ? "Снять все" : "Отметить все"}
            </Button>
          </div>
          {topics.map((topic) => (
            <label
              key={topic.id}
              className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-4"
            >
              <input
                type="checkbox"
                name="topicIds"
                value={topic.id}
                defaultChecked={allSelected}
                key={`${allSelected}-${topic.id}`}
                className="h-5 w-5"
              />
              <span>
                {topic.order}. {topic.title}
              </span>
            </label>
          ))}
        </fieldset>

        {state.error ? (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-base text-red-800">
            {state.error}
          </p>
        ) : null}

        <Button type="submit" disabled={pending}>
          {pending ? "Создание…" : "Создать клиента"}
        </Button>
      </form>
    </Card>
  );
}
