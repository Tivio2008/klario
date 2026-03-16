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
import type { SiteTemplate, SiteBlock, SiteTheme } from '@/lib/types';
import type { OnboardingData } from '@/app/api/generate/route';
import {
  ArrowRight, ArrowLeft, CheckCircle2, Wand2
} from 'lucide-react';

const TEMPLATES: { id: SiteTemplate; name: string; description: string; emoji: string }[] = [
  { id: 'saas', name: 'SaaS / Tech', description: 'Logiciels, applications & startups tech.', emoji: '🚀' },
  { id: 'restaurant', name: 'Restaurant / Food', description: 'Restaurants, cafés & commerces alimentaires.', emoji: '🍽️' },
  { id: 'agency', name: 'Agence / Studio', description: 'Agences de design, studios & consultants.', emoji: '🎨' },
];

const TONES = [
  { id: 'luxury', label: 'Luxe', description: 'Élégant & premium', emoji: '✨' },
  { id: 'professional', label: 'Professionnel', description: 'Clair & autoritaire', emoji: '💼' },
  { id: 'fun', label: 'Fun', description: 'Énergique & ludique', emoji: '🎉' },
  { id: 'minimal', label: 'Minimaliste', description: 'Épuré & discret', emoji: '◽' },
] as const;

const BRAND_COLORS = [
  { hex: '#7c3aed', label: 'Purple' },
  { hex: '#2563eb', label: 'Blue' },
  { hex: '#0891b2', label: 'Cyan' },
  { hex: '#059669', label: 'Emerald' },
  { hex: '#d97706', label: 'Amber' },
  { hex: '#dc2626', label: 'Red' },
  { hex: '#db2777', label: 'Pink' },
  { hex: '#334155', label: 'Slate' },
];

type Step = 'template' | 'brand' | 'business' | 'generating';

export default function NewSitePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = React.useState<Step>('template');
  const [template, setTemplate] = React.useState<SiteTemplate>('saas');
  const [tone, setTone] = React.useState<OnboardingData['tone']>('professional');
  const [brandColor, setBrandColor] = React.useState('#7c3aed');
  const [customColor, setCustomColor] = React.useState('');
  const [businessName, setBusinessName] = React.useState('');
  const [industry, setIndustry] = React.useState('');
  const [targetAudience, setTargetAudience] = React.useState('');
  const [services, setServices] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [generatingStatus, setGeneratingStatus] = React.useState('');
  const [useAI, setUseAI] = React.useState(true);

  const activeColor = customColor || brandColor;

  function validateBrand() {
    const errs: Record<string, string> = {};
    if (!businessName.trim()) errs.businessName = 'Le nom de l\'entreprise est requis';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateBusiness() {
    const errs: Record<string, string> = {};
    if (!description.trim()) errs.description = 'La description est requise';
    if (!services.trim()) errs.services = 'Les services/produits sont requis';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleGenerate() {
    if (!validateBusiness()) return;
    setStep('generating');

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    let blocks: SiteBlock[];
    let theme: SiteTheme;
    let siteName = businessName;

    if (useAI) {
      try {
        setGeneratingStatus('Création de votre contenu personnalisé avec l\'IA...');
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessName, industry, template, brandColor: activeColor,
            tone, targetAudience, services, description,
          } satisfies OnboardingData),
        });

        if (!res.ok) throw new Error(await res.text());

        const generated = await res.json();
        if (generated.error) throw new Error(generated.error);
        blocks = generated.blocks;
        theme = generated.theme;
        siteName = generated.suggestedName || businessName;
        setGeneratingStatus('Building your site...');
      } catch (err) {
        console.warn('AI generation failed, using template:', err);
        toast('Génération IA ignorée — utilisation des modèles par défaut.', 'info');
        setGeneratingStatus('Utilisation du modèle par défaut...');
        blocks = TEMPLATE_BLOCKS[template];
        theme = { ...DEFAULT_THEME, primaryColor: activeColor };
        await new Promise(r => setTimeout(r, 600));
      }
    } else {
      setGeneratingStatus('Construction du site depuis le modèle...');
      blocks = TEMPLATE_BLOCKS[template];
      theme = { ...DEFAULT_THEME, primaryColor: activeColor };
      await new Promise(r => setTimeout(r, 800));
    }

      setGeneratingStatus('Sauvegarde en base de données...');
    const slug = generateSlug(siteName);

    const { data, error } = await supabase
      .from('sites')
      .insert({ user_id: user.id, name: siteName, slug, template, status: 'draft', blocks, theme })
      .select()
      .single();

    if (error) {
      toast('Échec de la création du site : ' + error.message, 'error');
      setStep('business');
    } else {
      router.push(`/sites/${data.id}/edit`);
    }
  }

  const stepIndex = { template: 0, brand: 1, business: 2, generating: 3 }[step];

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      {/* Progress bar */}
      {step !== 'generating' && (
        <div className="flex items-center gap-2 mb-10">
          {['Choisir un modèle', 'Marque & Ton', 'Infos business'].map((label, i) => (
            <React.Fragment key={i}>
              <div className={`flex items-center gap-1.5 text-xs font-medium ${i <= stepIndex ? 'text-purple-400' : 'text-gray-500'}`}>
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${
                  i < stepIndex ? 'bg-purple-600 text-white' : i === stepIndex ? 'bg-purple-600/30 text-purple-400 ring-2 ring-purple-500' : 'bg-[var(--secondary)] text-gray-500'
                }`}>
                  {i < stepIndex ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <span className="hidden sm:inline">{label}</span>
              </div>
              {i < 2 && <div className={`flex-1 h-px ${i < stepIndex ? 'bg-purple-600' : 'bg-[var(--border)]'}`} />}
            </React.Fragment>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">

        {/* Step 1: Template */}
        {step === 'template' && (
          <motion.div key="template" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h1 className="text-3xl font-bold text-white mb-2">Choisir un modèle</h1>
            <p className="text-gray-400 mb-8">Choisissez celui qui correspond le mieux à votre secteur — nous le personnaliserons pour vous.</p>
            <div className="flex flex-col gap-3 mb-8">
              {TEMPLATES.map(t => (
                <button key={t.id} type="button" onClick={() => setTemplate(t.id)}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                    template === t.id ? 'border-purple-500 bg-purple-500/10' : 'border-[var(--border)] hover:border-purple-500/40'
                  }`}>
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-2xl ${template === t.id ? 'bg-purple-600/30' : 'bg-[var(--secondary)]'}`}>{t.emoji}</div>
                  <div>
                    <div className="font-semibold text-white">{t.name}</div>
                    <div className="text-sm text-gray-400 mt-0.5">{t.description}</div>
                  </div>
                  {template === t.id && <div className="ml-auto h-5 w-5 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs">✓</div>}
                </button>
              ))}
            </div>
            <Button onClick={() => setStep('brand')} size="lg" className="w-full">
              Continuer <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        )}

        {/* Step 2: Brand & Tone */}
        {step === 'brand' && (
          <motion.div key="brand" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h1 className="text-3xl font-bold text-white mb-2">Marque &amp; Ton</h1>
            <p className="text-gray-400 mb-8">Définissez l&apos;apparence et l&apos;ambiance de votre site.</p>

            <div className="flex flex-col gap-6">
              <Input label="Nom de l'entreprise *" placeholder="ex. Studio Acme" value={businessName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBusinessName(e.target.value)} error={errors.businessName} />

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
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomColor(e.target.value)}
                      className="h-9 w-9 rounded-full cursor-pointer border border-[var(--border)] bg-transparent"
                      title="Couleur personnalisée" />
                    <span className="text-xs text-gray-400">Personnalisée</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="h-5 w-5 rounded-full border border-white/10" style={{ backgroundColor: activeColor }} />
                  <span className="text-sm text-gray-300 font-mono">{activeColor}</span>
                </div>
              </div>

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
            </div>

            <div className="flex gap-3 mt-8">
              <Button onClick={() => setStep('template')} variant="outline" size="lg" className="flex-1">
                <ArrowLeft className="h-4 w-4" /> Retour
              </Button>
              <Button onClick={() => { if (validateBrand()) setStep('business'); }} size="lg" className="flex-1">
                Continuer <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Business Info */}
        {step === 'business' && (
          <motion.div key="business" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h1 className="text-3xl font-bold text-white mb-2">Parlez-nous de votre activité</h1>
            <p className="text-gray-400 mb-8">Plus vous donnez de détails, meilleur sera votre site généré par l&apos;IA.</p>

            <div className="flex flex-col gap-5">
              <Input label="Secteur / Type" placeholder="ex. Agence de marketing digital, Restaurant italien..."
                value={industry} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIndustry(e.target.value)} />
              <Input label="Public cible" placeholder="ex. Propriétaires de PME, Millennials 25–35 ans..."
                value={targetAudience} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTargetAudience(e.target.value)} />
              <Textarea label="Services / Produits clés *" placeholder="Listez vos offres principales, une par ligne..."
                value={services} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setServices(e.target.value)}
                error={errors.services} className="min-h-[80px]" />
              <Textarea label="Description courte *" placeholder="Qu'est-ce qui rend votre activité unique ? Quels problèmes résolvez-vous ?"
                value={description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                error={errors.description} className="min-h-[100px]" />

              {/* AI toggle */}
              <div className="glass rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Wand2 className="h-5 w-5 text-purple-400" />
                  <div>
                    <div className="text-sm font-medium text-white">Génération par IA</div>
                    <div className="text-xs text-gray-400">Utiliser Claude pour rédiger votre contenu</div>
                  </div>
                </div>
                <button onClick={() => setUseAI(prev => !prev)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${useAI ? 'bg-purple-600' : 'bg-[var(--secondary)]'}`}>
                  <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${useAI ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <Button onClick={() => setStep('brand')} variant="outline" size="lg" className="flex-1">
                <ArrowLeft className="h-4 w-4" /> Retour
              </Button>
              <Button onClick={handleGenerate} size="lg" className="flex-1 glow-purple">
                <Wand2 className="h-4 w-4" />
                {useAI ? 'Générer avec l\'IA' : 'Créer le site'}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Generating screen */}
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
