import Head from 'next/head'
import Link from 'next/link'

const gold = '#b8975a'

export default function Privacy() {
  return (
    <>
      <Head>
        <title>Política de Privacidad — A+ CRM</title>
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
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 36, fontWeight: 600, lineHeight: 1.1, marginBottom: '0.5rem', color: '#0e0e0c' }}>Política de Privacidad</h1>
          <p style={{ fontSize: 12, color: '#6b6b67', marginBottom: '2.5rem' }}>Última actualización: junio 2026</p>

          <LegalSection title="1. Quiénes somos">
            <p>A+ CRM (Accounting Plus CRM) es un servicio de software operado por Accounting Plus LLC, con sede en Puerto Rico, Estados Unidos. Proveemos sistemas de booking, CRM, recepcionista de inteligencia artificial y tarjeta de lealtad digital para negocios pequeños y medianos.</p>
            <p>Para cualquier consulta relacionada con privacidad puedes contactarnos a: <a href="mailto:privacy@accountingpluscrm.com" style={{ color: gold }}>privacy@accountingpluscrm.com</a></p>
          </LegalSection>

          <LegalSection title="2. Información que recopilamos">
            <p><strong>Información que tú proporcionas directamente:</strong></p>
            <ul>
              <li>Nombre y apellidos</li>
              <li>Dirección de correo electrónico</li>
              <li>Número de teléfono / WhatsApp</li>
              <li>Nombre y tipo de negocio</li>
              <li>Información de pago (procesada de forma segura por Stripe — no almacenamos números de tarjeta)</li>
              <li>Contenido que ingresas al usar el sistema (citas, notas de clientes, ventas)</li>
            </ul>
            <p><strong>Información recopilada automáticamente:</strong></p>
            <ul>
              <li>Dirección IP y datos del navegador</li>
              <li>Páginas visitadas y tiempo en el sitio</li>
              <li>Dispositivo y sistema operativo</li>
              <li>Cookies de sesión y preferencias (ver nuestra Política de Cookies)</li>
            </ul>
          </LegalSection>

          <LegalSection title="3. Cómo usamos tu información">
            <p>Usamos la información recopilada para:</p>
            <ul>
              <li>Proveer, mantener y mejorar nuestros servicios</li>
              <li>Procesar reservas y pagos</li>
              <li>Enviarte confirmaciones, recordatorios y actualizaciones del servicio</li>
              <li>Atender tus solicitudes de soporte</li>
              <li>Enviarte comunicaciones de marketing (solo con tu consentimiento; puedes darte de baja en cualquier momento)</li>
              <li>Detectar y prevenir fraudes o usos no autorizados</li>
              <li>Cumplir con obligaciones legales</li>
            </ul>
            <p>Nunca vendemos tu información personal a terceros.</p>
          </LegalSection>

          <LegalSection title="4. Compartición de información">
            <p>Podemos compartir tu información con:</p>
            <ul>
              <li><strong>Supabase Inc.</strong> — Infraestructura de base de datos y autenticación (datos almacenados en servidores seguros)</li>
              <li><strong>Stripe Inc.</strong> — Procesamiento de pagos (cumple con PCI-DSS)</li>
              <li><strong>Vercel Inc.</strong> — Hosting de la plataforma web</li>
              <li><strong>Proveedores de comunicación</strong> — Para envío de notificaciones push y WhatsApp</li>
              <li><strong>Autoridades legales</strong> — Cuando sea requerido por ley, orden judicial o proceso legal válido</li>
            </ul>
            <p>Todos los proveedores están contractualmente obligados a proteger tu información y usarla únicamente para los servicios que les proveemos.</p>
          </LegalSection>

          <LegalSection title="5. Retención de datos">
            <p>Conservamos tu información mientras tu cuenta esté activa o sea necesario para proveer el servicio. Si cancelas tu cuenta, eliminamos o anonimizamos tus datos personales dentro de los 90 días, salvo que estemos obligados legalmente a retenerlos por más tiempo.</p>
          </LegalSection>

          <LegalSection title="6. Tus derechos">
            <p>Como usuario, tienes derecho a:</p>
            <ul>
              <li><strong>Acceso</strong> — Solicitar una copia de tu información personal</li>
              <li><strong>Corrección</strong> — Corregir datos incorrectos o incompletos</li>
              <li><strong>Eliminación</strong> — Solicitar que eliminemos tu información personal</li>
              <li><strong>Portabilidad</strong> — Recibir tus datos en formato legible por máquina</li>
              <li><strong>Oposición</strong> — Oponerte al uso de tus datos para marketing</li>
              <li><strong>Restricción</strong> — Solicitar que limitemos el procesamiento de tus datos</li>
            </ul>
            <p>Para ejercer cualquiera de estos derechos, escríbenos a <a href="mailto:privacy@accountingpluscrm.com" style={{ color: gold }}>privacy@accountingpluscrm.com</a>. Responderemos dentro de los 30 días.</p>
          </LegalSection>

          <LegalSection title="7. Seguridad">
            <p>Implementamos medidas técnicas y organizativas para proteger tu información, incluyendo cifrado en tránsito (HTTPS/TLS), cifrado en reposo para datos sensibles, acceso restringido basado en roles y monitoreo continuo de seguridad. Sin embargo, ningún sistema es 100% seguro; notificamos a los usuarios afectados en caso de una brecha de seguridad.</p>
          </LegalSection>

          <LegalSection title="8. Menores de edad">
            <p>Nuestro servicio está dirigido a propietarios y empleados de negocios. No recopilamos intencionalmente información de personas menores de 18 años. Si detectamos que hemos recopilado información de un menor sin el consentimiento adecuado, la eliminaremos inmediatamente.</p>
          </LegalSection>

          <LegalSection title="9. Cambios a esta política">
            <p>Podemos actualizar esta Política de Privacidad periódicamente. Te notificaremos sobre cambios significativos por correo electrónico o mediante un aviso prominente en el servicio. El uso continuado del servicio después de las modificaciones constituye tu aceptación de la nueva política.</p>
          </LegalSection>

          <LegalSection title="10. Ley aplicable">
            <p>Esta política se rige por las leyes del Estado Libre Asociado de Puerto Rico y las leyes federales de los Estados Unidos de América aplicables, incluyendo la Ley de Privacidad del Consumidor de California (CCPA) en la medida que aplique.</p>
          </LegalSection>
        </main>
      </div>
    </>
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
