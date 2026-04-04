import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

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

// Simple template engine for {{VAR}} and {{#IF}}...{{/IF}}
function renderTemplate(template: string, data: Record<string, any>): string {
  let result = template;

  // Replace simple variables {{VAR}}
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value || '');
  }

  // Handle conditional blocks {{#VAR}}...{{/VAR}}
  for (const [key, value] of Object.entries(data)) {
    const blockRegex = new RegExp(`{{#${key}}}([\\s\\S]*?){{/${key}}}`, 'g');
    if (value) {
      // Keep content, remove markers
      result = result.replace(blockRegex, '$1');
    } else {
      // Remove entire block
      result = result.replace(blockRegex, '');
    }
  }

  // Handle negative conditional blocks {{^VAR}}...{{/VAR}}
  for (const [key, value] of Object.entries(data)) {
    const blockRegex = new RegExp(`{{\\^${key}}}([\\s\\S]*?){{/${key}}}`, 'g');
    if (!value) {
      // Keep content, remove markers
      result = result.replace(blockRegex, '$1');
    } else {
      // Remove entire block
      result = result.replace(blockRegex, '');
    }
  }

  return result;
}

// Extract info from prompt
function parsePrompt(prompt: string) {
  const lines = prompt.split('\n');

  // Extract business name (first line or after "est")
  let nom = 'Mon Commerce';
  const nameMatch = prompt.match(/^(.+?)\s+est\s+/i) || prompt.match(/(?:je suis|nous sommes)\s+(.+?)(?:\.|,|$)/i);
  if (nameMatch) {
    nom = nameMatch[1].trim();
  }

  // Extract type
  let type = 'commerce';
  if (/restaurant|pizzeria|trattoria|osteria/i.test(prompt)) type = 'Restaurant italien';
  else if (/café|coffee|barista/i.test(prompt)) type = 'Café';
  else if (/boulangerie|pâtisserie|bakery/i.test(prompt)) type = 'Boulangerie';
  else if (/coiffeur|salon de coiffure|barbier/i.test(prompt)) type = 'Salon de coiffure';

  // Extract city
  let ville = '';
  const cityMatch = prompt.match(/à\s+([A-ZÀ-Ÿ][a-zà-ÿ-]+(?:\s[A-ZÀ-Ÿ][a-zà-ÿ-]+)*)/);
  if (cityMatch) ville = cityMatch[1];

  // Extract phone
  let tel = '';
  const phoneMatch = prompt.match(/(?:tél|téléphone|tel|phone)[:\s]*([+\d\s()-]+)/i);
  if (phoneMatch) tel = phoneMatch[1].trim();

  // Extract email
  let email = '';
  const emailMatch = prompt.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch) email = emailMatch[1];

  // Extract address
  let adresse = '';
  const addrMatch = prompt.match(/(?:adresse|address)[:\s]*([^\n.]+)/i);
  if (addrMatch) adresse = addrMatch[1].trim();

  // Extract hours
  let horaires = '';
  const hoursMatch = prompt.match(/(?:horaires?|ouvert|heures?)[:\s]*([^\n]+(?:\n[^\n]+)*?)(?:\n\n|$)/i);
  if (hoursMatch) horaires = hoursMatch[1].trim();

  // Create description
  let description = prompt;
  // Remove extracted info to keep only descriptive text
  description = description.replace(/(?:tél|téléphone|tel)[:\s]*[+\d\s()-]+/gi, '');
  description = description.replace(/(?:email|mail)[:\s]*[^\s]+/gi, '');
  description = description.replace(/(?:adresse|address)[:\s]*[^\n]+/gi, '');
  description = description.replace(/(?:horaires?|ouvert)[:\s]*[^\n]+/gi, '');
  description = description.trim().substring(0, 500);

  return { nom, type, ville, tel, email, adresse, horaires, description };
}

// Detect template type from prompt
function detectTemplateType(prompt: string): string {
  if (/restaurant|pizzeria|trattoria|osteria|italien/i.test(prompt)) return 'restaurant';
  if (/coiffeur|salon|barbier|coiffure/i.test(prompt)) return 'coiffeur';
  if (/boulangerie|pâtisserie|bakery/i.test(prompt)) return 'boulangerie';
  return 'default';
}

export async function POST(req: NextRequest) {
  try {
    const data: OnboardingData = await req.json();

    console.log('Starting template-based generation...');
    console.log('Prompt length:', data.prompt.length);
    console.log('Logo URL:', data.logoUrl);
    console.log('Photo URLs:', data.photoUrls);

    const hasPhotos = data.photoUrls && data.photoUrls.length > 0;
    const hasReviews = data.reviews && data.reviews.trim().length > 20;

    // Parse prompt to extract data
    const parsedData = parsePrompt(data.prompt);

    // Detect template type
    const templateType = detectTemplateType(data.prompt);
    console.log('Template type:', templateType);

    // Load template
    const templatePath = join(process.cwd(), 'public', 'templates', `${templateType}.html`);
    let template = await readFile(templatePath, 'utf-8');

    // Parse reviews if provided
    let avis1 = { nom: 'Marie Dubois', texte: 'Excellente expérience! Service impeccable et produits de qualité. Je recommande vivement!', date: '2 semaines' };
    let avis2 = { nom: 'Jean-Pierre Martin', texte: 'Toujours un plaisir de venir ici. L\'accueil est chaleureux et professionnel.', date: '1 mois' };
    let avis3 = { nom: 'Sophie Renaud', texte: 'Un endroit authentique qui mérite largement le détour. Bravo pour votre travail!', date: '3 semaines' };

    if (hasReviews && data.reviews) {
      // Simple parsing - split by line breaks and extract name/comment
      const reviewLines = data.reviews.split('\n').filter(l => l.trim());
      if (reviewLines.length >= 3) {
        const parseReview = (line: string) => {
          const match = line.match(/^([^:]+):\s*(.+)$/);
          if (match) return { nom: match[1].trim(), texte: match[2].trim(), date: '2 semaines' };
          return { nom: 'Client', texte: line, date: '2 semaines' };
        };
        avis1 = parseReview(reviewLines[0]);
        avis2 = parseReview(reviewLines[1]);
        avis3 = parseReview(reviewLines[2]);
      }
    }

    // Generate a unique token for this site (for menu links)
    const token = Math.random().toString(36).substring(2, 15);

    // Helper to get initials
    const getInitials = (name: string) => {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    };

    // Prepare template data
    const templateData = {
      NOM: parsedData.nom,
      TYPE: parsedData.type,
      VILLE: parsedData.ville,
      SLOGAN: `L'excellence ${parsedData.type.toLowerCase()} à ${parsedData.ville}`,
      TEL: parsedData.tel,
      EMAIL: parsedData.email,
      ADRESSE: parsedData.adresse,
      HORAIRES: parsedData.horaires,
      DESCRIPTION: parsedData.description,
      LOGO_URL: data.logoUrl || '',
      PHOTO_1: hasPhotos && data.photoUrls![0] ? data.photoUrls![0] : '',
      PHOTO_2: hasPhotos && data.photoUrls![1] ? data.photoUrls![1] : '',
      PHOTO_3: hasPhotos && data.photoUrls![2] ? data.photoUrls![2] : '',
      AVIS_1_NOM: avis1.nom,
      AVIS_1_NOM_INITIAL: getInitials(avis1.nom),
      AVIS_1_TEXTE: avis1.texte,
      AVIS_1_DATE: avis1.date,
      AVIS_2_NOM: avis2.nom,
      AVIS_2_NOM_INITIAL: getInitials(avis2.nom),
      AVIS_2_TEXTE: avis2.texte,
      AVIS_2_DATE: avis2.date,
      AVIS_3_NOM: avis3.nom,
      AVIS_3_NOM_INITIAL: getInitials(avis3.nom),
      AVIS_3_TEXTE: avis3.texte,
      AVIS_3_DATE: avis3.date,
      TOKEN: token
    };

    // Render template
    let html = renderTemplate(template, templateData);

    console.log('✓ HTML generated from template, length:', html.length);

    // Detect if this is a restaurant and generate menu
    const isRestaurant = templateType === 'restaurant';
    let menuHtml: string | undefined;

    if (isRestaurant) {
      console.log('Restaurant detected - generating menu page...');

      // Simple menu template
      menuHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Notre Carte - ${parsedData.nom}</title>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;600&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="font-['Inter'] bg-gradient-to-br from-red-900 to-amber-800 text-white min-h-screen">
    <div class="max-w-4xl mx-auto px-6 py-12">
        <div class="text-center mb-12">
            <a href="#back-to-site" class="text-amber-300 hover:text-amber-200 mb-4 inline-block">&larr; Retour</a>
            <h1 class="font-['Playfair_Display'] text-6xl font-bold mb-4 text-amber-300">${parsedData.nom}</h1>
            <p class="text-2xl text-amber-100">Notre Carte</p>
        </div>

        <div class="space-y-12">
            <section>
                <h2 class="font-['Playfair_Display'] text-4xl font-bold mb-6 text-amber-300 border-b-2 border-amber-500 pb-2">Entrées</h2>
                <div class="space-y-4">
                    <div class="flex justify-between items-start">
                        <div class="flex-1"><h3 class="font-semibold text-xl">Bruschetta</h3><p class="text-amber-200">Tomates fraîches, basilic et huile d'olive</p></div>
                        <span class="text-amber-300 font-bold ml-4">12 CHF</span>
                    </div>
                    <div class="flex justify-between items-start">
                        <div class="flex-1"><h3 class="font-semibold text-xl">Carpaccio</h3><p class="text-amber-200">Fines tranches de boeuf, roquette et parmesan</p></div>
                        <span class="text-amber-300 font-bold ml-4">15 CHF</span>
                    </div>
                    <div class="flex justify-between items-start">
                        <div class="flex-1"><h3 class="font-semibold text-xl">Salade Caprese</h3><p class="text-amber-200">Mozzarella di bufala, tomates et basilic</p></div>
                        <span class="text-amber-300 font-bold ml-4">13 CHF</span>
                    </div>
                </div>
            </section>

            <section>
                <h2 class="font-['Playfair_Display'] text-4xl font-bold mb-6 text-amber-300 border-b-2 border-amber-500 pb-2">Plats Principaux</h2>
                <div class="space-y-4">
                    <div class="flex justify-between items-start">
                        <div class="flex-1"><h3 class="font-semibold text-xl">Pizza Margherita</h3><p class="text-amber-200">Sauce tomate, mozzarella et basilic</p></div>
                        <span class="text-amber-300 font-bold ml-4">22 CHF</span>
                    </div>
                    <div class="flex justify-between items-start">
                        <div class="flex-1"><h3 class="font-semibold text-xl">Pasta Carbonara</h3><p class="text-amber-200">Guanciale, pecorino, œufs et poivre</p></div>
                        <span class="text-amber-300 font-bold ml-4">25 CHF</span>
                    </div>
                    <div class="flex justify-between items-start">
                        <div class="flex-1"><h3 class="font-semibold text-xl">Osso Buco</h3><p class="text-amber-200">Jarret de veau mijoté, risotto au safran</p></div>
                        <span class="text-amber-300 font-bold ml-4">32 CHF</span>
                    </div>
                    <div class="flex justify-between items-start">
                        <div class="flex-1"><h3 class="font-semibold text-xl">Lasagne Bolognese</h3><p class="text-amber-200">Lasagnes maison à la viande</p></div>
                        <span class="text-amber-300 font-bold ml-4">24 CHF</span>
                    </div>
                </div>
            </section>

            <section>
                <h2 class="font-['Playfair_Display'] text-4xl font-bold mb-6 text-amber-300 border-b-2 border-amber-500 pb-2">Desserts</h2>
                <div class="space-y-4">
                    <div class="flex justify-between items-start">
                        <div class="flex-1"><h3 class="font-semibold text-xl">Tiramisu</h3><p class="text-amber-200">Le classique italien au mascarpone</p></div>
                        <span class="text-amber-300 font-bold ml-4">9 CHF</span>
                    </div>
                    <div class="flex justify-between items-start">
                        <div class="flex-1"><h3 class="font-semibold text-xl">Panna Cotta</h3><p class="text-amber-200">Crème onctueuse aux fruits rouges</p></div>
                        <span class="text-amber-300 font-bold ml-4">8 CHF</span>
                    </div>
                    <div class="flex justify-between items-start">
                        <div class="flex-1"><h3 class="font-semibold text-xl">Gelato</h3><p class="text-amber-200">Glace artisanale, 3 boules</p></div>
                        <span class="text-amber-300 font-bold ml-4">7 CHF</span>
                    </div>
                </div>
            </section>

            <section>
                <h2 class="font-['Playfair_Display'] text-4xl font-bold mb-6 text-amber-300 border-b-2 border-amber-500 pb-2">Boissons</h2>
                <div class="space-y-4">
                    <div class="flex justify-between items-start">
                        <div class="flex-1"><h3 class="font-semibold text-xl">Vin Rouge / Blanc</h3><p class="text-amber-200">Verre / Bouteille</p></div>
                        <span class="text-amber-300 font-bold ml-4">6 / 28 CHF</span>
                    </div>
                    <div class="flex justify-between items-start">
                        <div class="flex-1"><h3 class="font-semibold text-xl">Prosecco</h3><p class="text-amber-200">Verre</p></div>
                        <span class="text-amber-300 font-bold ml-4">7 CHF</span>
                    </div>
                    <div class="flex justify-between items-start">
                        <div class="flex-1"><h3 class="font-semibold text-xl">Café / Espresso</h3><p class="text-amber-200">Café italien</p></div>
                        <span class="text-amber-300 font-bold ml-4">4 CHF</span>
                    </div>
                    <div class="flex justify-between items-start">
                        <div class="flex-1"><h3 class="font-semibold text-xl">Eau Minérale</h3><p class="text-amber-200">50cl</p></div>
                        <span class="text-amber-300 font-bold ml-4">3 CHF</span>
                    </div>
                </div>
            </section>
        </div>
    </div>
</body>
</html>`;
    }

    return NextResponse.json({
      html: html.trim(),
      menuHtml,
      suggestedName: parsedData.nom
    } satisfies GeneratedSite);
  } catch (err) {
    console.error('=== GENERATION ERROR ===');
    console.error('Error type:', err instanceof Error ? err.constructor.name : typeof err);
    console.error('Error message:', err instanceof Error ? err.message : String(err));
    console.error('Error stack:', err instanceof Error ? err.stack : 'No stack trace');
    console.error('======================');

    const errorMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.json({
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? String(err) : undefined
    }, { status: 500 });
  }
}
