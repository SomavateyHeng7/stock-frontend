// src/app/api/integrations/telegram/init/route.ts
//
// Called by the frontend when the user opens the linking step.
// Returns a one-time token + the exact Telegram deep-link URL to open.

import { NextResponse } from "next/server";
import { createLinkToken } from "../store";

const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME ?? "somatechtestbot";

export async function POST() {
  const token = createLinkToken();
  const botUrl = `https://t.me/${BOT_USERNAME}?start=${token}`;
  return NextResponse.json({ token, botUrl });
}