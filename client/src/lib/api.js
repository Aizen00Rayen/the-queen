const TOKEN_KEY = 'tq_admin_token';
export const getToken = () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } };
export const setToken = (t) => { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch {} };

export async function api(path, { method = 'GET', body, admin = false, raw = false } = {}) {
  const headers = {};
  if (body && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';
  if (admin) { const t = getToken(); if (t) headers.Authorization = `Bearer ${t}`; }
  const res = await fetch(`/api${admin ? '/admin' : ''}${path}`, {
    method, headers, body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });
  if (raw) return res;
  let data = null;
  try { data = await res.json(); } catch {}
  if (!res.ok) {
    if (res.status === 401 && admin) { setToken(null); if (!location.pathname.endsWith('/login')) location.href = '/admin/login'; }
    const err = new Error(data?.error || `Erreur ${res.status}`);
    err.status = res.status; err.field = data?.field;
    throw err;
  }
  return data;
}
export const adminApi = (path, opts = {}) => api(path, { ...opts, admin: true });
