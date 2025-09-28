import * as z from "zod";

export const ModelNameSchema = z.enum([
  "gpt-4o-mini",
  "gpt-4o",
  "o3-mini",
  "azure",
  "claude-4-opus-20250514",
  "claude-4-sonnet-20250514",
  "claude-3-7-sonnet-20250219",
  "claude-3-5-sonnet-20241022",
  "claude-3-5-haiku-20241022",
]);

export const addModelFormSchema = z
  .object({
    bucketId: z.string().min(1, {
      message: "Bucket is required",
    }),
    modelName: ModelNameSchema,
    resourceName: z
      .string()
      .max(256, {
        message: "Resource name must be less than 256 characters",
      })
      .optional(),
    deploymentId: z
      .string()
      .max(256, {
        message: "Deployment ID must be less than 256 characters",
      })
      .optional(),
    apiKey: z
      .string()
      .min(1, {
        message: "API key is required",
      })
      .max(168, {
        message: "API key must be less than 168 characters",
      }),
    description: z
      .string()
      .max(60, {
        message: "Description must be less than 60 characters",
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    // Make resourceName required if modelName is azure
    if (
      data.modelName === "azure" &&
      (!data.resourceName || data.resourceName.length === 0)
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Resource name is required for Azure models",
        path: ["resourceName"],
      });
    }

    // Make deploymentId required if modelName is azure
    if (
      data.modelName === "azure" &&
      (!data.deploymentId || data.deploymentId.length === 0)
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Deployment ID is required for Azure models",
        path: ["deploymentId"],
      });
    }
  });
