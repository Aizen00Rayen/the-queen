/* Seeds the database with the catalogue recovered from the original the-queen.shop.
 * Safe to run multiple times: only inserts what is missing. */
const bcrypt = require('bcryptjs');
const db = require('../db');
const wilayas = require('./wilayas.json');

const WILAYA_AR = ['أدرار','الشلف','الأغواط','أم البواقي','باتنة','بجاية','بسكرة','بشار','البليدة','البويرة','تمنراست','تبسة','تلمسان','تيارت','تيزي وزو','الجزائر','الجلفة','جيجل','سطيف','سعيدة','سكيكدة','سيدي بلعباس','عنابة','قالمة','قسنطينة','المدية','مستغانم','المسيلة','معسكر','ورقلة','وهران','البيض','إليزي','برج بوعريريج','بومرداس','الطارف','تندوف','تيسمسيلت','الوادي','خنشلة','سوق أهراس','تيبازة','ميلة','عين الدفلى','النعامة','عين تموشنت','غرداية','غليزان','المغير','المنيعة','أولاد جلال','برج باجي مختار','بني عباس','تيميمون','تقرت','جانت','عين صالح','عين قزام'];

const categories = [
  { slug: 'serums-eclat', name: 'Sérums Éclat & Anti-Âge', name_ar: 'سيروم الإشراق ومكافحة الشيخوخة', sort_order: 1 },
  { slug: 'soins-hydratants', name: 'Soins Hydratants & Repulpants', name_ar: 'عناية الترطيب والامتلاء', sort_order: 2 },
  { slug: 'protocoles-duo', name: 'Protocoles & Coffrets Duos', name_ar: 'البروتوكولات والعلب الثنائية', sort_order: 3 },
];

const products = [
  {
    slug: 'serum-vitamine-c', name: 'Sérum Vitamine C Pure', name_ar: 'سيروم فيتامين C النقي',
    subtitle: 'Bouclier antioxydant & éclat solaire', subtitle_ar: 'درع مضاد للأكسدة وإشراقة مشمسة',
    description: "Le Sérum Vitamine C The Queen associe une haute concentration d'Acide Ascorbique pur et de Vitamine E. Ce traitement antioxydant de grade dermatologique neutralise le stress oxydatif, estompe visiblement les taches pigmentaires, stimule la production naturelle de collagène et révèle un éclat royal.",
    description_ar: 'يجمع سيروم فيتامين C من ذا كوين بين تركيز عالٍ من حمض الأسكوربيك النقي وفيتامين E. علاج مضاد للأكسدة بدرجة جلدية يحارب الإجهاد التأكسدي، ويخفف البقع الصبغية بشكل واضح، ويحفز إنتاج الكولاجين الطبيعي ويكشف عن إشراقة ملكية.',
    price: 4200, compare_price: 4800, category: 'serums-eclat', sku: 'QUEEN-VITC-30', volume: '30 mL', stock: 0, theme: 'amber', is_featured: 1, sold_count: 150, sort_order: 1,
    tags: ['Éclaircissant', 'Anti-Rides', 'Hydratation', 'Vitamine C+E', 'Éclat Naturel'],
    images: ['/brand/v2/vitc-stage.webp', '/brand/v2/vitc-cut.webp', '/brand/after.webp', '/brand/v2/hero-duo.webp'],
    benefits: ['Illumine instantanément les teints ternes et fatigués', 'Atténue les taches pigmentaires', 'Relance la synthèse de collagène et d\'élastine', 'Filtre les agressions environnementales et la pollution'],
    how_to: 'Matin : appliquer 4 à 5 gouttes sur une peau propre et sèche, sur le visage et le cou. Faire pénétrer par légers tapotements, puis appliquer votre crème et un écran solaire SPF 50.',
    ingredients: 'Aqua, Sodium Ascorbyl Phosphate, Tocopheryl Acetate (Vitamine E), Glycerin, Rosa Damascena Flower Water, Phenoxyethanol, Ethylhexylglycerin.',
  },
  {
    slug: 'serum-acide-hyaluronique', name: 'Sérum Acide Hyaluronique', name_ar: 'سيروم حمض الهيالورونيك',
    subtitle: 'Réparation profonde & hydratation cellulaire', subtitle_ar: 'إصلاح عميق وترطيب خلوي',
    description: "Un concentré d'hydratation biomimétique composé d'acide hyaluronique multi-moléculaire. Il agit simultanément en surface pour lisser et en profondeur pour recharger les réserves hydriques cellulaires. La peau est immédiatement repulpée, douce, apaisée et éclatante de santé.",
    description_ar: 'مركّز ترطيب محاكٍ للبشرة يتكوّن من حمض الهيالورونيك متعدد الأوزان الجزيئية. يعمل على السطح للتنعيم وفي العمق لإعادة ملء مخزون الماء في الخلايا. بشرة ممتلئة، ناعمة، هادئة ومشرقة فوراً.',
    price: 3900, compare_price: 4500, category: 'soins-hydratants', sku: 'QUEEN-HYAL-30', volume: '30 mL', stock: 0, theme: 'azure', is_featured: 1, sold_count: 194, sort_order: 2,
    tags: ['Ultra Hydratation', 'Anti-rides', 'Éclaircissant', 'Éclat naturel'],
    images: ['/brand/v2/hyal-stage.webp', '/brand/v2/hyal-cut.webp', '/brand/v2/hero-duo.webp'],
    benefits: ['Maintient l\'eau au cœur des cellules pendant 24h', 'Lisse visiblement les ridules de sécheresse', 'Répare et consolide le film hydrolipidique', 'Affine le grain de peau pour un toucher velouté'],
    how_to: 'Soir : déposer 3 à 4 gouttes sur une peau propre et légèrement humide. Faire pénétrer par pressions délicates sur le visage, le cou et le décolleté. Laisser agir toute la nuit.',
    ingredients: 'Aqua, Sodium Hyaluronate (tri-moléculaire), Glycerin, Panthenol, Rosa Damascena Flower Water, Phenoxyethanol, Ethylhexylglycerin.',
  },
  {
    slug: 'le-duo-royal-coffret-serums', name: 'Le Duo Royal', name_ar: 'الثنائي الملكي',
    subtitle: 'Coffret synergie — Vitamine C + Acide Hyaluronique', subtitle_ar: 'علبة التآزر — فيتامين C + حمض الهيالورونيك',
    description: "Le protocole de soin absolu The Queen combinant le Sérum Vitamine C et le Sérum Acide Hyaluronique. Utilisez la Vitamine C le matin pour stimuler le collagène et créer un bouclier antioxydant, et l'Acide Hyaluronique le soir pour désaltérer et réparer l'épiderme pendant la nuit.",
    description_ar: 'بروتوكول العناية المطلق من ذا كوين يجمع سيروم فيتامين C وسيروم حمض الهيالورونيك. استعملي فيتامين C صباحاً لتحفيز الكولاجين وحماية البشرة، وحمض الهيالورونيك مساءً لترطيب البشرة وإصلاحها أثناء الليل.',
    price: 7400, compare_price: 8100, category: 'protocoles-duo', sku: 'QUEEN-DUO-SET', volume: '2 × 30 mL', stock: 0, theme: 'gold', is_featured: 1, sold_count: 312, sort_order: 0,
    tags: ['Coffret Cadeau', 'Duo Iconique', 'Synergie 24h', 'Bestseller'],
    images: ['/brand/v2/duo-stage.webp', '/brand/v2/duo-cut.webp', '/brand/v2/hero-duo.webp', '/brand/v2/vitc-stage.webp', '/brand/v2/hyal-stage.webp'],
    benefits: ['Protocole complet 24h/24 : protection le jour, réparation la nuit', '+94% d\'éclat constaté en 28 jours', 'Économie de 700 DA par rapport à l\'achat séparé', 'Coffret idéal à offrir'],
    how_to: 'Matin : 4 à 5 gouttes de Sérum Vitamine C puis écran solaire. Soir : 3 à 4 gouttes de Sérum Acide Hyaluronique sur peau légèrement humide.',
    ingredients: 'Voir la composition de chaque sérum.',
  },
];

const settings = {
  store_name: 'The Queen',
  phone: '',
  whatsapp: '',
  instagram: '',
  tiktok: '',
  facebook: '',
  email: '',
  announcement: 'Livraison dans les 58 wilayas · Paiement à la réception',
  announcement_ar: 'التوصيل إلى 58 ولاية · الدفع عند الاستلام',
  free_shipping_threshold: '0',
};

function seed() {
  const tx = db.transaction(() => {
    const insW = db.prepare('INSERT OR IGNORE INTO wilayas (code, name, name_ar, home_price, office_price) VALUES (?, ?, ?, ?, ?)');
    wilayas.forEach((w, i) => insW.run(w.code, w.name, WILAYA_AR[i] || null, w.home_price, w.office_price));

    const insC = db.prepare('INSERT OR IGNORE INTO categories (slug, name, name_ar, sort_order) VALUES (@slug, @name, @name_ar, @sort_order)');
    categories.forEach((c) => insC.run(c));

    const catId = (slug) => db.prepare('SELECT id FROM categories WHERE slug = ?').get(slug)?.id ?? null;
    const exists = db.prepare('SELECT id FROM products WHERE slug = ?');
    const insP = db.prepare(`INSERT INTO products (slug, name, name_ar, subtitle, subtitle_ar, description, description_ar, price, compare_price, category_id, sku, volume, stock, theme, is_featured, sold_count, sort_order, tags, images, benefits, how_to, ingredients)
      VALUES (@slug, @name, @name_ar, @subtitle, @subtitle_ar, @description, @description_ar, @price, @compare_price, @category_id, @sku, @volume, @stock, @theme, @is_featured, @sold_count, @sort_order, @tags, @images, @benefits, @how_to, @ingredients)`);
    const insM = db.prepare("INSERT INTO stock_movements (product_id, delta, stock_after, reason, note, created_by) VALUES (?, ?, ?, 'initial', 'Stock initial importé', 'system')");
    products.forEach((p) => {
      if (exists.get(p.slug)) return;
      const r = insP.run({ ...p, category_id: catId(p.category), tags: JSON.stringify(p.tags), images: JSON.stringify(p.images), benefits: JSON.stringify(p.benefits) });
      if (p.stock > 0) insM.run(r.lastInsertRowid, p.stock, p.stock);
    });

    const insS = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
    Object.entries(settings).forEach(([k, v]) => insS.run(k, v));

    db.prepare("INSERT OR IGNORE INTO coupons (code, type, value, min_order) VALUES ('QUEEN10', 'percent', 10, 4000)").run();
  });
  tx();

  const adminCount = db.prepare('SELECT COUNT(*) n FROM admins').get().n;
  if (!adminCount) {
    const email = process.env.ADMIN_EMAIL || 'admin@the-queen.shop';
    let password = process.env.ADMIN_PASSWORD;
    if (!password) {
      // No default password in the repo: generate one and store it next to the database.
      password = require('crypto').randomBytes(9).toString('base64url');
      const f = require('path').join(require('../paths').DATA_DIR, 'FIRST-LOGIN.txt');
      require('fs').writeFileSync(f, `email: ${email}\npassword: ${password}\n(delete this file after changing the password in the dashboard)\n`);
      console.log(`[seed] Admin created: ${email} — generated password saved in ${f}`);
    } else console.log(`[seed] Admin created: ${email}`);
    db.prepare('INSERT INTO admins (email, name, password_hash) VALUES (?, ?, ?)').run(email.toLowerCase(), 'Administratrice', bcrypt.hashSync(password, 10));
  }
}

module.exports = seed;
if (require.main === module) { seed(); console.log('[seed] done'); }
