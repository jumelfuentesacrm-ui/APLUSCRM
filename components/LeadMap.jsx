import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'

// Leaflet must be loaded client-side only (no SSR)
const MapContainer  = dynamic(() => import('react-leaflet').then(m => m.MapContainer),  { ssr: false })
const TileLayer     = dynamic(() => import('react-leaflet').then(m => m.TileLayer),     { ssr: false })
const CircleMarker  = dynamic(() => import('react-leaflet').then(m => m.CircleMarker),  { ssr: false })
const Popup         = dynamic(() => import('react-leaflet').then(m => m.Popup),         { ssr: false })

const ff  = "'Inter', sans-serif"
const ffS = "'Cormorant Garamond', serif"
const gold = '#b8975a'

const STATUS = {
  none:     { label: 'No contactado', color: '#378ADD', radius: 9,  opacity: 1 },
  followup: { label: 'Follow-up',     color: '#EF9F27', radius: 8,  opacity: 1 },
  scheduled:{ label: 'Agendado',      color: '#1D9E75', radius: 8,  opacity: 1 },
  noint:    { label: 'No interesado', color: '#888780', radius: 7,  opacity: 0.5 },
}

const STATUS_ORDER = ['none', 'followup', 'scheduled', 'noint']

function parseCSV(text) {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  return lines.slice(1).map(line => {
    // Handle quoted fields with commas
    const cols = []
    let cur = '', inQ = false
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ }
      else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = '' }
      else cur += ch
    }
    cols.push(cur.trim())
    const obj = {}
    headers.forEach((h, i) => { obj[h] = (cols[i] || '').replace(/^"|"$/g, '') })
    return obj
  }).filter(r => r.name)
}

export default function LeadMap({ showToast }) {
  const router = useRouter()
  const fileRef = useRef()
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [catFilter, setCatFilter] = useState('Todos')
  const [expanded, setExpanded] = useState({})
  const [leafletReady, setLeafletReady] = useState(false)

  useEffect(() => {
    // Load leaflet CSS client-side
    if (typeof window !== 'undefined') {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = '/leaflet.css'
      document.head.appendChild(link)
      setLeafletReady(true)
    }
    load()
  }, [])

  async function load() {
    setLoading(true)
    const r = await fetch('/api/admin/leads')
    const d = await r.json()
    setLeads(d.leads || [])
    setLoading(false)
  }

  async function handleCSV(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    try {
      const text = await file.text()
      const rows = parseCSV(text)
      if (!rows.length) { showToast('CSV vacío o formato incorrecto'); setImporting(false); return }
      const r = await fetch('/api/admin/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads: rows }),
      })
      const d = await r.json()
      if (!r.ok) { showToast('Error: ' + d.error); setImporting(false); return }
      showToast(`${d.leads?.length || rows.length} leads importados`)
      await load()
    } catch (err) {
      showToast('Error al leer el CSV')
    }
    setImporting(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  function callLead(lead) {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('llamada_prefill', JSON.stringify({
        business_name: lead.name,
        phone: lead.phone,
        pueblo: lead.town,
        lead_id: lead.id,
      }))
    }
    router.push('/admin')
    // The parent component will switch to coldcalling panel
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('aplus_goto_panel', 'coldcalling')
    }
  }

  // Dynamic category list
  const categories = ['Todos', ...Array.from(new Set(leads.map(l => l.category).filter(Boolean))).sort()]

  const filtered = catFilter === 'Todos' ? leads : leads.filter(l => l.category === catFilter)

  const sorted = [...filtered].sort((a, b) => {
    const oi = STATUS_ORDER.indexOf(a.status || 'none')
    const oj = STATUS_ORDER.indexOf(b.status || 'none')
    return oi - oj
  })

  const mapLeads = filtered.filter(l => l.lat && l.lng)

  return (
    <div style={{ padding: '20px 16px 100px', fontFamily: ff }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
        <h1 style={{ fontFamily: ffS, fontSize: 26, fontWeight: 300, color: 'var(--ink, #1c1c1a)' }}>
          Mapa de Leads
        </h1>
        <span style={{ fontSize: 11, color: '#6b6b67' }}>{leads.length} leads</span>
      </div>

      {/* Import CSV */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          onChange={handleCSV}
          style={{ display: 'none' }}
          id="csv-input"
        />
        <label
          htmlFor="csv-input"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '9px 16px', background: importing ? '#f0ebe0' : '#1c1c1a',
            color: importing ? '#6b6b67' : '#f8f6f1', borderRadius: 10,
            fontSize: 13, fontWeight: 600, cursor: importing ? 'not-allowed' : 'pointer',
            fontFamily: ff, userSelect: 'none',
          }}
        >
          {importing ? '⏳ Importando...' : '⬆ Importar CSV'}
        </label>
        <button
          onClick={load}
          style={{
            padding: '9px 14px', background: 'rgba(14,14,12,0.05)', border: '1px solid rgba(14,14,12,0.1)',
            borderRadius: 10, fontSize: 13, cursor: 'pointer', fontFamily: ff, color: '#6b6b67',
          }}
        >
          ↺
        </button>
      </div>

      {/* Category chips */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 14, paddingBottom: 4, WebkitOverflowScrolling: 'touch' }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCatFilter(cat)}
            style={{
              flexShrink: 0, padding: '6px 14px', borderRadius: 99,
              border: `1px solid ${catFilter === cat ? '#1c1c1a' : 'rgba(14,14,12,0.14)'}`,
              background: catFilter === cat ? '#1c1c1a' : 'transparent',
              color: catFilter === cat ? '#f8f6f1' : '#6b6b67',
              fontSize: 12, fontWeight: catFilter === cat ? 600 : 400,
              cursor: 'pointer', fontFamily: ff, whiteSpace: 'nowrap',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* MAP */}
      <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(14,14,12,0.1)', marginBottom: 12, height: 320 }}>
        {leafletReady && (
          <MapContainer
            center={[18.22, -66.59]}
            zoom={9}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
            />
            {mapLeads.map(lead => {
              const st = STATUS[lead.status || 'none'] || STATUS.none
              return (
                <CircleMarker
                  key={lead.id}
                  center={[lead.lat, lead.lng]}
                  radius={st.radius}
                  pathOptions={{
                    color: st.color,
                    fillColor: st.color,
                    fillOpacity: st.opacity,
                    opacity: st.opacity,
                    weight: 2,
                  }}
                >
                  <Popup>
                    <div style={{ fontFamily: ff, minWidth: 160 }}>
                      <p style={{ fontWeight: 700, fontSize: 13, margin: '0 0 2px' }}>{lead.name}</p>
                      <p style={{ fontSize: 11, color: '#6b6b67', margin: '0 0 8px' }}>{lead.town}</p>
                      <button
                        onClick={() => callLead(lead)}
                        style={{
                          width: '100%', padding: '6px 0', background: '#1c1c1a', color: '#f8f6f1',
                          border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600,
                          cursor: 'pointer', fontFamily: ff,
                        }}
                      >
                        📞 Llamar
                      </button>
                    </div>
                  </Popup>
                </CircleMarker>
              )
            })}
          </MapContainer>
        )}
        {!leafletReady && (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f3ee', color: '#6b6b67', fontSize: 13 }}>
            Cargando mapa...
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        {Object.entries(STATUS).map(([key, s]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0, opacity: s.opacity }} />
            <span style={{ fontSize: 11, color: '#6b6b67', fontFamily: ff }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Lead list */}
      {loading && <p style={{ color: '#6b6b67', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>Cargando leads...</p>}
      {!loading && sorted.length === 0 && (
        <p style={{ color: '#6b6b67', fontSize: 13, textAlign: 'center', padding: '32px 0' }}>
          No hay leads. Importa un CSV para comenzar.
        </p>
      )}
      {!loading && sorted.map(lead => {
        const st = STATUS[lead.status || 'none'] || STATUS.none
        const isContacted = lead.status && lead.status !== 'none'
        const isOpen = expanded[lead.id]
        return (
          <div
            key={lead.id}
            style={{
              background: 'rgba(248,246,241,0.8)',
              border: '1px solid rgba(14,14,12,0.08)',
              borderRadius: 14,
              padding: '12px 14px',
              marginBottom: 10,
              opacity: isContacted ? 0.75 : 1,
              backdropFilter: 'blur(12px)',
            }}
          >
            {/* Top row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              {/* Status dot */}
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: st.color, flexShrink: 0, marginTop: 4, opacity: st.opacity }} />

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#1c1c1a' }}>{lead.name}</span>
                  {isContacted && (
                    <span style={{
                      fontSize: 10, padding: '2px 7px', borderRadius: 99,
                      background: st.color + '20', color: st.color, fontWeight: 600,
                    }}>
                      {lead.status === 'followup' ? `Follow-up${lead.followup_date ? ': ' + new Date(lead.followup_date + 'T00:00:00').toLocaleDateString('es-PR', { day: 'numeric', month: 'short' }) : ''}` : st.label}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
                  {lead.town && <span style={{ fontSize: 12, color: '#6b6b67' }}>{lead.town}</span>}
                  {lead.town && (lead.website !== undefined) && <span style={{ color: 'rgba(14,14,12,0.2)', fontSize: 10 }}>|</span>}
                  <span style={{
                    fontSize: 10, padding: '1px 6px', borderRadius: 99,
                    background: lead.website ? 'rgba(45,138,96,0.1)' : 'rgba(14,14,12,0.05)',
                    color: lead.website ? '#2d8a60' : '#6b6b67',
                    fontWeight: 500,
                  }}>
                    {lead.website ? 'Tiene web' : 'Sin web'}
                  </span>
                  {lead.stars && (
                    <span style={{ fontSize: 11, color: gold }}>★ {Number(lead.stars).toFixed(1)}</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button
                  onClick={() => setExpanded(p => ({ ...p, [lead.id]: !p[lead.id] }))}
                  style={{
                    padding: '6px 10px', background: 'rgba(14,14,12,0.05)',
                    border: '1px solid rgba(14,14,12,0.09)', borderRadius: 8,
                    fontSize: 11, cursor: 'pointer', color: '#6b6b67', fontFamily: ff,
                  }}
                >
                  {isOpen ? '▲' : 'Ver más'}
                </button>
                <button
                  onClick={() => callLead(lead)}
                  style={{
                    padding: '6px 12px', background: '#1c1c1a', color: '#f8f6f1',
                    border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 600,
                    cursor: 'pointer', fontFamily: ff,
                  }}
                >
                  📞 Llamar
                </button>
              </div>
            </div>

            {/* Expanded detail */}
            {isOpen && (
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(14,14,12,0.07)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {lead.phone && (
                    <a href={`tel:${lead.phone}`} style={{ fontSize: 12, color: '#378ADD', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                      📞 {lead.phone}
                    </a>
                  )}
                  {lead.category && (
                    <span style={{ fontSize: 12, color: '#6b6b67' }}>🏷 {lead.category}</span>
                  )}
                  {lead.stars && (
                    <span style={{ fontSize: 12, color: '#6b6b67' }}>★ {Number(lead.stars).toFixed(1)} ({lead.reviews || 0} reseñas)</span>
                  )}
                  {lead.website && (
                    <span style={{ fontSize: 12, color: '#2d8a60' }}>🌐 Tiene sitio web</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  {lead.maps_url && (
                    <a
                      href={lead.maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '6px 12px', background: 'rgba(55,138,221,0.1)', color: '#378ADD',
                        border: '1px solid rgba(55,138,221,0.25)', borderRadius: 8,
                        fontSize: 11, fontWeight: 600, textDecoration: 'none', fontFamily: ff,
                      }}
                    >
                      Ver en Maps
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
