import { generateText, type LanguageModel } from "ai";
import { type MyUIMessage } from "../types/custom-ui-message.js";

export async function generateTitleFromUserMessage({
  message,
  model,
}: {
  message: MyUIMessage;
  model: LanguageModel;
}) {
  const { text: title } = await generateText({
    model,
    system: `\n
      - Generate a short title based on the first message a user begins a conversation with
      - Ensure it is not more than a few words long
      - Do not use quotes or colons`,
    prompt:
      "User message: " +
      message.parts
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("\n"),
    maxOutputTokens: 16,
  });

  return title;
}
