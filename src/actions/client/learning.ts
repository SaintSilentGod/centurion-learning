"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireClient } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { MODULE_THEORY_REQUIRED_SEC } from "@/lib/transport";
import { sessionDurationSec, totalTopicTimeSec } from "@/lib/time-tracking";

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
            include: {
              modules: { orderBy: { order: "asc" } },
              materials: { orderBy: { order: "asc" } },
              tests: true,
            },
          },
        },
      },
      topicSessions: true,
      testAttempts: true,
      moduleSessions: true,
      moduleTestAttempts: { include: { test: true } },
    },
  });

  if (!profile) {
    throw new Error("Профиль клиента не найден");
  }

  const topics = profile.topicAssignments
    .map((a) => a.topic)
    .sort((a, b) => a.order - b.order)
    .map((topic) => {
      const modules = topic.modules ?? [];
      const moduleCount = modules.length;

      // Determine "opened" module = first locked/not-passed module (starting from 1).
      const bestPassedByModuleId = new Map<string, boolean>();
      for (const attempt of profile.moduleTestAttempts) {
        if (attempt.passed !== true) continue;
        bestPassedByModuleId.set(attempt.test.moduleId, true as boolean);
      }

      let nextModuleOrder = modules.length ? modules[0]!.order : 1;
      for (const mod of modules) {
        if (mod.order === 1) continue; // module 1 has no test, always considered complete
        const passed = bestPassedByModuleId.get(mod.id) ?? false;
        if (!passed) {
          nextModuleOrder = mod.order;
          break;
        }
        nextModuleOrder = mod.order + 1;
      }

      return { ...topic, moduleCount, nextModuleOrder };
    });

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

export async function getClassificationModules(topicId: string) {
  const user = await requireClient();
  if (!user.clientProfileId) throw new Error("Профиль клиента не найден");

  const assignment = await prisma.clientTopicAssignment.findUnique({
    where: {
      clientId_topicId: { clientId: user.clientProfileId, topicId },
    },
    include: {
      topic: {
        include: { modules: { orderBy: { order: "asc" } } },
      },
      client: {
        include: {
          moduleTestAttempts: {
            include: { test: true },
            orderBy: { completedAt: "desc" },
          },
        },
      },
    },
  });

  if (!assignment) return null;

  const attempts = assignment.client.moduleTestAttempts;
  const testPassedByModuleId = new Set<string>();
  for (const a of attempts) {
    if (a.passed) testPassedByModuleId.add(a.test.moduleId);
  }

  // Module 1 has no test — "passed" means ≥ 2h of theory time spent
  const module1 = assignment.topic.modules.find((m) => m.order === 1);
  const module1Sessions = module1
    ? await prisma.moduleSession.findMany({ where: { clientId: user.clientProfileId, moduleId: module1.id } })
    : [];
  const module1Passed = totalTopicTimeSec(module1Sessions) >= MODULE_THEORY_REQUIRED_SEC;

  const passedMap = new Map<string, boolean>();
  for (const m of assignment.topic.modules) {
    passedMap.set(m.id, m.order === 1 ? module1Passed : testPassedByModuleId.has(m.id));
  }

  const modules = assignment.topic.modules.map((m) => {
    if (m.order === 1) return { ...m, unlocked: true, passed: module1Passed };
    const prevModule = assignment.topic.modules.find((x) => x.order === m.order - 1);
    const prevPassed = prevModule ? passedMap.get(prevModule.id) ?? false : true;
    const passed = testPassedByModuleId.has(m.id);
    return { ...m, unlocked: prevPassed, passed };
  });

  return { topic: assignment.topic, modules };
}

export async function getModuleData(moduleId: string) {
  const user = await requireClient();
  if (!user.clientProfileId) throw new Error("Профиль клиента не найден");

  const topicModule = await prisma.topicModule.findUnique({
    where: { id: moduleId },
    include: {
      topic: true,
      test: {
        include: {
          questions: {
            orderBy: { order: "asc" },
            include: { options: { orderBy: { order: "asc" } } },
          },
        },
      },
    },
  });

  if (!topicModule) return null;

  const assignment = await prisma.clientTopicAssignment.findUnique({
    where: {
      clientId_topicId: { clientId: user.clientProfileId, topicId: topicModule.topicId },
    },
    include: {
      client: {
        select: {
          transportType: true,
          moduleTestAttempts: { include: { test: true } },
        },
      },
      topic: { include: { modules: { orderBy: { order: "asc" } } } },
    },
  });

  if (!assignment) return null;

  const materials = await prisma.moduleMaterial.findMany({
    where: {
      moduleId,
      transportType: assignment.client.transportType,
    },
    orderBy: { order: "asc" },
  });

  const moduleSessions = await prisma.moduleSession.findMany({
    where: { clientId: user.clientProfileId, moduleId },
  });
  const theoryTimeSec = totalTopicTimeSec(moduleSessions);

  const passedByModuleId = new Set<string>();
  for (const a of assignment.client.moduleTestAttempts) {
    if (a.passed) passedByModuleId.add(a.test.moduleId);
  }

  let unlocked: boolean;
  if (topicModule.order === 1) {
    unlocked = true;
  } else {
    const prev = assignment.topic.modules.find((m) => m.order === topicModule.order - 1);
    if (!prev) {
      unlocked = true;
    } else if (prev.order === 1) {
      // Module 1 has no test — unlock next via time requirement
      const prevSessions = await prisma.moduleSession.findMany({
        where: { clientId: user.clientProfileId, moduleId: prev.id },
      });
      unlocked = totalTopicTimeSec(prevSessions) >= MODULE_THEORY_REQUIRED_SEC;
    } else {
      unlocked = passedByModuleId.has(prev.id);
    }
  }

  if (!unlocked) {
    return { locked: true as const, module: null };
  }

  // Start session automatically (idempotent: reuse open session)
  const openSession = await prisma.moduleSession.findFirst({
    where: { clientId: user.clientProfileId, moduleId, endedAt: null },
  });
  const session =
    openSession ??
    (await prisma.moduleSession.create({
      data: { clientId: user.clientProfileId, moduleId },
    }));

  const bestAttempt = topicModule.test
    ? await prisma.moduleTestAttempt.findFirst({
        where: { clientId: user.clientProfileId, testId: topicModule.test.id },
        orderBy: [{ passed: "desc" }, { scorePct: "desc" }, { completedAt: "desc" }],
      })
    : null;

  return {
    locked: false as const,
    module: { ...topicModule, materials },
    sessionId: session.id,
    bestAttempt,
    theoryTimeSec,
  };
}

export async function endModuleSessionAction(sessionId: string) {
  const user = await requireClient();
  if (!user.clientProfileId) throw new Error("Профиль клиента не найден");

  const session = await prisma.moduleSession.findFirst({
    where: { id: sessionId, clientId: user.clientProfileId, endedAt: null },
  });
  if (!session) redirect("/learn");

  const endedAt = new Date();
  await prisma.moduleSession.update({
    where: { id: session.id },
    data: { endedAt, durationSec: sessionDurationSec(session.startedAt, endedAt) },
  });

  revalidatePath("/learn");
  redirect("/learn");
}

export async function submitModuleTestAction(
  moduleId: string,
  formData: FormData,
): Promise<{ error: string } | void> {
  const user = await requireClient();
  if (!user.clientProfileId) throw new Error("Профиль клиента не найден");

  const topicModule = await prisma.topicModule.findUnique({
    where: { id: moduleId },
    include: {
      test: { include: { questions: { include: { options: true } } } },
      topic: { include: { modules: { orderBy: { order: "asc" } } } },
    },
  });
  if (!topicModule) return { error: "Модуль не найден" };
  if (topicModule.order === 1) return { error: "У модуля 1 нет теста" };
  if (!topicModule.test) return { error: "Тест не найден" };

  const moduleSessions = await prisma.moduleSession.findMany({
    where: { clientId: user.clientProfileId, moduleId },
  });
  if (totalTopicTimeSec(moduleSessions) < MODULE_THEORY_REQUIRED_SEC) {
    return { error: "Для доступа к тесту необходимо изучить теорию не менее 2 часов" };
  }

  // gating: ensure unlocked
  const prev = topicModule.topic.modules.find((m) => m.order === topicModule.order - 1);
  if (prev && prev.order !== 1) {
    const prevPassed = await prisma.moduleTestAttempt.findFirst({
      where: {
        clientId: user.clientProfileId,
        test: { moduleId: prev.id },
        passed: true,
      },
    });
    if (!prevPassed) return { error: "Следующий модуль ещё закрыт" };
  }

  const questions = topicModule.test.questions;
  if (questions.length === 0) return { error: "В тесте нет вопросов" };

  let correct = 0;
  const answers: Array<{ questionId: string; optionId: string | null }> = [];

  for (const q of questions) {
    const picked = String(formData.get(`q_${q.id}`) ?? "").trim();
    const optionId = picked || null;
    answers.push({ questionId: q.id, optionId });

    const correctOption = q.options.find((o) => o.isCorrect);
    if (correctOption && optionId === correctOption.id) correct += 1;
  }

  const scorePct = Math.round((correct / questions.length) * 100);
  const passed = scorePct >= 90;

  const attempt = await prisma.moduleTestAttempt.create({
    data: {
      clientId: user.clientProfileId,
      testId: topicModule.test.id,
      score: correct,
      scorePct,
      passed,
      completedAt: new Date(),
      answers: {
        create: answers.map((a) => ({
          questionId: a.questionId,
          optionId: a.optionId,
        })),
      },
    },
  });

  revalidatePath("/learn");
  revalidatePath(`/learn/module/${moduleId}`);
  redirect(`/learn/module/${moduleId}?scorePct=${attempt.scorePct ?? 0}&passed=${attempt.passed ? "1" : "0"}`);
}
