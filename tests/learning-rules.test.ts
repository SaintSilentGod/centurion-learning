import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isModulePassed } from "../src/lib/program";
import { heartbeatCreditSec } from "../src/lib/time-tracking";

const t0 = new Date("2026-10-07T10:00:00Z");
const at = (sec: number) => new Date(t0.getTime() + sec * 1000);

describe("heartbeatCreditSec", () => {
  const credit = (visibleSec: number, elapsedSec: number) =>
    heartbeatCreditSec({ visibleSec, lastCreditAt: t0, now: at(elapsedSec), intervalSec: 30 });

  it("засчитывает 30 сек за 30 сек видимой вкладки", () => {
    assert.equal(credit(30, 30), 30);
  });

  it("скрытая вкладка не даёт времени", () => {
    assert.equal(credit(0, 30), 0);
  });

  it("частично видимая вкладка даёт только видимые секунды", () => {
    assert.equal(credit(12, 30), 12);
  });

  it("нельзя получить больше, чем реально прошло с прошлого зачёта", () => {
    assert.equal(credit(9999, 30), 30);
    assert.equal(credit(30, 1), 1);
    assert.equal(credit(30, 0), 0);
  });

  it("после долгого перерыва начисляется не больше двух интервалов", () => {
    assert.equal(credit(9999, 7200), 60);
  });

  it("мусор от клиента не ломает расчёт", () => {
    assert.equal(credit(Number.NaN, 30), 0);
    assert.equal(credit(-50, 30), 0);
    assert.equal(credit(Number.POSITIVE_INFINITY, 30), 0);
  });

  it("часы клиента в прошлом не дают отрицательного времени", () => {
    assert.equal(
      heartbeatCreditSec({ visibleSec: 30, lastCreditAt: at(60), now: t0, intervalSec: 30 }),
      0,
    );
  });
});

describe("isModulePassed", () => {
  const base = { requiredTheorySec: 7200, theoryTimeSec: 0, testPassed: false };

  it("модуль без теста проходится по времени теории", () => {
    assert.equal(isModulePassed({ ...base, hasTest: false, theoryTimeSec: 7199 }), false);
    assert.equal(isModulePassed({ ...base, hasTest: false, theoryTimeSec: 7200 }), true);
  });

  it("модуль с тестом проходится только сданным тестом, время не помогает", () => {
    assert.equal(isModulePassed({ ...base, hasTest: true, theoryTimeSec: 99999 }), false);
    assert.equal(isModulePassed({ ...base, hasTest: true, testPassed: true }), true);
  });

  it("модуль без теста и без минимума времени пройден сразу", () => {
    assert.equal(isModulePassed({ ...base, hasTest: false, requiredTheorySec: 0 }), true);
  });
});
