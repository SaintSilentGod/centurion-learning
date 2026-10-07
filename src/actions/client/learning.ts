"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireClient } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { isModulePassed, isTransportProgram } from "@/lib/program";
import { creditTheoryHeartbeat } from "@/lib/theory-heartbeat";
import { formatDurationRu, sessionDurationSec, totalTopicTimeSec } from "@/lib/time-tracking";

type ModuleForPassCheck = {
  id: string;
  requiredTheorySec: number;
  test: { id: string } | null;
};

/** Для каждого модуля: пройден ли он клиентом (тест сдан или набрано время на теории). */
async function getModulePassedMap(
  clientId: string,
  modules: ModuleForPassCheck[],
): Promise<Map<string, boolean>> {
  const moduleIds = modules.map((m) => m.id);
  const [sessions, passedAttempts] = await Promise.all([
    prisma.moduleSession.findMany({
      where: { clientId, moduleId: { in: moduleIds } },
    }),
    prisma.moduleTestAttempt.findMany({
      where: { clientId, passed: true, test: { moduleId: { in: moduleIds } } },
      select: { test: { select: { moduleId: true } } },
    }),
  ]);

  const testPassedModuleIds = new Set(passedAttempts.map((a) => a.test.moduleId));
  const passed = new Map<string, boolean>();
  for (const mod of modules) {
    passed.set(
      mod.id,
      isModulePassed({
        hasTest: Boolean(mod.test),
        testPassed: testPassedModuleIds.has(mod.id),
        theoryTimeSec: totalTopicTimeSec(sessions.filter((s) => s.moduleId === mod.id)),
        requiredTheorySec: mod.requiredTheorySec,
      }),
    );
  }
  return passed;
}

const MODULE_PASS_CHECK_INCLUDE = { test: { select: { id: true } } } as const;

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
              modules: { orderBy: { order: "asc" }, include: MODULE_PASS_CHECK_INCLUDE },
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

  const sortedTopics = profile.topicAssignments
    .map((a) => a.topic)
    .sort((a, b) => a.order - b.order);

  const passedByModuleId = await getModulePassedMap(
    profile.id,
    sortedTopics.flatMap((topic) => topic.modules),
  );

  const topics = sortedTopics.map((topic) => {
    const modules = topic.modules ?? [];
    const moduleCount = modules.length;

    // Следующий модуль — первый непройденный.
    let nextModuleOrder = modules.length ? modules[0]!.order : 1;
    for (const mod of modules) {
      if (!passedByModuleId.get(mod.id)) {
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
        include: {
          modules: { orderBy: { order: "asc" }, include: MODULE_PASS_CHECK_INCLUDE },
        },
      },
    },
  });

  if (!assignment) return null;

  const passedMap = await getModulePassedMap(
    user.clientProfileId,
    assignment.topic.modules,
  );

  // Первый модуль открыт всегда, каждый следующий — после прохождения предыдущего.
  const modules = assignment.topic.modules.map((m, index) => {
    const prevModule = index > 0 ? assignment.topic.modules[index - 1] : null;
    const unlocked = prevModule ? (passedMap.get(prevModule.id) ?? false) : true;
    return { ...m, unlocked, passed: passedMap.get(m.id) ?? false };
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
      client: { select: { transportType: true } },
      topic: {
        include: {
          modules: { orderBy: { order: "asc" }, include: MODULE_PASS_CHECK_INCLUDE },
        },
      },
    },
  });

  if (!assignment) return null;

  // В программах ТБ теория своя для каждого вида транспорта, в остальных — общая (null).
  const materialTransportType = isTransportProgram(assignment.topic)
    ? assignment.client.transportType
    : null;
  const materials =
    isTransportProgram(assignment.topic) && materialTransportType == null
      ? []
      : await prisma.moduleMaterial.findMany({
          where: { moduleId, transportType: materialTransportType },
          orderBy: { order: "asc" },
        });

  const moduleSessions = await prisma.moduleSession.findMany({
    where: { clientId: user.clientProfileId, moduleId },
  });
  const theoryTimeSec = totalTopicTimeSec(moduleSessions);

  const moduleIndex = assignment.topic.modules.findIndex((m) => m.id === moduleId);
  const prev = moduleIndex > 0 ? assignment.topic.modules[moduleIndex - 1] : null;
  const unlocked = prev
    ? ((await getModulePassedMap(user.clientProfileId, [prev])).get(prev.id) ?? false)
    : true;

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

  const latestAttemptRaw = topicModule.test
    ? await prisma.moduleTestAttempt.findFirst({
        where: {
          clientId: user.clientProfileId,
          testId: topicModule.test.id,
          completedAt: { not: null },
        },
        orderBy: { completedAt: "desc" },
        include: { answers: true },
      })
    : null;

  const correctOptionByQuestionId = new Map<string, string>();
  if (topicModule.test) {
    for (const question of topicModule.test.questions) {
      const correct = question.options.find((option) => option.isCorrect);
      if (correct) correctOptionByQuestionId.set(question.id, correct.id);
    }
  }

  const latestAttempt = latestAttemptRaw
    ? {
        id: latestAttemptRaw.id,
        scorePct: latestAttemptRaw.scorePct,
        passed: latestAttemptRaw.passed,
        completedAt: latestAttemptRaw.completedAt,
        answers: latestAttemptRaw.answers.map((answer) => {
          const correctOptionId = correctOptionByQuestionId.get(answer.questionId) ?? null;
          return {
            questionId: answer.questionId,
            selectedOptionId: answer.optionId,
            correctOptionId,
            isCorrect:
              correctOptionId != null && answer.optionId === correctOptionId,
          };
        }),
      }
    : null;

  // Не отдаём isCorrect в форму теста — только в разборе попытки.
  const safeTest = topicModule.test
    ? {
        ...topicModule.test,
        passPct: topicModule.test.passPct,
        questions: topicModule.test.questions.map((question) => ({
          id: question.id,
          order: question.order,
          text: question.text,
          options: question.options.map((option) => ({
            id: option.id,
            order: option.order,
            text: option.text,
          })),
        })),
      }
    : null;

  return {
    locked: false as const,
    module: { ...topicModule, materials, test: safeTest },
    sessionId: session.id,
    bestAttempt,
    latestAttempt,
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

  // durationSec is already accumulated via heartbeats — just close the session
  await prisma.moduleSession.update({
    where: { id: session.id },
    data: { endedAt: new Date() },
  });

  revalidatePath("/learn");
  redirect("/learn");
}

/** visibleSec — сколько секунд вкладка была видна с прошлого heartbeat (по данным клиента). */
export async function heartbeatModuleSessionAction(
  sessionId: string,
  visibleSec: number,
): Promise<void> {
  const user = await requireClient();
  if (!user.clientProfileId) throw new Error("Профиль клиента не найден");

  await creditTheoryHeartbeat(prisma, {
    clientId: user.clientProfileId,
    sessionId,
    visibleSec,
  });
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
      topic: {
        include: {
          modules: { orderBy: { order: "asc" }, include: MODULE_PASS_CHECK_INCLUDE },
        },
      },
    },
  });
  if (!topicModule) return { error: "Модуль не найден" };
  if (!topicModule.test) return { error: "Тест не найден" };

  const assignment = await prisma.clientTopicAssignment.findUnique({
    where: {
      clientId_topicId: { clientId: user.clientProfileId, topicId: topicModule.topicId },
    },
  });
  if (!assignment) return { error: "Программа не назначена" };

  const moduleSessions = await prisma.moduleSession.findMany({
    where: { clientId: user.clientProfileId, moduleId },
  });
  if (totalTopicTimeSec(moduleSessions) < topicModule.requiredTheorySec) {
    return {
      error: `Для доступа к тесту необходимо изучить теорию не менее ${formatDurationRu(topicModule.requiredTheorySec)}`,
    };
  }

  // Модуль должен быть открыт: предыдущий пройден.
  const moduleIndex = topicModule.topic.modules.findIndex((m) => m.id === moduleId);
  const prev = moduleIndex > 0 ? topicModule.topic.modules[moduleIndex - 1] : null;
  if (prev) {
    const prevPassed = (await getModulePassedMap(user.clientProfileId, [prev])).get(prev.id);
    if (!prevPassed) return { error: "Этот модуль ещё закрыт" };
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
  const passed = scorePct >= topicModule.test.passPct;

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
  redirect(
    `/learn/module/${moduleId}?scorePct=${attempt.scorePct ?? 0}&passed=${attempt.passed ? "1" : "0"}&review=1`,
  );
}
