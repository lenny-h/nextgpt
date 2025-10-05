import { Tasks } from "@/components/custom/tasks";
import { type Locale } from "@workspace/ui/lib/i18n.config";

export default async function TasksPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const lang = (await params).lang;

  return <Tasks locale={lang} />;
}
