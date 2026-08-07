import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/welcome(.*)",
  "/",
]);

export default clerkMiddleware(async (auth, req) => {
  // Allow public routes through without authentication
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Protect all other routes — unauthenticated users are redirected to sign-in
  const { userId, redirectToSignIn } = await auth();
  if (!userId) {
    return redirectToSignIn({ returnBackUrl: req.url });
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static  (static files)
     * - _next/image   (image optimization)
     * - favicon.ico, logo.png, and other static assets
     * - public folder assets
     */
    "/((?!_next/static|_next/image|favicon\\.ico|logo\\.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|woff2?|ttf)).*)",
    "/(api|trpc)(.*)",
  ],
};