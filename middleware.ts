import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    const session = await auth()
    if (!session.userId) {
      // Signed-out visitors are sent to the sign-in page. After authenticating
      // they land on the welcome page (logo + tagline), from which they can
      // enter the app.
      return session.redirectToSignIn({ returnBackUrl: "/welcome" })
    }
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for Clerk's auto-proxy path
    '/__clerk/:path*',
    '/(api|trpc)(.*)',
  ],
  // Run middleware on the Node.js runtime instead of Edge. This avoids the
  // Vercel Edge Function analyzer rejecting Clerk's package-internal subpath
  // imports (#crypto, #safe-node-apis, @clerk/shared/*), which caused:
  //   "The Edge Function 'middleware' is referencing unsupported modules"
  // clerkMiddleware() fully supports the Node.js middleware runtime.
  runtime: "nodejs",
}