export const money = (n, lang = 'fr') => {
  const v = new Intl.NumberFormat('fr-FR').format(Math.round(n || 0)).replace(/ | /g, ' ');
  return lang === 'ar' ? `${v} دج` : `${v} DA`;
};
export const pct = (price, compare) => (compare && compare > price ? Math.round(((compare - price) / compare) * 100) : 0);
export const dateFr = (s, withTime = true) => {
  if (!s) return '';
  const d = new Date(s.includes('T') ? s : s.replace(' ', 'T') + 'Z');
  return d.toLocaleString('fr-FR', withTime ? { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' } : { day: '2-digit', month: 'short', year: 'numeric' });
};
export const THEMES = {
  amber: { accent: '#E8781E', soft: '#FCE3C8', deep: '#8A3B05', glow: 'rgba(232,120,30,.45)', bg: 'linear-gradient(160deg,#FFF4E6 0%,#FBD9B0 55%,#F2A65A 100%)', label: 'Vitamine C' },
  azure: { accent: '#2A8FD8', soft: '#D6ECFB', deep: '#0B4A7A', glow: 'rgba(42,143,216,.42)', bg: 'linear-gradient(160deg,#F0F8FF 0%,#C9E5FA 55%,#6FB5E8 100%)', label: 'Hyaluronique' },
  gold: { accent: '#C9A66B', soft: '#F3E6C8', deep: '#5E4520', glow: 'rgba(201,166,107,.5)', bg: 'linear-gradient(160deg,#FBF6EC 0%,#EEDDB8 55%,#C9A66B 100%)', label: 'Duo' },
};
export const theme = (t) => THEMES[t] || THEMES.gold;
