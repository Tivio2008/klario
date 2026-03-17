'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import type { ContactContent, SiteTheme } from '@/lib/types';
import { Mail, Phone, MapPin, MessageCircle } from 'lucide-react';

interface ContactBlockProps {
  content: ContactContent;
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

export function ContactBlock({ content, theme, isPreview }: ContactBlockProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const primary = theme?.primaryColor ?? '#e85d26';
  const rgb = hexToRgb(primary);

  const whatsappUrl = content.whatsapp
    ? `https://wa.me/${content.whatsapp.replace(/\D/g, '')}`
    : null;

  return (
    <section className="py-24 px-6" style={{ background: 'linear-gradient(180deg, #0a0a0f 0%, #0d0d1a 100%)' }} ref={ref}>
      <div className="max-w-5xl mx-auto">
        <div className={`grid ${content.variant === 'split' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 max-w-2xl mx-auto'} gap-12`}>
          <motion.div
            initial={isPreview ? false : { opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] }}
          >
            <div className="inline-block w-12 h-1 rounded-full mb-6" style={{ backgroundColor: primary }} />
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">{content.headline}</h2>
            {content.subheadline && <p className="text-gray-400 mb-8">{content.subheadline}</p>}

            <div className="flex flex-col gap-4 mb-8">
              {content.email && (
                <motion.a
                  href={`mailto:${content.email}`}
                  initial={isPreview ? false : { opacity: 0, x: -15 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.15 }}
                  className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors group"
                >
                  <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `rgba(${rgb}, 0.15)` }}>
                    <Mail className="h-4 w-4" style={{ color: primary }} />
                  </div>
                  <span>{content.email}</span>
                </motion.a>
              )}
              {content.phone && (
                <motion.a
                  href={`tel:${content.phone}`}
                  initial={isPreview ? false : { opacity: 0, x: -15 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors"
                >
                  <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `rgba(${rgb}, 0.15)` }}>
                    <Phone className="h-4 w-4" style={{ color: primary }} />
                  </div>
                  <span>{content.phone}</span>
                </motion.a>
              )}
              {content.address && (
                <motion.div
                  initial={isPreview ? false : { opacity: 0, x: -15 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.25 }}
                  className="flex items-start gap-3 text-gray-300"
                >
                  <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: `rgba(${rgb}, 0.15)` }}>
                    <MapPin className="h-4 w-4" style={{ color: primary }} />
                  </div>
                  <span className="leading-relaxed">{content.address}</span>
                </motion.div>
              )}
            </div>

            {/* WhatsApp CTA */}
            {whatsappUrl && (
              <motion.a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                initial={isPreview ? false : { opacity: 0, y: 15 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.35 }}
                whileHover={isPreview ? {} : { scale: 1.03 }}
                className="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl bg-green-600/20 border border-green-500/30 text-green-300 hover:bg-green-600/30 transition-all font-medium"
              >
                <MessageCircle className="h-5 w-5" />
                Contacter sur WhatsApp
              </motion.a>
            )}

            {/* Google Maps embed */}
            {content.mapsUrl && (
              <motion.div
                initial={isPreview ? false : { opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.4 }}
                className="mt-8 rounded-2xl overflow-hidden border border-white/10"
              >
                <iframe
                  src={content.mapsUrl}
                  width="100%"
                  height="220"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </motion.div>
            )}
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
                  <label className="text-sm text-gray-300 mb-1.5 block">Nom</label>
                  <input className="w-full h-10 rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 transition-all" style={{ '--tw-ring-color': `rgba(${rgb}, 0.4)` } as React.CSSProperties} placeholder="Votre nom" readOnly={isPreview} />
                </div>
                <div>
                  <label className="text-sm text-gray-300 mb-1.5 block">E-mail</label>
                  <input className="w-full h-10 rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 transition-all" placeholder="votre@email.com" readOnly={isPreview} />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-1.5 block">Message</label>
                <textarea className="w-full rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 resize-none" rows={4} placeholder="Votre message..." readOnly={isPreview} />
              </div>
              <motion.button
                whileHover={isPreview ? {} : { scale: 1.02, boxShadow: `0 0 20px rgba(${rgb}, 0.4)` }}
                whileTap={isPreview ? {} : { scale: 0.98 }}
                className="w-full py-2.5 rounded-xl text-white font-semibold transition-all"
                style={{ backgroundColor: primary }}
              >
                Envoyer le message
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
