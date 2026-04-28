// src/app/api/integrations/telegram/store.ts
//
// Token-based store — each linking session gets its own row.
// No shared slot → no cross-user race condition.

import Database from "better-sqlite3";
import { mkdirSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { randomBytes } from "crypto";

const dir = process.env.SQLITE_PATH ?? join(tmpdir(), "smartstock");
mkdirSync(dir, { recursive: true });

const db = new Database(join(dir, "tg-state.db"));
db.pragma("busy_timeout = 5000"); // retry up to 5 s before throwing SQLITE_BUSY
db.pragma("journal_mode = WAL");

db.exec(`
    CREATE TABLE IF NOT EXISTS tg_link_sessions (
                                                    token      TEXT PRIMARY KEY,
                                                    chat_id    TEXT,
                                                    created_at INTEGER NOT NULL DEFAULT (unixepoch())
        )
`);

// ── Prepared statements ──────────────────────────────────────────────────────

const _insert  = db.prepare(`INSERT INTO tg_link_sessions (token) VALUES (?)`);
const _resolve = db.prepare<[string], { chat_id: string | null }>(
  `SELECT chat_id FROM tg_link_sessions WHERE token = ?`
);
const _setChatId = db.prepare(
  `UPDATE tg_link_sessions SET chat_id = ? WHERE token = ?`
);
const _delete  = db.prepare(`DELETE FROM tg_link_sessions WHERE token = ?`);

// Purge sessions older than 10 minutes that were never completed
const _purge   = db.prepare(
  `DELETE FROM tg_link_sessions WHERE created_at < unixepoch() - 600`
);

// ── Public API ───────────────────────────────────────────────────────────────

/** Create a new session token for one linking attempt. */
export function createLinkToken(): string {
  _purge.run(); // housekeeping — remove stale sessions
  const token = randomBytes(16).toString("hex"); // 32-char URL-safe hex
  _insert.run(token);
  return token;
}

/**
 * Called by the webhook when Telegram sends `/start <token>`.
 * Associates the Telegram chat ID with the session token.
 * No-ops silently if the token is unknown or already expired.
 */
export function resolveLinkToken(token: string, chatId: string): boolean {
  const info = _setChatId.run(chatId, token);
  return info.changes > 0;
}

/**
 * Called by the status poller.
 * Returns the chatId if Telegram confirmed, null if still waiting.
 * Deletes the session on success so the token cannot be reused.
 */
export function consumeLinkToken(token: string): string | null {
  const row = _resolve.get(token);
  if (!row) return null;           // unknown token
  if (!row.chat_id) return null;   // not confirmed yet
  _delete.run(token);              // consume — one-time use
  return row.chat_id;
}