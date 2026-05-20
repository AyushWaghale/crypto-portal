# NovaTrade — Crypto Market Intelligence Platform

> A production-grade, real-time cryptocurrency intelligence platform powered by live WebSocket price streaming, custom price alerts, and portfolio tracking.

🌐 **Live Demo:** [https://crypto-portal-pi.vercel.app](https://crypto-portal-pi.vercel.app)

---

## Features

| Feature | Description |
|---------|-------------|
| 📈 **Live Market Dashboard** | Real-time prices for 10 major cryptocurrencies, auto-updating every 15 seconds via WebSocket without page refresh |
| 🔔 **Price Alerts** | Set "above" or "below" price targets per coin. Triggered alerts deliver instant toast notifications via WebSocket push and are automatically deleted |
| 💼 **Portfolio Tracker** | Track holdings with purchase price; live P&L calculated client-side using real-time prices |
| 📊 **Analytics** | 24h volatility bar chart across all tracked assets |
| 🔐 **Authentication** | JWT-based auth with bcrypt password hashing. Secure token stored in localStorage |
| 🌙 **Light / Dark Mode** | Persistent theme toggle stored in localStorage |

---

## Tech Stack

### Backend
| Technology | Purpose |
|-----------|---------|
| **Node.js + Express** | REST API server — non-blocking I/O ideal for WebSocket + HTTP concurrency |
| **Socket.IO** | WebSocket server for real-time price broadcasting and targeted alert delivery |
| **PostgreSQL + Prisma** | Persistent storage for users, alerts, portfolio, and price history. Prisma provides type-safe ORM queries |
| **Redis (ioredis)** | Two roles: (1) Cache for latest prices (`crypto_prices` key, 60s TTL), (2) Pub/Sub bridge between the worker process and the WebSocket server |
| **bcrypt** | Password hashing with salt rounds = 10 |
| **jsonwebtoken** | JWT token signing (1 day expiry) and verification via middleware |
| **Zod** | Schema validation on all request bodies |
| **Swagger UI** | Interactive API documentation at `/api/docs` |

### Background Worker
| Technology | Purpose |
|-----------|---------|
| **CoinGecko API** | Free external price feed for 10 coins every 15 seconds |
| **Node.js (separate process)** | Runs independently; publishes to Redis, writes to PostgreSQL, evaluates alerts |

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React + Vite + TypeScript** | Fast SPA bundler with full type safety |
| **Zustand** | Lightweight global state management (prices array + JWT token) |
| **Socket.IO Client** | Maintains persistent WSS connection to receive live updates |
| **Recharts** | AreaChart sparklines, LineChart (coin detail), BarChart (analytics) |
| **Shadcn/UI + Tailwind CSS** | Premium component library with consistent design tokens |
| **Sonner** | Toast notifications for alerts and form actions |
| **jwt-decode** | Client-side JWT decoding to extract email/userId without an API call |

---

## System Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full Mermaid system diagram.

```
                  CoinGecko API
                       │
                       ▼ (every 15s)
          ┌────────────────────────────┐
          │     Background Worker      │
          │  Fetch → Cache → Publish   │
          └───────────┬────────────────┘
                      │
              Redis Pub/Sub
                      │
          ┌───────────▼────────────────┐
          │   Express API + Socket.IO  │
          │   REST routes + WS Server  │
          └───────────┬────────────────┘
                      │ WSS + HTTPS
          ┌───────────▼────────────────┐
          │   React SPA (Browser)      │
          │   Zustand Store + Recharts │
          └────────────────────────────┘
              │                │
         PostgreSQL           Redis
         (Persistent)        (Cache + Pub/Sub)
```

---

## Local Development Setup

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- Git

### 1. Clone the repository
```bash
git clone https://github.com/your-username/crypto-platform.git
cd crypto-platform
```

### 2. Configure environment variables
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```env
PORT=4000
DATABASE_URL="postgresql://postgres:postgres@db:5432/crypto"
REDIS_URL="redis://redis:6379"
JWT_SECRET="your-strong-secret-key-here"
```

### 3. Start all services
```bash
docker-compose up --build
```

This starts **4 containers** simultaneously:
- `redis` — Redis on port 6379
- `backend` — Express API on port 4000 (runs `prisma db push` + starts server)
- `worker` — Background price fetcher
- `frontend` — React dev server on port 3000

### 4. Open the app
| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:4000 |
| API Docs (Swagger) | http://localhost:4000/api/docs |

---

## Without Docker (Manual Setup)

### Backend
```bash
cd backend
npm install
# Set up your own PostgreSQL and Redis, then:
npx prisma db push
npm run dev          # API server (port 4000)
npm run worker       # Background worker (separate terminal)
```

### Frontend
```bash
cd frontend
npm install
# Create .env.local:
echo "VITE_BACKEND_URL=http://localhost:4000" > .env.local
npm run dev          # Dev server (port 5173)
```

---

## API Reference

All protected routes require: `Authorization: Bearer <jwt_token>`

### Auth
```
POST /api/auth/register   { email, password }  →  { token }
POST /api/auth/login      { email, password }  →  { token }
```

### Prices
```
GET  /api/prices/live              → CryptoPrice[]   (from Redis cache)
GET  /api/prices/history/:coinId   → PriceHistory[]  (last 100 records)
```

### Alerts 🔒
```
GET  /api/alerts                   → Alert[]
POST /api/alerts   { coinId, condition: "above"|"below", targetPrice }  →  Alert
```

### Portfolio 🔒
```
GET  /api/portfolio                → Portfolio[]
POST /api/portfolio/positions      { coinId, quantity, purchasePrice }  →  Portfolio
```

### Health
```
GET  /api/admin/health             → { status: "ok", timestamp }
GET  /api/docs                     → Swagger UI
```

---

## WebSocket Events

Connect to the backend URL via Socket.IO client.

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `prices_update` | Server → All clients | `CryptoPrice[]` | Broadcast every 15s when new prices arrive |
| `alert_<userId>` | Server → Specific client | `{ coinId, targetPrice, currentPrice, ... }` | Fired when a user's alert triggers |

---

## Database Schema

```
User          Alert           Portfolio       PriceHistory
────          ─────           ─────────       ────────────
id (uuid)     id (uuid)       id (uuid)       id (uuid)
email         userId ─────▶   userId ─────▶   coinId
password      coinId          coinId          price
createdAt     condition       quantity        timestamp
updatedAt     targetPrice     purchasePrice
              isActive        createdAt
              createdAt
```

---

## Deployment (Free Tier)

| Service | Provider | Cost |
|---------|----------|------|
| Frontend | Vercel | Free |
| Backend API + Worker | Render (Docker) | Free |
| PostgreSQL | Neon.tech | Free forever |
| Redis | Upstash | Free serverless |

### Environment Variables

**Render (Backend):**
```
DATABASE_URL=<your-neon-connection-string>
REDIS_URL=<your-upstash-redis-url>
JWT_SECRET=<your-strong-secret>
```

**Vercel (Frontend):**
```
VITE_BACKEND_URL=<your-render-service-url>
```

### Docker Build & Start Command
The Dockerfile runs this on container start:
```bash
npx prisma db push --accept-data-loss && node dist/server.js & node dist/worker.js
```
This ensures the database schema is always synced before starting both processes.

---

## Project Structure

```
crypto-platform/
├── backend/
│   ├── src/
│   │   ├── server.ts          # Express + Socket.IO entry point
│   │   ├── worker.ts          # Background price fetcher & alert evaluator
│   │   ├── routes/            # auth, prices, alerts, portfolio
│   │   ├── middleware/auth.ts # JWT Bearer token guard
│   │   └── services/          # db (Prisma), redis (ioredis), websocket
│   ├── prisma/schema.prisma   # DB schema: User, Alert, Portfolio, PriceHistory
│   ├── Dockerfile
│   └── swagger.yaml           # OpenAPI 3.0 spec
│
└── frontend/
    ├── src/
    │   ├── App.tsx            # Router + Socket.IO event listeners
    │   ├── store.ts           # Zustand store (prices + JWT)
    │   ├── lib/socket.ts      # Socket.IO client singleton
    │   ├── pages/             # Dashboard, CoinDetails, Alerts, Portfolio, Analytics, Login, Register
    │   └── components/        # Layout (sidebar/header), ThemeProvider, Shadcn UI
    └── vercel.json            # SPA routing fix (all routes → index.html)
```

---

## Running Tests

```bash
cd backend
npm test
```

10 automated tests covering: Auth (register/login), Prices (live/history), Alerts (create/fetch), Portfolio (add/fetch).

---

## Known Limitations & Future Improvements

- **Exponential backoff** for CoinGecko API rate-limit errors (currently fails gracefully but retries on next interval)
- **WebSocket rooms** — Currently all price updates are broadcast to all clients; could be optimized to only send to subscribed coins
- **End-to-end tests** with Cypress or Playwright
- **Candlestick charts** using real OHLCV data from CoinGecko Pro API
- **Push Notifications** (Web Push API) as a supplement to in-app WebSocket toasts
