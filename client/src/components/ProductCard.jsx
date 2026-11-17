import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Star } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { useCart } from '../lib/store';
import { money, pct, theme } from '../lib/format';
import { ease } from './motion';

/** Bottle "cut-out" image for each product (transparent PNG → WebP) */
export const bottleFor = (p) => p.images?.find((i) => /bottle|-cut/.test(i)) || p.images?.[0];

export default function ProductCard({ p, index = 0, big = false }) {
  const { t, lang, L } = useI18n();
  const add = useCart((s) => s.add);
  const th = theme(p.theme);
  const off = pct(p.price, p.compare_price);
  return (
    <motion.article initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-5% 0px' }}
      transition={{ duration: 1.1, ease, delay: index * 0.12 }} className="group relative">
      <Link to={`/produit/${p.slug}`} className="block" data-cursor>
        <div className={`relative overflow-hidden rounded-[32px] ${big ? 'aspect-[4/5]' : 'aspect-[4/5]'}`} style={{ background: th.bg }}>
          {/* glow */}
          <div className="absolute left-1/2 top-[55%] h-2/3 w-2/3 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl transition-all duration-1000 ease-lux group-hover:scale-125" style={{ background: th.glow }} />
          {/* pedestal */}
          <div className="absolute bottom-[12%] left-1/2 h-[6%] w-[58%] -translate-x-1/2 rounded-[50%] bg-noir/15 blur-md transition-all duration-700 ease-lux group-hover:w-[48%] group-hover:bg-noir/10" />
          <img src={bottleFor(p)} alt={L(p, 'name')} loading="lazy"
            className="absolute inset-x-0 bottom-[14%] mx-auto h-[64%] w-auto object-contain drop-shadow-[0_30px_30px_rgba(0,0,0,.25)] transition-transform duration-[1.2s] ease-lux group-hover:-translate-y-5 group-hover:scale-[1.04] group-hover:rotate-[-2deg]" />
          {/* lifestyle shot slides in on hover */}
          {p.images?.[0] && p.images[0] !== bottleFor(p) && (
            <img src={p.images[0]} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-0 scale-110 transition-all duration-[1.1s] ease-lux group-hover:opacity-100 group-hover:scale-100" />
          )}
          <div className="absolute left-5 top-5 flex flex-wrap gap-2">
            {off > 0 && <span className="rounded-full bg-noir px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-ivory">−{off}%</span>}
            {p.sold_count > 200 && <span className="rounded-full bg-white/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-noir backdrop-blur">Bestseller</span>}
          </div>
          {!p.in_stock && <div className="absolute inset-0 grid place-items-center bg-white/50 backdrop-blur-[2px]"><span className="rounded-full bg-noir px-5 py-2 text-xs uppercase tracking-widest text-ivory">{t('out_of_stock')}</span></div>}
        </div>
      </Link>
      {p.in_stock && (
        <button onClick={() => add(p)} aria-label={t('add_to_cart')}
          className="absolute right-4 z-10 grid h-14 w-14 translate-y-3 place-items-center rounded-full bg-noir text-ivory opacity-0 shadow-xl transition-all duration-500 ease-lux hover:scale-110 hover:bg-gold hover:text-noir group-hover:translate-y-0 group-hover:opacity-100 max-lg:translate-y-0 max-lg:opacity-100 rtl:left-4 rtl:right-auto"
          style={{ bottom: '150px' }}>
          <Plus size={20} />
        </button>
      )}
      <div className="mt-5 flex items-start justify-between gap-4 px-1">
        <div>
          <p className="eyebrow mb-1.5" style={{ color: th.accent }}>{L(p, 'category_name') || th.label}</p>
          <Link to={`/produit/${p.slug}`}><h3 className="font-display text-[26px] leading-tight">{L(p, 'name')}</h3></Link>
          <p className="mt-1 text-sm text-mute">{L(p, 'subtitle')}</p>
          <div className="mt-2 flex items-center gap-1 text-gold">{[...Array(5)].map((_, i) => <Star key={i} size={12} fill="currentColor" strokeWidth={0} />)}<span className="ml-1 text-[11px] text-mute">4.9 · {p.sold_count} {t('reviews')}</span></div>
        </div>
        <div className="text-right rtl:text-left">
          <p className="font-display text-xl whitespace-nowrap">{money(p.price, lang)}</p>
          {off > 0 && <p className="text-xs text-mute line-through whitespace-nowrap">{money(p.compare_price, lang)}</p>}
        </div>
      </div>
    </motion.article>
  );
}
