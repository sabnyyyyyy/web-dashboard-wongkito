# Warkop Wong Kito — Web Dashboard

## Project Overview

Frontend dashboard untuk mengelola operasional harian Warkop Wong Kito: kasir/POS, pesanan, menu, stok, tim, absensi, riwayat transaksi, dan pengaturan toko. Aplikasi ini berbicara dengan backend Express melalui API dan menyimpan sesi menggunakan cookie httpOnly.

## Tech Stack

| Kategori | Yang digunakan |
|---|---|
| Framework | Next.js 16.3.8 (App Router) |
| UI Library | React 19.2.8 |
| Bahasa | TypeScript 5 (`strict: true`, alias `@/*` → `./src/*`) |
| Styling | Tailwind CSS 4 + `@tailwindcss/postcss`, `clsx`, `tailwind-merge` |
| Data fetching | SWR 2.5.1 (cache client, account-scoped) |
| Chart | Recharts 3.10.1 |
| Ikon | `lucide-react` |
| Lainnya | `canvas-confetti`, Server Actions, ESLint 9 + `eslint-config-next` |

## Features

Status berikut mengikuti kode yang ada, bukan rencana.

| Fitur | Status | Catatan |
|---|---|---|
| Login & role-based access | Terintegrasi | Login/Session melalui `/api/auth/*`; role (`superadmin`/`kasir`) berasal dari prefix login ID; halaman diblokir sesuai `src/lib/access.ts`. |
| Dashboard | Sebagian | Kartu pesanan, stok menipis, dan kehadiran memakai data server. Panel **AI Ringkasan Harian** dan sebagian KPI di **Overview** masih contoh/statik. |
| POS / Orders | Terintegrasi | Keranjang di browser; order, update status, dan struk berasal dari `/api/orders`. |
| Menu management | Terintegrasi | Menu dibaca/mutasi melalui SWR + `/api/menu`; hanya owner yang mengelola. |
| Inventory / Stock | Terintegrasi | Stok dibaca/mutasi melalui SWR + `/api/stock`; kasir bersifat read-only. |
| Team management | Terintegrasi | Buat/edit akun kasir dan reset password melalui `/api/accounts` (owner only). |
| Attendance | Terintegrasi* | Absen kasir, ringkasan owner, koreksi + audit history. **Membutuhkan backend dengan endpoint Attendance terbaru** (lihat bagian Attendance). |
| Reports | Sebagian | Riwayat pesanan diambil server-side dari `/api/orders`; tab log presensi belum tersedia di halaman ini. |
| Settings | Terintegrasi | Profil toko, pajak, struk, dan WiFi disimpan ke `/api/settings`; cache info toko di refresh saat simpan. |
| Notifications | Statik | Masih memakai data contoh di `NotificationsView.tsx`; bukan notifikasi backend/realtime. |

## Attendance

Fitur absensi berjalan melalui endpoint Attendance backend dan terbagi per role:

- **Kasir**: check-in dan check-out harian. Waktu & tanggal ditentukan server (Asia/Jakarta), bukan browser.
- **Owner**: melihat absensi seluruh karyawan, dilengkapi filter rentang tanggal, nama/ID login, dan status (`Hadir`/`Terlambat`).
- **Detail per baris**: menampilkan karyawan, tanggal, jam masuk/pulang, durasi, dan status.
- **Koreksi owner**: mengubah jam masuk, jam pulang, dan/atau status dengan **alasan wajib**.
- **Audit history**: setiap koreksi tercatat sebagai riwayat perubahan yang dapat dilihat owner.
- **Keamanan data**: cache SWR dibersihkan saat berganti akun; 401 menyebabkan logout; owner tidak dapat melakukan check-in/check-out.

Endpoint yang dipakai frontend:

- `GET /api/attendance` (opsional `from`, `to`)
- `GET /api/attendance/today`
- `POST /api/attendance/check-in`
- `POST /api/attendance/check-out`
- `PATCH /api/attendance/:id/correct`
- `GET /api/attendance/:id/corrections`

> Catatan: koreksi belum mendukung penghapusan jam pulang—mengosongkan input check-out tidak mengirim perubahan ke server. Fitur ini juga baru akan berfungsi penuh bila backend menyediakan endpoint di atas dan tabel audit `attendance_corrections` sudah tersedia.

## Project Structure

```text
.
├── public/                  # Aset statis
├── src/
│   ├── actions/             # Server action (invalidasi cache info toko)
│   ├── app/                 # App Router: halaman & route group (auth)/(dashboard)
│   ├── components/          # Komponen umum + layout dashboard
│   ├── context/             # AuthContext & AppContext (state global)
│   ├── data/                # mockData.ts (dipakai chart Overview)
│   ├── hooks/               # useCache, useMenu, useStock, useAttendance, hook UI
│   ├── lib/                 # aturan akses, validasi, helper Attendance, backend server-side
│   ├── types/               # Tipe TypeScript bersama
│   ├── utils/               # API client & formatter
│   └── views/               # Layar per fitur (pos, orders, attendance, dll.)
├── .env.example             # Acuan konfigurasi environment
├── next.config.ts           # Rewrite /api/* ke backend
└── package.json
```

## Installation

Prasyarat:

- Node.js dan npm yang didukung Next.js 16 (disarankan Node 20 LTS atau lebih baru).
- Backend Express Warkop Wong Kito yang berjalan/accessible.

```bash
npm install
cp .env.example .env.local   # Windows: Copy-Item .env.example .env.local
npm run dev
```

Buka alamat default development server Next.js di browser. File `.env.local` sudah diabaikan Git—jangan di-commit.

## Environment Configuration

Gunakan `.env.example` sebagai acuan. Variabel yang dipakai:

| Variabel | Fungsi |
|---|---|
| `BACKEND_URL` | Alamat basis backend Express. Dipakai oleh rewrite Next.js dan fetch sisi server. Jika tidak diset, kode memakai nilai default lokal bawaan aplikasi. |

Jangan menaruh credential di frontend. Session login bukan disimpan di browser, melainkan dikirim sebagai cookie httpOnly `wk_session` oleh backend.

## Backend Integration

Frontend tidak memiliki database sendiri. Komunikasi terjadi dua arah:

1. **Browser → Next.js → Express**: browser memanggil `/api/*` pada origin yang sama. `next.config.ts` melakukan rewrite:
   ```text
   /api/:path*  →  ${BACKEND_URL}/api/:path*
   ```
   Cookie `wk_session` ikut terkirim sehingga sesi tetap httpOnly.

2. **Next.js server → Express**: Server Component/Server Action memanggil `${BACKEND_URL}/api/...` langsung dengan meneruskan cookie (`src/lib/server/backend.ts`), misalnya `/api/settings/public` dan `/api/orders` untuk halaman Reports.

Endpoint yang digunakan frontend mencakup grup: `/api/auth/*`, `/api/accounts*`, `/api/menu*`, `/api/stock*`, `/api/orders*`, `/api/settings*`, dan `/api/attendance*`. Backend wajib menyediakan endpoint tersebut, mengelola sesi `wk_session`, dan memiliki schema absensi beserta tabel audit koreksi agar fitur Attendance berfungsi.

## Current Limitations

- **Notifications** masih memakai array contoh; belum ada integrasi backend atau pembaruan realtime.
- **Dashboard**: panel *AI Ringkasan Harian* di `OwnerDashboardView` masih teks statik. Halaman **Overview** juga memakai `src/data/mockData.ts` dan beberapa angka contoh untuk chart/KPI.
- **Reports** baru menampilkan riwayat pesanan; belum ada tab log presensi meskipun judul halaman menyebutkannya.
- **Attendance**: koreksi belum bisa menghapus jam pulang, dan seluruh fitur bergantung pada backend versi terbaru.
- **Mobile**: repository ini hanya berisi web frontend. Tidak ada klaim integrasi dengan aplikasi mobile.

## Scripts

Diambil dari `package.json`:

| Script | Perintah | Fungsi |
|---|---|---|
| `dev` | `next dev` | Menjalankan development server |
| `build` | `next build` | Build production |
| `start` | `next start` | Menjalankan hasil build |
| `lint` | `eslint` | Menjalankan ESLint |
