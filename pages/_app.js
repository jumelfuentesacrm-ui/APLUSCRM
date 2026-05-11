import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Head from 'next/head'

export default function App({ Component, pageProps }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#0e0e0c',color:'#f8f6f1',fontFamily:'sans-serif',fontSize:'0.8rem',letterSpacing:'0.1em'}}>A+ CRM</div>

  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.png" type="image/png"/>
        <title>A+ CRM</title>
      </Head>
      <Component {...pageProps} session={session} />
    </>
  )
}
