// app/onboarding/layout.tsx
"use client"

import { Protected } from "@/components/auth/Protected";
import { PageSpinner } from "@/components/common/ui/LoadingSpinner";
import { QueryProvider } from "@/providers/QueryProvider";
import { useEffect, useState } from "react";


export default function AccountLayout({ children }: { children: React.ReactNode }) {
    
  return (
    <QueryProvider><Protected>{children}</Protected></QueryProvider>
  );
}
