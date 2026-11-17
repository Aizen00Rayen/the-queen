import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Home as HomeIcon, Building2, Lock, Tag, Check, ShieldCheck, Minus, Plus, Loader2 } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { useApi, useSettings } from '../lib/hooks';
import { api } from '../lib/api';
import { useCart, cartTotal } from '../lib/store';
import { money, theme } from '../lib/format';
import { Reveal, ease } from '../components/motion';
import { Monogram } from '../components/Brand';

export default function Checkout() {
  const { t, lang, L } = useI18n();
  const navigate = useNavigate();
  const { items, setQty, clear } = useCart();
  const { data: wilayas } = useApi('/wilayas');
  const settings = useSettings();
  const [f, setF] = useState({ customer_name: '', phone: '', phone2: '', wilaya_code: '', commune: '', address: '', note: '', delivery_type: 'home', website: '' });
  const [coupon, setCoupon] = useState({ code: '', applied: null, error: '' });
  const [err, setErr] = useState({ msg: '', field: '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const subtotal = cartTotal(items);
  const w = wilayas?.find((x) => x.code === f.wilaya_code);
  const discount = coupon.applied ? (coupon.applied.type === 'percent' ? Math.round((subtotal * coupon.applied.value) / 100) : Math.min(coupon.applied.value, subtotal)) : 0;
  const free = parseInt(settings.free_shipping_threshold || '0', 10);
  const shipping = useMemo(() => {
    if (!w) return null;
    if (free > 0 && subtotal - discount >= free) return 0;
    return f.delivery_type === 'office' ? w.office_price : w.home_price;
  }, [w, f.delivery_type, free, subtotal, discount]);
  const total = subtotal - discount + (shipping || 0);

  const applyCoupon = async () => {
    if (!coupon.code) return;
    try { const r = await api('/coupons/validate', { method: 'POST', body: { code: coupon.code, subtotal } }); setCoupon({ ...coupon, applied: r, error: '' }); }
    catch (e) { setCoupon({ ...coupon, applied: null, error: e.message }); }
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr({ msg: '', field: '' });
    setBusy(true);
    try {
      const r = await api('/orders', { method: 'POST', body: { ...f, coupon_code: coupon.applied?.code, items: items.map((x) => ({ product_id: x.product_id, qty: x.qty })) } });
      clear();
      navigate(`/merci/${r.number}`, { state: { ...r, phone: f.phone } });
    } catch (e2) {
      setErr({ msg: e2.message, field: e2.field || '' });
      if (e2.field) document.querySelector(`[name="${e2.field}"]`)?.focus();
    } finally { setBusy(false); }
  };

  if (!items.length) return (
    <div className="container-q flex min-h-[70vh] flex-col items-center justify-center gap-6 text-center">
      <Monogram className="h-20 w-20" />
      <h1 className="font-display text-4xl italic">{t('cart_empty')}</h1>
      <Link to="/boutique" className="btn btn-noir">{t('cart_empty_cta')}</Link>
    </div>
  );

  const errCls = (k) => (err.field === k ? '!border-red-400 !ring-red-100' : '');
  return (
    <div className="bg-ivory-100/60 pb-28">
      <div className="container-q pt-10 lg:pt-16">
        <Reveal><h1 className="h-display text-[clamp(44px,6vw,92px)] italic">{t('co_title')}</h1></Reveal>
        <p className="mt-3 flex items-center gap-2 text-sm text-mute"><Lock size={14} /> {t('co_trust')}</p>
      </div>
      <form onSubmit={submit} className="container-q mt-10 grid gap-8 lg:grid-cols-12" noValidate>
        <div className="space-y-6 lg:col-span-7">
          <section className="card-lux p-6 sm:p-10">
            <h2 className="mb-6 flex items-center gap-3 font-display text-2xl"><span className="grid h-8 w-8 place-items-center rounded-full bg-noir text-sm text-ivory font-sans">1</span>{t('co_info')}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2"><span className="field-label">{t('name')} *</span><input name="customer_name" className={`field ${errCls('customer_name')}`} value={f.customer_name} onChange={set('customer_name')} autoComplete="name" required /></label>
              <label><span className="field-label">{t('phone')} *</span><input name="phone" className={`field ${errCls('phone')}`} value={f.phone} onChange={set('phone')} inputMode="tel" placeholder="05 / 06 / 07 XX XX XX XX" autoComplete="tel" dir="ltr" required /></label>
              <label><span className="field-label">{t('phone2')}</span><input name="phone2" className="field" value={f.phone2} onChange={set('phone2')} inputMode="tel" dir="ltr" /></label>
              <input type="text" name="website" value={f.website} onChange={set('website')} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden />
            </div>
          </section>
          <section className="card-lux p-6 sm:p-10">
            <h2 className="mb-6 flex items-center gap-3 font-display text-2xl"><span className="grid h-8 w-8 place-items-center rounded-full bg-noir text-sm text-ivory font-sans">2</span>{t('co_delivery')}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label><span className="field-label">{t('wilaya')} *</span>
                <select name="wilaya_code" className={`field ${errCls('wilaya_code')}`} value={f.wilaya_code} onChange={set('wilaya_code')} required>
                  <option value="">{t('choose_wilaya')}</option>
                  {(wilayas || []).map((x) => <option key={x.code} value={x.code}>{x.code} — {L(x, 'name')}</option>)}
                </select>
              </label>
              <label><span className="field-label">{t('commune')} *</span><input name="commune" className={`field ${errCls('commune')}`} value={f.commune} onChange={set('commune')} required /></label>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[['home', HomeIcon, t('home'), t('home_s'), w?.home_price], ['office', Building2, t('office'), t('office_s'), w?.office_price]].map(([k, I, a, b, price]) => (
                <button type="button" key={k} onClick={() => setF({ ...f, delivery_type: k })}
                  className={`relative flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all duration-300 rtl:text-right ${f.delivery_type === k ? 'border-noir bg-noir text-ivory' : 'border-noir/10 bg-white hover:border-noir/30'}`}>
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${f.delivery_type === k ? 'bg-gold text-noir' : 'bg-ivory-100'}`}><I size={18} /></span>
                  <span className="flex-1"><span className="block text-sm font-semibold">{a}</span><span className={`block text-xs ${f.delivery_type === k ? 'text-ivory/60' : 'text-mute'}`}>{b}</span></span>
                  <span className="text-sm font-semibold">{price != null ? (free > 0 && subtotal - discount >= free ? t('free') : money(price, lang)) : '—'}</span>
                </button>
              ))}
            </div>
            <AnimatePresence>
              {f.delivery_type === 'home' && (
                <motion.label initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-4 block overflow-hidden">
                  <span className="field-label">{t('address')} *</span><input name="address" className={`field ${errCls('address')}`} value={f.address} onChange={set('address')} autoComplete="street-address" />
                </motion.label>
              )}
            </AnimatePresence>
            <label className="mt-4 block"><span className="field-label">{t('note')}</span><textarea className="field" rows={2} value={f.note} onChange={set('note')} /></label>
          </section>
        </div>

        <aside className="lg:col-span-5">
          <div className="card-lux overflow-hidden lg:sticky lg:top-28">
            <div className="bg-noir px-6 py-5 text-ivory sm:px-8"><h2 className="font-display text-2xl italic">{t('co_summary')}</h2></div>
            <div className="p-6 sm:p-8">
              <ul className="space-y-4">
                {items.map((it) => (
                  <li key={it.product_id} className="flex items-center gap-4">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl" style={{ background: theme(it.theme).soft }}>
                      <img src={it.image} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-lg leading-tight">{L(it, 'name')}</p>
                      <div className="mt-1 flex items-center gap-2 text-xs">
                        <button type="button" onClick={() => setQty(it.product_id, it.qty - 1)} className="grid h-6 w-6 place-items-center rounded-full border border-noir/10"><Minus size={10} /></button>
                        <span className="w-4 text-center font-semibold">{it.qty}</span>
                        <button type="button" onClick={() => setQty(it.product_id, it.qty + 1)} className="grid h-6 w-6 place-items-center rounded-full border border-noir/10"><Plus size={10} /></button>
                      </div>
                    </div>
                    <span className="text-sm font-semibold">{money(it.price * it.qty, lang)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex gap-2">
                <div className="relative flex-1"><Tag size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-mute rtl:left-auto rtl:right-4" />
                  <input className="field h-12 pl-10 uppercase rtl:pl-4 rtl:pr-10" placeholder={t('coupon')} value={coupon.code} onChange={(e) => setCoupon({ ...coupon, code: e.target.value, error: '' })} /></div>
                <button type="button" onClick={applyCoupon} className="btn btn-ghost h-12 px-5">{t('apply')}</button>
              </div>
              {coupon.error && <p className="mt-2 text-xs text-red-600">{coupon.error}</p>}
              {coupon.applied && <p className="mt-2 flex items-center gap-1 text-xs text-emerald-700"><Check size={13} /> {coupon.applied.code} −{coupon.applied.type === 'percent' ? `${coupon.applied.value}%` : money(coupon.applied.value, lang)}</p>}
              <dl className="mt-6 space-y-3 border-t border-noir/10 pt-6 text-sm">
                <div className="flex justify-between"><dt className="text-ink/70">{t('subtotal')}</dt><dd>{money(subtotal, lang)}</dd></div>
                {discount > 0 && <div className="flex justify-between text-emerald-700"><dt>{t('discount')}</dt><dd>−{money(discount, lang)}</dd></div>}
                <div className="flex justify-between"><dt className="text-ink/70">{t('shipping')} {w ? `· ${L(w, 'name')}` : ''}</dt><dd>{shipping == null ? '—' : shipping === 0 ? t('free') : money(shipping, lang)}</dd></div>
                <div className="flex items-end justify-between border-t border-noir/10 pt-4"><dt className="font-semibold">{t('total')}</dt><dd className="font-display text-4xl">{money(total, lang)}</dd></div>
              </dl>
              <AnimatePresence>{err.msg && <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{err.msg}</motion.p>}</AnimatePresence>
              <button disabled={busy} className="btn btn-gold mt-6 h-16 w-full text-[13px]"><span className="btn-shine" />
                {busy ? <><Loader2 size={18} className="animate-spin" /> {t('placing')}</> : <>{t('place_order')} · {money(total, lang)}</>}
              </button>
              <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-mute"><ShieldCheck size={14} /> {t('cod')}</p>
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
}
