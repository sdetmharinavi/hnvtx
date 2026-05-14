// app/api/kml/route.ts
import { list } from '@vercel/blob'; // ONLY importing 'list'
import { NextResponse } from 'next/server';

// Opt out of static caching so it always fetches the latest list
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Verify token availability
    if (!process.env.HNV_READ_WRITE_TOKEN) {
      console.error('Missing HNV_READ_WRITE_TOKEN environment variable');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Read-only operation to get the URLs of the maps
    const { blobs } = await list({
      prefix: 'kml-files/',
      token: process.env.HNV_READ_WRITE_TOKEN,
    });

    return NextResponse.json(blobs);
  } catch (error) {
    console.error('Vercel Blob List Error:', error);
    return NextResponse.json({ error: 'Failed to list files' }, { status: 500 });
  }
}

// Note: The POST function has been intentionally deleted to enforce a strictly read-only architecture.