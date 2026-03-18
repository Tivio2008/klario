'use client';

import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
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

function MagneticBtn({
  children,
  className,
  style,
  disabled,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 280, damping: 18 });
  const sy = useSpring(my, { stiffness: 280, damping: 18 });

  function onMove(e: React.MouseEvent<HTMLButtonElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left - r.width / 2) * 0.28);
    my.set((e.clientY - r.top - r.height / 2) * 0.28);
  }
  function onLeave() { mx.set(0); my.set(0); }

  return (
    <motion.button
      style={{ x: sx, y: sy, ...style }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      whileTap={{ scale: 0.96 }}
      className={className}
      disabled={disabled}
    >
      {children}
    </motion.button>
  );
}

export function HeroBlock({ content, theme, isPreview }: HeroBlockProps) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const parallaxY = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.6], [0, 0.4]);
  const noAnim = isPreview;

  const primary = theme?.primaryColor ?? '#c41e3a';
  const rgb = hexToRgb(primary);

  const whatsappUrl = content.whatsapp
    ? `https://wa.me/${content.whatsapp.replace(/\D/g, '')}`
    : null;

  const words = content.headline.split(' ');

  // Detect business type for themed animations
  const text = (content.headline + ' ' + content.subheadline).toLowerCase();
  const isItalian = text.includes('italian') || text.includes('italien') || text.includes('pizza') || text.includes('pasta');
  const isHair = text.includes('coiff') || text.includes('salon') || text.includes('hair');
  const isBakery = text.includes('boulang') || text.includes('pâtiss') || text.includes('bakery') || text.includes('croissant');

  return (
    <section ref={ref} className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">

      {/* Background image with parallax */}
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
          {/* Dark overlay — darker for readability */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to bottom, rgba(10,10,15,0.80) 0%, rgba(10,10,15,0.68) 50%, rgba(10,10,15,0.90) 100%)`,
            }}
          />
          {/* Brand color tint */}
          <div className="absolute inset-0" style={{ backgroundColor: `rgba(${rgb}, 0.10)` }} />
          {/* Scroll-triggered extra darkening */}
          {!noAnim && (
            <motion.div
              className="absolute inset-0 bg-[#0a0a0f]"
              style={{ opacity: overlayOpacity }}
            />
          )}
        </motion.div>
      )}

      {/* Fallback: animated gradient blobs */}
      {!content.backgroundImageUrl && (
        <div className="absolute inset-0 bg-[#0a0a0f]">
          <motion.div
            className="absolute w-[520px] h-[520px] rounded-full blur-3xl"
            style={{ backgroundColor: `rgba(${rgb}, 0.22)`, top: '5%', left: '10%' }}
            animate={noAnim ? {} : { x: [0, 40, 0], y: [0, -30, 0], scale: [1, 1.08, 1] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute w-[400px] h-[400px] rounded-full blur-3xl"
            style={{ backgroundColor: `rgba(${rgb}, 0.14)`, bottom: '10%', right: '8%' }}
            animate={noAnim ? {} : { x: [0, -30, 0], y: [0, 25, 0], scale: [1, 0.92, 1] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          />
          <motion.div
            className="absolute w-[280px] h-[280px] rounded-full blur-3xl"
            style={{ backgroundColor: `rgba(${rgb}, 0.10)`, top: '40%', right: '30%' }}
            animate={noAnim ? {} : { x: [0, 20, -20, 0], y: [0, -15, 15, 0], scale: [1, 1.1, 0.95, 1] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
          />
        </div>
      )}

      <div className="absolute inset-0 grid-bg opacity-[0.07]" />

      {/* Themed entrance animations */}
      {!noAnim && isItalian && (
        <div className="absolute inset-0 pointer-events-none z-[5]">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ y: -100, x: Math.random() * window.innerWidth, rotate: 0, opacity: 0.8 }}
              animate={{
                y: window.innerHeight + 100,
                rotate: 360 * 3,
                opacity: [0.8, 0.6, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                delay: i * 0.2,
                ease: 'linear',
              }}
              className="absolute text-6xl"
              style={{ left: `${Math.random() * 100}%` }}
            >
              🍝
            </motion.div>
          ))}
        </div>
      )}
      {!noAnim && isHair && (
        <motion.div
          initial={{ scale: 3, opacity: 0, rotate: -45 }}
          animate={{ scale: 1, opacity: [0, 0.3, 0], rotate: 0 }}
          transition={{ duration: 1.5, times: [0, 0.5, 1] }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-[5]"
        >
          <div className="text-[20rem] opacity-10">✂️</div>
        </motion.div>
      )}
      {!noAnim && isBakery && (
        <motion.div
          initial={{ x: -200, rotate: -180, scale: 2 }}
          animate={{ x: window.innerWidth + 200, rotate: 360 * 4, scale: 1 }}
          transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
          className="absolute top-1/4 left-0 text-8xl pointer-events-none z-[5] opacity-40"
        >
          🥐
        </motion.div>
      )}

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

        {/* Word-by-word headline reveal — bigger, bolder */}
        <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold mb-8 leading-[0.95] text-white tracking-tight">
          {noAnim
            ? content.headline
            : words.map((word, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{
                    duration: 0.7,
                    delay: 0.15 + i * 0.09,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="inline-block mr-[0.28em]"
                >
                  {word}
                </motion.span>
              ))}
        </h1>

        <motion.p
          initial={noAnim ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.3 + words.length * 0.06, ease: [0.16, 1, 0.3, 1] }}
          className="text-xl md:text-2xl text-white mb-12 max-w-3xl mx-auto leading-relaxed font-light"
          style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}
        >
          {content.subheadline}
        </motion.p>

        <motion.div
          initial={noAnim ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 + words.length * 0.06 }}
          className="flex items-center justify-center gap-4 flex-wrap"
        >
          {noAnim ? (
            <button
              className="px-8 py-3.5 rounded-xl text-white font-semibold text-lg transition-all"
              style={{ backgroundColor: primary }}
            >
              {content.ctaText}
            </button>
          ) : (
            <MagneticBtn
              className="px-8 py-3.5 rounded-xl text-white font-semibold text-lg transition-all relative overflow-hidden"
              style={{ backgroundColor: primary, boxShadow: `0 0 0 0 rgba(${rgb}, 0)` }}
            >
              <motion.span
                className="absolute inset-0 rounded-xl"
                animate={{ boxShadow: [`0 0 20px rgba(${rgb}, 0.3)`, `0 0 40px rgba(${rgb}, 0.5)`, `0 0 20px rgba(${rgb}, 0.3)`] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <span className="relative">{content.ctaText}</span>
            </MagneticBtn>
          )}

          {whatsappUrl && (
            <motion.a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={noAnim ? {} : { scale: 1.04, y: -2 }}
              className="px-7 py-3.5 rounded-xl border border-green-500/40 bg-green-500/10 hover:bg-green-500/20 text-green-300 font-semibold text-lg transition-all flex items-center gap-2.5"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 shrink-0">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              {content.ctaSecondaryText ?? 'WhatsApp'}
            </motion.a>
          )}

          {!whatsappUrl && content.ctaSecondaryText && (
            <motion.button
              whileHover={noAnim ? {} : { scale: 1.03, y: -2 }}
              className="px-8 py-3.5 rounded-xl border border-white/25 hover:border-white/50 text-white font-semibold text-lg transition-all hover:bg-white/5"
            >
              {content.ctaSecondaryText}
            </motion.button>
          )}
        </motion.div>
      </div>

      {!noAnim && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.8, repeat: Infinity }}
            className="w-px h-12 bg-gradient-to-b from-white/40 to-transparent mx-auto"
          />
        </motion.div>
      )}
    </section>
  );
}
