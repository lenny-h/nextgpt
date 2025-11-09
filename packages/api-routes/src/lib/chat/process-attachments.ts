import { type Attachment } from "@workspace/api-routes/schemas/attachment-schema.js";
import {
  MyUIMessage,
  MyUIMessagePart,
} from "@workspace/api-routes/types/custom-ui-message.js";
import { getStorageClient } from "@workspace/api-routes/utils/access-clients/storage-client.js";
import { createLogger } from "@workspace/api-routes/utils/logger.js";

const logger = createLogger("process-attachments");

function getFileType(filename: string): string {
  if (filename.endsWith(".pdf")) return "application/pdf";
  if (filename.endsWith(".png")) return "image/png";
  if (filename.endsWith(".jpg") || filename.endsWith(".jpeg"))
    return "image/jpeg";

  // For all other file types, we'll need to convert them
  return "other";
}

function canDirectlyAttach(mediaType: string): boolean {
  return (
    mediaType === "application/pdf" ||
    mediaType === "image/png" ||
    mediaType === "image/jpeg"
  );
}

async function convertToMarkdown(key: string): Promise<string> {
  const processorUrl = process.env.DOCUMENT_PROCESSOR_URL;
  
  logger.debug("Converting document to markdown", {
    key,
    processorUrl,
  });

  const response = await fetch(
    `${processorUrl}/convert?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to convert document: ${response.status} ${errorText}`
    );
  }

  const result = await response.json();

  if (!result.success || !result.markdown) {
    throw new Error("Document conversion failed");
  }

  return result.markdown;
}

export async function processAttachments(
  attachments: Attachment[]
): Promise<MyUIMessagePart[]> {
  logger.info("Processing attachments", {
    attachmentCount: attachments.length,
    filenames: attachments.map(a => a.filename),
  });

  const parts: MyUIMessagePart[] = [];

  for (const attachment of attachments) {
    const fileType = getFileType(attachment.filename);
    
    logger.debug("Processing attachment", {
      filename: attachment.filename,
      detectedFileType: fileType,
      canDirectlyAttach: canDirectlyAttach(fileType),
    });

    if (canDirectlyAttach(fileType)) {
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
    } else {
      // For other formats - convert to markdown via document-processor
      logger.info("Converting file to markdown", {
        filename: attachment.filename,
        fileType,
      });

      try {
        const markdown = await convertToMarkdown(attachment.filename);
        parts.push({
          type: "text",
          text: "Parsed content of the uploaded attachment: " + markdown,
        });
      } catch (error) {
        logger.error(
          `Failed to process attachment ${attachment.filename}:`,
          error
        );

        throw new Error(
          "Failed to process attachment. Please ensure the file format is supported."
        );
      }
    }
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
