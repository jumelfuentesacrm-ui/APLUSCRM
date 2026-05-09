import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'

export default async function handler(req, res) {
  const supabase = createServerSupabaseClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return res.status(401).json({ error: 'No autorizado' })
  const { data: card, error } = await supabase
    .from('loyalty_cards')
    .select('*, stamp_history(id,payment_amount,created_at), rewards(id,reward_type,reward_cost,status,redeemed_at)')
    .eq('user_id', session.user.id)
    .eq('is_active', true)
    .single()
  if (error) return res.status(404).json({ error: 'Sin tarjeta' })
  return res.status(200).json({ card })
}
