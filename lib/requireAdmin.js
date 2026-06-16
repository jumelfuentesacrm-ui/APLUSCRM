import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function requireAdmin(req, res) {
  try {
    const supabaseServer = createServerSupabaseClient({ req, res })
    const { data: { session } } = await supabaseServer.auth.getSession()
    if (!session) {
      res.status(401).json({ error: 'Not authenticated' })
      return null
    }
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()
    if (profile?.role !== 'admin') {
      res.status(403).json({ error: 'Admin access required' })
      return null
    }
    return { ...session.user, role: 'admin' }
  } catch {
    res.status(500).json({ error: 'Authentication failed' })
    return null
  }
}

// Allows both admin and agent roles; returns user with their role
export async function requireAdminOrAgent(req, res) {
  try {
    const supabaseServer = createServerSupabaseClient({ req, res })
    const { data: { session } } = await supabaseServer.auth.getSession()
    if (!session) {
      res.status(401).json({ error: 'Not authenticated' })
      return null
    }
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()
    if (profile?.role !== 'admin' && profile?.role !== 'agent') {
      res.status(403).json({ error: 'Access required' })
      return null
    }
    return { ...session.user, role: profile.role }
  } catch {
    res.status(500).json({ error: 'Authentication failed' })
    return null
  }
}
