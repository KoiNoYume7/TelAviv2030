# TelAviv2030 — Technical Stack

*Stack decisions and conventions for the TelAviv group finance app.*

---

## Core product model

TelAviv2030 is a private group finance and savings app for the TelAvivers friend group. It is not a public banking product, commercial fintech platform, or social network.

### Community statuses

| Status | Meaning |
|---|---|
| `TELAVIVER` | Full active member of the main group |
| `TELAVIVLING` | Newer/probationary member; still part of the wider community, not subordinate |
| `RETIRED_TELAVIVER` | Former full member; historical records preserved, active permissions revoked |
| `RETIRED_TELAVIVLING` | Former probationary member; historical records preserved |

Community status is separate from technical role. A TelAvivling is not a lower rank; the distinction is access scope and trust level, not hierarchy.

### Technical roles

| Role | Meaning |
|---|---|
| `MEMBER` | Normal application user |
| `SYSTEM_ADMIN` | Technical maintenance and diagnostics; not financial authority |
| `SYSTEM_OWNER` | Infrastructure operator with emergency technical capabilities; not the group's financial owner |

### Money in

- **Contribution:** money from an active TelAviver; permanently classified as a contribution.
- **Donation:** money from a TelAvivling; permanently classified as a donation.
- Donations never convert into contributions, even if the donor later becomes a TelAviver.
- Money does not grant voting power, administrative rights, or governance authority.

### TelAvivling access

TelAvivlings are part of the community but have restricted V1 access:

- Can authenticate and view their own profile and donation history
- Can make donations
- Can view relevant community information and non-governance recognition
- Cannot create Requests, vote on Requests, view Request/purchase history, see the live bank balance, receive payout authority, or gain financial governance authority
- TelAvivling status is visibly distinct but not presented as a lower rank

### Plans vs Requests

- **Plan:** a savings goal (name, description, target amount, target date). Plans are informational; they do not reserve money or authorize spending.
- **Request:** a concrete intended purchase. A Request must have sufficient available group funds. It goes through creation, unanimous approval, recipient selection, payout, purchase proof, and completion.

### Request governance

- Only active TelAvivers can create Requests.
- A TelAviver may have at most **one active Request at a time**.
- After creating a Request, the owner enters a **5-minute creation cooldown**.
- A configurable anti-spam cooldown also applies after Request cancellation (intended range approximately **5–10 minutes**).
- The creator is the **Request owner** and is automatically approved.
- The creator sets and controls the Request expiry.
- Approval is **unanimous**: every active TelAviver must approve.
- Votes can be changed while voting is open; vote changes are logged.
- Material edits (amount, item/purchase, purpose, description, important merchant information, expiry, or other materially relevant details) reset voting and create a new revision.
- The owner can cancel the Request while it is cancellable; cancellation is distinct from rejection (a vote by another TelAviver).
- Once unanimously approved, a **24-hour cooling-off period** begins, then the Request locks.

### Recipient, payout, and proof

- After locking, eligible TelAvivers volunteer to be recipients.
- Eligibility: active TelAviver, approved the Request, explicitly volunteered, not excluded by a relevant system rule.
- The group must converge on exactly one recipient; the highest vote count does not automatically win.
- Recipient selection uses a **proposal-with-objection** model: any eligible TelAviver proposes a recipient (themselves or another eligible volunteer). If no one objects within a short configurable window (approximately 30–60 minutes by default, capped by Request expiry), the proposed recipient is selected.
- An objection rejects the current proposal and the process restarts with a new proposal.
- The selected recipient must explicitly accept the payout before any money is sent.
- Payout states include at least: `NOT_STARTED`, `SUBMITTED`, `PENDING`, `SETTLED`, `FAILED`, `CANCELLED`, `REQUIRES_REVIEW`.
- The application tracks internal expected state and reconciles against the bank; the bank is authoritative for actual money movement.
- A completed purchase requires proof (photo/screenshot/PDF of receipt or order confirmation). No OCR or AI analysis in V1.

### Spending amount

- The approved amount is the exact amount authorized for payout.
- If the actual purchase costs less, the recipient returns the unused amount according to the group's trust process; the application does not automatically calculate or initiate reimbursement.
- If the actual purchase costs more, V1 requires a new Request for the additional amount.

### Security confirmation

Sensitive actions (creating a Request, voting, cancelling, accepting a payout, contributing/donating) require a second confirmation. Device biometrics preferred, PIN fallback. Biometrics/PIN are not required just to view the app.

### Environments

- **Production:** real group, real money, real bank integration.
- **Test Mode:** real-money technical testing using the developer's personal account; heavily restricted and clearly labelled.
- **Showcase Mode:** simulated financial environment; no real money moves.

### Audit

Every meaningful state-changing action is logged in an append-only audit store. Audit records cannot be edited or deleted through the app. The design supports tamper-evident hashes/signatures. Corrections create new events; history is not rewritten.

---

## Core philosophy

- Vanilla backend; small compiled frontend framework.
- No ORM; raw SQL with prepared statements.
- No TypeScript; JSDoc annotations on shared `lib/` code are encouraged.
- Auth outsourced to AnniCore.
- Self-hosted on the existing Pi infrastructure.

---

## Backend

| Layer | Choice | Rationale |
|---|---|---|
| Runtime | Node.js 22.x | Matches `yme-04` |
| Framework | Express | Standard across Anni services |
| Database | better-sqlite3 | Proven on the Pi, synchronous, WAL-safe |
| Auth | AnniCore `/api/auth/me` | Unified identity; no custom auth inside TelAviv2030 |
| Sessions | Cookie (`connect.sid`) | Set by AnniCore on `.yumehana.dev` |
| API style | JSON REST | Predictable for the Svelte frontend |
| Validation | Whitelist constants + manual checks | Keeps dependencies small |

### Database notes

- Path on Pi: `/srv/storage/TelAviv2030/telaviv.db`.
- WAL mode, foreign keys, synchronous NORMAL.
- Schema idempotent (`CREATE TABLE IF NOT EXISTS`).
- Append-only audit tables with event hashes where feasible.

---

## Frontend

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Svelte 5 | App-like UI with many CRUD views; compiles away |
| Build tool | Vite | Fast dev server; matches Anni frontend setup |
| Styling | Vanilla CSS | Design-token based; dark default |
| Mobile | Responsive, touch-first | Target users are friends on phones |
| Routing | Svelte-native or simple hash router | TBD; small app, no heavy router needed |

### UI notes

- Start screen shows current group balance, active requests, and recent activity.
- TelAvivling status is visible but not hierarchical.
- All financial values are read-only except through governed flows.

---

## Infrastructure

| Layer | Choice |
|---|---|
| Host | `yme-04` Raspberry Pi 4 |
| Reverse proxy | nginx |
| TLS | Cloudflare Tunnel |
| Service | `telaviv.service` systemd unit |
| URL | `https://telaviv.yumehana.dev` |
| Internal port | 4300 (bind `127.0.0.1` only) |

---

## Dependencies (planned)

### Server
- `express`
- `better-sqlite3`
- `dotenv`
- `cookie-parser` (only if needed for AnniCore cookie forwarding)

### Client
- `svelte`
- `vite`
- `vite-plugin-pwa` (optional, later)

### Dev / deployment
- `AnniLog` PowerShell module (copied into `lib/`)
- `deploy.ps1` + `deploy.bat`

---

## Decisions still open

Only genuinely unresolved technical implementation choices remain:

1. **Frontend router:** hash-based vanilla router (AnniWebsite style) or Svelte 5 runes + simple page switcher?
2. **Proof storage:** file uploads to `/srv/storage/TelAviv2030/uploads/` or base64 in DB? File upload is preferred on the Pi.
3. **Bank integration provider/API:** The exact Swiss banking provider is not yet finalized. V1 uses manual reconciliation; real integration follows only after Test Mode verifies the abstraction.

Governance policy questions (approval threshold, Request ownership, recipient selection, etc.) are settled in [CLAUDE.md](../CLAUDE.md) and above.

---

*Part of the KoiNoYume7 YUME ecosystem · [yumehana.dev](https://yumehana.dev)*
