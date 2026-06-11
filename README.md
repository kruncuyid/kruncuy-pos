# KRUNCUY POS

Sistem Point of Sale (POS) dan ERP untuk outlet makanan KRUNCUY. Proyek ini terdiri dari frontend React dan backend Express + Prisma + PostgreSQL.

## Fitur utama

- **ERP dashboard** untuk admin, owner, purchasing
- **Crew app** untuk kasir dan operasional outlet
- Transaksi POS, cash session, cash withdrawal (OTP), inventory, stock opname
- Depot transfer, outlet expense, attendance crew
- **Reports Center** dengan 32 laporan operasional (filter, export Excel/PDF)
- Role-based access control (RBAC)

## Struktur proyek

```
kruncuy-pos/
├── backend/          # Express API + Prisma
├── frontend/         # React + Vite
└── README.md
```

## Prasyarat

- Node.js 20+
- PostgreSQL 14+
- npm

## Setup cepat

### 1. Database

Buat database PostgreSQL, lalu salin environment file backend:

```bash
cd backend
cp .env.example .env
```

Edit `DATABASE_URL` dan `JWT_SECRET` di `backend/.env`.

### 2. Backend

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
node prisma/seed.js
npm run dev
```

API berjalan di `http://localhost:5000`.

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Aplikasi berjalan di `http://localhost:5173`.

## Akun seed (development)

Setelah menjalankan `node prisma/seed.js`, gunakan akun yang ada di seed script (lihat `backend/prisma/seed.js`). Password default development ada di seed — **ganti sebelum production**.

## Scripts

### Backend

| Script | Keterangan |
|--------|------------|
| `npm run dev` | Jalankan API dengan nodemon |
| `npm run start` | Jalankan API production |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Jalankan migrasi database |
| `npm test` | Unit test backend |

### Frontend

| Script | Keterangan |
|--------|------------|
| `npm run dev` | Development server Vite |
| `npm run build` | Build production |
| `npm run lint` | ESLint |
| `npm test` | Unit test frontend |

## Reports

Semua laporan ERP dapat diakses dari `/erp/reports`. Data diambil dari API:

- `GET /api/reports/catalog`
- `GET /api/reports/sales-recap`
- `GET /api/reports/:reportKey`

Contoh report key: `daily-sales-recap`, `cash-sessions`, `inventory-stock`, `crew-attendance`, `audit-log`.

## Environment variables

### Backend (`backend/.env`)

| Variable | Wajib | Keterangan |
|----------|-------|------------|
| `DATABASE_URL` | Ya | Connection string PostgreSQL |
| `JWT_SECRET` | Ya | Secret untuk token JWT |
| `PORT` | Tidak | Default `5000` |
| `JWT_EXPIRES_IN` | Tidak | Default `7d` |
| `FRONTEND_URL` | Tidak | URL frontend untuk CORS production |
| `NODE_ENV` | Tidak | `development` atau `production` |

### Frontend (`frontend/.env`)

| Variable | Wajib | Keterangan |
|----------|-------|------------|
| `VITE_API_URL` | Tidak | Base URL API. Default: hostname saat ini + port 5000 |

## Testing

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test
```

## Catatan operasional

- Jangan jalankan lebih dari satu instance backend di port yang sama (error `EADDRINUSE`).
- Perubahan permission role tidak akan ter-reset saat server restart; gunakan **Sync Catalog** di Access Control hanya jika ingin reset ke default.
- Script `backend/scripts/resetOperationalState.js` menghapus data operasional — gunakan hanya di development.

## Lisensi

Private — internal KRUNCUY.
