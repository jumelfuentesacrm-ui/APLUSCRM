import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'No autorizado' })

  const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  if (!user) return res.status(401).json({ error: 'No autorizado' })

  const { data: card, error } = await supabaseAdmin
    .from('loyalty_cards')
    .select('*, stamp_history(id,payment_amount,created_at), rewards(id,reward_type,reward_cost,status,redeemed_at)')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (error) return res.status(404).json({ error: 'Sin tarjeta' })
  return res.status(200).json({ card })
}
