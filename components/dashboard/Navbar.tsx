'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { LogOut, LayoutDashboard, Plus, User } from 'lucide-react';

interface NavbarProps {
  userEmail?: string;
}

export function Navbar({ userEmail }: NavbarProps) {
  const router = useRouter();
  const [signing, setSigning] = React.useState(false);

  async function handleSignOut() {
    setSigning(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <nav className="h-14 border-b border-[var(--border)] glass sticky top-0 z-40 flex items-center px-4 gap-4">
      <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg gradient-text">
        Klario
      </Link>

      <div className="flex-1" />

      <Link href="/sites/new">
        <Button size="sm" variant="default">
          <Plus className="h-4 w-4" />
          Nouveau site
        </Button>
      </Link>

      <div className="flex items-center gap-2 text-sm text-gray-400">
        <User className="h-4 w-4" />
        <span className="hidden sm:block truncate max-w-32">{userEmail}</span>
      </div>

      <Button
        size="icon"
        variant="ghost"
        onClick={handleSignOut}
        loading={signing}
        className="text-gray-400 hover:text-white"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </nav>
  );
}
