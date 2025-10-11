import { type UIMessagePart, type UIMessage } from "ai";
import { type MyUIDataTypes } from "./custom-ui-data-types.js";
import { type MyUIMetadata } from "./custom-ui-metadata.js";
import { type MyUITools } from "./custom-ui-tools.js";

export type MyUIMessagePart = UIMessagePart<MyUIDataTypes, MyUITools>;
export type MyUIMessage = UIMessage<MyUIMetadata, MyUIDataTypes, MyUITools>;
