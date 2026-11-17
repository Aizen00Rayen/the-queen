import { useEffect, useState } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Search, Package, Phone, MessageCircle, Instagram, Mail, ChevronDown, Loader2, Clock, XCircle, RotateCcw } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { useSettings } from '../lib/hooks';
import { api } from '../lib/api';
import { money, dateFr } from '../lib/format';
import { Reveal, SplitReveal, ease, Counter } from '../components/motion';
import { Monogram, Seal } from '../components/Brand';

/* ---------------------------------------------------------------- Thank you */
export function ThankYou() {
  const { number } = useParams();
  const { state } = useLocation();
  const { t, lang } = useI18n();
  return (
    <section className="relative overflow-hidden bg-noir text-ivory">
      <div className="absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/15 blur-[140px]" />
      <div className="container-q relative flex min-h-[85vh] flex-col items-center justify-center py-24 text-center">
        <motion.div initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ duration: 1.2, ease }} className="relative mb-10">
          <span className="absolute inset-0 rounded-full border border-gold" style={{ animation: 'pulse-ring 2.4s ease-out infinite' }} />
          <span className="grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-gold-light to-gold-deep text-noir"><Check size={40} strokeWidth={2} /></span>
        </motion.div>
        <h1 className="h-display max-w-4xl text-[clamp(40px,6vw,96px)] italic"><SplitReveal text={t('ty_title')} immediate /></h1>
        <Reveal delay={0.4}><p className="mx-auto mt-6 max-w-lg text-ivory/70">{t('ty_sub')}</p></Reveal>
        <Reveal delay={0.6} className="mt-10 rounded-[28px] border border-ivory/10 bg-ivory/5 px-10 py-7 backdrop-blur">
          <p className="eyebrow text-gold">{t('ty_number')}</p>
          <p className="mt-2 font-sans text-3xl font-semibold tracking-[0.12em]" dir="ltr">{number}</p>
          {state?.total != null && <p className="mt-2 text-sm text-ivory/60">{t('total')} : {money(state.total, lang)} · {t('cod')}</p>}
        </Reveal>
        <Reveal delay={0.8} className="mt-10 flex flex-wrap justify-center gap-4">
          <Link to={`/suivi?n=${number}${state?.phone ? `&p=${encodeURIComponent(state.phone)}` : ''}`} className="btn btn-gold"><span className="btn-shine" />{t('ty_track')}</Link>
          <Link to="/" className="btn btn-ghost-light">{t('ty_home')}</Link>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Track */
const FLOW = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered'];
export function Track() {
  const { t, lang } = useI18n();
  const [sp] = useSearchParams();
  const [f, setF] = useState({ number: sp.get('n') || '', phone: sp.get('p') || '' });
  const [res, setRes] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const go = async (e) => {
    e?.preventDefault(); setBusy(true); setErr('');
    try { setRes(await api('/orders/track', { method: 'POST', body: f })); } catch (e2) { setErr(e2.message); setRes(null); } finally { setBusy(false); }
  };
  useEffect(() => { if (f.number && f.phone) go(); }, []); // eslint-disable-line
  const idx = res ? FLOW.indexOf(res.status) : -1;
  const special = res && !FLOW.includes(res.status);
  return (
    <div className="container-q min-h-[80vh] py-16 lg:py-24">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="h-display text-[clamp(44px,7vw,110px)] italic"><SplitReveal text={t('track_title')} immediate /></h1>
        <p className="mt-4 text-ink/70">{t('track_sub')}</p>
        <form onSubmit={go} className="mt-10 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <input className="field uppercase" dir="ltr" placeholder={`${t('track_number')} (TQ-…)`} value={f.number} onChange={(e) => setF({ ...f, number: e.target.value })} required />
          <input className="field" dir="ltr" inputMode="tel" placeholder={t('phone')} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} required />
          <button className="btn btn-noir h-[52px]">{busy ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}{t('track_cta')}</button>
        </form>
        {err && <p className="mt-4 text-sm text-red-600">{err}</p>}
      </div>
      <AnimatePresence>
        {res && (
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease }} className="card-lux mx-auto mt-14 max-w-3xl p-6 sm:p-10">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div><p className="eyebrow text-gold-deep">{t('ty_number')}</p><p className="mt-1 font-display text-3xl" dir="ltr">{res.number}</p><p className="text-xs text-mute">{dateFr(res.created_at)}</p></div>
              <div className="text-right rtl:text-left"><p className="text-xs text-mute">{t('total')}</p><p className="font-display text-3xl">{money(res.total, lang)}</p></div>
            </div>
            {special ? (
              <div className="mt-10 flex items-center gap-4 rounded-2xl bg-ivory-100 p-5">
                {res.status === 'cancelled' ? <XCircle className="text-red-600" /> : res.status === 'returned' ? <RotateCcw className="text-amber-700" /> : <Clock className="text-amber-600" />}
                <p className="font-semibold">{t(`st_${res.status}`)}</p>
              </div>
            ) : (
              <div className="relative mt-12">
                <div className="absolute left-5 right-5 top-5 h-0.5 bg-noir/10" />
                <motion.div className="absolute left-5 top-5 h-0.5 origin-left bg-gradient-to-r from-gold-deep to-gold rtl:left-auto rtl:right-5 rtl:origin-right" initial={{ width: 0 }} animate={{ width: `calc((100% - 40px) * ${Math.max(0, idx) / (FLOW.length - 1)})` }} transition={{ duration: 1.4, ease, delay: 0.3 }} />
                <ol className="relative flex justify-between">
                  {FLOW.map((s, i) => (
                    <li key={s} className="flex w-16 flex-col items-center gap-3 text-center sm:w-24">
                      <motion.span initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3 + i * 0.15 }}
                        className={`grid h-10 w-10 place-items-center rounded-full border-2 ${i <= idx ? 'border-gold bg-gold text-noir' : 'border-noir/10 bg-white text-mute'}`}>
                        {i <= idx ? <Check size={16} /> : <span className="text-xs">{i + 1}</span>}
                      </motion.span>
                      <span className={`text-[11px] font-semibold leading-tight sm:text-xs ${i <= idx ? 'text-noir' : 'text-mute'}`}>{t(`st_${s}`)}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
            <ul className="mt-10 divide-y divide-noir/5 border-t border-noir/5">
              {res.items.map((it, i) => (
                <li key={i} className="flex items-center gap-4 py-4"><img src={it.image} alt="" className="h-14 w-14 rounded-xl object-cover" /><span className="flex-1 font-display text-lg">{it.name} <span className="text-sm text-mute">× {it.qty}</span></span><span className="text-sm font-semibold">{money(it.price * it.qty, lang)}</span></li>
              ))}
            </ul>
            <p className="mt-4 flex items-center gap-2 text-sm text-mute"><Package size={15} /> {res.wilaya_name}, {res.commune} · {res.delivery_type === 'office' ? t('office') : t('home')} {res.tracking_number && <>· <span dir="ltr">#{res.tracking_number}</span></>}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------------------------------------------------------------- Story / La Maison */
export function Story() {
  const { t, lang } = useI18n();
  const ar = lang === 'ar';
  const values = ar
    ? [['نقاء', 'جزيئات مختارة لنقائها الصيدلاني وتوافقها الطبيعي مع البشرة.'], ['دقة', 'تركيزات فعّالة قصوى مثبتة سريرياً لفعالية خلوية مرئية.'], ['تحمّل', 'كل تركيبة مختبرة بصرامة لضمان تحمّل مثالي على البشرة الحساسة.'], ['أخلاق', 'غير مختبر على الحيوانات، بدون بارابين وبدون سيليكون.']]
    : [['Pureté', 'Des molécules sélectionnées pour leur pureté pharmaceutique et leur affinité naturelle avec la peau.'], ['Précision', 'Des concentrations actives maximales éprouvées pour une efficacité cellulaire visible.'], ['Tolérance', 'Chaque formule est rigoureusement testée pour une tolérance irréprochable sur peaux sensibles.'], ['Éthique', 'Non testé sur les animaux. 100% sans parabènes, sans silicones occlusifs.']];
  return (
    <div>
      <section className="relative overflow-hidden bg-noir text-ivory">
        <img src="/brand/v2/hero-duo.webp" alt="" className="absolute inset-0 h-full w-full object-cover object-[65%_50%] opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-noir via-noir/40 to-noir/60" />
        <div className="container-q relative flex min-h-[80vh] flex-col justify-end pb-20 pt-40">
          <p className="eyebrow mb-6 text-gold">{t('nav_story')}</p>
          <h1 className="h-display max-w-5xl text-[clamp(48px,8vw,140px)]"><SplitReveal text={ar ? 'حين يلتقي العلم' : 'Quand la science'} immediate /><br /><span className="italic"><SplitReveal text={ar ? 'بالأناقة.' : 'rencontre la grâce.'} delay={0.3} inner="gold-text pr-[0.06em]" immediate /></span></h1>
        </div>
      </section>
      <section className="container-q grid gap-16 py-28 lg:grid-cols-2 lg:py-40">
        <Reveal><p className="font-display text-[clamp(26px,3vw,44px)] italic leading-snug">{ar ? 'وُلدت ذا كوين من رؤية لا تقبل المساومة: أن ترتقي العناية بالوجه إلى مرتبة الطقس الملكي.' : 'Née d’une vision sans compromis, The Queen élève le soin du visage au rang de rituel royal.'}</p></Reveal>
        <Reveal delay={0.15} className="space-y-6 text-[15px] leading-relaxed text-ink/80">
          <p>{ar ? 'نرفض التركيبات المخففة والوعود العابرة. كل سيروم من سيروماتنا مصمم بتركيزات فعالة قصوى، مختارة لتوافقها البيولوجي.' : 'Nous refusons les formules diluées et les promesses éphémères. Chacun de nos sérums est formulé avec des concentrations actives maximales, sélectionnées pour leur compatibilité biologique.'}</p>
          <p>{ar ? 'من القوارير الواقية الملونة إلى القطارات عالية الدقة، صُممت كل التفاصيل للحفاظ على النقاء الجزيئي للتركيبة حتى ملامستها لبشرتك.' : 'Des flacons protecteurs teintés aux pipettes de haute précision, chaque détail a été pensé pour préserver la pureté moléculaire de la formule jusqu’au contact de votre peau.'}</p>
          <p>{ar ? 'تصل ذا كوين إلى 58 ولاية مع توصيل عناية ودفع عند الاستلام، لتجعل تجربة الفخامة الجلدية في متناول كل امرأة.' : 'Distribuée à travers les 58 wilayas d’Algérie avec une livraison soignée et le paiement à la réception, The Queen rend accessible l’expérience du luxe dermatologique le plus pur.'}</p>
        </Reveal>
      </section>
      <section className="bg-ivory-100 py-28">
        <div className="container-q grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {values.map(([a, b], i) => (
            <Reveal key={a} delay={i * 0.1} className="card-lux p-8">
              <p className="font-display text-6xl italic text-gold">0{i + 1}</p>
              <h3 className="mt-6 font-display text-3xl">{a}</h3><p className="mt-3 text-sm leading-relaxed text-ink/70">{b}</p>
            </Reveal>
          ))}
        </div>
      </section>
      <section className="container-q grid items-center gap-12 py-28 sm:grid-cols-3">
        {[[58, '', ar ? 'ولاية مغطاة' : 'wilayas livrées'], [15, '%', ar ? 'فيتامين C نقي' : 'de Vitamine C pure'], [98, '%', ar ? 'من العميلات يوصين' : 'de clientes conquises']].map(([n, s, l]) => (
          <div key={l} className="text-center"><p className="font-display text-[clamp(64px,8vw,120px)] leading-none"><Counter to={n} suffix={s} /></p><p className="mt-3 text-sm uppercase tracking-[0.2em] text-mute">{l}</p></div>
        ))}
      </section>
    </div>
  );
}

/* ---------------------------------------------------------------- FAQ */
const FAQS = {
  fr: [
    ['Comment passer commande ?', 'Ajoutez vos sérums au panier, renseignez votre nom, téléphone et wilaya, puis confirmez. Notre équipe vous appelle pour valider la commande avant l’expédition.'],
    ['Quels sont les délais de livraison ?', 'Comptez généralement 24 à 72h pour les grandes villes et jusqu’à 5 jours ouvrés pour les wilayas du Sud.'],
    ['Combien coûte la livraison ?', 'Le tarif dépend de votre wilaya et du mode choisi (à domicile ou au bureau Stop-Desk). Il est affiché automatiquement lors de la commande.'],
    ['Comment se passe le paiement ?', 'Vous payez en espèces directement au livreur, à la réception du colis. Aucun paiement en ligne n’est demandé.'],
    ['Puis-je utiliser la Vitamine C et l’Acide Hyaluronique ensemble ?', 'Oui, c’est même recommandé : la Vitamine C le matin (suivie d’un SPF) et l’Acide Hyaluronique le soir. C’est le protocole du Duo Royal.'],
    ['Les sérums conviennent-ils aux peaux sensibles ?', 'Nos formules sont testées sous contrôle dermatologique et conviennent à toutes les typologies de peau. Faites un test sur une petite zone en cas de doute.'],
    ['Comment suivre ma commande ?', 'Rendez-vous sur la page « Suivi » avec votre numéro de commande (TQ-…) et votre téléphone.'],
  ],
  ar: [
    ['كيف أطلب؟', 'أضيفي السيرومات إلى السلة، أدخلي اسمك وهاتفك وولايتك ثم أكدي. سيتصل بك فريقنا لتأكيد الطلب قبل الشحن.'],
    ['ما هي مدة التوصيل؟', 'عادة من 24 إلى 72 ساعة للمدن الكبرى وحتى 5 أيام عمل لولايات الجنوب.'],
    ['كم سعر التوصيل؟', 'يعتمد السعر على ولايتك وطريقة التوصيل (للمنزل أو للمكتب) ويظهر تلقائياً عند الطلب.'],
    ['كيف يتم الدفع؟', 'تدفعين نقداً لعامل التوصيل عند استلام الطرد. لا يوجد دفع إلكتروني.'],
    ['هل يمكن استعمال فيتامين C وحمض الهيالورونيك معاً؟', 'نعم، بل ننصح بذلك: فيتامين C صباحاً مع واقي الشمس، وحمض الهيالورونيك مساءً. هذا هو بروتوكول الثنائي الملكي.'],
    ['هل تناسب السيرومات البشرة الحساسة؟', 'تركيباتنا مختبرة تحت إشراف جلدي وتناسب جميع أنواع البشرة. جربي على منطقة صغيرة عند الشك.'],
    ['كيف أتتبع طلبي؟', 'ادخلي صفحة «تتبع الطلب» برقم الطلب (TQ-…) ورقم هاتفك.'],
  ],
};
export function Faq() {
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(0);
  return (
    <div className="container-q grid gap-16 py-16 lg:grid-cols-12 lg:py-28">
      <div className="lg:col-span-5">
        <h1 className="h-display text-[clamp(48px,7vw,110px)] italic lg:sticky lg:top-32"><SplitReveal text={t('faq_title')} immediate /></h1>
      </div>
      <div className="lg:col-span-7">
        {FAQS[lang].map(([q, a], i) => (
          <div key={i} className="border-b border-noir/10">
            <button onClick={() => setOpen(open === i ? -1 : i)} className="flex w-full items-center justify-between gap-6 py-7 text-left rtl:text-right">
              <span className="font-display text-[22px] leading-snug sm:text-2xl">{q}</span>
              <motion.span animate={{ rotate: open === i ? 180 : 0 }} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-noir/10"><ChevronDown size={16} /></motion.span>
            </button>
            <AnimatePresence initial={false}>
              {open === i && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.5, ease }} className="overflow-hidden"><p className="pb-8 leading-relaxed text-ink/75">{a}</p></motion.div>}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Contact */
export function Contact() {
  const { t, lang } = useI18n();
  const s = useSettings();
  const items = [
    s.phone && [Phone, t('phone'), s.phone, `tel:${s.phone}`],
    s.whatsapp && [MessageCircle, 'WhatsApp', s.whatsapp, `https://wa.me/${s.whatsapp.replace(/\D/g, '').replace(/^0/, '213')}`],
    s.instagram && [Instagram, 'Instagram', s.instagram, s.instagram.startsWith('http') ? s.instagram : `https://instagram.com/${s.instagram.replace('@', '')}`],
    s.email && [Mail, 'E-mail', s.email, `mailto:${s.email}`],
  ].filter(Boolean);
  return (
    <div className="container-q grid min-h-[75vh] items-center gap-16 py-16 lg:grid-cols-2 lg:py-24">
      <div>
        <h1 className="h-display text-[clamp(48px,7vw,120px)] italic"><SplitReveal text={t('contact_title')} immediate /></h1>
        <p className="mt-6 max-w-md text-ink/75">{lang === 'ar' ? 'فريقنا في خدمتك لأي سؤال حول طلبك أو روتينك.' : 'Notre équipe est à votre écoute pour toute question sur votre commande ou votre rituel.'}</p>
        <div className="mt-10 space-y-3">
          {items.length ? items.map(([I, l, v, href]) => (
            <a key={l} href={href} target="_blank" rel="noreferrer" className="card-lux flex items-center gap-5 p-5 transition hover:-translate-y-1">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-noir text-gold"><I size={18} /></span>
              <span><span className="block text-xs uppercase tracking-[0.18em] text-mute">{l}</span><span className="font-display text-xl" dir="ltr">{v}</span></span>
            </a>
          )) : <p className="text-sm text-mute">{lang === 'ar' ? 'سيتم إضافة معلومات الاتصال قريباً.' : 'Coordonnées bientôt disponibles.'}</p>}
        </div>
      </div>
      <div className="flex justify-center"><Seal className="h-72 w-72 sm:h-96 sm:w-96" /></div>
    </div>
  );
}
