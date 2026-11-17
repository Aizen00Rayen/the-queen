import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ease } from './motion';

/** Original "theQueen" wordmark (upscaled from the old site), in noir / ivory / gold */
export function Logo({ variant = 'black', className = 'h-7' }) {
  return <img src={`/brand/logo-${variant}.png`} alt="The Queen" className={`w-auto select-none ${className}`} draggable={false} />;
}

/** New crown-Q monogram for seals, loader and favicon */
export function Monogram({ className = 'h-12 w-12', draw = false, stroke = 'url(#qgold)' }) {
  const p = draw ? { initial: { pathLength: 0, opacity: 0 }, animate: { pathLength: 1, opacity: 1 }, transition: { duration: 1.6, ease } } : {};
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden>
      <defs>
        <linearGradient id="qgold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F3E6C8" /><stop offset=".5" stopColor="#C9A66B" /><stop offset="1" stopColor="#9C7A3F" />
        </linearGradient>
      </defs>
      <motion.path d="M19 22 L22 13 L27 18 L32 10 L37 18 L42 13 L45 22 Z" stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" {...p} />
      <motion.circle cx="32" cy="38" r="13" stroke={stroke} strokeWidth="1.6" {...p} />
      <motion.path d="M37 44 L47 54" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" {...p} />
      <motion.circle cx="32" cy="38" r="17.5" stroke={stroke} strokeWidth=".5" strokeDasharray="1 2.4" {...p} />
    </svg>
  );
}

/** Rotating circular text seal */
export function Seal({ text = 'THE QUEEN ✦ HAUTE DERMATOLOGIE ✦ ALGÉRIE ✦ ', className = 'h-32 w-32', color = '#C9A66B' }) {
  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full animate-spin-slow">
        <defs><path id="sealpath" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" /></defs>
        <text fill={color} fontSize="8.4" letterSpacing="2.6" fontFamily="Manrope" fontWeight="600">
          <textPath href="#sealpath">{text}</textPath>
        </text>
      </svg>
      <div className="absolute inset-0 grid place-items-center"><Monogram className="h-1/2 w-1/2" /></div>
    </div>
  );
}

/** First-load preloader: monogram draws itself, then curtain lifts */
export function Preloader() {
  const [show, setShow] = useState(() => { try { return !sessionStorage.getItem('tq_loaded'); } catch { return true; } });
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => { setShow(false); try { sessionStorage.setItem('tq_loaded', '1'); } catch {} }, 2100);
    return () => clearTimeout(t);
  }, [show]);
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="fixed inset-0 z-[100] grid place-items-center bg-noir" exit={{ clipPath: 'inset(0 0 100% 0)' }}
          initial={{ clipPath: 'inset(0 0 0% 0)' }} transition={{ duration: 1.1, ease }}>
          <div className="flex flex-col items-center gap-6">
            <Monogram className="h-24 w-24" draw />
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 1, ease }}>
              <Logo variant="gold" className="h-8" />
            </motion.div>
            <motion.div className="h-px w-40 origin-left bg-gradient-to-r from-transparent via-gold to-transparent"
              initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.8, ease }} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
