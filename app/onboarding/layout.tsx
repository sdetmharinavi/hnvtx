// app/onboarding/layout.tsx
"use client"

import { Protected } from "@/components/auth/Protected";
import { QueryProvider } from "@/providers/QueryProvider";


export default function AccountLayout({ children }: { children: React.ReactNode }) {
    
  return (
    <QueryProvider><Protected>{children}</Protected></QueryProvider>
  );
}
