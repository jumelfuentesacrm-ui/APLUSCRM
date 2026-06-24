import { createClient } from '@supabase/supabase-js'
import { requireAdminOrAgent } from '../../../lib/requireAdmin'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  const user = await requireAdminOrAgent(req, res)
  if (!user) return
  // Agents can only DELETE their own leads, not others'
  // (full write access allowed — they need to create and update calls)

  if (req.method === 'GET') {
    let query = supabaseAdmin.from('cold_calls').select('*').order('created_at', { ascending: false })
    // Agents only see leads ready to book (enviar_cita) — no full pipeline
    if (user.role === 'agent') query = query.eq('call_status', 'enviar_cita')
    const { data, error } = await query
    if (error) return res.status(400).json({ error: error.message })
    return res.status(200).json({ leads: data || [] })
  }

  if (req.method === 'POST') {
    const { links, ...body } = req.body
    const { data, error } = await supabaseAdmin
      .from('cold_calls')
      .insert({ ...body, created_by: user.id })
      .select()
      .single()
    if (error) return res.status(400).json({ error: error.message })
    return res.status(200).json({ lead: data })
  }

  if (req.method === 'PATCH') {
    const { id, links, ...updates } = req.body
    updates.updated_at = new Date().toISOString()
    if (updates.call_status === 'booked' && !updates.booked_at) {
      updates.booked_at = new Date().toISOString()
    }
    const { data, error } = await supabaseAdmin
      .from('cold_calls')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) return res.status(400).json({ error: error.message })
    return res.status(200).json({ lead: data })
  }

  if (req.method === 'DELETE') {
    const { id } = req.body
    const { error } = await supabaseAdmin.from('cold_calls').delete().eq('id', id)
    if (error) return res.status(400).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
