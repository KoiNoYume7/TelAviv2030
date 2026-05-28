# TelAviv2030 🔥

Private group savings platform for the Tel Aviv 2030 friend group.

Live at [telaviv.yumehana.dev](https://telaviv.yumehana.dev) · Self-hosted on Raspberry Pi 4 (yme-04).

Part of **YUME** (*Your Unified Memory & Experience*).

---

## What it does

TelAviv2030 enables a friend group to:
- Save money communally for trips and shared activities
- Contribute via TWINT (Phase 1) and card payments (Phase 2)
- Propose group expenditures with democratic voting
- Track contribution tiers based on consistency and volume
- Admin approval workflow for new members and contributions

**Core principle:** All money becomes communal property upon deposit — no individual ownership of shares.

---

## Stack

| Layer | Tech |
|---|---|
| Runtime | Node.js + Express |
| Database | SQLite via `better-sqlite3` |
| Sessions | `express-session` |
| Auth | OAuth 2.0 — Google, Discord |
| Frontend | Vite + Vanilla JS |
| Pi path | `/opt/anni/telaviv` (port 4300) |
| DB path | `/srv/storage/TelAviv2030/telaviv.db` |

---

## Repo structure

```
TelAviv2030/
├── client/                  ← Vite frontend source only
│   ├── src/
│   │   ├── components/      ← reusable UI pieces
│   │   ├── lib/             ← JS utilities (router, api, auth, toast, i18n)
│   │   ├── pages/           ← one file per route
│   │   ├── styles/          ← CSS (base, components, pages)
│   │   └── locales/         ← i18n (en, de-CH)
│   ├── public/              ← static assets
│   ├── index.html
│   ├── package.json
│   └── vite.config.js       ← outDir: '../dist'
├── server/                  ← Node/Express backend
│   ├── db/                  ← schema + db.js singleton
│   ├── routes/              ← one file per resource
│   ├── telaviv.service      ← systemd unit file
│   ├── .env                 ← gitignored, never committed
│   ├── .env.example         ← committed, all keys present
│   └── server.js            ← Express entry point
├── nginx/                   ← nginx vhost config
├── lib/                     ← PowerShell modules (AnniLog)
├── docs/                    ← documentation
│   ├── DEPLOYMENT.md        ← Windows deployment guide
│   └── AGREEMENT.md         ← Legal agreement text
├── dist/                    ← Vite build output — at root, gitignored
├── logs/                    ← deploy and runtime logs, gitignored
├── .ai/                     ← local workspace files, gitignored
├── deploy.bat               ← primary entry point (calls deploy.ps1)
├── deploy.ps1               ← full deploy logic with AnniLog
├── deploy.sh                ← Linux/macOS equivalent
├── .gitignore
└── README.md
```

---

## API

| Method | Path | Description |
|---|---|---|
| GET | `/api/auth/:provider` | Start OAuth flow (google / discord) |
| GET | `/api/auth/callback/:provider` | OAuth callback — sets session, redirects |
| GET | `/api/auth/me` | Returns user object or 401 |
| POST | `/api/auth/logout` | Destroys session |
| GET | `/api/members` | Get all members (admin) |
| GET | `/api/members/me` | Get current member |
| POST | `/api/members/:id/approve` | Approve member (admin) |
| POST | `/api/members/:id/deny` | Deny member (admin) |
| POST | `/api/members/agreement` | Sign agreement |
| GET | `/api/members/:id/stats` | Get member tier stats |
| GET | `/api/contributions` | Get all contributions (admin) |
| GET | `/api/contributions/me` | Get current user's contributions |
| POST | `/api/contributions` | Create contribution |
| POST | `/api/contributions/:id/confirm` | Confirm contribution (admin) |
| POST | `/api/contributions/:id/reject` | Reject contribution (admin) |
| GET | `/api/contributions/balance/total` | Get group balance (admin) |
| GET | `/api/cashouts` | Get all proposals |
| GET | `/api/cashouts/:id` | Get single proposal with votes |
| POST | `/api/cashouts` | Create proposal |
| POST | `/api/cashouts/:id/vote` | Vote on proposal |
| POST | `/api/cashouts/:id/execute` | Execute cashout (admin) |

---

## Dev setup

```bash
# Client
cd client
npm install
npm run dev          # → http://localhost:5173

# Server
cd server
cp .env.example .env # fill in OAuth credentials
npm install
npm run dev          # → http://localhost:4300
```

---

## Deploy

### Windows (Primary)
```batch
deploy.bat                # pushes code, installs deps, restarts service
deploy.bat -SkipInstall   # skip npm install on Pi
```

### Linux/macOS
```bash
chmod +x deploy.sh
./deploy.sh
```

Preserves `.env` and database files on the Pi.

---

## Environment variables

| Variable | Description |
|---|---|
| `PORT` | `4300` |
| `SESSION_SECRET` | Long random string |
| `DB_PATH` | `/srv/storage/TelAviv2030/telaviv.db` |
| `GOOGLE_CLIENT_ID/SECRET` | Google OAuth app |
| `DISCORD_CLIENT_ID/SECRET` | Discord OAuth app |
| `DISCORD_GUILD_ID` | Discord server ID for instant approval |
| `DISCORD_MEMBER_ROLE_ID` | Discord role ID for instant approval |
| `TWINT_QR_CODE_URL` | URL to TWINT QR code image |
| `DISCORD_WEBHOOK_URL` | Discord webhook for notifications |

---

## Key docs

- **`docs/DEPLOYMENT.md`** — Detailed Windows deployment guide
- **`docs/AGREEMENT.md`** — Legal agreement members sign

---

## Infrastructure

```
Browser → Cloudflare Tunnel → nginx :80
  └── telaviv.yumehana.dev → /opt/anni/telaviv → :4300

/srv/storage/TelAviv2030/
  └── telaviv.db   ← members, contributions, proposals (never touched by deploy)
```

Port map across the ecosystem:

| Service | Port |
|---|---|
| AnniCore | 4200 |
| AnniWebsite | 4000 |
| ALOS | 4100 |
| TelAviv2030 | 4300 |

---

## Contribution Tier System

Tiers are calculated based on:
- **Consistency Score**: (months with contributions ÷ total months active) × 100
- **Volume Score**: Total CHF contributed
- **Final Score**: (consistency × 0.45) + (volume × 0.55)

Tiers:
- 🪵 **Starter**: Score < 50 or < 2 months active
- 🥉 **Contributor**: Score ≥ 50
- 🥈 **Regular**: ≥ 3 months + 60% consistency
- 🥇 **Backbone**: ≥ 6 months + 70% consistency OR ≥ 500 CHF
- 🔥 **Legend**: ≥ 12 months + 80% consistency + ≥ 1000 CHF

---

## Security

- All money becomes communal property upon deposit
- No individual ownership of shares
- All cashouts require group approval (unanimous, 48h timeout)
- Full audit log of all transactions
- Sessions expire after 24 hours
- Admin-only access to sensitive operations

---

## Disclaimer

**This is not a financial institution. The maintainers are not liable for disputes between members.**

This is a voluntary arrangement between friends for managing shared savings.

---

## Roadmap

### Phase 1 (Current)
- ✅ Basic scaffold + auth flows
- ✅ Dashboard + TWINT contributions
- ✅ Admin panel + members page
- ✅ Deployment to telaviv.yumehana.dev

### Phase 2
- ⏳ Stripe card payments
- ⏳ Cashout proposals + voting
- ⏳ Swiss German translation
- ⏳ Discord bot deep links
- ⏳ Joint account integration

---

*Part of the KoiNoYume7 YUME ecosystem · [yumehana.dev](https://yumehana.dev)*