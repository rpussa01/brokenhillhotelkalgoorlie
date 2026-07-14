import { NextResponse } from "next/server";
import { createAdminSession } from "@/lib/auth";

export async function POST(request: Request) {
  const { pin } = await request.json();
  if (!process.env.ADMIN_PIN || pin !== process.env.ADMIN_PIN) return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
  await createAdminSession();
  return NextResponse.json({ ok: true });
}
