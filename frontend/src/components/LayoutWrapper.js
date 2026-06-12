'use client';

import { usePathname } from 'next/navigation';
import { UserProvider, useUser } from '@/context/UserContext';
import Sidebar from '@/components/Sidebar';

function InnerLayout({ children }) {
  const pathname = usePathname();
  const { selectedUser } = useUser();

  const isLanding = pathname === '/';

  if (isLanding || !selectedUser) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#101419]">
      <Sidebar />
      <main className="min-h-screen pb-24 lg:pb-0 lg:pl-[280px]">
        <div className="mx-auto w-full max-w-[1540px] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}

export function LayoutWrapper({ children }) {
  return (
    <UserProvider>
      <InnerLayout>{children}</InnerLayout>
    </UserProvider>
  );
}
