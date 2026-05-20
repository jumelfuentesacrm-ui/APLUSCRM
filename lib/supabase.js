import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'

// Browser: cookie-based sessions so server-side auth checks can read them.
// Server (SSR/API): plain anon client (API routes use requireAdmin + service role).
export const supabase = typeof window !== 'undefined'
  ? createBrowserSupabaseClient()
  : createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
