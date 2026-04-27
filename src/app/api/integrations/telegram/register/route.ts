import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "TELEGRAM_BOT_TOKEN env var is not set" },
      { status: 500 },
    );
  }

  const { baseUrl } = await req.json() as { baseUrl?: string };
  if (!baseUrl) {
    return NextResponse.json(
      { ok: false, error: "body must contain { baseUrl: string }" },
      { status: 400 },
    );
  }

  const webhookUrl = `${baseUrl.replace(/\/$/, "")}/api/integrations/telegram/webhook`;

  const tgRes = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: webhookUrl }),
  });

  const tgBody = await tgRes.json();
  return NextResponse.json({ ok: tgBody.ok, webhookUrl, telegram: tgBody });
}