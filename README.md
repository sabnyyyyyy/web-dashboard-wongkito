# ☕ Dashboard Warkop Wong Kito

Sistem Manajemen Operasional & Kasir POS (*Point of Sale*) modern berbasis web untuk **Warkop Wong Kito**. Sistem ini mengintegrasikan fungsi kasir cepat, antrean pesanan dapur, manajemen stok inventaris, absensi tim, hingga pelaporan transaksi dan cetak nota belanja.

---

## 🆕 Pembaruan Terbaru (November 2026)

### Backend & Database
* **Data tersimpan di PostgreSQL**, tidak lagi di browser. Menu, pesanan, stok bahan baku, pengaturan toko, dan akun staf disimpan di database, jadi semua perangkat kasir melihat data yang sama.
* **Backend terpisah (Express) di folder `backend/`**, frontend (Next.js) di folder `frontend/`. Struktur backend: `controllers/`, `routes/`, `middleware/`, `db.ts`, `initDb.ts`, `server.ts`. Daftar endpoint ada di bagian [Backend](#3-backend-backend).
* **API:** `/api/auth`, `/api/accounts`, `/api/menu`, `/api/stock`, `/api/orders`, `/api/settings`, plus yang baru: `/api/attendance` (absen masuk/pulang), `/api/notifications` (stok menipis & pesanan), `/api/dashboard/summary` (penjualan hari ini, per jam, 7 hari, menu terlaris).
* **Transaksi dihitung di server.** Harga, diskon, pajak PB1, total, kembalian, dan nomor nota (`WK-YYYYMMDD-XXX`) dihitung dari database, bukan dari browser. Stok porsi menu berkurang otomatis saat checkout dan kembali saat pesanan dibatalkan.
* **Setup database sekali jalan:** `npm run init-db` (di folder `backend/`) membuat tabel, data awal (menu, stok, pengaturan), dan akun Owner pertama. Lupa password Owner? `npm run reset-owner`.

### Login & Hak Akses
* **Login memakai ID** (`OWN-001` untuk Owner, `KSR-001`, `KSR-002`, ... untuk kasir). Sesi login disimpan di server dengan cookie httpOnly.
* **Owner membuat akun kasir** di menu **Team**: tambah, edit, nonaktifkan, dan reset password.
* **Batasan kasir:** kasir hanya bisa **melihat** stok bahan baku (tidak bisa menambah, mengubah, atau mengurangi) dan **tidak bisa membatalkan transaksi**. Aturan ini dicek di server, bukan hanya disembunyikan di tampilan.

### Validasi Data
* **Syarat password baru:** minimal 8 karakter, ada huruf besar, huruf kecil, angka, dan simbol, tanpa spasi. Form menampilkan checklist yang berubah saat mengetik.
* **Nomor telepon hanya angka** (boleh diawali `+`, dipisah spasi atau `-`, 9–15 digit), untuk akun kasir dan pengaturan toko.

### Tampilan & Struktur
* **Satu URL per halaman:** `/dashboard`, `/pos`, `/orders`, `/menu`, `/inventory`, `/reports`, `/attendance`, `/team`, `/notifications`, `/profile`, `/settings`. Halaman bisa di-bookmark, dan tombol back browser berfungsi.
* **Frontend dan backend jadi dua project terpisah** (`frontend/` dan `backend/`, masing-masing punya `package.json`). Browser tetap memanggil `/api/...` di frontend; Next.js meneruskannya ke backend Express (lihat `frontend/next.config.ts`), jadi cookie login tetap aman di domain yang sama.
* **Dashboard, Pesanan, Riwayat, dan Stok** menampilkan angka dan data asli dari database, bukan contoh statis.

> **Belum tersambung ke tampilan:** API absensi, notifikasi, dan ringkasan dashboard sudah ada di backend, tapi halaman **Absensi**, **Notifikasi**, grafik di Overview, serta kotak "Kehadiran" dan "AI Insight" di Dashboard masih memakai data contoh.

---

## 🚀 Teknologi Utama (Tech Stack)

* **Framework:** [Next.js](https://nextjs.org) 16 (App Router) & [React](https://react.dev) 19
* **Bahasa:** [TypeScript](https://www.typescriptlang.org)
* **Styling:** [Tailwind CSS](https://tailwindcss.com) v4
* **Ikonografi & Visual:** [Lucide React](https://lucide.dev), [Recharts](https://recharts.org), [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti)
* **State Management:** React Context API (`AuthContext` & `AppContext`) dengan persistensi lokal (`localStorage`)
* **Audio Engine:** Web Audio API (Synthesizer efek suara tanpa aset eksternal)
* **Backend:** [Express](https://expressjs.com) 5 + TypeScript (dijalankan dengan [`tsx`](https://tsx.is)), folder `backend/`
* **Database:** [PostgreSQL](https://www.postgresql.org) 13+ melalui library [`pg`](https://node-postgres.com). Sejak pembaruan November 2026, data menu, pesanan, stok, pengaturan, dan akun disimpan di sini, tidak lagi di `localStorage`.

---

## 📁 Struktur Direktori & Arsitektur Kode

```text
dashboard-wongkito/
├── frontend/                       # FRONTEND — Next.js (port 3000)
│   ├── public/                     # Aset statis dan logo aplikasi
│   ├── next.config.ts              # Meneruskan /api/* ke backend (BACKEND_URL)
│   ├── package.json
│   └── src/
│       ├── app/                    # Routing Next.js (App Router)
│       │   ├── layout.tsx          # Root layout, penyedia Auth & App Provider, font
│       │   ├── page.tsx            # Redirect ke /dashboard (sudah login) atau /login
│       │   ├── globals.css         # Tailwind CSS, font, & styling cetak struk (@media print)
│       │   ├── (auth)/login/       # /login → views/login/LoginPage.tsx
│       │   └── (dashboard)/        # Semua halaman setelah login
│       │       ├── layout.tsx      # Guard login & role, shell DashboardLayout, ReceiptModal
│       │       └── <fitur>/page.tsx  # dashboard, pos, orders, menu, inventory, reports,
│       │                             # attendance, team, notifications, profile, settings
│       ├── views/<fitur>/          # Isi tiap halaman (PosView.tsx, OrdersView.tsx, ...)
│       ├── components/
│       │   ├── common/             # ReceiptModal, PasswordChecklist
│       │   └── layout/             # Shell navigasi (Sidebar, Header, Topbar, Search)
│       ├── context/                # AppContext (data bisnis) & AuthContext (sesi login)
│       ├── data/mockData.ts        # Data contoh grafik di OverviewView
│       ├── lib/                    # Aturan role/akses, password, nomor telepon
│       ├── types/index.ts          # Tipe data TypeScript
│       └── utils/                  # api.ts (fetch ke /api), format.ts (Rupiah, waktu, chime)
├── backend/                        # BACKEND — Express + PostgreSQL (port 4000)
│   ├── package.json
│   ├── .env.example                # PORT, DATABASE_URL, FRONTEND_URL
│   └── src/
│       ├── controllers/            # Logika tiap fitur + query database
│       │   ├── auth.controller.ts        attendance.controller.ts   dashboard.controller.ts
│       │   ├── inventory.controller.ts   menu.controller.ts         notification.controller.ts
│       │   └── order.controller.ts       settings.controller.ts     team.controller.ts
│       ├── middleware/
│       │   └── auth.middleware.ts  # requireSession / requireOwner (cek cookie sesi & role)
│       ├── routes/                 # Daftar endpoint tiap fitur (*.routes.ts)
│       ├── utils/                  # Sesi, hash password, rate limit, logger, validasi, data awal, tipe
│       ├── db.ts                   # Koneksi PostgreSQL
│       ├── initDb.ts               # npm run init-db / reset-owner: tabel, data awal, akun Owner
│       └── server.ts               # Express app: middleware, routes, error handler
└── docs/                           # Dokumentasi fitur (logging, menu, inventory)
```

---

## 🔄 Alur Kerja Aplikasi (Workflow & Architecture Flow)

```mermaid
flowchart TD
    User([Pengguna: Owner / Kasir]) --> AuthCtx[AuthContext.tsx\nCek Sesi & Role]
    AuthCtx -->|Belum Login| LoginView[LoginPage.tsx]
    AuthCtx -->|Sudah Login| Layout[DashboardLayout.tsx]
    
    Layout --> AppCtx[AppContext.tsx\nGlobal State]
    AppCtx <--> API[(Backend Express + PostgreSQL)]
    
    Layout --> Views{Navigasi Berdasarkan URL}
    Views -->|dashboard| OwnerView[OwnerDashboardView.tsx\nKPI & Ringkasan Operasional]
    Views -->|pos| PosView[PosView.tsx\nPemilihan Menu & Keranjang Kasir]
    Views -->|orders| OrdersView[OrdersView.tsx\nMonitor Status Pesanan Dapur]
    Views -->|inventory| InventoryView[InventoryView.tsx\nManajemen Bahan Baku & Stok]
    Views -->|attendance| AttendanceView[AttendanceView.tsx\nAbsensi & Kehadiran Staf]
    Views -->|reports| ReportsView[ReportsView.tsx\nLaporan & Riwayat Transaksi]
    
    PosView -->|Transaksi Berhasil| Receipt[ReceiptModal.tsx\nCetak Nota Thermal]
```

### 1. Autentikasi & Multi-Role (`AuthContext.tsx`)
- Mendukung 2 role pengguna:
  - **`superadmin` (Owner):** Akses penuh ke seluruh menu (Dashboard KPI, Laporan Keuangan, Team, Stok, dll).
  - **`kasir` (Staff Kasir):** Fokus ke fungsi harian kasir (POS Kasir, Pesanan Dapur, Cek Stok, Absensi).
- Sesi login disimpan di server (PostgreSQL); browser hanya memegang cookie httpOnly. *Ingat saya* membuat cookie bertahan setelah browser ditutup.

### 2. Navigasi Berbasis URL (`frontend/src/app/(dashboard)/`)
- Tiap fitur punya halaman sendiri (`/pos`, `/orders`, `/team`, ...), jadi bisa di-bookmark dan tombol back browser berfungsi.
- `activeTab` di `AppContext` dibaca dari URL; `setActiveTab('pos')` sama dengan pindah ke `/pos`.
- `(dashboard)/layout.tsx` mengarahkan pengguna yang belum login ke `/login`, dan role yang tidak berhak (misalnya kasir membuka `/team`) ke `/dashboard`.

### 3. POS Kasir & Cetak Struk (`PosView.tsx` & `ReceiptModal.tsx`)
- Pemilihan menu instan dengan filter kategori (*Kopi, Non-Kopi, Makanan, Cemilan, Signature*).
- Kalkulasi otomatis subtotal, diskon promo, dan pajak PB1 (10%).
- Saat transaksi selesai melalui `createOrder()`, stok otomatis berkurang, efek suara berhasil dipicu, dan `ReceiptModal` muncul siap dicetak ke printer kasir.

---

## 🧩 Analisis Modul & Fungsi-Fungsi Kunci

### 1. Global State Management (`frontend/src/context/AppContext.tsx`)
Menu, pesanan, stok, dan pengaturan toko dimuat dari API setelah login. Setiap perubahan dikirim ke server; keranjang POS tetap di browser. Pesanan dimuat ulang otomatis tiap 15 detik supaya kasir dan dapur di perangkat lain melihat pesanan yang sama.
* `addToCart(item, notes)` / `updateCartQuantity(itemId, delta)`: Mengelola keranjang POS (lokal).
* `createOrder(order)`: Mengirim keranjang ke `POST /api/orders`. Server menghitung ulang harga, pajak, dan kembalian, membuat nomor nota `WK-YYYYMMDD-XXX`, dan mengurangi stok porsi menu.
* `updateOrderStatus(orderId, status)`: `pending` → `accepted` → `processing` → `ready` → `completed`, atau `cancelled` (khusus Owner; stok porsi dikembalikan).
* `addMenuItem` / `updateMenuItem` / `deleteMenuItem` / `toggleMenuAvailability`: CRUD menu (khusus Owner).
* `addStockItem` / `updateStockItem`: Tambah/ubah/kurangi bahan baku (khusus Owner; kasir hanya bisa melihat).
* `updateSettings`: Simpan pengaturan toko & nota (khusus Owner).
* Semua fungsi yang mengubah data mengembalikan `false` jika gagal, dan pesan error dari server sudah ditampilkan.

### 2. Autentikasi Pengguna (`frontend/src/context/AuthContext.tsx`)
* `login(loginId, password, rememberMe)`: Login dengan ID login (`OWN-001`, `KSR-001`, ...). Role ditentukan dari prefix ID.
* `logout()`: Mengakhiri sesi di server.
* `createKasirAccount` / `updateKasirAccount` / `resetKasirPassword`: Manajemen akun kasir oleh Owner.

### 3. Backend (`backend/`)
Tiap fitur punya pasangan `routes/<fitur>.routes.ts` (daftar endpoint + middleware akses) dan `controllers/<fitur>.controller.ts` (logika + query). Error dilempar sebagai `HttpError` dan dijawab sebagai `{ "error": "<pesan>" }` oleh error handler di `server.ts`.

| Endpoint | Akses | Controller | Fungsi |
| --- | --- | --- | --- |
| `POST /api/auth/login`, `POST /api/auth/logout`, `GET/PATCH /api/auth/me`, `POST /api/auth/password` | publik / login | `auth` | Login, logout, sesi aktif, ganti nama & password |
| `GET/POST /api/accounts`, `PATCH /api/accounts/:loginId`, `POST .../reset-password` | Owner | `team` | Akun kasir |
| `GET/POST /api/menu`, `PUT/DELETE /api/menu/:id` | baca: login, ubah: Owner | `menu` | Katalog menu |
| `GET/POST /api/stock`, `PUT /api/stock/:id` | baca: login, ubah: Owner | `inventory` | Bahan baku |
| `GET/POST /api/orders`, `PATCH /api/orders/:id` | login (batalkan: Owner) | `order` | Transaksi POS & alur dapur |
| `GET/PUT /api/settings` | baca: login, ubah: Owner | `settings` | Pengaturan toko |
| `GET /api/attendance`, `GET /api/attendance/today`, `POST .../check-in`, `POST .../check-out` | login (kasir: milik sendiri) | `attendance` | Absensi; "Terlambat" jika absen masuk lebih dari 15 menit setelah jam mulai shift |
| `GET /api/notifications` | login | `notification` | Stok bahan menipis/habis, porsi menu hampir habis, pesanan baru & siap diambil |
| `GET /api/dashboard/summary` | login | `dashboard` | Penjualan & laba hari ini, per jam, 7 hari terakhir, menu terlaris |
| `GET /api/health/db` | publik | — | Cek koneksi database |

Skema tabel ada di `backend/src/initDb.ts`, data awal di `backend/src/utils/seed-data.ts`; data awal hanya dimasukkan ke tabel yang masih kosong.

### 4. Komponen Nota Kasir (`frontend/src/components/common/ReceiptModal.tsx`)
* Menampilkan antarmuka struk bergaya printer thermal 58mm/80mm (`#thermal-receipt`).
* Memuat rincian toko (nama, alamat, no. telepon dari `settings`), detail nomor nota, kasir bertugas, meja/tipe pesanan, rincian menu beserta catatan, subtotal, diskon, pajak, nominal tunai, dan kembalian.
* Fungsi `handlePrint()` memanggil `window.print()` yang dipadukan dengan style `@media print` sehingga yang tercetak di kertas hanyalah kertas struk tanpa elemen dashboard lainnya.

### 5. Format & Web Audio Helper (`frontend/src/utils/format.ts`)
* `formatRupiah(amount)`: Memformat angka ke format standar mata uang Rupiah Indonesia (contoh: `Rp 18.000`).
* `formatDateTime(dateString)` & `formatTimeOnly(dateString)`: Mengonversi format ISO ke format penanggalan lokal Indonesia (`id-ID`).
* `playChime(type)`: Memanfaatkan Web Audio API peramban untuk menghasilkan efek bunyi audio synthesizer tanpa membutuhkan file `.mp3` eksternal (`success`, `alert`, `click`).

### 6. Kontrak Tipe Data (`frontend/src/types/index.ts`, salinannya di `backend/src/utils/types.ts`)
Mendefinisikan entitas data utama:
* `User`: Informasi pengguna dan hak akses (`superadmin` | `kasir`).
* `MenuItem`: Data produk katalog, kategori, harga jual, HPP (*cost price*), dan stok porsi.
* `Order`: Data lengkap transaksi penjualan, metode bayar, kasir, dan status pesanan.
* `StockItem`: Data kontrol stok bahan baku beserta batas minimum peringatan (*minStock*).
* `StoreSettings`: Konfigurasi toko, tarif PB1, alamat, jam buka, dan footer struk.

> Halaman **Absensi** dan **Notifikasi** masih memakai data contoh di komponennya; API-nya sudah ada di backend (`/api/attendance`, `/api/notifications`).

---

## 🛠️ Cara Menjalankan Proyek Secara Lokal

Butuh Node.js (versi 22 ke atas) dan PostgreSQL (versi 13 ke atas). Frontend dan backend dijalankan di **dua terminal**.

1. **Clone repositori dan pasang dependensi kedua project:**
   ```bash
   git clone <repository-url>
   cd dashboard-wongkito
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Siapkan database.** Salin `backend/.env.example` menjadi `backend/.env`, lalu isi `DATABASE_URL`. Ada dua pilihan:
   * **Pakai PostgreSQL yang sudah ter-install:** buat database `wongkito` (misalnya `createdb -U postgres wongkito`), lalu isi
     `DATABASE_URL=postgres://postgres:PASSWORD@localhost:5432/wongkito`.
   * **Tanpa password postgres (server khusus proyek di folder `.pgdata`, port 5433):** jalankan dari folder root repo, pakai program dari folder `bin` PostgreSQL,
     contoh di Windows: `C:\Program Files\PostgreSQL\18\bin\`.
     ```bash
     initdb -D .pgdata -U wongkito --auth=scram-sha-256 --pwprompt -E UTF8 --locale=C
     pg_ctl -D .pgdata -o "-p 5433" -l .pgdata.log start
     createdb -h localhost -p 5433 -U wongkito wongkito
     ```
     Lalu isi `DATABASE_URL=postgres://wongkito:PASSWORD_TADI@localhost:5433/wongkito`.
     Setelah komputer restart, jalankan lagi baris `pg_ctl ... start`. Sebelum mematikan komputer, matikan database dulu
     dengan `pg_ctl -D .pgdata stop` supaya tidak perlu pemulihan saat dinyalakan lagi.
     File log sengaja ditaruh di luar folder data (`.pgdata.log`, bukan `.pgdata/server.log`): di Windows, log di dalam
     `.pgdata` bisa terkunci dan memperlambat pemulihan database.

3. **Buat tabel, data awal, dan akun Owner** (di folder `backend/`):
   ```bash
   npm run init-db
   ```
   ID login `OWN-001` dan password sementaranya ditampilkan sekali. Lupa password Owner? Jalankan `npm run reset-owner`.

4. **Terminal 1 — jalankan backend** (di folder `backend/`, port 4000):
   ```bash
   npm run dev
   ```
   Cek: [http://localhost:4000/api/health/db](http://localhost:4000/api/health/db) harus menjawab "Koneksi database berhasil."

5. **Terminal 2 — jalankan frontend** (di folder `frontend/`, port 3000), lalu buka [http://localhost:3000](http://localhost:3000):
   ```bash
   npm run dev
   ```
   Kalau backend jalan di alamat lain, salin `frontend/.env.example` ke `frontend/.env.local` dan ubah `BACKEND_URL`.

6. **Build untuk produksi:** di folder `frontend/` jalankan `npm run build` lalu `npm run start`; backend dijalankan dengan `npm run start` di folder `backend/`.

---

## 📚 Dokumentasi Fitur

* [📚 Dokumentasi Sistem Logging](docs/LOGGING.md) – Menjelaskan arsitektur, format, retensi, pengujian, dan cara membaca log transaksi & audit.
* [🍽️ Dokumentasi Manajemen Menu](docs/MENU.md) – Menjelaskan katalog menu, hak akses Owner vs. Kasir, modal Tambah/Edit via React Portal, soft-delete, pencarian, dan filter kategori.
* [📦 Dokumentasi Manajemen Inventory](docs/INVENTORY.md) – Menjelaskan kontrol stok bahan baku, modal Update Stok, aksi cepat `+ Stok` dan `− Stok`, proteksi stok negatif, serta pembaruan statistik otomatis.

---

## 🔑 Akun & Login

[📚 Dokumentasi Logging](docs/LOGGING.md) (menjelaskan arsitektur, format, retensi, dan cara membaca log)

* **Owner:** `OWN-001`, password dari `npm run init-db` di folder `backend/` (ganti lewat menu Profile setelah login).
* **Kasir:** dibuat oleh Owner di menu **Team** (ID `KSR-001`, `KSR-002`, ...), lengkap dengan password awalnya.
* **Syarat password baru** (buat akun kasir & ganti password): minimal 8 karakter, ada huruf besar, huruf kecil, angka, dan simbol, tanpa spasi. Aturannya di `frontend/src/lib/password.ts` (form) dan `backend/src/utils/password.ts` (API); isi keduanya harus sama.
* **Nomor telepon** hanya angka (boleh diawali `+`, dipisah spasi atau `-`), 9–15 digit. Aturannya di `frontend/src/lib/phone.ts` dan `backend/src/utils/phone.ts`.
