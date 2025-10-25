import {
  MyUIMessage,
  MyUIMessagePart,
} from "@workspace/api-routes/types/custom-ui-message.js";

function getFileType(url: string): string {
  const urlLower = url.toLowerCase();

  if (urlLower.endsWith(".pdf")) return "application/pdf";
  if (urlLower.endsWith(".png")) return "image/png";
  if (urlLower.endsWith(".jpg") || urlLower.endsWith(".jpeg"))
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

async function convertToMarkdown(gcsUrl: string): Promise<string> {
  const processorUrl = process.env.DOCUMENT_PROCESSOR_URL;

  const response = await fetch(
    `${processorUrl}/convert?gcs_url=${encodeURIComponent(gcsUrl)}`,
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
  attachments: { url: string }[]
): Promise<MyUIMessagePart[]> {
  const parts: MyUIMessagePart[] = [];

  for (const attachment of attachments) {
    const fileType = getFileType(attachment.url);

    if (canDirectlyAttach(fileType)) {
      parts.push({
        type: "file",
        url: attachment.url,
        mediaType: fileType,
      });
    } else {
      // For other formats - convert to markdown via document-processor
      try {
        const markdown = await convertToMarkdown(attachment.url);
        parts.push({
          type: "text",
          text: markdown,
        });
      } catch (error) {
        console.error(`Failed to process attachment ${attachment.url}:`, error);

        throw new Error(
          `Failed to process attachment. Please ensure the file format is supported.`
        );
      }
    }
  }

  return parts;
}

export async function integrateAttachmentsIntoMessages(
  messages: MyUIMessage[],
  attachments: { url: string }[]
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
