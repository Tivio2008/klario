'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import type { FeaturesContent } from '@/lib/types';

interface FeaturesBlockProps {
  content: FeaturesContent;
  isPreview?: boolean;
}

export function FeaturesBlock({ content, isPreview }: FeaturesBlockProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const cols = content.columns || 3;
  const gridClass = { 2: 'md:grid-cols-2', 3: 'md:grid-cols-2 lg:grid-cols-3', 4: 'md:grid-cols-2 lg:grid-cols-4' }[cols];

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
  };
  const item = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
  };

  return (
    <section className="py-24 px-6 bg-[#0a0a0f]" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={isPreview ? false : { opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">{content.headline}</h2>
          {content.subheadline && <p className="text-xl text-gray-400 max-w-2xl mx-auto">{content.subheadline}</p>}
        </motion.div>

        <motion.div
          variants={isPreview ? {} : container}
          initial={isPreview ? false : 'hidden'}
          animate={inView ? 'show' : 'hidden'}
          className={`grid grid-cols-1 ${gridClass} gap-6`}
        >
          {content.features.map((feature, i) => (
            <motion.div
              key={i}
              variants={isPreview ? {} : item}
              whileHover={isPreview ? {} : { y: -6, borderColor: 'rgba(139,92,246,0.4)' }}
              className="glass rounded-2xl p-6 transition-colors duration-300 cursor-default"
            >
              <motion.div
                animate={isPreview ? {} : { rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: i * 0.3 }}
                className="text-4xl mb-4 inline-block"
              >
                {feature.icon}
              </motion.div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
