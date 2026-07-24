import { redirect } from 'next/navigation';

export default function LegacyCreateStudioRedirect() {
  redirect('/studio');
}
