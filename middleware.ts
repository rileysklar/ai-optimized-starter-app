import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

// Create a matcher for routes that should be protected
const isProtectedRoute = createRouteMatcher([
  "/manufacturing(.*)",
  "/dashboard(.*)",
  "/settings(.*)"
])

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()
  
  // If the route is protected and the user is not signed in, redirect to sign-in
  if (isProtectedRoute(req) && !userId) {
    const signInUrl = new URL("/sign-in", req.url)
    signInUrl.searchParams.set("redirect_url", req.url)
    return NextResponse.redirect(signInUrl)
  }
  
  return NextResponse.next()
})

// Export config to match all routes
export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"]
}
