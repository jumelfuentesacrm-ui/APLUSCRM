import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .order('sale_date', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ sales: data || [] })
  }

  if (req.method === 'POST') {
    const { customer_name, customer_email, product_name, amount, type, status, notes, sale_date } = req.body
    const { error } = await supabase.from('sales').insert({
      id: 'cash_'+Date.now(),
      customer_name, customer_email,
      product_name, amount: parseFloat(amount),
      currency: 'usd',
      type: type || 'cash',
      status: status || 'paid',
      notes,
      sale_date: sale_date || new Date().toISOString()
    })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  res.status(405).end()
}
