import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import { motion, useMotionValue, useSpring, useScroll } from 'framer-motion';

let lenisInstance = null;
export const getLenis = () => lenisInstance;

/** Buttery smooth scrolling + scroll-to-top on route change */
export function SmoothScroll() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    lenisInstance = lenis;
    let raf;
    const loop = (t) => { lenis.raf(t); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); lenis.destroy(); lenisInstance = null; };
  }, []);
  useEffect(() => {
    window.scrollTo(0, 0);
    if (lenisInstance) { lenisInstance.start(); lenisInstance.scrollTo(0, { immediate: true, force: true }); }
    // re-assert after the drawer/menu close animations restart Lenis
    const t = setTimeout(() => { if (lenisInstance) lenisInstance.scrollTo(0, { immediate: true, force: true }); else window.scrollTo(0, 0); }, 80);
    return () => clearTimeout(t);
  }, [pathname]);
  return null;
}

/** Custom golden cursor ring that grows on interactive elements */
export function Cursor() {
  const x = useMotionValue(-100), y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 500, damping: 40 }), sy = useSpring(y, { stiffness: 500, damping: 40 });
  const scale = useSpring(1, { stiffness: 300, damping: 25 });
  const ref = useRef(null);
  useEffect(() => {
    if (matchMedia('(hover: none)').matches) return;
    const move = (e) => { x.set(e.clientX); y.set(e.clientY); };
    const over = (e) => { scale.set(e.target.closest('a,button,[data-cursor],input,select,textarea,label') ? 2.6 : 1); };
    addEventListener('pointermove', move); addEventListener('pointerover', over);
    return () => { removeEventListener('pointermove', move); removeEventListener('pointerover', over); };
  }, [x, y, scale]);
  return (
    <motion.div ref={ref} className="q-cursor" style={{ x: sx, y: sy }}>
      <motion.div style={{ scale }} className="-ml-[9px] -mt-[9px] h-[18px] w-[18px] rounded-full border border-[#F3E6C8] bg-[#F3E6C8]/10" />
    </motion.div>
  );
}

/** Thin gold reading-progress bar */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  return <motion.div style={{ scaleX }} className="fixed inset-x-0 top-0 z-[70] h-[2px] origin-left bg-gradient-to-r from-gold-deep via-gold-light to-gold" />;
}
