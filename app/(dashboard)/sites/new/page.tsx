'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { generateSlug, TEMPLATE_BLOCKS } from '@/lib/utils';
import { DEFAULT_THEME } from '@/lib/types';
import type { SiteBlock, SiteTheme } from '@/lib/types';
import type { OnboardingData } from '@/app/api/generate/route';
import {
  ArrowRight, ArrowLeft, CheckCircle2, Wand2,
  Building2, Phone, Mail, MapPin, Clock, Users,
  Upload, Star, Calendar, Hash,
} from 'lucide-react';

const BRAND_COLORS = [
  { hex: '#7c3aed', label: 'Violet' },
  { hex: '#2563eb', label: 'Bleu' },
  { hex: '#0891b2', label: 'Cyan' },
  { hex: '#059669', label: 'Émeraude' },
  { hex: '#d97706', label: 'Ambre' },
  { hex: '#dc2626', label: 'Rouge' },
  { hex: '#db2777', label: 'Rose' },
  { hex: '#334155', label: 'Ardoise' },
];

const TONES = [
  { id: 'luxury', label: 'Luxe', description: 'Élégant & premium', emoji: '✨' },
  { id: 'professional', label: 'Professionnel', description: 'Clair & autoritaire', emoji: '💼' },
  { id: 'fun', label: 'Fun', description: 'Énergique & ludique', emoji: '🎉' },
  { id: 'minimal', label: 'Minimaliste', description: 'Épuré & discret', emoji: '◽' },
] as const;

const STEPS = [
  { id: 'identity', label: 'Votre entreprise', icon: Building2 },
  { id: 'activity', label: 'Votre activité', icon: Star },
  { id: 'style', label: 'Style & couleurs', icon: Wand2 },
  { id: 'media', label: 'Médias & avis', icon: Upload },
] as const;

type Step = typeof STEPS[number]['id'] | 'generating';

function FileUploadZone({
  label, accept, multiple, onFiles, preview,
}: {
  label: string; accept: string; multiple?: boolean;
  onFiles: (files: File[]) => void; preview?: string | string[];
}) {
  const ref = React.useRef<HTMLInputElement>(null);
  const previews = Array.isArray(preview) ? preview : preview ? [preview] : [];

  return (
    <div>
      <label className="text-sm font-medium text-[var(--foreground)] mb-2 block">{label}</label>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="w-full border-2 border-dashed border-[var(--border)] rounded-xl p-4 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all text-center"
      >
        {previews.length > 0 ? (
          <div className="flex flex-wrap gap-2 justify-center">
            {previews.map((src, i) => (
              <img key={i} src={src} alt="" className="h-16 w-16 object-cover rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 py-2">
            <Upload className="h-6 w-6 text-gray-400" />
            <span className="text-sm text-gray-400">Cliquez pour choisir un fichier</span>
            <span className="text-xs text-gray-500">PNG, JPG, SVG jusqu&apos;à 5 Mo</span>
          </div>
        )}
      </button>
      <input
        ref={ref}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={e => onFiles(Array.from(e.target.files ?? []))}
      />
    </div>
  );
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

export default function NewSitePage() {
  const router = useRouter();
  const { toast } = useToast();

  // Step 1 — Identity
  const [businessName, setBusinessName] = React.useState('');
  const [businessType, setBusinessType] = React.useState('');
  const [city, setCity] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [businessEmail, setBusinessEmail] = React.useState('');
  const [foundingYear, setFoundingYear] = React.useState('');
  const [teamSize, setTeamSize] = React.useState('');

  // Step 2 — Activity
  const [description, setDescription] = React.useState('');
  const [services, setServices] = React.useState('');
  const [targetAudience, setTargetAudience] = React.useState('');
  const [openingHours, setOpeningHours] = React.useState('');
  const [keywords, setKeywords] = React.useState('');

  // Step 3 — Style
  const [tone, setTone] = React.useState<OnboardingData['tone']>('professional');
  const [brandColor, setBrandColor] = React.useState('#7c3aed');
  const [customColor, setCustomColor] = React.useState('');
  const [mapsLink, setMapsLink] = React.useState('');

  // Step 4 — Media
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);
  const [photosPreviews, setPhotosPreviews] = React.useState<string[]>([]);
  const [reviews, setReviews] = React.useState('');

  // UI
  const [step, setStep] = React.useState<Step>('identity');
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [generatingStatus, setGeneratingStatus] = React.useState('');

  const activeColor = customColor || brandColor;
  const stepIndex = STEPS.findIndex(s => s.id === step);

  function validate(s: string) {
    const errs: Record<string, string> = {};
    if (s === 'identity') {
      if (!businessName.trim()) errs.businessName = 'Le nom est requis';
      if (!businessType.trim()) errs.businessType = 'Le type d\'activité est requis';
      if (!city.trim()) errs.city = 'La ville est requise';
    }
    if (s === 'activity') {
      if (!description.trim()) errs.description = 'La description est requise';
      if (!services.trim()) errs.services = 'Les services/produits sont requis';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function next(current: string, target: Step) {
    if (validate(current)) setStep(target);
  }

  async function handleLogoFiles(files: File[]) {
    if (!files[0]) return;
    const url = await readAsDataURL(files[0]);
    setLogoPreview(url);
  }

  async function handlePhotoFiles(files: File[]) {
    const urls = await Promise.all(files.slice(0, 5).map(readAsDataURL));
    setPhotosPreviews(prev => [...prev, ...urls].slice(0, 5));
  }

  async function handleGenerate() {
    setStep('generating');
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    let blocks: SiteBlock[];
    let theme: SiteTheme;
    let siteName = businessName;

    const payload: OnboardingData = {
      businessName, businessType, city, address, phone, businessEmail,
      foundingYear, teamSize, description, services, targetAudience,
      openingHours, keywords, tone, brandColor: activeColor, mapsLink,
      hasLogo: !!logoPreview, photosCount: photosPreviews.length,
      reviews,
    };

    try {
      setGeneratingStatus('Analyse de vos informations...');
      await new Promise(r => setTimeout(r, 400));
      setGeneratingStatus('Création du contenu personnalisé avec l\'IA...');

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text());
      const generated = await res.json();
      if (generated.error) throw new Error(generated.error);

      blocks = generated.blocks;
      theme = generated.theme;
      siteName = generated.suggestedName || businessName;
      setGeneratingStatus('Assemblage des blocs...');
    } catch (err) {
      console.warn('AI generation failed, using template:', err);
      toast('Génération IA ignorée — utilisation du modèle par défaut.', 'info');
      setGeneratingStatus('Utilisation du modèle par défaut...');
      blocks = TEMPLATE_BLOCKS['saas'];
      theme = { ...DEFAULT_THEME, primaryColor: activeColor };
      await new Promise(r => setTimeout(r, 800));
    }

    setGeneratingStatus('Sauvegarde en base de données...');
    const slug = generateSlug(siteName);

    const { data, error } = await supabase
      .from('sites')
      .insert({ user_id: user.id, name: siteName, slug, template: 'saas', status: 'draft', blocks, theme })
      .select()
      .single();

    if (error) {
      toast('Échec de la création du site : ' + error.message, 'error');
      setStep('media');
    } else {
      router.push(`/sites/${data.id}/edit`);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      {/* Progress bar */}
      {step !== 'generating' && (
        <div className="flex items-center gap-2 mb-10">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.id}>
              <div className={`flex items-center gap-1.5 text-xs font-medium ${i <= stepIndex ? 'text-purple-400' : 'text-gray-500'}`}>
                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs shrink-0 ${
                  i < stepIndex ? 'bg-purple-600 text-white' :
                  i === stepIndex ? 'bg-purple-600/30 text-purple-400 ring-2 ring-purple-500' :
                  'bg-[var(--secondary)] text-gray-500'
                }`}>
                  {i < stepIndex ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <span className="hidden md:inline">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px ${i < stepIndex ? 'bg-purple-600' : 'bg-[var(--border)]'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">

        {/* Step 1 — Identity */}
        {step === 'identity' && (
          <motion.div key="identity" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h1 className="text-3xl font-bold text-white mb-1">Votre entreprise</h1>
            <p className="text-gray-400 mb-8">Dites-nous qui vous êtes.</p>

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Input label="Nom de l'entreprise *" placeholder="ex. Pizzeria Napoli"
                    value={businessName} onChange={e => setBusinessName(e.target.value)} error={errors.businessName} />
                </div>
                <div className="sm:col-span-2">
                  <Input label="Type d'activité *" placeholder="ex. Restaurant italien, Salon de coiffure, Agence web..."
                    value={businessType} onChange={e => setBusinessType(e.target.value)} error={errors.businessType} />
                </div>
                <Input label="Ville *" placeholder="ex. Bévilard"
                  value={city} onChange={e => setCity(e.target.value)} error={errors.city} />
                <Input label="Adresse" placeholder="ex. Rue de la Gare 12"
                  value={address} onChange={e => setAddress(e.target.value)} />
                <Input label="Téléphone" placeholder="ex. +41 32 123 45 67" type="tel"
                  value={phone} onChange={e => setPhone(e.target.value)} />
                <Input label="E-mail professionnel" placeholder="ex. contact@monentreprise.ch" type="email"
                  value={businessEmail} onChange={e => setBusinessEmail(e.target.value)} />
                <Input label="Année de fondation" placeholder="ex. 2010" type="number"
                  value={foundingYear} onChange={e => setFoundingYear(e.target.value)} />
                <Input label="Taille de l'équipe" placeholder="ex. 5, 10-20, +50"
                  value={teamSize} onChange={e => setTeamSize(e.target.value)} />
              </div>
            </div>

            <Button onClick={() => next('identity', 'activity')} size="lg" className="w-full mt-8">
              Continuer <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        )}

        {/* Step 2 — Activity */}
        {step === 'activity' && (
          <motion.div key="activity" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h1 className="text-3xl font-bold text-white mb-1">Votre activité</h1>
            <p className="text-gray-400 mb-8">Plus vous donnez de détails, meilleur sera le résultat.</p>

            <div className="flex flex-col gap-4">
              <Textarea label="Description de l'entreprise *"
                placeholder="Décrivez votre activité, votre histoire, ce qui vous rend unique..."
                value={description} onChange={e => setDescription(e.target.value)}
                error={errors.description} className="min-h-[100px]" />
              <Textarea label="Services & produits *"
                placeholder="Listez vos offres principales, une par ligne..."
                value={services} onChange={e => setServices(e.target.value)}
                error={errors.services} className="min-h-[80px]" />
              <Input label="Public cible" placeholder="ex. Familles, Jeunes professionnels, PME locales..."
                value={targetAudience} onChange={e => setTargetAudience(e.target.value)} />
              <Textarea label="Horaires d'ouverture"
                placeholder={"Lun-Ven : 9h-18h\nSam : 10h-16h\nDim : Fermé"}
                value={openingHours} onChange={e => setOpeningHours(e.target.value)}
                className="min-h-[80px]" />
              <Input label="Mots-clés SEO" placeholder="ex. restaurant italien, pizza artisanale, Bévilard"
                value={keywords} onChange={e => setKeywords(e.target.value)} />
            </div>

            <div className="flex gap-3 mt-8">
              <Button onClick={() => setStep('identity')} variant="outline" size="lg" className="flex-1">
                <ArrowLeft className="h-4 w-4" /> Retour
              </Button>
              <Button onClick={() => next('activity', 'style')} size="lg" className="flex-1">
                Continuer <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3 — Style */}
        {step === 'style' && (
          <motion.div key="style" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h1 className="text-3xl font-bold text-white mb-1">Style &amp; couleurs</h1>
            <p className="text-gray-400 mb-8">Définissez l&apos;ambiance de votre site.</p>

            <div className="flex flex-col gap-6">
              {/* Tone */}
              <div>
                <label className="text-sm font-medium text-[var(--foreground)] mb-3 block">Ton de la marque</label>
                <div className="grid grid-cols-2 gap-3">
                  {TONES.map(t => (
                    <button key={t.id} type="button" onClick={() => setTone(t.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                        tone === t.id ? 'border-purple-500 bg-purple-500/10' : 'border-[var(--border)] hover:border-purple-500/40'
                      }`}>
                      <span className="text-xl">{t.emoji}</span>
                      <div>
                        <div className="text-sm font-medium text-white">{t.label}</div>
                        <div className="text-xs text-gray-400">{t.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Brand color */}
              <div>
                <label className="text-sm font-medium text-[var(--foreground)] mb-3 block">Couleur de marque</label>
                <div className="flex flex-wrap gap-3 mb-3">
                  {BRAND_COLORS.map(c => (
                    <button key={c.hex} type="button" onClick={() => { setBrandColor(c.hex); setCustomColor(''); }}
                      className={`h-9 w-9 rounded-full transition-all ${brandColor === c.hex && !customColor ? 'ring-2 ring-offset-2 ring-offset-[var(--card)] ring-white scale-110' : 'hover:scale-105'}`}
                      style={{ backgroundColor: c.hex }} title={c.label} />
                  ))}
                  <div className="flex items-center gap-2">
                    <input type="color" value={customColor || brandColor}
                      onChange={e => setCustomColor(e.target.value)}
                      className="h-9 w-9 rounded-full cursor-pointer border border-[var(--border)] bg-transparent" />
                    <span className="text-xs text-gray-400">Personnalisée</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full border border-white/10" style={{ backgroundColor: activeColor }} />
                  <span className="text-sm text-gray-300 font-mono">{activeColor}</span>
                </div>
              </div>

              {/* Google Maps */}
              <Input label="Lien Google Maps (optionnel)"
                placeholder="https://maps.google.com/..."
                value={mapsLink} onChange={e => setMapsLink(e.target.value)} />
            </div>

            <div className="flex gap-3 mt-8">
              <Button onClick={() => setStep('activity')} variant="outline" size="lg" className="flex-1">
                <ArrowLeft className="h-4 w-4" /> Retour
              </Button>
              <Button onClick={() => setStep('media')} size="lg" className="flex-1">
                Continuer <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 4 — Media */}
        {step === 'media' && (
          <motion.div key="media" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h1 className="text-3xl font-bold text-white mb-1">Médias &amp; avis</h1>
            <p className="text-gray-400 mb-8">Tout est optionnel — mais plus vous en donnez, mieux c&apos;est.</p>

            <div className="flex flex-col gap-6">
              <FileUploadZone
                label="Logo (optionnel)"
                accept="image/*"
                onFiles={handleLogoFiles}
                preview={logoPreview ?? undefined}
              />

              <FileUploadZone
                label="Photos (optionnel — jusqu'à 5)"
                accept="image/*"
                multiple
                onFiles={handlePhotoFiles}
                preview={photosPreviews}
              />

              <div>
                <label className="text-sm font-medium text-[var(--foreground)] mb-2 block">
                  Avis clients (optionnel)
                </label>
                <Textarea
                  placeholder={"Collez vos avis Google, Trustpilot ou autres ici...\nEx :\n\"Excellent service, je recommande !\" — Marie D., Cliente\n★★★★★"}
                  value={reviews}
                  onChange={e => setReviews(e.target.value)}
                  className="min-h-[120px] font-mono text-xs"
                />
                <p className="text-xs text-gray-400 mt-1.5">L&apos;IA extraira automatiquement les témoignages pour votre site.</p>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <Button onClick={() => setStep('style')} variant="outline" size="lg" className="flex-1">
                <ArrowLeft className="h-4 w-4" /> Retour
              </Button>
              <Button onClick={handleGenerate} size="lg" className="flex-1 glow-purple">
                <Wand2 className="h-4 w-4" />
                Générer mon site
              </Button>
            </div>
          </motion.div>
        )}

        {/* Generating */}
        {step === 'generating' && (
          <motion.div key="generating" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16">
            <div className="relative inline-block mb-8">
              <div className="h-24 w-24 rounded-full bg-purple-600/20 flex items-center justify-center mx-auto">
                <Wand2 className="h-10 w-10 text-purple-400 animate-pulse" />
              </div>
              <div className="absolute inset-0 rounded-full border-2 border-purple-500/30 animate-ping" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Construction de votre site...</h2>
            <p className="text-purple-300 mb-6">{generatingStatus}</p>
            <div className="flex justify-center gap-1.5">
              {[0, 1, 2].map(i => (
                <motion.div key={i} className="h-2 w-2 rounded-full bg-purple-500"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
              ))}
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
