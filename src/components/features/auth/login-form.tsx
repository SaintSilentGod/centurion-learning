"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Input
        name="username"
        label="Логин"
        autoComplete="username"
        required
        placeholder="Например, vi742"
      />
      <Input
        name="password"
        type="password"
        label="Пароль"
        autoComplete="current-password"
        required
      />
      {state.error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-base text-red-800">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Вход…" : "Войти"}
      </Button>
    </form>
  );
}
