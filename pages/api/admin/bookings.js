import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function sendBookingPush(booking) {
  try {
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return
    webpush.setVapidDetails(
      'mailto:jfuentes@accountingpluscrm.com',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    )
    const { data: subs } = await supabase.from('push_subscriptions').select('*')
    if (!subs?.length) return
    const svcLabel = booking.service ? ` · ${booking.service}` : ''
    const payload = JSON.stringify({
      title: '📅 Nueva reserva',
      body: `${booking.name}${svcLabel} — ${booking.date} ${booking.time}`,
      url: '/admin',
      bookingId: booking.id,
      actions: [
        { action: 'confirm', title: '✓ Confirmar' },
        { action: 'view',    title: '👁 Ver cita'  }
      ]
    })
    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
      } catch (e) {
        if (e.statusCode === 410 || e.statusCode === 404) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        }
      }
    }
  } catch (_) {}
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { name, phone, business, facebook_page, service, date, time, notes } = req.body
    if (!name || !phone || !date || !time) {
      return res.status(400).json({ error: 'Missing required fields' })
    }
    const { data, error } = await supabase
      .from('bookings')
      .insert([{ name, phone, business: business || name, facebook_page, service, date, time, notes, status: 'pending', archived: false }])
      .select()
      .single()
    if (error) return res.status(500).json({ error: error.message })
    sendBookingPush(data) // fire-and-forget, never blocks the response
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
