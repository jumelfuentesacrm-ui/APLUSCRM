import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '../../../lib/requireAdmin'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  const user = await requireAdmin(req, res)
  if (!user) return

  if (req.method === 'GET') {
    const { data: leads, error } = await supabaseAdmin
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })

    // Sync status from cold_calls by phone number
    const phones = (leads || []).map(l => l.phone).filter(Boolean)
    let callMap = {}
    if (phones.length) {
      const { data: calls } = await supabaseAdmin
        .from('cold_calls')
        .select('phone, call_status, followup_date')
        .in('phone', phones)
        .order('created_at', { ascending: false })
      ;(calls || []).forEach(c => {
        if (!callMap[c.phone]) callMap[c.phone] = c
      })
    }

    const merged = (leads || []).map(l => {
      const call = l.phone ? callMap[l.phone] : null
      if (!call) return l
      // Map cold_calls statuses to leads statuses
      const statusMap = {
        booked: 'scheduled',
        follow_up: 'followup',
        enviar_cita: 'scheduled',
        caliente: 'followup',
        tibio: 'followup',
        frio: 'noint',
        no_answer: 'none',
        responded: 'followup',
        llamar_luego: 'followup',
      }
      const mappedStatus = statusMap[call.call_status] || l.status
      return { ...l, status: mappedStatus, followup_date: call.followup_date || l.followup_date }
    })

    return res.status(200).json({ leads: merged })
  }

  if (req.method === 'POST') {
    const { leads: batch } = req.body
    if (Array.isArray(batch)) {
      // Bulk import from CSV
      const rows = batch.map(r => ({
        name: r.name || '',
        phone: r.phone || null,
        town: r.town || null,
        category: r.category || null,
        website: r.website === 'true' || r.website === true,
        stars: parseFloat(r.stars) || null,
        reviews: parseInt(r.reviews) || null,
        lat: parseFloat(r.lat) || null,
        lng: parseFloat(r.lng) || null,
        maps_url: r.maps_url || null,
        status: 'none',
        agent_id: user.id,
      }))
      const { data, error } = await supabaseAdmin.from('leads').insert(rows).select()
      if (error) return res.status(500).json({ error: error.message })
      return res.status(201).json({ leads: data })
    }
    // Single insert
    const { data, error } = await supabaseAdmin.from('leads').insert(req.body).select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json({ lead: data })
  }

  if (req.method === 'PATCH') {
    const { id, ...updates } = req.body
    const { data, error } = await supabaseAdmin.from('leads').update(updates).eq('id', id).select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ lead: data })
  }

  if (req.method === 'DELETE') {
    const { id } = req.body
    const { error } = await supabaseAdmin.from('leads').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  return res.status(405).end()
}
