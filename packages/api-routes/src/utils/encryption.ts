import { createLogger } from "@workspace/server/logger.js";
import crypto from "crypto";

const logger = createLogger("encryption");

export function encryptApiKey(apiKey: string): string {
  // Generate a random initialization vector
  const iv = crypto.randomBytes(16);

  // Create cipher with AES-256-GCM (provides authentication)
  const cipher = crypto.createCipheriv(
    "aes-256-gcm",
    Buffer.from(process.env.ENCRYPTION_KEY!, "hex"),
    iv
  );

  const encrypted = cipher.update(apiKey, "utf8", "hex") + cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");

  return iv.toString("hex") + authTag + encrypted;
}

export function decryptApiKey(encryptedData: string): string {
  try {
    // Extract IV (first 32 hex chars = 16 bytes)
    const iv = Buffer.from(encryptedData.slice(0, 32), "hex");

    // Extract auth tag (next 32 hex chars = 16 bytes)
    const authTag = Buffer.from(encryptedData.slice(32, 64), "hex");

    // Rest is the encrypted content
    const encryptedContent = encryptedData.slice(64);

    // Create decipher
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      Buffer.from(process.env.ENCRYPTION_KEY!, "hex"),
      iv
    );

    // Set auth tag for verification
    decipher.setAuthTag(authTag);

    // Decrypt
    let decrypted = decipher.update(encryptedContent, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    logger.error("Failed to decrypt API key:", error);
    throw new Error("Failed to decrypt API key");
  }
}
