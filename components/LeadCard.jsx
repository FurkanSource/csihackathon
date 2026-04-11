import React, { useState, useEffect, useRef } from 'react'
import { getScoreMeta, formatMoney } from '../utils/formatters'
import './LeadCard.css'

export default function LeadCard({ lead, rank, animDelay }) {
  const [expanded, setExpanded] = useState(false)
  const meta     = getScoreMeta(lead.score)
  const circ     = 2 * Math.PI * 30
  const offset   = circ * (1 - lead.score / 100)
  const isTop    = rank === 1
  const ringRef  = useRef(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (ringRef.current) ringRef.current.style.strokeDashoffset = offset.toFixed(2)
    }, 100 + (rank - 1) * 120)
    return () => clearTimeout(timer)
  }, [offset, rank])

  return (
    <div
      className={`lead-card ${expanded ? 'expanded' : ''}`}
      style={{ animationDelay: animDelay + 's' }}
      onClick={() => setExpanded(e => !e)}
    >
      {/* RANK */}
      <div className="lead-rank">
        <div className={`rank-num ${isTop ? 'is-top' : ''}`}>0{rank}</div>
      </div>

      {/* BODY */}
      <div className="lead-body">
        <div className="lead-name">{lead.name}</div>
        <div className="lead-sub">{lead.decisionMaker} · {lead.size}</div>

        <div className="lead-tags">
          <span className="ltag t-industry">{lead.industry}</span>
          <span className="ltag t-location">📍 {lead.city}</span>
          <span className="ltag t-size">{lead.size}</span>
          {lead.signals.slice(0, 2).map((s, i) => (
            <span key={i} className="ltag t-signal">⚡ {s}</span>
          ))}
        </div>

        <div className="lead-reason">{lead.reason}</div>

        {/* EXPANDED DETAILS */}
        {expanded && (
          <div className="lead-expand" onClick={e => e.stopPropagation()}>
            <div className="expand-grid">
              <div className="ebox">
                <div className="ebox-label">💰 Deal Valuation</div>
                <div className="deal-val">{formatMoney(lead.monthly)}<span>/mo</span></div>
                <div className="deal-annual">{formatMoney(lead.annual)} annual potential</div>
              </div>

              <div className="ebox">
                <div className="ebox-label">🎯 Outreach Strategy</div>
                <div className="outreach-list">
                  {lead.outreach.map((step, i) => (
                    <div key={i} className="ostep">
                      <div className="ostep-n">{i + 1}</div>
                      <div>{step}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="ebox">
                <div className="ebox-label">📊 Buying Signals</div>
                <div className="signals-list">
                  {lead.signals.map((s, i) => (
                    <div key={i} className="signal-row">
                      <div className="signal-dot" />
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SCORE RING */}
      <div className="lead-score-col">
        <div className="score-ring-wrap">
          <svg width="72" height="72" viewBox="0 0 72 72" style={{ transform: 'rotate(-90deg)' }}>
            <circle className="score-track" cx="36" cy="36" r="30" fill="none" stroke="var(--border2)" strokeWidth="4" />
            <circle
              ref={ringRef}
              className="score-fill"
              cx="36" cy="36" r="30"
              fill="none"
              stroke={meta.stroke}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circ.toFixed(2)}
              strokeDashoffset={circ.toFixed(2)}
              style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34,1.56,0.64,1)' }}
            />
          </svg>
          <div className="score-num" style={{ color: meta.color }}>{lead.score}</div>
        </div>
        <div className="score-badge-label" style={{ color: meta.color }}>{meta.label}</div>
      </div>
    </div>
  )
}
