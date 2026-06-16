import React, { useEffect, useRef, useState, useContext, createContext } from 'react'
import dynamic from 'next/dynamic'
const LeadMap = dynamic(() => import('../components/LeadMap'), { ssr: false })
const DarkCtx = createContext(false)
function useDark() { return useContext(DarkCtx) }
// Dark-mode token helper — call inside any component
function useTheme() {
  const dm = useDark()
  return {
    dm,
    bg:          dm ? '#0e0e0c'                        : '#f8f6f1',
    cardBg:      dm ? 'rgba(255,255,255,0.05)'         : 'rgba(248,246,241,0.65)',
    cardBorder:  dm ? 'rgba(255,255,255,0.08)'         : 'rgba(255,255,255,0.75)',
    cardShadow:  dm ? '0 4px 20px rgba(0,0,0,0.5)'    : 'inset 0 1px 0 rgba(255,255,255,0.85),0 4px 20px -4px rgba(28,28,26,0.08)',
    surfaceBg:   dm ? '#1a1a18'                        : cream,
    inkC:        dm ? 'rgba(255,255,255,0.9)'          : ink,
    grayC:       dm ? 'rgba(255,255,255,0.4)'          : gray,
    inputBg:     dm ? 'rgba(255,255,255,0.07)'         : '#fff',
    inputBorder: dm ? 'rgba(255,255,255,0.12)'         : 'rgba(14,14,12,0.12)',
    subtleBg:    dm ? 'rgba(255,255,255,0.05)'         : 'rgba(14,14,12,0.03)',
    divider:     dm ? 'rgba(255,255,255,0.07)'         : 'rgba(14,14,12,0.06)',
    glassCard:   { background: dm?'rgba(255,255,255,0.05)':'rgba(248,246,241,0.65)', backdropFilter:'blur(20px) saturate(160%)', WebkitBackdropFilter:'blur(20px) saturate(160%)', border:`1px solid ${dm?'rgba(255,255,255,0.08)':'rgba(255,255,255,0.75)'}`, boxShadow: dm?'0 4px 20px rgba(0,0,0,0.5)':'inset 0 1px 0 rgba(255,255,255,0.85),0 4px 20px -4px rgba(28,28,26,0.08)' },
  }
}
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import { COLORS, FONTS, HEADER_H, formatPhone } from '../lib/config'

const {gold,black,white,cream,gray,gl,ink} = COLORS
const ff=FONTS.body, ffS=FONTS.heading

const STATUS_COLORS_BOOKINGS = {
  pending:   { label:'Pending',   color:'#e67e22', bg:'rgba(230,126,34,0.1)' },
  confirmed: { label:'Confirmed', color:'#2d8a60', bg:'rgba(45,138,96,0.1)' },
  cancelled: { label:'Cancelled', color:'#c0392b', bg:'rgba(192,57,43,0.1)' },
  completed: { label:'Completed', color:'#b8975a', bg:'rgba(184,151,90,0.12)' },
}

function getStatus(card) {
  if (!card) return { label:'New', color:'#8e44ad', bg:'rgba(142,68,173,0.1)' }
  const stamps = card.stamps || 0
  let days = null
  if (card.stamp_history && card.stamp_history.length > 0) {
    const last = new Date(card.stamp_history[card.stamp_history.length-1].created_at)
    days = (Date.now()-last)/(1000*60*60*24)
  }
  if (days !== null) {
    if (days >= 66) return { label:'Cancelled', color:'#c0392b', bg:'rgba(192,57,43,0.1)' }
    if (days >= 38) return { label:'Late Fee', color:'#e74c3c', bg:'rgba(231,76,60,0.1)' }
    if (days >= 35) return { label:'Grace', color:'#e67e22', bg:'rgba(230,126,34,0.1)' }
  }
  if (stamps >= 15) return { label:'VIP', color:'#b8975a', bg:'rgba(184,151,90,0.12)' }
  if (stamps >= 10) return { label:'Regular', color:'#2d8a60', bg:'rgba(45,138,96,0.1)' }
  if (stamps >= 5) return { label:'Active', color:'#3498db', bg:'rgba(52,152,219,0.1)' }
  return { label:'New', color:'#8e44ad', bg:'rgba(142,68,173,0.1)' }
}

function getDaysSinceLastPurchase(card) {
  if (!card||!card.stamp_history||card.stamp_history.length===0) return null
  const last = new Date(card.stamp_history[card.stamp_history.length-1].created_at)
  return Math.floor((Date.now()-last)/(1000*60*60*24))
}

function getNotifications(cards) {
  const alerts = []
  cards.forEach(card => {
    const days = getDaysSinceLastPurchase(card)
    if (days === null) return
    const name = card.profiles?.business_name || card.profiles?.full_name || 'Client'
    if (days >= 66) alerts.push({ card, days, level: 3, msg: `${name} — Service cancelled (${days} days)` })
    else if (days >= 38) alerts.push({ card, days, level: 3, msg: `${name} — $30 late fee applied (${days} days)` })
    else if (days >= 35) alerts.push({ card, days, level: 2, msg: `${name} — Grace period, 3 days to pay (${days} days)` })
    else if (days >= 30) alerts.push({ card, days, level: 1, msg: `${name} — Payment due soon (${days} days)` })
  })
  return alerts.sort((a,b) => b.days - a.days)
}

function DashboardPanel({ cards, sales, users, session, onSelectClient, onPunch, onGoCards }) {
  const [bookings, setBookings] = useState([])
  useEffect(() => {
    const today = new Date().toISOString().slice(0,10)
    const next30 = new Date(); next30.setDate(next30.getDate()+30)
    fetch(`/api/admin/bookings?from=${today}&to=${next30.toISOString().slice(0,10)}`)
      .then(r=>r.json()).then(d=>setBookings(Array.isArray(d)?d:[])).catch(()=>{})
  },[])

  const adminName = session?.user?.email?.split('@')[0] || 'Admin'
  const firstName = adminName.charAt(0).toUpperCase() + adminName.slice(1)

  const today = new Date().toISOString().slice(0,10)
  const todayBookings = bookings.filter(b=>b.date===today)

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const monthRevenue = sales.filter(s=>s.sale_date>=monthStart).reduce((sum,s)=>sum+(parseFloat(s.amount)||0),0)
  const newClientsMonth = users.filter(u=>u.created_at&&u.created_at>=monthStart).length

  const upcoming = bookings.filter(b=>b.status!=='cancelled').slice(0,5)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches'

  const glassCard = {background:'rgba(248,246,241,0.65)',backdropFilter:'blur(20px) saturate(160%)',borderRadius:16,border:'1px solid rgba(255,255,255,0.75)',boxShadow:'inset 0 1px 0 rgba(255,255,255,0.85),0 4px 20px -4px rgba(28,28,26,0.08)'}

  return (
    <div style={{maxWidth:520}}>
      {/* Greeting */}
      <div style={{marginBottom:'1.25rem'}}>
        <div style={{fontSize:'0.62rem',fontWeight:700,letterSpacing:'0.15em',textTransform:'uppercase',color:gold,marginBottom:'0.2rem'}}>{greeting.toUpperCase()}, {firstName.toUpperCase()}</div>
        <div style={{fontFamily:ffS,fontSize:'1.75rem',fontWeight:500,color:black,lineHeight:1.1}}>
          Tienes {todayBookings.length} consulta{todayBookings.length!==1?'s':''} hoy
        </div>
      </div>

      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0.6rem',marginBottom:'1rem'}}>
        {[
          {k:'Consultas', v: todayBookings.length||bookings.length},
          {k:'Ingresos', v:'$'+Math.round(monthRevenue).toLocaleString()},
          {k:'Nuevos', v: newClientsMonth||cards.length},
        ].map(m=>(
          <div key={m.k} style={{...glassCard,padding:'0.85rem',textAlign:'center'}}>
            <div style={{fontSize:'0.52rem',fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',color:gray,marginBottom:'0.3rem'}}>{m.k}</div>
            <div style={{fontFamily:ffS,fontSize:'1.4rem',fontWeight:500,color:black,lineHeight:1}}>{m.v}</div>
          </div>
        ))}
      </div>

      {/* Sistema de Lealtad card */}
      <div style={{background:'linear-gradient(135deg,rgba(184,151,90,0.22),rgba(184,151,90,0.08))',backdropFilter:'blur(20px)',borderRadius:16,border:'1px solid rgba(184,151,90,0.3)',padding:'1rem',marginBottom:'1rem',boxShadow:'inset 0 1px 0 rgba(255,255,255,0.5),0 8px 28px -8px rgba(184,151,90,0.3)'}}>
        <div style={{display:'flex',alignItems:'center',gap:'0.6rem',marginBottom:'0.5rem'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',width:28,height:28,borderRadius:8,background:black}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={gold} strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
          </div>
          <div style={{fontSize:'0.6rem',fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',color:'rgba(28,28,26,0.6)',flex:1}}>Sistema de Lealtad</div>
          <span style={{fontSize:'0.5rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',background:black,color:gold,padding:'0.2rem 0.55rem',borderRadius:20}}>Activo</span>
        </div>
        <div style={{fontSize:'0.82rem',color:black,fontWeight:500,marginBottom:'0.75rem'}}>Sella la tarjeta de tu cliente</div>
        <div style={{display:'flex',gap:'0.5rem'}}>
          <button onClick={onPunch} style={{flex:1,background:black,color:white,border:'none',borderRadius:10,padding:'0.65rem',fontFamily:ff,fontSize:'0.68rem',fontWeight:600,cursor:'pointer',letterSpacing:'0.05em',transition:'all 0.15s'}}>Añadir +</button>
          <button onClick={onGoCards} style={{flex:1,background:'rgba(28,28,26,0.07)',color:black,border:'1px solid rgba(28,28,26,0.1)',borderRadius:10,padding:'0.65rem',fontFamily:ff,fontSize:'0.68rem',fontWeight:600,cursor:'pointer',letterSpacing:'0.05em',transition:'all 0.15s'}}>Borrar</button>
        </div>
      </div>

      {/* Próximas consultas */}
      <div style={{...glassCard,overflow:'hidden'}}>
        <div style={{padding:'0.85rem 1rem',borderBottom:'1px solid rgba(28,28,26,0.06)'}}>
          <div style={{fontSize:'0.58rem',fontWeight:700,letterSpacing:'0.15em',textTransform:'uppercase',color:gray}}>Próximas Consultas</div>
        </div>
        {upcoming.length===0&&<div style={{padding:'1.5rem',textAlign:'center',color:gray,fontSize:'0.78rem'}}>No hay consultas próximas.</div>}
        {upcoming.map((b,i)=>{
          const isToday=b.date===today
          const st=STATUS_COLORS_BOOKINGS[b.status]||STATUS_COLORS_BOOKINGS.pending
          return(
            <div key={b.id||i} style={{display:'flex',alignItems:'center',gap:'0.75rem',padding:'0.8rem 1rem',borderBottom:i<upcoming.length-1?'1px solid rgba(28,28,26,0.05)':'none'}}>
              <div style={{width:42,height:42,borderRadius:10,background:isToday?gold:'rgba(28,28,26,0.07)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <div style={{fontSize:'0.6rem',fontWeight:700,lineHeight:1,color:isToday?black:gray,textTransform:'uppercase'}}>{b.time?.split(':')[0]}</div>
                <div style={{fontSize:'0.5rem',fontWeight:600,color:isToday?'rgba(0,0,0,0.6)':gray,lineHeight:1}}>{b.time?.includes('AM')?'AM':'PM'}</div>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:'0.82rem',fontWeight:600,color:black,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.name}</div>
                <div style={{fontSize:'0.65rem',color:gray,marginTop:'0.1rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.business}</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={gold} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ClientProfile({card,onBack}){
  if(!card)return null
  const cur=card.stamps%5===0&&card.stamps>0?5:card.stamps%5
  const cycle=Math.ceil((card.stamps||1)/5)||1
  const totalPaid=card.stamp_history?.length||0
  const rewardsClaimed=card.rewards?.filter(r=>r.status==='Canjeado').length||0
  return(
    <div>
      <button onClick={onBack} style={{display:'flex',alignItems:'center',gap:'0.5rem',background:'none',border:'none',cursor:'pointer',color:gray,fontFamily:ff,fontSize:'0.65rem',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:'1.5rem',padding:0}}>← Back to Dashboard</button>
      <div style={{background:black,borderRadius:12,padding:'1.75rem',marginBottom:'1.25rem',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 60% 50% at 0% 50%,rgba(184,151,90,0.08) 0%,transparent 70%)'}}/>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:'1rem',marginBottom:'1.25rem'}}>
          <div>
            <div style={{fontFamily:ffS,fontSize:'1.5rem',fontWeight:300,color:white,marginBottom:'0.2rem'}}>{card.profiles?.full_name}</div>
            <div style={{fontSize:'0.7rem',color:'rgba(255,255,255,0.4)'}}>{card.profiles?.business_name} · #{card.card_number}</div>
            {card.profiles?.phone&&<div style={{fontSize:'0.68rem',color:'rgba(255,255,255,0.35)',marginTop:'0.2rem'}}>{card.profiles?.phone}</div>}
          </div>
          <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>
            {[['Cycle',cycle],['Stamps',cur+'/5'],['Payments',totalPaid],['Rewards',rewardsClaimed]].map(([label,val])=>(<div key={label} style={{textAlign:'center',background:'rgba(255,255,255,0.05)',borderRadius:8,padding:'0.6rem 0.85rem',border:'1px solid rgba(184,151,90,0.1)'}}><div style={{fontFamily:ffS,fontSize:'1.2rem',fontWeight:300,color:gold,lineHeight:1}}>{val}</div><div style={{fontSize:'0.5rem',letterSpacing:'0.1em',textTransform:'uppercase',color:'rgba(255,255,255,0.3)',marginTop:'0.2rem'}}>{label}</div></div>))}
          </div>
        </div>
        <div style={{display:'flex',gap:'0.4rem'}}>{Array.from({length:5},(_,i)=><div key={i} style={{flex:1,height:5,borderRadius:3,background:i<cur?gold:'rgba(255,255,255,0.08)'}}/>)}</div>
        <div style={{fontSize:'0.58rem',color:'rgba(255,255,255,0.3)',marginTop:'0.4rem'}}>{cur===0&&card.stamps>0?'Reward available':cur+'/5 stamps in current cycle'}</div>
      </div>
      <div style={{background:'rgba(248,246,241,0.6)',backdropFilter:'blur(20px) saturate(160%)',borderRadius:14,border:'1px solid rgba(255,255,255,0.7)',boxShadow:'inset 0 1px 0 rgba(255,255,255,0.8),0 8px 32px -8px rgba(28,28,26,0.1)',overflow:'hidden',marginBottom:'1rem'}}>
        <div style={{padding:'1rem 1.25rem',borderBottom:'1px solid rgba(14,14,12,0.06)',fontFamily:ffS,fontSize:'1.1rem',fontWeight:300}}>Payment History</div>
        {card.stamp_history?.length>0?[...card.stamp_history].reverse().map((h,i)=>(<div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.85rem 1.25rem',borderBottom:'1px solid rgba(14,14,12,0.04)'}}><div><div style={{fontSize:'0.78rem',color:black}}>Payment registered{h.payment_amount?' · '+h.payment_amount:''}</div><div style={{fontSize:'0.62rem',color:gray,marginTop:'0.1rem'}}>{new Date(h.created_at).toLocaleDateString('en-US',{day:'numeric',month:'long',year:'numeric'})}</div></div><span style={{fontSize:'0.58rem',padding:'0.2rem 0.65rem',borderRadius:20,background:'rgba(184,151,90,0.1)',color:gold,border:'1px solid rgba(184,151,90,0.2)'}}>+1 stamp</span></div>)):<div style={{padding:'1.5rem',textAlign:'center',color:gray,fontSize:'0.82rem'}}>No history yet.</div>}
      </div>
      {card.rewards?.length>0&&(<div style={{background:'rgba(248,246,241,0.6)',backdropFilter:'blur(20px) saturate(160%)',borderRadius:14,border:'1px solid rgba(255,255,255,0.7)',boxShadow:'inset 0 1px 0 rgba(255,255,255,0.8),0 8px 32px -8px rgba(28,28,26,0.1)',overflow:'hidden'}}><div style={{padding:'1rem 1.25rem',borderBottom:'1px solid rgba(14,14,12,0.06)',fontFamily:ffS,fontSize:'1.1rem',fontWeight:300}}>Rewards</div>{card.rewards.map((r,i)=>(<div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.85rem 1.25rem',borderBottom:'1px solid rgba(14,14,12,0.04)'}}><div><div style={{fontSize:'0.78rem',color:black}}>{r.reward_type}</div>{r.reward_cost&&<div style={{fontSize:'0.65rem',color:gold,marginTop:'0.1rem'}}>{r.reward_cost}</div>}</div><span style={{fontSize:'0.58rem',padding:'0.2rem 0.65rem',borderRadius:20,background:'rgba(45,138,96,0.1)',color:'#2d8a60'}}>{r.status}</span></div>))}</div>)}
    </div>
  )
}

function ClientsPanel({users,cards,search,setSearch,onEdit,onAddPayment,onCreateCard,onCreateNew,onDelete,onFiles,onExpense,onHistory}){
  const filtered=users.filter(u=>(u.full_name||'').toLowerCase().includes(search.toLowerCase())||(u.business_name||'').toLowerCase().includes(search.toLowerCase()))
  function getCard(uid){return cards.find(c=>c.user_id===uid)}
  function getClientStatus(uid){const card=getCard(uid);if(!card)return{label:'No Card',color:gray,bg:'rgba(14,14,12,0.06)'};return getStatus(card)}
  return(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.25rem'}}>
        <h2 style={{fontFamily:ffS,fontSize:'1.5rem',fontWeight:300}}>Clients</h2>
        <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
          <div style={{fontSize:'0.62rem',color:gray}}>{users.length} registered</div>
          <button onClick={onCreateNew} style={{background:black,color:white,border:'none',padding:'0.6rem 1.1rem',fontFamily:ff,fontSize:'0.6rem',letterSpacing:'0.12em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>+ New</button>
        </div>
      </div>
      <input type="text" placeholder="Search by name or business..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:'100%',padding:'0.7rem 1rem',border:'1px solid '+gl,borderRadius:3,fontFamily:ff,fontSize:'0.82rem',outline:'none',marginBottom:'1.25rem',boxSizing:'border-box',background:white}}/>
      <div style={{background:'rgba(248,246,241,0.6)',backdropFilter:'blur(20px) saturate(160%)',borderRadius:14,border:'1px solid rgba(255,255,255,0.7)',boxShadow:'inset 0 1px 0 rgba(255,255,255,0.8),0 8px 32px -8px rgba(28,28,26,0.1)',overflow:'hidden'}}>
        <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr auto',padding:'0.6rem 1.25rem',borderBottom:'1px solid rgba(14,14,12,0.06)',fontSize:'0.54rem',letterSpacing:'0.1em',textTransform:'uppercase',color:gray}}>
          <span>Client</span><span>Status</span><span>Stamps</span><span>Actions</span>
        </div>
        {filtered.map(user=>{
          const card=getCard(user.id)
          const status=getClientStatus(user.id)
          const cur=card?(card.stamps%5===0&&card.stamps>0?5:card.stamps%5):0
          const lastPay=card?.stamp_history?.length>0?new Date(card.stamp_history[card.stamp_history.length-1].created_at).toLocaleDateString('en-US',{month:'short',day:'numeric'}):null
          return(
            <div key={user.id} style={{display:'grid',gridTemplateColumns:'2fr 120px 100px 1fr',padding:'0.85rem 1.25rem',borderBottom:'1px solid rgba(14,14,12,0.04)',alignItems:'center',gap:'0.5rem'}}>
              <div style={{minWidth:0}}>
                <div style={{fontSize:'0.78rem',color:black,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontWeight:500}}>{user.business_name||user.full_name}</div>
                <div style={{fontSize:'0.62rem',color:gray,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user.business_name?user.full_name:user.email}</div>
                {lastPay&&<div style={{fontSize:'0.58rem',color:'rgba(14,14,12,0.3)',marginTop:'0.1rem'}}>Last payment: {lastPay}</div>}
              </div>
              <span style={{fontSize:'0.58rem',padding:'0.2rem 0.6rem',borderRadius:20,background:status.bg,color:status.color,whiteSpace:'nowrap',width:'fit-content'}}>{status.label}</span>
              <div style={{display:'flex',gap:2,alignItems:'center'}}>
                {Array.from({length:5},(_,j)=><div key={j} style={{width:8,height:8,borderRadius:'50%',background:j<cur?gold:'rgba(14,14,12,0.08)'}}/>)}
                <span style={{fontSize:'0.58rem',color:gray,marginLeft:'0.3rem'}}>{card?.stamps||0}</span>
              </div>
              <div style={{display:'flex',gap:'0.35rem',flexWrap:'wrap',justifyContent:'flex-end',alignItems:'center'}}>
                <button onClick={()=>onEdit(user)} style={{padding:'0.35rem 0.65rem',background:'rgba(14,14,12,0.06)',color:black,border:'none',borderRadius:3,cursor:'pointer',fontFamily:ff,fontSize:'0.56rem',letterSpacing:'0.07em',textTransform:'uppercase'}}>Edit</button>
                {card
                  ?<button onClick={()=>onAddPayment(card)} style={{padding:'0.35rem 0.65rem',background:black,color:white,border:'none',borderRadius:3,cursor:'pointer',fontFamily:ff,fontSize:'0.56rem',letterSpacing:'0.07em',textTransform:'uppercase'}}>+ Pay</button>
                  :<button onClick={()=>onCreateCard(user.id)} style={{padding:'0.35rem 0.65rem',background:'rgba(184,151,90,0.1)',color:gold,border:'1px solid rgba(184,151,90,0.25)',borderRadius:3,cursor:'pointer',fontFamily:ff,fontSize:'0.56rem',letterSpacing:'0.07em',textTransform:'uppercase'}}>+ Card</button>
                }
                <button onClick={()=>onFiles(user)} style={{padding:'0.35rem 0.65rem',background:'rgba(52,152,219,0.08)',color:'#2980b9',border:'1px solid rgba(52,152,219,0.2)',borderRadius:3,cursor:'pointer',fontFamily:ff,fontSize:'0.56rem',letterSpacing:'0.07em',textTransform:'uppercase'}}>Files</button>
                <button onClick={()=>onHistory(user)} style={{padding:'0.35rem 0.65rem',background:'rgba(45,138,96,0.08)',color:'#2d8a60',border:'1px solid rgba(45,138,96,0.2)',borderRadius:3,cursor:'pointer',fontFamily:ff,fontSize:'0.56rem',letterSpacing:'0.07em',textTransform:'uppercase'}}>History</button>
                <button onClick={()=>onExpense(user)} style={{padding:'0.35rem 0.65rem',background:'rgba(142,68,173,0.08)',color:'#8e44ad',border:'1px solid rgba(142,68,173,0.2)',borderRadius:3,cursor:'pointer',fontFamily:ff,fontSize:'0.56rem',letterSpacing:'0.07em',textTransform:'uppercase'}}>Expense</button>
                <button onClick={()=>onDelete(user.id)} style={{padding:'0.35rem 0.65rem',background:'rgba(192,57,43,0.08)',color:'#a93226',border:'none',borderRadius:3,cursor:'pointer',fontFamily:ff,fontSize:'0.56rem',letterSpacing:'0.07em',textTransform:'uppercase'}}>Delete</button>
              </div>
            </div>
          )
        })}
        {filtered.length===0&&<div style={{padding:'2rem',textAlign:'center',color:gray,fontSize:'0.82rem'}}>No clients found.</div>}
      </div>
    </div>
  )
}

function NotificationsPanel({ cards, users }) {
  const alerts = getNotifications(cards)
  const levelColor = { 1: '#b8975a', 2: '#e67e22', 3: '#c0392b' }
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
        <h2 style={{fontFamily:ffS,fontSize:'1.5rem',fontWeight:300}}>Alerts</h2>
        <div style={{fontSize:'0.62rem',color:gray}}>{alerts.length} active alert{alerts.length!==1?'s':''}</div>
      </div>
      {alerts.length===0
        ?<div style={{background:white,borderRadius:10,padding:'2rem',textAlign:'center',border:'1px solid rgba(14,14,12,0.07)',color:gray,fontSize:'0.82rem'}}>No alerts — all clients are up to date.</div>
        :<div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
          {alerts.map((alert,i)=>{
            const user=users.find(u=>u.id===alert.card.user_id)
            return(
              <div key={i} style={{background:'rgba(248,246,241,0.6)',backdropFilter:'blur(20px) saturate(160%)',borderRadius:14,border:'1px solid rgba(255,255,255,0.7)',boxShadow:'inset 0 1px 0 rgba(255,255,255,0.8),0 8px 32px -8px rgba(28,28,26,0.1)',overflow:'hidden'}}>
                <div style={{background:`${levelColor[alert.level]}0d`,borderLeft:'3px solid '+levelColor[alert.level],padding:'1rem 1.25rem',display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                  <div>
                    <div style={{fontFamily:ffS,fontSize:'1rem',fontWeight:300,color:black,marginBottom:'0.2rem'}}>{alert.card.profiles?.business_name||alert.card.profiles?.full_name}</div>
                    <div style={{fontSize:'0.7rem',color:gray}}>{alert.msg}</div>
                    {user?.phone&&<div style={{fontSize:'0.68rem',color:gray,marginTop:'0.2rem'}}>{user.phone}</div>}
                  </div>
                  <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'0.4rem',flexShrink:0,marginLeft:'1rem'}}>
                    <span style={{fontSize:'0.58rem',padding:'0.2rem 0.65rem',borderRadius:20,background:`${levelColor[alert.level]}22`,color:levelColor[alert.level],whiteSpace:'nowrap'}}>Alert {alert.level}/3</span>
                    <span style={{fontSize:'0.62rem',color:levelColor[alert.level],fontWeight:600}}>{alert.days} days</span>
                  </div>
                </div>
                {user?.phone&&(<div style={{padding:'0.75rem 1.25rem',borderTop:'1px solid rgba(14,14,12,0.05)'}}><button onClick={()=>{const phone=user.phone.replace(/[^0-9]/g,'');const fp=phone.startsWith('1')?phone:'1'+phone;const msg=`Hi ${alert.card.profiles?.full_name||''}, we noticed your account at ${alert.card.profiles?.business_name||''} has a pending balance of ${alert.days} days. Please contact us to keep your service active.`;window.open(`https://wa.me/${fp}?text=${encodeURIComponent(msg)}`,'_blank')}} style={{padding:'0.4rem 1rem',background:black,color:white,border:'none',borderRadius:3,cursor:'pointer',fontFamily:ff,fontSize:'0.58rem',letterSpacing:'0.08em',textTransform:'uppercase'}}>Send WhatsApp</button></div>)}
              </div>
            )
          })}
        </div>
      }
    </div>
  )
}

function CampaignsPanel({ cards, users }) {
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  function classifyClient(card) {
    const status = getStatus(card).label
    if (status === 'VIP') return 'vip'
    if (status === 'Regular') return 'regulares'
    if (status === 'Active') return 'activos'
    if (status === 'Cancelled') return 'cancelados'
    if (status === 'Late Fee' || status === 'Grace') return 'recargo'
    return 'nuevos'
  }
  const groups = {
    vip:        { label:'VIP',        desc:'15+ stamps, up to date',      color:'#b8975a', bg:'rgba(184,151,90,0.12)', cards: cards.filter(c=>classifyClient(c)==='vip') },
    regulares:  { label:'Regular',    desc:'10-14 stamps, up to date',    color:'#2d8a60', bg:'rgba(45,138,96,0.1)',   cards: cards.filter(c=>classifyClient(c)==='regulares') },
    activos:    { label:'Active',     desc:'5-9 stamps, up to date',      color:'#3498db', bg:'rgba(52,152,219,0.1)',  cards: cards.filter(c=>classifyClient(c)==='activos') },
    nuevos:     { label:'New',        desc:'1-4 stamps, up to date',      color:'#8e44ad', bg:'rgba(142,68,173,0.1)',  cards: cards.filter(c=>classifyClient(c)==='nuevos') },
    recargo:    { label:'Late Fee',   desc:'35-65 days — $30 applied',    color:'#e74c3c', bg:'rgba(231,76,60,0.1)',   cards: cards.filter(c=>classifyClient(c)==='recargo') },
    cancelados: { label:'Cancelled',  desc:'66+ days without payment',    color:'#c0392b', bg:'rgba(192,57,43,0.1)',   cards: cards.filter(c=>classifyClient(c)==='cancelados') },
  }
  const defaultMessages = {
    vip:        'Hi [name]! Thank you for being a VIP at [business]. Your loyalty means everything to us 🙌',
    regulares:  'Hi [name]! You keep adding up at [business]. Every payment gets you closer to your next reward 💪',
    activos:    'Hi [name]! You have stamps saved at [business]. Keep it up, you\'re doing great! ⭐',
    nuevos:     'Hi [name]! Welcome to [business]. You started your loyalty card, let\'s get more! 🎉',
    recargo:    'Hi [name], you have a pending balance at [business]. Getting current avoids suspension. Thank you!',
    cancelados: 'Hi [name], your service at [business] is suspended due to non-payment. Contact us to reactivate. We\'re here to help!',
  }
  function selectGroup(key){setSelectedGroup(key);setMessage(defaultMessages[key]);setSent(false)}
  const group=selectedGroup?groups[selectedGroup]:null
  const recipients=group?group.cards.filter(c=>users.find(u=>u.id===c.user_id)?.phone):[]
  const noPhone=group?group.cards.filter(c=>!users.find(u=>u.id===c.user_id)?.phone):[]
  function sendViaWhatsApp(){recipients.forEach(card=>{const user=users.find(u=>u.id===card.user_id);if(!user?.phone)return;const phone=user.phone.replace(/[^0-9]/g,'');const fullPhone=phone.startsWith('1')?phone:'1'+phone;const msg=message.replace(/\[name\]/g,user.full_name||'').replace(/\[business\]/g,user.business_name||user.full_name||'');window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`,'_blank')});setSent(true)}
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
        <h2 style={{fontFamily:ffS,fontSize:'1.5rem',fontWeight:300}}>WhatsApp Campaigns</h2>
        <div style={{fontSize:'0.62rem',color:gray}}>{cards.length} total clients</div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:'0.75rem',marginBottom:'1.5rem'}}>
        {Object.entries(groups).map(([key,g])=>(<div key={key} onClick={()=>selectGroup(key)} style={{background:selectedGroup===key?g.color:white,borderRadius:10,padding:'1.1rem',border:'2px solid '+(selectedGroup===key?g.color:'rgba(14,14,12,0.07)'),cursor:'pointer'}}><div style={{fontSize:'0.78rem',fontWeight:600,color:selectedGroup===key?white:black,marginBottom:'0.2rem'}}>{g.label}</div><div style={{fontSize:'0.6rem',color:selectedGroup===key?'rgba(255,255,255,0.75)':gray,lineHeight:1.4,marginBottom:'0.5rem'}}>{g.desc}</div><div style={{fontSize:'0.72rem',fontWeight:600,color:selectedGroup===key?white:g.color}}>{g.cards.length} clients</div></div>))}
      </div>
      {selectedGroup&&group&&<>
        <div style={{background:'rgba(248,246,241,0.6)',backdropFilter:'blur(20px) saturate(160%)',borderRadius:14,border:'1px solid rgba(255,255,255,0.7)',boxShadow:'inset 0 1px 0 rgba(255,255,255,0.8),0 8px 32px -8px rgba(28,28,26,0.1)',padding:'1.25rem',marginBottom:'1rem'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.85rem'}}>
            <div style={{fontFamily:ffS,fontSize:'1rem',fontWeight:300}}>Recipients — {group.label}</div>
            <div style={{display:'flex',gap:'0.75rem',fontSize:'0.65rem'}}><span style={{color:'#2d8a60'}}>{recipients.length} with phone</span>{noPhone.length>0&&<span style={{color:'#c0392b'}}>{noPhone.length} no phone</span>}</div>
          </div>
          <div style={{display:'flex',flexWrap:'wrap',gap:'0.4rem'}}>{group.cards.map(card=>{const user=users.find(u=>u.id===card.user_id);const hasPhone=!!user?.phone;return(<span key={card.id} style={{fontSize:'0.62rem',padding:'0.2rem 0.65rem',borderRadius:20,background:hasPhone?'rgba(45,138,96,0.1)':'rgba(192,57,43,0.06)',color:hasPhone?'#2d8a60':'#c0392b'}}>{user?.business_name||user?.full_name||'No name'}{!hasPhone?' (no phone)':''}</span>)})}{group.cards.length===0&&<span style={{fontSize:'0.78rem',color:gray}}>No clients in this group.</span>}</div>
        </div>
        <div style={{background:'rgba(248,246,241,0.6)',backdropFilter:'blur(20px) saturate(160%)',borderRadius:14,border:'1px solid rgba(255,255,255,0.7)',boxShadow:'inset 0 1px 0 rgba(255,255,255,0.8),0 8px 32px -8px rgba(28,28,26,0.1)',padding:'1.25rem',marginBottom:'1rem'}}>
          <div style={{fontFamily:ffS,fontSize:'1rem',fontWeight:300,marginBottom:'0.5rem'}}>Message</div>
          <div style={{fontSize:'0.6rem',color:gray,marginBottom:'0.5rem'}}>Use [name] and [business] to personalize</div>
          <textarea value={message} onChange={e=>setMessage(e.target.value)} rows={5} style={{width:'100%',padding:'0.85rem',border:'1px solid '+gl,borderRadius:3,fontFamily:ff,fontSize:'0.82rem',color:black,outline:'none',resize:'vertical',boxSizing:'border-box',lineHeight:1.6}}/>
        </div>
        {sent&&<div style={{background:'rgba(45,138,96,0.08)',border:'1px solid rgba(45,138,96,0.2)',borderRadius:8,padding:'0.85rem 1.25rem',marginBottom:'0.85rem',fontSize:'0.78rem',color:'#2d8a60'}}>Opened {recipients.length} WhatsApp conversations.</div>}
        {recipients.length>0
          ?<button onClick={sendViaWhatsApp} style={{width:'100%',background:black,color:white,border:'none',padding:'1rem',fontFamily:ff,fontSize:'0.68rem',letterSpacing:'0.14em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>Send via WhatsApp to {recipients.length} client{recipients.length!==1?'s':''}</button>
          :<div style={{background:'rgba(192,57,43,0.05)',border:'1px solid rgba(192,57,43,0.15)',borderRadius:8,padding:'1rem',textAlign:'center',fontSize:'0.78rem',color:'#c0392b'}}>No clients in this group have a phone number registered.</div>
        }
        {noPhone.length>0&&<div style={{marginTop:'0.6rem',fontSize:'0.65rem',color:gray,textAlign:'center'}}>{noPhone.length} client{noPhone.length!==1?'s':''} without phone will not receive the message</div>}
      </>}
      {!selectedGroup&&<div style={{background:white,borderRadius:10,padding:'2rem',textAlign:'center',border:'1px solid rgba(14,14,12,0.07)',color:gray,fontSize:'0.82rem'}}>Select a group above to see recipients.</div>}
    </div>
  )
}

function CatalogPanel({ catalog, onSetCost, onSetSuppliers }) {
  const [search, setSearch] = useState('')
  const [expandMargin, setExpandMargin] = useState(false)

  function getPrice(item) {
    const p = item.catalog_prices?.find(p=>p.active)
    if (!p) return null
    return p.amount
  }

  function formatPrice(item) {
    const prices = item.catalog_prices?.filter(p=>p.active)||[]
    if (!prices.length) return '—'
    return prices.map(p=>'$'+(p.amount||0).toFixed(2)+(p.interval?'/'+p.interval:'')).join(' · ')
  }

  function getCost(item) {
    const c = item.catalog_costs?.cost
    return c!=null ? parseFloat(c) : null
  }

  function getMargin(item) {
    const price = getPrice(item)
    const cost = getCost(item)
    if (!price || cost === null) return null
    return Math.round(((price - cost) / price) * 100)
  }

  function mc(m) {
    return m >= 60 ? '#2d8a60' : m >= 40 ? gold : '#c0392b'
  }

  function categorize(name) {
    const n = name.toLowerCase()
    if (n.includes('mantenimiento') || n.includes('maintenance') || n.includes('mensual') || n.includes('planilla') || n.includes('scaling')) return 'maintenance'
    if (n.includes('setup') || n.includes('bundle') || n.includes('pro')) return 'setup'
    return 'extras'
  }

  const filtered = catalog.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
  const setup = [...filtered.filter(i=>categorize(i.name)==='setup')].sort((a,b)=>(getPrice(b)||0)-(getPrice(a)||0))
  const maintenance = [...filtered.filter(i=>categorize(i.name)==='maintenance')].sort((a,b)=>(getPrice(b)||0)-(getPrice(a)||0))
  const extras = [...filtered.filter(i=>categorize(i.name)==='extras')].sort((a,b)=>(getPrice(b)||0)-(getPrice(a)||0))

  const withMargin = catalog.map(i=>({...i,_margin:getMargin(i)})).filter(i=>i._margin!==null).sort((a,b)=>b._margin-a._margin)
  const showList = expandMargin ? withMargin : withMargin.slice(0,5)

  function Row({item}) {
    const price = getPrice(item)
    const cost = getCost(item)
    const margin = getMargin(item)
    const suppliers = item.catalog_costs?.suppliers
    return (
      <div style={{padding:'0.9rem 1.25rem',borderBottom:'1px solid rgba(14,14,12,0.05)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'0.6rem'}}>
          <div style={{flex:1,minWidth:0,marginRight:'0.75rem'}}>
            <div style={{fontSize:'0.78rem',fontWeight:600,color:black,lineHeight:1.3}}>{item.name}</div>
            {item.description&&<div style={{fontSize:'0.6rem',color:gray,marginTop:'0.2rem',lineHeight:1.4}}>{item.description.substring(0,80)}{item.description.length>80?'...':''}</div>}
          </div>
          <span style={{fontSize:'0.52rem',padding:'0.15rem 0.55rem',borderRadius:20,background:item.active?'rgba(45,138,96,0.1)':'rgba(192,57,43,0.1)',color:item.active?'#2d8a60':'#c0392b',whiteSpace:'nowrap',flexShrink:0}}>{item.active?'Active':'Inactive'}</span>
        </div>
        {/* Price / Cost / Margin — inline pill row */}
        <div style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'0.65rem',flexWrap:'wrap'}}>
          <div style={{display:'flex',alignItems:'center',gap:'0.25rem'}}>
            <span style={{fontSize:'0.48rem',color:gray,letterSpacing:'0.08em',textTransform:'uppercase'}}>Price</span>
            <span style={{fontSize:'0.78rem',fontWeight:700,color:black}}>{formatPrice(item)}</span>
          </div>
          <span style={{color:gray,fontSize:'0.7rem'}}>·</span>
          <div style={{display:'flex',alignItems:'center',gap:'0.25rem'}}>
            <span style={{fontSize:'0.48rem',color:gray,letterSpacing:'0.08em',textTransform:'uppercase'}}>Cost</span>
            <span style={{fontSize:'0.78rem',fontWeight:600,color:cost!==null?black:'rgba(14,14,12,0.25)'}}>{cost!==null?'$'+cost.toFixed(2):'—'}</span>
          </div>
          <span style={{color:gray,fontSize:'0.7rem'}}>·</span>
          <div style={{display:'flex',alignItems:'center',gap:'0.25rem'}}>
            <span style={{fontSize:'0.48rem',color:gray,letterSpacing:'0.08em',textTransform:'uppercase'}}>Margin</span>
            <span style={{fontSize:'0.78rem',fontWeight:700,color:margin!==null?mc(margin):'rgba(14,14,12,0.25)'}}>{margin!==null?margin+'%':'—'}</span>
          </div>
          {margin!==null&&<div style={{flex:1,height:3,background:'rgba(14,14,12,0.06)',borderRadius:2,minWidth:40}}>
            <div style={{height:'100%',width:Math.min(margin,100)+'%',background:mc(margin),borderRadius:2}}/>
          </div>}
        </div>
        {suppliers&&<div style={{fontSize:'0.62rem',color:gray,marginBottom:'0.6rem',fontStyle:'italic'}}>{suppliers.substring(0,80)}{suppliers.length>80?'...':''}</div>}
        <div style={{display:'flex',gap:'0.4rem',flexWrap:'wrap'}}>
          <button onClick={()=>onSetCost(item)} style={{padding:'0.4rem 0.85rem',background:'rgba(184,151,90,0.08)',color:gold,border:'1px solid rgba(184,151,90,0.25)',borderRadius:3,cursor:'pointer',fontFamily:ff,fontSize:'0.58rem',letterSpacing:'0.08em',textTransform:'uppercase'}}>{cost!==null?'Edit Cost':'Set Cost'}</button>
          <button onClick={()=>onSetSuppliers(item)} style={{padding:'0.4rem 0.85rem',background:'rgba(52,152,219,0.08)',color:'#2980b9',border:'1px solid rgba(52,152,219,0.2)',borderRadius:3,cursor:'pointer',fontFamily:ff,fontSize:'0.58rem',letterSpacing:'0.08em',textTransform:'uppercase'}}>Suppliers</button>
        </div>
      </div>
    )
  }

  function Section({title, items}) {
    const [open, setOpen] = useState(true)
    if (!items.length) return null
    return (
      <div style={{background:'rgba(248,246,241,0.6)',backdropFilter:'blur(20px) saturate(160%)',borderRadius:14,border:'1px solid rgba(255,255,255,0.7)',boxShadow:'inset 0 1px 0 rgba(255,255,255,0.8),0 8px 32px -8px rgba(28,28,26,0.1)',overflow:'hidden',marginBottom:'1rem'}}>
        <div onClick={()=>setOpen(o=>!o)} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.9rem 1.25rem',cursor:'pointer',background:'rgba(14,14,12,0.02)'}}>
          <div style={{fontFamily:ffS,fontSize:'1.05rem',fontWeight:300,color:black}}>{title}</div>
          <div style={{display:'flex',alignItems:'center',gap:'0.6rem'}}>
            <span style={{fontSize:'0.6rem',color:gray}}>{items.length} service{items.length!==1?'s':''}</span>
            <span style={{fontSize:'0.6rem',color:gray,transform:open?'rotate(180deg)':'rotate(0)',display:'inline-block',transition:'transform 0.2s'}}>▾</span>
          </div>
        </div>
        {open && items.map(item=><Row key={item.id} item={item}/>)}
      </div>
    )
  }

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.25rem'}}>
        <h2 style={{fontFamily:ffS,fontSize:'1.5rem',fontWeight:300}}>Catalog</h2>
        <div style={{fontSize:'0.62rem',color:gray}}>{catalog.length} services · Stripe synced</div>
      </div>

      {/* Best Margin Box */}
      {withMargin.length>0&&(
        <div style={{background:white,borderRadius:10,border:'1px solid rgba(184,151,90,0.25)',padding:'0.9rem 1.25rem',marginBottom:'1.25rem'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.65rem'}}>
            <span style={{fontSize:'0.6rem',fontWeight:700,color:gold,letterSpacing:'0.1em',textTransform:'uppercase'}}>★ Best Margin</span>
            <button onClick={()=>setExpandMargin(e=>!e)} style={{background:'none',border:'none',cursor:'pointer',fontSize:'0.6rem',color:gray,fontFamily:ff,letterSpacing:'0.08em',textTransform:'uppercase'}}>{expandMargin?'Collapse':'See all'}</button>
          </div>
          {showList.map((item,i)=>(
            <div key={item.id} style={{display:'flex',alignItems:'center',gap:'0.6rem',marginBottom:'0.45rem'}}>
              <div style={{width:16,height:16,borderRadius:'50%',background:i===0&&!expandMargin?gold:'rgba(14,14,12,0.06)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.5rem',fontWeight:700,color:i===0&&!expandMargin?black:gray,flexShrink:0}}>{i+1}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:'0.68rem',color:black,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.name}</div>
                <div style={{height:3,background:'rgba(14,14,12,0.06)',borderRadius:2,marginTop:'0.2rem'}}>
                  <div style={{height:'100%',width:Math.min(item._margin,100)+'%',background:mc(item._margin),borderRadius:2}}/>
                </div>
              </div>
              <span style={{fontSize:'0.7rem',fontWeight:700,color:mc(item._margin),flexShrink:0,minWidth:36,textAlign:'right'}}>{item._margin}%</span>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <input type="text" placeholder="Search services..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:'100%',padding:'0.7rem 1rem',border:'1px solid '+gl,borderRadius:3,fontFamily:ff,fontSize:'0.82rem',outline:'none',marginBottom:'1.25rem',boxSizing:'border-box',background:white}}/>

      {/* Sections */}
      <Section title="Setup" items={setup}/>
      <Section title="Maintenance" items={maintenance}/>
      <Section title="Extras" items={extras}/>
      {!filtered.length&&<div style={{background:white,borderRadius:10,padding:'2rem',textAlign:'center',color:gray,fontSize:'0.82rem',border:'1px solid rgba(14,14,12,0.07)'}}>No services found.</div>}
    </div>
  )
}

function CostHistory({ productId }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  useEffect(()=>{
    fetch('/api/admin/catalog/history?product_id='+productId)
      .then(r=>r.json())
      .then(d=>{ setHistory(d.history||[]); setLoading(false) })
      .catch(()=>setLoading(false))
  },[productId])

  if(loading) return <div style={{fontSize:'0.68rem',color:'#6b6b67',padding:'0.5rem 0'}}>Loading history...</div>
  if(!history.length) return <div style={{fontSize:'0.68rem',color:'#6b6b67',padding:'0.5rem 0'}}>No cost history yet.</div>

  return(
    <div style={{marginTop:'0.75rem'}}>
      <button onClick={()=>setOpen(o=>!o)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',width:'100%',background:'rgba(14,14,12,0.03)',border:'1px solid rgba(14,14,12,0.07)',borderRadius:6,padding:'0.5rem 0.85rem',cursor:'pointer',fontFamily:ff}}>
        <span style={{fontSize:'0.52rem',letterSpacing:'0.12em',textTransform:'uppercase',color:gray}}>Cost History ({history.length})</span>
        <span style={{fontSize:'0.6rem',color:gray,transform:open?'rotate(180deg)':'rotate(0)',display:'inline-block',transition:'transform 0.2s'}}>▾</span>
      </button>
      {open&&(
        <div style={{border:'1px solid rgba(14,14,12,0.07)',borderTop:'none',borderRadius:'0 0 6px 6px',overflow:'hidden',maxHeight:200,overflowY:'auto'}}>
          {history.map((h,i)=>(
            <div key={h.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.6rem 0.85rem',borderBottom:i<history.length-1?'1px solid rgba(14,14,12,0.05)':'none'}}>
              <div>
                <span style={{fontSize:'0.78rem',fontWeight:600,color:'#0e0e0c'}}>${parseFloat(h.cost).toFixed(2)}</span>
                {h.notes&&<span style={{fontSize:'0.6rem',color:'#6b6b67',marginLeft:'0.5rem'}}>{h.notes.substring(0,40)}</span>}
              </div>
              <span style={{fontSize:'0.58rem',color:'#6b6b67'}}>{new Date(h.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ExpenseHistory({ clientId, showToast, supplies }) {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState('manual') // 'manual' | 'supplies'
  const [quantities, setQuantities] = useState({})

  useEffect(()=>{ load() },[clientId])

  async function load(){
    setLoading(true)
    const res = await fetch('/api/admin/expenses?client_id='+clientId)
    const data = await res.json()
    setExpenses(data.expenses||[])
    setLoading(false)
  }

  async function del(id){
    await fetch('/api/admin/expenses',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})})
    showToast('Expense deleted')
    load()
  }

  function unitLabel(u) { return u==='month'?'/mo':u==='year'?'/yr':u==='one-time'?' once':'/'+u }

  function calcLineTotal(s, qty) {
    if (!qty || parseFloat(qty)===0) return 0
    return parseFloat(s.cost||0) * parseFloat(qty)
  }

  const suppliesTotal = (supplies||[]).reduce((a,s)=>{
    const qty = parseFloat(quantities[s.id]||0)
    return a + calcLineTotal(s, qty)
  }, 0)

  async function saveSuppliesExpense() {
    const lineItems = (supplies||[]).filter(s=>parseFloat(quantities[s.id]||0)>0).map(s=>({
      supply_id: s.id, name: s.name, unit: s.unit, cost: s.cost, qty: parseFloat(quantities[s.id])
    }))
    if (lineItems.length===0) { showToast('Add at least one supply'); return }
    const res = await fetch('/api/admin/expenses',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
      client_id: clientId, amount: suppliesTotal, description: lineItems.map(l=>l.name).join(', '),
      recurring: false, recurring_interval: 'month', expense_date: new Date().toISOString().split('T')[0],
      line_items: lineItems
    })})
    if (res.ok) { showToast('Expense saved'); setQuantities({}); load() }
    else showToast('Error saving expense')
  }

  const total = expenses.reduce((a,e)=>a+parseFloat(e.amount||0),0)

  if(loading) return <div style={{fontSize:'0.72rem',color:'#6b6b67',textAlign:'center',padding:'1rem'}}>Loading...</div>

  return(
    <div>
      {/* Toggle */}
      <div style={{display:'flex',gap:'0.4rem',marginBottom:'1rem'}}>
        {[['manual','Manual'],['supplies','From Supplies']].map(([m,label])=>(
          <button key={m} onClick={()=>setMode(m)} style={{padding:'0.35rem 0.85rem',borderRadius:20,border:'none',cursor:'pointer',fontFamily:ff,fontSize:'0.6rem',letterSpacing:'0.08em',textTransform:'uppercase',background:mode===m?black:'rgba(14,14,12,0.06)',color:mode===m?white:gray,transition:'all 0.15s'}}>{label}</button>
        ))}
      </div>

      {/* FROM SUPPLIES */}
      {mode==='supplies'&&(
        <div style={{marginBottom:'1.25rem'}}>
          {!supplies||supplies.length===0
            ?<div style={{fontSize:'0.72rem',color:gray,padding:'0.75rem 0'}}>No supplies added yet. Add them in the Supplies section.</div>
            :<>
              {supplies.map(s=>(
                <div key={s.id} style={{display:'flex',alignItems:'center',gap:'0.75rem',padding:'0.6rem 0',borderBottom:'1px solid rgba(14,14,12,0.05)'}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:'0.72rem',color:black,fontWeight:500}}>{s.name}</div>
                    <div style={{fontSize:'0.6rem',color:gray}}>${parseFloat(s.cost).toFixed(2)}{unitLabel(s.unit)}</div>
                  </div>
                  <input type="number" min="0" step="0.1" placeholder="0"
                    value={quantities[s.id]||''}
                    onChange={e=>setQuantities(q=>({...q,[s.id]:e.target.value}))}
                    style={{width:60,padding:'0.35rem 0.5rem',border:'1px solid '+gl,borderRadius:3,fontFamily:ff,fontSize:'0.75rem',outline:'none',textAlign:'center'}}/>
                  <div style={{fontSize:'0.6rem',color:gray,width:20,textAlign:'center'}}>{unitLabel(s.unit)}</div>
                  <div style={{fontSize:'0.72rem',fontWeight:600,color:calcLineTotal(s,quantities[s.id])>0?'#c0392b':gray,width:60,textAlign:'right'}}>
                    {calcLineTotal(s,quantities[s.id])>0?'$'+calcLineTotal(s,quantities[s.id]).toFixed(2):'—'}
                  </div>
                </div>
              ))}
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:'0.75rem',marginTop:'0.25rem',borderTop:'1px solid rgba(14,14,12,0.08)'}}>
                <span style={{fontSize:'0.62rem',color:gray,letterSpacing:'0.08em',textTransform:'uppercase'}}>Total</span>
                <span style={{fontFamily:ffS,fontSize:'1.1rem',fontWeight:300,color:'#c0392b'}}>${suppliesTotal.toFixed(2)}</span>
              </div>
              <button onClick={saveSuppliesExpense} style={{width:'100%',marginTop:'0.85rem',background:black,color:white,border:'none',padding:'0.75rem',fontFamily:ff,fontSize:'0.62rem',letterSpacing:'0.12em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>Save Expense</button>
            </>
          }
        </div>
      )}

      {/* EXPENSE LIST */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.75rem'}}>
        <div style={{fontSize:'0.56rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'#6b6b67'}}>Expense History</div>
        {expenses.length>0&&<div style={{fontSize:'0.68rem',fontWeight:600,color:'#c0392b'}}>Total: ${total.toFixed(2)}</div>}
      </div>
      {expenses.length===0
        ?<div style={{fontSize:'0.72rem',color:'#6b6b67',textAlign:'center',padding:'0.75rem 0'}}>No expenses logged yet.</div>
        :<div style={{border:'1px solid rgba(14,14,12,0.07)',borderRadius:8,overflow:'hidden'}}>
          {expenses.map((e,i)=>(
            <div key={e.id} style={{display:'flex',alignItems:'center',gap:'0.75rem',padding:'0.75rem 1rem',borderBottom:i<expenses.length-1?'1px solid rgba(14,14,12,0.05)':'none'}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:'0.72rem',color:'#0e0e0c',fontWeight:500}}>{e.description||'—'}</div>
                <div style={{display:'flex',gap:'0.5rem',marginTop:'0.15rem'}}>
                  <span style={{fontSize:'0.58rem',color:'#6b6b67'}}>{e.expense_date}</span>
                  {e.recurring&&<span style={{fontSize:'0.55rem',padding:'0.1rem 0.45rem',borderRadius:20,background:'rgba(52,152,219,0.1)',color:'#2980b9'}}>↻ {e.recurring_interval}</span>}
                  {e.line_items&&<span style={{fontSize:'0.55rem',padding:'0.1rem 0.45rem',borderRadius:20,background:'rgba(184,151,90,0.1)',color:gold}}>Supplies</span>}
                </div>
              </div>
              <div style={{fontSize:'0.78rem',fontWeight:600,color:'#c0392b',flexShrink:0}}>-${parseFloat(e.amount).toFixed(2)}</div>
              <button onClick={()=>del(e.id)} style={{background:'none',border:'none',cursor:'pointer',color:'rgba(192,57,43,0.4)',fontSize:'0.75rem',padding:0,flexShrink:0}}>x</button>
            </div>
          ))}
        </div>
      }
    </div>
  )
}

function FinancialCard({ sales }) {
  const [expanded, setExpanded] = useState(false)
  const [activeChart, setActiveChart] = useState(null)
  const [chartVisible, setChartVisible] = useState(false)
  const [period, setPeriod] = useState('yearly')
  const [salesHistoryOpen, setSalesHistoryOpen] = useState(false)

  function openChart(id) {
    if (activeChart === id) {
      // toggle off
      setChartVisible(false)
      setTimeout(() => setActiveChart(null), 220)
    } else if (activeChart) {
      // switch chart — fade out then in
      setChartVisible(false)
      setTimeout(() => { setActiveChart(id); setChartVisible(true) }, 220)
    } else {
      // first open
      setActiveChart(id)
      setTimeout(() => setChartVisible(true), 20)
    }
  }

  const paid = (sales||[]).filter(s=>s.status==='paid')
  const refunds = (sales||[]).filter(s=>s.status==='refunded')
  const grossSales = paid.reduce((a,s)=>a+parseFloat(s.amount||0),0)
  const refunded = refunds.reduce((a,s)=>a+Math.abs(parseFloat(s.amount||0)),0)
  const netSales = grossSales - refunded
  const avgOrder = paid.length>0?grossSales/paid.length:0

  const now = new Date()
  const ytdSales = paid.filter(s=>new Date(s.sale_date).getFullYear()===now.getFullYear()).reduce((a,s)=>a+parseFloat(s.amount||0),0)
  const thisMonthSales = paid.filter(s=>{const d=new Date(s.sale_date);return d.getFullYear()===now.getFullYear()&&d.getMonth()===now.getMonth()}).reduce((a,s)=>a+parseFloat(s.amount||0),0)


  // ── Period builders ──────────────────────────────────────────────
  function buildData(items, valueKey, period) {
    const map = {}
    const filtered = items.filter(s => {
      const d = new Date(s.sale_date)
      if (period === 'weekly') { const wk = new Date(now); wk.setDate(now.getDate()-27); return d >= wk }
      if (period === 'monthly') return d.getFullYear()===now.getFullYear() && d.getMonth()===now.getMonth()
      if (period === 'ytd') return d.getFullYear()===now.getFullYear()
      if (period === 'yearly') return true
      return true
    })

    filtered.forEach(s => {
      const d = new Date(s.sale_date)
      let key
      if (period === 'weekly')  key = d.toLocaleDateString('en-US',{month:'short',day:'numeric'})
      else if (period === 'monthly') key = d.toLocaleDateString('en-US',{month:'short',day:'numeric'})
      else if (period === 'ytd') key = d.toLocaleDateString('en-US',{month:'short'})
      else key = d.toLocaleDateString('en-US',{month:'short',year:'2-digit'})
      map[key] = (map[key]||0) + Math.abs(parseFloat(s[valueKey]||0))
    })

    if (period === 'weekly') {
      const result = []
      for (let i=27; i>=0; i--) {
        const d = new Date(now); d.setDate(now.getDate()-i)
        const key = d.toLocaleDateString('en-US',{month:'short',day:'numeric'})
        if (!result.find(r=>r[0]===key)) result.push([key, map[key]||0])
      }
      // Group by week
      const weeks = []
      for (let i=0; i<4; i++) {
        const slice = result.slice(i*7, i*7+7)
        const label = slice[0]?.[0] + ' – ' + slice[slice.length-1]?.[0]
        weeks.push([label, slice.reduce((a,b)=>a+b[1],0)])
      }
      return weeks
    }
    if (period === 'monthly') {
      const result = []
      const daysInMonth = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate()
      for (let i=1; i<=daysInMonth; i++) {
        const d = new Date(now.getFullYear(), now.getMonth(), i)
        const key = d.toLocaleDateString('en-US',{month:'short',day:'numeric'})
        result.push([key, map[key]||0])
      }
      return result
    }
    if (period === 'ytd') {
      const result = []
      for (let i=0; i<=now.getMonth(); i++) {
        const d = new Date(now.getFullYear(), i, 1)
        const key = d.toLocaleDateString('en-US',{month:'short'})
        result.push([key, map[key]||0])
      }
      return result
    }
    // yearly — last 12 months
    const result = []
    for (let i=11; i>=0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth()-i, 1)
      const key = d.toLocaleDateString('en-US',{month:'short',year:'2-digit'})
      result.push([key, map[key]||0])
    }
    return result
  }

  function buildAOV(items, period) {
    const filtered = items.filter(s => {
      const d = new Date(s.sale_date)
      if (period === 'weekly') { const wk = new Date(now); wk.setDate(now.getDate()-27); return d >= wk }
      if (period === 'monthly') return d.getFullYear()===now.getFullYear() && d.getMonth()===now.getMonth()
      if (period === 'ytd') return d.getFullYear()===now.getFullYear()
      return true
    })
    const map = {}
    filtered.forEach(s => {
      const d = new Date(s.sale_date)
      let key
      if (period === 'monthly') key = d.toLocaleDateString('en-US',{month:'short',day:'numeric'})
      else if (period === 'ytd') key = d.toLocaleDateString('en-US',{month:'short'})
      else key = d.toLocaleDateString('en-US',{month:'short',year:'2-digit'})
      if (!map[key]) map[key] = {sum:0,count:0}
      map[key].sum += parseFloat(s.amount||0)
      map[key].count += 1
    })
    const base = buildData(items, 'amount', period)
    return base.map(([key]) => [key, map[key] ? map[key].sum/map[key].count : 0])
  }

  function buildServices(items, period) {
    const filtered = items.filter(s => {
      const d = new Date(s.sale_date)
      if (period === 'weekly') { const wk = new Date(now); wk.setDate(now.getDate()-27); return d >= wk }
      if (period === 'monthly') return d.getFullYear()===now.getFullYear() && d.getMonth()===now.getMonth()
      if (period === 'ytd') return d.getFullYear()===now.getFullYear()
      return true
    })
    const map = {}
    filtered.forEach(s => {
      const name = s.product_name||'Other'
      map[name] = (map[name]||0) + parseFloat(s.amount||0)
    })
    return Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,5)
  }

  // Chart definitions — period-aware (period comes from modal state)
  function getCharts(period) {
    return [
      { id:'revenue', label:'Revenue Over Time', getData: p=>buildData(paid,'amount',p),    color:'#2d8a60', prefix:'$', desc:'Gross revenue from paid transactions' },
      { id:'mrr',     label:'MRR',               getData: p=>buildData(paid.filter(s=>s.type==='recurring'||s.type==='subscription'),'amount',p), color:gold, prefix:'$', desc:'Monthly Recurring Revenue' },
      { id:'aov',     label:'Avg Order Value',    getData: p=>buildAOV(paid,p),              color:'#5b8dee', prefix:'$', desc:'Average transaction value' },
      { id:'refunds', label:'Refunds',            getData: p=>buildData(refunds,'amount',p), color:'#c0392b', prefix:'$', desc:'Refund totals' },
      { id:'services',label:'Revenue by Service', getData: p=>buildServices(paid,p),         color:gold,      prefix:'$', desc:'Revenue breakdown by product/service', isBar:true },
    ]
  }

  const charts = getCharts('yearly')


  // SVG area chart renderer — premium version
  function AreaChart({ data, color, prefix='$' }) {
    const [hovered, setHovered] = useState(null)
    const w=520, h=160, padX=56, padY=20, padR=16
    const vals = data.map(d=>d[1])
    const maxVal = Math.max(...vals, 1)
    const chartW = w - padX - padR
    const chartH = h - padY*2

    const pts = data.map(([,v],i)=>({
      x: padX + (i/(data.length-1||1))*chartW,
      y: padY + (1-(v/maxVal))*chartH
    }))

    // Smooth bezier curve
    function smoothPath(points) {
      if (points.length < 2) return ''
      let d = `M ${points[0].x} ${points[0].y}`
      for (let i = 1; i < points.length; i++) {
        const prev = points[i-1], curr = points[i]
        const cpx = (prev.x + curr.x) / 2
        d += ` C ${cpx} ${prev.y} ${cpx} ${curr.y} ${curr.x} ${curr.y}`
      }
      return d
    }

    const linePath = smoothPath(pts)
    const areaPath = pts.length > 1
      ? `${linePath} L ${pts[pts.length-1].x} ${h-padY} L ${pts[0].x} ${h-padY} Z`
      : ''

    const gridLevels = [0, 0.25, 0.5, 0.75, 1]
    const gradId = `grad-${color.replace('#','')}`

    return (
      <div style={{width:'100%',position:'relative',userSelect:'none'}}>
        {/* Tooltip */}
        {hovered!==null && (
          <div style={{
            position:'absolute',
            left: pts[hovered]?.x / w * 100 + '%',
            top: 0,
            transform:'translateX(-50%)',
            background:black,
            color:white,
            padding:'0.4rem 0.7rem',
            borderRadius:6,
            fontSize:'0.62rem',
            fontFamily:ff,
            pointerEvents:'none',
            whiteSpace:'nowrap',
            zIndex:10,
            boxShadow:'0 4px 12px rgba(0,0,0,0.2)'
          }}>
            <div style={{fontWeight:600}}>{prefix}{data[hovered][1].toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
            <div style={{opacity:0.65,fontSize:'0.55rem',marginTop:'0.1rem'}}>{data[hovered][0]}</div>
          </div>
        )}
        <svg viewBox={`0 0 ${w} ${h}`} style={{width:'100%',height:'auto',display:'block',overflow:'visible'}}
          onMouseLeave={()=>setHovered(null)}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.22"/>
              <stop offset="100%" stopColor={color} stopOpacity="0"/>
            </linearGradient>
          </defs>

          {/* Grid lines + Y labels */}
          {gridLevels.map(pct=>{
            const y = padY + (1-pct)*chartH
            const val = maxVal*pct
            const label = val>=1000 ? '$'+(val/1000).toFixed(1)+'k' : prefix+val.toFixed(0)
            return <g key={pct}>
              <line x1={padX} y1={y} x2={w-padR} y2={y}
                stroke={pct===0?'rgba(14,14,12,0.12)':'rgba(14,14,12,0.06)'}
                strokeWidth={pct===0?1.5:1} strokeDasharray={pct===0?'none':'4,4'}/>
              {pct>0&&<text x={padX-6} y={y+4} fontSize={9} fill={gray} textAnchor="end">{label}</text>}
            </g>
          })}

          {/* Area fill */}
          {areaPath&&<path d={areaPath} fill={`url(#${gradId})`}/>}

          {/* Smooth line */}
          {linePath&&<path d={linePath} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/>}

          {/* Hover zones + dots */}
          {pts.map((p,i)=>(
            <g key={i} onMouseEnter={()=>setHovered(i)} style={{cursor:'crosshair'}}>
              {/* invisible hover zone */}
              <rect x={p.x-(chartW/(data.length*2))} y={padY} width={chartW/data.length} height={chartH} fill="transparent"/>
              {/* dot — always show if hovered, else small */}
              <circle cx={p.x} cy={p.y} r={hovered===i?5:3}
                fill={hovered===i?color:'white'}
                stroke={color} strokeWidth={2}
                style={{transition:'r 0.1s'}}/>
              {/* vertical line on hover */}
              {hovered===i&&<line x1={p.x} y1={padY} x2={p.x} y2={h-padY} stroke={color} strokeWidth={1} strokeDasharray="3,3" opacity={0.4}/>}
            </g>
          ))}
        </svg>

        {/* X labels */}
        <div style={{display:'flex',justifyContent:'space-between',paddingLeft:padX,paddingRight:padR,marginTop:'0.35rem'}}>
          {data.map(([m],i)=>{
            // Show every other label if > 7 points
            if (data.length > 7 && i % 2 !== 0 && i !== data.length-1) return <span key={i}/>
            return <span key={i} style={{fontSize:'0.52rem',color:hovered===i?black:gray,fontWeight:hovered===i?600:400,transition:'color 0.1s'}}>{m}</span>
          })}
        </div>
      </div>
    )
  }

  // Bar chart for services — premium version
  function BarChart({ data, color, prefix='$' }) {
    const [hovered, setHovered] = useState(null)
    const maxVal = Math.max(...data.map(d=>d[1]),1)
    const total = data.reduce((a,d)=>a+d[1],0)
    return (
      <div>
        {data.map(([name,val],i)=>{
          const pct = Math.round(val/total*100)
          return (
            <div key={name} style={{marginBottom:'1rem'}}
              onMouseEnter={()=>setHovered(i)} onMouseLeave={()=>setHovered(null)}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:'0.35rem'}}>
                <span style={{fontSize:'0.7rem',color:hovered===i?black:gray,fontWeight:hovered===i?600:400,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'65%',transition:'color 0.15s'}}>{name}</span>
                <div style={{display:'flex',alignItems:'baseline',gap:'0.5rem',flexShrink:0}}>
                  <span style={{fontSize:'0.58rem',color:gray}}>{pct}%</span>
                  <span style={{fontSize:'0.82rem',fontWeight:600,color:black,fontFamily:ffS}}>{prefix}{val.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
                </div>
              </div>
              <div style={{height:8,background:'rgba(14,14,12,0.06)',borderRadius:4,overflow:'hidden'}}>
                <div style={{height:'100%',width:(val/maxVal*100)+'%',background:hovered===i?color:color+'cc',borderRadius:4,transition:'width 0.4s, background 0.15s'}}/>
              </div>
            </div>
          )
        })}
        <div style={{marginTop:'1.25rem',paddingTop:'1rem',borderTop:'1px solid rgba(14,14,12,0.06)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{fontSize:'0.58rem',color:gray,letterSpacing:'0.08em',textTransform:'uppercase'}}>Total Revenue</span>
          <span style={{fontSize:'1.1rem',fontFamily:ffS,fontWeight:300,color:black}}>{prefix}{total.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
        </div>
      </div>
    )
  }

  const activeChartDef = getCharts(period).find(c=>c.id===activeChart)

  async function voidSale(saleId) {
    if (!confirm('Void this transaction?')) return
    await fetch('/api/admin/sales', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: saleId, status: 'voided' })
    })
    loadAll()
  }

  return(
    <>
      {/* SALES HISTORY MODAL */}
      {salesHistoryOpen&&(
        <div style={{position:'fixed',inset:0,background:'rgba(14,14,12,0.6)',zIndex:400,display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={e=>e.target===e.currentTarget&&setSalesHistoryOpen(false)}>
          <div style={{background:modalBg,borderRadius:'14px 14px 0 0',width:'100%',maxWidth:640,maxHeight:'85vh',display:'flex',flexDirection:'column',boxShadow:'0 -8px 40px rgba(0,0,0,0.15)'}}>
            <div style={{padding:'1.25rem 1.5rem',borderBottom:`1px solid ${modalDivider}`,display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0}}>
              <div>
                <div style={{fontFamily:ffS,fontSize:'1.2rem',fontWeight:300,color:modalInk}}>All Transactions</div>
                <div style={{fontSize:'0.6rem',color:modalGray,marginTop:'0.15rem'}}>{(sales||[]).length} records · tap Void to cancel</div>
              </div>
              <button onClick={()=>setSalesHistoryOpen(false)} style={{background:'none',border:'none',fontSize:'1.1rem',color:modalGray,cursor:'pointer'}}>✕</button>
            </div>
            <div style={{flex:1,overflowY:'auto',padding:'0 1.5rem'}}>
              {(sales||[]).length===0&&<div style={{textAlign:'center',color:modalGray,fontSize:'0.78rem',padding:'2rem'}}>No transactions yet.</div>}
              {[...(sales||[])].sort((a,b)=>new Date(b.sale_date)-new Date(a.sale_date)).map((s,i)=>{
                const isVoided = s.status==='voided'
                const isRefunded = s.status==='refunded'
                return(
                  <div key={s.id} style={{display:'flex',alignItems:'center',gap:'0.75rem',padding:'0.85rem 0',borderBottom:`1px solid ${modalDivider}`,opacity:isVoided?0.45:1}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:'0.75rem',color:modalInk,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.customer_name||s.customer_email||'—'}</div>
                      <div style={{fontSize:'0.62rem',color:modalGray,marginTop:'0.1rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.product_name||'—'}</div>
                      <div style={{fontSize:'0.58rem',color:modalGray,marginTop:'0.1rem'}}>{s.sale_date?new Date(s.sale_date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):''} · {s.type||'stripe'}</div>
                    </div>
                    <div style={{textAlign:'right',flexShrink:0}}>
                      <div style={{fontSize:'0.85rem',fontWeight:600,fontFamily:ffS,color:isVoided?gray:isRefunded?'#c0392b':'#2d8a60'}}>{isRefunded?'-':''}${Math.abs(parseFloat(s.amount||0)).toFixed(2)}</div>
                      <span style={{fontSize:'0.52rem',padding:'0.15rem 0.5rem',borderRadius:20,background:isVoided?'rgba(14,14,12,0.06)':isRefunded?'rgba(192,57,43,0.08)':'rgba(45,138,96,0.08)',color:isVoided?gray:isRefunded?'#c0392b':'#2d8a60',display:'inline-block',marginTop:'0.2rem'}}>{s.status}</span>
                    </div>
                    {!isVoided&&!isRefunded&&(
                      <button onClick={()=>voidSale(s.id)} style={{flexShrink:0,padding:'0.3rem 0.65rem',background:'rgba(192,57,43,0.08)',color:'#c0392b',border:'1px solid rgba(192,57,43,0.15)',borderRadius:3,cursor:'pointer',fontFamily:ff,fontSize:'0.54rem',letterSpacing:'0.07em',textTransform:'uppercase'}}>Void</button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
      {/* Chart Modal */}
      {activeChart && activeChartDef && (
        <div style={{position:'fixed',inset:0,background:'rgba(14,14,12,0.55)',zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem'}} onClick={e=>e.target===e.currentTarget&&openChart(activeChart)}>
          <div style={{background:modalBg,borderRadius:14,width:'100%',maxWidth:640,maxHeight:'88vh',overflowY:'auto',boxShadow:'0 24px 60px rgba(0,0,0,0.18)',transition:'opacity 0.22s',opacity:chartVisible?1:0}}>
            {/* Modal header */}
            <div style={{padding:'1.25rem 1.5rem',borderBottom:`1px solid ${modalDivider}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontFamily:ffS,fontSize:'1.15rem',fontWeight:300,color:modalInk}}>{activeChartDef.label}</div>
                <div style={{fontSize:'0.58rem',color:modalGray,marginTop:'0.2rem'}}>{activeChartDef.desc}</div>
              </div>
              <button onClick={()=>openChart(activeChart)} style={{background:'none',border:'none',fontSize:'1.1rem',color:modalGray,cursor:'pointer',padding:'0.25rem 0.5rem'}}>✕</button>
            </div>

            {/* Period selector + chart switcher */}
            <div style={{padding:'0.85rem 1.5rem',borderBottom:'1px solid rgba(14,14,12,0.05)',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'0.5rem'}}>
              {/* Period pills */}
              <div style={{display:'flex',gap:'0.3rem'}}>
                {[['weekly','Weekly'],['monthly','Monthly'],['ytd','YTD'],['yearly','Yearly']].map(([p,label])=>(
                  <button key={p} onClick={()=>setPeriod(p)} style={{
                    padding:'0.3rem 0.75rem',borderRadius:20,fontFamily:ff,fontSize:'0.58rem',cursor:'pointer',
                    border:'1px solid '+(period===p?black:'rgba(14,14,12,0.12)'),
                    background:period===p?black:'transparent',
                    color:period===p?white:gray,
                    transition:'all 0.15s'
                  }}>{label}</button>
                ))}
              </div>
              {/* Chart switcher */}
              <div style={{display:'flex',gap:'0.3rem',flexWrap:'wrap'}}>
                {getCharts(period).map(c=>(
                  <button key={c.id} onClick={()=>openChart(c.id)} style={{padding:'0.3rem 0.65rem',borderRadius:20,border:`1px solid ${activeChart===c.id?c.color:'rgba(14,14,12,0.1)'}`,background:activeChart===c.id?c.color+'18':'transparent',color:activeChart===c.id?c.color:gray,fontSize:'0.56rem',fontFamily:ff,cursor:'pointer',display:'flex',alignItems:'center',gap:'0.25rem',transition:'all 0.15s'}}>
                    <span style={{width:5,height:5,borderRadius:'50%',background:c.color,display:'inline-block',flexShrink:0}}/>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Chart content */}
            <div style={{padding:'1.25rem 1.5rem',transition:'opacity 0.22s',opacity:chartVisible?1:0}}>
              {(()=>{
                const chartData = activeChartDef.getData(period)
                const isEmpty = chartData.every(d=>d[1]===0)
                return <>
                  {!isEmpty && !activeChartDef.isBar && (()=>{
                    const vals = chartData.map(d=>d[1]).filter(v=>v>0)
                    const total = vals.reduce((a,b)=>a+b,0)
                    const avg = vals.length>0?total/vals.length:0
                    const peak = Math.max(...vals,0)
                    const peakLabel = chartData.find(d=>d[1]===peak)?.[0]||'—'
                    return (
                      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'0.75rem',marginBottom:'1.5rem'}}>
                        {[['Total',activeChartDef.prefix+total.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}),'#2d8a60'],
                          ['Avg',activeChartDef.prefix+avg.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}),gold],
                          ['Peak',peakLabel,'#5b8dee']
                        ].map(([label,val,color])=>(
                          <div key={label} style={{textAlign:'center',background:'rgba(14,14,12,0.025)',borderRadius:8,padding:'0.75rem 0.5rem'}}>
                            <div style={{fontSize:'0.95rem',fontFamily:ffS,fontWeight:300,color,lineHeight:1}}>{val}</div>
                            <div style={{fontSize:'0.5rem',color:gray,letterSpacing:'0.07em',textTransform:'uppercase',marginTop:'0.25rem'}}>{label}</div>
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                  {activeChartDef.isBar
                    ? <BarChart data={chartData} color={activeChartDef.color} prefix={activeChartDef.prefix}/>
                    : <AreaChart data={chartData} color={activeChartDef.color} prefix={activeChartDef.prefix}/>
                  }
                  {isEmpty&&<div style={{textAlign:'center',color:gray,fontSize:'0.72rem',padding:'2rem 0'}}>No data for this period.</div>}
                </>
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Financial Card */}
      <div style={{background:'rgba(248,246,241,0.6)',backdropFilter:'blur(20px) saturate(160%)',borderRadius:14,border:'1px solid rgba(255,255,255,0.7)',boxShadow:'inset 0 1px 0 rgba(255,255,255,0.8),0 8px 32px -8px rgba(28,28,26,0.1)',overflow:'hidden',marginBottom:'1.5rem'}}>

        {/* HEADER — always shows KPIs */}
        <div style={{padding:'1rem 1.5rem 0'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.85rem'}}>
            <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
              <div style={{fontFamily:ffS,fontSize:'1.1rem',fontWeight:300}}>Financial <span style={{fontSize:'0.52rem',color:gold,letterSpacing:'0.1em',textTransform:'uppercase',marginLeft:'0.5rem'}}>Stripe</span></div>
              <button onClick={()=>setSalesHistoryOpen(true)} style={{fontSize:'0.58rem',color:'#2980b9',background:'rgba(52,152,219,0.08)',border:'1px solid rgba(52,152,219,0.2)',borderRadius:20,padding:'0.22rem 0.65rem',cursor:'pointer',fontFamily:ff,letterSpacing:'0.06em',textTransform:'uppercase'}}>{paid.length} sales ›</button>
            </div>
            <button onClick={()=>setExpanded(e=>!e)} style={{display:'flex',alignItems:'center',gap:'0.3rem',background:'none',border:'1px solid rgba(14,14,12,0.1)',borderRadius:20,cursor:'pointer',color:gray,fontSize:'0.58rem',padding:'0.22rem 0.65rem',fontFamily:ff,letterSpacing:'0.06em',textTransform:'uppercase',transition:'all 0.15s'}}>
              {expanded?'Less':'More'} <span style={{display:'inline-block',transform:expanded?'rotate(180deg)':'rotate(0)',transition:'transform 0.2s',lineHeight:1}}>▾</span>
            </button>
          </div>

          {/* KPIs — always visible */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'0.5rem',marginBottom:'1rem'}}>
            {[
              ['YTD Revenue', '$'+ytdSales.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}), '#2d8a60'],
              ['This Month',  '$'+thisMonthSales.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}), gold],
              ['Avg Order',   '$'+avgOrder.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}), '#5b8dee'],
            ].map(([label,val,color])=>(
              <div key={label} style={{textAlign:'center',background:'rgba(14,14,12,0.025)',borderRadius:8,padding:'0.65rem 0.25rem'}}>
                <div style={{fontSize:'0.95rem',fontFamily:ffS,fontWeight:300,color,lineHeight:1}}>{val}</div>
                <div style={{fontSize:'0.5rem',color:gray,letterSpacing:'0.07em',textTransform:'uppercase',marginTop:'0.25rem'}}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* EXPANDED — chart chips */}
        {expanded&&(
          <div style={{borderTop:'1px solid rgba(14,14,12,0.06)',padding:'0.85rem 1.5rem'}}>
            <div style={{fontSize:'0.5rem',letterSpacing:'0.14em',textTransform:'uppercase',color:gray,marginBottom:'0.6rem'}}>Charts — tap to view</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:'0.4rem'}}>
              {getCharts('yearly').map(c=>(
                <button key={c.id} onClick={()=>openChart(c.id)} style={{
                  padding:'0.4rem 0.85rem',
                  borderRadius:20,
                  border:`1px solid ${activeChart===c.id?c.color:'rgba(14,14,12,0.12)'}`,
                  background: activeChart===c.id?c.color+'18':'transparent',
                  color: c.color,
                  fontSize:'0.6rem',
                  fontFamily:ff,
                  cursor:'pointer',
                  display:'flex',
                  alignItems:'center',
                  gap:'0.3rem',
                  transition:'all 0.15s'
                }}>
                  <span style={{width:6,height:6,borderRadius:'50%',background:c.color,display:'inline-block',flexShrink:0}}/>
                  {c.label}
                </button>
              ))}
            </div>
            {paid.length===0&&<div style={{textAlign:'center',fontSize:'0.72rem',color:gray,padding:'0.75rem 0 0'}}>No Stripe payments recorded yet.</div>}
          </div>
        )}
      </div>
    </>
  )
}

function SupplyCostHistory({ supplyId }) {
  const [history, setHistory] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(()=>{
    if (!open || history.length>0) return
    setLoading(true)
    fetch('/api/admin/supplies?history='+supplyId)
      .then(r=>r.json())
      .then(d=>{ setHistory(d.history||[]); setLoading(false) })
      .catch(()=>setLoading(false))
  },[open, supplyId])

  return(
    <div style={{marginTop:'0.5rem'}}>
      <button onClick={()=>setOpen(o=>!o)} style={{display:'flex',alignItems:'center',gap:'0.3rem',background:'none',border:'none',cursor:'pointer',fontFamily:ff,fontSize:'0.54rem',color:gray,letterSpacing:'0.08em',textTransform:'uppercase',padding:0}}>
        Cost History {open?'▴':'▾'}
      </button>
      {open&&(
        <div style={{marginTop:'0.4rem',border:'1px solid rgba(14,14,12,0.07)',borderRadius:6,overflow:'hidden',maxHeight:140,overflowY:'auto'}}>
          {loading&&<div style={{padding:'0.5rem 0.85rem',fontSize:'0.62rem',color:gray}}>Loading...</div>}
          {!loading&&history.length===0&&<div style={{padding:'0.5rem 0.85rem',fontSize:'0.62rem',color:gray}}>No history yet.</div>}
          {!loading&&history.map((h,i)=>(
            <div key={h.id||i} style={{display:'flex',justifyContent:'space-between',padding:'0.5rem 0.85rem',borderBottom:i<history.length-1?'1px solid rgba(14,14,12,0.05)':'none'}}>
              <span style={{fontSize:'0.7rem',fontWeight:600,color:black}}>${parseFloat(h.cost).toFixed(2)}</span>
              <span style={{fontSize:'0.6rem',color:gray}}>{new Date(h.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SuppliesPanel({ supplies, onAdd, onEdit, onDelete, showToast }) {
  const categories = [...new Set(supplies.map(s=>s.category).filter(Boolean))]

  const unitLabel = u => u==='month'?'/mo':u==='year'?'/yr':u==='one-time'?' once':'/'+u

  // Totals
  const monthlyTotal = supplies.filter(s=>s.active).reduce((a,s)=>{
    if (s.unit==='month') return a+parseFloat(s.cost||0)
    if (s.unit==='year') return a+parseFloat(s.cost||0)/12
    return a
  },0)
  const yearlyTotal = supplies.filter(s=>s.active).reduce((a,s)=>{
    if (s.unit==='month') return a+parseFloat(s.cost||0)*12
    if (s.unit==='year') return a+parseFloat(s.cost||0)
    return a
  },0)

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.25rem'}}>
        <h2 style={{fontFamily:ffS,fontSize:'1.5rem',fontWeight:300}}>Supplies</h2>
        <button onClick={onAdd} style={{background:black,color:white,border:'none',padding:'0.6rem 1.1rem',fontFamily:ff,fontSize:'0.6rem',letterSpacing:'0.12em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>+ Add</button>
      </div>

      {/* Totals row */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem',marginBottom:'1.5rem'}}>
        {[['Monthly Cost','$'+monthlyTotal.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}),'#c0392b'],
          ['Annual Cost','$'+yearlyTotal.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}),'#c0392b']
        ].map(([label,val,color])=>(
          <div key={label} style={{background:white,borderRadius:10,padding:'1.25rem',border:'1px solid rgba(14,14,12,0.07)',textAlign:'center'}}>
            <div style={{fontFamily:ffS,fontSize:'1.4rem',fontWeight:300,color}}>{val}</div>
            <div style={{fontSize:'0.56rem',color:gray,letterSpacing:'0.1em',textTransform:'uppercase',marginTop:'0.25rem'}}>{label}</div>
          </div>
        ))}
      </div>

      {/* Grid */}
      {supplies.length===0&&<div style={{background:white,borderRadius:10,padding:'2rem',textAlign:'center',color:gray,fontSize:'0.82rem',border:'1px solid rgba(14,14,12,0.07)'}}>No supplies yet. Add your first one.</div>}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'0.85rem'}}>
        {supplies.map(s=>(
          <div key={s.id} style={{background:'rgba(248,246,241,0.6)',backdropFilter:'blur(20px) saturate(160%)',borderRadius:14,border:'1px solid rgba(255,255,255,0.7)',boxShadow:'inset 0 1px 0 rgba(255,255,255,0.8),0 8px 32px -8px rgba(28,28,26,0.1)',padding:'1.1rem',display:'flex',flexDirection:'column',gap:'0.4rem',opacity:s.active?1:0.5}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
              <div style={{fontFamily:ffS,fontSize:'1rem',fontWeight:300,color:black,lineHeight:1.3,flex:1,marginRight:'0.5rem'}}>{s.name}</div>
              <div style={{display:'flex',gap:'0.3rem',flexShrink:0}}>
                <button onClick={()=>onEdit(s)} style={{background:'none',border:'none',cursor:'pointer',color:gray,fontSize:'0.65rem',padding:'0.1rem 0.3rem',fontFamily:ff}}>✎</button>
                <button onClick={()=>onDelete(s.id)} style={{background:'none',border:'none',cursor:'pointer',color:'rgba(192,57,43,0.5)',fontSize:'0.75rem',padding:'0.1rem 0.3rem'}}>×</button>
              </div>
            </div>
            {s.category&&<span style={{fontSize:'0.52rem',padding:'0.15rem 0.5rem',borderRadius:20,background:'rgba(14,14,12,0.05)',color:gray,width:'fit-content',letterSpacing:'0.06em',textTransform:'uppercase'}}>{s.category}</span>}
            {s.provider&&<div style={{fontSize:'0.62rem',color:gray,fontStyle:'italic'}}>{s.provider}</div>}
            <div style={{marginTop:'auto',paddingTop:'0.5rem',borderTop:'1px solid rgba(14,14,12,0.05)',display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
              <span style={{fontFamily:ffS,fontSize:'1.15rem',fontWeight:300,color:'#c0392b'}}>${parseFloat(s.cost).toFixed(2)}</span>
              <span style={{fontSize:'0.58rem',color:gray}}>{unitLabel(s.unit)}</span>
            </div>
            {s.renewal_date&&<div style={{fontSize:'0.58rem',color:gold}}>Renews {new Date(s.renewal_date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</div>}
            <SupplyCostHistory supplyId={s.id}/>
          </div>
        ))}
      </div>
    </div>
  )
}

function formatCalendarTime(ev) {
  if (!ev.start?.dateTime) return 'All day'
  return new Date(ev.start.dateTime).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})
}

function AgendaEvent({ ev, todayFlag }) {
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const d = new Date(ev.start?.dateTime||ev.start?.date)
  const name = ev.summary || 'Booking'

  async function loadNotes() {
    if (loaded) return
    const res = await fetch('/api/admin/booking-notes?event_id='+encodeURIComponent(ev.id))
    const data = await res.json()
    setNotes(data.notes||'')
    setLoaded(true)
  }

  async function saveNotes() {
    setSaving(true)
    await fetch('/api/admin/booking-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: ev.id, notes })
    })
    setSaving(false)
  }

  function handleOpen() {
    setOpen(o=>!o)
    if (!open) loadNotes()
  }

  return (
    <div style={{borderBottom:'1px solid rgba(14,14,12,0.05)'}}>
      <div onClick={handleOpen} style={{display:'flex',alignItems:'center',gap:'1rem',padding:'0.85rem 1.25rem',cursor:'pointer',background:open?'rgba(14,14,12,0.02)':'transparent'}}>
        <div style={{flexShrink:0,textAlign:'center',minWidth:44}}>
          <div style={{fontSize:'0.55rem',color:'#6b6b67',textTransform:'uppercase'}}>{d.toLocaleDateString('en-US',{month:'short'})}</div>
          <div style={{fontSize:'1.3rem',fontFamily:ffS,fontWeight:300,color:todayFlag?gold:black,lineHeight:1}}>{d.getDate()}</div>
          <div style={{fontSize:'0.52rem',color:'#6b6b67'}}>{d.toLocaleDateString('en-US',{weekday:'short'})}</div>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:'0.78rem',color:black,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{name}</div>
          <div style={{fontSize:'0.6rem',color:gold,marginTop:'0.1rem'}}>{formatCalendarTime(ev)}</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'0.5rem',flexShrink:0}}>
          {todayFlag&&<span style={{fontSize:'0.52rem',padding:'0.15rem 0.5rem',borderRadius:20,background:'rgba(184,151,90,0.12)',color:gold}}>Today</span>}
          <span style={{fontSize:'0.65rem',color:'#6b6b67',transform:open?'rotate(180deg)':'rotate(0)',display:'inline-block',transition:'transform 0.2s'}}>▾</span>
        </div>
      </div>
      {open&&(
        <div style={{padding:'0 1.25rem 1.25rem',borderTop:'1px solid rgba(14,14,12,0.04)'}}>
          {ev.description&&(()=>{
            // Parse Google Calendar HTML description into label/value pairs
            const raw = ev.description
              .replace(/<br\s*\/?>/gi, '\n')
              .replace(/<b>(.*?)<\/b>/gi, '|||$1|||')
              .replace(/<[^>]+>/g, '')
            const lines = raw.split('\n').map(l=>l.trim()).filter(Boolean)
            const fields = []
            let currentLabel = null
            lines.forEach(line => {
              if (line.startsWith('|||') && line.endsWith('|||')) {
                currentLabel = line.replace(/\|\|\|/g,'').trim()
              } else if (currentLabel) {
                fields.push({ label: currentLabel, value: line })
                currentLabel = null
              } else {
                fields.push({ label: null, value: line })
              }
            })
            return (
              <div style={{marginBottom:'1rem',borderRadius:8,overflow:'hidden',border:'1px solid rgba(14,14,12,0.07)'}}>
                <div style={{padding:'0.6rem 0.85rem',background:'rgba(14,14,12,0.03)',fontSize:'0.5rem',letterSpacing:'0.1em',textTransform:'uppercase',color:gray,borderBottom:'1px solid rgba(14,14,12,0.06)'}}>Client Info</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0'}}>
                  {fields.filter(f=>f.label).map((f,j)=>(
                    <div key={j} style={{padding:'0.65rem 0.85rem',borderBottom:'1px solid rgba(14,14,12,0.04)',borderRight:j%2===0?'1px solid rgba(14,14,12,0.04)':'none'}}>
                      <div style={{fontSize:'0.5rem',color:gray,letterSpacing:'0.07em',textTransform:'uppercase',marginBottom:'0.2rem'}}>{f.label}</div>
                      <div style={{fontSize:'0.72rem',color:f.value?black:'rgba(14,14,12,0.25)',fontWeight:f.value?500:400}}>{f.value||'—'}</div>
                    </div>
                  ))}
                </div>
                {fields.filter(f=>!f.label).map((f,j)=>(
                  <div key={'n'+j} style={{padding:'0.65rem 0.85rem',borderTop:'1px solid rgba(14,14,12,0.04)',fontSize:'0.65rem',color:gray,lineHeight:1.6,fontStyle:'italic'}}>{f.value}</div>
                ))}
              </div>
            )
          })()}
          {ev.location&&<div style={{fontSize:'0.62rem',color:'#6b6b67',marginBottom:'0.75rem'}}>{ev.location}</div>}
          {ev.end?.dateTime&&<div style={{fontSize:'0.62rem',color:gold,marginBottom:'0.75rem'}}>{formatCalendarTime(ev)} – {new Date(ev.end.dateTime).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})}</div>}
          <div style={{fontSize:'0.5rem',letterSpacing:'0.1em',textTransform:'uppercase',color:'#6b6b67',marginBottom:'0.4rem'}}>Notes</div>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Add notes about this booking..." rows={3}
            style={{width:'100%',padding:'0.65rem',border:'1px solid #e8e5de',borderRadius:4,fontFamily:ff,fontSize:'0.72rem',outline:'none',resize:'vertical',boxSizing:'border-box',color:black,lineHeight:1.6}}/>
          <button onClick={saveNotes} disabled={saving}
            style={{marginTop:'0.4rem',padding:'0.45rem 1rem',background:black,color:white,border:'none',borderRadius:3,cursor:'pointer',fontFamily:ff,fontSize:'0.58rem',letterSpacing:'0.1em',textTransform:'uppercase',opacity:saving?0.6:1}}>
            {saving?'Saving…':'Save Notes'}
          </button>
        </div>
      )}
    </div>
  )
}

const STATUS_COLORS = {
  pending:   { label:'Pending',   color:'#e67e22', bg:'rgba(230,126,34,0.1)' },
  confirmed: { label:'Confirmed', color:'#2d8a60', bg:'rgba(45,138,96,0.1)' },
  cancelled: { label:'Cancelled', color:'#c0392b', bg:'rgba(192,57,43,0.1)' },
  completed: { label:'Completed', color:'#b8975a', bg:'rgba(184,151,90,0.12)' },
}

function ReviewsPanel() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')

  async function load() {
    setLoading(true)
    try {
      const r = await fetch(`/api/reviews?status=${filter}`)
      const d = await r.json()
      setReviews(Array.isArray(d) ? d : [])
    } catch(e) { setReviews([]) }
    setLoading(false)
  }
  useEffect(() => { load() }, [filter])

  async function moderate(id, status) {
    await fetch('/api/reviews', { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ id, status }) })
    load()
  }

  const tabs = [['pending','Pendientes'],['approved','Aprobadas'],['rejected','Rechazadas']]
  const glassCard = {background:'rgba(248,246,241,0.65)',backdropFilter:'blur(20px) saturate(160%)',borderRadius:14,border:'1px solid rgba(255,255,255,0.75)',boxShadow:'inset 0 1px 0 rgba(255,255,255,0.85),0 4px 20px -4px rgba(28,28,26,0.08)'}

  return (
    <div style={{maxWidth:640}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.25rem'}}>
        <h2 style={{fontFamily:ffS,fontSize:'1.5rem',fontWeight:300}}>Reseñas del sitio</h2>
        <div style={{fontSize:'0.62rem',color:gray}}>{reviews.length} {filter}</div>
      </div>
      <div style={{display:'flex',gap:'0.4rem',marginBottom:'1.25rem'}}>
        {tabs.map(([id,label])=>(
          <button key={id} onClick={()=>setFilter(id)} style={{padding:'0.45rem 1rem',borderRadius:20,border:'none',cursor:'pointer',fontFamily:ff,fontSize:'0.62rem',fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',background:filter===id?black:'rgba(28,28,26,0.07)',color:filter===id?white:gray,transition:'all 0.15s'}}>{label}</button>
        ))}
      </div>
      {loading && <div style={{padding:'2rem',textAlign:'center',color:gray,fontSize:'0.82rem'}}>Cargando…</div>}
      {!loading && reviews.length === 0 && <div style={{...glassCard,padding:'2rem',textAlign:'center',color:gray,fontSize:'0.82rem'}}>No hay reseñas {filter}.</div>}
      <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
        {reviews.map(r=>(
          <div key={r.id} style={{...glassCard,padding:'1rem 1.25rem'}}>
            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'1rem'}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:'0.4rem',marginBottom:'0.35rem'}}>
                  {Array.from({length:5},(_,i)=>(
                    <div key={i} style={{width:10,height:10,borderRadius:'50%',background:i<r.rating?gold:'rgba(184,151,90,0.15)'}}/>
                  ))}
                  <span style={{fontSize:'0.6rem',color:gray,marginLeft:'0.2rem'}}>★ {r.rating}/5</span>
                </div>
                <p style={{fontSize:'0.82rem',color:black,lineHeight:1.5,marginBottom:'0.5rem'}}>"{r.text}"</p>
                <div style={{display:'flex',gap:'0.4rem',flexWrap:'wrap'}}>
                  <span style={{fontSize:'0.65rem',fontWeight:600,color:black}}>{r.name}</span>
                  <span style={{fontSize:'0.65rem',color:gray}}>·</span>
                  <span style={{fontSize:'0.65rem',color:gray}}>{r.business}</span>
                  <span style={{fontSize:'0.65rem',color:'rgba(28,28,26,0.3)'}}>·</span>
                  <span style={{fontSize:'0.6rem',color:'rgba(28,28,26,0.35)'}}>{new Date(r.created_at).toLocaleDateString('es-PR',{month:'short',day:'numeric',year:'numeric'})}</span>
                </div>
              </div>
              {filter === 'pending' && (
                <div style={{display:'flex',flexDirection:'column',gap:'0.4rem',flexShrink:0}}>
                  <button onClick={()=>moderate(r.id,'approved')} style={{padding:'0.45rem 0.85rem',background:'rgba(45,138,96,0.1)',color:'#2d8a60',border:'1px solid rgba(45,138,96,0.25)',borderRadius:6,cursor:'pointer',fontFamily:ff,fontSize:'0.6rem',fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase'}}>Aprobar</button>
                  <button onClick={()=>moderate(r.id,'rejected')} style={{padding:'0.45rem 0.85rem',background:'rgba(192,57,43,0.08)',color:'#c0392b',border:'1px solid rgba(192,57,43,0.2)',borderRadius:6,cursor:'pointer',fontFamily:ff,fontSize:'0.6rem',fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase'}}>Rechazar</button>
                </div>
              )}
              {filter !== 'pending' && (
                <span style={{fontSize:'0.58rem',fontWeight:700,padding:'0.2rem 0.65rem',borderRadius:20,background:filter==='approved'?'rgba(45,138,96,0.1)':'rgba(192,57,43,0.08)',color:filter==='approved'?'#2d8a60':'#c0392b',flexShrink:0}}>
                  {filter === 'approved' ? 'Aprobada' : 'Rechazada'}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function BookingsPanel() {
  const {dm,inkC,grayC,inputBg,inputBorder,subtleBg,cardBg,cardBorder,surfaceBg,divider,glassCard}=useTheme()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [view, setView] = useState('agenda')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selected, setSelected] = useState(null)
  const [notesDraft, setNotesDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [agentMap, setAgentMap] = useState({})

  useEffect(()=>{
    fetch('/api/admin/users?all=1').then(r=>r.json()).then(d=>{
      const map={}
      ;(d.users||[]).filter(u=>u.role==='agent').forEach(u=>{
        const parts=(u.full_name||u.email||'').trim().split(' ')
        map[u.id]=parts[parts.length-1]||u.email
      })
      setAgentMap(map)
    }).catch(()=>{})
  },[])

  useEffect(() => { fetchBookings() }, [currentDate, view])

  async function fetchBookings() {
    setLoading(true); setError(null)
    try {
      const start = new Date(currentDate), end = new Date(currentDate)
      if (view==='week') { start.setDate(start.getDate()-start.getDay()); end.setDate(start.getDate()+7) }
      else if (view==='month') { start.setDate(1); end.setMonth(end.getMonth()+1); end.setDate(0) }
      else { end.setDate(end.getDate()+60) }
      const from = start.toISOString().slice(0,10)
      const to = end.toISOString().slice(0,10)
      const res = await fetch(`/api/admin/bookings?from=${from}&to=${to}`)
      if (!res.ok) throw new Error('failed')
      const data = await res.json()
      const prev = bookings
      if (data.length > prev.length && prev.length > 0) {
        fetch('/api/admin/push?action=send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:'Nueva Reserva',body:`${data[0]?.name} — ${data[0]?.business}`,url:'/admin'})}).catch(()=>{})
      }
      setBookings(data)
    } catch(e) { setError('No se pudieron cargar las reservas.') }
    setLoading(false)
  }

  async function updateStatus(id, status) {
    await fetch('/api/admin/bookings', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id, status}) })
    setBookings(prev => prev.map(b => b.id===id ? {...b, status} : b))
    if (selected?.id===id) setSelected(s => ({...s, status}))
  }

  async function saveNotes(id) {
    setSaving(true)
    await fetch('/api/admin/bookings', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id, notes: notesDraft}) })
    setBookings(prev => prev.map(b => b.id===id ? {...b, notes: notesDraft} : b))
    setSelected(s => ({...s, notes: notesDraft}))
    setSaving(false)
  }

  function getBookingsForDay(date) {
    if (!date) return []
    const iso = date.toISOString().slice(0,10)
    return bookings.filter(b => b.date === iso)
  }

  function navPrev() {
    const d=new Date(currentDate)
    if(view==='month') d.setMonth(d.getMonth()-1)
    else if(view==='week') d.setDate(d.getDate()-7)
    else d.setDate(d.getDate()-30)
    setCurrentDate(d)
  }
  function navNext() {
    const d=new Date(currentDate)
    if(view==='month') d.setMonth(d.getMonth()+1)
    else if(view==='week') d.setDate(d.getDate()+7)
    else d.setDate(d.getDate()+30)
    setCurrentDate(d)
  }

  const navLabel = view==='month'
    ? currentDate.toLocaleDateString('en-US',{month:'long',year:'numeric'})
    : view==='week' ? 'Week of '+currentDate.toLocaleDateString('en-US',{month:'short',day:'numeric'})
    : 'Upcoming 60 days'

  const weekDayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

  function getMonthDays() {
    const y=currentDate.getFullYear(), m=currentDate.getMonth()
    const firstDay=new Date(y,m,1).getDay()
    const daysInMonth=new Date(y,m+1,0).getDate()
    const days=[]
    for(let i=0;i<firstDay;i++) days.push(null)
    for(let i=1;i<=daysInMonth;i++) days.push(new Date(y,m,i))
    return days
  }

  if (selected) {
    const st = STATUS_COLORS[selected.status] || STATUS_COLORS.pending
    return (
      <div>
        <button onClick={()=>setSelected(null)} style={{display:'flex',alignItems:'center',gap:'0.5rem',background:'none',border:'none',cursor:'pointer',color:grayC,fontFamily:ff,fontSize:'0.65rem',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:'1.5rem',padding:0}}>← Back to Bookings</button>
        <div style={{background:black,borderRadius:12,padding:'1.75rem',marginBottom:'1.25rem',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 60% 50% at 0% 50%,rgba(184,151,90,0.08) 0%,transparent 70%)'}}/>
          <div style={{fontFamily:ffS,fontSize:'1.5rem',fontWeight:300,color:white,marginBottom:'0.2rem'}}>{selected.name}</div>
          <div style={{fontSize:'0.7rem',color:'rgba(255,255,255,0.4)',marginBottom:'0.5rem'}}>{selected.business}</div>
          <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>
            {[[selected.date,'Date'],[selected.time,'Time'],[selected.phone,'Phone']].map(([v,l])=>(
              <div key={l} style={{textAlign:'center',background:'rgba(255,255,255,0.05)',borderRadius:8,padding:'0.6rem 0.85rem',border:'1px solid rgba(184,151,90,0.1)'}}>
                <div style={{fontFamily:ffS,fontSize:'1rem',fontWeight:300,color:gold,lineHeight:1}}>{v}</div>
                <div style={{fontSize:'0.5rem',letterSpacing:'0.1em',textTransform:'uppercase',color:'rgba(255,255,255,0.3)',marginTop:'0.2rem'}}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{...glassCard,borderRadius:14,padding:'1.25rem',marginBottom:'1rem'}}>
          <div style={{fontSize:'0.62rem',letterSpacing:'0.1em',textTransform:'uppercase',color:grayC,marginBottom:'0.75rem'}}>Status</div>
          <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>
            {Object.entries(STATUS_COLORS).map(([key,val])=>(
              <button key={key} onClick={()=>updateStatus(selected.id,key)} style={{padding:'0.35rem 0.85rem',borderRadius:20,border:'none',cursor:'pointer',fontFamily:ff,fontSize:'0.6rem',letterSpacing:'0.08em',textTransform:'uppercase',background:selected.status===key?val.bg:subtleBg,color:selected.status===key?val.color:grayC,fontWeight:selected.status===key?700:400}}>{val.label}</button>
            ))}
          </div>
        </div>
        <div style={{...glassCard,borderRadius:14,padding:'1.25rem'}}>
          <div style={{fontSize:'0.62rem',letterSpacing:'0.1em',textTransform:'uppercase',color:grayC,marginBottom:'0.5rem'}}>Notes</div>
          <textarea value={notesDraft} onChange={e=>setNotesDraft(e.target.value)} placeholder="Add notes about this booking..." rows={3} style={{width:'100%',border:`1px solid ${inputBorder}`,borderRadius:6,padding:'0.6rem',fontFamily:ff,fontSize:'0.78rem',outline:'none',resize:'vertical',boxSizing:'border-box',background:inputBg,color:inkC}}/>
          <button onClick={()=>saveNotes(selected.id)} disabled={saving} style={{marginTop:'0.5rem',background:black,color:white,border:'none',padding:'0.5rem 1.1rem',borderRadius:3,cursor:'pointer',fontFamily:ff,fontSize:'0.6rem',letterSpacing:'0.1em',textTransform:'uppercase',opacity:saving?0.6:1}}>{saving?'Saving…':'Save Notes'}</button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.25rem',flexWrap:'wrap',gap:'0.75rem'}}>
        <h2 style={{fontFamily:ffS,fontSize:'1.5rem',fontWeight:300,color:inkC}}>Bookings</h2>
        <div style={{display:'flex',gap:'0.5rem',alignItems:'center',flexWrap:'wrap'}}>
          <button onClick={navPrev} style={{background:'none',border:`1px solid ${inputBorder}`,borderRadius:20,padding:'0.3rem 0.75rem',cursor:'pointer',fontFamily:ff,fontSize:'0.72rem',color:grayC}}>‹</button>
          <span style={{fontSize:'0.72rem',color:inkC,fontWeight:500,minWidth:140,textAlign:'center'}}>{navLabel}</span>
          <button onClick={navNext} style={{background:'none',border:`1px solid ${inputBorder}`,borderRadius:20,padding:'0.3rem 0.75rem',cursor:'pointer',fontFamily:ff,fontSize:'0.72rem',color:grayC}}>›</button>
          <div style={{display:'flex',gap:'0.3rem'}}>
            {[['month','Month'],['week','Week'],['agenda','Agenda']].map(([v,l])=>(
              <button key={v} onClick={()=>setView(v)} style={{padding:'0.35rem 0.75rem',borderRadius:20,border:'none',cursor:'pointer',fontFamily:ff,fontSize:'0.6rem',letterSpacing:'0.08em',textTransform:'uppercase',background:view===v?black:subtleBg,color:view===v?white:grayC,transition:'all 0.15s'}}>{l}</button>
            ))}
          </div>
          <button onClick={fetchBookings} style={{background:'none',border:`1px solid ${inputBorder}`,borderRadius:20,padding:'0.3rem 0.65rem',cursor:'pointer',fontFamily:ff,fontSize:'0.6rem',color:grayC}}>↺</button>
        </div>
      </div>

      <div style={{...glassCard,borderRadius:14,overflow:'hidden'}}>
        {loading&&<div style={{padding:'3rem',textAlign:'center',color:grayC,fontSize:'0.78rem'}}>Loading...</div>}
        {error&&<div style={{padding:'3rem',textAlign:'center',color:'#c0392b',fontSize:'0.78rem'}}>{error}<br/><button onClick={fetchBookings} style={{marginTop:'0.75rem',background:black,color:white,border:'none',padding:'0.5rem 1rem',borderRadius:3,cursor:'pointer',fontFamily:ff,fontSize:'0.62rem'}}>Retry</button></div>}

        {/* MONTH */}
        {!loading&&!error&&view==='month'&&(
          <div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',borderBottom:`1px solid ${divider}`}}>
              {weekDayNames.map(d=><div key={d} style={{padding:'0.5rem',textAlign:'center',fontSize:'0.52rem',letterSpacing:'0.1em',textTransform:'uppercase',color:grayC}}>{d}</div>)}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)'}}>
              {getMonthDays().map((date,i)=>{
                const dayBs=getBookingsForDay(date)
                const today=date&&date.toDateString()===new Date().toDateString()
                return(
                  <div key={i} style={{minHeight:80,padding:'0.4rem',borderRight:`1px solid ${divider}`,borderBottom:`1px solid ${divider}`,background:today?'rgba(184,151,90,0.04)':'transparent'}}>
                    {date&&<div style={{fontSize:'0.65rem',fontWeight:today?700:400,color:today?gold:inkC,width:22,height:22,borderRadius:'50%',background:today?'rgba(184,151,90,0.15)':'transparent',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'0.25rem'}}>{date.getDate()}</div>}
                    {dayBs.slice(0,2).map((b,j)=><div key={j} onClick={()=>{setSelected(b);setNotesDraft(b.notes||'')}} title={b.name} style={{fontSize:'0.52rem',background:'rgba(184,151,90,0.12)',color:gold,borderRadius:3,padding:'0.15rem 0.35rem',marginBottom:'0.15rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',cursor:'pointer'}}>{b.name}</div>)}
                    {dayBs.length>2&&<div style={{fontSize:'0.5rem',color:grayC}}>+{dayBs.length-2}</div>}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* WEEK */}
        {!loading&&!error&&view==='week'&&(()=>{
          const ws=new Date(currentDate); ws.setDate(ws.getDate()-ws.getDay())
          const wDates=Array.from({length:7},(_,i)=>{ const d=new Date(ws); d.setDate(d.getDate()+i); return d })
          return(
            <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)'}}>
              {wDates.map((d,i)=>{
                const today=d.toDateString()===new Date().toDateString()
                const dayBs=getBookingsForDay(d)
                return(
                  <div key={i} style={{padding:'0.75rem 0.5rem',borderRight:`1px solid ${divider}`,background:today?'rgba(184,151,90,0.04)':'transparent',minHeight:150}}>
                    <div style={{fontSize:'0.52rem',color:grayC,textTransform:'uppercase',letterSpacing:'0.08em'}}>{weekDayNames[i]}</div>
                    <div style={{fontSize:'0.88rem',fontWeight:today?700:400,color:today?gold:inkC,marginBottom:'0.4rem'}}>{d.getDate()}</div>
                    {dayBs.map((b,j)=><div key={j} onClick={()=>{setSelected(b);setNotesDraft(b.notes||'')}} style={{fontSize:'0.54rem',background:'rgba(184,151,90,0.1)',color:gold,borderRadius:3,padding:'0.2rem 0.4rem',marginBottom:'0.2rem',lineHeight:1.3,cursor:'pointer'}}><div style={{fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.name}</div><div style={{opacity:0.7}}>{b.time}</div></div>)}
                  </div>
                )
              })}
            </div>
          )
        })()}

        {/* AGENDA */}
        {!loading&&!error&&view==='agenda'&&(
          <div>
            {bookings.length===0&&<div style={{padding:'2rem',textAlign:'center',color:grayC,fontSize:'0.78rem'}}>No upcoming bookings.</div>}
            {bookings.map((b,i)=>{
              const st=STATUS_COLORS[b.status]||STATUS_COLORS.pending
              const isToday=b.date===new Date().toISOString().slice(0,10)
              return(
                <div key={b.id||i} onClick={()=>{setSelected(b);setNotesDraft(b.notes||'')}} style={{display:'flex',alignItems:'center',gap:'1rem',padding:'0.85rem 1.25rem',borderBottom:`1px solid ${divider}`,cursor:'pointer',background:isToday?'rgba(184,151,90,0.03)':'transparent'}}>
                  <div style={{textAlign:'center',minWidth:42}}>
                    <div style={{fontSize:'0.6rem',color:grayC,textTransform:'uppercase',letterSpacing:'0.08em'}}>{new Date(b.date+'T00:00:00').toLocaleDateString('en-US',{month:'short'})}</div>
                    <div style={{fontFamily:ffS,fontSize:'1.4rem',fontWeight:300,color:isToday?gold:inkC,lineHeight:1}}>{new Date(b.date+'T00:00:00').getDate()}</div>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'0.1rem'}}>
                      <span style={{fontSize:'0.82rem',fontWeight:500,color:inkC,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.name}</span>
                      <span style={{fontSize:'0.56rem',padding:'0.15rem 0.55rem',borderRadius:20,background:st.bg,color:st.color,whiteSpace:'nowrap',flexShrink:0}}>{st.label}</span>
                    </div>
                    <div style={{fontSize:'0.65rem',color:grayC,display:'flex',alignItems:'center',gap:'0.4rem',flexWrap:'wrap'}}>
                      <span>{b.business} · {b.time}</span>
                      {b.agent_id&&agentMap[b.agent_id]&&<span style={{background:'rgba(184,151,90,0.15)',color:'#8a6e3a',borderRadius:8,padding:'0.05rem 0.4rem',fontSize:'0.58rem',fontWeight:600,whiteSpace:'nowrap'}}>Ag. {agentMap[b.agent_id]}</span>}
                    </div>
                    {b.notes&&<div style={{fontSize:'0.62rem',color:grayC,marginTop:'0.15rem',fontStyle:'italic',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.notes}</div>}
                  </div>
                  <div style={{color:grayC,fontSize:'0.75rem',flexShrink:0}}>›</div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}


function AdminSystemPanel({ users, cards, allUsers, loadAll, showToast }) {
  const {dm,inkC,grayC,inputBg,inputBorder,subtleBg,divider,cardBg,cardBorder,surfaceBg}=useTheme()
  const [tab, setTab] = useState('agents')
  const [search, setSearch] = useState('')
  const [roleChanging, setRoleChanging] = useState(null)
  const [log, setLog] = useState([])
  const [logLoading, setLogLoading] = useState(false)
  const [sessions, setSessions] = useState([])
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [agents, setAgents] = useState([])
  const [agentForm, setAgentForm] = useState({firstName:'',lastName:'',email:'',password:''})
  const [creatingAgent, setCreatingAgent] = useState(false)
  const [showAgentForm, setShowAgentForm] = useState(false)
  const [editingAgent, setEditingAgent] = useState(null) // {id, full_name, email, newPassword:''}
  const [savingAgent, setSavingAgent] = useState(false)
  const BASE_URL = typeof window!=='undefined'?window.location.origin:''

  useEffect(()=>{ if(tab==='agents') loadAgents() },[tab])

  async function loadAgents(){
    const r = await fetch('/api/admin/users?all=1').then(r=>r.json()).catch(()=>({}))
    setAgents((r.users||[]).filter(u=>u.role==='agent'))
  }

  async function createAgent(e){
    e.preventDefault(); setCreatingAgent(true)
    try {
      // Create user via signup then set role to agent
      const fullName=`${agentForm.firstName.trim()} ${agentForm.lastName.trim()}`.trim()
      const r = await fetch('/api/auth/signup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        full_name: fullName,
        business_name: agentForm.lastName.trim()||fullName,
        email: agentForm.email,
        password: agentForm.password,
        role: 'agent'
      })})
      const d = await r.json()
      if(!r.ok) { showToast('Error: '+(d.error||'No se pudo crear')); setCreatingAgent(false); return }
      // Also set role in profiles via users API
      if(d.id) {
        await fetch('/api/admin/users',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:d.id,role:'agent'})})
      }
      showToast('Agente creado')
      setAgentForm({firstName:'',lastName:'',email:'',password:''})
      setShowAgentForm(false)
      loadAgents()
    } catch(err){ showToast('Error al crear agente') }
    setCreatingAgent(false)
  }

  async function removeAgent(u){
    if(!confirm(`¿Cambiar rol de ${u.full_name||u.email} a cliente?`)) return
    await fetch('/api/admin/users',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:u.id,role:'client'})})
    showToast('Rol removido'); loadAgents()
  }

  async function saveAgent(e){
    e.preventDefault(); setSavingAgent(true)
    const body={id:editingAgent.id}
    const nameParts=editingAgent.full_name.trim().split(' ')
    body.full_name=editingAgent.full_name.trim()
    body.business_name=nameParts[nameParts.length-1]||body.full_name
    if(editingAgent.email) body.email=editingAgent.email
    if(editingAgent.newPassword&&editingAgent.newPassword.length>=6) body.password=editingAgent.newPassword
    await fetch('/api/admin/users',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
    showToast('Agente actualizado'); setSavingAgent(false); setEditingAgent(null); loadAgents()
  }

  async function toggleBan(u){
    const banning=!u.banned
    if(banning&&!confirm(`¿Bloquear acceso de ${u.full_name||u.email}?`)) return
    await fetch('/api/admin/users',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:u.id,ban:banning})})
    showToast(banning?'Acceso bloqueado':'Acceso restaurado'); loadAgents()
  }

  useEffect(() => {
    if (tab === 'log') loadLog()
    if (tab === 'sessions') loadSessions()
  }, [tab])

  async function loadLog() {
    setLogLoading(true)
    try {
      const res = await fetch('/api/admin/activity-log')
      const data = await res.json()
      setLog(data.log || [])
    } catch(e) { console.error(e) }
    setLogLoading(false)
  }

  async function loadSessions() {
    setSessionsLoading(true)
    try {
      const res = await fetch('/api/admin/users?all=1')
      const data = await res.json()
      setSessions(data.users || [])
    } catch(e) { console.error(e) }
    setSessionsLoading(false)
  }

  async function changeRole(u) {
    const newRole = u.role === 'admin' ? 'client' : 'admin'
    setRoleChanging(u.id)
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: u.id, role: newRole })
    })
    await fetch('/api/admin/activity-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: newRole==='admin'?'Promoted to Admin':'Revoked Admin', target: u.business_name||u.full_name, type: 'role' })
    })
    showToast(`Role updated → ${newRole}`)
    setRoleChanging(null)
    loadAll()
  }

  const typeColor = { punch:'#2d8a60', create:gold, edit:'#5b8dee', file:'#8e44ad', reward:gold, delete:'#c0392b', role:'#e67e22' }
  const typeIcon  = { punch:'●', create:'+', edit:'✎', file:'↑', reward:'★', delete:'×', role:'⚑' }

  const displayUsers = (allUsers||users).filter(u =>
    (u.full_name||'').toLowerCase().includes(search.toLowerCase()) ||
    (u.business_name||'').toLowerCase().includes(search.toLowerCase()) ||
    (u.email||'').toLowerCase().includes(search.toLowerCase())
  )

  const filteredLog = log.filter(l =>
    (l.user_name||'').toLowerCase().includes(search.toLowerCase()) ||
    (l.action||'').toLowerCase().includes(search.toLowerCase()) ||
    (l.target||'').toLowerCase().includes(search.toLowerCase())
  )

  const filteredSessions = sessions.filter(u =>
    (u.full_name||'').toLowerCase().includes(search.toLowerCase()) ||
    (u.email||'').toLowerCase().includes(search.toLowerCase())
  )

  function getCard(uid) { return cards.find(c=>c.user_id===uid) }

  function timeAgo(ts) {
    if (!ts) return '—'
    const diff = (Date.now() - new Date(ts)) / 1000
    if (diff < 60) return 'Just now'
    if (diff < 3600) return Math.floor(diff/60) + ' min ago'
    if (diff < 86400) return Math.floor(diff/3600) + ' hr ago'
    if (diff < 172800) return 'Yesterday'
    return Math.floor(diff/86400) + ' days ago'
  }

  const tabStyle = (t) => ({
    padding:'0.5rem 1rem', borderRadius:20, border:'none', cursor:'pointer', fontFamily:ff,
    fontSize:'0.62rem', letterSpacing:'0.08em', textTransform:'uppercase',
    background: tab===t ? inkC : (dm?'rgba(255,255,255,0.07)':'rgba(14,14,12,0.06)'),
    color: tab===t ? (dm?'#0e0e0c':white) : grayC,
    transition:'all 0.15s'
  })

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
        <h2 style={{fontFamily:ffS,fontSize:'1.5rem',fontWeight:300,color:inkC}}>System Admin</h2>
        <div style={{fontSize:'0.62rem',color:grayC}}>{(allUsers||users).length} users total</div>
      </div>

      <input type="text" placeholder="Search users, actions, targets..." value={search} onChange={e=>setSearch(e.target.value)}
        style={{width:'100%',padding:'0.7rem 1rem',border:`1px solid ${inputBorder}`,borderRadius:3,fontFamily:ff,fontSize:'0.82rem',outline:'none',marginBottom:'1.25rem',boxSizing:'border-box',background:inputBg,color:inkC}}/>

      <div style={{display:'flex',gap:'0.5rem',marginBottom:'1.5rem',flexWrap:'wrap'}}>
        <button style={tabStyle('agents')} onClick={()=>setTab('agents')}>Agentes</button>
        <button style={tabStyle('users')} onClick={()=>setTab('users')}>Users & Roles</button>
        <button style={tabStyle('log')} onClick={()=>setTab('log')}>Activity Log</button>
        <button style={tabStyle('sessions')} onClick={()=>setTab('sessions')}>Sessions</button>
      </div>

      {/* AGENTS TAB */}
      {tab==='agents'&&(
        <div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
            <p style={{fontSize:12,color:gray}}>{agents.length} agente(s) activo(s)</p>
            <button onClick={()=>setShowAgentForm(o=>!o)} style={{background:ink,color:'#fff',border:'none',borderRadius:99,padding:'7px 16px',fontSize:12,fontWeight:600,fontFamily:ff,cursor:'pointer'}}>+ Nuevo agente</button>
          </div>
          {showAgentForm&&(
            <form onSubmit={createAgent} style={{background:'rgba(184,151,90,0.06)',border:'1px solid rgba(184,151,90,0.2)',borderRadius:14,padding:16,marginBottom:16,display:'flex',flexDirection:'column',gap:10}}>
              <p style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',color:gold,marginBottom:2}}>Crear agente</p>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                {[{k:'firstName',l:'Nombre'},{k:'lastName',l:'Apellido'}].map(f=>(
                  <div key={f.k}>
                    <label style={{fontSize:10,fontWeight:600,color:grayC,textTransform:'uppercase',letterSpacing:'0.08em',display:'block',marginBottom:3}}>{f.l}</label>
                    <input required type="text" value={agentForm[f.k]} onChange={e=>setAgentForm(p=>({...p,[f.k]:e.target.value}))} style={{width:'100%',height:40,borderRadius:8,border:`1px solid ${inputBorder}`,padding:'0 12px',fontSize:14,fontFamily:ff,outline:'none',boxSizing:'border-box',background:inputBg,color:inkC}}/>
                  </div>
                ))}
              </div>
              {[{k:'email',l:'Email',t:'email'},{k:'password',l:'Contraseña temporal',t:'text'}].map(f=>(
                <div key={f.k}>
                  <label style={{fontSize:10,fontWeight:600,color:grayC,textTransform:'uppercase',letterSpacing:'0.08em',display:'block',marginBottom:3}}>{f.l}</label>
                  <input required type={f.t} value={agentForm[f.k]} onChange={e=>setAgentForm(p=>({...p,[f.k]:e.target.value}))} style={{width:'100%',height:40,borderRadius:8,border:`1px solid ${inputBorder}`,padding:'0 12px',fontSize:14,fontFamily:ff,outline:'none',boxSizing:'border-box',background:inputBg,color:inkC}}/>
                </div>
              ))}
              <div style={{display:'flex',gap:8,marginTop:4}}>
                <button type="submit" disabled={creatingAgent} style={{flex:1,background:gold,color:'#fff',border:'none',borderRadius:8,padding:'10px',fontSize:13,fontWeight:600,fontFamily:ff,cursor:'pointer'}}>{creatingAgent?'Creando...':'Crear'}</button>
                <button type="button" onClick={()=>setShowAgentForm(false)} style={{padding:'10px 16px',background:'none',border:`1px solid ${inputBorder}`,borderRadius:8,fontSize:13,fontFamily:ff,cursor:'pointer',color:grayC}}>Cancelar</button>
              </div>
            </form>
          )}
          {agents.length===0&&!showAgentForm&&<p style={{color:grayC,fontSize:13,textAlign:'center',padding:'24px 0'}}>No hay agentes aún</p>}
          {agents.map(u=>(
            <div key={u.id} style={{background:cardBg,backdropFilter:'blur(12px)',border:`1.5px solid ${u.banned?'rgba(192,57,43,0.3)':cardBorder}`,borderRadius:14,padding:14,marginBottom:10}}>
              {/* Header */}
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8}}>
                <div style={{minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <p style={{fontSize:14,fontWeight:600,color:u.banned?'#c0392b':inkC}}>{u.business_name||u.full_name}</p>
                    {u.banned&&<span style={{fontSize:10,background:'rgba(192,57,43,0.1)',color:'#c0392b',borderRadius:6,padding:'1px 6px',fontWeight:700}}>BLOQUEADO</span>}
                  </div>
                  <p style={{fontSize:12,color:grayC,marginTop:2}}>{u.email}</p>
                  {u.last_sign_in_at&&<p style={{fontSize:10,color:grayC,marginTop:1}}>Último acceso: {new Date(u.last_sign_in_at).toLocaleDateString('es',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</p>}
                </div>
                <button onClick={()=>setEditingAgent(editingAgent?.id===u.id?null:{id:u.id,full_name:u.full_name||'',email:u.email||'',newPassword:''})} style={{fontSize:11,color:gold,background:'rgba(184,151,90,0.1)',border:'none',borderRadius:8,padding:'5px 10px',cursor:'pointer',fontFamily:ff,fontWeight:600,flexShrink:0}}>
                  {editingAgent?.id===u.id?'Cerrar':'Editar'}
                </button>
              </div>

              {/* Edit form */}
              {editingAgent?.id===u.id&&(
                <form onSubmit={saveAgent} style={{marginTop:12,display:'flex',flexDirection:'column',gap:8}}>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                    <div>
                      <p style={{fontSize:10,color:gray,marginBottom:3}}>Nombre completo</p>
                      <input value={editingAgent.full_name} onChange={e=>setEditingAgent(p=>({...p,full_name:e.target.value}))} style={{width:'100%',boxSizing:'border-box',border:`1px solid ${inputBorder}`,borderRadius:8,padding:'7px 10px',fontSize:13,fontFamily:ff,background:inputBg,color:inkC}}/>
                    </div>
                    <div>
                      <p style={{fontSize:10,color:gray,marginBottom:3}}>Email</p>
                      <input value={editingAgent.email} onChange={e=>setEditingAgent(p=>({...p,email:e.target.value}))} style={{width:'100%',boxSizing:'border-box',border:`1px solid ${inputBorder}`,borderRadius:8,padding:'7px 10px',fontSize:13,fontFamily:ff,background:inputBg,color:inkC}}/>
                    </div>
                  </div>
                  <div>
                    <p style={{fontSize:10,color:gray,marginBottom:3}}>Nueva contraseña <span style={{fontStyle:'italic'}}>(dejar vacío para no cambiar)</span></p>
                    <input type="password" placeholder="mínimo 6 caracteres" value={editingAgent.newPassword} onChange={e=>setEditingAgent(p=>({...p,newPassword:e.target.value}))} style={{width:'100%',boxSizing:'border-box',border:`1px solid ${inputBorder}`,borderRadius:8,padding:'7px 10px',fontSize:13,fontFamily:ff,background:inputBg,color:inkC}}/>
                  </div>
                  <div style={{display:'flex',gap:6}}>
                    <button type="submit" disabled={savingAgent} style={{flex:1,background:gold,color:'#fff',border:'none',borderRadius:8,padding:'8px',fontSize:12,fontWeight:600,fontFamily:ff,cursor:'pointer'}}>{savingAgent?'Guardando...':'Guardar cambios'}</button>
                    <button type="button" onClick={()=>toggleBan(u)} style={{padding:'8px 12px',background:u.banned?'rgba(39,174,96,0.1)':'rgba(192,57,43,0.08)',color:u.banned?'#27ae60':'#c0392b',border:'none',borderRadius:8,fontSize:12,fontWeight:600,fontFamily:ff,cursor:'pointer'}}>
                      {u.banned?'Restaurar acceso':'Bloquear acceso'}
                    </button>
                  </div>
                </form>
              )}

              {/* Links */}
              <div style={{marginTop:12,background:subtleBg,borderRadius:8,padding:'8px 10px',display:'flex',flexDirection:'column',gap:8}}>
                <div>
                  <p style={{fontSize:10,color:grayC,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4}}>Link de consultas (clientes)</p>
                  <div style={{display:'flex',gap:6,alignItems:'center'}}>
                    <p style={{fontSize:11,color:inkC,flex:1,wordBreak:'break-all',fontFamily:'monospace'}}>{BASE_URL}/?agent={u.id}</p>
                    <button onClick={()=>{navigator.clipboard.writeText(`${BASE_URL}/?agent=${u.id}`);showToast('Link copiado')}} style={{flexShrink:0,background:gold,color:'#fff',border:'none',borderRadius:6,padding:'5px 10px',fontSize:11,fontWeight:600,fontFamily:ff,cursor:'pointer'}}>Copiar</button>
                  </div>
                </div>
                <div>
                  <p style={{fontSize:10,color:grayC,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4}}>Link de acceso (agente)</p>
                  <button onClick={async()=>{
                    const r=await fetch('/api/admin/magic-link',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:u.email})})
                    const d=await r.json()
                    if(d.link){navigator.clipboard.writeText(d.link);showToast('Link de acceso copiado — válido por 1 hora')}
                    else showToast('Error generando link')
                  }} style={{width:'100%',background:'rgba(184,151,90,0.12)',color:'#8a6e3a',border:'1px solid rgba(184,151,90,0.3)',borderRadius:6,padding:'6px 10px',fontSize:11,fontWeight:600,fontFamily:ff,cursor:'pointer'}}>
                    Generar y copiar link de acceso
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* USERS & ROLES */}
      {tab==='users'&&(
        <div style={{...cardBg&&{},background:cardBg,backdropFilter:'blur(20px) saturate(160%)',borderRadius:14,border:`1px solid ${cardBorder}`,overflow:'hidden'}}>
          <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr',padding:'0.6rem 1.25rem',borderBottom:`1px solid ${divider}`,fontSize:'0.52rem',letterSpacing:'0.1em',textTransform:'uppercase',color:grayC}}>
            <span>User</span><span>Role</span><span>Card</span><span>Actions</span>
          </div>
          {displayUsers.map(u=>{
            const card = getCard(u.id)
            const isAdmin = u.role === 'admin'
            return (
              <div key={u.id} style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr',padding:'0.85rem 1.25rem',borderBottom:`1px solid ${divider}`,alignItems:'center',gap:'0.5rem'}}>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:'0.75rem',color:inkC,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.business_name||u.full_name}</div>
                  <div style={{fontSize:'0.6rem',color:grayC,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.email||'—'}</div>
                </div>
                <span style={{fontSize:'0.58rem',padding:'0.18rem 0.55rem',borderRadius:20,
                  background:isAdmin?'rgba(184,151,90,0.12)':'rgba(52,152,219,0.08)',
                  color:isAdmin?gold:'#2980b9',width:'fit-content',whiteSpace:'nowrap'}}>
                  {isAdmin?'Admin':'Client'}
                </span>
                <span style={{fontSize:'0.62rem',color:card?'#2d8a60':grayC}}>
                  {card?'#'+card.card_number:'No card'}
                </span>
                <div style={{display:'flex',gap:'0.35rem',flexWrap:'wrap'}}>
                  <button onClick={()=>changeRole(u)} disabled={roleChanging===u.id}
                    style={{padding:'0.3rem 0.6rem',background:isAdmin?'rgba(192,57,43,0.08)':'rgba(184,151,90,0.1)',
                      color:isAdmin?'#c0392b':gold,border:isAdmin?'none':'1px solid rgba(184,151,90,0.25)',
                      borderRadius:3,cursor:'pointer',fontFamily:ff,fontSize:'0.54rem',letterSpacing:'0.06em',textTransform:'uppercase',opacity:roleChanging===u.id?0.5:1}}>
                    {roleChanging===u.id?'Saving…':isAdmin?'Revoke Admin':'Make Admin'}
                  </button>
                  {!isAdmin&&<button onClick={async()=>{
                    if(!confirm(`¿Convertir a ${u.full_name||u.email} en agente?`)) return
                    await fetch('/api/admin/users',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:u.id,role:'agent'})})
                    showToast('Rol actualizado a agente');loadAll()
                  }} style={{padding:'0.3rem 0.6rem',background:'rgba(45,138,96,0.08)',color:'#2d8a60',border:'1px solid rgba(45,138,96,0.2)',borderRadius:3,cursor:'pointer',fontFamily:ff,fontSize:'0.54rem',letterSpacing:'0.06em',textTransform:'uppercase'}}>
                    Make Agent
                  </button>}
                  {!isAdmin&&<button onClick={async()=>{
                    if(!confirm(`¿Eliminar a ${u.full_name||u.email}? Esta acción no se puede deshacer.`)) return
                    await fetch('/api/admin/users',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:u.id})})
                    showToast('Usuario eliminado');loadAll()
                  }} style={{padding:'0.3rem 0.6rem',background:'rgba(192,57,43,0.08)',color:'#c0392b',border:'1px solid rgba(192,57,43,0.2)',borderRadius:3,cursor:'pointer',fontFamily:ff,fontSize:'0.54rem',letterSpacing:'0.06em',textTransform:'uppercase'}}>
                    Borrar
                  </button>}
                </div>
              </div>
            )
          })}
          {displayUsers.length===0&&<div style={{padding:'2rem',textAlign:'center',color:grayC,fontSize:'0.82rem'}}>No users found.</div>}
        </div>
      )}

      {/* ACTIVITY LOG */}
      {tab==='log'&&(
        <div style={{background:cardBg,backdropFilter:'blur(20px) saturate(160%)',borderRadius:14,border:`1px solid ${cardBorder}`,overflow:'hidden'}}>
          <div style={{padding:'0.75rem 1.25rem',borderBottom:`1px solid ${divider}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:'0.6rem',color:grayC,letterSpacing:'0.1em',textTransform:'uppercase'}}>Recent activity</span>
            <button onClick={loadLog} style={{background:'none',border:'none',cursor:'pointer',fontSize:'0.6rem',color:grayC,fontFamily:ff,letterSpacing:'0.08em',textTransform:'uppercase'}}>↺ Refresh</button>
          </div>
          {logLoading&&<div style={{padding:'2rem',textAlign:'center',color:grayC,fontSize:'0.78rem'}}>Loading...</div>}
          {!logLoading&&filteredLog.length===0&&<div style={{padding:'2rem',textAlign:'center',color:grayC,fontSize:'0.82rem'}}>No activity yet.</div>}
          {!logLoading&&filteredLog.map((l,i)=>(
            <div key={l.id} style={{display:'flex',alignItems:'center',gap:'0.85rem',padding:'0.85rem 1.25rem',borderBottom:`1px solid ${divider}`}}>
              <div style={{width:28,height:28,borderRadius:'50%',background:(typeColor[l.type]||gray)+'18',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.7rem',color:typeColor[l.type]||gray,flexShrink:0,fontWeight:700}}>
                {typeIcon[l.type]||'·'}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:'0.72rem',color:inkC,fontWeight:500}}>{l.action}</div>
                <div style={{fontSize:'0.62rem',color:grayC,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginTop:'0.1rem'}}>{l.target||'—'}</div>
              </div>
              <div style={{textAlign:'right',flexShrink:0}}>
                <div style={{fontSize:'0.6rem',color:grayC}}>{l.created_at?new Date(l.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})+' · '+new Date(l.created_at).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}):'—'}</div>
                <div style={{fontSize:'0.56rem',color:grayC,marginTop:'0.1rem'}}>{l.user_name||'Admin'}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SESSIONS */}
      {tab==='sessions'&&(
        <div style={{background:cardBg,backdropFilter:'blur(20px) saturate(160%)',borderRadius:14,border:`1px solid ${cardBorder}`,overflow:'hidden'}}>
          <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr',padding:'0.6rem 1.25rem',borderBottom:`1px solid ${divider}`,fontSize:'0.52rem',letterSpacing:'0.1em',textTransform:'uppercase',color:grayC}}>
            <span>User</span><span>Role</span><span>Last Sign In</span>
          </div>
          {sessionsLoading&&<div style={{padding:'2rem',textAlign:'center',color:grayC,fontSize:'0.78rem'}}>Loading...</div>}
          {!sessionsLoading&&filteredSessions.map((u,i)=>(
            <div key={u.id} style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr',padding:'0.85rem 1.25rem',borderBottom:`1px solid ${divider}`,alignItems:'center',gap:'0.5rem'}}>
              <div style={{minWidth:0}}>
                <div style={{fontSize:'0.75rem',color:inkC,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.business_name||u.full_name||'—'}</div>
                <div style={{fontSize:'0.6rem',color:grayC,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.email||'—'}</div>
              </div>
              <span style={{fontSize:'0.58rem',padding:'0.18rem 0.55rem',borderRadius:20,
                background:u.role==='admin'?'rgba(184,151,90,0.12)':'rgba(52,152,219,0.08)',
                color:u.role==='admin'?gold:'#2980b9',width:'fit-content'}}>
                {u.role==='admin'?'Admin':'Client'}
              </span>
              <span style={{fontSize:'0.62rem',color:grayC}}>{u.last_sign_in_at?new Date(u.last_sign_in_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})+' · '+new Date(u.last_sign_in_at).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}):'Never'}</span>
            </div>
          ))}
          {!sessionsLoading&&filteredSessions.length===0&&<div style={{padding:'2rem',textAlign:'center',color:grayC,fontSize:'0.82rem'}}>No sessions found.</div>}
        </div>
      )}
    </div>
  )
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const MONTHLY_GOAL = 3000
const BOOKING_LINK = 'https://accountingpluscrm.com/#booking'

function waLink(phone, message) {
  const clean = (phone||'').replace(/[^\d+]/g,'')
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`
}
function confirmCitaMsg({name,date,time,service,facebook_page,bookingLink}){
  const link=bookingLink||BOOKING_LINK
  return `Hola ${name}! 🎉 Tu consulta está confirmada.\n📅 Fecha: ${date}\n🕐 Hora: ${time}\n💼 Servicio: ${service||'Consulta'}\n📘 Facebook: ${facebook_page||'N/A'}\n🔗 El link de Google Meet te lo envío el mismo día de la consulta.\n¡Nos vemos pronto!`
}
function bookingLinkMsg(name,link){
  return `Hola ${name}! Te comparto el link para agendar tu consulta: ${link||BOOKING_LINK}`
}
function getCurrentWeekRange(){
  const now=new Date(); const day=now.getDay()
  const mon=new Date(now); mon.setDate(now.getDate()-(day===0?6:day-1)); mon.setHours(0,0,0,0)
  const sun=new Date(mon); sun.setDate(mon.getDate()+6)
  return {start:mon, end:sun}
}
function getWeekDays(weekStart){
  const names=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo']
  return names.map((name,i)=>{
    const d=new Date(weekStart); d.setDate(weekStart.getDate()+i)
    return {name, date:d.toISOString().split('T')[0], dateObj:d}
  })
}
function getMonthWeekNum(d){
  const first=new Date(d.getFullYear(),d.getMonth(),1)
  return Math.ceil((d.getDate()+first.getDay())/7)
}
function getMonthWeekStart(weekNum,now){
  const year=now.getFullYear(),month=now.getMonth()
  for(let d=1;d<=31;d++){
    const date=new Date(year,month,d)
    if(date.getMonth()!==month) break
    if(getMonthWeekNum(date)===weekNum){
      const dow=date.getDay()
      const mon=new Date(date); mon.setDate(date.getDate()-(dow===0?6:dow-1)); mon.setHours(0,0,0,0)
      return mon
    }
  }
  return null
}
function scheduleLocalNotif(title,body,dateObj){
  const delay=dateObj.getTime()-Date.now()
  if(delay<=0) return
  setTimeout(()=>{ if(Notification.permission==='granted') new Notification(title,{body}) },delay)
}

// ─── ADMIN DASHBOARD ─────────────────────────────────────────────────────────
function AdminDashboard({sales,bookings,session,users,onSaleAdded,onNavigate,darkMode}){
  const [addIncome,setAddIncome]=useState(null)
  const [incomeForm,setIncomeForm]=useState({client_id:'',service:'',amount:'',notes:''})
  const [incomeSaving,setIncomeSaving]=useState(false)
  const [activeSem,setActiveSem]=useState(null)
  const [coldLeads,setColdLeads]=useState([])
  const [openSheet,setOpenSheet]=useState(null)
  useEffect(()=>{
    fetch('/api/admin/cold-calls').then(r=>r.json()).then(d=>setColdLeads(d.leads||[])).catch(()=>{})
  },[])
  const [showPrevMonths,setShowPrevMonths]=useState(false)
  const CITA_MONTH_GOAL=40
  const CITA_WEEK_GOAL=5
  const now=new Date()
  const monthStr=now.toISOString().slice(0,7)
  const monthSales=sales.filter(s=>s.sale_date?.startsWith(monthStr)&&s.status==='paid')
  const {start:ws,end:we}=getCurrentWeekRange()
  const weekDays=getWeekDays(ws)
  const weekNum=getMonthWeekNum(now)
  const today=now.toISOString().split('T')[0]
  const wsStr=ws.toISOString().split('T')[0]
  const weStr=we.toISOString().split('T')[0]
  const allBookings=bookings||[]
  const monthCitas=allBookings.filter(b=>b.date?.startsWith(monthStr)&&!b.archived).length
  const weekCitas=allBookings.filter(b=>b.date>=wsStr&&b.date<=weStr&&!b.archived).length
  const todayB=allBookings.filter(b=>b.date===today&&!b.archived)
  const pendingB=allBookings.filter(b=>!b.archived&&b.status==='pending')
  const adminName=session?.user?.email?.split('@')[0]||'Admin'
  const hour=now.getHours()
  const greeting=hour<12?'Buenos días':hour<18?'Buenas tardes':'Buenas noches'
  const pct=Math.min((monthCitas/CITA_MONTH_GOAL)*100,100)
  const tod=today
  const followUps=coldLeads.filter(l=>l.call_status==='follow_up'&&l.followup_date&&l.followup_date>=tod).sort((a,b)=>a.followup_date.localeCompare(b.followup_date))
  const pendientesLeads=coldLeads.filter(l=>l.call_status==='enviar_cita')
  const canceladas=allBookings.filter(b=>['cancelled','no_show'].includes(b.status)&&b.date?.startsWith(monthStr))
  // Previous months
  const prevMonths=(()=>{
    const map={}
    allBookings.forEach(b=>{
      if(!b.date||b.archived) return
      const m=b.date.slice(0,7)
      if(m===monthStr) return
      map[m]=(map[m]||0)+1
    })
    return Object.entries(map).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,12)
  })()
  const glCard={background:'rgba(255,255,255,0.7)',backdropFilter:'blur(20px) saturate(180%)',WebkitBackdropFilter:'blur(20px) saturate(180%)',border:'1px solid rgba(255,255,255,0.55)',boxShadow:'0 4px 24px rgba(0,0,0,0.07),inset 0 1px 0 rgba(255,255,255,0.85)',borderRadius:18}
  async function saveIncome(e){
    e.preventDefault(); setIncomeSaving(true)
    const client=(users||[]).find(u=>u.id===incomeForm.client_id)
    await fetch('/api/admin/sales',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
      customer_id:incomeForm.client_id||null,
      customer_name:client?.business_name||client?.full_name||'Manual',
      customer_email:client?.email||'',
      product_name:incomeForm.service,
      amount:parseFloat(incomeForm.amount),
      sale_date:addIncome?.date||today,
      status:'paid',
      notes:incomeForm.notes,
    })})
    setIncomeSaving(false)
    setAddIncome(null)
    setIncomeForm({client_id:'',service:'',amount:'',notes:''})
    onSaleAdded?.()
  }
  const dm=darkMode
  return(
    <div style={{padding:'12px 16px 32px',fontFamily:ff,minHeight:'100vh',background:dm?'#0e0e0c':undefined,transition:'background 0.3s'}}>
      <p style={{fontSize:13,color:dm?'rgba(255,255,255,0.4)':gray}}>{greeting},</p>
      <h1 style={{fontFamily:ffS,fontSize:28,fontWeight:300,color:dm?'rgba(255,255,255,0.9)':ink,marginTop:2,marginBottom:20}}>{adminName}</h1>
      {/* Monthly goal card */}
      <div style={{background:ink,borderRadius:20,padding:'22px 20px',marginBottom:14,color:cream}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <p style={{fontSize:11,opacity:0.55,textTransform:'uppercase',letterSpacing:'0.1em'}}>Meta de {now.toLocaleString('es-PR',{month:'long'})}</p>
              <button onClick={()=>setShowPrevMonths(true)} style={{background:'none',border:'none',fontSize:10,color:gold,cursor:'pointer',padding:0,fontFamily:ff,letterSpacing:'0.04em',opacity:0.85,touchAction:'manipulation'}}>ver anteriores</button>
            </div>
            <p style={{fontSize:34,fontWeight:700,fontFamily:ff,marginTop:4,letterSpacing:'-0.02em'}}>{monthCitas} <span style={{fontSize:18,fontWeight:400,opacity:0.6}}>consultas</span></p>
            <p style={{fontSize:12,opacity:0.45,marginTop:2}}>de {CITA_MONTH_GOAL} meta</p>
          </div>
          <div style={{textAlign:'right'}}>
            <p style={{fontSize:11,opacity:0.55,textTransform:'uppercase',letterSpacing:'0.1em'}}>Sem {weekNum}</p>
            <p style={{fontSize:22,fontWeight:700,fontFamily:ff,marginTop:4,color:gold}}>{weekCitas}</p>
            <p style={{fontSize:11,opacity:0.45}}>esta semana</p>
          </div>
        </div>
        <div style={{marginTop:18,background:'rgba(255,255,255,0.1)',borderRadius:99,height:6,overflow:'hidden'}}>
          <div style={{height:'100%',borderRadius:99,background:gold,width:pct+'%',transition:'width 0.5s'}}/>
        </div>
        <p style={{fontSize:11,opacity:0.4,marginTop:7}}>{Math.round(pct)}% completado · {Math.max(0,CITA_MONTH_GOAL-monthCitas)} consultas restantes</p>
      </div>
      {/* Prev months sheet */}
      {showPrevMonths&&(
        <>
          <div style={{position:'fixed',inset:0,zIndex:300,background:'rgba(0,0,0,0.3)'}} onClick={()=>setShowPrevMonths(false)}/>
          <div style={{position:'fixed',bottom:0,left:0,right:0,zIndex:305,background:'rgba(255,255,255,0.95)',backdropFilter:'blur(24px)',borderRadius:'20px 20px 0 0',padding:'20px 20px 40px',maxHeight:'70vh',overflowY:'auto'}}>
            <div style={{width:36,height:4,background:'rgba(14,14,12,0.15)',borderRadius:99,margin:'0 auto 18px'}}/>
            <p style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',color:gray,marginBottom:14}}>Meses anteriores</p>
            {prevMonths.length===0&&<p style={{color:gray,fontSize:13,textAlign:'center',padding:'20px 0'}}>Sin datos anteriores</p>}
            {prevMonths.map(([m,count])=>{
              const label=new Date(m+'-15').toLocaleString('es-PR',{month:'long',year:'numeric'})
              const p2=Math.min((count/CITA_MONTH_GOAL)*100,100)
              return(
                <div key={m} style={{marginBottom:14}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                    <span style={{fontSize:13,fontWeight:600,color:ink,textTransform:'capitalize'}}>{label}</span>
                    <span style={{fontSize:13,fontWeight:700,color:count>=CITA_MONTH_GOAL?'#2d8a60':ink}}>{count} / {CITA_MONTH_GOAL}</span>
                  </div>
                  <div style={{background:'rgba(14,14,12,0.08)',borderRadius:99,height:5,overflow:'hidden'}}>
                    <div style={{height:'100%',borderRadius:99,background:count>=CITA_MONTH_GOAL?'#2d8a60':gold,width:p2+'%'}}/>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
      {/* Esta semana — 4-week grid + expandable days */}
      <div style={{...glCard,padding:16,marginBottom:14}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <p style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',color:gold}}>Esta Semana</p>
          <p style={{fontSize:12,fontWeight:600,color:ink,fontFamily:ff}}>{weekCitas} consultas <span style={{color:gray,fontWeight:400,fontSize:11}}>/ {CITA_WEEK_GOAL}</span></p>
        </div>
        <div style={{background:'rgba(14,14,12,0.07)',borderRadius:99,height:4,marginBottom:14,overflow:'hidden'}}>
          <div style={{height:'100%',borderRadius:99,background:gold,width:Math.min((weekCitas/CITA_WEEK_GOAL)*100,100)+'%',transition:'width 0.5s'}}/>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:activeSem?12:0}}>
          {[1,2,3,4].map(w=>{
            const wStart=getMonthWeekStart(w,now)
            const wAtendidas=wStart?allBookings.filter(b=>{
              if(!b.date||b.archived) return false
              const d=new Date(b.date+'T12:00:00')
              return b.date.startsWith(monthStr)&&getMonthWeekNum(d)===w&&['confirmed','bought'].includes(b.status)
            }):[]
            const wClosed=wAtendidas.filter(b=>b.status==='bought')
            const isActive=w===weekNum
            const isSel=activeSem===w
            return(
              <button key={w} onClick={()=>setActiveSem(isSel?null:w)} style={{background:isSel?gold:isActive?ink:dm?'rgba(255,255,255,0.05)':'rgba(14,14,12,0.04)',border:'1px solid',borderColor:isSel?gold:isActive?ink:dm?'rgba(255,255,255,0.08)':'rgba(14,14,12,0.08)',borderRadius:12,padding:'10px 8px',textAlign:'center',cursor:'pointer',touchAction:'manipulation',transition:'all 0.15s'}}>
                <p style={{fontSize:9,textTransform:'uppercase',letterSpacing:'0.07em',color:isSel?ink:isActive?gold:dm?'rgba(255,255,255,0.4)':gray,marginBottom:4}}>Sem {w}</p>
                <p style={{fontSize:14,fontWeight:700,fontFamily:ff,color:isSel?ink:isActive?cream:dm?'rgba(255,255,255,0.85)':ink,lineHeight:1}}>{wClosed.length}<span style={{fontSize:10,fontWeight:400,opacity:0.6}}>/{wAtendidas.length}</span></p>
              </button>
            )
          })}
        </div>
        {activeSem&&(()=>{
          const semStart=getMonthWeekStart(activeSem,now)
          if(!semStart) return null
          const semDays=getWeekDays(semStart)
          return(
            <div style={{borderTop:'1px solid rgba(14,14,12,0.07)',paddingTop:12}}>
              {semDays.map(day=>{
                const dayCitas=allBookings.filter(b=>b.date===day.date&&!b.archived).length
                const isToday=day.date===today
                const isWeekend=day.name==='Sábado'||day.name==='Domingo'
                return(
                  <div key={day.date} style={{width:'100%',display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 12px',marginBottom:6,background:isToday?'rgba(184,151,90,0.1)':isWeekend?'rgba(14,14,12,0.02)':'rgba(14,14,12,0.03)',border:'1px solid',borderColor:isToday?'rgba(184,151,90,0.3)':'rgba(14,14,12,0.06)',borderRadius:12,fontFamily:ff}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={{fontSize:13,fontWeight:isToday?700:500,color:isToday?gold:isWeekend?gray:ink}}>{day.name}</span>
                      {isToday&&<span style={{fontSize:9,background:gold,color:ink,borderRadius:99,padding:'1px 6px',fontWeight:700}}>HOY</span>}
                      <span style={{fontSize:10,color:gray}}>{day.dateObj.toLocaleDateString('es-PR',{day:'numeric',month:'short'})}</span>
                    </div>
                    <span style={{fontSize:13,fontWeight:600,color:dayCitas>0?'#2d8a60':gray}}>{dayCitas>0?`${dayCitas} consulta${dayCitas>1?'s':''}` :'—'}</span>
                  </div>
                )
              })}
            </div>
          )
        })()}
      </div>
      {/* 5-stat cards */}
      {(()=>{
        const dm=darkMode
        const stats=[
          {key:'semana',label:'Esta Semana',val:weekCitas,accent:'#2d8a60',items:allBookings.filter(b=>b.date>=wsStr&&b.date<=weStr&&!b.archived),type:'booking'},
          {key:'hoy',label:'Hoy',val:todayB.length,accent:gold,items:todayB,type:'booking'},
          {key:'pendientes',label:'Pendientes',val:pendientesLeads.length,accent:'#e67e22',items:pendientesLeads,type:'cold'},
          {key:'canceladas',label:'Canceladas',val:canceladas.length,accent:'#c0392b',items:canceladas,type:'booking'},
          {key:'followups',label:'Follow Ups',val:followUps.length,accent:'#8e44ad',items:followUps,type:'cold'},
        ]
        return(
          <>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
              {stats.map((s,i)=>i===stats.length-1&&stats.length%2!==0?(
                <button key={s.key} onClick={()=>setOpenSheet(s.key)} style={{gridColumn:'1/-1',padding:'16px 20px',borderRadius:16,border:'none',cursor:'pointer',touchAction:'manipulation',background:dm?'rgba(255,255,255,0.05)':'rgba(255,255,255,0.75)',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',boxShadow:dm?'none':'0 2px 16px rgba(0,0,0,0.06)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div style={{textAlign:'left'}}>
                    <p style={{fontSize:10,color:dm?'rgba(255,255,255,0.4)':gray,textTransform:'uppercase',letterSpacing:'0.1em',fontFamily:ff,marginBottom:4}}>{s.label}</p>
                    <p style={{fontSize:32,fontWeight:700,fontFamily:ff,color:s.accent,lineHeight:1}}>{s.val}</p>
                  </div>
                  <div style={{width:44,height:44,borderRadius:12,background:s.accent+'18',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={s.accent} strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                </button>
              ):(
                <button key={s.key} onClick={()=>setOpenSheet(s.key)} style={{padding:'16px',borderRadius:16,border:'none',cursor:'pointer',touchAction:'manipulation',background:dm?'rgba(255,255,255,0.05)':'rgba(255,255,255,0.75)',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',boxShadow:dm?'none':'0 2px 16px rgba(0,0,0,0.06)',textAlign:'left',position:'relative',overflow:'hidden'}}>
                  <div style={{position:'absolute',top:-10,right:-10,width:60,height:60,borderRadius:'50%',background:s.accent+'15'}}/>
                  <p style={{fontSize:9,color:dm?'rgba(255,255,255,0.4)':gray,textTransform:'uppercase',letterSpacing:'0.1em',fontFamily:ff,marginBottom:6}}>{s.label}</p>
                  <p style={{fontSize:34,fontWeight:700,fontFamily:ff,color:s.accent,lineHeight:1}}>{s.val}</p>
                </button>
              ))}
            </div>
          </>
        )
      })()}
      {/* Stat card sheet — rendered separately to avoid nested IIFE JSX issue */}
      {openSheet&&(()=>{
        const dm=darkMode
        const stats=[
          {key:'semana',label:'Esta Semana',val:weekCitas,accent:'#2d8a60',items:allBookings.filter(b=>b.date>=wsStr&&b.date<=weStr&&!b.archived),type:'booking'},
          {key:'hoy',label:'Hoy',val:todayB.length,accent:gold,items:todayB,type:'booking'},
          {key:'pendientes',label:'Pendientes',val:pendientesLeads.length,accent:'#e67e22',items:pendientesLeads,type:'cold'},
          {key:'canceladas',label:'Canceladas',val:canceladas.length,accent:'#c0392b',items:canceladas,type:'booking'},
          {key:'followups',label:'Follow Ups',val:followUps.length,accent:'#8e44ad',items:followUps,type:'cold'},
        ]
        const s=stats.find(x=>x.key===openSheet)
        if(!s) return null
        const sheetBg=dm?'rgba(18,18,16,0.97)':'rgba(255,255,255,0.97)'
        const sheetText=dm?'rgba(255,255,255,0.9)':ink
        const sheetSub=dm?'rgba(255,255,255,0.4)':gray
        const sheetDiv=dm?'rgba(255,255,255,0.06)':'rgba(14,14,12,0.06)'
        return(
          <>
            <div style={{position:'fixed',inset:0,zIndex:300,background:'rgba(0,0,0,0.4)'}} onClick={()=>setOpenSheet(null)}/>
            <div style={{position:'fixed',bottom:0,left:0,right:0,zIndex:305,background:sheetBg,backdropFilter:'blur(32px)',WebkitBackdropFilter:'blur(32px)',borderRadius:'22px 22px 0 0',maxHeight:'78vh',display:'flex',flexDirection:'column',boxShadow:'0 -8px 40px rgba(0,0,0,0.2)'}}>
              <div style={{padding:'12px 20px 14px',borderBottom:`1px solid ${sheetDiv}`,flexShrink:0}}>
                <div style={{width:36,height:4,background:dm?'rgba(255,255,255,0.15)':'rgba(14,14,12,0.15)',borderRadius:99,margin:'0 auto 14px'}}/>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div>
                    <p style={{fontSize:11,color:sheetSub,textTransform:'uppercase',letterSpacing:'0.1em',fontFamily:ff}}>{s.label}</p>
                    <p style={{fontSize:24,fontWeight:700,color:s.accent,fontFamily:ff,lineHeight:1.2}}>{s.val}</p>
                  </div>
                  <button onClick={()=>setOpenSheet(null)} style={{width:32,height:32,borderRadius:'50%',background:dm?'rgba(255,255,255,0.08)':'rgba(14,14,12,0.06)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:sheetSub,fontSize:16}}>✕</button>
                </div>
              </div>
              <div style={{overflowY:'auto',padding:'0 20px 20px'}}>
                {s.items.length===0&&<p style={{color:sheetSub,fontSize:13,textAlign:'center',padding:'32px 0'}}>Sin datos</p>}
                {s.items.map(item=>s.type==='booking'?(
                  <button key={item.id} onClick={()=>{setOpenSheet(null);onNavigate('bookings')}} style={{width:'100%',display:'flex',justifyContent:'space-between',alignItems:'center',padding:'13px 0',background:'none',border:'none',borderBottom:`1px solid ${sheetDiv}`,cursor:'pointer',textAlign:'left',fontFamily:ff}}>
                    <div>
                      <p style={{fontSize:14,fontWeight:600,color:sheetText}}>{item.name}</p>
                      <p style={{fontSize:11,color:sheetSub,marginTop:2}}>{item.business} · {item.date} {item.time}</p>
                      {item.service&&<p style={{fontSize:11,color:sheetSub}}>{item.service}</p>}
                    </div>
                    <span style={{fontSize:9,fontWeight:700,padding:'3px 9px',borderRadius:99,background:item.status==='confirmed'?'rgba(45,138,96,0.15)':item.status==='bought'?'rgba(184,151,90,0.15)':'rgba(14,14,12,0.07)',color:item.status==='confirmed'?'#2d8a60':item.status==='bought'?gold:sheetSub,whiteSpace:'nowrap',marginLeft:10,textTransform:'uppercase',letterSpacing:'0.06em'}}>{item.status==='no_show'?'No Show':item.status==='cancelled'?'Cancelada':item.status==='confirmed'?'Confirmada':item.status==='bought'?'Compró':'Pendiente'}</span>
                  </button>
                ):(
                  <button key={item.id} onClick={()=>{setOpenSheet(null);onNavigate('coldcalling')}} style={{width:'100%',display:'flex',justifyContent:'space-between',alignItems:'center',padding:'13px 0',background:'none',border:'none',borderBottom:`1px solid ${sheetDiv}`,cursor:'pointer',textAlign:'left',fontFamily:ff}}>
                    <div>
                      <p style={{fontSize:14,fontWeight:600,color:sheetText}}>{item.business_name}</p>
                      {item.pueblo&&<p style={{fontSize:11,color:sheetSub,marginTop:2}}>{item.pueblo}</p>}
                      {item.notes&&<p style={{fontSize:11,color:sheetSub,fontStyle:'italic',marginTop:1}}>{item.notes}</p>}
                    </div>
                    <div style={{textAlign:'right',flexShrink:0,marginLeft:10}}>
                      {s.key==='followups'&&item.followup_date&&<span style={{fontSize:10,fontWeight:700,color:item.followup_date===tod?'#c0392b':gold,background:item.followup_date===tod?'rgba(192,57,43,0.12)':'rgba(184,151,90,0.12)',padding:'3px 8px',borderRadius:99,whiteSpace:'nowrap',display:'block'}}>{item.followup_date===tod?'HOY':new Date(item.followup_date+'T12:00:00').toLocaleDateString('es-PR',{day:'numeric',month:'short'})}</span>}
                      {item.phone&&<a href={`tel:${item.phone}`} onClick={e=>e.stopPropagation()} style={{fontSize:11,color:'#2d8a60',textDecoration:'none',display:'block',marginTop:4}}>Llamar</a>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )
      })()}
      {/* Add income bottom sheet */}
      {addIncome&&(
        <>
          <div style={{position:'fixed',inset:0,zIndex:300,background:'rgba(0,0,0,0.3)'}} onClick={()=>setAddIncome(null)}/>
          <div style={{position:'fixed',bottom:0,left:0,right:0,zIndex:305,background:'rgba(255,255,255,0.88)',backdropFilter:'blur(32px) saturate(200%)',WebkitBackdropFilter:'blur(32px) saturate(200%)',borderRadius:'24px 24px 0 0',border:'1px solid rgba(255,255,255,0.65)',boxShadow:'0 -8px 40px rgba(0,0,0,0.12)',paddingBottom:'calc(env(safe-area-inset-bottom,0px)+12px)',animation:'sheet-up 0.25s cubic-bezier(0.22,1,0.36,1) both'}}>
            <div style={{width:40,height:4,background:'rgba(14,14,12,0.15)',borderRadius:99,margin:'12px auto 0'}}/>
            <div style={{padding:'16px 20px 20px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                <h3 style={{fontFamily:ffS,fontSize:20,fontWeight:300,color:ink}}>Añadir Ingreso</h3>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:12,color:gold,fontWeight:600}}>{new Date(addIncome.date+'T12:00:00').toLocaleDateString('es-PR',{weekday:'short',month:'short',day:'numeric'})}</span>
                  <button onClick={()=>setAddIncome(null)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:gray,lineHeight:1}}>✕</button>
                </div>
              </div>
              <form onSubmit={saveIncome} style={{display:'flex',flexDirection:'column',gap:12}}>
                <div>
                  <label style={{fontSize:11,fontWeight:600,color:gray,textTransform:'uppercase',letterSpacing:'0.08em',display:'block',marginBottom:4}}>Cliente</label>
                  <select value={incomeForm.client_id} onChange={e=>setIncomeForm(p=>({...p,client_id:e.target.value}))} style={{width:'100%',height:44,borderRadius:10,border:'1px solid rgba(14,14,12,0.12)',padding:'0 12px',fontSize:14,fontFamily:ff,background:'#fff',outline:'none',boxSizing:'border-box'}}>
                    <option value="">Sin cliente / Manual</option>
                    {(users||[]).map(u=><option key={u.id} value={u.id}>{u.business_name||u.full_name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{fontSize:11,fontWeight:600,color:gray,textTransform:'uppercase',letterSpacing:'0.08em',display:'block',marginBottom:4}}>Servicio / Concepto *</label>
                  <input required value={incomeForm.service} onChange={e=>setIncomeForm(p=>({...p,service:e.target.value}))} placeholder="ej. Taxes 2024, Contabilidad..." style={{width:'100%',height:44,borderRadius:10,border:'1px solid rgba(14,14,12,0.12)',padding:'0 12px',fontSize:14,fontFamily:ff,background:'#fff',outline:'none',boxSizing:'border-box'}}/>
                </div>
                <div>
                  <label style={{fontSize:11,fontWeight:600,color:gray,textTransform:'uppercase',letterSpacing:'0.08em',display:'block',marginBottom:4}}>Cantidad ($) *</label>
                  <input required type="number" min="0.01" step="0.01" value={incomeForm.amount} onChange={e=>setIncomeForm(p=>({...p,amount:e.target.value}))} placeholder="0.00" style={{width:'100%',height:44,borderRadius:10,border:'1px solid rgba(14,14,12,0.12)',padding:'0 12px',fontSize:18,fontWeight:600,fontFamily:ff,background:'#fff',outline:'none',boxSizing:'border-box',color:ink}}/>
                </div>
                <div>
                  <label style={{fontSize:11,fontWeight:600,color:gray,textTransform:'uppercase',letterSpacing:'0.08em',display:'block',marginBottom:4}}>Notas</label>
                  <input value={incomeForm.notes} onChange={e=>setIncomeForm(p=>({...p,notes:e.target.value}))} placeholder="Opcional..." style={{width:'100%',height:44,borderRadius:10,border:'1px solid rgba(14,14,12,0.12)',padding:'0 12px',fontSize:14,fontFamily:ff,background:'#fff',outline:'none',boxSizing:'border-box'}}/>
                </div>
                <button type="submit" disabled={incomeSaving} style={{height:50,background:ink,color:cream,border:'none',borderRadius:14,fontSize:15,fontWeight:600,fontFamily:ff,cursor:'pointer',marginTop:4}}>{incomeSaving?'Guardando...':'✓ Registrar Ingreso'}</button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── ADMIN BOOKINGS ───────────────────────────────────────────────────────────
function AdminBookings({userRole,agentId}){
  const {dm,surfaceBg,inkC,grayC,inputBg,inputBorder,subtleBg,divider,glassCard,cardBg,cardBorder}=useTheme()
  const BASE_URL=typeof window!=='undefined'?window.location.origin:''
  const myBookingLink=agentId?`${BASE_URL}/?agent=${agentId}`:BOOKING_LINK
  const [bookings,setBookings]=useState([])
  const [loading,setLoading]=useState(true)
  const [showArchived,setShowArchived]=useState(false)
  const [showNew,setShowNew]=useState(false)
  const [form,setForm]=useState({name:'',phone:'',facebook_page:'',service:'',date:'',time:'',notes:''})
  const [saving,setSaving]=useState(false)
  const [weekView,setWeekView]=useState(false)
  const [calDate,setCalDate]=useState(new Date())
  const [calDay,setCalDay]=useState(null)
  const [cerrarModal,setCerrarModal]=useState(null) // booking | null
  const [cerrarCompro,setCerrarCompro]=useState(null) // null | true | false
  const [cerrarForm,setCerrarForm]=useState({service:'',documentos:'',payType:'completo',total:'',pago_inicial:'',adeudado:'',tiempo_saldo:''})
  const [agentMap,setAgentMap]=useState({}) // id -> last name
  useEffect(()=>{
    fetch('/api/admin/users?all=1').then(r=>r.json()).then(d=>{
      const map={}
      ;(d.users||[]).filter(u=>u.role==='agent').forEach(u=>{
        const parts=(u.full_name||u.email||'').trim().split(' ')
        map[u.id]=parts[parts.length-1]||u.email
      })
      setAgentMap(map)
    }).catch(()=>{})
    load()
    const channel = supabase
      .channel('bookings-live')
      .on('postgres_changes',{event:'*',schema:'public',table:'bookings'},()=>load())
      .subscribe()
    return ()=>{ supabase.removeChannel(channel) }
  },[])
  async function load(){
    setLoading(true)
    const r=await fetch('/api/admin/bookings')
    const d=await r.json()
    setBookings(Array.isArray(d)?d:[])
    setLoading(false)
  }
  async function createBooking(e){
    e.preventDefault(); setSaving(true)
    await fetch('/api/admin/bookings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,source:'direct'})})
    await load(); setShowNew(false); setForm({name:'',phone:'',facebook_page:'',service:'',date:'',time:'',notes:''}); setSaving(false)
  }
  async function updateStatus(id,status,extra={}){
    const archived=['cancelled','bought','later'].includes(status)
    await fetch('/api/admin/bookings',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,status,archived,...extra})})
    await load()
  }
  async function confirmCerrar(e){
    e.preventDefault(); setSaving(true)
    const b=cerrarModal
    const f=cerrarForm
    const total=parseFloat(f.total)||0
    const pago_inicial=parseFloat(f.pago_inicial)||0
    const adeudado=parseFloat(f.adeudado)||0
    await fetch('/api/admin/crm-clients',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
      name:b.name,phone:b.phone,facebook_page:b.facebook_page,
      service_acquired:f.service||b.service,
      amount_paid:f.payType==='completo'?total:pago_inicial,
      payment_type:f.payType==='completo'?'once':'partial',
      total_amount:total,
      notes:f.documentos,booking_id:b.id,
    })})
    await updateStatus(b.id,'bought',{
      buy_service:f.service||b.service,
      buy_amount:f.payType==='completo'?total:pago_inicial,
      buy_type:f.payType,
      buy_notes:[
        f.documentos,
        f.payType==='financiado'?`Adeudado: $${adeudado}`:null,
        f.payType==='financiado'&&f.tiempo_saldo?`Saldo en: ${f.tiempo_saldo}`:null,
      ].filter(Boolean).join(' · '),
    })
    setCerrarModal(null); setCerrarCompro(null); setCerrarForm({service:'',documentos:'',payType:'completo',total:'',pago_inicial:'',adeudado:'',tiempo_saldo:''}); setSaving(false)
  }
  function doConfirm(b){
    const link=b.agent_id?`${BASE_URL}/?agent=${b.agent_id}`:myBookingLink
    window.open(waLink(b.phone,confirmCitaMsg({name:b.name,date:b.date,time:b.time,service:b.service,facebook_page:b.facebook_page,bookingLink:link})),'_blank')
    updateStatus(b.id,'confirmed')
  }
  const active=bookings.filter(b=>!b.archived)
  const archived=bookings.filter(b=>b.archived)
  const SC={pending:{label:'Pendiente',color:'#e67e22',bg:'rgba(230,126,34,0.1)'},confirmed:{label:'Confirmada',color:'#2d8a60',bg:'rgba(45,138,96,0.1)'},cancelled:{label:'Cancelada',color:'#c0392b',bg:'rgba(192,57,43,0.1)'},bought:{label:'Cerrado',color:gold,bg:'rgba(184,151,90,0.12)'},later:{label:'Dijo Luego',color:'#8e44ad',bg:'rgba(142,68,173,0.1)'},no_show:{label:'No Show',color:'#636e72',bg:'rgba(99,110,114,0.1)'}}
  const inp2={width:'100%',boxSizing:'border-box',height:44,borderRadius:10,border:`1px solid ${inputBorder}`,padding:'0 12px',fontSize:14,fontFamily:ff,background:inputBg,color:inkC,outline:'none',marginBottom:0}
  const glCard2={...glassCard,borderRadius:18}
  function BookingCard({b}){
    const st=SC[b.status]||SC.pending
    return(
      <div style={{...glCard2,padding:16,marginBottom:10}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
          <span style={{fontSize:10,fontWeight:700,padding:'3px 10px',borderRadius:99,background:st.bg,color:st.color,textTransform:'uppercase',letterSpacing:'0.08em'}}>{st.label}</span>
          {b.facebook_page&&<span style={{fontSize:11,color:'#1877f2'}}>📘 {b.facebook_page}</span>}
        </div>
        <p style={{fontSize:16,fontWeight:600,color:inkC}}>{b.name}</p>
        {b.business&&b.business!==b.name&&<p style={{fontSize:12,color:grayC,marginTop:1}}>{b.business}</p>}
        {b.phone&&<a href={`tel:${b.phone}`} style={{fontSize:13,color:'#2d8a60',textDecoration:'none',display:'block',marginTop:3,fontWeight:500}}>{b.phone}</a>}
        <p style={{fontSize:13,color:grayC,marginTop:4}}>{b.service||'Consulta'}</p>
        <p style={{fontSize:12,color:grayC,marginTop:2}}>{b.date} · {b.time}</p>
        {b.notes&&<p style={{fontSize:11,color:grayC,marginTop:6,fontStyle:'italic'}}>{b.notes}</p>}
        <div style={{display:'flex',gap:7,marginTop:12,flexWrap:'wrap'}}>
          {b.status!=='confirmed'&&<button onClick={()=>doConfirm(b)} style={{flex:1,minWidth:90,padding:'8px',background:'none',color:'#2d8a60',border:'1.5px solid #2d8a60',borderRadius:10,fontSize:12,fontWeight:600,fontFamily:ff,cursor:'pointer',touchAction:'manipulation'}}>Confirmar</button>}
          <button onClick={()=>{setCerrarModal(b);setCerrarCompro(null);setCerrarForm({service:b.service||'',documentos:'',payType:'completo',total:'',pago_inicial:'',adeudado:'',tiempo_saldo:''})}} style={{flex:1,minWidth:70,padding:'8px',background:ink,color:'#fff',border:'none',borderRadius:10,fontSize:12,fontWeight:700,fontFamily:ff,cursor:'pointer',touchAction:'manipulation'}}>Cerrar</button>
          <button onClick={()=>updateStatus(b.id,'later')} style={{padding:'8px 12px',background:'none',color:'#8e44ad',border:'1.5px solid #8e44ad',borderRadius:10,fontSize:12,fontFamily:ff,cursor:'pointer',touchAction:'manipulation'}}>Dijo Luego</button>
          <button onClick={()=>updateStatus(b.id,'no_show')} style={{padding:'8px 12px',background:'none',color:'#636e72',border:'1.5px solid #636e72',borderRadius:10,fontSize:12,fontFamily:ff,cursor:'pointer',touchAction:'manipulation'}}>No Show</button>
          <button onClick={()=>updateStatus(b.id,'cancelled')} style={{padding:'8px 12px',background:'none',color:'#c0392b',border:'1.5px solid #c0392b',borderRadius:10,fontSize:12,fontFamily:ff,cursor:'pointer',touchAction:'manipulation'}}>Cancelar</button>
        </div>
      </div>
    )
  }
  const now2=new Date()
  const todayISO=now2.toISOString().split('T')[0]
  // ── calendar grid ──
  const calYear=calDate.getFullYear(),calMonth=calDate.getMonth()
  const calFirstDay=new Date(calYear,calMonth,1)
  const calDow=calFirstDay.getDay() // 0=Sun
  const gridOffset=calDow===0?6:calDow-1 // how many days before the 1st (Mon-based)
  const calGridStart=new Date(calFirstDay); calGridStart.setDate(1-gridOffset)
  const totalCells=Math.ceil((gridOffset+new Date(calYear,calMonth+1,0).getDate())/7)*7
  const calCells=[]
  for(let i=0;i<totalCells;i++){const c=new Date(calGridStart);c.setDate(calGridStart.getDate()+i);calCells.push(c)}
  function parseTimeVal(t){
    if(!t) return 0
    const [time,ampm]=t.split(' ')
    let [h,m]=time.split(':').map(Number)
    if(ampm==='PM'&&h!==12) h+=12
    if(ampm==='AM'&&h===12) h=0
    return h*60+m
  }
  const calDayBookings=calDay?[...active.filter(b=>b.date===calDay)].sort((a,b)=>parseTimeVal(a.time)-parseTimeVal(b.time)):[]
  const mesNames=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  return(
    <div style={{padding:'20px 16px 32px',fontFamily:ff}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <h1 style={{fontFamily:ffS,fontSize:26,fontWeight:300,color:inkC}}>Consultas</h1>
        <button onClick={()=>setShowNew(true)} style={{background:inkC,color:dm?'#0e0e0c':cream,border:'none',borderRadius:99,padding:'8px 18px',fontSize:13,fontWeight:600,fontFamily:ff,cursor:'pointer',touchAction:'manipulation'}}>+ Nueva</button>
      </div>
      {/* View toggle */}
      <div style={{display:'flex',gap:6,marginBottom:16,background:dm?'rgba(255,255,255,0.06)':'rgba(14,14,12,0.05)',borderRadius:12,padding:4}}>
        {[{id:false,label:'Lista'},{id:true,label:'Calendario'}].map(v=>(
          <button key={String(v.id)} onClick={()=>setWeekView(v.id)} style={{flex:1,padding:'8px',border:'none',borderRadius:9,background:weekView===v.id?inputBg:'none',fontFamily:ff,fontSize:13,fontWeight:weekView===v.id?600:400,color:weekView===v.id?inkC:grayC,cursor:'pointer',boxShadow:weekView===v.id?'0 1px 4px rgba(0,0,0,0.12)':'none',touchAction:'manipulation'}}>{v.label}</button>
        ))}
      </div>
      {loading&&<p style={{color:gray,textAlign:'center',padding:'40px 0',fontSize:13}}>Cargando...</p>}
      {/* ── LISTA VIEW ── */}
      {!weekView&&(()=>{
        if(loading) return null
        // Group active bookings by ISO week (Mon–Sun)
        function isoWeekKey(dateStr){
          if(!dateStr) return 'sin-fecha'
          const d=new Date(dateStr+'T12:00:00')
          const tmp=new Date(d); tmp.setDate(d.getDate()-((d.getDay()+6)%7)) // Monday
          return tmp.toISOString().split('T')[0]
        }
        function weekLabel(monStr){
          if(monStr==='sin-fecha') return 'Sin fecha'
          const mon=new Date(monStr+'T12:00:00')
          const sun=new Date(mon); sun.setDate(mon.getDate()+6)
          const fmt=d=>d.toLocaleDateString('es-PR',{day:'numeric',month:'short'})
          return `${fmt(mon)} – ${fmt(sun)}`
        }
        // Build ordered weeks map
        const weekMap={}
        ;[...active].sort((a,b)=>new Date(b.date||'9999')-new Date(a.date||'9999')).forEach(b=>{
          const k=isoWeekKey(b.date)
          if(!weekMap[k]) weekMap[k]=[]
          weekMap[k].push(b)
        })
        const weeks=Object.entries(weekMap)
        if(weeks.length===0) return <div style={{textAlign:'center',padding:'40px 0',color:grayC}}><p style={{fontSize:15}}>No hay consultas activas</p><p style={{fontSize:12,marginTop:4}}>Toca "+ Nueva" para crear una</p></div>
        return weeks.map(([wk,bks])=>(
          <div key={wk} style={{marginBottom:20}}>
            <p style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',color:grayC,marginBottom:8,paddingLeft:2}}>{weekLabel(wk)} <span style={{fontWeight:400,opacity:0.6}}>· {bks.length}</span></p>
            {bks.map(b=><BookingCard key={b.id} b={b}/>)}
          </div>
        ))
      })()}
      {/* ── CALENDARIO VIEW ── */}
      {weekView&&(
        <div style={{...glCard2,padding:'16px 12px 12px'}}>
          {/* Month nav */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
            <button onClick={()=>{const d=new Date(calDate);d.setMonth(d.getMonth()-1);setCalDate(d);setCalDay(null)}} style={{background:'none',border:'none',fontSize:20,color:grayC,cursor:'pointer',padding:'0 6px',touchAction:'manipulation'}}>‹</button>
            <span style={{fontSize:15,fontWeight:700,color:inkC}}>{mesNames[calMonth]} {calYear}</span>
            <button onClick={()=>{const d=new Date(calDate);d.setMonth(d.getMonth()+1);setCalDate(d);setCalDay(null)}} style={{background:'none',border:'none',fontSize:20,color:grayC,cursor:'pointer',padding:'0 6px',touchAction:'manipulation'}}>›</button>
          </div>
          {/* Day headers */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',marginBottom:4}}>
            {['L','M','X','J','V','S','D'].map(d=><div key={d} style={{textAlign:'center',fontSize:10,fontWeight:700,color:grayC,padding:'4px 0'}}>{d}</div>)}
          </div>
          {/* Day cells */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2}}>
            {calCells.map(cell=>{
              const iso=`${cell.getFullYear()}-${String(cell.getMonth()+1).padStart(2,'0')}-${String(cell.getDate()).padStart(2,'0')}`
              const inMonth=cell.getMonth()===calMonth
              const isToday=iso===todayISO
              const isSelected=iso===calDay
              const dayBs=active.filter(b=>b.date===iso)
              const isWeekend=cell.getDay()===0||cell.getDay()===6
              return(
                <button key={iso} onClick={()=>setCalDay(isSelected?null:iso)}
                  style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'6px 2px',borderRadius:10,border:'1.5px solid',
                    borderColor:isSelected?gold:isToday?'rgba(184,151,90,0.4)':'transparent',
                    background:isSelected?'rgba(184,151,90,0.12)':isToday?'rgba(184,151,90,0.06)':'transparent',
                    cursor:'pointer',touchAction:'manipulation',minHeight:44}}>
                  <span style={{fontSize:13,fontWeight:isToday?700:400,color:!inMonth?(dm?'rgba(255,255,255,0.15)':'rgba(14,14,12,0.2)'):isToday?gold:isWeekend?grayC:inkC,lineHeight:1}}>{cell.getDate()}</span>
                  {dayBs.length>0&&inMonth&&(
                    <div style={{display:'flex',gap:2,marginTop:3,flexWrap:'wrap',justifyContent:'center'}}>
                      {dayBs.slice(0,3).map((_,i)=><span key={i} style={{width:5,height:5,borderRadius:'50%',background:gold,display:'block'}}/>)}
                      {dayBs.length>3&&<span style={{fontSize:7,color:gold,fontWeight:700}}>+{dayBs.length-3}</span>}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
          {/* Selected day panel */}
          {calDay&&(
            <div style={{marginTop:16,borderTop:`1px solid ${divider}`,paddingTop:14}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                <div>
                  <p style={{fontSize:13,fontWeight:700,color:inkC,margin:0,textTransform:'capitalize'}}>
                    {new Date(calDay+'T12:00:00').toLocaleDateString('es-PR',{weekday:'long',day:'numeric',month:'long'})}
                  </p>
                  {calDayBookings.length>0&&<p style={{fontSize:11,color:gold,margin:'2px 0 0'}}>{calDayBookings.length} consulta{calDayBookings.length!==1?'s':''}</p>}
                </div>
                <button onClick={()=>{setForm(f=>({...f,date:calDay}));setShowNew(true)}}
                  style={{background:inkC,color:dm?'#0e0e0c':cream,border:'none',borderRadius:99,padding:'7px 14px',fontSize:12,fontWeight:600,fontFamily:ff,cursor:'pointer',touchAction:'manipulation',whiteSpace:'nowrap'}}>+ Consulta</button>
              </div>
              {calDayBookings.length===0&&<p style={{textAlign:'center',color:grayC,fontSize:13,padding:'16px 0'}}>Sin consultas este día</p>}
              {calDayBookings.map(b=><BookingCard key={b.id} b={b}/>)}
            </div>
          )}
        </div>
      )}
      {archived.length>0&&<button onClick={()=>setShowArchived(!showArchived)} style={{width:'100%',padding:12,background:'none',border:`1px solid ${inputBorder}`,borderRadius:12,color:grayC,fontSize:13,fontFamily:ff,cursor:'pointer',marginTop:8,touchAction:'manipulation'}}>{showArchived?'▲':'▼'} Ver Archivo ({archived.length})</button>}
      {showArchived&&archived.map(b=>{
        const st=SC[b.status]||SC.pending
        return(
          <div key={b.id} style={{background:subtleBg,border:`1px solid ${divider}`,borderRadius:14,padding:14,marginTop:8,opacity:0.8}}>
            <div style={{display:'flex',justifyContent:'space-between'}}>
              <p style={{fontSize:14,fontWeight:600,color:inkC}}>{b.name}</p>
              <span style={{fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:99,background:st.bg,color:st.color}}>{st.label}</span>
            </div>
            {b.phone&&<a href={`tel:${b.phone}`} style={{fontSize:12,color:'#2d8a60',textDecoration:'none',display:'block',marginTop:2}}>{b.phone}</a>}
            <p style={{fontSize:12,color:grayC,marginTop:4}}>{b.date} · {b.service||'Consulta'}</p>
            {b.buy_service&&<p style={{fontSize:11,color:gold,marginTop:4}}>💰 {b.buy_service} · ${b.buy_amount}</p>}
          </div>
        )
      })}
      {/* New booking sheet */}
      {showNew&&(
        <div style={{position:'fixed',inset:0,zIndex:300,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'flex-end',overflow:'hidden'}} onClick={e=>e.target===e.currentTarget&&setShowNew(false)}>
          <div style={{background:surfaceBg,borderRadius:'20px 20px 0 0',width:'100%',maxHeight:'90dvh',overflowY:'auto',overflowX:'hidden',boxSizing:'border-box',WebkitOverflowScrolling:'touch',padding:'24px 20px calc(env(safe-area-inset-bottom,0px) + 32px)'}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <h2 style={{fontFamily:ffS,fontSize:22,fontWeight:300,color:inkC}}>Nueva Consulta</h2>
              <button onClick={()=>setShowNew(false)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:grayC}}>✕</button>
            </div>
            <form onSubmit={createBooking} style={{display:'flex',flexDirection:'column',gap:12}}>
              {[{k:'name',l:'Nombre del cliente',t:'text',r:true},{k:'phone',l:'Teléfono',t:'tel',r:true},{k:'facebook_page',l:'Página de Facebook',t:'text',r:true},{k:'service',l:'Servicio',t:'text'},{k:'date',l:'Fecha',t:'date',r:true},{k:'time',l:'Hora',t:'time',r:true}].map(f=>(
                <div key={f.k}>
                  <label style={{fontSize:11,fontWeight:600,color:grayC,textTransform:'uppercase',letterSpacing:'0.08em',display:'block',marginBottom:4}}>{f.l}</label>
                  <input
                    required={!!f.r}
                    type={f.t}
                    placeholder={f.t==='tel'?'+1 (787) 555-1234':undefined}
                    value={form[f.k]}
                    onChange={e=>setForm(p=>({...p,[f.k]:f.t==='tel'?formatPhone(e.target.value):e.target.value}))}
                    style={inp2}
                  />
                </div>
              ))}
              <div>
                <label style={{fontSize:11,fontWeight:600,color:gray,textTransform:'uppercase',letterSpacing:'0.08em',display:'block',marginBottom:4}}>Notas</label>
                <textarea value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} rows={3} style={{...inp2,height:'auto',padding:'10px 12px',resize:'none'}}/>
              </div>
              <button type="submit" disabled={saving} style={{height:48,background:inkC,color:dm?'#0e0e0c':cream,border:'none',borderRadius:12,fontSize:15,fontWeight:600,fontFamily:ff,cursor:'pointer',marginTop:4}}>{saving?'Guardando...':'Crear Consulta'}</button>
            </form>
          </div>
        </div>
      )}
      {/* Buy sheet */}
      {cerrarModal&&(
        <div style={{position:'fixed',inset:0,zIndex:300,background:'rgba(0,0,0,0.55)',backdropFilter:'blur(4px)',display:'flex',alignItems:'flex-end'}} onClick={e=>e.target===e.currentTarget&&(setCerrarModal(null),setCerrarCompro(null))}>
          <div style={{background:surfaceBg,borderRadius:'24px 24px 0 0',width:'100%',maxHeight:'92vh',overflowY:'auto',boxSizing:'border-box',padding:'8px 0 40px',boxShadow:'0 -8px 40px rgba(0,0,0,0.2)'}}>
            <div style={{width:36,height:4,background:dm?'rgba(255,255,255,0.15)':'rgba(14,14,12,0.15)',borderRadius:99,margin:'12px auto 20px'}}/>
            {/* Step 1 — ¿Compró? */}
            {cerrarCompro===null&&(
              <div style={{padding:'0 24px'}}>
                <p style={{fontSize:11,textTransform:'uppercase',letterSpacing:'0.1em',color:grayC,fontFamily:ff,marginBottom:4}}>Cerrar consulta</p>
                <h2 style={{fontFamily:ffS,fontSize:22,fontWeight:400,color:inkC,marginBottom:4}}>{cerrarModal.name}</h2>
                <p style={{fontSize:13,color:grayC,marginBottom:28}}>{cerrarModal.service||'Consulta'} · {cerrarModal.date}</p>
                <p style={{fontSize:15,fontWeight:600,color:inkC,fontFamily:ff,marginBottom:16,textAlign:'center'}}>¿El cliente compró?</p>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                  <button onClick={()=>setCerrarCompro(true)} style={{padding:'18px 12px',borderRadius:16,border:'2px solid #2d8a60',background:'rgba(45,138,96,0.06)',color:'#2d8a60',fontSize:15,fontWeight:700,fontFamily:ff,cursor:'pointer',touchAction:'manipulation'}}>
                    Sí ✓
                  </button>
                  <button onClick={()=>{updateStatus(cerrarModal.id,'confirmed');setCerrarModal(null);setCerrarCompro(null)}} style={{padding:'18px 12px',borderRadius:16,border:`2px solid ${inputBorder}`,background:subtleBg,color:grayC,fontSize:15,fontWeight:600,fontFamily:ff,cursor:'pointer',touchAction:'manipulation'}}>
                    No
                  </button>
                </div>
              </div>
            )}
            {/* Step 2 — Formulario de cierre */}
            {cerrarCompro===true&&(
              <form onSubmit={confirmCerrar} style={{padding:'0 24px',display:'flex',flexDirection:'column',gap:14}}>
                <div>
                  <p style={{fontSize:11,textTransform:'uppercase',letterSpacing:'0.1em',color:'#2d8a60',fontFamily:ff,marginBottom:2}}>Cierre exitoso</p>
                  <h2 style={{fontFamily:ffS,fontSize:20,fontWeight:400,color:inkC,marginBottom:0}}>{cerrarModal.name}</h2>
                </div>
                {/* Servicio */}
                <div>
                  <label style={{fontSize:11,fontWeight:600,color:grayC,textTransform:'uppercase',letterSpacing:'0.08em',display:'block',marginBottom:4}}>Servicio</label>
                  <input value={cerrarForm.service} onChange={e=>setCerrarForm(p=>({...p,service:e.target.value}))} placeholder="Servicio adquirido" style={inp2}/>
                </div>
                {/* Documentos */}
                <div>
                  <label style={{fontSize:11,fontWeight:600,color:grayC,textTransform:'uppercase',letterSpacing:'0.08em',display:'block',marginBottom:4}}>Documentos / notas del cierre</label>
                  <textarea value={cerrarForm.documentos} onChange={e=>setCerrarForm(p=>({...p,documentos:e.target.value}))} rows={2} placeholder="Contrato firmado, propuesta enviada…" style={{...inp2,height:'auto',padding:'10px 12px',resize:'none'}}/>
                </div>
                {/* Tipo de pago */}
                <div>
                  <label style={{fontSize:11,fontWeight:600,color:grayC,textTransform:'uppercase',letterSpacing:'0.08em',display:'block',marginBottom:8}}>Total</label>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
                    {[['completo','Pago Completo'],['financiado','Financiado']].map(([v,l])=>(
                      <button type="button" key={v} onClick={()=>setCerrarForm(p=>({...p,payType:v}))} style={{padding:'12px 8px',borderRadius:12,border:'1.5px solid',borderColor:cerrarForm.payType===v?inkC:inputBorder,background:cerrarForm.payType===v?inkC:inputBg,color:cerrarForm.payType===v?(dm?'#0e0e0c':cream):inkC,fontSize:13,fontWeight:cerrarForm.payType===v?700:400,fontFamily:ff,cursor:'pointer',textAlign:'center',touchAction:'manipulation'}}>{l}</button>
                    ))}
                  </div>
                  {/* Pago Completo */}
                  {cerrarForm.payType==='completo'&&(
                    <div>
                      <label style={{fontSize:11,fontWeight:600,color:grayC,textTransform:'uppercase',letterSpacing:'0.08em',display:'block',marginBottom:4}}>Total ($)</label>
                      <input required type="number" min="0" step="0.01" placeholder="0.00" value={cerrarForm.total} onChange={e=>setCerrarForm(p=>({...p,total:e.target.value}))} style={inp2}/>
                    </div>
                  )}
                  {/* Financiado */}
                  {cerrarForm.payType==='financiado'&&(
                    <div style={{display:'flex',flexDirection:'column',gap:10}}>
                      <div>
                        <label style={{fontSize:11,fontWeight:600,color:grayC,textTransform:'uppercase',letterSpacing:'0.08em',display:'block',marginBottom:4}}>Total del servicio ($)</label>
                        <input required type="number" min="0" step="0.01" placeholder="0.00" value={cerrarForm.total} onChange={e=>setCerrarForm(p=>({...p,total:e.target.value}))} style={inp2}/>
                      </div>
                      <div>
                        <label style={{fontSize:11,fontWeight:600,color:grayC,textTransform:'uppercase',letterSpacing:'0.08em',display:'block',marginBottom:4}}>Pago inicial ($)</label>
                        <input required type="number" min="0" step="0.01" placeholder="0.00" value={cerrarForm.pago_inicial} onChange={e=>setCerrarForm(p=>({...p,pago_inicial:e.target.value}))} style={inp2}/>
                      </div>
                      <div>
                        <label style={{fontSize:11,fontWeight:600,color:grayC,textTransform:'uppercase',letterSpacing:'0.08em',display:'block',marginBottom:4}}>Cantidad adeudada ($)</label>
                        <input required type="number" min="0" step="0.01" placeholder="0.00" value={cerrarForm.adeudado} onChange={e=>setCerrarForm(p=>({...p,adeudado:e.target.value}))} style={inp2}/>
                      </div>
                      <div>
                        <label style={{fontSize:11,fontWeight:600,color:grayC,textTransform:'uppercase',letterSpacing:'0.08em',display:'block',marginBottom:4}}>Tiempo estimado de saldo</label>
                        <input placeholder="ej. 3 meses, 60 días…" value={cerrarForm.tiempo_saldo} onChange={e=>setCerrarForm(p=>({...p,tiempo_saldo:e.target.value}))} style={inp2}/>
                      </div>
                    </div>
                  )}
                </div>
                <button type="submit" disabled={saving} style={{height:52,background:'#2d8a60',color:'#fff',border:'none',borderRadius:14,fontSize:15,fontWeight:700,fontFamily:ff,cursor:'pointer',marginTop:4}}>
                  {saving?'Guardando…':'Registrar cierre →'}
                </button>
                <button type="button" onClick={()=>setCerrarCompro(null)} style={{height:40,background:'none',border:'none',fontSize:13,color:grayC,fontFamily:ff,cursor:'pointer'}}>← Atrás</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── ADMIN COLD CALLING ───────────────────────────────────────────────────────
function ConsultasPanel(){
  const {dm,inkC,grayC,cardBg,cardBorder,subtleBg,divider}=useTheme()
  const [leads,setLeads]=useState([])
  const [loading,setLoading]=useState(true)
  useEffect(()=>{
    fetch('/api/admin/cold-calls').then(r=>r.json()).then(d=>{
      setLeads((d.leads||[]).filter(l=>l.call_status==='enviar_cita').sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)))
      setLoading(false)
    }).catch(()=>setLoading(false))
  },[])
  const SC={website:{label:'Website',color:'#1877f2',bg:'rgba(24,119,242,0.1)'},direct:{label:'Consulta Enviada',color:'#2d8a60',bg:'rgba(45,138,96,0.1)'}}
  return(
    <div style={{padding:'20px 16px 32px',fontFamily:ff}}>
      <h1 style={{fontFamily:ffS,fontSize:26,fontWeight:300,color:inkC,marginBottom:6}}>Consultas</h1>
      <p style={{fontSize:12,color:grayC,marginBottom:20}}>Registro de consultas enviadas directamente</p>
      {loading&&<p style={{color:grayC,fontSize:13,textAlign:'center',padding:'40px 0'}}>Cargando...</p>}
      {!loading&&leads.length===0&&<div style={{textAlign:'center',padding:'40px 0',color:grayC}}><p style={{fontSize:15}}>Sin consultas enviadas</p><p style={{fontSize:12,marginTop:4}}>Usa "Enviar consulta" en Cold Calling para registrarlas</p></div>}
      {leads.map(l=>{
        const src=l.source==='website'?SC.website:SC.direct
        const d=new Date(l.created_at)
        return(
          <div key={l.id} style={{background:cardBg,border:`1px solid ${cardBorder}`,borderRadius:14,padding:'14px 16px',marginBottom:10,backdropFilter:'blur(12px)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
              <div>
                <p style={{fontSize:15,fontWeight:600,color:inkC}}>{l.business_name}</p>
                {l.pueblo&&<p style={{fontSize:12,color:grayC,marginTop:1}}>{l.pueblo}</p>}
              </div>
              <span style={{fontSize:9,fontWeight:700,padding:'3px 9px',borderRadius:99,background:src.bg,color:src.color,whiteSpace:'nowrap',flexShrink:0,marginLeft:8}}>{src.label}</span>
            </div>
            {l.phone&&<a href={`tel:${l.phone}`} style={{fontSize:12,color:'#2d8a60',textDecoration:'none',display:'block'}}>{l.phone}</a>}
            {l.notes&&<p style={{fontSize:11,color:grayC,fontStyle:'italic',marginTop:6}}>{l.notes}</p>}
            <p style={{fontSize:10,color:grayC,marginTop:8,opacity:0.6}}>{d.toLocaleDateString('es-PR',{weekday:'short',day:'numeric',month:'short',year:'numeric'})}</p>
          </div>
        )
      })}
    </div>
  )
}

function AdminColdCalling({agentId}){
  const {dm,surfaceBg,inkC,grayC,inputBg,inputBorder,subtleBg,divider,glassCard,cardBg,cardBorder}=useTheme()
  const BASE_URL=typeof window!=='undefined'?window.location.origin:''
  const myBookingLink=agentId?`${BASE_URL}/?agent=${agentId}`:BOOKING_LINK
  const [leads,setLeads]=useState([])
  const [loading,setLoading]=useState(true)
  const [showForm,setShowForm]=useState(null)
  const [expanded,setExpanded]=useState({})
  const [weekOffset,setWeekOffset]=useState(0)
  const [form,setForm]=useState({business_name:'',phone:'',pueblo:'',call_status:'no_answer',followup_date:'',notes:''})
  const [saving,setSaving]=useState(false)
  const [updatingId,setUpdatingId]=useState(null)
  const [contacts,setContacts]=useState([])
  const [contactQ,setContactQ]=useState('')
  const [showContacts,setShowContacts]=useState(false)
  useEffect(()=>{
    load()
    fetch('/api/admin/users').then(r=>r.json()).then(d=>setContacts(d.users||[])).catch(()=>{})
    // Prefill from Lead Map "Llamar" button
    if(typeof window!=='undefined'){
      const raw=sessionStorage.getItem('llamada_prefill')
      if(raw){
        try{
          const p=JSON.parse(raw)
          setForm(f=>({...f,business_name:p.business_name||'',phone:p.phone||'',pueblo:p.town||''}))
          setShowForm('new')
        }catch(_){}
        sessionStorage.removeItem('llamada_prefill')
      }
    }
  },[])
  async function load(){
    setLoading(true)
    const r=await fetch('/api/admin/cold-calls')
    const d=await r.json()
    setLeads(d.leads||[])
    setLoading(false)
  }
  async function updateLead(id,updates){
    setLeads(p=>p.map(l=>l.id===id?{...l,...updates}:l))
    setUpdatingId(null)
    await fetch('/api/admin/cold-calls',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,...updates})})
  }
  async function saveLead(e){
    e.preventDefault(); setSaving(true)
    const responded=form.call_status!=='no_answer'
    await fetch('/api/admin/cold-calls',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,responded})})
    if(form.call_status==='follow_up'&&form.followup_date&&typeof window!=='undefined'&&'Notification' in window){
      Notification.requestPermission().then(p=>{
        if(p==='granted'){
          const d=new Date(form.followup_date+'T09:00:00')
          scheduleLocalNotif('Follow-up pendiente 📞',`Follow-up con ${form.business_name} hoy`,d)
        }
      })
    }
    await load(); setShowForm(null); setForm({business_name:'',phone:'',pueblo:'',call_status:'no_answer',followup_date:'',notes:''}); setContactQ(''); setSaving(false)
  }
  const [statSheet,setStatSheet]=useState(null) // {key,label,color,items}
  const [sortMode,setSortMode]=useState('month') // 'month'|'week'
  const now=new Date()
  const monthStr=now.toISOString().slice(0,7)
  const baseStart=getCurrentWeekRange().start
  const ws=new Date(baseStart); ws.setDate(baseStart.getDate()+weekOffset*7)
  const we=new Date(ws); we.setDate(ws.getDate()+6)
  const wsStr=ws.toISOString().split('T')[0]
  const weStr=we.toISOString().split('T')[0]
  const weekDays=getWeekDays(ws)
  const byDay={}
  leads.forEach(l=>{ const d=l.created_at?.split('T')[0]; if(!byDay[d])byDay[d]=[]; byDay[d].push(l) })
  const weekLeads=weekDays.flatMap(d=>byDay[d.date]||[])
  const isCurrentWeek=weekOffset===0
  const monthLeads=leads.filter(l=>l.created_at?.startsWith(monthStr))
  const getByStatus=(status)=>monthLeads.filter(l=>l.call_status===status)
  const monthStats=[
    {key:'follow_up',label:'Follow Up',color:gold,items:getByStatus('follow_up')},
    {key:'no_answer',label:'Non Responsive',color:'#c0392b',items:getByStatus('no_answer')},
    {key:'caliente',label:'Caliente',color:'#e74c3c',items:getByStatus('caliente')},
    {key:'tibio',label:'Tibio',color:'#f39c12',items:getByStatus('tibio')},
    {key:'frio',label:'Frío',color:'#5d8aa8',items:getByStatus('frio')},
  ]
  const SS={
    no_answer:{label:'No respondió',color:'#c0392b',bg:'rgba(192,57,43,0.08)'},
    responded:{label:'Respondió',color:'#2d8a60',bg:'rgba(45,138,96,0.1)'},
    follow_up:{label:'Follow-up',color:gold,bg:'rgba(184,151,90,0.12)'},
    booked:{label:'Agendó',color:'#5b8dee',bg:'rgba(91,141,238,0.1)'},
    llamar_luego:{label:'Llamar luego',color:'#e67e22',bg:'rgba(230,126,34,0.1)'},
    caliente:{label:'Caliente',color:'#e74c3c',bg:'rgba(231,76,60,0.1)'},
    tibio:{label:'Tibio',color:'#f39c12',bg:'rgba(243,156,18,0.1)'},
    frio:{label:'Frío',color:'#5d8aa8',bg:'rgba(93,138,168,0.1)'},
    enviar_cita:{label:'Enviar consulta',color:'#8e44ad',bg:'rgba(142,68,173,0.1)'},
  }
  const inp2={width:'100%',boxSizing:'border-box',height:44,borderRadius:10,border:`1px solid ${inputBorder}`,padding:'0 12px',fontSize:14,fontFamily:ff,background:inputBg,color:inkC,outline:'none'}
  return(
    <div style={{padding:'20px 16px 32px',fontFamily:ff}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:16}}>
        <h1 style={{fontFamily:ffS,fontSize:26,fontWeight:300,color:inkC}}>Cold Calling</h1>
        <span style={{fontSize:10,color:grayC,textTransform:'uppercase',letterSpacing:'0.08em'}}>{now.toLocaleString('es-PR',{month:'long'})}</span>
      </div>
      {/* Monthly stat cards */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:18}}>
        {monthStats.map(s=>(
          <button key={s.key} onClick={()=>{setStatSheet(s);setSortMode('month')}} style={{background:cardBg,border:`1px solid ${cardBorder}`,borderRadius:12,padding:'12px 10px',textAlign:'left',cursor:'pointer',touchAction:'manipulation',fontFamily:ff,backdropFilter:'blur(12px)'}}>
            <p style={{fontSize:22,fontWeight:700,color:s.color,lineHeight:1}}>{s.items.length}</p>
            <p style={{fontSize:9,color:grayC,textTransform:'uppercase',letterSpacing:'0.06em',marginTop:4}}>{s.label}</p>
          </button>
        ))}
      </div>
      {/* Stat sheet */}
      {statSheet&&(
        <>
          <div style={{position:'fixed',inset:0,zIndex:300,background:'rgba(0,0,0,0.3)'}} onClick={()=>setStatSheet(null)}/>
          <div style={{position:'fixed',bottom:0,left:0,right:0,zIndex:305,background:surfaceBg,backdropFilter:'blur(24px)',borderRadius:'20px 20px 0 0',maxHeight:'78vh',display:'flex',flexDirection:'column'}}>
            <div style={{padding:'12px 20px 12px',borderBottom:'1px solid rgba(14,14,12,0.07)',flexShrink:0}}>
              <div style={{width:36,height:4,background:'rgba(14,14,12,0.15)',borderRadius:99,margin:'0 auto 12px'}}/>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                <p style={{fontSize:14,fontWeight:700,color:inkC}}>{statSheet.label} <span style={{color:statSheet.color}}>({(sortMode==='week'?statSheet.items.filter(l=>{const d=l.created_at?.split('T')[0];return d>=wsStr&&d<=weStr}):statSheet.items).length})</span></p>
                <button onClick={()=>setStatSheet(null)} style={{background:'none',border:'none',fontSize:18,cursor:'pointer',color:grayC}}>✕</button>
              </div>
              <div style={{display:'flex',gap:6}}>
                {['month','week'].map(m=>(
                  <button key={m} onClick={()=>setSortMode(m)} style={{padding:'6px 14px',borderRadius:99,border:'1px solid',borderColor:sortMode===m?inkC:inputBorder,background:sortMode===m?inkC:'transparent',color:sortMode===m?(dm?'#0e0e0c':cream):grayC,fontSize:11,fontWeight:600,fontFamily:ff,cursor:'pointer',touchAction:'manipulation'}}>
                    {m==='month'?'Este mes':'Esta semana'}
                  </button>
                ))}
              </div>
            </div>
            <div style={{overflowY:'auto',padding:'0 20px 20px'}}>
              {(()=>{
                const items=sortMode==='week'?statSheet.items.filter(l=>{const d=l.created_at?.split('T')[0];return d>=wsStr&&d<=weStr}):statSheet.items
                if(!items.length) return <p style={{color:grayC,fontSize:13,textAlign:'center',padding:'28px 0'}}>Sin leads</p>
                return items.map(l=>(
                  <div key={l.id} style={{padding:'12px 0',borderBottom:`1px solid ${divider}`}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                      <div>
                        <p style={{fontSize:14,fontWeight:600,color:inkC}}>{l.business_name}</p>
                        {l.pueblo&&<p style={{fontSize:11,color:grayC,marginTop:1}}>{l.pueblo}</p>}
                        {l.notes&&<p style={{fontSize:11,color:grayC,fontStyle:'italic',marginTop:2}}>{l.notes}</p>}
                      </div>
                      <p style={{fontSize:10,color:grayC,flexShrink:0,marginLeft:8}}>{new Date(l.created_at).toLocaleDateString('es-PR',{day:'numeric',month:'short'})}</p>
                    </div>
                    {l.phone&&<a href={`tel:${l.phone}`} style={{fontSize:12,color:'#2d8a60',textDecoration:'none',display:'block',marginTop:4}}>{l.phone}</a>}
                    {l.followup_date&&<p style={{fontSize:11,color:gold,marginTop:3}}>Follow-up: {l.followup_date}</p>}
                  </div>
                ))
              })()}
            </div>
          </div>
        </>
      )}
      {/* Weekly card */}
      <div style={{background:cardBg,border:`1px solid ${cardBorder}`,borderRadius:18,overflow:'hidden',backdropFilter:'blur(12px)'}}>
        {/* Week navigation */}
        <div style={{padding:'12px 16px',borderBottom:`1px solid ${divider}`,display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
          <button onClick={()=>{setWeekOffset(p=>p-1);setExpanded({})}} style={{background:'none',border:'none',cursor:'pointer',fontSize:22,color:grayC,padding:'0 6px',lineHeight:1,touchAction:'manipulation'}}>‹</button>
          <div style={{textAlign:'center',flex:1}}>
            <p style={{fontSize:13,fontWeight:600,color:inkC}}>{ws.toLocaleDateString('es-PR',{day:'numeric',month:'long'})} — {we.toLocaleDateString('es-PR',{day:'numeric',month:'long'})}</p>
            {isCurrentWeek&&<span style={{fontSize:9,background:gold,color:ink,borderRadius:99,padding:'2px 8px',fontWeight:700}}>SEMANA ACTUAL</span>}
          </div>
          <button onClick={()=>{if(!isCurrentWeek){setWeekOffset(p=>p+1);setExpanded({})}}} style={{background:'none',border:'none',cursor:isCurrentWeek?'default':'pointer',fontSize:22,color:isCurrentWeek?(dm?'rgba(255,255,255,0.15)':'rgba(14,14,12,0.2)'):grayC,padding:'0 6px',lineHeight:1,touchAction:'manipulation'}}>›</button>
        </div>
        {weekDays.map((day,i)=>{
          const dayLeads=byDay[day.date]||[]
          const isExp=expanded[day.date]
          const isToday=day.date===new Date().toISOString().split('T')[0]
          return(
            <div key={day.date} style={{borderBottom:i<6?`1px solid ${divider}`:'none'}}>
              <button onClick={()=>setExpanded(p=>({...p,[day.date]:!p[day.date]}))} style={{width:'100%',padding:'13px 16px',background:'none',border:'none',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center',fontFamily:ff}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:14,fontWeight:600,color:isToday?gold:inkC}}>{day.name}</span>
                  {isToday&&<span style={{fontSize:9,background:gold,color:'#0e0e0c',borderRadius:99,padding:'2px 7px',fontWeight:700}}>HOY</span>}
                  <span style={{fontSize:11,color:grayC}}>{day.dateObj.toLocaleDateString('es-PR',{day:'numeric',month:'short'})}</span>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  {dayLeads.length>0&&<span style={{fontSize:12,background:dm?'rgba(255,255,255,0.1)':'rgba(14,14,12,0.07)',borderRadius:99,padding:'2px 8px',fontWeight:600,color:inkC}}>{dayLeads.length}</span>}
                  <span style={{fontSize:12,color:grayC}}>{isExp?'▲':'▼'}</span>
                </div>
              </button>
              {isExp&&(
                <div style={{padding:'0 16px 16px'}}>
                  {dayLeads.map(l=>{
                    const st=SS[l.call_status]||SS.no_answer
                    const isUpdating=updatingId===l.id
                    return(
                      <div key={l.id} style={{background:inputBg,borderRadius:12,padding:12,marginBottom:8,border:`1px solid ${divider}`}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                          <div>
                            <p style={{fontSize:14,fontWeight:600,color:inkC}}>{l.business_name}</p>
                            {l.pueblo&&<p style={{fontSize:12,color:grayC}}>{l.pueblo}</p>}
                          </div>
                          <div style={{display:'flex',alignItems:'center',gap:6}}>
                            {l.call_status==='llamar_luego'&&(l.llamar_luego_count||0)>0&&<span style={{fontSize:10,fontWeight:700,color:'#e67e22',background:'rgba(230,126,34,0.12)',borderRadius:99,padding:'1px 6px'}}>{l.llamar_luego_count}x</span>}
                            <span style={{fontSize:9,fontWeight:700,padding:'3px 8px',borderRadius:99,background:st.bg,color:st.color,textTransform:'uppercase',whiteSpace:'nowrap'}}>{st.label}</span>
                          </div>
                        </div>
                        {l.phone&&<a href={`tel:${l.phone}`} style={{fontSize:12,color:'#2d8a60',display:'block',marginTop:6,textDecoration:'none'}}>📞 {l.phone}</a>}
                        {l.followup_date&&<p style={{fontSize:11,color:gold,marginTop:4}}>🔔 Follow-up: {l.followup_date}</p>}
                        {l.notes&&<p style={{fontSize:11,color:grayC,marginTop:6,fontStyle:'italic'}}>{l.notes}</p>}
                        {/* Horizontal pill strip */}
                        <div style={{display:'flex',gap:5,marginTop:10,overflowX:'auto',paddingBottom:2,WebkitOverflowScrolling:'touch'}}>
                          {[
                            {status:'no_answer',label:'No Answer',color:'#c0392b',bg:'rgba(192,57,43,0.08)',border:'rgba(192,57,43,0.25)'},
                            {status:'llamar_luego',label:'Llamar luego'+(( l.llamar_luego_count||0)>0?` (${(l.llamar_luego_count||0)+1}x)`:' '),color:'#e67e22',bg:'rgba(230,126,34,0.08)',border:'rgba(230,126,34,0.25)',extra:{llamar_luego_count:(l.llamar_luego_count||0)+1}},
                            {status:'caliente',label:'Caliente',color:'#e74c3c',bg:'rgba(231,76,60,0.08)',border:'rgba(231,76,60,0.25)'},
                            {status:'tibio',label:'Tibio',color:'#f39c12',bg:'rgba(243,156,18,0.08)',border:'rgba(243,156,18,0.25)'},
                            {status:'frio',label:'Frío',color:'#5d8aa8',bg:'rgba(93,138,168,0.08)',border:'rgba(93,138,168,0.25)'},
                            {status:'enviar_cita',label:'Enviar consulta',color:'#fff',bg:'#2d8a60',border:'#2d8a60',bold:true},
                          ].map(p=>(
                            <button key={p.status}
                              onClick={()=>{
                                updateLead(l.id,{call_status:p.status,...(p.extra||{})})
                                if(p.status==='enviar_cita') window.open(waLink(l.phone,bookingLinkMsg(l.business_name,myBookingLink)),'_blank')
                              }}
                              style={{flexShrink:0,padding:'5px 11px',borderRadius:99,border:`1px solid ${p.border}`,background:l.call_status===p.status?p.bg.replace('0.08','0.2'):p.bg,color:p.color,fontSize:11,fontWeight:l.call_status===p.status||p.bold?700:500,fontFamily:ff,cursor:'pointer',touchAction:'manipulation',whiteSpace:'nowrap',outline:l.call_status===p.status?`2px solid ${p.color}`:'none',outlineOffset:1}}>
                              {p.label.trim()}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                  <button onClick={()=>setShowForm(day.date)} style={{width:'100%',padding:10,background:'none',border:'1px dashed rgba(14,14,12,0.18)',borderRadius:10,fontSize:13,fontFamily:ff,cursor:'pointer',color:gray}}>+ Registrar Lead</button>
                </div>
              )}
            </div>
          )
        })}
      </div>
      {/* Register lead sheet */}
      {showForm&&(
        <div style={{position:'fixed',inset:0,zIndex:300,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'flex-end',overflow:'hidden'}} onClick={e=>e.target===e.currentTarget&&setShowForm(null)}>
          <div style={{background:surfaceBg,borderRadius:'20px 20px 0 0',width:'100%',maxHeight:'90dvh',overflowY:'auto',overflowX:'hidden',boxSizing:'border-box',WebkitOverflowScrolling:'touch',padding:'24px 20px calc(env(safe-area-inset-bottom,0px) + 32px)'}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <h2 style={{fontFamily:ffS,fontSize:22,fontWeight:300,color:inkC}}>Registrar Lead</h2>
              <button onClick={()=>setShowForm(null)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:grayC}}>✕</button>
            </div>
            <form onSubmit={saveLead} style={{display:'flex',flexDirection:'column',gap:12}}>
              {/* Contact picker — native phone contacts first, CRM fallback */}
              <div style={{position:'relative'}}>
                <label style={{fontSize:11,fontWeight:600,color:grayC,textTransform:'uppercase',letterSpacing:'0.08em',display:'block',marginBottom:4}}>Buscar en contactos</label>
                <div style={{display:'flex',gap:6}}>
                  <input
                    type="text"
                    placeholder="Nombre o negocio..."
                    value={contactQ}
                    onChange={e=>{setContactQ(e.target.value);setShowContacts(true)}}
                    onFocus={()=>setShowContacts(true)}
                    style={{...inp2,flex:1,borderColor:showContacts&&contactQ?gold:'rgba(14,14,12,0.12)'}}
                  />
                  {typeof navigator!=='undefined'&&'contacts' in navigator&&(
                    <button type="button" onClick={async()=>{
                      try{
                        const results=await navigator.contacts.select(['name','tel'],{multiple:false})
                        if(results&&results.length>0){
                          const c=results[0]
                          const name=(c.name&&c.name[0])||''
                          const phone=(c.tel&&c.tel[0])||''
                          setForm(p=>({...p,business_name:name,phone:formatPhone(phone)}))
                          setContactQ(name)
                          setShowContacts(false)
                        }
                      }catch(e){}
                    }} style={{flexShrink:0,height:44,width:44,borderRadius:10,border:`1px solid ${inputBorder}`,background:subtleBg,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',touchAction:'manipulation'}}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={gray} strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </button>
                  )}
                </div>
                {showContacts&&contactQ.length>0&&(()=>{
                  const matches=contacts.filter(c=>`${c.business_name||''} ${c.full_name||''}`.toLowerCase().includes(contactQ.toLowerCase())).slice(0,6)
                  if(!matches.length) return null
                  return(
                    <div style={{position:'absolute',top:'100%',left:0,right:0,zIndex:50,background:'#fff',borderRadius:10,border:'1px solid rgba(14,14,12,0.1)',boxShadow:'0 8px 24px rgba(0,0,0,0.1)',overflow:'hidden',marginTop:4}}>
                      {matches.map(c=>(
                        <button type="button" key={c.id} onMouseDown={()=>{
                          setForm(p=>({...p,business_name:c.business_name||c.full_name||'',phone:c.phone||''}))
                          setContactQ(c.business_name||c.full_name||'')
                          setShowContacts(false)
                        }} style={{width:'100%',padding:'10px 14px',background:'none',border:'none',borderBottom:'1px solid rgba(14,14,12,0.06)',textAlign:'left',cursor:'pointer',fontFamily:ff}}>
                          <p style={{fontSize:13,fontWeight:600,color:ink}}>{c.business_name||c.full_name}</p>
                          {c.phone&&<p style={{fontSize:11,color:gray,marginTop:1}}>{c.phone}</p>}
                        </button>
                      ))}
                    </div>
                  )
                })()}
              </div>
              {[{k:'business_name',l:'Nombre del negocio',t:'text',r:true},{k:'phone',l:'Teléfono',t:'tel',r:true},{k:'pueblo',l:'Pueblo / Ciudad',t:'text'}].map(f=>(
                <div key={f.k}>
                  <label style={{fontSize:11,fontWeight:600,color:gray,textTransform:'uppercase',letterSpacing:'0.08em',display:'block',marginBottom:4}}>{f.l}</label>
                  <input
                    required={!!f.r}
                    type={f.t}
                    placeholder={f.t==='tel'?'+1 (787) 555-1234':undefined}
                    value={form[f.k]}
                    onChange={e=>setForm(p=>({...p,[f.k]:f.t==='tel'?formatPhone(e.target.value):e.target.value}))}
                    style={inp2}
                  />
                </div>
              ))}
              <div>
                <label style={{fontSize:11,fontWeight:600,color:gray,textTransform:'uppercase',letterSpacing:'0.08em',display:'block',marginBottom:8}}>Resultado de la llamada</label>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
                  {[['no_answer','No contestó'],['responded','Respondió'],['follow_up','Follow-up']].map(([v,l])=>(
                    <button type="button" key={v} onClick={()=>setForm(p=>({...p,call_status:v,followup_date:v!=='follow_up'?'':p.followup_date}))} style={{padding:'10px 6px',borderRadius:10,border:'1px solid',borderColor:form.call_status===v?(v==='follow_up'?gold:ink):'rgba(14,14,12,0.12)',background:form.call_status===v?(v==='follow_up'?'rgba(184,151,90,0.12)':ink):'#fff',color:form.call_status===v?(v==='follow_up'?gold:cream):ink,fontSize:12,fontWeight:600,fontFamily:ff,cursor:'pointer',textAlign:'center',touchAction:'manipulation'}}>{l}</button>
                  ))}
                </div>
              </div>
              {form.call_status==='follow_up'&&(
                <div>
                  <label style={{fontSize:11,fontWeight:700,color:gold,textTransform:'uppercase',letterSpacing:'0.08em',display:'block',marginBottom:6}}>📅 ¿Cuándo hacer el follow-up?</label>
                  <input required type="date" value={form.followup_date} onChange={e=>setForm(p=>({...p,followup_date:e.target.value}))} style={{...inp2,borderColor:gold,borderWidth:2}}/>
                </div>
              )}
              <div>
                <label style={{fontSize:11,fontWeight:600,color:gray,textTransform:'uppercase',letterSpacing:'0.08em',display:'block',marginBottom:4}}>Notas del cliente</label>
                <textarea value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} rows={3} placeholder="Contexto para cuando lo llames de vuelta..." style={{...inp2,height:'auto',padding:'10px 12px',resize:'none'}}/>
              </div>
              <button type="submit" disabled={saving} style={{height:48,background:ink,color:cream,border:'none',borderRadius:12,fontSize:15,fontWeight:600,fontFamily:ff,cursor:'pointer'}}>{saving?'Guardando...':'Registrar Lead'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── CRM CLIENTS PANEL ────────────────────────────────────────────────────────
function AdminCRMClients(){
  const {dm,inkC,grayC,inputBg,inputBorder,subtleBg,cardBg,cardBorder}=useTheme()
  const [clients,setClients]=useState([])
  const [loading,setLoading]=useState(true)
  const [search,setSearch]=useState('')
  useEffect(()=>{
    fetch('/api/admin/crm-clients').then(r=>r.json()).then(d=>setClients(d.clients||[])).finally(()=>setLoading(false))
  },[])
  const filtered=clients.filter(c=>c.name?.toLowerCase().includes(search.toLowerCase())||c.service_acquired?.toLowerCase().includes(search.toLowerCase()))
  const TL={once:'Pago único',subscription:'Suscripción',installments:'Cuotas'}
  return(
    <div style={{padding:'20px 16px 32px',fontFamily:ff}}>
      <h1 style={{fontFamily:ffS,fontSize:26,fontWeight:300,color:inkC,marginBottom:16}}>Clientes</h1>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar cliente o servicio..." style={{width:'100%',boxSizing:'border-box',height:44,borderRadius:12,border:`1px solid ${inputBorder}`,padding:'0 16px',fontSize:14,fontFamily:ff,background:inputBg,color:inkC,outline:'none',marginBottom:16}}/>
      {loading&&<p style={{color:grayC,textAlign:'center',padding:'40px 0'}}>Cargando...</p>}
      {!loading&&filtered.length===0&&<p style={{color:grayC,textAlign:'center',padding:'40px 0',fontSize:14}}>Aún no hay clientes. Cuando alguien "Compre" en Bookings, aparecerá aquí.</p>}
      {filtered.map(c=>(
        <div key={c.id} style={{background:cardBg,border:`1px solid ${cardBorder}`,borderRadius:16,padding:16,marginBottom:12,backdropFilter:'blur(12px)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
            <div>
              <p style={{fontSize:16,fontWeight:600,color:inkC}}>{c.name}</p>
              {c.facebook_page&&<p style={{fontSize:12,color:'#1877f2',marginTop:2}}>📘 {c.facebook_page}</p>}
            </div>
            <span style={{fontSize:10,padding:'3px 10px',borderRadius:99,background:'rgba(184,151,90,0.12)',color:gold,fontWeight:600}}>{TL[c.payment_type]||'Pago único'}</span>
          </div>
          <div style={{marginTop:10,padding:'10px 12px',background:subtleBg,borderRadius:10}}>
            <p style={{fontSize:13,color:inkC,fontWeight:500}}>{c.service_acquired}</p>
            <p style={{fontSize:20,fontWeight:700,fontFamily:ff,color:'#2d8a60',marginTop:2}}>${(c.amount_paid||0).toLocaleString()}</p>
            {c.payment_type==='subscription'&&c.monthly_amount&&<p style={{fontSize:11,color:grayC}}>${c.monthly_amount}/mes</p>}
            {c.payment_type==='installments'&&c.installments&&<p style={{fontSize:11,color:grayC}}>{c.installments} cuotas · total ${c.total_amount}</p>}
          </div>
          {c.notes&&<p style={{fontSize:11,color:grayC,marginTop:8,fontStyle:'italic'}}>{c.notes}</p>}
          <p style={{fontSize:10,color:grayC,marginTop:8}}>{new Date(c.created_at).toLocaleDateString('es-PR',{year:'numeric',month:'long',day:'numeric'})}</p>
        </div>
      ))}
    </div>
  )
}

export default function Admin({session}){
  const router=useRouter()
  const [panel,setPanel]=useState('dashboard')
  const [hamburgerOpen,setHamburgerOpen]=useState(false)
  const [userRole,setUserRole]=useState(null) // 'admin' | 'agent'
  const [agentId,setAgentId]=useState(null)
  const [cards,setCards]=useState([])
  const [users,setUsers]=useState([])
  const [rewards,setRewards]=useState([])
  const [catalog,setCatalog]=useState([])
  const [loading,setLoading]=useState(true)
  const [punchId,setPunchId]=useState('')
  const [punchAmt,setPunchAmt]=useState('')
  const [modal,setModal]=useState(null)
  const [form,setForm]=useState({})
  const [toast,setToast]=useState('')
  const [qrCard,setQrCard]=useState(null)
  const [search,setSearch]=useState('')
  const [selectedClient,setSelectedClient]=useState(null)
  const [loyaltyOpen,setLoyaltyOpen]=useState(true)
  const [clientSearch,setClientSearch]=useState('')
  const [editingClient,setEditingClient]=useState(null)
  const [editForm,setEditForm]=useState({})
  const [filesClient,setFilesClient]=useState(null)
  const [editCost,setEditCost]=useState(null)
  const [costForm,setCostForm]=useState({cost:'',notes:''})
  const [suppliersItem,setSuppliersItem]=useState(null)
  const [suppliersText,setSuppliersText]=useState('')
  const [suppliersTitle,setSuppliersTitle]=useState('')
  const [expenseClient,setExpenseClient]=useState(null)
  const [historyClient,setHistoryClient]=useState(null)
  const [sales,setSales]=useState([])
  const [allUsers,setAllUsers]=useState([])
  const [supplies,setSupplies]=useState([])
  const [supplyModal,setSupplyModal]=useState(null) // null | 'add' | supply object
  const [supplyForm,setSupplyForm]=useState({name:'',category:'',cost:'',unit:'month',provider:'',renewal_date:'',notes:''})
  const [rewardCard,setRewardCard]=useState(null) // card for inline reward modal
  const [expenseForm,setExpenseForm]=useState({amount:'',description:'',date:new Date().toISOString().split('T')[0]})

  useEffect(()=>{
    if(!session){router.push('/login');return}
    fetch('/api/auth/check-role')
      .then(r=>r.json())
      .then(({role,userId,name})=>{
        if(role==='admin'||role==='agent'){
          setUserRole(role)
          if(userId) setAgentId(userId)
          if(role==='agent'&&name){
            setAgentName(name)
            const key=`aplus_onboarded_${userId}`
            if(!localStorage.getItem(key)){ setShowOnboarding(true); localStorage.setItem(key,'1') }
          }
          if(role==='admin'){
            loadAll()
            // Handle redirect from LeadMap "Llamar" button
            const gotoPanel=typeof window!=='undefined'&&sessionStorage.getItem('aplus_goto_panel')
            if(gotoPanel){ setActivePanel(gotoPanel); sessionStorage.removeItem('aplus_goto_panel') }
            const params=new URLSearchParams(window.location.search)
            const confirmId=params.get('confirm')
            const viewId=params.get('view')
            if(confirmId){
              fetch('/api/admin/bookings',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:confirmId,status:'confirmed'})})
                .then(()=>{ showToast('✓ Consulta confirmada'); setPanel('bookings') })
                .catch(()=>{})
              window.history.replaceState({},'','/admin')
            } else if(viewId){
              setPanel('bookings')
              window.history.replaceState({},'','/admin')
            }
          } else {
            // Agent: minimal load
            setLoading(false)
          }
        } else {router.push('/login')}
      })
      .catch(()=>router.push('/login'))
  },[session])

  async function loadAll(){
    setLoading(true)
    try {
      const [c,u,r,cat]=await Promise.all([
        fetch('/api/admin/cards').then(r=>r.json()).catch(()=>({})),
        fetch('/api/admin/users').then(r=>r.json()).catch(()=>({})),
        fetch('/api/admin/rewards').then(r=>r.json()).catch(()=>({})),
        fetch('/api/admin/catalog').then(r=>r.json()).catch(()=>({})),
      ])
      setCards(c.cards||[]);setUsers(u.users||[]);setRewards(r.rewards||[]);setCatalog(cat.items||[])
      fetch('/api/admin/supplies').then(r=>r.json()).then(d=>setSupplies(d.supplies||[])).catch(()=>{})
      fetch('/api/admin/users?all=1').then(r=>r.json()).then(d=>setAllUsers(d.users||[])).catch(()=>{})
      fetch('/api/admin/sales').then(r=>r.json()).then(d=>setSales(d.sales||[])).catch(()=>{})
    } catch(_) {}
    setLoading(false)
  }

  function showToast(msg){setToast(msg);setTimeout(()=>setToast(''),3200)}

  async function doPunch(){
    if(!punchId){showToast('Select a client');return}
    if(!punchAmt||parseFloat(punchAmt)<=0){showToast('Amount is required');return}
    const res=await fetch('/api/admin/punch',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({card_id:punchId,payment_amount:punchAmt})})
    const data=await res.json()
    if(res.ok){
      showToast(data.message)
      const card=cards.find(c=>c.id===punchId)
      // Register sale + push notification
      await fetch('/api/admin/sales',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        customer_id:card?.user_id,
        customer_name:card?.profiles?.business_name||card?.profiles?.full_name||'',
        customer_email:card?.profiles?.email||'',
        product_name:'Manual Payment',
        amount:parseFloat(punchAmt),
        currency:'usd',
        type:'manual',
        status:'paid',
        sale_date:new Date().toISOString().split('T')[0],
        notes:'Registered via punch'
      })})
      sendPush('New Sale', `$${parseFloat(punchAmt).toFixed(2)} — ${card?.profiles?.business_name||card?.profiles?.full_name||'Client'}`, '/admin')
      setPunchId('');setPunchAmt('');loadAll()
    }
    else showToast('Error: '+data.error)
  }

  async function createClient(){
    if(!form.new_email||!form.new_password){showToast('Email and password required');return}
    const res=await fetch('/api/admin/users',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:form.new_email,password:form.new_password,full_name:form.new_name,business_name:form.new_business,phone:form.new_phone})})
    const data=await res.json()
    if(res.ok){
      showToast('Client created')
      await fetch('/api/admin/activity-log',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'Created client',target:form.new_business||form.new_name||form.new_email,type:'create'})})
      setForm(f=>({...f,new_email:'',new_password:'',new_name:'',new_business:'',new_phone:'',user_id:data.user.id}));loadAll()
    }
    else showToast('Error: '+data.error)
  }

  async function createCard(){
    if(!form.user_id){showToast('Select a client');return}
    const res=await fetch('/api/admin/cards',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({user_id:form.user_id,notes:form.notes})})
    const data=await res.json()
    if(res.ok){showToast('Card created');setModal(null);setForm({});loadAll()}
    else showToast('Error: '+data.error)
  }

  async function deleteCard(id){
    if(!confirm('Delete this card?'))return
    const card=cards.find(c=>c.id===id)
    await fetch('/api/admin/cards',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})})
    await fetch('/api/admin/activity-log',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'Deleted card',target:(card?.profiles?.business_name||card?.profiles?.full_name||'')+(card?' · #'+card.card_number:''),type:'delete'})})
    showToast('Card deleted');loadAll()
  }

  async function saveReward(){
    const card=cards.find(c=>c.user_id===form.reward_user_id)
    if(!card){showToast('User has no active card');return}
    const res=await fetch('/api/admin/rewards',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({card_id:card.id,user_id:form.reward_user_id,reward_type:form.reward_type||'1 Free Month',reward_cost:form.reward_cost,notes:form.reward_notes})})
    if(res.ok){
      showToast('Reward registered')
      const u=users.find(u=>u.id===form.reward_user_id)
      await fetch('/api/admin/activity-log',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'Registered reward',target:(form.reward_type||'1 Free Month')+' → '+(u?.business_name||u?.full_name||''),type:'reward'})})
      setModal(null);setForm({});loadAll()
    }
  }

  async function deleteReward(id){
    await fetch('/api/admin/rewards',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})})
    showToast('Reward deleted');loadAll()
  }

  const signOut=async()=>{await supabase.auth.signOut();router.push('/login')}

  async function subscribeToPush() {
    try {
      const reg = await navigator.serviceWorker.ready
      const existing = await reg.pushManager.getSubscription()
      if (existing) { showToast('Notifications already enabled'); return }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      })
      await fetch('/api/admin/push?action=subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub)
      })
      showToast('Notifications enabled!')
    } catch(e) {
      showToast('Could not enable notifications')
    }
  }

  async function sendPush(title, body, url) {
    await fetch('/api/admin/push?action=send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body, url })
    }).catch(()=>{})
  }
  const upd=(k,v)=>setForm(f=>({...f,[k]:v}))
  const cardUrl=(card)=>`https://app.accountingpluscrm.com/c/${card?.card_number}`

  const [tab,setTab]=useState('dashboard')
  const [burger,setBurger]=useState(false)
  const [activePanel,setActivePanel]=useState('dashboard')
  const [adminBookings,setAdminBookings]=useState([])
  const [darkMode,setDarkMode]=useState(()=>{ try{ return localStorage.getItem('aplus_dark')==='1' }catch{return false} })
  const inp={width:'100%',padding:'0.75rem 0.9rem',border:`1px solid ${darkMode?'rgba(255,255,255,0.12)':'rgba(184,151,90,0.2)'}`,borderRadius:10,background:darkMode?'rgba(255,255,255,0.07)':'rgba(248,246,241,0.7)',fontFamily:ff,fontSize:'0.88rem',outline:'none',color:darkMode?'rgba(255,255,255,0.9)':black,marginBottom:'1rem',boxSizing:'border-box',backdropFilter:'blur(8px)'}
  const lbl={fontSize:'0.56rem',letterSpacing:'0.13em',textTransform:'uppercase',color:darkMode?'rgba(255,255,255,0.4)':gray,display:'block',marginBottom:'0.35rem'}
  const modalBg=darkMode?'#1a1a18':'#ffffff'
  const modalInk=darkMode?'rgba(255,255,255,0.9)':ink
  const modalGray=darkMode?'rgba(255,255,255,0.4)':gray
  const modalInputBg=darkMode?'rgba(255,255,255,0.07)':'#fff'
  const modalInputBorder=darkMode?'rgba(255,255,255,0.12)':'rgba(14,14,12,0.12)'
  const modalSubtle=darkMode?'rgba(255,255,255,0.05)':'rgba(14,14,12,0.03)'
  const modalDivider=darkMode?'rgba(255,255,255,0.07)':'rgba(14,14,12,0.06)'
  const [agentName,setAgentName]=useState('')
  const [showOnboarding,setShowOnboarding]=useState(false)
  const [onboardStep,setOnboardStep]=useState(0)
  useEffect(()=>{
    fetch('/api/admin/bookings').then(r=>r.json()).then(d=>setAdminBookings(Array.isArray(d)?d:[])).catch(()=>{})
  },[loading])

  if(loading)return(
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'#f8f6f1',fontFamily:ff,position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',top:'-10%',right:'-5%',width:400,height:400,borderRadius:'50%',background:'rgba(184,151,90,0.18)',filter:'blur(80px)',pointerEvents:'none'}}/>
      <div style={{position:'absolute',bottom:'5%',left:'-8%',width:320,height:320,borderRadius:'50%',background:'rgba(184,151,90,0.12)',filter:'blur(70px)',pointerEvents:'none'}}/>
      <div style={{position:'relative',textAlign:'center'}}>
        <div style={{fontFamily:ffS,fontSize:'2rem',fontWeight:500,color:black,letterSpacing:'-0.01em'}}>A<span style={{color:gold,fontStyle:'italic'}}>+</span> CRM</div>
        <div style={{fontSize:'0.58rem',letterSpacing:'0.2em',textTransform:'uppercase',color:gray,marginTop:'0.4rem'}}>Cargando panel...</div>
      </div>
    </div>
  )

  // activePanel is the single source of truth for what's displayed

  return(
    <DarkCtx.Provider value={darkMode}>
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;}
        html,body{background:${darkMode?'#0e0e0c':'#f8f6f1'};overscroll-behavior:none;-webkit-font-smoothing:antialiased;touch-action:manipulation;}
        button,a,input,select,textarea{touch-action:manipulation;}
        @supports(padding-top:env(safe-area-inset-top)){
          .safe-header{padding-top:env(safe-area-inset-top)!important;height:calc(52px + env(safe-area-inset-top))!important;}
          .safe-content{padding-top:calc(52px + env(safe-area-inset-top))!important;}
        }
        @media(max-width:700px){
          .admin-sidebar{display:none!important;}
          .admin-main{margin-left:0!important;padding:1rem!important;padding-bottom:calc(72px + env(safe-area-inset-bottom,0px))!important;}
          .donut-grid{grid-template-columns:1fr!important;}
          .punch-row{grid-template-columns:1fr!important;}
          .mobile-nav{display:flex!important;}
        }
        .mobile-nav{display:none;position:fixed;bottom:0;left:0;right:0;background:rgba(28,28,26,0.88);backdrop-filter:blur(28px) saturate(200%);z-index:200;border-top:1px solid rgba(184,151,90,0.18);padding:0 8px;padding-bottom:env(safe-area-inset-bottom,0px);height:calc(60px + env(safe-area-inset-bottom,0px));align-items:flex-start;padding-top:4px;}
        .mnav-btn{flex:1;padding:0;background:none;border:none;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;height:100%;position:relative;transition:all 0.2s;}
        .mnav-btn .mnav-icon{width:22px;height:22px;display:flex;align-items:center;justify-content:center;border-radius:8px;transition:all 0.2s;}
        .mnav-btn .mnav-label{font-family:${ff};font-size:10px;font-weight:500;letter-spacing:0.02em;color:rgba(255,255,255,0.35);transition:color 0.2s;}
        .mnav-btn svg{color:rgba(255,255,255,0.35);transition:color 0.2s;}
        .mnav-btn.active .mnav-icon{background:${gold};box-shadow:0 4px 14px rgba(184,151,90,0.45);}
        .mnav-btn.active svg{color:#0e0e0c;}
        .mnav-btn.active .mnav-label{color:${gold};}
        @keyframes menu-up{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .menu-card{animation:menu-up 0.22s cubic-bezier(0.22,1,0.36,1) both;}
        .sidebar-btn{transition:background 0.15s,color 0.15s,border-color 0.15s;}
        .sidebar-btn:hover{background:rgba(255,255,255,0.05)!important;}
        .client-row:hover{background:rgba(184,151,90,0.04);}
        .client-row{transition:background 0.12s;}
        .action-btn{transition:opacity 0.15s,transform 0.1s;}
        .action-btn:hover{opacity:0.85;transform:translateY(-1px);}
        .action-btn:active{transform:translateY(0);}
        input:focus,select:focus,textarea:focus{border-color:${gold}!important;box-shadow:0 0 0 3px rgba(184,151,90,0.12)!important;outline:none!important;}
        @keyframes panel-in{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes sheet-up{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
        .panel-animate{animation:panel-in 0.35s cubic-bezier(0.22,1,0.36,1) both;}
        .glass-card{background:rgba(248,246,241,0.6);backdrop-filter:blur(20px) saturate(160%);border:1px solid rgba(255,255,255,0.7);box-shadow:inset 0 1px 0 rgba(255,255,255,0.8),0 8px 32px -8px rgba(28,28,26,0.12);border-radius:14px;}
        .glass-dark-nav{background:rgba(28,28,26,0.75);backdrop-filter:blur(24px) saturate(180%);border-bottom:1px solid rgba(184,151,90,0.15);}
        .glass-sidebar{background:rgba(20,20,18,0.82);backdrop-filter:blur(24px) saturate(160%);border-right:1px solid rgba(184,151,90,0.1);}
        @keyframes float-slow{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(20px,-30px) scale(1.05)}}
        @keyframes float-slower{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-30px,20px) scale(1.08)}}
        .blob{position:fixed;border-radius:50%;pointer-events:none;z-index:0;}
        .blob-1{top:-80px;right:-60px;width:420px;height:420px;background:rgba(184,151,90,0.2);filter:blur(80px);animation:float-slow 14s ease-in-out infinite;}
        .blob-2{top:45%;left:-80px;width:340px;height:340px;background:rgba(184,151,90,0.13);filter:blur(70px);animation:float-slower 18s ease-in-out infinite;}
        .blob-3{bottom:0;right:25%;width:280px;height:280px;background:rgba(184,151,90,0.1);filter:blur(60px);animation:float-slow 16s ease-in-out infinite;}
      `}</style>
      {/* ── GLASS HEADER ── */}
      <header style={{position:'fixed',top:0,left:0,right:0,zIndex:200,height:'calc(52px + env(safe-area-inset-top,0px))',paddingTop:'env(safe-area-inset-top,0px)',background:darkMode?'rgba(14,14,12,0.9)':'rgba(255,255,255,0.72)',backdropFilter:'blur(20px) saturate(180%)',WebkitBackdropFilter:'blur(20px) saturate(180%)',borderBottom:darkMode?'1px solid rgba(255,255,255,0.06)':'1px solid rgba(255,255,255,0.5)',boxShadow:'0 2px 20px rgba(0,0,0,0.06)',display:'flex',alignItems:'flex-end',justifyContent:'space-between',paddingLeft:20,paddingRight:20,paddingBottom:10,transition:'background 0.3s'}}>
        <div style={{fontFamily:ffS,fontSize:'1.2rem',fontWeight:500,color:darkMode?'rgba(255,255,255,0.9)':ink,lineHeight:1}}>A<span style={{color:gold,fontStyle:'italic'}}>+</span> CRM</div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <button onClick={()=>{ const n=!darkMode; setDarkMode(n); try{localStorage.setItem('aplus_dark',n?'1':'0')}catch{} }} style={{background:'none',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:darkMode?'rgba(255,255,255,0.5)':'rgba(14,14,12,0.35)',padding:4,touchAction:'manipulation'}}>
            {darkMode
              ?<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              :<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            }
          </button>
          <button onClick={signOut} style={{background:'none',border:`1px solid ${darkMode?'rgba(255,255,255,0.12)':'rgba(14,14,12,0.12)'}`,color:darkMode?'rgba(255,255,255,0.4)':gray,padding:'5px 14px',fontSize:11,letterSpacing:'0.08em',textTransform:'uppercase',cursor:'pointer',borderRadius:20,fontFamily:ff}}>Salir</button>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <div style={{paddingTop:'calc(52px + env(safe-area-inset-top,0px))',paddingBottom:'calc(64px + env(safe-area-inset-bottom,0px))',minHeight:'100vh',background:darkMode?'#0e0e0c':'#f8f6f1',WebkitOverflowScrolling:'touch',overflowY:'auto',transition:'background 0.3s'}}>
        <div key={burger?panel:tab} className="panel-animate">
          {/* PRIMARY TABS */}
          {activePanel==='dashboard'&&<AdminDashboard sales={sales} bookings={adminBookings} session={session} users={users} onSaleAdded={loadAll} darkMode={darkMode} onNavigate={(p)=>{setActivePanel(p);setTab(p)}}/>}
          {activePanel==='bookings'&&<AdminBookings userRole={userRole} agentId={agentId}/>}
          {activePanel==='coldcalling'&&<AdminColdCalling agentId={agentId}/>}


          {/* BURGER PANELS */}
          {activePanel==='crm-clients'&&<AdminCRMClients/>}
          {activePanel==='loyalty-cards'&&<ClientsPanel users={users} cards={cards} search={clientSearch} setSearch={setClientSearch}
            onEdit={(u)=>{setEditingClient(u);setEditForm({name:u.full_name||'',business:u.business_name||'',phone:u.phone||'',email:'',password:''});setModal('editclient')}}
            onAddPayment={(card)=>{setPunchId(card.id);setPanel('punch')}}
            onCreateCard={(uid)=>{setForm({user_id:uid});setModal('card')}}
            onCreateNew={()=>{setForm({});setModal('card')}}
            onDelete={async(uid)=>{if(!confirm('Eliminar cliente?'))return;const u=users.find(u=>u.id===uid);await fetch('/api/admin/users',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:uid})});showToast('Cliente eliminado');loadAll()}}
            onFiles={(u)=>{setFilesClient(u);setModal('files')}}
            onExpense={(u)=>{setExpenseClient(u);setExpenseForm({amount:'',description:'',date:new Date().toISOString().split('T')[0]});setModal('expense')}}
            onHistory={(u)=>{setHistoryClient(u);setModal('history')}}
          />}
          {activePanel==='cards'&&<>
            <div style={{padding:'20px 16px 8px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <h2 style={{fontFamily:ffS,fontSize:'1.5rem',fontWeight:300}}>Cards</h2>
              <button onClick={()=>setModal('card')} style={{background:black,color:white,border:'none',padding:'0.6rem 1.1rem',fontFamily:ff,fontSize:'0.6rem',letterSpacing:'0.12em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>+ New</button>
            </div>
            <div style={{padding:'0 16px'}}>
              <input type="text" placeholder="Search client..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:'100%',padding:'0.7rem 1rem',border:`1px solid ${darkMode?'rgba(255,255,255,0.12)':gl}`,borderRadius:3,fontFamily:ff,fontSize:'0.82rem',outline:'none',marginBottom:'1.25rem',boxSizing:'border-box',background:darkMode?'rgba(255,255,255,0.07)':white,color:darkMode?'rgba(255,255,255,0.9)':ink}}/>
              <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
                {cards.filter(c=>(c.profiles?.full_name||'').toLowerCase().includes(search.toLowerCase())||(c.profiles?.business_name||'').toLowerCase().includes(search.toLowerCase())).map(card=>{
                  const cur=card.stamps%5===0&&card.stamps>0?5:card.stamps%5
                  const cycle=Math.ceil((card.stamps||1)/5)||1
                  const hasR=card.stamps>0&&card.stamps%5===0
                  return(<div key={card.id} style={{background:'rgba(248,246,241,0.6)',backdropFilter:'blur(20px) saturate(160%)',borderRadius:14,border:'1px solid rgba(255,255,255,0.7)',boxShadow:'inset 0 1px 0 rgba(255,255,255,0.8),0 8px 32px -8px rgba(28,28,26,0.1)',overflow:'hidden'}}>
                    <div style={{background:'linear-gradient(135deg,#1a1917,#252320)',padding:'1rem 1.25rem',color:white,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <div>
                        <div style={{fontFamily:ffS,fontSize:'0.9rem',marginBottom:'0.15rem'}}>A<span style={{color:gold,fontStyle:'italic'}}>+</span> CRM</div>
                        <div style={{fontSize:'0.72rem',color:'rgba(255,255,255,0.8)',marginBottom:'0.5rem'}}>{card.profiles?.business_name||card.profiles?.full_name}</div>
                        <div style={{display:'flex',gap:3}}>{Array.from({length:5},(_,i)=><div key={i} style={{width:10,height:10,borderRadius:'50%',border:'1px solid rgba(184,151,90,0.22)',background:i<cur?gold:'transparent'}}/>)}</div>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontSize:'0.6rem',color:'rgba(255,255,255,0.4)',marginBottom:'0.2rem'}}>#{card.card_number}</div>
                        <div style={{fontSize:'0.68rem',color:hasR?gold:'rgba(255,255,255,0.5)'}}>{cur}/5 · Cycle {cycle}</div>
                      </div>
                    </div>
                    <div style={{padding:'0.75rem 1.25rem',display:'flex',gap:'0.4rem'}}>
                      <button onClick={()=>{setPunchId(card.id);setPanel('punch')}} style={{flex:1,padding:'0.45rem',background:black,color:white,border:'none',borderRadius:3,cursor:'pointer',fontFamily:ff,fontSize:'0.56rem',letterSpacing:'0.07em',textTransform:'uppercase'}}>+ Stamp</button>
                      <button onClick={()=>setRewardCard(card)} style={{flex:1,padding:'0.45rem',background:'rgba(45,138,96,0.1)',color:'#2d8a60',border:'1px solid rgba(45,138,96,0.25)',borderRadius:3,cursor:'pointer',fontFamily:ff,fontSize:'0.56rem',letterSpacing:'0.07em',textTransform:'uppercase'}}>Reward</button>
                      <button onClick={()=>{setQrCard(card);setModal('qr')}} style={{flex:1,padding:'0.45rem',background:'rgba(184,151,90,0.1)',color:gold,border:'1px solid rgba(184,151,90,0.25)',borderRadius:3,cursor:'pointer',fontFamily:ff,fontSize:'0.56rem',letterSpacing:'0.07em',textTransform:'uppercase'}}>QR</button>
                      <button onClick={()=>deleteCard(card.id)} style={{flex:1,padding:'0.45rem',background:'rgba(192,57,43,0.08)',color:'#a93226',border:'none',borderRadius:3,cursor:'pointer',fontFamily:ff,fontSize:'0.56rem',letterSpacing:'0.07em',textTransform:'uppercase'}}>Delete</button>
                    </div>
                    {/* Next Reward editable */}
                    <div style={{padding:'0 1.25rem 0.85rem',display:'flex',gap:'0.5rem',alignItems:'center'}}>
                      <span style={{fontSize:'0.52rem',color:gray,letterSpacing:'0.08em',textTransform:'uppercase',whiteSpace:'nowrap'}}>Next Reward:</span>
                      <input
                        type="text"
                        defaultValue={card.notes||''}
                        placeholder="e.g. 1 free month"
                        onBlur={async(e)=>{
                          await fetch('/api/admin/cards',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:card.id,notes:e.target.value})})
                          showToast('Next reward updated')
                        }}
                        style={{flex:1,padding:'0.3rem 0.6rem',border:'1px solid rgba(184,151,90,0.2)',borderRadius:3,fontFamily:ff,fontSize:'0.62rem',outline:'none',background:'rgba(184,151,90,0.04)',color:black}}
                      />
                    </div>
                  </div>)
                })}
                {cards.length===0&&<p style={{color:gray,fontSize:'0.85rem'}}>No cards yet.</p>}
              </div>
            </div>
          </>}
          {activePanel==='punch'&&<div style={{padding:'20px 16px'}}>
              <h2 style={{fontFamily:ffS,fontSize:'1.5rem',fontWeight:300,marginBottom:'1.25rem'}}>Punch Card</h2>
              <div style={{background:modalBg,borderRadius:10,padding:'1.5rem',border:`1px solid ${darkMode?'rgba(255,255,255,0.08)':'rgba(14,14,12,0.07)'}`}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem',marginBottom:'1rem'}}>
                  <div><label style={lbl}>Client</label><select value={punchId} onChange={e=>setPunchId(e.target.value)} style={{...inp,marginBottom:0}}><option value="">Select</option>{cards.map(c=><option key={c.id} value={c.id}>{c.profiles?.business_name||c.profiles?.full_name} · {c.stamps%5===0&&c.stamps>0?5:c.stamps%5}/5</option>)}</select></div>
                  <div><label style={lbl}>Amount *</label><input style={{...inp,marginBottom:0}} type="number" step="0.01" placeholder="0.00" value={punchAmt} onChange={e=>setPunchAmt(e.target.value)}/></div>
                </div>
                <button onClick={doPunch} style={{width:'100%',background:black,color:white,border:'none',padding:'0.85rem',fontFamily:ff,fontSize:'0.66rem',letterSpacing:'0.14em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>Give Stamp</button>
              </div>
            </div>}
          {activePanel==='notifications'&&<NotificationsPanel cards={cards} users={users}/>}
          {activePanel==='campaigns'&&<CampaignsPanel cards={cards} users={users}/>}
          {activePanel==='catalog'&&<CatalogPanel catalog={catalog} onSetCost={(item)=>{setEditCost(item);setCostForm({cost:item.catalog_costs?.cost||'',notes:item.catalog_costs?.notes||''});setModal('cost')}} onSetSuppliers={(item)=>{setSuppliersItem(item);setSuppliersText(item.catalog_costs?.suppliers||'');setSuppliersTitle('');setModal('suppliers')}}/>}
          {activePanel==='supplies'&&<SuppliesPanel supplies={supplies} onAdd={()=>{setSupplyForm({name:'',category:'',cost:'',unit:'month',provider:'',renewal_date:'',notes:''});setSupplyModal('add')}} onEdit={(s)=>{setSupplyForm({name:s.name,category:s.category||'',cost:s.cost,unit:s.unit||'month',provider:s.provider||'',renewal_date:s.renewal_date||'',notes:s.notes||''});setSupplyModal(s)}} onDelete={async(id)=>{if(!confirm('Delete?'))return;await fetch('/api/admin/supplies',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})});showToast('Deleted');loadAll()}} showToast={showToast}/>}
          {activePanel==='reviews'&&<ReviewsPanel/>}
          {activePanel==='system'&&<AdminSystemPanel users={users} cards={cards} allUsers={allUsers} loadAll={loadAll} showToast={showToast}/>}
          {activePanel==='mapa'&&<LeadMap showToast={showToast}/>}
        </div>
      </div>

      {/* ── GLASS BOTTOM NAV ── */}
      <nav style={{position:'fixed',bottom:0,left:0,right:0,zIndex:200,height:'calc(60px + env(safe-area-inset-bottom,0px))',paddingBottom:'env(safe-area-inset-bottom,0px)',background:'rgba(255,255,255,0.72)',backdropFilter:'blur(20px) saturate(180%)',WebkitBackdropFilter:'blur(20px) saturate(180%)',borderTop:'1px solid rgba(255,255,255,0.5)',boxShadow:'0 -2px 20px rgba(0,0,0,0.06)',display:'flex',alignItems:'flex-start',paddingTop:8}}>
        {[
          {id:'dashboard',label:'Dashboard',icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>},
          {id:'bookings',label:'Consultas',icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>},
          {id:'coldcalling',label:'Llamadas',icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.65 3.38 2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.58a16 16 0 0 0 6 6l.96-.87a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.92 16.92z"/></svg>},
        ].map(({id,label,icon})=>{
          const active=activePanel===id
          return(
            <button key={id} onClick={()=>{setActivePanel(id);setTab(id);setBurger(false)}} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:3,border:'none',background:'none',cursor:'pointer',padding:'4px 0'}}>
              <span style={{color:active?ink:'rgba(14,14,12,0.3)',transition:'color 0.15s'}}>{icon}</span>
              <span style={{fontSize:10,fontFamily:ff,fontWeight:active?700:400,color:active?ink:'rgba(14,14,12,0.35)',letterSpacing:'0.02em',borderBottom:active?'2px solid '+ink:'2px solid transparent',paddingBottom:1}}>{label}</span>
            </button>
          )
        })}
        {/* Burger — admin only */}
        {userRole==='admin'&&<button onClick={()=>setBurger(o=>!o)} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:3,border:'none',background:'none',cursor:'pointer',padding:'4px 0'}}>
          <span style={{color:burger?ink:'rgba(14,14,12,0.3)',transition:'color 0.15s'}}>
            {burger
              ?<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              :<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            }
          </span>
          <span style={{fontSize:10,fontFamily:ff,fontWeight:burger?700:400,color:burger?ink:'rgba(14,14,12,0.35)',letterSpacing:'0.02em',borderBottom:burger?'2px solid '+ink:'2px solid transparent',paddingBottom:1}}>Más</span>
        </button>}
      </nav>

      {/* ── BURGER BOTTOM SHEET ── */}
      {burger&&(
        <>
          <div style={{position:'fixed',inset:0,zIndex:190,background:'rgba(0,0,0,0.28)'}} onClick={()=>setBurger(false)}/>
          <div style={{position:'fixed',bottom:0,left:0,right:0,zIndex:195,background:'rgba(255,255,255,0.82)',backdropFilter:'blur(32px) saturate(200%)',WebkitBackdropFilter:'blur(32px) saturate(200%)',borderRadius:'24px 24px 0 0',border:'1px solid rgba(255,255,255,0.6)',boxShadow:'0 -8px 40px rgba(0,0,0,0.13)',paddingBottom:'calc(env(safe-area-inset-bottom,0px) + 8px)',animation:'sheet-up 0.28s cubic-bezier(0.22,1,0.36,1) both'}}>
            <div style={{width:40,height:4,background:'rgba(14,14,12,0.15)',borderRadius:99,margin:'12px auto 16px'}}/>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,padding:'0 16px 8px'}}>
              {[
{id:'crm-clients',label:'Clientes CRM',icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>},
                {id:'loyalty-cards',label:'Loyalty',icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>},
                {id:'cards',label:'Cards',icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>},
                {id:'punch',label:'Punch Card',icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>},
                {id:'notifications',label:'Alertas',icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>},
                {id:'campaigns',label:'Campañas',icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>},
                {id:'catalog',label:'Catálogo',icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>},
                {id:'supplies',label:'Supplies',icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>},
                {id:'reviews',label:'Reviews',icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>},
                {id:'mapa',label:'Mapa Leads',icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>},
                {id:'system',label:'Admin Panel',icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>},
              ].map(({id,label,icon})=>(
                <button key={id} onClick={()=>{setActivePanel(id);setPanel(id);setBurger(false)}} style={{display:'flex',alignItems:'center',gap:10,padding:'13px 14px',background:activePanel===id?'rgba(14,14,12,0.07)':'rgba(14,14,12,0.03)',border:'1px solid',borderColor:activePanel===id?'rgba(14,14,12,0.15)':'rgba(14,14,12,0.06)',borderRadius:14,fontFamily:ff,fontSize:13,fontWeight:activePanel===id?600:400,color:ink,cursor:'pointer',textAlign:'left',touchAction:'manipulation'}}>
                  <span style={{display:'flex',alignItems:'center',color:activePanel===id?ink:gray,flexShrink:0}}>{icon}</span>{label}
                </button>
              ))}
            </div>
            <div style={{height:1,background:'rgba(14,14,12,0.07)',margin:'8px 16px'}}/>
            <button onClick={signOut} style={{display:'block',width:'100%',padding:'14px 20px',background:'none',border:'none',textAlign:'center',fontFamily:ff,fontSize:13,color:gray,cursor:'pointer'}}>
              Cerrar sesión
            </button>
          </div>
        </>
      )}

      {/* ── AGENT ONBOARDING ── */}
      {showOnboarding&&(()=>{
        const lastName=agentName?agentName.trim().split(' ').pop():''
        // Each step navigates to a panel and shows a tooltip pointing at something
        const steps=[
          {
            panel:null, // welcome — stay on current
            title:`Bienvenido, Sr. ${lastName}`,
            subtitle:'Tu espacio de trabajo personal',
            desc:'En esta app registras tus consultas, ves tus resultados y llevas el seguimiento de tus clientes. Te guiamos en 3 pasos.',
            cta:'Empezar tour →',
            icon:<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={gold} strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
            highlight:null,
          },
          {
            panel:'dashboard',
            title:'Tu Dashboard',
            desc:'Aquí ves tus números en tiempo real: consultas esta semana, hoy, pendientes y follow-ups. Toca cada tarjeta para ver el detalle.',
            cta:'Ver Consultas →',
            icon:<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={gold} strokeWidth="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
            arrowDir:'up', // cards are in the upper section
          },
          {
            panel:'bookings',
            title:'Registrar Consultas',
            desc:'Toca "+ Nueva" para crear una consulta. Cada una queda a tu nombre. Confirma, cierra o marca No Show según avance.',
            cta:'Ver Llamadas →',
            icon:<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={gold} strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
            arrowDir:'up',
          },
          {
            panel:'coldcalling',
            title:'Leads Listos',
            desc:'Aquí ves los leads que ya están listos para una consulta. Toca "Booking" para agendar con ellos directamente.',
            cta:'¡Listo para trabajar!',
            icon:<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={gold} strokeWidth="1.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.65 3.38 2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.58a16 16 0 0 0 6 6l.96-.87a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.92 16.92z"/></svg>,
            arrowDir:'up',
          },
        ]
        const step=steps[onboardStep]
        const isLast=onboardStep===steps.length-1
        const cardBg=darkMode?'rgba(18,18,16,0.97)':'rgba(255,255,255,0.97)'
        const cardText=darkMode?'rgba(255,255,255,0.9)':ink
        const cardSub=darkMode?'rgba(255,255,255,0.45)':gray

        function advance(){
          const next=steps[onboardStep+1]
          if(next?.panel){ setActivePanel(next.panel); setTab(next.panel) }
          if(isLast){ setShowOnboarding(false) } else { setOnboardStep(s=>s+1) }
        }

        return(
          <>
            {/* Dimmed overlay — doesn't block taps on the actual app content so user sees it live */}
            <div style={{position:'fixed',inset:0,zIndex:900,pointerEvents:'none',background:'rgba(0,0,0,0.5)'}}/>
            {/* Arrow hint pointing up at the content */}
            {step.arrowDir==='up'&&(
              <div style={{position:'fixed',top:'calc(52px + env(safe-area-inset-top,0px) + 18px)',left:'50%',transform:'translateX(-50%)',zIndex:901,pointerEvents:'none',animation:'float-slow 2s ease-in-out infinite'}}>
                <svg width="28" height="40" viewBox="0 0 28 40"><path d="M14 38 L14 4 M4 14 L14 4 L24 14" stroke={gold} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
              </div>
            )}
            {/* Tooltip card at bottom */}
            <div style={{position:'fixed',bottom:0,left:0,right:0,zIndex:902,padding:'0 16px calc(env(safe-area-inset-bottom,0px) + 80px)',pointerEvents:'auto'}}>
              <div key={onboardStep} style={{background:cardBg,borderRadius:24,padding:'24px 22px 22px',boxShadow:'0 -4px 40px rgba(0,0,0,0.25)',animation:'sheet-up 0.35s cubic-bezier(0.22,1,0.36,1) both'}}>
                {/* Step dots */}
                <div style={{display:'flex',justifyContent:'center',gap:5,marginBottom:16}}>
                  {steps.map((_,i)=>(
                    <div key={i} style={{width:i===onboardStep?18:5,height:5,borderRadius:99,background:i===onboardStep?gold:'rgba(184,151,90,0.2)',transition:'all 0.3s'}}/>
                  ))}
                </div>
                <div style={{display:'flex',gap:14,alignItems:'flex-start',marginBottom:12}}>
                  <div style={{width:48,height:48,borderRadius:14,background:darkMode?'rgba(184,151,90,0.12)':'rgba(184,151,90,0.08)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    {step.icon}
                  </div>
                  <div>
                    {step.subtitle&&<p style={{fontSize:10,textTransform:'uppercase',letterSpacing:'0.12em',color:gold,fontFamily:ff,marginBottom:3}}>{step.subtitle}</p>}
                    <h3 style={{fontFamily:ffS,fontSize:20,fontWeight:400,color:cardText,lineHeight:1.2,marginBottom:4}}>{step.title}</h3>
                    <p style={{fontSize:13,color:cardSub,fontFamily:ff,lineHeight:1.55}}>{step.desc}</p>
                  </div>
                </div>
                <div style={{display:'flex',gap:8,marginTop:4}}>
                  {onboardStep>0&&<button onClick={()=>setOnboardStep(s=>s-1)} style={{padding:'12px 16px',background:'none',border:`1px solid ${darkMode?'rgba(255,255,255,0.1)':'rgba(14,14,12,0.1)'}`,borderRadius:12,fontSize:13,color:cardSub,fontFamily:ff,cursor:'pointer',touchAction:'manipulation'}}>←</button>}
                  <button onClick={advance} style={{flex:1,padding:'13px',background:gold,color:'#fff',border:'none',borderRadius:12,fontSize:14,fontWeight:700,fontFamily:ff,cursor:'pointer',touchAction:'manipulation'}}>
                    {step.cta}
                  </button>
                  <button onClick={()=>setShowOnboarding(false)} style={{padding:'12px 14px',background:'none',border:`1px solid ${darkMode?'rgba(255,255,255,0.1)':'rgba(14,14,12,0.1)'}`,borderRadius:12,fontSize:12,color:cardSub,fontFamily:ff,cursor:'pointer',touchAction:'manipulation'}}>Saltar</button>
                </div>
              </div>
            </div>
          </>
        )
      })()}

      {/* MODAL: New Card */}
        {modal==='card'&&(<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:500,display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div style={{background:modalBg,borderRadius:'12px 12px 0 0',padding:'2rem',width:'100%',maxWidth:520,maxHeight:'90vh',overflowY:'auto'}}>
            <h3 style={{fontFamily:ffS,fontSize:'1.5rem',fontWeight:300,marginBottom:'1.5rem',color:modalInk}}>New Card</h3>
            <div style={{background:'rgba(184,151,90,0.05)',border:'1px solid rgba(184,151,90,0.2)',borderRadius:8,padding:'1.25rem',marginBottom:'1.25rem'}}>
              <div style={{fontSize:'0.58rem',letterSpacing:'0.14em',textTransform:'uppercase',color:gold,marginBottom:'1rem'}}>Create New Client</div>
              <label style={lbl}>Full Name</label><input style={inp} type="text" placeholder="Client name" value={form.new_name||''} onChange={e=>upd('new_name',e.target.value)}/>
              <label style={lbl}>Business Name</label><input style={inp} type="text" placeholder="Business name" value={form.new_business||''} onChange={e=>upd('new_business',e.target.value)}/>
              <label style={lbl}>Phone</label><input style={inp} type="tel" placeholder="+1 (787) 555-1234" value={form.new_phone||''} onChange={e=>upd('new_phone',formatPhone(e.target.value))}/>
              <label style={lbl}>Email</label><input style={inp} type="email" placeholder="email@business.com" value={form.new_email||''} onChange={e=>upd('new_email',e.target.value)}/>
              <label style={lbl}>Temporary Password</label><input style={{...inp,marginBottom:0}} type="text" placeholder="min. 6 characters" value={form.new_password||''} onChange={e=>upd('new_password',e.target.value)}/>
              <button onClick={createClient} style={{width:'100%',background:gold,color:white,border:'none',padding:'0.75rem',fontFamily:ff,fontSize:'0.62rem',letterSpacing:'0.12em',textTransform:'uppercase',borderRadius:3,cursor:'pointer',marginTop:'0.85rem'}}>Create Client</button>
            </div>
            <div style={{fontSize:'0.58rem',letterSpacing:'0.14em',textTransform:'uppercase',color:modalGray,marginBottom:'0.75rem',textAlign:'center'}}>— or select existing —</div>
            <label style={lbl}>Existing Client</label>
            <select value={form.user_id||''} onChange={e=>upd('user_id',e.target.value)} style={inp}><option value="">Select client</option>{users.map(u=><option key={u.id} value={u.id}>{u.business_name||u.full_name}</option>)}</select>
            <label style={lbl}>Notes (optional)</label><input style={inp} type="text" placeholder="Additional info..." value={form.notes||''} onChange={e=>upd('notes',e.target.value)}/>
            <div style={{display:'flex',gap:'0.75rem'}}>
              <button onClick={createCard} style={{flex:1,background:black,color:white,border:'none',padding:'0.85rem',fontFamily:ff,fontSize:'0.66rem',letterSpacing:'0.14em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>Assign Card</button>
              <button onClick={()=>setModal(null)} style={{background:modalSubtle,color:modalInk,border:'none',padding:'0.85rem 1.25rem',fontFamily:ff,fontSize:'0.66rem',letterSpacing:'0.14em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>Cancel</button>
            </div>
          </div>
        </div>)}

        {/* MODAL: QR */}
        {modal==='qr'&&qrCard&&(<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:'1.25rem'}} onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div style={{background:modalBg,borderRadius:12,padding:'2rem',width:'100%',maxWidth:360,textAlign:'center'}}>
            <h3 style={{fontFamily:ffS,fontSize:'1.5rem',fontWeight:300,marginBottom:'0.25rem',color:modalInk}}>QR Code</h3>
            <p style={{fontSize:'0.72rem',color:modalGray,marginBottom:'0.5rem'}}>{qrCard.profiles?.business_name||qrCard.profiles?.full_name}</p>
            <p style={{fontSize:'0.6rem',color:modalGray,marginBottom:'1.25rem'}}>#{qrCard.card_number}</p>
            <div style={{display:'flex',justifyContent:'center',marginBottom:'1.25rem'}}><img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(cardUrl(qrCard))}&color=0e0e0c&bgcolor=f8f6f1`} alt="QR" style={{borderRadius:8,border:'1px solid '+gl,padding:8,background:white}} width={200} height={200}/></div>
            <p style={{fontSize:'0.58rem',color:modalGray,marginBottom:'1.25rem',wordBreak:'break-all',lineHeight:1.6}}>{cardUrl(qrCard)}</p>
            <div style={{display:'flex',gap:'0.75rem'}}>
              <button onClick={()=>window.open(cardUrl(qrCard),'_blank')} style={{flex:1,background:black,color:white,border:'none',padding:'0.85rem',fontFamily:ff,fontSize:'0.62rem',letterSpacing:'0.12em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>Open</button>
              <button onClick={()=>{navigator.clipboard.writeText(cardUrl(qrCard));showToast('Link copied!')}} style={{flex:1,background:'rgba(184,151,90,0.1)',color:gold,border:'1px solid rgba(184,151,90,0.25)',padding:'0.85rem',fontFamily:ff,fontSize:'0.62rem',letterSpacing:'0.12em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>Copy</button>
              <button onClick={()=>setModal(null)} style={{background:modalSubtle,color:modalInk,border:'none',padding:'0.85rem 0.75rem',fontFamily:ff,fontSize:'0.62rem',letterSpacing:'0.12em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>X</button>
            </div>
          </div>
        </div>)}

        {/* MODAL: Edit Client */}
        {modal==='editclient'&&editingClient&&(<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:500,display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div style={{background:modalBg,borderRadius:'12px 12px 0 0',padding:'2rem',width:'100%',maxWidth:520,maxHeight:'90vh',overflowY:'auto'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
              <h3 style={{fontFamily:ffS,fontSize:'1.5rem',fontWeight:300,color:modalInk}}>Edit Client</h3>
              <button onClick={()=>setModal(null)} style={{background:'none',border:'none',fontSize:'1.1rem',cursor:'pointer',color:modalGray}}>x</button>
            </div>
            <label style={lbl}>Full Name</label><input style={inp} type="text" value={editForm.name||''} onChange={e=>setEditForm(f=>({...f,name:e.target.value}))}/>
            <label style={lbl}>Business Name</label><input style={inp} type="text" value={editForm.business||''} onChange={e=>setEditForm(f=>({...f,business:e.target.value}))}/>
            <label style={lbl}>Phone</label><input style={inp} type="tel" placeholder="+1 (787) 555-1234" value={editForm.phone||''} onChange={e=>setEditForm(f=>({...f,phone:formatPhone(e.target.value)}))}/>
            <label style={lbl}>New Email (optional)</label><input style={inp} type="email" placeholder="Leave empty to keep current" value={editForm.email||''} onChange={e=>setEditForm(f=>({...f,email:e.target.value}))}/>
            <label style={lbl}>New Password (optional)</label><input style={inp} type="text" placeholder="Leave empty to keep current" value={editForm.password||''} onChange={e=>setEditForm(f=>({...f,password:e.target.value}))}/>
            <div style={{display:'flex',gap:'0.75rem'}}>
              <button onClick={async()=>{await fetch('/api/admin/users',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:editingClient.id,full_name:editForm.name,business_name:editForm.business,phone:editForm.phone,email:editForm.email||null,password:editForm.password||null})});await fetch('/api/admin/activity-log',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'Edited client',target:editForm.business||editForm.name||'',type:'edit'})});showToast('Client updated');setModal(null);setEditingClient(null);loadAll()}} style={{flex:1,background:black,color:white,border:'none',padding:'0.85rem',fontFamily:ff,fontSize:'0.66rem',letterSpacing:'0.14em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>Save</button>
              <button onClick={()=>setModal(null)} style={{background:modalSubtle,color:modalInk,border:'none',padding:'0.85rem 1.25rem',fontFamily:ff,fontSize:'0.66rem',letterSpacing:'0.14em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>Cancel</button>
            </div>
          </div>
        </div>)}

        {/* MODAL: Files */}
        {modal==='files'&&filesClient&&(<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:500,display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div style={{background:modalBg,borderRadius:'12px 12px 0 0',padding:'2rem',width:'100%',maxWidth:520,maxHeight:'90vh',overflowY:'auto'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
              <h3 style={{fontFamily:ffS,fontSize:'1.5rem',fontWeight:300,color:modalInk}}>Files — {filesClient.business_name||filesClient.full_name}</h3>
              <button onClick={()=>setModal(null)} style={{background:'none',border:'none',fontSize:'1.1rem',cursor:'pointer',color:modalGray}}>x</button>
            </div>
            <div style={{border:'2px dashed rgba(184,151,90,0.3)',borderRadius:8,padding:'2rem',textAlign:'center',marginBottom:'1.25rem',background:'rgba(184,151,90,0.03)'}}>
              <div style={{fontSize:'1.5rem',marginBottom:'0.5rem'}}>+</div>
              <div style={{fontSize:'0.78rem',color:gray,marginBottom:'0.75rem'}}>Drag files here or click to select</div>
              <input type="file" multiple accept=".pdf,.doc,.docx,.jpg,.png,.csv,.xlsx" onChange={async(e)=>{const files=Array.from(e.target.files);for(const file of files){const fd=new FormData();fd.append('file',file);fd.append('user_id',filesClient.id);const res=await fetch('/api/admin/files',{method:'POST',body:fd});const data=await res.json();if(res.ok)showToast(file.name+' uploaded');else showToast('Error: '+data.error)};e.target.value='';setModal(null);setTimeout(()=>setModal('files'),100)}} style={{display:'none'}} id="file-input"/>
              <label htmlFor="file-input" style={{background:black,color:white,padding:'0.6rem 1.25rem',borderRadius:3,cursor:'pointer',fontFamily:ff,fontSize:'0.62rem',letterSpacing:'0.12em',textTransform:'uppercase'}}>Select Files</label>
            </div>
            <FilesListForClient userId={filesClient.id} showToast={showToast}/>
          </div>
        </div>)}

        {/* MODAL: Expense */}
        {modal==='expense'&&expenseClient&&(<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:500,display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div style={{background:modalBg,borderRadius:'12px 12px 0 0',padding:'2rem',width:'100%',maxWidth:520,maxHeight:'90vh',overflowY:'auto'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.25rem'}}>
              <h3 style={{fontFamily:ffS,fontSize:'1.5rem',fontWeight:300,color:modalInk}}>Expenses</h3>
              <button onClick={()=>setModal(null)} style={{background:'none',border:'none',fontSize:'1.1rem',cursor:'pointer',color:modalGray}}>x</button>
            </div>
            <p style={{fontSize:'0.72rem',color:modalGray,marginBottom:'1.5rem'}}>{expenseClient.business_name||expenseClient.full_name}</p>
            <label style={lbl}>Amount ($)</label><input style={inp} type="number" step="0.01" placeholder="0.00" value={expenseForm.amount} onChange={e=>setExpenseForm(f=>({...f,amount:e.target.value}))}/>
            <label style={lbl}>Description</label><input style={inp} type="text" placeholder="e.g. Domain renewal, hosting..." value={expenseForm.description} onChange={e=>setExpenseForm(f=>({...f,description:e.target.value}))}/>
            <label style={lbl}>Date</label><input style={{...inp}} type="date" value={expenseForm.date} onChange={e=>setExpenseForm(f=>({...f,date:e.target.value}))}/>
            <div style={{display:'flex',alignItems:'center',gap:'0.75rem',marginBottom:'1rem'}}>
              <input type="checkbox" id="recurring-cb" checked={expenseForm.recurring||false} onChange={e=>setExpenseForm(f=>({...f,recurring:e.target.checked}))} style={{width:16,height:16,cursor:'pointer'}}/>
              <label htmlFor="recurring-cb" style={{fontSize:'0.72rem',color:modalInk,cursor:'pointer'}}>Recurring expense</label>
            </div>
            {expenseForm.recurring&&(
              <div style={{marginBottom:'1rem'}}>
                <label style={lbl}>Interval</label>
                <select value={expenseForm.recurring_interval||'month'} onChange={e=>setExpenseForm(f=>({...f,recurring_interval:e.target.value}))} style={{...inp,marginBottom:0}}>
                  <option value="week">Weekly</option>
                  <option value="month">Monthly</option>
                  <option value="year">Yearly</option>
                </select>
              </div>
            )}
            <div style={{display:'flex',gap:'0.75rem',marginBottom:'1.5rem'}}>
              <button onClick={async()=>{
                const res=await fetch('/api/admin/expenses',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({client_id:expenseClient.id,amount:expenseForm.amount,description:expenseForm.description,recurring:expenseForm.recurring||false,recurring_interval:expenseForm.recurring_interval||'month',expense_date:expenseForm.date})})
                if(res.ok){showToast('Expense saved');setExpenseForm({amount:'',description:'',date:new Date().toISOString().split('T')[0],recurring:false,recurring_interval:'month'})}
                else showToast('Error saving expense')
              }} style={{flex:1,background:black,color:white,border:'none',padding:'0.85rem',fontFamily:ff,fontSize:'0.66rem',letterSpacing:'0.14em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>Save Expense</button>
              <button onClick={()=>setModal(null)} style={{background:modalSubtle,color:modalInk,border:'none',padding:'0.85rem 1.25rem',fontFamily:ff,fontSize:'0.66rem',letterSpacing:'0.14em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>Close</button>
            </div>
            <ExpenseHistory clientId={expenseClient.id} showToast={showToast} supplies={supplies}/>
          </div>
        </div>)}

        {/* MODAL: Set Cost */}
        {modal==='cost'&&editCost&&(<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:500,display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div style={{background:modalBg,borderRadius:'12px 12px 0 0',padding:'2rem',width:'100%',maxWidth:520,maxHeight:'90vh',overflowY:'auto'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.25rem'}}>
              <h3 style={{fontFamily:ffS,fontSize:'1.5rem',fontWeight:300,color:modalInk}}>Set Cost</h3>
              <button onClick={()=>setModal(null)} style={{background:'none',border:'none',fontSize:'1.1rem',cursor:'pointer',color:modalGray}}>x</button>
            </div>
            <p style={{fontSize:'0.72rem',color:modalGray,marginBottom:'1.25rem'}}>{editCost.name}</p>

            {/* Supplies calculator */}
            {supplies.length>0&&(
              <div style={{background:'rgba(184,151,90,0.04)',border:'1px solid rgba(184,151,90,0.15)',borderRadius:8,padding:'1rem',marginBottom:'1.25rem'}}>
                <div style={{fontSize:'0.52rem',letterSpacing:'0.12em',textTransform:'uppercase',color:gold,marginBottom:'0.75rem'}}>Calculate from Supplies</div>
                {supplies.map(s=>{
                  const unitLabel = s.unit==='month'?'/mo':s.unit==='year'?'/yr':' once'
                  const qtyKey = 'cost_qty_'+s.id
                  const qty = parseFloat(costForm[qtyKey]||0)
                  const lineTotal = qty>0?parseFloat(s.cost)*qty:0
                  return(
                    <div key={s.id} style={{display:'flex',alignItems:'center',gap:'0.75rem',marginBottom:'0.5rem'}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:'0.68rem',color:modalInk,fontWeight:500}}>{s.name}</div>
                        <div style={{fontSize:'0.58rem',color:modalGray}}>${parseFloat(s.cost).toFixed(2)}{unitLabel}</div>
                      </div>
                      <input type="number" min="0" step="0.1" placeholder="0"
                        value={costForm[qtyKey]||''}
                        onChange={e=>{
                          const newQty = parseFloat(e.target.value||0)
                          setCostForm(f=>{
                            const updated = {...f,[qtyKey]:e.target.value}
                            // Recalculate total from all supply lines
                            const total = supplies.reduce((acc,sup)=>{
                              const q = parseFloat(updated['cost_qty_'+sup.id]||0)
                              return acc + (q>0?parseFloat(sup.cost)*q:0)
                            },0)
                            return {...updated, cost: total>0?total.toFixed(2):f.cost}
                          })
                        }}
                        style={{width:55,padding:'0.3rem 0.4rem',border:'1px solid '+gl,borderRadius:3,fontFamily:ff,fontSize:'0.72rem',outline:'none',textAlign:'center'}}/>
                      <div style={{fontSize:'0.62rem',color:lineTotal>0?'#c0392b':gray,width:55,textAlign:'right',fontWeight:lineTotal>0?600:400}}>
                        {lineTotal>0?'$'+lineTotal.toFixed(2):'—'}
                      </div>
                    </div>
                  )
                })}
                <div style={{display:'flex',justifyContent:'space-between',paddingTop:'0.6rem',marginTop:'0.25rem',borderTop:'1px solid rgba(14,14,12,0.07)'}}>
                  <span style={{fontSize:'0.58rem',color:modalGray,letterSpacing:'0.08em',textTransform:'uppercase'}}>Total Cost</span>
                  <span style={{fontFamily:ffS,fontSize:'1rem',fontWeight:300,color:'#c0392b'}}>${parseFloat(costForm.cost||0).toFixed(2)}</span>
                </div>
              </div>
            )}

            <div style={{display:'flex',gap:'0.75rem',marginBottom:'1rem',alignItems:'flex-end'}}>
              <div style={{flex:1}}>
                <label style={lbl}>Cost ($) <span style={{color:gray,fontWeight:400,textTransform:'none',letterSpacing:0}}>— edit manually or calculate above</span></label>
                <input id="cost-input" style={{...inp,marginBottom:0,fontSize:'1.1rem',fontWeight:600}} type="number" step="0.01" placeholder="0.00" value={costForm.cost} onChange={e=>setCostForm(f=>({...f,cost:e.target.value}))}/>
              </div>
              <button onClick={async()=>{
                if(!costForm.cost){showToast('Enter a cost first');return}
                const r=await fetch('/api/admin/catalog',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({product_id:editCost.id,cost:costForm.cost})})
                const d=await r.json()
                if(r.ok){
                  showToast('Cost saved ✓')
                  fetch('/api/admin/catalog').then(r=>r.json()).then(d=>setCatalog(d.items||[]))
                  setEditCost(d.item||editCost)
                  setCostForm(f=>({...f,cost:d.item?.catalog_costs?.[0]?.cost||f.cost}))
                } else showToast('Error: '+(d.error||'Unknown'))
              }} style={{padding:'0.78rem 1.25rem',background:black,color:white,border:'none',borderRadius:3,cursor:'pointer',fontFamily:ff,fontSize:'0.62rem',letterSpacing:'0.12em',textTransform:'uppercase',flexShrink:0}}>Save</button>
            </div>
            <CostHistory productId={editCost.id}/>
            <button onClick={()=>setModal(null)} style={{width:'100%',background:modalSubtle,color:modalInk,border:'none',padding:'0.75rem',fontFamily:ff,fontSize:'0.62rem',letterSpacing:'0.12em',textTransform:'uppercase',borderRadius:3,cursor:'pointer',marginTop:'0.5rem'}}>Close</button>
          </div>
        </div>)}

        {/* MODAL: Suppliers */}
        {modal==='suppliers'&&suppliersItem&&(<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:500,display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div style={{background:modalBg,borderRadius:'12px 12px 0 0',padding:'2rem',width:'100%',maxWidth:520,maxHeight:'90vh',overflowY:'auto'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.25rem'}}>
              <h3 style={{fontFamily:ffS,fontSize:'1.5rem',fontWeight:300,color:modalInk}}>Suppliers</h3>
              <button onClick={()=>setModal(null)} style={{background:'none',border:'none',fontSize:'1.1rem',cursor:'pointer',color:modalGray}}>x</button>
            </div>
            <p style={{fontSize:'0.72rem',color:modalGray,marginBottom:'1.25rem'}}>{suppliersItem.name}</p>
            <div style={{background:'rgba(184,151,90,0.04)',border:'1px solid rgba(184,151,90,0.15)',borderRadius:8,padding:'1rem',marginBottom:'1rem'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.5rem'}}>
                <input value={suppliersTitle} onChange={e=>setSuppliersTitle(e.target.value)} placeholder="Note title..." style={{background:'none',border:'none',outline:'none',fontFamily:ffS,fontSize:'1rem',fontWeight:300,color:modalInk,flex:1}} id="suppliers-title"/>
                <span style={{fontSize:'0.58rem',color:modalGray,flexShrink:0,marginLeft:'0.5rem'}}>{new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</span>
              </div>
              <textarea id="suppliers-text" value={suppliersText} onChange={e=>setSuppliersText(e.target.value)} rows={6} placeholder="e.g. Vercel hosting, GoDaddy domain, Supabase..." style={{width:'100%',background:'none',border:'none',outline:'none',fontFamily:ff,fontSize:'0.82rem',color:modalInk,resize:'vertical',boxSizing:'border-box',lineHeight:1.7}}/>
            </div>
            <div style={{display:'flex',gap:'0.75rem'}}>
              <button onClick={async()=>{
                const r=await fetch('/api/admin/catalog',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({product_id:suppliersItem.id,suppliers:suppliersText})})
                const d=await r.json()
                if(r.ok){showToast('Saved ✓');fetch('/api/admin/catalog').then(r=>r.json()).then(d=>setCatalog(d.items||[]))}
                else showToast('Error: '+(d.error||'Unknown'))
              }} style={{flex:1,background:black,color:white,border:'none',padding:'0.85rem',fontFamily:ff,fontSize:'0.66rem',letterSpacing:'0.14em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>Save</button>
              <button onClick={()=>setModal(null)} style={{background:modalSubtle,color:modalInk,border:'none',padding:'0.85rem 1.25rem',fontFamily:ff,fontSize:'0.66rem',letterSpacing:'0.14em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>Close</button>
            </div>
          </div>
        </div>)}

        {/* MODAL: History */}
        {modal==='history'&&historyClient&&(
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:500,display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={e=>e.target===e.currentTarget&&setModal(null)}>
            <div style={{background:modalBg,borderRadius:'12px 12px 0 0',width:'100%',maxWidth:560,maxHeight:'85vh',display:'flex',flexDirection:'column'}}>
              <div style={{padding:'1.5rem 1.5rem 1rem',flexShrink:0}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <h3 style={{fontFamily:ffS,fontSize:'1.5rem',fontWeight:300,color:modalInk}}>Transaction History</h3>
                  <button onClick={()=>setModal(null)} style={{background:'none',border:'none',fontSize:'1.1rem',cursor:'pointer',color:modalGray}}>x</button>
                </div>
                <p style={{fontSize:'0.72rem',color:modalGray,marginTop:'0.25rem'}}>{historyClient.business_name||historyClient.full_name}</p>
              </div>
              <ClientHistory client={historyClient}/>
            </div>
          </div>
        )}

        {/* MODAL: Reward — inline per card */}
        {rewardCard&&(
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:500,display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={e=>e.target===e.currentTarget&&setRewardCard(null)}>
            <div style={{background:modalBg,borderRadius:'12px 12px 0 0',padding:'2rem',width:'100%',maxWidth:520,maxHeight:'90vh',overflowY:'auto'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.25rem'}}>
                <h3 style={{fontFamily:ffS,fontSize:'1.5rem',fontWeight:300,color:modalInk}}>Rewards</h3>
                <button onClick={()=>setRewardCard(null)} style={{background:'none',border:'none',fontSize:'1.1rem',cursor:'pointer',color:modalGray}}>x</button>
              </div>
              <p style={{fontSize:'0.72rem',color:modalGray,marginBottom:'1.5rem'}}>{rewardCard.profiles?.business_name||rewardCard.profiles?.full_name} · #{rewardCard.card_number}</p>

              {/* Existing rewards list */}
              {rewardCard.rewards?.length>0&&(
                <div style={{marginBottom:'1.5rem',border:'1px solid rgba(14,14,12,0.07)',borderRadius:8,overflow:'hidden'}}>
                  <div style={{padding:'0.6rem 1rem',background:'rgba(14,14,12,0.02)',fontSize:'0.52rem',letterSpacing:'0.1em',textTransform:'uppercase',color:gray}}>Reward History</div>
                  {rewardCard.rewards.map((r,i)=>(
                    <div key={r.id||i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.75rem 1rem',borderTop:`1px solid ${modalDivider}`}}>
                      <div>
                        <div style={{fontSize:'0.75rem',color:modalInk,fontWeight:500}}>{r.reward_type}</div>
                        <div style={{fontSize:'0.6rem',color:modalGray,marginTop:'0.1rem'}}>
                          {r.redeemed_at?new Date(r.redeemed_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):r.created_at?new Date(r.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'—'}
                          {r.reward_cost&&' · '+r.reward_cost}
                        </div>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                        <span style={{fontSize:'0.56rem',padding:'0.18rem 0.55rem',borderRadius:20,background:'rgba(45,138,96,0.1)',color:'#2d8a60'}}>{r.status}</span>
                        <button onClick={async()=>{await fetch('/api/admin/rewards',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:r.id})});showToast('Reward deleted');loadAll();setRewardCard(c=>({...c,rewards:c.rewards.filter(x=>x.id!==r.id)}))}} style={{background:'none',border:'none',cursor:'pointer',color:'rgba(192,57,43,0.4)',fontSize:'0.75rem',padding:0}}>x</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {(!rewardCard.rewards||rewardCard.rewards.length===0)&&<p style={{fontSize:'0.72rem',color:modalGray,marginBottom:'1.5rem'}}>No rewards yet.</p>}

              {/* Register new reward */}
              <div style={{fontSize:'0.52rem',letterSpacing:'0.14em',textTransform:'uppercase',color:gold,marginBottom:'1rem'}}>Register New Reward</div>
              <label style={lbl}>Reward Type</label>
              <select value={form.reward_type||'1 Free Month'} onChange={e=>upd('reward_type',e.target.value)} style={inp}>
                {['1 Free Month','50% Discount','Extra Service','Other'].map(t=><option key={t}>{t}</option>)}
              </select>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginBottom:'1rem'}}>
                <div><label style={lbl}>Cost (optional)</label><input style={{...inp,marginBottom:0}} type="text" placeholder="$0.00" value={form.reward_cost||''} onChange={e=>upd('reward_cost',e.target.value)}/></div>
                <div><label style={lbl}>Date</label><input style={{...inp,marginBottom:0}} type="date" value={form.reward_date||new Date().toISOString().split('T')[0]} onChange={e=>upd('reward_date',e.target.value)}/></div>
              </div>
              <button onClick={async()=>{
                const res=await fetch('/api/admin/rewards',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({card_id:rewardCard.id,user_id:rewardCard.user_id,reward_type:form.reward_type||'1 Free Month',reward_cost:form.reward_cost,notes:form.reward_notes})})
                if(res.ok){
                  showToast('Reward registered')
                  await fetch('/api/admin/activity-log',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'Registered reward',target:(form.reward_type||'1 Free Month')+' → '+(rewardCard.profiles?.business_name||rewardCard.profiles?.full_name||''),type:'reward'})})
                  setForm({})
                  // Refresh cards and update rewardCard in place
                  const updated=await fetch('/api/admin/cards').then(r=>r.json())
                  const updatedCard=(updated.cards||[]).find(c=>c.id===rewardCard.id)
                  if(updatedCard) setRewardCard(updatedCard)
                  setCards(updated.cards||[])
                }
              }} style={{width:'100%',background:black,color:white,border:'none',padding:'0.85rem',fontFamily:ff,fontSize:'0.66rem',letterSpacing:'0.14em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>Register Reward</button>
            </div>
          </div>
        )}

        {/* MODAL: Supply Add/Edit */}
        {supplyModal&&(
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:500,display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={e=>e.target===e.currentTarget&&setSupplyModal(null)}>
            <div style={{background:modalBg,borderRadius:'12px 12px 0 0',padding:'2rem',width:'100%',maxWidth:520,maxHeight:'90vh',overflowY:'auto'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
                <h3 style={{fontFamily:ffS,fontSize:'1.5rem',fontWeight:300,color:modalInk}}>{supplyModal==='add'?'Add Supply':'Edit Supply'}</h3>
                <button onClick={()=>setSupplyModal(null)} style={{background:'none',border:'none',fontSize:'1.1rem',cursor:'pointer',color:modalGray}}>x</button>
              </div>
              <label style={lbl}>Name</label>
              <input style={inp} type="text" placeholder="e.g. Vercel Pro" value={supplyForm.name} onChange={e=>setSupplyForm(f=>({...f,name:e.target.value}))}/>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
                <div>
                  <label style={lbl}>Category</label>
                  <input style={{...inp,marginBottom:0}} type="text" placeholder="Hosting, Software..." value={supplyForm.category} onChange={e=>setSupplyForm(f=>({...f,category:e.target.value}))}/>
                </div>
                <div>
                  <label style={lbl}>Provider</label>
                  <input style={{...inp,marginBottom:0}} type="text" placeholder="Vercel, GoDaddy..." value={supplyForm.provider} onChange={e=>setSupplyForm(f=>({...f,provider:e.target.value}))}/>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem',marginTop:'1rem'}}>
                <div>
                  <label style={lbl}>Cost ($)</label>
                  <input style={{...inp,marginBottom:0}} type="number" step="0.01" placeholder="0.00" value={supplyForm.cost} onChange={e=>setSupplyForm(f=>({...f,cost:e.target.value}))}/>
                </div>
                <div>
                  <label style={lbl}>Billing</label>
                  <select style={{...inp,marginBottom:0}} value={supplyForm.unit} onChange={e=>setSupplyForm(f=>({...f,unit:e.target.value}))}>
                    <option value="month">Monthly</option>
                    <option value="year">Yearly</option>
                    <option value="one-time">One-time</option>
                  </select>
                </div>
              </div>
              <div style={{marginTop:'1rem'}}>
                <label style={lbl}>Renewal Date (optional)</label>
                <input style={inp} type="date" value={supplyForm.renewal_date} onChange={e=>setSupplyForm(f=>({...f,renewal_date:e.target.value}))}/>
              </div>
              <label style={lbl}>Notes (optional)</label>
              <input style={inp} type="text" placeholder="Any additional info..." value={supplyForm.notes} onChange={e=>setSupplyForm(f=>({...f,notes:e.target.value}))}/>
              <div style={{display:'flex',gap:'0.75rem'}}>
                <button onClick={async()=>{
                  if(!supplyForm.name||!supplyForm.cost){showToast('Name and cost required');return}
                  if(supplyModal==='add'){
                    await fetch('/api/admin/supplies',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(supplyForm)})
                    showToast('Supply added')
                  } else {
                    await fetch('/api/admin/supplies',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:supplyModal.id,...supplyForm})})
                    showToast('Supply updated')
                  }
                  setSupplyModal(null);loadAll()
                }} style={{flex:1,background:black,color:white,border:'none',padding:'0.85rem',fontFamily:ff,fontSize:'0.66rem',letterSpacing:'0.14em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>Save</button>
                <button onClick={()=>setSupplyModal(null)} style={{background:'rgba(14,14,12,0.06)',color:black,border:'none',padding:'0.85rem 1.25rem',fontFamily:ff,fontSize:'0.66rem',letterSpacing:'0.14em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>Cancel</button>
              </div>
            </div>
          </div>
        )}

      {toast&&(
        <div style={{position:'fixed',bottom:'5.5rem',right:'1.25rem',background:ink,color:white,padding:'0.85rem 1.25rem',borderRadius:10,fontSize:'0.74rem',fontFamily:ff,lineHeight:1.5,borderLeft:'3px solid '+gold,zIndex:9999,maxWidth:300,boxShadow:'0 8px 32px rgba(0,0,0,0.22)',backdropFilter:'blur(8px)',animation:'slideIn 0.2s ease'}}>
          <style>{`@keyframes slideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
          {toast}
        </div>
      )}
    </>
    </DarkCtx.Provider>
  )
}

function ClientHistory({ client }) {
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    fetch('/api/admin/sales?email='+encodeURIComponent(client.email||client.user_email||''))
      .then(r=>r.json())
      .then(d=>{ setSales(d.sales||[]); setLoading(false) })
      .catch(()=>setLoading(false))
  },[client.id])

  const total = sales.filter(s=>s.status==='paid').reduce((a,s)=>a+parseFloat(s.amount||0),0)

  return(
    <div style={{display:'flex',flexDirection:'column',flex:1,minHeight:0}}>
      {/* Scrollable list */}
      <div style={{flex:1,overflowY:'auto',padding:'0 1.5rem'}}>
        {loading&&<div style={{textAlign:'center',color:'#6b6b67',fontSize:'0.78rem',padding:'2rem'}}>Loading...</div>}
        {!loading&&sales.length===0&&<div style={{textAlign:'center',color:'#6b6b67',fontSize:'0.78rem',padding:'2rem'}}>No transactions found.</div>}
        {!loading&&sales.length>0&&(
          <div style={{border:'1px solid rgba(14,14,12,0.07)',borderRadius:8,overflow:'hidden'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 120px 100px',padding:'0.5rem 1rem',background:'rgba(14,14,12,0.03)',fontSize:'0.52rem',letterSpacing:'0.1em',textTransform:'uppercase',color:'#6b6b67',gap:'0.5rem'}}>
              <span>Transaction ID</span><span>Date</span><span style={{textAlign:'right'}}>Amount</span>
            </div>
            {sales.map((s,i)=>(
              <div key={s.id} style={{display:'grid',gridTemplateColumns:'1fr 120px 100px',padding:'0.75rem 1rem',borderTop:'1px solid rgba(14,14,12,0.05)',alignItems:'center',gap:'0.5rem'}}>
                <div style={{fontSize:'0.62rem',color:'#6b6b67',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:'monospace'}}>{s.id}</div>
                <div style={{fontSize:'0.68rem',color:'#0e0e0c'}}>{new Date(s.sale_date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</div>
                <div style={{fontSize:'0.75rem',fontWeight:600,color:s.status==='paid'?'#2d8a60':'#c0392b',textAlign:'right'}}>{s.status==='refunded'?'-':''}${Math.abs(parseFloat(s.amount||0)).toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Total — always visible at bottom */}
      <div style={{padding:'1rem 1.5rem 1.5rem',borderTop:'1px solid rgba(14,14,12,0.07)',flexShrink:0,display:'flex',justifyContent:'space-between',alignItems:'center',background:'#f8f6f1'}}>
        <span style={{fontSize:'0.62rem',color:'#6b6b67',letterSpacing:'0.1em',textTransform:'uppercase'}}>{sales.filter(s=>s.status==='paid').length} payment{sales.filter(s=>s.status==='paid').length!==1?'s':''}</span>
        <div style={{textAlign:'right'}}>
          <div style={{fontSize:'0.56rem',color:'#6b6b67',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:'0.15rem'}}>Total Spent</div>
          <div style={{fontSize:'1.1rem',fontFamily:'Cormorant Garamond,serif',fontWeight:300,color:'#0e0e0c'}}>${total.toFixed(2)}</div>
        </div>
      </div>
    </div>
  )
}

function FilesListForClient({ userId, showToast }) {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{ loadFiles() },[userId])

  async function loadFiles() {
    setLoading(true)
    const res = await fetch('/api/admin/files?user_id='+userId)
    const data = await res.json()
    setFiles(data.files||[])
    setLoading(false)
  }

  async function deleteFile(path) {
    await fetch('/api/admin/files', { method:'DELETE', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ path }) })
    showToast('File deleted')
    loadFiles()
  }

  async function viewFile(name) {
    window.open('/api/admin/files?user_id='+userId+'&file='+encodeURIComponent(name),'_blank')
  }

  if(loading) return <div style={{textAlign:'center',color:'#6b6b67',fontSize:'0.78rem',padding:'1rem 0'}}>Loading...</div>
  if(files.length===0) return <div style={{textAlign:'center',color:'#6b6b67',fontSize:'0.78rem',padding:'1rem 0'}}>No files saved yet.</div>

  return(
    <div>
      <div style={{fontSize:'0.56rem',letterSpacing:'0.13em',textTransform:'uppercase',color:'#6b6b67',marginBottom:'0.75rem'}}>Saved files</div>
      {files.map(f=>(<div key={f.name} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0.75rem 0',borderBottom:'1px solid rgba(14,14,12,0.06)'}}><div style={{fontSize:'0.78rem',color:'#0e0e0c',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1,marginRight:'1rem'}}>{f.name.replace(/^\d+_/,'')}</div><div style={{display:'flex',gap:'0.4rem',flexShrink:0}}><button onClick={()=>viewFile(f.name)} style={{padding:'0.3rem 0.65rem',background:'rgba(184,151,90,0.1)',color:'#b8975a',border:'1px solid rgba(184,151,90,0.25)',borderRadius:3,cursor:'pointer',fontFamily:'DM Sans,sans-serif',fontSize:'0.56rem',textTransform:'uppercase'}}>View</button><button onClick={()=>deleteFile('clients/'+userId+'/'+f.name)} style={{padding:'0.3rem 0.65rem',background:'rgba(192,57,43,0.08)',color:'#a93226',border:'none',borderRadius:3,cursor:'pointer',fontFamily:'DM Sans,sans-serif',fontSize:'0.56rem',textTransform:'uppercase'}}>x</button></div></div>))}
    </div>
  )
}
                                                                            