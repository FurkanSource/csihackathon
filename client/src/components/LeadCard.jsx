import React, { useState, useEffect, useRef } from 'react'
import { getScoreMeta, formatMoney } from '../utils/formatters'
import './LeadCard.css'

/* ── Inline SVG Icons ── */
const IconPin = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
  </svg>
)
const IconBolt = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>
  </svg>
)
const IconDollar = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
)
const IconTarget = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
)
const IconTrend = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>
  </svg>
)
const IconCheck = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

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
        <div className="lead-name">
          {lead.address ? (
            <a
              className="lead-name-link"
              href={`https://www.google.com/maps/search/${encodeURIComponent(lead.address || lead.name + ' ' + lead.city)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
            >
              {lead.name}
              <span className="lead-map-icon"><IconPin /></span>
            </a>
          ) : (
            lead.name
          )}
        </div>
        <div className="lead-sub">{lead.decisionMaker} · {lead.size}</div>

        <div className="lead-tags">
          <span className="ltag t-industry">{lead.industry}</span>
          {lead.address ? (
            <a
              className="ltag t-location ltag-map"
              href={`https://www.google.com/maps/search/${encodeURIComponent(lead.address || lead.city)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
            >
              <IconPin /> {lead.city}
            </a>
          ) : (
            <span className="ltag t-location"><IconPin /> {lead.city}</span>
          )}
          <span className="ltag t-size">{lead.size}</span>
          {lead.signals.slice(0, 2).map((s, i) => (
            <span key={i} className="ltag t-signal"><IconBolt /> {s}</span>
          ))}
        </div>

        <div className="lead-reason">{lead.reason}</div>

        {/* EXPANDED DETAILS */}
        {expanded && (
          <div className="lead-expand" onClick={e => e.stopPropagation()}>
            <div className="expand-grid">
              <div className="ebox">
                <div className="ebox-label"><IconDollar /> Deal Valuation</div>
                <div className="deal-val">{formatMoney(lead.monthly)}<span>/mo</span></div>
                <div className="deal-annual">{formatMoney(lead.annual)} annual potential</div>
              </div>

              <div className="ebox">
                <div className="ebox-label"><IconTarget /> Outreach Strategy</div>
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
                <div className="ebox-label"><IconTrend /> Buying Signals</div>
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
              style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34,1.56,0.64,1)', filter: `drop-shadow(0 0 4px ${meta.color})` }}
            />
          </svg>
          <div className="score-num" style={{ color: meta.color, textShadow: `0 0 10px ${meta.color}40` }}>{lead.score}</div>
        </div>
        <div className="score-badge-label" style={{ color: meta.color }}>{meta.label}</div>
      </div>
    </div>
  )
}
