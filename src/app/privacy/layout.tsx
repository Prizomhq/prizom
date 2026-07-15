import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Prizom',
  description: 'Understand how Prizom collects, protects, and uses your personal and authentication data.',
  alternates: {
    canonical: 'https://www.prizom.in/privacy',
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
