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
