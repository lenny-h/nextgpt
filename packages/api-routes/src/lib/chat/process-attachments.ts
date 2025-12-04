import { type Attachment } from "@workspace/api-routes/schemas/attachment-schema.js";
import {
  type MyUIMessage,
  type MyUIMessagePart,
} from "@workspace/api-routes/types/custom-ui-message.js";
import { getStorageClient } from "@workspace/api-routes/utils/access-clients/storage-client.js";
import { createLogger } from "@workspace/server/logger.js";

const logger = createLogger("process-attachments");

function getFileType(filename: string): string {
  if (filename.endsWith(".pdf")) return "application/pdf";
  if (filename.endsWith(".png")) return "image/png";
  if (filename.endsWith(".jpg") || filename.endsWith(".jpeg"))
    return "image/jpeg";

  // Other file types are not supported for direct attachment
  return "unsupported";
}

function canDirectlyAttach(mediaType: string): boolean {
  return (
    mediaType === "application/pdf" ||
    mediaType === "image/png" ||
    mediaType === "image/jpeg"
  );
}

export async function processAttachments(
  attachments: Attachment[]
): Promise<MyUIMessagePart[]> {
  logger.info("Processing attachments", {
    attachmentCount: attachments.length,
    filenames: attachments.map((a) => a.filename),
  });

  const parts: MyUIMessagePart[] = [];

  for (const attachment of attachments) {
    const fileType = getFileType(attachment.filename);

    logger.debug("Processing attachment", {
      filename: attachment.filename,
      detectedFileType: fileType,
      canDirectlyAttach: canDirectlyAttach(fileType),
    });

    if (!canDirectlyAttach(fileType)) {
      logger.error("Unsupported file type for attachment", {
        filename: attachment.filename,
        fileType,
      });
      throw new Error(
        `Unsupported file type: ${attachment.filename}. Only PDF, PNG, and JPEG files are supported.`
      );
    }

    // Download the file content from storage
    logger.debug("Downloading file from storage", {
      filename: attachment.filename,
      bucket: "temporary-files-bucket",
    });

    const storageClient = getStorageClient();

    const fileContent = await storageClient.downloadFile({
      bucket: "temporary-files-bucket",
      key: attachment.filename,
    });

    // Convert to data URL
    const base64Data = fileContent.toString("base64");
    const dataUrl = `data:${fileType};base64,${base64Data}`;

    parts.push({
      type: "file",
      url: dataUrl,
      mediaType: fileType,
    });
  }

  return parts;
}

export async function integrateAttachmentsIntoMessages(
  messages: MyUIMessage[],
  attachments: Attachment[]
): Promise<MyUIMessage[]> {
  if (attachments.length === 0 || messages.length === 0) {
    return messages;
  }

  const attachmentParts = await processAttachments(attachments);
  const lastMessage = messages[messages.length - 1];

  if (lastMessage.role !== "user") {
    throw new Error("Last message must be from user to integrate attachments");
  }

  return [
    ...messages.slice(0, -1),
    {
      ...lastMessage,
      parts: [...lastMessage.parts, ...attachmentParts],
    },
  ];
}
