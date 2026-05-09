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
      <div style={{background:'#111110',minHeight:'100vh',fontFamily:"'DM Sans',sans-serif"}}>
        <div style={{background:'rgba(14,14,12,0.96)',backdropFilter:'blur(12px)',position:'fixed',top:0,left:0,right:0,zIndex:100,height:58,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 2rem',borderBottom:'1px solid rgba(184,151,90,0.1)'}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'1.15rem',color:white}}>A<span style={{color:gold,fontStyle:'italic'}}>+</span> CRM</div>
          <div style={{display:'flex',alignItems:'center',gap:'1rem'}}>
            <span style={{fontSize:'0.66rem',color:'rgba(255,255,255,0.38)'}}>{profile?.business_name||session?.user?.email}</span>
            <button onClick={signOut} style={{background:'none',border:'1px solid rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.38)',padding:'0.28rem 0.85rem',fontSize:'0.56rem',letterSpacing:'0.1em',textTransform:'uppercase',cursor:'pointer',borderRadius:2,fontFamily:"'DM Sans',sans-serif"}}>Salir</button>
          </div>
        </div>
        <div style={{background:black,padding:'6.5rem 2rem 4.5rem',textAlign:'center',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 55% 40% at 50% 0%,rgba(184,151,90,0.07) 0%,transparent 70%)'}}/>
          <div style={{fontSize:'0.58rem',letterSpacing:'0.22em',textTransform:'uppercase',color:gold,marginBottom:'0.7rem'}}>Tu Programa de Lealtad</div>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'2.5rem',fontWeight:300,color:white,marginBottom:'0.4rem'}}>{profile?.full_name||'Bienvenido'}</h2>
          <div style={{fontSize:'0.72rem',color:'rgba(255,255,255,0.28)'}}>{profile?.business_name} · Cliente A+ CRM</div>
        </div>
        <div style={{maxWidth:380,margin:'0 auto',padding:'0 1.5rem',transform:'translateY(-1.75rem)'}}>
          {noCard ? (
            <div style={{background:'rgba(184,151,90,0.07)',border:'1px solid rgba(184,151,90,0.17)',borderRadius:10,padding:'2rem',textAlign:'center'}}>
              <div style={{fontSize:'2rem',marginBottom:'1rem'}}>🎴</div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'1.3rem',color:white,marginBottom:'0.5rem'}}>Tarjeta Pendiente</div>
              <p style={{fontSize:'0.78rem',color:'rgba(255,255,255,0.45)',lineHeight:1.7}}>Tu cuenta está activa. Tu representante A+ CRM activará tu tarjeta pronto.</p>
            </div>
          ) : card && (
            <>
              <div style={{background:'linear-gradient(145deg,#1a1917 0%,#252320 55%,#1a1917 100%)',borderRadius:22,padding:'2.2rem',border:'1px solid rgba(184,151,90,0.28)',boxShadow:'0 50px 100px rgba(0,0,0,0.55)',color:white,position:'relative',overflow:'hidden'}}>
                <div style={{position:'absolute',top:'-40%',right:'-25%',width:260,height:260,borderRadius:'50%',background:'radial-gradient(circle,rgba(184,151,90,0.07) 0%,transparent 70%)'}}/>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'1.9rem'}}>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'1.45rem',lineHeight:1}}>
                    A<span style={{color:gold,fontStyle:'italic'}}>+</span> CRM
                    <small style={{display:'block',fontFamily:"'DM Sans',sans-serif",fontSize:'0.5rem',letterSpacing:'0.18em',textTransform:'uppercase',color:'rgba(184,151,90,0.55)',marginTop:4,fontWeight:300}}>Loyalty Card · Pagos a Tiempo</small>
                  </div>
                  <div style={{width:38,height:28,borderRadius:5,background:`linear-gradient(135deg,${gold},${goldL})`,opacity:0.72}}/>
                </div>
                <div style={{fontSize:'0.52rem',letterSpacing:'0.16em',textTransform:'uppercase',color:'rgba(184,151,90,0.45)',marginBottom:'0.7rem'}}>5 pagos a tiempo = 1 mes de servicio gratis</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'0.55rem',marginBottom:'0.45rem'}}>
                  {Array.from({length:5},(_,i)=>(
                    <div key={i} style={{aspectRatio:'1',borderRadius:'50%',border:i<cur?'none':'1.5px solid rgba(184,151,90,0.2)',background:i<cur?`linear-gradient(135deg,${gold},${goldL})`:'transparent',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:i<cur?'0 4px 16px rgba(184,151,90,0.28)':'none',fontSize:'0.65rem',fontWeight:700,color:black}}>
                      {i<cur?'✓':''}
                    </div>
                  ))}
                </div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.5rem',color:'rgba(255,255,255,0.18)',marginBottom:'0.6rem'}}><span>Pago 1</span><span>Pago 5</span></div>
                {hasReward && <div style={{display:'inline-flex',alignItems:'center',gap:'0.45rem',background:'rgba(184,151,90,0.1)',border:'1px solid rgba(184,151,90,0.22)',borderRadius:20,padding:'0.38rem 0.85rem',fontSize:'0.58rem',textTransform:'uppercase',color:gold,marginBottom:'1.7rem'}}>🎁 ¡Premio disponible! Contacta a tu representante</div>}
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',borderTop:'1px solid rgba(184,151,90,0.1)',paddingTop:'1.2rem'}}>
                  <div><div style={{fontSize:'0.5rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'rgba(255,255,255,0.26)'}}>Miembro</div><div style={{fontSize:'0.92rem',marginTop:'0.18rem'}}>{profile?.full_name}</div></div>
                  <div style={{textAlign:'right'}}><div style={{fontSize:'0.5rem',color:'rgba(255,255,255,0.22)'}}>#{card.card_number}</div><div style={{fontSize:'0.6rem',color:gold,marginTop:'0.18rem'}}>Ciclo {cycle} · {cur}/5</div></div>
                </div>
              </div>
              <div style={{marginBottom:'1.75rem',marginTop:'1rem'}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.62rem',color:'rgba(255,255,255,0.3)',marginBottom:'0.45rem'}}><span>{cur} sello{cur!==1?'s':''} en ciclo actual</span><span>Meta: 5 → 1 mes gratis</span></div>
                <div style={{height:2,background:'rgba(255,255,255,0.06)',borderRadius:2}}><div style={{height:'100%',width:(cur/5*100)+'%',background:`linear-gradient(90deg,${gold},${goldL})`,borderRadius:2,transition:'width 1.2s ease'}}/></div>
              </div>
              <div style={{background:'rgba(184,151,90,0.07)',border:'1px solid rgba(184,151,90,0.17)',borderRadius:10,padding:'1.2rem',marginBottom:'1.4rem',textAlign:'center'}}>
                <div style={{fontSize:'0.56rem',letterSpacing:'0.14em',textTransform:'uppercase',color:'rgba(255,255,255,0.28)',marginBottom:'0.35rem'}}>Próximo Premio</div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'1.3rem',fontWeight:300,color:white}}>
                  {hasReward?<>¡Tu <span style={{color:gold,fontStyle:'italic'}}>mes gratis</span> está listo! 🎉</>:<>Te faltan <span style={{color:gold,fontStyle:'italic'}}>{rem} sello{rem!==1?'s':''}</span> para tu próximo mes gratis</>}
                </div>
              </div>
              <div style={{fontSize:'0.56rem',letterSpacing:'0.14em',textTransform:'uppercase',color:'rgba(255,255,255,0.28)',textAlign:'center',marginBottom:'0.7rem'}}>Añade tu tarjeta al wallet</div>
              <div style={{display:'flex',gap:'0.55rem',marginBottom:'2rem'}}>
                {[['🍎','Apple Wallet'],['🤖','Google Wallet'],['📱','Samsung Wallet']].map(([icon,name])=>(
                  <button key={name} style={{flex:1,padding:'0.72rem 0.4rem',border:'1px solid rgba(184,151,90,0.17)',borderRadius:8,background:'rgba(255,255,255,0.03)',cursor:'pointer',fontFamily:"'DM Sans',sans-serif",fontSize:'0.58rem',textAlign:'center',color:'rgba(255,255,255,0.45)'}}>
                    <span style={{fontSize:'1.05rem',display:'block',marginBottom:'0.22rem'}}>{icon}</span>{name}
                  </button>
                ))}
              </div>
              {card.stamp_history?.length>0 && <>
                <div style={{fontSize:'0.56rem',letterSpacing:'0.14em',textTransform:'uppercase',color:'rgba(255,255,255,0.28)',marginBottom:'1rem'}}>Historial de Pagos</div>
                {[...card.stamp_history].reverse().map((h,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.82rem 0',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                    <div>
                      <div style={{fontSize:'0.62rem',color:'rgba(255,255,255,0.26)'}}>{new Date(h.created_at).toLocaleDateString('es-PR',{day:'numeric',month:'long',year:'numeric'})}</div>
                      <div style={{fontSize:'0.8rem',color:'rgba(255,255,255,0.72)',marginTop:'0.1rem'}}>Pago registrado{h.payment_amount?` · ${h.payment_amount}`:''}</div>
                    </div>
                    <span style={{fontSize:'0.56rem',padding:'0.2rem 0.62rem',borderRadius:20,background:'rgba(184,151,90,0.1)',color:gold,border:'1px solid rgba(184,151,90,0.22)',whiteSpace:'nowrap'}}>+1 sello</span>
                  </div>
                ))}
              </>}
            </>
          )}
        </div>
      </div>
    </>
  )
}
