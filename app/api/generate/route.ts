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

    const systemPrompt = `Tu es un expert designer web spécialisé en sites pour commerces locaux. Tu génères du HTML/CSS de QUALITÉ PROFESSIONNELLE.

═══════════════════════════════════════════════════════════════════
RÈGLES DE DESIGN PROFESSIONNELLES
═══════════════════════════════════════════════════════════════════

TYPOGRAPHIE:
- Headers: Playfair Display (serif, élégant) ou Montserrat (sans-serif, moderne)
- Body: Open Sans ou Lato (lisibilité optimale)
- Tailles: h1=3-4rem, h2=2.5rem, h3=1.8rem, p=1.1rem, minimum 16px
- Line-height: 1.6-1.8 pour le texte, 1.2 pour les titres
- Letter-spacing: titres=-0.02em, texte=normal

COULEURS PAR TYPE:
- Restaurant italien: Primaire #8B1A1A (bordeaux), Secondaire #C9A84C (or), Accent #FFF8E7 (crème)
- Café: Primaire #3B2621 (marron), Secondaire #C4A57B (beige), Accent #E8DCC8
- Boulangerie: Primaire #D4A574 (beige doré), Secondaire #8B5A3C (marron), Accent #FFF5E6
- Coiffeur: Primaire #1A1A1A (noir), Secondaire #C9A84C (or), Accent #F5F5F5
- Boutique: Primaire #2C3E50 (bleu nuit), Secondaire #3498DB (bleu), Accent #ECF0F1

ESPACEMENTS:
- Sections: padding 5rem 5% (mobile: 3rem 5%)
- Container max-width: 1200px
- Gap entre éléments: 2-3rem
- Marges internes: 1.5-2rem

EFFETS VISUELS:
- Ombres douces: box-shadow: 0 4px 20px rgba(0,0,0,0.1)
- Ombres hover: box-shadow: 0 8px 30px rgba(0,0,0,0.15)
- Transitions: 0.3s ease pour tout (hover, focus)
- Border-radius: 12px pour cartes, 50px pour boutons
- Backdrop-filter: blur(10px) pour overlay

BOUTONS:
- Primaire: background=couleur primaire, padding=1rem 2.5rem, border-radius=50px
- Hover: transform: translateY(-2px), box-shadow augmentée
- Active: transform: scale(0.98)
- Font-weight: 600, font-size: 1.1rem

═══════════════════════════════════════════════════════════════════
STRUCTURE HTML OBLIGATOIRE (7 SECTIONS)
═══════════════════════════════════════════════════════════════════

1. NAVIGATION FIXE (sticky top-0, z-index: 1000)
   - Logo ou nom (50px height si logo)
   - Menu: Accueil, À propos, Services, Contact + "Notre Carte" si restaurant
   - Smooth scroll: html { scroll-behavior: smooth; }
   - Background: rgba(primaire, 0.95) avec backdrop-filter: blur(10px)

2. HERO ANIMÉ (100vh, gradient background)
   - JAMAIS de photo de fond de restaurant/salle
   - Gradient selon type (voir couleurs ci-dessus)
   - Logo centré (300px max) avec animations CSS autour
   - Titre H1 + sous-titre + 2 boutons CTA
   - Animations CSS pures avec @keyframes (exemples fournis)

3. À PROPOS (background alterné, ex: #FAF8F3)
   - Titre H2
   - 2-3 paragraphes (histoire, valeurs, équipe)
   - Grille 3 colonnes: icônes + points forts
   - Photos uploadées si fournies (galerie responsive)

4. SERVICES/SPÉCIALITÉS
   - Titre H2 + sous-titre
   - Grille responsive 3 colonnes (mobile: 1 colonne)
   - Cartes avec: image Unsplash (250px height) + titre + description
   - UNIQUEMENT photos de produits/plats, PAS de salle
   - Hover: transform: translateY(-10px)

5. AVIS CLIENTS (background couleur primaire foncé, texte blanc)
   - Titre H2
   - Grille 3 cartes avis (mobile: 1 colonne)
   - Chaque carte: 5 étoiles dorées ★★★★★ + texte + nom + date
   - Style: cards transparentes rgba(255,255,255,0.1)

6. CONTACT (background alterné)
   - Grille 2 colonnes: info + formulaire
   - Info: adresse, tel cliquable, email cliquable, horaires
   - Formulaire: Nom, Email, Téléphone, Date, Heure, Personnes, Message
   - Submit ouvre mailto: avec données pré-remplies

7. FOOTER (background couleur primaire, texte blanc)
   - 3 colonnes: À propos, Navigation, Contact
   - Copyright + année
   - Liens réseaux sociaux (optionnel)

═══════════════════════════════════════════════════════════════════
RESPONSIVE MOBILE-FIRST
═══════════════════════════════════════════════════════════════════

@media (max-width: 768px) {
  - Grilles 3 colonnes → 1 colonne
  - Padding sections: 3rem 5%
  - Font-sizes: h1=2.5rem, h2=2rem, p=1rem
  - Navigation: hamburger menu ou liens plus petits
  - Hero: 70vh au lieu de 100vh
  - Boutons: full-width si nécessaire
}

═══════════════════════════════════════════════════════════════════
ANIMATIONS CSS (EXEMPLES CONCRETS)
═══════════════════════════════════════════════════════════════════

RESTAURANT - Particules circulaires autour du logo:
.hero-container { position: relative; display: inline-block; }
.hero-container::before,
.hero-container::after {
  content: ''; position: absolute; width: 20px; height: 20px;
  background: #FFD700; border-radius: 50%; opacity: 0.8;
  animation: orbit 8s linear infinite;
}
.hero-container::before { animation-delay: 0s; }
.hero-container::after { animation-delay: 4s; }
@keyframes orbit {
  from { transform: rotate(0deg) translateX(200px) rotate(0deg); }
  to { transform: rotate(360deg) translateX(200px) rotate(-360deg); }
}

BOULANGERIE - Étoiles qui tournent:
.hero-container::before { content: '★'; font-size: 2rem; color: #FFD700; }

COIFFEUR - Ciseaux animés:
.hero-container::before,
.hero-container::after {
  content: '✂'; font-size: 3rem; position: absolute;
  animation: scissor 2s ease-in-out infinite;
}

RÈGLES FINALES:
- Aucun emoji dans le HTML (sauf pour animations CSS si symboles nécessaires)
- Tous les liens tel: et mailto: doivent fonctionner
- Code HTML valide, propre, indenté
- Retourner UNIQUEMENT le HTML complet, pas de markdown, pas d'explication`;

    const userPrompt = `═══════════════════════════════════════════════════════════════════
INFORMATIONS DU COMMERCE
═══════════════════════════════════════════════════════════════════

${data.prompt}

${data.logoUrl ? `LOGO: ${data.logoUrl} (OBLIGATOIRE à afficher dans header ET hero)` : 'PAS DE LOGO - Utiliser le nom en texte'}
${hasReviews ? `\nAVIS CLIENTS (utiliser les vrais avis fournis):\n${data.reviews}` : 'PAS D\'AVIS - Générer 3 avis réalistes'}
${hasPhotos ? `\nPHOTOS UPLOADÉES (toutes doivent apparaître):\n${JSON.stringify(data.photoUrls)}` : 'PAS DE PHOTOS - Utiliser Unsplash thématiques'}

═══════════════════════════════════════════════════════════════════
GÉNÈRE UN SITE HTML/CSS COMPLET ET PROFESSIONNEL
═══════════════════════════════════════════════════════════════════

STRUCTURE COMPLÈTE OBLIGATOIRE:

1. DOCTYPE ET HEAD COMPLET
   <!DOCTYPE html>
   <html lang="fr">
   <head>
     <meta charset="UTF-8">
     <meta name="viewport" content="width=device-width, initial-scale=1.0">
     <title>[Nom du commerce] - [Type]</title>
     <link rel="preconnect" href="https://fonts.googleapis.com">
     <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Open+Sans:wght@300;400;600&display=swap" rel="stylesheet">
     <style>
       * { margin: 0; padding: 0; box-sizing: border-box; }
       html { scroll-behavior: smooth; }
       body { font-family: 'Open Sans', sans-serif; color: #333; line-height: 1.6; }
       [... tous les styles CSS ici ...]
     </style>
   </head>

2. NAVIGATION STICKY (position: fixed; top: 0; width: 100%; z-index: 1000)
   - Background: rgba(primaire, 0.95) avec backdrop-filter: blur(10px)
   - Container flex justify-between align-center, padding: 1rem 5%
   - ${data.logoUrl ? `LOGO: <img src="${data.logoUrl}" alt="Logo" style="max-height: 50px; height: 50px; width: auto; object-fit: contain;">` : 'Nom en texte (font-size: 1.8rem, font-weight: 700)'}
   - Menu: <nav><ul style="display: flex; gap: 2rem; list-style: none;">
       <li><a href="#accueil">Accueil</a></li>
       <li><a href="#apropos">À propos</a></li>
       <li><a href="#services">Services</a></li>
       ${data.prompt.match(/restaurant|café|pizzeria|trattoria/i) ? '<li><a href="#menu">Notre Carte</a></li>' : ''}
       <li><a href="#contact">Contact</a></li>
     </ul></nav>
   - Bouton CTA: <a href="#contact" class="btn-nav">Réserver</a>

3. HERO SECTION ANIMÉE (height: 100vh; display: flex; align-items: center; justify-content: center)

   BACKGROUND GRADIENT (PAS DE PHOTO):
   ${data.prompt.match(/restaurant|pizzeria|trattoria|italien/i) ? 'background: linear-gradient(135deg, #8B1A1A 0%, #C9A84C 100%);' : ''}
   ${data.prompt.match(/café|coffee|barista/i) ? 'background: linear-gradient(135deg, #3B2621 0%, #C4A57B 100%);' : ''}
   ${data.prompt.match(/boulangerie|pâtisserie|bakery/i) ? 'background: linear-gradient(135deg, #D4A574 0%, #8B5A3C 100%);' : ''}
   ${data.prompt.match(/coiffeur|salon|beauty/i) ? 'background: linear-gradient(135deg, #1a1a1a 0%, #c9a84c 100%);' : ''}
   (Si aucun match: utiliser gradient approprié au type de commerce)

   STRUCTURE HTML:
   <section id="accueil" class="hero">
     <div class="hero-content">
       ${data.logoUrl ? `
       <div class="hero-logo-wrapper">
         <img src="${data.logoUrl}" alt="Logo" class="hero-logo">
       </div>` : '<h1 class="hero-title">[Nom du commerce]</h1>'}
       <h2 class="hero-subtitle">[Phrase accrocheuse décrivant l'activité]</h2>
       <div class="hero-buttons">
         <a href="#contact" class="btn btn-primary">Réserver une table</a>
         <a href="#apropos" class="btn btn-secondary">Découvrir</a>
       </div>
     </div>
   </section>

   CSS ANIMATIONS (ajouter des particules/éléments animés):
   .hero-logo-wrapper {
     position: relative;
     display: inline-block;
     margin-bottom: 2rem;
   }
   /* Créer 6-8 particules animées avec ::before, ::after et autres éléments */
   .hero-logo-wrapper::before,
   .hero-logo-wrapper::after {
     content: '';
     position: absolute;
     width: 25px;
     height: 25px;
     background: rgba(255, 215, 0, 0.7);
     border-radius: 50%;
     animation: orbit 12s linear infinite;
   }
   .hero-logo-wrapper::before {
     top: 50%;
     left: 50%;
     margin: -12.5px;
     animation-delay: 0s;
   }
   .hero-logo-wrapper::after {
     animation-delay: 6s;
   }
   @keyframes orbit {
     0% { transform: rotate(0deg) translateX(180px) rotate(0deg); opacity: 0.7; }
     50% { opacity: 1; }
     100% { transform: rotate(360deg) translateX(180px) rotate(-360deg); opacity: 0.7; }
   }

   STYLES HERO:
   .hero { color: white; text-align: center; position: relative; overflow: hidden; }
   .hero-content { position: relative; z-index: 2; }
   .hero-logo { max-width: 300px; max-height: 300px; width: auto; height: auto; filter: drop-shadow(0 10px 30px rgba(0,0,0,0.3)); }
   .hero-title { font-size: 4rem; font-weight: 700; margin-bottom: 1rem; text-shadow: 2px 2px 8px rgba(0,0,0,0.3); }
   .hero-subtitle { font-size: 1.5rem; margin-bottom: 2rem; opacity: 0.95; }
   .hero-buttons { display: flex; gap: 1.5rem; justify-content: center; flex-wrap: wrap; }

4. SECTION À PROPOS (padding: 5rem 5%; background: #FAF8F3)
   <section id="apropos" class="about">
     <div class="container">
       <h2 class="section-title">Notre Histoire</h2>
       <p class="section-subtitle">[Sous-titre accrocheur]</p>

       <div class="about-content">
         <div class="about-text">
           <p>[Paragraphe 1: Histoire, fondation, passion]</p>
           <p>[Paragraphe 2: Valeurs, ce qui rend unique]</p>
         </div>
         ${hasPhotos ? `
         <div class="about-gallery">
           ${data.photoUrls!.map((url, i) => `<img src="${url}" alt="Photo ${i+1}" class="about-photo">`).join('\n           ')}
         </div>` : ''}
       </div>

       <div class="about-features">
         <div class="feature-card">
           <div class="feature-icon">🌟</div>
           <h3>[Point fort 1]</h3>
           <p>[Description]</p>
         </div>
         <div class="feature-card">
           <div class="feature-icon">✨</div>
           <h3>[Point fort 2]</h3>
           <p>[Description]</p>
         </div>
         <div class="feature-card">
           <div class="feature-icon">💫</div>
           <h3>[Point fort 3]</h3>
           <p>[Description]</p>
         </div>
       </div>
     </div>
   </section>

   CSS:
   .about-content { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; margin-bottom: 3rem; }
   .about-text p { font-size: 1.1rem; margin-bottom: 1rem; }
   ${hasPhotos ? `.about-gallery { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
   .about-photo { width: 100%; height: 250px; object-fit: cover; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }` : ''}
   .about-features { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; }
   .feature-card { text-align: center; padding: 2rem; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); transition: transform 0.3s; }
   .feature-card:hover { transform: translateY(-10px); }
   .feature-icon { font-size: 3rem; margin-bottom: 1rem; }

5. SECTION SERVICES/SPÉCIALITÉS (padding: 5rem 5%; background: white)
   <section id="services" class="services">
     <div class="container">
       <h2 class="section-title">${data.prompt.match(/restaurant/i) ? 'Nos Spécialités' : 'Nos Services'}</h2>
       <p class="section-subtitle">[Description engageante]</p>

       <div class="services-grid">
         ${hasPhotos && data.photoUrls!.length >= 4 ?
           data.photoUrls!.slice(0, 6).map((url, i) => `
         <div class="service-card">
           <img src="${url}" alt="Service ${i+1}" class="service-image">
           <div class="service-content">
             <h3>[Nom du service/plat ${i+1}]</h3>
             <p>[Description détaillée]</p>
           </div>
         </div>`).join('\n         ')
         : `
         <!-- Utiliser photos Unsplash thématiques -->
         <div class="service-card">
           <img src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600" alt="Pizza">
           <div class="service-content">
             <h3>[Nom spécialité 1]</h3>
             <p>[Description]</p>
           </div>
         </div>
         <div class="service-card">
           <img src="https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600" alt="Pâtes">
           <div class="service-content">
             <h3>[Nom spécialité 2]</h3>
             <p>[Description]</p>
           </div>
         </div>
         <!-- Répéter pour 4-6 services avec photos appropriées -->
         `}
       </div>
     </div>
   </section>

   CSS:
   .services-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; }
   .service-card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 5px 25px rgba(0,0,0,0.1); transition: transform 0.3s, box-shadow 0.3s; }
   .service-card:hover { transform: translateY(-10px); box-shadow: 0 8px 35px rgba(0,0,0,0.15); }
   .service-image { width: 100%; height: 250px; object-fit: cover; }
   .service-content { padding: 1.5rem; }
   .service-content h3 { font-size: 1.5rem; color: [couleur primaire]; margin-bottom: 0.5rem; }
   .service-content p { color: #666; font-size: 1rem; }

6. SECTION AVIS CLIENTS (padding: 5rem 5%; background: [couleur primaire]; color: white)
   <section id="avis" class="reviews">
     <div class="container">
       <h2 class="section-title" style="color: [couleur or/accent];">Ce que disent nos clients</h2>
       <p class="section-subtitle">Votre satisfaction est notre fierté</p>

       <div class="reviews-grid">
         ${hasReviews ? `
         <!-- UTILISER LES VRAIS AVIS FOURNIS -->
         ${data.reviews}` : `
         <div class="review-card">
           <div class="stars">★★★★★</div>
           <p class="review-text">"[Commentaire réaliste et spécifique au type de commerce, 2-3 phrases]"</p>
           <p class="review-author">[Prénom Nom]</p>
           <p class="review-date">Il y a 2 semaines</p>
         </div>
         <div class="review-card">
           <div class="stars">★★★★★</div>
           <p class="review-text">"[Commentaire 2]"</p>
           <p class="review-author">[Prénom2 Nom2]</p>
           <p class="review-date">Il y a 1 mois</p>
         </div>
         <div class="review-card">
           <div class="stars">★★★★★</div>
           <p class="review-text">"[Commentaire 3]"</p>
           <p class="review-author">[Prénom3 Nom3]</p>
           <p class="review-date">Il y a 3 semaines</p>
         </div>`}
       </div>
     </div>
   </section>

   CSS:
   .reviews { background: [couleur primaire foncé]; }
   .reviews .section-title { color: [couleur or/accent]; }
   .reviews-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; }
   .review-card { background: rgba(255,255,255,0.1); padding: 2rem; border-radius: 12px; backdrop-filter: blur(10px); }
   .stars { color: #FFD700; font-size: 1.5rem; margin-bottom: 1rem; letter-spacing: 0.2rem; }
   .review-text { font-size: 1.1rem; line-height: 1.7; margin-bottom: 1rem; font-style: italic; }
   .review-author { font-weight: 600; color: [couleur accent]; margin-bottom: 0.3rem; }
   .review-date { font-size: 0.9rem; opacity: 0.8; }

7. SECTION CONTACT (padding: 5rem 5%; background: #FAF8F3)
   <section id="contact" class="contact">
     <div class="container">
       <h2 class="section-title">Nous Contacter</h2>
       <p class="section-subtitle">Nous serions ravis de vous accueillir</p>

       <div class="contact-wrapper">
         <div class="contact-info">
           <h3>Coordonnées</h3>
           <div class="contact-item">
             <strong>Téléphone:</strong><br>
             <a href="tel:[téléphone extrait]">[téléphone formaté]</a>
           </div>
           ${data.prompt.match(/email|mail|@/i) ? `
           <div class="contact-item">
             <strong>Email:</strong><br>
             <a href="mailto:[email extrait]">[email]</a>
           </div>` : ''}
           ${data.prompt.match(/adresse|rue|avenue/i) || data.prompt.match(/\d{4}\s+[A-Za-zÀ-ÿ]/i) ? `
           <div class="contact-item">
             <strong>Adresse:</strong><br>
             [adresse extraite de la description]
           </div>` : ''}
           ${data.prompt.match(/horaire|ouvert|fermé|lundi|mardi/i) ? `
           <div class="contact-item">
             <strong>Horaires:</strong><br>
             [horaires extraits]
           </div>` : ''}
         </div>

         <form class="contact-form" action="mailto:[email]?subject=Contact depuis le site" method="post" enctype="text/plain">
           <input type="text" name="nom" placeholder="Votre nom *" required>
           <input type="email" name="email" placeholder="Votre email *" required>
           <input type="tel" name="telephone" placeholder="Téléphone">
           <input type="date" name="date" placeholder="Date souhaitée">
           <input type="time" name="heure" placeholder="Heure">
           <input type="number" name="personnes" placeholder="Nombre de personnes" min="1">
           <textarea name="message" placeholder="Votre message" rows="4"></textarea>
           <button type="submit" class="btn btn-primary">Envoyer</button>
         </form>
       </div>
     </div>
   </section>

   CSS:
   .contact-wrapper { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; }
   .contact-info h3 { font-size: 2rem; color: [couleur primaire]; margin-bottom: 1.5rem; }
   .contact-item { margin-bottom: 1.5rem; padding-left: 2rem; position: relative; }
   .contact-item::before { content: ''; position: absolute; left: 0; top: 0.3rem; width: 1rem; height: 1rem; background: [couleur accent]; border-radius: 50%; }
   .contact-item a { color: [couleur primaire]; text-decoration: none; font-weight: 600; }
   .contact-form { display: flex; flex-direction: column; gap: 1rem; }
   .contact-form input, .contact-form textarea { padding: 1rem; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem; }
   .contact-form button { align-self: flex-start; }

8. FOOTER (padding: 3rem 5%; background: [couleur primaire]; color: white)
   <footer class="footer">
     <div class="container">
       <div class="footer-content">
         <div class="footer-col">
           <h4>[Nom du commerce]</h4>
           <p>[Description courte]</p>
         </div>
         <div class="footer-col">
           <h4>Navigation</h4>
           <a href="#accueil">Accueil</a>
           <a href="#apropos">À propos</a>
           <a href="#services">Services</a>
           <a href="#contact">Contact</a>
         </div>
         <div class="footer-col">
           <h4>Contact</h4>
           <a href="tel:[tel]">[téléphone]</a>
           <a href="mailto:[email]">[email]</a>
           <p>[adresse]</p>
         </div>
       </div>
       <div class="footer-bottom">
         <p>&copy; 2026 [Nom]. Tous droits réservés.</p>
       </div>
     </div>
   </footer>

   CSS:
   .footer-content { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; margin-bottom: 2rem; }
   .footer-col h4 { color: [couleur accent]; margin-bottom: 1rem; }
   .footer-col a { display: block; color: rgba(255,255,255,0.8); text-decoration: none; margin-bottom: 0.5rem; }
   .footer-col a:hover { color: [couleur accent]; }
   .footer-bottom { border-top: 1px solid rgba(255,255,255,0.2); padding-top: 2rem; text-align: center; color: rgba(255,255,255,0.6); }

═══════════════════════════════════════════════════════════════════
STYLES CSS COMMUNS (À INCLURE DANS <style>)
═══════════════════════════════════════════════════════════════════

/* Boutons */
.btn {
  display: inline-block;
  padding: 1rem 2.5rem;
  border-radius: 50px;
  font-weight: 600;
  font-size: 1.1rem;
  text-decoration: none;
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;
}
.btn-primary {
  background: [couleur accent or];
  color: [couleur primaire foncé];
}
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(0,0,0,0.2);
}
.btn-secondary {
  background: transparent;
  color: white;
  border: 2px solid white;
}

/* Sections communes */
.container { max-width: 1200px; margin: 0 auto; }
section { padding: 5rem 5%; }
.section-title {
  font-size: 2.5rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 1rem;
  color: [couleur primaire];
}
.section-subtitle {
  text-align: center;
  font-size: 1.2rem;
  color: [couleur secondaire];
  margin-bottom: 3rem;
}

/* Responsive */
@media (max-width: 768px) {
  section { padding: 3rem 5%; }
  .section-title { font-size: 2rem; }
  .hero { height: 70vh; }
  .hero-title { font-size: 2.5rem; }
  .about-content,
  .contact-wrapper,
  .footer-content { grid-template-columns: 1fr; }
  .services-grid,
  .reviews-grid,
  .about-features { grid-template-columns: 1fr; }
  .hero-buttons { flex-direction: column; }
}

═══════════════════════════════════════════════════════════════════
RÈGLES FINALES CRITIQUES
═══════════════════════════════════════════════════════════════════

✓ Extraire TOUTES les infos de contact de la description (tel, email, adresse, horaires)
✓ ${data.logoUrl ? `LOGO: Afficher dans header ET hero avec l'URL ${data.logoUrl}` : 'Pas de logo'}
✓ ${hasPhotos ? `PHOTOS: Toutes les photos ${JSON.stringify(data.photoUrls)} doivent apparaître` : 'Photos Unsplash thématiques uniquement'}
✓ ${hasReviews ? 'AVIS: Utiliser les vrais avis fournis' : 'Générer 3 avis réalistes'}
✓ Générer du contenu COMPLET pour chaque section (pas de placeholders vides)
✓ Style chaleureux de commerce local (PAS corporate/SaaS/startup)
✓ Tous les liens tel: et mailto: doivent fonctionner
✓ Animation CSS pure dans le hero (pas de librairie externe)
✓ Responsive mobile-first
✓ Code HTML propre, indenté, valide
✓ Fermer tous les tags: </body></html>

RETOURNER UNIQUEMENT LE HTML COMPLET - PAS de markdown, PAS d'explication, JUSTE le code HTML.`;

    const message = await retryWithBackoff(() =>
      client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 12000,
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
