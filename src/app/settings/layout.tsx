import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Account Settings | Prizom',
  description: 'Manage your Prizom account settings, profile preferences, and privacy controls.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
