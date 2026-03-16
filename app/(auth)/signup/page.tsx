'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { UserPlus, Sparkles } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<{ email?: string; password?: string; confirm?: string }>({});

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!email) errs.email = 'L\'e-mail est requis';
    if (!password || password.length < 8) errs.password = 'Le mot de passe doit contenir au moins 8 caractères';
    if (password !== confirm) errs.confirm = 'Les mots de passe ne correspondent pas';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);

    if (error) {
      toast(error.message, 'error');
    } else {
      toast('Compte créé ! Vérifiez votre e-mail pour confirmer.', 'success');
      router.push('/dashboard');
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
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold gradient-text">
            <Sparkles className="h-6 w-6 text-purple-400" />
            Klario
          </Link>
          <h1 className="text-2xl font-bold text-white mt-4">Créer votre compte</h1>
          <p className="text-gray-400 mt-1">Commencez gratuitement</p>
        </div>

        <div className="glass rounded-2xl p-8">
          <form onSubmit={handleSignup} className="flex flex-col gap-4">
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
              placeholder="8 caractères minimum"
              value={password}
              onChange={e => setPassword(e.target.value)}
              error={errors.password}
              autoComplete="new-password"
            />
            <Input
              label="Confirmer le mot de passe"
              type="password"
              placeholder="••••••••"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              error={errors.confirm}
              autoComplete="new-password"
            />
            <Button type="submit" loading={loading} className="mt-2" size="lg">
              <UserPlus className="h-4 w-4" />
              Créer un compte
            </Button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium">
              Se connecter
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
