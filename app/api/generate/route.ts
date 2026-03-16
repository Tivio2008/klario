import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { SiteBlock, SiteTemplate, SiteTheme } from '@/lib/types';
import { generateId } from '@/lib/utils';

export interface OnboardingData {
  businessName: string;
  industry: string;
  template: SiteTemplate;
  brandColor: string;
  tone: 'luxury' | 'fun' | 'professional' | 'minimal';
  targetAudience: string;
  services: string;
  description: string;
}

export interface GeneratedSite {
  blocks: SiteBlock[];
  theme: SiteTheme;
  suggestedName: string;
}

const TONE_DESCRIPTIONS = {
  luxury: 'sophisticated, premium, exclusive, elegant language. Use refined vocabulary and emphasise quality and prestige.',
  fun: 'energetic, playful, casual, friendly language. Use exclamations, emojis sparingly, and conversational phrasing.',
  professional: 'clear, authoritative, trustworthy, business-like language. Focus on expertise and results.',
  minimal: 'concise, clean, understated language. Use short sentences and avoid superlatives.',
};

export async function POST(req: NextRequest) {
  try {
    const data: OnboardingData = await req.json();
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const toneDesc = TONE_DESCRIPTIONS[data.tone];
    const bgGradient = data.template === 'restaurant' ? 'amber-red'
      : data.template === 'agency' ? 'teal-blue' : 'purple-blue';

    const prompt = `You are a world-class copywriter and web designer. Generate a complete, personalized website content structure for the following business:

Business Name: ${data.businessName}
Industry: ${data.industry}
Template Type: ${data.template}
Brand Color: ${data.brandColor}
Tone: ${data.tone} — ${toneDesc}
Target Audience: ${data.targetAudience}
Key Services/Products: ${data.services}
Business Description: ${data.description}

Generate a JSON object with this EXACT structure (no markdown, just raw JSON):
{
  "suggestedName": "site name string",
  "hero": {
    "headline": "compelling main headline (max 8 words, punchy)",
    "subheadline": "2-sentence value proposition that speaks to target audience",
    "ctaText": "primary call to action button text",
    "ctaSecondaryText": "secondary CTA text",
    "badge": "short badge text like 'Award-Winning' or 'Est. 2015' or null"
  },
  "features": {
    "headline": "features section headline",
    "subheadline": "one sentence",
    "features": [
      {"icon": "emoji", "title": "feature title", "description": "2 sentence description"},
      {"icon": "emoji", "title": "feature title", "description": "2 sentence description"},
      {"icon": "emoji", "title": "feature title", "description": "2 sentence description"},
      {"icon": "emoji", "title": "feature title", "description": "2 sentence description"},
      {"icon": "emoji", "title": "feature title", "description": "2 sentence description"},
      {"icon": "emoji", "title": "feature title", "description": "2 sentence description"}
    ]
  },
  "testimonials": {
    "headline": "social proof headline",
    "subheadline": "one sentence",
    "testimonials": [
      {"name": "realistic full name", "role": "job title", "company": "company name", "quote": "specific, believable 2-sentence testimonial about a real result", "rating": 5},
      {"name": "realistic full name", "role": "job title", "company": "company name", "quote": "specific, believable 2-sentence testimonial", "rating": 5},
      {"name": "realistic full name", "role": "job title", "company": "company name", "quote": "specific, believable 2-sentence testimonial", "rating": 5}
    ]
  },
  "pricing": {
    "headline": "pricing headline",
    "subheadline": "one sentence",
    "tiers": [
      {"name": "tier name", "price": "$X", "period": "/month or null", "description": "who this is for", "features": ["feature 1", "feature 2", "feature 3", "feature 4"], "ctaText": "button text", "highlighted": false},
      {"name": "tier name", "price": "$X", "period": "/month or null", "description": "who this is for", "features": ["feature 1", "feature 2", "feature 3", "feature 4", "feature 5"], "ctaText": "button text", "highlighted": true},
      {"name": "tier name", "price": "Custom or $X", "period": null, "description": "who this is for", "features": ["feature 1", "feature 2", "feature 3", "feature 4"], "ctaText": "button text", "highlighted": false}
    ]
  },
  "contact": {
    "headline": "contact section headline",
    "subheadline": "inviting one-liner",
    "email": "info@${data.businessName.toLowerCase().replace(/\s+/g, '')}.com"
  },
  "footer": {
    "companyName": "${data.businessName}",
    "tagline": "short brand tagline max 6 words",
    "copyright": "© ${new Date().getFullYear()} ${data.businessName}. All rights reserved."
  }
}

Make all content specific to the business. Use industry-relevant emojis. Match the tone precisely.`;

    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text : '';
    // Strip markdown code fences if present
    const jsonStr = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```$/m, '').trim();
    const generated = JSON.parse(jsonStr);

    // Build theme from brand color
    const theme: SiteTheme = {
      primaryColor: data.brandColor,
      fontFamily: data.tone === 'luxury' ? 'Georgia, serif' : 'Inter, system-ui, sans-serif',
      borderRadius: data.tone === 'minimal' ? 'sm' : data.tone === 'luxury' ? 'lg' : 'md',
      darkMode: true,
    };

    // Build blocks
    const blocks: SiteBlock[] = [
      {
        id: generateId(), type: 'hero', order: 0,
        content: { ...generated.hero, bgGradient, variant: 'centered' },
      },
      {
        id: generateId(), type: 'features', order: 1,
        content: { ...generated.features, columns: 3, variant: 'grid' },
      },
      {
        id: generateId(), type: 'testimonials', order: 2,
        content: { ...generated.testimonials, variant: 'cards' },
      },
    ];

    // Add pricing for saas/agency
    if (data.template !== 'restaurant') {
      blocks.push({
        id: generateId(), type: 'pricing', order: 3,
        content: { ...generated.pricing, variant: 'cards' },
      });
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
