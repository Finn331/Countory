# Countory

Inventory Management System dengan Computer Vision

## Ringkasan

Countory merupakan web application inventory yang menggabungkan sistem CRUD, REST API, database, kamera browser, dan computer vision (OpenCV).

**Keunggulan utama:**
- Tidak membutuhkan perangkat pemindai khusus
- Dapat digunakan melalui HP dan komputer
- OpenCV berjalan langsung pada perangkat pengguna
- Video kamera tidak dikirim ke server
- Mendukung penghitungan barang, koreksi, dan pencatatan stok
- Mendukung stock opname, banyak gudang, barcode, laporan, PWA, dan offline mode

---

## Tech Stack

### Frontend
- EJS atau frontend JavaScript terpisah
- HTML, CSS, JavaScript
- OpenCV.js
- Canvas API
- MediaDevices API
- Service Worker
- IndexedDB
- Chart library
- Barcode scanner library

### Backend
- Node.js
- Express.js
- REST API
- Prisma ORM
- Authentication middleware
- Role-based access control
- Validation middleware
- Error handling middleware
- File upload service

### Database
- MySQL

### File Storage
- Cloudinary / Object storage / Local storage (development)

### Deployment
- Frontend & backend: Railway, Render, atau platform serupa
- Database: MySQL cloud
- HTTPS wajib
- Repository: GitHub
- Environment variable: `.env`

---

## Fitur Utama

### Kamera & Computer Vision
- Akses kamera melalui HP dan komputer
- Beralih antar kamera
- Kamera berhenti setelah halaman ditutup
- Pesan error jika izin ditolak
- OpenCV berjalan di browser
- Bounding box pada objek terdeteksi
- Penghitungan jumlah objek
- Koreksi hasil oleh pengguna
- Pembersihan memori OpenCV setelah proses

### Deteksi
- FPS live detection
- Mode OpenCV
- Notifikasi
- Offline mode
- Auto synchronization

### Inventory
- Stok masuk & keluar
- Stock opname
- Transfer stok
- Penyesuaian stok
- Riwayat stok
- Stok rendah (notifikasi)

### Manajemen
- Produk, Kategori, Gudang
- Barcode
- Import/Export data
- Laporan & statistik

### PWA & Offline
- Service Worker
- IndexedDB
- Offline scan
- Background sync
- Conflict resolution

---

## Struktur Navigasi

```
Dashboard
Inventory
├── Produk
├── Kategori
├── Gudang
├── Stok Rendah
└── Transfer Stok

Pemindaian
├── Mulai Scan
├── Scan Barcode
├── Kalibrasi Produk
└── Riwayat Scan

Aktivitas
├── Stok Masuk
├── Stok Keluar
├── Stock Opname
├── Penyesuaian
└── Riwayat Stok

Laporan
├── Statistik
├── Performa Deteksi
└── Export Data

Administrasi
├── Pengguna
├── Audit Log
└── Pengaturan
```

---

## Halaman yang Dibutuhkan

1. Landing page
2. Registrasi
3. Login
4. Lupa password
5. Dashboard
6. Daftar produk
7. Tambah produk
8. Edit produk
9. Detail produk
10. Daftar kategori
11. Daftar gudang
12. Detail gudang
13. Halaman scan
14. Halaman hasil scan
15. Halaman koreksi
16. Scan barcode
17. Kalibrasi produk
18. Preview parameter OpenCV
19. Stok masuk
20. Stok keluar
21. Stock opname
22. Detail sesi opname
23. Transfer stok
24. Riwayat scan
25. Detail scan
26. Riwayat stok
27. Laporan
28. Export data
29. Import data
30. Notifikasi
31. Pengguna
32. Audit log
33. Profil
34. Pengaturan
35. Pemeriksaan perangkat
36. Halaman offline
37. Penyelesaian konflik sinkronisasi

---

## Model Database

### users
- id, organization_id, name, email, password_hash, role, avatar_url, status, last_login_at, created_at, updated_at

### organizations
- id, name, logo_url, address, phone, email, timezone, created_at, updated_at

### warehouses
- id, organization_id, name, code, address, manager_id, status, created_at, updated_at

### categories
- id, organization_id, name, code, description, icon, status, created_at, updated_at

### products
- id, organization_id, category_id, name, sku, barcode, unit, description, image_url, minimum_stock, maximum_stock, status, created_at, updated_at

### warehouse_stocks
- id, warehouse_id, product_id, quantity, updated_at

### detection_profiles
- id, product_id, name, detection_type, color_mode, min_area, max_area, min_width, max_width, min_height, max_height, min_aspect_ratio, max_aspect_ratio, min_circularity, threshold_mode, threshold_value, blur_kernel, morphology_kernel, hsv_min, hsv_max, is_active, version, created_at, updated_at

### scan_sessions
- id, user_id, product_id, warehouse_id, detection_profile_id, scan_mode, transaction_type, detected_count, confirmed_count, processing_time_ms, image_quality, device_type, browser, image_url, correction_reason, sync_status, created_at

### inventory_movements
- id, product_id, warehouse_id, scan_session_id, user_id, movement_type, quantity, previous_stock, current_stock, reference_number, notes, created_at

### stock_opnames
- id, warehouse_id, name, status, assigned_to, approved_by, started_at, completed_at, notes, created_at, updated_at

### stock_opname_items
- id, stock_opname_id, product_id, system_quantity, detected_quantity, confirmed_quantity, difference, reason, image_url, status, created_at, updated_at

### stock_transfers
- id, source_warehouse_id, destination_warehouse_id, status, created_by, received_by, notes, created_at, updated_at

### stock_transfer_items
- id, stock_transfer_id, product_id, quantity, created_at

### notifications
- id, user_id, title, message, type, is_read, created_at

### audit_logs
- id, user_id, action, resource_type, resource_id, old_data, new_data, ip_address, user_agent, created_at

### organization_settings
- id, organization_id, key, value, updated_at

---

## REST API

### Authentication
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/auth/me`

### Users
- `GET /api/users`
- `POST /api/users`
- `GET /api/users/:id`
- `PUT /api/users/:id`
- `PATCH /api/users/:id/status`
- `DELETE /api/users/:id`

### Warehouses
- `GET /api/warehouses`
- `POST /api/warehouses`
- `GET /api/warehouses/:id`
- `PUT /api/warehouses/:id`
- `DELETE /api/warehouses/:id`

### Categories
- `GET /api/categories`
- `POST /api/categories`
- `GET /api/categories/:id`
- `PUT /api/categories/:id`
- `DELETE /api/categories/:id`

### Products
- `GET /api/products`
- `POST /api/products`
- `GET /api/products/:id`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`
- `GET /api/products/barcode/:barcode`
- `POST /api/products/import`
- `GET /api/products/export`

### Detection Profiles
- `GET /api/products/:id/detection-profiles`
- `POST /api/products/:id/detection-profiles`
- `GET /api/detection-profiles/:id`
- `PUT /api/detection-profiles/:id`
- `DELETE /api/detection-profiles/:id`
- `POST /api/detection-profiles/:id/activate`

### Scan Sessions
- `GET /api/scans`
- `POST /api/scans`
- `GET /api/scans/:id`
- `PUT /api/scans/:id`
- `DELETE /api/scans/:id`
- `POST /api/scans/sync`

### Inventory Movements
- `GET /api/inventory/movements`
- `POST /api/inventory/stock-in`
- `POST /api/inventory/stock-out`
- `POST /api/inventory/adjustment`
- `GET /api/inventory/summary`
- `GET /api/inventory/low-stock`

### Stock Opname
- `GET /api/stock-opnames`
- `POST /api/stock-opnames`
- `GET /api/stock-opnames/:id`
- `PUT /api/stock-opnames/:id`
- `POST /api/stock-opnames/:id/items`
- `POST /api/stock-opnames/:id/submit`
- `POST /api/stock-opnames/:id/approve`
- `POST /api/stock-opnames/:id/reject`
- `DELETE /api/stock-opnames/:id`

### Transfers
- `GET /api/transfers`
- `POST /api/transfers`
- `GET /api/transfers/:id`
- `POST /api/transfers/:id/send`
- `POST /api/transfers/:id/receive`
- `POST /api/transfers/:id/cancel`

### Reports
- `GET /api/reports/dashboard`
- `GET /api/reports/inventory`
- `GET /api/reports/movements`
- `GET /api/reports/scans`
- `GET /api/reports/detection-performance`
- `GET /api/reports/export`

### Notifications & Audit Logs
- `GET /api/notifications`
- `PATCH /api/notifications/:id/read`
- `PATCH /api/notifications/read-all`
- `GET /api/audit-logs`
- `GET /api/audit-logs/:id`

---

## Validasi Backend

Setiap endpoint database harus menggunakan `try...catch`.

Validasi meliputi:
- Field wajib
- Format email
- Nilai angka
- Jumlah tidak negatif
- Produk harus tersedia
- Gudang harus valid
- Pengguna memiliki akses
- Stok cukup
- SKU dan barcode unik
- File menggunakan format yang diizinkan
- Ukuran file tidak melebihi batas
- Parameter OpenCV berada dalam rentang yang valid

### HTTP Status Code
- `200` — berhasil
- `201` — data berhasil dibuat
- `400` — request tidak valid
- `401` — belum login
- `403` — tidak memiliki izin
- `404` — data tidak ditemukan
- `409` — konflik data
- `422` — validasi gagal
- `500` — kesalahan server

---

## Keamanan

- Password menggunakan bcrypt
- Authentication menggunakan session aman atau JWT
- Cookie menggunakan `HttpOnly`
- HTTPS wajib
- Implementasi CORS
- Rate limiting pada login
- Validasi dan sanitasi input
- Proteksi SQL injection melalui ORM
- Proteksi XSS
- Proteksi CSRF apabila menggunakan cookie session
- Role-based access control
- File upload dibatasi
- Secret disimpan dalam environment variable
- Audit log untuk aktivitas sensitif
- Foto tidak bersifat publik
- Metadata EXIF dihapus
- Session dapat dicabut oleh admin

---

## Privasi

Pada halaman kamera harus ditampilkan:
> Pemrosesan gambar dilakukan langsung pada perangkat Anda. Video kamera tidak dikirim ke server. Foto hanya disimpan apabila Anda memilih untuk menyimpannya sebagai bukti.

Data perangkat yang disimpan hanya:
- Jenis perangkat
- Browser
- Durasi proses
- Resolusi scan
- Status keberhasilan

Tidak menyimpan:
- Rekaman video
- Lokasi presisi tanpa izin
- Audio
- Isi kamera di luar frame yang dikonfirmasi

---

## Persyaratan Nonfungsional

### Performa
- Dashboard terbuka maksimal 3 detik pada koneksi normal
- Pemrosesan foto target di bawah 2 detik pada perangkat menengah
- Live detection berjalan minimal 5 FPS
- Gambar dikompresi sebelum upload
- API pagination digunakan untuk daftar besar

### Kompatibilitas
- Chrome Android
- Chrome Desktop
- Microsoft Edge
- Safari iOS (dengan keterbatasan)
- Firefox Desktop

### Responsivitas
- Mobile 360px
- Tablet
- Laptop
- Desktop

### Aksesibilitas
- Label form jelas
- Kontras warna cukup
- Navigasi keyboard pada desktop
- Pesan error tidak hanya berdasarkan warna
- Tombol memiliki ukuran yang nyaman pada HP

---

## Tahapan Development

### Tahap 1 — Fondasi
- Setup project
- Database
- Authentication
- Role
- Organisasi
- Gudang
- Produk
- Kategori

### Tahap 2 — Inventory
- Stok masuk
- Stok keluar
- Riwayat stok
- Stok rendah
- Penyesuaian

### Tahap 3 — Kamera dan OpenCV
- Akses kamera
- Capture canvas
- Image quality
- Contour detection
- Bounding box
- Koreksi hasil

### Tahap 4 — Kalibrasi dan live detection
- Profil deteksi
- Kalibrasi otomatis
- Kalibrasi manual
- Live detection
- Device performance adaptation

### Tahap 5 — Operasional lanjutan
- Stock opname
- Transfer gudang
- Barcode
- Import data
- Export laporan

### Tahap 6 — PWA dan offline
- Service worker
- IndexedDB
- Offline scan
- Background sync
- Conflict resolution

### Tahap 7 — Administrasi dan pelaporan
- Dashboard
- Statistik
- Audit log
- Notifikasi
- Manajemen pengguna
- Pengaturan

### Tahap 8 — Finalisasi
- Responsive testing
- Security testing
- API documentation
- README
- Deployment
- User testing
- Perbaikan bug

---

## Definition of Done

Countory dinyatakan selesai apabila:
- Seluruh halaman utama tersedia
- CRUD produk, kategori, gudang, dan pengguna berjalan
- Kamera dapat digunakan di HP dan komputer
- OpenCV memproses gambar pada perangkat pengguna
- Mode foto dan live detection berjalan
- Kalibrasi produk tersedia
- Stok masuk dan keluar berjalan
- Stock opname berjalan
- Transfer gudang berjalan
- Riwayat dan audit log tersedia
- Laporan dapat diekspor
- PWA dapat dipasang
- Mode offline dapat menyimpan scan
- Sinkronisasi offline berjalan
- Aplikasi responsive
- Backend memiliki validasi dan error handling
- Database berada di cloud
- Aplikasi telah di-deploy melalui HTTPS
- README dan daftar endpoint tersedia
- Tidak terdapat `.env` dan `node_modules` dalam repository

---

## Fitur di Luar Ruang Lingkup Saat Ini

- Pengenalan banyak jenis produk sekaligus menggunakan AI
- Face recognition
- Pembayaran
- Marketplace
- Integrasi mesin kasir
- Integrasi ERP eksternal
- Prediksi pembelian otomatis
- Deteksi produk yang sepenuhnya tertutup
- Penghitungan barang bertumpuk secara 3D
- Aplikasi native Android atau iOS

---

## Getting Started

### Prerequisites
- Node.js
- MySQL
- npm atau yarn

### Installation
```bash
# Clone repository
git clone https://github.com/Finn331/Countory.git
cd Countory

# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Setup database
npx prisma generate
npx prisma db push

# Run development
npm run dev
```

### Environment Variables
```
DATABASE_URL="mysql://..."
JWT_SECRET="your-secret-key"
SESSION_SECRET="your-session-secret"
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
```

## License

MIT
