/** Секунды между открытием и закрытием темы. */
export function sessionDurationSec(
  startedAt: Date,
  endedAt: Date,
): number {
  return Math.max(0, Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000));
}

/** Сумма секунд по завершённым сессиям одной темы. */
export function totalTopicTimeSec(
  sessions: Array<{ durationSec: number | null }>,
): number {
  return sessions.reduce((sum, s) => sum + (s.durationSec ?? 0), 0);
}

/** Формат для отображения админу: «50 мин» или «1 ч 20 мин». */
export function formatDurationRu(totalSec: number): string {
  if (totalSec <= 0) return "0 мин";

  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);

  if (hours > 0 && minutes > 0) {
    return `${hours} ч ${minutes} мин`;
  }
  if (hours > 0) {
    return `${hours} ч`;
  }
  return `${minutes} мин`;
}
