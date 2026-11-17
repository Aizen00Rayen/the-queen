const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const db = require('../db');
const { STATUSES, parseProduct, signToken, requireAdmin, moveStock } = require('../lib');
const { createOrder, changeStatus } = require('../orders');

const r = express.Router();
const { UPLOAD_DIR } = require('../paths');

const fail = (res, e) => {
  if (!e.status) console.error(e);
  res.status(e.status || 500).json({ error: e.status ? e.message : (e.code === 'SQLITE_CONSTRAINT_UNIQUE' ? 'Valeur déjà utilisée (slug / SKU / code)' : 'Erreur serveur') });
};
const slugify = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);

/* ---------------- Auth ---------------- */
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, message: { error: 'Trop de tentatives. Réessayez dans 15 minutes.' } });

r.post('/auth/login', loginLimiter, (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const a = db.prepare('SELECT * FROM admins WHERE email = ?').get(email);
  if (!a || !bcrypt.compareSync(String(req.body?.password || ''), a.password_hash)) return res.status(401).json({ error: 'Identifiants incorrects' });
  res.json({ token: signToken(a), admin: { id: a.id, email: a.email, name: a.name } });
});

r.use(requireAdmin);

r.get('/auth/me', (req, res) => res.json({ admin: req.admin }));

r.put('/auth/password', (req, res) => {
  const { current, next } = req.body || {};
  const a = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.admin.id);
  if (!a || !bcrypt.compareSync(String(current || ''), a.password_hash)) return res.status(400).json({ error: 'Mot de passe actuel incorrect' });
  if (String(next || '').length < 8) return res.status(400).json({ error: 'Minimum 8 caractères' });
  db.prepare('UPDATE admins SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(String(next), 10), a.id);
  res.json({ ok: true });
});

/* ---------------- Dashboard ---------------- */
r.get('/stats', (req, res) => {
  const days = Math.min(90, Math.max(7, parseInt(req.query.days, 10) || 30));
  const live = "status NOT IN ('cancelled','returned')";
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const kpi = {
    revenue_delivered: one("SELECT COALESCE(SUM(total - shipping_price),0) v FROM orders WHERE status = 'delivered'").v,
    revenue_pipeline: one(`SELECT COALESCE(SUM(total - shipping_price),0) v FROM orders WHERE ${live} AND status != 'delivered'`).v,
    orders_total: one('SELECT COUNT(*) v FROM orders').v,
    orders_today: one("SELECT COUNT(*) v FROM orders WHERE date(created_at) = date('now')").v,
    orders_pending: one("SELECT COUNT(*) v FROM orders WHERE status IN ('pending','no_answer')").v,
    orders_period: one(`SELECT COUNT(*) v FROM orders WHERE created_at >= datetime('now', ?)`, `-${days} days`).v,
    revenue_period: one(`SELECT COALESCE(SUM(total - shipping_price),0) v FROM orders WHERE ${live} AND created_at >= datetime('now', ?)`, `-${days} days`).v,
    avg_basket: one(`SELECT COALESCE(AVG(subtotal - discount),0) v FROM orders WHERE ${live}`).v,
    delivered: one("SELECT COUNT(*) v FROM orders WHERE status = 'delivered'").v,
    returned: one("SELECT COUNT(*) v FROM orders WHERE status = 'returned'").v,
    units_in_stock: one('SELECT COALESCE(SUM(stock),0) v FROM products').v,
    stock_value: one('SELECT COALESCE(SUM(stock * price),0) v FROM products').v,
  };
  const series = db.prepare(`SELECT date(created_at) d, COUNT(*) orders, SUM(CASE WHEN ${live} THEN total - shipping_price ELSE 0 END) revenue
    FROM orders WHERE created_at >= datetime('now', ?) GROUP BY d ORDER BY d`).all(`-${days} days`);
  const map = Object.fromEntries(series.map((s) => [s.d, s]));
  const chart = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);
    chart.push({ date: d, orders: map[d]?.orders || 0, revenue: map[d]?.revenue || 0 });
  }
  const by_status = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  db.prepare('SELECT status, COUNT(*) n FROM orders GROUP BY status').all().forEach((x) => { by_status[x.status] = x.n; });
  const top_products = db.prepare(`SELECT oi.name, SUM(oi.qty) qty, SUM(oi.qty * oi.price) revenue FROM order_items oi JOIN orders o ON o.id = oi.order_id
    WHERE o.status NOT IN ('cancelled','returned') GROUP BY oi.product_id ORDER BY qty DESC LIMIT 5`).all();
  const top_wilayas = db.prepare(`SELECT wilaya_name name, COUNT(*) n FROM orders WHERE ${live} GROUP BY wilaya_code ORDER BY n DESC LIMIT 6`).all();
  const low_stock = db.prepare('SELECT id, name, stock, low_stock_threshold, images FROM products WHERE stock <= low_stock_threshold ORDER BY stock').all()
    .map((p) => ({ ...p, image: JSON.parse(p.images)[0], images: undefined }));
  const recent = db.prepare('SELECT id, number, customer_name, wilaya_name, total, status, created_at FROM orders ORDER BY id DESC LIMIT 8').all();
  res.json({ kpi, chart, by_status, top_products, top_wilayas, low_stock, recent });
});

/* ---------------- Categories ---------------- */
r.get('/categories', (req, res) => res.json(db.prepare('SELECT * FROM categories ORDER BY sort_order').all()));
r.post('/categories', (req, res) => {
  try {
    const { name, name_ar } = req.body || {};
    if (!name) return res.status(400).json({ error: 'Nom requis' });
    const info = db.prepare('INSERT INTO categories (slug, name, name_ar, sort_order) VALUES (?, ?, ?, (SELECT COALESCE(MAX(sort_order),0)+1 FROM categories))').run(slugify(name), name, name_ar || null);
    res.status(201).json(db.prepare('SELECT * FROM categories WHERE id = ?').get(info.lastInsertRowid));
  } catch (e) { fail(res, e); }
});
r.delete('/categories/:id', (req, res) => { db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id); res.json({ ok: true }); });

/* ---------------- Products ---------------- */
const P_FIELDS = ['name', 'name_ar', 'subtitle', 'subtitle_ar', 'description', 'description_ar', 'price', 'compare_price', 'category_id', 'sku', 'volume', 'low_stock_threshold', 'is_active', 'is_featured', 'theme', 'tags', 'images', 'benefits', 'how_to', 'ingredients', 'sort_order', 'slug'];
function productPayload(b) {
  const out = {};
  for (const f of P_FIELDS) if (b[f] !== undefined) out[f] = b[f];
  ['tags', 'images', 'benefits'].forEach((k) => { if (out[k] !== undefined) out[k] = JSON.stringify(Array.isArray(out[k]) ? out[k].filter(Boolean) : []); });
  ['is_active', 'is_featured'].forEach((k) => { if (out[k] !== undefined) out[k] = out[k] ? 1 : 0; });
  ['price', 'low_stock_threshold', 'sort_order'].forEach((k) => { if (out[k] !== undefined) out[k] = Math.max(0, parseInt(out[k], 10) || 0); });
  if (out.compare_price !== undefined) out.compare_price = parseInt(out.compare_price, 10) || null;
  if (out.category_id !== undefined) out.category_id = parseInt(out.category_id, 10) || null;
  if (out.sku !== undefined) out.sku = String(out.sku).trim() || null;
  if (out.slug !== undefined) out.slug = slugify(out.slug);
  return out;
}

r.get('/products', (req, res) => {
  const rows = db.prepare(`SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON c.id = p.category_id ORDER BY p.sort_order, p.id`).all();
  res.json(rows.map(parseProduct));
});
r.get('/products/:id', (req, res) => {
  const p = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Introuvable' });
  res.json(parseProduct(p));
});
r.post('/products', (req, res) => {
  try {
    const b = req.body || {};
    if (!b.name || !b.price) return res.status(400).json({ error: 'Nom et prix requis' });
    const data = productPayload({ ...b, slug: b.slug || b.name });
    const cols = Object.keys(data);
    const info = db.prepare(`INSERT INTO products (${cols.join(',')}) VALUES (${cols.map((c) => '@' + c).join(',')})`).run(data);
    const initial = Math.max(0, parseInt(b.stock, 10) || 0);
    if (initial) db.transaction(() => moveStock(info.lastInsertRowid, initial, 'initial', { note: 'Stock initial', by: req.admin.email }))();
    res.status(201).json(parseProduct(db.prepare('SELECT * FROM products WHERE id = ?').get(info.lastInsertRowid)));
  } catch (e) { fail(res, e); }
});
r.put('/products/:id', (req, res) => {
  try {
    const data = productPayload(req.body || {});
    const cols = Object.keys(data);
    if (cols.length) db.prepare(`UPDATE products SET ${cols.map((c) => `${c} = @${c}`).join(', ')}, updated_at = datetime('now') WHERE id = @id`).run({ ...data, id: req.params.id });
    res.json(parseProduct(db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id)));
  } catch (e) { fail(res, e); }
});
r.delete('/products/:id', (req, res) => {
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

/* ---------------- Uploads (auto WebP) ---------------- */
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 12 * 1024 * 1024, files: 8 }, fileFilter: (req, f, cb) => cb(null, /^image\//.test(f.mimetype)) });
r.post('/upload', upload.array('files', 8), async (req, res) => {
  try {
    const urls = [];
    for (const f of req.files || []) {
      const name = `${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}.webp`;
      await sharp(f.buffer).rotate().resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true }).webp({ quality: 86 }).toFile(path.join(UPLOAD_DIR, name));
      urls.push(`/uploads/${name}`);
    }
    res.json({ urls });
  } catch (e) { fail(res, e); }
});

/* ---------------- Stock ---------------- */
r.get('/stock/movements', (req, res) => {
  const { product_id, limit = 200 } = req.query;
  const rows = db.prepare(`SELECT m.*, p.name AS product_name FROM stock_movements m JOIN products p ON p.id = m.product_id
    ${product_id ? 'WHERE m.product_id = ?' : ''} ORDER BY m.id DESC LIMIT ?`).all(...(product_id ? [product_id] : []), Math.min(1000, parseInt(limit, 10) || 200));
  res.json(rows);
});
r.post('/stock/adjust', (req, res) => {
  try {
    const { product_id, mode = 'delta', value, reason = 'manual', note } = req.body || {};
    const p = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id);
    if (!p) return res.status(404).json({ error: 'Produit introuvable' });
    const v = parseInt(value, 10);
    if (Number.isNaN(v)) return res.status(400).json({ error: 'Quantité invalide' });
    const delta = mode === 'set' ? v - p.stock : v;
    if (p.stock + delta < 0) return res.status(400).json({ error: 'Le stock ne peut pas être négatif' });
    const allowed = ['restock', 'manual', 'damaged', 'inventory', 'gift'];
    db.transaction(() => moveStock(p.id, delta, allowed.includes(reason) ? reason : 'manual', { note: note || null, by: req.admin.email }))();
    res.json(parseProduct(db.prepare('SELECT * FROM products WHERE id = ?').get(p.id)));
  } catch (e) { fail(res, e); }
});

/* ---------------- Orders ---------------- */
r.get('/orders', (req, res) => {
  const { status, q, from, to, page = 1, limit = 25 } = req.query;
  const where = [];
  const args = [];
  if (status && status !== 'all') { where.push('status = ?'); args.push(status); }
  if (q) { where.push('(number LIKE ? OR customer_name LIKE ? OR phone LIKE ? OR wilaya_name LIKE ? OR commune LIKE ?)'); const k = `%${q}%`; args.push(k, k, k, k, k); }
  if (from) { where.push('date(created_at) >= date(?)'); args.push(from); }
  if (to) { where.push('date(created_at) <= date(?)'); args.push(to); }
  const w = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const lim = Math.min(200, parseInt(limit, 10) || 25);
  const off = (Math.max(1, parseInt(page, 10) || 1) - 1) * lim;
  const total = db.prepare(`SELECT COUNT(*) n FROM orders ${w}`).get(...args).n;
  const rows = db.prepare(`SELECT o.*, (SELECT SUM(qty) FROM order_items WHERE order_id = o.id) AS items_count FROM orders o ${w} ORDER BY o.id DESC LIMIT ? OFFSET ?`).all(...args, lim, off);
  const counts = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  db.prepare('SELECT status, COUNT(*) n FROM orders GROUP BY status').all().forEach((x) => { counts[x.status] = x.n; });
  counts.all = Object.values(counts).reduce((a, b) => a + b, 0);
  res.json({ orders: rows, total, page: Number(page), pages: Math.ceil(total / lim), counts });
});

r.get('/orders/export.csv', (req, res) => {
  const rows = db.prepare(`SELECT o.*, (SELECT GROUP_CONCAT(qty || 'x ' || name, ' | ') FROM order_items WHERE order_id = o.id) AS products FROM orders o ORDER BY id DESC`).all();
  const cols = ['number', 'created_at', 'status', 'customer_name', 'phone', 'phone2', 'wilaya_code', 'wilaya_name', 'commune', 'address', 'delivery_type', 'products', 'subtotal', 'discount', 'shipping_price', 'total', 'coupon_code', 'tracking_number', 'customer_note', 'admin_note'];
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="commandes-the-queen-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send('﻿' + [cols.join(','), ...rows.map((r0) => cols.map((c) => esc(r0[c])).join(','))].join('\n'));
});

r.get('/orders/:id', (req, res) => {
  const o = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!o) return res.status(404).json({ error: 'Commande introuvable' });
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(o.id);
  const history = db.prepare('SELECT * FROM order_history WHERE order_id = ? ORDER BY id').all(o.id);
  const previous = db.prepare('SELECT id, number, status, total, created_at FROM orders WHERE phone = ? AND id != ? ORDER BY id DESC LIMIT 10').all(o.phone, o.id);
  res.json({ ...o, items, history, previous });
});

r.post('/orders', (req, res) => {
  try {
    const out = createOrder(req.body || {}, { by: req.admin.email, status: req.body?.status || 'confirmed', note: 'Commande créée manuellement' });
    res.status(201).json(out);
  } catch (e) { fail(res, e); }
});

r.put('/orders/:id/status', (req, res) => {
  try {
    res.json(changeStatus(Number(req.params.id), req.body?.status, { note: req.body?.note || null, by: req.admin.email }));
  } catch (e) { fail(res, e); }
});

r.post('/orders/bulk-status', (req, res) => {
  const { ids = [], status } = req.body || {};
  const results = { ok: 0, failed: [] };
  for (const id of ids.slice(0, 200)) {
    try { changeStatus(Number(id), status, { by: req.admin.email, note: 'Action groupée' }); results.ok++; } catch (e) { results.failed.push({ id, error: e.message }); }
  }
  res.json(results);
});

r.put('/orders/:id', (req, res) => {
  try {
    const o = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!o) return res.status(404).json({ error: 'Commande introuvable' });
    const b = req.body || {};
    const next = {
      customer_name: b.customer_name ?? o.customer_name, phone: b.phone ?? o.phone, phone2: b.phone2 ?? o.phone2,
      commune: b.commune ?? o.commune, address: b.address ?? o.address, admin_note: b.admin_note ?? o.admin_note,
      tracking_number: b.tracking_number ?? o.tracking_number, delivery_type: b.delivery_type === 'office' ? 'office' : (b.delivery_type === 'home' ? 'home' : o.delivery_type),
      wilaya_code: o.wilaya_code, wilaya_name: o.wilaya_name, shipping_price: o.shipping_price,
    };
    if (b.wilaya_code && b.wilaya_code !== o.wilaya_code) {
      const w = db.prepare('SELECT * FROM wilayas WHERE code = ?').get(b.wilaya_code);
      if (w) { next.wilaya_code = w.code; next.wilaya_name = w.name; next.shipping_price = next.delivery_type === 'office' ? w.office_price : w.home_price; }
    } else if (next.delivery_type !== o.delivery_type) {
      const w = db.prepare('SELECT * FROM wilayas WHERE code = ?').get(o.wilaya_code);
      if (w) next.shipping_price = next.delivery_type === 'office' ? w.office_price : w.home_price;
    }
    if (b.shipping_price != null && b.shipping_price !== '') next.shipping_price = Math.max(0, parseInt(b.shipping_price, 10) || 0);
    next.total = o.subtotal - o.discount + next.shipping_price;
    db.prepare(`UPDATE orders SET customer_name=@customer_name, phone=@phone, phone2=@phone2, commune=@commune, address=@address, admin_note=@admin_note,
      tracking_number=@tracking_number, delivery_type=@delivery_type, wilaya_code=@wilaya_code, wilaya_name=@wilaya_name, shipping_price=@shipping_price, total=@total, updated_at=datetime('now') WHERE id=@id`)
      .run({ ...next, id: o.id });
    res.json(db.prepare('SELECT * FROM orders WHERE id = ?').get(o.id));
  } catch (e) { fail(res, e); }
});

r.delete('/orders/:id', (req, res) => {
  try {
    const o = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!o) return res.status(404).json({ error: 'Commande introuvable' });
    if (o.stock_deducted) changeStatus(o.id, 'cancelled', { by: req.admin.email, note: 'Suppression' });
    db.prepare('DELETE FROM orders WHERE id = ?').run(o.id);
    res.json({ ok: true });
  } catch (e) { fail(res, e); }
});

/* ---------------- Wilayas ---------------- */
r.get('/wilayas', (req, res) => res.json(db.prepare('SELECT * FROM wilayas ORDER BY code').all()));
r.put('/wilayas/:code', (req, res) => {
  const { home_price, office_price, is_active } = req.body || {};
  db.prepare('UPDATE wilayas SET home_price = COALESCE(?, home_price), office_price = COALESCE(?, office_price), is_active = COALESCE(?, is_active) WHERE code = ?')
    .run(home_price != null ? parseInt(home_price, 10) : null, office_price != null ? parseInt(office_price, 10) : null, is_active != null ? (is_active ? 1 : 0) : null, req.params.code);
  res.json(db.prepare('SELECT * FROM wilayas WHERE code = ?').get(req.params.code));
});
r.post('/wilayas/bulk', (req, res) => {
  const { home_price, office_price } = req.body || {};
  db.prepare('UPDATE wilayas SET home_price = COALESCE(?, home_price), office_price = COALESCE(?, office_price)')
    .run(home_price !== '' && home_price != null ? parseInt(home_price, 10) : null, office_price !== '' && office_price != null ? parseInt(office_price, 10) : null);
  res.json(db.prepare('SELECT * FROM wilayas ORDER BY code').all());
});

/* ---------------- Coupons ---------------- */
r.get('/coupons', (req, res) => res.json(db.prepare('SELECT * FROM coupons ORDER BY id DESC').all()));
r.post('/coupons', (req, res) => {
  try {
    const b = req.body || {};
    const code = String(b.code || '').trim().toUpperCase();
    if (!code || !(parseInt(b.value, 10) > 0)) return res.status(400).json({ error: 'Code et valeur requis' });
    const info = db.prepare('INSERT INTO coupons (code, type, value, min_order, max_uses, expires_at, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(code, b.type === 'fixed' ? 'fixed' : 'percent', parseInt(b.value, 10), parseInt(b.min_order, 10) || 0, parseInt(b.max_uses, 10) || null, b.expires_at || null, b.is_active === false ? 0 : 1);
    res.status(201).json(db.prepare('SELECT * FROM coupons WHERE id = ?').get(info.lastInsertRowid));
  } catch (e) { fail(res, e); }
});
r.put('/coupons/:id', (req, res) => {
  try {
    const c = db.prepare('SELECT * FROM coupons WHERE id = ?').get(req.params.id);
    if (!c) return res.status(404).json({ error: 'Introuvable' });
    const b = { ...c, ...req.body };
    db.prepare('UPDATE coupons SET code=?, type=?, value=?, min_order=?, max_uses=?, expires_at=?, is_active=? WHERE id=?')
      .run(String(b.code).toUpperCase(), b.type === 'fixed' ? 'fixed' : 'percent', parseInt(b.value, 10), parseInt(b.min_order, 10) || 0, parseInt(b.max_uses, 10) || null, b.expires_at || null, b.is_active ? 1 : 0, c.id);
    res.json(db.prepare('SELECT * FROM coupons WHERE id = ?').get(c.id));
  } catch (e) { fail(res, e); }
});
r.delete('/coupons/:id', (req, res) => { db.prepare('DELETE FROM coupons WHERE id = ?').run(req.params.id); res.json({ ok: true }); });

/* ---------------- Settings & newsletter ---------------- */
r.get('/settings', (req, res) => {
  const out = {};
  db.prepare("SELECT key, value FROM settings WHERE key NOT LIKE '\\_\\_%' ESCAPE '\\'").all().forEach((x) => { out[x.key] = x.value; });
  res.json(out);
});
r.put('/settings', (req, res) => {
  const up = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
  db.transaction(() => Object.entries(req.body || {}).forEach(([k, v]) => { if (!k.startsWith('__') && /^[a-z_]{2,40}$/.test(k)) up.run(k, String(v ?? '')); }))();
  res.json({ ok: true });
});
r.get('/newsletter', (req, res) => res.json(db.prepare('SELECT * FROM newsletter ORDER BY id DESC').all()));

module.exports = r;
