import { readNotificationSettings } from "@/lib/notification-settings";

export async function sendTelegramAlert(message: string): Promise<void> {
  const settings = readNotificationSettings();

  if (!settings.enabled || !settings.telegramChatId) return; // silently skip if not linked

  await fetch("/api/integrations/telegram/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, chatId: settings.telegramChatId }),
  });
}