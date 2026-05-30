-- ═══════════════════════════════════════════════════════════
-- PET POOJA — D1 Database Schema
-- ═══════════════════════════════════════════════════════════

-- Users (customers)
CREATE TABLE IF NOT EXISTS users (
  mobile     TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Menu Items
CREATE TABLE IF NOT EXISTS menu_items (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  price       REAL NOT NULL,
  category    TEXT NOT NULL,
  available   INTEGER NOT NULL DEFAULT 1,
  description TEXT,
  tags        TEXT,
  badge       TEXT,
  img         TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_menu_cat ON menu_items(category);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id            TEXT PRIMARY KEY,
  order_num     TEXT NOT NULL UNIQUE,
  user_mobile   TEXT NOT NULL,
  user_name     TEXT NOT NULL,
  items         TEXT NOT NULL,
  extras        TEXT,
  notes         TEXT,
  coupon        TEXT,
  subtotal      REAL NOT NULL,
  extras_total  REAL NOT NULL DEFAULT 0,
  discount      REAL NOT NULL DEFAULT 0,
  total         REAL NOT NULL,
  status        TEXT NOT NULL DEFAULT 'active',
  mode          TEXT NOT NULL DEFAULT 'online',
  cutlery       INTEGER NOT NULL DEFAULT 0,
  cancel_reason TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  fulfilled_at  TEXT,
  cancelled_at  TEXT
);
CREATE INDEX IF NOT EXISTS idx_ord_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_ord_user ON orders(user_mobile);
CREATE INDEX IF NOT EXISTS idx_ord_date ON orders(created_at);

-- Cash Entries
CREATE TABLE IF NOT EXISTS cash_entries (
  id         TEXT PRIMARY KEY,
  type       TEXT NOT NULL,
  amount     REAL NOT NULL,
  note       TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_cash_date ON cash_entries(created_at);

-- App Logs
CREATE TABLE IF NOT EXISTS app_logs (
  id         TEXT PRIMARY KEY,
  level      TEXT NOT NULL,
  message    TEXT NOT NULL,
  details    TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Settings (key-value)
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Default settings
INSERT OR IGNORE INTO settings (key, value) VALUES ('acceptOrders', 'true');
INSERT OR IGNORE INTO settings (key, value) VALUES ('orderMode', 'online');
