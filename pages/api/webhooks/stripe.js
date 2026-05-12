import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const config = { api: { bodyParser: false } }

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', chunk => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const rawBody = await getRawBody(req)
  const sig = req.headers['stripe-signature']

  let event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    return res.status(400).json({ error: `Webhook error: ${err.message}` })
  }

  const { type, data } = event
  const obj = data.object

  // PRODUCTS
  if (type === 'product.created' || type === 'product.updated') {
    await supabase.from('catalog_items').upsert({
      id: obj.id,
      name: obj.name,
      description: obj.description || null,
      active: obj.active,
      updated_at: new Date().toISOString()
    })
  }

  if (type === 'product.deleted') {
    await supabase.from('catalog_items').delete().eq('id', obj.id)
  }

  // PRICES
  if (type === 'price.created' || type === 'price.updated') {
    await supabase.from('catalog_prices').upsert({
      id: obj.id,
      product_id: obj.product,
      amount: obj.unit_amount ? obj.unit_amount / 100 : null,
      currency: obj.currency,
      interval: obj.recurring?.interval || null,
      active: obj.active
    })
  }

  if (type === 'price.deleted') {
    await supabase.from('catalog_prices').delete().eq('id', obj.id)
  }

  // PAYMENTS
  if (type === 'payment_intent.succeeded') {
    const existing = await supabase.from('sales').select('id').eq('id', obj.id).single()
    if (!existing.data) {
      await supabase.from('sales').insert({
        id: obj.id,
        customer_id: obj.customer || null,
        customer_email: obj.receipt_email || null,
        amount: obj.amount / 100,
        currency: obj.currency,
        type: 'stripe',
        status: 'paid',
        sale_date: new Date(obj.created * 1000).toISOString()
      })
    }
  }

  // INVOICES (subscriptions)
  if (type === 'invoice.paid') {
    const existing = await supabase.from('sales').select('id').eq('id', obj.id).single()
    if (!existing.data) {
      const lineItem = obj.lines?.data?.[0]
      await supabase.from('sales').insert({
        id: obj.id,
        customer_id: obj.customer || null,
        customer_name: obj.customer_name || null,
        customer_email: obj.customer_email || null,
        product_id: lineItem?.price?.product || null,
        product_name: lineItem?.description || null,
        price_id: lineItem?.price?.id || null,
        amount: obj.amount_paid / 100,
        currency: obj.currency,
        type: 'stripe',
        status: 'paid',
        sale_date: new Date(obj.created * 1000).toISOString()
      })
    }
  }

  if (type === 'invoice.payment_failed') {
    await supabase.from('sales').upsert({
      id: obj.id,
      customer_id: obj.customer || null,
      customer_email: obj.customer_email || null,
      amount: obj.amount_due / 100,
      currency: obj.currency,
      type: 'stripe',
      status: 'failed',
      sale_date: new Date(obj.created * 1000).toISOString()
    })
  }

  // REFUNDS
  if (type === 'charge.refunded') {
    await supabase.from('sales').upsert({
      id: 'refund_' + obj.id,
      customer_id: obj.customer || null,
      amount: -(obj.amount_refunded / 100),
      currency: obj.currency,
      type: 'stripe',
      status: 'refunded',
      sale_date: new Date().toISOString()
    })
  }

  // SUBSCRIPTIONS
  if (type === 'customer.subscription.created' || type === 'customer.subscription.updated') {
    // Handled via invoice.paid - no extra action needed
  }

  if (type === 'customer.subscription.deleted') {
    // Mark any pending sales as cancelled
    await supabase.from('sales').update({ status: 'cancelled' })
      .eq('customer_id', obj.customer)
      .eq('status', 'pending')
  }

  res.status(200).json({ received: true })
}
