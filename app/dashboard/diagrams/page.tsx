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
import { AuthChangeEvent, AuthSession, User } from "@supabase/supabase-js";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    let listener: { unsubscribe: () => void };

    async function initSupabase() {
      const { data: { user } = {} } = await supabase.auth.getUser();
      setUser(user ?? null);

      const { data } = supabase.auth.onAuthStateChange(
        (_event: AuthChangeEvent, session: AuthSession | null) => {
          setUser(session?.user ?? null);
        },
      );
      listener = data.subscription;
    }

    initSupabase();

    return () => {
      if (listener?.unsubscribe) {
        listener.unsubscribe();
      }
    };
  }, [supabase]);

  return (
    <div className="p-4">
      <h1 className="mb-4 text-2xl font-bold">
        Upload OFC Diagrams
      </h1>
      {!user ? <p>Please log in to upload files.</p> : <FileUploader />}
    </div>
  );
}
