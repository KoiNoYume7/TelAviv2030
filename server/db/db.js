// ── Database singleton ──
import { readFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'
import dotenv from 'dotenv'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)

const DB_PATH = process.env.DB_PATH || join(__dirname, 'telaviv.db')

let _db

export function getDb() {
  if (_db) return _db
  mkdirSync(dirname(DB_PATH), { recursive: true })
  _db = new Database(DB_PATH)
  _db.pragma('journal_mode = WAL')
  _db.pragma('foreign_keys = ON')
  _db.pragma('synchronous = NORMAL')
  _db.exec(readFileSync(join(__dirname, 'schema.sql'), 'utf8'))
  return _db
}

export default getDb
