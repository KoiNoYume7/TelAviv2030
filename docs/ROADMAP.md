# TelAviv2030 — Roadmap

*Phased delivery plan. V1 is intentionally conservative; missing policies stay unimplemented rather than guessed.*

---

## Phase 0 — Foundation + Audit Infrastructure

- Repo layout matching the Anni standard
- Client and server `package.json` files
- `server/db/schema.sql` with core tables (users, membership, transactions, audit log)
- `server/server.js` with Express, `/health`, CORS, error handlers
- AnniCore auth integration
- Immutable audit mechanism and event schema
- Environment architecture (`PRODUCTION`, `TEST`, `SHOWCASE`)
- `deploy.ps1`, `TelAviv2030.service`, and nginx vhost

**Definition of done:** service runs locally and on the Pi; `/health` returns OK; auth works; audit events can be recorded.

---

## Phase 1 — Identity & Membership

- Member list with community status (`TELAVIVER`, `TELAVIVLING`, `RETIRED_TELAVIVER`, `RETIRED_TELAVIVLING`)
- Read-only member profiles
- Status-change history (audit)
- Membership approval workflow (group-decided, app records the change)
- Technical role flags (`MEMBER`, `SYSTEM_ADMIN`, `SYSTEM_OWNER`)
- Access scope differences by community status (e.g., TelAvivlings cannot vote or view governance history)

**Definition of done:** members visible; status changes logged; no financial operations yet.

---

## Phase 2 — Contributions & Donations

- TelAvivers create contributions
- TelAvivlings create donations
- Track inflows against group balance
- Permanently classify contribution vs donation
- Non-authoritative recognition (stats, badges, thank-you indicators)

**Definition of done:** money can enter the system; classification is immutable.

---

## Phase 3 — Plans

- Create / edit Plans (name, description, target amount, target date)
- Track progress against target
- Visible list of active and completed Plans
- Plans are informational; they do not reserve or block funds

**Definition of done:** group can set and track savings goals.

---

## Phase 4 — Requests & Governance

- TelAvivers create spending Requests
- One active Request per TelAviver
- 5-minute creation cooldown after creating a Request
- Configurable anti-spam cooldown after Request cancellation (intended range approximately 5–10 minutes)
- Sufficient available funds check
- Request contents: title/name, description, exact amount, currency, expiry, linked Plan, optional merchant/category
- Request owner with auto-approval, edit, and cancel rights
- Request creator sets and controls the Request expiry
- Unanimous approval: every active TelAviver must approve
- Editable votes while voting remains open
- Vote-change audit trail
- Material edits reset voting and create a new revision
- Request cancellation by owner
- Request expiry
- 24-hour cooling-off period after unanimous approval, then lock
- Membership-change handling (retirement or new TelAviver during an active Request)

**Definition of done:** a Request can be created, voted on, approved or rejected, edited, cancelled, and locked.

---

## Phase 5 — Recipient, Payout & Completion

- Recipient volunteer / enrollment
- Recipient eligibility: active TelAviver, approved the Request, explicitly volunteered
- Recipient selection by proposal-with-objection: an eligible TelAviver proposes a recipient; if no one objects within a short window, that recipient is selected
- Short configurable recipient-selection window (approximately 30–60 minutes by default, capped by Request expiry)
- Explicit recipient acceptance before payout
- Recipient decline and retry
- Payout state machine (`NOT_STARTED`, `SUBMITTED`, `PENDING`, `SETTLED`, `FAILED`, `CANCELLED`, `REQUIRES_REVIEW`)
- Asynchronous bank transaction handling
- Manual reconciliation in V1; bank integration only after Test Mode verifies the abstraction
- Payout amount equals approved amount; no automatic overpayment
- Underspending handled via the group's trust process; overspending requires a new Request
- Purchase proof upload (photo, screenshot, PDF)
- Request completion (`COMPLETED`)

**Definition of done:** an approved Request can be paid out, purchased, proofed, and closed.

---

## Phase 6 — Diagnostics & Emergency Controls

- Audit log UI
- System Admin read-only diagnostic views
- System Owner emergency controls
- Mandatory changelog/reason for owner corrective actions
- Tamper-evident audit verification
- Reconciliation tooling
- Financial freeze capabilities

**Definition of done:** every meaningful action is viewable and traceable; emergency actions require a reason.

---

## Phase 7 — Mobile Polish

- Responsive mobile UI
- PWA manifest and icons
- Touch-first interaction
- Biometric/PIN confirmation UX for sensitive actions
- Error and empty states
- Final deployment hardening

**Definition of done:** app is usable on a phone in the shared room.

---

## Out of scope for V1

These are explicitly not implemented until the group decides a policy or the underlying infrastructure is ready:

- Automatic TelAvivling → TelAviver promotion
- Automatic financial settlement on retirement
- Interest / investment tracking
- Multi-currency support
- Automatic reimbursement flows
- Automatic real bank-account payouts (manual reconciliation only in V1)
- Debt tracking or "you owe the group" counters
- Mandatory or scheduled contributions
- Ownership percentages or withdrawal rights
- Automatic price adjustment / spending tolerance
- Quick expenses outside the Request process
- AI / OCR receipt analysis
- Public user accounts or public groups
- Social media / marketplace functionality
- Credit, loans, overdrafts, crypto, or investment features
- Automatic random recipient assignment
- Commercial banking functionality

---

## Last updated

2026-07-28

---

*Part of the KoiNoYume7 YUME ecosystem · [yumehana.dev](https://yumehana.dev)*
