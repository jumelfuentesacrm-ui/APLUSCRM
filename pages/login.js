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
      <d
