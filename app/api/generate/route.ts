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
    console.log('Logo URL:', data.logoUrl);
    console.log('Photo URLs:', data.photoUrls);

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

    const systemPrompt = `Tu es un expert en création de sites web pour commerces locaux. Tu génères UNIQUEMENT du code HTML/CSS complet et fonctionnel.

STYLE OBLIGATOIRE:
- Aucun emoji dans tout le HTML
- Pas de style SaaS/startup/tech
- Design chaleureux, humain, professionnel
- Couleurs selon le type: restaurant=rouge/orange/crème, coiffeur=noir/or/blanc, boulangerie=beige/marron/doré

SECTIONS OBLIGATOIRES DANS L'ORDRE:
1. NAV: logo (img si logo_url fourni, sinon texte nom), liens: Accueil, A propos, Services, Contact + bouton Réserver
2. HERO: image de fond Unsplash (restaurant: photo-1555396273-367ea4eb4db5, coiffeur: photo-1503951914875-452162b0f3f1, boulangerie: photo-1509440159596-0249088772ff), titre accrocheur, sous-titre, 2 boutons fonctionnels
3. ABOUT: histoire du commerce, 3 points forts avec icônes SVG simples
4. SERVICES: grille de 3-6 cartes avec titre et description, images Unsplash si disponibles
5. AVIS: 3 avis clients avec étoiles SVG dorées, nom, commentaire (utiliser les vrais avis fournis)
6. CONTACT: adresse, téléphone cliquable (tel:), email cliquable (mailto:), formulaire avec champs Nom/Email/Message/Téléphone/Date/Heure/Personnes qui ouvre mailto
7. FOOTER: nom, adresse, tel, liens nav, copyright

RÈGLES TECHNIQUES:
- CSS inline dans balise style
- Polices Google Fonts via CDN
- Mobile responsive
- Boutons tel: et mailto: fonctionnels avec vraies coordonnées
- Si logo_url fourni: <img src='[logo_url]' height='50'>
- Si photos fournies: les utiliser dans les sections services et hero
- Retourner UNIQUEMENT le HTML complet, aucun texte avant ou après`;

    const userPrompt = `Business: ${data.prompt}
${data.logoUrl ? `\nLogo URL: ${data.logoUrl}` : ''}
${hasReviews ? `\nReviews: ${data.reviews}` : ''}
${hasPhotos ? `\nPhotos: ${JSON.stringify(data.photoUrls)}` : ''}

Create a COMPLETE HTML website with ALL these sections filled with content:

1. Full HTML structure: <!DOCTYPE html>, <html>, <head> with meta tags and title, <style> with all CSS, <body>, <script> if needed, closing </body></html>

2. Navigation bar:
   ${data.logoUrl ? `- OBLIGATOIRE: Afficher le logo avec <img src="${data.logoUrl}" alt="Logo" style="max-height: 50px; height: 50px; width: auto; object-fit: contain;"> à la place du nom textuel. Le logo DOIT être visible dans le header.` : '- Business name as text'}
   - Menu links (Accueil, À propos, Services, Contact)

3. Hero section:
   - Large headline about the business
   - Subheadline describing what they do
   - Background image from Unsplash based on business type:
     * Restaurant/Italian: https://images.unsplash.com/photo-1555396273-367ea4eb4db5
     * Café/Coffee: https://images.unsplash.com/photo-1511920170033-f8396924c348
     * Bakery: https://images.unsplash.com/photo-1509440159596-0249088772ff
     * Salon/Beauty: https://images.unsplash.com/photo-1560066984-138dadb4c035
     * Gym/Fitness: https://images.unsplash.com/photo-1534438327276-14e5300c3a48
     * Shop/Store: https://images.unsplash.com/photo-1441986300917-64674bd600d8
   - CTA button "Réserver" (for restaurants) or "Contacter" that opens modal

4. Reservation Modal (for restaurants/cafés/salons):
   - Modal overlay with form (hidden by default, shown when CTA clicked)
   - Form fields: Nom, Email, Téléphone, Date, Heure, Nombre de personnes, Message
   - Submit button that uses mailto: with extracted email
   - JavaScript to show/hide modal on button click
   - Example mailto: "mailto:email@example.com?subject=Réservation&body=Nom:%20...Date:%20..."

5. About section:
   - Section title
   - 2-3 paragraphs telling the story of the business
   - What makes them unique
   ${hasPhotos ? `- OBLIGATOIRE: Intégrer TOUTES les photos uploadées ${JSON.stringify(data.photoUrls)} avec des balises <img src="URL" alt="..." style="width: 100%; max-width: 400px; height: auto; object-fit: cover; border-radius: 8px;"> dans cette section. Créer une galerie ou grille pour afficher toutes les photos.` : '- 2-3 photos from Unsplash matching business type (pasta, pizza, products, etc.)'}

6. Services/Specialties section:
   - Section title
   - Grid of 4-6 services/products with icons, names, and descriptions
   ${hasPhotos && data.photoUrls!.length > 3 ? `- OBLIGATOIRE: Utiliser les photos uploadées ${JSON.stringify(data.photoUrls)} pour illustrer les services avec <img> tags` : '- Use Unsplash photos for each service if needed'}

7. Client Reviews section (OBLIGATOIRE):
   - Section title "Avis de nos clients" or "Témoignages"
   ${hasReviews ? `- UTILISER LES VRAIS AVIS fournis dans les reviews: "${data.reviews?.substring(0, 100)}..."` : ''}
   - ${hasReviews ? 'Minimum 3' : '3'} review cards avec:
     * 5 golden stars (★★★★★ in yellow/gold color #FFD700)
     * Client name (${hasReviews ? 'utiliser les noms fournis' : 'realistic, matching region'})
     * ${hasReviews ? 'Utiliser les commentaires exacts fournis' : 'Realistic testimonial (2-3 sentences) specific to the business type'}
     * Date (recent, like "Il y a 2 semaines")
   - Style: cards avec fond légèrement différent, ombre, étoiles bien visibles

8. Contact section:
   - Section title
   - Real phone number extracted from description (format: +41 XX XXX XX XX)
   - Real email if mentioned
   - Real address if mentioned
   - Opening hours if mentioned
   - Contact form with fields (Nom, Email, Message)

9. Footer: business name, copyright, social media links

IMPORTANT:
- Generate COMPLETE content for EVERY section - no placeholders, no empty divs
- Extract and use REAL contact info from the description
- Use Unsplash images with direct URLs matching the business type
- Include working reservation modal with mailto: functionality
- STYLE: Commerce local chaleureux et humain - PAS de style startup/SaaS/tech/corporate. Couleurs chaleureuses (rouge, orange, marron, vert naturel), typographie lisible et conviviale, espacement généreux, design accueillant
- Mobile responsive layout
- N'utilise AUCUN emoji dans le site généré. Pas d'émojis dans les titres, boutons, textes, icônes ou anywhere. Utilise uniquement du texte et des icônes CSS/SVG.

INSTRUCTIONS SUPPLÉMENTAIRES:
1. LOGO: ${data.logoUrl ? `🚨 CRITIQUE - Le logo DOIT être visible dans le header: <img src="${data.logoUrl}" alt="Logo" style="max-height: 50px; height: 50px; width: auto; object-fit: contain; display: block;"> - Remplacer complètement le nom textuel par cette image. Vérifier que l'URL est correcte et l'image sera chargée.` : 'Utiliser le nom du business en texte dans le header'}
2. PHOTOS UPLOADÉES: ${hasPhotos ? `🚨 CRITIQUE - TOUTES les photos suivantes DOIVENT apparaître dans le site: ${JSON.stringify(data.photoUrls)}\n   - Créer une section Galerie dédiée avec toutes les photos en grille responsive\n   - Ou intégrer les photos dans les sections About et Services\n   - Utiliser: <img src="URL_PHOTO" alt="..." style="width: 100%; height: 250px; object-fit: cover; border-radius: 12px;">\n   - Chaque photo doit être visible et bien stylée` : 'Utiliser des photos Unsplash si nécessaire'}
3. IMAGES Unsplash par défaut (si pas de photos uploadées):
   - Hero background: https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200
   - Pasta photo: https://images.unsplash.com/photo-1473093226555-0b7ce5efdd0e?w=600
   - Pizza photo: https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600
4. RÉSERVATION: Bouton "Réserver" ouvre un modal HTML/CSS/JS avec formulaire (Nom, Email, Téléphone, Date, Heure, Nombre de personnes) qui utilise mailto: vers l'email du restaurant extrait de la description
5. AVIS: Section avec 3 avis clients comprenant des étoiles ⭐⭐⭐⭐⭐ dorées et noms réalistes

Return ONLY the complete HTML file (no markdown, no backticks, no explanation)`;

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
