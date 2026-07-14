import "dotenv/config";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createSeedPrismaClient } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/auth/password";

const prisma = createSeedPrismaClient();

const MOCK_TOPICS = [
  {
    order: 1,
    title:
      "Категория 1. Ответственные за обеспечение транспортной безопасности в субъекте транспортной инфраструктуры",
    description:
      "Классификация из ПП РФ от 01.06.2023 № 905 (Приложение № 1).",
    material: {
      title: "Учебный текст — Категория 1",
      content: `Категория 1: работники, назначенные ответственными за обеспечение транспортной безопасности в субъекте транспортной инфраструктуры.

Здесь будет размещён учебный материал по данной классификации.`,
    },
    test: {
      title: "Тест по Категории 1",
      question: {
        text: "Кто относится к Категории 1?",
        options: [
          {
            text: "Работники, назначенные ответственными за обеспечение транспортной безопасности в субъекте транспортной инфраструктуры",
            isCorrect: true,
          },
          { text: "Работники группы быстрого реагирования", isCorrect: false },
          { text: "Иные работники, не связанные с ТБ", isCorrect: false },
        ],
      },
    },
  },
  {
    order: 2,
    title:
      "Категория 2. Ответственные за транспортную безопасность на объекте/ТС и персонал специализированных организаций",
    description:
      "Классификация из ПП РФ от 01.06.2023 № 905 (Приложение № 1).",
    material: {
      title: "Учебный текст — Категория 2",
      content: `Категория 2: работники, ответственные за обеспечение транспортной безопасности на конкретном объекте или транспортном средстве, а также персонал специализированных организаций.

Здесь будет размещён учебный материал по данной классификации.`,
    },
    test: {
      title: "Тест по Категории 2",
      question: {
        text: "Кто относится к Категории 2?",
        options: [
          {
            text: "Ответственные за ТБ на объекте/ТС и персонал специализированных организаций",
            isCorrect: true,
          },
          { text: "Работники, осуществляющие досмотр", isCorrect: false },
          { text: "Только администраторы системы", isCorrect: false },
        ],
      },
    },
  },
  {
    order: 3,
    title:
      "Категория 3. Руководители работ по обеспечению транспортной безопасности на объекте/ТС",
    description:
      "Классификация из ПП РФ от 01.06.2023 № 905 (Приложение № 1).",
    material: {
      title: "Учебный текст — Категория 3",
      content: `Категория 3: работники (субъекта инфраструктуры или подразделения безопасности), которые руководят работами, непосредственно связанными с обеспечением транспортной безопасности на объекте или транспортном средстве.

Здесь будет размещён учебный материал по данной классификации.`,
    },
    test: {
      title: "Тест по Категории 3",
      question: {
        text: "Кто относится к Категории 3?",
        options: [
          {
            text: "Работники, руководящие работами по обеспечению ТБ на объекте/ТС",
            isCorrect: true,
          },
          { text: "Работники, выполняющие повторный досмотр", isCorrect: false },
          { text: "Иные работники субъекта ТИ", isCorrect: false },
        ],
      },
    },
  },
  {
    order: 4,
    title:
      "Категория 4. Работники подразделения транспортной безопасности (группа быстрого реагирования)",
    description:
      "Классификация из ПП РФ от 01.06.2023 № 905 (Приложение № 1).",
    material: {
      title: "Учебный текст — Категория 4",
      content:
        "Категория 4: работники подразделения транспортной безопасности, включённые в состав группы быстрого реагирования.\n\nЗдесь будет размещён учебный материал по данной классификации.",
    },
    test: {
      title: "Тест по Категории 4",
      question: {
        text: "Кто относится к Категории 4?",
        options: [
          {
            text: "Работники подразделения ТБ, включённые в состав группы быстрого реагирования",
            isCorrect: true,
          },
          { text: "Ответственные за ТБ в субъекте ТИ", isCorrect: false },
          { text: "Операторы технических средств ТБ", isCorrect: false },
        ],
      },
    },
  },
  {
    order: 5,
    title:
      "Категория 5. Работники подразделения транспортной безопасности (досмотр/доп. досмотр/повторный досмотр)",
    description:
      "Классификация из ПП РФ от 01.06.2023 № 905 (Приложение № 1).",
    material: {
      title: "Учебный текст — Категория 5",
      content:
        "Категория 5: работники подразделения транспортной безопасности, которые осуществляют досмотр, дополнительный досмотр и повторный досмотр.\n\nЗдесь будет размещён учебный материал по данной классификации.",
    },
    test: {
      title: "Тест по Категории 5",
      question: {
        text: "Кто относится к Категории 5?",
        options: [
          {
            text: "Работники подразделения ТБ, осуществляющие досмотр/доп. досмотр/повторный досмотр",
            isCorrect: true,
          },
          { text: "Группа быстрого реагирования", isCorrect: false },
          { text: "Наблюдение и (или) собеседование", isCorrect: false },
        ],
      },
    },
  },
  {
    order: 6,
    title:
      "Категория 6. Работники подразделения транспортной безопасности (наблюдение и/или собеседование)",
    description:
      "Классификация из ПП РФ от 01.06.2023 № 905 (Приложение № 1).",
    material: {
      title: "Учебный текст — Категория 6",
      content:
        "Категория 6: работники подразделения транспортной безопасности, которые проводят наблюдение и (или) собеседование.\n\nЗдесь будет размещён учебный материал по данной классификации.",
    },
    test: {
      title: "Тест по Категории 6",
      question: {
        text: "Кто относится к Категории 6?",
        options: [
          {
            text: "Работники подразделения ТБ, проводящие наблюдение и (или) собеседование",
            isCorrect: true,
          },
          { text: "Операторы техсредств обеспечения ТБ", isCorrect: false },
          { text: "Досмотр и повторный досмотр", isCorrect: false },
        ],
      },
    },
  },
  {
    order: 7,
    title:
      "Категория 7. Управляющие техническими средствами обеспечения транспортной безопасности",
    description:
      "Классификация из ПП РФ от 01.06.2023 № 905 (Приложение № 1).",
    material: {
      title: "Учебный текст — Категория 7",
      content:
        "Категория 7: работники (субъекта инфраструктуры или подразделения безопасности), управляющие техническими средствами обеспечения транспортной безопасности.\n\nЗдесь будет размещён учебный материал по данной классификации.",
    },
    test: {
      title: "Тест по Категории 7",
      question: {
        text: "Кто относится к Категории 7?",
        options: [
          {
            text: "Работники, управляющие техническими средствами обеспечения транспортной безопасности",
            isCorrect: true,
          },
          { text: "Персонал специализированных организаций", isCorrect: false },
          { text: "Руководители работ по ТБ на объекте/ТС", isCorrect: false },
        ],
      },
    },
  },
  {
    order: 8,
    title:
      "Категория 8. Иные работники, выполняющие работы по обеспечению транспортной безопасности на объекте/ТС",
    description:
      "Классификация из ПП РФ от 01.06.2023 № 905 (Приложение № 1).",
    material: {
      title: "Учебный текст — Категория 8",
      content:
        "Категория 8: иные работники субъекта транспортной инфраструктуры или подразделения транспортной безопасности, выполняющие работы, непосредственно связанные с обеспечением транспортной безопасности на объекте или транспортном средстве.\n\nЗдесь будет размещён учебный материал по данной классификации.",
    },
    test: {
      title: "Тест по Категории 8",
      question: {
        text: "Кто относится к Категории 8?",
        options: [
          {
            text: "Иные работники, выполняющие работы, непосредственно связанные с обеспечением ТБ на объекте/ТС",
            isCorrect: true,
          },
          { text: "Только работники досмотра", isCorrect: false },
          { text: "Только группа быстрого реагирования", isCorrect: false },
        ],
      },
    },
  },
] as const;

type ParsedModuleTest = {
  moduleOrder: number;
  moduleTitle?: string;
  questions: Array<{
    text: string;
    options: Array<{ text: string; isCorrect: boolean }>;
  }>;
};

function normalizeWs(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\u2028/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const OPTION_LETTER_TO_INDEX: Record<string, number> = {
  А: 0,
  A: 0,
  Б: 1,
  B: 1,
  В: 2,
  V: 2,
  Г: 3,
  G: 3,
};

function applyCorrectLetter(
  question: ParsedModuleTest["questions"][number],
  letter: string,
) {
  const idx = OPTION_LETTER_TO_INDEX[letter.toUpperCase()];
  if (idx === undefined || !question.options[idx]) return;

  for (const [i, option] of question.options.entries()) {
    option.isCorrect = i === idx;
  }
}

function parseModuleTestsFromTxt(raw: string): ParsedModuleTest[] {
  const text = normalizeWs(raw);
  if (!text) return [];

  const lines = text.split("\n").map((l) => l.trim());
  const modules: ParsedModuleTest[] = [];

  let current: ParsedModuleTest | null = null;
  let currentQ: ParsedModuleTest["questions"][number] | null = null;
  let awaitingQuestionText = false;

  function flushQuestion() {
    if (!current || !currentQ) return;
    if (currentQ.text && currentQ.options.length >= 2) {
      current.questions.push(currentQ);
    }
    currentQ = null;
    awaitingQuestionText = false;
  }

  function flushModule() {
    flushQuestion();
    if (!current) return;
    if (current.moduleOrder >= 2 && current.questions.length > 0) {
      modules.push(current);
    }
    current = null;
  }

  const moduleHeaderRe =
    /^(?:Тест\s+по\s+)?Модул[ью]\s*(\d+)\.?\s*(.*)$/i;
  const questionHeaderRe = /^Вопрос\s*(\d+)\.?\s*(.*)$/i;
  const numberedQuestionRe = /^(\d+)[\.\)]\s+(.+)$/;
  const optionLineRe = /^(?:[•*\-–]\s*)?([АAБBВVГG])\)\s*(.+)$/i;
  const bulletOptionRe = /^(?:[•*\-–]\s+)(.+)$/;
  const correctAnswerLineRe = /^Правильный ответ\s*:\s*([A-DА-Я])\s*$/i;
  const optionsHeaderRe = /^Варианты ответов\s*:?\s*$/i;

  for (const line of lines) {
    if (!line) continue;

    const modMatch = line.match(moduleHeaderRe);
    if (modMatch) {
      flushModule();
      const moduleOrder = Number(modMatch[1]);
      const moduleTitle = modMatch[2]?.trim() || undefined;
      current = { moduleOrder, moduleTitle, questions: [] };
      continue;
    }

    if (!current) continue;

    if (optionsHeaderRe.test(line)) {
      awaitingQuestionText = false;
      continue;
    }

    const correctLine = line.match(correctAnswerLineRe);
    if (correctLine) {
      if (currentQ) applyCorrectLetter(currentQ, correctLine[1]);
      continue;
    }

    const questionHeaderMatch = line.match(questionHeaderRe);
    if (questionHeaderMatch) {
      flushQuestion();
      const inlineText = questionHeaderMatch[2]?.trim() ?? "";
      currentQ = { text: inlineText, options: [] };
      awaitingQuestionText = inlineText.length === 0;
      continue;
    }

    const numberedQuestionMatch = line.match(numberedQuestionRe);
    if (numberedQuestionMatch) {
      flushQuestion();
      currentQ = { text: numberedQuestionMatch[2].trim(), options: [] };
      awaitingQuestionText = false;
      continue;
    }

    const letterOptionMatch = line.match(optionLineRe);
    const bulletOptionMatch = letterOptionMatch ? null : line.match(bulletOptionRe);
    if (letterOptionMatch || bulletOptionMatch) {
      if (!currentQ) {
        currentQ = { text: "Вопрос", options: [] };
      }
      awaitingQuestionText = false;

      const rawOptionText = (letterOptionMatch?.[2] ?? bulletOptionMatch?.[1] ?? "").trim();
      const hasStar =
        /\*\s*$/.test(rawOptionText) ||
        /\(Правильный ответ\)\s*$/i.test(rawOptionText);
      const optionText = rawOptionText
        .replace(/\(Правильный ответ\)\s*$/i, "")
        .replace(/\*\s*$/, "")
        .trim();

      if (!optionText || optionsHeaderRe.test(optionText)) continue;

      currentQ.options.push({
        text: optionText,
        isCorrect: hasStar,
      });
      continue;
    }

    if (currentQ && awaitingQuestionText) {
      currentQ.text = currentQ.text
        ? `${currentQ.text} ${line}`.trim()
        : line;
      continue;
    }
  }

  flushModule();

  for (const mod of modules) {
    for (const q of mod.questions) {
      const correctCount = q.options.filter((o) => o.isCorrect).length;
      if (correctCount === 0 && q.options.length > 0) {
        q.options[0].isCorrect = true;
      } else if (correctCount > 1) {
        let found = false;
        for (const o of q.options) {
          if (!found && o.isCorrect) {
            found = true;
          } else {
            o.isCorrect = false;
          }
        }
      }
    }
  }

  return modules.sort((a, b) => a.moduleOrder - b.moduleOrder);
}

function getTestsTxtPathForCategoryOrder(order: number) {
  const dir =
    process.env.TESTS_TXT_DIR ??
    path.join(process.env.HOME ?? "", "Downloads");
  const name = `tests_cat${order}.txt`;
  return path.join(dir, name);
}

function getTheoryTxtPathForCategoryOrder(order: number) {
  const dir =
    process.env.THEORY_TXT_DIR ??
    path.join(process.env.HOME ?? "", "Downloads");
  return path.join(dir, `tb${order}.txt`);
}

type TheoryTransportType = "ROAD" | "AVIATION" | "RAIL";

const THEORY_DOCX_NAMES: Record<
  Exclude<TheoryTransportType, "ROAD">,
  Record<number, string[]>
> = {
  AVIATION: {
    1: ["ТБ-1 — копия (1).docx", "ТБ-1 — копия.docx"],
    2: ["ТБ-2 — копия (1).docx", "ТБ-2 — копия.docx"],
    3: ["ТБ-3 — копия (1).docx", "ТБ-3 — копия.docx"],
    4: ["ТБ-4 — копия (1).docx", "ТБ-4 — копия.docx"],
    5: ["ТБ-5 — копия (1).docx", "ТБ-5 — копия.docx"],
    6: ["ТБ-6 — копия (1).docx", "ТБ-6 — копия.docx"],
    7: ["ТБ-7 — копия (1).docx", "ТБ-7 — копия.docx"],
    8: ["ТБ-8 -- к (1).docx", "ТБ-8 -- к.docx"],
  },
  RAIL: {
    1: ["ТБ-1 — копия (2).docx"],
    2: ["ТБ-2 — копия (2).docx"],
    3: ["ТБ-3 — копия (2).docx"],
    4: ["ТБ-4 — копия (2).docx"],
    5: ["ТБ-5 — копия (2).docx"],
    6: ["ТБ-6 — копия (2).docx"],
    7: ["ТБ-7 — копия (2).docx"],
    8: ["ТБ-8 -- к (2).docx"],
  },
};

function getTheorySourceDir(transport: TheoryTransportType) {
  if (transport === "AVIATION") {
    return (
      process.env.THEORY_AVIATION_TXT_DIR ??
      process.env.THEORY_TXT_DIR ??
      path.join(process.env.HOME ?? "", "Downloads")
    );
  }
  if (transport === "RAIL") {
    return (
      process.env.THEORY_RAIL_TXT_DIR ??
      process.env.THEORY_TXT_DIR ??
      path.join(process.env.HOME ?? "", "Downloads")
    );
  }
  return (
    process.env.THEORY_TXT_DIR ?? path.join(process.env.HOME ?? "", "Downloads")
  );
}

function getTheoryCachePath(transport: TheoryTransportType, order: number) {
  const dir = getTheorySourceDir(transport);
  if (transport === "ROAD") {
    return path.join(dir, `tb${order}.txt`);
  }
  return path.join(dir, `tb_${transport.toLowerCase()}${order}.txt`);
}

function convertDocxToUtf8(docxPath: string): string {
  if (process.platform === "darwin") {
    return execSync(`textutil -convert txt -stdout ${JSON.stringify(docxPath)}`, {
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
    });
  }

  throw new Error(
    "Конвертация docx доступна только на macOS (textutil). Подготовьте tb_*.txt вручную.",
  );
}

function resolveTheoryRaw(
  transport: TheoryTransportType,
  categoryOrder: number,
): string | null {
  const cachePath = getTheoryCachePath(transport, categoryOrder);

  if (transport === "ROAD") {
    return fs.existsSync(cachePath) ? fs.readFileSync(cachePath, "utf8") : null;
  }

  const dir = getTheorySourceDir(transport);
  const docxCandidates = THEORY_DOCX_NAMES[transport][categoryOrder] ?? [];
  const docxPath = docxCandidates
    .map((name) => path.join(dir, name))
    .find((candidate) => fs.existsSync(candidate));

  if (docxPath) {
    const docxMtime = fs.statSync(docxPath).mtimeMs;
    if (fs.existsSync(cachePath)) {
      const cacheMtime = fs.statSync(cachePath).mtimeMs;
      if (cacheMtime >= docxMtime) {
        return fs.readFileSync(cachePath, "utf8");
      }
    }

    const raw = convertDocxToUtf8(docxPath);
    fs.writeFileSync(cachePath, raw, "utf8");
    return raw;
  }

  if (fs.existsSync(cachePath)) {
    return fs.readFileSync(cachePath, "utf8");
  }

  return null;
}

function countTheoryModules(
  transport: TheoryTransportType,
  categoryOrder: number,
) {
  const raw = resolveTheoryRaw(transport, categoryOrder);
  if (!raw) {
    return { count: 0, orders: [] as number[], module11Sections: 0 };
  }

  const modules = parseTheoryModulesFromTxt(raw);
  const module11 = modules.find((module) => module.order === 11);

  return {
    count: modules.length,
    orders: modules.map((module) => module.order),
    module11Sections: module11?.sections.length ?? 0,
  };
}

type ParsedTheoryModule = {
  order: number;
  title: string;
  sections: Array<{ title: string; content: string; order: number }>;
};

function parseTheoryModulesFromTxt(raw: string): ParsedTheoryModule[] {
  const text = normalizeWs(raw).replace(/\f/g, "\n");
  const lines = text.split("\n");
  const modules: ParsedTheoryModule[] = [];

  const moduleHeaderRe = /^Модул[ью]\s*(\d+)\.\s*(.+)$/i;
  const moduleThemeRe = /^Тема\s+(\d+)\.\s+(.+)$/i;
  const subtopicRe = /^Тема\s+(\d+\.\d+)\.\s*(.*)$/i;

  let current: ParsedTheoryModule | null = null;
  let currentSection: ParsedTheoryModule["sections"][number] | null = null;
  let sectionOrder = 0;

  function flushSection() {
    if (!current || !currentSection) return;
    if (currentSection.title.trim() || currentSection.content.trim()) {
      current.sections.push(currentSection);
    }
    currentSection = null;
  }

  function flushModule() {
    flushSection();
    if (current && current.sections.length > 0) {
      modules.push(current);
    }
    current = null;
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      if (currentSection) currentSection.content += "\n";
      continue;
    }

    const modMatch = line.match(moduleHeaderRe);
    if (modMatch) {
      flushModule();
      current = {
        order: Number(modMatch[1]),
        title: modMatch[2].trim(),
        sections: [],
      };
      sectionOrder = 0;
      continue;
    }

    const themeModMatch = line.match(moduleThemeRe);
    if (themeModMatch) {
      flushModule();
      current = {
        order: Number(themeModMatch[1]),
        title: themeModMatch[2].trim(),
        sections: [],
      };
      sectionOrder = 0;
      continue;
    }

    if (!current) continue;

    const subMatch = line.match(subtopicRe);
    if (subMatch) {
      flushSection();
      sectionOrder += 1;
      const inline = subMatch[2].trim();
      currentSection = {
        title: `Тема ${subMatch[1]}.${inline ? ` ${inline}` : ""}`.trim(),
        content: inline,
        order: sectionOrder,
      };
      continue;
    }

    if (!currentSection) {
      sectionOrder += 1;
      currentSection = {
        title: `Раздел ${sectionOrder}`,
        content: line,
        order: sectionOrder,
      };
    } else if (!currentSection.content && currentSection.title.startsWith("Тема")) {
      currentSection.content = line;
    } else {
      currentSection.content += (currentSection.content ? "\n" : "") + line;
    }
  }

  flushModule();
  return modules.sort((a, b) => a.order - b.order);
}

async function seedTheoryForTopic(
  topicId: string,
  transportType: TheoryTransportType,
  categoryOrder: number,
) {
  const raw = resolveTheoryRaw(transportType, categoryOrder);
  if (!raw) return 0;

  const theoryModules = parseTheoryModulesFromTxt(raw);

  for (const theory of theoryModules) {
    const mod = await prisma.topicModule.upsert({
      where: { topicId_order: { topicId, order: theory.order } },
      update: {
        title: `Модуль ${theory.order}. ${theory.title}`,
      },
      create: {
        topicId,
        order: theory.order,
        title: `Модуль ${theory.order}. ${theory.title}`,
      },
    });

    await prisma.moduleMaterial.deleteMany({
      where: { moduleId: mod.id, transportType },
    });

    for (const section of theory.sections) {
      await prisma.moduleMaterial.create({
        data: {
          moduleId: mod.id,
          transportType,
          order: section.order,
          title: section.title,
          content: section.content.trim(),
        },
      });
    }
  }

  return theoryModules.length;
}

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

    // --- Modules: tests (модули 2+) + теория (дорога) из TB-файлов ---
    const module1 = await prisma.topicModule.upsert({
      where: { topicId_order: { topicId: topic.id, order: 1 } },
      update: {},
      create: {
        topicId: topic.id,
        order: 1,
        title: "Модуль 1",
      },
    });

    await prisma.moduleMaterial.upsert({
      where: {
        moduleId_transportType_order: {
          moduleId: module1.id,
          transportType: "ROAD",
          order: 0,
        },
      },
      update: {},
      create: {
        moduleId: module1.id,
        transportType: "ROAD",
        order: 0,
        title: "Теория",
        content: "Теория для этого модуля пока не добавлена.",
      },
    });

    const testsTxtPath = getTestsTxtPathForCategoryOrder(topicData.order);
    if (fs.existsSync(testsTxtPath)) {
      const raw = fs.readFileSync(testsTxtPath, "utf8");
      const parsedModules = parseModuleTestsFromTxt(raw);

      for (const parsed of parsedModules) {
        const mod = await prisma.topicModule.upsert({
          where: { topicId_order: { topicId: topic.id, order: parsed.moduleOrder } },
          update: {
            title:
              parsed.moduleTitle?.length
                ? `Модуль ${parsed.moduleOrder}. ${parsed.moduleTitle}`
                : `Модуль ${parsed.moduleOrder}`,
          },
          create: {
            topicId: topic.id,
            order: parsed.moduleOrder,
            title:
              parsed.moduleTitle?.length
                ? `Модуль ${parsed.moduleOrder}. ${parsed.moduleTitle}`
                : `Модуль ${parsed.moduleOrder}`,
          },
        });

        const test = await prisma.moduleTest.upsert({
          where: { moduleId: mod.id },
          update: { title: `Тест по модулю ${parsed.moduleOrder}` },
          create: { moduleId: mod.id, title: `Тест по модулю ${parsed.moduleOrder}` },
        });

        await prisma.moduleTestQuestion.deleteMany({ where: { testId: test.id } });

        for (const [qIndex, q] of parsed.questions.entries()) {
          const question = await prisma.moduleTestQuestion.create({
            data: {
              testId: test.id,
              order: qIndex,
              text: q.text,
            },
          });

          for (const [oIndex, o] of q.options.entries()) {
            await prisma.moduleTestOption.create({
              data: {
                questionId: question.id,
                order: oIndex,
                text: o.text,
                isCorrect: o.isCorrect,
              },
            });
          }
        }
      }
    }

    await seedTheoryForTopic(topic.id, "ROAD", topicData.order);
    await seedTheoryForTopic(topic.id, "AVIATION", topicData.order);
    await seedTheoryForTopic(topic.id, "RAIL", topicData.order);
  }

  console.log("\nСравнение модулей теории: дорога / авиа / жд");
  for (let order = 1; order <= 8; order += 1) {
    const road = countTheoryModules("ROAD", order);
    const aviation = countTheoryModules("AVIATION", order);
    const rail = countTheoryModules("RAIL", order);

    console.log(
      `  Категория ${order}: дорога ${road.count}, авиа ${aviation.count}, жд ${rail.count}`,
    );

    if (order === 2) {
      console.log(
        `    авиа модуль 11: ${aviation.module11Sections} подтем(ы); жд модуль 11: ${rail.module11Sections} подтем(ы)`,
      );
      console.log(`    дорога: [${road.orders.join(", ")}]`);
      console.log(`    авиа:   [${aviation.orders.join(", ")}]`);
      console.log(`    жд:     [${rail.orders.join(", ")}]`);
    }
  }

  console.log("Seed завершён.");
  if (process.env.NODE_ENV === "development") {
    console.log("Админ: логин admin, пароль:", adminPassword);
  } else {
    console.log(
      "Админ: логин admin. Пароль задан через SEED_ADMIN_PASSWORD (не логируется).",
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
