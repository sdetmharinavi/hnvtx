// path: app/api/ors-distance/route.ts
import { NextRequest, NextResponse } from "next/server";

// Helper function to handle fetch with retries and timeout
async function fetchWithRetry(url: string, options: RequestInit, retries = 3, initialBackoff = 500) {
  let backoff = initialBackoff;
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      // Use a slightly shorter timeout for individual attempts
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8-second timeout

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Don't retry on client errors (e.g., 4xx), as they are likely permanent
        if (response.status >= 400 && response.status < 500) {
          const errorData = await response.json();
          throw new Error(`API Client Error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
        }
        // For server errors (5xx), it's worth retrying
        throw new Error(`API Server Error: ${response.status} ${response.statusText}`);
      }

      return response; // Success
    } catch (error) {
      const isLastAttempt = i === retries - 1;
      if (isLastAttempt) {
        // If all retries fail, throw the last error
        throw error;
      }
      // Log the retry attempt
      console.log(`Fetch attempt ${i + 1} failed. Retrying in ${backoff}ms...`);
      await new Promise(res => setTimeout(res, backoff));
      backoff *= 2; // Exponential backoff
    }
  }
  // This line should be unreachable
  throw new Error("Fetch failed after all retries.");
}


export async function POST(req: NextRequest) {
  const { a, b } = await req.json();
  const ORS_API_KEY = process.env.ORS_API_KEY;

  if (!ORS_API_KEY) {
    return NextResponse.json({ error: "Missing ORS API key on the server" }, { status: 500 });
  }

  try {
    const res = await fetchWithRetry("https://api.openrouteservice.org/v2/directions/driving-car", {
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
    
    // No need to check res.ok here, fetchWithRetry handles it
    const data = await res.json();
    const meters = data?.routes?.[0]?.summary?.distance;
    return NextResponse.json({ distance_km: meters ? (meters / 1000).toFixed(1) : "N/A" });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    
    // Provide a more specific error message for timeouts
    const isTimeoutError = errorMessage.includes('aborted') || 
      (error && typeof error === 'object' && 'code' in error && error.code === 'UND_ERR_CONNECT_TIMEOUT');
    
    if (isTimeoutError) {
      console.error("ORS API Timeout:", error);
      return NextResponse.json({ error: "The request to the routing service timed out. Please try again later." }, { status: 504 }); // Gateway Timeout
    }

    console.error("ORS internal API error:", error);
    return NextResponse.json({ error: `Failed to fetch distance: ${errorMessage}` }, { status: 500 });
  }
}