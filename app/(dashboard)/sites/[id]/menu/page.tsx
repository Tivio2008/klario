import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import type { Site } from '@/lib/types';

export default async function MenuPage({ params }: { params: Promise<{ id: string }> }) {
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

  if (!typedSite.menu_html) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
        <div className="glass rounded-2xl p-8 max-w-md w-full text-center">
          <p className="text-gray-400">Ce site n&apos;a pas de page menu.</p>
        </div>
      </div>
    );
  }

  // Debug: Log menu_html to check if it exists
  console.log('Menu HTML exists:', !!typedSite.menu_html);
  console.log('Menu HTML length:', typedSite.menu_html?.length);

  return (
    <div className="h-screen w-screen overflow-hidden">
      <iframe
        srcDoc={typedSite.menu_html.replace(/#back-to-site/g, `/sites/${id}/edit`)}
        className="w-full h-full border-0"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
        title={`Menu de ${typedSite.name}`}
        style={{ minHeight: '100vh' }}
      />
    </div>
  );
}
