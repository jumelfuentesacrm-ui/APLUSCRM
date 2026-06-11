import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { name, phone, facebook_page, service, date, time, notes } = req.body
    if (!name || !phone || !date || !time) {
      return res.status(400).json({ error: 'Missing required fields' })
    }
    const { data, error } = await supabase
      .from('bookings')
      .insert([{ name, phone, facebook_page, service, date, time, notes, status: 'pending', archived: false }])
      .select()
      .single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json(data)
  }

  if (req.method === 'GET') {
    const { from, to, status, archived } = req.query
    let query = supabase.from('bookings').select('*').order('date', { ascending: true }).order('time', { ascending: true })
    if (from) query = query.gte('date', from)
    if (to) query = query.lte('date', to)
    if (status) query = query.eq('status', status)
    // By default return all (active + archived) — client filters
    const { data, error } = await query
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'PATCH') {
    const { id, status, notes, archived, archived_reason, buy_service, buy_amount, buy_type, buy_monthly, buy_total, buy_installments, buy_notes } = req.body
    if (!id) return res.status(400).json({ error: 'Missing id' })
    const update = {}
    if (status !== undefined) update.status = status
    if (notes !== undefined) update.notes = notes
    if (archived !== undefined) update.archived = archived
    if (archived_reason !== undefined) update.archived_reason = archived_reason
    if (buy_service !== undefined) update.buy_service = buy_service
    if (buy_amount !== undefined) update.buy_amount = buy_amount
    if (buy_type !== undefined) update.buy_type = buy_type
    if (buy_monthly !== undefined) update.buy_monthly = buy_monthly
    if (buy_total !== undefined) update.buy_total = buy_total
    if (buy_installments !== undefined) update.buy_installments = buy_installments
    if (buy_notes !== undefined) update.buy_notes = buy_notes
    const { data, error } = await supabase.from('bookings').update(update).eq('id', id).select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  res.status(405).end()
}
