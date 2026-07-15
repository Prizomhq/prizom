import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | Prizom',
  description: 'Read the terms and conditions for using Prizom, the collaborative AI prompt registry.',
  alternates: {
    canonical: 'https://www.prizom.in/terms',
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
