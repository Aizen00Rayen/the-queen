const db = require('./db');
const { moveStock, orderNumber, evalCoupon, normPhone, validPhone, getSettings, RESTOCK_STATUSES, STATUSES } = require('./lib');

function httpErr(status, message, field) { const e = new Error(message); e.status = status; e.field = field; return e; }

/** Creates an order (storefront or admin). Recomputes all prices server-side and reserves stock. */
function createOrder(b, { ip = null, by = 'client', status = 'pending', note = 'Commande passée sur le site' } = {}) {
  const name = String(b.customer_name || '').trim();
  const phone = normPhone(b.phone);
  const items = Array.isArray(b.items) ? b.items : [];
  const deliveryType = b.delivery_type === 'office' ? 'office' : 'home';

  if (name.length < 3) throw httpErr(400, 'Veuillez saisir votre nom complet', 'customer_name');
  if (!validPhone(phone)) throw httpErr(400, 'Numéro de téléphone invalide', 'phone');
  const w = db.prepare('SELECT * FROM wilayas WHERE code = ?').get(String(b.wilaya_code || ''));
  if (!w || (!w.is_active && by === 'client')) throw httpErr(400, 'Veuillez sélectionner votre wilaya', 'wilaya_code');
  if (!String(b.commune || '').trim()) throw httpErr(400, 'Veuillez indiquer votre commune', 'commune');
  if (deliveryType === 'home' && String(b.address || '').trim().length < 4) throw httpErr(400, 'Veuillez indiquer votre adresse', 'address');
  if (!items.length || items.length > 20) throw httpErr(400, 'Le panier est vide');
  if (!STATUSES.includes(status)) status = 'pending';

  return db.transaction(() => {
    const lines = [];
    for (const it of items) {
      const qty = Math.max(1, Math.min(50, parseInt(it.qty, 10) || 1));
      const p = db.prepare('SELECT * FROM products WHERE id = ?').get(Number(it.product_id));
      if (!p || (!p.is_active && by === 'client')) throw httpErr(400, "Un produit du panier n'est plus disponible");
      if (p.stock < qty) throw httpErr(409, `Stock insuffisant pour « ${p.name} » (${Math.max(0, p.stock)} restant)`);
      lines.push({ p, qty });
    }
    const subtotal = lines.reduce((s, l) => s + l.p.price * l.qty, 0);
    const c = evalCoupon(b.coupon_code, subtotal);
    const discount = c.error ? 0 : c.discount;
    const freeFrom = parseInt(getSettings().free_shipping_threshold || '0', 10);
    let shipping = deliveryType === 'office' ? w.office_price : w.home_price;
    if (b.shipping_override != null && by !== 'client') shipping = Math.max(0, parseInt(b.shipping_override, 10) || 0);
    else if (freeFrom > 0 && subtotal - discount >= freeFrom) shipping = 0;
    const total = subtotal - discount + shipping;
    const number = orderNumber();

    const o = db.prepare(`INSERT INTO orders (number, customer_name, phone, phone2, wilaya_code, wilaya_name, commune, address, delivery_type, shipping_price, subtotal, discount, coupon_code, total, status, customer_note, admin_note, ip)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      number, name.slice(0, 120), phone, normPhone(b.phone2) || null, w.code, w.name, String(b.commune).trim().slice(0, 120),
      String(b.address || '').trim().slice(0, 300), deliveryType, shipping, subtotal, discount,
      c.coupon && !c.error ? c.coupon.code : null, total, status,
      String(b.note || '').trim().slice(0, 500) || null, by !== 'client' ? (String(b.admin_note || '').trim() || null) : null, ip,
    );
    const orderId = o.lastInsertRowid;
    const insI = db.prepare('INSERT INTO order_items (order_id, product_id, name, sku, image, price, qty) VALUES (?, ?, ?, ?, ?, ?, ?)');
    for (const { p, qty } of lines) {
      insI.run(orderId, p.id, p.name, p.sku, JSON.parse(p.images)[0] || null, p.price, qty);
      moveStock(p.id, -qty, 'order', { ref: number, note: 'Réservé par commande', by });
      db.prepare('UPDATE products SET sold_count = sold_count + ? WHERE id = ?').run(qty, p.id);
    }
    if (c.coupon && !c.error) db.prepare('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?').run(c.coupon.id);
    db.prepare('INSERT INTO order_history (order_id, from_status, to_status, note, created_by) VALUES (?, NULL, ?, ?, ?)').run(orderId, status, note, by);
    return { id: orderId, number, total, shipping, subtotal, discount };
  })();
}

/** Changes status, handling automatic stock restore / re-deduction. */
function changeStatus(orderId, to, { note = null, by = 'admin' } = {}) {
  if (!STATUSES.includes(to)) throw httpErr(400, 'Statut invalide');
  return db.transaction(() => {
    const o = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!o) throw httpErr(404, 'Commande introuvable');
    if (o.status === to && !note) return o;
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);
    if (RESTOCK_STATUSES.has(to) && o.stock_deducted) {
      items.forEach((it) => {
        moveStock(it.product_id, it.qty, to === 'returned' ? 'return' : 'cancel', { ref: o.number, note: to === 'returned' ? 'Retour colis' : 'Commande annulée', by });
        db.prepare('UPDATE products SET sold_count = MAX(0, sold_count - ?) WHERE id = ?').run(it.qty, it.product_id);
      });
      db.prepare('UPDATE orders SET stock_deducted = 0 WHERE id = ?').run(orderId);
    } else if (!RESTOCK_STATUSES.has(to) && !o.stock_deducted) {
      for (const it of items) {
        const p = db.prepare('SELECT stock, name FROM products WHERE id = ?').get(it.product_id);
        if (p && p.stock < it.qty) throw httpErr(409, `Stock insuffisant pour réactiver : « ${p.name} »`);
      }
      items.forEach((it) => {
        moveStock(it.product_id, -it.qty, 'order', { ref: o.number, note: 'Commande réactivée', by });
        db.prepare('UPDATE products SET sold_count = sold_count + ? WHERE id = ?').run(it.qty, it.product_id);
      });
      db.prepare('UPDATE orders SET stock_deducted = 1 WHERE id = ?').run(orderId);
    }
    db.prepare("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?").run(to, orderId);
    db.prepare('INSERT INTO order_history (order_id, from_status, to_status, note, created_by) VALUES (?, ?, ?, ?, ?)').run(orderId, o.status, to, note, by);
    return db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  })();
}

module.exports = { createOrder, changeStatus, httpErr };
