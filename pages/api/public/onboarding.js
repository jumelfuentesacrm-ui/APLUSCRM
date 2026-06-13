import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

function normalizePhone(raw = '') {
  return (raw || '').replace(/\D/g, '').slice(-10)
}

async function sendOnboardingPush(name, businessName, extra) {
  try {
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return
    webpush.setVapidDetails(
      'mailto:jfuentes@accountingpluscrm.com',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    )
    const { data: subs } = await supabase.from('push_subscriptions').select('*')
    if (!subs?.length) return
    const body = extra
      ? `${name} · ${businessName || 'nuevo cliente'} — "${extra.slice(0, 80)}"`
      : `${name} · ${businessName || 'nuevo cliente'} llenó el formulario`
    const payload = JSON.stringify({
      title: '🎉 Nuevo cliente onboarding',
      body,
      url: '/admin',
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

  const { name, phone, business_name, business_type, colors, services, instagram, facebook, extra } = req.body
  if (!name || !phone) return res.status(400).json({ error: 'Nombre y teléfono son requeridos' })

  const phoneDigits = normalizePhone(phone)

  // Try to find a matching booking by phone (and optionally name)
  let matchedBooking = null
  if (phoneDigits) {
    const { data: bookings } = await supabase
      .from('bookings')
      .select('*')
      .ilike('phone', `%${phoneDigits}%`)
      .order('created_at', { ascending: false })
      .limit(1)
    if (bookings?.length) matchedBooking = bookings[0]
  }

  // Build onboarding payload
  const onboardingData = {
    business_name,
    business_type,
    colors: colors || {},
    services: services || [],
    instagram: instagram || null,
    facebook: facebook || null,
    extra: extra || null,
    submitted_at: new Date().toISOString(),
  }

  // Upsert into crm_clients
  const { error: crmError } = await supabase.from('crm_clients').upsert({
    name,
    phone,
    business: business_name || name,
    notes: JSON.stringify(onboardingData),
  }, { onConflict: 'phone', ignoreDuplicates: false })

  // If booking found, append onboarding note to booking notes
  if (matchedBooking) {
    const existingNotes = matchedBooking.notes || ''
    const noteAppend = `\n\n[Onboarding ${new Date().toLocaleDateString('es-PR')}]\nNegocio: ${business_name || '—'} · Tipo: ${business_type || '—'}\nColores: Primario ${colors?.primary || '—'}, Acento ${colors?.accent || '—'}\nIG: ${instagram || '—'} · FB: ${facebook || '—'}\nServicios: ${(services || []).map(s => `${s.name} (${s.duration}min · $${s.price})`).join(', ')}${extra ? `\nNota: ${extra}` : ''}`
    await supabase.from('bookings').update({ notes: existingNotes + noteAppend }).eq('id', matchedBooking.id)
  }

  sendOnboardingPush(name, business_name, extra) // fire-and-forget

  return res.status(200).json({
    ok: true,
    booking: matchedBooking || null,
  })
}
