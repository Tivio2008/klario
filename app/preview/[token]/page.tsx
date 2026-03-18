import { createAnonClient } from '@/lib/supabase/anon';
import { notFound } from 'next/navigation';
import type { Site } from '@/lib/types';
import { isLinkExpired } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';

export default async function PreviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = createAnonClient();

  const { data: link } = await supabase
    .from('demo_links')
    .select('*, sites(*)')
    .eq('token', token)
    .single();

  if (!link) notFound();

  const expired = isLinkExpired(link.expires_at);

  // Track view fire-and-forget
  if (!expired) {
    supabase
      .from('demo_links')
      .update({ views: (link.views ?? 0) + 1 })
      .eq('id', link.id)
      .then(() => {});
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

  // New: HTML-based sites (render in iframe)
  if (site.html) {
    // Replace menu link placeholder with actual menu URL if menu exists
    let html = site.html;
    if (site.menu_html) {
      const menuUrl = `/preview/${token}/menu`;
      html = html.replace(/#menu-link/g, menuUrl);
      html = html.replace(/#menu-placeholder/g, menuUrl);
    }

    // Debug logs
    console.log('Site HTML exists:', !!site.html);
    console.log('Site HTML length:', site.html.length);
    console.log('HTML starts with:', site.html.substring(0, 100));

    return (
      <div className="h-screen w-screen flex flex-col overflow-hidden">
        {/* Preview banner */}
        <div className="h-12 bg-[#111118]/90 backdrop-blur-sm border-b border-white/8 flex items-center justify-center gap-3 shrink-0">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm text-gray-300">
            Aperçu de <strong className="text-white">{site.name}</strong>
          </span>
          <span className="text-gray-500 text-xs">· {(link.views ?? 0) + 1} vue{(link.views ?? 0) + 1 !== 1 ? 's' : ''}</span>
        </div>

        {/* HTML content in iframe */}
        <iframe
          srcDoc={html}
          className="flex-1 w-full border-0"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
          title={`Preview of ${site.name}`}
          style={{ minHeight: 'calc(100vh - 3rem)' }}
        />
      </div>
    );
  }

  // Legacy: Block-based sites (should not happen for new sites)
  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
      <div className="glass rounded-2xl p-8 max-w-sm w-full text-center">
        <p className="text-gray-400 text-sm">Site non disponible (ancien format)</p>
      </div>
    </div>
  );
}
