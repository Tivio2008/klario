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

// Curated Unsplash photo IDs by business category
const BACKGROUNDS: Record<string, string> = {
  restaurant:   'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&q=60&auto=format&fit=crop',
  pizza:        'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1920&q=60&auto=format&fit=crop',
  italian:      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1920&q=60&auto=format&fit=crop',
  french:       'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&q=60&auto=format&fit=crop',
  cafe:         'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1920&q=60&auto=format&fit=crop',
  coffee:       'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1920&q=60&auto=format&fit=crop',
  bakery:       'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1920&q=60&auto=format&fit=crop',
  sushi:        'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=1920&q=60&auto=format&fit=crop',
  burger:       'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1920&q=60&auto=format&fit=crop',
  bar:          'https://images.unsplash.com/photo-1525268771113-32d9e9021a97?w=1920&q=60&auto=format&fit=crop',
  wine:         'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1920&q=60&auto=format&fit=crop',
  hair:         'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1920&q=60&auto=format&fit=crop',
  beauty:       'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1920&q=60&auto=format&fit=crop',
  spa:          'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1920&q=60&auto=format&fit=crop',
  fitness:      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&q=60&auto=format&fit=crop',
  medical:      'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1920&q=60&auto=format&fit=crop',
  dental:       'https://images.unsplash.com/photo-1588776814546-1ffbb9f03470?w=1920&q=60&auto=format&fit=crop',
  hotel:        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&q=60&auto=format&fit=crop',
  construction: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1920&q=60&auto=format&fit=crop',
  real_estate:  'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1920&q=60&auto=format&fit=crop',
  garden:       'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1920&q=60&auto=format&fit=crop',
  law:          'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1920&q=60&auto=format&fit=crop',
  agency:       'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=60&auto=format&fit=crop',
  tech:         'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1920&q=60&auto=format&fit=crop',
  education:    'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1920&q=60&auto=format&fit=crop',
  photography:  'https://images.unsplash.com/photo-1452457750107-be127b9f3f0f?w=1920&q=60&auto=format&fit=crop',
  default:      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=60&auto=format&fit=crop',
};

const ICON_NAMES = 'utensils, coffee, wine, chef, salad, fire, leaf, flower, scissors, sparkles, heart, shield, zap, globe, briefcase, building, users, calendar, clock, pin, star, truck, wrench, phone, mail, camera, music, book, award, chart, layers, code, home, package, target';

export async function POST(req: NextRequest) {
  try {
    const data: OnboardingData = await req.json();
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const hasPhotos = data.photoUrls && data.photoUrls.length > 0;
    const hasReviews = data.reviews && data.reviews.trim().length > 20;

    const systemPrompt = `You are creating website content for real local businesses. Your writing should sound like it was written by someone who actually knows the business — warm, specific, direct. No corporate language.

STRICT RULES:
- NEVER use purple, violet, or indigo colors. Extract colors from the description. If none mentioned: restaurants → warm red/amber, salons → rose/gold, tech → deep blue/slate, nature → forest green.
- NO emojis anywhere in the output
- NO marketing clichés: never write "solution innovante", "passion", "excellence", "dédié à", "nous sommes fiers de", "de qualité", "sur mesure" (unless quoting), "unique en son genre", "au cœur de"
- Content must sound human: short sentences, specific details, real-sounding
- Write in the same language as the business description`;

    const userPrompt = `Business description:
---
${data.prompt}
---
${hasReviews ? `\nReal customer reviews to use as testimonials:\n${data.reviews}\n` : ''}

Generate a JSON object (raw JSON only, no markdown, no explanation):

{
  "suggestedName": "exact business name",
  "meta": {
    "primaryColor": "#hexcolor — extract from description, NEVER purple/violet/indigo",
    "tone": "luxury|professional|fun|minimal",
    "template": "restaurant|agency|saas",
    "fontFamily": "Georgia, serif OR Inter, system-ui, sans-serif",
    "whatsapp": "digits only or null",
    "backgroundCategory": "pick ONE key from this exact list: restaurant, pizza, italian, french, cafe, coffee, bakery, sushi, burger, bar, wine, hair, beauty, spa, fitness, medical, dental, hotel, construction, real_estate, garden, law, agency, tech, education, photography, default"
  },
  "hero": {
    "headline": "max 7 words — business name + what they do, direct and specific",
    "subheadline": "2 short sentences. What you get here. Who it's for. No adjectives like 'amazing' or 'exceptional'.",
    "ctaText": "specific verb + action (e.g. 'Réserver une table', 'Voir le menu', 'Nous appeler')",
    "ctaSecondaryText": "second action or null",
    "badge": "one concrete fact (e.g. 'Ouvert depuis 2008', 'Livraison 7j/7') or null"
  },
  "about": {
    "headline": "short section title (e.g. 'Notre histoire', 'L\\'équipe', 'Depuis 2010')",
    "text": "3 short paragraphs, conversational tone. Real details from the description. No generic filler.",
    "highlights": [
      {"iconName": "one of: ${ICON_NAMES}", "label": "concrete fact, 3-5 words"},
      {"iconName": "...", "label": "..."},
      {"iconName": "...", "label": "..."},
      {"iconName": "...", "label": "..."}
    ],
    "imageUrl": ${data.logoUrl ? `"${data.logoUrl}"` : 'null'},
    "variant": "split"
  },
  "features": {
    "headline": "section title (e.g. 'Nos spécialités', 'Ce qu\\'on fait', 'Nos services')",
    "subheadline": "one plain sentence, no marketing",
    "features": [
      {"iconName": "one of: ${ICON_NAMES}", "title": "specific item name", "description": "2 sentences, concrete, no adjectives like 'délicieux' or 'exceptionnel'"},
      {"iconName": "...", "title": "...", "description": "..."},
      {"iconName": "...", "title": "...", "description": "..."},
      {"iconName": "...", "title": "...", "description": "..."},
      {"iconName": "...", "title": "...", "description": "..."},
      {"iconName": "...", "title": "...", "description": "..."}
    ],
    "columns": 3
  },
  "stats": {
    "headline": null,
    "stats": [
      {"value": "realistic number", "suffix": "+", "label": "short label"},
      {"value": "number", "suffix": "%", "label": "short label"},
      {"value": "number", "suffix": "+", "label": "short label"},
      {"value": "4.8", "suffix": "★", "label": "Avis clients"}
    ]
  },
  "testimonials": {
    "headline": "section title",
    "subheadline": null,
    "testimonials": [
      {"name": "realistic name", "role": "Client", "company": "city or context", "quote": "${hasReviews ? 'verbatim from real reviews' : '1-2 sentences, specific detail about what they liked, no hyperbole'}", "rating": 5},
      {"name": "...", "role": "Client", "company": "...", "quote": "...", "rating": 5},
      {"name": "...", "role": "Client", "company": "...", "quote": "...", "rating": 5}
    ]
  },
  ${hasPhotos ? `"gallery": {
    "headline": "section title",
    "subheadline": null,
    "photos": ${JSON.stringify(data.photoUrls)},
    "columns": 3
  },` : '"gallery": null,'}
  "pricing": {
    "headline": "for restaurants: 'Nos formules' or 'À la carte'. For others: 'Nos offres'",
    "subheadline": null,
    "tiers": [
      {"name": "tier name", "price": "price", "period": "or null", "description": "short", "features": ["item","item","item","item"], "ctaText": "action", "highlighted": false},
      {"name": "tier name", "price": "price", "period": "or null", "description": "short", "features": ["item","item","item","item","item"], "ctaText": "action", "highlighted": true},
      {"name": "tier name", "price": "Sur devis", "period": null, "description": "short", "features": ["item","item","item","item"], "ctaText": "action", "highlighted": false}
    ]
  },
  "contact": {
    "headline": "simple title (e.g. 'Nous trouver', 'Réserver', 'Contact')",
    "subheadline": "one short practical sentence",
    "email": "from description or example@domain.fr",
    "phone": "from description or ''",
    "address": "from description or city only",
    "whatsapp": "digits only from description or null",
    "mapsUrl": null,
    "showForm": true,
    "variant": "split"
  },
  "footer": {
    "companyName": "business name",
    "tagline": "max 5 words, plain statement not slogan",
    "copyright": "© ${new Date().getFullYear()} [business name]. Tous droits réservés.",
    "variant": "full"
  }
}`;

    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 3000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonStr = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```$/m, '').trim();
    const g = JSON.parse(jsonStr);

    const primary = g.meta?.primaryColor ?? '#c41e3a';
    const tone = g.meta?.tone ?? 'professional';
    const fontFamily = g.meta?.fontFamily ?? 'Inter, system-ui, sans-serif';
    const whatsapp = g.meta?.whatsapp ?? null;
    const backgroundImageUrl = BACKGROUNDS[g.meta?.backgroundCategory] ?? BACKGROUNDS.default;

    const theme: SiteTheme = {
      primaryColor: primary,
      fontFamily,
      borderRadius: tone === 'minimal' ? 'sm' : tone === 'luxury' ? 'lg' : 'md',
      darkMode: true,
    };

    const blocks: SiteBlock[] = [];
    let order = 0;

    blocks.push({
      id: generateId(), type: 'hero', order: order++,
      content: { ...g.hero, whatsapp, backgroundImageUrl, variant: 'centered' },
    });
    blocks.push({
      id: generateId(), type: 'about', order: order++,
      content: { ...g.about },
    });
    blocks.push({
      id: generateId(), type: 'features', order: order++,
      content: { ...g.features, variant: 'grid' },
    });
    blocks.push({
      id: generateId(), type: 'stats', order: order++,
      content: g.stats,
    });

    if (g.gallery && hasPhotos) {
      blocks.push({
        id: generateId(), type: 'gallery', order: order++,
        content: g.gallery,
      });
    }

    blocks.push({
      id: generateId(), type: 'testimonials', order: order++,
      content: { ...g.testimonials, variant: 'cards' },
    });
    blocks.push({
      id: generateId(), type: 'pricing', order: order++,
      content: { ...g.pricing, variant: 'cards' },
    });
    blocks.push({
      id: generateId(), type: 'contact', order: order++,
      content: { ...g.contact, whatsapp },
    });
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
