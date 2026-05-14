// app/api/kml/route.ts
import { put, list } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Verify token availability
    if (!process.env.HNV_READ_WRITE_TOKEN) {
      console.error('Missing HNV_READ_WRITE_TOKEN environment variable');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // THE FIX: Pass the token explicitly to the list function
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

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename) {
    return NextResponse.json({ error: 'Filename required' }, { status: 400 });
  }

  // Verify token availability
  if (!process.env.HNV_READ_WRITE_TOKEN) {
    console.error('Missing HNV_READ_WRITE_TOKEN environment variable');
    return NextResponse.json(
      { error: 'Server configuration error: Missing Token' },
      { status: 500 }
    );
  }

  try {
    // Ensure the body is valid
    if (!request.body) {
      return NextResponse.json({ error: 'Request body is empty' }, { status: 400 });
    }

    const blob = await put(`kml-files/${filename}`, request.body, {
      access: 'public',
      token: process.env.HNV_READ_WRITE_TOKEN, // Explicitly pass the token to be safe
    });

    return NextResponse.json(blob);
  } catch (error) {
    // Log the full error object for debugging
    console.error('Vercel Blob Upload Error:', error);

    // Return a more specific error message if possible
    const message = error instanceof Error ? error.message : 'Unknown upload error';
    return NextResponse.json({ error: `Upload failed: ${message}` }, { status: 500 });
  }
}
