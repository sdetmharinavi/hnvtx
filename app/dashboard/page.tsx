// app/dashboard/page.tsx
"use client";

import ScalableFiberNetworkDashboard from "@/app/bsnl/page";

export default function DashboardPage() {
  // This page is now a pure wrapper for the main network dashboard.
  // Profile completion prompts have been removed for the read-only viewer app.
  return <ScalableFiberNetworkDashboard />;
}
