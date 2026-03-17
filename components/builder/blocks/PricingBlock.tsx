'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import type { PricingContent, SiteTheme } from '@/lib/types';
import { Check } from 'lucide-react';

interface PricingBlockProps {
  content: PricingContent;
  theme?: SiteTheme;
  isPreview?: boolean;
}

function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  return `${parseInt(clean.slice(0,2),16)}, ${parseInt(clean.slice(2,4),16)}, ${parseInt(clean.slice(4,6),16)}`;
}

export function PricingBlock({ content, theme, isPreview }: PricingBlockProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const primary = theme?.primaryColor ?? '#c41e3a';
  const rgb = hexToRgb(primary);

  return (
    <section className="py-24 px-6 bg-[#0a0a0f]" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={isPreview ? false : { opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-block w-10 h-0.5 rounded-full mb-6" style={{ backgroundColor: primary }} />
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">{content.headline}</h2>
          {content.subheadline && <p className="text-lg text-gray-400">{content.subheadline}</p>}
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {content.tiers.map((tier, i) => (
            <motion.div
              key={i}
              initial={isPreview ? false : { opacity: 0, y: 50, scale: 0.95 }}
              animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ duration: 0.55, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] }}
              whileHover={isPreview ? {} : { y: -8 }}
              className="relative rounded-2xl p-6 flex flex-col gap-5 transition-shadow duration-300 glass"
              style={tier.highlighted ? {
                background: `linear-gradient(to bottom, rgba(${rgb}, 0.12), rgba(${rgb}, 0.05))`,
                borderColor: `rgba(${rgb}, 0.4)`,
                borderWidth: '1.5px',
              } : {}}
            >
              {tier.highlighted && (
                <motion.div
                  initial={isPreview ? false : { opacity: 0, y: -10 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.4 }}
                  className="absolute -top-3 left-1/2 -translate-x-1/2"
                >
                  <span
                    className="px-3 py-1 rounded-full text-white text-xs font-semibold shadow-lg"
                    style={{ backgroundColor: primary }}
                  >
                    Recommandé
                  </span>
                </motion.div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-white mb-1">{tier.name}</h3>
                <p className="text-gray-400 text-sm">{tier.description}</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">{tier.price}</span>
                {tier.period && <span className="text-gray-400">{tier.period}</span>}
              </div>

              <ul className="flex flex-col gap-2.5 flex-1">
                {tier.features.map((f, j) => (
                  <motion.li
                    key={j}
                    initial={isPreview ? false : { opacity: 0, x: -10 }}
                    animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.3 + i * 0.1 + j * 0.04 }}
                    className="flex items-center gap-2 text-sm text-gray-300"
                  >
                    <Check className="h-4 w-4 shrink-0" style={{ color: primary }} />
                    {f}
                  </motion.li>
                ))}
              </ul>

              <motion.button
                whileHover={isPreview ? {} : { scale: 1.02 }}
                whileTap={isPreview ? {} : { scale: 0.98 }}
                className="w-full py-2.5 rounded-xl font-semibold text-sm transition-all text-white"
                style={tier.highlighted
                  ? { backgroundColor: primary }
                  : { border: '1px solid rgba(255,255,255,0.15)', backgroundColor: 'transparent' }
                }
              >
                {tier.ctaText}
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
