const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const { DATA_DIR } = require('./paths');

const db = new Database(path.join(DATA_DIR, 'the-queen.sqlite'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL DEFAULT 'Admin',
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_ar TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_ar TEXT,
  subtitle TEXT,
  subtitle_ar TEXT,
  description TEXT,
  description_ar TEXT,
  price INTEGER NOT NULL,
  compare_price INTEGER,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  sku TEXT UNIQUE,
  volume TEXT,
  stock INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 10,
  is_active INTEGER NOT NULL DEFAULT 1,
  is_featured INTEGER NOT NULL DEFAULT 0,
  theme TEXT NOT NULL DEFAULT 'gold',
  tags TEXT NOT NULL DEFAULT '[]',
  images TEXT NOT NULL DEFAULT '[]',
  benefits TEXT NOT NULL DEFAULT '[]',
  how_to TEXT,
  ingredients TEXT,
  sold_count INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  delta INTEGER NOT NULL,
  stock_after INTEGER NOT NULL,
  reason TEXT NOT NULL,
  ref TEXT,
  note TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wilayas (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  home_price INTEGER NOT NULL DEFAULT 600,
  office_price INTEGER NOT NULL DEFAULT 400,
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS coupons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL DEFAULT 'percent',
  value INTEGER NOT NULL,
  min_order INTEGER NOT NULL DEFAULT 0,
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  phone2 TEXT,
  wilaya_code TEXT NOT NULL,
  wilaya_name TEXT NOT NULL,
  commune TEXT,
  address TEXT,
  delivery_type TEXT NOT NULL DEFAULT 'home',
  shipping_price INTEGER NOT NULL DEFAULT 0,
  subtotal INTEGER NOT NULL,
  discount INTEGER NOT NULL DEFAULT 0,
  coupon_code TEXT,
  total INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  customer_note TEXT,
  admin_note TEXT,
  tracking_number TEXT,
  stock_deducted INTEGER NOT NULL DEFAULT 1,
  ip TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(phone);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  sku TEXT,
  image TEXT,
  price INTEGER NOT NULL,
  qty INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS order_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  note TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS newsletter (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contact TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

module.exports = db;
