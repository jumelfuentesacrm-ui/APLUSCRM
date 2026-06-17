import Head from 'next/head'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { formatPhone } from '../lib/config'
import { ArrowRight, Check } from 'lucide-react'

const ff = 'Inter, ui-sans-serif, system-ui, sans-serif'
const ffS = 'Cormorant Garamond, serif'
const gold = '#b8975a'
const ink = '#0e0e0c'
const cream = '#f8f6f1'

function makeICS(date, time, name) {
  const [y, m, d] = date.split('-').map(Number)
  const [t, ampm] = time.split(' ')
  let [h, min] = t.split(':').map(Number)
  if (ampm === 'PM' && h !== 12) h += 12
  if (ampm === 'AM' && h === 12) h = 0
  const pad = n => String(n).padStart(2, '0')
  const dt = `${y}${pad(m)}${pad(d)}T${pad(h)}${pad(min)}00`
  const end = `${y}${pad(m)}${pad(d)}T${pad(h + 1)}${pad(min)}00`
  return `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nDTSTART:${dt}\nDTEND:${end}\nSUMMARY:Reunión A+ CRM - ${name}\nEND:VEVENT\nEND:VCALENDAR`
}

function AddToCalBtn({ date, time, name }) {
  function download() {
    const ics = makeICS(date, time, name)
    const blob = new Blob([ics], { type: 'text/calendar' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'reunion-aplus.ics'; a.click()
  }
  return (
    <button onClick={download} style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: `1.5px solid ${gold}`, borderRadius: 99, padding: '8px 16px', fontSize: 12, fontWeight: 600, color: gold, cursor: 'pointer', fontFamily: ff }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      Añadir al calendario
    </button>
  )
}

export default function BookingPage() {
  const router = useRouter()
  const [step, setStep] = useState('form')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [business, setBusiness] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [confirmed, setConfirmed] = useState({ date: '', time: '', name: '' })
  const [agentId, setAgentId] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const a = params.get('agent')
    if (a) setAgentId(a)
  }, [])

  const [calMonth, setCalMonth] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() } })

  const calDays = useMemo(() => {
    const { y, m } = calMonth
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const first = new Date(y, m, 1)
    const last = new Date(y, m + 1, 0)
    const cells = []
    for (let i = 0; i < first.getDay(); i++) cells.push(null)
    for (let d = 1; d <= last.getDate(); d++) {
      const dt = new Date(y, m, d)
      const iso = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      cells.push({ d, iso, past: dt <= today })
    }
    return cells
  }, [calMonth])

  const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  const slots = ['9:00 AM', '10:30 AM', '12:00 PM', '2:00 PM', '3:30 PM', '5:00 PM']

  async function handleSubmit(e) {
    e.preventDefault(); setLoading(true); setError(null)
    try {
      const res = await fetch('/api/public/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, business, date, time, ...(agentId ? { agent_id: agentId } : {}) })
      })
      if (!res.ok) throw new Error()
      setConfirmed({ date, time, name })
      setStep('done')
    } catch { setError('Hubo un error. Inténtalo de nuevo.') }
    finally { setLoading(false) }
  }

  return (
    <>
      <Head>
        <title>Agendar reunión — A+ CRM</title>
        <meta name="description" content="Agenda tu reunión con A+ CRM" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <div style={{ minHeight: '100dvh', background: cream, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px 48px', fontFamily: ff, position: 'relative', overflow: 'hidden' }}>
        {/* ambient glow */}
        <div style={{ position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 320, height: 320, borderRadius: '50%', background: `${gold}22`, filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0 }} />

        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 480 }}>
          {/* logo / brand */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: gold, marginBottom: 8 }}>A+ CRM</p>
            {step === 'form' && (
              <>
                <h1 style={{ fontFamily: ffS, fontSize: 'clamp(26px,7vw,42px)', fontWeight: 300, lineHeight: 1.1, color: ink, margin: 0 }}>
                  ¿En qué momento podemos <em style={{ color: gold }}>reunirnos con usted?</em>
                </h1>
              </>
            )}
          </div>

          {step === 'form' ? (
            <form style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)', border: '1px solid rgba(255,255,255,0.6)', boxShadow: '0 4px 32px rgba(0,0,0,0.08)', borderRadius: 28, padding: '24px 20px', boxSizing: 'border-box' }} onSubmit={handleSubmit}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b6b67', marginBottom: 10 }}>Elige un día</p>
              <div style={{ background: 'rgba(248,246,241,0.6)', borderRadius: 18, padding: '12px 8px', border: '1.5px solid rgba(14,14,12,0.08)', marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingInline: 4 }}>
                  <button type="button" onClick={() => setCalMonth(p => { const d = new Date(p.y, p.m - 1); return { y: d.getFullYear(), m: d.getMonth() } })}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#6b6b67', padding: '0 4px' }}>‹</button>
                  <span style={{ fontSize: 13, fontWeight: 700, color: ink }}>{MESES[calMonth.m]} {calMonth.y}</span>
                  <button type="button" onClick={() => setCalMonth(p => { const d = new Date(p.y, p.m + 1); return { y: d.getFullYear(), m: d.getMonth() } })}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#6b6b67', padding: '0 4px' }}>›</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 4 }}>
                  {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => (
                    <div key={i} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#6b6b67' }}>{d}</div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
                  {calDays.map((cell, i) => {
                    if (!cell) return <div key={i} />
                    const active = date === cell.iso
                    return (
                      <button type="button" key={cell.iso} disabled={cell.past} onClick={() => setDate(cell.iso)}
                        style={{ aspectRatio: '1', borderRadius: 10, border: '1.5px solid', borderColor: active ? gold : 'transparent', background: active ? gold : 'transparent', color: cell.past ? 'rgba(14,14,12,0.2)' : active ? '#fff' : ink, fontSize: 13, fontWeight: 600, cursor: cell.past ? 'default' : 'pointer', fontFamily: ff, touchAction: 'manipulation' }}>
                        {cell.d}
                      </button>
                    )
                  })}
                </div>
              </div>

              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b6b67', marginBottom: 10 }}>Elige una hora</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 18 }}>
                {slots.map(s => {
                  const active = time === s
                  return (
                    <button type="button" key={s} onClick={() => setTime(s)}
                      style={{ height: 44, borderRadius: 14, border: '1.5px solid', borderColor: active ? gold : 'rgba(14,14,12,0.12)', background: active ? gold : 'rgba(248,246,241,0.5)', color: active ? '#fff' : 'rgba(14,14,12,0.7)', fontFamily: ff, fontSize: 13, fontWeight: 600, cursor: 'pointer', touchAction: 'manipulation' }}>
                      {s}
                    </button>
                  )
                })}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { val: name, set: setName, ph: 'Tu nombre', type: 'text' },
                  { val: phone, set: setPhone, ph: '+1 (787) 555-1234', type: 'tel' },
                  { val: business, set: setBusiness, ph: 'Nombre del negocio', type: 'text' },
                ].map(f => (
                  <input key={f.ph} required value={f.val} type={f.type}
                    onChange={e => f.set(f.type === 'tel' ? formatPhone(e.target.value) : e.target.value)}
                    placeholder={f.ph}
                    style={{ height: 52, width: '100%', boxSizing: 'border-box', borderRadius: 14, border: '1.5px solid rgba(14,14,12,0.12)', padding: '0 16px', fontSize: 16, fontFamily: ff, background: 'rgba(248,246,241,0.5)', color: ink, outline: 'none', WebkitAppearance: 'none' }} />
                ))}
              </div>
              {error && <p style={{ marginTop: 10, textAlign: 'center', fontSize: 12, color: '#c0392b' }}>{error}</p>}
              <button type="submit" disabled={!date || !time || loading}
                style={{ marginTop: 20, height: 52, width: '100%', borderRadius: 99, border: 'none', background: ink, color: cream, fontFamily: ff, fontSize: 16, fontWeight: 600, cursor: !date || !time || loading ? 'not-allowed' : 'pointer', opacity: !date || !time || loading ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, touchAction: 'manipulation' }}>
                {loading ? 'Enviando…' : <><span>Confirmar</span><ArrowRight style={{ width: 16, height: 16 }} /></>}
              </button>
            </form>
          ) : (
            <div style={{ background: `${gold}10`, border: `1px solid ${gold}40`, borderRadius: 28, padding: '40px 24px', textAlign: 'center' }}>
              <div style={{ margin: '0 auto', width: 64, height: 64, borderRadius: '50%', background: gold, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check style={{ width: 28, height: 28, color: '#fff' }} />
              </div>
              <h2 style={{ fontFamily: ffS, fontSize: 32, fontWeight: 300, color: ink, marginTop: 20, marginBottom: 8 }}>
                Gracias por la oportunidad,<br /><em style={{ color: gold }}>pronto nos reunimos.</em>
              </h2>
              <p style={{ fontSize: 14, color: '#6b6b67', marginBottom: 4 }}>
                {confirmed.date && new Date(confirmed.date + 'T12:00:00').toLocaleDateString('es-PR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <p style={{ fontSize: 14, color: gold, fontWeight: 600 }}>{confirmed.time}</p>
              {confirmed.date && confirmed.time && <AddToCalBtn date={confirmed.date} time={confirmed.time} name={confirmed.name} />}
              <button onClick={() => { setStep('form'); setName(''); setPhone(''); setBusiness(''); setDate(''); setTime('') }}
                style={{ marginTop: 16, background: 'none', border: 'none', fontSize: 12, fontWeight: 600, color: '#6b6b67', textDecoration: 'underline', cursor: 'pointer', fontFamily: ff }}>
                Agendar otra reunión
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
