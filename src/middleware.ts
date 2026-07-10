import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { hasActiveSubscription } from "./lib/subscribers/repository";

const isEventsRoute = createRouteMatcher(["/events", "/events/(.*)"]);
const isAdminRoute = createRouteMatcher(["/admin", "/admin/(.*)"]);
const isWebhookRoute = createRouteMatcher(["/api/webhooks(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  if (isWebhookRoute(request)) {
    return;
  }

  if (isAdminRoute(request)) {
    const { userId } = await auth();

    if (!userId) {
      const redirectUrl = new URL("/sign-in", request.url);
      redirectUrl.searchParams.set("redirect_url", request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    return;
  }

  if (!isEventsRoute(request)) {
    return;
  }

  const { userId } = await auth();

  if (!userId) {
    const redirectUrl = new URL("/subscribe", request.url);
    redirectUrl.searchParams.set("from", "events");
    redirectUrl.searchParams.set("auth", "required");
    return NextResponse.redirect(redirectUrl);
  }

  const isActive = await hasActiveSubscription(userId);
  if (!isActive) {
    const redirectUrl = new URL("/subscribe", request.url);
    redirectUrl.searchParams.set("from", "events");
    redirectUrl.searchParams.set("auth", "subscribe");
    return NextResponse.redirect(redirectUrl);
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
