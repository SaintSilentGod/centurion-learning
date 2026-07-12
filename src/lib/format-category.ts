/** Подпись для назначения классификации: «1 категория …» */
export function formatCategoryAssignmentLabel(order: number, title: string): string {
  const description = title.replace(/^Категория\s+\d+\.\s*/i, "").trim();
  return description ? `${order} категория ${description}` : `${order} категория`;
}
