import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

const gold='#b8975a',goldL='#d4b47a',black='#0e0e0c',white='#f8f6f1',gray='#6b6b67'

export default function CardPage({ session }) {
  const router = useRouter()
  const [card, setCard] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [noCard, setNoCard] = useState(false)

  useEffect(() => { if (!session) { router.push('/login'); return }; load() }, [session])

  async function load() {
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
    setProfile(prof)
    const res = await fetch('/api/card/me')
    if (res.ok) { const { card } = await res.json(); setCard(card) } else setNoCard(true)
    setLoading(false)
  }

  const signOut = async () => { await supabase.auth.signOut(); router.push('/login') }
  if (loading) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#111110',color:'rgba(255,255,255,0.4)',fontFamily:'sans-serif',fontSize:'0.8rem',letterSpacing:'0.12em'}}>Cargando...</div>

  const cur = card ? (card.stamps%5===0&&card.stamps>0 ? 5 : card.stamps%5) : 0
  const cycle = card ? (Math.ceil((card.stamps||1)/5)||1) : 1
  const rem = cur===0 ? 5 : 5-cur
  const hasReward = card && card.stamps>0 && card.stamps%5===0

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,400&family=DM+Sans:wght@300;400&display=swap" rel="stylesheet"/>
      <div style={{background:'#111110',minHeight:'100vh',fontFamily:"'DM Sans',s
