import { type Context } from "hono";
import { addModel } from "../../../lib/db/queries/models.js";
import { encryptApiKey } from "../../../utils/encryption.js";
import { addModelFormSchema } from "./schema.js";

export async function POST(c: Context) {
  const payload = await c.req.json();

  const validatedData = addModelFormSchema.parse(payload);

  const {
    bucketId,
    modelName,
    resourceName,
    deploymentId,
    apiKey,
    description,
  } = validatedData;

  const encApiKey = encryptApiKey(apiKey);

  await addModel({
    bucketId,
    modelName,
    resourceName,
    deploymentId,
    encApiKey,
    description,
  });

  return c.text("Model added");
}
