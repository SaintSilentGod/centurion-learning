import type { PrismaClient } from "@/generated/prisma/client";
import { HEARTBEAT_INTERVAL_SEC } from "@/lib/transport";
import { heartbeatCreditSec } from "@/lib/time-tracking";

/**
 * Засчитывает время теории по heartbeat. Возвращает начисленные секунды
 * или null, если открытой сессии нет.
 *
 * Оптимистичная блокировка по lastHeartbeatAt: если две вкладки прислали heartbeat
 * одновременно, засчитывается только один из них.
 */
export async function creditTheoryHeartbeat(
  db: PrismaClient,
  params: { clientId: string; sessionId: string; visibleSec: number; now?: Date },
): Promise<number | null> {
  const now = params.now ?? new Date();
  const session = await db.moduleSession.findFirst({
    where: { id: params.sessionId, clientId: params.clientId, endedAt: null },
  });
  if (!session) return null;

  const credit = heartbeatCreditSec({
    visibleSec: params.visibleSec,
    lastCreditAt: session.lastHeartbeatAt ?? session.startedAt,
    now,
    intervalSec: HEARTBEAT_INTERVAL_SEC,
  });

  const updated = await db.moduleSession.updateMany({
    where: { id: session.id, endedAt: null, lastHeartbeatAt: session.lastHeartbeatAt },
    data: { durationSec: (session.durationSec ?? 0) + credit, lastHeartbeatAt: now },
  });
  return updated.count > 0 ? credit : 0;
}
