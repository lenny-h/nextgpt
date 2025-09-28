import { type JSONValue, type LanguageModel } from "ai";

export class ChatConfig {
  public readonly modelId: LanguageModel;
  public readonly isDefaultModel: boolean;
  public readonly providerOptions: {
    [model: string]: Record<string, JSONValue>;
  };

  constructor(
    modelId: LanguageModel,
    isDefaultModel: boolean,
    providerOptions: { [model: string]: Record<string, JSONValue> } = {}
  ) {
    this.modelId = modelId;
    this.isDefaultModel = isDefaultModel;
    this.providerOptions = providerOptions;
  }

  static async create(
    selectedChatModel: string,
    bucketId: string,
    reasoningEnabled?: boolean
  ): Promise<ChatConfig> {
    const { getModel } = await import("../providers/index.js");

    const config = await getModel(
      selectedChatModel,
      bucketId,
      reasoningEnabled
    );

    return new ChatConfig(
      config.model,
      config.isDefaultModel,
      config.providerOptions
    );
  }
}
