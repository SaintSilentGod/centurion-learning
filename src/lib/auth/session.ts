import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { UserRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import { SESSION_COOKIE } from "@/lib/auth/constants";

const SESSION_DAYS = 14;

export type SessionUser = {
  id: string;
  username: string;
  role: UserRole;
  clientProfileId: string | null;
};

function sessionExpiry(): Date {
  const expires = new Date();
  expires.setDate(expires.getDate() + SESSION_DAYS);
  return expires;
}

export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomUUID();
  const expiresAt = sessionExpiry();

  await prisma.authSession.create({
    data: { userId, token, expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return token;
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await prisma.authSession.deleteMany({ where: { token } });
    cookieStore.delete(SESSION_COOKIE);
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.authSession.findUnique({
    where: { token },
    include: {
      user: {
        include: { clientProfile: { select: { id: true } } },
      },
    },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.authSession.delete({ where: { id: session.id } });
    }
    return null;
  }

  return {
    id: session.user.id,
    username: session.user.username,
    role: session.user.role,
    clientProfileId: session.user.clientProfile?.id ?? null,
  };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/learn");
  return user;
}

export async function requireClient(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "CLIENT") redirect("/admin");

  if (user.clientProfileId) {
    const profile = await prisma.clientProfile.findUnique({
      where: { id: user.clientProfileId },
      select: { status: true },
    });
    if (profile?.status === "ARCHIVED") {
      await deleteSession();
      redirect("/login");
    }
  }

  return user;
}
