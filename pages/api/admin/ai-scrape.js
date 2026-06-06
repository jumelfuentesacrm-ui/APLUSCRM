import { requireAdmin } from '../../../lib/requireAdmin'

export default async function handler(req, res) {
  const user = await requireAdmin(req, res)
  if (!user) return

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { url } = req.body
  if (!url) return res.status(400).json({ error: 'URL required' })

  try {
    const isGoogleMaps =
      url.includes('google.com/maps') ||
      url.includes('maps.app.goo.gl') ||
      url.includes('goo.gl/maps')

    if (isGoogleMaps) {
      // Try to extract place name from URL
      const placeMatch = url.match(/place\/([^/@]+)/)
      const placeName = placeMatch ? decodeURIComponent(placeMatch[1].replace(/\+/g, ' ')) : null
      return res.status(200).json({
        type: 'google_maps',
        url,
        business_name: placeName,
        note: 'Google Maps link saved.',
      })
    }

    const isInstagram = url.includes('instagram.com')
    if (isInstagram) {
      return res.status(200).json({
        type: 'instagram',
        url,
        note: 'Instagram profile saved.',
      })
    }

    // Fetch the page HTML
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(8000),
      redirect: 'follow',
    })

    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const html = await response.text()

    function getMeta(property, name) {
      const patterns = [
        new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"'<]+)["']`, 'i'),
        new RegExp(`<meta[^>]+content=["']([^"'<]+)["'][^>]+property=["']${property}["']`, 'i'),
      ]
      for (const p of patterns) {
        const m = html.match(p)
        if (m) return m[1].trim()
      }
      if (name) {
        const namePatterns = [
          new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"'<]+)["']`, 'i'),
          new RegExp(`<meta[^>]+content=["']([^"'<]+)["'][^>]+name=["']${name}["']`, 'i'),
        ]
        for (const p of namePatterns) {
          const m = html.match(p)
          if (m) return m[1].trim()
        }
      }
      return null
    }

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const ogTitle = getMeta('og:title')
    const title = ogTitle || (titleMatch ? titleMatch[1].trim() : null)
    const description = getMeta('og:description') || getMeta('description', 'description')
    const image = getMeta('og:image')
    const siteName = getMeta('og:site_name')

    // Phone extraction
    const phoneRegex = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}/g
    const rawPhones = html.match(phoneRegex) || []
    const phones = [...new Set(rawPhones.map(p => p.replace(/\s+/g, ' ').trim()))].slice(0, 3)

    // Email extraction
    const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g
    const rawEmails = html.match(emailRegex) || []
    const emails = [...new Set(rawEmails)].filter(
      e => !e.includes('example') && !e.includes('domain') && !e.includes('.png') && !e.includes('.jpg')
    ).slice(0, 3)

    // JSON-LD structured data
    let structuredData = null
    let address = null
    let businessName = null
    const jsonLdMatch = html.match(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i
    )
    if (jsonLdMatch) {
      try {
        const ld = JSON.parse(jsonLdMatch[1])
        structuredData = ld
        businessName = ld.name || null
        if (ld.address) {
          const a = ld.address
          address = typeof a === 'string' ? a : [a.streetAddress, a.addressLocality, a.addressRegion].filter(Boolean).join(', ')
        }
        if (!phones.length && ld.telephone) phones.push(ld.telephone)
        if (!emails.length && ld.email) emails.push(ld.email)
      } catch {}
    }

    return res.status(200).json({
      type: 'website',
      url,
      title,
      description: description ? description.substring(0, 200) : null,
      image,
      site_name: siteName,
      business_name: businessName || siteName || title,
      phones,
      emails,
      address,
    })
  } catch (err) {
    return res.status(200).json({ type: 'error', url, error: err.message })
  }
}
