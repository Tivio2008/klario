'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import type { HeroContent, SiteTheme } from '@/lib/types';

interface HeroBlockProps {
  content: HeroContent;
  theme?: SiteTheme;
  isPreview?: boolean;
}

function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

export function HeroBlock({ content, theme, isPreview }: HeroBlockProps) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const parallaxY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
  const noAnim = isPreview;

  const primary = theme?.primaryColor ?? '#c41e3a';
  const rgb = hexToRgb(primary);

  const whatsappUrl = content.whatsapp
    ? `https://wa.me/${content.whatsapp.replace(/\D/g, '')}`
    : null;

  return (
    <section ref={ref} className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background image */}
      {content.backgroundImageUrl && (
        <motion.div
          style={noAnim ? {} : { y: parallaxY }}
          className="absolute inset-0"
        >
          <img
            src={content.backgroundImageUrl}
            alt=""
            className="w-full h-full object-cover"
          />
          {/* Dark overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to bottom, rgba(10,10,15,0.72) 0%, rgba(10,10,15,0.55) 50%, rgba(10,10,15,0.82) 100%)`,
            }}
          />
          {/* Color tint from brand */}
          <div
            className="absolute inset-0"
            style={{ backgroundColor: `rgba(${rgb}, 0.12)` }}
          />
        </motion.div>
      )}

      {/* Fallback gradient when no image */}
      {!content.backgroundImageUrl && (
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at 30% 20%, rgba(${rgb}, 0.3) 0%, transparent 55%), radial-gradient(ellipse at 70% 80%, rgba(${rgb}, 0.18) 0%, transparent 50%), #0a0a0f`,
          }}
        />
      )}

      <div className="absolute inset-0 grid-bg opacity-10" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {content.badge && (
          <motion.div
            initial={noAnim ? false : { opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-medium mb-6"
            style={{ borderColor: `rgba(${rgb}, 0.5)`, backgroundColor: `rgba(${rgb}, 0.12)`, color: primary }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: primary }} />
            {content.badge}
          </motion.div>
        )}

        <motion.h1
          initial={noAnim ? false : { opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.1, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] }}
          className="text-5xl md:text-7xl font-bold mb-6 leading-tight text-white"
        >
          {content.headline}
        </motion.h1>

        <motion.p
          initial={noAnim ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.22, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] }}
          className="text-lg md:text-xl text-gray-200 mb-10 max-w-2xl mx-auto leading-relaxed"
        >
          {content.subheadline}
        </motion.p>

        <motion.div
          initial={noAnim ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.36 }}
          className="flex items-center justify-center gap-4 flex-wrap"
        >
          <motion.button
            whileHover={noAnim ? {} : { scale: 1.04, boxShadow: `0 0 32px rgba(${rgb}, 0.5)` }}
            whileTap={noAnim ? {} : { scale: 0.97 }}
            className="px-8 py-3.5 rounded-xl text-white font-semibold text-lg transition-all"
            style={{ backgroundColor: primary }}
          >
            {content.ctaText}
          </motion.button>

          {whatsappUrl && (
            <motion.a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={noAnim ? {} : { scale: 1.04 }}
              className="px-7 py-3.5 rounded-xl border border-green-500/40 bg-green-500/10 hover:bg-green-500/20 text-green-300 font-semibold text-lg transition-all flex items-center gap-2.5"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 shrink-0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              {content.ctaSecondaryText ?? 'WhatsApp'}
            </motion.a>
          )}

          {!whatsappUrl && content.ctaSecondaryText && (
            <motion.button
              whileHover={noAnim ? {} : { scale: 1.03 }}
              className="px-8 py-3.5 rounded-xl border border-white/25 hover:border-white/50 text-white font-semibold text-lg transition-all hover:bg-white/5"
            >
              {content.ctaSecondaryText}
            </motion.button>
          )}
        </motion.div>
      </div>

      {!noAnim && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-px h-10 bg-gradient-to-b from-white/30 to-transparent mx-auto"
          />
        </motion.div>
      )}
    </section>
  );
}
