"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireClient } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { sessionDurationSec } from "@/lib/time-tracking";

export async function getClientLearningData() {
  const user = await requireClient();
  if (!user.clientProfileId) {
    throw new Error("Профиль клиента не найден");
  }

  const profile = await prisma.clientProfile.findUnique({
    where: { id: user.clientProfileId },
    include: {
      topicAssignments: {
        include: {
          topic: {
            include: { materials: { orderBy: { order: "asc" } }, tests: true },
          },
        },
      },
      topicSessions: true,
      testAttempts: true,
    },
  });

  if (!profile) {
    throw new Error("Профиль клиента не найден");
  }

  const topics = profile.topicAssignments
    .map((a) => a.topic)
    .sort((a, b) => a.order - b.order);

  return { profile, topics };
}

export async function startTopicSessionAction(topicId: string) {
  const user = await requireClient();
  if (!user.clientProfileId) {
    throw new Error("Профиль клиента не найден");
  }

  const assignment = await prisma.clientTopicAssignment.findUnique({
    where: {
      clientId_topicId: {
        clientId: user.clientProfileId,
        topicId,
      },
    },
  });

  if (!assignment) {
    throw new Error("Тема не назначена");
  }

  const openSession = await prisma.topicSession.findFirst({
    where: {
      clientId: user.clientProfileId,
      topicId,
      endedAt: null,
    },
  });

  if (openSession) {
    return { sessionId: openSession.id };
  }

  const session = await prisma.topicSession.create({
    data: {
      clientId: user.clientProfileId,
      topicId,
    },
  });

  return { sessionId: session.id };
}

export async function endTopicSessionAction(sessionId: string) {
  const user = await requireClient();
  if (!user.clientProfileId) {
    throw new Error("Профиль клиента не найден");
  }

  const session = await prisma.topicSession.findFirst({
    where: {
      id: sessionId,
      clientId: user.clientProfileId,
      endedAt: null,
    },
  });

  if (!session) {
    redirect("/learn");
  }

  const endedAt = new Date();
  await prisma.topicSession.update({
    where: { id: session.id },
    data: {
      endedAt,
      durationSec: sessionDurationSec(session.startedAt, endedAt),
    },
  });

  revalidatePath("/learn");
  revalidatePath(`/learn/topic/${session.topicId}`);
  redirect("/learn");
}

export async function getTopicMaterial(topicId: string) {
  const user = await requireClient();
  if (!user.clientProfileId) {
    throw new Error("Профиль клиента не найден");
  }

  const assignment = await prisma.clientTopicAssignment.findUnique({
    where: {
      clientId_topicId: {
        clientId: user.clientProfileId,
        topicId,
      },
    },
    include: {
      topic: {
        include: { materials: { orderBy: { order: "asc" } } },
      },
    },
  });

  if (!assignment) {
    return null;
  }

  const openSession = await prisma.topicSession.findFirst({
    where: {
      clientId: user.clientProfileId,
      topicId,
      endedAt: null,
    },
  });

  return {
    topic: assignment.topic,
    material: assignment.topic.materials[0] ?? null,
    openSessionId: openSession?.id ?? null,
  };
}
