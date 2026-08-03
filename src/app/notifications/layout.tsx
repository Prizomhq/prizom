import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Notifications | Prizom',
  description: 'View your activity notifications, creator alerts, and system updates.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
