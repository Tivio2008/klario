import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: sites }, { data: demoLinks }] = await Promise.all([
    supabase.from('sites').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }),
    supabase.from('demo_links').select('*').in(
      'site_id',
      (await supabase.from('sites').select('id').eq('user_id', user.id)).data?.map(s => s.id) ?? []
    ),
  ]);

  return <DashboardClient initialSites={sites ?? []} initialDemoLinks={demoLinks ?? []} />;
}
