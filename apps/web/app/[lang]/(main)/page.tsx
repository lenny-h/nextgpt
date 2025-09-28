import { Chat } from "@/components/custom/chat";
import { generateUUID } from "@workspace/ui/lib/utils";

export default function HomePage() {
  const id = generateUUID();

  return <Chat chatId={id} initialMessages={[]} />;
}
