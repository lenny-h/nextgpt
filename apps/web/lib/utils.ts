import { type FrontendFilter } from "@/types/filter";
import { type Filter } from "@workspace/api-routes/schemas/filter-schema";
import { type PracticeFilter } from "@workspace/api-routes/schemas/practice-filter-schema";
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

export function getLastStartIndex(messages: Array<MyUIMessage>) {
  const lastStartIndex = messages
    .map((msg, index) => (msg.metadata?.isStartMessage ? index : -1))
    .filter((index) => index !== -1)
    .pop();

  return lastStartIndex;
}

export function getMessagesAfterLastStart(messages: Array<MyUIMessage>) {
  const lastStartIndex = getLastStartIndex(messages);

  return lastStartIndex !== undefined
    ? messages.slice(lastStartIndex)
    : messages;
}

export function getMessageCountAfterLastStart(messages: Array<MyUIMessage>) {
  const lastStartIndex = getLastStartIndex(messages);

  if (lastStartIndex !== undefined) {
    const count = messages.length - lastStartIndex;
    return count;
  }

  return messages.length;
}

export function stripFilter(
  filter: FrontendFilter,
  includePageRanges: false,
): Filter;
export function stripFilter(
  filter: FrontendFilter,
  includePageRanges: true,
  studyMode: string,
): PracticeFilter;
export function stripFilter(
  filter: FrontendFilter,
  includePageRanges: boolean,
  studyMode?: string,
): Filter | PracticeFilter {
  const baseFilter = {
    ...filter,
    courses: filter.courses.map((c) => ({
      id: c.id,
    })),
    files: filter.files.map((f) => ({
      id: f.id,
      ...(includePageRanges && f.pageRange ? { pageRange: f.pageRange } : {}),
    })),
    documents: filter.documents.map((doc) => ({ id: doc.id })),
    prompts: filter.prompts.map((p) => ({ id: p.id })),
  };

  if (includePageRanges && studyMode) {
    return {
      ...baseFilter,
      studyMode,
    } as PracticeFilter;
  }

  return baseFilter;
}
