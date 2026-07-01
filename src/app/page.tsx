import { getSessionUser } from "@/lib/auth/session";
import Link from "next/link";
import { redirect } from "next/navigation";
import { APP_NAME } from "@/constants/ru";

export default async function HomePage() {
  const user = await getSessionUser();
  if (user?.role === "ADMIN") redirect("/admin");
  if (user?.role === "CLIENT") redirect("/learn");

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-8 px-6 py-16">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold">{APP_NAME}</h1>
        <p className="text-slate-600">
          Платформа обучения сотрудников. Войдите по логину и паролю, которые
          выдал администратор.
        </p>
      </div>

      <Link
        href="/login"
        className="inline-flex min-h-12 w-fit items-center justify-center rounded-lg bg-blue-700 px-6 text-lg font-medium text-white hover:bg-blue-800"
      >
        Войти
      </Link>
    </main>
  );
}
