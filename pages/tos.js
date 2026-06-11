import Head from 'next/head'
import Link from 'next/link'

const gold = '#b8975a'

export default function TOS() {
  return (
    <>
      <Head>
        <title>Términos de Servicio — A+ CRM</title>
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
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 36, fontWeight: 600, lineHeight: 1.1, marginBottom: '0.5rem', color: '#0e0e0c' }}>Términos de Servicio</h1>
          <p style={{ fontSize: 12, color: '#6b6b67', marginBottom: '2.5rem' }}>Última actualización: junio 2026</p>

          <LegalSection title="1. Aceptación de los Términos">
            <p>Al acceder o utilizar los servicios de A+ CRM (en adelante "el Servicio"), operados por Accounting Plus LLC ("Nosotros"), aceptas quedar vinculado por estos Términos de Servicio. Si no estás de acuerdo con alguno de estos términos, no debes usar el Servicio.</p>
            <p>Estos Términos constituyen un acuerdo legal entre tú (el "Usuario") y Accounting Plus LLC.</p>
          </LegalSection>

          <LegalSection title="2. Descripción del Servicio">
            <p>A+ CRM provee a negocios de Puerto Rico acceso a herramientas de gestión que incluyen:</p>
            <ul>
              <li>Sistema de reservas y booking en línea</li>
              <li>CRM (Customer Relationship Management) de clientes</li>
              <li>Recepcionista virtual con inteligencia artificial para llamadas y mensajes</li>
              <li>Sistema de tarjeta de lealtad digital</li>
              <li>Diseño y hospedaje de páginas web de negocio</li>
              <li>Panel de administración y reportes</li>
            </ul>
          </LegalSection>

          <LegalSection title="3. Registro y Cuenta">
            <p>Para usar el Servicio debes crear una cuenta con información veraz y completa. Eres responsable de mantener la confidencialidad de tu contraseña y de todas las actividades realizadas bajo tu cuenta. Notifícanos inmediatamente si sospechas acceso no autorizado.</p>
            <p>Nos reservamos el derecho de terminar cuentas que violen estos Términos o que no hayan sido usadas por más de 12 meses consecutivos.</p>
          </LegalSection>

          <LegalSection title="4. Suscripción y Pagos">
            <p>El Servicio puede requerir el pago de una tarifa de suscripción mensual o anual. Los precios se muestran en el sitio web y pueden cambiar con 30 días de aviso previo.</p>
            <ul>
              <li>Los pagos se procesan de forma segura a través de Stripe</li>
              <li>Las suscripciones se renuevan automáticamente salvo que las canceles</li>
              <li>No realizamos reembolsos por períodos parciales, salvo en casos de falla del servicio atribuible a nosotros</li>
              <li>Si un pago falla, el acceso al Servicio puede ser suspendido temporalmente</li>
            </ul>
          </LegalSection>

          <LegalSection title="5. Uso Aceptable">
            <p>Al usar el Servicio, te comprometes a no:</p>
            <ul>
              <li>Usar el Servicio para actividades ilegales o no autorizadas</li>
              <li>Enviar comunicaciones no solicitadas (spam) a través del sistema</li>
              <li>Intentar acceder a cuentas de otros usuarios sin autorización</li>
              <li>Cargar contenido malicioso, ofensivo o que infrinja derechos de terceros</li>
              <li>Hacer ingeniería inversa o intentar obtener el código fuente del Servicio</li>
              <li>Revender o sublicenciar el acceso al Servicio sin autorización escrita</li>
            </ul>
          </LegalSection>

          <LegalSection title="6. Propiedad Intelectual">
            <p>El Servicio, incluyendo su software, diseño, logos y contenido, son propiedad de Accounting Plus LLC y están protegidos por leyes de propiedad intelectual. Te otorgamos una licencia limitada, no exclusiva y no transferible para usar el Servicio.</p>
            <p>Los datos que ingresas al Servicio (clientes, citas, ventas) son de tu propiedad. Tú nos otorgas una licencia para procesar esos datos con el único fin de proveer el Servicio.</p>
          </LegalSection>

          <LegalSection title="7. Disponibilidad del Servicio">
            <p>Hacemos esfuerzos razonables para mantener el Servicio disponible 24/7. Sin embargo, no garantizamos disponibilidad ininterrumpida. Podemos realizar mantenimientos programados con aviso previo o de emergencia sin aviso si es necesario para la seguridad del sistema.</p>
          </LegalSection>

          <LegalSection title="8. Limitación de Responsabilidad">
            <p>En la máxima medida permitida por la ley, Accounting Plus LLC no será responsable por:</p>
            <ul>
              <li>Pérdida de ganancias, datos o oportunidades de negocio</li>
              <li>Daños indirectos, incidentales o consecuentes</li>
              <li>Interrupciones del servicio causadas por terceros o fuerza mayor</li>
            </ul>
            <p>En cualquier caso, nuestra responsabilidad total no excederá el monto pagado por el Usuario en los últimos 3 meses de servicio.</p>
          </LegalSection>

          <LegalSection title="9. Cancelación y Terminación">
            <p>Puedes cancelar tu suscripción en cualquier momento desde tu panel de cuenta o escribiéndonos. La cancelación es efectiva al final del período de facturación actual.</p>
            <p>Podemos suspender o terminar tu cuenta si: (a) violas estos Términos, (b) no pagas las tarifas aplicables, o (c) por requerimiento legal. Te notificaremos con antelación cuando sea posible.</p>
            <p>Tras la terminación, tendrás 30 días para exportar tus datos antes de que sean eliminados de nuestros sistemas.</p>
          </LegalSection>

          <LegalSection title="10. Ley Aplicable y Resolución de Disputas">
            <p>Estos Términos se rigen por las leyes del Estado Libre Asociado de Puerto Rico y las leyes federales aplicables de los Estados Unidos. Cualquier disputa se resolverá primero mediante negociación de buena fe. Si no se llega a un acuerdo, las disputas se someterán a arbitraje en San Juan, Puerto Rico, de acuerdo con las reglas de la Asociación Americana de Arbitraje.</p>
          </LegalSection>

          <LegalSection title="11. Cambios a los Términos">
            <p>Podemos modificar estos Términos en cualquier momento. Te notificaremos sobre cambios materiales con al menos 30 días de antelación por correo electrónico. El uso continuado del Servicio después de la fecha efectiva de los cambios constituye aceptación de los nuevos Términos.</p>
          </LegalSection>

          <LegalSection title="12. Contacto">
            <p>Si tienes preguntas sobre estos Términos, contáctanos en:<br />
            <a href="mailto:legal@accountingpluscrm.com" style={{ color: gold }}>legal@accountingpluscrm.com</a><br />
            Accounting Plus LLC · Puerto Rico, EE.UU.</p>
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
