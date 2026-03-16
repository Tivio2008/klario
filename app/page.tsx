'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Zap, Globe, Share2, Eye, Layers, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <div className="min-h-screen gradient-bg">
      {/* Navbar */}
      <nav className="border-b border-[var(--border)] glass sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-bold gradient-text">Klario</span>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Se connecter</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Commencer gratuitement</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden py-32 px-6">
        {/* Orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl" />
        <div className="absolute inset-0 grid-bg opacity-20" />

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-sm font-medium mb-8"
          >
            <Sparkles className="h-3.5 w-3.5" />
            La création de sites réinventée
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-bold mb-6 leading-none tracking-tight"
          >
            <span className="gradient-text">Créez des sites</span>
            <br />
            <span className="text-white">époustouflants</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Blocs glisser-déposer, modèles ultra-modernes et liens de démo partageables en un clic.
            De l&apos;idée au site en quelques minutes.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-4"
          >
            <Link href="/signup">
              <Button size="lg" className="gap-2 text-base px-8 glow-purple">
                Commencer gratuitement
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-base px-8">
                Se connecter
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold gradient-text mb-4">Tout ce qu&apos;il vous faut</h2>
            <p className="text-xl text-gray-400">Une plateforme complète pour créer et partager de beaux sites web.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Layers, title: 'Constructeur glisser-déposer', description: 'Créez des pages visuellement avec des blocs ultra-modernes. Aucun code requis.' },
              { icon: Zap, title: 'Aperçu en temps réel', description: 'Voyez vos modifications instantanément. Ce que vous voyez est exactement ce qui sera publié.' },
              { icon: Share2, title: 'Liens de démo en un clic', description: 'Générez des URLs de prévisualisation partageables. Parfait pour les présentations clients.' },
              { icon: Eye, title: 'Suivi des vues', description: 'Suivez combien de fois vos liens de démo ont été consultés. Sachez quand vos clients s\'engagent.' },
              { icon: Globe, title: '3 modèles professionnels', description: 'Modèles SaaS, Restaurant et Agence — chacun entièrement personnalisable.' },
              { icon: Sparkles, title: 'Design moderne', description: 'Glassmorphisme, dégradés animés, effets de particules — intégrés dans chaque bloc.' },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="glass rounded-2xl p-6 hover:border-purple-500/30 transition-all"
              >
                <div className="h-10 w-10 rounded-xl bg-purple-600/20 flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass rounded-3xl p-12 border-purple-500/20"
          >
            <h2 className="text-4xl font-bold gradient-text mb-4">Prêt à créer ?</h2>
            <p className="text-gray-400 mb-8">Rejoignez des milliers de créateurs sur Klario.</p>
            <Link href="/signup">
              <Button size="lg" className="gap-2 text-base px-10 glow-purple">
                Commencer — C&apos;est gratuit
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-8 px-6 text-center text-gray-400 text-sm">
        <span className="gradient-text font-semibold">Klario</span> — © {new Date().getFullYear()} Tous droits réservés.
      </footer>
    </div>
  );
}
