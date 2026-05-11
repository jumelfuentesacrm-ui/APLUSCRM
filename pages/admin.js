import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const gold='#b8975a',black='#0e0e0c',white='#f8f6f1',gray='#6b6b67',gl='#e8e5de',ink='#1c1c1a'
const ff='DM Sans,sans-serif'
const ffS='Cormorant Garamond,serif'

function CampaignsPanel({ cards, users }) {
  const ff='DM Sans,sans-serif', ffS='Cormorant Garamond,serif'
  const gold='#b8975a', black='#0e0e0c', white='#f8f6f1', gray='#6b6b67', gl='#e8e5de'

  const [selectedGroup, setSelectedGroup] = useState(null)
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  function classifyClient(card) {
    if (!card.stamp_history || card.stamp_history.length === 0) return 'nuevos'
    const stamps = card.stamps || 0
    const cycles = Math.floor(stamps / 5)
    const last = new Date(card.stamp_history[card.stamp_history.length-1].created_at)
    const days = (Date.now() - last) / (1000*60*60*24)
    if (days > 60) return 'perdidos'
    if (card.stamp_history.length === 1) return 'nuevos'
    if (cycles >= 2) return 'vip'
    if (cycles >= 1) return 'regulares'
    return 'espontaneos'
  }

  const groups = {
    vip:         { label:'VIP',         desc:'2+ ciclos completados',           color:'#b8975a', bg:'rgba(184,151,90,0.1)',   cards: cards.filter(c=>classifyClient(c)==='vip') },
    regulares:   { label:'Regulares',   desc:'1 ciclo completo, activos',        color:'#2d8a60', bg:'rgba(45,138,96,0.1)',    cards: cards.filter(c=>classifyClient(c)==='regulares') },
    espontaneos: { label:'Espontaneos', desc:'Activos, sin ciclo completo',      color:'#3498db', bg:'rgba(52,152,219,0.1)',   cards: cards.filter(c=>classifyClient(c)==='espontaneos') },
    nuevos:      { label:'Nuevos',      desc:'Solo 1 pago registrado',           color:'#8e44ad', bg:'rgba(142,68,173,0.1)',   cards: cards.filter(c=>classifyClient(c)==='nuevos') },
    perdidos:    { label:'Perdidos',    desc:'Sin actividad en mas de 60 dias',  color:'#c0392b', bg:'rgba(192,57,43,0.1)',    cards: cards.filter(c=>classifyClient(c)==='perdidos') },
  }

  const defaultMessages = {
    vip:         'Hola [nombre], como cliente VIP de [negocio] queremos agradecerte tu lealtad. Tienes un beneficio especial esperandote. Contactanos pronto!',
    regulares:   'Hola [nombre], gracias por ser un cliente regular de [negocio]. Recuerda que cada pago a tiempo te acerca a tu proximo premio. Nos vemos pronto!',
    espontaneos: 'Hola [nombre], te echamos de menos en [negocio]. Recuerda que tienes sellos acumulados en tu tarjeta de lealtad. No los dejes perder!',
    nuevos:      'Hola [nombre], bienvenido a [negocio]! Acabas de comenzar tu camino hacia premios exclusivos con tu tarjeta de lealtad digital. Gracias por tu primer pago!',
    perdidos:    'Hola [nombre], hace tiempo que no sabemos de ti en [negocio]. Te extrannamos y tenemos algo especial para que regreses. Contactanos!',
  }

  function selectGroup(key) {
    setSelectedGroup(key)
    setMessage(defaultMessages[key])
    setSent(false)
  }

  const group = selectedGroup ? groups[selectedGroup] : null
  const recipients = group ? group.cards.filter(c => {
    const user = users.find(u => u.id === c.user_id)
    return user?.phone
  }) : []
  const noPhone = group ? group.cards.filter(c => {
    const user = users.find(u => u.id === c.user_id)
    return !user?.phone
  }) : []

  function sendViaWhatsApp() {
    if (!selectedGroup || !message) return
    recipients.forEach(card => {
      const user = users.find(u => u.id === card.user_id)
      if (!user?.phone) return
      const phone = user.phone.replace(/\D/g, '')
      const fullPhone = phone.startsWith('1') ? phone : '1'+phone
      const personalizedMsg = message
        .replace('[nombre]', user.full_name || user.business_name || '')
        .replace('[negocio]', user.business_name || user.full_name || '')
      const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(personalizedMsg)}`
      window.open(url, '_blank')
    })
    setSent(true)
  }

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
        <h2 style={{fontFamily:ffS,fontSize:'1.5rem',fontWeight:300}}>Campaigns WhatsApp</h2>
        <div style={{fontSize:'0.62rem',color:gray}}>{cards.length} clientes totales</div>
      </div>

      {/* Group selection */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:'0.75rem',marginBottom:'1.5rem'}}>
        {Object.entries(groups).map(([key, g]) => (
          <div key={key} onClick={()=>selectGroup(key)} style={{background:selectedGroup===key?g.color:white,borderRadius:10,padding:'1.1rem',border:'2px solid '+(selectedGroup===key?g.color:'rgba(14,14,12,0.07)'),cursor:'pointer',transition:'all 0.15s'}}>
            <div style={{fontSize:'1.4rem',marginBottom:'0.35rem'}}>
              {key==='vip'?'★':key==='regulares'?'↑':key==='espontaneos'?'~':key==='nuevos'?'+':'↓'}
            </div>
            <div style={{fontSize:'0.78rem',fontWeight:600,color:selectedGroup===key?white:black,marginBottom:'0.2rem'}}>{g.label}</div>
            <div style={{fontSize:'0.6rem',color:selectedGroup===key?'rgba(255,255,255,0.75)':gray,lineHeight:1.4}}>{g.desc}</div>
            <div style={{marginTop:'0.5rem',fontSize:'0.68rem',fontWeight:600,color:selectedGroup===key?white:g.color}}>{g.cards.length} clientes</div>
          </div>
        ))}
      </div>

      {selectedGroup && group && (
        <>
          {/* Recipients */}
          <div style={{background:white,borderRadius:10,border:'1px solid rgba(14,14,12,0.07)',padding:'1.25rem',marginBottom:'1rem'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.85rem'}}>
              <div style={{fontFamily:ffS,fontSize:'1rem',fontWeight:300}}>Destinatarios — {group.label}</div>
              <div style={{display:'flex',gap:'0.75rem',fontSize:'0.65rem'}}>
                <span style={{color:'#2d8a60'}}>{recipients.length} con telefono</span>
                {noPhone.length > 0 && <span style={{color:'#c0392b'}}>{noPhone.length} sin telefono</span>}
              </div>
            </div>
            <div style={{display:'flex',flexWrap:'wrap',gap:'0.4rem'}}>
              {group.cards.map(card => {
                const user = users.find(u => u.id === card.user_id)
                const hasPhone = !!user?.phone
                return (
                  <span key={card.id} style={{fontSize:'0.62rem',padding:'0.2rem 0.65rem',borderRadius:20,background:hasPhone?'rgba(45,138,96,0.1)':'rgba(192,57,43,0.06)',color:hasPhone?'#2d8a60':'#c0392b',border:'1px solid '+(hasPhone?'rgba(45,138,96,0.2)':'rgba(192,57,43,0.15)')}}>
                    {user?.business_name||user?.full_name||'Sin nombre'} {!hasPhone&&'(sin tel)'}
                  </span>
                )
              })}
              {group.cards.length === 0 && <span style={{fontSize:'0.78rem',color:gray}}>No hay clientes en este grupo.</span>}
            </div>
          </div>

          {/* Message */}
          <div style={{background:white,borderRadius:10,border:'1px solid rgba(14,14,12,0.07)',padding:'1.25rem',marginBottom:'1rem'}}>
            <div style={{fontFamily:ffS,fontSize:'1rem',fontWeight:300,marginBottom:'0.85rem'}}>Mensaje</div>
            <div style={{fontSize:'0.6rem',color:gray,marginBottom:'0.5rem'}}>Usa [nombre] y [negocio] para personalizar automaticamente</div>
            <textarea
              value={message}
              onChange={e=>setMessage(e.target.value)}
              rows={5}
              style={{width:'100%',padding:'0.85rem',border:'1px solid '+gl,borderRadius:3,fontFamily:ff,fontSize:'0.82rem',color:black,outline:'none',resize:'vertical',boxSizing:'border-box',lineHeight:1.6}}
            />
          </div>

          {/* Send */}
          {recipients.length > 0 ? (
            <div>
              {sent && <div style={{background:'rgba(45,138,96,0.08)',border:'1px solid rgba(45,138,96,0.2)',borderRadius:8,padding:'0.85rem 1.25rem',marginBottom:'0.85rem',fontSize:'0.78rem',color:'#2d8a60'}}>Se abrieron {recipients.length} conversaciones de WhatsApp. Revisa las pestanas del browser.</div>}
              <button onClick={sendViaWhatsApp} style={{width:'100%',background:black,color:white,border:'none',padding:'1rem',fontFamily:ff,fontSize:'0.68rem',letterSpacing:'0.14em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>
                Enviar via WhatsApp a {recipients.length} cliente{recipients.length!==1?'s':''}
              </button>
              {noPhone.length > 0 && <div style={{marginTop:'0.6rem',fontSize:'0.65rem',color:gray,textAlign:'center'}}>{noPhone.length} cliente{noPhone.length!==1?'s':''} sin numero de telefono registrado — no recibiran el mensaje</div>}
            </div>
          ) : (
            <div style={{background:'rgba(192,57,43,0.05)',border:'1px solid rgba(192,57,43,0.15)',borderRadius:8,padding:'1rem',textAlign:'center',fontSize:'0.78rem',color:'#c0392b'}}>
              Ningun cliente en este grupo tiene telefono registrado. Agrega telefonos en la seccion Clients.
            </div>
          )}
        </>
      )}

      {!selectedGroup && (
        <div style={{background:white,borderRadius:10,padding:'2rem',textAlign:'center',border:'1px solid rgba(14,14,12,0.07)',color:gray,fontSize:'0.82rem'}}>
          Selecciona un grupo arriba para ver los destinatarios y enviar el mensaje.
        </div>
      )}
    </div>
  )
}


function getStatus(card) {
  if (!card||!card.stamp_history||card.stamp_history.length===0) return { label:'Nuevo', color:'#3498db', bg:'rgba(52,152,219,0.1)' }
  const last = new Date(card.stamp_history[card.stamp_history.length-1].created_at)
  const days = (Date.now()-last)/(1000*60*60*24)
  if (days<=35) return { label:'Activo', color:'#2d8a60', bg:'rgba(45,138,96,0.1)' }
  if (days<=60) return { label:'En Riesgo', color:gold, bg:'rgba(184,151,90,0.1)' }
  return { label:'Inactivo', color:'#c0392b', bg:'rgba(192,57,43,0.1)' }
}

function DashboardPanel({ cards, onSelectClient }) {
  const totalClients=cards.length
  const activeClients=cards.filter(c=>getStatus(c).label==='Activo').length
  const atRisk=cards.filter(c=>getStatus(c).label==='En Riesgo').length
  const inactive=cards.filter(c=>getStatus(c).label==='Inactivo').length
  const newClients=totalClients-activeClients-atRisk-inactive
  const sorted=[...cards].sort((a,b)=>(b.stamps||0)-(a.stamps||0))
  const top5=sorted.slice(0,5)
  const maxStamps=top5[0]?.stamps||1
  const financial={gross_sales:0,gross_expenses:0,net_profit:0}

  const clientDonut=[
    {label:'Activos',value:activeClients,color:'#2d8a60'},
    {label:'En Riesgo',value:atRisk,color:gold},
    {label:'Inactivos',value:inactive,color:'#c0392b'},
    {label:'Nuevos',value:newClients,color:'#3498db'},
  ].filter(d=>d.value>0)

  const finDonut=[
    {label:'Gastos',value:financial.gross_expenses||0,color:'#c0392b'},
    {label:'Ganancia',value:Math.max(financial.net_profit,0)||0,color:'#2d8a60'},
    {label:'Sin datos',value:financial.gross_sales===0?1:0,color:'rgba(14,14,12,0.08)'},
  ].filter(d=>d.value>0)

  function makeSegs(data) {
    const total=data.reduce((a,d)=>a+d.value,0)||1
    let cum=0
    return data.map(d=>{const s=cum;cum+=d.value/total;return{...d,start:s,pct:d.value/total}})
  }
  function polar(pct){const a=pct*2*Math.PI-Math.PI/2;return{x:50+35*Math.cos(a),y:50+35*Math.sin(a)}}
  function arc(start,pct){
    if(pct>=1)return'M 50 15 A 35 35 0 1 1 49.99 15 Z'
    const s=polar(start),e=polar(start+pct),lg=pct>0.5?1:0
    return`M 50 50 L ${s.x} ${s.y} A 35 35 0 ${lg} 1 ${e.x} ${e.y} Z`
  }
  function Donut({segs,center}){
    return(
      <svg viewBox="0 0 100 100" style={{width:100,height:100,flexShrink:0}}>
        {segs.map((d,i)=><path key={i} d={arc(d.start,d.pct)} fill={d.color} opacity={0.85}/>)}
        <circle cx="50" cy="50" r="22" fill={white}/>
        {center}
      </svg>
    )
  }
  const clientSegs=makeSegs(clientDonut)
  const finSegs=makeSegs(finDonut)

  return(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem',marginBottom:'1.5rem'}} className='donut-grid'>
        <div style={{background:white,borderRadius:10,padding:'1.5rem',border:'1px solid rgba(14,14,12,0.07)'}}>
          <div style={{fontFamily:ffS,fontSize:'1.1rem',fontWeight:300,marginBottom:'1.25rem'}}>Clientes</div>
          <div style={{display:'flex',alignItems:'center',gap:'1rem'}}>
            <Donut segs={clientSegs} center={<text x="50" y="54" textAnchor="middle" style={{fontSize:14,fontFamily:ffS,fill:black}}>{totalClients}</text>}/>
            <div style={{flex:1}}>
              {clientDonut.map(d=>(
                <div key={d.label} style={{display:'flex',alignItems:'center',gap:'0.4rem',marginBottom:'0.4rem'}}>
                  <div style={{width:7,height:7,borderRadius:'50%',background:d.color,flexShrink:0}}/>
                  <span style={{fontSize:'0.62rem',color:gray,flex:1}}>{d.label}</span>
                  <span style={{fontSize:'0.62rem',fontWeight:500,color:black}}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{background:white,borderRadius:10,padding:'1.5rem',border:'1px solid rgba(14,14,12,0.07)',position:'relative'}}>
          <div style={{fontFamily:ffS,fontSize:'1.1rem',fontWeight:300,marginBottom:'1.25rem'}}>Financiero</div>
          <div style={{display:'flex',alignItems:'center',gap:'1rem'}}>
            <Donut segs={finSegs} center={<text x="50" y="54" textAnchor="middle" style={{fontSize:8,fontFamily:ff,fill:gray}}>Clover</text>}/>
            <div style={{flex:1}}>
              {[['Gross Sales','#2d8a60',financial.gross_sales],['Gross Exp.','#c0392b',financial.gross_expenses],['Net Profit',gold,financial.net_profit]].map(([label,color,val])=>(
                <div key={label} style={{display:'flex',alignItems:'center',gap:'0.4rem',marginBottom:'0.4rem'}}>
                  <div style={{width:7,height:7,borderRadius:'50%',background:color,flexShrink:0}}/>
                  <span style={{fontSize:'0.62rem',color:gray,flex:1}}>{label}</span>
                  <span style={{fontSize:'0.62rem',fontWeight:500,color:'rgba(14,14,12,0.25)'}}>—</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{position:'absolute',bottom:'1rem',left:0,right:0,textAlign:'center',fontSize:'0.54rem',color:'rgba(14,14,12,0.3)',letterSpacing:'0.1em',textTransform:'uppercase'}}>Pendiente datos Clover</div>
        </div>
      </div>
      <div style={{background:white,borderRadius:10,padding:'1.5rem',border:'1px solid rgba(14,14,12,0.07)',marginBottom:'1.5rem'}}>
        <div style={{fontFamily:ffS,fontSize:'1.1rem',fontWeight:300,marginBottom:'1.25rem'}}>Top Clientes</div>
        {top5.map((card,i)=>(
          <div key={card.id} onClick={()=>onSelectClient(card)} style={{display:'flex',alignItems:'center',gap:'0.6rem',marginBottom:'0.75rem',cursor:'pointer'}}>
            <div style={{width:18,height:18,borderRadius:'50%',background:i===0?gold:'rgba(14,14,12,0.06)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.58rem',fontWeight:600,color:i===0?black:gray,flexShrink:0}}>{i+1}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:'0.72rem',color:black,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{card.profiles?.business_name||card.profiles?.full_name}</div>
              <div style={{height:3,background:'rgba(14,14,12,0.06)',borderRadius:2,marginTop:'0.25rem'}}>
                <div style={{height:'100%',width:((card.stamps||0)/maxStamps*100)+'%',background:i===0?gold:'rgba(14,14,12,0.15)',borderRadius:2}}/>
              </div>
            </div>
            <div style={{fontSize:'0.65rem',color:gray,flexShrink:0}}>{card.stamps} sellos</div>
          </div>
        ))}
        {top5.length===0&&<div style={{fontSize:'0.82rem',color:gray,textAlign:'center',padding:'1rem 0'}}>Sin clientes aun.</div>}
      </div>
      <div style={{background:white,borderRadius:10,border:'1px solid rgba(14,14,12,0.07)',overflow:'hidden'}}>
        <div style={{padding:'1rem 1.25rem',borderBottom:'1px solid rgba(14,14,12,0.06)',fontFamily:ffS,fontSize:'1.1rem',fontWeight:300}}>Todos los Clientes</div>
        {sorted.map(card=>{
          const status=getStatus(card)
          const cur=card.stamps%5===0&&card.stamps>0?5:card.stamps%5
          return(
            <div key={card.id} onClick={()=>onSelectClient(card)} style={{display:'flex',alignItems:'center',gap:'0.75rem',padding:'0.85rem 1.25rem',borderBottom:'1px solid rgba(14,14,12,0.04)',cursor:'pointer'}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:'0.78rem',color:black,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{card.profiles?.business_name||card.profiles?.full_name}</div>
                <div style={{fontSize:'0.62rem',color:gray,marginTop:'0.1rem'}}>#{card.card_number}</div>
              </div>
              <div style={{display:'flex',gap:2,flexShrink:0}}>{Array.from({length:5},(_,j)=><div key={j} style={{width:7,height:7,borderRadius:'50%',background:j<cur?gold:'rgba(14,14,12,0.08)'}}/>)}</div>
              <span style={{fontSize:'0.56rem',padding:'0.18rem 0.6rem',borderRadius:20,background:status.bg,color:status.color,whiteSpace:'nowrap',flexShrink:0}}>{status.label}</span>
              <div style={{color:gray,fontSize:'0.75rem'}}>›</div>
            </div>
          )
        })}
        {sorted.length===0&&<div style={{padding:'2rem',textAlign:'center',color:gray,fontSize:'0.82rem'}}>No hay clientes aun.</div>}
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
      <button onClick={onBack} style={{display:'flex',alignItems:'center',gap:'0.5rem',background:'none',border:'none',cursor:'pointer',color:gray,fontFamily:ff,fontSize:'0.65rem',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:'1.5rem',padding:0}}>← Volver al Dashboard</button>
      <div style={{background:black,borderRadius:12,padding:'1.75rem',marginBottom:'1.25rem',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 60% 50% at 0% 50%,rgba(184,151,90,0.08) 0%,transparent 70%)'}}/>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:'1rem',marginBottom:'1.25rem'}}>
          <div>
            <div style={{fontFamily:ffS,fontSize:'1.5rem',fontWeight:300,color:white,marginBottom:'0.2rem'}}>{card.profiles?.full_name}</div>
            <div style={{fontSize:'0.7rem',color:'rgba(255,255,255,0.4)'}}>{card.profiles?.business_name} · #{card.card_number}</div>
            {card.profiles?.phone&&<div style={{fontSize:'0.68rem',color:'rgba(255,255,255,0.35)',marginTop:'0.2rem'}}>{card.profiles?.phone}</div>}
          </div>
          <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>
            {[['Ciclo',cycle],['Sellos',cur+'/5'],['Pagos',totalPaid],['Premios',rewardsClaimed]].map(([label,val])=>(
              <div key={label} style={{textAlign:'center',background:'rgba(255,255,255,0.05)',borderRadius:8,padding:'0.6rem 0.85rem',border:'1px solid rgba(184,151,90,0.1)'}}>
                <div style={{fontFamily:ffS,fontSize:'1.2rem',fontWeight:300,color:gold,lineHeight:1}}>{val}</div>
                <div style={{fontSize:'0.5rem',letterSpacing:'0.1em',textTransform:'uppercase',color:'rgba(255,255,255,0.3)',marginTop:'0.2rem'}}>{label}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{display:'flex',gap:'0.4rem'}}>{Array.from({length:5},(_,i)=><div key={i} style={{flex:1,height:5,borderRadius:3,background:i<cur?gold:'rgba(255,255,255,0.08)'}}/>)}</div>
        <div style={{fontSize:'0.58rem',color:'rgba(255,255,255,0.3)',marginTop:'0.4rem'}}>{cur===0&&card.stamps>0?'Premio disponible':cur+'/5 sellos en ciclo actual'}</div>
      </div>
      <div style={{background:white,borderRadius:10,border:'1px solid rgba(14,14,12,0.07)',overflow:'hidden',marginBottom:'1rem'}}>
        <div style={{padding:'1rem 1.25rem',borderBottom:'1px solid rgba(14,14,12,0.06)',fontFamily:ffS,fontSize:'1.1rem',fontWeight:300}}>Historial de Pagos</div>
        {card.stamp_history?.length>0?[...card.stamp_history].reverse().map((h,i)=>(
          <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.85rem 1.25rem',borderBottom:'1px solid rgba(14,14,12,0.04)'}}>
            <div>
              <div style={{fontSize:'0.78rem',color:black}}>Pago registrado{h.payment_amount?' · '+h.payment_amount:''}</div>
              <div style={{fontSize:'0.62rem',color:gray,marginTop:'0.1rem'}}>{new Date(h.created_at).toLocaleDateString('es-PR',{day:'numeric',month:'long',year:'numeric'})}</div>
            </div>
            <span style={{fontSize:'0.58rem',padding:'0.2rem 0.65rem',borderRadius:20,background:'rgba(184,151,90,0.1)',color:gold,border:'1px solid rgba(184,151,90,0.2)'}}>+1 sello</span>
          </div>
        )):<div style={{padding:'1.5rem',textAlign:'center',color:gray,fontSize:'0.82rem'}}>Sin historial aun.</div>}
      </div>
      {card.rewards?.length>0&&(
        <div style={{background:white,borderRadius:10,border:'1px solid rgba(14,14,12,0.07)',overflow:'hidden'}}>
          <div style={{padding:'1rem 1.25rem',borderBottom:'1px solid rgba(14,14,12,0.06)',fontFamily:ffS,fontSize:'1.1rem',fontWeight:300}}>Premios</div>
          {card.rewards.map((r,i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.85rem 1.25rem',borderBottom:'1px solid rgba(14,14,12,0.04)'}}>
              <div>
                <div style={{fontSize:'0.78rem',color:black}}>{r.reward_type}</div>
                {r.reward_cost&&<div style={{fontSize:'0.65rem',color:gold,marginTop:'0.1rem'}}>{r.reward_cost}</div>}
              </div>
              <span style={{fontSize:'0.58rem',padding:'0.2rem 0.65rem',borderRadius:20,background:'rgba(45,138,96,0.1)',color:'#2d8a60'}}>{r.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ClientsPanel({users,cards,search,setSearch,onEdit,onAddPayment,onCreateCard,onCreateNew,onDelete}){
  const filtered=users.filter(u=>
    (u.full_name||'').toLowerCase().includes(search.toLowerCase())||
    (u.business_name||'').toLowerCase().includes(search.toLowerCase())
  )
  function getCard(uid){return cards.find(c=>c.user_id===uid)}
  function getClientStatus(uid){
    const card=getCard(uid)
    if(!card)return{label:'Sin Tarjeta',color:gray,bg:'rgba(14,14,12,0.06)'}
    return getStatus(card)
  }
  return(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.25rem'}}>
        <h2 style={{fontFamily:ffS,fontSize:'1.5rem',fontWeight:300}}>Clients</h2>
        <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
          <div style={{fontSize:'0.62rem',color:gray}}>{users.length} registrados</div>
          <button onClick={onCreateNew} style={{background:black,color:white,border:'none',padding:'0.6rem 1.1rem',fontFamily:ff,fontSize:'0.6rem',letterSpacing:'0.12em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>+ Nuevo</button>
        </div>
      </div>
      <input type="text" placeholder="Buscar por nombre o negocio..." value={search} onChange={e=>setSearch(e.target.value)}
        style={{width:'100%',padding:'0.7rem 1rem',border:'1px solid '+gl,borderRadius:3,fontFamily:ff,fontSize:'0.82rem',outline:'none',marginBottom:'1.25rem',boxSizing:'border-box',background:white}}/>
      <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
        {filtered.map(user=>{
          const card=getCard(user.id)
          const status=getClientStatus(user.id)
          const cur=card?(card.stamps%5===0&&card.stamps>0?5:card.stamps%5):0
          return(
            <div key={user.id} style={{background:white,borderRadius:10,border:'1px solid rgba(14,14,12,0.07)',overflow:'hidden'}}>
              <div style={{background:'linear-gradient(135deg,#1a1917,#252320)',padding:'1rem 1.25rem',color:white}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                  <div>
                    <div style={{fontFamily:ffS,fontSize:'1.05rem',marginBottom:'0.15rem'}}>{user.full_name}</div>
                    <div style={{fontSize:'0.68rem',color:'rgba(255,255,255,0.5)'}}>{user.business_name||'—'}</div>
                    {user.phone&&<div style={{fontSize:'0.65rem',color:'rgba(255,255,255,0.4)',marginTop:'0.1rem'}}>{user.phone}</div>}
                  </div>
                  <span style={{fontSize:'0.56rem',padding:'0.2rem 0.65rem',borderRadius:20,background:status.bg,color:status.color,whiteSpace:'nowrap'}}>{status.label}</span>
                </div>
                {card&&(
                  <div style={{display:'flex',gap:3,marginTop:'0.75rem',alignItems:'center'}}>
                    {Array.from({length:5},(_,i)=><div key={i} style={{width:11,height:11,borderRadius:'50%',border:'1px solid rgba(184,151,90,0.22)',background:i<cur?gold:'transparent'}}/>)}
                    <span style={{fontSize:'0.56rem',color:'rgba(184,151,90,0.7)',marginLeft:'0.4rem'}}>{cur}/5 · #{card.card_number}</span>
                  </div>
                )}
              </div>
              <div style={{padding:'0.85rem 1.25rem',display:'flex',gap:'0.5rem',flexWrap:'wrap',alignItems:'center'}}>
                <button onClick={()=>onEdit(user)} style={{padding:'0.45rem 0.85rem',background:'rgba(14,14,12,0.06)',color:black,border:'none',borderRadius:3,cursor:'pointer',fontFamily:ff,fontSize:'0.58rem',letterSpacing:'0.07em',textTransform:'uppercase'}}>Editar</button>
                {card
                  ?<button onClick={()=>onAddPayment(card)} style={{padding:'0.45rem 0.85rem',background:black,color:white,border:'none',borderRadius:3,cursor:'pointer',fontFamily:ff,fontSize:'0.58rem',letterSpacing:'0.07em',textTransform:'uppercase'}}>+ Pago</button>
                  :<button onClick={()=>onCreateCard(user.id)} style={{padding:'0.45rem 0.85rem',background:'rgba(184,151,90,0.1)',color:gold,border:'1px solid rgba(184,151,90,0.25)',borderRadius:3,cursor:'pointer',fontFamily:ff,fontSize:'0.58rem',letterSpacing:'0.07em',textTransform:'uppercase'}}>+ Tarjeta</button>
                }
                <button onClick={()=>onDelete(user.id)} style={{padding:'0.45rem 0.85rem',background:'rgba(192,57,43,0.08)',color:'#a93226',border:'none',borderRadius:3,cursor:'pointer',fontFamily:ff,fontSize:'0.58rem',letterSpacing:'0.07em',textTransform:'uppercase'}}>Borrar</button>
                {card&&card.stamp_history?.length>0&&(
                  <span style={{fontSize:'0.65rem',color:gray,marginLeft:'auto'}}>Ultimo pago: {new Date(card.stamp_history[card.stamp_history.length-1].created_at).toLocaleDateString('es-PR',{day:'numeric',month:'short',year:'numeric'})}</span>
                )}
              </div>
            </div>
          )
        })}
        {filtered.length===0&&<div style={{background:white,borderRadius:10,padding:'2rem',textAlign:'center',color:gray,fontSize:'0.82rem',border:'1px solid rgba(14,14,12,0.07)'}}>No se encontraron clientes.</div>}
      </div>
    </div>
  )
}

export default function Admin({session}){
  const [panel,setPanel]=useState('dashboard')
  const [cards,setCards]=useState([])
  const [users,setUsers]=useState([])
  const [rewards,setRewards]=useState([])
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

  useEffect(()=>{
    if(!session){window.location.href='/login';return}
    supabase.from('profiles').select('role').eq('id',session.user.id).single()
      .then(({data})=>{
        if(!data||data.role!=='admin'){window.location.href='/card';return}
        loadAll()
      })
  },[session])

  async function loadAll(){
    setLoading(true)
    const [c,u,r]=await Promise.all([
      fetch('/api/admin/cards').then(r=>r.json()),
      fetch('/api/admin/users').then(r=>r.json()),
      fetch('/api/admin/rewards').then(r=>r.json())
    ])
    setCards(c.cards||[]);setUsers(u.users||[]);setRewards(r.rewards||[])
    setLoading(false)
  }

  function showToast(msg){setToast(msg);setTimeout(()=>setToast(''),3200)}

  async function doPunch(){
    if(!punchId){showToast('Selecciona un cliente');return}
    const res=await fetch('/api/admin/punch',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({card_id:punchId,payment_amount:punchAmt})})
    const data=await res.json()
    if(res.ok){showToast(data.message);setPunchId('');setPunchAmt('');loadAll()}
    else showToast('Error: '+data.error)
  }

  async function createClient(){
    if(!form.new_email||!form.new_password){showToast('Email y password requeridos');return}
    const res=await fetch('/api/admin/users',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:form.new_email,password:form.new_password,full_name:form.new_name,business_name:form.new_business,phone:form.new_phone})})
    const data=await res.json()
    if(res.ok){showToast('Cliente creado');setForm(f=>({...f,new_email:'',new_password:'',new_name:'',new_business:'',new_phone:'',user_id:data.user.id}));loadAll()}
    else showToast('Error: '+data.error)
  }

  async function createCard(){
    if(!form.user_id){showToast('Selecciona un cliente');return}
    const res=await fetch('/api/admin/cards',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({user_id:form.user_id,notes:form.notes})})
    const data=await res.json()
    if(res.ok){showToast('Tarjeta creada');setModal(null);setForm({});loadAll()}
    else showToast('Error: '+data.error)
  }

  async function deleteCard(id){
    if(!confirm('Eliminar esta tarjeta?'))return
    await fetch('/api/admin/cards',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})})
    showToast('Tarjeta eliminada');loadAll()
  }

  async function saveReward(){
    const card=cards.find(c=>c.user_id===form.reward_user_id)
    if(!card){showToast('Usuario sin tarjeta activa');return}
    const res=await fetch('/api/admin/rewards',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({card_id:card.id,user_id:form.reward_user_id,reward_type:form.reward_type||'1 Mes Gratis',reward_cost:form.reward_cost,notes:form.reward_notes})})
    if(res.ok){showToast('Premio registrado');setModal(null);setForm({});loadAll()}
  }

  async function deleteReward(id){
    await fetch('/api/admin/rewards',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})})
    showToast('Premio eliminado');loadAll()
  }

  const signOut=async()=>{await supabase.auth.signOut();window.location.href='/login'}
  const upd=(k,v)=>setForm(f=>({...f,[k]:v}))
  const withReward=cards.filter(c=>c.stamps>0&&c.stamps%5===0).length
  const redeemed=rewards.filter(r=>r.status==='Canjeado').length
  const cardUrl=(card)=>`https://app.accountingpluscrm.com/c/${card?.card_number}`

  const inp={width:'100%',padding:'0.75rem 0.9rem',border:'1px solid '+gl,borderRadius:3,background:white,fontFamily:ff,fontSize:'0.88rem',outline:'none',color:black,marginBottom:'1rem',boxSizing:'border-box'}
  const lbl={fontSize:'0.56rem',letterSpacing:'0.13em',textTransform:'uppercase',color:gray,display:'block',marginBottom:'0.35rem'}

  if(loading)return<div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f2f0eb',fontFamily:ff,fontSize:'0.8rem',color:gray}}>Cargando panel...</div>

  return(
    <>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,400&family=DM+Sans:wght@300;400&display=swap" rel="stylesheet"/>
      <style>{`
        @media(max-width:700px){
          .admin-sidebar{display:none!important;}
          .admin-main{margin-left:0!important;padding:1rem!important;}
          .cards-grid{grid-template-columns:1fr!important;}
          .punch-row{grid-template-columns:1fr!important;}
          .mobile-nav{display:flex!important;}
          .donut-grid{grid-template-columns:1fr!important;}
        }
        html,body{background:#f2f0eb;overscroll-behavior:none;}
        .mobile-nav{display:none;position:fixed;bottom:0;left:0;right:0;background:${ink};z-index:200;border-top:1px solid rgba(184,151,90,0.15);}
        .mobile-nav button{flex:1;padding:0.75rem 0.1rem;background:none;border:none;color:rgba(255,255,255,0.4);font-family:${ff};font-size:0.65rem;letter-spacing:0.04em;text-transform:uppercase;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:0.2rem;}
        .mobile-nav button.active{color:${gold};}
        .mobile-nav button span{font-size:1rem;}
      `}</style>

      <div style={{background:'#f2f0eb',minHeight:'100vh',fontFamily:ff,paddingBottom:70}}>
        <div style={{background:black,position:'fixed',top:0,left:0,right:0,zIndex:100,height:52,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 1.25rem'}}>
          <div style={{fontFamily:ffS,fontSize:'1.1rem',color:white}}>A<span style={{color:gold,fontStyle:'italic'}}>+</span> CRM <span style={{fontSize:'0.48rem',letterSpacing:'0.14em',textTransform:'uppercase',color:'rgba(255,255,255,0.26)',marginLeft:'0.4rem',fontFamily:ff}}>Admin</span></div>
          <button onClick={signOut} style={{background:'none',border:'1px solid rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.38)',padding:'0.25rem 0.75rem',fontSize:'0.52rem',letterSpacing:'0.1em',textTransform:'uppercase',cursor:'pointer',borderRadius:2,fontFamily:ff}}>Salir</button>
        </div>

        <div style={{display:'flex',paddingTop:52,minHeight:'100vh'}}>
          {/* SIDEBAR */}
          <div className="admin-sidebar" style={{width:205,background:ink,flexShrink:0,position:'fixed',top:52,left:0,bottom:0,padding:'1.5rem 0',overflowY:'auto'}}>
            <button onClick={()=>setPanel('dashboard')} style={{display:'flex',alignItems:'center',gap:'0.65rem',padding:'0.82rem 1.5rem',fontSize:'0.72rem',letterSpacing:'0.1em',textTransform:'uppercase',color:panel==='dashboard'?gold:'rgba(255,255,255,0.32)',cursor:'pointer',background:'none',border:'none',borderLeft:panel==='dashboard'?'2px solid '+gold:'2px solid transparent',width:'100%',textAlign:'left',fontFamily:ff}}>
              <span></span>Dashboard
            </button>
            <div>
              <button onClick={()=>setLoyaltyOpen(o=>!o)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0.82rem 1.5rem',fontSize:'0.72rem',letterSpacing:'0.1em',textTransform:'uppercase',color:['cards','punch','rewards'].includes(panel)?gold:'rgba(255,255,255,0.45)',cursor:'pointer',background:'none',border:'none',width:'100%',textAlign:'left',fontFamily:ff}}>
                <span style={{display:'flex',alignItems:'center',gap:'0.65rem'}}><span></span>Loyalty Program</span>
                <span style={{fontSize:'0.6rem',display:'inline-block',transform:loyaltyOpen?'rotate(180deg)':'rotate(0deg)',transition:'transform 0.2s'}}>▾</span>
              </button>
              {loyaltyOpen&&(
                <div style={{background:'rgba(0,0,0,0.15)'}}>
                  {[['cards','','Tarjetas'],['punch','','Ponchar'],['rewards','','Premios']].map(([id,icon,label])=>(
                    <button key={id} onClick={()=>setPanel(id)} style={{display:'flex',alignItems:'center',gap:'0.6rem',padding:'0.68rem 1.5rem 0.68rem 2.25rem',fontSize:'0.70rem',letterSpacing:'0.1em',textTransform:'uppercase',color:panel===id?gold:'rgba(255,255,255,0.28)',cursor:'pointer',background:'none',border:'none',borderLeft:panel===id?'2px solid '+gold:'2px solid transparent',width:'100%',textAlign:'left',fontFamily:ff}}>
                      <span style={{fontSize:'0.82rem'}}>{icon}</span>{label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={()=>setPanel('clients')} style={{display:'flex',alignItems:'center',gap:'0.65rem',padding:'0.82rem 1.5rem',fontSize:'0.72rem',letterSpacing:'0.1em',textTransform:'uppercase',color:panel==='clients'?gold:'rgba(255,255,255,0.32)',cursor:'pointer',background:'none',border:'none',borderLeft:panel==='clients'?'2px solid '+gold:'2px solid transparent',width:'100%',textAlign:'left',fontFamily:ff}}>
              <span></span>Clients
            </button>
          </div>

          {/* MAIN */}
          <div className="admin-main" style={{marginLeft:205,flex:1,padding:'1.75rem',maxWidth:980}}>
            {panel==='dashboard'&&<DashboardPanel cards={cards} onSelectClient={(card)=>{setSelectedClient(card);setPanel('client')}}/>}
            {panel==='client'&&selectedClient&&<ClientProfile card={selectedClient} onBack={()=>{setSelectedClient(null);setPanel('dashboard')}}/>}

            {panel==='campaigns'&&<CampaignsPanel cards={cards} users={users}/>}
            {panel==='loyalty'&&(
              <div>
                <h2 style={{fontFamily:ffS,fontSize:'1.5rem',fontWeight:300,marginBottom:'1.5rem'}}>Loyalty Program</h2>
                <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
                  {[
                    ['cards','Tarjetas','Crear y gestionar tarjetas de lealtad'],
                    ['punch','Ponchar','Registrar pagos y sellos'],
                    ['rewards','Premios','Registrar y ver premios canjeados']
                  ].map(([id,label,desc])=>(
                    <div key={id} onClick={()=>setPanel(id)} style={{background:white,borderRadius:10,padding:'1.25rem 1.5rem',border:'1px solid rgba(14,14,12,0.07)',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <div>
                        <div style={{fontFamily:ffS,fontSize:'1.1rem',fontWeight:300,color:black,marginBottom:'0.2rem'}}>{label}</div>
                        <div style={{fontSize:'0.68rem',color:gray}}>{desc}</div>
                      </div>
                      <div style={{color:gold,fontSize:'1rem'}}>›</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {panel==='clients'&&<ClientsPanel
              users={users}
              cards={cards}
              search={clientSearch}
              setSearch={setClientSearch}
              onEdit={(u)=>{setEditingClient(u);setEditForm({name:u.full_name||'',business:u.business_name||'',phone:u.phone||'',email:'',password:''});setModal('editclient')}}
              onAddPayment={(card)=>{setPunchId(card.id);setPanel('punch')}}
              onCreateCard={(uid)=>{setForm({user_id:uid});setModal('card')}}
              onCreateNew={()=>{setForm({});setModal('card')}}
              onDelete={async(uid)=>{if(!confirm('Eliminar este cliente?'))return;await fetch('/api/admin/users',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:uid})});showToast('Cliente eliminado');loadAll()}}
            />}

            {panel==='cards'&&<>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
                <h2 style={{fontFamily:ffS,fontSize:'1.5rem',fontWeight:300}}>Tarjetas</h2>
                <button onClick={()=>setModal('card')} style={{background:black,color:white,border:'none',padding:'0.6rem 1.1rem',fontFamily:ff,fontSize:'0.6rem',letterSpacing:'0.12em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>+ Nueva</button>
              </div>
              <input type="text" placeholder="Buscar cliente..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:'100%',padding:'0.7rem 1rem',border:'1px solid '+gl,borderRadius:3,fontFamily:ff,fontSize:'0.82rem',outline:'none',marginBottom:'1.25rem',boxSizing:'border-box',background:white}}/>
              <div className="cards-grid" style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:'1rem'}}>
                {cards.filter(c=>(c.profiles?.full_name||'').toLowerCase().includes(search.toLowerCase())||(c.profiles?.business_name||'').toLowerCase().includes(search.toLowerCase())).map(card=>{
                  const cur=card.stamps%5===0&&card.stamps>0?5:card.stamps%5
                  const cycle=Math.ceil((card.stamps||1)/5)||1
                  const hasR=card.stamps>0&&card.stamps%5===0
                  return(
                    <div key={card.id} style={{background:white,borderRadius:10,border:'1px solid rgba(14,14,12,0.07)',overflow:'hidden'}}>
                      <div style={{background:'linear-gradient(135deg,#1a1917,#252320)',padding:'1rem',color:white}}>
                        <div style={{fontFamily:ffS,fontSize:'0.9rem',marginBottom:'0.15rem'}}>A<span style={{color:gold,fontStyle:'italic'}}>+</span> CRM</div>
                        <div style={{fontSize:'0.72rem',color:'rgba(255,255,255,0.8)',marginBottom:'0.65rem'}}>{card.profiles?.business_name||card.profiles?.full_name}</div>
                        <div style={{display:'flex',gap:3}}>{Array.from({length:5},(_,i)=><div key={i} style={{width:12,height:12,borderRadius:'50%',border:'1px solid rgba(184,151,90,0.22)',background:i<cur?gold:'transparent'}}/>)}</div>
                      </div>
                      <div style={{padding:'0.85rem 1rem'}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.5rem'}}>
                          <div style={{fontSize:'0.68rem',color:gray}}><strong style={{color:black}}>{cur}/5</strong> · Ciclo {cycle}</div>
                          <div style={{fontSize:'0.54rem',padding:'0.15rem 0.55rem',borderRadius:20,background:'rgba(184,151,90,0.1)',color:gold}}>{hasR?' Premio':'#'+card.card_number}</div>
                        </div>
                        <div style={{fontSize:'0.62rem',color:gray,marginBottom:'0.65rem'}}>{card.profiles?.full_name}</div>
                        <div style={{display:'flex',gap:'0.4rem'}}>
                          <button onClick={()=>{setPunchId(card.id);setPanel('punch')}} style={{flex:1,padding:'0.45rem',background:black,color:white,border:'none',borderRadius:3,cursor:'pointer',fontFamily:ff,fontSize:'0.56rem',letterSpacing:'0.07em',textTransform:'uppercase'}}>+ Sello</button>
                          <button onClick={()=>{setQrCard(card);setModal('qr')}} style={{flex:1,padding:'0.45rem',background:'rgba(184,151,90,0.1)',color:gold,border:'1px solid rgba(184,151,90,0.25)',borderRadius:3,cursor:'pointer',fontFamily:ff,fontSize:'0.56rem',letterSpacing:'0.07em',textTransform:'uppercase'}}>QR</button>
                          <button onClick={()=>deleteCard(card.id)} style={{flex:1,padding:'0.45rem',background:'rgba(192,57,43,0.08)',color:'#a93226',border:'none',borderRadius:3,cursor:'pointer',fontFamily:ff,fontSize:'0.56rem',letterSpacing:'0.07em',textTransform:'uppercase'}}>Borrar</button>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {cards.length===0&&<p style={{color:gray,fontSize:'0.85rem'}}>No hay tarjetas aun.</p>}
              </div>
            </>}

            {panel==='punch'&&<>
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
                {punchId&&(()=>{
                  const card=cards.find(c=>c.id===punchId)
                  const cur=card?(card.stamps%5===0&&card.stamps>0?5:card.stamps%5):0
                  return<div style={{background:'linear-gradient(135deg,#1a1917,#252320)',borderRadius:10,padding:'1.1rem',marginBottom:'1rem',border:'1px solid rgba(184,151,90,0.22)',color:white}}>
                    <div style={{fontFamily:ffS,fontSize:'1rem',marginBottom:'0.45rem'}}>A<span style={{color:gold,fontStyle:'italic'}}>+</span> CRM · {card?.profiles?.business_name||card?.profiles?.full_name}</div>
                    <div style={{display:'flex',gap:5}}>{Array.from({length:5},(_,i)=><div key={i} style={{width:15,height:15,borderRadius:'50%',border:'1.5px solid rgba(184,151,90,0.22)',background:i<cur?gold:i===cur?'rgba(184,151,90,0.35)':'transparent'}}/>)}</div>
                  </div>
                })()}
                <button onClick={doPunch} style={{width:'100%',background:black,color:white,border:'none',padding:'0.85rem',fontFamily:ff,fontSize:'0.66rem',letterSpacing:'0.14em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>Dar Sello</button>
              </div>
            </>}

            {panel==='rewards'&&<>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.25rem'}}>
                <h2 style={{fontFamily:ffS,fontSize:'1.5rem',fontWeight:300}}>Premios</h2>
                <button onClick={()=>setModal('reward')} style={{background:black,color:white,border:'none',padding:'0.6rem 1.1rem',fontFamily:ff,fontSize:'0.6rem',letterSpacing:'0.12em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>+ Registrar</button>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
                {rewards.length===0&&<div style={{background:white,borderRadius:10,padding:'2rem',textAlign:'center',color:gray,fontSize:'0.82rem',border:'1px solid rgba(14,14,12,0.07)'}}>Sin premios registrados.</div>}
                {rewards.map((r,i)=>(
                  <div key={r.id} style={{background:white,borderRadius:10,padding:'1.1rem 1.25rem',border:'1px solid rgba(14,14,12,0.07)',display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'1rem'}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:'0.78rem',fontWeight:500,color:black,marginBottom:'0.25rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.profiles?.business_name||r.profiles?.full_name}</div>
                      <div style={{fontSize:'0.72rem',color:gray,marginBottom:'0.25rem'}}>{r.reward_type}</div>
                      <div style={{display:'flex',gap:'0.75rem',alignItems:'center'}}>
                        <span style={{fontSize:'0.72rem',color:gold,fontWeight:500}}>{r.reward_cost||'—'}</span>
                        <span style={{fontSize:'0.65rem',color:gray}}>{r.redeemed_at?new Date(r.redeemed_at).toLocaleDateString('es-PR'):'—'}</span>
                      </div>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'0.5rem',flexShrink:0}}>
                      <span style={{fontSize:'0.58rem',padding:'0.2rem 0.65rem',borderRadius:20,background:'rgba(45,150,100,0.1)',color:'#2d8a60',whiteSpace:'nowrap'}}>{r.status}</span>
                      <button onClick={()=>deleteReward(r.id)} style={{background:'none',border:'none',cursor:'pointer',color:'rgba(192,57,43,0.5)',fontSize:'0.75rem',padding:0}}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </>}
          </div>
        </div>

        {/* MOBILE NAV */}
        <div className="mobile-nav">
          {[['dashboard','','Dashboard'],['loyalty','','Loyalty'],['clients','','Clients'],['campaigns','','Campaigns']].map(([id,icon,label])=>(
            <button key={id} onClick={()=>setPanel(id)} className={panel===id?'active':''}>
              <span>{icon}</span>{label}
            </button>
          ))}
        </div>

        {/* MODAL: Nueva Tarjeta */}
        {modal==='card'&&(
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:500,display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={e=>e.target===e.currentTarget&&setModal(null)}>
            <div style={{background:white,borderRadius:'12px 12px 0 0',padding:'2rem',width:'100%',maxWidth:520,maxHeight:'90vh',overflowY:'auto'}}>
              <h3 style={{fontFamily:ffS,fontSize:'1.5rem',fontWeight:300,marginBottom:'1.5rem'}}>Nueva Tarjeta</h3>
              <div style={{background:'rgba(184,151,90,0.05)',border:'1px solid rgba(184,151,90,0.2)',borderRadius:8,padding:'1.25rem',marginBottom:'1.25rem'}}>
                <div style={{fontSize:'0.58rem',letterSpacing:'0.14em',textTransform:'uppercase',color:gold,marginBottom:'1rem'}}>Crear Cliente Nuevo</div>
                <label style={lbl}>Nombre Completo</label>
                <input style={inp} type="text" placeholder="Nombre del cliente" value={form.new_name||''} onChange={e=>upd('new_name',e.target.value)}/>
                <label style={lbl}>Nombre del Negocio</label>
                <input style={inp} type="text" placeholder="Nombre del negocio" value={form.new_business||''} onChange={e=>upd('new_business',e.target.value)}/>
                <label style={lbl}>Telefono</label>
                <input style={inp} type="tel" placeholder="787-000-0000" value={form.new_phone||''} onChange={e=>upd('new_phone',e.target.value)}/>
                <label style={lbl}>Email</label>
                <input style={inp} type="email" placeholder="correo@negocio.com" value={form.new_email||''} onChange={e=>upd('new_email',e.target.value)}/>
                <label style={lbl}>Password temporal</label>
                <input style={{...inp,marginBottom:0}} type="text" placeholder="min. 6 caracteres" value={form.new_password||''} onChange={e=>upd('new_password',e.target.value)}/>
                <button onClick={createClient} style={{width:'100%',background:gold,color:white,border:'none',padding:'0.75rem',fontFamily:ff,fontSize:'0.62rem',letterSpacing:'0.12em',textTransform:'uppercase',borderRadius:3,cursor:'pointer',marginTop:'0.85rem'}}>Crear Cliente →</button>
              </div>
              <div style={{fontSize:'0.58rem',letterSpacing:'0.14em',textTransform:'uppercase',color:gray,marginBottom:'0.75rem',textAlign:'center'}}>— o selecciona uno existente —</div>
              <label style={lbl}>Cliente Existente</label>
              <select value={form.user_id||''} onChange={e=>upd('user_id',e.target.value)} style={inp}>
                <option value="">Seleccionar cliente</option>
                {users.map(u=><option key={u.id} value={u.id}>{u.business_name||u.full_name}</option>)}
              </select>
              <label style={lbl}>Notas (opcional)</label>
              <input style={inp} type="text" placeholder="Informacion adicional..." value={form.notes||''} onChange={e=>upd('notes',e.target.value)}/>
              <div style={{display:'flex',gap:'0.75rem'}}>
                <button onClick={createCard} style={{flex:1,background:black,color:white,border:'none',padding:'0.85rem',fontFamily:ff,fontSize:'0.66rem',letterSpacing:'0.14em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>Asignar Tarjeta</button>
                <button onClick={()=>setModal(null)} style={{background:'rgba(14,14,12,0.06)',color:black,border:'none',padding:'0.85rem 1.25rem',fontFamily:ff,fontSize:'0.66rem',letterSpacing:'0.14em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>Cancelar</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: QR */}
        {modal==='qr'&&qrCard&&(
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:'1.25rem'}} onClick={e=>e.target===e.currentTarget&&setModal(null)}>
            <div style={{background:white,borderRadius:12,padding:'2rem',width:'100%',maxWidth:360,textAlign:'center'}}>
              <h3 style={{fontFamily:ffS,fontSize:'1.5rem',fontWeight:300,marginBottom:'0.25rem'}}>Codigo QR</h3>
              <p style={{fontSize:'0.72rem',color:gray,marginBottom:'0.5rem'}}>{qrCard.profiles?.business_name||qrCard.profiles?.full_name}</p>
              <p style={{fontSize:'0.6rem',color:gray,marginBottom:'1.25rem'}}>#{qrCard.card_number}</p>
              <div style={{display:'flex',justifyContent:'center',marginBottom:'1.25rem'}}>
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(cardUrl(qrCard))}&color=0e0e0c&bgcolor=f8f6f1`} alt="QR" style={{borderRadius:8,border:'1px solid '+gl,padding:8,background:white}} width={200} height={200}/>
              </div>
              <p style={{fontSize:'0.58rem',color:gray,marginBottom:'1.25rem',wordBreak:'break-all',lineHeight:1.6}}>{cardUrl(qrCard)}</p>
              <div style={{display:'flex',gap:'0.75rem'}}>
                <button onClick={()=>window.open(cardUrl(qrCard),'_blank')} style={{flex:1,background:black,color:white,border:'none',padding:'0.85rem',fontFamily:ff,fontSize:'0.62rem',letterSpacing:'0.12em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>Abrir</button>
                <button onClick={()=>{navigator.clipboard.writeText(cardUrl(qrCard));showToast('Link copiado!')}} style={{flex:1,background:'rgba(184,151,90,0.1)',color:gold,border:'1px solid rgba(184,151,90,0.25)',padding:'0.85rem',fontFamily:ff,fontSize:'0.62rem',letterSpacing:'0.12em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>Copiar</button>
                <button onClick={()=>setModal(null)} style={{background:'rgba(14,14,12,0.06)',color:black,border:'none',padding:'0.85rem 0.75rem',fontFamily:ff,fontSize:'0.62rem',letterSpacing:'0.12em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>X</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: Editar Cliente */}
        {modal==='editclient'&&editingClient&&(
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:500,display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={e=>e.target===e.currentTarget&&setModal(null)}>
            <div style={{background:white,borderRadius:'12px 12px 0 0',padding:'2rem',width:'100%',maxWidth:520,maxHeight:'90vh',overflowY:'auto'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
                <h3 style={{fontFamily:ffS,fontSize:'1.5rem',fontWeight:300}}>Editar Cliente</h3>
                <button onClick={()=>setModal(null)} style={{background:'none',border:'none',fontSize:'1.1rem',cursor:'pointer',color:gray}}>✕</button>
              </div>
              <div style={{fontSize:'0.58rem',letterSpacing:'0.14em',textTransform:'uppercase',color:gold,marginBottom:'1rem'}}>Informacion Personal</div>
              <label style={lbl}>Nombre Completo</label>
              <input style={inp} type="text" value={editForm.name||''} onChange={e=>setEditForm(f=>({...f,name:e.target.value}))}/>
              <label style={lbl}>Nombre del Negocio</label>
              <input style={inp} type="text" value={editForm.business||''} onChange={e=>setEditForm(f=>({...f,business:e.target.value}))}/>
              <label style={lbl}>Telefono</label>
              <input style={inp} type="tel" value={editForm.phone||''} onChange={e=>setEditForm(f=>({...f,phone:e.target.value}))}/>
              <div style={{fontSize:'0.58rem',letterSpacing:'0.14em',textTransform:'uppercase',color:gold,marginBottom:'1rem'}}>Credenciales</div>
              <label style={lbl}>Nuevo Email (opcional)</label>
              <input style={inp} type="email" placeholder="Dejar vacio para no cambiar" value={editForm.email||''} onChange={e=>setEditForm(f=>({...f,email:e.target.value}))}/>
              <label style={lbl}>Nueva Contrasena (opcional)</label>
              <input style={inp} type="text" placeholder="Dejar vacio para no cambiar" value={editForm.password||''} onChange={e=>setEditForm(f=>({...f,password:e.target.value}))}/>
              <div style={{display:'flex',gap:'0.75rem'}}>
                <button onClick={async()=>{
                  await fetch('/api/admin/users',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:editingClient.id,full_name:editForm.name,business_name:editForm.business,phone:editForm.phone,email:editForm.email||null,password:editForm.password||null})})
                  showToast('Cliente actualizado');setModal(null);setEditingClient(null);loadAll()
                }} style={{flex:1,background:black,color:white,border:'none',padding:'0.85rem',fontFamily:ff,fontSize:'0.66rem',letterSpacing:'0.14em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>Guardar Cambios</button>
                <button onClick={()=>setModal(null)} style={{background:'rgba(14,14,12,0.06)',color:black,border:'none',padding:'0.85rem 1.25rem',fontFamily:ff,fontSize:'0.66rem',letterSpacing:'0.14em',textTransform:'uppercase',borderRadius:3,cursor:'pointer'}}>Cancelar</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: Premio */}
        {modal==='reward'&&(
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:500,display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={e=>e.target===e.currentTarget&&setModal(null)}>
            <div style={{background:white,borderRadius:'12px 12px 0 0',padding:'2rem',width:'100%',maxWidth:520,maxHeight:'90vh',overflowY:'auto'}}>
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

        {toast&&<div style={{position:'fixed',bottom:'5rem',right:'1rem',background:black,color:white,padding:'0.85rem 1.25rem',borderRadius:8,fontSize:'0.74rem',borderLeft:'3px solid '+gold,zIndex:9999,maxWidth:280}}>{toast}</div>}
      </div>
    </>
  )
}
