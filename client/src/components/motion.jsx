import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useMotionValue, useSpring, animate } from 'framer-motion';

export const ease = [0.16, 1, 0.3, 1];

/** Fade + rise when scrolled into view */
export function Reveal({ children, delay = 0, y = 40, className = '', as = 'div', once = true }) {
  const M = motion[as] || motion.div;
  return (
    <M className={className} initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once, margin: '-10% 0px' }}
      transition={{ duration: 1.1, ease, delay }}>
      {children}
    </M>
  );
}

/** Masked line-by-line / word reveal for big display titles */
export function SplitReveal({ text, className = '', inner = '', delay = 0, stagger = 0.06, by = 'word', immediate = false }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  const show = immediate || inView;
  const parts = by === 'char' ? Array.from(text) : text.split(' ');
  return (
    <span ref={ref} className={className} aria-label={text}>
      {parts.map((p, i) => (
        <span key={i} aria-hidden className="inline-block overflow-hidden pb-[0.08em] align-bottom">
          <motion.span className={`inline-block will-change-transform ${inner}`}
            initial={{ y: '110%', rotate: 4 }} animate={show ? { y: '0%', rotate: 0 } : {}}
            transition={{ duration: 1.2, ease, delay: delay + i * stagger }}>
            {p === ' ' ? ' ' : p}{by === 'word' && i < parts.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

/** Element gently follows the cursor while hovered */
export function Magnetic({ children, strength = 0.35, className = '' }) {
  const ref = useRef(null);
  const x = useSpring(useMotionValue(0), { stiffness: 200, damping: 15 });
  const y = useSpring(useMotionValue(0), { stiffness: 200, damping: 15 });
  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  return (
    <motion.div ref={ref} style={{ x, y }} className={`inline-block ${className}`} onMouseMove={onMove} onMouseLeave={() => { x.set(0); y.set(0); }}>
      {children}
    </motion.div>
  );
}

/** Animated number counter */
export function Counter({ to, prefix = '', suffix = '', duration = 2.2, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const c = animate(0, to, { duration, ease, onUpdate: (n) => setV(Math.round(n)) });
    return () => c.stop();
  }, [inView, to, duration]);
  return <span ref={ref} className={className}>{prefix}{v}{suffix}</span>;
}

/** Infinite marquee */
export function Marquee({ items, className = '', speed = 38, separator = '✦' }) {
  const row = (
    <div className="flex shrink-0 items-center">
      {items.map((t, i) => (
        <span key={i} className="flex items-center whitespace-nowrap">
          <span className="px-8">{t}</span><span className="text-gold">{separator}</span>
        </span>
      ))}
    </div>
  );
  return (
    <div className={`relative flex overflow-hidden ${className}`} dir="ltr">
      <div className="flex animate-marquee" style={{ '--marquee-speed': `${speed}s` }}>{row}{row}{row}{row}</div>
    </div>
  );
}

/** 3D tilt on mouse */
export function Tilt({ children, className = '', max = 10 }) {
  const rx = useSpring(0, { stiffness: 120, damping: 14 });
  const ry = useSpring(0, { stiffness: 120, damping: 14 });
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    ry.set(((e.clientX - r.left) / r.width - 0.5) * max * 2);
    rx.set(-((e.clientY - r.top) / r.height - 0.5) * max * 2);
  };
  return (
    <motion.div className={className} style={{ rotateX: rx, rotateY: ry, transformPerspective: 1000 }} onMouseMove={onMove} onMouseLeave={() => { rx.set(0); ry.set(0); }}>
      {children}
    </motion.div>
  );
}
