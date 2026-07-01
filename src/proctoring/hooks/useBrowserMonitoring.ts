"use client";

import { useEffect, useRef, useState } from "react";
import type { BrowserMonitoringState } from "../types";
import { isNewTabShortcut } from "../lib/single-tab-guard";

const INITIAL: BrowserMonitoringState = {
  isFullscreen: false,
  isTabVisible: true,
  isWindowFocused: true,
  screenShareActive: false,
  screenShareFullMonitor: false,
  displaySurface: null,
  examTabBlocked: false,
  singleTabEnforced: false,
};

type BrowserEventHandler = (
  type:
    | "FULLSCREEN_EXIT"
    | "TAB_HIDDEN"
    | "WINDOW_BLUR"
    | "COPY_ATTEMPT"
    | "PASTE_ATTEMPT"
    | "RIGHT_CLICK"
    | "SCREEN_SHARE_STOPPED"
    | "SCREEN_SHARE_INVALID"
    | "DRAG_DROP_ATTEMPT"
    | "NEW_TAB_SHORTCUT",
  details?: Record<string, unknown>,
) => void;

type DisplaySurface = NonNullable<BrowserMonitoringState["displaySurface"]>;

function readDisplaySurface(
  track: MediaStreamTrack,
): DisplaySurface {
  const settings = track.getSettings() as MediaTrackSettings & {
    displaySurface?: string;
  };
  const surface = settings.displaySurface;
  if (surface === "monitor" || surface === "window" || surface === "browser") {
    return surface;
  }
  return "unknown";
}

export function useBrowserMonitoring(
  enabled: boolean,
  onEvent?: BrowserEventHandler,
  options: { blockNewTabShortcuts?: boolean } = {},
) {
  const { blockNewTabShortcuts = false } = options;
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

    function onCut(e: ClipboardEvent) {
      e.preventDefault();
      onEventRef.current?.("COPY_ATTEMPT", { cut: true });
    }

    function onPaste(e: ClipboardEvent) {
      e.preventDefault();
      onEventRef.current?.("PASTE_ATTEMPT");
    }

    function onBeforeInput(e: InputEvent) {
      const type = e.inputType;
      if (
        type === "insertFromPaste" ||
        type === "insertFromDrop" ||
        type === "insertFromYank"
      ) {
        e.preventDefault();
        onEventRef.current?.("PASTE_ATTEMPT", { inputType: type });
      }
    }

    function onContextMenu(e: MouseEvent) {
      e.preventDefault();
      onEventRef.current?.("RIGHT_CLICK");
    }

    function onDragStart(e: DragEvent) {
      e.preventDefault();
      onEventRef.current?.("DRAG_DROP_ATTEMPT", { phase: "dragstart" });
    }

    function onDrop(e: DragEvent) {
      e.preventDefault();
      onEventRef.current?.("DRAG_DROP_ATTEMPT", { phase: "drop" });
    }

    function onDragOver(e: DragEvent) {
      e.preventDefault();
    }

    function onKeyDown(e: KeyboardEvent) {
      const key = e.key.toLowerCase();
      const mod = e.metaKey || e.ctrlKey;

      if (blockNewTabShortcuts && isNewTabShortcut(e)) {
        e.preventDefault();
        e.stopPropagation();
        onEventRef.current?.("NEW_TAB_SHORTCUT", { key: e.key });
        return;
      }

      if (mod && ["c", "v", "x", "a", "p", "insert"].includes(key)) {
        e.preventDefault();
        if (key === "c" || key === "x" || key === "insert") {
          onEventRef.current?.("COPY_ATTEMPT", { shortcut: true, key });
        }
        if (key === "v") {
          onEventRef.current?.("PASTE_ATTEMPT", { shortcut: true });
        }
      }

      if (e.shiftKey && mod && key === "z") {
        e.preventDefault();
      }
    }

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("copy", onCopy);
    document.addEventListener("cut", onCut);
    document.addEventListener("paste", onPaste);
    document.addEventListener("beforeinput", onBeforeInput);
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("dragstart", onDragStart);
    document.addEventListener("drop", onDrop);
    document.addEventListener("dragover", onDragOver);
    window.addEventListener("keydown", onKeyDown, true);

    const originalOpen = window.open.bind(window);
    if (blockNewTabShortcuts) {
      window.open = (...args) => {
        onEventRef.current?.("NEW_TAB_SHORTCUT", { via: "window.open" });
        return null;
      };
    }

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
      document.removeEventListener("cut", onCut);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("beforeinput", onBeforeInput);
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("dragstart", onDragStart);
      document.removeEventListener("drop", onDrop);
      document.removeEventListener("dragover", onDragOver);
      window.removeEventListener("keydown", onKeyDown, true);
      if (blockNewTabShortcuts) {
        window.open = originalOpen;
      }
    };
  }, [enabled, blockNewTabShortcuts]);

  function setExamTabBlocked(examTabBlocked: boolean) {
    setState((prev) => ({
      ...prev,
      examTabBlocked,
      singleTabEnforced: true,
    }));
  }

  async function requestFullscreen() {
    await document.documentElement.requestFullscreen();
    setState((prev) => ({ ...prev, isFullscreen: true }));
  }

  async function requestScreenShare() {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false,
    });

    const [track] = stream.getVideoTracks();
    const displaySurface = readDisplaySurface(track);
    const screenShareFullMonitor = displaySurface === "monitor";

    if (!screenShareFullMonitor) {
      stream.getTracks().forEach((t) => t.stop());
      setState((prev) => ({
        ...prev,
        screenShareActive: false,
        screenShareFullMonitor: false,
        displaySurface,
      }));
      onEventRef.current?.("SCREEN_SHARE_INVALID", { displaySurface });
      throw new Error(
        "Нужно выбрать «Весь экран», а не вкладку или окно.",
      );
    }

    screenStreamRef.current = stream;
    setState((prev) => ({
      ...prev,
      screenShareActive: true,
      screenShareFullMonitor: true,
      displaySurface,
    }));

    track.onended = () => {
      screenStreamRef.current = null;
      setState((prev) => ({
        ...prev,
        screenShareActive: false,
        screenShareFullMonitor: false,
        displaySurface: null,
      }));
      onEventRef.current?.("SCREEN_SHARE_STOPPED");
    };

    return stream;
  }

  function stopScreenShare() {
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    setState((prev) => ({
      ...prev,
      screenShareActive: false,
      screenShareFullMonitor: false,
      displaySurface: null,
    }));
  }

  function simulateTabHidden() {
    onEventRef.current?.("TAB_HIDDEN", { simulated: true });
  }

  return {
    state,
    setExamTabBlocked,
    requestFullscreen,
    requestScreenShare,
    stopScreenShare,
    simulateTabHidden,
  };
}
