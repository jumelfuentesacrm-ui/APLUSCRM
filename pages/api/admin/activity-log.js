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
    const { data, error } = await supabaseAdmin
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ log: data || [] })
  }

  if (req.method === 'POST') {
    const { action, target, type, metadata } = req.body
    if (!action) return res.status(400).json({ error: 'action required' })

    // Get admin name from the verified session
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name, business_name')
      .eq('id', user.id)
      .single()

    const { error } = await supabaseAdmin.from('activity_log').insert({
      user_name: profile?.full_name || profile?.business_name || 'Admin',
      action,
      target: target || null,
      type: type || 'edit',
      metadata: metadata || null,
    })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  res.status(405).end()
}
