export function verifyCronRequest(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return false;
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) {
    return true;
  }

  return request.headers.get("x-vercel-cron") === "1";
}
