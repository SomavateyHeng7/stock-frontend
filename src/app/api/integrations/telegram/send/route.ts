import { NextResponse } from "next/server";

type TelegramPayload = {
  message?: string;
  chatId?: string;
};

export async function POST(request: Request) {
  const payload = (await request.json()) as TelegramPayload;
  const message = payload.message?.trim();
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const defaultChatId = process.env.TELEGRAM_CHAT_ID;
  const chatId = payload.chatId?.trim() || defaultChatId;

  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  if (!botToken || !chatId) {
    return NextResponse.json(
      {
        error: "Telegram integration not configured",
        details: "Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID environment variables.",
      },
      { status: 503 },
    );
  }

  const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: "HTML",
    }),
    cache: "no-store",
  });

  const data = await telegramResponse.json();

  if (!telegramResponse.ok || data?.ok === false) {
    return NextResponse.json(
      {
        error: "Telegram send failed",
        details: data?.description ?? "Unknown Telegram API error",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, telegramMessageId: data?.result?.message_id ?? null });
}
