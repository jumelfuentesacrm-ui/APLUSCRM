// ─── Business config — all values pulled from NEXT_PUBLIC_* env vars ──────────
// Set these in Vercel → Project Settings → Environment Variables per client.
// Fallbacks below are for the A+ CRM master account only.

export const BRAND = {
  name:         process.env.NEXT_PUBLIC_BRAND_NAME         || 'A+ CRM',
  businessName: process.env.NEXT_PUBLIC_BUSINESS_NAME      || 'A+ Accounting & Business Services',
  phone:        process.env.NEXT_PUBLIC_PHONE              || '+17875551234',
  whatsapp:     process.env.NEXT_PUBLIC_WHATSAPP           || '17875551234',
  email:        process.env.NEXT_PUBLIC_EMAIL              || 'hello@apluscrm.com',
  location:     process.env.NEXT_PUBLIC_LOCATION           || 'Puerto Rico',
  website:      process.env.NEXT_PUBLIC_WEBSITE            || 'https://apluscrm.com',
  taxRate:      parseFloat(process.env.NEXT_PUBLIC_TAX_RATE || '0.115'),
}

export const COLORS = {
  gold:  process.env.NEXT_PUBLIC_COLOR_GOLD  || '#b8975a',
  black: '#0e0e0c',
  white: '#f8f6f1',
  cream: '#f8f6f1',
  gray:  '#6b6b67',
  gl:    '#e8e5de',
  ink:   '#1c1c1a',
}

export const FONTS = {
  body:    process.env.NEXT_PUBLIC_FONT_BODY    || 'Inter,ui-sans-serif,system-ui,sans-serif',
  heading: process.env.NEXT_PUBLIC_FONT_HEADING || 'Cormorant Garamond,serif',
}

// Height of the fixed top header — used to offset modals/sheets
export const HEADER_H = 'calc(52px + env(safe-area-inset-top,0px))'

// ─── Phone formatting ─────────────────────────────────────────────────────────
// Formats any input to +1 (787) 555-1234 style as the user types.
// Keeps stored value clean: digits only, 11 chars max ("1" + 10-digit US/PR)
export function formatPhone(raw = '') {
  const digits = raw.replace(/\D/g, '').slice(0, 11)
  if (!digits) return ''
  // Allow leading +1 or just 10 digits
  const d = digits.startsWith('1') ? digits.slice(1) : digits
  const area = d.slice(0, 3)
  const mid  = d.slice(3, 6)
  const last = d.slice(6, 10)
  let out = ''
  if (area)  out = `+1 (${area}`
  if (area.length === 3) out += ')'
  if (mid)   out += ` ${mid}`
  if (mid.length === 3 && last) out += `-${last}`
  return out
}

// Returns the raw +1XXXXXXXXXX value to store/send
export function rawPhone(formatted = '') {
  const digits = formatted.replace(/\D/g, '')
  return digits ? `+${digits.startsWith('1') ? '' : '1'}${digits.startsWith('1') ? digits : digits}` : ''
}
