"use client";

import { useEffect, useRef, useState } from "react";
import type { BrowserMonitoringState } from "../types";

const INITIAL: BrowserMonitoringState = {
  isFullscreen: false,
  isTabVisible: true,
  isWindowFocused: true,
  screenShareActive: false,
};

type BrowserEventHandler = (
  type:
    | "FULLSCREEN_EXIT"
    | "TAB_HIDDEN"
    | "WINDOW_BLUR"
    | "COPY_ATTEMPT"
    | "PASTE_ATTEMPT"
    | "RIGHT_CLICK"
    | "SCREEN_SHARE_STOPPED",
  details?: Record<string, unknown>,
) => void;

export function useBrowserMonitoring(
  enabled: boolean,
  onEvent?: BrowserEventHandler,
) {
  const [state, setState] = useState<BrowserMonitoringState>(INITIAL);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!enabled) return;

    function update(partial: Partial<BrowserMonitoringState>) {
      setState((prev) => ({ ...prev, ...partial }));
    }

    function onVisibility() {
      const visible = document.visibilityState === "visible";
      update({ isTabVisible: visible });
      if (!visible) onEventRef.current?.("TAB_HIDDEN");
    }

    function onFocus() {
      update({ isWindowFocused: true });
    }

    function onBlur() {
      update({ isWindowFocused: false });
      onEventRef.current?.("WINDOW_BLUR");
    }

    function onFullscreenChange() {
      const isFullscreen = Boolean(document.fullscreenElement);
      update({ isFullscreen });
      if (!isFullscreen) onEventRef.current?.("FULLSCREEN_EXIT");
    }

    function onCopy(e: ClipboardEvent) {
      e.preventDefault();
      onEventRef.current?.("COPY_ATTEMPT");
    }

    function onPaste(e: ClipboardEvent) {
      e.preventDefault();
      onEventRef.current?.("PASTE_ATTEMPT");
    }

    function onContextMenu(e: MouseEvent) {
      e.preventDefault();
      onEventRef.current?.("RIGHT_CLICK");
    }

    function onKeyDown(e: KeyboardEvent) {
      const key = e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && ["c", "v", "x", "a", "p"].includes(key)) {
        if (key === "c") onEventRef.current?.("COPY_ATTEMPT", { shortcut: true });
        if (key === "v") onEventRef.current?.("PASTE_ATTEMPT", { shortcut: true });
      }
    }

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("copy", onCopy);
    document.addEventListener("paste", onPaste);
    document.addEventListener("contextmenu", onContextMenu);
    window.addEventListener("keydown", onKeyDown);

    update({
      isFullscreen: Boolean(document.fullscreenElement),
      isTabVisible: document.visibilityState === "visible",
      isWindowFocused: document.hasFocus(),
    });

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("contextmenu", onContextMenu);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [enabled]);

  async function requestFullscreen() {
    await document.documentElement.requestFullscreen();
    setState((prev) => ({ ...prev, isFullscreen: true }));
  }

  async function requestScreenShare() {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false,
    });

    screenStreamRef.current = stream;
    setState((prev) => ({ ...prev, screenShareActive: true }));

    const [track] = stream.getVideoTracks();
    track.onended = () => {
      setState((prev) => ({ ...prev, screenShareActive: false }));
      onEventRef.current?.("SCREEN_SHARE_STOPPED");
    };

    return stream;
  }

  function stopScreenShare() {
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    setState((prev) => ({ ...prev, screenShareActive: false }));
  }

  function simulateTabHidden() {
    onEventRef.current?.("TAB_HIDDEN", { simulated: true });
  }

  return {
    state,
    requestFullscreen,
    requestScreenShare,
    stopScreenShare,
    simulateTabHidden,
  };
}
