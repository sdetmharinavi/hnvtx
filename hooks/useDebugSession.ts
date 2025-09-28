// hooks/useDebugSession.ts
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export const useDebugSession = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    const checkSession = async () => {
      // Check current session
      const { data: { session }, error } = await supabase.auth.getSession()
      
      // Check headers that would be sent with requests
      const headers = await supabase.auth.getSession().then(({ data: { session } }) => ({
        'apikey': 'present',
        'authorization': session ? `Bearer ${session.access_token}` : 'none',
        'user_id': session?.user?.id || 'none'
      }))

      setSessionInfo({
        hasSession: !!session,
        userId: session?.user?.id,
        accessToken: session?.access_token ? 'present' : 'none',
        refreshToken: session?.refresh_token ? 'present' : 'none',
        expiresAt: session?.expires_at,
        headers,
        error: error?.message
      })

      console.log('Session Debug:', {
        hasSession: !!session,
        userId: session?.user?.id,
        accessToken: session?.access_token ? 'present' : 'none',
        headers,
        error: error?.message
      })
    }

    checkSession()

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, session?.user?.id)
        checkSession()
      }
    )

    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return sessionInfo
}