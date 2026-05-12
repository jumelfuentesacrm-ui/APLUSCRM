import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    // Sync products
    const products = await stripe.products.list({ limit: 100 })
    for (const p of products.data) {
      await supabase.from('catalog_items').upsert({
        id: p.id, name: p.name,
        description: p.description || null,
        active: p.active,
        updated_at: new Date().toISOString()
      })
    }

    // Sync prices
    const prices = await stripe.prices.list({ limit: 100 })
    for (const p of prices.data) {
      await supabase.from('catalog_prices').upsert({
        id: p.id, product_id: p.product,
        amount: p.unit_amount ? p.unit_amount / 100 : null,
        currency: p.currency,
        interval: p.recurring?.interval || null,
        active: p.active
      })
    }

    return res.status(200).json({
      success: true,
      products: products.data.length,
      prices: prices.data.length
    })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
