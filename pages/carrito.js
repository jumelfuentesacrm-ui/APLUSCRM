import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { Shell } from '../components/Tienda'
import { T, cart, money, track } from '../lib/tienda'
import { products } from '../lib/plantillas-data'

export function getStaticProps() {
  return { props: { catalog: Object.fromEntries(products.map((p) => [p.id, { price: p.price, title: p.title, slug: p.slug, cover: { es: p.img.es.cover, en: p.img.en.cover } }])) } }
}
export const useLang = () => (useRouter().query.l === 'en' ? 'en' : 'es')
export const useItems = (catalog) => {
  const [ids, setIds] = useState(null)
  useEffect(() => { const f = () => setIds(cart.ids().filter((id) => catalog[id])); f(); window.addEventListener('ap-cart', f); return () => window.removeEventListener('ap-cart', f) }, [catalog])
  return ids
}

export default function Carrito({ catalog }) {
  const lang = useLang(), t = T[lang], ids = useItems(catalog), q = lang === 'en' ? '?l=en' : ''
  const total = (ids || []).reduce((a, id) => a + catalog[id].price, 0)
  useEffect(() => { if (ids && ids.length) track('ver_carrito', { valor: total, idioma: lang }) }, [ids === null])
  const remove = (id) => { cart.remove(id); track('quitar_carrito', { producto: id, idioma: lang }) }
  return (
    <Shell lang={lang} title={`${t.cartTitle} | ${t.brand}`} description={t.cartTitle} path="/carrito" noindex>
      <h1 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 40, fontWeight: 600, margin: '0 0 20px' }}>{t.cartTitle}</h1>
      {ids === null ? null : ids.length === 0 ? (
        <p>{t.empty} <Link href={t.hub} style={{ color: '#b8975a', fontWeight: 600 }}>{t.keep}</Link></p>
      ) : (
        <div style={{ maxWidth: 640 }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {ids.map((id) => (
              <li key={id} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '14px 0', borderBottom: '1px solid rgba(184,151,90,0.25)' }}>
                <img src={catalog[id].cover[lang]} alt="" width="64" height="64" style={{ borderRadius: 8, flex: 'none' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link href={t.prod(catalog[id].slug[lang])} style={{ fontWeight: 600, color: 'inherit', textDecoration: 'none' }}>{catalog[id].title[lang]}</Link>
                  <div><button type="button" onClick={() => remove(id)} style={{ background: 'none', border: 0, padding: 0, color: '#6b6b67', fontSize: 13, textDecoration: 'underline', cursor: 'pointer' }}>{t.remove}</button></div>
                </div>
                <strong>{money(catalog[id].price)}</strong>
              </li>
            ))}
          </ul>
          <p style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, fontWeight: 700, margin: '18px 0 4px' }}><span>{t.total}</span><span>{money(total)}</span></p>
          <p style={{ color: '#6b6b67', fontSize: 13 }}>{t.tax}</p>
          <p style={{ marginTop: 20, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
            <Link href={`/reservar${q}`} style={{ background: '#0e0e0c', color: '#f8f6f1', padding: '14px 26px', borderRadius: 999, fontWeight: 600, textDecoration: 'none' }}>{t.toReserve}</Link>
            <Link href={t.hub} style={{ color: '#6b6b67' }}>{t.keep}</Link>
          </p>
        </div>
      )}
    </Shell>
  )
}
