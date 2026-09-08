import Head from 'next/head'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import { formatPhone } from '../lib/config'
import { ArrowRight, Check, ChevronLeft, ChevronRight, MapPin, Star, ExternalLink } from 'lucide-react'

// ─── Tokens ─────────────────────────────────────────────
const INK   = '#0E0E0C'
const CREAM = '#FAFAF8'
const GOLD  = '#B8975A'
const GRAY  = '#6B6B67'
const LGRAY = '#E2DED7'
const WHITE = '#FFFFFF'
const FF    = 'Inter, ui-sans-serif, system-ui, sans-serif'
const FFS   = '"Cormorant Garamond", ui-serif, Georgia, serif'

// ─────────────────────────────────────────────────────────
// UPDATE THESE when you add a new client or feature
// ─────────────────────────────────────────────────────────

const LATEST_CLIENT = {
  name: 'Klassy Salon PR',
  type: 'Página web + Sistema de citas',
  city: 'Puerto Rico',
  url: 'https://www.klassysalonpr.com',
  month: 'Septiembre 2026',
  accent: '#9b7fa6',
}

// Add new entries at the TOP — newest first
const UPDATES = [
  { date: 'Sep 2026', title: 'Panel admin: nuevo filtro por estado', desc: 'Ahora puedes filtrar citas por pendiente, confirmada o cancelada desde el panel de administración.' },
  { date: 'Ago 2026', title: 'Nuevo cliente: IM Hair Studio', desc: 'Lanzamos la página web y sistema de citas de IM Hair Studio en Carolina, PR.' },
  { date: 'Jul 2026', title: 'Confirmaciones por WhatsApp', desc: 'Los clientes reciben un mensaje automático al agendar. Funciona en todos los sistemas activos.' },
  { date: 'Jun 2026', title: 'Nuevo cliente: La Chiva Chinchorreos', desc: 'Página web con menú editable y sistema de reservas. Puerto Rico.' },
]

// ─────────────────────────────────────────────────────────

const PRODUCTS = [
  {
    n: '01',
    title: 'Página Web',
    desc: 'Tu negocio en línea en 24 horas. Diseño limpio, dominio, hosting y formulario de contacto. Tus clientes te encuentran donde buscan.',
    details: ['Diseño personalizado con tu marca', 'Dominio y hosting incluido', 'Formulario de contacto o citas', 'Entregado en 24 horas'],
  },
  {
    n: '02',
    title: 'Sistema de Citas',
    desc: 'Tus clientes agendan solos desde su celular. Confirmaciones automáticas, calendario en tiempo real, y panel de control.',
    details: ['Agenda online 24/7', 'Confirmaciones automáticas', 'Panel de administración', 'Compatible con cualquier negocio'],
  },
]

const WORKS = [
  { name: 'Klassy Salon PR', tag: 'Página web + Sistema de citas', city: 'Puerto Rico', url: 'https://www.klassysalonpr.com', accent: '#9b7fa6', services: ['Web', 'Citas'] },
  { name: 'Road Pizza PR', tag: 'Página web con menú editable', city: 'Canóvanas, PR', url: 'https://www.roadpizzapr.com', accent: '#c0392b', services: ['Web'] },
  { name: 'Tatiana Salon', tag: 'Página web profesional', city: 'Puerto Rico', url: 'https://www.tatianasalon.com', accent: '#d4a5a5', services: ['Web'] },
  { name: 'VC Beauty Salon', tag: 'Página web + Sistema de citas', city: 'Puerto Rico', url: 'https://www.vcbeautysalonpr.com', accent: '#b8975a', services: ['Web', 'Citas'] },
]

const REVIEWS = [
  { name: 'Carlos M.', biz: 'Barbería · San Juan', rating: 5, text: 'En menos de 24 horas tenía mi página lista y el sistema de citas funcionando. Profesional y rápido.' },
  { name: 'Yamilet R.', biz: 'Salón de uñas · Bayamón', rating: 5, text: 'Mis clientas agendan solas desde su celular. Yo solo veo la agenda lista en la mañana.' },
  { name: 'Dr. Reyes', biz: 'Clínica Dental · Caguas', rating: 5, text: 'Profesionales, rápidos y el sistema corre solo. Recomendado 100%.' },
  { name: 'Luis F.', biz: 'Restaurante · Santurce', rating: 5, text: 'La página web quedó exactamente como la quería. Entregaron a tiempo y sin complicaciones.' },
  { name: 'Andrea P.', biz: 'Estética · Mayagüez', rating: 5, text: 'El equipo de A+ entendió mi negocio en una sola reunión. Entregaron en una semana.' },
  { name: 'Carmen V.', biz: 'Nutricionista · Caguas', rating: 5, text: 'El sistema profesionalizó mi negocio. Mis pacientes dicen que parece una empresa grande.' },
  { name: 'Eduardo S.', biz: 'Fotografía · San Juan', rating: 5, text: 'Cobro el depósito al agendar y ya no tengo clientes que me dejan plantado en el studio.' },
  { name: 'Patricia L.', biz: 'Yoga Studio · Isabela', rating: 5, text: 'Increíble. En 24 horas tenía todo listo y funcionando. Soporte excelente.' },
  { name: 'Miguel R.', biz: 'Barbería · Arecibo', rating: 4, text: 'Pasé de agenda en papel a todo digital en una semana. El equipo estuvo pendiente en todo momento.' },
]

// ─── Page ────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter()
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return
      const { data } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
      if (data?.role === 'admin' || data?.role === 'agent') router.replace('/admin')
    })
  }, [])
  return (
    <>
      <Head>
        <title>Accounting Plus CRM — Páginas Web y Sistemas de Citas para Negocios en Puerto Rico</title>
        <meta name="description" content="Páginas web profesionales y sistemas de citas para negocios en Puerto Rico. Entregados en 24 horas. Accounting Plus CRM." />
        <meta name="keywords" content="página web Puerto Rico, sistema de citas Puerto Rico, booking online negocio, web design Puerto Rico, Accounting Plus CRM" />
        <meta name="author" content="Accounting Plus CRM" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://www.accountingpluscrm.com" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.accountingpluscrm.com" />
        <meta property="og:title" content="Accounting Plus CRM — Páginas Web y Sistemas de Citas · Puerto Rico" />
        <meta property="og:description" content="Páginas web y sistemas de citas para negocios en Puerto Rico. Entregados en 24 horas." />
        <meta property="og:image" content="https://www.accountingpluscrm.com/og-image.jpg" />
        <meta property="og:locale" content="es_PR" />
        <meta property="og:site_name" content="Accounting Plus CRM" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org", "@type": "LocalBusiness",
          "name": "Accounting Plus CRM",
          "description": "Páginas web y sistemas de citas para negocios en Puerto Rico.",
          "url": "https://www.accountingpluscrm.com",
          "address": { "@type": "PostalAddress", "addressRegion": "PR", "addressCountry": "US" },
          "areaServed": "Puerto Rico",
          "serviceType": ["Página Web", "Sistema de Citas"],
          "priceRange": "$$"
        })}} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500;1,600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <div style={{ background: CREAM, color: INK, fontFamily: FF }}>
        <TopNav />
        <Hero />
        <FadeIn><LatestClient /></FadeIn>
        <FadeIn><Updates /></FadeIn>
        <FadeIn><Products /></FadeIn>
        <FadeIn><Portfolio /></FadeIn>
        <Contact />
        <Footer />
        <StickyCTA />
      </div>
    </>
  )
}

function FadeIn({ children }) {
  return <>{children}</>
}

// ─── Nav ─────────────────────────────────────────────────
const NAV_LINKS = [['#home','Home'],['#products','Products'],['#portfolio','Portfolio'],['#contact','Contact Us']]

function TopNav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <header style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: scrolled ? 'rgba(250,250,248,0.97)' : 'rgba(250,250,248,0.82)',
        backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${scrolled ? LGRAY : 'transparent'}`,
        transition: 'all 0.25s ease',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="#home" style={{ display: 'flex', alignItems: 'baseline', gap: 6, textDecoration: 'none' }}>
            <span style={{ fontFamily: FFS, fontSize: 22, fontWeight: 600, color: INK, lineHeight: 1 }}>A+</span>
            <span style={{ fontFamily: FF, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.22em', color: GRAY }}>CRM</span>
          </a>

          <nav className="hidden md:flex" style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
            {NAV_LINKS.map(([href, label]) => (
              <a key={href} href={href} style={{ fontSize: 13, fontWeight: 500, color: GRAY, textDecoration: 'none' }}>{label}</a>
            ))}
          </nav>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <a href="#contact" className="hidden md:inline-flex" style={{
              height: 36, borderRadius: 6, padding: '0 18px',
              background: INK, color: CREAM, fontFamily: FF, fontSize: 13, fontWeight: 600,
              textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6
            }}>
              Contactar <ArrowRight style={{ width: 12, height: 12 }} />
            </a>
            <button className="md:hidden" onClick={() => setOpen(o => !o)} aria-label="Menú"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', flexDirection: 'column', gap: 5, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
              {[0,1,2].map(i => (
                <span key={i} style={{
                  display: 'block', width: 20, height: 1.5, background: INK, borderRadius: 2, transition: 'all 0.2s',
                  transform: open && i === 0 ? 'translateY(6.5px) rotate(45deg)' : open && i === 2 ? 'translateY(-6.5px) rotate(-45deg)' : 'none',
                  opacity: open && i === 1 ? 0 : 1,
                }} />
              ))}
            </button>
          </div>
        </div>
      </header>

      {open && <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 98, background: 'rgba(14,14,12,0.4)' }} />}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 99,
        width: 'min(80vw, 280px)', background: WHITE,
        transform: open ? 'translateX(0)' : 'translateX(105%)',
        transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
        padding: '72px 28px 40px', display: 'flex', flexDirection: 'column',
        boxShadow: '-12px 0 40px rgba(14,14,12,0.12)',
      }}>
        <nav style={{ display: 'flex', flexDirection: 'column' }}>
          {NAV_LINKS.map(([href, label]) => (
            <a key={href} href={href} onClick={() => setOpen(false)} style={{
              display: 'block', padding: '16px 0', fontSize: 22,
              fontFamily: FFS, fontWeight: 500, color: INK,
              borderBottom: `1px solid ${LGRAY}`, textDecoration: 'none'
            }}>{label}</a>
          ))}
        </nav>
        <a href="#contact" onClick={() => setOpen(false)} style={{
          marginTop: 28, height: 48, borderRadius: 6, background: INK, color: CREAM,
          fontFamily: FF, fontSize: 14, fontWeight: 600, textDecoration: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
        }}>
          Contactar <ArrowRight style={{ width: 14, height: 14 }} />
        </a>
      </div>
    </>
  )
}

// ─── Hero ────────────────────────────────────────────────
function Hero() {
  return (
    <section id="home" style={{ background: INK, position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${GOLD}70, transparent)` }} />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '88px 24px 80px' }}>
        <div style={{ maxWidth: 680 }}>
          <p style={{ fontFamily: FF, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.28em', color: GOLD, margin: '0 0 28px' }}>
            Accounting Plus · Puerto Rico
          </p>
          <h1 style={{ fontFamily: FFS, fontWeight: 500, fontSize: 'clamp(40px, 5.5vw, 68px)', lineHeight: 1.02, letterSpacing: '-0.01em', color: CREAM, margin: '0 0 22px' }}>
            Tu página web.<br />
            Tu sistema de citas.<br />
            <em style={{ color: GOLD, fontStyle: 'italic' }}>Listo en 24 horas.</em>
          </h1>
          <p style={{ margin: '0 0 36px', fontSize: 16, lineHeight: 1.7, color: 'rgba(250,250,248,0.55)', maxWidth: '44ch', fontFamily: FF }}>
            Diseñamos páginas web y sistemas de citas para negocios en Puerto Rico. Simple, profesional, y entregado rápido.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 48 }}>
            <a href="#products" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              height: 48, borderRadius: 6, padding: '0 22px',
              background: GOLD, color: INK, textDecoration: 'none',
              fontFamily: FF, fontSize: 14, fontWeight: 700
            }}>
              Ver servicios <ArrowRight style={{ width: 14, height: 14 }} />
            </a>
            <a href="#portfolio" style={{
              display: 'inline-flex', alignItems: 'center',
              height: 48, borderRadius: 6, padding: '0 22px',
              border: '1px solid rgba(250,250,248,0.14)',
              color: 'rgba(250,250,248,0.65)', textDecoration: 'none',
              fontFamily: FF, fontSize: 14, fontWeight: 500
            }}>
              Ver portafolio
            </a>
          </div>
          {/* Stats strip */}
          <div style={{ display: 'flex', gap: 0, borderTop: '1px solid rgba(250,250,248,0.08)', paddingTop: 32 }}>
            {[
              { k: '< 24 horas', v: 'Tiempo de entrega' },
              { k: 'Puerto Rico', v: 'Hecho aquí' },
              { k: '100%', v: 'Personalizado' },
            ].map((s, i) => (
              <div key={s.v} style={{ paddingRight: 36, marginRight: 36, borderRight: i < 2 ? '1px solid rgba(250,250,248,0.08)' : 'none' }}>
                <p style={{ fontFamily: FF, fontSize: 18, fontWeight: 700, color: CREAM, margin: 0, letterSpacing: '-0.02em' }}>{s.k}</p>
                <p style={{ fontFamily: FF, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(250,250,248,0.35)', margin: '5px 0 0' }}>{s.v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Latest Client ───────────────────────────────────────
function LatestClient() {
  return (
    <section style={{ background: WHITE, borderBottom: `1px solid ${LGRAY}` }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, minHeight: 72 }} className="flex-wrap md:flex-nowrap">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 0', flexShrink: 0 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ADE80' }} />
            <span style={{ fontFamily: FF, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: GRAY }}>Último cliente</span>
          </div>
          <div style={{ width: 1, height: 32, background: LGRAY, margin: '0 24px', flexShrink: 0 }} className="hidden md:block" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, padding: '16px 0', flexWrap: 'wrap' }}>
            <p style={{ fontFamily: FFS, fontSize: 18, fontWeight: 500, color: INK, margin: 0 }}>{LATEST_CLIENT.name}</p>
            <span style={{ fontFamily: FF, fontSize: 11, color: GRAY }}>·</span>
            <p style={{ fontFamily: FF, fontSize: 13, color: GRAY, margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPin style={{ width: 11, height: 11 }} /> {LATEST_CLIENT.city}
            </p>
            <span style={{ fontFamily: FF, fontSize: 11, color: GRAY }}>·</span>
            <p style={{ fontFamily: FF, fontSize: 13, color: GRAY, margin: 0 }}>{LATEST_CLIENT.type}</p>
            <span style={{ fontFamily: FF, fontSize: 11, color: GRAY }}>·</span>
            <p style={{ fontFamily: FF, fontSize: 12, fontWeight: 600, color: GOLD, margin: 0 }}>{LATEST_CLIENT.month}</p>
          </div>
          <a href={LATEST_CLIENT.url} target="_blank" rel="noopener noreferrer" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            height: 34, borderRadius: 5, border: `1px solid ${LGRAY}`,
            padding: '0 14px', textDecoration: 'none',
            fontFamily: FF, fontSize: 12, fontWeight: 600, color: INK, flexShrink: 0
          }}>
            Ver sitio <ExternalLink style={{ width: 11, height: 11 }} />
          </a>
        </div>
      </div>
    </section>
  )
}

// ─── Updates ─────────────────────────────────────────────
function Updates() {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? UPDATES : UPDATES.slice(0, 3)
  return (
    <section style={{ padding: '80px 24px', background: CREAM, borderBottom: `1px solid ${LGRAY}` }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="grid md:grid-cols-4 gap-10">
          <div>
            <p style={{ fontFamily: FF, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.22em', color: GOLD, margin: '0 0 10px' }}>Novedades</p>
            <h2 style={{ fontFamily: FFS, fontWeight: 500, fontSize: 'clamp(26px, 3vw, 36px)', lineHeight: 1.1, color: INK, margin: '0 0 12px' }}>
              Lo último de<br /><em style={{ color: GOLD }}>A+ CRM.</em>
            </h2>
            <p style={{ fontFamily: FF, fontSize: 13, lineHeight: 1.65, color: GRAY, margin: 0 }}>
              Actualizaciones de productos, nuevos clientes y mejoras al sistema.
            </p>
          </div>
          <div className="md:col-span-3">
            <div style={{ borderTop: `1px solid ${LGRAY}` }}>
              {visible.map((u, i) => (
                <div key={i} style={{ padding: '20px 0', borderBottom: `1px solid ${LGRAY}`, display: 'flex', gap: 20 }} className="grid md:grid-cols-4">
                  <p style={{ fontFamily: FF, fontSize: 11, fontWeight: 600, color: GOLD, margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0 }} className="md:col-span-1">{u.date}</p>
                  <div className="md:col-span-3">
                    <p style={{ fontFamily: FF, fontSize: 14, fontWeight: 600, color: INK, margin: '0 0 4px' }}>{u.title}</p>
                    <p style={{ fontFamily: FF, fontSize: 13, lineHeight: 1.6, color: GRAY, margin: 0 }}>{u.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            {UPDATES.length > 3 && (
              <button onClick={() => setExpanded(e => !e)} style={{ marginTop: 16, background: 'none', border: 'none', fontFamily: FF, fontSize: 13, fontWeight: 600, color: GOLD, cursor: 'pointer', padding: 0 }}>
                {expanded ? 'Ver menos ↑' : `Ver ${UPDATES.length - 3} más ↓`}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Products ────────────────────────────────────────────
function Products() {
  return (
    <section id="products" style={{ padding: '96px 24px', background: WHITE }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ marginBottom: 56 }}>
          <p style={{ fontFamily: FF, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.22em', color: GOLD, margin: '0 0 12px' }}>Servicios</p>
          <h2 style={{ fontFamily: FFS, fontWeight: 500, fontSize: 'clamp(32px, 4vw, 52px)', lineHeight: 1.05, color: INK, margin: 0 }}>
            Lo que hacemos.
          </h2>
        </div>

        <div style={{ borderTop: `1px solid ${LGRAY}` }}>
          {PRODUCTS.map(p => (
            <div key={p.n} className="grid md:grid-cols-12 gap-8" style={{ padding: '40px 0', borderBottom: `1px solid ${LGRAY}` }}>
              <div className="md:col-span-1">
                <span style={{ fontFamily: FF, fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.1em' }}>{p.n}</span>
              </div>
              <div className="md:col-span-4">
                <h3 style={{ fontFamily: FFS, fontSize: 28, fontWeight: 500, color: INK, margin: '0 0 12px', lineHeight: 1.1 }}>{p.title}</h3>
                <p style={{ fontFamily: FF, fontSize: 14, lineHeight: 1.65, color: GRAY, margin: '0 0 20px' }}>{p.desc}</p>
                <a href="#contact" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: FF, fontSize: 13, fontWeight: 700, color: GOLD, textDecoration: 'none' }}>
                  Consultar precio <ArrowRight style={{ width: 12, height: 12 }} />
                </a>
              </div>
              <div className="md:col-span-7">
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {p.details.map(d => (
                    <li key={d} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: `1px solid ${LGRAY}` }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: INK, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Check style={{ width: 10, height: 10, color: CREAM }} />
                      </div>
                      <span style={{ fontFamily: FF, fontSize: 14, color: INK }}>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Portfolio ───────────────────────────────────────────
function Portfolio() {
  return (
    <section id="portfolio" style={{ background: INK, padding: '100px 0 0' }}>
      {/* Header */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 32px 64px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
          <div>
            <p style={{ fontFamily: FF, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.28em', color: GOLD, margin: '0 0 14px' }}>Portfolio</p>
            <h2 style={{ fontFamily: FFS, fontWeight: 500, fontSize: 'clamp(38px, 5vw, 64px)', lineHeight: 1.0, color: CREAM, margin: 0 }}>
              Trabajos<br /><em style={{ color: GOLD, fontStyle: 'italic' }}>ya entregados.</em>
            </h2>
          </div>
          <p style={{ fontFamily: FF, fontSize: 14, lineHeight: 1.75, color: 'rgba(250,250,248,0.45)', maxWidth: '34ch', margin: 0 }}>
            Negocios reales en Puerto Rico operando con páginas y sistemas de A+ CRM.
          </p>
        </div>
      </div>

      {/* Full-width grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }} className="portfolio-grid">
        {WORKS.map((w, i) => <PortfolioCard key={w.name} work={w} index={i} />)}
        {/* CTA tile */}
        <a href="#contact" className="portfolio-cta" style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          textDecoration: 'none', textAlign: 'center', padding: '64px 40px',
          background: `${GOLD}0D`, borderTop: `1px solid rgba(250,250,248,0.06)`,
          borderLeft: `1px solid rgba(250,250,248,0.06)`,
          transition: 'background 0.4s ease',
          gap: 20,
        }}
          onMouseEnter={e => { e.currentTarget.style.background = `${GOLD}18` }}
          onMouseLeave={e => { e.currentTarget.style.background = `${GOLD}0D` }}
        >
          <p style={{ fontFamily: FFS, fontWeight: 500, fontSize: 'clamp(28px, 3vw, 42px)', lineHeight: 1.1, color: CREAM, margin: 0 }}>
            El próximo<br /><em style={{ color: GOLD }}>eres tú.</em>
          </p>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            height: 44, borderRadius: 6, border: `1px solid ${GOLD}`,
            padding: '0 20px', fontFamily: FF, fontSize: 12, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.12em', color: GOLD,
          }}>
            Comenzar <ArrowRight style={{ width: 12, height: 12 }} />
          </span>
        </a>
      </div>

      <style>{`
        .portfolio-grid { border-top: 1px solid rgba(250,250,248,0.06); }
        @media (max-width: 640px) { .portfolio-grid { grid-template-columns: 1fr; } }
      `}</style>
    </section>
  )
}

function PortfolioCard({ work: w, index }) {
  const [hovered, setHovered] = useState(false)
  const [imgErr, setImgErr] = useState(false)
  const thumb = `https://image.thum.io/get/width/900/crop/700/noanimate/${w.url}`
  const isLeft = index % 2 === 0

  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative', overflow: 'hidden',
        borderTop: `1px solid rgba(250,250,248,0.06)`,
        borderLeft: isLeft ? 'none' : `1px solid rgba(250,250,248,0.06)`,
        cursor: 'pointer',
        transition: 'background 0.4s ease',
        background: hovered ? 'rgba(250,250,248,0.03)' : 'transparent',
      }}
    >
      {/* Screenshot area */}
      <div style={{ aspectRatio: '16/10', overflow: 'hidden', background: `${w.accent}15`, position: 'relative' }}>
        {/* Browser chrome */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 28, background: 'rgba(14,14,12,0.8)', backdropFilter: 'blur(8px)', zIndex: 2, display: 'flex', alignItems: 'center', padding: '0 12px', gap: 6 }}>
          {['#FF5F57','#FFBD2E','#28C840'].map((c, i) => (
            <div key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: c, opacity: 0.7 }} />
          ))}
          <div style={{ flex: 1, height: 16, borderRadius: 3, background: 'rgba(255,255,255,0.08)', marginLeft: 8, display: 'flex', alignItems: 'center', paddingLeft: 8 }}>
            <span style={{ fontFamily: FF, fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.02em' }}>{w.url.replace('https://www.', '')}</span>
          </div>
        </div>

        {!imgErr ? (
          <img src={thumb} alt={w.name} onError={() => setImgErr(true)} loading="lazy"
            style={{
              width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: 'top center',
              display: 'block', paddingTop: 28, boxSizing: 'border-box',
              transform: hovered ? 'scale(1.04)' : 'scale(1)',
              transition: 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
            }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, paddingTop: 28, boxSizing: 'border-box' }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: w.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: WHITE, fontFamily: FFS }}>{w.name[0]}</span>
            </div>
            <span style={{ fontFamily: FF, fontSize: 11, color: 'rgba(250,250,248,0.3)' }}>{w.url.replace('https://www.', '')}</span>
          </div>
        )}

        {/* Hover overlay with link */}
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(14,14,12,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: hovered ? 1 : 0, transition: 'opacity 0.35s ease', zIndex: 3,
        }}>
          <a href={w.url} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              height: 44, borderRadius: 6, padding: '0 22px',
              background: WHITE, color: INK, textDecoration: 'none',
              fontFamily: FF, fontSize: 13, fontWeight: 700,
              transform: hovered ? 'translateY(0)' : 'translateY(8px)',
              transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            }}>
            Ver sitio en vivo <ExternalLink style={{ width: 13, height: 13 }} />
          </a>
        </div>
      </div>

      {/* Info bar */}
      <div style={{ padding: '20px 24px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontFamily: FFS, fontSize: 20, fontWeight: 500, color: CREAM, margin: '0 0 4px', lineHeight: 1.1 }}>{w.name}</p>
          <p style={{ fontFamily: FF, fontSize: 11, color: 'rgba(250,250,248,0.38)', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
            <MapPin style={{ width: 9, height: 9 }} />{w.city} · {w.tag}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {w.services.map(s => (
            <span key={s} style={{
              fontFamily: FF, fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.1em', color: w.accent, background: `${w.accent}20`,
              padding: '3px 8px', borderRadius: 4,
            }}>{s}</span>
          ))}
        </div>
      </div>
    </article>
  )
}

// ─── Reviews ─────────────────────────────────────────────
function Reviews() {
  const [page, setPage] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const perPage = 3
  const totalPages = Math.ceil(REVIEWS.length / perPage)
  const visible = REVIEWS.slice(page * perPage, page * perPage + perPage)

  return (
    <section id="resenas" style={{ padding: '96px 24px', background: WHITE }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="grid md:grid-cols-2 gap-10 items-end" style={{ marginBottom: 48 }}>
          <div>
            <p style={{ fontFamily: FF, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.22em', color: GOLD, margin: '0 0 12px' }}>Reseñas</p>
            <h2 style={{ fontFamily: FFS, fontWeight: 500, fontSize: 'clamp(32px, 4vw, 52px)', lineHeight: 1.05, color: INK, margin: 0 }}>
              Lo que dicen<br /><em style={{ color: GOLD }}>nuestros clientes.</em>
            </h2>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Stars value={5} size={14} />
              <span style={{ fontFamily: FF, fontSize: 13, fontWeight: 600, color: INK }}>4.9 promedio</span>
            </div>
            <p style={{ fontFamily: FF, fontSize: 13, color: GRAY, margin: 0 }}>Clientes activos en Puerto Rico.</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((r, i) => <ReviewCard key={`${page}-${i}`} review={r} />)}
        </div>

        <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            style={{ width: 38, height: 38, borderRadius: 6, border: `1px solid ${LGRAY}`, background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: page === 0 ? 0.35 : 1 }}>
            <ChevronLeft style={{ width: 15, height: 15 }} />
          </button>
          <span style={{ fontFamily: FF, fontSize: 12, color: GRAY }}>{page * perPage + 1}–{Math.min((page + 1) * perPage, REVIEWS.length)} de {REVIEWS.length}</span>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
            style={{ width: 38, height: 38, borderRadius: 6, border: `1px solid ${LGRAY}`, background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: page === totalPages - 1 ? 0.35 : 1 }}>
            <ChevronRight style={{ width: 15, height: 15 }} />
          </button>
        </div>

        <div style={{ marginTop: 32 }}>
          {!showForm ? (
            <button onClick={() => setShowForm(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 38, borderRadius: 6, border: `1px solid ${LGRAY}`, background: 'none', padding: '0 16px', fontFamily: FF, fontSize: 13, fontWeight: 600, color: INK, cursor: 'pointer' }}>
              <Star style={{ width: 13, height: 13, color: GOLD }} /> Escribe tu reseña
            </button>
          ) : (
            <ReviewForm onClose={() => setShowForm(false)} />
          )}
        </div>
      </div>
    </section>
  )
}

function ReviewCard({ review: r }) {
  return (
    <article style={{ background: CREAM, border: `1px solid ${LGRAY}`, borderRadius: 8, padding: '20px' }}>
      <div style={{ display: 'flex', gap: 2, marginBottom: 12 }}>
        <Stars value={r.rating} size={12} />
      </div>
      <p style={{ fontFamily: FF, fontSize: 14, lineHeight: 1.6, color: INK, margin: '0 0 16px' }}>"{r.text}"</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${GOLD}18`, border: `1px solid ${GOLD}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FF, fontSize: 11, fontWeight: 700, color: GOLD, flexShrink: 0 }}>
          {r.name.split(' ').map(p => p[0]).join('')}
        </div>
        <div>
          <p style={{ fontFamily: FF, fontSize: 12, fontWeight: 600, color: INK, margin: 0 }}>{r.name}</p>
          <p style={{ fontFamily: FF, fontSize: 10, color: GRAY, margin: 0 }}>{r.biz}</p>
        </div>
      </div>
    </article>
  )
}

function ReviewForm({ onClose }) {
  const [name, setName] = useState('')
  const [biz, setBiz] = useState('')
  const [rating, setRating] = useState(5)
  const [text, setText] = useState('')
  const [status, setStatus] = useState('idle')

  async function handleSubmit(e) {
    e.preventDefault(); setStatus('loading')
    try {
      const res = await fetch('/api/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, business: biz, rating, text }) })
      if (!res.ok) throw new Error()
      setStatus('done')
    } catch { setStatus('error') }
  }

  const inputS = { height: 42, width: '100%', boxSizing: 'border-box', borderRadius: 6, border: `1px solid ${LGRAY}`, padding: '0 12px', fontSize: 14, fontFamily: FF, background: WHITE, color: INK, outline: 'none' }

  if (status === 'done') return (
    <div style={{ background: WHITE, border: `1px solid ${LGRAY}`, borderRadius: 8, padding: 28, textAlign: 'center', maxWidth: 400 }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', background: INK, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
        <Check style={{ width: 16, height: 16, color: CREAM }} />
      </div>
      <p style={{ fontFamily: FFS, fontSize: 20, color: INK, margin: '0 0 6px' }}>¡Gracias!</p>
      <p style={{ fontFamily: FF, fontSize: 13, color: GRAY, margin: '0 0 16px' }}>La revisaremos y la publicaremos pronto.</p>
      <button onClick={onClose} style={{ fontFamily: FF, fontSize: 12, fontWeight: 600, color: INK, background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}>Cerrar</button>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} style={{ background: WHITE, border: `1px solid ${LGRAY}`, borderRadius: 8, padding: '20px', maxWidth: 400 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <p style={{ fontFamily: FF, fontSize: 14, fontWeight: 600, color: INK, margin: 0 }}>Tu reseña</p>
        <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, color: GRAY, cursor: 'pointer' }}>×</button>
      </div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
        {[1,2,3,4,5].map(n => (
          <button type="button" key={n} onClick={() => setRating(n)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
            <Star style={{ width: 22, height: 22, fill: n <= rating ? GOLD : 'transparent', color: n <= rating ? GOLD : LGRAY }} />
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        <input required value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre" style={inputS} />
        <input required value={biz} onChange={e => setBiz(e.target.value)} placeholder="Tu negocio · Ciudad" style={inputS} />
        <textarea required value={text} onChange={e => setText(e.target.value)} placeholder="Cuéntanos tu experiencia…" rows={3} style={{ ...inputS, height: 'auto', padding: '10px 12px', resize: 'none' }} />
      </div>
      {status === 'error' && <p style={{ fontFamily: FF, fontSize: 12, color: '#c0392b', margin: '0 0 8px' }}>Error. Inténtalo de nuevo.</p>}
      <button type="submit" disabled={status === 'loading'} style={{ height: 44, width: '100%', borderRadius: 6, border: 'none', background: INK, color: CREAM, fontFamily: FF, fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: status === 'loading' ? 0.6 : 1 }}>
        {status === 'loading' ? 'Enviando…' : 'Enviar reseña'}
      </button>
    </form>
  )
}

// ─── Contact ─────────────────────────────────────────────
function makeICS(date, time, name) {
  const [y, m, d] = date.split('-')
  const [t, ampm] = time.split(' ')
  let [h, min] = t.split(':').map(Number)
  if (ampm === 'PM' && h !== 12) h += 12
  if (ampm === 'AM' && h === 12) h = 0
  const pad = n => String(n).padStart(2, '0')
  const dtStart = `${y}${m}${d}T${pad(h)}${pad(min)}00`
  const dtEnd   = `${y}${m}${d}T${pad(h + 1)}${pad(min)}00`
  return ['BEGIN:VCALENDAR','VERSION:2.0','BEGIN:VEVENT',
    'SUMMARY:Consulta A+ CRM', `DTSTART:${dtStart}`, `DTEND:${dtEnd}`,
    `DESCRIPTION:Consulta con ${name}`,
    'END:VEVENT','END:VCALENDAR'].join('\r\n')
}

function AddToCalBtn({ date, time, name }) {
  function handleICS() {
    const blob = new Blob([makeICS(date, time, name)], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'consulta-aplus.ics'; a.click()
    URL.revokeObjectURL(url)
  }
  function handleGcal() {
    const [y, m, d] = date.split('-')
    const [t, ampm] = time.split(' ')
    let [h, min] = t.split(':').map(Number)
    if (ampm === 'PM' && h !== 12) h += 12
    if (ampm === 'AM' && h === 12) h = 0
    const pad = n => String(n).padStart(2, '0')
    const dt = `${y}${m}${d}T${pad(h)}${pad(min)}00`
    const dtEnd = `${y}${m}${d}T${pad(h + 1)}${pad(min)}00`
    window.open(`https://calendar.google.com/calendar/r/eventedit?text=Consulta+A%2B+CRM&dates=${dt}/${dtEnd}`, '_blank')
  }
  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)
  return (
    <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <button onClick={isIOS ? handleICS : handleGcal} style={{ height: 46, width: '100%', borderRadius: 6, border: 'none', background: INK, color: CREAM, fontFamily: FF, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Añadir al calendario</button>
      {!isIOS && <button onClick={handleICS} style={{ height: 38, width: '100%', borderRadius: 6, border: `1px solid ${LGRAY}`, background: 'transparent', color: GRAY, fontFamily: FF, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Descargar .ics</button>}
    </div>
  )
}

function Contact() {
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
  const [calMonth, setCalMonth] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() } })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const a = params.get('agent')
    if (a) setAgentId(a)
  }, [])

  const calDays = useMemo(() => {
    const { y, m } = calMonth
    const today = new Date(); today.setHours(0,0,0,0)
    const first = new Date(y, m, 1)
    const last  = new Date(y, m + 1, 0)
    const cells = []
    for (let i = 0; i < first.getDay(); i++) cells.push(null)
    for (let d = 1; d <= last.getDate(); d++) {
      const dt = new Date(y, m, d)
      const iso = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
      cells.push({ d, iso, past: dt <= today })
    }
    return cells
  }, [calMonth])

  const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  const slots = ['9:00 AM', '10:30 AM', '12:00 PM', '2:00 PM', '3:30 PM', '5:00 PM']

  async function handleSubmit(e) {
    e.preventDefault(); setLoading(true); setError(null)
    try {
      const res = await fetch('/api/public/booking', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, phone, business, date, time, ...(agentId ? { agent_id: agentId } : {}) }) })
      if (!res.ok) throw new Error()
      setConfirmed({ date, time, name })
      setStep('done')
    } catch { setError('Hubo un error. Escríbenos directamente al WhatsApp.') }
    finally { setLoading(false) }
  }

  const inputS = { height: 48, width: '100%', boxSizing: 'border-box', borderRadius: 6, border: `1px solid ${LGRAY}`, padding: '0 14px', fontSize: 15, fontFamily: FF, background: WHITE, color: INK, outline: 'none', WebkitAppearance: 'none' }

  return (
    <section id="contact" style={{ padding: '96px 24px', background: INK }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="grid md:grid-cols-2 gap-16 items-start">
          {/* Left: copy */}
          <div>
            <p style={{ fontFamily: FF, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.22em', color: GOLD, margin: '0 0 16px' }}>Contact Us</p>
            <h2 style={{ fontFamily: FFS, fontWeight: 500, fontSize: 'clamp(32px, 4vw, 52px)', lineHeight: 1.05, color: CREAM, margin: '0 0 16px' }}>
              ¿Hablamos?
            </h2>
            <p style={{ fontFamily: FF, fontSize: 15, lineHeight: 1.7, color: 'rgba(250,250,248,0.5)', margin: '0 0 36px' }}>
              Reserva una consulta de 15 minutos. Te explicamos qué necesitas, cuánto cuesta, y cuándo lo entregamos.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'Entrega', val: 'En menos de 24 horas' },
                { label: 'Consulta', val: 'Gratis y sin compromiso' },
                { label: 'Soporte', val: 'Directo por WhatsApp' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Check style={{ width: 10, height: 10, color: INK }} />
                  </div>
                  <div>
                    <span style={{ fontFamily: FF, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(250,250,248,0.35)' }}>{row.label} — </span>
                    <span style={{ fontFamily: FF, fontSize: 13, color: 'rgba(250,250,248,0.6)' }}>{row.val}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: booking form */}
          <div>
            {step === 'form' ? (
              <form onSubmit={handleSubmit} style={{ background: WHITE, border: `1px solid ${LGRAY}`, borderRadius: 10, padding: '24px 22px' }}>
                <p style={{ fontFamily: FF, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: GRAY, margin: '0 0 10px' }}>Elige un día</p>
                <div style={{ background: CREAM, borderRadius: 8, padding: '12px 8px', border: `1px solid ${LGRAY}`, marginBottom: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingInline: 4 }}>
                    <button type="button" onClick={() => setCalMonth(p => { const d = new Date(p.y, p.m - 1); return { y: d.getFullYear(), m: d.getMonth() } })} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: GRAY, padding: '0 4px' }}>‹</button>
                    <span style={{ fontFamily: FF, fontSize: 12, fontWeight: 700, color: INK }}>{MESES[calMonth.m]} {calMonth.y}</span>
                    <button type="button" onClick={() => setCalMonth(p => { const d = new Date(p.y, p.m + 1); return { y: d.getFullYear(), m: d.getMonth() } })} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: GRAY, padding: '0 4px' }}>›</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 4 }}>
                    {['D','L','M','M','J','V','S'].map((d,i) => <div key={i} style={{ textAlign: 'center', fontFamily: FF, fontSize: 9, fontWeight: 700, color: GRAY }}>{d}</div>)}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
                    {calDays.map((cell, i) => {
                      if (!cell) return <div key={i} />
                      const active = date === cell.iso
                      return (
                        <button type="button" key={cell.iso} disabled={cell.past} onClick={() => setDate(cell.iso)} style={{
                          aspectRatio: '1', borderRadius: 5,
                          border: active ? `1.5px solid ${INK}` : '1.5px solid transparent',
                          background: active ? INK : 'transparent',
                          color: cell.past ? `${GRAY}50` : active ? CREAM : INK,
                          fontFamily: FF, fontSize: 12, fontWeight: 500,
                          cursor: cell.past ? 'default' : 'pointer', touchAction: 'manipulation'
                        }}>{cell.d}</button>
                      )
                    })}
                  </div>
                </div>

                <p style={{ fontFamily: FF, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: GRAY, margin: '0 0 10px' }}>Elige una hora</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 18 }}>
                  {slots.map(s => {
                    const active = time === s
                    return (
                      <button type="button" key={s} onClick={() => setTime(s)} style={{
                        height: 42, borderRadius: 6,
                        border: `1px solid ${active ? INK : LGRAY}`,
                        background: active ? INK : 'transparent',
                        color: active ? CREAM : INK,
                        fontFamily: FF, fontSize: 13, fontWeight: 600,
                        cursor: 'pointer', touchAction: 'manipulation'
                      }}>{s}</button>
                    )
                  })}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
                  {[
                    { val: name, set: setName, ph: 'Tu nombre', type: 'text' },
                    { val: phone, set: setPhone, ph: '+1 (787) 555-1234', type: 'tel' },
                    { val: business, set: setBusiness, ph: 'Nombre del negocio', type: 'text' },
                  ].map(f => (
                    <input key={f.ph} required value={f.val} type={f.type}
                      onChange={e => f.set(f.type === 'tel' ? formatPhone(e.target.value) : e.target.value)}
                      placeholder={f.ph} style={inputS} />
                  ))}
                </div>

                {error && <p style={{ fontFamily: FF, fontSize: 12, color: '#c0392b', textAlign: 'center', margin: '0 0 12px' }}>{error}</p>}

                <button type="submit" disabled={!date || !time || loading} style={{
                  height: 50, width: '100%', borderRadius: 6, border: 'none',
                  background: !date || !time || loading ? `${INK}35` : INK,
                  color: CREAM, fontFamily: FF, fontSize: 15, fontWeight: 600,
                  cursor: !date || !time || loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  touchAction: 'manipulation', transition: 'background 0.15s'
                }}>
                  {loading ? 'Enviando…' : <>Reservar consulta <ArrowRight style={{ width: 15, height: 15 }} /></>}
                </button>
                <p style={{ fontFamily: FF, marginTop: 10, textAlign: 'center', fontSize: 11, color: GRAY }}>Te confirmamos por WhatsApp en menos de 1 hora.</p>
              </form>
            ) : (
              <div style={{ background: WHITE, border: `1px solid ${LGRAY}`, borderRadius: 10, padding: '40px 28px', textAlign: 'center' }}>
                <div style={{ margin: '0 auto 20px', width: 52, height: 52, borderRadius: '50%', background: INK, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Check style={{ width: 22, height: 22, color: CREAM }} />
                </div>
                <h3 style={{ fontFamily: FFS, fontSize: 28, fontWeight: 500, color: INK, margin: '0 0 8px' }}>¡Consulta confirmada!</h3>
                <p style={{ fontFamily: FF, fontSize: 14, color: GRAY, margin: '0 0 4px' }}>
                  {confirmed.date && new Date(confirmed.date+'T12:00:00').toLocaleDateString('es-PR',{weekday:'long',day:'numeric',month:'long'})}
                </p>
                <p style={{ fontFamily: FF, fontSize: 14, color: GOLD, fontWeight: 600, margin: '0 0 8px' }}>{confirmed.time}</p>
                <p style={{ fontFamily: FF, fontSize: 13, color: GRAY }}>Te escribiremos por WhatsApp para confirmar.</p>
                {confirmed.date && confirmed.time && <AddToCalBtn date={confirmed.date} time={confirmed.time} name={confirmed.name} />}
                <button onClick={() => { setStep('form'); setName(''); setPhone(''); setBusiness(''); setDate(''); setTime('') }}
                  style={{ marginTop: 16, background: 'none', border: 'none', fontFamily: FF, fontSize: 12, fontWeight: 600, color: INK, textDecoration: 'underline', cursor: 'pointer' }}>
                  Reservar otro horario
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Footer ──────────────────────────────────────────────
function Footer() {
  const linkS = { display: 'block', fontFamily: FF, fontSize: 13, color: 'rgba(250,250,248,0.42)', textDecoration: 'none', marginBottom: 8 }
  return (
    <footer style={{ background: '#090908', borderTop: '1px solid rgba(250,250,248,0.05)', padding: '52px 24px 40px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="grid md:grid-cols-3 gap-10">
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
              <span style={{ fontFamily: FFS, fontSize: 22, fontWeight: 600, color: CREAM }}>A+</span>
              <span style={{ fontFamily: FF, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.22em', color: 'rgba(250,250,248,0.28)' }}>CRM</span>
            </div>
            <p style={{ fontFamily: FF, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(250,250,248,0.25)', margin: '0 0 10px' }}>Accounting Plus · Puerto Rico</p>
            <p style={{ fontFamily: FF, fontSize: 12, lineHeight: 1.65, color: 'rgba(250,250,248,0.32)', margin: 0 }}>Páginas web y sistemas de citas para negocios en Puerto Rico.</p>
          </div>
          <div>
            <p style={{ fontFamily: FF, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(250,250,248,0.25)', margin: '0 0 14px' }}>Navegación</p>
            {[['#home','Home'],['#products','Products'],['#portfolio','Portfolio'],['#contact','Contact Us']].map(([href, label]) => (
              <a key={href} href={href} style={linkS}>{label}</a>
            ))}
            <a href="/login" style={{ ...linkS, color: GOLD }}>Login Admin</a>
          </div>
          <div>
            <p style={{ fontFamily: FF, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(250,250,248,0.25)', margin: '0 0 14px' }}>Legal</p>
            {[['/privacy','Política de Privacidad'],['/tos','Términos de Servicio'],['/cookies','Política de Cookies']].map(([href, label]) => (
              <a key={href} href={href} style={linkS}>{label}</a>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid rgba(250,250,248,0.05)', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontFamily: FF, fontSize: 11, color: 'rgba(250,250,248,0.2)', margin: 0 }}>© 2026 Accounting Plus CRM. Hecho en Puerto Rico.</p>
          <div style={{ display: 'flex', gap: 20 }}>
            {[['/privacy','Privacidad'],['/tos','Términos'],['/cookies','Cookies']].map(([href, label]) => (
              <a key={href} href={href} style={{ fontFamily: FF, fontSize: 11, color: 'rgba(250,250,248,0.2)', textDecoration: 'none' }}>{label}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

// ─── Sticky CTA ──────────────────────────────────────────
function StickyCTA() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 500)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <div style={{
      position: 'fixed', inset: 'auto 16px 12px', zIndex: 40,
      opacity: show ? 1 : 0, transform: show ? 'none' : 'translateY(12px)',
      transition: 'opacity 0.3s, transform 0.3s',
      pointerEvents: show ? 'auto' : 'none',
    }}>
      <a href="#contact" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
        maxWidth: 480, margin: '0 auto', height: 50, borderRadius: 8,
        background: INK, padding: '0 6px 0 18px', textDecoration: 'none',
        boxShadow: '0 8px 24px rgba(14,14,12,0.3)',
      }}>
        <span style={{ fontFamily: FF, fontSize: 14, fontWeight: 600, color: CREAM }}>Reserva una consulta gratis</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 38, borderRadius: 5, background: GOLD, padding: '0 14px', fontFamily: FF, fontSize: 12, fontWeight: 700, color: INK }}>
          Contactar <ArrowRight style={{ width: 12, height: 12 }} />
        </span>
      </a>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────
function Stars({ value, size = 14 }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} style={{ width: size, height: size, fill: i < value ? GOLD : 'transparent', color: i < value ? GOLD : LGRAY }} />
      ))}
    </span>
  )
}
