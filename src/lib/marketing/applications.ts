export const APPLICATION_PROGRAM_LABELS: Record<string, string> = {
  tb: "Транспортная безопасность",
  security: "Охранная деятельность",
};

export const APPLICATION_SOURCE_LABELS: Record<string, string> = {
  home: "Главная",
  contacts: "Контакты",
};

export function formatApplicationProgram(program: string | null | undefined) {
  if (!program) return "Не указано";
  return APPLICATION_PROGRAM_LABELS[program] ?? program;
}

export function formatApplicationSource(source: string) {
  return APPLICATION_SOURCE_LABELS[source] ?? source;
}
