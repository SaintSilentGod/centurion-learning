import Link from "next/link";
import { LogoutButton } from "@/components/layout/logout-button";
import { APP_NAME } from "@/constants/ru";
import { requireClient } from "@/lib/auth/session";
import { formatFioFromProfile } from "@/lib/format-name";
import { prisma } from "@/lib/prisma";

export default async function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireClient();
  const profile = user.clientProfileId
    ? await prisma.clientProfile.findUnique({
        where: { id: user.clientProfileId },
      })
    : null;

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="text-sm text-slate-500">{APP_NAME}</p>
            <h1 className="text-xl font-semibold">Моё обучение</h1>
            {profile ? (
              <p className="text-slate-600">{formatFioFromProfile(profile)}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/learn"
              className="text-base text-blue-700 hover:underline"
            >
              Темы
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">{children}</div>
    </div>
  );
}
