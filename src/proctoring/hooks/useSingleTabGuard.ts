"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  holdExamTabLock,
  type TabGuardStatus,
  waitForExamTabLock,
} from "../lib/single-tab-guard";

type UseSingleTabGuardOptions = {
  onBlocked?: () => void;
  onAcquired?: () => void;
};

export function useSingleTabGuard({
  onBlocked,
  onAcquired,
}: UseSingleTabGuardOptions = {}) {
  const [status, setStatus] = useState<TabGuardStatus>("idle");
  const abortRef = useRef<AbortController | null>(null);
  const onBlockedRef = useRef(onBlocked);
  const onAcquiredRef = useRef(onAcquired);

  useEffect(() => {
    onBlockedRef.current = onBlocked;
    onAcquiredRef.current = onAcquired;
  }, [onBlocked, onAcquired]);

  const release = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus("idle");
  }, []);

  const acquire = useCallback(async (): Promise<boolean> => {
    release();
    const controller = new AbortController();
    abortRef.current = controller;

    const ok = await waitForExamTabLock(controller.signal, () => {
      setStatus("blocked");
      onBlockedRef.current?.();
    });

    if (controller.signal.aborted) {
      setStatus("idle");
      return false;
    }

    if (!ok) {
      setStatus("blocked");
      return false;
    }

    setStatus("holding");
    onAcquiredRef.current?.();
    return true;
  }, [release]);

  const retry = useCallback(async () => {
    return acquire();
  }, [acquire]);

  return {
    status,
    isBlocked: status === "blocked",
    isHolding: status === "holding",
    acquire,
    retry,
    release,
  };
}

/** Quick probe — returns true if this tab can take the exam lock right now. */
export async function probeExamTabAvailable(): Promise<boolean> {
  const controller = new AbortController();
  const result = await holdExamTabLock(controller.signal);
  controller.abort();
  return result;
}
