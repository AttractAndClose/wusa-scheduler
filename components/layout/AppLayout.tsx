'use client';

import { Sidebar } from '@/components/layout/Sidebar';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto bg-gray-light">
        {children}
      </div>
    </div>
  );
}

