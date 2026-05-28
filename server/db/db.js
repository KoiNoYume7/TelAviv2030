import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DB_PATH || path.join(__dirname, 'telaviv.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
const schema = `
-- Members
CREATE TABLE IF NOT EXISTS members (
  id              TEXT PRIMARY KEY,
  provider        TEXT NOT NULL,
  provider_id     TEXT NOT NULL,
  name            TEXT NOT NULL,
  display_name    TEXT,
  email           TEXT NOT NULL,
  avatar          TEXT,
  role            TEXT DEFAULT 'pending',
  discord_id      TEXT,
  agreement_signed_at INTEGER,
  agreement_ip    TEXT,
  joined_at       INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at      INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Contributions (money coming IN)
CREATE TABLE IF NOT EXISTS contributions (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id       TEXT NOT NULL REFERENCES members(id),
  amount_chf      REAL NOT NULL,
  method          TEXT NOT NULL,
  stripe_payment_id TEXT,
  status          TEXT DEFAULT 'pending',
  confirmed_by    TEXT,
  confirmed_at    INTEGER,
  note            TEXT,
  created_at      INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Cashout proposals (money going OUT)
CREATE TABLE IF NOT EXISTS cashout_proposals (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  proposed_by     TEXT NOT NULL REFERENCES members(id),
  title           TEXT NOT NULL,
  description     TEXT,
  amount_chf      REAL NOT NULL,
  evidence_url    TEXT,
  status          TEXT DEFAULT 'voting',
  created_at      INTEGER DEFAULT (strftime('%s', 'now')),
  closes_at       INTEGER NOT NULL,
  executed_at     INTEGER,
  executed_by     TEXT REFERENCES members(id)
);

-- Cashout votes
CREATE TABLE IF NOT EXISTS cashout_votes (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  proposal_id     INTEGER NOT NULL REFERENCES cashout_proposals(id),
  member_id       TEXT NOT NULL REFERENCES members(id),
  vote            TEXT NOT NULL,
  voted_at        INTEGER DEFAULT (strftime('%s', 'now')),
  UNIQUE(proposal_id, member_id)
);

-- Audit log (append-only, never delete)
CREATE TABLE IF NOT EXISTS audit_log (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  action          TEXT NOT NULL,
  actor_id        TEXT,
  subject_id      TEXT,
  amount_chf      REAL,
  meta            TEXT,
  created_at      INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_contributions_member_id ON contributions(member_id);
CREATE INDEX IF NOT EXISTS idx_contributions_status ON contributions(status);
CREATE INDEX IF NOT EXISTS idx_cashout_proposals_status ON cashout_proposals(status);
CREATE INDEX IF NOT EXISTS idx_cashout_votes_proposal ON cashout_votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);
`;

// Run schema
db.exec(schema);

export default db;