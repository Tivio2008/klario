'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import type { AboutContent, SiteTheme } from '@/lib/types';
import {
  UtensilsCrossed, Coffee, Wine, ChefHat, Leaf, Flame,
  Scissors, Sparkles, Heart, Shield, Zap, Globe,
  Briefcase, Building2, Users, Calendar, Clock, MapPin,
  Star, Truck, Wrench, Phone, Mail, Camera,
  Music, BookOpen, Award, TrendingUp, Layers, Code,
  Home, Flower2, Package, Target,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  utensils: UtensilsCrossed, coffee: Coffee, wine: Wine, chef: ChefHat,
  salad: Leaf, fire: Flame, leaf: Leaf, flower: Flower2,
  scissors: Scissors, sparkles: Sparkles, heart: Heart, shield: Shield,
  zap: Zap, globe: Globe, briefcase: Briefcase, building: Building2,
  users: Users, calendar: Calendar, clock: Clock, pin: MapPin,
  star: Star, truck: Truck, wrench: Wrench, phone: Phone,
  mail: Mail, camera: Camera, music: Music, book: BookOpen,
  award: Award, chart: TrendingUp, layers: Layers, code: Code,
  home: Home, package: Package, target: Target,
};

interface AboutBlockProps {
  content: AboutContent;
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

export function AboutBlock({ content, theme, isPreview }: AboutBlockProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const primary = theme?.primaryColor ?? '#e85d26';
  const rgb = hexToRgb(primary);
  const split = content.variant === 'split' && content.imageUrl;

  const words = content.headline.split(' ');

  return (
    <section
      className="py-24 px-6"
      style={{ background: `linear-gradient(180deg, #0d0d1a 0%, #0a0a0f 100%)` }}
    >
      <div className="max-w-6xl mx-auto" ref={ref}>
        <div className={`grid ${split ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 max-w-3xl mx-auto'} gap-12 items-center`}>
          {split && (
            <motion.div
              initial={isPreview ? false : { opacity: 0, x: -40 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] }}
              className="relative group"
            >
              <div
                className="absolute -inset-3 rounded-3xl blur-xl opacity-30 transition-opacity duration-500 group-hover:opacity-50"
                style={{ backgroundColor: `rgba(${rgb}, 0.4)` }}
              />
              <motion.img
                src={content.imageUrl}
                alt=""
                whileHover={isPreview ? {} : { scale: 1.03 }}
                transition={{ duration: 0.5 }}
                className="relative rounded-2xl w-full h-80 object-cover border border-white/10"
              />
            </motion.div>
          )}

          <motion.div
            initial={isPreview ? false : { opacity: 0, x: split ? 40 : 0, y: split ? 0 : 30 }}
            animate={inView ? { opacity: 1, x: 0, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] }}
          >
            <div className="inline-block w-12 h-1 rounded-full mb-6" style={{ backgroundColor: primary }} />
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              {isPreview
                ? content.headline
                : words.map((word, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, y: 25, filter: 'blur(5px)' }}
                      animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
                      transition={{ duration: 0.55, delay: 0.15 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                      className="inline-block mr-[0.25em]"
                    >
                      {word}
                    </motion.span>
                  ))}
            </h2>
            <p className="text-gray-200 text-lg leading-relaxed mb-8">
              {content.text}
            </p>

            {content.highlights && content.highlights.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {content.highlights.map((h, i) => (
                  <motion.div
                    key={i}
                    initial={isPreview ? false : { opacity: 0, y: 15 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.2 + i * 0.08 }}
                    whileHover={isPreview ? {} : { scale: 1.02, borderColor: `rgba(${rgb}, 0.4)` }}
                    className="flex items-center gap-2 glass rounded-xl px-3 py-2 transition-all"
                  >
                    {(() => {
                      const IconComp = h.iconName ? ICON_MAP[h.iconName] : null;
                      return IconComp
                        ? <IconComp className="h-4 w-4 shrink-0" style={{ color: primary }} />
                        : <span className="text-xl">{h.icon}</span>;
                    })()}
                    <span className="text-sm text-gray-200 font-medium">{h.label}</span>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
