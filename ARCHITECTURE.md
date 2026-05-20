# Architecture Diagram

```mermaid
graph TD
    subgraph External
        CG[CoinGecko API\nRate Limited]
    end

    subgraph Backend Infrastructure
        Worker[Background Worker Process\nFetches prices every 15s]
        API[Node.js + Express API\n+ Socket.io Server]
        Redis[(Redis Cache & Pub/Sub)]
        DB[(PostgreSQL)]
    end

    subgraph Client
        UI[React Frontend\nZustand, Recharts, Tailwind]
    end

    Worker -->|Fetch Prices| CG
    Worker -->|Cache Prices| Redis
    Worker -->|Publish 'prices_update'| Redis
    Worker -->|Store Price History| DB
    Worker -->|Check & Trigger Alerts| DB
    Worker -->|Publish 'alerts_trigger'| Redis

    Redis -->|Subscribe Events| API
    API -->|Read/Write Data| DB
    
    API <-->|WebSocket Broadcast| UI
    UI -->|REST API Calls| API
```

## Key Decisions
1. **Separation of Concerns:** The background worker runs in a separate container/process from the main API server. This ensures that heavy processing or API rate limiting does not block HTTP requests to the API server.
2. **Redis Pub/Sub:** Used to bridge communication between the isolated worker process and the WebSocket server for real-time notifications.
3. **Database Caching:** Redis caches the latest prices to serve `GET /api/prices/live` instantly, preventing unnecessary database load and avoiding CoinGecko rate limits.
