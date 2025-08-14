// app/auth/callback/route.ts
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // console.log('Auth callback received:', { code: !!code, error, errorDescription })

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, errorDescription)
    const errorParams = new URLSearchParams({
      error: error,
      message: errorDescription || 'Authentication failed'
    })
    return NextResponse.redirect(`${origin}/auth/error?${errorParams}`)
  }

  if (code) {
    const supabase = await createClient()
    
    try {
      // console.log('Exchanging code for session...')
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('Session exchange error:', exchangeError)
        const errorParams = new URLSearchParams({
          error: 'session_exchange_failed',
          message: exchangeError.message
        })
        return NextResponse.redirect(`${origin}/auth/error?${errorParams}`)
      }

      if (data.user) {
        // console.log('User authenticated:', data.user.id)
        
        // Check if user has a profile
        // console.log('Checking for existing profile...')
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('id', data.user.id)
          .single()

        // console.log('Profile check result:', { profile: !!profile, error: profileError?.code })

        // If no profile exists, redirect to onboarding
        // check non blocking way after 2 seconds
        setTimeout(() => {
          if (profileError && profileError.code === 'PGRST116') {
            // console.log('No profile found, redirecting to onboarding')
            return NextResponse.redirect(`${origin}/onboarding`)
          }
        }, 2000)
        

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Profile check error:', profileError)
          // Continue anyway, let the client handle it
        }

        // If profile exists, redirect to intended destination
        if (profile) {
          // console.log('Profile exists, redirecting to:', next)
          return NextResponse.redirect(`${origin}${next}`)
        }

        // Fallback: redirect to dashboard if no profile check conclusive
        // console.log('Fallback redirect to dashboard')
        return NextResponse.redirect(`${origin}/dashboard`)
      }
      
    } catch (error) {
      console.error('Unexpected error in auth callback:', error)
      const errorParams = new URLSearchParams({
        error: 'unexpected_error',
        message: 'An unexpected error occurred during authentication'
      })
      return NextResponse.redirect(`${origin}/auth/error?${errorParams}`)
    }
  }

  // No code parameter - invalid callback
  console.error('No code parameter received')
  const errorParams = new URLSearchParams({
    error: 'invalid_callback',
    message: 'Invalid authentication callback'
  })
  return NextResponse.redirect(`${origin}/auth/error?${errorParams}`)
}