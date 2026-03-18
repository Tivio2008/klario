'use client';

import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useRef, useState, useEffect, useCallback } from 'react';
import type { TestimonialsContent, SiteTheme } from '@/lib/types';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';

interface TestimonialsBlockProps {
  content: TestimonialsContent;
  theme?: SiteTheme;
  isPreview?: boolean;
}

function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  return `${parseInt(clean.slice(0,2),16)}, ${parseInt(clean.slice(2,4),16)}, ${parseInt(clean.slice(4,6),16)}`;
}

export function TestimonialsBlock({ content, theme, isPreview }: TestimonialsBlockProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [active, setActive] = useState(0);
  const [dir, setDir] = useState(1);
  const total = content.testimonials.length;
  const primary = theme?.primaryColor ?? '#c41e3a';
  const rgb = hexToRgb(primary);

  const go = useCallback((next: number, direction: number) => {
    setDir(direction);
    setActive(((next % total) + total) % total);
  }, [total]);

  useEffect(() => {
    if (total <= 1) return;
    const id = setInterval(() => go(active + 1, 1), 5000);
    return () => clearInterval(id);
  }, [active, total, go]);

  const variants = {
    enter: (d: number) => ({ opacity: 0, x: d > 0 ? 80 : -80 }),
    center: { opacity: 1, x: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] } },
    exit: (d: number) => ({ opacity: 0, x: d > 0 ? -80 : 80, transition: { duration: 0.3 } }),
  };

  const t = content.testimonials[active];
  if (!t) return null;

  const words = content.headline.split(' ');

  return (
    <section className="py-24 px-6 relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #0a0a0f 0%, #0d0d1a 100%)' }}
      ref={ref}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] blur-3xl rounded-full opacity-10"
          style={{ backgroundColor: `rgba(${rgb}, 0.8)` }}
        />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={isPreview ? false : { opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <div className="inline-block w-10 h-0.5 rounded-full mb-6" style={{ backgroundColor: primary }} />
          <h2 className="text-4xl md:text-5xl font-bold mb-3 text-white">
            {isPreview
              ? content.headline
              : words.map((word, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 25, filter: 'blur(5px)' }}
                    animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
                    transition={{ duration: 0.55, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                    className="inline-block mr-[0.25em]"
                  >
                    {word}
                  </motion.span>
                ))}
          </h2>
          {content.subheadline && <p className="text-lg text-gray-300">{content.subheadline}</p>}
        </motion.div>

        <div className="relative">
          <div className="overflow-hidden rounded-2xl">
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div
                key={active}
                custom={dir}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                className="glass rounded-2xl p-8 md:p-10 relative"
              >
                <Quote className="absolute top-6 right-6 h-10 w-10 opacity-5 text-white" />

                {t.rating && (
                  <div className="flex gap-1 mb-5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className={`h-4 w-4 ${j < t.rating! ? 'fill-amber-400 text-amber-400' : 'text-gray-700'}`} />
                    ))}
                  </div>
                )}

                <blockquote className="text-xl md:text-2xl text-white font-medium leading-relaxed mb-8 italic">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>

                <div className="flex items-center gap-4">
                  <div
                    className="h-11 w-11 rounded-full flex items-center justify-center text-white font-bold text-base shrink-0"
                    style={{ backgroundColor: `rgba(${rgb}, 0.2)`, border: `1px solid rgba(${rgb}, 0.3)`, color: primary }}
                  >
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-white font-semibold">{t.name}</div>
                    <div className="text-gray-300 text-sm">{t.role}{t.company ? `, ${t.company}` : ''}</div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {total > 1 && (
            <>
              <button
                onClick={() => go(active - 1, -1)}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 h-10 w-10 rounded-full glass border border-[var(--border)] flex items-center justify-center text-gray-400 hover:text-white transition-all"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => go(active + 1, 1)}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 h-10 w-10 rounded-full glass border border-[var(--border)] flex items-center justify-center text-gray-400 hover:text-white transition-all"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        {total > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {content.testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => go(i, i > active ? 1 : -1)}
                className="rounded-full transition-all duration-300"
                style={i === active
                  ? { width: '2rem', height: '0.5rem', backgroundColor: primary }
                  : { width: '0.5rem', height: '0.5rem', backgroundColor: '#4b5563' }
                }
              />
            ))}
          </div>
        )}

        {total >= 3 && (
          <motion.div
            initial={isPreview ? false : { opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12"
          >
            {content.testimonials.map((testimonial, i) => (
              <motion.button
                key={i}
                onClick={() => go(i, i > active ? 1 : -1)}
                whileHover={isPreview ? {} : {
                  y: -4,
                  boxShadow: `0 8px 30px rgba(${rgb}, 0.15)`,
                }}
                className="glass rounded-xl p-4 text-left transition-all duration-200"
                style={i === active ? { borderColor: `rgba(${rgb}, 0.4)`, backgroundColor: `rgba(${rgb}, 0.06)` } : {}}
              >
                <div className="flex gap-0.5 mb-2">
                  {Array.from({ length: testimonial.rating ?? 5 }).map((_, j) => (
                    <Star key={j} className="h-3 w-3 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-200 text-xs line-clamp-2 italic mb-2">&ldquo;{testimonial.quote}&rdquo;</p>
                <span className="text-xs text-gray-400">{testimonial.name}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
