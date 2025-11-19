// app/onboarding/layout.tsx
"use client"

import { Protected } from "@/components/auth/Protected";
import { QueryProvider } from "@/providers/QueryProvider";
import { UserProvider } from "@/providers/UserProvider"; // THE FIX: Import UserProvider

export default function AccountLayout({ children }: { children: React.ReactNode }) {
    
  return (
    <QueryProvider>
      {/* THE FIX: Wrap the Protected component and its children with UserProvider */}
      <UserProvider>
        <Protected>{children}</Protected>
      </UserProvider>
    </QueryProvider>
  );
}
