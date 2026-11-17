import { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2, Save } from 'lucide-react';
import { adminApi } from '../lib/api';
import { money, dateFr } from '../lib/format';
import { PageHeader, Modal, Toggle, useToast } from './ui';

/* ---------------------------------------------------------------- Shipping per wilaya */
export function Shipping() {
  const toast = useToast();
  const [list, setList] = useState([]);
  const [q, setQ] = useState('');
  const [bulk, setBulk] = useState({ home_price: '', office_price: '' });
  useEffect(() => { adminApi('/wilayas').then(setList); }, []);
  const update = async (code, patch) => {
    setList((l) => l.map((w) => (w.code === code ? { ...w, ...patch } : w)));
    try { await adminApi(`/wilayas/${code}`, { method: 'PUT', body: patch }); } catch (e) { toast(e.message, 'err'); }
  };
  const applyBulk = async () => {
    if (!confirm('Appliquer ces tarifs à toutes les wilayas ?')) return;
    setList(await adminApi('/wilayas/bulk', { method: 'POST', body: bulk })); toast('Tarifs appliqués'); setBulk({ home_price: '', office_price: '' });
  };
  const shown = list.filter((w) => !q || w.name.toLowerCase().includes(q.toLowerCase()) || w.code.includes(q));
  return (
    <div>
      <PageHeader title="Livraison" subtitle="Tarifs domicile / Stop-Desk pour chacune des 58 wilayas. Les modifications sont enregistrées automatiquement." />
      <div className="admin-card mb-4 flex flex-wrap items-end gap-3 p-4">
        <label><span className="admin-label">Domicile (toutes)</span><input type="number" className="admin-input w-36" value={bulk.home_price} onChange={(e) => setBulk({ ...bulk, home_price: e.target.value })} /></label>
        <label><span className="admin-label">Stop-Desk (toutes)</span><input type="number" className="admin-input w-36" value={bulk.office_price} onChange={(e) => setBulk({ ...bulk, office_price: e.target.value })} /></label>
        <button onClick={applyBulk} disabled={!bulk.home_price && !bulk.office_price} className="admin-btn-primary">Appliquer à tout</button>
        <input className="admin-input ml-auto w-60" placeholder="Rechercher une wilaya…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="admin-card overflow-x-auto">
        <table className="admin-table w-full min-w-[600px]">
          <thead><tr><th>Code</th><th>Wilaya</th><th>Domicile (DA)</th><th>Stop-Desk (DA)</th><th>Active</th></tr></thead>
          <tbody>
            {shown.map((w) => (
              <tr key={w.code}>
                <td className="font-semibold">{w.code}</td><td>{w.name} <span className="text-xs text-mute">{w.name_ar}</span></td>
                <td><input type="number" className="admin-input h-9 w-28" defaultValue={w.home_price} onBlur={(e) => +e.target.value !== w.home_price && update(w.code, { home_price: +e.target.value })} /></td>
                <td><input type="number" className="admin-input h-9 w-28" defaultValue={w.office_price} onBlur={(e) => +e.target.value !== w.office_price && update(w.code, { office_price: +e.target.value })} /></td>
                <td><Toggle checked={!!w.is_active} onChange={(v) => update(w.code, { is_active: v })} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Coupons */
export function Coupons() {
  const toast = useToast();
  const [list, setList] = useState([]);
  const [f, setF] = useState(null);
  const load = () => adminApi('/coupons').then(setList);
  useEffect(() => { load(); }, []);
  const save = async (e) => {
    e.preventDefault();
    try { await adminApi(f.id ? `/coupons/${f.id}` : '/coupons', { method: f.id ? 'PUT' : 'POST', body: f }); toast('Code enregistré'); setF(null); load(); } catch (e2) { toast(e2.message, 'err'); }
  };
  const del = async (c) => { if (!confirm(`Supprimer ${c.code} ?`)) return; await adminApi(`/coupons/${c.id}`, { method: 'DELETE' }); load(); };
  return (
    <div>
      <PageHeader title="Codes promo" subtitle="Idéal pour les campagnes influence et les lives.">
        <button onClick={() => setF({ code: '', type: 'percent', value: 10, min_order: 0, max_uses: '', expires_at: '', is_active: true })} className="admin-btn-primary"><Plus size={15} /> Nouveau code</button>
      </PageHeader>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((c) => (
          <div key={c.id} className="admin-card relative overflow-hidden p-5">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gold/15" />
            <div className="flex items-center justify-between"><p className="font-display text-2xl tracking-wider">{c.code}</p><Toggle checked={!!c.is_active} onChange={async (v) => { await adminApi(`/coupons/${c.id}`, { method: 'PUT', body: { is_active: v } }); load(); }} /></div>
            <p className="mt-2 font-display text-4xl text-gold-deep">−{c.type === 'percent' ? `${c.value}%` : money(c.value)}</p>
            <p className="mt-2 text-xs text-mute">Min. {money(c.min_order)} · {c.used_count}{c.max_uses ? ` / ${c.max_uses}` : ''} utilisation(s){c.expires_at ? ` · expire le ${dateFr(c.expires_at, false)}` : ''}</p>
            <div className="mt-4 flex gap-2"><button onClick={() => setF({ ...c, is_active: !!c.is_active, max_uses: c.max_uses ?? '', expires_at: c.expires_at ?? '' })} className="admin-btn-ghost flex-1">Modifier</button><button onClick={() => del(c)} className="admin-btn-ghost text-red-600"><Trash2 size={15} /></button></div>
          </div>
        ))}
      </div>
      <Modal open={!!f} onClose={() => setF(null)} title={f?.id ? 'Modifier le code' : 'Nouveau code promo'}>
        {f && (
          <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
            <label className="sm:col-span-2"><span className="admin-label">Code</span><input className="admin-input uppercase" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} required /></label>
            <label><span className="admin-label">Type</span><select className="admin-input" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}><option value="percent">Pourcentage</option><option value="fixed">Montant fixe (DA)</option></select></label>
            <label><span className="admin-label">Valeur</span><input type="number" className="admin-input" value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} required /></label>
            <label><span className="admin-label">Commande minimum (DA)</span><input type="number" className="admin-input" value={f.min_order} onChange={(e) => setF({ ...f, min_order: e.target.value })} /></label>
            <label><span className="admin-label">Utilisations max</span><input type="number" className="admin-input" value={f.max_uses} onChange={(e) => setF({ ...f, max_uses: e.target.value })} placeholder="Illimité" /></label>
            <label className="sm:col-span-2"><span className="admin-label">Expiration</span><input type="date" className="admin-input" value={f.expires_at?.slice(0, 10) || ''} onChange={(e) => setF({ ...f, expires_at: e.target.value })} /></label>
            <button className="admin-btn-primary sm:col-span-2">Enregistrer</button>
          </form>
        )}
      </Modal>
    </div>
  );
}

/* ---------------------------------------------------------------- Settings */
export function Settings() {
  const toast = useToast();
  const [s, setS] = useState(null);
  const [pw, setPw] = useState({ current: '', next: '' });
  const [busy, setBusy] = useState(false);
  const [subs, setSubs] = useState([]);
  useEffect(() => { adminApi('/settings').then(setS); adminApi('/newsletter').then(setSubs); }, []);
  if (!s) return <Loader2 className="animate-spin text-gold" />;
  const set = (k) => (e) => setS({ ...s, [k]: e.target.value });
  const save = async () => { setBusy(true); try { await adminApi('/settings', { method: 'PUT', body: s }); toast('Paramètres enregistrés'); } catch (e) { toast(e.message, 'err'); } finally { setBusy(false); } };
  const changePw = async (e) => {
    e.preventDefault();
    try { await adminApi('/auth/password', { method: 'PUT', body: pw }); toast('Mot de passe modifié'); setPw({ current: '', next: '' }); } catch (e2) { toast(e2.message, 'err'); }
  };
  const fields = [
    ['phone', 'Téléphone service client'], ['whatsapp', 'WhatsApp (ex : 0550 00 00 00)'], ['instagram', 'Instagram (@compte ou URL)'], ['tiktok', 'TikTok (URL)'], ['facebook', 'Facebook (URL)'], ['email', 'E-mail de contact'],
  ];
  return (
    <div>
      <PageHeader title="Paramètres"><button onClick={save} disabled={busy} className="admin-btn-primary"><Save size={15} /> Enregistrer</button></PageHeader>
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="admin-card space-y-3 p-5">
          <h3 className="font-display text-xl">Coordonnées & réseaux</h3>
          {fields.map(([k, l]) => <label key={k} className="block"><span className="admin-label">{l}</span><input className="admin-input" value={s[k] || ''} onChange={set(k)} /></label>)}
        </div>
        <div className="space-y-4">
          <div className="admin-card space-y-3 p-5">
            <h3 className="font-display text-xl">Boutique</h3>
            <label className="block"><span className="admin-label">Bandeau d’annonce (FR)</span><input className="admin-input" value={s.announcement || ''} onChange={set('announcement')} /></label>
            <label className="block"><span className="admin-label">Bandeau d’annonce (AR)</span><input dir="rtl" className="admin-input" value={s.announcement_ar || ''} onChange={set('announcement_ar')} /></label>
            <label className="block"><span className="admin-label">Livraison offerte à partir de (DA) — 0 = désactivé</span><input type="number" className="admin-input" value={s.free_shipping_threshold || '0'} onChange={set('free_shipping_threshold')} /></label>
          </div>
          <form onSubmit={changePw} className="admin-card space-y-3 p-5">
            <h3 className="font-display text-xl">Sécurité</h3>
            <input type="password" className="admin-input" placeholder="Mot de passe actuel" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} required />
            <input type="password" className="admin-input" placeholder="Nouveau mot de passe (8 caractères min.)" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} required minLength={8} />
            <button className="admin-btn-ghost w-full">Changer le mot de passe</button>
          </form>
          <div className="admin-card p-5">
            <h3 className="font-display text-xl">Abonnées newsletter ({subs.length})</h3>
            <div className="mt-3 max-h-48 overflow-y-auto text-sm">{subs.map((x) => <div key={x.id} className="flex justify-between border-t border-noir/5 py-1.5 first:border-0"><span>{x.contact}</span><span className="text-xs text-mute">{dateFr(x.created_at, false)}</span></div>)}{!subs.length && <p className="text-mute">—</p>}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
