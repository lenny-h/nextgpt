import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import { EmbeddingModel } from "ai";

export const getEmbeddingModel = async (): Promise<{
  model: EmbeddingModel;
}> => {
  if (process.env.USE_OPENAI_API === "true") {
    const { openai } = await import("@ai-sdk/openai");

    return {
      model: openai.textEmbeddingModel(process.env.EMBEDDINGS_MODEL!),
    };
  }

  if (process.env.CLOUD_PROVIDER === "gcloud") {
    const { vertex } = await import("@ai-sdk/google-vertex");

    return {
      model: vertex.textEmbeddingModel(process.env.EMBEDDINGS_MODEL!),
    };
  }

  if (process.env.CLOUD_PROVIDER === "aws") {
    const { createAmazonBedrock } = await import("@ai-sdk/amazon-bedrock");

    const bedrock = createAmazonBedrock({
      region: process.env.AWS_REGION,
      credentialProvider: fromNodeProviderChain(),
    });

    return {
      model: bedrock.textEmbeddingModel(process.env.EMBEDDINGS_MODEL!),
    };
  }

  throw new Error("No valid cloud provider configured");
};
