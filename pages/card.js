import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const gold='#b8975a',goldL='#d4b47a',black='#0e0e0c',white='#f8f6f1',gray='#6b6b67'
const ff='DM Sans,sans-serif'
const ffS='Cormorant Garamond,serif'

export default function CardPage({ session }) {
  const [card, setCard] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [noCard, setNoCard] = useState(false)
  const [errMsg, setErrMsg] = useState('')
  const [showProfile, setShowProfile] = useState(false)

  useEffect(() => {
    if (!session) { window.location.href = '/login'; return }
    supabase.from('profiles').select('role').eq('id', session.user.id).single()
      .then(({ data }) => {
        if (data?.role === 'admin') { window.location.href = '/admin'; return }
        load()
      })
  }, [session])

  async function load() {
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
    setProfile(prof)
    const uid = session.user.id
    const res = await fetch('/api/card/me?user_id='+uid)
    const data = await res.json()
    if (res.ok && data.card) {
      setCard(data.card)
    } else {
      setErrMsg(JSON.stringify(data))
      setNoCard(true)
    }
    setLoading(false)
  }

  const signOut = async () => { await supabase.auth.signOut(); window.location.href = '/login' }

  if (loading) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#111110',color:'rgba(255,255,255,0.4)',fontFamily:ff,fontSize:'0.8rem'}}>Cargando...</div>

  const cur = card ? (card.stamps%5===0&&card.stamps>0 ? 5 : card.stamps%5) : 0
  const cycle = card ? (Math.ceil((card.stamps||1)/5)||1) : 1
  const rem = cur===0 ? 5 : 5-cur
  const hasReward = card && card.stamps>0 && card.stamps%5===0

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,400&family=DM+Sans:wght@300;400&display=swap" rel="stylesheet"/>
      <style>{`
        html,body{background:#111110;overscroll-behavior:none;}
        .card-container{max-width:420px;margin:0 auto;padding:0 1.25rem;}
        @media(max-width:480px){
          .client-hero-pad{padding:5rem 1.25rem 3rem!important;}
          .card-container{padding:0 1rem;}
          .card-inner{padding:1.5rem!important;border-radius:16px!important;}
          .stamp-grid{gap:0.4rem!important;}
          .wallet-btns{gap:0.4rem!important;}
          .wallet-btn{padding:0.6rem 0.25rem!important;font-size:0.52rem!important;}
        }
      `}</style>
      <div style={{background:'#111110',minHeight:'100vh',fontFamily:ff}}>
        <div style={{background:'rgba(14,14,12,0.96)',backdropFilter:'blur(12px)',position:'fixed',top:0,left:0,right:0,zIndex:100,height:52,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 1.25rem',borderBottom:'1px solid rgba(184,151,90,0.1)'}}>
          <div style={{fontFamily:ffS,fontSize:'1.1rem',color:white}}>A<span style={{color:gold,fontStyle:'italic'}}>+</span> CRM</div>
          <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
            <span style={{fontSize:'0.6rem',color:'rgba(255,255,255,0.38)',maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{profile?.business_name||session?.user?.email}</span>
            <button onClick={signOut} style={{background:'none',border:'1px solid rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.38)',padding:'0.25rem 0.7rem',fontSize:'0.52rem',letterSpacing:'0.1em',textTransform:'uppercase',cursor:'pointer',borderRadius:2,fontFamily:ff,whiteSpace:'nowrap'}}>Salir</button>
          </div>
        </div>

        <div className="client-hero-pad" style={{background:black,padding:'5.5rem 1.25rem 3rem',textAlign:'center',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 55% 40% at 50% 0%,rgba(184,151,90,0.07) 0%,transparent 70%)'}}/>
          <div style={{fontSize:'0.56rem',letterSpacing:'0.22em',textTransform:'uppercase',color:gold,marginBottom:'0.6rem'}}>Tu Programa de Lealtad</div>
          <h2 style={{fontFamily:ffS,fontSize:'clamp(1.6rem,5vw,2.5rem)',fontWeight:300,color:white,marginBottom:'0.4rem'}}>{profile?.full_name||'Bienvenido'}</h2>
          <div style={{fontSize:'0.68rem',color:'rgba(255,255,255,0.28)'}}>{profile?.business_name} · Cliente A+ CRM</div>
        </div>

        <div className="card-container" style={{transform:'translateY(-1.5rem)'}}>
          {noCard ? (
            <div style={{background:'rgba(184,151,90,0.07)',border:'1px solid rgba(184,151,90,0.17)',borderRadius:10,padding:'2rem',textAlign:'center'}}>
              <div style={{fontSize:'2rem',marginBottom:'1rem'}}>🎴</div>
              <div style={{fontFamily:ffS,fontSize:'1.3rem',color:white,marginBottom:'0.5rem'}}>Tarjeta Pendiente</div>
              <p style={{fontSize:'0.78rem',color:'rgba(255,255,255,0.45)',lineHeight:1.7}}>Tu cuenta esta activa. Tu representante A+ CRM activara tu tarjeta pronto.</p>
            </div>
          ) : card && (
            <>
              <div className="card-inner" style={{background:'linear-gradient(145deg,#1a1917 0%,#252320 55%,#1a1917 100%)',borderRadius:20,padding:'1.75rem',border:'1px solid rgba(184,151,90,0.28)',boxShadow:'0 30px 70px rgba(0,0,0,0.55)',color:white,position:'relative',overflow:'hidden',marginBottom:'1.25rem'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'1.5rem'}}>
                  <div style={{fontFamily:ffS,fontSize:'1.3rem',lineHeight:1}}>
                    A<span style={{color:gold,fontStyle:'italic'}}>+</span> CRM
                    <small style={{display:'block',fontFamily:ff,fontSize:'0.48rem',letterSpacing:'0.16em',textTransform:'uppercase',color:'rgba(184,151,90,0.55)',marginTop:3}}>Loyalty Card · Pagos a Tiempo</small>
                  </div>
                  <div style={{width:34,height:24,borderRadius:4,background:'linear-gradient(135deg,'+gold+','+goldL+')',opacity:0.72}}/>
                </div>
                <div style={{fontSize:'0.5rem',letterSpacing:'0.14em',textTransform:'uppercase',color:'rgba(184,151,90,0.45)',marginBottom:'0.6rem'}}>5 pagos a tiempo = 1 mes gratis</div>
                <div className="stamp-grid" style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'0.5rem',marginBottom:'0.4rem'}}>
                  {Array.from({length:5},(_,i)=>(
                    <div key={i} style={{aspectRatio:'1',borderRadius:'50%',border:i<cur?'none':'1.5px solid rgba(184,151,90,0.2)',background:i<cur?'linear-gradient(135deg,'+gold+','+goldL+')':'transparent',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.6rem',fontWeight:700,color:black}}>
                      {i<cur?'✓':''}
                    </div>
                  ))}
                </div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.48rem',color:'rgba(255,255,255,0.18)',marginBottom:'0.55rem'}}><span>Pago 1</span><span>Pago 5</span></div>
                {hasReward && <div style={{display:'inline-flex',alignItems:'center',gap:'0.4rem',background:'rgba(184,151,90,0.1)',border:'1px solid rgba(184,151,90,0.22)',borderRadius:20,padding:'0.32rem 0.75rem',fontSize:'0.55rem',textTransform:'uppercase',color:gold,marginBottom:'1.5rem'}}>Premio disponible!</div>}
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',borderTop:'1px solid rgba(184,151,90,0.1)',paddingTop:'1rem'}}>
                  <div><div style={{fontSize:'0.48rem',letterSpacing:'0.1em',textTransform:'uppercase',color:'rgba(255,255,255,0.26)'}}>Miembro</div><div style={{fontSize:'0.88rem',marginTop:'0.15rem'}}>{profile?.full_name}</div></div>
                  <div style={{textAlign:'right'}}><div style={{fontSize:'0.48rem',color:'rgba(255,255,255,0.22)'}}>#{card.card_number}</div><div style={{fontSize:'0.58rem',color:gold,marginTop:'0.15rem'}}>Ciclo {cycle} · {cur}/5</div></div>
                </div>
              </div>

              <div style={{marginBottom:'1.25rem'}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.6rem',color:'rgba(255,255,255,0.3)',marginBottom:'0.4rem'}}><span>{cur} sello{cur!==1?'s':''} en ciclo actual</span><span>Meta: 5 = 1 mes gratis</span></div>
                <div style={{height:2,background:'rgba(255,255,255,0.06)',borderRadius:2}}><div style={{height:'100%',width:(cur/5*100)+'%',background:'linear-gradient(90deg,'+gold+','+goldL+')',borderRadius:2}}/></div>
              </div>

              <div style={{background:'rgba(184,151,90,0.07)',border:'1px solid rgba(184,151,90,0.17)',borderRadius:10,padding:'1rem',marginBottom:'1.25rem',textAlign:'center'}}>
                <div style={{fontSize:'0.54rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'rgba(255,255,255,0.28)',marginBottom:'0.3rem'}}>Proximo Premio</div>
                <div style={{fontFamily:ffS,fontSize:'1.2rem',fontWeight:300,color:white}}>
                  {hasReward?'Tu mes gratis esta listo! 🎉':'Te faltan '+rem+' sello'+(rem!==1?'s':'')+' para tu proximo mes gratis'}
                </div>
              </div>

              <div style={{fontSize:'0.54rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'rgba(255,255,255,0.28)',textAlign:'center',marginBottom:'0.6rem'}}>Anade tu tarjeta al wallet</div>
              <div className="wallet-btns" style={{display:'flex',gap:'0.5rem',marginBottom:'2rem'}}>
                {[['🍎','Apple'],['🤖','Google'],['📱','Samsung']].map(([icon,name])=>(
                  <button key={name} className="wallet-btn" style={{flex:1,padding:'0.65rem 0.3rem',border:'1px solid rgba(184,151,90,0.17)',borderRadius:8,background:'rgba(255,255,255,0.03)',cursor:'pointer',fontFamily:ff,fontSize:'0.55rem',textAlign:'center',color:'rgba(255,255,255,0.45)'}}>
                    <span style={{fontSize:'1rem',display:'block',marginBottom:'0.2rem'}}>{icon}</span>{name} Wallet
                  </button>
                ))}
              </div>

              {card.stamp_history?.length>0 && <>
                <div style={{fontSize:'0.54rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'rgba(255,255,255,0.28)',marginBottom:'0.85rem'}}>Historial de Pagos</div>
                {[...card.stamp_history].reverse().map((h,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.75rem 0',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                    <div>
                      <div style={{fontSize:'0.6rem',color:'rgba(255,255,255,0.26)'}}>{new Date(h.created_at).toLocaleDateString('es-PR',{day:'numeric',month:'long',year:'numeric'})}</div>
                      <div style={{fontSize:'0.78rem',color:'rgba(255,255,255,0.72)',marginTop:'0.1rem'}}>Pago registrado{h.payment_amount?' · '+h.payment_amount:''}</div>
                    </div>
                    <span style={{fontSize:'0.54rem',padding:'0.18rem 0.55rem',borderRadius:20,background:'rgba(184,151,90,0.1)',color:gold,border:'1px solid rgba(184,151,90,0.22)',whiteSpace:'nowrap'}}>+1 sello</span>
                  </div>
                ))}
              </>}
            </>
          )}
        </div>
      </div>
    <>
      {/* PROFILE MODAL */}
      {showProfile && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:200,display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={e=>e.target===e.currentTarget&&setShowProfile(false)}>
          <div style={{background:'#1a1917',borderRadius:'16px 16px 0 0',padding:'2rem 1.5rem',width:'100%',maxWidth:480,maxHeight:'80vh',overflowY:'auto',border:'1px solid rgba(184,151,90,0.2)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
              <div style={{fontFamily:ffS,fontSize:'1.4rem',fontWeight:300,color:white}}>Mi Perfil</div>
              <button onClick={()=>setShowProfile(false)} style={{background:'none',border:'none',color:'rgba(255,255,255,0.4)',fontSize:'1.1rem',cursor:'pointer'}}>✕</button>
            </div>
            <div style={{background:'rgba(184,151,90,0.07)',border:'1px solid rgba(184,151,90,0.15)',borderRadius:10,padding:'1.25rem',marginBottom:'1.5rem'}}>
              <div style={{fontSize:'0.52rem',letterSpacing:'0.14em',textTransform:'uppercase',color:gold,marginBottom:'0.75rem'}}>Informacion Personal</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                <div><div style={{fontSize:'0.52rem',color:'rgba(255,255,255,0.35)',marginBottom:'0.2rem'}}>Nombre</div><div style={{fontSize:'0.85rem',color:white}}>{profile?.full_name||'—'}</div></div>
                <div><div style={{fontSize:'0.52rem',color:'rgba(255,255,255,0.35)',marginBottom:'0.2rem'}}>Negocio</div><div style={{fontSize:'0.85rem',color:white}}>{profile?.business_name||'—'}</div></div>
                <div><div style={{fontSize:'0.52rem',color:'rgba(255,255,255,0.35)',marginBottom:'0.2rem'}}>Telefono</div><div style={{fontSize:'0.85rem',color:white}}>{profile?.phone||'—'}</div></div>
                <div><div style={{fontSize:'0.52rem',color:'rgba(255,255,255,0.35)',marginBottom:'0.2rem'}}>Tarjeta</div><div style={{fontSize:'0.85rem',color:gold}}>#{card?.card_number||'—'}</div></div>
              </div>
            </div>
            <div style={{fontSize:'0.52rem',letterSpacing:'0.14em',textTransform:'uppercase',color:gold,marginBottom:'1rem'}}>Historial Completo</div>
            {card?.stamp_history?.length > 0 ? [...card.stamp_history].reverse().map((h,i)=>(
              <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.75rem 0',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                <div>
                  <div style={{fontSize:'0.6rem',color:'rgba(255,255,255,0.3)'}}>{new Date(h.created_at).toLocaleDateString('es-PR',{day:'numeric',month:'long',year:'numeric'})}</div>
                  <div style={{fontSize:'0.78rem',color:'rgba(255,255,255,0.72)',marginTop:'0.1rem'}}>Pago registrado{h.payment_amount?' · '+h.payment_amount:''}</div>
                </div>
                <span style={{fontSize:'0.54rem',padding:'0.18rem 0.55rem',borderRadius:20,background:'rgba(184,151,90,0.1)',color:gold,border:'1px solid rgba(184,151,90,0.22)',whiteSpace:'nowrap'}}>+1 sello</span>
              </div>
            )) : <p style={{fontSize:'0.78rem',color:'rgba(255,255,255,0.3)',textAlign:'center',padding:'1rem 0'}}>Sin historial aun.</p>}
            {card?.rewards?.length > 0 && <>
              <div style={{fontSize:'0.52rem',letterSpacing:'0.14em',textTransform:'uppercase',color:'#52b788',marginTop:'1.5rem',marginBottom:'1rem'}}>Premios Canjeados</div>
              {card.rewards.map((r,i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.75rem 0',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                  <div style={{fontSize:'0.78rem',color:'rgba(255,255,255,0.72)'}}>{r.reward_type}</div>
                  <span style={{fontSize:'0.54rem',padding:'0.18rem 0.55rem',borderRadius:20,background:'rgba(45,150,100,0.12)',color:'#52b788',border:'1px solid rgba(45,150,100,0.25)',whiteSpace:'nowrap'}}>{r.status}</span>
                </div>
              ))}
            </>}
            <button onClick={signOut} style={{width:'100%',marginTop:'1.5rem',background:'rgba(192,57,43,0.1)',color:'#a93226',border:'1px solid rgba(192,57,43,0.2)',padding:'0.85rem',fontFamily:ff,fontSize:'0.65rem',letterSpacing:'0.14em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>Cerrar Sesion</button>
          </div>
        </div>
      )}
    </>
    </>
  )
}
