// src/app/api/integrations/telegram/status/route.ts

import { NextRequest, NextResponse } from "next/server";
import { consumeLinkToken } from "../store";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { error: "token query param is required" },
      { status: 400 },
    );
  }

  const chatId = consumeLinkToken(token);

  if (!chatId) {
    return NextResponse.json({ status: "waiting" });
  }

  return NextResponse.json({ status: "connected", chatId });
}