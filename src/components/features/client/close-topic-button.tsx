"use client";

import { endTopicSessionAction } from "@/actions/client/learning";
import { Button } from "@/components/ui/button";

export function CloseTopicButton({ sessionId }: { sessionId: string }) {
  const closeAction = endTopicSessionAction.bind(null, sessionId);

  return (
    <form action={closeAction}>
      <Button type="submit" variant="secondary">
        Закрыть тему и вернуться к списку
      </Button>
    </form>
  );
}
