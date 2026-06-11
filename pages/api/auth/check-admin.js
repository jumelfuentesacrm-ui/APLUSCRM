import { createClient } from '@supabase/supabase-js'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  // Verify the caller is authenticated via session cookie
  const supabaseServer = createPagesServerClient({ req, res })
  const { data: { session } } = await supabaseServer.auth.getSession()
  if (!session) return res.status(401).json({ isAdmin: false })

  // Use service role to bypass RLS and check the profile role
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  const { data } = await admin
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  const isAdmin = data?.role === 'admin' || session.user.user_metadata?.role === 'admin'
  return res.status(200).json({ isAdmin })
}
