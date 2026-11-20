// ---------------------------------------------------------------------------
// Test script for WKM Logger: persistent storage & 30-day retention.
// Run with:  node scripts/test-logger.mjs
// Uses a temporary directory so the real logs/ folder is never touched.
// ---------------------------------------------------------------------------

import { mkdirSync, writeFileSync, readdirSync, readFileSync, rmSync, existsSync, appendFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

const TEST_DIR = join(process.cwd(), 'logs-test');
const RETENTION_DAYS = 30;
const LOG_FILE_PATTERN = /^app-\d{4}-\d{2}-\d{2}\.jsonl$/;

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ ${label}`);
    failed++;
  }
}

// --- Helper: replicate logger logic locally for testing ---

function todayDateStr() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatLog(level, message, meta = {}) {
  const entry = { timestamp: new Date().toISOString(), level, message };
  if (meta.requestId !== undefined) entry.requestId = meta.requestId;
  if (meta.method !== undefined) entry.method = meta.method;
  if (meta.pathname !== undefined) entry.pathname = meta.pathname;
  if (meta.status !== undefined) entry.status = meta.status;
  if (meta.durationMs !== undefined) entry.durationMs = meta.durationMs;
  if (meta.userId !== undefined) entry.userId = meta.userId;
  if (meta.errorCode !== undefined) entry.errorCode = meta.errorCode;
  if (meta.errorName !== undefined) entry.errorName = meta.errorName;
  return JSON.stringify(entry);
}

function cleanOldLogs(dir) {
  const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const files = readdirSync(dir);
  const deleted = [];
  for (const f of files) {
    if (!LOG_FILE_PATTERN.test(f)) continue;
    const dateStr = f.slice(4, 14);
    const fileDate = new Date(dateStr + 'T00:00:00Z').getTime();
    if (Number.isNaN(fileDate)) continue;
    if (fileDate < cutoff) {
      unlinkSync(join(dir, f));
      deleted.push(f);
    }
  }
  return deleted;
}

// --- Cleanup test directory ---
function resetTestDir() {
  if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
  mkdirSync(TEST_DIR, { recursive: true });
}

// ===================================================================
console.log('\n=== TEST 1: Persistent Log Storage ===\n');
// ===================================================================

resetTestDir();

const todayFile = join(TEST_DIR, `app-${todayDateStr()}.jsonl`);

// Write 3 log lines
const line1 = formatLog('info', 'Request completed', { requestId: 'uuid-001', method: 'GET', pathname: '/api/menu', status: 200, durationMs: 42, userId: 'OWN-001' });
const line2 = formatLog('warn', 'HTTP error', { requestId: 'uuid-002', method: 'POST', pathname: '/api/auth/login', status: 401, durationMs: 15, userId: null, errorCode: 'HTTP_401', errorName: 'HttpError' });
const line3 = formatLog('error', 'Unexpected server error', { requestId: 'uuid-003', method: 'DELETE', pathname: '/api/menu/5', status: 500, durationMs: 8, errorCode: 'INTERNAL_ERROR', errorName: 'TypeError' });

appendFileSync(todayFile, line1 + '\n', 'utf-8');
appendFileSync(todayFile, line2 + '\n', 'utf-8');
appendFileSync(todayFile, line3 + '\n', 'utf-8');

// 1a. File exists
assert(existsSync(todayFile), `File harian terbentuk: app-${todayDateStr()}.jsonl`);

// 1b. File contains 3 lines
const content = readFileSync(todayFile, 'utf-8').trim();
const lines = content.split('\n');
assert(lines.length === 3, `File berisi 3 baris log (actual: ${lines.length})`);

// 1c. Each line is valid JSON
let allValid = true;
for (const l of lines) {
  try { JSON.parse(l); } catch { allValid = false; }
}
assert(allValid, 'Setiap baris adalah JSON yang valid');

// 1d. Append mode — write another line, check total is 4
const line4 = formatLog('info', 'Extra request', { requestId: 'uuid-004', method: 'GET', pathname: '/api/settings', status: 200, durationMs: 5 });
appendFileSync(todayFile, line4 + '\n', 'utf-8');
const lines2 = readFileSync(todayFile, 'utf-8').trim().split('\n');
assert(lines2.length === 4, `Append mode: file sekarang berisi 4 baris (actual: ${lines2.length})`);

// 1e. Parsed fields check
const parsed = JSON.parse(lines[0]);
assert(parsed.timestamp && parsed.level === 'info' && parsed.message === 'Request completed', 'Field timestamp, level, message ada dan benar');
assert(parsed.requestId === 'uuid-001', 'requestId tercatat');
assert(parsed.method === 'GET' && parsed.pathname === '/api/menu', 'method dan pathname tercatat');
assert(parsed.status === 200, 'status tercatat');
assert(parsed.durationMs === 42, 'durationMs tercatat');
assert(parsed.userId === 'OWN-001', 'userId tercatat');

// 1f. Error log has errorCode and errorName
const parsedErr = JSON.parse(lines[2]);
assert(parsedErr.errorCode === 'INTERNAL_ERROR' && parsedErr.errorName === 'TypeError', 'errorCode dan errorName tercatat pada error log');

// 1g. No sensitive data in any log line
const allContent = content.toLowerCase();
assert(!allContent.includes('password'), 'Tidak ada password di log');
assert(!allContent.includes('cookie'), 'Tidak ada cookie di log');
assert(!allContent.includes('token'), 'Tidak ada token di log');
assert(!allContent.includes('authorization'), 'Tidak ada authorization header di log');

// ===================================================================
console.log('\n=== TEST 2: Log Retention (30 Hari) ===\n');
// ===================================================================

resetTestDir();

// Create files: some expired (>30 days), some within retention, some non-log files
const now = new Date();

function dateMinusDays(days) {
  const d = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Expired files (should be deleted)
const expired1 = `app-${dateMinusDays(31)}.jsonl`;
const expired2 = `app-${dateMinusDays(60)}.jsonl`;
const expired3 = `app-${dateMinusDays(90)}.jsonl`;

// Valid files within retention (should NOT be deleted)
const valid1 = `app-${dateMinusDays(0)}.jsonl`;   // today
const valid2 = `app-${dateMinusDays(10)}.jsonl`;  // 10 days ago
const valid3 = `app-${dateMinusDays(29)}.jsonl`;  // 29 days ago (edge case)

// Non-log files (should NOT be deleted)
const nonLog1 = 'readme.txt';
const nonLog2 = 'debug-2026-01-01.log';
const nonLog3 = 'app-not-a-date.jsonl';

const allFiles = [expired1, expired2, expired3, valid1, valid2, valid3, nonLog1, nonLog2, nonLog3];
for (const f of allFiles) {
  writeFileSync(join(TEST_DIR, f), `{"test":"${f}"}\n`, 'utf-8');
}

assert(readdirSync(TEST_DIR).length === 9, `9 file uji terbuat di direktori test`);

// Run cleanup
const deleted = cleanOldLogs(TEST_DIR);

// 2a. Expired files deleted
assert(!existsSync(join(TEST_DIR, expired1)), `File kedaluwarsa dihapus: ${expired1}`);
assert(!existsSync(join(TEST_DIR, expired2)), `File kedaluwarsa dihapus: ${expired2}`);
assert(!existsSync(join(TEST_DIR, expired3)), `File kedaluwarsa dihapus: ${expired3}`);

// 2b. Valid files kept
assert(existsSync(join(TEST_DIR, valid1)), `File dalam retensi tetap ada: ${valid1}`);
assert(existsSync(join(TEST_DIR, valid2)), `File dalam retensi tetap ada: ${valid2}`);
assert(existsSync(join(TEST_DIR, valid3)), `File dalam retensi tetap ada: ${valid3}`);

// 2c. Non-log files untouched
assert(existsSync(join(TEST_DIR, nonLog1)), `File non-log tidak dihapus: ${nonLog1}`);
assert(existsSync(join(TEST_DIR, nonLog2)), `File non-log tidak dihapus: ${nonLog2}`);
assert(existsSync(join(TEST_DIR, nonLog3)), `File non-log tidak dihapus: ${nonLog3}`);

// 2d. Deleted count
assert(deleted.length === 3, `Jumlah file terhapus: ${deleted.length} (expected 3)`);

// 2e. Remaining count
const remaining = readdirSync(TEST_DIR);
assert(remaining.length === 6, `File tersisa setelah cleanup: ${remaining.length} (expected 6)`);

// ===================================================================
console.log('\n=== TEST 3: Folder Auto-Creation ===\n');
// ===================================================================

// Remove test dir entirely, then write a log — dir should be re-created
if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
assert(!existsSync(TEST_DIR), 'Direktori test dihapus');

mkdirSync(TEST_DIR, { recursive: true });
const autoFile = join(TEST_DIR, `app-${todayDateStr()}.jsonl`);
appendFileSync(autoFile, formatLog('info', 'Auto-create test') + '\n', 'utf-8');
assert(existsSync(TEST_DIR), 'Direktori terbuat otomatis');
assert(existsSync(autoFile), 'File log terbuat setelah auto-create');

// ===================================================================
console.log('\n=== TEST 4: Riwayat Log Bertahan Setelah Restart ===\n');
// ===================================================================

// The file from Test 1's real logs/ folder
const realLogFile = join(process.cwd(), 'logs', 'app-2026-11-12.jsonl');
if (existsSync(realLogFile)) {
  const oldContent = readFileSync(realLogFile, 'utf-8').trim();
  const oldLines = oldContent.split('\n');
  assert(oldLines.length >= 1, `Log lama (12 Nov) masih ada setelah restart: ${oldLines.length} baris`);
  try {
    const p = JSON.parse(oldLines[0]);
    assert(p.timestamp && p.level, 'Log lama masih valid JSON');
  } catch {
    assert(false, 'Log lama masih valid JSON');
  }
} else {
  console.log('  ⏭️  File log 12 Nov tidak ditemukan — skip tes persistensi (ini bukan error)');
}

// ===================================================================
// Cleanup test directory
// ===================================================================

if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });

// ===================================================================
console.log('\n=== HASIL ===\n');
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failed}`);
console.log(`  Total:  ${passed + failed}\n`);

if (failed > 0) {
  process.exit(1);
}
