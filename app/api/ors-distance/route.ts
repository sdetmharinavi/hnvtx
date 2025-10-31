// path: app/api/ors-distance/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Add a check for an empty body to prevent JSON parsing errors.
    const body = await req.text();
    if (!body) {
      return NextResponse.json({ error: "Request body is empty" }, { status: 400 });
    }
    const { a, b } = JSON.parse(body);

    const ORS_API_KEY = process.env.ORS_API_KEY;

    if (!ORS_API_KEY) {
      console.error("ORS API key is not configured on the server");
      return NextResponse.json({ error: "API key is not configured" }, { status: 500 });
    }

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
      return NextResponse.json({ error: `Failed to fetch from ORS API: ${res.statusText}` }, { status: res.status });
    }

    const data = await res.json();
    const meters = data?.routes?.[0]?.summary?.distance;
    return NextResponse.json({ distance_km: meters ? (meters / 1000).toFixed(1) : null });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    console.error("ORS internal API error:", error);
    return NextResponse.json({ error: `Failed to fetch distance: ${errorMessage}` }, { status: 500 });
  }
}