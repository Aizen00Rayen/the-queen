import { useEffect, useState } from 'react';
import { api } from './api';

const cache = new Map();
/** Tiny SWR-ish fetch hook with in-memory cache */
export function useApi(path, { skip = false } = {}) {
  const [state, setState] = useState(() => ({ data: cache.get(path), loading: !cache.has(path), error: null }));
  useEffect(() => {
    if (skip || !path) return;
    let alive = true;
    if (!cache.has(path)) setState((s) => ({ ...s, loading: true }));
    else setState({ data: cache.get(path), loading: false, error: null });
    api(path).then((d) => { cache.set(path, d); if (alive) setState({ data: d, loading: false, error: null }); })
      .catch((e) => alive && setState({ data: null, loading: false, error: e }));
    return () => { alive = false; };
  }, [path, skip]);
  return state;
}

export const useSettings = () => useApi('/settings').data || {};

export function useMedia(q) {
  const [m, setM] = useState(() => typeof window !== 'undefined' && matchMedia(q).matches);
  useEffect(() => { const mq = matchMedia(q); const f = () => setM(mq.matches); mq.addEventListener('change', f); return () => mq.removeEventListener('change', f); }, [q]);
  return m;
}
