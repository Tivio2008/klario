import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { SiteBlock, SiteTheme } from '@/lib/types';
import { generateId } from '@/lib/utils';

export interface OnboardingData {
  prompt: string;
  reviews?: string;
  logoUrl?: string;
  photoUrls?: string[];
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

    const hasPhotos = data.photoUrls && data.photoUrls.length > 0;
    const hasReviews = data.reviews && data.reviews.trim().length > 20;

    const systemPrompt = `You are a world-class web designer and copywriter who creates truly unique, hand-crafted websites. Each site you create looks completely different based on the business type, personality, and brand.

CRITICAL RULES:
- NEVER use purple or violet colors unless the business explicitly mentions them
- Extract the EXACT brand colors from the description (e.g. "rouge et vert" → use red and green)
- If no color mentioned: restaurants → warm amber/orange/red, agencies → teal/indigo, health → green, tech → blue, beauty → rose/gold
- Write ALL content in the same language as the business description
- Make it feel hand-crafted and unique, NOT generic AI-generated
- For restaurants: use warm, food-focused language; no "pricing tiers", instead use menu highlights
- For agencies: use bold, results-focused language; include pricing packages
- WhatsApp number: extract from description if mentioned, otherwise null`;

    const userPrompt = `Create a complete website for this business:

---
${data.prompt}
---
${hasReviews ? `\nREAL CUSTOMER REVIEWS (use these as testimonials, keep real quotes):\n${data.reviews}\n` : ''}

Generate a JSON object (raw JSON only, no markdown) with this exact structure:

{
  "suggestedName": "exact business name from description",
  "meta": {
    "primaryColor": "#hexcolor (extracted from description or inferred from business type — NEVER purple/violet unless explicitly stated)",
    "secondaryColor": "#hexcolor (complementary accent)",
    "tone": "luxury|professional|fun|minimal",
    "template": "restaurant|agency|saas",
    "fontFamily": "Georgia, serif (for luxury/restaurant) OR Inter, system-ui, sans-serif (for modern/tech)",
    "whatsapp": "phone number digits only or null"
  },
  "hero": {
    "headline": "striking headline using the actual business name, max 8 words",
    "subheadline": "2 sentences — what makes this business special, who it's for",
    "ctaText": "specific action button (e.g. 'Réserver une table', 'Demander un devis', 'Découvrir nos offres')",
    "ctaSecondaryText": "secondary action or null",
    "badge": "short badge (e.g. 'Ouvert depuis 2008', 'Famille depuis 3 générations') or null"
  },
  "about": {
    "headline": "about section headline (e.g. 'Notre histoire', 'Qui sommes-nous ?')",
    "text": "2-3 paragraphs about the business history, values, and what makes them unique. Very specific to this business.",
    "highlights": [
      {"icon": "emoji", "label": "key fact or value"},
      {"icon": "emoji", "label": "key fact or value"},
      {"icon": "emoji", "label": "key fact or value"},
      {"icon": "emoji", "label": "key fact or value"}
    ],
    "imageUrl": ${data.logoUrl ? `"${data.logoUrl}"` : 'null'},
    "variant": "split"
  },
  "features": {
    "headline": "services/features headline (e.g. 'Nos spécialités', 'Nos services', 'Ce qu\\'on fait')",
    "subheadline": "one sentence",
    "features": [
      {"icon": "emoji", "title": "specific service/dish/offer", "description": "2 specific sentences about this"},
      {"icon": "emoji", "title": "...", "description": "..."},
      {"icon": "emoji", "title": "...", "description": "..."},
      {"icon": "emoji", "title": "...", "description": "..."},
      {"icon": "emoji", "title": "...", "description": "..."},
      {"icon": "emoji", "title": "...", "description": "..."}
    ],
    "columns": 3
  },
  "stats": {
    "headline": null,
    "stats": [
      {"value": "realistic number from description or inferred", "suffix": "+", "label": "relevant label"},
      {"value": "number", "suffix": "%", "label": "satisfaction or quality metric"},
      {"value": "number", "suffix": "+", "label": "another metric"},
      {"value": "4.9", "suffix": "★", "label": "Note moyenne"}
    ]
  },
  "testimonials": {
    "headline": "testimonials headline",
    "subheadline": "one sentence",
    "testimonials": [
      {"name": "real or believable name", "role": "Client", "company": "city or context", "quote": "${hasReviews ? 'exact real review quote' : 'very specific 2-sentence testimonial about this exact business'}", "rating": 5},
      {"name": "...", "role": "Client", "company": "...", "quote": "...", "rating": 5},
      {"name": "...", "role": "Client", "company": "...", "quote": "...", "rating": 5}
    ]
  },
  ${data.photoUrls && data.photoUrls.length > 0 ? `"gallery": {
    "headline": "gallery headline (e.g. 'Notre restaurant', 'Nos réalisations', 'Galerie photos')",
    "subheadline": "one sentence",
    "photos": ${JSON.stringify(data.photoUrls)},
    "columns": 3
  },` : '"gallery": null,'}
  "pricing": {
    "headline": "pricing section headline — for restaurants use 'Notre menu' or 'Nos formules', for others 'Nos offres'",
    "subheadline": "one sentence",
    "tiers": [
      {"name": "tier/formula name", "price": "price or price range", "period": "per person/month or null", "description": "who this is for", "features": ["item1","item2","item3","item4"], "ctaText": "CTA text", "highlighted": false},
      {"name": "tier/formula name", "price": "price", "period": "or null", "description": "who this is for", "features": ["item1","item2","item3","item4","item5"], "ctaText": "CTA text", "highlighted": true},
      {"name": "tier/formula name", "price": "price or 'Sur devis'", "period": "or null", "description": "who this is for", "features": ["item1","item2","item3","item4"], "ctaText": "CTA text", "highlighted": false}
    ]
  },
  "contact": {
    "headline": "contact section headline",
    "subheadline": "warm inviting one-liner",
    "email": "inferred email or example@business.fr",
    "phone": "phone from description or empty string",
    "address": "address from description or just city",
    "whatsapp": "phone digits from description or null",
    "mapsUrl": null,
    "showForm": true,
    "variant": "split"
  },
  "footer": {
    "companyName": "business name",
    "tagline": "brand tagline max 6 words",
    "copyright": "© ${new Date().getFullYear()} [business name]. Tous droits réservés.",
    "variant": "full"
  }
}

Make EVERYTHING specific to this exact business. No generic placeholder text. Be creative and authentic.`;

    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 3000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonStr = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```$/m, '').trim();
    const g = JSON.parse(jsonStr);

    const primary = g.meta?.primaryColor ?? '#e85d26';
    const tone = g.meta?.tone ?? 'professional';
    const template = g.meta?.template ?? 'saas';
    const fontFamily = g.meta?.fontFamily ?? 'Inter, system-ui, sans-serif';
    const whatsapp = g.meta?.whatsapp ?? null;

    const theme: SiteTheme = {
      primaryColor: primary,
      fontFamily,
      borderRadius: tone === 'minimal' ? 'sm' : tone === 'luxury' ? 'lg' : 'md',
      darkMode: true,
    };

    const blocks: SiteBlock[] = [];
    let order = 0;

    // Hero
    blocks.push({
      id: generateId(), type: 'hero', order: order++,
      content: { ...g.hero, whatsapp, variant: 'centered' },
    });

    // About
    blocks.push({
      id: generateId(), type: 'about', order: order++,
      content: { ...g.about },
    });

    // Features / services
    blocks.push({
      id: generateId(), type: 'features', order: order++,
      content: { ...g.features, variant: 'grid' },
    });

    // Stats
    blocks.push({
      id: generateId(), type: 'stats', order: order++,
      content: g.stats,
    });

    // Gallery (only if photos provided)
    if (g.gallery && hasPhotos) {
      blocks.push({
        id: generateId(), type: 'gallery', order: order++,
        content: g.gallery,
      });
    }

    // Testimonials
    blocks.push({
      id: generateId(), type: 'testimonials', order: order++,
      content: { ...g.testimonials, variant: 'cards' },
    });

    // Pricing (for non-restaurants too, framed as formulas/menus)
    blocks.push({
      id: generateId(), type: 'pricing', order: order++,
      content: { ...g.pricing, variant: 'cards' },
    });

    // Contact
    blocks.push({
      id: generateId(), type: 'contact', order: order++,
      content: { ...g.contact, whatsapp },
    });

    // Footer
    blocks.push({
      id: generateId(), type: 'footer', order: order++,
      content: { ...g.footer },
    });

    return NextResponse.json({ blocks, theme, suggestedName: g.suggestedName } satisfies GeneratedSite);
  } catch (err) {
    console.error('Generation error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
