# ☕ Dashboard Warkop Wong Kito

Sistem Manajemen Operasional & Kasir POS (*Point of Sale*) modern berbasis web untuk **Warkop Wong Kito**. Sistem ini mengintegrasikan fungsi kasir cepat, antrean pesanan dapur, manajemen stok inventaris, absensi tim, hingga pelaporan transaksi dan cetak nota belanja.

---

## 🚀 Teknologi Utama (Tech Stack)

* **Framework:** [Next.js](https://nextjs.org) 16 (App Router) & [React](https://react.dev) 19
* **Bahasa:** [TypeScript](https://www.typescriptlang.org)
* **Styling:** [Tailwind CSS](https://tailwindcss.com) v4
* **Ikonografi & Visual:** [Lucide React](https://lucide.dev), [Recharts](https://recharts.org), [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti)
* **State Management:** React Context API (`AuthContext` & `AppContext`) dengan persistensi lokal (`localStorage`)
* **Audio Engine:** Web Audio API (Synthesizer efek suara tanpa aset eksternal)

---

## 📁 Struktur Direktori & Arsitektur Kode

```text
dashboard-wongkito/
├── public/                     # Aset statis dan logo aplikasi
├── src/
│   ├── app/                    # Next.js App Router root
│   │   ├── layout.tsx          # Root layout, penyedia Auth & App Provider, font
│   │   ├── page.tsx            # Redirect ke /dashboard (sudah login) atau /login
│   │   ├── globals.css         # Konfigurasi Tailwind CSS, font, & styling cetak struk (@media print)
│   │   ├── api/                # Route handler backend (auth & manajemen akun)
│   │   ├── (auth)/login/       # Halaman /login (+ _components/LoginPage.tsx)
│   │   ├── (dashboard)/        # Semua halaman setelah login, tiap fitur punya URL sendiri
│   │   │   ├── layout.tsx      # Guard login & role, shell DashboardLayout, ReceiptModal
│   │   │   ├── dashboard/      # /dashboard     – ringkasan analitik dan KPI operasional
│   │   │   ├── pos/            # /pos           – interface transaksi kasir (Point of Sale)
│   │   │   ├── orders/         # /orders        – monitor pesanan aktif dan alur dapur
│   │   │   ├── menu/           # /menu          – CRUD katalog produk (Owner)
│   │   │   ├── inventory/      # /inventory     – bahan baku dan peringatan stok menipis
│   │   │   ├── reports/        # /reports       – rekap penjualan dan laporan pendapatan
│   │   │   ├── attendance/     # /attendance    – absensi dan kehadiran staf
│   │   │   ├── team/           # /team          – manajemen akun kasir (Owner)
│   │   │   ├── notifications/  # /notifications – notifikasi pesanan & stok
│   │   │   ├── profile/        # /profile       – profil akun dan ganti password
│   │   │   └── settings/       # /settings      – konfigurasi outlet (Owner)
│   │   │                       #   (tiap folder: page.tsx + _components/<View>.tsx)
│   │   ├── _components/        # Komponen bersama (private folder, tidak jadi route)
│   │   │   ├── common/         # ReceiptModal untuk nota belanja
│   │   │   └── layout/         # Shell navigasi (Sidebar responsif, Header, Topbar, Search)
│   │   ├── _context/           # Global State Management
│   │   │   ├── AppContext.tsx  # State bisnis (menu, pesanan, keranjang POS, stok, setting)
│   │   │   └── AuthContext.tsx # State autentikasi sesi pengguna (Owner / Kasir)
│   │   ├── _data/
│   │   │   └── mockData.ts     # Data contoh grafik di OverviewView
│   │   └── _utils/
│   │       └── format.ts       # Format mata uang Rupiah, waktu lokal, dan Web Audio chime
│   ├── lib/                    # Helper bersama client & server (akses role, aturan password)
│   ├── server/                 # Logika backend (database, sesi, rate limit, hashing, data seed)
│   └── types/
│       └── index.ts            # Kontrak tipe dan interface TypeScript
├── package.json
└── tsconfig.json
```

---

## 🔄 Alur Kerja Aplikasi (Workflow & Architecture Flow)

```mermaid
flowchart TD
    User([Pengguna: Owner / Kasir]) --> AuthCtx[AuthContext.tsx\nCek Sesi & Role]
    AuthCtx -->|Belum Login| LoginView[LoginPage.tsx]
    AuthCtx -->|Sudah Login| Layout[DashboardLayout.tsx]
    
    Layout --> AppCtx[AppContext.tsx\nGlobal State]
    AppCtx <--> API[(Next API + PostgreSQL)]
    
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

### 2. Navigasi Berbasis URL (`src/app/(dashboard)/`)
- Tiap fitur punya halaman sendiri (`/pos`, `/orders`, `/team`, ...), jadi bisa di-bookmark dan tombol back browser berfungsi.
- `activeTab` di `AppContext` dibaca dari URL; `setActiveTab('pos')` sama dengan pindah ke `/pos`.
- `(dashboard)/layout.tsx` mengarahkan pengguna yang belum login ke `/login`, dan role yang tidak berhak (misalnya kasir membuka `/team`) ke `/dashboard`.

### 3. POS Kasir & Cetak Struk (`PosView.tsx` & `ReceiptModal.tsx`)
- Pemilihan menu instan dengan filter kategori (*Kopi, Non-Kopi, Makanan, Cemilan, Signature*).
- Kalkulasi otomatis subtotal, diskon promo, dan pajak PB1 (10%).
- Saat transaksi selesai melalui `createOrder()`, stok otomatis berkurang, efek suara berhasil dipicu, dan `ReceiptModal` muncul siap dicetak ke printer kasir.

---

## 🧩 Analisis Modul & Fungsi-Fungsi Kunci

### 1. Global State Management (`src/app/_context/AppContext.tsx`)
Menu, pesanan, stok, dan pengaturan toko dimuat dari API setelah login. Setiap perubahan dikirim ke server; keranjang POS tetap di browser. Pesanan dimuat ulang otomatis tiap 15 detik supaya kasir dan dapur di perangkat lain melihat pesanan yang sama.
* `addToCart(item, notes)` / `updateCartQuantity(itemId, delta)`: Mengelola keranjang POS (lokal).
* `createOrder(order)`: Mengirim keranjang ke `POST /api/orders`. Server menghitung ulang harga, pajak, dan kembalian, membuat nomor nota `WK-YYYYMMDD-XXX`, dan mengurangi stok porsi menu.
* `updateOrderStatus(orderId, status)`: `pending` → `accepted` → `processing` → `ready` → `completed`, atau `cancelled` (stok porsi dikembalikan).
* `addMenuItem` / `updateMenuItem` / `deleteMenuItem` / `toggleMenuAvailability`: CRUD menu (khusus Owner).
* `addStockItem` / `updateStockItem`: Kelola bahan baku (Owner & Kasir).
* `updateSettings`: Simpan pengaturan toko & nota (khusus Owner).
* Semua fungsi yang mengubah data mengembalikan `false` jika gagal, dan pesan error dari server sudah ditampilkan.

### 2. Autentikasi Pengguna (`src/app/_context/AuthContext.tsx`)
* `login(loginId, password, rememberMe)`: Login dengan ID login (`OWN-001`, `KSR-001`, ...). Role ditentukan dari prefix ID.
* `logout()`: Mengakhiri sesi di server.
* `createKasirAccount` / `updateKasirAccount` / `resetKasirPassword`: Manajemen akun kasir oleh Owner.

### 3. Backend (`src/app/api/*`, `src/server/*`)
| Endpoint | Akses | Fungsi |
| --- | --- | --- |
| `/api/auth/*` | publik / login | Login, logout, sesi aktif, ganti password & nama |
| `/api/accounts/*` | Owner | Buat, ubah, reset password akun kasir |
| `GET /api/menu`, `POST`, `PUT/DELETE /api/menu/[id]` | baca: login, ubah: Owner | Katalog menu |
| `GET/POST /api/stock`, `PUT /api/stock/[id]` | login | Bahan baku |
| `GET/POST /api/orders`, `PATCH /api/orders/[id]` | login | Transaksi POS & alur dapur |
| `GET/PUT /api/settings` | baca: login, ubah: Owner | Pengaturan toko |

Skema tabel ada di `src/server/schema.sql`; data awal (menu, stok, pengaturan) ada di `src/server/seed-data.ts` dan hanya dimasukkan ke tabel yang masih kosong.

### 4. Komponen Nota Kasir (`src/app/_components/common/ReceiptModal.tsx`)
* Menampilkan antarmuka struk bergaya printer thermal 58mm/80mm (`#thermal-receipt`).
* Memuat rincian toko (nama, alamat, no. telepon dari `settings`), detail nomor nota, kasir bertugas, meja/tipe pesanan, rincian menu beserta catatan, subtotal, diskon, pajak, nominal tunai, dan kembalian.
* Fungsi `handlePrint()` memanggil `window.print()` yang dipadukan dengan style `@media print` sehingga yang tercetak di kertas hanyalah kertas struk tanpa elemen dashboard lainnya.

### 5. Format & Web Audio Helper (`src/app/_utils/format.ts`)
* `formatRupiah(amount)`: Memformat angka ke format standar mata uang Rupiah Indonesia (contoh: `Rp 18.000`).
* `formatDateTime(dateString)` & `formatTimeOnly(dateString)`: Mengonversi format ISO ke format penanggalan lokal Indonesia (`id-ID`).
* `playChime(type)`: Memanfaatkan Web Audio API peramban untuk menghasilkan efek bunyi audio synthesizer tanpa membutuhkan file `.mp3` eksternal (`success`, `alert`, `click`).

### 6. Kontrak Tipe Data (`src/types/index.ts`)
Mendefinisikan entitas data utama:
* `User`: Informasi pengguna dan hak akses (`superadmin` | `kasir`).
* `MenuItem`: Data produk katalog, kategori, harga jual, HPP (*cost price*), dan stok porsi.
* `Order`: Data lengkap transaksi penjualan, metode bayar, kasir, dan status pesanan.
* `StockItem`: Data kontrol stok bahan baku beserta batas minimum peringatan (*minStock*).
* `StoreSettings`: Konfigurasi toko, tarif PB1, alamat, jam buka, dan footer struk.

> Halaman **Absensi** dan **Notifikasi** masih memakai data contoh di komponennya dan belum tersambung ke database.

---

## 🛠️ Cara Menjalankan Proyek Secara Lokal

Butuh Node.js dan PostgreSQL (versi 13 ke atas).

1. **Clone repositori dan pasang dependensi:**
   ```bash
   git clone <repository-url>
   cd dashboard-wongkito
   npm install
   ```

2. **Siapkan database.** Salin `.env.example` menjadi `.env.local`, lalu isi `DATABASE_URL`. Ada dua pilihan:
   * **Pakai PostgreSQL yang sudah ter-install:** buat database `wongkito` (misalnya `createdb -U postgres wongkito`), lalu isi
     `DATABASE_URL=postgres://postgres:PASSWORD@localhost:5432/wongkito`.
   * **Tanpa password postgres (server khusus proyek di folder `.pgdata`, port 5433):** pakai program dari folder `bin` PostgreSQL,
     contoh di Windows: `C:\Program Files\PostgreSQL\18\bin\`.
     ```bash
     initdb -D .pgdata -U wongkito --auth=scram-sha-256 --pwprompt -E UTF8 --locale=C
     pg_ctl -D .pgdata -o "-p 5433" -l .pgdata/server.log start
     createdb -h localhost -p 5433 -U wongkito wongkito
     ```
     Lalu isi `DATABASE_URL=postgres://wongkito:PASSWORD_TADI@localhost:5433/wongkito`.
     Setelah komputer restart, jalankan lagi baris `pg_ctl ... start`.

3. **Buat tabel, data awal, dan akun Owner:**
   ```bash
   npm run db:setup
   ```
   ID login `OWN-001` dan password sementaranya ditampilkan sekali. Lupa password Owner? Jalankan `npm run db:reset-owner`.

4. **Jalankan server pengembangan** lalu buka [http://localhost:3000](http://localhost:3000):
   ```bash
   npm run dev
   ```

5. **Build untuk produksi:**
   ```bash
   npm run build
   npm run start
   ```

---

## 🔑 Akun & Login

* **Owner:** `OWN-001`, password dari `npm run db:setup` (ganti lewat menu Profile setelah login).
* **Kasir:** dibuat oleh Owner di menu **Team** (ID `KSR-001`, `KSR-002`, ...), lengkap dengan password awalnya.
