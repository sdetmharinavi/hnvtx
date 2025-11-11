// path: app/api/ors-distance/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // THE FIX: Set a longer timeout and use an AbortController for robust handling.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000); // 20-second timeout

  try {
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
      // THE FIX: Attach the abort signal to the fetch request.
      signal: controller.signal,
    });
    
    // Clear the timeout timer once the fetch is complete
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorData = await res.json();
      console.error("ORS API Error:", errorData);
      return NextResponse.json({ error: `Failed to fetch from ORS API: ${res.statusText}` }, { status: res.status });
    }

    const data = await res.json();
    const meters = data?.routes?.[0]?.summary?.distance;
    return NextResponse.json({ distance_km: meters ? (meters / 1000).toFixed(1) : null });

  } catch (error) {
    clearTimeout(timeoutId); // Ensure timeout is cleared on any error
    
    // THE FIX: Provide more specific error messages based on the error type.
    if (error instanceof Error && error.name === 'AbortError') {
      console.error("ORS API request timed out after 20 seconds.");
      return NextResponse.json({ error: "The routing service took too long to respond. Please try again later." }, { status: 504 }); // 504 Gateway Timeout
    }

    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    console.error("ORS internal API error:", error);
    return NextResponse.json({ error: `Failed to fetch distance: ${errorMessage}` }, { status: 500 });
  }
}