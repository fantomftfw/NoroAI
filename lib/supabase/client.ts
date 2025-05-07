

import { useSession } from '@clerk/nextjs'
import { createClient } from '@supabase/supabase-js'
import { useMemo } from 'react'

export function useClerkSupabaseClient() {
  const { session } = useSession()

  const supabaseClient = useMemo(() => {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        async accessToken() {
          return session?.getToken() ?? null
        },
      }
    )
  }, [session])

  return supabaseClient
}