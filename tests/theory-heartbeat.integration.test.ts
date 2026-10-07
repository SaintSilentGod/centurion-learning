/**
 * Проверяет зачёт времени теории на настоящей БД (DATABASE_URL из .env).
 * Создаёт временные пользователя, программу и модуль и удаляет их в конце.
 */
import "dotenv/config";
import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";
import { createSeedPrismaClient } from "../src/lib/prisma";
import { creditTheoryHeartbeat } from "../src/lib/theory-heartbeat";

const db = createSeedPrismaClient();
const suffix = Date.now().toString(36);
const t0 = new Date("2026-10-07T10:00:00Z");
const at = (sec: number) => new Date(t0.getTime() + sec * 1000);

let clientId = "";
let moduleId = "";
let userId = "";
let topicId = "";
let sessionId = "";

const beat = (sec: number, visibleSec = 30) =>
  creditTheoryHeartbeat(db, { clientId, sessionId, visibleSec, now: at(sec) });

async function durationSec() {
  const s = await db.moduleSession.findUniqueOrThrow({ where: { id: sessionId } });
  return s.durationSec ?? 0;
}

before(async () => {
  const user = await db.user.create({
    data: {
      username: `hbtest${suffix}`,
      passwordHash: "x",
      role: "CLIENT",
      clientProfile: {
        create: {
          firstName: "Тест",
          lastName: "Таймер",
          patronymic: "Тестович",
          dateOfBirth: new Date("1980-01-01"),
        },
      },
    },
    include: { clientProfile: true },
  });
  userId = user.id;
  clientId = user.clientProfile!.id;
  const topic = await db.topic.create({
    data: { order: 900000 + Math.floor(Math.random() * 99999), title: `hbtest ${suffix}` },
  });
  topicId = topic.id;
  moduleId = (await db.topicModule.create({ data: { topicId, order: 1, title: "Модуль 1" } })).id;
});

beforeEach(async () => {
  sessionId = (
    await db.moduleSession.create({ data: { clientId, moduleId, startedAt: t0 } })
  ).id;
});

after(async () => {
  await db.user.delete({ where: { id: userId } });
  await db.topic.delete({ where: { id: topicId } });
  await db.$disconnect();
});

describe("creditTheoryHeartbeat", () => {
  it("10 минут открытой вкладки = 10 минут", async () => {
    for (let sec = 30; sec <= 600; sec += 30) await beat(sec);
    assert.equal(await durationSec(), 600);
  });

  it("две вкладки одного модуля не ускоряют таймер", async () => {
    // Вкладка A шлёт heartbeat на 30, 60, 90 с; вкладка B — на 31, 61, 91 с.
    for (const sec of [30, 31, 60, 61, 90, 91]) await beat(sec);
    assert.equal(await durationSec(), 91);
  });

  it("одновременные запросы засчитываются один раз", async () => {
    const results = await Promise.all(Array.from({ length: 10 }, () => beat(30)));
    assert.equal(await durationSec(), 30);
    assert.equal(results.filter((r) => (r ?? 0) > 0).length, 1);
  });

  it("спам запросами не накручивает время", async () => {
    for (let i = 0; i < 200; i += 1) await beat(30, 30);
    assert.equal(await durationSec(), 30);
  });

  it("подделанное visibleSec ограничено реальным временем", async () => {
    await beat(30, 100000);
    assert.equal(await durationSec(), 30);
  });

  it("скрытая вкладка не копит время", async () => {
    await beat(30, 30);
    await beat(60, 0);
    await beat(90, 0);
    await beat(120, 10);
    assert.equal(await durationSec(), 40);
  });

  it("после сна компьютера начисляется не больше минуты", async () => {
    await beat(30, 30);
    await beat(30 + 3 * 3600, 3 * 3600);
    assert.equal(await durationSec(), 90);
  });

  it("закрытая сессия и чужая сессия не принимают heartbeat", async () => {
    await db.moduleSession.update({ where: { id: sessionId }, data: { endedAt: at(10) } });
    assert.equal(await beat(30), null);
    const other = await creditTheoryHeartbeat(db, {
      clientId: "someone-else",
      sessionId,
      visibleSec: 30,
      now: at(30),
    });
    assert.equal(other, null);
  });
});
