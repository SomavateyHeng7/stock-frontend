// src/app/api/integrations/telegram/webhook/route.ts

import { NextRequest, NextResponse } from "next/server";
import { resolveLinkToken } from "../store";

type TelegramUpdate = {
  update_id: number;
  message?: {
    chat: { id: number };
    text?: string;
  };
};

export async function POST(req: NextRequest) {
  let update: TelegramUpdate;
  try {
    update = await req.json();
  } catch {
    return NextResponse.json({ ok: true }); // always 200 to Telegram
  }

  const chatId = update.message?.chat?.id;
  const text   = update.message?.text ?? "";

  // Telegram sends deep-link as "/start <token>"
  if (chatId != null && text.startsWith("/start ")) {
    const token = text.slice(7).trim();
    if (token.length > 0) {
      const resolved = resolveLinkToken(token, String(chatId));

      if (resolved) {
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (botToken) {
          // Fire-and-forget confirmation message to the user
          fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: "✅ SmartStock linked! You will now receive inventory alerts here.",
            }),
          }).catch(() => {});
        }
      }
    }
  }

  return NextResponse.json({ ok: true });
}