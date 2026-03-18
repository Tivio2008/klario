import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import type { Site } from '@/lib/types';

export default async function SiteViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: site } = await supabase
    .from('sites')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!site) notFound();

  const typedSite = site as unknown as Site;

  // Debug info
  console.log('Site data:', {
    id: typedSite.id,
    name: typedSite.name,
    hasHtml: !!typedSite.html,
    htmlLength: typedSite.html?.length,
    hasBlocks: !!typedSite.blocks,
    hasTheme: !!typedSite.theme
  });

  if (!typedSite.html || typedSite.html.trim().length === 0) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
        <div className="glass rounded-2xl p-8 max-w-md w-full text-center">
          <p className="text-white text-lg font-bold mb-2">⚠️ Pas de HTML</p>
          <p className="text-gray-400 text-sm mb-4">
            Ce site n&apos;a pas de HTML généré. Il utilise peut-être l&apos;ancien format à blocs.
          </p>
          <p className="text-gray-500 text-xs">
            Site ID: {typedSite.id}
          </p>
        </div>
      </div>
    );
  }

  // Replace menu link if menu exists
  let html = typedSite.html;
  if (typedSite.menu_html) {
    const menuUrl = `/sites/${id}/menu`;
    html = html.replace(/#menu-link/g, menuUrl);
    html = html.replace(/#menu-placeholder/g, menuUrl);
  }

  console.log('Site view - HTML exists:', !!typedSite.html);
  console.log('Site view - HTML length:', typedSite.html?.length);

  return (
    <div className="h-screen w-screen overflow-hidden">
      <iframe
        srcDoc={html}
        className="w-full h-full border-0"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
        title={`Preview of ${typedSite.name}`}
        style={{ minHeight: '100vh' }}
      />
    </div>
  );
}
