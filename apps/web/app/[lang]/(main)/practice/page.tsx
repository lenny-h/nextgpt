import { Practice } from "@/components/custom/practice";
import { generateUUID } from "@workspace/ui/lib/utils";

export default function PracticePage() {
  const id = generateUUID();

  return <Practice chatId={id} initialMessages={[]} />;
}
