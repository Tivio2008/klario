import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { BlockRenderer } from '@/components/builder/BlockRenderer';
import type { Site } from '@/lib/types';
import { isLinkExpired } from '@/lib/utils';
import { Eye, Clock, AlertTriangle } from 'lucide-react';

export default async function PreviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();

  // Fetch demo link
  const { data: link } = await supabase
    .from('demo_links')
    .select('*, sites(*)')
    .eq('token', token)
    .single();

  if (!link) notFound();

  const expired = isLinkExpired(link.expires_at);

  // Track view (increment counter) - fire and forget
  if (!expired) {
    await supabase
      .from('demo_links')
      .update({ views: link.views + 1 })
      .eq('id', link.id);
  }

  const site = link.sites as unknown as Site;
  if (!site) notFound();

  if (expired) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
        <div className="glass rounded-2xl p-8 max-w-sm w-full text-center">
          <AlertTriangle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Lien expiré</h1>
          <p className="text-gray-400 text-sm">Ce lien de démo a expiré. Veuillez en demander un nouveau.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Preview banner */}
      <div className="sticky top-0 z-50 bg-purple-900/80 backdrop-blur-sm border-b border-purple-500/30 py-2 px-4 flex items-center justify-center gap-3">
        <Eye className="h-4 w-4 text-purple-300" />
        <span className="text-sm text-purple-200">
          Aperçu de <strong className="text-white">{site.name}</strong>
        </span>
        <span className="text-purple-400 text-xs">· {link.views + 1} vue{link.views + 1 !== 1 ? 's' : ''}</span>
      </div>

      {/* Site content */}
      <div className="bg-[#0a0a0f]">
        {site.blocks
          .sort((a, b) => a.order - b.order)
          .map(block => (
            <BlockRenderer key={block.id} block={block} theme={site.theme} isPreview />
          ))}
      </div>
    </div>
  );
}
