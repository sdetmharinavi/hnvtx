// path: app/api/ors-distance/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { a, b } = await req.json();
  const ORS_API_KEY = process.env.ORS_API_KEY;

  if (!ORS_API_KEY) {
    return NextResponse.json({ error: "Missing ORS API key on the server" }, { status: 500 });
  }

  try {
    const res = await fetch("https://api.openrouteservice.org/v2/directions/driving-car", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: ORS_API_KEY,
      },
      body: JSON.stringify({
        coordinates: [
          [a.long, a.lat],
          [b.long, b.lat],
        ],
      }),
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      console.error("ORS API Error:", errorData);
      return NextResponse.json({ error: "Failed to fetch distance from ORS API" }, { status: res.status });
    }

    const data = await res.json();
    const meters = data?.routes?.[0]?.summary?.distance;
    return NextResponse.json({ distance_km: meters ? (meters / 1000).toFixed(1) : null });
  } catch (error) {
    console.error("ORS internal API error:", error);
    return NextResponse.json({ error: "Failed to fetch distance" }, { status: 500 });
  }
}