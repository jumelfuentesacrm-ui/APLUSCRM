import Head from 'next/head'
import { useEffect, useMemo, useState } from 'react'
import {
  CalendarCheck,
  PhoneCall,
  MessageSquare,
  Users,
  CreditCard,
  Globe,
  Sparkles,
  Star,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Quote,
  PhoneIncoming,
} from 'lucide-react'

const SERVICES = [
  {
    icon: CalendarCheck,
    title: 'Sistema de Booking',
    desc: 'Tus clientes agendan solos, 24/7. Sincronizado con tu calendario y recordatorios automáticos por WhatsApp.',
  },
  {
    icon: PhoneCall,
    title: 'Recepcionista IA · Llamadas',
    desc: 'Contesta el teléfono con voz natural. Agenda, cancela, responde dudas y te pasa la llamada cuando hace falta.',
  },
  {
    icon: MessageSquare,
    title: 'Recepcionista IA · Mensajes',
    desc: 'Responde DMs de Instagram, SMS y WhatsApp en segundos. Cierra citas mientras tú trabajas.',
  },
  {
    icon: Users,
    title: 'CRM de Clientes',
    desc: 'Historial, notas, visitas y gastos por cliente. Sabes quién es rentable y quién está a punto de irse.',
  },
  {
    icon: CreditCard,
    title: 'Tarjeta de Lealtad Digital',
    desc: 'Apple Wallet, Google Wallet y Samsung Wallet. Sellos, recompensas y notificaciones push.',
  },
  {
    icon: Globe,
    title: 'Página Web del Negocio',
    desc: 'Entregada en 24 horas, con tu marca, tu booking y tu programa de lealtad integrados.',
  },
]

const WORKS = [
  { img: '/work-roadpizza.jpg', name: 'Road Pizza', tag: 'Food Truck · Booking + Lealtad', city: 'Canóvanas, PR' },
  { img: '/work-chiva.jpg', name: 'La Chiva Chinchorreos PR', tag: 'Web + Recepcionista IA', city: 'Puerto Rico' },
  { img: '/work-imhair.jpg', name: 'IM Hair Studio', tag: 'Hair · Nails · Skin', city: 'Carolina, PR' },
  { name: 'Pon tu negocio aquí', tag: 'El próximo eres tú', city: 'Puerto Rico', cta: true },
]

const REVIEW_POOL = [
  { name: 'Carlos M.', biz: 'Barbería · San Juan', rating: 5, text: 'El bot contesta llamadas mientras estoy cortando. He triplicado las citas en 2 meses.' },
  { name: 'Yamilet R.', biz: 'Salón de uñas · Bayamón', rating: 5, text: 'Mis clientas agendan solas por WhatsApp. Yo solo veo la agenda lista en la mañana.' },
  { name: 'Dr. Reyes', biz: 'Clínica Dental · Caguas', rating: 5, text: 'Profesionales, rápidos y el sistema corre solo. Recomendado 100%.' },
  { name: 'Luis F.', biz: 'Restaurante · Santurce', rating: 5, text: 'El programa de lealtad llenó el restaurante los lunes. Tremendo trabajo.' },
  { name: 'Maribel S.', biz: 'Spa · Carolina', rating: 5, text: 'La recepcionista IA me contesta los DMs de Instagram en segundos. Ya no pierdo clientas.' },
  { name: 'Jorge A.', biz: 'Auto Detail · Caguas', rating: 5, text: 'Antes anotaba en cuaderno. Ahora todo está en mi celular y sé exactamente cuánto factura cada cliente.' },
  { name: 'Andrea P.', biz: 'Estética · Mayagüez', rating: 5, text: 'El equipo de A+ entendió mi negocio en una sola reunión. Entregaron en una semana.' },
  { name: 'Héctor J.', biz: 'Gym · Ponce', rating: 4, text: 'El booking es bien fácil para mis miembros mayores. Eso fue clave.' },
  { name: 'Sofía L.', biz: 'Boutique · San Juan', rating: 5, text: 'La tarjeta digital en Apple Wallet es brutal, mis clientas se vuelven locas.' },
  { name: 'Roberto V.', biz: 'Tatuajes · Río Piedras', rating: 5, text: 'El depósito automático al agendar me eliminó los no-shows.' },
  { name: 'Camille O.', biz: 'Pelu canino · Trujillo Alto', rating: 5, text: 'Soporte rápido, siempre disponibles. Vale cada peso.' },
  { name: 'Iván T.', biz: 'Mecánica · Bayamón', rating: 5, text: 'El CRM me dice qué carros vuelven y cuáles no. Ahora hago seguimiento real.' },
]

export default function LandingPage() {
  return (
    <>
      <Head>
        <title>A+ CRM — Sistemas, Booking y Recepcionista IA para tu negocio</title>
        <meta name="description" content="Construimos sistemas a la medida: booking, CRM, agendas y recepcionista IA por llamadas y mensajes. Puerto Rico." />
        <meta property="og:title" content="A+ CRM — Sistemas, Booking y Recepcionista IA para tu negocio" />
        <meta property="og:description" content="Construimos sistemas a la medida: booking, CRM, agendas y recepcionista IA por llamadas y mensajes. Puerto Rico." />
        <meta property="og:type" content="website" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <main className="relative min-h-screen overflow-x-clip" style={{ backgroundColor: 'oklch(0.985 0.008 85)', color: 'oklch(0.18 0.012 60)' }}>
        <AmbientBackground />
        <TopNav />
        <Hero />
        <Trust />
        <Services />
        <AdminPreview />
        <Showcase />
        <Reviews />
        <Booking />
        <Footer />
        <StickyCTA />
      </main>
    </>
  )
}

function AmbientBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: -10 }}>
      <div className="absolute -top-32 -right-20 rounded-full bg-gold/30 blur-3xl animate-float-slow" style={{ width: 420, height: 420 }} />
      <div className="absolute -left-24 rounded-full bg-gold/20 blur-3xl animate-float-slower" style={{ top: '40%', width: 360, height: 360 }} />
      <div className="absolute bottom-0 right-1/4 rounded-full bg-gold/10 blur-3xl animate-float-slow" style={{ width: 300, height: 300 }} />
    </div>
  )
}

function TopNav() {
  return (
    <header className="sticky top-0 z-40 px-4 pt-3">
      <div className="glass mx-auto flex h-12 max-w-md items-center justify-between rounded-full px-3">
        <a href="#top" className="flex items-center gap-2 pl-2">
          <span className="font-serif text-lg font-semibold leading-none text-ink">A+</span>
          <span className="text-muted-foreground" style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.18em' }}>
            CRM
          </span>
        </a>
        <a
          href="#booking"
          className="bg-ink text-cream inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition-transform active:scale-95"
        >
          Agendar
          <ArrowRight className="h-3 w-3" />
        </a>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section id="top" className="relative px-4 pt-8 pb-10">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full glass px-3 py-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-pulse rounded-full bg-gold opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
          </span>
          <span className="text-ink/70" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
            Hecho en Puerto Rico
          </span>
        </div>

        <h1 className="font-serif text-ink" style={{ fontSize: 44, lineHeight: 1.02, letterSpacing: '-0.02em' }}>
          Sistemas que <em className="text-gold">trabajan</em> mientras tú duermes.
        </h1>

        <p className="mx-auto mt-5 text-muted-foreground" style={{ maxWidth: '34ch', fontSize: 15, lineHeight: 1.6 }}>
          Booking, CRM, agendas y un recepcionista IA que contesta llamadas y mensajes 24/7. Todo en
          un solo sistema, hecho para tu negocio.
        </p>

        <div className="mt-7 flex flex-col gap-2.5">
          <a
            href="#booking"
            className="bg-ink text-cream inline-flex h-12 items-center justify-center gap-2 rounded-full font-semibold transition-transform active:scale-[0.98]"
            style={{ fontSize: 15 }}
          >
            Agendar demo gratis
            <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="#showcase"
            className="glass text-ink/80 inline-flex h-12 items-center justify-center rounded-full font-medium"
            style={{ fontSize: 15 }}
          >
            Ver trabajos
          </a>
        </div>

        <div className="mt-6 flex items-center justify-center gap-1.5 text-muted-foreground" style={{ fontSize: 12 }}>
          <Stars value={5} size={12} />
          <span>
            <strong className="text-ink">4.9</strong> · 89 reseñas verificadas
          </span>
        </div>
      </div>

      <div className="relative mx-auto mt-10" style={{ maxWidth: 280 }}>
        <div className="ambient-gold relative">
          <PhoneMockup variant="hoy" />
          <CallBubble />
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
    { h: '9:00 AM', n: 'María Rivera', s: 'Corte + Tinte', c: 'bg-gold' },
    { h: '10:30 AM', n: 'Carlos Méndez', s: 'Barba clásica', c: 'bg-ink/70' },
    { h: '12:00 PM', n: 'Yamilet Cruz', s: 'Manicure', c: 'bg-gold' },
    { h: '2:00 PM', n: 'Jorge Pagán', s: 'Consulta', c: 'bg-ink/70' },
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
        <div className="mx-3 mt-2 grid grid-cols-3 gap-1.5">
          {[{ k: 'Citas', v: '12' }, { k: 'Ingresos', v: '$840' }, { k: 'Nuevos', v: '3' }].map((m) => (
            <div key={m.k} className="rounded-lg p-1.5 text-center" style={{ background: 'oklch(0.18 0.012 60 / 0.05)' }}>
              <p className="text-ink/50" style={{ fontSize: 7, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{m.k}</p>
              <p className="font-serif text-ink leading-none" style={{ fontSize: 12 }}>{m.v}</p>
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
          <p className="mt-1 text-ink/80" style={{ fontSize: 9, lineHeight: 1.4 }}>
            "Claro, te puedo agendar el viernes a las 3:00 PM con María…"
          </p>
        </div>
        <div className="mx-3 mt-2 flex-1 overflow-hidden">
          <p className="text-ink/50" style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Próximas citas</p>
          <div className="mt-1 space-y-1">
            {citas.map((c) => (
              <div key={c.h} className="flex items-center gap-2 rounded-lg border border-ink/5 p-1.5" style={{ background: 'rgba(255,255,255,0.6)' }}>
                <div className={`flex h-7 w-10 flex-col items-center justify-center rounded-md text-cream ${c.c}`}>
                  <span style={{ fontSize: 7, fontWeight: 700, lineHeight: 1 }}>{c.h.split(' ')[0]}</span>
                  <span style={{ fontSize: 6, fontWeight: 600, lineHeight: 1, opacity: 0.8 }}>{c.h.split(' ')[1]}</span>
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
          {[
            { i: CalendarCheck, k: 'Agenda', a: true },
            { i: Users, k: 'Clientes' },
            { i: MessageSquare, k: 'Chats' },
            { i: CreditCard, k: 'Pagos' },
          ].map((t) => (
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
    { k: '89', v: 'Negocios activos' },
    { k: '24/7', v: 'Recepcionista IA' },
    { k: '<24h', v: 'Entrega de web' },
    { k: '4.9★', v: 'Satisfacción' },
  ]
  return (
    <section className="px-4 pb-10">
      <div className="glass mx-auto grid max-w-md grid-cols-2 gap-px overflow-hidden rounded-2xl">
        {items.map((it) => (
          <div key={it.v} className="p-4 text-center" style={{ background: 'oklch(0.985 0.008 85 / 0.4)' }}>
            <p className="font-serif text-ink text-2xl">{it.k}</p>
            <p className="mt-1 text-muted-foreground" style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{it.v}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function Services() {
  return (
    <section id="sistemas" className="px-4 pb-14">
      <div className="mx-auto max-w-md">
        <SectionLabel>Sistemas</SectionLabel>
        <h2 className="mt-2 font-serif text-ink" style={{ fontSize: 34, lineHeight: 1.05 }}>
          Todo lo que tu negocio necesita, <em className="text-gold">en un solo lugar.</em>
        </h2>
        <p className="mt-3 text-muted-foreground" style={{ fontSize: 14 }}>
          Cada sistema funciona solo. Juntos, automatizan el 90% de tu operación.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-3">
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

function AdminPreview() {
  return (
    <section className="relative px-4 py-14">
      <div className="absolute inset-x-0 top-0 mx-auto h-72 max-w-md rounded-[40px] blur-2xl" style={{ zIndex: -10, background: 'linear-gradient(to bottom, oklch(0.74 0.115 75 / 0.25), transparent)' }} />
      <div className="mx-auto max-w-md">
        <SectionLabel>Tu panel</SectionLabel>
        <h2 className="mt-2 font-serif text-ink" style={{ fontSize: 34, lineHeight: 1.05 }}>
          Así se ve <em className="text-gold">tu día</em> desde el celular.
        </h2>
        <p className="mt-3 text-muted-foreground" style={{ fontSize: 14 }}>
          Citas, clientes, pagos y llamadas de la IA — todo en una sola pantalla.
        </p>
        <div className="relative mx-auto mt-8" style={{ maxWidth: 260 }}>
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
        <div className="mt-8 grid grid-cols-3 gap-2 text-center">
          {[{ k: 'Booking', icon: CalendarCheck }, { k: 'Clientes', icon: Users }, { k: 'Pagos', icon: CreditCard }].map((x) => (
            <div key={x.k} className="glass rounded-xl p-3">
              <x.icon className="mx-auto h-4 w-4 text-gold" />
              <p className="mt-1.5 text-ink font-semibold" style={{ fontSize: 11 }}>{x.k}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Showcase() {
  return (
    <section id="showcase" className="px-4 py-14">
      <div className="mx-auto max-w-md">
        <SectionLabel>Showcase local</SectionLabel>
        <h2 className="mt-2 font-serif text-ink" style={{ fontSize: 34, lineHeight: 1.05 }}>
          Trabajos <em className="text-gold">ya hechos.</em>
        </h2>
        <p className="mt-3 text-muted-foreground" style={{ fontSize: 14 }}>
          Negocios reales en Puerto Rico operando con A+ CRM.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          {WORKS.map((w) =>
            w.cta ? (
              <a key={w.name} href="#booking" className="glass-gold group relative flex flex-col overflow-hidden rounded-2xl p-1.5">
                <div className="relative flex aspect-square w-full flex-col items-center justify-center overflow-hidden rounded-xl text-center" style={{ background: 'linear-gradient(135deg, oklch(0.74 0.115 75 / 0.3), oklch(0.985 0.008 85), oklch(0.74 0.115 75 / 0.2))' }}>
                  <Sparkles className="h-7 w-7 text-gold" />
                  <p className="mt-2 px-3 font-serif text-ink" style={{ fontSize: 18, lineHeight: 1.2 }}>
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
              <article key={w.name} className="glass group relative overflow-hidden rounded-2xl p-1.5">
                <div className="relative overflow-hidden rounded-xl">
                  <img
                    src={w.img}
                    alt={w.name}
                    width={800}
                    height={800}
                    loading="lazy"
                    className="aspect-square w-full object-cover transition-transform duration-500 group-active:scale-105"
                  />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, oklch(0.18 0.012 60 / 0.7), transparent)' }} />
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-ink" style={{ background: 'oklch(0.985 0.008 85 / 0.9)', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    <Sparkles className="h-2.5 w-2.5 text-gold" /> {w.tag}
                  </span>
                </div>
                <div className="px-2 pb-2 pt-2.5">
                  <p className="text-ink font-semibold leading-tight" style={{ fontSize: 13 }}>{w.name}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-muted-foreground" style={{ fontSize: 10 }}>
                    <MapPin className="h-2.5 w-2.5" /> {w.city}
                  </p>
                </div>
              </article>
            ),
          )}
        </div>
      </div>
    </section>
  )
}

function Reviews() {
  const all = useMemo(() => {
    const arr = []
    for (let i = 0; i < 89; i++) arr.push(REVIEW_POOL[i % REVIEW_POOL.length])
    return arr
  }, [])

  const [page, setPage] = useState(0)
  const perPage = 3
  const totalPages = Math.ceil(all.length / perPage)
  const visible = all.slice(page * perPage, page * perPage + perPage)

  return (
    <section id="resenas" className="px-4 py-14">
      <div className="mx-auto max-w-md">
        <SectionLabel>Lo que dicen</SectionLabel>
        <div className="mt-2 flex items-end justify-between gap-4">
          <h2 className="font-serif text-ink" style={{ fontSize: 34, lineHeight: 1.05 }}>
            <em className="text-gold">89 reseñas</em> reales.
          </h2>
          <div className="text-right">
            <div className="flex items-center gap-1 text-gold">
              <Stars value={5} size={14} />
            </div>
            <p className="mt-1 text-muted-foreground" style={{ fontSize: 11, fontWeight: 600 }}>4.9 promedio</p>
          </div>
        </div>
        <div className="glass mt-5 rounded-2xl p-4">
          <div className="space-y-1.5">
            {[{ stars: 5, pct: 92 }, { stars: 4, pct: 6 }, { stars: 3, pct: 1 }, { stars: 2, pct: 1 }, { stars: 1, pct: 0 }].map((r) => (
              <div key={r.stars} className="flex items-center gap-2" style={{ fontSize: 11 }}>
                <span className="text-ink font-semibold" style={{ width: 12 }}>{r.stars}</span>
                <Star className="h-3 w-3 fill-gold text-gold" />
                <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: 'oklch(0.18 0.012 60 / 0.1)' }}>
                  <div className="h-full rounded-full bg-gold" style={{ width: `${r.pct}%` }} />
                </div>
                <span className="text-right text-muted-foreground" style={{ width: 32 }}>{r.pct}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-5 space-y-3">
          {visible.map((r, i) => (
            <ReviewCard key={`${page}-${i}`} review={r} />
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="glass inline-flex h-10 w-10 items-center justify-center rounded-full disabled:opacity-40"
            aria-label="Anteriores"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="text-muted-foreground" style={{ fontSize: 11, fontWeight: 600 }}>
            {page * perPage + 1}–{Math.min((page + 1) * perPage, all.length)} de {all.length}
          </p>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="glass inline-flex h-10 w-10 items-center justify-center rounded-full disabled:opacity-40"
            aria-label="Siguientes"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-8 overflow-hidden" style={{ WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)' }}>
          <div className="flex gap-2 animate-marquee" style={{ width: 'max-content' }}>
            {[...Array(2)].map((_, k) =>
              ['Barberías', 'Salones', 'Clínicas', 'Restaurantes', 'Spas', 'Gyms', 'Detailing', 'Boutiques'].map((t) => (
                <span key={`${k}-${t}`} className="glass shrink-0 rounded-full px-3 py-1.5 text-ink/70" style={{ fontSize: 11, fontWeight: 600 }}>{t}</span>
              )),
            )}
          </div>
        </div>
      </div>
    </section>
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

function Booking() {
  const [step, setStep] = useState('form')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')

  const dates = useMemo(() => {
    const arr = []
    const today = new Date()
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    for (let i = 1; i <= 7; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      arr.push({
        label: String(d.getDate()),
        sub: `${dias[d.getDay()]} · ${meses[d.getMonth()]}`,
        iso: d.toISOString().slice(0, 10),
      })
    }
    return arr
  }, [])

  const slots = ['9:00 AM', '10:30 AM', '12:00 PM', '2:00 PM', '3:30 PM', '5:00 PM']

  return (
    <section id="booking" className="relative px-4 py-14">
      <div className="absolute inset-x-0 rounded-full blur-3xl" style={{ top: '33%', zIndex: -10, margin: '0 auto', height: 320, maxWidth: '28rem', background: 'oklch(0.74 0.115 75 / 0.25)' }} />
      <div className="mx-auto max-w-md">
        <SectionLabel>Reserva tu demo</SectionLabel>
        <h2 className="mt-2 font-serif text-ink" style={{ fontSize: 34, lineHeight: 1.05 }}>
          15 minutos. <em className="text-gold">Cero compromiso.</em>
        </h2>
        <p className="mt-3 text-muted-foreground" style={{ fontSize: 14 }}>
          Te mostramos el sistema funcionando con tu tipo de negocio. Tú decides si te sirve.
        </p>

        {step === 'form' ? (
          <form className="glass mt-7 rounded-3xl p-4" onSubmit={(e) => { e.preventDefault(); setStep('done') }}>
            <p className="text-muted-foreground" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Elige un día</p>
            <div className="mt-2 -mx-1 flex gap-2 overflow-x-auto pb-1 px-1">
              {dates.map((d) => {
                const active = date === d.iso
                return (
                  <button
                    type="button"
                    key={d.iso}
                    onClick={() => setDate(d.iso)}
                    className={`flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-2xl border transition-all ${active ? 'bg-ink text-cream border-ink glow-gold' : 'border-border text-ink'}`}
                    style={!active ? { background: 'oklch(0.985 0.008 85 / 0.6)' } : {}}
                  >
                    <span className="font-serif text-xl leading-none">{d.label}</span>
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
                  <button
                    type="button"
                    key={s}
                    onClick={() => setTime(s)}
                    className={`h-10 rounded-xl border text-sm font-semibold transition-all ${active ? 'bg-gold text-ink border-gold' : 'text-ink/80 border-border'}`}
                    style={!active ? { background: 'oklch(0.985 0.008 85 / 0.6)' } : {}}
                  >
                    {s}
                  </button>
                )
              })}
            </div>
            <div className="mt-5 space-y-2.5">
              <input required placeholder="Tu nombre" className="h-12 w-full rounded-xl border border-border px-4 text-ink outline-none placeholder:text-muted-foreground focus:border-gold" style={{ fontSize: 14, background: 'oklch(0.985 0.008 85 / 0.6)' }} />
              <input required type="tel" placeholder="WhatsApp o teléfono" className="h-12 w-full rounded-xl border border-border px-4 text-ink outline-none placeholder:text-muted-foreground focus:border-gold" style={{ fontSize: 14, background: 'oklch(0.985 0.008 85 / 0.6)' }} />
              <input required placeholder="Nombre del negocio" className="h-12 w-full rounded-xl border border-border px-4 text-ink outline-none placeholder:text-muted-foreground focus:border-gold" style={{ fontSize: 14, background: 'oklch(0.985 0.008 85 / 0.6)' }} />
            </div>
            <button
              type="submit"
              disabled={!date || !time}
              className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink text-cream font-semibold transition-transform active:scale-[0.98] disabled:opacity-40"
              style={{ fontSize: 15 }}
            >
              Confirmar reserva
              <ArrowRight className="h-4 w-4" />
            </button>
            <p className="mt-3 text-center text-muted-foreground" style={{ fontSize: 11 }}>
              Te confirmamos por WhatsApp en menos de 1 hora.
            </p>
          </form>
        ) : (
          <div className="glass-gold mt-7 rounded-3xl p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ink text-cream">
              <Check className="h-5 w-5" />
            </div>
            <h3 className="mt-3 font-serif text-ink text-2xl">¡Reserva confirmada!</h3>
            <p className="mt-1 text-ink/70" style={{ fontSize: 13 }}>Te escribimos al WhatsApp con los detalles.</p>
            <button onClick={() => setStep('form')} className="mt-4 text-ink underline underline-offset-2" style={{ fontSize: 12, fontWeight: 600 }}>
              Reservar otra
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="px-4 pb-28 pt-6">
      <div className="glass mx-auto max-w-md rounded-3xl p-5 text-center">
        <p className="font-serif text-ink text-2xl">A+ CRM</p>
        <p className="mt-1 text-muted-foreground" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Accounting Plus · Puerto Rico
        </p>
        <div className="mt-4 flex items-center justify-center gap-4 text-ink/70" style={{ fontSize: 12, fontWeight: 600 }}>
          <a href="#sistemas">Sistemas</a>
          <span className="text-border">·</span>
          <a href="#showcase">Trabajos</a>
          <span className="text-border">·</span>
          <a href="#resenas">Reseñas</a>
        </div>
        <p className="mt-5 text-muted-foreground" style={{ fontSize: 10 }}>© 2026 A+ CRM. Hecho con cariño en PR.</p>
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
    <div
      className={`fixed inset-x-0 bottom-3 z-40 px-4 transition-all duration-300 ${show ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0 pointer-events-none'}`}
    >
      <a
        href="#booking"
        className="glass-dark mx-auto flex h-12 max-w-md items-center justify-between gap-3 rounded-full px-2 pl-5 text-cream"
      >
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
