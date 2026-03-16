'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import type { Site, DemoLink } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { createClient } from '@/lib/supabase/client';
import { formatRelativeTime, generateToken, isLinkExpired } from '@/lib/utils';
import {
  Pencil, Trash2, Link2, Eye, ExternalLink, Globe, Copy,
  Calendar, CheckCircle2, Clock, Share2
} from 'lucide-react';

const STATUS_CONFIG = {
  draft: { label: 'Brouillon', variant: 'secondary' as const, icon: Clock },
  demo_sent: { label: 'Démo envoyée', variant: 'warning' as const, icon: Share2 },
  published: { label: 'Publié', variant: 'success' as const, icon: Globe },
};

const TEMPLATE_EMOJI = { saas: '🚀', restaurant: '🍽️', agency: '🎨' };

interface SiteCardProps {
  site: Site;
  demoLinks: DemoLink[];
  onDelete: (id: string) => void;
  onDemoLinkCreated: (link: DemoLink) => void;
  index: number;
}

export function SiteCard({ site, demoLinks, onDelete, onDemoLinkCreated, index }: SiteCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [showDemoDialog, setShowDemoDialog] = React.useState(false);
  const [creatingLink, setCreatingLink] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const status = STATUS_CONFIG[site.status];
  const StatusIcon = status.icon;
  const activeLinks = demoLinks.filter(l => !isLinkExpired(l.expires_at));

  async function createDemoLink() {
    setCreatingLink(true);
    const supabase = createClient();
    const token = generateToken();
    const { data, error } = await supabase
      .from('demo_links')
      .insert({ site_id: site.id, token, views: 0 })
      .select()
      .single();

    if (error) {
      toast('Échec de la création du lien', 'error');
    } else {
      onDemoLinkCreated(data);
      toast('Lien de démo créé !', 'success');
    }
    setCreatingLink(false);
  }

  async function deleteDemoLink(linkId: string) {
    setDeletingId(linkId);
    const supabase = createClient();
    await supabase.from('demo_links').delete().eq('id', linkId);
    toast('Lien supprimé', 'info');
    setDeletingId(null);
  }

  async function handleDelete() {
    if (!confirm(`Supprimer "${site.name}" ? Cette action est irréversible.`)) return;
    const supabase = createClient();
    await supabase.from('sites').delete().eq('id', site.id);
    onDelete(site.id);
    toast('Site supprimé', 'info');
  }

  function copyLink(token: string) {
    const url = `${window.location.origin}/preview/${token}`;
    navigator.clipboard.writeText(url);
    toast('Lien copié !', 'success');
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <Card className="hover:border-purple-500/30 transition-all duration-300 hover:-translate-y-0.5 group">
          {/* Thumbnail */}
          <div className="h-36 rounded-t-xl overflow-hidden relative bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-b border-[var(--border)]">
            <div className="absolute inset-0 grid-bg opacity-40" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-5xl opacity-60">{TEMPLATE_EMOJI[site.template]}</span>
            </div>
            <div className="absolute top-2 left-2">
              <Badge variant={status.variant} className="flex items-center gap-1">
                <StatusIcon className="h-3 w-3" />
                {status.label}
              </Badge>
            </div>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <Link href={`/sites/${site.id}/edit`}>
                <button className="p-1.5 rounded-md bg-[var(--card)] border border-[var(--border)] text-gray-300 hover:text-white transition-colors">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </Link>
              <button
                onClick={handleDelete}
                className="p-1.5 rounded-md bg-[var(--card)] border border-[var(--border)] text-gray-300 hover:text-red-400 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="min-w-0">
                <h3 className="font-semibold text-white truncate">{site.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5 capitalize">Modèle {site.template}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
              <Clock className="h-3.5 w-3.5" />
              <span>Modifié {formatRelativeTime(site.updated_at)}</span>
            </div>

            {/* Demo links count */}
            {activeLinks.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-purple-400 mb-4">
                <Link2 className="h-3.5 w-3.5" />
                <span>{activeLinks.length} lien{activeLinks.length !== 1 ? 's' : ''} de démo actif{activeLinks.length !== 1 ? 's' : ''}</span>
                <span className="text-gray-500">·</span>
                <Eye className="h-3.5 w-3.5" />
                <span>{activeLinks.reduce((a, l) => a + l.views, 0)} vue{activeLinks.reduce((a, l) => a + l.views, 0) !== 1 ? 's' : ''}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Link href={`/sites/${site.id}/edit`} className="flex-1">
                <Button variant="outline" size="sm" className="w-full">
                  <Pencil className="h-3.5 w-3.5" />
                  Modifier
                </Button>
              </Link>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowDemoDialog(true)}
                className="flex-1"
              >
                <Share2 className="h-3.5 w-3.5" />
                Partager
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Demo links dialog */}
      <Dialog open={showDemoDialog} onOpenChange={setShowDemoDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Liens de démo — {site.name}</DialogTitle>
            <DialogDescription>Créez des liens de prévisualisation partageables pour ce site.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 mt-2">
            <Button onClick={createDemoLink} loading={creatingLink} variant="default">
              <Link2 className="h-4 w-4" />
              Générer un nouveau lien
            </Button>

            {demoLinks.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Aucun lien de démo pour l&apos;instant</p>
            ) : (
              <div className="flex flex-col gap-2">
                {demoLinks.map(link => {
                  const expired = isLinkExpired(link.expires_at);
                  const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/preview/${link.token}`;
                  return (
                    <div key={link.id} className={`glass rounded-lg p-3 flex items-center gap-2 ${expired ? 'opacity-50' : ''}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {expired
                            ? <Badge variant="destructive" className="text-xs">Expiré</Badge>
                            : <Badge variant="success" className="text-xs">Actif</Badge>
                          }
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Eye className="h-3 w-3" />{link.views} vue{link.views !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 font-mono truncate">/preview/{link.token}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => copyLink(link.token)}
                          className="p-1.5 text-gray-400 hover:text-white transition-colors"
                          title="Copy link"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-gray-400 hover:text-white transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                        <button
                          onClick={() => deleteDemoLink(link.id)}
                          disabled={deletingId === link.id}
                          className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
