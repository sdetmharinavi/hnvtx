// app/api/kml/delete/route.ts
import { del } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    
    if (!process.env.HNV_READ_WRITE_TOKEN) {
       throw new Error("Missing HNV_READ_WRITE_TOKEN");
    }

    // THE FIX: Pass token explicitly to del
    await del(url, {
      token: process.env.HNV_READ_WRITE_TOKEN
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Vercel Blob Delete Error:", error);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}