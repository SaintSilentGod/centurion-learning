import Link from "next/link";
import { LogoutButton } from "@/components/layout/logout-button";
import { APP_NAME } from "@/constants/ru";
import { requireAdmin } from "@/lib/auth/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="text-sm text-slate-500">{APP_NAME}</p>
            <h1 className="text-xl font-semibold">Администратор</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="text-base text-blue-700 hover:underline"
            >
              Клиенты
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">{children}</div>
    </div>
  );
}
