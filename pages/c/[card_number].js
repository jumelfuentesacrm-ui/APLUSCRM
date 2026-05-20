import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

const gold = '#b8975a'
const goldLight = '#d4b47a'
const black = '#0e0e0c'
const white = '#f8f6f1'
const gray = '#6b6b67'
const fontSans = 'DM Sans, sans-serif'
const fontSerif = 'Cormorant Garamond, serif'

export default function PublicCard() {
  const router = useRouter()
  const { card_number } = router.query
  const [card, setCard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!card_number) return
    fetch('/api/public/card?card_number=' + card_number)
      .then(r => r.json())
      .then(data => {
        if (data.card) setCard(data.card)
        else setError('Tarjeta no encontrada')
        setLoading(false)
      })
      .catch(() => { setError('Error al cargar la tarjeta'); setLoading(false) })
  }, [card_number])

  if (loading) return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#111110', fontFamily: fontSans
    }}>
      <div style={{ fontFamily: fontSerif, fontSize: '1.4rem', color: white, marginBottom: '0.5rem' }}>
        A<span style={{ color: gold, fontStyle: 'italic' }}>+</span> CRM
      </div>
      <div style={{ fontSize: '0.62rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>
        Cargando tarjeta...
      </div>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111110', fontFamily: fontSans }}>
      <div style={{ textAlign: 'center', color: white, padding: '2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎴</div>
        <div style={{ fontFamily: fontSerif, fontSize: '1.5rem', fontWeight: 300, marginBottom: '0.5rem' }}>
          Tarjeta no encontrada
        </div>
        <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.38)', lineHeight: 1.7 }}>
          Verifica el código QR e intenta de nuevo.
        </p>
      </div>
    </div>
  )

  const cur = card.stamps % 5 === 0 && card.stamps > 0 ? 5 : card.stamps % 5
  const cycle = Math.ceil((card.stamps || 1) / 5) || 1
  const rem = cur === 0 ? 5 : 5 - cur
  const hasReward = card.stamps > 0 && card.stamps % 5 === 0
  const progressPct = (cur / 5) * 100

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #111110; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        .card-anim { animation: fadeUp 0.55s cubic-bezier(0.22,1,0.36,1) both; }
        .card-anim:nth-child(2) { animation-delay: 0.07s; }
        .card-anim:nth-child(3) { animation-delay: 0.14s; }
        .card-anim:nth-child(4) { animation-delay: 0.21s; }
        .card-anim:nth-child(5) { animation-delay: 0.28s; }
        .stamp-filled {
          background: linear-gradient(135deg, ${gold}, ${goldLight});
          box-shadow: 0 2px 8px rgba(184,151,90,0.4);
        }
        .stamp-empty {
          border: 1.5px solid rgba(184,151,90,0.2);
          background: transparent;
        }
        .progress-bar {
          background: linear-gradient(90deg, ${gold}, ${goldLight});
          background-size: 200% 100%;
          animation: shimmer 2.5s linear infinite;
        }
      `}</style>

      <div style={{ background: '#111110', minHeight: '100vh', fontFamily: fontSans }}>

        {/* TOP BAR */}
        <div style={{
          background: 'rgba(14,14,12,0.9)', backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          height: 54, display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderBottom: '1px solid rgba(184,151,90,0.1)'
        }}>
          <div style={{ fontFamily: fontSerif, fontSize: '1.15rem', color: white }}>
            A<span style={{ color: gold, fontStyle: 'italic' }}>+</span> CRM
          </div>
        </div>

        {/* HERO */}
        <div style={{
          background: black, paddingTop: '6rem', paddingBottom: '3.5rem',
          textAlign: 'center', position: 'relative', overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(184,151,90,0.09) 0%, transparent 70%)',
            pointerEvents: 'none'
          }}/>
          <div style={{ position: 'relative' }}>
            <div style={{
              fontSize: '0.56rem', letterSpacing: '0.24em', textTransform: 'uppercase',
              color: gold, marginBottom: '0.75rem'
            }}>
              Tu Programa de Lealtad
            </div>
            <h1 style={{
              fontFamily: fontSerif, fontSize: 'clamp(1.8rem, 6vw, 2.8rem)',
              fontWeight: 300, color: white, marginBottom: '0.4rem', lineHeight: 1.1
            }}>
              {card.profiles?.full_name || 'Bienvenido'}
            </h1>
            {card.profiles?.business_name && (
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.2rem' }}>
                {card.profiles.business_name} · Cliente A+ CRM
              </div>
            )}
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ maxWidth: 440, margin: '0 auto', padding: '0 1.25rem', transform: 'translateY(-2rem)' }}>

          {/* LOYALTY CARD */}
          <div className="card-anim" style={{
            background: 'linear-gradient(145deg, #1c1a18 0%, #282420 50%, #1c1a18 100%)',
            borderRadius: 20, padding: '1.85rem',
            border: '1px solid rgba(184,151,90,0.3)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)',
            color: white, position: 'relative', overflow: 'hidden', marginBottom: '1.25rem'
          }}>
            {/* Card shine */}
            <div style={{
              position: 'absolute', top: 0, left: '-50%', width: '200%', height: '40%',
              background: 'linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.015) 50%, transparent 60%)',
              pointerEvents: 'none'
            }}/>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'flex-start', marginBottom: '1.75rem'
            }}>
              <div style={{ fontFamily: fontSerif, fontSize: '1.4rem', lineHeight: 1 }}>
                A<span style={{ color: gold, fontStyle: 'italic' }}>+</span> CRM
                <small style={{
                  display: 'block', fontFamily: fontSans, fontSize: '0.48rem',
                  letterSpacing: '0.16em', textTransform: 'uppercase',
                  color: 'rgba(184,151,90,0.5)', marginTop: 4
                }}>
                  Loyalty Card · Pagos a Tiempo
                </small>
              </div>
              <div style={{
                width: 38, height: 26, borderRadius: 5,
                background: `linear-gradient(135deg, ${gold}, ${goldLight})`,
                opacity: 0.65
              }}/>
            </div>

            <div style={{
              fontSize: '0.5rem', letterSpacing: '0.14em', textTransform: 'uppercase',
              color: 'rgba(184,151,90,0.4)', marginBottom: '0.75rem'
            }}>
              5 pagos a tiempo = 1 mes de servicio gratis
            </div>

            {/* STAMPS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.6rem', marginBottom: '0.5rem' }}>
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className={i < cur ? 'stamp-filled' : 'stamp-empty'} style={{
                  aspectRatio: '1', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.68rem', fontWeight: 700, color: black
                }}>
                  {i < cur ? '✓' : ''}
                </div>
              ))}
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: '0.46rem', color: 'rgba(255,255,255,0.18)', marginBottom: '0.65rem'
            }}>
              <span>Pago 1</span><span>Pago 5</span>
            </div>

            {hasReward && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                background: 'rgba(184,151,90,0.12)', border: '1px solid rgba(184,151,90,0.25)',
                borderRadius: 20, padding: '0.32rem 0.85rem',
                fontSize: '0.58rem', textTransform: 'uppercase', color: gold,
                marginBottom: '1.5rem', letterSpacing: '0.06em'
              }}>
                🎁 Premio disponible
              </div>
            )}

            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
              borderTop: '1px solid rgba(184,151,90,0.12)', paddingTop: '1.1rem'
            }}>
              <div>
                <div style={{ fontSize: '0.46rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.24)' }}>
                  Miembro
                </div>
                <div style={{ fontSize: '0.92rem', marginTop: '0.2rem', fontWeight: 400 }}>
                  {card.profiles?.full_name}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.46rem', color: 'rgba(255,255,255,0.2)' }}>
                  #{card.card_number}
                </div>
                <div style={{ fontSize: '0.62rem', color: gold, marginTop: '0.2rem' }}>
                  Ciclo {cycle} · {cur}/5
                </div>
              </div>
            </div>
          </div>

          {/* PROGRESS */}
          <div className="card-anim" style={{ marginBottom: '1.25rem' }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: '0.62rem', color: 'rgba(255,255,255,0.28)', marginBottom: '0.5rem'
            }}>
              <span>{cur} sello{cur !== 1 ? 's' : ''} en ciclo actual</span>
              <span>Meta: 5 = 1 mes gratis</span>
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
              <div className="progress-bar" style={{
                height: '100%', width: progressPct + '%',
                borderRadius: 4, transition: 'width 0.6s cubic-bezier(0.22,1,0.36,1)'
              }}/>
            </div>
          </div>

          {/* NEXT REWARD */}
          <div className="card-anim" style={{
            background: 'rgba(184,151,90,0.07)',
            border: '1px solid rgba(184,151,90,0.18)',
            borderRadius: 12, padding: '1.1rem', marginBottom: '1.25rem', textAlign: 'center'
          }}>
            <div style={{
              fontSize: '0.54rem', letterSpacing: '0.14em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.25)', marginBottom: '0.4rem'
            }}>
              Próximo Premio
            </div>
            <div style={{ fontFamily: fontSerif, fontSize: '1.25rem', fontWeight: 300, color: white, lineHeight: 1.4 }}>
              {hasReward
                ? '🎉 ¡Tu mes gratis está listo!'
                : `Te faltan ${rem} sello${rem !== 1 ? 's' : ''} para tu próximo mes gratis`}
            </div>
          </div>

          {/* STAMP HISTORY */}
          {card.stamp_history?.length > 0 && (
            <div className="card-anim">
              <div style={{
                fontSize: '0.54rem', letterSpacing: '0.14em', textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.25)', marginBottom: '0.85rem'
              }}>
                Historial de Pagos
              </div>
              <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' }}>
                {[...card.stamp_history].reverse().map((h, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.85rem 1rem',
                    borderBottom: i < card.stamp_history.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.24)' }}>
                        {new Date(h.created_at).toLocaleDateString('es-PR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.72)', marginTop: '0.1rem' }}>
                        Pago registrado{h.payment_amount ? ' · $' + parseFloat(h.payment_amount).toFixed(2) : ''}
                      </div>
                    </div>
                    <span style={{
                      fontSize: '0.54rem', padding: '0.2rem 0.6rem', borderRadius: 20,
                      background: 'rgba(184,151,90,0.1)', color: gold,
                      border: '1px solid rgba(184,151,90,0.22)', whiteSpace: 'nowrap'
                    }}>
                      +1 sello
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FOOTER */}
          <div className="card-anim" style={{
            textAlign: 'center', padding: '2.5rem 0 1rem',
            borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '1.5rem'
          }}>
            <div style={{ fontFamily: fontSerif, fontSize: '1.1rem', color: 'rgba(255,255,255,0.25)' }}>
              A<span style={{ color: 'rgba(184,151,90,0.5)', fontStyle: 'italic' }}>+</span> CRM
            </div>
            <div style={{
              fontSize: '0.52rem', letterSpacing: '0.16em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.15)', marginTop: '0.3rem'
            }}>
              Accounting Plus Client Return Management
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
