import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { SiteBlock, SiteTheme } from '@/lib/types';
import { generateId } from '@/lib/utils';

export interface OnboardingData {
  prompt: string;   // Free-form business description
  reviews?: string; // Pasted customer reviews (optional)
}

export interface GeneratedSite {
  blocks: SiteBlock[];
  theme: SiteTheme;
  suggestedName: string;
}

export async function POST(req: NextRequest) {
  try {
    const data: OnboardingData = await req.json();
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const hasRealReviews = data.reviews && data.reviews.trim().length > 20;

    const prompt = `You are a world-class copywriter and web designer. A business owner described their business in free-form text. Extract all relevant information and create a complete, highly personalised website.

Write ALL content in the SAME LANGUAGE as the business description (French if French, English if English, etc.).

BUSINESS DESCRIPTION:
${data.prompt}

${hasRealReviews ? `REAL CUSTOMER REVIEWS (extract up to 3, keep real quotes):\n${data.reviews}` : ''}

From the description, infer:
- Business name, type, city, services, tone (luxury/professional/fun/minimal), brand color (hex), target audience
- If tone is not clear, default to "professional"
- If brand color is not mentioned, pick a fitting one based on the business type

Generate a JSON object with this EXACT structure (raw JSON only, no markdown):
{
  "suggestedName": "business name from description",
  "meta": {
    "tone": "luxury|professional|fun|minimal",
    "brandColor": "#hexcolor",
    "template": "restaurant|agency|saas"
  },
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
    "email": "inferred or example email",
    "phone": "inferred or empty string",
    "address": "inferred address or city"
  },
  "footer": {
    "companyName": "business name",
    "tagline": "brand tagline max 6 words",
    "copyright": "© ${new Date().getFullYear()} [business name]. Tous droits réservés."
  }
}

Make ALL content highly specific to the described business. Use relevant emojis. Match the tone perfectly.`;

    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2500,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonStr = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```$/m, '').trim();
    const generated = JSON.parse(jsonStr);

    const tone = generated.meta?.tone ?? 'professional';
    const brandColor = generated.meta?.brandColor ?? '#7c3aed';
    const template = generated.meta?.template ?? 'saas';
    const bgGradient = template === 'restaurant' ? 'amber-red' : template === 'agency' ? 'teal-blue' : 'purple-blue';

    const theme: SiteTheme = {
      primaryColor: brandColor,
      fontFamily: tone === 'luxury' ? 'Georgia, serif' : 'Inter, system-ui, sans-serif',
      borderRadius: tone === 'minimal' ? 'sm' : tone === 'luxury' ? 'lg' : 'md',
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
