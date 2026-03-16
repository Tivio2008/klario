'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { LogIn, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<{ email?: string; password?: string }>({});

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!email) errs.email = 'L\'e-mail est requis';
    if (!password) errs.password = 'Le mot de passe est requis';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      toast(error.message, 'error');
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen gradient-bg grid-bg flex items-center justify-center px-4">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold gradient-text mb-2">
            <Sparkles className="h-6 w-6 text-purple-400" />
            Klario
          </Link>
          <h1 className="text-2xl font-bold text-white mt-4">Bon retour</h1>
          <p className="text-gray-400 mt-1">Connectez-vous à votre compte</p>
        </div>

        <div className="glass rounded-2xl p-8">
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <Input
              label="E-mail"
              type="email"
              placeholder="vous@exemple.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              error={errors.email}
              autoComplete="email"
            />
            <Input
              label="Mot de passe"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              error={errors.password}
              autoComplete="current-password"
            />
            <Button type="submit" loading={loading} className="mt-2" size="lg">
              <LogIn className="h-4 w-4" />
              Se connecter
            </Button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            Pas encore de compte ?{' '}
            <Link href="/signup" className="text-purple-400 hover:text-purple-300 font-medium">
              S&apos;inscrire gratuitement
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
