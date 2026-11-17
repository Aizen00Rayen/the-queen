import { useEffect, useState } from 'react';
import { Plus, Minus, History, Loader2, PackagePlus } from 'lucide-react';
import { adminApi } from '../lib/api';
import { money, dateFr } from '../lib/format';
import { PageHeader, Modal, useToast } from './ui';

const REASONS = { initial: 'Stock initial', order: 'Commande', cancel: 'Annulation', return: 'Retour colis', restock: 'Réapprovisionnement', manual: 'Ajustement manuel', damaged: 'Casse / Perte', inventory: 'Inventaire', gift: 'Cadeau / Influence' };

function Adjust({ product, onDone }) {
  const toast = useToast();
  const [f, setF] = useState({ mode: 'delta', dir: 1, value: '', reason: 'restock', note: '' });
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      const value = f.mode === 'set' ? parseInt(f.value, 10) : f.dir * parseInt(f.value, 10);
      await adminApi('/stock/adjust', { method: 'POST', body: { product_id: product.id, mode: f.mode, value, reason: f.mode === 'set' ? 'inventory' : f.reason, note: f.note } });
      toast('Stock mis à jour'); onDone();
    } catch (e2) { toast(e2.message, 'err'); } finally { setBusy(false); }
  };
  const preview = f.value === '' ? product.stock : f.mode === 'set' ? parseInt(f.value, 10) : product.stock + f.dir * parseInt(f.value || 0, 10);
  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex gap-1 rounded-xl bg-ivory-100 p-1 text-sm font-semibold">
        {[['delta', 'Entrée / Sortie'], ['set', 'Inventaire (fixer)']].map(([k, l]) => <button type="button" key={k} onClick={() => setF({ ...f, mode: k })} className={`flex-1 rounded-lg py-2 ${f.mode === k ? 'bg-white shadow' : 'text-mute'}`}>{l}</button>)}
      </div>
      {f.mode === 'delta' && (
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setF({ ...f, dir: 1, reason: 'restock' })} className={`admin-btn h-12 border ${f.dir === 1 ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-noir/10'}`}><Plus size={16} /> Entrée</button>
          <button type="button" onClick={() => setF({ ...f, dir: -1, reason: 'damaged' })} className={`admin-btn h-12 border ${f.dir === -1 ? 'border-red-600 bg-red-50 text-red-700' : 'border-noir/10'}`}><Minus size={16} /> Sortie</button>
        </div>
      )}
      <label className="block"><span className="admin-label">{f.mode === 'set' ? 'Quantité réelle comptée' : 'Quantité'}</span><input type="number" min="0" className="admin-input h-12 text-lg" value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} required autoFocus /></label>
      {f.mode === 'delta' && (
        <label className="block"><span className="admin-label">Motif</span>
          <select className="admin-input" value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })}>
            {(f.dir === 1 ? ['restock', 'manual'] : ['damaged', 'gift', 'manual']).map((r) => <option key={r} value={r}>{REASONS[r]}</option>)}
          </select>
        </label>
      )}
      <label className="block"><span className="admin-label">Note (fournisseur, lot…)</span><input className="admin-input" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></label>
      <div className="flex items-center justify-between rounded-xl bg-ivory-100 p-4 text-sm"><span>Stock actuel <b>{product.stock}</b></span><span>→</span><span>Nouveau stock <b className={preview < 0 ? 'text-red-600' : ''}>{Number.isNaN(preview) ? '—' : preview}</b></span></div>
      <button disabled={busy} className="admin-btn-primary h-12 w-full">{busy && <Loader2 size={15} className="animate-spin" />}Valider le mouvement</button>
    </form>
  );
}

export default function Stock() {
  const [products, setProducts] = useState([]);
  const [moves, setMoves] = useState([]);
  const [filter, setFilter] = useState('');
  const [adj, setAdj] = useState(null);
  const load = () => { adminApi('/products').then(setProducts); adminApi(`/stock/movements${filter ? `?product_id=${filter}` : ''}`).then(setMoves); };
  useEffect(load, [filter]); // eslint-disable-line
  const totalUnits = products.reduce((s, p) => s + p.stock, 0);
  const value = products.reduce((s, p) => s + p.stock * p.price, 0);
  return (
    <div>
      <PageHeader title="Stock" subtitle={`${totalUnits} unités en stock · valeur de vente ${money(value)}`} />
      <div className="admin-card overflow-x-auto">
        <table className="admin-table w-full min-w-[720px]">
          <thead><tr><th>Produit</th><th>SKU</th><th>Stock</th><th>Seuil</th><th>Vendus</th><th>Valeur</th><th className="text-right">Actions</th></tr></thead>
          <tbody>
            {products.map((p) => {
              const pctw = Math.min(100, (p.stock / Math.max(p.low_stock_threshold * 4, 1)) * 100);
              return (
                <tr key={p.id}>
                  <td><div className="flex items-center gap-3"><img src={p.images[0]} alt="" className="h-11 w-11 rounded-lg object-cover" /><span className="font-semibold">{p.name}</span></div></td>
                  <td className="text-mute">{p.sku}</td>
                  <td className="w-48">
                    <div className="flex items-center gap-3"><span className={`w-10 text-lg font-bold ${p.stock <= 0 ? 'text-red-600' : p.stock <= p.low_stock_threshold ? 'text-amber-600' : ''}`}>{p.stock}</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-noir/5"><div className={`h-full rounded-full ${p.stock <= p.low_stock_threshold ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${pctw}%` }} /></div></div>
                  </td>
                  <td>{p.low_stock_threshold}</td><td>{p.sold_count}</td><td>{money(p.stock * p.price)}</td>
                  <td className="text-right"><div className="flex justify-end gap-2">
                    <button onClick={() => setAdj(p)} className="admin-btn-primary h-9"><PackagePlus size={15} /> Ajuster</button>
                    <button onClick={() => setFilter(filter == p.id ? '' : String(p.id))} className={`admin-btn-ghost h-9 ${filter == p.id ? '!bg-gold/20' : ''}`} title="Historique"><History size={15} /></button>
                  </div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 admin-card overflow-x-auto">
        <div className="flex items-center justify-between p-5"><h3 className="font-display text-xl">Mouvements de stock {filter && `· ${products.find((p) => p.id == filter)?.name || ''}`}</h3>{filter && <button onClick={() => setFilter('')} className="text-xs font-semibold text-gold-deep">Voir tout</button>}</div>
        <table className="admin-table w-full min-w-[720px]">
          <thead><tr><th>Date</th><th>Produit</th><th>Mouvement</th><th>Stock après</th><th>Motif</th><th>Réf.</th><th>Par</th></tr></thead>
          <tbody>
            {moves.map((m) => (
              <tr key={m.id}>
                <td className="whitespace-nowrap text-mute">{dateFr(m.created_at)}</td><td>{m.product_name}</td>
                <td><span className={`font-bold ${m.delta > 0 ? 'text-emerald-600' : 'text-red-600'}`}>{m.delta > 0 ? '+' : ''}{m.delta}</span></td>
                <td className="font-semibold">{m.stock_after}</td><td>{REASONS[m.reason] || m.reason}{m.note && <p className="text-[11px] text-mute">{m.note}</p>}</td>
                <td className="text-xs">{m.ref || '—'}</td><td className="text-xs text-mute">{m.created_by}</td>
              </tr>
            ))}
            {!moves.length && <tr><td colSpan={7} className="py-10 text-center text-mute">Aucun mouvement.</td></tr>}
          </tbody>
        </table>
      </div>
      <Modal open={!!adj} onClose={() => setAdj(null)} title={`Ajuster · ${adj?.name || ''}`}>
        {adj && <Adjust product={adj} onDone={() => { setAdj(null); load(); }} />}
      </Modal>
    </div>
  );
}
