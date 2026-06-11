# DEPLOY — KRUNCUY POS Online ($0 Biaya)

## Arsitektur

```
kruncuy-pos-api.onrender.com       ← Backend (Render, free)
  └── Supabase PostgreSQL           ← Database (Supabase, free)

kruncuy-pos.vercel.app              ← Frontend (Vercel, free)
  └── API rewrite ke Render
```

## Langkah 1: Database — Supabase

1. Buka https://supabase.com → Sign up (GitHub/Email)
2. Create project:
   - **Name:** `kruncuy-pos`
   - **Database Password:** simpan baik-baik
   - **Region:** Singapore (terdekat)
3. Tunggu provisioning (~2 menit)
4. Buka **Project Settings → Database → Connection string → URI**
   - Copy URI: `postgresql://postgres:xxxxx@db.xxxxx.supabase.co:5432/postgres`
   - **Ganti `xxxxx` dengan password yang kamu buat di langkah 2**
5. Simpan URI ini — akan dipakai di Langkah 2

## Langkah 2: Backend — Render

1. Buka https://dashboard.render.com → Sign up (GitHub)
2. Klik **New + → Blueprint**
3. Connect GitHub repo → pilih `kruncuy-pos`
4. Render akan otomatis baca `render.yaml` dan buat:
   - **Web Service:** `kruncuy-pos-api` (Express backend)
   - **PostgreSQL:** `kruncuy-pos-db` (database)
   - **Cron Job:** `kruncuy-pos-keep-alive` (cek tiap 10 menit)
5. **Set environment variable manual:**
   - Set `DATABASE_URL` dengan connection string dari Supabase (Langkah 1.4)
   - Set `JWT_SECRET` — generate dengan:
     ```
     node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
     ```
6. Klik **Apply** → tunggu build (~5 menit)
7. Cek: buka `https://kruncuy-pos-api.onrender.com/api/health`

## Langkah 3: Seed Data

Jalankan seed setelah backend deploy:

```bash
# Install dependensi
cd backend
npm install

# Set DATABASE_URL ke Supabase URI
$env:DATABASE_URL="postgresql://postgres:xxxxx@db.xxxxx.supabase.co:5432/postgres"

# Generate Prisma client
npx prisma generate

# Push schema + seed
npx prisma db push
node prisma/seed.js
```

## Langkah 4: Frontend — Vercel

1. Buka https://vercel.com → Sign up (GitHub)
2. Klik **Add New → Project**
3. Import GitHub repo → pilih `kruncuy-pos`
4. **Root Directory:** pilih `frontend`
5. **Framework Preset:** `Vite` (auto-detect)
6. **Environment Variables:**
   - `VITE_API_URL`: `https://kruncuy-pos-api.onrender.com/api`
7. Klik **Deploy** → tunggu ~2 menit
8. Cek: buka URL Vercel yang dihasilkan

## Langkah 5: Login

### Akun default (dari seed):
| Role | Username | Password |
|------|----------|----------|
| **Superadmin** | `superadmin` | `superadmin123` |
| **Admin** | `admin` | `admin123` |
| **Owner** | `owner` | `owner123` |
| **Crew** | `crew` | `crew123` |

## Monitoring

| Layanan | URL |
|---------|-----|
| Backend | `https://kruncuy-pos-api.onrender.com/api/health` |
| Frontend | `https://kruncuy-pos.vercel.app` |
| Render Dashboard | https://dashboard.render.com |
| Supabase Dashboard | https://supabase.com/dashboard |

## Troubleshooting

### Backend 502 / Gateway Timeout
- Render free tier bisa **sleep setelah 15 menit idle**
- Cron job keep-alive sudah terpasang (tiap 10 menit)
- Jika kena sleep: tunggu 30-60 detik, refresh

### Database Connection Error
- Cek IP Supabase tidak di-allow list (setting: Project Settings → Database → IP Restrictions → Allow all IPs)
- Pastikan password benar di connection string
- URL encode password jika ada karakter spesial

### CORS Error
- Pastikan `FRONTEND_URL` di Render Environment Variables = URL Vercel
- Contoh: `FRONTEND_URL=https://kruncuy-pos.vercel.app`

### Prisma Error
- Jalankan: `npx prisma generate`
- Jalankan: `npx prisma db push`
- Cek DATABASE_URL benar

---

**Estimasi total waktu: 20-30 menit**
**Biaya: $0/bulan** (free tier semua platform)
