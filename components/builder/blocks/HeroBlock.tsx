'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import type { HeroContent } from '@/lib/types';

interface HeroBlockProps {
  content: HeroContent;
  theme?: { primaryColor?: string };
  isPreview?: boolean;
}

const gradients: Record<string, string> = {
  'purple-blue': 'from-purple-900/50 via-indigo-900/30 to-blue-900/50',
  'amber-red': 'from-amber-900/50 via-orange-900/30 to-red-900/50',
  'teal-blue': 'from-teal-900/50 via-cyan-900/30 to-blue-900/50',
  'default': 'from-purple-900/50 via-indigo-900/30 to-blue-900/50',
};

export function HeroBlock({ content, isPreview }: HeroBlockProps) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const parallaxY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const fadeOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const noAnim = isPreview;
  const gradient = gradients[content.bgGradient || 'default'];

  return (
    <section ref={ref} className={`relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-br ${gradient}`}>
      {/* Parallax orb layer */}
      <motion.div style={noAnim ? {} : { y: parallaxY }} className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={noAnim ? {} : { y: [0, -20, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/25 rounded-full blur-3xl"
        />
        <motion.div
          animate={noAnim ? {} : { y: [0, 15, 0], x: [0, 10, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-600/25 rounded-full blur-3xl"
        />
        <motion.div
          animate={noAnim ? {} : { scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-3xl"
        />
      </motion.div>

      <div className="absolute inset-0 grid-bg opacity-20" />

      <motion.div
        style={noAnim ? {} : { opacity: fadeOpacity }}
        className="relative z-10 max-w-5xl mx-auto px-6 text-center"
      >
        {content.badge && (
          <motion.div
            initial={noAnim ? false : { opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] as [number,number,number,number] }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-sm font-medium mb-6"
          >
            <motion.span
              animate={noAnim ? {} : { opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="h-1.5 w-1.5 rounded-full bg-purple-400"
            />
            {content.badge}
          </motion.div>
        )}

        <motion.h1
          initial={noAnim ? false : { opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] }}
          className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
        >
          <span className="gradient-text">{content.headline}</span>
        </motion.h1>

        <motion.p
          initial={noAnim ? false : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] }}
          className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed"
        >
          {content.subheadline}
        </motion.p>

        <motion.div
          initial={noAnim ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex items-center justify-center gap-4 flex-wrap"
        >
          <motion.button
            whileHover={noAnim ? {} : { scale: 1.05, boxShadow: '0 0 35px rgba(124,58,237,0.55)' }}
            whileTap={noAnim ? {} : { scale: 0.97 }}
            className="px-8 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-lg transition-colors"
          >
            {content.ctaText}
          </motion.button>
          {content.ctaSecondaryText && (
            <motion.button
              whileHover={noAnim ? {} : { scale: 1.03 }}
              whileTap={noAnim ? {} : { scale: 0.97 }}
              className="px-8 py-3.5 rounded-xl border border-white/20 hover:border-white/40 text-white font-semibold text-lg transition-all hover:bg-white/5"
            >
              {content.ctaSecondaryText}
            </motion.button>
          )}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      {!noAnim && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-px h-10 bg-gradient-to-b from-white/40 to-transparent mx-auto"
          />
        </motion.div>
      )}
    </section>
  );
}
