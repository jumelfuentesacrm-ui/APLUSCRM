import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data: items } = await supabaseAdmin
      .from('catalog_items')
      .select('*, catalog_prices(*), catalog_costs(*)')
      .order('name')
    return res.status(200).json({ items: items || [] })
  }

  if (req.method === 'PATCH') {
    const { product_id, cost, notes } = req.body
    if (!product_id) return res.status(400).json({ error: 'product_id requerido' })
    const { error } = await supabaseAdmin.from('catalog_costs').upsert({
      product_id, cost: parseFloat(cost) || 0, notes: notes || null,
      updated_at: new Date().toISOString()
    }, { onConflict: 'product_id' })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  res.status(405).end()
}
