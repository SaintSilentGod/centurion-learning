import type { ProgramKind } from "@/generated/prisma/client";

export type ProgramLike = { kind: ProgramKind; order: number; title: string };

export function isTransportProgram(program: { kind: ProgramKind }): boolean {
  return program.kind === "TRANSPORT_SECURITY";
}

/** Заголовок программы в списках кабинета: «7. Категория 7. …» или просто название. */
export function programListTitle(program: ProgramLike): string {
  return isTransportProgram(program) ? `${program.order}. ${program.title}` : program.title;
}

/** Короткая метка над теорией: «Категория 7» / «Охранная деятельность». */
export function programBadge(program: ProgramLike): string {
  return isTransportProgram(program) ? `Категория ${program.order}` : "Охранная деятельность";
}

/** «модуля 2 категории 7» / «раздела 2 программы повышения квалификации». */
export function moduleInProgramGenitive(program: ProgramLike, moduleOrder: number): string {
  return isTransportProgram(program)
    ? `модуля ${moduleOrder} категории ${program.order}`
    : `раздела ${moduleOrder} программы повышения квалификации`;
}

/** «Модуль 2» / «Раздел 2» (в программах ЧОО разделы — это блоки и итоговая аттестация). */
export function moduleUnitLabel(program: { kind: ProgramKind }, moduleOrder: number): string {
  return isTransportProgram(program) ? `Модуль ${moduleOrder}` : `Раздел ${moduleOrder}`;
}

/** Название модуля в списке: без повторного номера, если он уже есть в заголовке («Блок 1. …»). */
export function moduleListTitle(module: { order: number; title: string }): string {
  return /^((Модуль|Блок)\s+\d+|Итоговая аттестация)/i.test(module.title)
    ? module.title
    : `${module.order}. ${module.title}`;
}

/**
 * Модуль пройден: с тестом — тест сдан; без теста — набрано минимальное время на теории.
 */
export function isModulePassed(params: {
  hasTest: boolean;
  testPassed: boolean;
  theoryTimeSec: number;
  requiredTheorySec: number;
}): boolean {
  return params.hasTest
    ? params.testPassed
    : params.theoryTimeSec >= params.requiredTheorySec;
}
