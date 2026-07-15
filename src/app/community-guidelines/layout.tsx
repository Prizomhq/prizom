import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Community Guidelines | Prizom',
  description: 'Learn about Prizom\'s publishing guidelines, remixing attribution rules, and moderation policies.',
  alternates: {
    canonical: 'https://www.prizom.in/community-guidelines',
  },
};

export default function CommunityGuidelinesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
