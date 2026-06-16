import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { email, password, full_name, business_name, phone, role } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' })
  if (password.length < 6) return res.status(400).json({ error: 'La contraseña debe tener mínimo 6 caracteres' })

  const allowedRoles = ['client', 'agent', 'admin']
  const assignedRole = allowedRoles.includes(role) ? role : 'client'

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name }
  })
  if (error) return res.status(400).json({ error: error.message })

  // Use upsert so it works whether the trigger has created the row yet or not
  await supabaseAdmin.from('profiles').upsert({
    id: data.user.id,
    full_name: full_name || email,
    business_name: business_name || full_name || email,
    phone,
    role: assignedRole
  }, { onConflict: 'id' })

  return res.status(200).json({ success: true, id: data.user.id })
}
