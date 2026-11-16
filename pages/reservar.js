import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Shell } from '../components/Tienda'
import { T, cart, money, reserve, track } from '../lib/tienda'
import { useItems, useLang } from './carrito'
export { getStaticProps } from './carrito'

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/
export default function Reservar({ catalog }) {
  const lang = useLang(), t = T[lang], ids = useItems(catalog)
  const [email, setEmail] = useState(''), [ok, setOk] = useState(false), [state, setState] = useState('idle'), [msg, setMsg] = useState('')
  const total = (ids || []).reduce((a, id) => a + catalog[id].price, 0)
  useEffect(() => { if (ids && ids.length) track('iniciar_reserva', { valor: total, idioma: lang }) }, [ids === null])
  async function submit(e) {
    e.preventDefault()
    const mail = email.trim().toLowerCase()
    if (!EMAIL.test(mail) || !ok) { setMsg(t.badEmail); return }
    setState('sending'); setMsg('')
    let saved = false
    try { saved = await reserve({ email: mail, productos: ids, total, idioma: lang }) } catch { saved = false }
    if (saved) { cart.clear(); setState('done') } else { setState('idle'); setMsg(t.fail) }
  }
  const h1 = { fontFamily: '"Cormorant Garamond", serif', fontSize: 40, fontWeight: 600, margin: '0 0 14px', lineHeight: 1.1 }
  return (
    <Shell lang={lang} title={`${t.resTitle} | ${t.brand}`} description={t.resTitle} path="/reservar" noindex>
      {state === 'done' ? (
        <div style={{ maxWidth: 560 }}><h1 style={h1}>{t.done}</h1><p>{t.doneLead}</p><p style={{ marginTop: 18 }}><Link href={t.hub} style={{ color: '#b8975a', fontWeight: 600 }}>{t.keep}</Link></p></div>
      ) : ids === null ? null : ids.length === 0 ? (
        <p>{t.empty} <Link href={t.hub} style={{ color: '#b8975a', fontWeight: 600 }}>{t.keep}</Link></p>
      ) : (
        <div style={{ maxWidth: 560 }}>
          <h1 style={h1}>{t.resTitle}</h1>
          <p style={{ fontSize: 16 }}>{t.resLead}</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '20px 0' }}>
            {ids.map((id) => <li key={id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: '1px solid rgba(184,151,90,0.25)' }}><span>{catalog[id].title[lang]}</span><span>{money(catalog[id].price)}</span></li>)}
            <li style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontWeight: 700 }}><span>{t.total}</span><span>{money(total)}</span></li>
          </ul>
          <form onSubmit={submit} noValidate>
            <label htmlFor="res-email" style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>{t.email}</label>
            <input id="res-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '13px 14px', border: '1px solid #bdb9ad', borderRadius: 10, fontSize: 16, background: '#fff' }} />
            <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', margin: '14px 0', fontSize: 14 }}>
              <input id="res-consent" type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} style={{ marginTop: 3 }} />
              <span>{t.consent} <Link href="/privacy" style={{ color: '#b8975a' }}>{t.privacy}</Link></span>
            </label>
            {msg && <p role="alert" style={{ color: '#a8281c', marginBottom: 12 }}>{msg}</p>}
            <button type="submit" disabled={state === 'sending'} style={{ background: '#0e0e0c', color: '#f8f6f1', padding: '14px 26px', borderRadius: 999, fontWeight: 600, fontSize: 15, border: 0, cursor: 'pointer', opacity: state === 'sending' ? 0.6 : 1 }}>{state === 'sending' ? '…' : t.submit}</button>
          </form>
        </div>
      )}
    </Shell>
  )
}
