import React, { useEffect, useState } from 'react'
import './LoadingScreen.css'

const STEPS = [
  { sub: 'Analyzing your business profile...',      pct: 15 },
  { sub: 'Cross-referencing 50,000+ companies...', pct: 35 },
  { sub: 'Running qualification algorithms...',     pct: 58 },
  { sub: 'Generating personalized strategies...',   pct: 78 },
  { sub: 'Calculating deal valuations...',          pct: 95 },
]

const IconCheck = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

export default function LoadingScreen() {
  const [step, setStep]   = useState(0)
  const [pct, setPct]     = useState(8)

  useEffect(() => {
    const timer = setInterval(() => {
      setStep(prev => {
        const next = prev < STEPS.length - 1 ? prev + 1 : prev
        setPct(STEPS[next].pct)
        return next
      })
    }, 520)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="loading-screen screen">
      <div className="loading-3d-container">
        <div className="scan-wrap">
          <div className="scan-ring r1" />
          <div className="scan-ring r2" />
          <div className="scan-ring r3" />
          <div className="scan-core">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </div>
        </div>
      </div>

      <h2 className="loading-title">Scanning the market...</h2>
      <p className="loading-sub">{STEPS[step].sub}</p>

      <div className="progress-wrap">
        <div className="progress-fill" style={{ width: pct + '%' }} />
      </div>

      <div className="log-list">
        {STEPS.map((s, i) => (
          <div
            key={i}
            className={`log-item ${i < step ? 'done' : i === step ? 'active' : ''}`}
          >
            <span className="log-dot">{i < step && <IconCheck />}</span>
            {s.sub.replace('...', '')}
          </div>
        ))}
      </div>
    </div>
  )
}
