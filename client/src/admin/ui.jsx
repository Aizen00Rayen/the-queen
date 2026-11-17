import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';

export const STATUS = {
  pending: { label: 'Nouvelle', color: '#B7791F', bg: '#FEF3C7' },
  confirmed: { label: 'Confirmée', color: '#1D4ED8', bg: '#DBEAFE' },
  preparing: { label: 'En préparation', color: '#7C3AED', bg: '#EDE9FE' },
  shipped: { label: 'Expédiée', color: '#0E7490', bg: '#CFFAFE' },
  delivered: { label: 'Livrée', color: '#047857', bg: '#D1FAE5' },
  no_answer: { label: 'Injoignable', color: '#C2410C', bg: '#FFEDD5' },
  cancelled: { label: 'Annulée', color: '#B91C1C', bg: '#FEE2E2' },
  returned: { label: 'Retour', color: '#525252', bg: '#E5E5E5' },
};
export const STATUS_ORDER = ['pending', 'no_answer', 'confirmed', 'preparing', 'shipped', 'delivered', 'returned', 'cancelled'];

export function StatusBadge({ status, className = '' }) {
  const s = STATUS[status] || { label: status, color: '#555', bg: '#eee' };
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${className}`} style={{ color: s.color, background: s.bg }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />{s.label}
    </span>
  );
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div><h1 className="font-display text-3xl sm:text-4xl">{title}</h1>{subtitle && <p className="mt-1 text-sm text-mute">{subtitle}</p>}</div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide = false, side = false }) {
  useEffect(() => { const f = (e) => e.key === 'Escape' && onClose(); addEventListener('keydown', f); return () => removeEventListener('keydown', f); }, [onClose]);
  return (
    <AnimatePresence>
      {open && (
        <div className={`fixed inset-0 z-50 flex ${side ? 'justify-end' : 'items-end justify-center sm:items-center'}`}>
          <motion.div className="absolute inset-0 bg-noir/40 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            initial={side ? { x: '100%' } : { y: 40, opacity: 0 }} animate={side ? { x: 0 } : { y: 0, opacity: 1 }} exit={side ? { x: '100%' } : { y: 40, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className={`relative flex flex-col bg-white shadow-2xl ${side ? 'h-full w-full max-w-3xl' : `max-h-[92vh] w-full ${wide ? 'max-w-4xl' : 'max-w-lg'} rounded-t-3xl sm:rounded-3xl`}`}>
            <div className="flex items-center justify-between border-b border-noir/5 px-6 py-4">
              <h3 className="font-display text-2xl">{title}</h3>
              <button onClick={onClose} className="rounded-full p-2 hover:bg-noir/5"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

const ToastCtx = createContext(() => {});
export function ToastProvider({ children }) {
  const [list, setList] = useState([]);
  const push = useCallback((msg, type = 'ok') => {
    const id = Math.random();
    setList((l) => [...l, { id, msg, type }]);
    setTimeout(() => setList((l) => l.filter((x) => x.id !== id)), 3500);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2">
        <AnimatePresence>
          {list.map((t) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, x: 40 }}
              className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium shadow-xl ${t.type === 'err' ? 'bg-red-600 text-white' : 'bg-noir text-ivory'}`}>
              {t.type === 'err' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} className="text-gold" />}{t.msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);

export function Stat({ label, value, sub, icon: I, accent = '#C9A66B' }) {
  return (
    <div className="admin-card p-5">
      <div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wider text-mute">{label}</p>{I && <span className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: `${accent}1f`, color: accent }}><I size={17} /></span>}</div>
      <p className="mt-3 font-display text-3xl">{value}</p>
      {sub && <p className="mt-1 text-xs text-mute">{sub}</p>}
    </div>
  );
}

export function Toggle({ checked, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className={`relative h-6 w-11 rounded-full transition ${checked ? 'bg-emerald-500' : 'bg-noir/15'}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  );
}

export function Empty({ children }) {
  return <div className="py-16 text-center text-sm text-mute">{children}</div>;
}
