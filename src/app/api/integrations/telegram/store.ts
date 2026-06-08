// src/app/api/integrations/telegram/store.ts
//
// Token-based store — each linking session gets its own row.
// No shared slot → no cross-user race condition.

import Database from "better-sqlite3";
import { mkdirSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { randomBytes } from "crypto";

let _db: ReturnType<typeof Database> | null = null;
let _insert: any = null;
let _resolve: any = null;
let _setChatId: any = null;
let _delete: any = null;
let _purge: any = null;

function getDbAndStatements() {
  if (!_db) {
    const dir = process.env.SQLITE_PATH ?? join(tmpdir(), "smartstock");
    mkdirSync(dir, { recursive: true });
    
    _db = new Database(join(dir, "tg-state.db"));
    _db.pragma("busy_timeout = 5000"); // retry up to 5 s before throwing SQLITE_BUSY
    _db.pragma("journal_mode = WAL");
    
    _db.exec(`
        CREATE TABLE IF NOT EXISTS tg_link_sessions (
            token      TEXT PRIMARY KEY,
            chat_id    TEXT,
            created_at INTEGER NOT NULL DEFAULT (unixepoch())
        )
    `);
    
    _insert = _db.prepare(`INSERT INTO tg_link_sessions (token) VALUES (?)`);
    _resolve = _db.prepare(`SELECT chat_id FROM tg_link_sessions WHERE token = ?`);
    _setChatId = _db.prepare(`UPDATE tg_link_sessions SET chat_id = ? WHERE token = ?`);
    _delete = _db.prepare(`DELETE FROM tg_link_sessions WHERE token = ?`);
    _purge = _db.prepare(`DELETE FROM tg_link_sessions WHERE created_at < unixepoch() - 600`);
  }
  
  return {
    insert: _insert,
    resolve: _resolve,
    setChatId: _setChatId,
    del: _delete,
    purge: _purge,
  };
}

// ── Public API ───────────────────────────────────────────────────────────────

/** Create a new session token for one linking attempt. */
export function createLinkToken(): string {
  const stmts = getDbAndStatements();
  stmts.purge.run(); // housekeeping — remove stale sessions
  const token = randomBytes(16).toString("hex"); // 32-char URL-safe hex
  stmts.insert.run(token);
  return token;
}

/**
 * Called by the webhook when Telegram sends `/start <token>`.
 * Associates the Telegram chat ID with the session token.
 * No-ops silently if the token is unknown or already expired.
 */
export function resolveLinkToken(token: string, chatId: string): boolean {
  const stmts = getDbAndStatements();
  const info = stmts.setChatId.run(chatId, token);
  return info.changes > 0;
}

/**
 * Called by the status poller.
 * Returns the chatId if Telegram confirmed, null if still waiting.
 * Deletes the session on success so the token cannot be reused.
 */
export function consumeLinkToken(token: string): string | null {
  const stmts = getDbAndStatements();
  const row = stmts.resolve.get(token) as { chat_id: string | null } | undefined;
  if (!row) return null;           // unknown token
  if (!row.chat_id) return null;   // not confirmed yet
  stmts.del.run(token);              // consume — one-time use
  return row.chat_id;
}