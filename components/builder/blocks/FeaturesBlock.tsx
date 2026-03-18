'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import type { FeaturesContent, SiteTheme } from '@/lib/types';
import {
  UtensilsCrossed, Coffee, Wine, ChefHat, Leaf, Flame,
  Scissors, Sparkles, Heart, Shield, Zap, Globe,
  Briefcase, Building2, Users, Calendar, Clock, MapPin,
  Star, Truck, Wrench, Phone, Mail, Camera,
  Music, BookOpen, Award, TrendingUp, Layers, Code,
  Home, Flower2, Package, Target, ArrowRight, Check,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  utensils: UtensilsCrossed, coffee: Coffee, wine: Wine, chef: ChefHat,
  salad: Leaf, fire: Flame, leaf: Leaf, flower: Flower2,
  scissors: Scissors, sparkles: Sparkles, heart: Heart, shield: Shield,
  zap: Zap, globe: Globe, briefcase: Briefcase, building: Building2,
  users: Users, calendar: Calendar, clock: Clock, pin: MapPin,
  star: Star, truck: Truck, wrench: Wrench, phone: Phone,
  mail: Mail, camera: Camera, music: Music, book: BookOpen,
  award: Award, chart: TrendingUp, layers: Layers, code: Code,
  home: Home, package: Package, target: Target, arrow: ArrowRight, check: Check,
};

interface FeaturesBlockProps {
  content: FeaturesContent;
  theme?: SiteTheme;
  isPreview?: boolean;
}

function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  return `${parseInt(clean.slice(0,2),16)}, ${parseInt(clean.slice(2,4),16)}, ${parseInt(clean.slice(4,6),16)}`;
}

export function FeaturesBlock({ content, theme, isPreview }: FeaturesBlockProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const cols = content.columns || 3;
  const gridClass = { 2: 'md:grid-cols-2', 3: 'md:grid-cols-2 lg:grid-cols-3', 4: 'md:grid-cols-2 lg:grid-cols-4' }[cols];
  const primary = theme?.primaryColor ?? '#c41e3a';
  const rgb = hexToRgb(primary);

  const words = content.headline.split(' ');

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
  };
  const item = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] } },
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
          <div className="inline-block w-10 h-0.5 rounded-full mb-6" style={{ backgroundColor: primary }} />
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
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
          {content.subheadline && (
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">{content.subheadline}</p>
          )}
        </motion.div>

        <motion.div
          variants={isPreview ? {} : container}
          initial={isPreview ? false : 'hidden'}
          animate={inView ? 'show' : 'hidden'}
          className={`grid grid-cols-1 ${gridClass} gap-5`}
        >
          {content.features.map((feature, i) => {
            const IconComp = (feature.iconName && ICON_MAP[feature.iconName]) ? ICON_MAP[feature.iconName] : null;
            return (
              <motion.div
                key={i}
                variants={isPreview ? {} : item}
                whileHover={isPreview ? {} : {
                  y: -6,
                  borderColor: `rgba(${rgb}, 0.5)`,
                  boxShadow: `0 12px 40px rgba(${rgb}, 0.18), 0 0 0 1px rgba(${rgb}, 0.25)`,
                }}
                className="glass rounded-2xl p-6 transition-all duration-300 cursor-default"
              >
                {IconComp ? (
                  <div
                    className="h-11 w-11 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: `rgba(${rgb}, 0.12)`, color: primary }}
                  >
                    <IconComp className="h-5 w-5" />
                  </div>
                ) : (
                  <div className="h-0.5 w-8 rounded-full mb-5" style={{ backgroundColor: primary }} />
                )}
                <h3 className="text-base font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
