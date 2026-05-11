import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data: users, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, business_name, phone, role')
      .eq('role', 'client')
      .order('created_at', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ users })
  }

  if (req.method === 'POST') {
    const { email, password, full_name, business_name, phone } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email y password requeridos' })
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { full_name }
    })
    if (authError) return res.status(400).json({ error: authError.message })
    await supabaseAdmin.from('profiles').update({ full_name, business_name, phone, role: 'client' }).eq('id', authData.user.id)
    return res.status(200).json({ success: true, user: authData.user })
  }

  if (req.method === 'PATCH') {
    const { id, full_name, business_name, phone, email, password } = req.body
    
    // Update profile
    await supabaseAdmin.from('profiles').update({ full_name, business_name, phone }).eq('id', id)
    
    // Update email if provided
    if (email) {
      await supabaseAdmin.auth.admin.updateUserById(id, { email })
    }
    
    // Update password if provided
    if (password && password.length >= 6) {
      await supabaseAdmin.auth.admin.updateUserById(id, { password })
    }

    return res.status(200).json({ success: true })
  }

  res.status(405).end()
}
