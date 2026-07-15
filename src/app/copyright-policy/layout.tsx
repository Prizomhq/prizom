import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Copyright & DMCA Policy | Prizom',
  description: 'Review Prizom\'s intellectual property protection guidelines and DMCA copyright infringement notice forms.',
  alternates: {
    canonical: 'https://www.prizom.in/copyright-policy',
  },
};

export default function CopyrightPolicyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
