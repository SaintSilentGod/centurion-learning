/**
 * Программа повышения квалификации руководителей ЧОО (ч. 4 ст. 36 № 427-ФЗ).
 * Данные — prisma/data/choo-leaders-pk.json (собраны из рабочей программы).
 * Скрипт можно запускать повторно: обновляет тексты, не удаляя вопросы с ответами слушателей.
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { createSeedPrismaClient } from "../src/lib/prisma";

const prisma = createSeedPrismaClient();

type ProgramData = {
  topic: { order: number; kind: "PRIVATE_SECURITY"; title: string; description: string };
  modules: Array<{
    order: number;
    title: string;
    requiredTheorySec: number;
    materials: Array<{ order: number; title: string; content: string }>;
    test?: {
      title: string;
      passPct: number;
      questions: Array<{
        order: number;
        text: string;
        options: string[];
        correctIndex: number;
      }>;
    };
  }>;
};

async function main() {
  const dataPath = path.join(process.cwd(), "prisma", "data", "choo-leaders-pk.json");
  const data = JSON.parse(fs.readFileSync(dataPath, "utf8")) as ProgramData;

  const topic = await prisma.topic.upsert({
    where: { order: data.topic.order },
    update: {
      kind: data.topic.kind,
      title: data.topic.title,
      description: data.topic.description,
    },
    create: data.topic,
  });

  for (const moduleData of data.modules) {
    const mod = await prisma.topicModule.upsert({
      where: { topicId_order: { topicId: topic.id, order: moduleData.order } },
      update: { title: moduleData.title, requiredTheorySec: moduleData.requiredTheorySec },
      create: {
        topicId: topic.id,
        order: moduleData.order,
        title: moduleData.title,
        requiredTheorySec: moduleData.requiredTheorySec,
      },
    });

    await prisma.moduleMaterial.deleteMany({ where: { moduleId: mod.id } });
    await prisma.moduleMaterial.createMany({
      data: moduleData.materials.map((material) => ({
        moduleId: mod.id,
        transportType: null,
        order: material.order,
        title: material.title,
        content: material.content,
      })),
    });

    if (!moduleData.test) continue;

    const test = await prisma.moduleTest.upsert({
      where: { moduleId: mod.id },
      update: { title: moduleData.test.title, passPct: moduleData.test.passPct },
      create: {
        moduleId: mod.id,
        title: moduleData.test.title,
        passPct: moduleData.test.passPct,
      },
    });

    for (const questionData of moduleData.test.questions) {
      const question = await prisma.moduleTestQuestion.upsert({
        where: { testId_order: { testId: test.id, order: questionData.order } },
        update: { text: questionData.text },
        create: { testId: test.id, order: questionData.order, text: questionData.text },
      });

      for (const [index, text] of questionData.options.entries()) {
        const isCorrect = index === questionData.correctIndex;
        await prisma.moduleTestOption.upsert({
          where: { questionId_order: { questionId: question.id, order: index } },
          update: { text, isCorrect },
          create: { questionId: question.id, order: index, text, isCorrect },
        });
      }
    }
  }

  const materialCount = data.modules.reduce((sum, m) => sum + m.materials.length, 0);
  const questionCount = data.modules.reduce(
    (sum, m) => sum + (m.test?.questions.length ?? 0),
    0,
  );
  console.log(
    `«${data.topic.title}»: ${data.modules.length} модуля, ${materialCount} тем, ${questionCount} вопросов.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
