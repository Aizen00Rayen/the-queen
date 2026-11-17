import { useState } from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '../lib/i18n';
import { useApi } from '../lib/hooks';
import ProductCard from '../components/ProductCard';
import { SplitReveal, Reveal, ease } from '../components/motion';

export default function Shop() {
  const { t, L } = useI18n();
  const [cat, setCat] = useState('');
  const [sort, setSort] = useState('featured');
  const { data: cats } = useApi('/categories');
  const { data: products, loading } = useApi(`/products?sort=${sort}${cat ? `&category=${cat}` : ''}`);
  return (
    <div className="pb-32">
      <section className="relative overflow-hidden bg-ivory-100 pb-16 pt-20 lg:pt-28">
        <div className="absolute -right-20 top-0 h-[420px] w-[420px] rounded-full bg-gold/20 blur-[120px]" />
        <div className="container-q relative">
          <Reveal><p className="eyebrow mb-5 text-gold-deep">The Queen · {products?.length ?? '–'} {L({ x: 'produits', x_ar: 'منتجات' }, 'x')}</p></Reveal>
          <h1 className="h-display text-[clamp(56px,9vw,150px)] italic"><SplitReveal text={t('shop_title')} immediate /></h1>
          <Reveal delay={0.2}><p className="mt-4 max-w-md text-ink/80">{t('shop_sub')}</p></Reveal>
        </div>
      </section>
      <div className="sticky top-20 z-30 border-b border-noir/5 bg-ivory-50/85 backdrop-blur-xl">
        <div className="container-q flex items-center justify-between gap-4 py-4">
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {[{ slug: '', name: t('all'), name_ar: t('all') }, ...(cats || [])].map((c) => (
              <button key={c.slug} onClick={() => setCat(c.slug)} className="relative shrink-0 rounded-full px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.14em]">
                {cat === c.slug && <motion.span layoutId="cat-pill" className="absolute inset-0 rounded-full bg-noir" transition={{ duration: 0.5, ease }} />}
                <span className={`relative ${cat === c.slug ? 'text-ivory' : 'text-ink'}`}>{L(c, 'name')}</span>
              </button>
            ))}
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="hidden h-10 rounded-full border border-noir/10 bg-white px-4 text-xs font-semibold uppercase tracking-wider outline-none sm:block">
            <option value="featured">{t('sort_featured')}</option>
            <option value="bestsellers">{t('sort_best')}</option>
            <option value="price_asc">{t('sort_low')}</option>
            <option value="price_desc">{t('sort_high')}</option>
          </select>
        </div>
      </div>
      <div className="container-q mt-14 grid gap-x-8 gap-y-16 md:grid-cols-2 lg:grid-cols-3">
        {loading && !products ? [...Array(3)].map((_, i) => <div key={i} className="aspect-[4/5] animate-pulse rounded-[32px] bg-ivory-200" />)
          : (products || []).map((p, i) => <ProductCard key={p.id} p={p} index={i} />)}
      </div>
    </div>
  );
}
