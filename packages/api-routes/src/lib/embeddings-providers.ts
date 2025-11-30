import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import { EmbeddingModel, JSONValue } from "ai";

export const getEmbeddingModel = async (): Promise<{
  model: EmbeddingModel;
  providerOptions: { [model: string]: Record<string, JSONValue> };
}> => {
  // Get embedding dimensions from environment variable
  const embeddingDimensions = parseInt(
    process.env.EMBEDDING_DIMENSIONS || "0",
    10
  );

  if (!embeddingDimensions || embeddingDimensions <= 0) {
    throw new Error(
      "EMBEDDING_DIMENSIONS environment variable is required and must be a positive number"
    );
  }

  if (process.env.USE_OPENAI_API === "true") {
    const { openai } = await import("@ai-sdk/openai");

    return {
      model: openai.textEmbeddingModel(process.env.EMBEDDINGS_MODEL!),
      providerOptions: {
        openai: {
          dimensions: embeddingDimensions,
        },
      },
    };
  }

  if (process.env.CLOUD_PROVIDER === "gcloud") {
    const { vertex } = await import("@ai-sdk/google-vertex");

    return {
      model: vertex.textEmbeddingModel(process.env.EMBEDDINGS_MODEL!),
      providerOptions: {
        google: {
          outputDimensionality: embeddingDimensions,
          taskType: "SEMANTIC_SIMILARITY", // optional, specifies the task type for generating embeddings
          autoTruncate: false,
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
      model: bedrock.textEmbeddingModel(process.env.EMBEDDINGS_MODEL!),
      providerOptions: {
        bedrock: {
          dimensions: embeddingDimensions,
        },
      },
    };
  }

  throw new Error("No valid cloud provider configured");
};
