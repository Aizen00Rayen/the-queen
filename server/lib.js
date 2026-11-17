const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || (() => {
  // Persist a random secret so tokens survive restarts when no env var is set.
  const row = db.prepare("SELECT value FROM settings WHERE key = '__jwt_secret'").get();
  if (row) return row.value;
  const s = crypto.randomBytes(48).toString('hex');
  db.prepare("INSERT INTO settings (key, value) VALUES ('__jwt_secret', ?)").run(s);
  return s;
})();

const STATUSES = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'no_answer', 'cancelled', 'returned'];
// Statuses in which the ordered goods are NOT out of stock (they came back / never left)
const RESTOCK_STATUSES = new Set(['cancelled', 'returned']);

const parseProduct = (p) => p && ({
  ...p,
  is_active: !!p.is_active,
  is_featured: !!p.is_featured,
  tags: JSON.parse(p.tags || '[]'),
  images: JSON.parse(p.images || '[]'),
  benefits: JSON.parse(p.benefits || '[]'),
});

function signToken(admin) {
  return jwt.sign({ id: admin.id, email: admin.email, name: admin.name }, JWT_SECRET, { expiresIn: '7d' });
}

function requireAdmin(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Non authentifié' });
  try {
    req.admin = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Session expirée' });
  }
}

/** Apply a stock delta and log the movement. Must be called inside a transaction. */
function moveStock(productId, delta, reason, { ref = null, note = null, by = 'system' } = {}) {
  if (!productId || !delta) return;
  const p = db.prepare('SELECT stock FROM products WHERE id = ?').get(productId);
  if (!p) return;
  const after = p.stock + delta;
  db.prepare("UPDATE products SET stock = ?, updated_at = datetime('now') WHERE id = ?").run(after, productId);
  db.prepare('INSERT INTO stock_movements (product_id, delta, stock_after, reason, ref, note, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(productId, delta, after, reason, ref, note, by);
}

function orderNumber() {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  for (let i = 0; i < 10; i++) {
    const n = `TQ-${ymd}-${crypto.randomInt(1000, 9999)}`;
    if (!db.prepare('SELECT 1 FROM orders WHERE number = ?').get(n)) return n;
  }
  return `TQ-${ymd}-${Date.now().toString().slice(-6)}`;
}

/** Validate a coupon against a subtotal. Returns { coupon, discount } or { error }. */
function evalCoupon(code, subtotal) {
  if (!code) return { coupon: null, discount: 0 };
  const c = db.prepare('SELECT * FROM coupons WHERE code = ? COLLATE NOCASE').get(String(code).trim());
  if (!c || !c.is_active) return { error: 'Code promo invalide' };
  if (c.expires_at && new Date(c.expires_at) < new Date()) return { error: 'Code promo expiré' };
  if (c.max_uses != null && c.used_count >= c.max_uses) return { error: 'Code promo épuisé' };
  if (subtotal < c.min_order) return { error: `Minimum d'achat : ${c.min_order} DA` };
  const discount = c.type === 'percent' ? Math.round((subtotal * c.value) / 100) : Math.min(c.value, subtotal);
  return { coupon: c, discount };
}

const normPhone = (p) => String(p || '').replace(/[^\d+]/g, '').replace(/^\+213/, '0').replace(/^00213/, '0').replace(/^213(?=[567]\d{8}$)/, '0');
const validPhone = (p) => /^0[567]\d{8}$/.test(normPhone(p)) || /^0[2-4]\d{7}$/.test(normPhone(p));

function getSettings(includePrivate = false) {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const out = {};
  rows.forEach((r) => { if (includePrivate || !r.key.startsWith('__')) out[r.key] = r.value; });
  delete out.__jwt_secret;
  return out;
}

module.exports = { STATUSES, RESTOCK_STATUSES, parseProduct, signToken, requireAdmin, moveStock, orderNumber, evalCoupon, normPhone, validPhone, getSettings };
