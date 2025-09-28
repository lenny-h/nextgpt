import {
  NextResponse,
  type NextFetchEvent,
  type NextRequest,
} from "next/server";
import { type CustomMiddleware } from "./stack-handler.js";

export function cspMiddleware(middleware: CustomMiddleware) {
  return async (request: NextRequest, event: NextFetchEvent) => {
    const env = process.env.NODE_ENV;

    const cloudflareConnectionUrl = `https://${
      process.env.NEXT_PUBLIC_GOOGLE_VERTEX_PROJECT
    }-files-bucket.${process.env.NEXT_PUBLIC_R2_ENDPOINT!.replace(/^https?:\/\//, "")}`;

    const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
    const cspHeader = `
        default-src 'self';
        script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline'${
          env === "development" ? " 'unsafe-eval'" : ""
        } https: http:;
        style-src 'self' 'unsafe-inline';
        img-src 'self';
        font-src 'self';
        object-src 'self';
        frame-src 'self';
        connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL} ${process.env.NEXT_PUBLIC_PDF_EXPORTER_URL} ${process.env.NEXT_PUBLIC_SUPABASE_URL} ${cloudflareConnectionUrl} ${process.env.NEXT_PUBLIC_GOOGLE_STORAGE_URL};
        base-uri 'self';
        form-action 'self';
        frame-ancestors 'self';
        upgrade-insecure-requests;
    `;

    // Replace newline characters and spaces
    const contentSecurityPolicyHeaderValue = cspHeader
      .replace(/\s{2,}/g, " ")
      .trim();

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-nonce", nonce);

    requestHeaders.set(
      "Content-Security-Policy",
      contentSecurityPolicyHeaderValue
    );

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    response.headers.set(
      "Content-Security-Policy",
      contentSecurityPolicyHeaderValue
    );

    return middleware(request, event, response);
  };
}
