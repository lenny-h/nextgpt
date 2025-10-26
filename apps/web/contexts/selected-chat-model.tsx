"use client";

import { chatModels } from "@/lib/models";
import React, {
  createContext,
  type ReactNode,
  useContext,
  useState,
} from "react";

interface ChatModel {
  id: number;
  name: string;
  label: string;
  description: string;
  images: boolean;
  pdfs: boolean;
  reasoning: boolean;
}

interface ChatModelContextType {
  selectedChatModel: ChatModel;
  setSelectedChatModel: React.Dispatch<React.SetStateAction<ChatModel>>;
  reasoningEnabled: boolean;
  setReasoningEnabled: React.Dispatch<React.SetStateAction<boolean>>;
}

const ChatModelContext = createContext<ChatModelContextType | undefined>(
  undefined,
);

interface Props {
  children: ReactNode;
}

export function ChatModelProvider({ children }: Props) {
  const [selectedChatModel, setSelectedChatModel] = useState<ChatModel>(() => {
    if (!chatModels[0]) {
      throw new Error("No default chat models found.");
    }
    return chatModels[0];
  });

  const [reasoningEnabled, setReasoningEnabled] = useState(false);

  return (
    <ChatModelContext.Provider
      value={{
        selectedChatModel,
        setSelectedChatModel,
        reasoningEnabled,
        setReasoningEnabled,
      }}
    >
      {children}
    </ChatModelContext.Provider>
  );
}

export function useChatModel(): ChatModelContextType {
  const context = useContext(ChatModelContext);
  if (!context) {
    throw new Error("useChatModel must be used within a ChatModelProvider");
  }
  return context;
}
