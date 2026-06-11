import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

const gold = '#b8975a'
const black = '#0e0e0c'
const white = '#f8f6f1'
const gray = '#6b6b67'
const borderColor = '#e8e5de'
const fontSans = 'DM Sans, sans-serif'
const fontSerif = 'Cormorant Garamond, serif'

const features = [
  ['Tarjeta de Lealtad Digital', '5 pagos a tiempo = 1 mes de servicio gratis.'],
  ['Datos en Tiempo Real', 'Sellos e historial actualizados al instante.'],
  ['Acceso Seguro', 'Tu cuenta, tus datos — siempre protegidos.'],
]

export default function Login() {
  const router = useRouter()
  const [mode, setMode] = useState('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [form, setForm] = useState({
    email: '', password: '', full_name: '', business_name: '', phone: '', confirm_password: ''
  })
  const updateField = (key, value) => setForm(f => ({ ...f, [key]: value }))

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: form.email, password: form.password
    })
    if (error) { setError('Credenciales incorrectas. Verifica tu correo y contraseña.'); setLoading(false); return }
    // Check role from profiles table OR user_metadata (set by admin SQL)
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
    const metaRole = data.user.user_metadata?.role
    if (profile?.role === 'admin' || metaRole === 'admin') {
      router.push('/admin')
    } else {
      router.push('/admin')
    }
  }

  async function handleSignup(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (form.password !== form.confirm_password) { setError('Las contraseñas no coinciden.'); return }
    if (form.password.length < 6) { setError('La contraseña debe tener mínimo 6 caracteres.'); return }
    setLoading(true)
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error || 'Error al crear la cuenta.'); return }
    setSuccess('Cuenta creada exitosamente. Inicia sesión para continuar.')
    setMode('login')
  }

  async function handleForgotPassword() {
    if (!form.email) { setError('Ingresa tu correo electrónico primero.'); return }
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
      redirectTo: `${window.location.origin}/login`
    })
    setLoading(false)
    if (error) { setError('Error al enviar el correo. Verifica la dirección.'); return }
    setResetSent(true)
    setSuccess('Correo de recuperación enviado. Revisa tu bandeja de entrada.')
  }

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: ${black}; }
        @media (max-width: 700px) {
          .login-grid { grid-template-columns: 1fr !important; }
          .login-left { display: none !important; }
        }
        .login-input {
          width: 100%; padding: 0.85rem 1rem; border: 1.5px solid ${borderColor};
          border-radius: 6px; background: ${white}; font-family: ${fontSans};
          font-size: 0.875rem; outline: none; color: ${black};
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .login-input:focus {
          border-color: ${gold}; box-shadow: 0 0 0 3px rgba(184,151,90,0.12);
        }
        .login-input::placeholder { color: rgba(14,14,12,0.3); }
        .login-btn-primary {
          width: 100%; background: ${black}; color: ${white}; border: none;
          padding: 0.95rem; cursor: pointer; font-family: ${fontSans};
          font-size: 0.7rem; letter-spacing: 0.16em; text-transform: uppercase;
          border-radius: 6px; transition: background 0.2s, transform 0.1s;
          position: relative; overflow: hidden;
        }
        .login-btn-primary:hover:not(:disabled) { background: #1c1c1a; transform: translateY(-1px); }
        .login-btn-primary:active:not(:disabled) { transform: translateY(0); }
        .login-btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }
        .switch-mode-link {
          color: ${gold}; cursor: pointer; text-decoration: underline;
          text-underline-offset: 2px; transition: opacity 0.15s;
        }
        .switch-mode-link:hover { opacity: 0.75; }
        .forgot-link {
          color: ${gray}; cursor: pointer; font-size: 0.68rem;
          transition: color 0.15s; background: none; border: none;
          font-family: ${fontSans}; padding: 0; text-decoration: underline;
          text-underline-offset: 2px;
        }
        .forgot-link:hover { color: ${gold}; }
        .pw-toggle {
          position: absolute; right: 0.85rem; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; color: ${gray};
          font-size: 0.75rem; padding: 0.2rem; font-family: ${fontSans};
          letter-spacing: 0.04em;
        }
        .pw-toggle:hover { color: ${black}; }
        .feature-dot {
          width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
          background: rgba(184,151,90,0.1); border: 1px solid rgba(184,151,90,0.22);
          display: flex; align-items: center; justify-content: center;
        }
      `}</style>

      <div className="login-grid" style={{
        minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr', fontFamily: fontSans
      }}>
        {/* LEFT PANEL */}
        <div className="login-left" style={{
          background: black, display: 'flex', flexDirection: 'column',
          justifyContent: 'center', padding: '5rem', position: 'relative', overflow: 'hidden'
        }}>
          {/* Background watermark */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            fontFamily: fontSerif, fontSize: '18rem', fontWeight: 300,
            color: 'rgba(184,151,90,0.035)', lineHeight: 1, pointerEvents: 'none',
            userSelect: 'none'
          }}>A+</div>
          {/* Radial glow */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'radial-gradient(ellipse 80% 60% at 0% 100%, rgba(184,151,90,0.06) 0%, transparent 60%)',
            pointerEvents: 'none'
          }}/>
          <div style={{ position: 'relative' }}>
            <div style={{
              fontFamily: fontSerif, fontSize: '2.8rem', fontWeight: 300,
              color: white, marginBottom: '0.4rem', lineHeight: 1
            }}>
              A<span style={{ color: gold, fontStyle: 'italic' }}>+</span> CRM
            </div>
            <div style={{
              fontSize: '0.58rem', letterSpacing: '0.22em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.28)', marginBottom: '3.5rem'
            }}>
              Accounting Plus Client Return Management
            </div>
            {features.map(([title, sub]) => (
              <div key={title} style={{ display: 'flex', alignItems: 'flex-start', gap: '1.1rem', marginBottom: '1.5rem' }}>
                <div className="feature-dot">
                  <span style={{ color: gold, fontSize: '0.7rem' }}>✦</span>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.85rem', color: white, marginBottom: '0.18rem', fontWeight: 400 }}>
                    {title}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.36)', lineHeight: 1.65 }}>
                    {sub}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{
          background: white, display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: '2rem', minHeight: '100vh'
        }}>
          <div style={{ width: '100%', maxWidth: 420 }}>
            {/* Logo */}
            <div style={{
              fontFamily: fontSerif, fontSize: '2rem', fontWeight: 300,
              color: black, marginBottom: '0.3rem', textAlign: 'center'
            }}>
              A<span style={{ color: gold, fontStyle: 'italic' }}>+</span> CRM
            </div>
            <h2 style={{
              fontFamily: fontSerif, fontSize: '1.55rem', fontWeight: 300,
              marginBottom: '0.4rem', textAlign: 'center', color: black
            }}>
              {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </h2>
            <p style={{
              fontSize: '0.73rem', color: gray, marginBottom: '2rem',
              lineHeight: 1.7, textAlign: 'center'
            }}>
              {mode === 'login'
                ? 'Accede a tu portal de lealtad A+ CRM.'
                : 'Tu representante activará la tarjeta una vez te registres.'}
            </p>

            {/* Messages */}
            {error && (
              <div style={{
                color: '#b03a2e', fontSize: '0.73rem', marginBottom: '1rem',
                padding: '0.75rem 1rem', background: 'rgba(192,57,43,0.07)',
                borderRadius: 6, border: '1px solid rgba(192,57,43,0.15)',
                lineHeight: 1.5
              }}>{error}</div>
            )}
            {success && (
              <div style={{
                color: '#1e8449', fontSize: '0.73rem', marginBottom: '1rem',
                padding: '0.75rem 1rem', background: 'rgba(45,138,96,0.07)',
                borderRadius: 6, border: '1px solid rgba(45,138,96,0.2)',
                lineHeight: 1.5
              }}>{success}</div>
            )}

            <form onSubmit={mode === 'login' ? handleLogin : handleSignup}>
              {mode === 'signup' && (
                <>
                  <div style={{ marginBottom: '1rem' }}>
                    <label htmlFor="full_name" style={labelStyle}>Nombre Completo</label>
                    <input
                      id="full_name" className="login-input" type="text"
                      placeholder="Tu nombre completo"
                      value={form.full_name} onChange={e => updateField('full_name', e.target.value)}
                      required
                    />
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label htmlFor="business_name" style={labelStyle}>Nombre del Negocio</label>
                    <input
                      id="business_name" className="login-input" type="text"
                      placeholder="Nombre de tu negocio"
                      value={form.business_name} onChange={e => updateField('business_name', e.target.value)}
                    />
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label htmlFor="phone" style={labelStyle}>Teléfono</label>
                    <input
                      id="phone" className="login-input" type="tel"
                      placeholder="787-000-0000"
                      value={form.phone} onChange={e => updateField('phone', e.target.value)}
                    />
                  </div>
                </>
              )}

              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="email" style={labelStyle}>Correo Electrónico</label>
                <input
                  id="email" className="login-input" type="email"
                  placeholder="correo@negocio.com"
                  value={form.email} onChange={e => updateField('email', e.target.value)}
                  required autoComplete="email"
                />
              </div>

              <div style={{ marginBottom: mode === 'login' ? '0.5rem' : '1rem' }}>
                <label htmlFor="password" style={labelStyle}>Contraseña</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="password" className="login-input" type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••" style={{ paddingRight: '3.5rem' }}
                    value={form.password} onChange={e => updateField('password', e.target.value)}
                    required autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  />
                  <button type="button" className="pw-toggle" onClick={() => setShowPassword(p => !p)}>
                    {showPassword ? 'Ocultar' : 'Ver'}
                  </button>
                </div>
              </div>

              {mode === 'login' && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                  <button
                    type="button" className="forgot-link"
                    onClick={handleForgotPassword}
                    disabled={loading || resetSent}
                  >
                    {resetSent ? 'Correo enviado ✓' : '¿Olvidaste tu contraseña?'}
                  </button>
                </div>
              )}

              {mode === 'signup' && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label htmlFor="confirm_password" style={labelStyle}>Confirmar Contraseña</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="confirm_password" className="login-input" type={showConfirm ? 'text' : 'password'}
                      placeholder="••••••••" style={{ paddingRight: '3.5rem' }}
                      value={form.confirm_password} onChange={e => updateField('confirm_password', e.target.value)}
                      required autoComplete="new-password"
                    />
                    <button type="button" className="pw-toggle" onClick={() => setShowConfirm(p => !p)}>
                      {showConfirm ? 'Ocultar' : 'Ver'}
                    </button>
                  </div>
                </div>
              )}

              <button type="submit" className="login-btn-primary" disabled={loading}>
                {loading ? 'Procesando...' : mode === 'login' ? 'Entrar' : 'Crear Cuenta'}
              </button>
            </form>

            <div style={{ fontSize: '0.7rem', color: gray, marginTop: '1.5rem', textAlign: 'center' }}>
              {mode === 'login' ? (
                <span>
                  ¿No tienes cuenta?{' '}
                  <span className="switch-mode-link" onClick={() => { setMode('signup'); setError(''); setSuccess('') }}>
                    Crear cuenta
                  </span>
                </span>
              ) : (
                <span>
                  ¿Ya tienes cuenta?{' '}
                  <span className="switch-mode-link" onClick={() => { setMode('login'); setError(''); setSuccess('') }}>
                    Iniciar sesión
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

const labelStyle = {
  fontSize: '0.58rem', letterSpacing: '0.13em', textTransform: 'uppercase',
  color: gray, display: 'block', marginBottom: '0.4rem', fontWeight: 500
}
