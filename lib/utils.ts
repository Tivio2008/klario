import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { nanoid } from 'nanoid';
import type { SiteBlock, SiteTemplate, SiteTheme } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId() {
  return nanoid(10);
}

export function generateToken() {
  return nanoid(20);
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    + '-' + nanoid(4);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatRelativeTime(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diff = now.getTime() - then.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 30) return formatDate(date);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

export function isLinkExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

export const TEMPLATE_BLOCKS: Record<SiteTemplate, SiteBlock[]> = {
  saas: [
    {
      id: generateId(),
      type: 'hero',
      order: 0,
      content: {
        headline: 'Build Faster, Ship Smarter',
        subheadline: 'The all-in-one platform that helps your team ship great software without the complexity.',
        ctaText: 'Start for Free',
        ctaSecondaryText: 'See Demo',
        badge: 'Now in Beta',
        bgGradient: 'purple-blue',
        variant: 'centered',
      },
    },
    {
      id: generateId(),
      type: 'features',
      order: 1,
      content: {
        headline: 'Everything you need to scale',
        subheadline: 'Powerful features designed for modern teams.',
        features: [
          { icon: '⚡', title: 'Lightning Fast', description: 'Optimized infrastructure that scales with your needs automatically.' },
          { icon: '🔒', title: 'Secure by Default', description: 'Enterprise-grade security with end-to-end encryption.' },
          { icon: '📊', title: 'Real-time Analytics', description: 'Insights and metrics that matter, updated in real time.' },
          { icon: '🔧', title: 'Easy Integration', description: 'Connect with 100+ tools your team already uses.' },
          { icon: '🌐', title: 'Global CDN', description: 'Deploy worldwide with sub-100ms latency anywhere.' },
          { icon: '🤝', title: 'Team Collaboration', description: 'Work together seamlessly with built-in collaboration tools.' },
        ],
        columns: 3,
        variant: 'grid',
      },
    },
    {
      id: generateId(),
      type: 'testimonials',
      order: 2,
      content: {
        headline: 'Loved by thousands of teams',
        subheadline: 'See what our customers are saying.',
        testimonials: [
          { name: 'Sarah Chen', role: 'CTO', company: 'TechFlow', quote: 'This platform transformed how our team ships. We went from weekly releases to daily.', rating: 5 },
          { name: 'Marcus Johnson', role: 'Engineering Lead', company: 'Prismatic', quote: 'The best developer experience I have ever had. Setup took minutes, not days.', rating: 5 },
          { name: 'Aria Patel', role: 'VP Engineering', company: 'Scaleup', quote: 'Our deployment frequency increased 10x within the first month. Incredible ROI.', rating: 5 },
        ],
        variant: 'cards',
      },
    },
    {
      id: generateId(),
      type: 'pricing',
      order: 3,
      content: {
        headline: 'Simple, transparent pricing',
        subheadline: 'No hidden fees. Cancel anytime.',
        tiers: [
          { name: 'Starter', price: '$0', period: '/month', description: 'Perfect for individuals and small projects.', features: ['Up to 3 projects', '10GB storage', 'Community support', 'Basic analytics'], ctaText: 'Get Started Free' },
          { name: 'Pro', price: '$49', period: '/month', description: 'For growing teams that need more power.', features: ['Unlimited projects', '100GB storage', 'Priority support', 'Advanced analytics', 'Custom domains', 'Team collaboration'], highlighted: true, ctaText: 'Start Pro Trial' },
          { name: 'Enterprise', price: 'Custom', description: 'For large organizations with custom needs.', features: ['Everything in Pro', 'Dedicated infrastructure', 'SLA guarantee', 'Custom integrations', 'SSO & SAML', 'Dedicated support'], ctaText: 'Contact Sales' },
        ],
        variant: 'cards',
      },
    },
    {
      id: generateId(),
      type: 'contact',
      order: 4,
      content: {
        headline: 'Get in touch',
        subheadline: 'Have questions? Our team is here to help.',
        email: 'hello@example.com',
        showForm: true,
        variant: 'split',
      },
    },
    {
      id: generateId(),
      type: 'footer',
      order: 5,
      content: {
        companyName: 'Klario',
        tagline: 'Build the future, today.',
        copyright: '© 2024 Klario. All rights reserved.',
        variant: 'full',
      },
    },
  ],
  restaurant: [
    {
      id: generateId(),
      type: 'hero',
      order: 0,
      content: {
        headline: 'A Dining Experience Unlike Any Other',
        subheadline: 'Fresh ingredients, bold flavors, and an atmosphere that brings people together.',
        ctaText: 'Reserve a Table',
        ctaSecondaryText: 'View Menu',
        badge: 'Now Open',
        bgGradient: 'amber-red',
        variant: 'centered',
      },
    },
    {
      id: generateId(),
      type: 'features',
      order: 1,
      content: {
        headline: 'Why Guests Love Us',
        features: [
          { icon: '👨‍🍳', title: 'Award-Winning Chefs', description: 'Our culinary team brings decades of experience from world-class kitchens.' },
          { icon: '🌿', title: 'Farm to Table', description: 'Locally sourced, seasonal ingredients for the freshest flavors.' },
          { icon: '🍷', title: 'Curated Wine List', description: 'Over 200 selections from the world\'s finest vineyards.' },
          { icon: '🎵', title: 'Live Music', description: 'Enjoy live performances every Friday and Saturday evening.' },
        ],
        columns: 4,
        variant: 'grid',
      },
    },
    {
      id: generateId(),
      type: 'testimonials',
      order: 2,
      content: {
        headline: 'What Our Guests Say',
        testimonials: [
          { name: 'Emma Wilson', role: 'Food Critic', company: 'Gastronomy Monthly', quote: 'The truffle risotto alone is worth the trip. An unforgettable experience.', rating: 5 },
          { name: 'David Kim', role: 'Regular Guest', company: '', quote: 'Our anniversary dinner here was absolutely perfect. The staff went above and beyond.', rating: 5 },
        ],
        variant: 'cards',
      },
    },
    {
      id: generateId(),
      type: 'contact',
      order: 3,
      content: {
        headline: 'Make a Reservation',
        subheadline: 'Book your table online or call us directly.',
        phone: '+1 (555) 123-4567',
        address: '123 Culinary Street, San Francisco, CA',
        showForm: true,
        variant: 'split',
      },
    },
    {
      id: generateId(),
      type: 'footer',
      order: 4,
      content: {
        companyName: 'La Maison',
        tagline: 'Fine dining redefined.',
        copyright: '© 2024 La Maison. All rights reserved.',
        variant: 'minimal',
      },
    },
  ],
  agency: [
    {
      id: generateId(),
      type: 'hero',
      order: 0,
      content: {
        headline: 'We Build Brands That Stand Out',
        subheadline: 'Digital strategy, design, and development for ambitious companies.',
        ctaText: 'Start a Project',
        ctaSecondaryText: 'Our Work',
        badge: 'Award-Winning Agency',
        bgGradient: 'teal-blue',
        variant: 'split',
      },
    },
    {
      id: generateId(),
      type: 'features',
      order: 1,
      content: {
        headline: 'Our Services',
        subheadline: 'End-to-end digital solutions for modern businesses.',
        features: [
          { icon: '🎨', title: 'Brand Identity', description: 'Logo, typography, color systems that make lasting impressions.' },
          { icon: '💻', title: 'Web Development', description: 'Fast, accessible, beautiful web experiences built to convert.' },
          { icon: '📱', title: 'Mobile Apps', description: 'Native iOS and Android apps with exceptional UX.' },
          { icon: '📈', title: 'Growth Marketing', description: 'Data-driven campaigns that acquire and retain customers.' },
          { icon: '🔍', title: 'SEO & Content', description: 'Organic growth strategies that compound over time.' },
          { icon: '⚙️', title: 'Product Strategy', description: 'Roadmapping and consultation for product-led growth.' },
        ],
        columns: 3,
        variant: 'grid',
      },
    },
    {
      id: generateId(),
      type: 'testimonials',
      order: 2,
      content: {
        headline: 'Client Success Stories',
        testimonials: [
          { name: 'Jordan Lee', role: 'CEO', company: 'Nexus Ventures', quote: 'Our new brand identity increased investor interest immediately. Best decision we made.', rating: 5 },
          { name: 'Priya Sharma', role: 'CMO', company: 'WaveForm', quote: 'The website they built for us converted at 4x our previous rate. Exceptional work.', rating: 5 },
          { name: 'Alex Morgan', role: 'Founder', company: 'Orbit Labs', quote: 'From strategy to launch in 6 weeks. The team is remarkably efficient and talented.', rating: 5 },
        ],
        variant: 'cards',
      },
    },
    {
      id: generateId(),
      type: 'pricing',
      order: 3,
      content: {
        headline: 'Project Packages',
        subheadline: 'Transparent pricing for every stage.',
        tiers: [
          { name: 'Startup', price: '$5K', description: 'Perfect for early-stage companies.', features: ['Brand Identity', 'Landing Page', '1 month support', 'Basic SEO'], ctaText: 'Get Started' },
          { name: 'Growth', price: '$15K', description: 'For companies ready to scale.', features: ['Everything in Startup', 'Full Website', 'Mobile App', 'Marketing Campaign', '3 months support'], highlighted: true, ctaText: 'Most Popular' },
          { name: 'Enterprise', price: 'Custom', description: 'Full-service for large organizations.', features: ['Everything in Growth', 'Ongoing retainer', 'Dedicated team', 'Custom integrations'], ctaText: 'Contact Us' },
        ],
        variant: 'cards',
      },
    },
    {
      id: generateId(),
      type: 'contact',
      order: 4,
      content: {
        headline: 'Start Your Project',
        subheadline: 'Tell us about your vision and we\'ll make it happen.',
        email: 'hello@agency.com',
        showForm: true,
        variant: 'centered',
      },
    },
    {
      id: generateId(),
      type: 'footer',
      order: 5,
      content: {
        companyName: 'Studio Agency',
        tagline: 'Creating digital excellence.',
        copyright: '© 2024 Studio Agency. All rights reserved.',
        variant: 'full',
      },
    },
  ],
};
