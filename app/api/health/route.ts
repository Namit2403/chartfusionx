import { NextResponse } from "next/server";

import { checkDatabase } from "@/lib/db";

export async function GET() {
  const database = await checkDatabase();

  return NextResponse.json({
    ok: true,
    service: "commercepilot",
    database,
    timestamp: new Date().toISOString(),
  });
}
