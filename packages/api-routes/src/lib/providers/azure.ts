import { createAzure } from "@ai-sdk/azure";
import { type JSONValue, type LanguageModel } from "ai";
import { ModelProvider } from "./index.js";

export class AzureProvider implements ModelProvider {
  private resourceName: string;
  private deploymentId: string;

  constructor(resourceName: string, deploymentId: string) {
    this.resourceName = resourceName;
    this.deploymentId = deploymentId;
  }

  getModel(apiKey: string): LanguageModel {
    const azure = createAzure({
      resourceName: this.resourceName,
      apiKey,
    });

    return azure(this.deploymentId);
  }

  getProviderOptions(): {
    [model: string]: Record<string, JSONValue>;
  } {
    return {};
  }
}
