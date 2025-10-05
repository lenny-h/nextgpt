import * as z from "zod";

import { vertex } from "@ai-sdk/google-vertex";
import { type JSONValue, type LanguageModel } from "ai";
import { decryptApiKey } from "../../utils/encryption.js";
import { getModelById } from "../db/queries/models.js";
import { AnthropicProvider } from "./anthropic.js";
import { AzureProvider } from "./azure.js";
import { OpenAIProvider } from "./openai.js";

export const ModelNameSchema = z.enum([
  "gpt-4o-mini",
  "gpt-4o",
  "o3-mini",
  "azure",
]);

export type ModelName = z.infer<typeof ModelNameSchema>;

export interface ModelProvider {
  getModel: (
    apiKey: string,
    resourceName?: string,
    deploymentId?: string
  ) => LanguageModel;
  getProviderOptions: (reasoningEnabled?: boolean) => {
    [model: string]: Record<string, JSONValue>;
  };
}

export interface Config {
  model: LanguageModel;
  providerOptions: { [model: string]: Record<string, JSONValue> };
  isDefaultModel: boolean;
}

export const getModel = async (
  selectedChatModel: string,
  bucketId: string,
  reasoningEnabled?: boolean
): Promise<Config> => {
  if (!selectedChatModel.includes("chat-model")) {
    const customModels = await getModelById({
      id: selectedChatModel,
      bucketId,
    });

    const apiKey = decryptApiKey(customModels.api_key);
    const modelName = customModels.model_name as ModelName;

    let provider: ModelProvider;

    if (modelName === "azure") {
      provider = new AzureProvider(
        customModels.resource_name!,
        customModels.deployment_id!
      );
    } else if (modelName.startsWith("claude")) {
      provider = new AnthropicProvider(modelName);
    } else {
      provider = new OpenAIProvider(modelName);
    }

    return {
      model: provider.getModel(apiKey),
      providerOptions: provider.getProviderOptions(reasoningEnabled),
      isDefaultModel: false,
    };
  }

  return {
    model: vertex(
      selectedChatModel === "chat-model-small"
        ? "gemini-2.5-flash"
        : "gemini-2.5-pro"
    ),
    providerOptions: {
      // google: {
      //   thinkingConfig: {
      //     includeThoughts: true,
      //     thinkingBudget: 2048,
      //   },
      // },
    },
    isDefaultModel: true,
  };
};
