const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

function transliterateChar(char: string): string {
  const lower = char.toLowerCase();
  if (CYRILLIC_TO_LATIN[lower] !== undefined) {
    return CYRILLIC_TO_LATIN[lower];
  }
  if (/[a-z]/.test(lower)) {
    return lower;
  }
  return "";
}

/** Первая буква слова в латинице (для логина). */
export function firstLetterLatin(word: string): string {
  const trimmed = word.trim();
  if (!trimmed) return "";

  for (const char of trimmed) {
    const latin = transliterateChar(char);
    if (latin) {
      return latin[0] ?? "";
    }
  }

  return "";
}

/** Три случайные цифры, первая не 0 (100–999). */
export function randomLoginSuffix(): string {
  return String(Math.floor(Math.random() * 900) + 100);
}

/**
 * Логин: первая буква имени + первая буква фамилии + 3 цифры (не с 0).
 * Отчество не участвует. Пример: Василий + Иванов → vi742
 */
export function suggestUsername(firstName: string, lastName: string): string {
  const prefix =
    (
      firstLetterLatin(firstName.trim()) + firstLetterLatin(lastName.trim())
    ).toLowerCase() || "user";

  return `${prefix}${randomLoginSuffix()}`;
}

/** Проверка уникальности с перегенерацией суффикса. */
export async function generateUniqueUsername(
  firstName: string,
  lastName: string,
  isTaken: (username: string) => Promise<boolean>,
  maxAttempts = 20,
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const username = suggestUsername(firstName, lastName);
    if (!(await isTaken(username))) {
      return username;
    }
  }

  throw new Error("Не удалось сгенерировать уникальный логин");
}

export function isValidUsername(username: string): boolean {
  return /^[a-z]{2,}[1-9][0-9]{2}$/.test(username);
}
