import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'

export default async function handler(req, res) {
  const supabase = createServerSupabaseClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return res.status(401).json({ error: 'No autorizado' })

  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, full_name, business_name, phone, role')
    .eq('role', 'client')
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })
  return res.status(200).json({ users })
}
