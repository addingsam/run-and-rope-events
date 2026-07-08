import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const formData = await request.formData();

  const payload = Object.fromEntries(formData.entries());

  // Placeholder until persistence is wired up.
  console.log("Event submission received:", payload);

  return NextResponse.json({ success: true });
}
