// Tienda de plantillas: carrito en el navegador y medición de intención de compra.
// La clave es pública por diseño: solo permite INSERTAR en dos tablas (sin lectura).
const API = 'https://kroynszjkuqrydfbcjja.supabase.co/rest/v1'
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtyb3luc3pqa3VxcnlkZmJjamphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ3OTg3ODIsImV4cCI6MjExMDM3NDc4Mn0.a48gaNx8wcsuiJ8NfdvIL6xs9IR7uAqXVk35Paom2sk'
export const SITE = 'https://www.accountingpluscrm.com'

const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d } catch { return d } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} },
}
export function visitor() {
  let v = store.get('ap_vid', null)
  if (!v) { v = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2)).replace(/-/g, '').slice(0, 32); store.set('ap_vid', v) }
  return v
}
function post(table, row) {
  return fetch(`${API}/${table}`, { method: 'POST', keepalive: true, headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(row) })
}
/** Registra un paso del embudo. Nunca interrumpe la página si falla. */
export function track(tipo, { producto = null, valor = null, idioma = 'es' } = {}) {
  if (typeof window === 'undefined') return
  post('tienda_eventos', { visitor: visitor(), tipo, producto, idioma, valor_centavos: valor, ruta: location.pathname.slice(0, 200), referente: (document.referrer || '').slice(0, 200) || null }).catch(() => {})
}
export const cart = {
  ids() { return store.get('ap_cart', []) },
  has(id) { return this.ids().includes(id) },
  add(id) { if (!this.has(id)) { store.set('ap_cart', [...this.ids(), id]); window.dispatchEvent(new Event('ap-cart')) } },
  remove(id) { store.set('ap_cart', this.ids().filter((x) => x !== id)); window.dispatchEvent(new Event('ap-cart')) },
  clear() { store.set('ap_cart', []); window.dispatchEvent(new Event('ap-cart')) },
}
/** Guarda la reserva. Devuelve true solo si el servidor la aceptó. */
export async function reserve({ email, productos, total, idioma }) {
  const res = await post('tienda_reservas', { visitor: visitor(), email, productos, total_centavos: total, idioma, consentimiento: true })
  if (!res.ok) return false
  track('reserva', { valor: total, idioma })
  return true
}
export const money = (c) => `$${(c / 100).toFixed(2)}`

export const T = {
  es: {
    brand: 'A+ Plantillas', hub: '/plantillas', cat: (s) => `/plantillas/categoria/${s}`, prod: (s) => `/plantillas/${s}`, other: 'English', cartLabel: 'Carrito',
    hubTitle: 'Plantillas imprimibles para organizar tu negocio y tu casa', hubMeta: 'Kits imprimibles en PDF por oficio y situación: contabilidad para salones, barberías y food trucks, presupuesto del hogar, estudio y búsqueda de empleo.',
    hubIntro: 'Cada kit viene preparado para un oficio o una situación concreta, con sus categorías ya escritas. Se imprime en casa y se empieza a usar el mismo día.',
    all: 'Todas las plantillas', see: 'Ver plantilla', made: 'Hecho para', inside: 'Qué trae el PDF', pages: 'páginas, tamaño A4 (también imprime bien en carta)', first: 'Dos cosas que hacer primero',
    sample: 'Una página del kit', add: 'Agregar al carrito', inCart: 'En tu carrito — ver carrito', soon: 'El pago en línea abre pronto. Puedes reservar hoy sin cargo.',
    faq: 'Preguntas frecuentes', related: 'Otras plantillas de esta categoría', home: 'Inicio',
    q: [['¿En qué formato viene?', 'Es un PDF para imprimir. Lo imprimes las veces que necesites para tu propio uso.'], ['¿Puedo comprarlo ya?', 'Todavía no. El pago en línea no está abierto. Si lo agregas al carrito y reservas, te escribimos una sola vez cuando abra, con tu enlace de pago. Reservar no cuesta nada ni te obliga a comprar.'], ['¿Lo puedo compartir?', 'La licencia es para una persona o un negocio. No se puede revender ni redistribuir.']],
    cartTitle: 'Tu carrito', empty: 'Tu carrito está vacío.', remove: 'Quitar', total: 'Total', tax: 'Los impuestos, si aplican, se muestran al pagar.', toReserve: 'Continuar', keep: 'Seguir viendo plantillas',
    resTitle: 'Reserva tu pedido', resLead: 'El pago en línea todavía no está abierto. Deja tu correo y te escribimos una sola vez cuando abra, con tu enlace de pago. Hoy no se cobra nada y reservar no te obliga a comprar.',
    email: 'Tu correo electrónico', consent: 'Acepto que A+ CRM me escriba a este correo sobre este pedido.', privacy: 'Política de Privacidad', submit: 'Reservar sin cargo',
    done: 'Reserva guardada', doneLead: 'Te escribiremos a ese correo cuando abra el pago. No se te cobró nada.', fail: 'No pudimos guardar tu reserva. Revisa tu conexión e inténtalo de nuevo.', badEmail: 'Escribe un correo válido y marca la casilla.',
    foot: 'Medimos las visitas al catálogo con un identificador anónimo guardado en tu navegador. No usamos cookies de publicidad.', by: 'Un producto de A+ CRM · Accounting Plus LLC · Puerto Rico',
  },
  en: {
    brand: 'A+ Templates', hub: '/templates', cat: (s) => `/templates/category/${s}`, prod: (s) => `/templates/${s}`, other: 'Español', cartLabel: 'Cart',
    hubTitle: 'Printable templates to organize your business and your home', hubMeta: 'Printable PDF kits by trade and situation: bookkeeping for salons, barbershops and food trucks, household budgets, study planners and job search workbooks.',
    hubIntro: 'Each kit is set up for one trade or one situation, with its categories already written in. Print it at home and start using it the same day.',
    all: 'All templates', see: 'View template', made: 'Made for', inside: 'What is in the PDF', pages: 'pages, A4 size (also prints well on Letter)', first: 'Two things to do first',
    sample: 'A page from the kit', add: 'Add to cart', inCart: 'In your cart — view cart', soon: 'Online payment opens soon. You can reserve today at no charge.',
    faq: 'Frequently asked questions', related: 'More templates in this category', home: 'Home',
    q: [['What format is it?', 'It is a printable PDF. Print it as many times as you need for your own use.'], ['Can I buy it now?', 'Not yet. Online payment is not open. If you add it to your cart and reserve, we will email you once when it opens, with your payment link. Reserving costs nothing and does not commit you to buy.'], ['Can I share it?', 'The license covers one person or one business. It cannot be resold or redistributed.']],
    cartTitle: 'Your cart', empty: 'Your cart is empty.', remove: 'Remove', total: 'Total', tax: 'Taxes, if they apply, are shown at payment.', toReserve: 'Continue', keep: 'Keep browsing templates',
    resTitle: 'Reserve your order', resLead: 'Online payment is not open yet. Leave your email and we will write to you once when it opens, with your payment link. Nothing is charged today and reserving does not commit you to buy.',
    email: 'Your email address', consent: 'I agree that A+ CRM may email me at this address about this order.', privacy: 'Privacy Policy', submit: 'Reserve at no charge',
    done: 'Reservation saved', doneLead: 'We will email you at that address when payment opens. You were not charged.', fail: 'We could not save your reservation. Check your connection and try again.', badEmail: 'Enter a valid email and tick the box.',
    foot: 'We count catalog visits with an anonymous identifier stored in your browser. We do not use advertising cookies.', by: 'A product of A+ CRM · Accounting Plus LLC · Puerto Rico',
  },
}
