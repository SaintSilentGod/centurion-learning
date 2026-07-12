import { notFound, redirect } from "next/navigation";
import { getModuleData } from "@/actions/client/learning";
import { ModuleLearningView } from "@/components/features/client/module-learning-view";

export default async function ModulePage({
  params,
  searchParams,
}: {
  params: Promise<{ moduleId: string }>;
  searchParams?: Promise<{ scorePct?: string; passed?: string }>;
}) {
  const { moduleId } = await params;
  const sp = (await searchParams) ?? {};
  const data = await getModuleData(moduleId);
  if (!data) notFound();
  if (data.locked) redirect("/learn");

  const { module, sessionId, bestAttempt, theoryTimeSec } = data;
  if (!module || !sessionId) notFound();

  return (
    <ModuleLearningView
      moduleId={module.id}
      sessionId={sessionId}
      categoryOrder={module.topic.order}
      moduleOrder={module.order}
      moduleTitle={module.title}
      topicId={module.topicId}
      materials={module.materials}
      test={module.test}
      bestAttempt={bestAttempt}
      theoryTimeSec={theoryTimeSec}
      scorePct={sp.scorePct}
      passed={sp.passed}
    />
  );
}
