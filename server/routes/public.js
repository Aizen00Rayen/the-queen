const express = require('express');
const rateLimit = require('express-rate-limit');
const db = require('../db');
const { parseProduct, evalCoupon, normPhone, validPhone, getSettings } = require('../lib');
const { createOrder } = require('../orders');

const r = express.Router();

const orderLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 12, standardHeaders: true, legacyHeaders: false, message: { error: 'Trop de commandes. Réessayez plus tard.' } });
const lightLimiter = rateLimit({ windowMs: 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false });

const PRODUCT_SELECT = `SELECT p.*, c.slug AS category_slug, c.name AS category_name, c.name_ar AS category_name_ar
  FROM products p LEFT JOIN categories c ON c.id = p.category_id`;

r.get('/settings', (req, res) => res.json(getSettings()));

r.get('/categories', (req, res) => {
  res.json(db.prepare(`SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.is_active = 1) AS count FROM categories c ORDER BY sort_order`).all());
});

r.get('/products', (req, res) => {
  const { category, featured, sort = 'featured', q } = req.query;
  const where = ['p.is_active = 1'];
  const args = [];
  if (category) { where.push('c.slug = ?'); args.push(category); }
  if (featured) where.push('p.is_featured = 1');
  if (q) { where.push('(p.name LIKE ? OR p.description LIKE ? OR p.tags LIKE ?)'); args.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  const order = { price_asc: 'p.price ASC', price_desc: 'p.price DESC', newest: 'p.created_at DESC', bestsellers: 'p.sold_count DESC' }[sort] || 'p.sort_order ASC, p.id ASC';
  const rows = db.prepare(`${PRODUCT_SELECT} WHERE ${where.join(' AND ')} ORDER BY ${order}`).all(...args);
  res.json(rows.map(parseProduct).map(hideInternal));
});

r.get('/products/:slug', (req, res) => {
  const p = db.prepare(`${PRODUCT_SELECT} WHERE p.slug = ? AND p.is_active = 1`).get(req.params.slug);
  if (!p) return res.status(404).json({ error: 'Produit introuvable' });
  const related = db.prepare(`${PRODUCT_SELECT} WHERE p.is_active = 1 AND p.id != ? ORDER BY p.sort_order LIMIT 4`).all(p.id);
  res.json({ product: hideInternal(parseProduct(p)), related: related.map(parseProduct).map(hideInternal) });
});

function hideInternal(p) {
  const { low_stock_threshold, ...rest } = p;
  return { ...rest, in_stock: p.stock > 0, low_stock: p.stock > 0 && p.stock <= low_stock_threshold, stock: undefined };
}

r.get('/wilayas', (req, res) => {
  res.json(db.prepare('SELECT code, name, name_ar, home_price, office_price FROM wilayas WHERE is_active = 1 ORDER BY code').all());
});

r.post('/coupons/validate', lightLimiter, (req, res) => {
  const { code, subtotal } = req.body || {};
  const out = evalCoupon(code, Number(subtotal) || 0);
  if (out.error) return res.status(400).json({ error: out.error });
  res.json({ code: out.coupon.code, type: out.coupon.type, value: out.coupon.value, discount: out.discount });
});

r.post('/orders', orderLimiter, (req, res) => {
  if (req.body?.website) return res.status(400).json({ error: 'Requête invalide' }); // honeypot
  try {
    const { id, ...out } = createOrder(req.body || {}, { ip: req.ip });
    res.status(201).json(out);
  } catch (e) {
    if (!e.status) console.error(e);
    res.status(e.status || 500).json({ error: e.status ? e.message : 'Erreur serveur, réessayez.', field: e.field });
  }
});

r.post('/orders/track', lightLimiter, (req, res) => {
  const number = String(req.body?.number || '').trim().toUpperCase();
  const phone = normPhone(req.body?.phone);
  const o = db.prepare('SELECT * FROM orders WHERE number = ? AND phone = ?').get(number, phone);
  if (!o) return res.status(404).json({ error: 'Aucune commande trouvée avec ces informations' });
  const items = db.prepare('SELECT name, image, price, qty FROM order_items WHERE order_id = ?').all(o.id);
  const history = db.prepare('SELECT to_status AS status, created_at FROM order_history WHERE order_id = ? ORDER BY id').all(o.id);
  res.json({
    number: o.number, status: o.status, customer_name: o.customer_name, wilaya_name: o.wilaya_name, commune: o.commune,
    delivery_type: o.delivery_type, subtotal: o.subtotal, discount: o.discount, shipping_price: o.shipping_price, total: o.total,
    tracking_number: o.tracking_number, created_at: o.created_at, items, history,
  });
});

r.post('/newsletter', lightLimiter, (req, res) => {
  const contact = String(req.body?.contact || '').trim().toLowerCase().slice(0, 120);
  if (!/^\S+@\S+\.\S+$/.test(contact) && !validPhone(contact)) return res.status(400).json({ error: 'E-mail ou téléphone invalide' });
  db.prepare('INSERT OR IGNORE INTO newsletter (contact) VALUES (?)').run(contact);
  res.json({ ok: true });
});

module.exports = r;
