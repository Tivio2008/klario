import { createAnonClient } from '@/lib/supabase/anon';
import { notFound } from 'next/navigation';
import type { Site } from '@/lib/types';
import { isLinkExpired } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default async function PreviewMenuPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = createAnonClient();

  const { data: link } = await supabase
    .from('demo_links')
    .select('*, sites(*)')
    .eq('token', token)
    .single();

  if (!link) notFound();

  const expired = isLinkExpired(link.expires_at);
  const site = link.sites as unknown as Site;

  if (!site || expired) notFound();

  if (!site.menu_html) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
        <div className="glass rounded-2xl p-8 max-w-sm w-full text-center">
          <p className="text-gray-400 text-sm">Ce site n&apos;a pas de page menu.</p>
          <Link href={`/preview/${token}`} className="text-orange-400 text-sm mt-4 inline-block hover:underline">
            Retour au site
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Menu banner */}
      <div className="sticky top-0 z-50 bg-[#111118]/90 backdrop-blur-sm border-b border-white/8 py-2 px-4 flex items-center justify-center gap-3">
        <span className="text-sm text-gray-300">
          Menu de <strong className="text-white">{site.name}</strong>
        </span>
        <Link href={`/preview/${token}`} className="ml-auto text-xs text-orange-400 hover:underline">
          Retour au site
        </Link>
      </div>

      {/* Menu HTML */}
      <iframe
        srcDoc={site.menu_html.replace(/#back-to-site/g, `/preview/${token}`)}
        className="flex-1 w-full border-0"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        title={`Menu de ${site.name}`}
      />
    </div>
  );
}
