import {
  NextResponse,
  type NextFetchEvent,
  type NextRequest,
} from "next/server";
import { type CustomMiddleware } from "./stack-handler";

export function cspMiddleware(middleware: CustomMiddleware) {
  return async (request: NextRequest, event: NextFetchEvent) => {
    const env = process.env.NODE_ENV;
    const cspEndpoints = process.env.NEXT_PUBLIC_CSP_ENDPOINTS || "";

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
        frame-src 'self' blob: data: ${cspEndpoints};
        connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL} ${process.env.NEXT_PUBLIC_PDF_EXPORTER_URL} ${cspEndpoints};
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
