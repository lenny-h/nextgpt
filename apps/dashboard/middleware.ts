import { cspMiddleware } from "@/middleware/csp-header";
import { negotiatorMiddleware } from "@/middleware/negogiator";
import { stackHandler } from "@/middleware/stack-handler";

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - sitemap.txt (sitemap files)
     * - robots.txt (robots.txt file)
     * - apple-touch-icon.png (apple touch icon)
     * - android-chrome-192x192.png (android chrome icon)
     */
    {
      source:
        "/((?!api|_next/static|_next/image|auth|robots|sitemap|favicon|apple-touch-icon|android-chrome-192x192).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};

export default stackHandler([cspMiddleware, negotiatorMiddleware]);
