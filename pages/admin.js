import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const gold='#b8975a',black='#0e0e0c',white='#f8f6f1',gray='#6b6b67',gl='#e8e5de',ink='#1c1c1a'
const ff='DM Sans,sans-serif'
const ffS='Cormorant Garamond,serif'

export default function Admin({ session }) {
  const [panel, setPanel] = useState('cards')
  const [cards, setCards] = useState([])
  const [users, setUsers] = useState([])
  const [rewards, setRewards] = useState([])
  const [loading, setLoading] = useState(true)
  const [punchId, setPunchId] = useState('')
  const [punchAmt, setPunchAmt] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const [toast, setToast] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!session) { window.location.href = '/login'; return }
    supabase.from('profiles').select('role').eq('id', session.user.id).single()
      .then(({ data }) => {
        if (!data || data.role !== 'admin') { window.location.href = '/card'; return }
        loadAll()
      })
  }, [session])

  async function loadAll() {
    setLoading(true)
    const [c,u,r] = await Promise.all([
      fetch('/api/admin/cards').then(r=>r.json()),
      fetch('/api/admin/users').then(r=>r.json()),
      fetch('/api/admin/rewards').then(r=>r.json())
    ])
    setCards(c.cards||[]); setUsers(u.users||[]); setRewards(r.rewards||[])
    setLoading(false)
  }

  function showToast(msg) { setToast(msg); setTimeout(()=>setToast(''),3200) }

  async function doPunch() {
    if (!punchId) { showToast('Selecciona un cliente'); return }
    const res = await fetch('/api/admin/punch', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ card_id:punchId, payment_amount:punchAmt }) })
    const data = await res.json()
    if (res.ok) { showToast(data.message); setPunchId(''); setPunchAmt(''); loadAll() }
    else showToast('Error: '+data.error)
  }

  async function createCard() {
    if (!form.user_id) { showToast('Selecciona un cliente'); return }
    const res = await fetch('/api/admin/cards', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ user_id:form.user_id, notes:form.notes }) })
    const data = await res.json()
    if (res.ok) { showToast('Tarjeta creada'); setModal(null); setForm({}); loadAll() }
    else showToast('Error: '+data.error)
  }

  async function deleteCard(id) {
    if (!confirm('Eliminar esta tarjeta?')) return
    await fetch('/api/admin/cards', { method:'DELETE', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id }) })
    showToast('Tarjeta eliminada'); loadAll()
  }

  async function saveReward() {
    const card = cards.find(c=>c.user_id===form.reward_user_id)
    if (!card) { showToast('Usuario sin tarjeta activa'); return }
    const res = await fetch('/api/admin/rewards', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ card_id:card.id, user_id:form.reward_user_id, reward_type:form.reward_type||'1 Mes Gratis', reward_cost:form.reward_cost, notes:form.reward_notes }) })
    if (res.ok) { showToast('Premio registrado'); setModal(null); setForm({}); loadAll() }
  }

  async function deleteReward(id) {
    await fetch('/api/admin/rewards', { method:'DELETE', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id }) })
    showToast('Premio eliminado'); loadAll()
  }

  const signOut = async () => { await supabase.auth.signOut(); window.location.href = '/login' }
  const upd = (k,v) => setForm(f=>({...f,[k]:v}))
  const totalStamps = cards.reduce((a,c)=>a+(c.stamps||0),0)
  const withReward = cards.filter(c=>c.stamps>0&&c.stamps%5===0).length
  const redeemed = rewards.filter(r=>r.status==='Canjeado').length

  const inp = { width:'100%', padding:'0.75rem 0.9rem', border:'1px solid '+gl, borderRadius:3, background:white, fontFamily:ff, fontSize:'0.88rem', outline:'none', color:black, marginBottom:'1rem', boxSizing:'border-box' }
  const lbl = { fontSize:'0.56rem', letterSpacing:'0.13em', textTransform:'uppercase', color:gray, display:'block', marginBottom:'0.35rem' }

  if (loading) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f2f0eb',fontFamily:ff,fontSize:'0.8rem',color:gray}}>Cargando panel...</div>

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,400&family=DM+Sans:wght@300;400&display=swap" rel="stylesheet"/>
      <style>{`
        @media(max-width:700px){
          .admin-sidebar{display:none!important;}
          .admin-main{margin-left:0!important;padding:1.25rem!important;}
          .stats-grid{grid-template-columns:1fr 1fr!important;}
          .cards-grid{grid-template-columns:1fr!important;}
          .punch-row{grid-template-columns:1fr!important;}
          .rewards-table{font-size:0.7rem!important;}
          .mobile-nav{display:flex!important;}
          .modal-inner{padding:1.5rem!important;}
        }
        .mobile-nav{display:none;position:fixed;bottom:0;left:0;right:0;background:${ink};z-index:200;border-top:1px solid rgba(184,151,90,0.15);}
        .mobile-nav button{flex:1;padding:0.85rem 0.25rem;background:none;border:none;color:rgba(255,255,255,0.4);font-family:${ff};font-size:0.55rem;letter-spacing:0.08em;text-transform:uppercase;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:0.25rem;}
        .mobile-nav button.active{color:${gold};}
        .mobile-nav button span{font-size:1.1rem;}
      `}</style>

      <div style={{background:'#f2f0eb',minHeight:'100vh',fontFamily:ff,paddingBottom:60}}>
        <div style={{background:black,position:'fixed',top:0,left:0,right:0,zIndex:100,height:52,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 1.25rem'}}>
          <div style={{fontFamily:ffS,fontSize:'1.1rem',color:white}}>A<span style={{color:gold,fontStyle:'italic'}}>+</span> CRM <span style={{fontSize:'0.48rem',letterSpacing:'0.14em',textTransform:'uppercase',color:'rgba(255,255,255,0.26)',marginLeft:'0.4rem',fontFamily:ff}}>Admin</span></div>
          <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
            <button onClick={signOut} style={{background:'none',border:'1px solid rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.38)',padding:'0.25rem 0.75rem',fontSize:'0.52rem',letterSpacing:'0.1em',textTransform:'uppercase',cursor:'pointer',borderRadius:2,fontFamily:ff}}>Salir</button>
          </div>
        </div>

        <div style={{display:'flex',paddingTop:52,minHeight:'100vh'}}>
          <div className="admin-sidebar" style={{width:190,background:ink,flexShrink:0,position:'fixed',top:52,left:0,bottom:0,padding:'1.5rem 0'}}>
            {[['cards','🎴','Tarjetas'],['punch','✦','Ponchar'],['rewards','🎁','Premios']].map(([id,icon,label])=>(
              <button key={id} onClick={()=>setPanel(id)} style={{display:'flex',alignItems:'center',gap:'0.65rem',padding:'0.82rem 1.5rem',fontSize:'0.66rem',letterSpacing:'0.1em',textTransform:'uppercase',color:panel===id?gold:'rgba(255,255,255,0.32)',cursor:'pointer',background:'none',border:'none',borderLeft:panel===id?'2px solid '+gold:'2px solid transparent',width:'100%',textAlign:'left',fontFamily:ff}}>
                <span>{icon}</span>{label}
              </button>
            ))}
          </div>

          <div className="admin-main" style={{marginLeft:190,flex:1,padding:'1.75rem',maxWidth:980}}>
            <div className="stats-grid" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'0.75rem',marginBottom:'1.5rem'}}>
              {[[cards.length,'Tarjetas'],[totalStamps,'Sellos'],[withReward,'Disponibles'],[redeemed,'Canjeados']].map(([val,label])=>(
                <div key={label} style={{background:white,borderRadius:8,padding:'1rem',border:'1px solid rgba(14,14,12,0.06)'}}>
                  <div style={{fontFamily:ffS,fontSize:'1.75rem',fontWeight:300,color:gold,lineHeight:1}}>{val}</div>
                  <div style={{fontSize:'0.52rem',letterSpacing:'0.1em',textTransform:'uppercase',color:gray,marginTop:'0.3rem'}}>{label}</div>
                </div>
              ))}
            </div>

            {panel==='cards' && <>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.25rem'}}>
                <h2 style={{fontFamily:ffS,fontSize:'1.5rem',fontWeight:300}}>Tarjetas</h2>
                <button onClick={()=>setModal('card')} style={{background:black,color:white,border:'none',padding:'0.6rem 1.1rem',fontFamily:ff,fontSize:'0.6rem',letterSpacing:'0.12em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>+ Nueva</button>
              </div>
              <div className="cards-grid" style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:'1rem'}}>
                {cards.map(card=>{
                  const cur=card.stamps%5===0&&card.stamps>0?5:card.stamps%5
                  const cycle=Math.ceil((card.stamps||1)/5)||1
                  const hasR=card.stamps>0&&card.stamps%5===0
                  return (
                    <div key={card.id} style={{background:white,borderRadius:10,border:'1px solid rgba(14,14,12,0.07)',overflow:'hidden'}}>
                      <div style={{background:'linear-gradient(135deg,#1a1917,#252320)',padding:'1rem',color:white}}>
                        <div style={{fontFamily:ffS,fontSize:'0.9rem',marginBottom:'0.15rem'}}>A<span style={{color:gold,fontStyle:'italic'}}>+</span> CRM</div>
                        <div style={{fontSize:'0.72rem',color:'rgba(255,255,255,0.8)',marginBottom:'0.65rem'}}>{card.profiles?.business_name||card.profiles?.full_name}</div>
                        <div style={{display:'flex',gap:3}}>{Array.from({length:5},(_,i)=><div key={i} style={{width:12,height:12,borderRadius:'50%',border:'1px solid rgba(184,151,90,0.22)',background:i<cur?gold:'transparent'}}/>)}</div>
                      </div>
                      <div style={{padding:'0.85rem 1rem'}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.5rem'}}>
                          <div style={{fontSize:'0.68rem',color:gray}}><strong style={{color:black}}>{cur}/5</strong> · Ciclo {cycle}</div>
                          <div style={{fontSize:'0.54rem',padding:'0.15rem 0.55rem',borderRadius:20,background:'rgba(184,151,90,0.1)',color:gold}}>{hasR?'Premio':'#'+card.card_number}</div>
                        </div>
                        <div style={{fontSize:'0.62rem',color:gray,marginBottom:'0.65rem'}}>{card.profiles?.full_name}</div>
                        <div style={{display:'flex',gap:'0.4rem'}}>
                          <button onClick={()=>{setPunchId(card.id);setPanel('punch')}} style={{flex:1,padding:'0.45rem',background:black,color:white,border:'none',borderRadius:3,cursor:'pointer',fontFamily:ff,fontSize:'0.56rem',letterSpacing:'0.07em',textTransform:'uppercase'}}>+ Sello</button>
                          <button onClick={()=>deleteCard(card.id)} style={{flex:1,padding:'0.45rem',background:'rgba(192,57,43,0.08)',color:'#a93226',border:'none',borderRadius:3,cursor:'pointer',fontFamily:ff,fontSize:'0.56rem',letterSpacing:'0.07em',textTransform:'uppercase'}}>Borrar</button>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {cards.length===0 && <p style={{color:gray,fontSize:'0.85rem'}}>No hay tarjetas aun.</p>}
              </div>
            </>}

            {panel==='punch' && <>
              <h2 style={{fontFamily:ffS,fontSize:'1.5rem',fontWeight:300,marginBottom:'1.25rem'}}>Ponchar Tarjeta</h2>
              <div style={{background:white,borderRadius:10,padding:'1.5rem',border:'1px solid rgba(14,14,12,0.07)'}}>
                <div className="punch-row" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem',marginBottom:'1rem'}}>
                  <div>
                    <label style={lbl}>Cliente</label>
                    <select value={punchId} onChange={e=>setPunchId(e.target.value)} style={{...inp,marginBottom:0}}>
                      <option value="">Seleccionar</option>
                      {cards.map(c=><option key={c.id} value={c.id}>{c.profiles?.business_name||c.profiles?.full_name} · {c.stamps%5===0&&c.stamps>0?5:c.stamps%5}/5</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Monto (opcional)</label>
                    <input style={{...inp,marginBottom:0}} type="text" placeholder="$0.00" value={punchAmt} onChange={e=>setPunchAmt(e.target.value)}/>
                  </div>
                </div>
                {punchId && (()=>{
                  const card=cards.find(c=>c.id===punchId)
                  const cur=card?(card.stamps%5===0&&card.stamps>0?5:card.stamps%5):0
                  return <div style={{background:'linear-gradient(135deg,#1a1917,#252320)',borderRadius:10,padding:'1.1rem',marginBottom:'1rem',border:'1px solid rgba(184,151,90,0.22)',color:white}}>
                    <div style={{fontFamily:ffS,fontSize:'1rem',marginBottom:'0.45rem'}}>A<span style={{color:gold,fontStyle:'italic'}}>+</span> CRM · {card?.profiles?.business_name||card?.profiles?.full_name}</div>
                    <div style={{display:'flex',gap:5}}>{Array.from({length:5},(_,i)=><div key={i} style={{width:15,height:15,borderRadius:'50%',border:'1.5px solid rgba(184,151,90,0.22)',background:i<cur?gold:i===cur?'rgba(184,151,90,0.35)':'transparent'}}/>)}</div>
                  </div>
                })()}
                <button onClick={doPunch} style={{width:'100%',background:black,color:white,border:'none',padding:'0.85rem',fontFamily:ff,fontSize:'0.66rem',letterSpacing:'0.14em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>Dar Sello</button>
              </div>
            </>}

            {panel==='rewards' && <>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.25rem'}}>
                <h2 style={{fontFamily:ffS,fontSize:'1.5rem',fontWeight:300}}>Premios</h2>
                <button onClick={()=>setModal('reward')} style={{background:black,color:white,border:'none',padding:'0.6rem 1.1rem',fontFamily:ff,fontSize:'0.6rem',letterSpacing:'0.12em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>+ Registrar</button>
              </div>
              <div style={{background:white,borderRadius:10,overflow:'hidden',border:'1px solid rgba(14,14,12,0.07)',overflowX:'auto'}}>
                <table className="rewards-table" style={{width:'100%',borderCollapse:'collapse',minWidth:500}}>
                  <thead><tr>{['#','Cliente','Tipo','Costo','Fecha',''].map(h=><th key={h} style={{padding:'0.65rem 1rem',textAlign:'left',fontSize:'0.54rem',letterSpacing:'0.12em',textTransform:'uppercase',color:gray,borderBottom:'1px solid rgba(14,14,12,0.06)',fontWeight:400}}>{h}</th>)}</tr></thead>
                  <tbody>
                    {rewards.map((r,i)=>(
                      <tr key={r.id}>
                        <td style={{padding:'0.85rem 1rem',fontSize:'0.7rem',color:gray,borderBottom:'1px solid rgba(14,14,12,0.04)'}}>#{i+1}</td>
                        <td style={{padding:'0.85rem 1rem',fontSize:'0.78rem',borderBottom:'1px solid rgba(14,14,12,0.04)'}}><strong>{r.profiles?.business_name||r.profiles?.full_name}</strong></td>
                        <td style={{padding:'0.85rem 1rem',fontSize:'0.78rem',borderBottom:'1px solid rgba(14,14,12,0.04)'}}>{r.reward_type}</td>
                        <td style={{padding:'0.85rem 1rem',fontSize:'0.78rem',color:gold,fontWeight:500,borderBottom:'1px solid rgba(14,14,12,0.04)'}}>{r.reward_cost||'-'}</td>
                        <td style={{padding:'0.85rem 1rem',fontSize:'0.78rem',color:gray,borderBottom:'1px solid rgba(14,14,12,0.04)'}}>{r.redeemed_at?new Date(r.redeemed_at).toLocaleDateString('es-PR'):'-'}</td>
                        <td style={{padding:'0.85rem 1rem',borderBottom:'1px solid rgba(14,14,12,0.04)'}}><button onClick={()=>deleteReward(r.id)} style={{background:'none',border:'none',cursor:'pointer',color:gray,fontSize:'0.75rem'}}>x</button></td>
                      </tr>
                    ))}
                    {rewards.length===0 && <tr><td colSpan={6} style={{padding:'2rem',textAlign:'center',color:gray,fontSize:'0.82rem'}}>Sin premios registrados.</td></tr>}
                  </tbody>
                </table>
              </div>
            </>}
          </div>
        </div>

        {/* Mobile bottom nav */}
        <div className="mobile-nav">
          {[['cards','🎴','Tarjetas'],['punch','✦','Ponchar'],['rewards','🎁','Premios']].map(([id,icon,label])=>(
            <button key={id} onClick={()=>setPanel(id)} className={panel===id?'active':''}>
              <span>{icon}</span>{label}
            </button>
          ))}
        </div>

        {modal==='card' && (
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:500,display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={e=>e.target===e.currentTarget&&setModal(null)}>
            <div className="modal-inner" style={{background:white,borderRadius:'12px 12px 0 0',padding:'2rem',width:'100%',maxWidth:520,maxHeight:'90vh',overflowY:'auto'}}>
              <h3 style={{fontFamily:ffS,fontSize:'1.5rem',fontWeight:300,marginBottom:'0.35rem'}}>Nueva Tarjeta</h3>
              <p style={{fontSize:'0.72rem',color:gray,marginBottom:'1.5rem'}}>Asigna una tarjeta a un cliente registrado.</p>
              <label style={lbl}>Cliente</label>
              <select value={form.user_id||''} onChange={e=>upd('user_id',e.target.value)} style={inp}>
                <option value="">Seleccionar cliente</option>
                {users.map(u=><option key={u.id} value={u.id}>{u.business_name||u.full_name}</option>)}
              </select>
              <label style={lbl}>Notas (opcional)</label>
              <input style={inp} type="text" placeholder="Informacion adicional..." value={form.notes||''} onChange={e=>upd('notes',e.target.value)}/>
              <div style={{display:'flex',gap:'0.75rem'}}>
                <button onClick={createCard} style={{flex:1,background:black,color:white,border:'none',padding:'0.85rem',fontFamily:ff,fontSize:'0.66rem',letterSpacing:'0.14em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>Crear Tarjeta</button>
                <button onClick={()=>setModal(null)} style={{background:'rgba(14,14,12,0.06)',color:black,border:'none',padding:'0.85rem 1.25rem',fontFamily:ff,fontSize:'0.66rem',letterSpacing:'0.14em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>Cancelar</button>
              </div>
            </div>
          </div>
        )}

        {modal==='reward' && (
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:500,display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={e=>e.target===e.currentTarget&&setModal(null)}>
            <div className="modal-inner" style={{background:white,borderRadius:'12px 12px 0 0',padding:'2rem',width:'100%',maxWidth:520,maxHeight:'90vh',overflowY:'auto'}}>
              <h3 style={{fontFamily:ffS,fontSize:'1.5rem',fontWeight:300,marginBottom:'0.35rem'}}>Registrar Premio</h3>
              <p style={{fontSize:'0.72rem',color:gray,marginBottom:'1.5rem'}}>Documenta el premio con tipo y costo.</p>
              <label style={lbl}>Cliente</label>
              <select value={form.reward_user_id||''} onChange={e=>upd('reward_user_id',e.target.value)} style={inp}>
                <option value="">Seleccionar</option>
                {users.map(u=><option key={u.id} value={u.id}>{u.business_name||u.full_name}</option>)}
              </select>
              <label style={lbl}>Tipo de Premio</label>
              <select value={form.reward_type||'1 Mes Gratis'} onChange={e=>upd('reward_type',e.target.value)} style={inp}>{['1 Mes Gratis','Descuento 50%','Servicio Extra','Otro'].map(t=><option key={t}>{t}</option>)}</select>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
                <div><label style={lbl}>Costo</label><input style={{...inp,marginBottom:0}} type="text" placeholder="$0.00" value={form.reward_cost||''} onChange={e=>upd('reward_cost',e.target.value)}/></div>
                <div><label style={lbl}>Fecha</label><input style={{...inp,marginBottom:0}} type="date" value={form.reward_date||new Date().toISOString().split('T')[0]} onChange={e=>upd('reward_date',e.target.value)}/></div>
              </div>
              <label style={{...lbl,marginTop:'1rem'}}>Notas (opcional)</label>
              <input style={inp} type="text" placeholder="Detalles..." value={form.reward_notes||''} onChange={e=>upd('reward_notes',e.target.value)}/>
              <div style={{display:'flex',gap:'0.75rem',marginTop:'0.5rem'}}>
                <button onClick={saveReward} style={{flex:1,background:black,color:white,border:'none',padding:'0.85rem',fontFamily:ff,fontSize:'0.66rem',letterSpacing:'0.14em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>Registrar Premio</button>
                <button onClick={()=>setModal(null)} style={{background:'rgba(14,14,12,0.06)',color:black,border:'none',padding:'0.85rem 1.25rem',fontFamily:ff,fontSize:'0.66rem',letterSpacing:'0.14em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>Cancelar</button>
              </div>
            </div>
          </div>
        )}

        {toast && <div style={{position:'fixed',bottom:'5rem',right:'1rem',background:black,color:white,padding:'0.85rem 1.25rem',borderRadius:8,fontSize:'0.74rem',borderLeft:'3px solid '+gold,zIndex:9999,maxWidth:280}}>{toast}</div>}
      </div>
    </>
  )
}
