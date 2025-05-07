import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"


const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)'])


export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {

    const session = await auth.protect()

    // user is authenticated, let them proceed
    if (session) return NextResponse.next()

    // not authenticated, redirect to login or landing
    return NextResponse.redirect(new URL('/auth/sign-in', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}