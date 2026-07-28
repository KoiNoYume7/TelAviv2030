# TelAviv2030

A private group finance and savings app for the TelAvivers friend group. Trust is the foundation; software is the accountability layer.

Part of the KoiNoYume7 YUME ecosystem · [yumehana.dev](https://yumehana.dev)

---

## What this is

TelAviv2030 makes shared saving and group purchases transparent, auditable, and difficult to misuse. It tracks contributions, donations, savings plans, and spending requests for the TelAvivers community.

It is intentionally a conservative V1. The app does not replace the group's trust; it records identity, decisions, and financial state so the group can hold itself accountable.

See [CLAUDE.md](CLAUDE.md) for the full product, security, and behavioural specification.

---

## Stack

- Frontend: Svelte 5 + Vite (mobile-first, responsive)
- Backend: Node.js 22 + Express
- Database: SQLite via better-sqlite3, WAL enabled
- Auth: AnniCore (`/api/auth/me`)
- Hosting: Raspberry Pi 4 (`yme-04`), systemd, nginx, Cloudflare Tunnel
- Port: 4300

Details: [docs/TECH-STACK.md](docs/TECH-STACK.md)

---

## Project structure

Web project layout, matching the Anni standard:

```text
TelAviv2030/
├── client/          # Svelte + Vite frontend
│   ├── src/
│   ├── public/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── server/          # Express backend
│   ├── db/
│   ├── routes/
│   ├── middleware/
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── nginx/           # vhost config for telaviv.yumehana.dev
├── lib/             # AnniLog PowerShell modules
├── TelAviv2030.service
├── deploy.bat
├── deploy.ps1
├── docs/
└── README.md
```

---

## Local development

1. Ensure Node.js 22+ and PowerShell 7+ are installed.
2. Copy `server/.env.example` to `server/.env` and fill in values.
3. Run `deploy.bat` (builds and deploys to the Pi) or start manually:
   - `cd server && npm install && npm run dev`
   - `cd client && npm install && npm run dev`

See [docs/ROADMAP.md](docs/ROADMAP.md) for the build order and [docs/TECH-STACK.md](docs/TECH-STACK.md) for the product model.

---

## Important links

- Product spec: [CLAUDE.md](CLAUDE.md)
- Stack + product model: [docs/TECH-STACK.md](docs/TECH-STACK.md)
- Roadmap: [docs/ROADMAP.md](docs/ROADMAP.md)

---

*Part of the KoiNoYume7 YUME ecosystem · [yumehana.dev](https://yumehana.dev)*
