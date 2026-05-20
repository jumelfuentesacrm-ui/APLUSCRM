import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '../../../lib/requireAdmin'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  const user = await requireAdmin(req, res)
  if (!user) return

  if (req.method !== 'POST') return res.status(405).end()

  const { card_id, payment_amount } = req.body
  if (!card_id) return res.status(400).json({ error: 'card_id requerido' })

  const { data: card } = await supabaseAdmin.from('loyalty_cards').select('*').eq('id', card_id).single()
  if (!card) return res.status(404).json({ error: 'Card not found' })

  const newStamps = card.stamps + 1
  const newCycle = Math.ceil(newStamps / 5) || 1
  const completed = newStamps % 5 === 0

  await supabaseAdmin.from('loyalty_cards').update({
    stamps: newStamps, cycle: newCycle, updated_at: new Date().toISOString()
  }).eq('id', card_id)

  await supabaseAdmin.from('stamp_history').insert({ card_id, payment_amount })

  return res.status(200).json({
    success: true, stamps: newStamps, cycle: newCycle, completedCycle: completed,
    message: completed ? 'Ciclo completado! Premio disponible.' : `Sello #${newStamps % 5}/5 registrado.`
  })
}
