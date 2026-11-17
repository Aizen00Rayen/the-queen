import { useEffect, useState } from 'react';
import { Navigate, NavLink, Route, Routes, useNavigate, useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, Package, Boxes, ShoppingCart, Truck, TicketPercent, Settings as Cog, LogOut, Menu, X, ExternalLink, Loader2 } from 'lucide-react';
import { adminApi, api, getToken, setToken } from '../lib/api';
import { Logo, Monogram } from '../components/Brand';
import { ToastProvider } from './ui';
import Dashboard from './Dashboard';
import Products from './Products';
import Stock from './Stock';
import Orders from './Orders';
import { Shipping, Coupons, Settings } from './Config';

function Login() {
  const navigate = useNavigate();
  const [f, setF] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try { const r = await api('/admin/auth/login', { method: 'POST', body: f }); setToken(r.token); navigate('/admin'); }
    catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-noir lg:block">
        <img src="/brand/v2/hero-duo.webp" alt="" className="absolute inset-0 h-full w-full object-cover object-[63%_50%] opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-noir via-transparent" />
        <div className="absolute bottom-12 left-12 text-ivory"><Logo variant="gold" className="h-10" /><p className="mt-4 font-display text-3xl italic">Espace d’administration</p></div>
      </div>
      <div className="flex items-center justify-center bg-[#F7F4EF] p-6">
        <form onSubmit={submit} className="w-full max-w-sm">
          <Monogram className="h-16 w-16" />
          <h1 className="mt-6 font-display text-4xl">Connexion</h1>
          <p className="mt-1 text-sm text-mute">Accès réservé à l’équipe The Queen.</p>
          <label className="mt-8 block"><span className="admin-label">E-mail</span><input type="email" className="admin-input h-12" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required autoFocus /></label>
          <label className="mt-4 block"><span className="admin-label">Mot de passe</span><input type="password" className="admin-input h-12" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required /></label>
          {err && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
          <button disabled={busy} className="admin-btn-primary mt-6 h-12 w-full">{busy && <Loader2 size={16} className="animate-spin" />}Se connecter</button>
          <Link to="/" className="mt-6 block text-center text-xs text-mute hover:text-noir">← Retour au site</Link>
        </form>
      </div>
    </div>
  );
}

const NAV = [
  ['/admin', LayoutDashboard, 'Tableau de bord', true],
  ['/admin/commandes', ShoppingCart, 'Commandes'],
  ['/admin/produits', Package, 'Produits'],
  ['/admin/stock', Boxes, 'Stock'],
  ['/admin/livraison', Truck, 'Livraison'],
  ['/admin/coupons', TicketPercent, 'Codes promo'],
  ['/admin/parametres', Cog, 'Paramètres'],
];

function Shell({ admin, children }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(0);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    const load = () => adminApi('/orders?status=pending&limit=1').then((r) => setPending(r.counts.pending)).catch(() => {});
    load(); const i = setInterval(load, 60000); return () => clearInterval(i);
  }, [pathname]);
  const logout = () => { setToken(null); navigate('/admin/login'); };
  const side = (
    <aside className="flex h-full w-64 flex-col bg-noir text-ivory">
      <div className="flex h-20 items-center justify-between px-6"><Logo variant="gold" className="h-7" /><button className="lg:hidden" onClick={() => setOpen(false)}><X size={20} /></button></div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV.map(([to, I, label, end]) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition ${isActive ? 'bg-gold text-noir' : 'text-ivory/70 hover:bg-ivory/5 hover:text-ivory'}`}>
            <I size={18} strokeWidth={1.7} /><span className="flex-1">{label}</span>
            {to === '/admin/commandes' && pending > 0 && <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">{pending}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-ivory/10 p-4">
        <a href="/" target="_blank" className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-ivory/60 hover:text-ivory"><ExternalLink size={14} /> Voir la boutique</a>
        <div className="mt-2 flex items-center justify-between rounded-xl bg-ivory/5 px-3 py-2.5">
          <div className="min-w-0"><p className="truncate text-sm font-semibold">{admin?.name}</p><p className="truncate text-[11px] text-ivory/50">{admin?.email}</p></div>
          <button onClick={logout} title="Déconnexion" className="rounded-lg p-2 text-ivory/60 hover:bg-ivory/10 hover:text-ivory"><LogOut size={16} /></button>
        </div>
      </div>
    </aside>
  );
  return (
    <div className="admin-root flex">
      <div className="no-print sticky top-0 hidden h-screen lg:block">{side}</div>
      {open && <div className="no-print fixed inset-0 z-40 flex lg:hidden"><div className="absolute inset-0 bg-noir/50" onClick={() => setOpen(false)} /><div className="relative">{side}</div></div>}
      <div className="min-w-0 flex-1">
        <header className="no-print sticky top-0 z-30 flex h-16 items-center justify-between border-b border-noir/5 bg-[#F7F4EF]/90 px-4 backdrop-blur lg:hidden">
          <button onClick={() => setOpen(true)}><Menu size={22} /></button><Logo className="h-6" /><span className="w-6" />
        </header>
        <main className="mx-auto max-w-[1400px] p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}

export default function Admin() {
  const { pathname } = useLocation();
  const [admin, setAdmin] = useState(null);
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    document.documentElement.dir = 'ltr'; document.documentElement.lang = 'fr';
    if (pathname === '/admin/login') { setChecking(false); return; }
    if (!getToken()) { setChecking(false); return; }
    adminApi('/auth/me').then((r) => setAdmin(r.admin)).catch(() => {}).finally(() => setChecking(false));
  }, [pathname]);

  if (pathname === '/admin/login') return <ToastProvider><Login /></ToastProvider>;
  if (checking) return <div className="grid min-h-screen place-items-center bg-[#F7F4EF]"><Loader2 className="animate-spin text-gold" /></div>;
  if (!admin) return <Navigate to="/admin/login" replace />;
  return (
    <ToastProvider>
      <Shell admin={admin}>
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="commandes" element={<Orders />} />
          <Route path="produits" element={<Products />} />
          <Route path="stock" element={<Stock />} />
          <Route path="livraison" element={<Shipping />} />
          <Route path="coupons" element={<Coupons />} />
          <Route path="parametres" element={<Settings />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </Shell>
    </ToastProvider>
  );
}
