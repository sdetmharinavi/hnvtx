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
import { NetworkStatusBar } from '@/components/common/ui/NetworkStatusBar';
import { cn } from '@/lib/utils';
// THE FIX: Import the modal
import { KeyboardShortcutsModal } from '@/components/common/KeyboardShortcutsModal';

// Inner component to safely use hooks inside providers
function DashboardContent({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  useRealtimeSubscription();

  return (
    <>
      <CommandMenu />
      <NetworkStatusBar />
      {/* THE FIX: Add Keyboard Shortcuts Modal here so it's always mounted and listening */}
      <KeyboardShortcutsModal />

      {/* Sidebar - Fixed position */}
      {/* Hidden on print. Z-index 50 to stay above content but below modals. */}
      <div className="no-print z-50">
        <Sidebar
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          showMenuFeatures={true}
        />
      </div>

      {/*
         Main Container
         - Mobile: No margin (w-full)
         - Desktop (md+): Margin left based on sidebar state
         - Transition: Smooth width transition
      */}
      <div
        className={cn(
          'flex min-h-screen flex-col transition-[margin] duration-300 ease-in-out',
          // Base: No margin (Mobile)
          'ml-0',
          // Desktop: Dynamic margin based on collapsed state
          // We use arbitrary values matching sidebar widths: 64px (collapsed) and 260px (expanded)
          isCollapsed ? 'md:ml-[64px]' : 'md:ml-[260px]',
        )}
      >
        <div className="no-print">
          <DashboardHeader onMenuClick={() => setIsCollapsed(!isCollapsed)} />
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-x-hidden">
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
            <DashboardContent>{children}</DashboardContent>
          </ViewSettingsProvider>
        </RouteBasedUploadConfigProvider>
      </Protected>
    </UserProvider>
  );
}
