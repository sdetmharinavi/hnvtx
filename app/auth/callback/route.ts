// app/auth/callback/route.ts
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // The 'next' URL is passed from the client when the OAuth flow is initiated
  const next = searchParams.get('next') ?? '/dashboard'; 
  const error = searchParams.get('error');

  if (error) {
    console.error('OAuth Error:', error);
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
  }

  if (!code) {
    console.error('OAuth Error: No code provided.');
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
  }

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error('Session exchange error:', exchangeError.message);
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
  }

  // On success, redirect to the intended page. The Protected component will handle the rest.
  return NextResponse.redirect(`${origin}${next}`);
}