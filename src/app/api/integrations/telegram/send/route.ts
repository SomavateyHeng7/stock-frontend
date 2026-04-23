import { NextRequest, NextResponse } from "next/server";

type SendRequestBody = {
    message: string;
    chatId?: string;
};

type TelegramApiResponse = {
    ok: boolean;
    description?: string;
};

export async function POST(request: NextRequest) {
    // ── 1. Parse + validate request body ──────────────────────────────
    let body: SendRequestBody;
    try {
        body = (await request.json()) as SendRequestBody;
    } catch {
        return NextResponse.json({ details: "Invalid JSON body." }, { status: 400 });
    }

    const { message, chatId: bodyChatId } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
        return NextResponse.json({ details: "message is required and must be a non-empty string." }, { status: 400 });
    }

    // ── 2. Resolve credentials ─────────────────────────────────────────
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = bodyChatId ?? process.env.TELEGRAM_CHAT_ID;

    if (!botToken) {
        return NextResponse.json(
            { details: "TELEGRAM_BOT_TOKEN is not configured. Add it to your .env.local file." },
            { status: 503 },
        );
    }

    if (!chatId) {
        return NextResponse.json(
            {
                details:
                    "No Telegram chat ID found. Either set TELEGRAM_CHAT_ID in .env.local, or pass chatId in the request body. To find your chat ID, message @userinfobot on Telegram.",
            },
            { status: 503 },
        );
    }

    // ── 3. Call Telegram Bot API ───────────────────────────────────────
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

    let telegramResponse: Response;
    try {
        telegramResponse = await fetch(telegramUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: "HTML",
            }),
        });
    } catch (error) {
        const reason = error instanceof Error ? error.message : "Network error reaching Telegram API.";
        return NextResponse.json({ details: `Telegram API unreachable: ${reason}` }, { status: 502 });
    }

    // ── 4. Forward Telegram errors ────────────────────────────────────
    let telegramPayload: TelegramApiResponse;
    try {
        telegramPayload = (await telegramResponse.json()) as TelegramApiResponse;
    } catch {
        return NextResponse.json(
            { details: `Telegram returned an unreadable response (HTTP ${telegramResponse.status}).` },
            { status: 502 },
        );
    }

    if (!telegramPayload.ok) {
        return NextResponse.json(
            {
                details: telegramPayload.description ?? "Telegram rejected the message. Check your bot token and chat ID.",
            },
            { status: 400 },
        );
    }

    // ── 5. Success ─────────────────────────────────────────────────────
    return NextResponse.json({ ok: true });
}