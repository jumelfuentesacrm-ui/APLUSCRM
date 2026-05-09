import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'

export default async function handler(req, res) {
  const supabase = createServerSupabaseClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return res.status(401).json({ error: 'No autorizado' })
  const { data: p } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
  if (p?.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' })

  const { data: users } = await supabase.from('profiles')
    .select('*, loyalty_cards(id,card_number,stamps,is_active)')
    .eq('role', 'client').order('created_at', { ascending: false })
  return res.status(200).json({ users })
}
