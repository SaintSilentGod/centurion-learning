"use client";

import { endModuleSessionAction } from "@/actions/client/learning";
import { Button } from "@/components/ui/button";

export function CloseModuleButton({ sessionId }: { sessionId: string }) {
  const closeAction = endModuleSessionAction.bind(null, sessionId);

  return (
    <form action={closeAction}>
      <Button type="submit" variant="secondary">
        Закрыть модуль и вернуться к списку
      </Button>
    </form>
  );
}

