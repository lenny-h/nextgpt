import { ChatHandlerFactory } from "@/src/lib/chat/index.js";
import { type Context } from "hono";

export async function POST(c: Context) {
  const handler = await ChatHandlerFactory.createPracticeChatHandler(c);
  return await handler.handleRequest();
}
