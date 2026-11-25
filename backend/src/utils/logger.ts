import { mkdirSync, readdirSync, unlinkSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';

// ---------------------------------------------------------------------------
// Centralized logger for the WKM backend API.
// No external dependencies – uses Node built-ins only.
//
// Features:
//   - JSONL format (one JSON object per line).
//   - Output to both terminal (console) and daily log files.
//   - Automatic log directory creation.
//   - 30-day log retention with automatic cleanup (runs once per day).
//   - Allowlist-only metadata (no sensitive data).
// ---------------------------------------------------------------------------

// Allowed metadata fields (allowlist). Only these keys are written to logs.
export interface LogMeta {
  requestId?: string;
  method?: string;
  pathname?: string;
  status?: number;
  durationMs?: number;
  userId?: string | null;
  errorCode?: string;
  errorName?: string;
}

// ---------------------------------------------------------------------------
// Log directory & file management
// ---------------------------------------------------------------------------

const LOG_DIR = join(process.cwd(), 'logs');
const RETENTION_DAYS = 30;
const LOG_FILE_PATTERN = /^app-\d{4}-\d{2}-\d{2}\.jsonl$/;

/** Ensure the logs/ directory exists. Called lazily on first write. */
let dirReady = false;
const ensureLogDir = (): void => {
  if (dirReady) return;
  try {
    mkdirSync(LOG_DIR, { recursive: true });
    dirReady = true;
  } catch {
    // If creation fails (e.g. read-only FS), logs still go to terminal.
  }
};

/** Return the log file path for today, e.g. `logs/app-2026-11-19.jsonl`. */
const todayLogFile = (): string => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return join(LOG_DIR, `app-${yyyy}-${mm}-${dd}.jsonl`);
};

// ---------------------------------------------------------------------------
// Log retention — delete files older than RETENTION_DAYS.
// Runs at most once per calendar day so it stays active during long-lived
// dev-server sessions without impacting every single request.
// ---------------------------------------------------------------------------

let lastCleanupDate = '';

const cleanOldLogs = (): void => {
  // Determine today's date string (YYYY-MM-DD).
  const today = new Date().toISOString().slice(0, 10);
  if (lastCleanupDate === today) return; // Already ran today.
  lastCleanupDate = today;

  try {
    const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
    const files = readdirSync(LOG_DIR);
    for (const f of files) {
      // Only touch files matching our naming pattern.
      if (!LOG_FILE_PATTERN.test(f)) continue;
      // Extract date from filename: app-YYYY-MM-DD.jsonl
      const dateStr = f.slice(4, 14); // "YYYY-MM-DD"
      const fileDate = new Date(dateStr + 'T00:00:00Z').getTime();
      if (Number.isNaN(fileDate)) continue;
      if (fileDate < cutoff) {
        try {
          unlinkSync(join(LOG_DIR, f));
        } catch {
          // Best-effort: ignore individual file deletion errors.
        }
      }
    }
  } catch {
    // Ignore errors – retention is best-effort.
  }
};

// ---------------------------------------------------------------------------
// Core formatting & writing
// ---------------------------------------------------------------------------

const writeToFile = (line: string): void => {
  ensureLogDir();
  try {
    appendFileSync(todayLogFile(), line + '\n', 'utf-8');
  } catch {
    // If file write fails, log still went to console.
  }
  // Trigger retention cleanup (runs at most once per day).
  cleanOldLogs();
};

const formatLog = (
  level: 'info' | 'warn' | 'error',
  message: string,
  meta: LogMeta = {},
): string => {
  const entry: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    level,
    message,
  };
  // Only include allowlisted keys that are actually provided.
  if (meta.requestId !== undefined) entry.requestId = meta.requestId;
  if (meta.method !== undefined) entry.method = meta.method;
  if (meta.pathname !== undefined) entry.pathname = meta.pathname;
  if (meta.status !== undefined) entry.status = meta.status;
  if (meta.durationMs !== undefined) entry.durationMs = meta.durationMs;
  if (meta.userId !== undefined) entry.userId = meta.userId;
  if (meta.errorCode !== undefined) entry.errorCode = meta.errorCode;
  if (meta.errorName !== undefined) entry.errorName = meta.errorName;
  return JSON.stringify(entry);
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const logInfo = (message: string, meta: LogMeta = {}): void => {
  const line = formatLog('info', message, meta);
  console.log(line);
  writeToFile(line);
};

export const logWarn = (message: string, meta: LogMeta = {}): void => {
  const line = formatLog('warn', message, meta);
  console.warn(line);
  writeToFile(line);
};

export const logError = (message: string, meta: LogMeta = {}): void => {
  const line = formatLog('error', message, meta);
  console.error(line);
  writeToFile(line);
};
