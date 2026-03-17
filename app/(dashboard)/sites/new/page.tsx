'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { generateSlug, TEMPLATE_BLOCKS } from '@/lib/utils';
import { DEFAULT_THEME } from '@/lib/types';
import type { SiteBlock, SiteTheme } from '@/lib/types';
import { Wand2, Star } from 'lucide-react';

export default function NewSitePage() {
  const router = useRouter();
  const { toast } = useToast();

  const [prompt, setPrompt] = React.useState('');
  const [reviews, setReviews] = React.useState('');
  const [generating, setGenerating] = React.useState(false);
  const [status, setStatus] = React.useState('');
  const [error, setError] = React.useState('');

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
        body: JSON.stringify({ prompt: prompt.trim(), reviews: reviews.trim() }),
      });

      if (!res.ok) throw new Error(await res.text());
      const generated = await res.json();
      if (generated.error) throw new Error(generated.error);

      blocks = generated.blocks;
      theme = generated.theme;
      siteName = generated.suggestedName || 'Mon site';
      setStatus('Assemblage des blocs...');
    } catch (err) {
      console.warn('AI generation failed, using template:', err);
      toast('Génération IA échouée — modèle par défaut utilisé.', 'info');
      setStatus('Utilisation du modèle par défaut...');
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
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative inline-block mb-8">
            <div className="h-24 w-24 rounded-full bg-purple-600/20 flex items-center justify-center mx-auto">
              <Wand2 className="h-10 w-10 text-purple-400 animate-pulse" />
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-purple-500/30 animate-ping" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Construction de votre site...</h2>
          <p className="text-purple-300 mb-6">{status}</p>
          <div className="flex justify-center gap-1.5">
            {[0, 1, 2].map(i => (
              <motion.div key={i} className="h-2 w-2 rounded-full bg-purple-500"
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
          <div className="h-10 w-10 rounded-xl bg-purple-600/20 flex items-center justify-center">
            <Wand2 className="h-5 w-5 text-purple-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">Créer un site</h1>
        </div>
        <p className="text-gray-400 mb-10 ml-[52px]">
          Décrivez votre commerce — l&apos;IA génère le site complet.
        </p>

        <div className="flex flex-col gap-5">
          <div>
            <Textarea
              label="Décrivez votre commerce"
              placeholder={`Décrivez votre commerce en quelques phrases — nom, ville, type d'activité, services, ambiance, couleurs, public cible...\n\nEx : "La Bella Napoli est un restaurant italien chaleureux à Bévilard. Nous proposons des pizzas artisanales au feu de bois, des pâtes fraîches et des tiramisu maison. Ambiance familiale, couleurs rouge et vert, ouvert depuis 2008. On accueille les familles et les groupes."`}
              value={prompt}
              onChange={e => { setPrompt(e.target.value); setError(''); }}
              className="min-h-[180px]"
            />
            {error && <p className="text-red-400 text-sm mt-1.5">{error}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-[var(--foreground)] mb-2 flex items-center gap-1.5 block">
              <Star className="h-3.5 w-3.5 text-amber-400" />
              Avis clients (optionnel)
            </label>
            <Textarea
              placeholder={`Collez vos avis Google, Trustpilot ou autres ici...\n\n"Excellent service, je recommande !" — Marie D., Cliente ★★★★★\n\n"La meilleure pizza de la région !" — Jean M. ★★★★★`}
              value={reviews}
              onChange={e => setReviews(e.target.value)}
              className="min-h-[120px] font-mono text-xs"
            />
            <p className="text-xs text-gray-500 mt-1.5">
              L&apos;IA intégrera vos vrais avis comme témoignages sur le site.
            </p>
          </div>

          <Button
            onClick={handleGenerate}
            size="lg"
            className="w-full glow-purple mt-2"
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
