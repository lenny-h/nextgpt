import { type Context } from "hono";
import { ChatHandlerFactory } from "../../../lib/chat/index.js";

export async function POST(c: Context) {
  const handler = await ChatHandlerFactory.createPracticeChatHandler(c);
  return await handler.handleRequest();
}
