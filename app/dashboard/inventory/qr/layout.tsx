// path: app/dashboard/inventory/qr/layout.tsx
'use client';

// This is a special layout to ensure the QR code page is rendered
// on a clean, empty page without the main dashboard navigation.
// This makes printing much more reliable.

import { Protected } from '@/components/auth/Protected';
import { UserProvider } from '@/providers/UserProvider';
import { allowedRoles } from '@/constants/constants';

export default function QrCodeLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <Protected allowedRoles={allowedRoles}>
        {/* We don't render any dashboard chrome here, just the page content. */}
        {children}
      </Protected>
    </UserProvider>
  );
}
