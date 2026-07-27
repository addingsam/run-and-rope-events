export const SITE_URL = "https://jackpotandrodeoevents.com";

export const STATIC_PUBLIC_ROUTES = [
  { path: "/", changeFrequency: "daily" as const, priority: 1 },
  { path: "/events", changeFrequency: "daily" as const, priority: 0.9 },
  { path: "/submit", changeFrequency: "monthly" as const, priority: 0.8 },
  { path: "/subscribe", changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "/contact", changeFrequency: "yearly" as const, priority: 0.6 },
];

export const ROBOTS_DISALLOW_PATHS = [
  "/admin",
  "/dashboard",
  "/login",
  "/signup",
  "/sign-in",
  "/sign-up",
  "/subscription",
  "/subscribe/success",
  "/api/",
];
