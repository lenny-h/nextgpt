// import { type DocumentSource } from "@workspace/api-routes/types/document-source.js";
// import { type WebSource } from "@workspace/api-routes/types/web-source.js";
// import { createLogger } from "@workspace/server/logger.js";
// import { type TextStreamPart, type ToolSet } from "ai";

// const logger = createLogger("stream-transformer");

// export const removeServerOnlyContent =
//   <TOOLS extends ToolSet>() =>
//     () =>
//       new TransformStream<TextStreamPart<TOOLS>, TextStreamPart<TOOLS>>({
//         transform(chunk, controller) {
//           // Only modify tool-result chunks
//           if (chunk.type === "tool-result" && !chunk.dynamic) {
//             logger.debug("Modifying tool result", chunk);

//             const toolName = chunk.toolName;
//             let modifiedResult = chunk.output;

//             // Truncate searchDocuments results
//             if (toolName === "searchDocuments" && modifiedResult?.docSources) {
//               modifiedResult = {
//                 ...modifiedResult,
//                 docSources: modifiedResult.docSources.map(
//                   (source: DocumentSource) => ({
//                     ...source,
//                     pageContent: source.pageContent
//                       ? source.pageContent.substring(0, 60) +
//                       (source.pageContent.length > 60 ? "..." : "")
//                       : source.pageContent,
//                   })
//                 ),
//               };
//             }

//             // Truncate searchWeb results
//             if (toolName === "searchWeb" && modifiedResult?.webSources) {
//               modifiedResult = {
//                 ...modifiedResult,
//                 webSources: modifiedResult.webSources.map(
//                   (source: WebSource) => ({
//                     ...source,
//                     markdown: source.markdown
//                       ? source.markdown.substring(0, 60) +
//                       (source.markdown.length > 60 ? "..." : "")
//                       : source.markdown,
//                   })
//                 ),
//               };
//             }

//             // Truncate scrapeUrl results
//             if (toolName === "scrapeUrl" && modifiedResult?.markdown) {
//               modifiedResult = {
//                 ...modifiedResult,
//                 markdown:
//                   modifiedResult.markdown.substring(0, 60) +
//                   (modifiedResult.markdown.length > 60 ? "..." : ""),
//               };
//             }

//             logger.debug("Modified result", modifiedResult);

//             // Enqueue the modified chunk
//             controller.enqueue({
//               ...chunk,
//               result: modifiedResult,
//             });
//             return;
//           }

//           // Pass through all other chunks unchanged
//           controller.enqueue(chunk);
//         },
//       });
