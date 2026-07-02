import { redirect } from "next/navigation";

export default async function TopicMaterialPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const { topicId } = await params;

  // Legacy route: раньше "тема" была верхним уровнем. Теперь это классификация с модулями.
  redirect(`/learn/classification/${topicId}`);
}
