import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export interface OnboardingData {
  prompt: string;
  reviews?: string;
  logoUrl?: string;
  photoUrls?: string[];
}

export interface GeneratedSite {
  html: string;
  menuHtml?: string;
  suggestedName: string;
}

export async function POST(req: NextRequest) {
  try {
    const data: OnboardingData = await req.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY is not set');
      return NextResponse.json({
        error: 'API key not configured. Please set ANTHROPIC_API_KEY in Vercel environment variables.'
      }, { status: 500 });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    console.log('Starting HTML generation with Claude Opus 4.6...');
    console.log('Prompt length:', data.prompt.length);

    const hasPhotos = data.photoUrls && data.photoUrls.length > 0;
    const hasReviews = data.reviews && data.reviews.trim().length > 20;

    const systemPrompt = `You are an expert web designer who creates stunning, hand-crafted websites. You write beautiful HTML with modern CSS animations and subtle JavaScript interactions.

QUALITY STANDARDS (Draftly / Framer AI level):
- Professional typography with proper hierarchy and line-height
- Smooth, tasteful animations (fade-in, slide-up, parallax, hover effects)
- Modern gradients and glassmorphism where appropriate
- Perfect spacing and visual rhythm
- Mobile-first responsive design
- Fast loading, no external dependencies (inline everything)
- Accessibility: semantic HTML, proper contrast, keyboard navigation

STYLE GUIDELINES:
- Colors: Deep, warm, sophisticated tones. NEVER purple/neon. Examples: Italian → #6B1F1F + #F5F0E8, French bistro → #1E3A5F + #C9A96E, Salon → #B76E79, Tech → #2C3E50
- Fonts: System font stack for performance: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif
- Animations: Subtle and smooth. Use CSS transitions and keyframes. Intersection Observer for scroll-triggered reveals
- Layout: Modern CSS Grid and Flexbox. Clean whitespace. No clutter.
- Interactions: Magnetic buttons, smooth hover states, scroll parallax

CONTENT RULES:
- Write in the EXACT same language as the business description
- NO marketing fluff: "innovant", "excellence", "passion", "nous sommes fiers"
- NO generic openers: "Bienvenue chez...", "Notre équipe de..."
- Concrete, specific details from the business description
- Natural conversational tone - like talking to a friend

STRUCTURE:
1. Hero section with strong headline, clear CTA, optional background image
2. About section with story and highlights
3. Services/Features grid (3-4 items)
4. Social proof (testimonials or stats)
5. Gallery if photos provided
6. Contact section with form
7. Footer

CRITICAL - ALL BUTTONS MUST BE FUNCTIONAL:
- Phone buttons: <a href="tel:+41321234567"> (use actual phone from description)
- WhatsApp buttons: <a href="https://wa.me/41321234567"> (digits only, no + or spaces)
- Email links: <a href="mailto:email@domain.com">
- Reservation/Booking buttons: Open a modal with a working contact form (name, email, phone, date, time, guests)
- Menu buttons (restaurants): <a href="#menu-link"> (will be replaced with actual menu page)
- Contact form: Must have working validation and show success message on submit
- NO decorative or broken buttons - every button must do something real

The HTML must be:
- Single file, fully self-contained
- All CSS inline in <style> tag
- All JS inline in <script> tag
- No external dependencies
- Production-ready, no placeholders`;

    const userPrompt = `Business description:
---
${data.prompt}
---
${hasReviews ? `\nReal customer reviews:\n${data.reviews}\n` : ''}
${hasPhotos ? `\nBusiness photos provided: ${data.photoUrls!.length} images\n` : ''}

Generate a COMPLETE, production-ready HTML website as a single file.

CRITICAL - YOU MUST COMPLETE THE ENTIRE HTML:
- Start with <!DOCTYPE html> and end with </html>
- Do NOT stop mid-generation - complete every section
- If you reach token limit, prioritize completing the structure over details

Include ALL of these sections IN ORDER:
1. Full <!DOCTYPE html> document
2. Meta tags (viewport, charset, description, og tags)
3. Inline CSS in <style> tag with:
   - CSS reset/normalize
   - Mobile-first responsive design (@media queries)
   - Smooth animations (fade-in, slide-up on scroll)
   - Modern design system (colors, typography, spacing)
4. Inline JavaScript in <script> tag for:
   - Scroll-triggered animations (Intersection Observer)
   - Smooth scrolling navigation
   - Mobile menu toggle
   - Form submission handling with validation
   - Booking/reservation modal functionality
   - Subtle parallax effects
5. REQUIRED sections (in order):
   a) HERO: Large headline, subheadline, CTA buttons, background
   b) ABOUT: Business story, highlights (3-4 items with icons)
   c) SERVICES/MENU: Grid of 6 items with descriptions
   d) TESTIMONIALS: 3 customer reviews with ratings
   ${hasPhotos ? 'e) GALLERY: Photo grid\n   ' : ''}f) CONTACT: Form + phone/email/address
   g) FOOTER: Copyright, links
6. FUNCTIONAL BUTTONS (extract from business description):
   - Phone button with tel: link if phone number found
   - WhatsApp floating button with wa.me link if WhatsApp/phone number found
   - Email button with mailto: link if email found
   - Reservation/Booking button that opens a modal form (for restaurants)
   - Menu button linking to #menu-link (for restaurants, will be replaced)
7. Working contact form with validation and success message
8. Booking modal for restaurants with fields: name, email, phone, date, time, number of guests

${hasPhotos ? `Use these photo URLs in the gallery: ${JSON.stringify(data.photoUrls)}` : ''}

IMPORTANT: Return the COMPLETE HTML from <!DOCTYPE html> to </html>.
Do NOT stop generation early - finish every section.
Return ONLY the HTML (no markdown, no explanation).`;

    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 16000, // Doublé pour sites complets
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const html = message.content[0].type === 'text' ? message.content[0].text : '';

    // VALIDATION: Vérifier que le HTML est complet
    if (!html.includes('</html>')) {
      console.error('HTML INCOMPLET - pas de balise </html>');
      console.error('Longueur:', html.length);
      console.error('Derniers 200 chars:', html.slice(-200));
      throw new Error('Le HTML généré est incomplet. La génération a été interrompue. Réessayez avec une description plus courte.');
    }

    console.log('✓ HTML complet généré, longueur:', html.length);

    // Extract business name from description or generate one
    const nameMatch = data.prompt.match(/(?:(?:je|nous) (?:suis|sommes)|(?:c'est|voici)) ([A-ZÀ-ÿ][A-Za-zÀ-ÿ\s'-]+)|^([A-ZÀ-ÿ][A-Za-zÀ-ÿ\s'-]+)/i);
    const suggestedName = nameMatch ? (nameMatch[1] || nameMatch[2]).trim() : 'Mon Site';

    // Detect if this is a restaurant/café/bar and generate menu
    const isRestaurant = /restaurant|café|bar|pizzeria|brasserie|bistro|trattoria|osteria|boulangerie|pâtisserie|food|cuisine/i.test(data.prompt);
    let menuHtml: string | undefined;

    if (isRestaurant) {
      console.log('Restaurant detected - generating menu page...');

      const menuPrompt = `Based on this business: "${data.prompt}"

Generate a complete, realistic restaurant menu HTML page with:
- Full <!DOCTYPE html> structure
- Beautiful layout matching the business style (same colors, fonts, feel)
- Navigation bar at top with restaurant name and "← Retour" link to #back-to-site
- 4 sections: Entrées, Plats, Desserts, Boissons
- 5-8 items per section with realistic names and descriptions in the same language as the business
- Prices in CHF (15-35 CHF for mains, 8-15 for starters, 6-12 for desserts, 3-8 for drinks)
- Each item: name (bold), description (1 sentence), price (right-aligned)
- Responsive design (mobile-first)
- Clean typography, proper spacing, appetizing presentation

Make it feel authentic and specific to this exact restaurant. Use menu items that match the cuisine type.

IMPORTANT: All prices MUST be in CHF with the format "XX CHF" or "XX.XX CHF"

Return ONLY the HTML (no markdown). Start with <!DOCTYPE html>.`;

      const menuMessage = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: 'user', content: menuPrompt }],
      });

      menuHtml = menuMessage.content[0].type === 'text' ? menuMessage.content[0].text.trim() : undefined;
    }

    return NextResponse.json({
      html: html.trim(),
      menuHtml,
      suggestedName
    } satisfies GeneratedSite);
  } catch (err) {
    console.error('=== GENERATION ERROR ===');
    console.error('API Key exists:', !!process.env.ANTHROPIC_API_KEY);
    console.error('API Key prefix:', process.env.ANTHROPIC_API_KEY?.substring(0, 20));
    console.error('Error type:', err instanceof Error ? err.constructor.name : typeof err);
    console.error('Error message:', err instanceof Error ? err.message : String(err));
    console.error('Error stack:', err instanceof Error ? err.stack : 'No stack trace');
    console.error('Full error object:', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
    console.error('======================');

    const errorMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.json({
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? String(err) : undefined
    }, { status: 500 });
  }
}
