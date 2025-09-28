import { AnthropicProviderOptions, createAnthropic } from "@ai-sdk/anthropic";
import { type JSONValue, type LanguageModel } from "ai";
import { type ModelProvider } from "./index.js";

export class AnthropicProvider implements ModelProvider {
  private modelName: string;

  constructor(modelName: string) {
    this.modelName = modelName;
  }

  getModel(apiKey: string): LanguageModel {
    const anthropic = createAnthropic({
      apiKey,
    });

    console.log("Using claude");

    return anthropic(this.modelName);
  }

  getProviderOptions(reasoningEnabled?: boolean): {
    [model: string]: Record<string, JSONValue>;
  } {
    console.log(reasoningEnabled);

    return reasoningEnabled
      ? {
          anthropic: {
            thinking: { type: "enabled", budgetTokens: 1024 },
          } satisfies AnthropicProviderOptions,
        }
      : {};
  }
}
