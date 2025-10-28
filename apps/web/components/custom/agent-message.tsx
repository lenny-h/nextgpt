"use client";

import * as m from "motion/react-m";

import { type MyUIMessage } from "@workspace/api-routes/types/custom-ui-message";
import { cn } from "@workspace/ui/lib/utils";
import { type ChatRequestOptions } from "ai";
import equal from "fast-deep-equal";
import { LazyMotion } from "motion/react";
import dynamic from "next/dynamic";
import { memo } from "react";
import { ModifyDocumentUI } from "../tools/modify-document";
import { RetrieveDocumentSourcesUI } from "../tools/retrieve-document-sources";
import { RetrieveWebPagesUI } from "../tools/retrieve-web-pages";
import { RetrieveWebSourcesUI } from "../tools/retrieve-web-sources";
import { Markdown } from "./markdown";
import { MessageActions } from "./message-actions";
import { StreamingIndicator } from "./streaming-indicator";

const MessageReasoning = dynamic(() =>
  import("./reasoning").then((mod) => mod.MessageReasoning),
);

interface AgentMessageProps {
  chatId: string;
  message: MyUIMessage;
  regenerate: (
    options?: {
      messageId?: string | undefined;
    } & ChatRequestOptions,
  ) => Promise<void>;
  isLoading: boolean;
  isThinking: boolean;
  isLastMessage: boolean;
  previousMessageId: string;
  isPractice?: boolean;
}

const loadFeatures = () => import("@/lib/features").then((res) => res.default);

const PureAgentMessage = ({
  chatId,
  message,
  regenerate,
  isLoading,
  isThinking,
  isLastMessage,
  previousMessageId,
  isPractice = false,
}: AgentMessageProps) => {
  // Extract text and reasoning content for special handling
  const textParts = message.parts.filter((part) => part.type === "text");
  const reasoningParts = message.parts.filter(
    (part) => part.type === "reasoning",
  );

  // TODO:

  const documentSources = message.parts
    .filter((part) => part.type === "tool-retrieveDocumentSources")
    .flatMap((part) => part.output?.documentSources ?? []);

  // Combine text and reasoning content
  const textContent = textParts.map((part) => part.text).join("\n");
  const reasoningContent = reasoningParts.map((part) => part.text).join("\n");

  // Parse LaTeX content
  const parsedContent = textContent
    .replace(/\\\[(.*?)\\\]/gs, "$$$$$1$$$$")
    .replace(/\\\((.*?)\\\)/gs, "$$$1$$");
  // .replace(/```latex([\s\S]*?)```/gs, "$$$$$1$$$$");

  return (
    <LazyMotion features={loadFeatures}>
      <m.article
        className="mx-auto w-full max-w-[735px]"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1, transition: { delay: 0.3 } }}
        data-role={message.role}
      >
        <div
          className={cn(
            !isThinking && "relative flex w-full flex-col gap-4 p-3",
            isLastMessage && {
              "min-h-[calc(100dvh-324px)] md:min-h-[calc(100dvh-332px)]":
                !isPractice,
              "min-h-[calc(100dvh-372px)] md:min-h-[calc(100dvh-380px)]":
                isPractice,
            },
          )}
        >
          {isThinking || (isLoading && !reasoningContent && !textContent) ? (
            <StreamingIndicator />
          ) : (
            <>
              <div className="space-y-3">
                {message.parts.map((part, index) => {
                  if (part.type === "tool-retrieveDocumentSources") {
                    return (
                      <RetrieveDocumentSourcesUI key={index} part={part} />
                    );
                  }
                  if (part.type === "tool-retrieveWebSources") {
                    return <RetrieveWebSourcesUI key={index} part={part} />;
                  }
                  if (part.type === "tool-retrieveWebPages") {
                    return <RetrieveWebPagesUI key={index} part={part} />;
                  }
                  if (part.type === "tool-modifyDocument") {
                    return <ModifyDocumentUI key={index} part={part} />;
                  }
                  return null;
                })}
              </div>

              {reasoningContent && (
                <MessageReasoning
                  isLoading={isLoading}
                  reasoning={reasoningContent}
                />
              )}

              {textContent && (
                <Markdown sources={documentSources} parseSourceRefs={true}>
                  {parsedContent}
                </Markdown>
              )}

              {textContent && (
                <MessageActions
                  content={parsedContent}
                  role={message.role}
                  isLoading={isLoading}
                  regenerate={regenerate}
                  messageId={message.id}
                  previousMessageId={previousMessageId}
                />
              )}
            </>
          )}
        </div>
      </m.article>
    </LazyMotion>
  );
};

export const AgentMessage = memo(PureAgentMessage, (prevProps, nextProps) => {
  if (!equal(prevProps.message.parts, nextProps.message.parts)) return false;
  if (prevProps.isLoading !== nextProps.isLoading) return false;
  if (prevProps.isThinking !== nextProps.isThinking) return false;
  if (prevProps.isLastMessage !== nextProps.isLastMessage) return false;
  if (prevProps.isPractice !== nextProps.isPractice) return false;

  return true;
});
