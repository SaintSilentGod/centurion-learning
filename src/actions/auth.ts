"use server";

import { redirect } from "next/navigation";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, deleteSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export type LoginState = {
  error?: string;
};

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "Введите логин и пароль" };
  }

  const user = await prisma.user.findUnique({
    where: { username },
    include: { clientProfile: true },
  });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Неверный логин или пароль" };
  }

  if (user.role === "CLIENT" && user.clientProfile?.status === "ARCHIVED") {
    return { error: "Ваш доступ архивирован. Обратитесь к администратору." };
  }

  await createSession(user.id);

  if (user.role === "ADMIN") {
    redirect("/admin");
  }
  redirect("/learn");
}

export async function logoutAction(): Promise<void> {
  await deleteSession();
  redirect("/login");
}
