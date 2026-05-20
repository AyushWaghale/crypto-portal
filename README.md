# NovaTrade - Crypto Market Intelligence Platform

## Overview
A production-grade SaaS platform that pulls live crypto prices from the CoinGecko API, processes the data in real-time using a background worker, and delivers insights via a highly polished, responsive interface using WebSockets. The system features custom alerts, portfolio tracking, and analytics dashboards.

## Tech Stack & Justification

- **Backend:** Node.js + Express
  Chosen for its non-blocking I/O, which is ideal for real-time WebSocket communication and handling concurrent API requests efficiently.
- **Database:** PostgreSQL (with Prisma ORM)
  Chosen for reliable persistence of user data, relational integrity (users -> alerts/portfolio), and capable handling of time-series price history. Prisma provides excellent Type safety.
- **Real-time:** Socket.io & Redis Pub/Sub
  Socket.io offers robust WebSocket connections with automatic fallbacks and reconnections. Redis Pub/Sub enables the background worker to communicate efficiently with the API server process for real-time broadcasting.
- **Frontend:** React + Vite + TypeScript (Tailwind CSS, Shadcn UI, Zustand, Recharts)
  Chosen to deliver a premium, highly responsive UI with smooth interactions, performant state management, and aesthetic data visualization.

## Architecture
Please refer to [ARCHITECTURE.md](./ARCHITECTURE.md) for the system design diagram.

## Setup Instructions

```bash
# Clone repo
git clone https://github.com/your-username/crypto-platform.git
cd crypto-platform

# Start all services
docker-compose up
```

### Application URLs:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:4000
- **Database:** localhost:5432
- **Redis:** localhost:6379

## Demo Credentials
Email: demo@novatrade.io
Password: demo123

## Known Limitations
- Given more time, I would implement robust rate-limiting and exponential backoff strategies to handle CoinGecko API limitations more gracefully in edge cases.
- Comprehensive end-to-end testing with Cypress or Playwright.

## Time Breakdown
- Backend: 2h
- Frontend: 3h
- Testing & Docs: 1h
Total: 6h
