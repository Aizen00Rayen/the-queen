import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const fr = {
  nav_shop: 'La Collection', nav_ritual: 'Le Rituel', nav_story: 'La Maison', nav_track: 'Suivi', nav_faq: 'FAQ', nav_contact: 'Contact',
  cart: 'Panier', cart_empty: 'Votre panier attend sa reine.', cart_empty_cta: 'Découvrir la collection', subtotal: 'Sous-total',
  checkout: 'Commander', continue: 'Continuer mes achats', add_to_cart: 'Ajouter au panier', buy_now: 'Commander maintenant',
  added: 'Ajouté', out_of_stock: 'Épuisé', low_stock: 'Plus que quelques pièces', in_stock: 'En stock · expédié sous 24–48h',
  shipping_note: 'Livraison calculée à l’étape suivante', cod: 'Paiement à la réception', qty: 'Quantité',
  hero_eyebrow: 'Haute Dermatologie · Algérie',
  hero_l1: 'L’éclat', hero_l2: 'se couronne.',
  hero_sub: 'Des sérums ultra-concentrés en Vitamine C pure et Acide Hyaluronique, formulés sous contrôle dermatologique pour révéler la splendeur naturelle de votre teint.',
  hero_cta: 'Découvrir les sérums', hero_cta2: 'Le Duo Royal',
  marquee: ['Vitamine C Pure 15%', 'Acide Hyaluronique tri-moléculaire', 'Livraison 58 wilayas', 'Paiement à la réception', 'Testé dermatologiquement', 'Sans parabènes', 'Non testé sur les animaux'],
  icons_eyebrow: 'Les Icônes', icons_title: 'Trois formules.', icons_title2: 'Un seul règne.', icons_sub: 'Concentrations actives maximales, textures sensorielles, résultats visibles en 28 jours.',
  manifesto: 'Nous refusons les formules diluées et les promesses éphémères. Chaque goutte The Queen est une célébration de la science dermatologique — pure, précise, souveraine.',
  actives_eyebrow: 'Les Actifs', actives_title: 'La pureté moléculaire', actives_title2: 'au cœur de chaque flacon.',
  results_eyebrow: 'Résultats cliniques', results_title: 'Transformation', results_title2: 'en 28 jours.',
  results_sub: 'Faites glisser le curseur pour observer l’évolution de la texture de peau après 4 semaines du protocole The Queen.',
  before: 'Avant', after: 'Après · J28',
  stat1: 'd’éclat & de luminosité', stat2: 'd’hydratation continue', stat3: 'de ridules atténuées',
  ritual_eyebrow: 'Le Rituel Royal', ritual_title: 'Jour & Nuit,', ritual_title2: 'une routine souveraine.', day: 'Jour', night: 'Nuit',
  duo_eyebrow: 'Édition Coffret', duo_title: 'Le Duo Royal', duo_sub: 'La Vitamine C le matin pour protéger et illuminer, l’Acide Hyaluronique le soir pour réparer et repulper. Le protocole complet 24h/24.',
  duo_save: 'Économisez', reviews_eyebrow: 'Elles en parlent', reviews_title: 'La parole aux reines.',
  promise1: 'Livraison 58 wilayas', promise1s: 'À domicile ou en Stop-Desk', promise2: 'Paiement à la réception', promise2s: 'Vous payez en main propre',
  promise3: 'Authenticité garantie', promise3s: 'Directement de la Maison', promise4: 'Testé dermatologiquement', promise4s: 'Toutes typologies de peau',
  news_title: 'Rejoignez la Cour.', news_sub: 'Offres privées, lancements en avant-première et conseils de rituel.', news_ph: 'E-mail ou téléphone', news_cta: 'S’inscrire', news_ok: 'Bienvenue dans la Cour ✦',
  footer_tag: 'L’excellence de la haute dermatologie, livrée dans les 58 wilayas d’Algérie.',
  shop_title: 'La Collection', shop_sub: 'Composez votre rituel The Queen.', all: 'Tout', sort: 'Trier',
  sort_featured: 'Recommandés', sort_best: 'Meilleures ventes', sort_low: 'Prix croissant', sort_high: 'Prix décroissant',
  benefits: 'Bénéfices', how_to: 'Rituel d’application', ingredients: 'Composition', delivery: 'Livraison & paiement',
  delivery_text: 'Livraison dans les 58 wilayas à domicile ou au bureau Stop-Desk le plus proche. Notre équipe vous appelle pour confirmer la commande. Vous réglez en espèces à la réception du colis.',
  complete_ritual: 'Complétez votre rituel', description: 'Description',
  co_title: 'Finaliser la commande', co_info: 'Vos informations', co_delivery: 'Livraison', co_summary: 'Récapitulatif',
  name: 'Nom complet', phone: 'Téléphone', phone2: 'Téléphone 2 (optionnel)', wilaya: 'Wilaya', commune: 'Commune', address: 'Adresse complète',
  note: 'Note pour la livraison (optionnel)', choose_wilaya: 'Sélectionnez votre wilaya', home: 'À domicile', office: 'Bureau Stop-Desk',
  home_s: 'Livré à votre porte', office_s: 'Retrait au point relais', shipping: 'Livraison', discount: 'Réduction', total: 'Total',
  coupon: 'Code promo', apply: 'Appliquer', place_order: 'Confirmer la commande', placing: 'Envoi…', free: 'Offerte',
  co_trust: 'Aucun paiement en ligne. Vous payez en espèces au livreur à la réception.',
  ty_title: 'Merci, votre commande est royale.', ty_sub: 'Notre équipe vous appellera très bientôt pour confirmer l’expédition.', ty_number: 'Numéro de commande',
  ty_track: 'Suivre ma commande', ty_home: 'Retour à l’accueil',
  track_title: 'Suivre ma commande', track_sub: 'Entrez votre numéro de commande et votre téléphone.', track_number: 'N° de commande', track_cta: 'Rechercher',
  st_pending: 'Reçue', st_confirmed: 'Confirmée', st_preparing: 'En préparation', st_shipped: 'Expédiée', st_delivered: 'Livrée',
  st_no_answer: 'En attente d’appel', st_cancelled: 'Annulée', st_returned: 'Retournée',
  faq_title: 'Questions fréquentes', contact_title: 'Nous contacter', story_title: 'La Maison The Queen',
  notfound: 'Cette page s’est éclipsée.', back_home: 'Retour à l’accueil', save: 'Économisez', reviews: 'avis',
};

const ar = {
  nav_shop: 'المجموعة', nav_ritual: 'الروتين', nav_story: 'الدار', nav_track: 'تتبع الطلب', nav_faq: 'الأسئلة', nav_contact: 'اتصلي بنا',
  cart: 'السلة', cart_empty: 'سلتك تنتظر ملكتها.', cart_empty_cta: 'اكتشفي المجموعة', subtotal: 'المجموع الفرعي',
  checkout: 'اطلبي الآن', continue: 'متابعة التسوق', add_to_cart: 'أضيفي إلى السلة', buy_now: 'اطلبي الآن',
  added: 'تمت الإضافة', out_of_stock: 'نفدت الكمية', low_stock: 'بقيت قطع قليلة', in_stock: 'متوفر · يُشحن خلال 24–48 ساعة',
  shipping_note: 'تُحسب تكلفة التوصيل في الخطوة التالية', cod: 'الدفع عند الاستلام', qty: 'الكمية',
  hero_eyebrow: 'طب الجلد الراقي · الجزائر',
  hero_l1: 'الإشراقة', hero_l2: 'تُتوَّج.',
  hero_sub: 'سيرومات مركّزة بفيتامين C النقي وحمض الهيالورونيك، مصمّمة تحت إشراف جلدي لتكشف عن جمال بشرتك الطبيعي.',
  hero_cta: 'اكتشفي السيرومات', hero_cta2: 'الثنائي الملكي',
  marquee: ['فيتامين C نقي 15%', 'حمض الهيالورونيك ثلاثي الجزيئات', 'توصيل إلى 58 ولاية', 'الدفع عند الاستلام', 'مختبر جلدياً', 'بدون بارابين', 'غير مختبر على الحيوانات'],
  icons_eyebrow: 'الأيقونات', icons_title: 'ثلاث تركيبات.', icons_title2: 'مملكة واحدة.', icons_sub: 'تركيزات فعّالة قصوى، قوام حسي ونتائج واضحة خلال 28 يوماً.',
  manifesto: 'نرفض التركيبات المخففة والوعود العابرة. كل قطرة من ذا كوين احتفاء بعلم الجلد — نقية، دقيقة، وملكية.',
  actives_eyebrow: 'المكونات الفعّالة', actives_title: 'النقاء الجزيئي', actives_title2: 'في قلب كل قارورة.',
  results_eyebrow: 'نتائج سريرية', results_title: 'تحوّل', results_title2: 'في 28 يوماً.',
  results_sub: 'اسحبي المؤشر لملاحظة تطور ملمس البشرة بعد 4 أسابيع من بروتوكول ذا كوين.',
  before: 'قبل', after: 'بعد · اليوم 28',
  stat1: 'إشراقة ونضارة', stat2: 'ترطيب متواصل', stat3: 'تقليل الخطوط الدقيقة',
  ritual_eyebrow: 'الروتين الملكي', ritual_title: 'ليلاً ونهاراً،', ritual_title2: 'روتين يليق بالملكات.', day: 'نهار', night: 'ليل',
  duo_eyebrow: 'إصدار العلبة', duo_title: 'الثنائي الملكي', duo_sub: 'فيتامين C صباحاً للحماية والإشراق، وحمض الهيالورونيك مساءً للإصلاح والامتلاء. بروتوكول متكامل على مدار 24 ساعة.',
  duo_save: 'وفّري', reviews_eyebrow: 'آراؤهن', reviews_title: 'الكلمة للملكات.',
  promise1: 'توصيل 58 ولاية', promise1s: 'للمنزل أو المكتب', promise2: 'الدفع عند الاستلام', promise2s: 'ادفعي عند استلام الطرد',
  promise3: 'أصالة مضمونة', promise3s: 'مباشرة من الدار', promise4: 'مختبر جلدياً', promise4s: 'لجميع أنواع البشرة',
  news_title: 'انضمي إلى البلاط.', news_sub: 'عروض خاصة، إطلاقات حصرية ونصائح للعناية.', news_ph: 'البريد أو الهاتف', news_cta: 'اشتركي', news_ok: 'مرحباً بك في البلاط ✦',
  footer_tag: 'تميّز طب الجلد الراقي، يصلك إلى 58 ولاية في الجزائر.',
  shop_title: 'المجموعة', shop_sub: 'كوّني روتينك مع ذا كوين.', all: 'الكل', sort: 'ترتيب',
  sort_featured: 'المقترحة', sort_best: 'الأكثر مبيعاً', sort_low: 'السعر تصاعدياً', sort_high: 'السعر تنازلياً',
  benefits: 'الفوائد', how_to: 'طريقة الاستعمال', ingredients: 'المكونات', delivery: 'التوصيل والدفع',
  delivery_text: 'التوصيل إلى 58 ولاية للمنزل أو لأقرب مكتب. يتصل بك فريقنا لتأكيد الطلب، وتدفعين نقداً عند استلام الطرد.',
  complete_ritual: 'أكملي روتينك', description: 'الوصف',
  co_title: 'إتمام الطلب', co_info: 'معلوماتك', co_delivery: 'التوصيل', co_summary: 'ملخص الطلب',
  name: 'الاسم الكامل', phone: 'الهاتف', phone2: 'هاتف ثانٍ (اختياري)', wilaya: 'الولاية', commune: 'البلدية', address: 'العنوان الكامل',
  note: 'ملاحظة للتوصيل (اختياري)', choose_wilaya: 'اختاري ولايتك', home: 'للمنزل', office: 'للمكتب (Stop-Desk)',
  home_s: 'حتى باب منزلك', office_s: 'استلام من نقطة التوصيل', shipping: 'التوصيل', discount: 'التخفيض', total: 'المجموع',
  coupon: 'رمز التخفيض', apply: 'تطبيق', place_order: 'تأكيد الطلب', placing: 'جارٍ الإرسال…', free: 'مجاني',
  co_trust: 'لا دفع إلكتروني. تدفعين نقداً لعامل التوصيل عند الاستلام.',
  ty_title: 'شكراً، طلبك ملكي.', ty_sub: 'سيتصل بك فريقنا قريباً لتأكيد الشحن.', ty_number: 'رقم الطلب',
  ty_track: 'تتبع طلبي', ty_home: 'العودة للرئيسية',
  track_title: 'تتبع طلبي', track_sub: 'أدخلي رقم الطلب ورقم الهاتف.', track_number: 'رقم الطلب', track_cta: 'بحث',
  st_pending: 'مستلم', st_confirmed: 'مؤكد', st_preparing: 'قيد التحضير', st_shipped: 'تم الشحن', st_delivered: 'تم التوصيل',
  st_no_answer: 'في انتظار الاتصال', st_cancelled: 'ملغى', st_returned: 'مُرجع',
  faq_title: 'الأسئلة الشائعة', contact_title: 'اتصلي بنا', story_title: 'دار ذا كوين',
  notfound: 'هذه الصفحة غير موجودة.', back_home: 'العودة للرئيسية', save: 'وفّري', reviews: 'تقييم',
};

const dict = { fr, ar };
const Ctx = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => { try { return localStorage.getItem('tq_lang') || 'fr'; } catch { return 'fr'; } });
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    try { localStorage.setItem('tq_lang', lang); } catch {}
  }, [lang]);
  const value = useMemo(() => ({
    lang, setLang,
    t: (k) => dict[lang][k] ?? fr[k] ?? k,
    /** pick localized field from an object: L(product, 'name') */
    L: (o, f) => (lang === 'ar' && o?.[`${f}_ar`]) || o?.[f],
  }), [lang]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useI18n = () => useContext(Ctx);
