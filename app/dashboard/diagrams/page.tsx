"use client";

// app/diagrams/page.tsx

import dynamic from "next/dynamic";

// Disable SSR for the StorageManager component
const FileUploader = dynamic(
  () => import("@/components/diagrams/FileUploader"),
  { ssr: false },
);

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    let listener: any;

    async function initSupabase() {
      const { data: { user } = {} } = await supabase.auth.getUser();
      setUser(user ?? null);

      const { data } = supabase.auth.onAuthStateChange(
        (_event: any, session: any) => {
          setUser(session?.user ?? null);
        },
      );
      listener = data;
    }

    initSupabase();

    return () => {
      if (listener?.unsubscribe) {
        listener.unsubscribe();
      }
    };
  }, []);

  return (
    <div className="p-4">
      <h1 className="mb-4 text-2xl font-bold">
        Upload OFC Diagrams
      </h1>
      {!user ? <p>Please log in to upload files.</p> : <FileUploader />}
    </div>
  );
}
