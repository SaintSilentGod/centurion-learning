"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hashPassword, generateRandomPassword } from "@/lib/auth/password";
import { encryptStoredPassword, decryptStoredPassword } from "@/lib/auth/password-storage";
import { requireAdmin } from "@/lib/auth/session";
import {
  generateUniqueUsername,
  isValidUsername,
  suggestUsername,
} from "@/lib/auth/username";
import { formatFioFromProfile } from "@/lib/format-name";
import { prisma } from "@/lib/prisma";
import { isTransportType } from "@/lib/transport";
import { totalTopicTimeSec } from "@/lib/time-tracking";

export type CreateClientState = {
  error?: string;
  success?: boolean;
  credentials?: { username: string; password: string; fullName: string };
};

export async function suggestLoginAction(
  firstName: string,
  lastName: string,
): Promise<string> {
  await requireAdmin();
  const fn = firstName.trim();
  const ln = lastName.trim();
  if (!fn || !ln) return "";

  return generateUniqueUsername(fn, ln, async (username) => {
    const existing = await prisma.user.findUnique({ where: { username } });
    return Boolean(existing);
  });
}

export async function suggestPasswordAction(): Promise<string> {
  await requireAdmin();
  return generateRandomPassword(15);
}

export async function createClientAction(
  _prev: CreateClientState,
  formData: FormData,
): Promise<CreateClientState> {
  const admin = await requireAdmin();

  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const patronymic = String(formData.get("patronymic") ?? "").trim();
  const dateOfBirthRaw = String(formData.get("dateOfBirth") ?? "").trim();
  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const transportTypeRaw = String(formData.get("transportType") ?? "").trim();
  const topicIds = formData.getAll("topicIds").map(String);

  if (!firstName || !lastName || !patronymic) {
    return { error: "Заполните имя, фамилию и отчество" };
  }

  if (!dateOfBirthRaw) {
    return { error: "Укажите дату рождения" };
  }

  const dateOfBirth = new Date(dateOfBirthRaw);
  if (Number.isNaN(dateOfBirth.getTime())) {
    return { error: "Некорректная дата рождения" };
  }

  if (!username || !isValidUsername(username)) {
    return {
      error:
        "Логин: латинские буквы и 3 цифры в конце (первая цифра не 0), например vi742",
    };
  }

  if (password.length < 8) {
    return { error: "Пароль должен быть не короче 8 символов" };
  }

  if (!isTransportType(transportTypeRaw)) {
    return { error: "Выберите вид транспорта" };
  }

  if (topicIds.length === 0) {
    return { error: "Выберите хотя бы одну классификацию" };
  }

  const existingUser = await prisma.user.findUnique({ where: { username } });
  if (existingUser) {
    return { error: "Такой логин уже занят" };
  }

  const topics = await prisma.topic.findMany({
    where: { id: { in: topicIds } },
  });
  if (topics.length !== topicIds.length) {
    return { error: "Выбраны несуществующие темы" };
  }

  const passwordHash = await hashPassword(password);
  const passwordEncrypted = encryptStoredPassword(password);

  await prisma.user.create({
    data: {
      username,
      passwordHash,
      passwordEncrypted,
      role: "CLIENT",
      clientProfile: {
        create: {
          firstName,
          lastName,
          patronymic,
          dateOfBirth,
          transportType: transportTypeRaw,
          createdById: admin.id,
          topicAssignments: {
            create: topicIds.map((topicId) => ({ topicId })),
          },
        },
      },
    },
  });

  revalidatePath("/admin");

  return {
    success: true,
    credentials: {
      username,
      password,
      fullName: formatFioFromProfile({ firstName, lastName, patronymic }),
    },
  };
}

export async function archiveClientAction(clientId: string): Promise<void> {
  await requireAdmin();

  await prisma.clientProfile.update({
    where: { id: clientId, status: "ACTIVE" },
    data: { status: "ARCHIVED", archivedAt: new Date() },
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/clients/${clientId}`);
  redirect("/admin");
}

export async function restoreClientAction(clientId: string): Promise<void> {
  await requireAdmin();

  await prisma.clientProfile.update({
    where: { id: clientId, status: "ARCHIVED" },
    data: { status: "ACTIVE", archivedAt: null },
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/clients/${clientId}`);
  redirect("/admin");
}

export async function deleteClientAction(clientId: string): Promise<void> {
  await requireAdmin();

  const client = await prisma.clientProfile.findUnique({
    where: { id: clientId },
    select: { userId: true },
  });

  if (!client) {
    redirect("/admin");
  }

  await prisma.user.delete({ where: { id: client.userId } });

  revalidatePath("/admin");
  redirect("/admin");
}

export async function getClientPasswordAction(
  clientId: string,
): Promise<string | null> {
  await requireAdmin();

  const client = await prisma.clientProfile.findUnique({
    where: { id: clientId },
    include: {
      user: { select: { passwordEncrypted: true, role: true } },
    },
  });

  if (!client || client.user.role !== "CLIENT" || !client.user.passwordEncrypted) {
    return null;
  }

  try {
    return decryptStoredPassword(client.user.passwordEncrypted);
  } catch {
    return null;
  }
}

export async function getClientsByStatus(status: "ACTIVE" | "ARCHIVED") {
  await requireAdmin();

  return prisma.clientProfile.findMany({
    where: { status },
    include: {
      user: { select: { username: true } },
      topicAssignments: { select: { topicId: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAllTopics() {
  await requireAdmin();
  return prisma.topic.findMany({ orderBy: { order: "asc" } });
}

export async function getClientDetails(clientId: string) {
  await requireAdmin();

  const client = await prisma.clientProfile.findUnique({
    where: { id: clientId },
    include: {
      user: { select: { username: true, createdAt: true } },
      topicAssignments: {
        include: { topic: { include: { tests: true } } },
      },
      topicSessions: true,
      testAttempts: true,
    },
  });

  if (!client) return null;

  const assignedTopicIds = new Set(client.topicAssignments.map((a) => a.topicId));
  const allTopics = await prisma.topic.findMany({
    where: { id: { in: [...assignedTopicIds] } },
    orderBy: { order: "asc" },
  });

  const topicProgress = allTopics.map((topic) => {
    const assigned = true;
    const sessions = client.topicSessions.filter((s) => s.topicId === topic.id);
    const totalTimeSec = totalTopicTimeSec(sessions);
    const hasOpenSession = sessions.some((s) => !s.endedAt);
    const assignment = client.topicAssignments.find((a) => a.topicId === topic.id);
    const testId = assignment?.topic.tests[0]?.id;
    const testAttempt = testId
      ? client.testAttempts.find((a) => a.testId === testId)
      : undefined;

    return {
      topicId: topic.id,
      topicOrder: topic.order,
      topicTitle: topic.title,
      assigned,
      totalTimeSec,
      hasOpenSession,
      testPassed: testAttempt?.passed ?? null,
    };
  });

  return { client, topicProgress };
}

export async function toggleFinalTestProctoringAction(clientId: string): Promise<void> {
  await requireAdmin();

  const client = await prisma.clientProfile.findUnique({
    where: { id: clientId },
    select: { finalTestProctoringEnabled: true },
  });

  if (!client) return;

  await prisma.clientProfile.update({
    where: { id: clientId },
    data: { finalTestProctoringEnabled: !client.finalTestProctoringEnabled },
  });

  revalidatePath(`/admin/clients/${clientId}`);
}

export { suggestUsername };
