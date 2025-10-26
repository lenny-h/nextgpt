import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import { type JSONValue, type LanguageModel } from "ai";
import { chatModels } from "../utils/models.js";

export interface Config {
  model: LanguageModel;
  providerOptions: { [model: string]: Record<string, JSONValue> };
}

export const getModel = async (
  selectedChatModel: number,
  reasoningEnabled?: boolean
): Promise<Config> => {
  if (process.env.USE_OPENAI_API === "true") {
    const { openai } = await import("@ai-sdk/openai");

    return {
      model: openai(chatModels[selectedChatModel].name),
      providerOptions: {
        openai: {
          parallelToolCalls: false,
          store: false,
          ...(reasoningEnabled ? { reasoningSummary: "detailed" } : {}),
        },
      },
    };
  }

  if (process.env.CLOUD_PROVIDER === "gcloud") {
    const { vertex } = await import("@ai-sdk/google-vertex");

    return {
      model: vertex(chatModels[selectedChatModel].name),
      providerOptions: {
        google: {
          ...(reasoningEnabled
            ? {
                thinkingConfig: {
                  includeThoughts: true,
                  thinkingBudget: 1024,
                },
              }
            : {}),
        },
      },
    };
  }

  if (process.env.CLOUD_PROVIDER === "aws") {
    const { createAmazonBedrock } = await import("@ai-sdk/amazon-bedrock");

    const bedrock = createAmazonBedrock({
      region: process.env.AWS_REGION,
      credentialProvider: fromNodeProviderChain(),
    });

    return {
      model: bedrock(chatModels[selectedChatModel].name),
      providerOptions: {
        amazon_bedrock: {
          ...(reasoningEnabled
            ? { reasoningConfig: { type: "enabled", budgetTokens: 1024 } }
            : {}),
        },
      },
    };
  }

  throw new Error("No valid cloud provider configured");
};
