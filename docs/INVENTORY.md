# 📦 Dokumentasi Fitur Manajemen Inventory

Dokumentasi ini menjelaskan implementasi fitur **Inventaris & Manajemen Stok Bahan Baku** pada web dashboard Warkop Wong Kito (WKM).

---

## 1. Ikhtisar Modul

Halaman Inventory (`/inventory`) mengelola ketersediaan bahan baku operasional warkop, seperti biji kopi, susu, sirup, kemasan cup, dan bahan pembantu lainnya.

* **Owner / Superadmin (`superadmin`):**
  * Menambah item bahan baku baru melalui modal **Update Stok**.
  * Mengedit informasi bahan baku (nama, kategori, stok, satuan).
  * Melakukan penambahan stok instan via tombol `+ Stok`.
  * Melakukan pengurangan stok instan via tombol `− Stok`.
* **Kasir (`kasir`):**
  * Bersifat *read-only* (hanya dapat melihat daftar stok dan status ketercukupan bahan baku).
  * Tombol aksi `Edit`, `+ Stok`, `− Stok`, dan `UPDATE STOK` tidak ditampilkan untuk kasir.

---

## 2. Ringkasan Statistik Stok (Stat Cards)

Di bagian atas halaman, terdapat 4 kartu statistik reaktif:
1. **TOTAL ITEM:** Menghitung jumlah seluruh ragam bahan baku yang tercatat.
2. **TERSEDIA:** Item dengan stok di atas batas minimum pemakaian (`status: 'TERSEDIA'`).
3. **MENIPIS:** Item dengan stok berada di antara 1 hingga batas minimum (`status: 'MENIPIS'`). Ditandai dengan border biru dan icon `AlertTriangle`.
4. **HABIS:** Item dengan jumlah stok 0 (`status: 'HABIS'`). Ditandai dengan border merah dan icon `XCircle`.

Statistik ini diperbarui secara reaktif setiap kali terjadi perubahan jumlah stok pada tabel.

---

## 3. Aksi Cepat pada Tabel Inventory

Setiap baris item pada tabel bahan baku dilengkapi dengan tiga tombol aksi compact:

### A. Tombol `+ Stok` (Penambahan Instan)
* **Perilaku:** Menambahkan stok sebanyak **1 satuan** langsung pada item tersebut (`currentStock + 1`).
* **Contoh:** Fresh Milk 2 Liter → klik `+ Stok` → menjadi 3 Liter.
* **Karakteristik:**
  * Tidak membuka modal maupun memicu perpindahan halaman.
  * Menampilkan teks `...` dan berstatus disabled selama request ke API berlangsung untuk mencegah klik ganda.
  * Memunculkan notifikasi toast: `Stok "[Nama Barang]" bertambah menjadi [X] [Satuan]!`.
  * Memainkan audio chime success.

### B. Tombol `− Stok` (Pengurangan Instan & Proteksi Negatif)
* **Perilaku:** Mengurangi stok sebanyak **1 satuan** langsung pada item tersebut (`currentStock - 1`).
* **Desain:** Warna merah lembut (`bg-red-50 hover:bg-red-100 border border-red-200 text-red-600`) dengan ikon `Minus`.
* **Proteksi Stok Negatif:**
  * Jumlah stok dibatasi minimal **0** (`Math.max(0, currentStock - 1)`).
  * Jika stok saat ini sudah bernilai **0**, tombol `− Stok` otomatis **disabled** dan tidak dapat diklik.
* **Feedback:** Menampilkan toast konfirmasi keberhasilan pengurangan stok dan suara chime klik.

### C. Tombol `Edit`
* Membuka modal pop-up Update Stok dengan form yang telah terisi data item yang dipilih.

---

## 4. Modal Pop-up Update Stok (React Portal)

Form penambahan dan pembaruan stok dirancang sebagai modal pop-up mengambang di atas halaman Inventory:

* **Penerapan React Portal:** Menggunakan `createPortal(modalElement, document.body)` agar modal tidak terpengaruh oleh layout atau animasi parent (`.animate-fade-in`).
* **Overlay:** Menggunakan backdrop gelap dan efek blur (`fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4`).
* **Dimensi:** Maksimal lebar `520px` (`max-w-[520px] w-full`) dan batas tinggi `90vh`.
* **Internal Vertical Scrolling:**
  * Header modal (judul & tombol X) dan footer (tombol Batal & Simpan Stok) berstatus `shrink-0` (tetap terlihat).
  * Bagian isi form dapat di-scroll secara vertikal (`overflow-y-auto flex-1`).
* **Mekanisme Penutupan:**
  1. Tombol **X** pada header modal.
  2. Tombol **Batal** pada footer modal.
  3. Menekan tombol keyboard **Escape**.
  4. Mengklik area gelap overlay di luar modal.
* **Scroll Lock:** Mengunci scrolling halaman latar belakang (`document.body.style.overflow = 'hidden'`) saat modal aktif.

### Form Fields
* **Nama Barang:** Teks input wajib.
* **Kategori:** Pilihan (*Bahan Utama, Bahan Pembantu, Kemasan*).
* **Jumlah Stok Saat Ini:** Input numerik minimal 0.
* **Satuan:** Pilihan (*Liter, Kg, Kaleng, Pack, Pcs, Botol, Gram*).

---

## 5. Integrasi API & State

* **State Manager:** Menggunakan hook `useApp()` dari `AppContext.tsx`.
* **Fungsi Mutasi:**
  * `updateStockItem(id, updates)`: Mengirim request `PUT /api/stock/[id]`.
  * `addStockItem(item)`: Mengirim request `POST /api/stock`.
* Pembaruan data disimpan di database PostgreSQL melalui API route handler Next.js dan secara reaktif menyinkronkan daftar item di browser.

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
