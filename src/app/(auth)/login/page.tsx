import { LoginForm } from "@/components/features/auth/login-form";
import { APP_NAME } from "@/constants/ru";
import { getSessionUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user?.role === "ADMIN") redirect("/admin");
  if (user?.role === "CLIENT") redirect("/learn");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-6 py-16">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Вход в {APP_NAME}</h1>
        <p className="text-slate-600">
          Логин и пароль выдаёт администратор.
        </p>
      </div>
      <LoginForm />
    </main>
  );
}
