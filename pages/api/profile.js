import { createClient } from '@supabase/supabase-js'
import { requireAdminOrAgent } from '../../lib/requireAdmin'
import formidable from 'formidable'
import fs from 'fs'

export const config = { api: { bodyParser: false } }

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  const user = await requireAdminOrAgent(req, res)
  if (!user) return

  // GET — fetch own profile + avatar URL
  if (req.method === 'GET') {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name, business_name, phone, avatar_url')
      .eq('id', user.id)
      .single()
    const { data: auth } = await supabaseAdmin.auth.admin.getUserById(user.id)
    return res.status(200).json({
      full_name: profile?.full_name || '',
      business_name: profile?.business_name || '',
      phone: profile?.phone || '',
      avatar_url: profile?.avatar_url || null,
      email: auth?.user?.email || '',
    })
  }

  // PATCH — update email / password / name
  if (req.method === 'PATCH') {
    const buffers = []
    for await (const chunk of req) buffers.push(chunk)
    const body = JSON.parse(Buffer.concat(buffers).toString())
    const { email, password, full_name, phone } = body

    const profileUpdate = {}
    if (full_name !== undefined) profileUpdate.full_name = full_name
    if (phone !== undefined) profileUpdate.phone = phone
    if (Object.keys(profileUpdate).length > 0) {
      await supabaseAdmin.from('profiles').update(profileUpdate).eq('id', user.id)
    }
    if (email) await supabaseAdmin.auth.admin.updateUserById(user.id, { email })
    if (password && password.length >= 6) {
      await supabaseAdmin.auth.admin.updateUserById(user.id, { password })
    }
    return res.status(200).json({ success: true })
  }

  // POST — upload avatar photo
  if (req.method === 'POST') {
    const form = formidable({ maxFileSize: 5 * 1024 * 1024 })
    form.parse(req, async (err, _fields, files) => {
      if (err) return res.status(500).json({ error: err.message })
      const file = Array.isArray(files.file) ? files.file[0] : files.file
      if (!file) return res.status(400).json({ error: 'Falta el archivo' })
      const buffer = fs.readFileSync(file.filepath)
      const ext = file.originalFilename?.split('.').pop() || 'jpg'
      const path = `avatars/${user.id}.${ext}`
      // upsert — overwrite existing avatar
      await supabaseAdmin.storage.from('avatars').remove([path])
      const { error } = await supabaseAdmin.storage.from('avatars').upload(path, buffer, { contentType: file.mimetype })
      if (error) return res.status(500).json({ error: error.message })
      const { data: urlData } = supabaseAdmin.storage.from('avatars').getPublicUrl(path)
      const avatar_url = urlData.publicUrl + '?t=' + Date.now()
      await supabaseAdmin.from('profiles').update({ avatar_url }).eq('id', user.id)
      return res.status(200).json({ avatar_url })
    })
    return
  }

  res.status(405).end()
}
