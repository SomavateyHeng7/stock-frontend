// src/hooks/use-telegram-link.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Phase = "idle" | "waiting" | "connected" | "error";

type UseTelegramLinkResult = {
  phase: Phase;
  chatId: string | null;
  botUrl: string | null;
  activate: () => Promise<void>;
  stop: () => void;
};

export function useTelegramLink(intervalMs = 2000): UseTelegramLinkResult {
  const [phase, setPhase]   = useState<Phase>("idle");
  const [chatId, setChatId] = useState<string | null>(null);
  const [botUrl, setBotUrl] = useState<string | null>(null);
  const tokenRef            = useRef<string | null>(null);
  const timerRef            = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (timerRef.current != null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const poll = useCallback(async () => {
    const token = tokenRef.current;
    if (!token) return;

    try {
      const res  = await fetch(`/api/integrations/telegram/status?token=${token}`);
      const data = await res.json() as { status: string; chatId?: string };

      if (data.status === "connected" && data.chatId) {
        setChatId(data.chatId);
        setPhase("connected");
        stopPolling();
      }
    } catch {
      setPhase("error");
    }
  }, []);

  const activate = useCallback(async () => {
    if (phase === "waiting" || phase === "connected") return;

    try {
      // 1. Mint a session-scoped token + get the exact deep-link URL
      const res  = await fetch("/api/integrations/telegram/init", { method: "POST" });
      const data = await res.json() as { token: string; botUrl: string };

      tokenRef.current = data.token;
      setBotUrl(data.botUrl);
      setPhase("waiting");

      // 2. Open Telegram with the token embedded in the start payload
      window.open(data.botUrl, "_blank");

      // 3. Start polling for this specific token
      poll();
      timerRef.current = setInterval(poll, intervalMs);
    } catch {
      setPhase("error");
    }
  }, [phase, poll, intervalMs]);

  useEffect(() => () => stopPolling(), []);

  return { phase, chatId, botUrl, activate, stop: stopPolling };
}