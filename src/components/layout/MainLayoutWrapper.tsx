'use client';

import { usePathname } from 'next/navigation';

export default function MainLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  return (
    <main className={isAdmin ? "flex-1" : "flex-1 pt-[calc(4rem+env(safe-area-inset-top,0px))] pb-16 lg:pb-0"}>
      {children}
    </main>
  );
}
