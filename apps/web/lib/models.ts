export interface ChatModel {
  id: number;
  name: string;
  label: string;
  description: string;
  images: boolean;
  pdfs: boolean;
  reasoning: boolean;
}

const defaultChatModels: Omit<ChatModel, "id">[] = [
  {
    name: "gpt-4o",
    label: "GPT-4o",
    description: "Powerful model with fast response times",
    images: true,
    pdfs: true,
    reasoning: false,
  },
  {
    name: "gpt-5",
    label: "GPT-5",
    description: "Powerful model, but slow response times",
    images: true,
    pdfs: true,
    reasoning: false,
  },
];

function parseChatModels(): ChatModel[] {
  const envModels = process.env.NEXT_PUBLIC_LLM_MODELS;

  if (envModels) {
    try {
      const parsed = JSON.parse(envModels) as Omit<ChatModel, "id">[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((model, index) => ({
          id: index,
          name: model.name,
          label: model.label,
          description: model.description,
          images: model.images ?? false,
          pdfs: model.pdfs ?? false,
          reasoning: model.reasoning ?? false,
        }));
      }
    } catch (e) {
      console.warn(
        "Failed to parse NEXT_PUBLIC_LLM_MODELS environment variable, using defaults",
      );
    }
  }

  return defaultChatModels.map((model, index) => ({ id: index, ...model }));
}

export const chatModels: ChatModel[] = parseChatModels();
