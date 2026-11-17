import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCart = create(persist((set, get) => ({
  items: [],
  open: false,
  setOpen: (open) => set({ open }),
  add: (p, qty = 1) => {
    const items = [...get().items];
    const i = items.findIndex((x) => x.product_id === p.id);
    if (i >= 0) items[i] = { ...items[i], qty: Math.min(20, items[i].qty + qty) };
    else items.push({ product_id: p.id, slug: p.slug, name: p.name, name_ar: p.name_ar, price: p.price, compare_price: p.compare_price, image: p.images?.[0], theme: p.theme, volume: p.volume, qty });
    set({ items, open: true });
  },
  setQty: (id, qty) => set({ items: get().items.map((x) => (x.product_id === id ? { ...x, qty: Math.max(1, Math.min(20, qty)) } : x)) }),
  remove: (id) => set({ items: get().items.filter((x) => x.product_id !== id) }),
  clear: () => set({ items: [] }),
}), { name: 'tq_cart', partialize: (s) => ({ items: s.items }) }));

export const cartCount = (items) => items.reduce((s, x) => s + x.qty, 0);
export const cartTotal = (items) => items.reduce((s, x) => s + x.qty * x.price, 0);
