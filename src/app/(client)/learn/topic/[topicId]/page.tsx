import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  getTopicMaterial,
  startTopicSessionAction,
} from "@/actions/client/learning";
import { CloseTopicButton } from "@/components/features/client/close-topic-button";
import { Card } from "@/components/ui/card";

export default async function TopicMaterialPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const { topicId } = await params;
  const data = await getTopicMaterial(topicId);
  if (!data) notFound();

  const session = await startTopicSessionAction(topicId);
  if (!session.sessionId) redirect("/learn");

  const { topic, material } = data;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/learn" className="text-blue-700 hover:underline">
        ← К списку тем
      </Link>

      <Card title={`${topic.order}. ${topic.title}`}>
        {material ? (
          <article className="prose prose-lg max-w-none whitespace-pre-wrap text-slate-800">
            <h3 className="mb-4 text-xl font-semibold">{material.title}</h3>
            {material.content}
          </article>
        ) : (
          <p className="text-slate-600">Материал для этой темы пока не добавлен.</p>
        )}
      </Card>

      <CloseTopicButton sessionId={session.sessionId} />
    </div>
  );
}
