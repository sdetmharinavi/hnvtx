// path: app/auth/callback/route.ts
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  if (error) {
    console.error('OAuth Provider Error:', error, 'Description:', errorDescription);
    const redirectUrl = new URL(`${origin}/login`);
    redirectUrl.searchParams.append('error', 'oauth_provider_error');
    redirectUrl.searchParams.append(
      'error_description',
      errorDescription || 'An error occurred during authentication with the provider.'
    );
    return NextResponse.redirect(redirectUrl);
  }

  if (!code) {
    console.error('OAuth Callback Error: No code provided.');
    const redirectUrl = new URL(`${origin}/login`);
    redirectUrl.searchParams.append('error', 'oauth_callback_error');
    redirectUrl.searchParams.append(
      'error_description',
      'Authorization code was missing in the callback.'
    );
    return NextResponse.redirect(redirectUrl);
  }

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error('Session Exchange Error:', exchangeError.message);
    const redirectUrl = new URL(`${origin}/login`);
    redirectUrl.searchParams.append('error', 'session_exchange_failed');
    
    // Provide a user-friendly message based on common errors
    let description = 'Could not exchange authorization code for a session. Please try again.';
    if (exchangeError.message.includes('invalid grant')) {
        description = 'Authorization grant is invalid. This often means the Redirect URL in your Supabase project settings does not exactly match the one used by the application. Please check your Supabase URL Configuration.';
    }
    redirectUrl.searchParams.append('error_description', description);
    
    return NextResponse.redirect(redirectUrl);
  }

  // On success, redirect to the intended page.
  return NextResponse.redirect(`${origin}${next}`);
}