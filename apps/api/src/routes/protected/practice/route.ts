import { ChatHandlerFactory } from "@/src/lib/chat/index.js";
import { Hono } from "hono";

const app = new Hono().post("/", async (c) => {
  const handler = await ChatHandlerFactory.createPracticeChatHandler(c);
  return await handler.handleRequest();
});

export default app;
