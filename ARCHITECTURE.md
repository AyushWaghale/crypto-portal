# NovaTrade — System Architecture

## Full System Architecture Diagram

```mermaid
graph TB
    %% ─── External Services ───────────────────────────────────────────
    subgraph EXTERNAL["☁️  External Services"]
        CG["🦎 CoinGecko API\n(Free Tier)\nGET /simple/price\n10 coins"]
    end

    %% ─── Browser ─────────────────────────────────────────────────────
    subgraph BROWSER["🌐  User Browser  ─  Vercel CDN"]
        direction TB
        APP["App.tsx\nReact Router + Socket Listener"]
        STORE["Zustand Store\nprices[ ] + JWT token"]
        SOCKETCLIENT["Socket.IO Client\nlib/socket.ts"]

        subgraph PAGES["Pages"]
            direction LR
            PG1["Dashboard\nLive prices table\n+ sparklines"]
            PG2["CoinDetails\n24h chart\nSet Alert button"]
            PG3["Alerts\nCreate & view\nprice alerts"]
            PG4["Portfolio\nHoldings +\nLive P&L"]
            PG5["Analytics\nVolatility\nbar chart"]
        end

        APP --> STORE
        APP --> SOCKETCLIENT
        PAGES --> STORE
    end

    %% ─── Backend ─────────────────────────────────────────────────────
    subgraph RENDER["⚙️  Render  ─  Single Docker Container"]
        direction TB

        subgraph API_SERVER["Express API Server  (Port 4000)"]
            AUTH_MW["JWT Middleware\nauth.ts"]
            R_AUTH["POST /api/auth/register\nPOST /api/auth/login\nbcrypt + jwt.sign"]
            R_PRICES["GET /api/prices/live\nGET /api/prices/history/:id"]
            R_ALERTS["GET + POST /api/alerts\n🔒 JWT Protected"]
            R_PORT["GET + POST /api/portfolio\n🔒 JWT Protected"]
            R_DOCS["GET /api/docs\nSwagger UI"]
        end

        subgraph WS_SERVER["Socket.IO Server  (same HTTP port)"]
            WS_SUB["Redis Subscriber\n(separate connection)"]
            WS_EMIT["Emit to Clients\nprices_update → all\nalert_userId → targeted"]
            WS_SUB --> WS_EMIT
        end

        subgraph WORKER["Background Worker  (node dist/worker.js)"]
            W_FETCH["Fetch Prices\nevery 15 seconds"]
            W_CACHE["Cache to Redis\ncrypto_prices key\n60s TTL"]
            W_HIST["INSERT PriceHistory\nPostgreSQL"]
            W_ALERT["Check Active Alerts\ncompare price vs target"]
            W_TRIGGER["DELETE Alert\nPUBLISH alerts_trigger"]

            W_FETCH --> W_CACHE
            W_FETCH --> W_HIST
            W_FETCH --> W_ALERT
            W_ALERT -->|"condition met"| W_TRIGGER
        end
    end

    %% ─── Data Layer ──────────────────────────────────────────────────
    subgraph DATA["🗄️  Data Layer"]
        subgraph NEON["Neon.tech — PostgreSQL"]
            DB_USER["User\nid · email · password\n(bcrypt hashed)"]
            DB_ALERT["Alert\nuserId · coinId\ncondition · targetPrice\nisActive"]
            DB_PORT["Portfolio\nuserId · coinId\nquantity · purchasePrice"]
            DB_HIST["PriceHistory\ncoinId · price\ntimestamp\n[index: coinId+time]"]
            DB_USER -->|"1 → N"| DB_ALERT
            DB_USER -->|"1 → N"| DB_PORT
        end

        subgraph UPSTASH["Upstash — Redis"]
            R_CACHE_KEY["Key: crypto_prices\nTTL: 60 seconds\nJSON array of prices"]
            R_PUBSUB["Pub/Sub Channels\n• prices_update\n• alerts_trigger"]
        end
    end

    %% ─── Connections ─────────────────────────────────────────────────

    %% Worker ↔ External
    W_FETCH -->|"GET prices every 15s"| CG

    %% Worker ↔ Redis
    W_CACHE -->|"SET"| R_CACHE_KEY
    W_FETCH -->|"PUBLISH"| R_PUBSUB
    W_TRIGGER -->|"PUBLISH alerts_trigger"| R_PUBSUB

    %% Worker ↔ Postgres
    W_HIST -->|"INSERT"| DB_HIST
    W_ALERT -->|"SELECT isActive=true"| DB_ALERT
    W_TRIGGER -->|"DELETE"| DB_ALERT

    %% WebSocket Server ↔ Redis
    WS_SUB -->|"SUBSCRIBE"| R_PUBSUB

    %% API ↔ Redis
    R_PRICES -->|"GET crypto_prices"| R_CACHE_KEY

    %% API ↔ Postgres
    R_AUTH -->|"findUnique / create"| DB_USER
    R_ALERTS -->|"findMany / create"| DB_ALERT
    R_PORT -->|"findMany / create"| DB_PORT
    R_PRICES -->|"findMany (history)"| DB_HIST

    %% Browser ↔ API (REST)
    PAGES -->|"HTTPS REST calls\nAuthorization: Bearer JWT"| AUTH_MW
    AUTH_MW --> R_ALERTS
    AUTH_MW --> R_PORT
    PAGES -->|"Public REST"| R_AUTH
    PAGES -->|"Public REST"| R_PRICES

    %% Browser ↔ WebSocket
    SOCKETCLIENT <-->|"WSS persistent connection"| WS_EMIT

    %% WebSocket push → Store
    WS_EMIT -->|"prices_update event"| STORE
    WS_EMIT -->|"alert_userId event\n→ toast notification"| APP

    %% Styles
    classDef external fill:#1e293b,stroke:#38bdf8,color:#38bdf8
    classDef browser fill:#0f172a,stroke:#818cf8,color:#e2e8f0
    classDef backend fill:#0f172a,stroke:#34d399,color:#e2e8f0
    classDef data fill:#0f172a,stroke:#fb923c,color:#e2e8f0
    classDef highlight fill:#1d4ed8,stroke:#60a5fa,color:#fff

    class CG external
    class APP,STORE,SOCKETCLIENT,PAGES,PG1,PG2,PG3,PG4,PG5 browser
    class API_SERVER,WS_SERVER,WORKER,AUTH_MW,R_AUTH,R_PRICES,R_ALERTS,R_PORT,R_DOCS,WS_SUB,WS_EMIT,W_FETCH,W_CACHE,W_HIST,W_ALERT,W_TRIGGER backend
    class DB_USER,DB_ALERT,DB_PORT,DB_HIST,R_CACHE_KEY,R_PUBSUB data
```

---

## Key Design Decisions

### 1. Redis as the Communication Backbone
The Background Worker and the API Server run as **separate Node.js processes** and cannot share memory. Redis Pub/Sub acts as the message broker between them. The worker publishes events; the WebSocket server subscribes and forwards them to browsers over persistent WebSocket connections. This decouples the data pipeline from the HTTP layer.

### 2. Two Redis Connections in the WebSocket Service
`websocket.ts` creates a **dedicated** ioredis instance for subscribing (`redisSubscriber`), separate from the shared `redis` client used for caching. This is a hard requirement of Redis — a connection in subscribe mode cannot send any other commands.

### 3. Single Container Deployment (Free Tier Optimized)
On Render's free tier, only one Web Service is available. The `start:all` npm script runs both `dist/server.js` and `dist/worker.js` in the same container using shell `&` to background the server process. `prisma db push` runs before both to ensure the schema is always synced.

### 4. JWT Stored in localStorage via Zustand
The Zustand store initializes `token` from `localStorage.getItem('token')`, making auth persist across page refreshes. On logout, `setToken(null)` removes it. The token is decoded client-side using `jwt-decode` (no extra API call) to extract the user's email for display and the user's ID for targeted WebSocket alert subscriptions.

### 5. Alert Lifecycle: Create → Evaluate → Delete
Alerts are **one-shot triggers**. Once a price condition is met, the worker immediately `DELETE`s the alert from the database and publishes the trigger event. This prevents duplicate notifications and automatically cleans up the database.

### 6. Zod Validation on All Inputs
Every route that accepts a request body parses it through a `z.object()` schema before touching the database. This provides type-safe, human-readable validation errors and protects against malformed data.

---

## Request Lifecycle (Protected Endpoint Example)

```
Browser → HTTPS POST /api/alerts → Render
    └─▶ auth middleware: verify JWT Bearer token
           ├─ invalid → 401/403
           └─ valid   → req.user.id attached
              └─▶ alerts.ts route handler
                     └─▶ Zod validate body
                            ├─ invalid → 400
                            └─ valid
                               └─▶ prisma.alert.create(...)
                                      └─▶ Neon PostgreSQL
                                             └─▶ 201 { alert }
```

## Data Flow Summary

| Flow | Trigger | Path |
|------|---------|------|
| Live prices to browser | Every 15s | Worker → Redis PUBLISH → WS Server → Socket.IO emit → Zustand store → React re-render |
| Price history API | User visits `/coin/:id` | Browser → GET /api/prices/history/:id → Prisma → Neon → JSON |
| Alert creation | User submits form | Browser → POST /api/alerts → JWT check → Prisma → Neon |
| Alert trigger notification | Price condition met | Worker evaluates → DELETE alert → Redis PUBLISH → WS Server → `alert_userId` socket event → toast |
| Portfolio P&L | Real-time | Zustand prices × DB positions (client-side computation, no extra API call) |
