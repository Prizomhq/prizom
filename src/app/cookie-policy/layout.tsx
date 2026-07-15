import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy | Prizom',
  description: 'Learn how Prizom uses essential cookies for authentication and performance optimization.',
  alternates: {
    canonical: 'https://www.prizom.in/cookie-policy',
  },
};

export default function CookiePolicyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
