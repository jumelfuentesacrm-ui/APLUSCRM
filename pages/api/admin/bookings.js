import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { name, phone, business, date, time } = req.body
    if (!name || !phone || !business || !date || !time) {
      return res.status(400).json({ error: 'Missing required fields' })
    }
    const { data, error } = await supabase
      .from('bookings')
      .insert([{ name, phone, business, date, time, status: 'pending' }])
      .select()
      .single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json(data)
  }

  if (req.method === 'GET') {
    const { from, to, status } = req.query
    let query = supabase.from('bookings').select('*').order('date', { ascending: true }).order('time', { ascending: true })
    if (from) query = query.gte('date', from)
    if (to) query = query.lte('date', to)
    if (status) query = query.eq('status', status)
    const { data, error } = await query
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'PATCH') {
    const { id, status, notes } = req.body
    if (!id) return res.status(400).json({ error: 'Missing id' })
    const update = {}
    if (status) update.status = status
    if (notes !== undefined) update.notes = notes
    const { data, error } = await supabase.from('bookings').update(update).eq('id', id).select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  res.status(405).end()
}
