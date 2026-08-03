import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Prompt | Prizom',
  description: 'Publish and parameterize AI visual prompts on Prizom.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function CreateLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
