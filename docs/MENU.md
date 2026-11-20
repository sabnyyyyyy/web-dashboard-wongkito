# 🍽️ Dokumentasi Fitur Manajemen Menu

Dokumentasi ini menjelaskan implementasi fitur **Katalog & Manajemen Menu** pada web dashboard Warkop Wong Kito (WKM).

---

## 1. Ikhtisar & Hak Akses

Fitur Manajemen Menu dirancang dengan pembatasan hak akses berbasis peran (*Role-Based Access Control*):

* **Owner / Superadmin (`superadmin`):**
  * Memiliki akses penuh mengelola katalog produk.
  * Melihat navigasi **Menu** pada sidebar.
  * Melihat seluruh item menu, baik yang berstatus **TERSEDIA** maupun **NONAKTIF**.
  * Menambah menu baru melalui modal form.
  * Mengedit informasi menu (nama, kategori, harga jual, harga modal/HPP, deskripsi, foto, stok porsi, status).
  * Mengaktifkan atau menonaktifkan menu secara langsung (*soft-delete*).
* **Kasir (`kasir`):**
  * Tidak melihat menu navigasi pada sidebar (halaman dibatasi via `canAccessTab`).
  * Pada halaman transaksi POS, kasir hanya dapat memilih menu yang berstatus tersedia (`isAvailable: true`).
  * Tidak dapat melihat tombol Tambah Menu, Edit, maupun tombol Aktifkan/Nonaktifkan.

---

## 2. Navigasi Sidebar

* **File Implementasi:** `src/frontend/components/layout/DashboardLayout.tsx`
* **Label:** `Menu`
* **Ikon:** Lucide React `Utensils`
* **Posisi:** Terletak setelah menu **Stok** (`inventory`) dan sebelum **Absensi** (`attendance`).
* **Active State:** Menggunakan background gradient orange (`wkm-gradient-bg text-white shadow-sm`) ketika rute `/menu` aktif.
* **Filter Role:** Hanya dimasukkan ke dalam daftar `ownerNavItems`. Pada `cashierNavItems`, item menu ditiadakan sepenuhnya.

---

## 3. Desain Kartu Menu & Hierarki Visual

* **File Implementasi:** `src/frontend/views/menu/MenuView.tsx`
* **Layout Grid:** Responsif (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`).
* **Komposisi Kartu:**
  1. **Badge Kategori:** Terletak di kiri atas, menggunakan pill khas WKM (`text-[#F47C0B] bg-[#FFF7E8] border border-[#FFB21A]/40 text-[10px] uppercase font-bold`).
  2. **Badge Status Ketersediaan:** Terletak di kanan atas:
     * `TERSEDIA`: Hijau lembut (`text-emerald-700 bg-emerald-50 border-emerald-200`).
     * `NONAKTIF`: Merah lembut (`text-red-600 bg-red-50 border-red-200`).
  3. **Thumbnail Foto:** Thumbnail ukuran `w-14 h-14 rounded-[10px]` dengan fallback otomatis jika gambar gagal dimuat.
  4. **Nama Menu:** Teks bold gelap `text-sm font-bold text-[#242424] truncate`.
  5. **Deskripsi:** Teks sekunder abu-abu `text-xs text-[#737373] line-clamp-2 leading-relaxed`.
  6. **Harga Jual:** Format mata uang Rupiah (`formatRupiah(item.price)`), tebal `text-sm font-black text-[#242424]`.
  7. **Tombol Aksi (Khusus Owner):**
     * **Tombol Edit:** Compact (`px-3 py-1 text-xs rounded-[6px] border border-[#D1D5DB] bg-white hover:bg-[#F1F1EF]`), dengan ikon `Edit2`.
     * **Tombol Aktifkan / Nonaktifkan:** Compact (`px-2.5 py-1 text-xs rounded-[6px]`), warna merah lembut saat aktif ("Nonaktifkan") dan hijau lembut saat nonaktif ("Aktifkan").

---

## 4. Modal Tambah & Edit Menu (React Portal)

* **Tantangan Teknis:** Parent container memiliki CSS animasi `.animate-fade-in` dengan properti `transform: scale(...)`. Pada CSS standar, elemen ber-transform membuat *containing block* baru sehingga elemen `position: fixed` terpotong dan tergeser ke bawah viewport.
* **Solusi Arsitektur:** Modal dirender langsung ke `document.body` menggunakan **React Portal** (`createPortal(modalElement, document.body)`).
* **Karakteristik Modal:**
  * **Overlay:** `fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4`.
  * **Posisi:** Berada tepat di tengah layar secara vertikal dan horizontal.
  * **Dimensi:** Maksimal lebar `520px` (`max-w-[520px] w-full`) dan batas tinggi `90vh`.
  * **Internal Scrolling:** Header modal dan footer (tombol Batal & Simpan) berstatus `shrink-0` (tetap terlihat), sedangkan form body memiliki `overflow-y-auto` mandiri.
  * **Scroll Lock:** Mengunci scrolling background pada `document.body` (`overflow: hidden`) selama modal aktif.
  * **Penutupan Modal:** Tombol **X**, tombol **Batal**, penekanan tombol **Escape**, atau klik pada overlay gelap di luar modal.

### Form Fields
1. **Nama Menu** (Wajib, teks)
2. **Kategori** (Dropdown: Signature Wong Kito, Kopi, Non-Kopi, Makanan, Cemilan)
3. **Harga Jual (Rp)** (Wajib, angka)
4. **Harga Modal / HPP (Rp)** (Opsional, angka)
5. **Stok Porsi** (Angka)
6. **Deskripsi & Racikan** (Textarea)
7. **URL Foto Menu** (URL gambar)
8. **Checklist:** *Tandai Best Seller* & *Status Tersedia*

---

## 5. Pencarian & Filter Kategori

* **Pencarian Real-Time:** Input pencarian di header menyaring daftar menu berdasarkan nama dan deskripsi tanpa memuat ulang halaman.
* **Filter Dropdown Kategori:** Memfilter daftar berdasarkan kategori produk (`all`, `kopi`, `non-kopi`, `makanan`, `cemilan`, `signature`).
* **Empty State:** Menampilkan pesan informatif jika tidak ada menu yang cocok dengan kata kunci pencarian atau filter kategori.

---

## 6. Verifikasi & Pengujian Kode

```bash
# TypeScript compilation check
cd web-frontend
npx tsc --noEmit
# Output: Exit code 0 (Bebas error)

# Git whitespace check
git diff --check
# Output: Exit code 0 (Format bersih)
```
