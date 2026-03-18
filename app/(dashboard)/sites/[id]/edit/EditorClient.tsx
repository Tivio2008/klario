'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import type { Site, DemoLink, SiteStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { createClient } from '@/lib/supabase/client';
import { generateToken, isLinkExpired } from '@/lib/utils';
import {
  Save, ChevronLeft, Share2, Settings, Link2, Copy, Trash2, Eye, ExternalLink, UtensilsCrossed, Wand2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const STATUS_OPTIONS: { value: SiteStatus; label: string }[] = [
  { value: 'draft', label: 'Brouillon' },
  { value: 'demo_sent', label: 'Démo envoyée' },
  { value: 'published', label: 'Publié' },
];

interface EditorClientProps {
  site: Site;
  initialDemoLinks: DemoLink[];
}

export function EditorClient({ site: initialSite, initialDemoLinks }: EditorClientProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [site, setSite] = React.useState<Site>(initialSite);
  const [demoLinks, setDemoLinks] = React.useState<DemoLink[]>(initialDemoLinks);
  const [saving, setSaving] = React.useState(false);
  const [showDemoDialog, setShowDemoDialog] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const [creatingLink, setCreatingLink] = React.useState(false);
  const [hasChanges, setHasChanges] = React.useState(false);
  const [editPrompt, setEditPrompt] = React.useState('');
  const [editing, setEditing] = React.useState(false);
  const [showEditDialog, setShowEditDialog] = React.useState(false);

  function markChanged() { setHasChanges(true); }

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('sites')
      .update({
        status: site.status,
        name: site.name,
        html: site.html,
        updated_at: new Date().toISOString(),
      })
      .eq('id', site.id);

    setSaving(false);
    if (error) {
      toast('Échec de la sauvegarde : ' + error.message, 'error');
    } else {
      toast('Sauvegardé !', 'success');
      setHasChanges(false);
    }
  }

  async function handleEditWithPrompt() {
    if (!editPrompt.trim() || !site.html) return;

    setEditing(true);
    try {
      const res = await fetch('/api/edit-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: site.html, prompt: editPrompt }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Échec de la modification');
      }

      const { html } = await res.json();
      setSite(prev => ({ ...prev, html }));
      setEditPrompt('');
      markChanged();
      toast('Site modifié !', 'success');
    } catch (err) {
      console.error('Edit error:', err);
      toast(err instanceof Error ? err.message : 'Erreur de modification', 'error');
    } finally {
      setEditing(false);
    }
  }

  async function handleStatusChange(status: SiteStatus) {
    setSite(prev => ({ ...prev, status }));
    markChanged();
  }

  async function createDemoLink() {
    setCreatingLink(true);
    const supabase = createClient();
    const token = generateToken();
    const { data, error } = await supabase
      .from('demo_links')
      .insert({ site_id: site.id, token, views: 0 })
      .select()
      .single();
    setCreatingLink(false);
    if (!error && data) {
      setDemoLinks(prev => [data, ...prev]);
      toast('Lien de démo créé !', 'success');
    } else {
      toast('Échec de la création du lien', 'error');
    }
  }

  async function deleteDemoLink(id: string) {
    const supabase = createClient();
    await supabase.from('demo_links').delete().eq('id', id);
    setDemoLinks(prev => prev.filter(l => l.id !== id));
    toast('Lien supprimé', 'info');
  }

  function copyLink(token: string) {
    navigator.clipboard.writeText(`${window.location.origin}/preview/${token}`);
    toast('Lien copié !', 'success');
  }

  const STATUS_COLORS: Record<SiteStatus, string> = {
    draft: 'secondary',
    demo_sent: 'warning',
    published: 'success',
  };

  if (!site.html) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
        <div className="glass rounded-2xl p-8 max-w-md w-full text-center">
          <p className="text-gray-400">Ce site utilise l&apos;ancien format et ne peut pas être modifié.</p>
          <p className="text-sm text-gray-500 mt-2">Veuillez créer un nouveau site.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col overflow-hidden">
      {/* Editor toolbar */}
      <div className="h-14 border-b border-[var(--border)] bg-[var(--card)] flex items-center px-4 gap-3 shrink-0">
        <Link href="/dashboard">
          <button className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5">
            <ChevronLeft className="h-5 w-5" />
          </button>
        </Link>

        <span className="text-base font-semibold text-white truncate max-w-xs">{site.name}</span>
        <Badge variant={STATUS_COLORS[site.status] as 'secondary' | 'warning' | 'success'} className="text-xs">
          {site.status.replace('_', ' ')}
        </Badge>

        <div className="flex-1" />

        {site.menu_html && (
          <a
            href={`/sites/${site.id}/menu`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-gray-400 hover:text-orange-400 transition-colors rounded-lg hover:bg-orange-500/10"
            title="Voir le menu"
          >
            <UtensilsCrossed className="h-5 w-5" />
          </a>
        )}

        <button
          onClick={() => setShowEditDialog(true)}
          className="p-2 text-gray-400 hover:text-purple-400 transition-colors rounded-lg hover:bg-purple-500/10"
          title="Modifier par prompt"
        >
          <Wand2 className="h-5 w-5" />
        </button>

        <button
          onClick={() => setShowSettings(true)}
          className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
          title="Paramètres"
        >
          <Settings className="h-5 w-5" />
        </button>

        <button
          onClick={() => setShowDemoDialog(true)}
          className="p-2 text-gray-400 hover:text-orange-400 transition-colors rounded-lg hover:bg-orange-500/10"
          title="Liens de démo"
        >
          <Share2 className="h-5 w-5" />
        </button>

        <Button size="sm" onClick={handleSave} loading={saving} disabled={!hasChanges}>
          <Save className="h-4 w-4" />
          {hasChanges ? 'Sauvegarder*' : 'Sauvegardé'}
        </Button>
      </div>

      {/* Preview iframe */}
      <div className="flex-1 overflow-hidden bg-gray-50">
        <iframe
          srcDoc={(() => {
            let html = site.html;
            if (site.menu_html) {
              const menuUrl = `/sites/${site.id}/menu`;
              html = html.replace(/#menu-link/g, menuUrl);
              html = html.replace(/#menu-placeholder/g, menuUrl);
            }
            return html;
          })()}
          className="w-full h-full border-0"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          title={`Preview of ${site.name}`}
        />
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Paramètres du site</DialogTitle>
            <DialogDescription>Modifier le nom et le statut</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-4">
            <div>
              <label className="text-sm font-medium text-[var(--foreground)] mb-1.5 block">Nom du site</label>
              <input
                className="w-full h-10 rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                value={site.name}
                onChange={e => { setSite(prev => ({ ...prev, name: e.target.value })); markChanged(); }}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-[var(--foreground)] mb-1.5 block">Statut</label>
              <div className="flex flex-col gap-2">
                {STATUS_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => handleStatusChange(opt.value)}
                    className={`px-3 py-2 rounded-lg border text-sm text-left transition-all ${
                      site.status === opt.value
                        ? 'border-orange-500 bg-orange-500/10 text-white'
                        : 'border-[var(--border)] text-gray-400 hover:border-orange-500/30'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Demo Links Dialog */}
      <Dialog open={showDemoDialog} onOpenChange={setShowDemoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Liens de démo</DialogTitle>
            <DialogDescription>Générez des liens de prévisualisation pour {site.name}.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-2">
            <Button onClick={createDemoLink} loading={creatingLink}>
              <Link2 className="h-4 w-4" />
              Générer un nouveau lien
            </Button>

            {demoLinks.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-4">Aucun lien de démo pour l&apos;instant</p>
            ) : (
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                {demoLinks.map(link => {
                  const exp = isLinkExpired(link.expires_at);
                  return (
                    <div key={link.id} className={`glass rounded-lg p-3 flex items-center gap-2 ${exp ? 'opacity-50' : ''}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          {exp ? <Badge variant="destructive">Expiré</Badge> : <Badge variant="success">Actif</Badge>}
                          <span className="text-xs text-gray-400">{link.views} vue{link.views !== 1 ? 's' : ''}</span>
                        </div>
                        <p className="text-xs text-gray-400 font-mono truncate">/preview/{link.token}</p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => copyLink(link.token)} className="p-1.5 text-gray-400 hover:text-white transition-colors" title="Copier le lien">
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <a href={`/preview/${link.token}`} target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-400 hover:text-white transition-colors" title="Voir">
                          <Eye className="h-3.5 w-3.5" />
                        </a>
                        <button onClick={() => deleteDemoLink(link.id)} className="p-1.5 text-gray-400 hover:text-red-400 transition-colors" title="Supprimer">
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

      {/* Edit with Prompt Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le site</DialogTitle>
            <DialogDescription>Décrivez les modifications à apporter au site</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-4">
            <div>
              <label className="text-sm font-medium text-[var(--foreground)] mb-1.5 block">
                Que voulez-vous changer ?
              </label>
              <textarea
                className="w-full h-24 rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--ring)] resize-none"
                placeholder="Ex: Change le titre en 'Bienvenue chez nous', remplace la couleur bleue par du vert, ajoute une section galerie..."
                value={editPrompt}
                onChange={e => setEditPrompt(e.target.value)}
                disabled={editing}
              />
            </div>
            <Button onClick={handleEditWithPrompt} loading={editing} disabled={!editPrompt.trim()}>
              <Wand2 className="h-4 w-4" />
              Appliquer les modifications
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
