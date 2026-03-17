'use client';

import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useRef, useState } from 'react';
import type { GalleryContent, SiteTheme } from '@/lib/types';
import { X, ZoomIn } from 'lucide-react';

interface GalleryBlockProps {
  content: GalleryContent;
  theme?: SiteTheme;
  isPreview?: boolean;
}

export function GalleryBlock({ content, theme, isPreview }: GalleryBlockProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [lightbox, setLightbox] = useState<string | null>(null);

  const cols = content.columns ?? 3;
  const gridClass = cols === 2 ? 'grid-cols-2' : cols === 4 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-3';

  if (!content.photos || content.photos.length === 0) return null;

  return (
    <section className="py-24 px-6" style={{ background: '#0a0a0f' }}>
      <div className="max-w-6xl mx-auto" ref={ref}>
        {(content.headline || content.subheadline) && (
          <motion.div
            initial={isPreview ? false : { opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            className="text-center mb-12"
          >
            {content.headline && (
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-3">{content.headline}</h2>
            )}
            {content.subheadline && (
              <p className="text-gray-400 text-lg max-w-xl mx-auto">{content.subheadline}</p>
            )}
          </motion.div>
        )}

        <div className={`grid ${gridClass} gap-3`}>
          {content.photos.map((src, i) => (
            <motion.div
              key={i}
              initial={isPreview ? false : { opacity: 0, scale: 0.95 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: i * 0.07, duration: 0.5 }}
              className="relative group cursor-pointer overflow-hidden rounded-xl aspect-square"
              onClick={() => !isPreview && setLightbox(src)}
            >
              <img
                src={src}
                alt=""
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightbox(null)}
          >
            <button
              className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
              onClick={() => setLightbox(null)}
            >
              <X className="h-8 w-8" />
            </button>
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={lightbox}
              alt=""
              className="max-w-full max-h-[90vh] object-contain rounded-xl"
              onClick={e => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
