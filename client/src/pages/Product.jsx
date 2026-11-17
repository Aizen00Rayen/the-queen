import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Minus, Plus, Check, ChevronDown, Truck, HandCoins, ShieldCheck, Star, ArrowLeft } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { useApi } from '../lib/hooks';
import { useCart } from '../lib/store';
import { money, pct, theme } from '../lib/format';
import ProductCard from '../components/ProductCard';
import { Reveal, SplitReveal, Magnetic, ease } from '../components/motion';
import NotFound from './NotFound';

function Accordion({ title, children, open: initial = false }) {
  const [open, setOpen] = useState(initial);
  return (
    <div className="border-b border-noir/10">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between py-5 text-left rtl:text-right">
        <span className="text-[13px] font-semibold uppercase tracking-[0.16em]">{title}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }}><ChevronDown size={18} /></motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.5, ease }} className="overflow-hidden">
            <div className="pb-6 text-[15px] leading-relaxed text-ink/80">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Product() {
  const { slug } = useParams();
  const { t, lang, L } = useI18n();
  const navigate = useNavigate();
  const { data, loading, error } = useApi(`/products/${slug}`);
  const add = useCart((s) => s.add);
  const [img, setImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [zoom, setZoom] = useState(null);
  useEffect(() => { setImg(0); setQty(1); }, [slug]);

  if (error?.status === 404) return <NotFound />;
  const p = data?.product;
  if (loading || !p) return <div className="container-q grid min-h-[80vh] place-items-center"><div className="h-12 w-12 animate-spin rounded-full border-2 border-gold border-t-transparent" /></div>;

  const th = theme(p.theme);
  const off = pct(p.price, p.compare_price);
  const onAdd = () => { add(p, qty); setAdded(true); setTimeout(() => setAdded(false), 1800); };
  const buyNow = () => { add(p, qty); useCart.getState().setOpen(false); navigate('/commande'); };

  return (
    <div style={{ '--accent': th.accent }}>
      <section className="relative">
        <div className="absolute inset-x-0 top-0 h-[70vh] opacity-60" style={{ background: `linear-gradient(180deg, ${th.soft}, transparent)` }} />
        <div className="container-q relative grid gap-10 pb-24 pt-8 lg:grid-cols-12 lg:gap-16">
          <Link to="/boutique" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-mute hover:text-noir lg:col-span-12">
            <ArrowLeft size={14} className="rtl:rotate-180" /> {t('nav_shop')}
          </Link>
          {/* GALLERY */}
          <div className="lg:col-span-7">
            <div className="lg:sticky lg:top-28">
              <div className="relative aspect-square overflow-hidden rounded-[36px] sm:aspect-[5/5]" style={{ background: th.bg }}
                onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }); }}
                onMouseLeave={() => setZoom(null)} data-cursor>
                <div className="absolute left-1/2 top-1/2 h-2/3 w-2/3 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px]" style={{ background: th.glow }} />
                <AnimatePresence mode="wait">
                  <motion.img key={img} src={p.images[img]} alt={L(p, 'name')}
                    initial={{ opacity: 0, scale: 1.08 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.8, ease }}
                    className={`absolute inset-0 h-full w-full ${/bottle|-cut/.test(p.images[img]) ? 'object-contain p-[8%] drop-shadow-[0_40px_40px_rgba(0,0,0,.25)]' : 'object-cover'}`}
                    style={zoom ? { transformOrigin: `${zoom.x}% ${zoom.y}%`, transform: 'scale(1.6)', transition: 'transform .3s' } : undefined} />
                </AnimatePresence>
                {off > 0 && <span className="absolute left-6 top-6 rounded-full bg-noir px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-ivory">−{off}%</span>}
              </div>
              <div className="no-scrollbar mt-4 flex gap-3 overflow-x-auto p-1">
                {p.images.map((src, i) => (
                  <button key={i} onClick={() => setImg(i)} className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl transition-all duration-500 sm:h-24 sm:w-24 ${img === i ? 'ring-2 ring-offset-2' : 'opacity-60 hover:opacity-100'}`} style={{ background: th.soft, '--tw-ring-color': th.accent }}>
                    <img src={src} alt="" className={`h-full w-full ${/bottle|-cut/.test(src) ? 'object-contain p-2' : 'object-cover'}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>
          {/* INFO */}
          <div className="lg:col-span-5">
            <Reveal><p className="eyebrow mb-4" style={{ color: th.accent }}>{L(p, 'category_name')}</p></Reveal>
            <h1 className="h-display text-[clamp(38px,5vw,76px)] [overflow-wrap:anywhere]"><SplitReveal text={L(p, 'name')} immediate /></h1>
            <Reveal delay={0.15}>
              <p className="mt-3 font-display text-xl italic text-ink/80">{L(p, 'subtitle')}</p>
              <div className="mt-4 flex items-center gap-2"><div className="flex text-gold">{[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" strokeWidth={0} />)}</div><span className="text-xs text-mute">4.9 · {p.sold_count} {t('reviews')}</span></div>
              <div className="mt-8 flex items-end gap-4">
                <span className="font-display text-5xl">{money(p.price, lang)}</span>
                {off > 0 && <span className="pb-1.5 text-lg text-mute line-through">{money(p.compare_price, lang)}</span>}
                {off > 0 && <span className="mb-2 rounded-full px-3 py-1 text-[11px] font-bold" style={{ background: th.soft, color: th.deep }}>{t('save')} {money(p.compare_price - p.price, lang)}</span>}
              </div>
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-mute">{p.volume} · {p.sku}</p>
              <p className="mt-8 text-[15px] leading-relaxed text-ink/85">{L(p, 'description')}</p>
              <div className="mt-8 flex flex-wrap gap-2">{p.tags.map((tg) => <span key={tg} className="rounded-full border px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider" style={{ borderColor: `${th.accent}55`, color: th.deep }}>{tg}</span>)}</div>

              <div className={`mt-8 flex items-center gap-2 text-sm font-medium ${p.in_stock ? 'text-emerald-700' : 'text-red-700'}`}>
                <span className="relative flex h-2.5 w-2.5"><span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${p.in_stock ? 'bg-emerald-500' : 'bg-red-500'}`} /><span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${p.in_stock ? 'bg-emerald-500' : 'bg-red-500'}`} /></span>
                {!p.in_stock ? t('out_of_stock') : p.low_stock ? t('low_stock') : t('in_stock')}
              </div>
              <div className="mt-6 flex gap-3">
                <div className="flex h-14 items-center rounded-full border border-noir/15 bg-white">
                  <button className="grid h-14 w-12 place-items-center" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="-"><Minus size={15} /></button>
                  <span className="w-8 text-center font-semibold">{qty}</span>
                  <button className="grid h-14 w-12 place-items-center" onClick={() => setQty(Math.min(20, qty + 1))} aria-label="+"><Plus size={15} /></button>
                </div>
                <button onClick={onAdd} disabled={!p.in_stock} className="btn btn-noir h-14 flex-1"><span className="btn-shine" />
                  <AnimatePresence mode="wait"><motion.span key={added ? 'a' : 'b'} initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }} className="flex items-center gap-2">
                    {added ? <><Check size={16} /> {t('added')}</> : t('add_to_cart')}
                  </motion.span></AnimatePresence>
                </button>
              </div>
              <Magnetic strength={0.15} className="mt-3 w-full"><button onClick={buyNow} disabled={!p.in_stock} className="btn btn-gold h-14 w-full"><span className="btn-shine" />{t('buy_now')} · {t('cod')}</button></Magnetic>
              <div className="mt-6 grid grid-cols-3 gap-2 text-center text-[11px] text-ink/70">
                {[[Truck, '58 wilayas'], [HandCoins, t('cod')], [ShieldCheck, lang === 'ar' ? 'أصلي 100%' : '100% authentique']].map(([I, l]) => (
                  <div key={l} className="flex flex-col items-center gap-2 rounded-2xl bg-white/70 px-2 py-4"><I size={18} strokeWidth={1.4} style={{ color: th.accent }} />{l}</div>
                ))}
              </div>
              <div className="mt-10 border-t border-noir/10">
                {p.benefits?.length > 0 && (
                  <Accordion title={t('benefits')} open>
                    <ul className="space-y-3">{p.benefits.map((b) => <li key={b} className="flex gap-3"><span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full" style={{ background: th.soft, color: th.deep }}><Check size={12} /></span>{b}</li>)}</ul>
                  </Accordion>
                )}
                {p.how_to && <Accordion title={t('how_to')}>{p.how_to}</Accordion>}
                {p.ingredients && <Accordion title={t('ingredients')}><p className="font-mono text-[13px]">{p.ingredients}</p></Accordion>}
                <Accordion title={t('delivery')}>{t('delivery_text')}</Accordion>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {data.related?.length > 0 && (
        <section className="bg-ivory-100 py-28">
          <div className="container-q">
            <h2 className="h-display mb-14 text-[clamp(40px,5vw,80px)] italic"><SplitReveal text={t('complete_ritual')} /></h2>
            <div className="grid gap-x-8 gap-y-16 md:grid-cols-2 lg:grid-cols-3">{data.related.slice(0, 3).map((r, i) => <ProductCard key={r.id} p={r} index={i} />)}</div>
          </div>
        </section>
      )}

      {/* sticky mobile buy bar */}
      {p.in_stock && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-noir/5 bg-ivory-50/90 p-3 backdrop-blur-xl lg:hidden" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1"><p className="truncate font-display text-lg leading-tight">{L(p, 'name')}</p><p className="text-sm font-semibold">{money(p.price, lang)}</p></div>
            <button onClick={buyNow} className="btn btn-gold h-12 px-6"><span className="btn-shine" />{t('buy_now')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
