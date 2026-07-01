import "dotenv/config";
import { createSeedPrismaClient } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/auth/password";

const prisma = createSeedPrismaClient();

const MOCK_TOPICS = [
  {
    order: 1,
    title: "Тема 1. Основы специальности",
    description: "Вводный материал и базовые понятия.",
    material: {
      title: "Учебный текст — Тема 1",
      content: `Добро пожаловать в первую тему обучения.

Здесь будет размещён учебный текст по основам специальности. Материал предназначен для спокойного последовательного изучения.

Основные разделы:
1. Введение в профессию
2. Базовые термины и определения
3. Требования к специалисту

После изучения материала вам будет предложен короткий тест для закрепления знаний.`,
    },
    test: {
      title: "Тест по Теме 1",
      question: {
        text: "Что является целью первой темы?",
        options: [
          { text: "Изучить основы специальности", isCorrect: true },
          { text: "Сдать итоговый экзамен", isCorrect: false },
          { text: "Оформить документы", isCorrect: false },
        ],
      },
    },
  },
  {
    order: 2,
    title: "Тема 2. Практические навыки",
    description: "Пошаговые инструкции и типовые ситуации.",
    material: {
      title: "Учебный текст — Тема 2",
      content: `Вторая тема посвящена практическим навыкам.

Вы узнаете:
— Как действовать в стандартных рабочих ситуациях
— Какие ошибки встречаются чаще всего
— Как правильно фиксировать результат работы

Изучайте материал в удобном темпе. Время на тему учитывается автоматически.`,
    },
    test: {
      title: "Тест по Теме 2",
      question: {
        text: "Когда начинается учёт времени по теме?",
        options: [
          { text: "При открытии темы", isCorrect: true },
          { text: "При входе в систему", isCorrect: false },
          { text: "В конце дня", isCorrect: false },
        ],
      },
    },
  },
  {
    order: 3,
    title: "Тема 3. Итоговое закрепление",
    description: "Сводка и подготовка к самостоятельной работе.",
    material: {
      title: "Учебный текст — Тема 3",
      content: `Третья тема объединяет полученные знания.

Содержание:
1. Краткая сводка по темам 1 и 2
2. Чек-лист для самопроверки
3. Рекомендации для дальнейшей работы

После прохождения всех тем администратор увидит ваш прогресс и затраченное время.`,
    },
    test: {
      title: "Тест по Теме 3",
      question: {
        text: "Где администратор видит время по темам?",
        options: [
          { text: "В карточке клиента", isCorrect: true },
          { text: "Только в архиве", isCorrect: false },
          { text: "В общем отчёте без деталей", isCorrect: false },
        ],
      },
    },
  },
] as const;

async function main() {
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin-change-me-15";
  const adminHash = await hashPassword(adminPassword);

  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      passwordHash: adminHash,
      role: "ADMIN",
    },
  });

  for (const topicData of MOCK_TOPICS) {
    const topic = await prisma.topic.upsert({
      where: { order: topicData.order },
      update: {
        title: topicData.title,
        description: topicData.description,
      },
      create: {
        order: topicData.order,
        title: topicData.title,
        description: topicData.description,
      },
    });

    await prisma.material.upsert({
      where: {
        topicId_order: { topicId: topic.id, order: 0 },
      },
      update: {
        title: topicData.material.title,
        content: topicData.material.content,
      },
      create: {
        topicId: topic.id,
        order: 0,
        title: topicData.material.title,
        content: topicData.material.content,
      },
    });

    const test = await prisma.test.upsert({
      where: { topicId: topic.id },
      update: { title: topicData.test.title },
      create: {
        topicId: topic.id,
        title: topicData.test.title,
      },
    });

    const question = await prisma.testQuestion.upsert({
      where: {
        testId_order: { testId: test.id, order: 0 },
      },
      update: { text: topicData.test.question.text },
      create: {
        testId: test.id,
        order: 0,
        text: topicData.test.question.text,
      },
    });

    for (const [index, option] of topicData.test.question.options.entries()) {
      await prisma.testOption.upsert({
        where: {
          questionId_order: { questionId: question.id, order: index },
        },
        update: {
          text: option.text,
          isCorrect: option.isCorrect,
        },
        create: {
          questionId: question.id,
          order: index,
          text: option.text,
          isCorrect: option.isCorrect,
        },
      });
    }
  }

  console.log("Seed завершён.");
  console.log("Админ: логин admin, пароль:", adminPassword);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
