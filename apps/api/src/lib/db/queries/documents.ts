import { type ArtifactKind } from "../../../types/artifact-kind.js";
import { createServiceClient } from "../../../utils/supabase/service-client.js";

export async function getDocument({ id }: { id: string }) {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("documents")
    .select("user_id, title, content, kind")
    .eq("id", id)
    .single();

  if (error) throw new Error("Not found");
  return { id, ...data };
}

export async function insertDocument({
  userId,
  title,
  content,
  kind,
}: {
  userId: string;
  title: string;
  content: string;
  kind: ArtifactKind;
}) {
  const supabase = createServiceClient();

  // Check if document already exists
  const { data: existingDoc } = await supabase
    .from("documents")
    .select("id")
    .eq("user_id", userId)
    .eq("title", title)
    .maybeSingle();

  if (existingDoc) {
    // Update existing document
    const { data, error } = await supabase
      .from("documents")
      .update({
        content,
        kind,
        created_at: new Date().toISOString(),
      })
      .eq("id", existingDoc.id)
      .select();

    if (error) throw error;
    return data;
  } else {
    // Insert new document
    const { data, error } = await supabase
      .from("documents")
      .insert({
        user_id: userId,
        title,
        content,
        kind,
      })
      .select();

    if (error) throw error;
    return data;
  }
}

export async function saveDocument({
  userId,
  id,
  content,
}: {
  userId: string;
  id: string;
  content: string;
}) {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("documents")
    .update({
      content,
      created_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select();

  if (error) throw error;
  return data;
}
