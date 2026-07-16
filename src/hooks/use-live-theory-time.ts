"use client";

import { useEffect, useRef, useState } from "react";

export function useLiveTheoryTime(
  completedSec: number,
  activeSessionStartedAt: string | null,
) {
  const [activeElapsedSec, setActiveElapsedSec] = useState(0);

  // Accumulate time only while tab is visible
  const accumulatedRef = useRef(0);
  const visibleSinceRef = useRef<number | null>(null);

  useEffect(() => {
    if (!activeSessionStartedAt) {
      setActiveElapsedSec(0);
      accumulatedRef.current = 0;
      visibleSinceRef.current = null;
      return;
    }

    accumulatedRef.current = 0;
    visibleSinceRef.current =
      document.visibilityState === "visible" ? Date.now() : null;

    const tick = () => {
      if (visibleSinceRef.current === null) return;
      const elapsed = Math.floor((Date.now() - visibleSinceRef.current) / 1000);
      setActiveElapsedSec(accumulatedRef.current + elapsed);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        if (visibleSinceRef.current !== null) {
          accumulatedRef.current += Math.floor(
            (Date.now() - visibleSinceRef.current) / 1000,
          );
          visibleSinceRef.current = null;
          setActiveElapsedSec(accumulatedRef.current);
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
  }, [activeSessionStartedAt]);

  return completedSec + activeElapsedSec;
}
