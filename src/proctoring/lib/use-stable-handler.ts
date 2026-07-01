import { useEffect, useRef } from "react";

/** Стабильная ссылка на колбэк — не перезапускает useEffect у дочерних хуков. */
export function useStableEventHandler<T extends (...args: never[]) => void>(
  handler: T,
): T {
  const ref = useRef(handler);
  useEffect(() => {
    ref.current = handler;
  });
  return useRef(((...args: Parameters<T>) => {
    ref.current(...args);
  }) as T).current;
}
