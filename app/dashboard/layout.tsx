// app/dashboard/layout.tsx
'use client';

import { useState } from 'react';
import { Protected } from '@/components/auth/Protected';
import { RouteBasedUploadConfigProvider } from '@/hooks/UseRouteBasedUploadConfigOptions';
import 'leaflet/dist/leaflet.css';
import { allowedRoles } from '@/constants/constants';
import { UserProvider } from '@/providers/UserProvider';
import { ViewSettingsProvider } from '@/contexts/ViewSettingsContext';
import Sidebar from '@/components/navigation/sidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { CommandMenu } from '@/components/common/CommandMenu';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { cn } from '@/lib/utils';
import { KeyboardShortcutsModal } from '@/components/common/KeyboardShortcutsModal';
import { SplashScreen } from '@/components/common/SplashScreen';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  useRealtimeSubscription();

  return (
    <>
      <CommandMenu />
      <KeyboardShortcutsModal />

      {/* THE FIX: Added relative z-[100] to ensure the sidebar wrapper commands the stacking context */}
      <div className='no-print relative z-[100]'>
        <Sidebar
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          showMenuFeatures={true}
        />
      </div>

      <div
        className={cn(
          'flex min-h-screen flex-col transition-[margin] duration-300 ease-in-out',
          'ml-0',
          isCollapsed ? 'md:ml-[64px]' : 'md:ml-[260px]',
        )}
      >
        <div className='no-print z-50'>
          <DashboardHeader onMenuClick={() => setIsCollapsed(!isCollapsed)} />
        </div>

        {/* Set z-10 for the main content to push it strictly below the z-[100] Sidebar */}
        <main className='flex-1 overflow-x-hidden relative z-10'>
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
        <RouteBasedUploadConfigProvider options={{ autoSetConfig: true }}>
          <ViewSettingsProvider>
            <SplashScreen />
            <DashboardContent>{children}</DashboardContent>
          </ViewSettingsProvider>
        </RouteBasedUploadConfigProvider>
      </Protected>
    </UserProvider>
  );
}