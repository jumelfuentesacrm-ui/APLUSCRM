import { families, products, generated } from '../lib/plantillas-data'
import { SITE, T } from '../lib/tienda'

export default function Sitemap() { return null }
export function getServerSideProps({ res }) {
  const pair = (es, en) => [[es, en, 'es'], [en, es, 'en']]
  const rows = [...pair(T.es.hub, T.en.hub), ...families.flatMap((f) => pair(T.es.cat(f.slug.es), T.en.cat(f.slug.en))), ...products.flatMap((p) => pair(T.es.prod(p.slug.es), T.en.prod(p.slug.en)))]
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${rows.map(([loc, alt, lang]) =>
    `<url><loc>${SITE}${loc}</loc><lastmod>${generated}</lastmod><xhtml:link rel="alternate" hreflang="${lang}" href="${SITE}${loc}"/><xhtml:link rel="alternate" hreflang="${lang === 'es' ? 'en' : 'es'}" href="${SITE}${alt}"/></url>`).join('\n')}\n</urlset>\n`
  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.setHeader('Cache-Control', 'public, s-maxage=86400')
  res.write(xml); res.end()
  return { props: {} }
}
