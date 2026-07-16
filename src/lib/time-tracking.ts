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

/** Время по модулю: завершённые сессии + текущая открытая (до now). */
export function computeModuleTheoryTimeSec(
  sessions: Array<{
    durationSec: number | null;
    startedAt: Date;
    endedAt: Date | null;
  }>,
  now: Date = new Date(),
): number {
  return sessions.reduce((sum, session) => {
    if (session.durationSec != null) return sum + session.durationSec;
    if (session.endedAt == null) {
      return sum + sessionDurationSec(session.startedAt, now);
    }
    return sum;
  }, 0);
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

/** Живой таймер обучения: включает секунды, чтобы видеть рост в реальном времени. */
export function formatDurationLiveRu(totalSec: number): string {
  const safe = Math.max(0, Math.floor(totalSec));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  if (hours > 0) {
    return `${hours} ч ${minutes} мин ${seconds.toString().padStart(2, "0")} сек`;
  }
  if (minutes > 0) {
    return `${minutes} мин ${seconds.toString().padStart(2, "0")} сек`;
  }
  return `${seconds} сек`;
}
