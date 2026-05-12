import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data: items, error } = await supabaseAdmin
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
    if (isNaN(parsedCost)) return res.status(400).json({ error: 'Invalid cost value' })

    // Check if cost record exists
    const { data: existing } = await supabaseAdmin
      .from('catalog_costs')
      .select('id')
      .eq('product_id', product_id)
      .single()

    let error
    if (existing) {
      const { error: e } = await supabaseAdmin
        .from('catalog_costs')
        .update({ cost: parsedCost, notes: notes || null, updated_at: new Date().toISOString() })
        .eq('product_id', product_id)
      error = e
    } else {
      const { error: e } = await supabaseAdmin
        .from('catalog_costs')
        .insert({ product_id, cost: parsedCost, notes: notes || null })
      error = e
    }

    if (error) return res.status(500).json({ error: error.message })

    // Return updated item
    const { data: updated } = await supabaseAdmin
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

  res.status(405).end()
}
