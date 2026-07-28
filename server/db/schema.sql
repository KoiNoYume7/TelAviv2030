PRAGMA foreign_keys = ON;

-- ── Members ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS members (
  id               TEXT PRIMARY KEY,
  provider         TEXT NOT NULL,
  provider_id      TEXT NOT NULL,
  email            TEXT NOT NULL,
  name             TEXT NOT NULL,
  avatar           TEXT,
  community_status TEXT NOT NULL DEFAULT 'TELAVIVLING'
    CHECK (community_status IN ('TELAVIVER', 'TELAVIVLING', 'RETIRED_TELAVIVER', 'RETIRED_TELAVIVLING')),
  technical_role   TEXT NOT NULL DEFAULT 'MEMBER'
    CHECK (technical_role IN ('MEMBER', 'SYSTEM_ADMIN', 'SYSTEM_OWNER')),
  created_at       INTEGER DEFAULT (unixepoch()),
  updated_at       INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_members_provider ON members(provider, provider_id);
CREATE INDEX IF NOT EXISTS idx_members_status   ON members(community_status);
CREATE INDEX IF NOT EXISTS idx_members_role     ON members(technical_role);

-- ── Audit log (append-only, hash-chained) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_events (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type    TEXT NOT NULL,
  actor_id      TEXT,
  subject_type  TEXT,
  subject_id    TEXT,
  payload       TEXT,
  hash          TEXT NOT NULL,
  previous_hash TEXT,
  environment   TEXT NOT NULL DEFAULT 'PRODUCTION'
    CHECK (environment IN ('PRODUCTION', 'TEST', 'SHOWCASE')),
  created_at    INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_audit_events_type     ON audit_events(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_events_actor    ON audit_events(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_subject  ON audit_events(subject_type, subject_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_created  ON audit_events(created_at);

-- ── Contributions (money in from TelAvivers) ────────────────────────────────
CREATE TABLE IF NOT EXISTS contributions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id   TEXT NOT NULL REFERENCES members(id),
  amount      INTEGER NOT NULL,            -- smallest currency unit, e.g. rappen
  currency    TEXT NOT NULL DEFAULT 'CHF',
  note        TEXT,
  status      TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'SETTLED', 'CANCELLED')),
  settled_by  TEXT REFERENCES members(id),
  settled_at  INTEGER,
  created_at  INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_contributions_member_id ON contributions(member_id);
CREATE INDEX IF NOT EXISTS idx_contributions_status    ON contributions(status);

-- ── Donations (money in from TelAvivlings) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS donations (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id   TEXT NOT NULL REFERENCES members(id),
  amount      INTEGER NOT NULL,            -- smallest currency unit, e.g. rappen
  currency    TEXT NOT NULL DEFAULT 'CHF',
  note        TEXT,
  status      TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'SETTLED', 'CANCELLED')),
  settled_by  TEXT REFERENCES members(id),
  settled_at  INTEGER,
  created_at  INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_donations_member_id ON donations(member_id);
CREATE INDEX IF NOT EXISTS idx_donations_status    ON donations(status);

-- ── Plans (fundraising goals / savings targets) ─────────────────────────────
CREATE TABLE IF NOT EXISTS plans (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  name           TEXT NOT NULL,
  description    TEXT,
  target_amount  INTEGER,
  current_amount INTEGER NOT NULL DEFAULT 0,
  target_date    INTEGER,
  status         TEXT NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE', 'COMPLETED', 'CANCELLED')),
  created_by     TEXT NOT NULL REFERENCES members(id),
  created_at     INTEGER DEFAULT (unixepoch()),
  updated_at     INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_plans_status     ON plans(status);
CREATE INDEX IF NOT EXISTS idx_plans_created_by ON plans(created_by);

-- ── Requests (group spending proposals) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS requests (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  title                TEXT NOT NULL,
  description          TEXT,
  amount               INTEGER NOT NULL,            -- smallest currency unit, e.g. rappen
  currency             TEXT NOT NULL DEFAULT 'CHF',
  status               TEXT NOT NULL DEFAULT 'PENDING_VOTE'
    CHECK (status IN ('PENDING_VOTE', 'APPROVED_COOLDOWN', 'LOCKED', 'RECIPIENT_SELECTION', 'RECIPIENT_ACCEPTANCE', 'PAYOUT_PENDING', 'PURCHASE_PENDING_PROOF', 'COMPLETED', 'CANCELLED', 'EXPIRED')),
  created_by           TEXT NOT NULL REFERENCES members(id),
  current_revision     INTEGER NOT NULL DEFAULT 1,
  expiry_at            INTEGER,
  cooling_off_until    INTEGER,
  locked_at            INTEGER,
  selected_recipient_id TEXT REFERENCES members(id),
  payout_status        TEXT NOT NULL DEFAULT 'NOT_STARTED'
    CHECK (payout_status IN ('NOT_STARTED', 'SUBMITTED', 'PENDING', 'SETTLED', 'FAILED', 'CANCELLED', 'REQUIRES_REVIEW')),
  payout_reference     TEXT,
  payout_submitted_at  INTEGER,
  payout_settled_at    INTEGER,
  payout_failed_reason TEXT,
  linked_plan_id       INTEGER REFERENCES plans(id),
  created_at           INTEGER DEFAULT (unixepoch()),
  updated_at           INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_requests_status      ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_created_by  ON requests(created_by);
CREATE INDEX IF NOT EXISTS idx_requests_expiry      ON requests(expiry_at);

-- ── Request revisions (immutable snapshots for material edits) ──────────────
CREATE TABLE IF NOT EXISTS request_revisions (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id      INTEGER NOT NULL REFERENCES requests(id),
  revision_number INTEGER NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  amount          INTEGER NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'CHF',
  reason          TEXT,
  created_by      TEXT NOT NULL REFERENCES members(id),
  created_at      INTEGER DEFAULT (unixepoch()),
  UNIQUE(request_id, revision_number)
);

CREATE INDEX IF NOT EXISTS idx_request_revisions_request ON request_revisions(request_id);

-- ── Request votes (per revision) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS request_votes (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id    INTEGER NOT NULL REFERENCES requests(id),
  revision_id   INTEGER NOT NULL REFERENCES request_revisions(id),
  member_id     TEXT NOT NULL REFERENCES members(id),
  vote          TEXT NOT NULL CHECK (vote IN ('APPROVE', 'REJECT')),
  created_at    INTEGER DEFAULT (unixepoch()),
  updated_at    INTEGER DEFAULT (unixepoch()),
  UNIQUE(request_id, revision_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_request_votes_request   ON request_votes(request_id);
CREATE INDEX IF NOT EXISTS idx_request_votes_revision  ON request_votes(revision_id);
CREATE INDEX IF NOT EXISTS idx_request_votes_member    ON request_votes(member_id);

-- ── Request recipients (volunteer / proposal / selection) ───────────────────
CREATE TABLE IF NOT EXISTS request_recipients (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id          INTEGER NOT NULL REFERENCES requests(id),
  member_id           TEXT NOT NULL REFERENCES members(id),
  status              TEXT NOT NULL DEFAULT 'VOLUNTEERED'
    CHECK (status IN ('VOLUNTEERED', 'PROPOSED', 'SELECTED', 'ACCEPTED', 'DECLINED')),
  proposed_by         TEXT REFERENCES members(id),
  proposal_expires_at INTEGER,
  objections          INTEGER NOT NULL DEFAULT 0,
  accepted_at         INTEGER,
  declined_at         INTEGER,
  created_at          INTEGER DEFAULT (unixepoch()),
  UNIQUE(request_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_request_recipients_request ON request_recipients(request_id);
CREATE INDEX IF NOT EXISTS idx_request_recipients_member  ON request_recipients(member_id);

-- ── Request recipient objections ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS request_recipient_objections (
  request_recipient_id INTEGER NOT NULL REFERENCES request_recipients(id),
  member_id            TEXT NOT NULL REFERENCES members(id),
  created_at           INTEGER DEFAULT (unixepoch()),
  PRIMARY KEY (request_recipient_id, member_id)
);

-- ── Request proofs ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS request_proofs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id  INTEGER NOT NULL REFERENCES requests(id),
  member_id   TEXT NOT NULL REFERENCES members(id),
  filename    TEXT NOT NULL,
  mime_type   TEXT,
  note        TEXT,
  created_at  INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_request_proofs_request ON request_proofs(request_id);
