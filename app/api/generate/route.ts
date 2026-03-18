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

    console.log('Starting HTML generation with Claude Haiku 4.5...');
    console.log('Prompt length:', data.prompt.length);

    // Retry helper for 529 errors
    async function retryWithBackoff<T>(
      fn: () => Promise<T>,
      maxRetries = 3,
      delayMs = 5000
    ): Promise<T> {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await fn();
        } catch (err: any) {
          const is529 = err?.status === 529 || err?.message?.includes('529') || err?.message?.includes('overloaded');
          if (is529 && attempt < maxRetries) {
            console.log(`Attempt ${attempt} failed (529 overloaded), retrying in ${delayMs}ms...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
            continue;
          }
          throw err;
        }
      }
      throw new Error('Max retries exceeded');
    }

    const hasPhotos = data.photoUrls && data.photoUrls.length > 0;
    const hasReviews = data.reviews && data.reviews.trim().length > 20;

    const systemPrompt = `You are a web designer. Create complete, beautiful single-page websites. Extract real contact info from descriptions. Write all content in the same language as the input. Use inline CSS and JS only.`;

    const userPrompt = `Business: ${data.prompt}
${hasReviews ? `\nReviews: ${data.reviews}` : ''}
${hasPhotos ? `\nPhotos: ${JSON.stringify(data.photoUrls)}` : ''}

Create a COMPLETE HTML website with ALL these sections filled with content:

1. Full HTML structure: <!DOCTYPE html>, <html>, <head> with meta tags and title, <style> with all CSS, <body>, <script> if needed, closing </body></html>

2. Navigation bar: business name, menu links (Accueil, À propos, Services, Contact)

3. Hero section:
   - Large headline about the business
   - Subheadline describing what they do
   - CTA button with tel: link (extract real phone from description, NOT 077...)

4. About section:
   - Section title
   - 2-3 paragraphs telling the story of the business
   - What makes them unique

5. Services/Specialties section:
   - Section title
   - Grid of 4-6 services/products with icons, names, and descriptions

6. Contact section:
   - Section title
   - Real phone number extracted from description (format: +41 XX XXX XX XX)
   - Real email if mentioned
   - Real address if mentioned
   - Opening hours if mentioned
   - Contact form with fields

7. Footer: business name, copyright, social media links

IMPORTANT:
- Generate COMPLETE content for EVERY section - no placeholders, no empty divs
- Extract and use REAL contact info from the description
- Beautiful, modern design with colors, spacing, animations
- Mobile responsive layout
- Return ONLY the complete HTML file (no markdown, no backticks, no explanation)`;

    const message = await retryWithBackoff(() =>
      client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 8000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      })
    );

    let html = message.content[0].type === 'text' ? message.content[0].text : '';

    // Auto-fix: Ensure HTML has closing tag
    if (!html.includes('</html>')) {
      console.warn('HTML missing closing tag, adding it');
      html += '\n</body>\n</html>';
    }

    console.log('✓ HTML généré, longueur:', html.length);

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

      const menuMessage = await retryWithBackoff(() =>
        client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 4000,
          system: systemPrompt,
          messages: [{ role: 'user', content: menuPrompt }],
        })
      );

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
