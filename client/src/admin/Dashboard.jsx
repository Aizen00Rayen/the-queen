import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Wallet, ShoppingBag, Clock, TrendingUp, AlertTriangle, PackageCheck, ArrowRight, Boxes } from 'lucide-react';
import { adminApi } from '../lib/api';
import { money, dateFr } from '../lib/format';
import { PageHeader, Stat, StatusBadge, STATUS, STATUS_ORDER } from './ui';

export default function Dashboard() {
  const [days, setDays] = useState(30);
  const [d, setD] = useState(null);
  useEffect(() => { adminApi(`/stats?days=${days}`).then(setD).catch(() => {}); }, [days]);
  if (!d) return <div className="grid h-96 place-items-center"><div className="h-10 w-10 animate-spin rounded-full border-2 border-gold border-t-transparent" /></div>;
  const k = d.kpi;
  const totalStatus = Object.values(d.by_status).reduce((a, b) => a + b, 0) || 1;
  const deliveryRate = k.delivered + k.returned ? Math.round((k.delivered / (k.delivered + k.returned)) * 100) : 0;
  return (
    <div>
      <PageHeader title="Tableau de bord" subtitle={`Bonjour 👑 — voici l’activité de la boutique.`}>
        <div className="flex rounded-xl border border-noir/10 bg-white p-1">
          {[7, 30, 90].map((n) => <button key={n} onClick={() => setDays(n)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${days === n ? 'bg-noir text-ivory' : 'text-mute'}`}>{n} j</button>)}
        </div>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label={`CA ${days} jours`} value={money(k.revenue_period)} sub={`${k.orders_period} commandes (hors annulées)`} icon={TrendingUp} />
        <Stat label="CA encaissé (livré)" value={money(k.revenue_delivered)} sub={`En cours : ${money(k.revenue_pipeline)}`} icon={Wallet} accent="#047857" />
        <Stat label="À traiter" value={k.orders_pending} sub={`${k.orders_today} commande(s) aujourd’hui`} icon={Clock} accent="#B7791F" />
        <Stat label="Panier moyen" value={money(k.avg_basket)} sub={`Taux de livraison : ${deliveryRate}%`} icon={ShoppingBag} accent="#2A8FD8" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <div className="admin-card p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between"><h3 className="font-display text-xl">Chiffre d’affaires & commandes</h3></div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={d.chart} margin={{ left: -10, right: 10, top: 10 }}>
                <defs><linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#C9A66B" stopOpacity={0.45} /><stop offset="100%" stopColor="#C9A66B" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#0000000d" vertical={false} />
                <XAxis dataKey="date" tickFormatter={(v) => v.slice(5).split('-').reverse().join('/')} tick={{ fontSize: 11, fill: '#8A8076' }} axisLine={false} tickLine={false} minTickGap={20} />
                <YAxis tick={{ fontSize: 11, fill: '#8A8076' }} axisLine={false} tickLine={false} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,.1)', fontSize: 12 }} formatter={(v, n) => (n === 'revenue' ? [money(v), 'CA'] : [v, 'Commandes'])} labelFormatter={(l) => dateFr(l, false)} />
                <Area type="monotone" dataKey="revenue" stroke="#9C7A3F" strokeWidth={2} fill="url(#gRev)" />
                <Area type="monotone" dataKey="orders" stroke="#0B0A09" strokeWidth={1.5} fill="none" yAxisId={0} hide />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="admin-card p-5">
          <h3 className="mb-4 font-display text-xl">Statuts des commandes</h3>
          <div className="mb-5 flex h-3 overflow-hidden rounded-full bg-noir/5">
            {STATUS_ORDER.map((s) => d.by_status[s] > 0 && <div key={s} style={{ width: `${(d.by_status[s] / totalStatus) * 100}%`, background: STATUS[s].color }} title={STATUS[s].label} />)}
          </div>
          <ul className="space-y-2.5">
            {STATUS_ORDER.map((s) => (
              <li key={s}><Link to={`/admin/commandes?status=${s}`} className="flex items-center justify-between text-sm hover:opacity-70"><StatusBadge status={s} /><span className="font-semibold">{d.by_status[s]}</span></Link></li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <div className="admin-card overflow-hidden xl:col-span-2">
          <div className="flex items-center justify-between p-5"><h3 className="font-display text-xl">Dernières commandes</h3><Link to="/admin/commandes" className="flex items-center gap-1 text-xs font-semibold text-gold-deep">Tout voir <ArrowRight size={13} /></Link></div>
          <div className="overflow-x-auto">
            <table className="admin-table w-full min-w-[560px]">
              <thead><tr><th>N°</th><th>Cliente</th><th>Wilaya</th><th>Total</th><th>Statut</th></tr></thead>
              <tbody>
                {d.recent.map((o) => (
                  <tr key={o.id}><td><Link to={`/admin/commandes?open=${o.id}`} className="font-semibold hover:text-gold-deep">{o.number}</Link><p className="text-[11px] text-mute">{dateFr(o.created_at)}</p></td><td>{o.customer_name}</td><td>{o.wilaya_name}</td><td className="font-semibold">{money(o.total)}</td><td><StatusBadge status={o.status} /></td></tr>
                ))}
                {!d.recent.length && <tr><td colSpan={5} className="py-10 text-center text-mute">Aucune commande pour le moment.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
        <div className="space-y-4">
          <div className="admin-card p-5">
            <h3 className="mb-3 flex items-center gap-2 font-display text-xl"><AlertTriangle size={18} className="text-amber-600" /> Alertes stock</h3>
            {d.low_stock.length ? d.low_stock.map((p) => (
              <Link to="/admin/stock" key={p.id} className="flex items-center gap-3 border-t border-noir/5 py-2.5 first:border-0">
                <img src={p.image} alt="" className="h-10 w-10 rounded-lg object-cover" /><span className="flex-1 text-sm">{p.name}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${p.stock <= 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{p.stock}</span>
              </Link>
            )) : <p className="flex items-center gap-2 text-sm text-emerald-700"><PackageCheck size={16} /> Tous les stocks sont au-dessus du seuil.</p>}
            <p className="mt-3 flex items-center gap-2 border-t border-noir/5 pt-3 text-xs text-mute"><Boxes size={14} /> {k.units_in_stock} unités · valeur {money(k.stock_value)}</p>
          </div>
          <div className="admin-card p-5">
            <h3 className="mb-3 font-display text-xl">Top produits</h3>
            {d.top_products.map((p, i) => <div key={i} className="flex items-center justify-between border-t border-noir/5 py-2 text-sm first:border-0"><span>{p.name}</span><span className="font-semibold">{p.qty} u.</span></div>)}
            {!d.top_products.length && <p className="text-sm text-mute">—</p>}
          </div>
          <div className="admin-card p-5">
            <h3 className="mb-3 font-display text-xl">Top wilayas</h3>
            {d.top_wilayas.map((w, i) => <div key={i} className="flex items-center justify-between border-t border-noir/5 py-2 text-sm first:border-0"><span>{w.name}</span><span className="font-semibold">{w.n}</span></div>)}
            {!d.top_wilayas.length && <p className="text-sm text-mute">—</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
