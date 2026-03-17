// ─── Site & Block Types ─────────────────────────────────────────────────────

export type BlockType =
  | 'hero'
  | 'features'
  | 'stats'
  | 'testimonials'
  | 'pricing'
  | 'contact'
  | 'footer'
  | 'gallery'
  | 'about';

export type SiteTemplate = 'saas' | 'restaurant' | 'agency';
export type SiteStatus = 'draft' | 'demo_sent' | 'published';

export interface HeroContent {
  headline: string;
  subheadline: string;
  ctaText: string;
  ctaSecondaryText?: string;
  badge?: string;
  bgGradient?: string;
  backgroundImageUrl?: string;
  whatsapp?: string;
  variant?: 'centered' | 'split' | 'minimal';
}

export interface Feature {
  icon?: string;
  iconName?: string;
  title: string;
  description: string;
}

export interface FeaturesContent {
  headline: string;
  subheadline?: string;
  features: Feature[];
  columns?: 2 | 3 | 4;
  variant?: 'grid' | 'list';
}

export interface AboutContent {
  headline: string;
  text: string;
  imageUrl?: string;
  highlights?: Array<{ icon: string; label: string }>;
  variant?: 'split' | 'centered';
}

export interface GalleryContent {
  headline?: string;
  subheadline?: string;
  photos: string[];
  columns?: 2 | 3 | 4;
}

export interface Testimonial {
  name: string;
  role: string;
  company: string;
  quote: string;
  avatar?: string;
  rating?: number;
}

export interface TestimonialsContent {
  headline: string;
  subheadline?: string;
  testimonials: Testimonial[];
  variant?: 'cards' | 'masonry';
}

export interface PricingTier {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  ctaText: string;
}

export interface PricingContent {
  headline: string;
  subheadline?: string;
  tiers: PricingTier[];
  variant?: 'cards' | 'table';
}

export interface ContactContent {
  headline: string;
  subheadline?: string;
  email?: string;
  phone?: string;
  address?: string;
  whatsapp?: string;
  mapsUrl?: string;
  showForm?: boolean;
  variant?: 'split' | 'centered';
}

export interface FooterContent {
  companyName: string;
  tagline?: string;
  links?: Array<{ label: string; href: string }>;
  socialLinks?: Array<{ platform: string; href: string }>;
  copyright?: string;
  variant?: 'minimal' | 'full';
}

export interface StatItem {
  value: string;
  suffix?: string;
  label: string;
  prefix?: string;
}

export interface StatsContent {
  headline?: string;
  subheadline?: string;
  stats: StatItem[];
  variant?: 'dark' | 'glass';
}

export type BlockContent =
  | HeroContent
  | FeaturesContent
  | StatsContent
  | TestimonialsContent
  | PricingContent
  | ContactContent
  | FooterContent
  | GalleryContent
  | AboutContent;

export interface SiteBlock {
  id: string;
  type: BlockType;
  content: BlockContent;
  order: number;
}

export interface Site {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  template: SiteTemplate;
  status: SiteStatus;
  blocks: SiteBlock[];
  theme: SiteTheme;
  created_at: string;
  updated_at: string;
}

export interface SiteTheme {
  primaryColor: string;
  fontFamily: string;
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'full';
  darkMode: boolean;
}

export interface DemoLink {
  id: string;
  site_id: string;
  token: string;
  expires_at?: string | null;
  views: number;
  created_at: string;
  site?: Pick<Site, 'id' | 'name' | 'slug'>;
}

// ─── Database Row Types ──────────────────────────────────────────────────────

export interface SiteRow {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  template: SiteTemplate;
  status: SiteStatus;
  blocks: SiteBlock[];
  theme: SiteTheme;
  created_at: string;
  updated_at: string;
}

export interface DemoLinkRow {
  id: string;
  site_id: string;
  token: string;
  expires_at: string | null;
  views: number;
  created_at: string;
}

// ─── Template Defaults ───────────────────────────────────────────────────────

export const DEFAULT_THEME: SiteTheme = {
  primaryColor: '#e85d26',
  fontFamily: 'Inter, system-ui, sans-serif',
  borderRadius: 'md',
  darkMode: true,
};
