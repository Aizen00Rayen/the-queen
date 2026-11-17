import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring, AnimatePresence, useMotionValue } from 'framer-motion';
import { ArrowRight, ArrowDown, Sun, Moon, Truck, HandCoins, ShieldCheck, FlaskConical, Star, Quote, Droplet, Sparkles, Leaf, Atom } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { useApi } from '../lib/hooks';
import { api } from '../lib/api';
import { useCart } from '../lib/store';
import { money, pct } from '../lib/format';
import ProductCard from '../components/ProductCard';
import { Reveal, SplitReveal, Magnetic, Counter, Marquee, ease } from '../components/motion';
import { Seal, Monogram } from '../components/Brand';

/* ------------------------------------------------------------------ HERO */
function Hero() {
  const { t, lang } = useI18n();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const mx = useMotionValue(0), my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 20 }), sy = useSpring(my, { stiffness: 60, damping: 20 });
  const vx = useTransform(sx, [-1, 1], [14, -14]);
  const vy = useTransform(sy, [-1, 1], [10, -10]);
  const onMove = (e) => { mx.set((e.clientX / innerWidth) * 2 - 1); my.set((e.clientY / innerHeight) * 2 - 1); };

  return (
    <section ref={ref} onMouseMove={onMove} className="relative h-[100svh] min-h-[680px] overflow-hidden bg-noir text-ivory">
      {/* cinematic product loop (real bottles composited on AI-generated marble & silk set) */}
      <motion.div style={{ scale, x: vx, y: vy }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2, ease }}
        className="absolute inset-x-0 bottom-0 h-[36%] lg:inset-y-0 lg:left-[22%] lg:h-full lg:w-[78%] lg:[mask-image:linear-gradient(to_right,transparent,#000_28%)] rtl:lg:left-[-12%] rtl:lg:[mask-image:linear-gradient(to_left,transparent,#000_28%)]">
        <video className="h-full w-full object-cover object-[63%_45%]" autoPlay muted loop playsInline preload="auto" poster="/brand/v2/hero-duo.webp" aria-label="Le Duo Royal The Queen">
          <source src="/brand/v2/hero-loop.webm" type="video/webm" />
          <source src="/brand/v2/hero-loop.mp4" type="video/mp4" />
        </video>
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-b from-noir via-noir/20 to-noir/80 lg:hidden" />
      <div className="absolute inset-y-0 left-0 hidden w-[70%] bg-gradient-to-r from-noir via-noir/70 to-transparent lg:block rtl:left-auto rtl:right-0 rtl:bg-gradient-to-l" />
      <div className="absolute inset-0 hidden lg:block" style={{ background: 'linear-gradient(to bottom, rgba(11,10,9,.55), transparent 30%, transparent 70%, #0B0A09)' }} />

      <motion.div style={{ y, opacity }} className="container-q relative z-10 grid h-full items-start pt-28 lg:grid-cols-12 lg:items-center lg:pt-20">
        <div className="lg:col-span-7">
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 1, ease }}
            className="eyebrow mb-6 flex items-center gap-3 text-gold-light"><span className="h-px w-10 bg-gold" />{t('hero_eyebrow')}</motion.p>
          <h1 className="h-display text-[clamp(50px,10vw,168px)]">
            <span className="block"><SplitReveal text={t('hero_l1')} by={lang === 'ar' ? 'word' : 'char'} stagger={0.05} delay={0.4} immediate /></span>
            <span className="block italic pr-4"><SplitReveal text={t('hero_l2')} by="word" delay={0.75} inner="gold-text pr-[0.06em]" immediate /></span>
          </h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2, duration: 1.2, ease }}
            className="mt-5 max-w-xl text-[14px] leading-relaxed text-ivory/70 sm:mt-8 sm:text-base">{t('hero_sub')}</motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.4, duration: 1.2, ease }} className="mt-7 flex flex-wrap gap-3 sm:mt-10 sm:gap-4">
            <Magnetic><Link to="/boutique" className="btn btn-gold h-12 px-6 sm:h-14 sm:px-9"><span className="btn-shine" />{t('hero_cta')} <ArrowRight size={16} className="rtl:rotate-180" /></Link></Magnetic>
            <Magnetic><Link to="/produit/le-duo-royal-coffret-serums" className="btn btn-ghost-light h-12 px-6 sm:h-14 sm:px-9">{t('hero_cta2')}</Link></Magnetic>
          </motion.div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }} className="absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-ivory/50 sm:flex">
        <span>Scroll</span>
        <motion.span animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2 }}><ArrowDown size={14} /></motion.span>
      </motion.div>
      <div className="absolute bottom-10 right-10 z-10 hidden xl:block rtl:left-10 rtl:right-auto"><Seal className="h-28 w-28" /></div>
    </section>
  );
}

/* ------------------------------------------------------------------ ICONS (products) */
function Icons() {
  const { t } = useI18n();
  const { data: products } = useApi('/products');
  return (
    <section className="container-q py-28 lg:py-40">
      <div className="mb-16 grid items-end gap-8 lg:grid-cols-2">
        <div>
          <Reveal><p className="eyebrow mb-5 text-gold-deep">{t('icons_eyebrow')}</p></Reveal>
          <h2 className="h-display text-[clamp(44px,6vw,96px)]">
            <SplitReveal text={t('icons_title')} /><br />
            <span className="italic text-gold-deep"><SplitReveal text={t('icons_title2')} delay={0.2} /></span>
          </h2>
        </div>
        <Reveal delay={0.2} className="lg:justify-self-end">
          <p className="max-w-md text-ink/80 leading-relaxed">{t('icons_sub')}</p>
          <Link to="/boutique" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] link-u">{t('nav_shop')} <ArrowRight size={15} className="rtl:rotate-180" /></Link>
        </Reveal>
      </div>
      <div className="grid gap-x-8 gap-y-16 md:grid-cols-2 lg:grid-cols-3">
        {(products || [...Array(3)]).map((p, i) => p ? <ProductCard key={p.id} p={p} index={i} /> : <div key={i} className="aspect-[4/5] animate-pulse rounded-[32px] bg-ivory-200" />)}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ MANIFESTO (scroll-lit words) */
function Word({ children, progress, range }) {
  const opacity = useTransform(progress, range, [0.12, 1]);
  const color = useTransform(progress, range, ['#3A332C', '#F5EFE6']);
  return <motion.span style={{ opacity, color }} className="inline-block mr-[0.25em] rtl:ml-[0.25em] rtl:mr-0">{children}</motion.span>;
}
function Manifesto() {
  const { t } = useI18n();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.8', 'end 0.4'] });
  const words = t('manifesto').split(' ');
  return (
    <section ref={ref} className="relative overflow-hidden bg-noir py-32 lg:py-48">
      <div className="absolute -left-40 top-20 h-[500px] w-[500px] rounded-full bg-gold/10 blur-[120px]" />
      <div className="container-q relative">
        <Monogram className="mb-12 h-16 w-16" />
        <p className="max-w-6xl font-display text-[clamp(30px,4.4vw,72px)] leading-[1.12] tracking-[-0.01em]">
          {words.map((w, i) => <Word key={i} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]}>{w}</Word>)}
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ ACTIVES (horizontal pinned scroll) */
const ACTIVES = [
  { icon: Sparkles, n: '15%', name: 'Vitamine C Pure', ar: 'فيتامين C النقي', color: '#E8781E', bg: 'from-[#2a1606] to-[#0B0A09]', img: '/brand/v2/vitc-stage.webp',
    fr: "Acide L-ascorbique stabilisé. Stimule la synthèse du collagène, unifie les irrégularités pigmentaires et neutralise les radicaux libres.", tar: 'حمض الأسكوربيك المستقر. يحفز إنتاج الكولاجين ويوحّد لون البشرة ويحارب الجذور الحرة.' },
  { icon: Droplet, n: '3×', name: 'Acide Hyaluronique', ar: 'حمض الهيالورونيك', color: '#2A8FD8', bg: 'from-[#061a2a] to-[#0B0A09]', img: '/brand/v2/hyal-stage.webp',
    fr: 'Trois poids moléculaires. Lisse instantanément en surface et reconstitue en profondeur le matelas hydrique cellulaire.', tar: 'ثلاثة أوزان جزيئية. ينعّم السطح فوراً ويعيد ملء مخزون الماء في عمق الخلايا.' },
  { icon: Atom, n: 'E', name: 'Vitamine E', ar: 'فيتامين E', color: '#C9A66B', bg: 'from-[#241b0d] to-[#0B0A09]', img: '/brand/v2/duo-cut.webp',
    fr: 'Tocophérol naturel. Renforce la barrière lipidique et multiplie la stabilité antioxydante de la Vitamine C.', tar: 'توكوفيرول طبيعي. يقوي الحاجز الدهني ويضاعف ثبات فيتامين C المضاد للأكسدة.' },
  { icon: Leaf, n: '0%', name: 'Eau de Rose de Damas', ar: 'ماء الورد الدمشقي', color: '#E9C9C1', bg: 'from-[#2a1416] to-[#0B0A09]', img: '/brand/v2/rose-stage.webp',
    fr: 'Complexe floral apaisant. 0% parabènes, 0% silicones occlusifs, 0% huiles minérales. Tolérance irréprochable.', tar: 'مركب زهري مهدئ. خالٍ من البارابين والسيليكون والزيوت المعدنية. تحمّل مثالي.' },
];
function Actives() {
  const { t, lang } = useI18n();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const x = useTransform(scrollYProgress, [0, 1], lang === 'ar' ? ['0%', '75%'] : ['0%', '-75%']);
  return (
    <section ref={ref} className="relative h-[400vh] bg-noir text-ivory">
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <div className="container-q mb-10 flex items-end justify-between">
          <div>
            <p className="eyebrow mb-4 text-gold">{t('actives_eyebrow')}</p>
            <h2 className="h-display text-[clamp(36px,5vw,80px)]">{t('actives_title')} <span className="italic gold-text">{t('actives_title2')}</span></h2>
          </div>
          <div className="hidden h-px w-48 bg-ivory/10 md:block"><motion.div style={{ scaleX: scrollYProgress }} className="h-full origin-left bg-gold" /></div>
        </div>
        <motion.div style={{ x }} className="flex w-[400%] gap-6 px-5 sm:px-8 lg:px-14">
          {ACTIVES.map((a, i) => (
            <div key={i} className={`relative flex h-[62vh] w-1/4 overflow-hidden rounded-[40px] bg-gradient-to-br ${a.bg} border border-ivory/10`}>
              <div className="relative z-10 flex w-full flex-col justify-between p-8 sm:p-12 md:w-[58%]">
                <div className="flex items-center gap-4">
                  <span className="grid h-14 w-14 place-items-center rounded-full border" style={{ borderColor: a.color, color: a.color }}><a.icon size={22} strokeWidth={1.4} /></span>
                  <span className="eyebrow text-ivory/50">0{i + 1} / 04</span>
                </div>
                <div>
                  <p className="font-display text-[clamp(80px,12vw,200px)] leading-none" style={{ color: a.color }}>{a.n}</p>
                  <h3 className="mt-2 font-display text-4xl italic">{lang === 'ar' ? a.ar : a.name}</h3>
                  <p className="mt-4 max-w-md text-sm leading-relaxed text-ivory/65 sm:text-base">{lang === 'ar' ? a.tar : a.fr}</p>
                </div>
              </div>
              <div className="absolute inset-y-0 right-0 hidden w-[45%] items-center justify-center md:flex rtl:left-0 rtl:right-auto">
                <div className="absolute h-2/3 w-2/3 rounded-full blur-[90px]" style={{ background: a.color, opacity: 0.35 }} />
                <img src={a.img} alt="" loading="lazy" className={`relative max-h-[78%] w-auto ${/stage|empty/.test(a.img) ? 'h-full w-full object-cover opacity-70 rounded-l-[40px] max-h-full' : 'object-contain drop-shadow-2xl'}`} />
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ RESULTS: counters + before/after */
function BeforeAfter() {
  const { t } = useI18n();
  const [pos, setPos] = useState(50);
  const ref = useRef(null);
  const set = (clientX) => { const r = ref.current.getBoundingClientRect(); setPos(Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100))); };
  return (
    <div ref={ref} dir="ltr" className="relative aspect-[4/5] w-full cursor-ew-resize select-none overflow-hidden rounded-[36px] shadow-2xl touch-pan-y"
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); set(e.clientX); }}
      onPointerMove={(e) => e.buttons && set(e.clientX)} data-cursor>
      <img src="/brand/after.webp" alt={t('after')} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <img src="/brand/before.webp" alt={t('before')} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      </div>
      <span className="absolute left-5 top-5 rounded-full bg-noir/60 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-ivory backdrop-blur">{t('before')}</span>
      <span className="absolute right-5 top-5 rounded-full bg-gold px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-noir">{t('after')}</span>
      <div className="absolute inset-y-0" style={{ left: `${pos}%` }}>
        <div className="absolute inset-y-0 -ml-px w-0.5 bg-ivory shadow-[0_0_20px_rgba(0,0,0,.5)]" />
        <div className="absolute top-1/2 -ml-7 -mt-7 grid h-14 w-14 place-items-center rounded-full border border-ivory/60 bg-noir/40 text-ivory backdrop-blur-md">
          <span className="text-lg">‹ ›</span>
        </div>
      </div>
    </div>
  );
}
function Results() {
  const { t } = useI18n();
  const stats = [[94, '+', t('stat1')], [89, '+', t('stat2')], [48, '−', t('stat3')]];
  return (
    <section className="container-q py-28 lg:py-40">
      <div className="grid items-center gap-16 lg:grid-cols-2">
        <div>
          <Reveal><p className="eyebrow mb-5 text-gold-deep">{t('results_eyebrow')}</p></Reveal>
          <h2 className="h-display text-[clamp(44px,6vw,96px)]"><SplitReveal text={t('results_title')} /> <span className="italic text-gold-deep"><SplitReveal text={t('results_title2')} delay={0.15} /></span></h2>
          <Reveal delay={0.2}><p className="mt-6 max-w-md leading-relaxed text-ink/80">{t('results_sub')}</p></Reveal>
          <div className="mt-14 grid grid-cols-3 gap-6 border-t border-noir/10 pt-10">
            {stats.map(([n, s, l], i) => (
              <Reveal key={i} delay={i * 0.1}>
                <p className="font-display text-[clamp(40px,5vw,72px)] leading-none"><Counter to={n} prefix={s} suffix="%" /></p>
                <p className="mt-3 text-xs leading-snug text-mute sm:text-sm">{l}</p>
              </Reveal>
            ))}
          </div>
          <p className="mt-6 text-[11px] text-mute/80">* Auto-évaluation, 4 semaines d’utilisation quotidienne du protocole Duo Royal.</p>
        </div>
        <Reveal delay={0.1}><BeforeAfter /></Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ RITUAL day / night */
function Ritual() {
  const { t, lang } = useI18n();
  const [night, setNight] = useState(false);
  const steps = {
    day: lang === 'ar'
      ? [['التنظيف', 'نظفي وجهك بلطف بالماء الفاتر.'], ['سيروم فيتامين C', 'ضعي 4 إلى 5 قطرات على الوجه والرقبة.'], ['التدليك', 'دلّكي بحركات خفيفة نحو الأعلى.'], ['الحماية', 'اختمي بواقي شمس SPF 50.']]
      : [['Nettoyer', 'Nettoyer délicatement le visage à l’eau tiède.'], ['Sérum Vitamine C', 'Appliquer 4 à 5 gouttes sur le visage et le cou.'], ['Masser', 'Faire pénétrer par légers tapotements stimulants.'], ['Protéger', 'Terminer par un écran solaire SPF 50.']],
    night: lang === 'ar'
      ? [['إزالة المكياج', 'نظفي البشرة بعمق من شوائب اليوم.'], ['سيروم الهيالورونيك', '3 إلى 4 قطرات على بشرة رطبة قليلاً.'], ['الضغط', 'ضغطات لطيفة على الوجه والرقبة والصدر.'], ['الراحة', 'اتركيه يعمل طوال الليل لبشرة ممتلئة.']]
      : [['Démaquiller', 'Purifier l’épiderme des particules de la journée.'], ['Sérum Hyaluronique', '3 à 4 gouttes sur peau légèrement humide.'], ['Sceller', 'Pressions délicates : visage, cou, décolleté.'], ['Régénérer', 'Laisser agir toute la nuit pour un réveil repulpé.']],
  };
  const list = night ? steps.night : steps.day;
  const bg = night ? '#0E1726' : '#FBEBD6';
  const fg = night ? '#E6EEF8' : '#2A1606';
  const accent = night ? '#8CC6EE' : '#E8781E';
  return (
    <motion.section id="rituel" animate={{ backgroundColor: bg, color: fg }} transition={{ duration: 1.2, ease }} className="relative overflow-hidden py-28 lg:py-40">
      <motion.div animate={{ background: night ? 'radial-gradient(circle, rgba(140,198,238,.25), transparent 60%)' : 'radial-gradient(circle, rgba(246,178,107,.55), transparent 60%)' }}
        className="absolute -right-40 -top-40 h-[700px] w-[700px] rounded-full" />
      <div className="container-q relative grid gap-16 lg:grid-cols-2">
        <div>
          <p className="eyebrow mb-5" style={{ color: accent }}>{t('ritual_eyebrow')}</p>
          <h2 className="h-display text-[clamp(44px,6vw,96px)]">{t('ritual_title')}<br /><span className="italic">{t('ritual_title2')}</span></h2>
          <div className="mt-10 inline-flex rounded-full p-1.5" style={{ background: night ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)' }}>
            {[[false, Sun, t('day')], [true, Moon, t('night')]].map(([v, I, l]) => (
              <button key={l} onClick={() => setNight(v)} className="relative flex items-center gap-2 rounded-full px-7 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                {night === v && <motion.span layoutId="ritual-pill" className="absolute inset-0 rounded-full" style={{ background: accent }} transition={{ duration: 0.6, ease }} />}
                <span className="relative flex items-center gap-2" style={{ color: night === v ? (night ? '#0E1726' : '#fff') : undefined }}><I size={15} />{l}</span>
              </button>
            ))}
          </div>
          <div className="relative mt-12 hidden aspect-square max-w-md lg:block">
            <AnimatePresence mode="wait">
              <motion.img key={night ? 'n' : 'd'} src={night ? '/brand/v2/hyal-cut.webp' : '/brand/v2/vitc-cut.webp'} alt=""
                initial={{ opacity: 0, y: 60, rotate: -8 }} animate={{ opacity: 1, y: 0, rotate: 0 }} exit={{ opacity: 0, y: -40, rotate: 8 }} transition={{ duration: 0.9, ease }}
                className="absolute inset-0 m-auto h-[85%] w-auto object-contain drop-shadow-[0_40px_40px_rgba(0,0,0,.25)]" />
            </AnimatePresence>
          </div>
        </div>
        <ol className="space-y-4 self-center">
          <AnimatePresence mode="wait">
            <motion.div key={night ? 'n' : 'd'} initial="h" animate="s" exit="h" variants={{ s: { transition: { staggerChildren: 0.08 } } }} className="space-y-4">
              {list.map(([title, desc], i) => (
                <motion.li key={title} variants={{ h: { opacity: 0, x: 40 }, s: { opacity: 1, x: 0, transition: { duration: 0.8, ease } } }}
                  className="flex gap-6 rounded-[28px] p-6 sm:p-8" style={{ background: night ? 'rgba(255,255,255,.05)' : 'rgba(255,255,255,.55)', border: `1px solid ${night ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.05)'}` }}>
                  <span className="font-display text-5xl italic leading-none" style={{ color: accent }}>0{i + 1}</span>
                  <div><h4 className="font-display text-2xl">{title}</h4><p className="mt-1.5 text-sm opacity-70">{desc}</p></div>
                </motion.li>
              ))}
            </motion.div>
          </AnimatePresence>
        </ol>
      </div>
    </motion.section>
  );
}

/* ------------------------------------------------------------------ DUO ROYAL spotlight */
function DuoSpotlight() {
  const { t, lang, L } = useI18n();
  const { data } = useApi('/products/le-duo-royal-coffret-serums');
  const add = useCart((s) => s.add);
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['-6%', '6%']);
  const p = data?.product;
  return (
    <section ref={ref} className="relative overflow-hidden bg-noir text-ivory">
      <div className="absolute -left-40 top-1/3 h-[520px] w-[520px] rounded-full bg-gold/10 blur-[140px]" />
      <div className="container-q relative grid min-h-[90vh] items-center gap-14 py-28 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <Reveal><p className="eyebrow mb-5 text-gold">{t('duo_eyebrow')}</p></Reveal>
          <h2 className="h-display text-[clamp(56px,8vw,140px)] italic"><SplitReveal text={t('duo_title')} inner="gold-text pr-[0.06em]" /></h2>
          <Reveal delay={0.2}><p className="mt-8 max-w-lg text-base leading-relaxed text-ivory/70">{t('duo_sub')}</p></Reveal>
          {p && (
            <Reveal delay={0.3} className="mt-10 flex flex-wrap items-center gap-6">
              <div>
                <p className="font-display text-5xl">{money(p.price, lang)}</p>
                {p.compare_price > p.price && <p className="mt-1 text-sm text-ivory/50"><span className="line-through">{money(p.compare_price, lang)}</span> · <span className="text-gold">{t('duo_save')} {money(p.compare_price - p.price, lang)}</span></p>}
              </div>
              <Magnetic><button onClick={() => add(p)} disabled={!p.in_stock} className="btn btn-gold h-14 px-10"><span className="btn-shine" />{p.in_stock ? t('add_to_cart') : t('out_of_stock')}</button></Magnetic>
              <Link to={`/produit/${p.slug}`} className="link-u text-sm uppercase tracking-[0.18em] text-ivory/80">{lang === 'ar' ? 'التفاصيل' : 'Découvrir'}</Link>
            </Reveal>
          )}
        </div>
        <Reveal delay={0.15} className="relative lg:col-span-6">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[40px] shadow-[0_60px_120px_-30px_rgba(201,166,107,.35)] ring-1 ring-gold/20">
            <motion.img style={{ y }} src="/brand/v2/duo-stage.webp" alt={L(p || {}, 'name') || 'Le Duo Royal'} loading="lazy" className="absolute inset-0 h-[120%] w-full -translate-y-[8%] object-cover" />
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-noir/30 to-transparent" />
          </div>
          <div className="absolute -bottom-8 -left-8 hidden sm:block rtl:-right-8 rtl:left-auto"><Seal className="h-32 w-32" /></div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ TESTIMONIALS */
const REVIEWS = [
  { n: 'Yasmine K.', w: 'Alger', p: 'Le Duo Royal', fr: "J’utilise Le Duo Royal depuis 3 semaines. Mes ridules de déshydratation ont disparu et mes amies me demandent quel soin j’ai fait en institut ! Livraison rapide à domicile.", ar: 'أستعمل الثنائي الملكي منذ 3 أسابيع. اختفت خطوط الجفاف وصديقاتي يسألنني عن سر بشرتي! توصيل سريع للمنزل.' },
  { n: 'Selma M.', w: 'Oran', p: 'Sérum Acide Hyaluronique', fr: 'La texture de l’Acide Hyaluronique ne colle pas du tout, elle pénètre instantanément. La sensation de confort dure toute la journée. Un vrai produit de luxe.', ar: 'قوام حمض الهيالورونيك لا يلتصق أبداً ويمتص فوراً. الإحساس بالراحة يدوم طوال اليوم. منتج فاخر حقاً.' },
  { n: 'Laboratoires The Queen', w: 'R&D', p: 'Sérum Vitamine C', fr: 'La formulation du Sérum Vitamine C est remarquable. La stabilité de l’acide ascorbique est parfaitement maîtrisée, offrant une tolérance irréprochable et un éclat spectaculaire.', ar: 'تركيبة سيروم فيتامين C رائعة. ثبات حمض الأسكوربيك متقن تماماً مع تحمّل مثالي وإشراقة مذهلة.' },
];
function Testimonials() {
  const { t, lang } = useI18n();
  return (
    <section className="overflow-hidden py-28 lg:py-40">
      <div className="container-q mb-14 flex flex-wrap items-end justify-between gap-6">
        <div>
          <Reveal><p className="eyebrow mb-5 text-gold-deep">{t('reviews_eyebrow')}</p></Reveal>
          <h2 className="h-display text-[clamp(44px,6vw,96px)]"><SplitReveal text={t('reviews_title')} /></h2>
        </div>
        <Reveal className="flex items-center gap-4">
          <p className="font-display text-6xl">4.9</p>
          <div><div className="flex text-gold">{[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" strokeWidth={0} />)}</div><p className="mt-1 text-xs text-mute">98% {lang === 'ar' ? 'يوصين به' : 'recommandent'}</p></div>
        </Reveal>
      </div>
      <div className="no-scrollbar flex snap-x snap-mandatory gap-6 overflow-x-auto px-5 pb-6 sm:px-8 lg:px-14" data-lenis-prevent-wheel>
        {REVIEWS.map((r, i) => (
          <motion.figure key={i} initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 1, ease, delay: i * 0.1 }}
            className="card-lux flex w-[85vw] max-w-[440px] shrink-0 snap-start flex-col justify-between p-8 sm:p-10">
            <div>
              <Quote className="text-gold" size={30} strokeWidth={1.2} />
              <blockquote className="mt-5 font-display text-[21px] leading-snug italic text-ink">“{lang === 'ar' ? r.ar : r.fr}”</blockquote>
            </div>
            <figcaption className="mt-8 flex items-center justify-between border-t border-noir/5 pt-6">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-gold-light to-gold-deep font-display text-lg text-noir">{r.n[0]}</span>
                <div><p className="text-sm font-semibold">{r.n}</p><p className="text-xs text-mute">{r.w} · {r.p}</p></div>
              </div>
              <div className="flex text-gold">{[...Array(5)].map((_, j) => <Star key={j} size={12} fill="currentColor" strokeWidth={0} />)}</div>
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ PROMISES + NEWSLETTER */
function Promises() {
  const { t } = useI18n();
  const items = [[Truck, t('promise1'), t('promise1s')], [HandCoins, t('promise2'), t('promise2s')], [ShieldCheck, t('promise3'), t('promise3s')], [FlaskConical, t('promise4'), t('promise4s')]];
  return (
    <section className="border-y border-noir/5 bg-white">
      <div className="container-q grid grid-cols-2 lg:grid-cols-4">
        {items.map(([I, a, b], i) => (
          <Reveal key={i} delay={i * 0.08} className={`flex flex-col items-center gap-3 px-4 py-12 text-center ${i % 2 === 0 ? 'border-r border-noir/5 rtl:border-l rtl:border-r-0' : ''} ${i < 2 ? 'max-lg:border-b border-noir/5' : ''} lg:border-r lg:last:border-r-0 rtl:lg:border-l rtl:lg:border-r-0`}>
            <span className="grid h-14 w-14 place-items-center rounded-full bg-ivory-100 text-gold-deep"><I size={22} strokeWidth={1.3} /></span>
            <p className="font-display text-xl">{a}</p><p className="text-xs text-mute">{b}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
function Newsletter() {
  const { t } = useI18n();
  const [v, setV] = useState('');
  const [state, setState] = useState(null);
  const submit = async (e) => {
    e.preventDefault();
    try { await api('/newsletter', { method: 'POST', body: { contact: v } }); setState('ok'); setV(''); } catch (err) { setState(err.message); }
  };
  return (
    <section className="relative overflow-hidden bg-blush/40 py-28">
      <div className="container-q relative flex flex-col items-center text-center">
        <Seal className="mb-10 h-28 w-28" />
        <h2 className="h-display text-[clamp(40px,6vw,88px)] italic"><SplitReveal text={t('news_title')} /></h2>
        <p className="mt-4 max-w-md text-ink/80">{t('news_sub')}</p>
        <form onSubmit={submit} className="mt-10 flex w-full max-w-lg flex-col gap-3 sm:flex-row">
          <input value={v} onChange={(e) => setV(e.target.value)} required placeholder={t('news_ph')} className="field h-14 flex-1 rounded-full px-6" />
          <button className="btn btn-noir h-14 px-8"><span className="btn-shine" />{t('news_cta')}</button>
        </form>
        <AnimatePresence>{state && <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-4 text-sm font-medium text-gold-deep">{state === 'ok' ? t('news_ok') : state}</motion.p>}</AnimatePresence>
      </div>
    </section>
  );
}

export default function Home() {
  const { t } = useI18n();
  return (
    <>
      <Hero />
      <div className="bg-gold-light py-5 text-noir font-display text-2xl italic sm:text-3xl"><Marquee items={t('marquee')} speed={50} /></div>
      <Icons />
      <Manifesto />
      <Actives />
      <Results />
      <Ritual />
      <DuoSpotlight />
      <Testimonials />
      <Promises />
      <Newsletter />
    </>
  );
}
