import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

const gold='#b8975a',black='#0e0e0c',white='#f8f6f1',gray='#6b6b67',gl='#e8e5de'

export default function Login() {
  const router = useRouter()
  const [mode, setMode] = useState('login')
  const [tab, setTab] = useState('client')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({ email:'', password:'', full_name:'', business_name:'', phone:'', confirm_password:'' })
  const upd = (k,v) => setForm(f=>({...f,[k]:v}))

  async function handleLogin(e) {
    e.preventDefault(); setError(''); setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
    setLoading(false)
    if (error) { setError('Credenciales incorrectas.'); return }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
    router.push(profile?.role === 'admin' ? '/admin' : '/card')
  }

  async function handleSignup(e) {
    e.preventDefault(); setError(''); setSuccess('')
    if (form.password !== form.confirm_password) { setError('Las contraseñas no coinciden.'); return }
    if (form.password.length < 6) { setError('Mínimo 6 caracteres.'); return }
    setLoading(true)
    const res = await fetch('/api/auth/signup', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error || 'Error al crear cuenta.'); return }
    setSuccess('¡Cuenta creada! Revisa tu email para confirmar, luego inicia sesión.')
    setMode('login')
  }

  const inp = { width:'100%', padding:'0.8rem 1rem', border:`1px solid ${gl}`, borderRadius:3, background:white, fontFamily:"'DM Sans',sans-serif", fontSize:'0.88rem', outline:'none', color:black, marginBottom:'1rem', boxSizing:'border-box' }
  const lbl = { fontSize:'0.56rem', letterSpacing:'0.13em', textTransform:'uppercase', color:gray, display:'block', marginBottom:'0.35rem' }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,400&family=DM+Sans:wght@300;400&display=swap" rel="stylesheet"/>
      <div style={{ minHeight:'100vh', display:'grid', gridTemplateColumns:'1fr 1fr', fontFamily:"'DM Sans',sans-serif" }}>
        <div style={{ background:black, display:'flex', flexDirection:'column', justifyContent:'center', padding:'5rem', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', fontFamily:"'Cormorant Garamond',serif", fontSize:'18rem', fontWeight:300, color:'rgba(184,151,90,0.04)', lineHeight:1, pointerEvents:'none' }}>A+</div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'2.5rem', fontWeight:300, color:white, marginBottom:'0.4rem' }}>A<span style={{color:gold,fontStyle:'italic'}}>+</span> CRM</div>
          <div style={{ fontSize:'0.6rem', letterSpacing:'0.2em', textTransform:'uppercase', color:'rgba(255,255,255,0.3)', marginBottom:'3rem' }}>Accounting Plus Client Return Management</div>
          {[['🎴','Tarjeta de Lealtad Digital','5 pagos a tiempo = 1 mes gratis.'],['📊','Datos en Tiempo Real','Sellos e historial actualizados al instante.'],['🔒','Acceso Seguro','Tu cuenta, tus datos.']].map(([icon,title,sub])=>(
            <div key={title} style={{ display:'flex', alignItems:'flex-start', gap:'1rem', marginBottom:'1.25rem' }}>
              <div style={{ width:28, height:28, borderRadius:'50%', background:'rgba(184,151,90,0.12)', border:'1px solid rgba(184,151,90,0.25)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:'0.8rem' }}>{icon}</div>
              <div><span style={{ display:'block', fontSize:'0.82rem', color:white, marginBottom:'0.1rem' }}>{title}</span><span style={{ fontSize:'0.72rem', color:'rgba(255,255,255,0.38)', lineHeight:1.6 }}>{sub}</span></div>
            </div>
          ))}
        </div>
        <div style={{ background:white, display:'flex', alignItems:'center', justifyContent:'center', padding:'3rem' }}>
          <div style={{ width:'100%', maxWidth:420 }}>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'2rem', fontWeight:300, marginBottom:'0.3rem' }}>{mode==='login'?'Iniciar Sesión':'Crear Cuenta'}</h2>
            <p style={{ fontSize:'0.72rem', color:gray, marginBottom:'2rem', lineHeight:1.7 }}>{mode==='login'?'Accede a tu portal A+ CRM.':'Tu representante activará tu tarjeta una vez te registres.'}</p>
            {mode==='login' && (
              <div style={{ display:'flex', border:`1px solid ${gl}`, borderRadius:4, overflow:'hidden', marginBottom:'1.75rem' }}>
                {[['client','Cliente / Negocio'],['admin','Administrador']].map(([t,label])=>(
                  <button key={t} onClick={()=>setTab(t)} style={{ flex:1, padding:'0.6rem', fontSize:'0.62rem', letterSpacing:'0.1em', textTransform:'uppercase', cursor:'pointer', border:'none', fontFamily:"'DM Sans',sans-serif", background:tab===t?black:white, color:tab===t?white:gray }}>{label}</button>
                ))}
              </div>
            )}
            {error && <div style={{ color:'#c0392b', fontSize:'0.72rem', marginBottom:'0.85rem', padding:'0.6rem 0.85rem', background:'rgba(192,57,43,0.06)', borderRadius:3 }}>{error}</div>}
            {success && <div style={{ color:'#2d8a60', fontSize:'0.72rem', marginBottom:'0.85rem', padding:'0.6rem 0.85rem', background:'rgba(45,138,96,0.06)', borderRadius:3 }}>{success}</div>}
            <form onSubmit={mode==='login'?handleLogin:handleSignup}>
              {mode==='signup' && <>
                <label style={lbl}>Nombre Completo</label>
                <input style={inp} type="text" placeholder="Tu nombre" value={form.full_name} onChange={e=>upd('full_name',e.target.value)} required/>
                <label style={lbl}>Nombre del Negocio</label>
                <input style={inp} type="text" placeholder="Nombre de tu negocio" value={form.business_name} onChange={e=>upd('business_name',e.target.value)}/>
                <label style={lbl}>Teléfono</label>
                <input style={inp} type="tel" placeholder="787-000-0000" value={form.phone} onChange={e=>upd('phone',e.target.value)}/>
              </>}
              <label style={lbl}>Correo Electrónico</label>
              <input style={inp} type="email" placeholder="correo@negocio.com" value={form.email} onChange={e=>upd('email',e.target.value)} required/>
              <label style={lbl}>Contraseña</label>
              <input style={inp} type="password" placeholder="••••••••" value={form.password} onChange={e=>upd('password',e.target.value)} required/>
              {mode==='signup' && <>
                <label style={lbl}>Confirmar Contraseña</label>
                <input style={inp} type="password" placeholder="••••••••" value={form.confirm_password} onChange={e=>upd('confirm_password',e.target.value)} required/>
              </>}
              <button type="submit" disabled={loading} style={{ width:'100%', background:black, color:white, border:'none', padding:'0.95rem', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontSize:'0.68rem', letterSpacing:'0.16em', textTransform:'uppercase', borderRadius:3, opacity:loading?0.6:1 }}>
                {loading?'Procesando...':(mode==='login'?'Entrar →':'Crear Cuenta →')}
              </button>
            </form>
            <div style={{ fontSize:'0.68rem', color:gray, marginTop:'1.25rem', textAlign:'center' }}>
              {mode==='login'
                ? <>¿No tienes cuenta? <span style={{ color:gold, cursor:'pointer', textDecoration:'underline' }} onClick={()=>{setMode('signup');setError('');setSuccess('')}}>Crear cuenta</span></>
                : <>¿Ya tienes cuenta? <span style={{ color:gold, cursor:'pointer', textDecoration:'underline' }} onClick={()=>{setMode('login');setError('');setSuccess('')}}>Iniciar sesión</span></>}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
