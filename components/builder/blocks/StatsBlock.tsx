'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import type { StatsContent, StatItem, SiteTheme } from '@/lib/types';

interface StatsBlockProps {
  content: StatsContent;
  theme?: SiteTheme;
  isPreview?: boolean;
}

function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  return `${parseInt(clean.slice(0,2),16)}, ${parseInt(clean.slice(2,4),16)}, ${parseInt(clean.slice(4,6),16)}`;
}

function AnimatedStat({ item, trigger, isPreview, primary }: { item: StatItem; trigger: boolean; isPreview?: boolean; primary: string }) {
  const numericTarget = parseFloat(item.value.replace(/[^0-9.]/g, '')) || 0;
  const isDecimal = item.value.includes('.');
  const [count, setCount] = useState(isPreview ? numericTarget : 0);
  const rafRef = useRef<number | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!trigger || startedRef.current || isPreview) return;
    startedRef.current = true;
    const duration = 1800;
    const startTime = performance.now();
    function easeOut(t: number) { return 1 - Math.pow(1 - t, 3); }
    function frame(now: number) {
      const progress = Math.min((now - startTime) / duration, 1);
      const val = easeOut(progress) * numericTarget;
      setCount(isDecimal ? Math.round(val * 10) / 10 : Math.round(val));
      if (progress < 1) rafRef.current = requestAnimationFrame(frame);
    }
    rafRef.current = requestAnimationFrame(frame);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [trigger]);

  const display = isDecimal ? count.toFixed(1) : count.toLocaleString();

  return (
    <div className="text-center">
      <div className="text-5xl md:text-6xl font-bold text-white mb-2 tabular-nums">
        {item.prefix && <span style={{ color: primary }}>{item.prefix}</span>}
        {display}
        {item.suffix && <span style={{ color: primary }}>{item.suffix}</span>}
      </div>
      <div className="text-gray-300 text-sm font-medium uppercase tracking-wider">{item.label}</div>
    </div>
  );
}

export function StatsBlock({ content, theme, isPreview }: StatsBlockProps) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const primary = theme?.primaryColor ?? '#c41e3a';
  const rgb = hexToRgb(primary);

  return (
    <section ref={ref} className="py-20 px-6 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0d0d1a 0%, #0a0a14 100%)' }}>
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-40 blur-3xl rounded-full opacity-20"
          style={{ backgroundColor: `rgba(${rgb}, 0.6)` }}
        />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        {(content.headline || content.subheadline) && (
          <motion.div
            initial={isPreview ? false : { opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            className="text-center mb-14"
          >
            {content.headline && <h2 className="text-4xl font-bold text-white mb-3">{content.headline}</h2>}
            {content.subheadline && <p className="text-gray-300">{content.subheadline}</p>}
          </motion.div>
        )}

        <div className={`grid gap-10 ${
          content.stats.length <= 2 ? 'grid-cols-2' :
          content.stats.length === 3 ? 'grid-cols-3' : 'grid-cols-2 md:grid-cols-4'
        }`}>
          {content.stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={isPreview ? false : { opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.12, duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] }}
            >
              <AnimatedStat item={stat} trigger={inView} isPreview={isPreview} primary={primary} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
