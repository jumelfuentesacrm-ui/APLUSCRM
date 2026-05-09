import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'No autorizado' })

  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
  if (userError || !user) return res.status(401).json({ error: 'No autorizado' })

  const { data: p } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
  if (p?.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' })

  if (req.method === 'GET') {
    const { data: cards } = await supabaseAdmin.from('loyalty_cards')
      .select('*, profiles(full_name,business_name,phone)').order('created_at', { ascending: false })
    return res.status(200).json({ cards })
  }
  if (req.method === 'POST') {
    const { user_id, notes } = req.body
    const { data: num } = await supabaseAdmin.rpc('generate_card_number')
    const { data: card, error } = await supabaseAdmin.from('loyalty_cards')
      .insert({ user_id, card_number: num, notes, stamps: 0, cycle: 1 }).select().single()
    if (error) return res.status(400).json({ error: error.message })
    return res.status(200).json({ card })
  }
  if (req.method === 'DELETE') {
    const { id } = req.body
    await supabaseAdmin.from('loyalty_cards').delete().eq('id', id)
    return res.status(200).json({ success: true })
  }
  res.status(405).end()
}
