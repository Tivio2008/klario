'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { Site, DemoLink } from '@/lib/types';
import { SiteCard } from '@/components/dashboard/SiteCard';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';

interface DashboardClientProps {
  initialSites: Site[];
  initialDemoLinks: DemoLink[];
}

export default function DashboardClient({ initialSites, initialDemoLinks }: DashboardClientProps) {
  const [sites, setSites] = React.useState<Site[]>(initialSites);
  const [demoLinks, setDemoLinks] = React.useState<DemoLink[]>(initialDemoLinks);
  const [search, setSearch] = React.useState('');

  const filtered = sites.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  function handleDelete(id: string) {
    setSites(prev => prev.filter(s => s.id !== id));
    setDemoLinks(prev => prev.filter(l => l.site_id !== id));
  }

  function handleDemoLinkCreated(link: DemoLink) {
    setDemoLinks(prev => [...prev, link]);
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Mes sites</h1>
          <p className="text-gray-400 mt-1">Gérez et partagez vos sites web</p>
        </div>
        <Link href="/sites/new">
          <Button size="md" className="glow-purple">
            <Plus className="h-4 w-4" />
            Nouveau site
          </Button>
        </Link>
      </div>

      {/* Search */}
      {sites.length > 0 && (
        <div className="relative mb-6 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            className="w-full h-10 rounded-lg border border-[var(--border)] bg-[var(--input)] pl-9 pr-3 text-sm text-[var(--foreground)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            placeholder="Rechercher un site..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      )}

      {/* Sites grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-5xl mb-4">🚀</div>
          {sites.length === 0 ? (
            <>
              <h3 className="text-xl font-semibold text-white mb-2">Aucun site pour l&apos;instant</h3>
              <p className="text-gray-400 mb-6">Créez votre premier site web pour commencer.</p>
              <Link href="/sites/new">
                <Button className="glow-purple">
                  <Plus className="h-4 w-4" />
                  Créer mon premier site
                </Button>
              </Link>
            </>
          ) : (
            <>
              <h3 className="text-xl font-semibold text-white mb-2">Aucun résultat</h3>
              <p className="text-gray-400">Modifiez votre recherche.</p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((site, i) => (
            <SiteCard
              key={site.id}
              site={site}
              demoLinks={demoLinks.filter(l => l.site_id === site.id)}
              onDelete={handleDelete}
              onDemoLinkCreated={handleDemoLinkCreated}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  );
}
