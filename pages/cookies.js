import Head from 'next/head'
import Link from 'next/link'

const gold = '#b8975a'

export default function Cookies() {
  return (
    <>
      <Head>
        <title>Política de Cookies — A+ CRM</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div style={{ minHeight: '100vh', background: 'oklch(0.985 0.008 85)', color: 'oklch(0.18 0.012 60)', fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
        <header style={{ borderBottom: '1px solid rgba(184,151,90,0.15)', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, fontWeight: 600, color: '#0e0e0c' }}>A+</span>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#6b6b67' }}>CRM</span>
          </Link>
          <Link href="/" style={{ fontSize: 13, color: gold, textDecoration: 'none', fontWeight: 600 }}>← Volver</Link>
        </header>
        <main style={{ maxWidth: 720, margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: gold, marginBottom: '0.5rem' }}>Legal</p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 36, fontWeight: 600, lineHeight: 1.1, marginBottom: '0.5rem', color: '#0e0e0c' }}>Política de Cookies</h1>
          <p style={{ fontSize: 12, color: '#6b6b67', marginBottom: '2.5rem' }}>Última actualización: junio 2026</p>

          <LegalSection title="¿Qué son las cookies?">
            <p>Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas un sitio web. Se usan ampliamente para hacer que los sitios web funcionen correctamente y de forma más eficiente, así como para proporcionar información a los propietarios del sitio.</p>
          </LegalSection>

          <LegalSection title="Cookies esenciales">
            <p>Estas cookies son necesarias para el funcionamiento básico del Servicio y no pueden ser desactivadas. Incluyen:</p>
            <CookieTable rows={[
              { nombre: 'sb-access-token', propósito: 'Autenticación de sesión (Supabase)', duración: 'Sesión', tipo: 'Esencial' },
              { nombre: 'sb-refresh-token', propósito: 'Renovación automática de sesión', duración: '7 días', tipo: 'Esencial' },
              { nombre: '__stripe_mid', propósito: 'Prevención de fraude en pagos (Stripe)', duración: '1 año', tipo: 'Esencial' },
              { nombre: 'aplus_consent', propósito: 'Registro de tu preferencia de cookies', duración: '1 año', tipo: 'Esencial' },
            ]} />
          </LegalSection>

          <LegalSection title="Cookies de rendimiento y analíticas">
            <p>Estas cookies nos ayudan a entender cómo los usuarios interactúan con el Servicio, lo que nos permite mejorarlo. Toda la información es anónima.</p>
            <CookieTable rows={[
              { nombre: '_vercel_analytics', propósito: 'Analítica de páginas vistas y rendimiento', duración: '1 año', tipo: 'Analítica' },
              { nombre: '_ga', propósito: 'Google Analytics — estadísticas de uso anónimas', duración: '2 años', tipo: 'Analítica' },
            ]} />
          </LegalSection>

          <LegalSection title="Cookies de funcionalidad">
            <p>Permiten que el Servicio recuerde tus preferencias para ofrecerte una experiencia más personalizada.</p>
            <CookieTable rows={[
              { nombre: 'aplus_panel', propósito: 'Último panel visitado en el admin', duración: '30 días', tipo: 'Funcional' },
              { nombre: 'aplus_theme', propósito: 'Preferencia de tema visual', duración: '1 año', tipo: 'Funcional' },
            ]} />
          </LegalSection>

          <LegalSection title="Cómo controlar las cookies">
            <p>Puedes controlar y/o eliminar las cookies a través de la configuración de tu navegador:</p>
            <ul>
              <li><strong>Chrome:</strong> Configuración → Privacidad y seguridad → Cookies</li>
              <li><strong>Firefox:</strong> Opciones → Privacidad y seguridad → Cookies</li>
              <li><strong>Safari:</strong> Preferencias → Privacidad → Gestionar datos de sitios web</li>
              <li><strong>Edge:</strong> Configuración → Cookies y permisos del sitio</li>
            </ul>
            <p>Ten en cuenta que deshabilitar cookies esenciales puede afectar el funcionamiento del Servicio, incluyendo la imposibilidad de iniciar sesión.</p>
          </LegalSection>

          <LegalSection title="Cookies de terceros">
            <p>Algunos de nuestros socios tecnológicos también pueden almacenar cookies en tu dispositivo:</p>
            <ul>
              <li><strong>Supabase</strong> — Para autenticación y gestión de sesiones</li>
              <li><strong>Stripe</strong> — Para procesamiento seguro de pagos</li>
              <li><strong>Google Fonts</strong> — Para carga de tipografías (no rastrea usuarios)</li>
            </ul>
            <p>Cada uno de estos terceros tiene su propia política de privacidad y cookies.</p>
          </LegalSection>

          <LegalSection title="Cambios a esta política">
            <p>Podemos actualizar esta Política de Cookies periódicamente. Los cambios se publicarán en esta página. Para preguntas, escríbenos a <a href="mailto:privacy@accountingpluscrm.com" style={{ color: gold }}>privacy@accountingpluscrm.com</a>.</p>
          </LegalSection>
        </main>
      </div>
    </>
  )
}

function CookieTable({ rows }) {
  return (
    <div style={{ overflowX: 'auto', marginTop: '0.5rem' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(184,151,90,0.2)' }}>
            {['Nombre', 'Propósito', 'Duración', 'Tipo'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '0.5rem 0.75rem', fontWeight: 700, color: '#0e0e0c', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderBottom: '1px solid rgba(14,14,12,0.05)', background: i % 2 === 0 ? 'rgba(184,151,90,0.03)' : 'transparent' }}>
              <td style={{ padding: '0.6rem 0.75rem', color: '#0e0e0c', fontFamily: 'monospace', fontSize: 11 }}>{r.nombre}</td>
              <td style={{ padding: '0.6rem 0.75rem', color: '#3a3a38' }}>{r.propósito}</td>
              <td style={{ padding: '0.6rem 0.75rem', color: '#6b6b67' }}>{r.duración}</td>
              <td style={{ padding: '0.6rem 0.75rem' }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: r.tipo === 'Esencial' ? 'rgba(184,151,90,0.12)' : r.tipo === 'Analítica' ? 'rgba(52,152,219,0.1)' : 'rgba(45,138,96,0.1)', color: r.tipo === 'Esencial' ? '#b8975a' : r.tipo === 'Analítica' ? '#2980b9' : '#2d8a60' }}>{r.tipo}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function LegalSection({ title, children }) {
  return (
    <section style={{ marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid rgba(184,151,90,0.1)' }}>
      <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, fontWeight: 500, color: '#0e0e0c', marginBottom: '0.75rem' }}>{title}</h2>
      <div style={{ fontSize: 14, lineHeight: 1.7, color: '#3a3a38', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {children}
      </div>
    </section>
  )
}
