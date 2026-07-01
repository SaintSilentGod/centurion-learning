/** Exclusive lock name — only one exam tab may hold it at a time. */
export const EXAM_TAB_LOCK_NAME = "centurion-proctor-exam-tab";

const BROADCAST_CHANNEL = "centurion-proctor-tab-guard";
const HEARTBEAT_MS = 1200;
const PEER_STALE_MS = 3500;
const STORAGE_KEY = "centurion-proctor-tab-holder";

export type TabGuardStatus =
  | "idle"
  | "holding"
  | "blocked"
  | "unsupported";

type PeerMessage =
  | { type: "heartbeat"; tabId: string; at: number }
  | { type: "claim"; tabId: string }
  | { type: "deny"; tabId: string; holder: string };

function supportsWebLocks(): boolean {
  return typeof navigator !== "undefined" && "locks" in navigator;
}

function waitForAbort(signal: AbortSignal): Promise<void> {
  if (signal.aborted) return Promise.resolve();
  return new Promise((resolve) => {
    signal.addEventListener("abort", () => resolve(), { once: true });
  });
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  if (signal.aborted) return Promise.resolve();
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}

function readStoredHolder(): { tabId: string; at: number } | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  const [tabId, atStr] = raw.split(":");
  const at = Number(atStr);
  if (!tabId || Number.isNaN(at)) return null;
  if (Date.now() - at > PEER_STALE_MS) return null;
  return { tabId, at };
}

/**
 * Holds an exclusive Web Lock for the lifetime of `signal`.
 * Resolves true if this tab holds the lock, false if another tab does.
 */
export async function holdExamTabLock(signal: AbortSignal): Promise<boolean> {
  if (!supportsWebLocks()) {
    return holdExamTabLockBroadcast(signal);
  }

  return new Promise((resolve) => {
    void navigator.locks.request(
      EXAM_TAB_LOCK_NAME,
      { mode: "exclusive", ifAvailable: true },
      async (lock) => {
        if (!lock) {
          resolve(false);
          return;
        }

        resolve(true);
        await waitForAbort(signal);
      },
    );
  });
}

/** Poll until the exam tab lock becomes available or signal aborts. */
export async function waitForExamTabLock(
  signal: AbortSignal,
  onBlocked?: () => void,
): Promise<boolean> {
  while (!signal.aborted) {
    const acquired = await holdExamTabLock(signal);
    if (acquired) return true;
    onBlocked?.();
    await sleep(1000, signal);
  }
  return false;
}

/** Safari & older browsers: heartbeat via BroadcastChannel + localStorage. */
function holdExamTabLockBroadcast(signal: AbortSignal): Promise<boolean> {
  if (typeof window === "undefined") {
    return Promise.resolve(false);
  }

  const tabId = crypto.randomUUID();
  let channel: BroadcastChannel | null = null;

  try {
    channel = new BroadcastChannel(BROADCAST_CHANNEL);
  } catch {
    return Promise.resolve(false);
  }

  let isHolder = false;
  let peerActive = false;

  return new Promise((resolve) => {
    function cleanup() {
      if (isHolder) {
        localStorage.removeItem(STORAGE_KEY);
      }
      channel?.close();
    }

    signal.addEventListener("abort", cleanup, { once: true });

    channel!.onmessage = (event: MessageEvent<PeerMessage>) => {
      const msg = event.data;
      if (msg.tabId === tabId) return;

      if (msg.type === "heartbeat" || msg.type === "deny") {
        peerActive = true;
      }

      if (msg.type === "claim" && isHolder) {
        channel!.postMessage({
          type: "deny",
          tabId,
          holder: tabId,
        } satisfies PeerMessage);
      }
    };

    channel!.postMessage({ type: "claim", tabId } satisfies PeerMessage);

    const decideTimer = setTimeout(() => {
      const stored = readStoredHolder();
      if (peerActive || (stored && stored.tabId !== tabId)) {
        resolve(false);
        return;
      }

      isHolder = true;
      resolve(true);

      const heartbeat = setInterval(() => {
        if (signal.aborted) return;
        localStorage.setItem(STORAGE_KEY, `${tabId}:${Date.now()}`);
        channel!.postMessage({
          type: "heartbeat",
          tabId,
          at: Date.now(),
        } satisfies PeerMessage);
      }, HEARTBEAT_MS);

      signal.addEventListener(
        "abort",
        () => clearInterval(heartbeat),
        { once: true },
      );
    }, 450);

    signal.addEventListener(
      "abort",
      () => clearTimeout(decideTimer),
      { once: true },
    );
  });
}

export function isNewTabShortcut(event: KeyboardEvent): boolean {
  const key = event.key.toLowerCase();
  const mod = event.metaKey || event.ctrlKey;

  if (mod && key === "t" && !event.shiftKey) return true;
  if (mod && key === "n" && !event.shiftKey) return true;
  if (mod && key === "t" && event.shiftKey) return true;
  if (mod && key === "n" && event.shiftKey) return true;
  if (mod && key === "w") return true;

  return false;
}
