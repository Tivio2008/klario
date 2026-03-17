'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { generateSlug, TEMPLATE_BLOCKS } from '@/lib/utils';
import { DEFAULT_THEME } from '@/lib/types';
import type { SiteBlock, SiteTheme } from '@/lib/types';
import { Wand2, Star, ImagePlus, X, Upload } from 'lucide-react';

// ─── Upload helpers ──────────────────────────────────────────────────────────

function readAsDataURL(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

async function uploadToStorage(supabase: ReturnType<typeof createClient>, userId: string, file: File): Promise<string | null> {
  const ext = file.name.split('.').pop();
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from('site-media').upload(path, file, { upsert: false });
  if (error) {
    console.warn('Storage upload failed:', error.message);
    return null;
  }
  const { data } = supabase.storage.from('site-media').getPublicUrl(path);
  return data.publicUrl;
}

// ─── Photo preview card ──────────────────────────────────────────────────────

function PhotoCard({ src, onRemove }: { src: string; onRemove: () => void }) {
  return (
    <div className="relative group rounded-xl overflow-hidden aspect-square">
      <img src={src} alt="" className="w-full h-full object-cover" />
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/70 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function NewSitePage() {
  const router = useRouter();
  const { toast } = useToast();

  const [prompt, setPrompt] = React.useState('');
  const [reviews, setReviews] = React.useState('');
  const [generating, setGenerating] = React.useState(false);
  const [status, setStatus] = React.useState('');
  const [error, setError] = React.useState('');

  // Photos
  const [logoFile, setLogoFile] = React.useState<File | null>(null);
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);
  const [photoFiles, setPhotoFiles] = React.useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = React.useState<string[]>([]);

  const logoRef = React.useRef<HTMLInputElement>(null);
  const photoRef = React.useRef<HTMLInputElement>(null);

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(await readAsDataURL(file));
  }

  async function handlePhotosChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 10 - photoFiles.length);
    if (!files.length) return;
    const previews = await Promise.all(files.map(readAsDataURL));
    setPhotoFiles(prev => [...prev, ...files].slice(0, 10));
    setPhotoPreviews(prev => [...prev, ...previews].slice(0, 10));
    e.target.value = '';
  }

  function removePhoto(i: number) {
    setPhotoFiles(prev => prev.filter((_, idx) => idx !== i));
    setPhotoPreviews(prev => prev.filter((_, idx) => idx !== i));
  }

  async function handleGenerate() {
    if (!prompt.trim()) {
      setError('Veuillez décrire votre commerce.');
      return;
    }
    setError('');
    setGenerating(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    // Upload photos to Supabase Storage
    let logoUrl: string | undefined;
    let photoUrls: string[] = [];

    if (logoFile || photoFiles.length > 0) {
      setStatus('Upload des photos...');
      const [logoResult, ...photoResults] = await Promise.all([
        logoFile ? uploadToStorage(supabase, user.id, logoFile) : Promise.resolve(null),
        ...photoFiles.map(f => uploadToStorage(supabase, user.id, f)),
      ]);
      logoUrl = logoResult ?? undefined;
      photoUrls = photoResults.filter((u): u is string => u !== null);
    }

    let blocks: SiteBlock[];
    let theme: SiteTheme;
    let siteName = 'Mon site';

    try {
      setStatus('Analyse de votre description...');
      await new Promise(r => setTimeout(r, 300));
      setStatus('Création du contenu personnalisé avec l\'IA...');

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), reviews: reviews.trim(), logoUrl, photoUrls }),
      });

      if (!res.ok) throw new Error(await res.text());
      const generated = await res.json();
      if (generated.error) throw new Error(generated.error);

      blocks = generated.blocks;
      theme = generated.theme;
      siteName = generated.suggestedName || 'Mon site';
      setStatus('Assemblage des blocs...');
    } catch (err) {
      console.warn('AI generation failed:', err);
      toast('Génération IA échouée — modèle par défaut utilisé.', 'info');
      setStatus('Modèle par défaut...');
      blocks = TEMPLATE_BLOCKS['saas'];
      theme = DEFAULT_THEME;
      await new Promise(r => setTimeout(r, 600));
    }

    setStatus('Sauvegarde...');
    const slug = generateSlug(siteName);

    const { data, error: dbError } = await supabase
      .from('sites')
      .insert({ user_id: user.id, name: siteName, slug, template: 'saas', status: 'draft', blocks, theme })
      .select()
      .single();

    if (dbError) {
      toast('Échec de la création : ' + dbError.message, 'error');
      setGenerating(false);
    } else {
      router.push(`/sites/${data.id}/edit`);
    }
  }

  if (generating) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="relative inline-block mb-8">
            <div className="h-24 w-24 rounded-full bg-orange-600/20 flex items-center justify-center mx-auto">
              <Wand2 className="h-10 w-10 text-orange-400 animate-pulse" />
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-orange-500/30 animate-ping" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Construction de votre site...</h2>
          <p className="text-orange-300 mb-6">{status}</p>
          <div className="flex justify-center gap-1.5">
            {[0, 1, 2].map(i => (
              <motion.div key={i} className="h-2 w-2 rounded-full bg-orange-500"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-orange-600/20 flex items-center justify-center">
            <Wand2 className="h-5 w-5 text-orange-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">Créer un site</h1>
        </div>
        <p className="text-gray-400 mb-10 ml-[52px]">
          Décrivez votre commerce — l&apos;IA génère le site complet en 30 secondes.
        </p>

        <div className="flex flex-col gap-6">
          {/* Main prompt */}
          <div>
            <Textarea
              label="Décrivez votre commerce"
              placeholder={`Décrivez votre commerce en quelques phrases — nom, ville, type d'activité, services, ambiance, couleurs, horaires, téléphone, WhatsApp...\n\nEx : "La Bella Napoli est un restaurant italien chaleureux à Bévilard. Pizzas artisanales au feu de bois, pâtes fraîches, tiramisu maison. Ambiance familiale, couleurs rouge et vert. Ouvert depuis 2008. Tel : +41 32 123 45 67. Ouvert mar-dim 11h-22h."`}
              value={prompt}
              onChange={e => { setPrompt(e.target.value); setError(''); }}
              className="min-h-[200px]"
            />
            {error && <p className="text-red-400 text-sm mt-1.5">{error}</p>}
          </div>

          {/* Photos */}
          <div>
            <p className="text-sm font-medium text-[var(--foreground)] mb-3">
              Photos (optionnel — logo + jusqu&apos;à 10 photos)
            </p>

            <div className="grid grid-cols-5 gap-2">
              {/* Logo slot */}
              <div>
                {logoPreview ? (
                  <div className="relative group rounded-xl overflow-hidden aspect-square border border-white/10">
                    <img src={logoPreview} alt="logo" className="w-full h-full object-contain bg-white/5" />
                    <button
                      type="button"
                      onClick={() => { setLogoFile(null); setLogoPreview(null); }}
                      className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/70 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-center text-[10px] text-gray-300 py-0.5">Logo</div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => logoRef.current?.click()}
                    className="w-full aspect-square rounded-xl border-2 border-dashed border-[var(--border)] hover:border-orange-500/50 hover:bg-orange-500/5 transition-all flex flex-col items-center justify-center gap-1"
                  >
                    <ImagePlus className="h-5 w-5 text-gray-500" />
                    <span className="text-[10px] text-gray-500">Logo</span>
                  </button>
                )}
                <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              </div>

              {/* Photo slots */}
              {photoPreviews.map((src, i) => (
                <PhotoCard key={i} src={src} onRemove={() => removePhoto(i)} />
              ))}

              {/* Add more photos button */}
              {photoFiles.length < 10 && (
                <button
                  type="button"
                  onClick={() => photoRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-[var(--border)] hover:border-orange-500/50 hover:bg-orange-500/5 transition-all flex flex-col items-center justify-center gap-1"
                >
                  <Upload className="h-5 w-5 text-gray-500" />
                  <span className="text-[10px] text-gray-500">Photo</span>
                </button>
              )}
            </div>
            <input ref={photoRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotosChange} />
            <p className="text-xs text-gray-500 mt-2">
              Les photos seront intégrées dans une galerie sur votre site.
            </p>
          </div>

          {/* Reviews */}
          <div>
            <label className="text-sm font-medium text-[var(--foreground)] mb-2 flex items-center gap-1.5 block">
              <Star className="h-3.5 w-3.5 text-amber-400" />
              Avis clients (optionnel)
            </label>
            <Textarea
              placeholder={`Collez vos avis Google ou Trustpilot ici...\n\n"Excellent service, je recommande !" — Marie D. ★★★★★\n\n"La meilleure pizza de la région !" — Jean M. ★★★★★`}
              value={reviews}
              onChange={e => setReviews(e.target.value)}
              className="min-h-[100px] font-mono text-xs"
            />
          </div>

          <Button
            onClick={handleGenerate}
            size="lg"
            className="w-full mt-2"
            style={{ background: 'linear-gradient(135deg, #e85d26, #c23b1a)' }}
            disabled={!prompt.trim()}
          >
            <Wand2 className="h-4 w-4" />
            Générer mon site avec l&apos;IA
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
