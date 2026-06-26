<div align="center">

```
  ▲   ▲
 ▐▓▓▓▓▓▌
 ▐▓▓▓▓▓▓▌
  ▀▓▓▓▓▀
```

# SNAPKITTY BOT

### The SnapKitty fortress in your Discord server.

[![License: BUSL-1.1](https://img.shields.io/badge/License-BUSL--1.1-blue.svg?style=flat-square)](../LICENSE)
[![Discord](https://img.shields.io/badge/Discord-11%20agents-5865F2?style=flat-square&logo=discord)](https://discord.gg/dugymT3rj)
[![Node.js](https://img.shields.io/badge/Node.js-TypeScript-black?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-Neon-2D3748?style=flat-square&logo=prisma)](https://prisma.io)
[![War Room](https://img.shields.io/badge/War%20Room-live-brightgreen?style=flat-square)](https://collectivekitty.com)

**[collectivekitty.com](https://collectivekitty.com) · [DEVFLOW-FINANCE](https://github.com/SNAPKITTYWEST/DEVFLOW-FINANCE) · [Invite Bot](https://discord.gg/dugymT3rj)**

</div>

---

## What This Is

SnapKitty Bot brings all 11 sovereign agents into Discord. Ask any agent a question, manage money pools, check your fundability tier, read the live Bifrost audit trail — all from slash commands.

This is a **standalone Express server** that receives Discord interactions via webhook. It connects to the same Neon PostgreSQL database as the main SnapKitty OS and routes `/ask` queries through the Ollama-powered reasoning engine at `collectivekitty.com`.

---

## Commands

| Command | What it does |
|---------|-------------|
| `/ask [agent] [message]` | Route any question to any of the 11 agents |
| `/pool create` | Create a named money pool |
| `/pool list` | See all active pools and balances |
| `/pool fund` | Add capital to a pool |
| `/pool close` | Archive a pool |
| `/tier` | Current fundability tier status and blockers |
| `/agents` | Full agent directory in plain English |
| `/status` | System health — Bifrost, DB, infrastructure |
| `/seal` | Last decision seal hash |
| `/audit` | Last 5 Bifrost events with risk scores |
| `/merkle` | Merkle root and WORM chain entry count |

---

## The 11 Agents

| Agent | Key | Domain |
|-------|-----|--------|
| **RELAY** | `bridge` | Human-Machine Bridge — start here |
| **AXIOM** | `finance` | GL · Triple-Entry · Money Pools |
| **VAULT** | `treasury` | Reserves · Payments · **Veto authority** |
| **NEXUS** | `crm` | Pipeline · Deals · Forecast |
| **FORGE** | `procurement` | Vendors · POs · Spend |
| **HERALD** | `bifrost` | Event Routing · Traces |
| **TENSOR** | `ml` | Risk Scoring · Anomaly Detection |
| **SENTINEL** | `risk` | Compliance · Threat Score |
| **LEDGE** | `auditor` | WORM Ledger · Audit Chain |
| **ATLAS** | `operator` | Health · **Tier gate authority** |
| **QUILL** | `scriptwriter` | Reports · Decks · Copy |

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/SNAPKITTYWEST/myapplication.git
cd myapplication
npm install
npx prisma generate
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in `.env`:

```env
DISCORD_PUBLIC_KEY=    # from Discord Developer Portal → your app → General Information
DISCORD_APP_ID=        # same page
DISCORD_BOT_TOKEN=     # Bot → Token
DATABASE_URL=          # Neon PostgreSQL connection string
SNAPKITTY_API_URL=https://collectivekitty.com
PORT=3001
```

### 3. Register slash commands (once)

```bash
npm run register
```

### 4. Run the bot

```bash
# Development
npm run dev

# Production
npm run build && npm start
```

### 5. Connect to Discord

In the [Discord Developer Portal](https://discord.com/developers/applications):
- Go to **General Information** → set **Interactions Endpoint URL** to your server:
  ```
  https://your-domain.com/interactions
  ```
- Discord will verify the endpoint with a PING. If it responds with PONG, you're live.

For local development, use [ngrok](https://ngrok.com) or [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) to expose `localhost:3001`.

---

## Architecture

```
Discord → POST /interactions
             │
             ├── verifyKey() — Ed25519 signature validation
             │
             ├── /ask    → askAgent() → Ollama at collectivekitty.com → reply
             ├── /pool   → Prisma → Neon PostgreSQL → reply
             ├── /tier   → Prisma → live deal/vendor/pool counts → reply
             ├── /status → Prisma → Bifrost event counts → reply
             ├── /seal   → Prisma → last BifrostEvent → reply
             └── /audit  → Prisma → last 5 BifrostEvents → reply
```

The bot validates every Discord request with Ed25519 before processing. Unauthenticated requests are rejected with 401.

---

## Part of the SnapKitty Fortress

This bot is the **Discord interface layer** of the SnapKitty Sovereign OS.

The full system lives in [DEVFLOW-FINANCE](https://github.com/SNAPKITTYWEST/DEVFLOW-FINANCE):
- Rust core with SHA-256 WORM ledger and 5-tier state machine
- Next.js War Room where agents think out loud in real time
- Bifrost event pipeline, Plaid banking, Stripe Issuing
- Local Ollama LLM reasoning (no OpenAI dependency)

---

<div align="center">

*SnapKitty Sovereign OS — built in the open, proven in chain.*

**[collectivekitty.com](https://collectivekitty.com) · [DEVFLOW-FINANCE](https://github.com/SNAPKITTYWEST/DEVFLOW-FINANCE) · [Discord](https://discord.gg/dugymT3rj)**

</div>

![](https://sovereign-analytics.snapkittywest.workers.dev/canary/myapplication)
