'use client';

import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useRef, useState, useEffect, useCallback } from 'react';
import type { TestimonialsContent } from '@/lib/types';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';

interface TestimonialsBlockProps {
  content: TestimonialsContent;
  isPreview?: boolean;
}

function StarRow({ rating, delay = 0, animate }: { rating: number; delay?: number; animate: boolean }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, j) => (
        <motion.div
          key={j}
          initial={animate ? { opacity: 0, scale: 0 } : false}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: delay + j * 0.06, type: 'spring', stiffness: 400, damping: 15 }}
        >
          <Star className={`h-4 w-4 ${j < rating ? 'fill-amber-400 text-amber-400' : 'text-gray-700'}`} />
        </motion.div>
      ))}
    </div>
  );
}

export function TestimonialsBlock({ content, isPreview }: TestimonialsBlockProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [active, setActive] = useState(0);
  const [dir, setDir] = useState(1);
  const total = content.testimonials.length;

  const go = useCallback((next: number, direction: number) => {
    setDir(direction);
    setActive(((next % total) + total) % total);
  }, [total]);

  // Auto-rotate every 5 s (only when not in builder editor)
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

  return (
    <section className="py-24 px-6 relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #0a0a0f 0%, #0d0d1a 100%)' }}
      ref={ref}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ opacity: [0.08, 0.14, 0.08] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-purple-600/20 blur-3xl rounded-full"
        />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={isPreview ? false : { opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-3 gradient-text">{content.headline}</h2>
          {content.subheadline && <p className="text-xl text-gray-400">{content.subheadline}</p>}
        </motion.div>

        {/* Carousel */}
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
                <Quote className="absolute top-6 right-6 h-10 w-10 text-purple-500/10" />

                {t.rating && (
                  <div className="mb-5">
                    <StarRow rating={t.rating} animate={inView} delay={0.1} />
                  </div>
                )}

                <blockquote className="text-xl md:text-2xl text-white font-medium leading-relaxed mb-8 italic">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>

                <div className="flex items-center gap-4">
                  <motion.div
                    whileHover={isPreview ? {} : { scale: 1.08 }}
                    className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold text-lg shrink-0"
                  >
                    {t.name.charAt(0)}
                  </motion.div>
                  <div>
                    <div className="text-white font-semibold">{t.name}</div>
                    <div className="text-gray-400 text-sm">{t.role}{t.company ? `, ${t.company}` : ''}</div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Nav arrows */}
          {total > 1 && (
            <>
              <button
                onClick={() => go(active - 1, -1)}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 h-10 w-10 rounded-full glass border border-[var(--border)] flex items-center justify-center text-gray-400 hover:text-white hover:border-purple-500/50 transition-all"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => go(active + 1, 1)}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 h-10 w-10 rounded-full glass border border-[var(--border)] flex items-center justify-center text-gray-400 hover:text-white hover:border-purple-500/50 transition-all"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        {/* Dots */}
        {total > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {content.testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => go(i, i > active ? 1 : -1)}
                className={`rounded-full transition-all duration-300 ${
                  i === active
                    ? 'w-8 h-2 bg-purple-500'
                    : 'w-2 h-2 bg-gray-600 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        )}

        {/* All testimonials grid — shown below carousel when ≥3 reviews */}
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
                whileHover={isPreview ? {} : { y: -4, borderColor: 'rgba(139,92,246,0.4)' }}
                className={`glass rounded-xl p-4 text-left transition-colors duration-200 ${
                  i === active ? 'border-purple-500/50 bg-purple-500/5' : ''
                }`}
              >
                <div className="flex gap-0.5 mb-2">
                  {Array.from({ length: testimonial.rating ?? 5 }).map((_, j) => (
                    <Star key={j} className="h-3 w-3 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-300 text-xs line-clamp-2 italic mb-2">&ldquo;{testimonial.quote}&rdquo;</p>
                <span className="text-xs text-gray-500">{testimonial.name}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
