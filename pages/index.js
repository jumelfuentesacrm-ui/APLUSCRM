import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

export default function Home({ session }) {
  const router = useRouter()
  useEffect(() => {
    if (!session) { router.push('/login'); return }
    supabase.from('profiles').select('role').eq('id', session.user.id).single()
      .then(({ data }) => router.push(data?.role === 'admin' ? '/admin' : '/card'))
  }, [session])
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0e0e0c', color:'#f8f6f1', fontFamily:'sans-serif', fontSize:'0.9rem', letterSpacing:'0.1em' }}>
      Cargando A+ CRM...
    </div>
  )
}
