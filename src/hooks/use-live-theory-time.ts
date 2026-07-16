"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Показывает живой таймер теории.
 * completedSec обновляется с сервера каждые ~30с (через heartbeat + router.refresh).
 * Между обновлениями считает локально, паузится когда вкладка скрыта.
 */
export function useLiveTheoryTime(completedSec: number): number {
  const [localElapsedSec, setLocalElapsedSec] = useState(0);
  const accRef = useRef(0);
  const visibleSinceRef = useRef<number | null>(null);
  const prevCompletedRef = useRef(completedSec);

  // Сброс локального счётчика при каждом обновлении с сервера (после heartbeat)
  useEffect(() => {
    if (completedSec === prevCompletedRef.current) return;
    prevCompletedRef.current = completedSec;
    accRef.current = 0;
    visibleSinceRef.current =
      document.visibilityState === "visible" ? Date.now() : null;
    setLocalElapsedSec(0);
  }, [completedSec]);

  useEffect(() => {
    visibleSinceRef.current =
      document.visibilityState === "visible" ? Date.now() : null;

    const tick = () => {
      if (visibleSinceRef.current === null) return;
      setLocalElapsedSec(
        accRef.current +
          Math.floor((Date.now() - visibleSinceRef.current) / 1000),
      );
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        if (visibleSinceRef.current !== null) {
          accRef.current += Math.floor(
            (Date.now() - visibleSinceRef.current) / 1000,
          );
          visibleSinceRef.current = null;
          setLocalElapsedSec(accRef.current);
        }
      } else {
        visibleSinceRef.current = Date.now();
      }
    };

    tick();
    const timerId = window.setInterval(tick, 1000);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearInterval(timerId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return completedSec + localElapsedSec;
}
