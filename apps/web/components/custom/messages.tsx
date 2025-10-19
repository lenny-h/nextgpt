import { type MyUIMessage } from "@workspace/api-routes/types/custom-ui-message";
import { useScrollToBottom } from "@workspace/ui/hooks/use-scroll-to-bottom";
import { type ChatRequestOptions } from "ai";
import equal from "fast-deep-equal";
import { memo } from "react";
import { AgentMessage } from "./agent-message";
import { UserMessage } from "./user-message";

interface MessagesProps {
  chatId: string;
  messages: Array<MyUIMessage>;
  setMessages: (
    messages: MyUIMessage[] | ((messages: MyUIMessage[]) => MyUIMessage[]),
  ) => void;
  status: "error" | "ready" | "submitted" | "streaming";
  regenerate: (
    chatRequestOptions?: {
      messageId?: string | undefined;
    } & ChatRequestOptions,
  ) => Promise<void>;
}

function PureMessages({
  chatId,
  messages,
  setMessages,
  status,
  regenerate,
}: MessagesProps) {
  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  return (
    <div
      ref={messagesContainerRef}
      className="flex flex-1 flex-col gap-4 overflow-y-scroll px-2 py-3 leading-relaxed sm:px-4 md:px-6"
    >
      {messages.map((message, index) =>
        message.role === "user" ? (
          <UserMessage
            key={message.id}
            chatId={chatId}
            message={message}
            setMessages={setMessages}
            regenerate={regenerate}
          />
        ) : (
          <AgentMessage
            key={message.id}
            chatId={chatId}
            message={message}
            regenerate={regenerate}
            isLoading={status === "streaming" && messages.length - 1 === index}
            isThinking={false}
            isLastMessage={messages.length - 1 === index}
            previousMessageId={index > 0 ? messages[index - 1].id : ""}
          />
        ),
      )}

      {status === "submitted" && (
        <AgentMessage
          chatId={chatId}
          message={{
            id: "thinking",
            role: "assistant",
            parts: [{ type: "text", text: "Thinking..." }],
          }}
          regenerate={regenerate}
          isLoading={false}
          isThinking={true}
          isLastMessage={true}
          previousMessageId=""
        />
      )}

      <div
        ref={messagesEndRef}
        className="min-h-[24px] min-w-[24px] shrink-0"
      />
    </div>
  );
}

export const Messages = memo(PureMessages, (prevProps, nextProps) => {
  if (prevProps.messages.length !== nextProps.messages.length) return false;
  if (!equal(prevProps.messages, nextProps.messages)) return false;
  if (prevProps.status !== nextProps.status) return false;

  return true;
});
