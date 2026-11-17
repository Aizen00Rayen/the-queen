import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Download, Plus, Phone, MessageCircle, Printer, Loader2, Trash2, Home, Building2, AlertTriangle, ChevronLeft, ChevronRight, Minus } from 'lucide-react';
import { adminApi } from '../lib/api';
import { money, dateFr } from '../lib/format';
import { PageHeader, Modal, StatusBadge, STATUS, STATUS_ORDER, useToast } from './ui';

const waLink = (p) => `https://wa.me/${String(p).replace(/\D/g, '').replace(/^0/, '213')}`;

function OrderDetail({ id, onChanged, onClose }) {
  const toast = useToast();
  const [o, setO] = useState(null);
  const [wilayas, setWilayas] = useState([]);
  const [note, setNote] = useState('');
  const [edit, setEdit] = useState(null);
  const [busy, setBusy] = useState(false);
  const load = () => adminApi(`/orders/${id}`).then((d) => { setO(d); setEdit({ customer_name: d.customer_name, phone: d.phone, phone2: d.phone2 || '', wilaya_code: d.wilaya_code, commune: d.commune || '', address: d.address || '', delivery_type: d.delivery_type, shipping_price: d.shipping_price, tracking_number: d.tracking_number || '', admin_note: d.admin_note || '' }); });
  useEffect(() => { load(); adminApi('/wilayas').then(setWilayas); }, [id]); // eslint-disable-line
  if (!o || !edit) return <div className="grid h-60 place-items-center"><Loader2 className="animate-spin text-gold" /></div>;

  const setStatus = async (status) => {
    setBusy(true);
    try { await adminApi(`/orders/${o.id}/status`, { method: 'PUT', body: { status, note: note || null } }); setNote(''); toast(`Statut : ${STATUS[status].label}`); await load(); onChanged(); }
    catch (e) { toast(e.message, 'err'); } finally { setBusy(false); }
  };
  const save = async () => {
    setBusy(true);
    try { await adminApi(`/orders/${o.id}`, { method: 'PUT', body: edit }); toast('Commande mise à jour'); await load(); onChanged(); }
    catch (e) { toast(e.message, 'err'); } finally { setBusy(false); }
  };
  const del = async () => {
    if (!confirm('Supprimer définitivement cette commande ? Le stock sera restitué si nécessaire.')) return;
    await adminApi(`/orders/${o.id}`, { method: 'DELETE' }); toast('Commande supprimée'); onChanged(); onClose();
  };
  const risky = o.previous.filter((p) => ['returned', 'cancelled'].includes(p.status)).length;
  const set = (k) => (e) => setEdit({ ...edit, [k]: e.target.value });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-2xl font-bold tracking-wide">{o.number}</p><p className="text-xs text-mute">{dateFr(o.created_at)} · IP {o.ip || '—'}</p></div>
        <StatusBadge status={o.status} className="!text-sm !px-3 !py-1.5" />
      </div>

      <div className="admin-card p-4">
        <p className="admin-label mb-3">Changer le statut</p>
        <div className="flex flex-wrap gap-2">
          {STATUS_ORDER.map((s) => (
            <button key={s} disabled={busy || s === o.status} onClick={() => setStatus(s)}
              className="rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-40" style={{ borderColor: STATUS[s].color, color: s === o.status ? '#fff' : STATUS[s].color, background: s === o.status ? STATUS[s].color : 'transparent' }}>
              {STATUS[s].label}
            </button>
          ))}
        </div>
        <input className="admin-input mt-3" placeholder="Note jointe au changement (optionnel) — ex : cliente rappelée, confirme pour samedi" value={note} onChange={(e) => setNote(e.target.value)} />
        <p className="mt-2 text-[11px] text-mute">Le stock est restitué automatiquement en cas d’annulation / retour, et redéduit si la commande est réactivée.</p>
      </div>

      {risky > 0 && <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700"><AlertTriangle size={16} /> Attention : {risky} commande(s) précédente(s) annulée(s) ou retournée(s) avec ce numéro.</div>}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="admin-card p-4">
          <div className="mb-3 flex items-center justify-between"><p className="admin-label !mb-0">Cliente</p>
            <div className="flex gap-1.5">
              <a href={`tel:${o.phone}`} className="admin-btn-ghost h-8 px-3 text-xs"><Phone size={13} /> Appeler</a>
              <a href={waLink(o.phone)} target="_blank" rel="noreferrer" className="admin-btn h-8 bg-emerald-600 px-3 text-xs text-white"><MessageCircle size={13} /> WhatsApp</a>
            </div>
          </div>
          <div className="grid gap-2">
            <input className="admin-input" value={edit.customer_name} onChange={set('customer_name')} placeholder="Nom" />
            <div className="grid grid-cols-2 gap-2"><input className="admin-input" value={edit.phone} onChange={set('phone')} placeholder="Téléphone" /><input className="admin-input" value={edit.phone2} onChange={set('phone2')} placeholder="Téléphone 2" /></div>
            <select className="admin-input" value={edit.wilaya_code} onChange={set('wilaya_code')}>{wilayas.map((w) => <option key={w.code} value={w.code}>{w.code} — {w.name}</option>)}</select>
            <input className="admin-input" value={edit.commune} onChange={set('commune')} placeholder="Commune" />
            <input className="admin-input" value={edit.address} onChange={set('address')} placeholder="Adresse" />
            {o.customer_note && <p className="rounded-lg bg-amber-50 p-2 text-xs text-amber-800">Note cliente : {o.customer_note}</p>}
          </div>
        </div>
        <div className="admin-card p-4">
          <p className="admin-label mb-3">Livraison & suivi</p>
          <div className="grid grid-cols-2 gap-2">
            {[['home', Home, 'Domicile'], ['office', Building2, 'Stop-Desk']].map(([k, I, l]) => (
              <button key={k} type="button" onClick={() => setEdit({ ...edit, delivery_type: k, shipping_price: '' })} className={`admin-btn h-10 border ${edit.delivery_type === k ? 'border-noir bg-noir text-ivory' : 'border-noir/10'}`}><I size={14} /> {l}</button>
            ))}
          </div>
          <label className="mt-2 block"><span className="admin-label">Frais de livraison (vide = tarif wilaya)</span><input type="number" className="admin-input" value={edit.shipping_price} onChange={set('shipping_price')} /></label>
          <label className="mt-2 block"><span className="admin-label">N° de suivi transporteur</span><input className="admin-input" value={edit.tracking_number} onChange={set('tracking_number')} placeholder="Yalidine, ZR Express, Noest…" /></label>
          <label className="mt-2 block"><span className="admin-label">Note interne (privée)</span><textarea rows={2} className="admin-input" value={edit.admin_note} onChange={set('admin_note')} /></label>
          <button onClick={save} disabled={busy} className="admin-btn-primary mt-3 w-full">Enregistrer les modifications</button>
        </div>
      </div>

      <div className="admin-card overflow-hidden">
        <table className="admin-table w-full">
          <thead><tr><th>Article</th><th>Qté</th><th className="text-right">Total</th></tr></thead>
          <tbody>
            {o.items.map((it) => <tr key={it.id}><td><div className="flex items-center gap-3"><img src={it.image} alt="" className="h-10 w-10 rounded-lg object-cover" /><div><p className="font-semibold">{it.name}</p><p className="text-[11px] text-mute">{it.sku} · {money(it.price)}</p></div></div></td><td>× {it.qty}</td><td className="text-right font-semibold">{money(it.price * it.qty)}</td></tr>)}
          </tbody>
        </table>
        <dl className="space-y-1.5 p-4 text-sm">
          <div className="flex justify-between"><dt className="text-mute">Sous-total</dt><dd>{money(o.subtotal)}</dd></div>
          {o.discount > 0 && <div className="flex justify-between text-emerald-700"><dt>Réduction {o.coupon_code && `(${o.coupon_code})`}</dt><dd>−{money(o.discount)}</dd></div>}
          <div className="flex justify-between"><dt className="text-mute">Livraison · {o.wilaya_name} · {o.delivery_type === 'office' ? 'Stop-Desk' : 'Domicile'}</dt><dd>{money(o.shipping_price)}</dd></div>
          <div className="flex justify-between border-t border-noir/5 pt-2 text-base font-bold"><dt>Total à encaisser</dt><dd>{money(o.total)}</dd></div>
        </dl>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="admin-card p-4">
          <p className="admin-label mb-3">Historique</p>
          <ol className="relative space-y-4 border-l border-noir/10 pl-5">
            {o.history.map((h) => (
              <li key={h.id} className="relative"><span className="absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full ring-4 ring-white" style={{ background: STATUS[h.to_status]?.color }} />
                <div className="flex items-center gap-2"><StatusBadge status={h.to_status} /><span className="text-[11px] text-mute">{dateFr(h.created_at)}</span></div>
                {h.note && <p className="mt-1 text-xs text-ink">{h.note}</p>}<p className="text-[10px] text-mute">par {h.created_by}</p>
              </li>
            ))}
          </ol>
        </div>
        <div className="admin-card p-4">
          <p className="admin-label mb-3">Autres commandes de ce numéro ({o.previous.length})</p>
          {o.previous.length ? o.previous.map((p) => <div key={p.id} className="flex items-center justify-between border-t border-noir/5 py-2 text-sm first:border-0"><span>{p.number}</span><StatusBadge status={p.status} /><span className="font-semibold">{money(p.total)}</span></div>) : <p className="text-sm text-mute">Première commande ✦</p>}
        </div>
      </div>

      <div className="flex justify-between">
        <button onClick={del} className="admin-btn-ghost text-red-600"><Trash2 size={15} /> Supprimer</button>
        <button onClick={() => printSlip(o)} className="admin-btn-ghost"><Printer size={15} /> Imprimer le bon</button>
      </div>
    </div>
  );
}

function printSlip(o) {
  const w = window.open('', '_blank', 'width=800,height=900');
  if (!w) return;
  const rows = o.items.map((i) => `<tr><td>${i.name}</td><td>${i.qty}</td><td style="text-align:right">${money(i.price * i.qty)}</td></tr>`).join('');
  w.document.write(`<!doctype html><html><head><title>${o.number}</title><style>body{font-family:system-ui;padding:32px;color:#111}h1{font-family:Georgia,serif;font-weight:400;margin:0}table{width:100%;border-collapse:collapse;margin-top:16px}td,th{padding:8px;border-bottom:1px solid #eee;text-align:left}.box{border:1px solid #ddd;border-radius:12px;padding:16px;margin-top:16px}.tot{font-size:22px;font-weight:700;text-align:right;margin-top:12px}</style></head><body>
  <div style="display:flex;justify-content:space-between;align-items:center"><img src="/brand/logo-black.png" style="height:36px"/><div style="text-align:right"><h1>${o.number}</h1><small>${dateFr(o.created_at)}</small></div></div>
  <div class="box"><b>${o.customer_name}</b><br/>${o.phone}${o.phone2 ? ' / ' + o.phone2 : ''}<br/>${o.wilaya_code} — ${o.wilaya_name}, ${o.commune || ''}<br/>${o.delivery_type === 'office' ? 'STOP-DESK' : o.address || ''}</div>
  <table><tr><th>Article</th><th>Qté</th><th style="text-align:right">Total</th></tr>${rows}
  <tr><td colspan="2">Livraison</td><td style="text-align:right">${money(o.shipping_price)}</td></tr>${o.discount ? `<tr><td colspan="2">Réduction</td><td style="text-align:right">−${money(o.discount)}</td></tr>` : ''}</table>
  <p class="tot">À encaisser : ${money(o.total)}</p><p style="margin-top:40px;text-align:center;color:#999;font-size:12px">The Queen — Haute Dermatologie · Merci pour votre confiance ♛</p>
  </body></html>`);
  w.document.close();
  setTimeout(() => w.print(), 500);
}

function NewOrder({ onDone }) {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [wilayas, setWilayas] = useState([]);
  const [f, setF] = useState({ customer_name: '', phone: '', wilaya_code: '16', commune: '', address: '', delivery_type: 'home', status: 'confirmed', admin_note: '', items: {} });
  const [busy, setBusy] = useState(false);
  useEffect(() => { adminApi('/products').then(setProducts); adminApi('/wilayas').then(setWilayas); }, []);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const qty = (id, d) => setF({ ...f, items: { ...f.items, [id]: Math.max(0, (f.items[id] || 0) + d) } });
  const items = Object.entries(f.items).filter(([, q]) => q > 0).map(([product_id, q]) => ({ product_id: Number(product_id), qty: q }));
  const sub = items.reduce((s, it) => s + (products.find((p) => p.id === it.product_id)?.price || 0) * it.qty, 0);
  const w = wilayas.find((x) => x.code === f.wilaya_code);
  const ship = w ? (f.delivery_type === 'office' ? w.office_price : w.home_price) : 0;
  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try { const r = await adminApi('/orders', { method: 'POST', body: { ...f, items, address: f.address || (f.delivery_type === 'office' ? 'Stop-Desk' : '') } }); toast(`Commande ${r.number} créée`); onDone(); }
    catch (e2) { toast(e2.message, 'err'); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-mute">Pour les commandes reçues par Instagram, WhatsApp ou téléphone. Le stock est réservé immédiatement.</p>
      <div className="space-y-2">
        {products.map((p) => (
          <div key={p.id} className="flex items-center gap-3 rounded-xl border border-noir/10 p-2">
            <img src={p.images[0]} alt="" className="h-11 w-11 rounded-lg object-cover" />
            <div className="flex-1"><p className="text-sm font-semibold">{p.name}</p><p className="text-xs text-mute">{money(p.price)} · stock {p.stock}</p></div>
            <button type="button" onClick={() => qty(p.id, -1)} className="admin-btn-ghost h-8 w-8 !px-0"><Minus size={13} /></button>
            <span className="w-6 text-center font-bold">{f.items[p.id] || 0}</span>
            <button type="button" onClick={() => qty(p.id, 1)} className="admin-btn-ghost h-8 w-8 !px-0"><Plus size={13} /></button>
          </div>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <input className="admin-input" placeholder="Nom complet *" value={f.customer_name} onChange={set('customer_name')} required />
        <input className="admin-input" placeholder="Téléphone *" value={f.phone} onChange={set('phone')} required />
        <select className="admin-input" value={f.wilaya_code} onChange={set('wilaya_code')}>{wilayas.map((x) => <option key={x.code} value={x.code}>{x.code} — {x.name}</option>)}</select>
        <input className="admin-input" placeholder="Commune *" value={f.commune} onChange={set('commune')} required />
        <select className="admin-input" value={f.delivery_type} onChange={set('delivery_type')}><option value="home">À domicile</option><option value="office">Stop-Desk</option></select>
        <select className="admin-input" value={f.status} onChange={set('status')}>{STATUS_ORDER.filter((s) => !['cancelled', 'returned'].includes(s)).map((s) => <option key={s} value={s}>{STATUS[s].label}</option>)}</select>
        <input className="admin-input sm:col-span-2" placeholder="Adresse" value={f.address} onChange={set('address')} />
        <input className="admin-input sm:col-span-2" placeholder="Note interne (ex : commande via Instagram)" value={f.admin_note} onChange={set('admin_note')} />
      </div>
      <div className="flex items-center justify-between rounded-xl bg-ivory-100 p-4 text-sm"><span>{money(sub)} + livraison {money(ship)}</span><b className="text-lg">{money(sub + ship)}</b></div>
      <button disabled={busy || !items.length} className="admin-btn-primary h-12 w-full">{busy && <Loader2 size={15} className="animate-spin" />}Créer la commande</button>
    </form>
  );
}

export default function Orders() {
  const toast = useToast();
  const [sp, setSp] = useSearchParams();
  const [status, setStatus] = useState(sp.get('status') || 'all');
  const [q, setQ] = useState('');
  const [qd, setQd] = useState('');
  const [range, setRange] = useState({ from: '', to: '' });
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(sp.get('open') ? Number(sp.get('open')) : null);
  const [creating, setCreating] = useState(false);
  const [sel, setSel] = useState([]);
  const [bulk, setBulk] = useState('');
  useEffect(() => { const t = setTimeout(() => { setQd(q); setPage(1); }, 300); return () => clearTimeout(t); }, [q]);
  const load = () => adminApi(`/orders?status=${status}&q=${encodeURIComponent(qd)}&from=${range.from}&to=${range.to}&page=${page}&limit=25`).then(setData);
  useEffect(() => { load(); setSel([]); }, [status, qd, range, page]); // eslint-disable-line
  useEffect(() => { const i = setInterval(load, 45000); return () => clearInterval(i); }); // live refresh

  const exportCsv = async () => {
    const r = await adminApi('/orders/export.csv', { raw: true });
    const blob = await r.blob(); const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `commandes-the-queen-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  };
  const applyBulk = async () => {
    if (!bulk || !sel.length) return;
    const r = await adminApi('/orders/bulk-status', { method: 'POST', body: { ids: sel, status: bulk } });
    toast(`${r.ok} commande(s) mise(s) à jour${r.failed.length ? ` · ${r.failed.length} échec(s)` : ''}`, r.failed.length ? 'err' : 'ok');
    setBulk(''); load();
  };
  const tabs = ['all', ...STATUS_ORDER];
  return (
    <div>
      <PageHeader title="Commandes" subtitle={data ? `${data.counts.all} commande(s) au total` : '…'}>
        <button onClick={exportCsv} className="admin-btn-ghost"><Download size={15} /> Export CSV</button>
        <button onClick={() => setCreating(true)} className="admin-btn-primary"><Plus size={15} /> Commande manuelle</button>
      </PageHeader>
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {tabs.map((s) => (
          <button key={s} onClick={() => { setStatus(s); setPage(1); setSp(s === 'all' ? {} : { status: s }); }}
            className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition ${status === s ? 'border-noir bg-noir text-ivory' : 'border-noir/10 bg-white text-ink hover:border-noir/30'}`}>
            {s === 'all' ? 'Toutes' : STATUS[s].label}<span className={`rounded-full px-1.5 text-[10px] ${status === s ? 'bg-ivory/20' : 'bg-noir/5'}`}>{data?.counts[s] ?? 0}</span>
          </button>
        ))}
      </div>
      <div className="admin-card mb-4 flex flex-wrap items-center gap-3 p-3">
        <div className="relative min-w-[220px] flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-mute" /><input className="admin-input pl-9" placeholder="N° commande, nom, téléphone, wilaya, commune…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <input type="date" className="admin-input w-auto" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} />
        <input type="date" className="admin-input w-auto" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} />
        {sel.length > 0 && (
          <div className="flex items-center gap-2 rounded-xl bg-gold/15 px-3 py-1.5">
            <span className="text-xs font-semibold">{sel.length} sélectionnée(s)</span>
            <select className="admin-input h-8 w-auto" value={bulk} onChange={(e) => setBulk(e.target.value)}><option value="">Passer en…</option>{STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS[s].label}</option>)}</select>
            <button onClick={applyBulk} className="admin-btn-primary h-8">OK</button>
          </div>
        )}
      </div>
      <div className="admin-card overflow-x-auto">
        <table className="admin-table w-full min-w-[900px]">
          <thead><tr>
            <th className="w-10"><input type="checkbox" checked={!!data?.orders.length && sel.length === data.orders.length} onChange={(e) => setSel(e.target.checked ? data.orders.map((o) => o.id) : [])} /></th>
            <th>Commande</th><th>Cliente</th><th>Livraison</th><th>Articles</th><th>Total</th><th>Statut</th>
          </tr></thead>
          <tbody>
            {(data?.orders || []).map((o) => (
              <tr key={o.id} className="cursor-pointer" onClick={() => setOpen(o.id)}>
                <td onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={sel.includes(o.id)} onChange={(e) => setSel(e.target.checked ? [...sel, o.id] : sel.filter((x) => x !== o.id))} /></td>
                <td><p className="font-semibold">{o.number}</p><p className="text-[11px] text-mute">{dateFr(o.created_at)}</p></td>
                <td><p className="font-medium">{o.customer_name}</p><p className="text-xs text-mute">{o.phone}</p></td>
                <td><p>{o.wilaya_code} — {o.wilaya_name}</p><p className="text-xs text-mute">{o.commune} · {o.delivery_type === 'office' ? 'Stop-Desk' : 'Domicile'}</p></td>
                <td>{o.items_count}</td>
                <td className="font-semibold">{money(o.total)}</td>
                <td><StatusBadge status={o.status} /></td>
              </tr>
            ))}
            {data && !data.orders.length && <tr><td colSpan={7} className="py-16 text-center text-mute">Aucune commande trouvée.</td></tr>}
          </tbody>
        </table>
        {data?.pages > 1 && (
          <div className="flex items-center justify-between p-3 text-sm">
            <span className="text-mute">Page {data.page} / {data.pages}</span>
            <div className="flex gap-2"><button disabled={page <= 1} onClick={() => setPage(page - 1)} className="admin-btn-ghost h-8"><ChevronLeft size={15} /></button><button disabled={page >= data.pages} onClick={() => setPage(page + 1)} className="admin-btn-ghost h-8"><ChevronRight size={15} /></button></div>
          </div>
        )}
      </div>
      <Modal open={!!open} onClose={() => { setOpen(null); if (sp.get('open')) setSp({}); }} title="Détail de la commande" side>
        {open && <OrderDetail id={open} onChanged={load} onClose={() => setOpen(null)} />}
      </Modal>
      <Modal open={creating} onClose={() => setCreating(false)} title="Nouvelle commande manuelle" wide>
        {creating && <NewOrder onDone={() => { setCreating(false); load(); }} />}
      </Modal>
    </div>
  );
}
