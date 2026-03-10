// app/dashboard/layout.tsx
'use client';

import { useState } from 'react';
import { Protected } from '@/components/auth/Protected';
import 'leaflet/dist/leaflet.css';
import { allowedRoles } from '@/constants/constants';
import { UserProvider } from '@/providers/UserProvider';
import { ViewSettingsProvider } from '@/contexts/ViewSettingsContext';
import Sidebar from '@/components/navigation/sidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { CommandMenu } from '@/components/common/CommandMenu';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { NetworkStatusBar } from '@/components/common/ui/NetworkStatusBar';
import { cn } from '@/lib/utils';
import { KeyboardShortcutsModal } from '@/components/common/KeyboardShortcutsModal';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  useRealtimeSubscription();

  return (
    <>
      <CommandMenu />
      <NetworkStatusBar />
      <KeyboardShortcutsModal />

      <div className='no-print z-50'>
        <Sidebar
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          showMenuFeatures={false} // Disable quick actions/upload
        />
      </div>

      <div
        className={cn(
          'flex min-h-screen flex-col transition-[margin] duration-300 ease-in-out',
          'ml-0',
          isCollapsed ? 'md:ml-[64px]' : 'md:ml-[260px]',
        )}>
        <div className='no-print'>
          <DashboardHeader onMenuClick={() => setIsCollapsed(!isCollapsed)} />
        </div>

        <main className='flex-1 overflow-x-hidden'>
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>
    </>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <Protected allowedRoles={allowedRoles}>
        <ViewSettingsProvider>
          <DashboardContent>{children}</DashboardContent>
        </ViewSettingsProvider>
      </Protected>
    </UserProvider>
  );
}
