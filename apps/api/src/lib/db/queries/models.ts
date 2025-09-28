import { db } from "@workspace/server/drizzle/db.js";
import { models } from "@workspace/server/drizzle/schema.js";
import { and, eq } from "drizzle-orm";

export async function getModelById({
  id,
  bucketId,
}: {
  id: string;
  bucketId: string;
}) {
  const result = await db
    .select({
      name: models.name,
      resourceName: models.resourceName,
      deploymentId: models.deploymentId,
      encApiKey: models.encApiKey,
    })
    .from(models)
    .where(and(eq(models.id, id), eq(models.bucketId, bucketId)))
    .limit(1);

  if (result.length === 0) throw new Error("Model not found");

  return {
    model_name: result[0].name,
    resource_name: result[0].resourceName,
    deployment_id: result[0].deploymentId,
    api_key: result[0].encApiKey,
  };
}

export async function getModelDetails({ modelId }: { modelId: string }) {
  const result = await db
    .select({
      bucketId: models.bucketId,
      name: models.name,
    })
    .from(models)
    .where(eq(models.id, modelId))
    .limit(1);

  if (result.length === 0) throw new Error("Model not found");
  return result[0];
}

export async function addModel({
  bucketId,
  modelName,
  resourceName,
  deploymentId,
  encApiKey,
  description,
}: {
  bucketId: string;
  modelName: string;
  resourceName?: string;
  deploymentId?: string;
  encApiKey: string;
  description?: string;
}) {
  await db
    .insert(models)
    .values({
      bucketId,
      name: modelName,
      resourceName: resourceName || null,
      deploymentId: deploymentId || null,
      encApiKey,
      description: description || null,
    })
    .returning({ id: models.id });
}

export async function deleteModel({ modelId }: { modelId: string }) {
  await db.delete(models).where(eq(models.id, modelId));
}
