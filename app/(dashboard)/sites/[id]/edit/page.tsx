import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { EditorClient } from './EditorClient';

export default async function EditSitePage({ params }: { params: Promise<{ id: string }> }) {
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

  const { data: demoLinks } = await supabase
    .from('demo_links')
    .select('*')
    .eq('site_id', id)
    .order('created_at', { ascending: false });

  return <EditorClient site={site} initialDemoLinks={demoLinks ?? []} />;
}
