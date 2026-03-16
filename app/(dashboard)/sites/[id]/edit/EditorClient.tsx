'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import type { Site, SiteBlock, DemoLink, BlockType, SiteStatus } from '@/lib/types';
import { BuilderCanvas } from '@/components/builder/BuilderCanvas';
import { BlockLibrary } from '@/components/builder/BlockLibrary';
import { BlockEditor } from '@/components/builder/BlockEditor';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { createClient } from '@/lib/supabase/client';
import { generateId, generateToken, isLinkExpired } from '@/lib/utils';
import {
  Save, Eye, EyeOff, ChevronLeft, Share2, Plus, Layers,
  Pencil, Settings, Link2, Copy, Trash2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ImportReviewsModal } from '@/components/builder/ImportReviewsModal';
import { Star } from 'lucide-react';

// Default content for each block type
const DEFAULT_BLOCK_CONTENT: Record<BlockType, object> = {
  hero: { headline: 'Your Headline Here', subheadline: 'Add your compelling subheadline.', ctaText: 'Get Started', badge: '', bgGradient: 'purple-blue', variant: 'centered' },
  features: { headline: 'Our Features', subheadline: '', features: [{ icon: '✨', title: 'Feature 1', description: 'Describe this feature.' }], columns: 3, variant: 'grid' },
  stats: { headline: 'By the Numbers', stats: [{ value: '10000', suffix: '+', label: 'Happy Customers' }, { value: '99.9', suffix: '%', label: 'Uptime' }, { value: '500', suffix: '+', label: 'Projects Delivered' }, { value: '50', prefix: '$', suffix: 'M+', label: 'Revenue Generated' }] },
  testimonials: { headline: 'What Customers Say', testimonials: [{ name: 'Jane Doe', role: 'CEO', company: 'ACME', quote: 'Amazing product!', rating: 5 }], variant: 'cards' },
  pricing: { headline: 'Simple Pricing', tiers: [{ name: 'Starter', price: '$0', description: 'Get started.', features: ['Feature 1', 'Feature 2'], ctaText: 'Get Started' }], variant: 'cards' },
  contact: { headline: 'Contact Us', subheadline: 'We\'d love to hear from you.', showForm: true, variant: 'split' },
  footer: { companyName: 'My Company', tagline: 'Building great things.', copyright: `© ${new Date().getFullYear()} All rights reserved.`, variant: 'minimal' },
};

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
  const [selectedBlockId, setSelectedBlockId] = React.useState<string | null>(null);
  const [previewMode, setPreviewMode] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [panel, setPanel] = React.useState<'blocks' | 'edit' | 'settings'>('blocks');
  const [showImportReviews, setShowImportReviews] = React.useState(false);
  const [showDemoDialog, setShowDemoDialog] = React.useState(false);
  const [creatingLink, setCreatingLink] = React.useState(false);
  const [hasChanges, setHasChanges] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  const selectedBlock = site.blocks.find(b => b.id === selectedBlockId) ?? null;

  function markChanged() { setHasChanges(true); }

  function addBlock(type: BlockType) {
    const newBlock: SiteBlock = {
      id: generateId(),
      type,
      content: DEFAULT_BLOCK_CONTENT[type] as SiteBlock['content'],
      order: site.blocks.length,
    };
    setSite(prev => ({ ...prev, blocks: [...prev.blocks, newBlock] }));
    setSelectedBlockId(newBlock.id);
    setPanel('edit');
    markChanged();
  }

  function updateBlock(updated: SiteBlock) {
    setSite(prev => ({ ...prev, blocks: prev.blocks.map(b => b.id === updated.id ? updated : b) }));
    markChanged();
  }

  function deleteBlock(id: string) {
    setSite(prev => ({ ...prev, blocks: prev.blocks.filter(b => b.id !== id) }));
    if (selectedBlockId === id) setSelectedBlockId(null);
    markChanged();
  }

  function reorderBlocks(blocks: SiteBlock[]) {
    setSite(prev => ({ ...prev, blocks }));
    markChanged();
  }

  function selectBlock(id: string) {
    setSelectedBlockId(id);
    setPanel('edit');
  }

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('sites')
      .update({
        blocks: site.blocks,
        theme: site.theme,
        status: site.status,
        name: site.name,
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

  return (
    <div className="h-[calc(100vh-3.5rem)] flex overflow-hidden">
      {/* Left sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="h-full border-r border-[var(--border)] bg-[var(--card)] flex flex-col overflow-hidden"
            style={{ minWidth: 0 }}
          >
            {/* Sidebar tabs */}
            <div className="flex border-b border-[var(--border)]">
              {([
                { id: 'blocks', icon: Plus, label: 'Ajouter' },
                { id: 'edit', icon: Pencil, label: 'Modifier' },
                { id: 'settings', icon: Settings, label: 'Réglages' },
              ] as const).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setPanel(tab.id)}
                  className={`flex-1 py-2.5 flex flex-col items-center gap-1 text-xs transition-colors ${
                    panel === tab.id
                      ? 'text-purple-400 border-b-2 border-purple-500'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {panel === 'blocks' && (
                <>
                  <BlockLibrary onAddBlock={addBlock} />
                  <div className="mt-4 pt-4 border-t border-[var(--border)]">
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-2">Importer</p>
                    <button
                      onClick={() => setShowImportReviews(true)}
                      className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] hover:border-amber-500/50 hover:bg-amber-500/5 text-left transition-all group w-full"
                    >
                      <span className="text-2xl">⭐</span>
                      <div>
                        <div className="text-sm font-medium text-white group-hover:text-amber-300 transition-colors">Importer des avis</div>
                        <div className="text-xs text-gray-400">Coller des avis Google / Trustpilot</div>
                      </div>
                    </button>
                  </div>
                </>
              )}

              {panel === 'edit' && selectedBlock ? (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-6 w-6 rounded bg-purple-600/20 flex items-center justify-center">
                      <Pencil className="h-3.5 w-3.5 text-purple-400" />
                    </div>
                    <span className="text-sm font-medium text-white capitalize">Bloc {selectedBlock.type}</span>
                  </div>
                  <BlockEditor
                    block={selectedBlock}
                    onChange={updated => updateBlock(updated)}
                  />
                </div>
              ) : panel === 'edit' ? (
                <div className="text-center text-gray-400 py-8">
                  <Layers className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Cliquez sur un bloc pour le modifier</p>
                </div>
              ) : null}

              {panel === 'settings' && (
                <div className="flex flex-col gap-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">Paramètres du site</p>

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
                              ? 'border-purple-500 bg-purple-500/10 text-white'
                              : 'border-[var(--border)] text-gray-400 hover:border-purple-500/30'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-2">Liens de démo</p>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => setShowDemoDialog(true)}>
                      <Link2 className="h-4 w-4" />
                      Gérer les liens de démo
                    </Button>
                    {demoLinks.filter(l => !isLinkExpired(l.expires_at)).length > 0 && (
                      <p className="text-xs text-purple-400 mt-2 text-center">
                        {demoLinks.filter(l => !isLinkExpired(l.expires_at)).length} lien(s) actif(s)
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main canvas area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Editor toolbar */}
        <div className="h-12 border-b border-[var(--border)] bg-[var(--card)] flex items-center px-3 gap-2 shrink-0">
          <button
            onClick={() => setSidebarOpen(prev => !prev)}
            className="p-1.5 text-gray-400 hover:text-white transition-colors"
          >
            <Layers className="h-4 w-4" />
          </button>

          <Link href="/dashboard">
            <button className="p-1.5 text-gray-400 hover:text-white transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
          </Link>

          <span className="text-sm font-medium text-white truncate max-w-32">{site.name}</span>
          <Badge variant={STATUS_COLORS[site.status] as 'secondary' | 'warning' | 'success'} className="text-xs">
            {site.status.replace('_', ' ')}
          </Badge>

          <div className="flex-1" />

          <button
            onClick={() => setPreviewMode(prev => !prev)}
            className={`p-1.5 rounded-lg transition-colors text-sm flex items-center gap-1.5 ${
              previewMode ? 'bg-purple-600/20 text-purple-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            {previewMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span className="hidden sm:inline">{previewMode ? 'Modifier' : 'Aperçu'}</span>
          </button>

          <button
            onClick={() => setShowDemoDialog(true)}
            className="p-1.5 text-gray-400 hover:text-purple-400 transition-colors"
            title="Demo Links"
          >
            <Share2 className="h-4 w-4" />
          </button>

          <Button size="sm" onClick={handleSave} loading={saving} disabled={!hasChanges}>
            <Save className="h-3.5 w-3.5" />
            {hasChanges ? 'Sauvegarder*' : 'Sauvegardé'}
          </Button>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-y-auto">
          <BuilderCanvas
            blocks={site.blocks}
            theme={site.theme}
            selectedBlockId={selectedBlockId}
            onSelectBlock={selectBlock}
            onReorder={reorderBlocks}
            onDeleteBlock={deleteBlock}
            previewMode={previewMode}
          />
        </div>
      </div>

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
                        <button onClick={() => copyLink(link.token)} className="p-1.5 text-gray-400 hover:text-white transition-colors">
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <a href={`/preview/${link.token}`} target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-400 hover:text-white transition-colors">
                          <Eye className="h-3.5 w-3.5" />
                        </a>
                        <button onClick={() => deleteDemoLink(link.id)} className="p-1.5 text-gray-400 hover:text-red-400 transition-colors">
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

      {/* Import Reviews Modal */}
      <ImportReviewsModal
        open={showImportReviews}
        onClose={() => setShowImportReviews(false)}
        existingBlock={site.blocks.find(b => b.type === 'testimonials') ?? null}
        onImport={(block: SiteBlock) => {
          const exists = site.blocks.find(b => b.type === 'testimonials');
          if (exists) {
            updateBlock(block);
          } else {
            setSite((prev: Site) => ({ ...prev, blocks: [...prev.blocks, { ...block, order: prev.blocks.length }] }));
          }
          markChanged();
        }}
      />
    </div>
  );
}
