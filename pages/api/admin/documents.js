import { createClient } from '@supabase/supabase-js'
import { requireAdminOrAgent } from '../../../lib/requireAdmin'
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
  const isAdmin = user.role === 'admin'

  if (req.method === 'GET') {
    const { file } = req.query
    if (file) {
      const { data, error } = await supabaseAdmin.storage.from('documents').createSignedUrl(file, 300)
      if (error) return res.status(500).json({ error: error.message })
      return res.redirect(data.signedUrl)
    }
    const { data, error } = await supabaseAdmin.storage
      .from('documents')
      .list('', { sortBy: { column: 'created_at', order: 'desc' }, limit: 200 })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ files: data || [] })
  }

  if (req.method === 'POST') {
    if (!isAdmin) return res.status(403).json({ error: 'Solo admin puede subir documentos' })
    const form = formidable({ maxFileSize: 20 * 1024 * 1024 })
    form.parse(req, async (err, fields, files) => {
      if (err) return res.status(500).json({ error: err.message })
      const file = Array.isArray(files.file) ? files.file[0] : files.file
      if (!file) return res.status(400).json({ error: 'Falta el archivo' })
      const buffer = fs.readFileSync(file.filepath)
      const name = `${Date.now()}_${file.originalFilename}`
      const { error } = await supabaseAdmin.storage.from('documents').upload(name, buffer, { contentType: file.mimetype })
      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json({ success: true, name })
    })
    return
  }

  if (req.method === 'DELETE') {
    if (!isAdmin) return res.status(403).json({ error: 'Solo admin puede borrar documentos' })
    const buffers = []
    for await (const chunk of req) buffers.push(chunk)
    const { path } = JSON.parse(Buffer.concat(buffers).toString())
    await supabaseAdmin.storage.from('documents').remove([path])
    return res.status(200).json({ success: true })
  }

  res.status(405).end()
}
