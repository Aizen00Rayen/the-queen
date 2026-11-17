import { useEffect, useRef, useState } from 'react';
import { Plus, Pencil, Trash2, Upload, X, Loader2, Star, Eye, EyeOff, GripVertical } from 'lucide-react';
import { adminApi } from '../lib/api';
import { money, theme } from '../lib/format';
import { PageHeader, Modal, Toggle, useToast } from './ui';

const blank = { name: '', name_ar: '', subtitle: '', subtitle_ar: '', description: '', description_ar: '', price: '', compare_price: '', category_id: '', sku: '', volume: '30 mL', stock: 0, low_stock_threshold: 10, is_active: true, is_featured: false, theme: 'gold', tags: [], images: [], benefits: [], how_to: '', ingredients: '', sort_order: 0 };

function Editor({ product, categories, onClose, onSaved }) {
  const toast = useToast();
  const [f, setF] = useState(() => ({ ...blank, ...product, tagsText: (product?.tags || []).join(', '), benefitsText: (product?.benefits || []).join('\n') }));
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState('fr');
  const fileRef = useRef(null);
  const set = (k) => (e) => setF({ ...f, [k]: e?.target ? e.target.value : e });
  const isNew = !product?.id;

  const upload = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const fd = new FormData(); [...files].forEach((x) => fd.append('files', x));
      const r = await adminApi('/upload', { method: 'POST', body: fd });
      setF((s) => ({ ...s, images: [...s.images, ...r.urls] }));
    } catch (e) { toast(e.message, 'err'); } finally { setUploading(false); }
  };
  const move = (i, dir) => { const im = [...f.images]; const j = i + dir; if (j < 0 || j >= im.length) return; [im[i], im[j]] = [im[j], im[i]]; setF({ ...f, images: im }); };

  const save = async (e) => {
    e.preventDefault(); setBusy(true);
    const body = { ...f, tags: f.tagsText.split(',').map((x) => x.trim()).filter(Boolean), benefits: f.benefitsText.split('\n').map((x) => x.trim()).filter(Boolean) };
    delete body.tagsText; delete body.benefitsText; delete body.stock_after;
    if (!isNew) delete body.stock; // stock is managed through movements
    try {
      await adminApi(isNew ? '/products' : `/products/${product.id}`, { method: isNew ? 'POST' : 'PUT', body });
      toast(isNew ? 'Produit créé' : 'Produit enregistré'); onSaved();
    } catch (e2) { toast(e2.message, 'err'); } finally { setBusy(false); }
  };

  return (
    <form onSubmit={save} className="space-y-6">
      <div>
        <span className="admin-label">Images (la 1ʳᵉ est l’image principale — glissez un visuel « bottle » détouré pour l’effet 3D)</span>
        <div className="flex flex-wrap gap-3">
          {f.images.map((src, i) => (
            <div key={src + i} className="group relative h-24 w-24 overflow-hidden rounded-xl border border-noir/10 bg-ivory-100">
              <img src={src} alt="" className="h-full w-full object-cover" />
              {i === 0 && <span className="absolute left-1 top-1 rounded bg-noir px-1.5 text-[9px] font-bold text-ivory">PRINCIPALE</span>}
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-noir/60 opacity-0 transition group-hover:opacity-100">
                <button type="button" onClick={() => move(i, -1)} className="px-2 text-ivory">‹</button>
                <button type="button" onClick={() => setF({ ...f, images: f.images.filter((_, j) => j !== i) })} className="px-2 text-red-300"><X size={14} /></button>
                <button type="button" onClick={() => move(i, 1)} className="px-2 text-ivory">›</button>
              </div>
            </div>
          ))}
          <button type="button" onClick={() => fileRef.current.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); upload(e.dataTransfer.files); }}
            className="grid h-24 w-24 place-items-center rounded-xl border-2 border-dashed border-noir/15 text-mute hover:border-gold hover:text-gold-deep">
            {uploading ? <Loader2 className="animate-spin" /> : <div className="flex flex-col items-center gap-1 text-[11px]"><Upload size={18} />Ajouter</div>}
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => upload(e.target.files)} />
        </div>
      </div>

      <div className="flex gap-1 rounded-xl bg-ivory-100 p-1 text-sm font-semibold">
        {[['fr', 'Français'], ['ar', 'العربية']].map(([k, l]) => <button type="button" key={k} onClick={() => setTab(k)} className={`flex-1 rounded-lg py-2 ${tab === k ? 'bg-white shadow' : 'text-mute'}`}>{l}</button>)}
      </div>
      {tab === 'fr' ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2"><span className="admin-label">Nom *</span><input className="admin-input" value={f.name} onChange={set('name')} required /></label>
          <label className="sm:col-span-2"><span className="admin-label">Sous-titre</span><input className="admin-input" value={f.subtitle || ''} onChange={set('subtitle')} /></label>
          <label className="sm:col-span-2"><span className="admin-label">Description</span><textarea rows={4} className="admin-input" value={f.description || ''} onChange={set('description')} /></label>
          <label className="sm:col-span-2"><span className="admin-label">Bénéfices (un par ligne)</span><textarea rows={4} className="admin-input" value={f.benefitsText} onChange={set('benefitsText')} /></label>
          <label><span className="admin-label">Mode d’emploi</span><textarea rows={3} className="admin-input" value={f.how_to || ''} onChange={set('how_to')} /></label>
          <label><span className="admin-label">Composition (INCI)</span><textarea rows={3} className="admin-input" value={f.ingredients || ''} onChange={set('ingredients')} /></label>
        </div>
      ) : (
        <div className="grid gap-4" dir="rtl">
          <label><span className="admin-label">الاسم</span><input className="admin-input" value={f.name_ar || ''} onChange={set('name_ar')} /></label>
          <label><span className="admin-label">العنوان الفرعي</span><input className="admin-input" value={f.subtitle_ar || ''} onChange={set('subtitle_ar')} /></label>
          <label><span className="admin-label">الوصف</span><textarea rows={4} className="admin-input" value={f.description_ar || ''} onChange={set('description_ar')} /></label>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <label><span className="admin-label">Prix (DA) *</span><input type="number" min="0" className="admin-input" value={f.price} onChange={set('price')} required /></label>
        <label><span className="admin-label">Prix barré (DA)</span><input type="number" min="0" className="admin-input" value={f.compare_price || ''} onChange={set('compare_price')} /></label>
        <label><span className="admin-label">SKU</span><input className="admin-input" value={f.sku || ''} onChange={set('sku')} /></label>
        <label><span className="admin-label">Contenance</span><input className="admin-input" value={f.volume || ''} onChange={set('volume')} /></label>
        <label><span className="admin-label">Catégorie</span>
          <select className="admin-input" value={f.category_id || ''} onChange={set('category_id')}><option value="">—</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        </label>
        <label><span className="admin-label">Univers couleur</span>
          <select className="admin-input" value={f.theme} onChange={set('theme')}><option value="gold">Or (coffrets)</option><option value="amber">Ambre (Vitamine C)</option><option value="azure">Azur (Hyaluronique)</option></select>
        </label>
        {isNew && <label><span className="admin-label">Stock initial</span><input type="number" min="0" className="admin-input" value={f.stock} onChange={set('stock')} /></label>}
        <label><span className="admin-label">Seuil d’alerte stock</span><input type="number" min="0" className="admin-input" value={f.low_stock_threshold} onChange={set('low_stock_threshold')} /></label>
        <label><span className="admin-label">Ordre d’affichage</span><input type="number" className="admin-input" value={f.sort_order} onChange={set('sort_order')} /></label>
        <label className="sm:col-span-3"><span className="admin-label">Tags (séparés par des virgules)</span><input className="admin-input" value={f.tagsText} onChange={set('tagsText')} /></label>
      </div>
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-3 text-sm"><Toggle checked={!!f.is_active} onChange={(v) => setF({ ...f, is_active: v })} /> Visible sur la boutique</label>
        <label className="flex items-center gap-3 text-sm"><Toggle checked={!!f.is_featured} onChange={(v) => setF({ ...f, is_featured: v })} /> Mis en avant</label>
      </div>
      <div className="sticky bottom-0 -mx-6 -mb-6 flex justify-end gap-2 border-t border-noir/5 bg-white px-6 py-4">
        <button type="button" onClick={onClose} className="admin-btn-ghost">Annuler</button>
        <button disabled={busy} className="admin-btn-primary">{busy && <Loader2 size={15} className="animate-spin" />}{isNew ? 'Créer le produit' : 'Enregistrer'}</button>
      </div>
    </form>
  );
}

export default function Products() {
  const toast = useToast();
  const [list, setList] = useState(null);
  const [cats, setCats] = useState([]);
  const [edit, setEdit] = useState(null);
  const load = () => adminApi('/products').then(setList);
  useEffect(() => { load(); adminApi('/categories').then(setCats); }, []);
  const quick = async (p, patch) => { await adminApi(`/products/${p.id}`, { method: 'PUT', body: patch }); load(); };
  const del = async (p) => {
    if (!confirm(`Supprimer « ${p.name} » ? Les commandes passées ne sont pas affectées.`)) return;
    await adminApi(`/products/${p.id}`, { method: 'DELETE' }); toast('Produit supprimé'); load();
  };
  return (
    <div>
      <PageHeader title="Produits" subtitle={`${list?.length ?? '…'} produit(s) au catalogue`}>
        <button onClick={() => setEdit({})} className="admin-btn-primary"><Plus size={16} /> Nouveau produit</button>
      </PageHeader>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {(list || []).map((p) => (
          <div key={p.id} className="admin-card overflow-hidden">
            <div className="relative aspect-[4/3]" style={{ background: theme(p.theme).bg }}>
              <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
              <div className="absolute left-3 top-3 flex gap-1.5">
                {!p.is_active && <span className="rounded-full bg-noir/80 px-2 py-0.5 text-[10px] font-bold text-ivory">MASQUÉ</span>}
                {p.is_featured && <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-noir">EN AVANT</span>}
              </div>
              <span className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold ${p.stock <= 0 ? 'bg-red-600 text-white' : p.stock <= p.low_stock_threshold ? 'bg-amber-400 text-noir' : 'bg-white/90 text-noir'}`}>Stock {p.stock}</span>
            </div>
            <div className="p-4">
              <p className="text-[11px] uppercase tracking-wider text-mute">{p.category_name || '—'} · {p.sku}</p>
              <h3 className="mt-1 font-display text-xl">{p.name}</h3>
              <p className="mt-1 text-sm"><span className="font-semibold">{money(p.price)}</span>{p.compare_price ? <span className="ml-2 text-mute line-through">{money(p.compare_price)}</span> : null}<span className="ml-2 text-xs text-mute">· {p.sold_count} vendus</span></p>
              <div className="mt-4 flex gap-2">
                <button onClick={() => setEdit(p)} className="admin-btn-ghost flex-1"><Pencil size={14} /> Modifier</button>
                <button onClick={() => quick(p, { is_active: !p.is_active })} className="admin-btn-ghost" title={p.is_active ? 'Masquer' : 'Afficher'}>{p.is_active ? <Eye size={15} /> : <EyeOff size={15} />}</button>
                <button onClick={() => quick(p, { is_featured: !p.is_featured })} className="admin-btn-ghost" title="Mettre en avant"><Star size={15} fill={p.is_featured ? '#C9A66B' : 'none'} className={p.is_featured ? 'text-gold' : ''} /></button>
                <button onClick={() => del(p)} className="admin-btn-ghost text-red-600" title="Supprimer"><Trash2 size={15} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? `Modifier · ${edit.name}` : 'Nouveau produit'} wide>
        {edit && <Editor product={edit.id ? edit : null} categories={cats} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); load(); }} />}
      </Modal>
    </div>
  );
}
