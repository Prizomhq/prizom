import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SuspendedClient from './SuspendedClient';

function calculateDaysRemaining(suspendedAtStr: string): number {
  const suspendedAt = new Date(suspendedAtStr).getTime();
  const until = suspendedAt + 15 * 24 * 60 * 60 * 1000;
  return Math.max(0, Math.ceil((until - Date.now()) / (1000 * 60 * 60 * 24)));
}

export default async function SuspendedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, role, suspended_at, ban_reason')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.role !== 'suspended' && profile.role !== 'permanently_banned')) {
    redirect('/');
  }

  const isSuspended = profile.role === 'suspended';
  const isBanned = profile.role === 'permanently_banned';

  let reason = 'Violation of platform policies.';
  let daysRemaining = 0;

  if (isSuspended) {
    reason = profile.ban_reason || 'Violation of platform policies.';
    if (profile.suspended_at) {
      daysRemaining = calculateDaysRemaining(profile.suspended_at);
    }
  } else if (isBanned) {
    reason = profile.ban_reason || 'Severe community guidelines violation.';
  }

  return (
    <SuspendedClient 
      username={profile.username}
      role={profile.role}
      reason={reason}
      daysRemaining={daysRemaining}
    />
  );
}
