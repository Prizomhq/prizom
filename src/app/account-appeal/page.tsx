import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AppealFormClient from './AppealFormClient';

export default async function AccountAppealPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'suspended') {
    redirect('/');
  }

  return <AppealFormClient username={profile.username} />;
}
