export function verifyCronRequest(request: Request) {
  if (request.headers.get("x-vercel-cron") === "1") {
    return true;
  }

  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return false;
  }

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}
