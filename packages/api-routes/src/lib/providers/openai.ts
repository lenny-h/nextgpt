import { createOpenAI } from "@ai-sdk/openai";
import { type JSONValue, type LanguageModel } from "ai";
import { type ModelProvider } from "./index.js";

export class OpenAIProvider implements ModelProvider {
  private modelName: string;

  constructor(modelName: string) {
    this.modelName = modelName;
  }

  getModel(apiKey: string): LanguageModel {
    const openai = createOpenAI({
      apiKey,
    });

    return openai(this.modelName);
  }

  getProviderOptions(): {
    [model: string]: Record<string, JSONValue>;
  } {
    return {};
  }
}
