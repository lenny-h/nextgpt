import { type MyUIMessage } from "@workspace/api-routes/types/custom-ui-message";

export function createDiffViewString(
  changes: Array<{ value: string; added?: boolean; removed?: boolean }>,
  isText: boolean,
) {
  let diffString = "";

  if (isText) {
    changes.forEach((change) => {
      if (change.added) {
        diffString += `/+/+${change.value}/+/+`;
      } else if (change.removed) {
        diffString += `/-/-${change.value}/-/-`;
      } else {
        diffString += change.value;
      }
    });
  } else {
    changes.forEach((change) => {
      if (change.added) {
        change.value.split("\n").forEach((line) => {
          diffString += `++ ${line}\n`;
        });
      } else if (change.removed) {
        change.value.split("\n").forEach((line) => {
          diffString += `-- ${line}\n`;
        });
      } else {
        change.value.split("\n").forEach((line) => {
          diffString += `   ${line}\n`;
        });
      }
    });
  }

  return diffString;
}

export function getMostRecentUserMessage(messages: Array<MyUIMessage>) {
  return messages.filter((message) => message.role === "user").at(-1);
}

export function getMessagesAfterLastStart(messages: Array<MyUIMessage>) {
  const lastStartIndex = messages
    .map((msg, index) => (msg.metadata?.isStartMessage ? index : -1))
    .filter((index) => index !== -1)
    .pop();

  return lastStartIndex !== undefined
    ? messages.slice(lastStartIndex)
    : messages;
}

export function prepareRequestBody(options: {
  messages: Array<MyUIMessage>;
  body?: object;
}) {
  return {
    messages: getMessagesAfterLastStart(options.messages),
    ...options.body,
  };
}
