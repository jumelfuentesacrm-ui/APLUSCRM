import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data: items, error } = await supabase
      .from('catalog_items')
      .select(`
        id, name, description, active, created_at, updated_at,
        catalog_prices ( id, amount, currency, interval, active ),
        catalog_costs ( id, cost, notes, updated_at )
      `)
      .order('name')
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ items: items || [] })
  }

  if (req.method === 'PATCH') {
    const { product_id, cost, notes } = req.body
    if (!product_id) return res.status(400).json({ error: 'product_id required' })
    const parsedCost = parseFloat(cost)
    if (isNaN(parsedCost)) return res.status(400).json({ error: 'Invalid cost' })

    // Upsert current cost
    const { data: existing } = await supabase
      .from('catalog_costs')
      .select('id')
      .eq('product_id', product_id)
      .single()

    if (existing) {
      await supabase.from('catalog_costs')
        .update({ cost: parsedCost, notes: notes || null, updated_at: new Date().toISOString() })
        .eq('product_id', product_id)
    } else {
      await supabase.from('catalog_costs')
        .insert({ product_id, cost: parsedCost, notes: notes || null })
    }

    // Save to history
    await supabase.from('catalog_cost_history')
      .insert({ product_id, cost: parsedCost, notes: notes || null })

    // Return updated item
    const { data: updated } = await supabase
      .from('catalog_items')
      .select(`
        id, name, description, active,
        catalog_prices ( id, amount, currency, interval, active ),
        catalog_costs ( id, cost, notes, updated_at )
      `)
      .eq('id', product_id)
      .single()

    return res.status(200).json({ success: true, item: updated })
  }

  if (req.method === 'GET' && req.query.history) {
    const { data, error } = await supabase
      .from('catalog_cost_history')
      .select('*')
      .eq('product_id', req.query.history)
      .order('created_at', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ history: data || [] })
  }

  res.status(405).end()
}
