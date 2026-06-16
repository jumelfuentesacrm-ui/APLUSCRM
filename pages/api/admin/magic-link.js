import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '../../../lib/requireAdmin'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const user = await requireAdmin(req, res)
  if (!user) return

  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'Email requerido' })

  const origin = req.headers.origin || `https://${req.headers.host}`

  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: `${origin}/admin` }
  })

  if (error) return res.status(400).json({ error: error.message })
  return res.status(200).json({ link: data.properties?.action_link })
}
