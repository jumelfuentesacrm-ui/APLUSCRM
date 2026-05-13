import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('supplies')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ supplies: data || [] })
  }

  if (req.method === 'POST') {
    const { name, category, cost, unit, provider, renewal_date, notes } = req.body
    if (!name || cost === undefined) return res.status(400).json({ error: 'name and cost required' })
    const { data, error } = await supabaseAdmin.from('supplies').insert({
      name, category: category||null, cost: parseFloat(cost), unit: unit||'month',
      provider: provider||null, renewal_date: renewal_date||null, notes: notes||null, active: true
    }).select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ supply: data })
  }

  if (req.method === 'PATCH') {
    const { id, ...fields } = req.body
    if (!id) return res.status(400).json({ error: 'id required' })
    if (fields.cost !== undefined) fields.cost = parseFloat(fields.cost)
    const { error } = await supabaseAdmin.from('supplies').update(fields).eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  if (req.method === 'DELETE') {
    const { id } = req.body
    if (!id) return res.status(400).json({ error: 'id required' })
    const { error } = await supabaseAdmin.from('supplies').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  res.status(405).end()
}
