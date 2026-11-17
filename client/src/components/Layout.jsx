import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ShoppingBag, Menu, X, Minus, Plus, Trash2, Instagram, Phone, Truck, ShieldCheck, ArrowRight, Facebook, MessageCircle } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { useCart, cartCount, cartTotal } from '../lib/store';
import { useSettings } from '../lib/hooks';
import { money, theme } from '../lib/format';
import { Logo, Monogram } from './Brand';
import { Marquee, ease } from './motion';
import { getLenis } from './Experience';

function Announcement() {
  const s = useSettings();
  const { lang, L } = useI18n();
  const text = L(s, 'announcement');
  if (!text) return null;
  return (
    <div className="relative z-50 bg-noir text-[11px] font-medium uppercase tracking-[0.2em] text-gold-light/90">
      <Marquee items={[text, lang === 'ar' ? 'سيرومات فاخرة · ذا كوين' : 'Sérums de luxe · The Queen']} className="py-2" speed={45} separator="♛" />
    </div>
  );
}

function Header() {
  const { t, lang, setLang } = useI18n();
  const { pathname } = useLocation();
  const items = useCart((s) => s.items);
  const setOpen = useCart((s) => s.setOpen);
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const dark = pathname === '/' && !scrolled; // transparent over the dark hero
  useEffect(() => {
    const f = () => setScrolled(scrollY > 40);
    f(); addEventListener('scroll', f, { passive: true });
    return () => removeEventListener('scroll', f);
  }, []);
  useEffect(() => { setMenu(false); }, [pathname]);
  useEffect(() => { const l = getLenis(); if (l) menu ? l.stop() : l.start(); }, [menu]);
  const count = cartCount(items);
  const links = [['/boutique', t('nav_shop')], ['/#rituel', t('nav_ritual')], ['/maison', t('nav_story')], ['/suivi', t('nav_track')], ['/faq', t('nav_faq')]];

  return (
    <>
      <header className={`sticky top-0 z-50 transition-all duration-700 ease-lux ${scrolled ? 'bg-ivory-50/80 backdrop-blur-xl shadow-[0_1px_0_rgba(0,0,0,.05)]' : pathname === '/' ? 'bg-transparent' : 'bg-ivory-50'}`}
        style={pathname === '/' ? { marginBottom: '-80px' } : undefined}>
        <div className={`container-q flex h-20 items-center justify-between ${dark ? 'text-ivory' : 'text-noir'}`}>
          <button className="lg:hidden -ml-2 p-2" onClick={() => setMenu(true)} aria-label="Menu"><Menu size={22} strokeWidth={1.5} /></button>
          <nav className="hidden lg:flex items-center gap-9 text-[12px] font-semibold uppercase tracking-[0.18em]">
            {links.slice(0, 3).map(([to, label]) => (
              <NavLink key={to} to={to} className="link-u opacity-90 hover:opacity-100">{label}</NavLink>
            ))}
          </nav>
          <Link to="/" className="absolute left-1/2 -translate-x-1/2" aria-label="The Queen">
            <Logo variant={dark ? 'ivory' : 'black'} className="h-6 sm:h-7" />
          </Link>
          <div className="flex items-center gap-2 sm:gap-5 text-[12px] font-semibold uppercase tracking-[0.18em]">
            {links.slice(3).map(([to, label]) => (
              <NavLink key={to} to={to} className="link-u hidden lg:inline opacity-90 hover:opacity-100">{label}</NavLink>
            ))}
            <button onClick={() => setLang(lang === 'fr' ? 'ar' : 'fr')} className="rounded-full border border-current/20 px-3 py-1.5 text-[11px] opacity-80 hover:opacity-100" style={{ borderColor: 'currentColor' }}>
              {lang === 'fr' ? 'عربي' : 'FR'}
            </button>
            <button onClick={() => setOpen(true)} className="relative p-2" aria-label={t('cart')} data-cursor>
              <ShoppingBag size={21} strokeWidth={1.5} />
              <AnimatePresence>
                {count > 0 && (
                  <motion.span key={count} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-gold px-1 text-[10px] font-bold tracking-normal text-noir">
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menu && (
          <motion.div className="fixed inset-0 z-[80] bg-noir text-ivory" initial={{ clipPath: 'circle(0% at 0% 0%)' }} animate={{ clipPath: 'circle(150% at 0% 0%)' }}
            exit={{ clipPath: 'circle(0% at 0% 0%)' }} transition={{ duration: 0.9, ease }}>
            <div className="container-q flex h-20 items-center justify-between">
              <Logo variant="gold" className="h-6" />
              <button onClick={() => setMenu(false)} className="p-2" aria-label="Fermer"><X size={24} strokeWidth={1.5} /></button>
            </div>
            <nav className="container-q mt-10 flex flex-col gap-2">
              {[['/', lang === 'ar' ? 'الرئيسية' : 'Accueil'], ...links, ['/contact', t('nav_contact')]].map(([to, label], i) => (
                <motion.div key={to} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + i * 0.06, duration: 0.8, ease }}>
                  <Link to={to} onClick={() => setMenu(false)} className="font-display text-[42px] leading-tight italic hover:text-gold transition-colors">{label}</Link>
                </motion.div>
              ))}
            </nav>
            <div className="absolute bottom-10 left-0 right-0 container-q flex items-center justify-between text-xs uppercase tracking-[0.2em] text-ivory/50">
              <span>58 wilayas · COD</span><Monogram className="h-12 w-12" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function CartDrawer() {
  const { t, lang, L } = useI18n();
  const { items, open, setOpen, setQty, remove } = useCart();
  const navigate = useNavigate();
  const settings = useSettings();
  const total = cartTotal(items);
  const free = parseInt(settings.free_shipping_threshold || '0', 10);
  useEffect(() => { const l = getLenis(); if (l) open ? l.stop() : l.start(); }, [open]);
  useEffect(() => { const f = (e) => e.key === 'Escape' && setOpen(false); addEventListener('keydown', f); return () => removeEventListener('keydown', f); }, [setOpen]);
  const rtl = lang === 'ar';
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90]">
          <motion.div className="absolute inset-0 bg-noir/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
          <motion.aside className={`absolute top-0 ${rtl ? 'left-0' : 'right-0'} flex h-full w-full max-w-[460px] flex-col bg-ivory-50 shadow-2xl`}
            initial={{ x: rtl ? '-100%' : '100%' }} animate={{ x: 0 }} exit={{ x: rtl ? '-100%' : '100%' }} transition={{ duration: 0.7, ease }} data-lenis-prevent>
            <div className="flex items-center justify-between border-b border-noir/5 px-6 py-5">
              <div className="flex items-baseline gap-3"><h3 className="font-display text-2xl italic">{t('cart')}</h3><span className="text-xs text-mute">({cartCount(items)})</span></div>
              <button onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-noir/5" aria-label="Fermer"><X size={20} strokeWidth={1.5} /></button>
            </div>
            {free > 0 && items.length > 0 && (
              <div className="px-6 pt-4">
                <p className="text-xs text-ink">{total >= free ? (rtl ? 'التوصيل مجاني ✦' : 'Livraison offerte ✦') : (rtl ? `أضيفي ${money(free - total, lang)} للتوصيل المجاني` : `Plus que ${money(free - total)} pour la livraison offerte`)}</p>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-noir/5"><motion.div className="h-full bg-gradient-to-r from-gold-deep to-gold-light" animate={{ width: `${Math.min(100, (total / free) * 100)}%` }} /></div>
              </div>
            )}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {!items.length ? (
                <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
                  <Monogram className="h-20 w-20 opacity-70" />
                  <p className="font-display text-2xl italic text-ink">{t('cart_empty')}</p>
                  <button className="btn btn-noir" onClick={() => { setOpen(false); navigate('/boutique'); }}>{t('cart_empty_cta')}</button>
                </div>
              ) : (
                <ul className="space-y-4">
                  <AnimatePresence initial={false}>
                    {items.map((it) => (
                      <motion.li key={it.product_id} layout initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30, height: 0 }} className="flex gap-4 rounded-3xl bg-white p-3">
                        <Link to={`/produit/${it.slug}`} onClick={() => setOpen(false)} className="h-24 w-20 shrink-0 overflow-hidden rounded-2xl" style={{ background: theme(it.theme).soft }}>
                          <img src={it.image} alt="" className="h-full w-full object-cover" />
                        </Link>
                        <div className="flex flex-1 flex-col justify-between py-1">
                          <div className="flex justify-between gap-2">
                            <div>
                              <p className="font-display text-[17px] leading-tight">{L(it, 'name')}</p>
                              <p className="text-[11px] uppercase tracking-wider text-mute">{it.volume}</p>
                            </div>
                            <button onClick={() => remove(it.product_id)} className="h-8 w-8 shrink-0 grid place-items-center rounded-full text-mute hover:bg-noir/5 hover:text-noir" aria-label="Retirer"><Trash2 size={15} /></button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center rounded-full border border-noir/10">
                              <button className="grid h-8 w-8 place-items-center" onClick={() => setQty(it.product_id, it.qty - 1)} aria-label="-"><Minus size={13} /></button>
                              <span className="w-6 text-center text-sm font-semibold">{it.qty}</span>
                              <button className="grid h-8 w-8 place-items-center" onClick={() => setQty(it.product_id, it.qty + 1)} aria-label="+"><Plus size={13} /></button>
                            </div>
                            <span className="text-sm font-semibold">{money(it.price * it.qty, lang)}</span>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>
            {items.length > 0 && (
              <div className="border-t border-noir/5 bg-white px-6 pb-6 pt-5">
                <div className="flex items-center justify-between"><span className="text-sm text-ink">{t('subtotal')}</span><span className="font-display text-2xl">{money(total, lang)}</span></div>
                <p className="mt-1 text-xs text-mute">{t('shipping_note')}</p>
                <button className="btn btn-gold mt-5 w-full h-14" onClick={() => { setOpen(false); navigate('/commande'); }}>
                  <span className="btn-shine" />{t('checkout')} <ArrowRight size={16} className="rtl:rotate-180" />
                </button>
                <div className="mt-4 flex items-center justify-center gap-5 text-[11px] text-mute">
                  <span className="flex items-center gap-1.5"><Truck size={14} /> 58 wilayas</span>
                  <span className="flex items-center gap-1.5"><ShieldCheck size={14} /> {t('cod')}</span>
                </div>
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

function Footer() {
  const { t, lang } = useI18n();
  const s = useSettings();
  const socials = [
    s.instagram && { href: s.instagram.startsWith('http') ? s.instagram : `https://instagram.com/${s.instagram.replace('@', '')}`, icon: Instagram, label: 'Instagram' },
    s.facebook && { href: s.facebook, icon: Facebook, label: 'Facebook' },
    s.whatsapp && { href: `https://wa.me/${s.whatsapp.replace(/\D/g, '').replace(/^0/, '213')}`, icon: MessageCircle, label: 'WhatsApp' },
    s.phone && { href: `tel:${s.phone}`, icon: Phone, label: s.phone },
  ].filter(Boolean);
  return (
    <footer className="relative overflow-hidden bg-noir text-ivory">
      <div className="container-q grid gap-12 pb-10 pt-24 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Logo variant="gold" className="h-9" />
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-ivory/60">{t('footer_tag')}</p>
          {socials.length > 0 && (
            <div className="mt-8 flex gap-3">
              {socials.map(({ href, icon: I, label }) => (
                <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} className="grid h-11 w-11 place-items-center rounded-full border border-ivory/15 text-ivory/80 transition hover:border-gold hover:bg-gold hover:text-noir"><I size={17} strokeWidth={1.5} /></a>
              ))}
            </div>
          )}
        </div>
        {[
          [lang === 'ar' ? 'المتجر' : 'Boutique', [['/boutique', t('nav_shop')], ['/produit/le-duo-royal-coffret-serums', t('duo_title')], ['/produit/serum-vitamine-c', 'Vitamine C'], ['/produit/serum-acide-hyaluronique', lang === 'ar' ? 'حمض الهيالورونيك' : 'Acide Hyaluronique']]],
          [lang === 'ar' ? 'الدار' : 'La Maison', [['/maison', t('nav_story')], ['/#rituel', t('nav_ritual')], ['/faq', t('nav_faq')], ['/contact', t('nav_contact')]]],
          [lang === 'ar' ? 'الخدمات' : 'Services', [['/suivi', t('nav_track')], ['/faq', t('delivery')], ['/faq', t('cod')]]],
        ].map(([title, ls]) => (
          <div key={title} className="lg:col-span-2">
            <p className="eyebrow text-gold">{title}</p>
            <ul className="mt-5 space-y-3 text-sm text-ivory/70">{ls.map(([to, l]) => <li key={l}><Link to={to} className="link-u hover:text-ivory">{l}</Link></li>)}</ul>
          </div>
        ))}
      </div>
      <div className="pointer-events-none select-none px-4 text-center font-display italic leading-none text-ivory/[0.04]" style={{ fontSize: 'clamp(80px, 20vw, 340px)' }} dir="ltr">The Queen</div>
      <div className="container-q flex flex-col items-center justify-between gap-3 border-t border-ivory/10 py-6 text-[11px] uppercase tracking-[0.18em] text-ivory/40 sm:flex-row">
        <span>© {new Date().getFullYear()} The Queen — Haute Dermatologie</span>
        <span>{lang === 'ar' ? 'صُنع بعناية في الجزائر' : 'Façonné avec soin en Algérie'} ♛</span>
      </div>
    </footer>
  );
}

export default function Layout() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const t = setTimeout(() => { const el = document.querySelector(hash); const l = getLenis(); if (el) (l ? l.scrollTo(el, { offset: -60 }) : el.scrollIntoView()); }, 300);
    return () => clearTimeout(t);
  }, [hash, pathname]);
  return (
    <div className="grain min-h-screen">
      <Announcement />
      <Header />
      <motion.main key={pathname} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease }}>
        <Outlet />
      </motion.main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
