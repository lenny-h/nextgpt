export const defaultChatModels = [
  {
    id: "chat-model-small",
    name: "Small model (Gemini 2.5 Flash)",
    description: "Powerful model with extremely fast response times",
    images: true,
    pdfs: true,
    reasoning: false,
  },
  {
    id: "chat-model-large",
    name: "Large model (Gemini 2.5 Pro)",
    description: "Most powerful model, but slower response times",
    images: true,
    pdfs: true,
    reasoning: false,
  },
];

export const customChatModels = {
  "gpt-4o": {
    name: "OpenAI GPT-4o",
    images: true,
    pdfs: true,
    reasoning: false,
  },
  "gpt-4o-mini": {
    name: "OpenAI GPT-4o Mini",
    images: true,
    pdfs: true,
    reasoning: false,
  },
  "o3-mini": {
    name: "OpenAI o3 Mini",
    images: false,
    pdfs: false,
    reasoning: false,
  },
  azure: {
    name: "Azure deployment",
    images: true,
    pdfs: true,
    reasoning: false,
  },
  "claude-4-opus-20250514": {
    name: "Anthropic Claude 4 Opus",
    images: true,
    pdfs: true,
    reasoning: true,
  },
  "claude-4-sonnet-20250514": {
    name: "Anthropic Claude 4 Sonnet",
    images: true,
    pdfs: true,
    reasoning: true,
  },
  "claude-3-7-sonnet-20250219": {
    name: "Anthropic Claude 3.7 Sonnet",
    images: true,
    pdfs: true,
    reasoning: true,
  },
  "claude-3-5-sonnet-20241022": {
    name: "Anthropic Claude 3.5 Sonnet",
    images: true,
    pdfs: true,
    reasoning: false,
  },
  "claude-3-5-haiku-20241022": {
    name: "Anthropic Claude 3.5 Haiku",
    images: false,
    pdfs: false,
    reasoning: false,
  },
};

export type ModelName = keyof typeof customChatModels;
