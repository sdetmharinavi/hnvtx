// path: app/api/ors-distance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { haversineDistance } from '@/utils/distance';

export async function POST(req: NextRequest) {
  const controller = new AbortController();
  // 10s timeout for the external API
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  // Initialize variables safely in the outer scope
  let latA: number | null = null;
  let lngA: number | null = null;
  let latB: number | null = null;
  let lngB: number | null = null;

  try {
    const body = await req.text();
    if (!body) {
      clearTimeout(timeoutId);
      return NextResponse.json({ error: 'Request body is empty' }, { status: 400 });
    }

    // Safely parse body
    let parsedBody;
    try {
      parsedBody = JSON.parse(body);
    } catch {
      clearTimeout(timeoutId);
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { a, b } = parsedBody;

    // Extract coordinates supporting both short lat/long and full latitude/longitude schemas
    latA = a?.lat ?? a?.latitude ?? null;
    lngA = a?.long ?? a?.longitude ?? a?.lng ?? null;
    latB = b?.lat ?? b?.latitude ?? null;
    lngB = b?.long ?? b?.longitude ?? b?.lng ?? null;

    // Validate coordinates
    if (latA === null || lngA === null || latB === null || lngB === null) {
      clearTimeout(timeoutId);
      return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 });
    }

    const ORS_API_KEY = process.env.ORS_API_KEY;

    // If no key, fallback immediately to Haversine
    if (!ORS_API_KEY) {
      console.warn('ORS API key missing. Using fallback distance.');
      const dist = haversineDistance(latA, lngA, latB, lngB).toFixed(2);
      clearTimeout(timeoutId);
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
          [lngA, latA],
          [lngB, latB],
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorText = await res.text();
      console.warn(`ORS API Error (${res.status}):`, errorText);
      // On API error (e.g. quota exceeded), fallback to Haversine
      const dist = haversineDistance(latA, lngA, latB, lngB).toFixed(2);
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

    console.warn('ORS Fetch failed or timed out, falling back to Haversine:', error);

    // Fallback if we have valid coordinates extracted in scope
    if (latA !== null && lngA !== null && latB !== null && lngB !== null) {
      const dist = haversineDistance(latA, lngA, latB, lngB).toFixed(2);
      return NextResponse.json({ distance_km: dist, source: 'haversine-fallback' });
    }

    // Return a generic error only if fallback is impossible
    return NextResponse.json({ error: 'Routing service unavailable' }, { status: 500 });
  }
}
