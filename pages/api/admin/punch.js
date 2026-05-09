import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const supabase = createServerSupabaseClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return res.status(401).json({ error: 'No autorizado' })
  const { data: p } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
  if (p?.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' })

  const { card_id, payment_amount } = req.body
  const { data: card } = await supabase.from('loyalty_cards').select('*').eq('id', card_id).single()
  const newStamps = card.stamps + 1
  const newCycle = Math.ceil(newStamps / 5) || 1
  const completed = newStamps % 5 === 0

  await supabase.from('loyalty_cards').update({ stamps: newStamps, cycle: newCycle, updated_at: new Date().toISOString() }).eq('id', card_id)
  await supabase.from('stamp_history').insert({ card_id, admin_id: session.user.id, payment_amount })

  return res.status(200).json({
    success: true, stamps: newStamps, cycle: newCycle, completedCycle: completed,
    message: completed ? `🎁 ¡Ciclo completado! Premio disponible.` : `✦ Sello #${newStamps % 5}/5 registrado.`
  })
}
