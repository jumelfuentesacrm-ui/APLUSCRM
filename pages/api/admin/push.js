import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '../../../lib/requireAdmin'
import webpush from 'web-push'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

webpush.setVapidDetails(
  'mailto:jfuentes@accountingpluscrm.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

export default async function handler(req, res) {
  const user = await requireAdmin(req, res)
  if (!user) return

  if (req.method === 'POST' && req.query.action === 'subscribe') {
    const { endpoint, keys } = req.body
    if (!endpoint || !keys) return res.status(400).json({ error: 'Invalid subscription' })
    await supabaseAdmin.from('push_subscriptions').upsert({
      endpoint, p256dh: keys.p256dh, auth: keys.auth
    }, { onConflict: 'endpoint' })
    return res.status(200).json({ success: true })
  }

  if (req.method === 'POST' && req.query.action === 'send') {
    const { title, body, url, bookingId, actions } = req.body
    const { data: subs } = await supabaseAdmin.from('push_subscriptions').select('*')
    if (!subs?.length) return res.status(200).json({ sent: 0 })

    const payload = JSON.stringify({
      title,
      body,
      url: url || '/admin',
      bookingId: bookingId || null,
      actions: actions || [
        { action: 'confirm', title: '✓ Confirmar' },
        { action: 'view',    title: '👁 Ver cita'  }
      ]
    })

    let sent = 0
    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
        sent++
      } catch (e) {
        if (e.statusCode === 410 || e.statusCode === 404) {
          await supabaseAdmin.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        }
      }
    }
    return res.status(200).json({ sent })
  }

  if (req.method === 'DELETE') {
    const { endpoint } = req.body
    await supabaseAdmin.from('push_subscriptions').delete().eq('endpoint', endpoint)
    return res.status(200).json({ success: true })
  }

  res.status(405).end()
}
