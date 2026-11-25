# Logging Documentation

## Overview
The WKM backend (Express, `backend/`) includes a **custom structured logger** (`backend/src/utils/logger.ts`).  It records every API request and error in **JSON Lines (JSONL)** format, both to the console and to a daily log file under `backend/logs/`.

## Log File Layout
- Location: `backend/logs/` (the folder the backend is started from)
- Filename pattern: `app-YYYY-MM-DD.jsonl` (e.g. `app-2026-11-19.jsonl`)
- One JSON object per line.

### Example Log Entry
```json
{
  "timestamp": "2026-11-19T07:45:12.345Z",
  "level": "info",
  "message": "Request completed",
  "requestId": "5a1b2c3d-4e5f-6789-1234-abcdef987654",
  "method": "GET",
  "pathname": "/api/menu",
  "status": 200,
  "durationMs": 42,
  "userId": "OWN-001",
  "errorCode": null,
  "errorName": null
}
```
*Only the fields listed in `LogMeta` are ever written – no passwords, tokens, cookies, request bodies, or other sensitive data.*

## Fields (`LogMeta`)
| Field | Description |
|-------|-------------|
| `requestId` | UUID generated per request (`crypto.randomUUID()`). Also sent back to the client in `X-Request-Id` header. |
| `method` | HTTP method (GET, POST, …). |
| `pathname` | URL path **without** query string. |
| `status` | HTTP response status code. |
| `durationMs` | Time taken to handle the request (ms). |
| `userId` | Identifier of the authenticated user (`null` if unauthenticated). |
| `errorCode` | Short machine‑readable code for errors (e.g. `HTTP_401`, `DB_CONNECTION`). |
| `errorName` | JavaScript error name (`HttpError`, `TypeError`, …). |

## Logging Levels
- **info** – successful request.
- **warn** – client‑side or HTTP errors (e.g. 401/403).  No stack trace is recorded.
- **error** – server‑side failures (500, database connection, unexpected exceptions).

## Retention Policy
- Logs are kept for **30 days**.
- On each request the logger runs a **daily cleanup** (once per calendar day) that deletes any `app-*.jsonl` file older than the retention period.
- Non‑log files or files that do not match the pattern are never removed.

## How It Works
1. **Request entry** – a middleware in `backend/src/server.ts` generates a UUID, sets the `X-Request-Id` response header and starts a timer.
2. **Response finished** – when the response is sent, the same middleware logs it: `logInfo` for 2xx/3xx, `logWarn` for 4xx, `logError` for 5xx.
3. **Error handling** – controllers throw `HttpError` (or any error); the error handler at the end of `server.ts` turns it into a JSON `{ error }` response and records the error code for the log line.
4. **File writing** – `logger.ts` ensures the `logs/` directory exists, appends a line to the current day’s file, and triggers retention cleanup.

## Viewing Logs (PowerShell)
```powershell
# Show today’s log (most recent entries first)
Get-Content backend/logs/app-$(Get-Date -Format yyyy-MM-dd).jsonl | Sort-Object -Descending

# Filter for errors
Get-Content backend/logs/app-2026-11-19.jsonl | ConvertFrom-Json | Where-Object {$_.level -eq 'error'}
```

## Running Tests
The repository includes a self‑contained test script:
```bash
cd backend
npm run test:logger
```
It validates:
- Daily file creation and append‑only behavior.
- Correct JSON schema and allow‑list enforcement.
- 30‑day retention (only old `app-*.jsonl` files are removed).
- Automatic folder recreation.
All 30 assertions currently pass.

## Adding New Log Calls
When you need to log additional information inside a controller, import the logger functions:
```ts
import { logInfo, logWarn, logError } from '../utils/logger.js';
```
Pass a `LogMeta` object containing **only** the allow‑listed keys.

## Security Note
The logger **never** logs raw error messages, request bodies, cookies, authentication tokens, or any credential information.  Any additional data must be explicitly whitelisted in `LogMeta` before it can be recorded.

---
*Created by Antigravity agent as part of the WKM logging implementation.*