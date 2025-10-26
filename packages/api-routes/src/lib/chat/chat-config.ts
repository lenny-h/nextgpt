import { type JSONValue, type LanguageModel } from "ai";
import { getModel } from "../providers.js";

export class ChatConfig {
  public readonly modelId: LanguageModel;
  public readonly providerOptions: {
    [model: string]: Record<string, JSONValue | undefined>;
  };

  constructor(
    modelId: LanguageModel,
    providerOptions: {
      [model: string]: Record<string, JSONValue | undefined>;
    } = {}
  ) {
    this.modelId = modelId;
    this.providerOptions = providerOptions;
  }

  static async create(
    selectedChatModel: number,
    reasoningEnabled?: boolean
  ): Promise<ChatConfig> {
    const config = await getModel(selectedChatModel, reasoningEnabled);

    return new ChatConfig(config.model, config.providerOptions);
  }
}
