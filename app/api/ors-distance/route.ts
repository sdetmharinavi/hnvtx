// path: app/api/ors-distance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { haversineDistance } from '@/utils/distance';

export async function POST(req: NextRequest) {
  const controller = new AbortController();
  // 10s timeout for the external API
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const body = await req.text();
    if (!body) {
      return NextResponse.json({ error: 'Request body is empty' }, { status: 400 });
    }

    // Safely parse body
    let parsedBody;
    try {
      parsedBody = JSON.parse(body);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { a, b } = parsedBody;

    // Validate coordinates
    if (!a?.lat || !a?.long || !b?.lat || !b?.long) {
      return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 });
    }

    const ORS_API_KEY = process.env.ORS_API_KEY;

    // If no key, fallback immediately to Haversine
    if (!ORS_API_KEY) {
      console.warn('ORS API key missing. Using fallback distance.');
      const dist = haversineDistance(a.lat, a.long, b.lat, b.long).toFixed(2);
      return NextResponse.json({ distance_km: dist, source: 'haversine-fallback' });
    }

    // Attempt external API call
    const res = await fetch('https://api.openrouteservice.org/v2/directions/driving-car', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: ORS_API_KEY,
      },
      body: JSON.stringify({
        coordinates: [
          [a.long, a.lat],
          [b.long, b.lat],
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorText = await res.text();
      console.warn(`ORS API Error (${res.status}):`, errorText);
      // On API error (e.g. quota exceeded), fallback to Haversine
      const dist = haversineDistance(a.lat, a.long, b.lat, b.long).toFixed(2);
      return NextResponse.json({ distance_km: dist, source: 'haversine-fallback' });
    }

    const data = await res.json();
    const meters = data?.routes?.[0]?.summary?.distance;

    if (meters === undefined || meters === null) {
      throw new Error('Invalid response structure from ORS');
    }

    return NextResponse.json({ distance_km: (meters / 1000).toFixed(2), source: 'ors' });
  } catch (error) {
    clearTimeout(timeoutId); // Ensure timeout is cleared

    console.error('ORS Fetch failed completely:', error);

    // Return a generic fallback response if we can't calculate
    return NextResponse.json({ error: 'Routing service unavailable' }, { status: 500 });
  }
}
