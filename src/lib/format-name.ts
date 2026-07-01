/** ФИО: Фамилия Имя Отчество */
export function formatFio(
  lastName: string,
  firstName: string,
  patronymic: string,
): string {
  return [lastName, firstName, patronymic]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");
}

export function formatFioFromProfile(profile: {
  lastName: string;
  firstName: string;
  patronymic: string;
}): string {
  return formatFio(profile.lastName, profile.firstName, profile.patronymic);
}

/** @deprecated используйте formatFioFromProfile */
export const formatFullName = formatFioFromProfile;
