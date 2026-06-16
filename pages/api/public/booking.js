import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
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
  if (req.method !== 'POST') return res.status(405).end()

  const { name, phone, business, date, time, agent_id } = req.body
  if (!name || !phone || !date || !time) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  // If agent_id provided, verify it belongs to a real agent (prevent spoofing)
  let verifiedAgentId = null
  if (agent_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', agent_id)
      .eq('role', 'agent')
      .single()
    if (profile) verifiedAgentId = profile.id
  }

  const { data, error } = await supabase
    .from('bookings')
    .insert([{
      name,
      phone,
      business: business || name,
      date,
      time,
      status: 'pending',
      archived: false,
      source: verifiedAgentId ? 'agent' : 'website',
      agent_id: verifiedAgentId,
    }])
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  sendBookingPush(data)
  return res.status(201).json(data)
}
