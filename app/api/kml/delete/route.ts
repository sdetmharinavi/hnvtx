import { del } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    // 1. Authenticate User
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Permissions Check using RPC
    // We use the database function public.is_super_admin() which checks the current user's status
    const { data: isSuperAdmin, error: rpcError } = await supabase.rpc('is_super_admin');
    
    if (rpcError) {
      console.error('RPC Error checking permissions:', rpcError);
      return NextResponse.json({ error: 'Failed to verify permissions' }, { status: 500 });
    }
    
    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden: Only Super Admins can delete files' }, { status: 403 });
    }

    // 3. Process Request
    const body = await request.json();
    const { url } = body;
    
    if (!url) {
      return NextResponse.json({ error: 'URL required' }, { status: 400 });
    }

    if (!process.env.HNV_READ_WRITE_TOKEN) {
        throw new Error("Missing HNV_READ_WRITE_TOKEN");
    }

    // 4. Delete from Vercel Blob
    await del(url, {
      token: process.env.HNV_READ_WRITE_TOKEN
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("Blob delete error:", error);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}