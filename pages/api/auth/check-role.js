import { createClient } from '@supabase/supabase-js'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const supabaseServer = createPagesServerClient({ req, res })
  const { data: { session } } = await supabaseServer.auth.getSession()
  if (!session) return res.status(401).json({ role: null })

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  const { data } = await admin
    .from('profiles')
    .select('role, full_name, business_name')
    .eq('id', session.user.id)
    .single()

  const role = data?.role || null
  if (role !== 'admin' && role !== 'agent') return res.status(403).json({ role: null })
  return res.status(200).json({ role, userId: session.user.id, name: data?.business_name || data?.full_name || session.user.email })
}
