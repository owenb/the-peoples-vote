# OpenGov Mirror Server (TypeScript)

> **Automated system for mirroring Polkadot OpenGov proposals from Polkassembly to Paseo Asset Hub testnet with Arkiv decentralized storage.**

🎉 **Now powered by TypeScript with native Arkiv SDK support!**

## Overview

This server automatically:
1. **Scrapes** Polkadot OpenGov proposals from Polkassembly (status="Deciding", created after Sept 1, 2025)
2. **Stores** proposal descriptions in Arkiv network (7-day TTL)
3. **Creates** Vote contracts on Paseo Asset Hub via VoteFactory
4. **Tracks** all mirrored proposals in SQLite database
5. **Exposes** REST API for frontend integration
6. **Runs** hourly cron job for automatic syncing

## Features

- ✅ **TypeScript** - Full type safety and modern JavaScript features
- ✅ **Native Arkiv SDK** - Official TypeScript SDK with WebSocket support
- ✅ **Ethers.js v6** - Modern Ethereum library for Paseo integration
- ✅ **Better SQLite3** - Fast, synchronous database operations
- ✅ **Pino Logging** - Structured, high-performance logging
- ✅ **Express API** - Clean REST API with proper error handling
- ✅ **Cron Scheduler** - Automated hourly syncing

## Prerequisites

- Node.js 18+ (LTS recommended)
- Funded wallet on Paseo Asset Hub
- Arkiv network credentials

## Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.ts.example` to `.env` and fill in your credentials:

```bash
cp .env.ts.example .env
```

Edit `.env`:

```bash
# Paseo Asset Hub (UPDATED - Using ETH RPC)
PASEO_RPC_URL=https://paseo-asset-hub-eth-rpc.polkadot.io
PASEO_WALLET_ADDRESS=0xYourPaseoAddress
PASEO_PRIVATE_KEY=0xYourPrivateKey

# Arkiv Network
ARKIV_RPC_URL=https://mendoza.hoodi.arkiv.network/rpc
ARKIV_WS_URL=wss://mendoza.hoodi.arkiv.network/rpc/ws
ARKIV_PRIVATE_KEY=0xYourArkivPrivateKey

# Optional: adjust other settings as needed
SYNC_INTERVAL_HOURS=1
LOG_LEVEL=info
```

### 3. Initialize Database

```bash
npm run db:init
```

## Usage

### Development Mode (with auto-reload)

```bash
npm run dev
```

### Production Mode

```bash
# Build TypeScript
npm run build

# Start server
npm start
```

### Manual Sync

```bash
npm run sync
```

## API Endpoints

All endpoints return JSON responses.

### Health Check
```bash
GET /health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-16T03:30:00.000Z",
  "uptime": 123.456
}
```

### Get All Proposals
```bash
GET /proposals?status=completed&limit=100&offset=0

# Query params:
# - status: pending|processing|completed|failed
# - limit: max results (default: 100)
# - offset: pagination offset
```

### Get Single Proposal
```bash
GET /proposals/{id}
GET /proposals/polkassembly/{polkassembly_id}
```

### Trigger Manual Sync
```bash
POST /sync
```

Response:
```json
{
  "status": "completed",
  "message": "Sync completed: 5 new proposals mirrored",
  "stats": {
    "scraped": 12,
    "alreadyProcessed": 7,
    "newlyMirrored": 5,
    "failed": 0,
    "errors": []
  }
}
```

### Retry Failed Proposals
```bash
POST /retry-failed
```

### Get Statistics
```bash
GET /stats
```

Response:
```json
{
  "total": 100,
  "pending": 5,
  "processing": 2,
  "completed": 90,
  "failed": 3
}
```

## Configuration

All settings in `.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| `PASEO_RPC_URL` | Paseo ETH RPC endpoint | `https://paseo-asset-hub-eth-rpc.polkadot.io` |
| `PASEO_CHAIN_ID` | Chain ID for Paseo | `420420422` |
| `VOTE_FACTORY_ADDRESS` | VoteFactory contract address | `0x803ac2c25d0ef94289b3efc06dfc87a7903657f0` |
| `ARKIV_RPC_URL` | Arkiv HTTP endpoint | `https://mendoza.hoodi.arkiv.network/rpc` |
| `ARKIV_WS_URL` | Arkiv WebSocket endpoint | `wss://mendoza.hoodi.arkiv.network/rpc/ws` |
| `ARKIV_TTL_DAYS` | Arkiv storage TTL | `7` |
| `FILTER_START_DATE` | Only sync proposals after this date | `2025-09-01` |
| `DEFAULT_NUMBER_OF_VOTERS` | Max voters per proposal | `3` |
| `EXPIRATION_OFFSET_SECONDS` | Proposal expiration (1 year) | `31536000` |
| `SYNC_INTERVAL_HOURS` | Cron job frequency | `1` |
| `HOST` | Server host | `0.0.0.0` |
| `PORT` | Server port | `8000` |
| `LOG_LEVEL` | Logging level | `info` |

## Project Structure

```
src/
├── api/
│   └── server.ts           # Express API server
├── config.ts               # Configuration management
├── contracts/
│   └── VoteFactory.abi.json # Smart contract ABI
├── database/
│   └── db.ts               # SQLite database layer
├── scheduler/
│   └── cron.ts             # Cron job scheduler
├── scripts/
│   ├── init-db.ts          # Database initialization
│   └── manual-sync.ts      # Manual sync script
├── services/
│   ├── arkiv.service.ts    # Arkiv network integration
│   ├── paseo.service.ts    # Paseo blockchain integration
│   ├── polkassembly.service.ts # Polkassembly scraper
│   └── sync.service.ts     # Sync orchestrator
├── utils/
│   └── logger.ts           # Pino logger setup
└── index.ts                # Application entry point
```

## Database Schema

**mirrored_proposals** table:

| Field | Type | Description |
|-------|------|-------------|
| `id` | INTEGER | Primary key |
| `polkassembly_id` | INTEGER | Polkassembly proposal ID (unique) |
| `polkassembly_title` | STRING | Proposal title |
| `polkassembly_content` | TEXT | Full markdown description |
| `polkassembly_track` | INTEGER | Governance track number |
| `polkassembly_status` | STRING | Current status |
| `arkiv_cid` | STRING | Arkiv content identifier |
| `arkiv_url` | STRING | Arkiv content URL |
| `paseo_vote_contract_address` | STRING | Deployed Vote contract address |
| `paseo_tx_hash` | STRING | Transaction hash |
| `paseo_block_number` | INTEGER | Block number |
| `processing_status` | STRING | pending/processing/completed/failed |
| `error_message` | TEXT | Error details if failed |
| `created_at` | DATETIME | Record creation time |
| `updated_at` | DATETIME | Last update time |

## Monitoring & Logs

The server uses structured JSON logging via Pino:

```bash
# Development (pretty-printed)
npm run dev

# Production (JSON)
npm start 2>&1 | tee server.log
```

## Troubleshooting

### Proposals not syncing

1. Check cron is running (logs show "⏰ Cron job triggered")
2. Manually trigger sync: `curl -X POST http://localhost:8000/sync`
3. Check filters match your criteria

### Arkiv storage fails

- Verify `ARKIV_PRIVATE_KEY` in `.env`
- Check Arkiv balance/credits
- Ensure RPC endpoint is accessible

### Paseo transaction fails

- Verify wallet has funds: `GET /stats` will show balance in logs
- Check RPC connectivity: `https://paseo-asset-hub-eth-rpc.polkadot.io`
- Verify `VOTE_FACTORY_ADDRESS` is correct

### Database errors

```bash
# Reset database
rm proposals.db
npm run db:init
```

## Migration from Python

If you're migrating from the Python version:

1. Your existing `.env` will work with minor updates (add `ARKIV_WS_URL`)
2. Database schema is compatible - just copy `proposals.db`
3. All API endpoints remain the same
4. Cron schedule format is identical

**Key Improvements:**
- ✅ Better DNS resolution handling
- ✅ Native TypeScript types
- ✅ Faster SQLite operations (synchronous)
- ✅ Cleaner error handling
- ✅ Better WebSocket support via Arkiv SDK

## Development

### Type Checking

```bash
npx tsc --noEmit
```

### Watch Mode

```bash
npm run dev
```

## Production Deployment

### Using systemd

Create `/etc/systemd/system/opengov-mirror.service`:

```ini
[Unit]
Description=OpenGov Mirror Server (TypeScript)
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/path/to/opengov-mirror-server
Environment="NODE_ENV=production"
ExecStart=/usr/bin/npm start
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable opengov-mirror
sudo systemctl start opengov-mirror
sudo systemctl status opengov-mirror
```

### Using Docker

```dockerfile
FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t opengov-mirror .
docker run -d -p 8000:8000 --env-file .env opengov-mirror
```

## License

MIT

## Support

For issues, questions, or contributions, please contact the development team.
