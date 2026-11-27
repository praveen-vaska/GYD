# GYD-backend

Shared standalone REST API server (`Express + TypeScript + MongoDB Atlas`) serving:
- **GYD-web** (`http://localhost:3000` proxying `/api/*` -> `http://127.0.0.1:4000/api/*`)
- **GYD-user** (Flutter Customer App -> port `4000`)
- **GYD-designer** (Designer App -> port `4000`)

## Setup & Commands

```bash
npm install
npm run dev        # Starts Express API server on http://localhost:4000
npm run typecheck  # TypeScript check
npm run build      # Compiles to dist/
npm start          # Runs compiled server
npm run seed:mongodb
```

## Endpoints
- `GET /api/health` (`?fast=1` liveness mode)
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/refresh`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`, `POST /api/auth/logout`
- `GET / PATCH / POST /api/marketplace`
- `GET / POST / DELETE /api/categories`
- `GET /api/designers`, `GET /api/designers/:id` (profile, services, packages, portfolios, live slots, reviews & FAQs)
- `GET / POST / PATCH /api/bookings`, `POST /api/bookings/quote`
- `GET /api/favourites`, `POST /api/favourites/toggle`
- `POST /api/conversations/enquiry`
- `GET / POST / PATCH /api/users`
- `GET /api/places/search`
- `GET / POST / DELETE /api/admin/auth`
- `POST /api/payments/razorpay/webhook`
- Static media served from `/images/*` (`public/images/`)

## Cloud Deployment (Render / Railway)

- **Render Blueprint:** [`render.yaml`](render.yaml) | **Railway:** [`railway.json`](railway.json) | **Docker:** [`Dockerfile`](Dockerfile)
- **Build Command:** `npm install --include=dev && npm run build`
- **Start Command:** `npm start`
- **Health Check Path:** `/api/health?fast=1`
- **Required Env Vars:** `MONGODB_URI`, `MONGODB_DB=gyd_marketplace`, `AUTH_SECRET`, `GYD_ADMIN_EMAIL`, `GYD_ADMIN_PASSWORD`, `CORS_ORIGINS=*` (or comma-separated web origins), `NODE_ENV=production`
- **MongoDB Atlas Network Access:** Ensure `0.0.0.0/0` is allowed in Atlas Network Access so cloud containers can connect.

## Connect Flutter (`GYD-user`) to Your Live URL

```bash
flutter build apk --release --dart-define=GYD_API_BASE_URL=https://YOUR_LIVE_BACKEND_URL
```
