'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import type { ContactContent } from '@/lib/types';
import { Mail, Phone, MapPin } from 'lucide-react';

interface ContactBlockProps {
  content: ContactContent;
  isPreview?: boolean;
}

export function ContactBlock({ content, isPreview }: ContactBlockProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className="py-24 px-6" style={{ background: 'linear-gradient(180deg, #0a0a0f 0%, #0d0d1a 100%)' }} ref={ref}>
      <div className="max-w-5xl mx-auto">
        <div className={`grid ${content.variant === 'split' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 max-w-2xl mx-auto'} gap-12`}>
          <motion.div
            initial={isPreview ? false : { opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">{content.headline}</h2>
            {content.subheadline && <p className="text-gray-400 mb-8">{content.subheadline}</p>}
            <div className="flex flex-col gap-4">
              {content.email && (
                <motion.div
                  initial={isPreview ? false : { opacity: 0, x: -15 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.15 }}
                  className="flex items-center gap-3 text-gray-300"
                >
                  <Mail className="h-5 w-5 text-purple-400" />
                  <span>{content.email}</span>
                </motion.div>
              )}
              {content.phone && (
                <motion.div
                  initial={isPreview ? false : { opacity: 0, x: -15 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-3 text-gray-300"
                >
                  <Phone className="h-5 w-5 text-purple-400" />
                  <span>{content.phone}</span>
                </motion.div>
              )}
              {content.address && (
                <motion.div
                  initial={isPreview ? false : { opacity: 0, x: -15 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.25 }}
                  className="flex items-center gap-3 text-gray-300"
                >
                  <MapPin className="h-5 w-5 text-purple-400" />
                  <span>{content.address}</span>
                </motion.div>
              )}
            </div>
          </motion.div>

          {content.showForm && (
            <motion.div
              initial={isPreview ? false : { opacity: 0, x: 30 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.65, delay: 0.1, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] }}
              className="glass rounded-2xl p-6 flex flex-col gap-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-300 mb-1.5 block">Name</label>
                  <input className="w-full h-10 rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50" placeholder="John Doe" readOnly={isPreview} />
                </div>
                <div>
                  <label className="text-sm text-gray-300 mb-1.5 block">Email</label>
                  <input className="w-full h-10 rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50" placeholder="john@email.com" readOnly={isPreview} />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-1.5 block">Message</label>
                <textarea className="w-full rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none" rows={4} placeholder="Tell us about your project..." readOnly={isPreview} />
              </div>
              <motion.button
                whileHover={isPreview ? {} : { scale: 1.02, boxShadow: '0 0 20px rgba(124,58,237,0.35)' }}
                whileTap={isPreview ? {} : { scale: 0.98 }}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-colors"
              >
                Send Message
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
