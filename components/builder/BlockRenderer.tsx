'use client';

import type { SiteBlock, SiteTheme, StatsContent, HeroContent, FeaturesContent, TestimonialsContent, PricingContent, ContactContent, FooterContent, GalleryContent, AboutContent } from '@/lib/types';
import { HeroBlock } from './blocks/HeroBlock';
import { FeaturesBlock } from './blocks/FeaturesBlock';
import { StatsBlock } from './blocks/StatsBlock';
import { TestimonialsBlock } from './blocks/TestimonialsBlock';
import { PricingBlock } from './blocks/PricingBlock';
import { ContactBlock } from './blocks/ContactBlock';
import { FooterBlock } from './blocks/FooterBlock';
import { GalleryBlock } from './blocks/GalleryBlock';
import { AboutBlock } from './blocks/AboutBlock';

interface BlockRendererProps {
  block: SiteBlock;
  theme?: SiteTheme;
  isPreview?: boolean;
}

export function BlockRenderer({ block, theme, isPreview }: BlockRendererProps) {
  switch (block.type) {
    case 'hero':
      return <HeroBlock content={block.content as HeroContent} theme={theme} isPreview={isPreview} />;
    case 'features':
      return <FeaturesBlock content={block.content as FeaturesContent} isPreview={isPreview} />;
    case 'stats':
      return <StatsBlock content={block.content as StatsContent} isPreview={isPreview} />;
    case 'testimonials':
      return <TestimonialsBlock content={block.content as TestimonialsContent} isPreview={isPreview} />;
    case 'pricing':
      return <PricingBlock content={block.content as PricingContent} isPreview={isPreview} />;
    case 'contact':
      return <ContactBlock content={block.content as ContactContent} theme={theme} isPreview={isPreview} />;
    case 'footer':
      return <FooterBlock content={block.content as FooterContent} />;
    case 'gallery':
      return <GalleryBlock content={block.content as GalleryContent} theme={theme} isPreview={isPreview} />;
    case 'about':
      return <AboutBlock content={block.content as AboutContent} theme={theme} isPreview={isPreview} />;
    default:
      return null;
  }
}
