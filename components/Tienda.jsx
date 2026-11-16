import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { SITE, T, cart, money, track } from '../lib/tienda'

const GOLD = '#b8975a', INK = '#0e0e0c', GRAY = '#6b6b67', LINE = 'rgba(184,151,90,0.25)'
const serif = { fontFamily: '"Cormorant Garamond", ui-serif, Georgia, serif' }
const btn = { display: 'inline-block', background: INK, color: '#f8f6f1', padding: '14px 26px', borderRadius: 999, fontWeight: 600, fontSize: 15, border: 0, cursor: 'pointer', textDecoration: 'none' }
const clip = (s, n) => (s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…')

export function useCartCount() {
  const [n, setN] = useState(0)
  useEffect(() => { const f = () => setN(cart.ids().length); f(); window.addEventListener('ap-cart', f); window.addEventListener('storage', f); return () => { window.removeEventListener('ap-cart', f); window.removeEventListener('storage', f) } }, [])
  return n
}

export function Shell({ lang, title, description, path, altPath, jsonld = [], noindex, image, children }) {
  const t = T[lang], n = useCartCount(), other = lang === 'es' ? 'en' : 'es'
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        {noindex ? <meta name="robots" content="noindex" /> : <link rel="canonical" href={SITE + path} />}
        {!noindex && altPath && <link rel="alternate" hrefLang={lang} href={SITE + path} />}
        {!noindex && altPath && <link rel="alternate" hrefLang={other} href={SITE + altPath} />}
        {!noindex && altPath && <link rel="alternate" hrefLang="x-default" href={SITE + (lang === 'es' ? path : altPath)} />}
        <meta property="og:title" content={title} /><meta property="og:description" content={description} /><meta property="og:type" content="website" /><meta property="og:url" content={SITE + path} />
        {image && <meta property="og:image" content={SITE + image} />}
        {jsonld.map((j, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(j).replace(/</g, '\\u003c') }} />)}
      </Head>
      <div lang={lang} style={{ minHeight: '100vh', background: 'oklch(0.985 0.008 85)', color: 'oklch(0.18 0.012 60)' }}>
        <header style={{ borderBottom: `1px solid ${LINE}` }}>
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-4">
            <Link href={t.hub} style={{ display: 'flex', alignItems: 'baseline', gap: 8, textDecoration: 'none', color: INK }}>
              <span style={{ ...serif, fontSize: 24, fontWeight: 600 }}>A+</span>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: GRAY }}>{lang === 'es' ? 'Plantillas' : 'Templates'}</span>
            </Link>
            <nav className="flex items-center gap-5" style={{ fontSize: 14 }}>
              {altPath && <Link href={altPath} hrefLang={other} style={{ color: GRAY, textDecoration: 'none' }}>{t.other}</Link>}
              <Link href={`/carrito${lang === 'en' ? '?l=en' : ''}`} style={{ color: INK, fontWeight: 600, textDecoration: 'none' }}>{t.cartLabel}{n > 0 ? ` (${n})` : ''}</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-5 pb-20 pt-8">{children}</main>
        <footer style={{ borderTop: `1px solid ${LINE}`, color: GRAY, fontSize: 13 }}>
          <div className="mx-auto max-w-5xl px-5 py-8">
            <p style={{ maxWidth: '70ch' }}>{t.foot} <Link href="/privacy" style={{ color: GOLD }}>{t.privacy}</Link></p>
            <p style={{ marginTop: 8 }}><Link href="/" style={{ color: GRAY }}>{t.by}</Link></p>
          </div>
        </footer>
      </div>
    </>
  )
}

const Crumbs = ({ items }) => (
  <nav aria-label="breadcrumb" style={{ fontSize: 13, color: GRAY, marginBottom: 18 }}>
    {items.map(([label, href], i) => <span key={i}>{i > 0 && ' / '}{href ? <Link href={href} style={{ color: GRAY }}>{label}</Link> : <span>{label}</span>}</span>)}
  </nav>
)
const crumbLd = (items) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.filter((i) => i[1]).map(([name, href], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE + href })) })
const H2 = ({ children }) => <h2 style={{ ...serif, fontSize: 28, fontWeight: 600, color: INK, margin: '40px 0 12px', lineHeight: 1.15 }}>{children}</h2>

function Grid({ lang, items }) {
  const t = T[lang]
  return (
    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {items.map((p) => (
        <li key={p.id} style={{ border: `1px solid ${LINE}`, borderRadius: 16, overflow: 'hidden', background: '#fff' }}>
          <Link href={t.prod(p.slug)} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
            <img src={p.cover} alt={p.title} width="640" height="640" loading="lazy" style={{ width: '100%', height: 'auto', display: 'block' }} />
            <div style={{ padding: '14px 16px 18px' }}>
              <h3 style={{ ...serif, fontSize: 21, fontWeight: 600, color: INK, lineHeight: 1.15, margin: 0 }}>{p.title}</h3>
              <p style={{ fontSize: 13, color: GRAY, margin: '6px 0 10px' }}>{p.who}</p>
              <p style={{ fontWeight: 700, margin: 0 }}>{money(p.price)}</p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}

export function Hub({ lang, families }) {
  const t = T[lang], other = lang === 'es' ? 'en' : 'es'
  const ld = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: t.hubTitle, url: SITE + t.hub, inLanguage: lang }
  return (
    <Shell lang={lang} title={clip(`${t.hubTitle} | A+`, 62)} description={t.hubMeta} path={t.hub} altPath={T[other].hub} jsonld={[ld]}>
      <h1 style={{ ...serif, fontSize: 'clamp(34px, 6vw, 52px)', fontWeight: 600, color: INK, lineHeight: 1.05, maxWidth: '18ch', margin: 0 }}>{t.hubTitle}</h1>
      <p style={{ fontSize: 17, color: GRAY, maxWidth: '62ch', marginTop: 16 }}>{t.hubIntro}</p>
      {families.map((f) => (
        <section key={f.id}>
          <H2><Link href={t.cat(f.slug)} style={{ color: INK, textDecoration: 'none' }}>{f.name}</Link></H2>
          <p style={{ color: GRAY, maxWidth: '70ch', marginBottom: 18 }}>{f.summary}</p>
          <Grid lang={lang} items={f.items} />
        </section>
      ))}
    </Shell>
  )
}

export function Category({ lang, family, altSlug }) {
  const t = T[lang], other = lang === 'es' ? 'en' : 'es', path = t.cat(family.slug)
  const crumbs = [[t.all, t.hub], [family.name]]
  const ld = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: family.name, description: family.summary, url: SITE + path, inLanguage: lang }
  return (
    <Shell lang={lang} title={clip(`${family.name} | ${t.brand}`, 62)} description={clip(family.summary, 155)} path={path} altPath={T[other].cat(altSlug)} jsonld={[ld, crumbLd([[t.all, t.hub], [family.name, path]])]}>
      <Crumbs items={crumbs} />
      <h1 style={{ ...serif, fontSize: 'clamp(32px, 5vw, 46px)', fontWeight: 600, color: INK, lineHeight: 1.08, margin: 0 }}>{family.name}</h1>
      <p style={{ fontSize: 17, color: GRAY, maxWidth: '62ch', margin: '14px 0 28px' }}>{family.summary}</p>
      <Grid lang={lang} items={family.items} />
    </Shell>
  )
}

export function Product({ lang, p, family, related, altSlug }) {
  const t = T[lang], other = lang === 'es' ? 'en' : 'es', path = t.prod(p.slug)
  const [inCart, setInCart] = useState(false)
  useEffect(() => { setInCart(cart.has(p.id)); track('ver_producto', { producto: p.id, valor: p.price, idioma: lang }) }, [p.id, lang])
  const add = () => { cart.add(p.id); setInCart(true); track('agregar_carrito', { producto: p.id, valor: p.price, idioma: lang }) }
  const desc = clip(`${p.who}. ${family.summary}`, 155), full = `${p.title} | ${t.brand}`
  const ld = [
    { '@context': 'https://schema.org', '@type': 'Product', name: p.title, description: desc, image: SITE + p.cover, category: family.name, brand: { '@type': 'Brand', name: t.brand }, inLanguage: lang,
      offers: { '@type': 'Offer', price: (p.price / 100).toFixed(2), priceCurrency: 'USD', availability: 'https://schema.org/PreOrder', url: SITE + path } },
    crumbLd([[t.all, t.hub], [family.name, t.cat(family.slug)], [p.title, path]]),
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: t.q.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
  ]
  return (
    <Shell lang={lang} title={full.length <= 62 ? full : clip(p.title, 62)} description={desc} path={path} altPath={T[other].prod(altSlug)} jsonld={ld} image={p.cover}>
      <Crumbs items={[[t.all, t.hub], [family.name, t.cat(family.slug)], [p.title]]} />
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <img src={p.cover} alt={p.title} width="640" height="640" style={{ width: '100%', height: 'auto', borderRadius: 16, border: `1px solid ${LINE}` }} />
        <div>
          <h1 style={{ ...serif, fontSize: 'clamp(30px, 5vw, 44px)', fontWeight: 600, color: INK, lineHeight: 1.08, margin: 0 }}>{p.title}</h1>
          <p style={{ fontSize: 17, color: GRAY, marginTop: 12 }}>{t.made} {p.who.charAt(0).toLowerCase() + p.who.slice(1)}. {family.summary}</p>
          <p style={{ fontSize: 28, fontWeight: 700, margin: '20px 0 14px' }}>{money(p.price)}</p>
          {inCart
            ? <Link href={`/carrito${lang === 'en' ? '?l=en' : ''}`} style={{ ...btn, background: GOLD, color: INK }}>{t.inCart}</Link>
            : <button type="button" onClick={add} style={btn}>{t.add}</button>}
          <p style={{ fontSize: 13, color: GRAY, marginTop: 12, maxWidth: '44ch' }}>{t.soon}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-x-10 md:grid-cols-2">
        {p.lists.map((l) => (
          <section key={l.label}><H2>{l.label}</H2><ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>{l.items.map((i) => <li key={i} style={{ listStyle: 'disc' }}>{i}</li>)}</ul></section>
        ))}
      </div>
      <H2>{t.first}</H2>
      {p.tips.map((x) => <p key={x} style={{ maxWidth: '68ch', marginBottom: 10 }}>{x}</p>)}
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <section>
          <H2>{t.inside}</H2>
          <ul style={{ paddingLeft: 20, lineHeight: 1.7 }}>
            {p.lists.map((l) => <li key={l.label} style={{ listStyle: 'disc' }}><strong>{l.label}.</strong></li>)}
            {p.contents.map((c) => <li key={c.t} style={{ listStyle: 'disc' }}><strong>{c.t}.</strong> {c.i}</li>)}
          </ul>
          <p style={{ color: GRAY, fontSize: 14, marginTop: 10 }}>PDF · {p.pages} {t.pages}</p>
        </section>
        <section>
          <H2>{t.sample}</H2>
          <img src={p.preview} alt={`${t.sample}: ${p.title}`} width="496" height="702" loading="lazy" style={{ width: '100%', maxWidth: 380, height: 'auto', border: `1px solid ${LINE}`, borderRadius: 8, background: '#fff' }} />
        </section>
      </div>
      <H2>{t.faq}</H2>
      {t.q.map(([q, a]) => <div key={q} style={{ maxWidth: '68ch', marginBottom: 14 }}><h3 style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>{q}</h3><p style={{ margin: '4px 0 0' }}>{a}</p></div>)}
      {related.length > 0 && <><H2>{t.related}</H2><Grid lang={lang} items={related} /></>}
    </Shell>
  )
}
