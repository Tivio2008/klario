import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { SiteBlock, SiteTemplate, SiteTheme } from '@/lib/types';
import { generateId } from '@/lib/utils';

export interface OnboardingData {
  // Step 1 — Identity
  businessName: string;
  businessType: string;
  city: string;
  address?: string;
  phone?: string;
  businessEmail?: string;
  foundingYear?: string;
  teamSize?: string;
  // Step 2 — Activity
  description: string;
  services: string;
  targetAudience?: string;
  openingHours?: string;
  keywords?: string;
  // Step 3 — Style
  tone: 'luxury' | 'fun' | 'professional' | 'minimal';
  brandColor: string;
  mapsLink?: string;
  // Step 4 — Media
  hasLogo?: boolean;
  photosCount?: number;
  reviews?: string;
}

export interface GeneratedSite {
  blocks: SiteBlock[];
  theme: SiteTheme;
  suggestedName: string;
}

const TONE_DESCRIPTIONS = {
  luxury: 'sophisticated, premium, exclusive, elegant. Refined vocabulary, emphasis on quality and prestige.',
  fun: 'energetic, playful, casual, friendly. Exclamations, warmth, conversational phrasing.',
  professional: 'clear, authoritative, trustworthy, results-oriented. Expertise and reliability.',
  minimal: 'concise, clean, understated. Short sentences, no superlatives.',
};

function detectTemplate(businessType: string): SiteTemplate {
  const lower = businessType.toLowerCase();
  if (/restaurant|café|cafe|bar|brasserie|pizz|boulan|pâtiss|traiteur|food|cuisine|bistro|resto|hôtel|hotel|auberge|boucherie|fromagerie|épicerie/.test(lower)) return 'restaurant';
  if (/agence|studio|design|créat|communic|market|conseil|consult|publicit|brand|media|graphi|web|digital/.test(lower)) return 'agency';
  return 'saas';
}

export async function POST(req: NextRequest) {
  try {
    const data: OnboardingData = await req.json();
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const template = detectTemplate(data.businessType);
    const bgGradient = template === 'restaurant' ? 'amber-red' : template === 'agency' ? 'teal-blue' : 'purple-blue';
    const toneDesc = TONE_DESCRIPTIONS[data.tone];

    const hasRealReviews = data.reviews && data.reviews.trim().length > 20;

    const prompt = `You are a world-class copywriter and web designer. Create complete, highly personalised website content for this business. Write entirely in the same language as the business description (French if French, English if English, etc.).

BUSINESS INFORMATION:
- Name: ${data.businessName}
- Type: ${data.businessType}
- City: ${data.city}${data.address ? `\n- Address: ${data.address}` : ''}${data.phone ? `\n- Phone: ${data.phone}` : ''}${data.businessEmail ? `\n- Email: ${data.businessEmail}` : ''}${data.foundingYear ? `\n- Founded: ${data.foundingYear}` : ''}${data.teamSize ? `\n- Team size: ${data.teamSize}` : ''}

ACTIVITY:
- Description: ${data.description}
- Services/Products: ${data.services}${data.targetAudience ? `\n- Target audience: ${data.targetAudience}` : ''}${data.openingHours ? `\n- Opening hours: ${data.openingHours}` : ''}${data.keywords ? `\n- SEO keywords: ${data.keywords}` : ''}

STYLE:
- Tone: ${data.tone} — ${toneDesc}
- Brand color: ${data.brandColor}${data.hasLogo ? '\n- Logo: provided' : ''}${data.photosCount ? `\n- Photos: ${data.photosCount} provided` : ''}

${hasRealReviews ? `REAL CUSTOMER REVIEWS (extract up to 3, format them properly, keep the real quotes):\n${data.reviews}` : ''}

Generate a JSON object with this EXACT structure (raw JSON only, no markdown):
{
  "suggestedName": "site name",
  "hero": {
    "headline": "punchy headline max 8 words",
    "subheadline": "2-sentence value proposition for the target audience",
    "ctaText": "primary CTA button text",
    "ctaSecondaryText": "secondary CTA text",
    "badge": "short badge text or null"
  },
  "features": {
    "headline": "features section headline",
    "subheadline": "one sentence",
    "features": [
      {"icon": "emoji", "title": "title", "description": "2 sentences specific to this business"},
      {"icon": "emoji", "title": "title", "description": "2 sentences"},
      {"icon": "emoji", "title": "title", "description": "2 sentences"},
      {"icon": "emoji", "title": "title", "description": "2 sentences"},
      {"icon": "emoji", "title": "title", "description": "2 sentences"},
      {"icon": "emoji", "title": "title", "description": "2 sentences"}
    ]
  },
  "testimonials": {
    "headline": "social proof headline",
    "subheadline": "one sentence",
    "testimonials": [
      {"name": "full name", "role": "job title or 'Client'", "company": "company or city", "quote": "${hasRealReviews ? 'use real review quote' : 'specific believable 2-sentence testimonial'}", "rating": 5},
      {"name": "full name", "role": "job title or 'Client'", "company": "company or city", "quote": "${hasRealReviews ? 'use real review quote' : 'specific believable testimonial'}", "rating": 5},
      {"name": "full name", "role": "job title or 'Client'", "company": "company or city", "quote": "${hasRealReviews ? 'use real review quote' : 'specific believable testimonial'}", "rating": 5}
    ]
  },
  "pricing": {
    "headline": "pricing headline",
    "subheadline": "one sentence",
    "tiers": [
      {"name": "tier name", "price": "price", "period": "/mois or null", "description": "who this is for", "features": ["feat 1","feat 2","feat 3","feat 4"], "ctaText": "button text", "highlighted": false},
      {"name": "tier name", "price": "price", "period": "/mois or null", "description": "who this is for", "features": ["feat 1","feat 2","feat 3","feat 4","feat 5"], "ctaText": "button text", "highlighted": true},
      {"name": "tier name", "price": "Sur devis", "period": null, "description": "who this is for", "features": ["feat 1","feat 2","feat 3","feat 4"], "ctaText": "button text", "highlighted": false}
    ]
  },
  "stats": {
    "headline": null,
    "stats": [
      {"value": "number", "suffix": "+", "label": "relevant stat label"},
      {"value": "number", "suffix": "%", "label": "relevant stat label"},
      {"value": "number", "suffix": "+", "label": "relevant stat label"},
      {"value": "number", "suffix": "★", "label": "note moyenne"}
    ]
  },
  "contact": {
    "headline": "contact section headline",
    "subheadline": "inviting one-liner",
    "email": "${data.businessEmail || `contact@${data.businessName.toLowerCase().replace(/\s+/g, '')}.fr`}",
    "phone": "${data.phone || ''}",
    "address": "${data.address ? data.address + ', ' + data.city : data.city}"
  },
  "footer": {
    "companyName": "${data.businessName}",
    "tagline": "brand tagline max 6 words",
    "copyright": "© ${new Date().getFullYear()} ${data.businessName}. Tous droits réservés."
  }
}

Make ALL content highly specific to this exact business. Use relevant emojis. Match the tone perfectly.${data.openingHours ? ' Include opening hours in the contact section description.' : ''}`;

    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2500,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonStr = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```$/m, '').trim();
    const generated = JSON.parse(jsonStr);

    const theme: SiteTheme = {
      primaryColor: data.brandColor,
      fontFamily: data.tone === 'luxury' ? 'Georgia, serif' : 'Inter, system-ui, sans-serif',
      borderRadius: data.tone === 'minimal' ? 'sm' : data.tone === 'luxury' ? 'lg' : 'md',
      darkMode: true,
    };

    const blocks: SiteBlock[] = [
      { id: generateId(), type: 'hero', order: 0, content: { ...generated.hero, bgGradient, variant: 'centered' } },
      { id: generateId(), type: 'features', order: 1, content: { ...generated.features, columns: 3, variant: 'grid' } },
      { id: generateId(), type: 'stats', order: 2, content: generated.stats },
      { id: generateId(), type: 'testimonials', order: 3, content: { ...generated.testimonials, variant: 'cards' } },
    ];

    if (template !== 'restaurant') {
      blocks.push({ id: generateId(), type: 'pricing', order: 4, content: { ...generated.pricing, variant: 'cards' } });
    }

    blocks.push(
      { id: generateId(), type: 'contact', order: blocks.length, content: { ...generated.contact, showForm: true, variant: 'split' } },
      { id: generateId(), type: 'footer', order: blocks.length + 1, content: { ...generated.footer, variant: 'full' } },
    );

    return NextResponse.json({ blocks, theme, suggestedName: generated.suggestedName } satisfies GeneratedSite);
  } catch (err) {
    console.error('Generation error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
