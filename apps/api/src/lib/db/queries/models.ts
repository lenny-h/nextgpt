import { createServiceClient } from "../../../utils/supabase/service-client.js";

export async function getModelById({
  id,
  bucketId,
}: {
  id: string;
  bucketId: string;
}) {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("models")
    .select("name, resource_name, deployment_id, enc_api_key")
    .eq("id", id)
    .eq("bucket_id", bucketId)
    .single();

  if (error) throw new Error("Model not found");

  return {
    model_name: data.name,
    resource_name: data.resource_name,
    deployment_id: data.deployment_id,
    api_key: data.enc_api_key,
  };
}

export async function getModelDetails({ modelId }: { modelId: string }) {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("models")
    .select("bucket_id, name")
    .eq("id", modelId)
    .single();

  if (error) throw error;

  return { bucketId: data.bucket_id, name: data.name };
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
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("models")
    .insert({
      bucket_id: bucketId,
      name: modelName,
      resource_name: resourceName || null,
      deployment_id: deploymentId || null,
      enc_api_key: encApiKey,
      description: description || null,
    })
    .select("id")
    .single();

  if (error) throw error;
}

export async function deleteModel({ modelId }: { modelId: string }) {
  const supabase = createServiceClient();

  const { error } = await supabase.from("models").delete().eq("id", modelId);

  if (error) throw error;
}
