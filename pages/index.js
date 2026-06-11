import Head from 'next/head'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CalendarCheck, PhoneCall, MessageSquare, Users, CreditCard, Globe,
  Sparkles, Star, ArrowRight, Check, ChevronLeft, ChevronRight,
  MapPin, Quote, PhoneIncoming, Shield, FileText, Cookie,
} from 'lucide-react'

const SERVICES = [
  { icon: CalendarCheck, title: 'Sistema de Booking', desc: 'Tus clientes agendan solos, 24/7. Sincronizado con tu calendario y recordatorios automáticos por WhatsApp.' },
  { icon: PhoneCall, title: 'Recepcionista IA · Llamadas', desc: 'Contesta el teléfono con voz natural. Agenda, cancela, responde dudas y te pasa la llamada cuando hace falta.' },
  { icon: MessageSquare, title: 'Recepcionista IA · Mensajes', desc: 'Responde DMs de Instagram, SMS y WhatsApp en segundos. Cierra citas mientras tú trabajas.' },
  { icon: Users, title: 'CRM de Clientes', desc: 'Historial, notas, visitas y gastos por cliente. Sabes quién es rentable y quién está a punto de irse.' },
  { icon: CreditCard, title: 'Tarjeta de Lealtad Digital', desc: 'Apple Wallet, Google Wallet y Samsung Wallet. Sellos, recompensas y notificaciones push.' },
  { icon: Globe, title: 'Página Web del Negocio', desc: 'Entregada en 24 horas, con tu marca, tu booking y tu programa de lealtad integrados.' },
]

const WORKS = [
  { name: 'Road Pizza', tag: 'Website · Editable por el dueño', city: 'Canóvanas, PR', screenshotUrl: 'https://www.roadpizzapr.com/', displayUrl: 'roadpizzapr.com', accent: '#c0392b', services: ['Website', 'Lealtad'] },
  { name: 'La Chiva Chinchorreos', tag: 'Web + Recepcionista IA', city: 'Puerto Rico', screenshotUrl: 'https://www.lachivachinchorreospr.com', displayUrl: 'lachivachinchorreospr.com', accent: '#2d8a60', services: ['Web', 'IA'] },
  { name: 'IM Hair Studio', tag: 'Hair · Nails · Skin', city: 'Carolina, PR', screenshotUrl: 'https://imhairstudio.netlify.app/', displayUrl: 'imhairstudio.netlify.app', accent: '#b8975a', services: ['Booking', 'CRM', 'Lealtad'] },
  { name: 'Pon tu negocio aquí', tag: 'El próximo eres tú', city: 'Puerto Rico', cta: true },
]

const REVIEWS = [
  { name: 'Carlos M.', biz: 'Barbería · San Juan', rating: 5, text: 'El bot contesta llamadas mientras estoy cortando. He triplicado las citas en 2 meses.' },
  { name: 'Yamilet R.', biz: 'Salón de uñas · Bayamón', rating: 5, text: 'Mis clientas agendan solas por WhatsApp. Yo solo veo la agenda lista en la mañana.' },
  { name: 'Dr. Reyes', biz: 'Clínica Dental · Caguas', rating: 5, text: 'Profesionales, rápidos y el sistema corre solo. Recomendado 100%.' },
  { name: 'Luis F.', biz: 'Restaurante · Santurce', rating: 5, text: 'El programa de lealtad llenó el restaurante los lunes. Tremendo trabajo.' },
  { name: 'Maribel S.', biz: 'Spa · Carolina', rating: 5, text: 'La recepcionista IA me contesta los DMs de Instagram en segundos. Ya no pierdo clientas.' },
  { name: 'Jorge A.', biz: 'Auto Detail · Caguas', rating: 5, text: 'Antes anotaba en cuaderno. Ahora todo está en mi celular y sé exactamente cuánto factura cada cliente.' },
  { name: 'Andrea P.', biz: 'Estética · Mayagüez', rating: 5, text: 'El equipo de A+ entendió mi negocio en una sola reunión. Entregaron en una semana.' },
  { name: 'Héctor J.', biz: 'Gym · Ponce', rating: 4, text: 'El booking es bien fácil para mis miembros mayores. Eso fue clave para nosotros.' },
  { name: 'Sofía L.', biz: 'Boutique · San Juan', rating: 5, text: 'La tarjeta digital en Apple Wallet es brutal, mis clientas se vuelven locas.' },
  { name: 'Roberto V.', biz: 'Tatuajes · Río Piedras', rating: 5, text: 'El depósito automático al agendar me eliminó los no-shows completamente.' },
  { name: 'Camille O.', biz: 'Pelu canino · Trujillo Alto', rating: 5, text: 'Soporte rápido, siempre disponibles. Vale cada peso que pagamos.' },
  { name: 'Iván T.', biz: 'Mecánica · Bayamón', rating: 5, text: 'El CRM me dice qué carros vuelven y cuáles no. Ahora hago seguimiento real.' },
  { name: 'Natalia C.', biz: 'Lash Studio · Guaynabo', rating: 5, text: 'Mis clientas reciben recordatorio por WhatsApp y casi no tengo cancelaciones de último minuto.' },
  { name: 'Miguel R.', biz: 'Barbería · Arecibo', rating: 4, text: 'Pasé de agenda en papel a todo digital en una semana. El equipo estuvo pendiente en todo momento.' },
  { name: 'Carmen V.', biz: 'Nutricionista · Caguas', rating: 5, text: 'El sistema de booking profesionalizó mi negocio. Mis pacientes dicen que parece una empresa grande.' },
  { name: 'Eduardo S.', biz: 'Fotografía · San Juan', rating: 5, text: 'Cobro el depósito al agendar y ya no tengo clientes que me dejan plantado en el studio.' },
  { name: 'Patricia L.', biz: 'Yoga Studio · Isabela', rating: 5, text: 'La tarjeta de lealtad digital hizo que mis estudiantes vengan más seguido. Increíble.' },
]

export default function LandingPage() {
  return (
    <>
      <Head>
        <title>A+ CRM — Booking, CRM y Recepcionista IA para Negocios en Puerto Rico</title>
        <meta name="description" content="Consigue más clientes con A+ CRM: sistema de booking online, recepcionista IA que contesta llamadas y WhatsApp 24/7, CRM, tarjeta de lealtad digital y página web. Hecho para negocios en Puerto Rico." />
        <meta name="keywords" content="sistema de booking Puerto Rico, recepcionista IA Puerto Rico, CRM para pequeños negocios, agenda online negocio, booking online barbería, booking salón de belleza, tarjeta de lealtad digital, sistema para restaurantes Puerto Rico, consigue clientes, automatizar negocio Puerto Rico, WhatsApp bot negocio, A+ CRM" />
        <meta name="author" content="Accounting Plus CRM" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://www.accountingpluscrm.com" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.accountingpluscrm.com" />
        <meta property="og:title" content="A+ CRM — Booking, CRM y Recepcionista IA para Negocios en Puerto Rico" />
        <meta property="og:description" content="Consigue más clientes con booking online, recepcionista IA 24/7, CRM y tarjeta de lealtad digital. Hecho para negocios en Puerto Rico." />
        <meta property="og:image" content="https://www.accountingpluscrm.com/og-image.jpg" />
        <meta property="og:locale" content="es_PR" />
        <meta property="og:site_name" content="A+ CRM" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="A+ CRM — Booking, CRM y Recepcionista IA · Puerto Rico" />
        <meta name="twitter:description" content="Consigue más clientes con booking online, recepcionista IA 24/7 y CRM. Hecho para negocios en Puerto Rico." />
        <meta name="twitter:image" content="https://www.accountingpluscrm.com/og-image.jpg" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org", "@type": "LocalBusiness",
          "name": "A+ CRM — Accounting Plus",
          "description": "Sistemas de booking, CRM, recepcionista IA y tarjeta de lealtad digital para negocios en Puerto Rico.",
          "url": "https://www.accountingpluscrm.com",
          "telephone": "+1-787-000-0000",
          "address": { "@type": "PostalAddress", "addressRegion": "PR", "addressCountry": "US" },
          "areaServed": "Puerto Rico",
          "serviceType": ["Sistema de Booking", "CRM", "Recepcionista IA", "Tarjeta de Lealtad Digital", "Página Web"],
          "priceRange": "$$", "sameAs": []
        })}} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <main className="relative min-h-screen overflow-x-clip" style={{ backgroundColor: 'oklch(0.985 0.008 85)', color: 'oklch(0.18 0.012 60)' }}>
        <AmbientBackground />
        <TopNav />
        <Hero />
        <FadeIn><Trust /></FadeIn>
        <FadeIn><Services /></FadeIn>
        <FadeIn><Booking /></FadeIn>
        <FadeIn><AdminPreview /></FadeIn>
        <FadeIn><Showcase /></FadeIn>
        <FadeIn><Reviews /></FadeIn>
        <FadeIn><Footer /></FadeIn>
        <StickyCTA />
      </main>
    </>
  )
}

function FadeIn({ children, delay = 0, className = '' }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold: 0.08 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} className={className} style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(28px)', transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms` }}>
      {children}
    </div>
  )
}

function AmbientBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: -10 }}>
      <div className="absolute -top-32 -right-20 rounded-full bg-gold/30 blur-3xl animate-float-slow" style={{ width: 520, height: 520 }} />
      <div className="absolute -left-24 rounded-full bg-gold/20 blur-3xl animate-float-slower" style={{ top: '40%', width: 400, height: 400 }} />
      <div className="absolute bottom-0 right-1/4 rounded-full bg-gold/10 blur-3xl animate-float-slow" style={{ width: 320, height: 320 }} />
    </div>
  )
}

function TopNav() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <header className="sticky top-0 z-40 w-full transition-all duration-300" style={{
      background: scrolled ? 'rgba(248,246,241,0.82)' : 'rgba(248,246,241,0.55)',
      backdropFilter: 'blur(24px) saturate(180%)',
      borderBottom: scrolled ? '1px solid rgba(184,151,90,0.18)' : '1px solid rgba(255,255,255,0.5)',
      boxShadow: scrolled ? '0 4px 24px -6px rgba(28,28,26,0.1)' : 'none',
    }}>
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <a href="#top" className="flex items-center gap-2.5">
          <span className="font-serif text-xl font-semibold leading-none text-ink" style={{ letterSpacing: '-0.01em' }}>A+</span>
          <span className="text-muted-foreground" style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em' }}>CRM</span>
        </a>
        <nav className="hidden items-center gap-6 md:flex">
          {[['#sistemas','Sistemas'],['#booking','Demo'],['#showcase','Trabajos'],['#resenas','Reseñas']].map(([href,label]) => (
            <a key={href} href={href} className="text-ink/60 hover:text-ink transition-colors" style={{ fontSize: 13, fontWeight: 500 }}>{label}</a>
          ))}
        </nav>
        <a href="#booking" className="bg-ink text-cream inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-xs font-semibold transition-all hover:bg-ink/80 active:scale-95">
          Agendar demo <ArrowRight className="h-3 w-3" />
        </a>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section id="top" className="relative px-4 pt-10 pb-14 md:pt-16 md:pb-20">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
          {/* Text */}
          <div className="text-center md:text-left">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full glass px-3 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-pulse rounded-full bg-gold opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
              </span>
              <span className="text-ink/70" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Hecho en Puerto Rico</span>
            </div>
            <h1 className="font-serif text-ink" style={{ fontSize: 'clamp(38px, 5vw, 58px)', lineHeight: 1.02, letterSpacing: '-0.02em' }}>
              Sistemas que <em className="text-gold">trabajan</em> mientras tú duermes.
            </h1>
            <p className="mx-auto mt-5 text-muted-foreground md:mx-0" style={{ maxWidth: '36ch', fontSize: 15, lineHeight: 1.6 }}>
              Booking, CRM, agendas y un recepcionista IA que contesta llamadas y mensajes 24/7. Todo en un solo sistema, hecho para tu negocio.
            </p>
            <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:justify-center md:justify-start">
              <a href="#booking" className="bg-ink text-cream inline-flex h-12 items-center justify-center gap-2 rounded-full font-semibold transition-transform active:scale-[0.98] px-6" style={{ fontSize: 15 }}>
                Agendar demo gratis <ArrowRight className="h-4 w-4" />
              </a>
              <a href="#showcase" className="glass text-ink/80 inline-flex h-12 items-center justify-center rounded-full font-medium px-6" style={{ fontSize: 15 }}>
                Ver trabajos
              </a>
            </div>
            <div className="mt-6 flex items-center justify-center gap-1.5 text-muted-foreground md:justify-start" style={{ fontSize: 12 }}>
              <Stars value={5} size={12} />
              <span><strong className="text-ink">4.9</strong> · 17 reseñas verificadas</span>
            </div>
          </div>
          {/* Phone */}
          <div className="flex justify-center md:justify-end">
            <div className="relative" style={{ maxWidth: 280, width: '100%' }}>
              <div className="ambient-gold relative">
                <PhoneMockup variant="hoy" />
                <CallBubble />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function CallBubble() {
  return (
    <div className="absolute -right-3 top-6 rotate-3" style={{ width: 180 }}>
      <div className="glass-gold rounded-2xl p-3">
        <div className="flex items-center gap-2">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-ink text-cream">
            <PhoneIncoming className="h-3.5 w-3.5" />
            <span className="absolute inset-0 animate-pulse rounded-full bg-ink/30" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-ink/70" style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Llamada</p>
            <p className="truncate text-ink font-semibold" style={{ fontSize: 11 }}>IA contestando…</p>
          </div>
        </div>
        <div className="mt-2 flex h-4 items-end gap-0.5">
          {[3, 6, 4, 8, 5, 9, 6, 4, 7, 5, 3].map((h, i) => (
            <div key={i} className="w-0.5 rounded-full bg-ink/70" style={{ height: h * 2 }} />
          ))}
        </div>
      </div>
    </div>
  )
}

function PhoneMockup({ variant = 'hoy' }) {
  const citas = [
    { h: '9:00 AM', n: 'María Rivera', s: 'Corte + Tinte', bg: '#b8975a' },
    { h: '10:30 AM', n: 'Carlos Méndez', s: 'Barba clásica', bg: '#0e0e0c' },
    { h: '12:00 PM', n: 'Yamilet Cruz', s: 'Manicure', bg: '#b8975a' },
    { h: '2:00 PM', n: 'Jorge Pagán', s: 'Consulta', bg: '#0e0e0c' },
  ]
  return (
    <div className="glass-dark relative rounded-[36px] p-2 shadow-soft" style={{ aspectRatio: '9/19' }}>
      <div className="absolute left-1/2 top-3 z-10 h-1.5 w-20 -translate-x-1/2 rounded-full bg-ink/40" />
      <div className="flex h-full w-full flex-col overflow-hidden rounded-[28px] bg-cream">
        <div className="flex items-center justify-between px-4 pt-3 text-ink/70" style={{ fontSize: 9, fontWeight: 600 }}>
          <span>9:41</span>
          <span className="flex items-center gap-1">
            <span className="h-1 w-1 rounded-full bg-ink/70" />
            <span className="h-1 w-1 rounded-full bg-ink/70" />
            <span className="h-1 w-1 rounded-full bg-ink/70" />
            <span className="ml-1">100%</span>
          </span>
        </div>
        <div className="px-4 pt-2">
          <p className="text-gold" style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {variant === 'panel' ? 'Panel · Hoy' : 'Buenos días, Ana'}
          </p>
          <p className="font-serif text-ink leading-tight" style={{ fontSize: 15 }}>
            {variant === 'panel' ? 'Lunes, 10 jun' : 'Tienes 4 citas hoy'}
          </p>
        </div>
        <div className="mx-3 mt-2 grid grid-cols-2 gap-1.5">
          {[{ k: 'Citas hoy', v: '4' }, { k: 'Clientes', v: '38' }].map((m) => (
            <div key={m.k} className="rounded-lg p-1.5 text-center" style={{ background: 'oklch(0.18 0.012 60 / 0.05)' }}>
              <p className="text-ink/50" style={{ fontSize: 7, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{m.k}</p>
              <p className="text-ink font-semibold leading-none" style={{ fontSize: 13, fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>{m.v}</p>
            </div>
          ))}
        </div>
        <div className="mx-3 mt-2 rounded-xl p-2" style={{ background: 'linear-gradient(135deg, oklch(0.74 0.115 75 / 0.3), oklch(0.74 0.115 75 / 0.1))' }}>
          <div className="flex items-center gap-1.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-ink text-cream">
              <PhoneIncoming className="h-2.5 w-2.5" />
            </div>
            <p className="text-ink/70" style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>IA Recepcionista</p>
            <span className="ml-auto rounded-full bg-ink px-1.5 py-0.5 text-cream" style={{ fontSize: 7, fontWeight: 700 }}>EN VIVO</span>
          </div>
          <p className="mt-1 text-ink/80" style={{ fontSize: 9, lineHeight: 1.4 }}>"Claro, te puedo agendar el viernes a las 3:00 PM con María…"</p>
        </div>
        <div className="mx-3 mt-2 flex-1 overflow-hidden">
          <p className="text-ink/50" style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Próximas citas</p>
          <div className="mt-1 space-y-1">
            {citas.map((c) => (
              <div key={c.h} className="flex items-center gap-2 rounded-lg border border-ink/5 p-1.5" style={{ background: 'rgba(255,255,255,0.6)' }}>
                <div style={{ background: c.bg, width: 40, height: 28, borderRadius: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 7, fontWeight: 700, lineHeight: 1, color: '#fff' }}>{c.h.split(' ')[0]}</span>
                  <span style={{ fontSize: 6, fontWeight: 600, lineHeight: 1, color: 'rgba(255,255,255,0.8)' }}>{c.h.split(' ')[1]}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-ink font-semibold" style={{ fontSize: 9, lineHeight: 1.2 }}>{c.n}</p>
                  <p className="truncate text-ink/60" style={{ fontSize: 7.5 }}>{c.s}</p>
                </div>
                <Check className="h-2.5 w-2.5 text-gold" />
              </div>
            ))}
          </div>
        </div>
        <div className="mx-2 mb-2 mt-1 grid grid-cols-4 gap-1 rounded-xl p-1.5 bg-ink/90">
          {[{ i: CalendarCheck, k: 'Agenda', a: true }, { i: Users, k: 'Clientes' }, { i: MessageSquare, k: 'Chats' }, { i: CreditCard, k: 'Pagos' }].map((t) => (
            <div key={t.k} className={`flex flex-col items-center gap-0.5 rounded-lg py-1 ${t.a ? 'bg-gold text-ink' : 'text-cream/70'}`}>
              <t.i className="h-2.5 w-2.5" />
              <span style={{ fontSize: 7, fontWeight: 600 }}>{t.k}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Trust() {
  const items = [
    { k: '89+', v: 'Negocios activos' },
    { k: '24/7', v: 'Recepcionista IA' },
    { k: '<24h', v: 'Entrega de web' },
    { k: '4.9★', v: 'Satisfacción' },
  ]
  return (
    <section className="px-4 pb-10">
      <div className="mx-auto max-w-6xl">
        <div className="glass grid grid-cols-2 gap-px overflow-hidden rounded-2xl md:grid-cols-4">
          {items.map((it) => (
            <div key={it.v} className="p-5 text-center" style={{ background: 'oklch(0.985 0.008 85 / 0.4)' }}>
              <p className="font-serif text-ink text-2xl md:text-3xl" style={{ fontVariantNumeric: 'lining-nums', fontFeatureSettings: '"lnum" 1' }}>{it.k}</p>
              <p className="mt-1 text-muted-foreground" style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{it.v}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Services() {
  return (
    <section id="sistemas" className="px-4 pb-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 md:text-center">
          <SectionLabel>Sistemas</SectionLabel>
          <h2 className="mt-2 font-serif text-ink" style={{ fontSize: 'clamp(28px, 4vw, 42px)', lineHeight: 1.05 }}>
            Todo lo que tu negocio necesita, <em className="text-gold">en un solo lugar.</em>
          </h2>
          <p className="mt-3 text-muted-foreground md:mx-auto" style={{ fontSize: 14, maxWidth: '44ch' }}>
            Cada sistema funciona solo. Juntos, automatizan el 90% de tu operación.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <ServiceCard key={s.title} {...s} />
          ))}
        </div>
      </div>
    </section>
  )
}

function ServiceCard({ icon: Icon, title, desc }) {
  return (
    <article className="glass relative overflow-hidden rounded-2xl p-4 transition-transform active:scale-[0.99]">
      <div className="flex items-start gap-3">
        <div className="glass-gold flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
          <Icon className="h-5 w-5 text-ink" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-ink font-semibold leading-tight" style={{ fontSize: 15 }}>{title}</h3>
          <p className="mt-1 text-muted-foreground leading-relaxed" style={{ fontSize: 13 }}>{desc}</p>
        </div>
      </div>
    </article>
  )
}

function Booking() {
  const [step, setStep] = useState('form')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [business, setBusiness] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const dates = useMemo(() => {
    const arr = [], today = new Date()
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    for (let i = 1; i <= 7; i++) {
      const d = new Date(today); d.setDate(today.getDate() + i)
      arr.push({ label: String(d.getDate()), sub: `${dias[d.getDay()]} · ${meses[d.getMonth()]}`, iso: d.toISOString().slice(0, 10) })
    }
    return arr
  }, [])

  const slots = ['9:00 AM', '10:30 AM', '12:00 PM', '2:00 PM', '3:30 PM', '5:00 PM']

  async function handleSubmit(e) {
    e.preventDefault(); setLoading(true); setError(null)
    try {
      const res = await fetch('/api/admin/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, phone, business, date, time }) })
      if (!res.ok) throw new Error()
      setStep('done')
    } catch { setError('Hubo un error. Inténtalo de nuevo o escríbenos al WhatsApp.') }
    finally { setLoading(false) }
  }

  return (
    <section id="booking" className="relative px-4 py-16">
      <div className="absolute inset-x-0 rounded-full blur-3xl" style={{ top: '33%', zIndex: -10, margin: '0 auto', height: 320, maxWidth: '40rem', background: 'oklch(0.74 0.115 75 / 0.22)' }} />
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 md:grid-cols-2 md:items-start md:gap-16">
          {/* Left: copy */}
          <div>
            <SectionLabel>Reserva tu demo</SectionLabel>
            <h2 className="mt-2 font-serif text-ink" style={{ fontSize: 'clamp(28px, 4vw, 44px)', lineHeight: 1.05 }}>
              15 minutos. <em className="text-gold">Cero compromiso.</em>
            </h2>
            <p className="mt-3 text-muted-foreground" style={{ fontSize: 14 }}>
              Te mostramos el sistema funcionando con tu tipo de negocio. Tú decides si te sirve.
            </p>
            <div className="mt-8 space-y-4">
              {[
                { icon: CalendarCheck, t: 'Demo personalizado', d: 'Adaptado a tu industria y tipo de negocio.' },
                { icon: MessageSquare, t: 'Sin presión de ventas', d: 'Te enseñamos el sistema y respondes tus dudas.' },
                { icon: Check, t: 'Confirmas por WhatsApp', d: 'Recibes confirmación en menos de una hora.' },
              ].map(x => (
                <div key={x.t} className="flex gap-3">
                  <div className="glass-gold flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
                    <x.icon className="h-4 w-4 text-ink" />
                  </div>
                  <div>
                    <p className="text-ink font-semibold" style={{ fontSize: 13 }}>{x.t}</p>
                    <p className="text-muted-foreground" style={{ fontSize: 12 }}>{x.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Right: form */}
          <div>
            {step === 'form' ? (
              <form className="glass rounded-3xl p-5" onSubmit={handleSubmit}>
                <p className="text-muted-foreground" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Elige un día</p>
                <div className="mt-2 -mx-1 flex gap-2 overflow-x-auto pb-1 px-1">
                  {dates.map((d) => {
                    const active = date === d.iso
                    return (
                      <button type="button" key={d.iso} onClick={() => setDate(d.iso)}
                        className={`flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-2xl border transition-all ${active ? 'bg-ink text-cream border-ink glow-gold' : 'border-border text-ink'}`}
                        style={!active ? { background: 'oklch(0.985 0.008 85 / 0.6)' } : {}}>
                        <span className="font-serif text-xl leading-none" style={{ fontVariantNumeric: 'lining-nums', fontFeatureSettings: '"lnum" 1' }}>{d.label}</span>
                        <span className={`mt-1 ${active ? 'text-cream/70' : 'text-muted-foreground'}`} style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{d.sub}</span>
                      </button>
                    )
                  })}
                </div>
                <p className="mt-5 text-muted-foreground" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Elige una hora</p>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {slots.map((s) => {
                    const active = time === s
                    return (
                      <button type="button" key={s} onClick={() => setTime(s)}
                        className={`h-10 rounded-xl border text-sm font-semibold transition-all ${active ? 'bg-gold text-ink border-gold' : 'text-ink/80 border-border'}`}
                        style={!active ? { background: 'oklch(0.985 0.008 85 / 0.6)' } : {}}>
                        {s}
                      </button>
                    )
                  })}
                </div>
                <div className="mt-5 space-y-2.5">
                  <input required value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre" className="h-12 w-full rounded-xl border border-border px-4 text-ink outline-none placeholder:text-muted-foreground focus:border-gold" style={{ fontSize: 14, background: 'oklch(0.985 0.008 85 / 0.6)' }} />
                  <input required type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="WhatsApp o teléfono" className="h-12 w-full rounded-xl border border-border px-4 text-ink outline-none placeholder:text-muted-foreground focus:border-gold" style={{ fontSize: 14, background: 'oklch(0.985 0.008 85 / 0.6)' }} />
                  <input required value={business} onChange={e => setBusiness(e.target.value)} placeholder="Nombre del negocio" className="h-12 w-full rounded-xl border border-border px-4 text-ink outline-none placeholder:text-muted-foreground focus:border-gold" style={{ fontSize: 14, background: 'oklch(0.985 0.008 85 / 0.6)' }} />
                </div>
                {error && <p className="mt-3 text-center" style={{ fontSize: 12, color: '#c0392b' }}>{error}</p>}
                <button type="submit" disabled={!date || !time || loading}
                  className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink text-cream font-semibold transition-transform active:scale-[0.98] disabled:opacity-40"
                  style={{ fontSize: 15 }}>
                  {loading ? 'Enviando…' : 'Confirmar reserva'}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </button>
                <p className="mt-3 text-center text-muted-foreground" style={{ fontSize: 11 }}>Te confirmamos por WhatsApp en menos de 1 hora.</p>
              </form>
            ) : (
              <div className="glass-gold rounded-3xl p-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-ink text-cream">
                  <Check className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-serif text-ink text-2xl">¡Reserva confirmada!</h3>
                <p className="mt-2 text-ink/70" style={{ fontSize: 13 }}>Te escribimos al WhatsApp con los detalles.</p>
                <button onClick={() => { setStep('form'); setName(''); setPhone(''); setBusiness(''); setDate(''); setTime('') }} className="mt-5 text-ink underline underline-offset-2" style={{ fontSize: 12, fontWeight: 600 }}>
                  Reservar otra
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function AdminPreview() {
  return (
    <section className="relative px-4 py-16">
      <div className="absolute inset-x-0 top-0 mx-auto h-72 max-w-5xl rounded-[40px] blur-2xl" style={{ zIndex: -10, background: 'linear-gradient(to bottom, oklch(0.74 0.115 75 / 0.2), transparent)' }} />
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
          {/* Phone mockup */}
          <div className="flex justify-center md:order-first">
            <div className="relative" style={{ maxWidth: 260, width: '100%' }}>
              <PhoneMockup variant="panel" />
              <div className="absolute -left-3 top-16 glass rounded-xl px-3 py-2 shadow-soft -rotate-6">
                <p className="text-gold" style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Hoy</p>
                <p className="text-ink text-sm font-semibold">12 citas</p>
              </div>
              <div className="absolute -right-2 bottom-24 glass-gold rounded-xl px-3 py-2 rotate-3">
                <p className="text-ink/70" style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Ingresos</p>
                <p className="text-ink text-sm font-semibold">$1,840</p>
              </div>
            </div>
          </div>
          {/* Text */}
          <div>
            <SectionLabel>Tu panel</SectionLabel>
            <h2 className="mt-2 font-serif text-ink" style={{ fontSize: 'clamp(28px, 4vw, 44px)', lineHeight: 1.05 }}>
              Así se ve <em className="text-gold">tu día</em> desde el celular.
            </h2>
            <p className="mt-3 text-muted-foreground" style={{ fontSize: 14 }}>
              Citas, clientes, pagos y llamadas de la IA — todo en una sola pantalla. Desde cualquier dispositivo.
            </p>
            <div className="mt-6 grid grid-cols-3 gap-2 text-center">
              {[{ k: 'Booking', icon: CalendarCheck }, { k: 'Clientes', icon: Users }, { k: 'Pagos', icon: CreditCard }].map((x) => (
                <div key={x.k} className="glass rounded-xl p-3">
                  <x.icon className="mx-auto h-4 w-4 text-gold" />
                  <p className="mt-1.5 text-ink font-semibold" style={{ fontSize: 11 }}>{x.k}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Showcase() {
  return (
    <section id="showcase" className="px-4 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 md:text-center">
          <SectionLabel>Showcase local</SectionLabel>
          <h2 className="mt-2 font-serif text-ink" style={{ fontSize: 'clamp(28px, 4vw, 42px)', lineHeight: 1.05 }}>
            Trabajos <em className="text-gold">ya hechos.</em>
          </h2>
          <p className="mt-3 text-muted-foreground" style={{ maxWidth: '40ch', margin: '0.75rem auto 0' }}>
            Negocios reales en Puerto Rico operando con A+ CRM.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {WORKS.map((w) =>
            w.cta ? (
              <a key={w.name} href="#booking" className="glass-gold group relative flex flex-col overflow-hidden rounded-2xl p-1.5">
                <div className="relative flex aspect-[4/3] w-full flex-col items-center justify-center overflow-hidden rounded-xl text-center" style={{ background: 'linear-gradient(135deg, oklch(0.74 0.115 75 / 0.3), oklch(0.985 0.008 85), oklch(0.74 0.115 75 / 0.2))' }}>
                  <Sparkles className="h-7 w-7 text-gold" />
                  <p className="mt-2 px-3 font-serif text-ink" style={{ fontSize: 17, lineHeight: 1.2 }}>
                    El próximo<br /><em className="text-gold">eres tú.</em>
                  </p>
                  <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-ink px-2.5 py-1 text-cream" style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Reservar demo <ArrowRight className="h-2.5 w-2.5" />
                  </span>
                </div>
                <div className="px-2 pb-2 pt-2.5">
                  <p className="text-ink font-semibold leading-tight" style={{ fontSize: 13 }}>{w.name}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-muted-foreground" style={{ fontSize: 10 }}>
                    <MapPin className="h-2.5 w-2.5" /> {w.city}
                  </p>
                </div>
              </a>
            ) : (
              <ShowcaseCard key={w.name} work={w} />
            )
          )}
        </div>
      </div>
    </section>
  )
}

function ShowcaseCard({ work: w }) {
  const [imgErr, setImgErr] = useState(false)
  const thumb = `https://image.thum.io/get/width/400/crop/700/noanimate/${w.screenshotUrl}`
  return (
    <article className="glass group overflow-hidden rounded-2xl" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Tall portrait screenshot — phone-like */}
      <div style={{ aspectRatio: '9/16', overflow: 'hidden', position: 'relative', background: `linear-gradient(135deg, ${w.accent}18, ${w.accent}06)`, borderRadius: '14px 14px 0 0' }}>
        {!imgErr ? (
          <img
            src={thumb}
            alt={w.name}
            onError={() => setImgErr(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', display: 'block', transition: 'transform 0.5s ease' }}
            className="group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: w.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 24px ${w.accent}40` }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: '#fff', fontFamily: 'Georgia, serif' }}>{w.name[0]}</span>
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center', padding: '0 16px' }}>
              {w.services.map(s => (
                <span key={s} style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', background: w.accent + '20', color: w.accent, padding: '2px 6px', borderRadius: 20, border: `1px solid ${w.accent}30` }}>{s}</span>
              ))}
            </div>
          </div>
        )}
        {/* Services pills overlay */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(14,14,12,0.7) 0%, transparent 100%)', padding: '24px 10px 10px', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {w.services.map(s => (
            <span key={s} style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', color: '#fff', padding: '2px 7px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.25)' }}>{s}</span>
          ))}
        </div>
      </div>
      {/* Info — name is a link to the website */}
      <div style={{ padding: '10px 12px 12px' }}>
        <a href={w.screenshotUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#0e0e0c', lineHeight: 1.2, display: 'flex', alignItems: 'center', gap: 4 }}>
            {w.name}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#b8975a" strokeWidth="2.5"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </p>
        </a>
        <p style={{ marginTop: 3, fontSize: 10, color: '#6b6b67', display: 'flex', alignItems: 'center', gap: 3 }}>
          <MapPin className="h-2.5 w-2.5" /> {w.city}
        </p>
      </div>
    </article>
  )
}

function Reviews() {
  const [page, setPage] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const perPage = 3
  const totalPages = Math.ceil(REVIEWS.length / perPage)
  const visible = REVIEWS.slice(page * perPage, page * perPage + perPage)

  return (
    <section id="resenas" className="px-4 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <SectionLabel>Lo que dicen</SectionLabel>
            <h2 className="mt-2 font-serif text-ink" style={{ fontSize: 'clamp(28px, 4vw, 42px)', lineHeight: 1.05 }}>
              <em className="text-gold">17 reseñas</em> verificadas.
            </h2>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-gold justify-end">
              <Stars value={5} size={14} />
            </div>
            <p className="mt-1 text-muted-foreground" style={{ fontSize: 11, fontWeight: 600 }}>4.9 promedio</p>
          </div>
        </div>

        {/* Rating breakdown */}
        <div className="glass mb-6 rounded-2xl p-4 md:max-w-sm">
          {[{ stars: 5, pct: 94 }, { stars: 4, pct: 6 }, { stars: 3, pct: 0 }, { stars: 2, pct: 0 }, { stars: 1, pct: 0 }].map((r) => (
            <div key={r.stars} className="flex items-center gap-2 mb-1" style={{ fontSize: 11 }}>
              <span className="text-ink font-semibold" style={{ width: 12 }}>{r.stars}</span>
              <Star className="h-3 w-3 fill-gold text-gold" />
              <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: 'oklch(0.18 0.012 60 / 0.1)' }}>
                <div className="h-full rounded-full bg-gold" style={{ width: `${r.pct}%` }} />
              </div>
              <span className="text-right text-muted-foreground" style={{ width: 32 }}>{r.pct}%</span>
            </div>
          ))}
        </div>

        {/* Review grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((r, i) => (
            <ReviewCard key={`${page}-${i}`} review={r} />
          ))}
        </div>

        {/* Pagination */}
        <div className="mt-5 flex items-center justify-between">
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
            className="glass inline-flex h-10 w-10 items-center justify-center rounded-full disabled:opacity-40" aria-label="Anteriores">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="text-muted-foreground" style={{ fontSize: 11, fontWeight: 600 }}>
            {page * perPage + 1}–{Math.min((page + 1) * perPage, REVIEWS.length)} de {REVIEWS.length}
          </p>
          <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
            className="glass inline-flex h-10 w-10 items-center justify-center rounded-full disabled:opacity-40" aria-label="Siguientes">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Write review */}
        <div className="mt-8">
          {!showForm ? (
            <button onClick={() => setShowForm(true)} className="glass inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-ink font-semibold transition-all hover:shadow-md" style={{ fontSize: 13 }}>
              <Star className="h-4 w-4 text-gold" /> Escribe tu reseña
            </button>
          ) : (
            <ReviewForm onClose={() => setShowForm(false)} />
          )}
        </div>

        {/* Marquee */}
        <div className="mt-8 overflow-hidden" style={{ WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)' }}>
          <div className="flex gap-2 animate-marquee" style={{ width: 'max-content' }}>
            {[...Array(2)].map((_, k) =>
              ['Barberías', 'Salones', 'Clínicas', 'Restaurantes', 'Spas', 'Gyms', 'Detailing', 'Boutiques', 'Lash Studios', 'Fotógrafos'].map((t) => (
                <span key={`${k}-${t}`} className="glass shrink-0 rounded-full px-3 py-1.5 text-ink/70" style={{ fontSize: 11, fontWeight: 600 }}>{t}</span>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function ReviewForm({ onClose }) {
  const [name, setName] = useState('')
  const [biz, setBiz] = useState('')
  const [rating, setRating] = useState(5)
  const [text, setText] = useState('')
  const [status, setStatus] = useState('idle')

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, business: biz, rating, text }),
      })
      if (!res.ok) throw new Error()
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <div className="glass-gold rounded-2xl p-6 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-ink text-cream">
          <Check className="h-4 w-4" />
        </div>
        <h3 className="mt-3 font-serif text-ink text-lg">¡Gracias por tu reseña!</h3>
        <p className="mt-1 text-ink/70" style={{ fontSize: 13 }}>La revisaremos y la publicaremos pronto.</p>
        <button onClick={onClose} className="mt-4 text-ink underline underline-offset-2" style={{ fontSize: 12, fontWeight: 600 }}>Cerrar</button>
      </div>
    )
  }

  return (
    <form className="glass rounded-2xl p-5" onSubmit={handleSubmit}>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-ink font-semibold" style={{ fontSize: 15 }}>Tu reseña</p>
        <button type="button" onClick={onClose} className="text-muted-foreground hover:text-ink" style={{ fontSize: 20 }}>×</button>
      </div>
      {/* Star rating */}
      <p className="text-muted-foreground mb-1" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Calificación</p>
      <div className="mb-4 flex gap-1">
        {[1,2,3,4,5].map(n => (
          <button type="button" key={n} onClick={() => setRating(n)}>
            <Star className="h-6 w-6 transition-colors" style={{ fill: n <= rating ? '#b8975a' : 'transparent', color: n <= rating ? '#b8975a' : '#d1cec7' }} />
          </button>
        ))}
      </div>
      <div className="space-y-2.5">
        <input required value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre" className="h-11 w-full rounded-xl border border-border px-4 text-ink outline-none placeholder:text-muted-foreground focus:border-gold" style={{ fontSize: 14, background: 'oklch(0.985 0.008 85 / 0.6)' }} />
        <input required value={biz} onChange={e => setBiz(e.target.value)} placeholder="Tu negocio · Ciudad" className="h-11 w-full rounded-xl border border-border px-4 text-ink outline-none placeholder:text-muted-foreground focus:border-gold" style={{ fontSize: 14, background: 'oklch(0.985 0.008 85 / 0.6)' }} />
        <textarea required value={text} onChange={e => setText(e.target.value)} placeholder="Cuéntanos tu experiencia…" rows={3} className="w-full rounded-xl border border-border px-4 py-3 text-ink outline-none placeholder:text-muted-foreground focus:border-gold resize-none" style={{ fontSize: 14, background: 'oklch(0.985 0.008 85 / 0.6)' }} />
      </div>
      {status === 'error' && <p className="mt-2 text-center" style={{ fontSize: 12, color: '#c0392b' }}>Error al enviar. Inténtalo de nuevo.</p>}
      <p className="mt-3 text-muted-foreground" style={{ fontSize: 11 }}>Tu reseña será revisada antes de publicarse.</p>
      <button type="submit" disabled={status === 'loading'}
        className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-ink text-cream font-semibold disabled:opacity-40"
        style={{ fontSize: 14 }}>
        {status === 'loading' ? 'Enviando…' : 'Enviar reseña'}
      </button>
    </form>
  )
}

function ReviewCard({ review }) {
  return (
    <article className="glass relative rounded-2xl p-4">
      <Quote className="absolute right-3 top-3 h-5 w-5" style={{ color: 'oklch(0.74 0.115 75 / 0.4)' }} />
      <div className="flex items-center gap-1 text-gold">
        <Stars value={review.rating} size={12} />
      </div>
      <p className="mt-2 text-ink/85 leading-relaxed" style={{ fontSize: 13.5 }}>"{review.text}"</p>
      <div className="mt-3 flex items-center gap-2.5">
        <div className="glass-gold flex h-8 w-8 items-center justify-center rounded-full text-ink font-bold" style={{ fontSize: 11 }}>
          {review.name.split(' ').map((p) => p[0]).join('')}
        </div>
        <div>
          <p className="text-ink font-semibold leading-tight" style={{ fontSize: 12 }}>{review.name}</p>
          <p className="text-muted-foreground" style={{ fontSize: 10 }}>{review.biz}</p>
        </div>
      </div>
    </article>
  )
}

function Footer() {
  return (
    <footer className="px-4 pb-28 pt-6 md:pb-10">
      <div className="glass mx-auto max-w-6xl rounded-3xl p-6 md:p-8">
        <div className="grid gap-8 md:grid-cols-3 md:items-start">
          {/* Brand */}
          <div>
            <p className="font-serif text-ink text-2xl">A+ CRM</p>
            <p className="mt-1 text-muted-foreground" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Accounting Plus · Puerto Rico</p>
            <p className="mt-3 text-muted-foreground" style={{ fontSize: 12, lineHeight: 1.6 }}>Sistemas inteligentes para negocios que quieren crecer sin trabajar más horas.</p>
          </div>
          {/* Links */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 md:col-span-2">
            <div>
              <p className="text-ink font-semibold mb-2" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Navegación</p>
              {[['#sistemas','Sistemas'],['#booking','Reservar demo'],['#showcase','Trabajos'],['#resenas','Reseñas']].map(([href, label]) => (
                <a key={href} href={href} className="block text-muted-foreground hover:text-ink transition-colors mb-1" style={{ fontSize: 13 }}>{label}</a>
              ))}
              <a href="/login" className="block text-gold hover:text-ink transition-colors font-semibold mt-1" style={{ fontSize: 13 }}>Login Admin</a>
            </div>
            <div>
              <p className="text-ink font-semibold mb-2" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Legal</p>
              {[['/privacy','Política de Privacidad'],['/tos','Términos de Servicio'],['/cookies','Política de Cookies']].map(([href, label]) => (
                <a key={href} href={href} className="block text-muted-foreground hover:text-ink transition-colors mb-1" style={{ fontSize: 13 }}>{label}</a>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-6 border-t border-border pt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-muted-foreground" style={{ fontSize: 11 }}>© 2026 A+ CRM. Hecho con cariño en Puerto Rico.</p>
          <div className="flex items-center gap-4" style={{ fontSize: 11, color: '#6b6b67' }}>
            <a href="/privacy" className="hover:text-ink transition-colors flex items-center gap-1"><Shield className="h-3 w-3" /> Privacidad</a>
            <a href="/tos" className="hover:text-ink transition-colors flex items-center gap-1"><FileText className="h-3 w-3" /> Términos</a>
            <a href="/cookies" className="hover:text-ink transition-colors flex items-center gap-1"><Cookie className="h-3 w-3" /> Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

function StickyCTA() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <div className={`fixed inset-x-0 bottom-3 z-40 px-4 transition-all duration-300 ${show ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0 pointer-events-none'}`}>
      <a href="#booking" className="glass-dark mx-auto flex h-12 max-w-md items-center justify-between gap-3 rounded-full px-2 pl-5 text-cream">
        <span className="font-semibold" style={{ fontSize: 14 }}>Reserva tu demo gratis</span>
        <span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-gold px-4 text-ink font-bold" style={{ fontSize: 12 }}>
          Agendar <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </a>
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <div className="inline-flex items-center gap-2">
      <span className="h-px w-6 bg-gold" />
      <span className="text-gold" style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.22em' }}>{children}</span>
    </div>
  )
}

function Stars({ value, size = 14 }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} style={{ width: size, height: size }} className={i < value ? 'fill-gold text-gold' : 'text-ink/15'} />
      ))}
    </span>
  )
}
