import React, { useState, useEffect, useRef } from 'react'
import './App.css'

import Navbar        from './components/Navbar'
import LoadingScreen from './components/LoadingScreen'
import LeadCard      from './components/LeadCard'
import SummaryCard   from './components/SummaryCard'
import FilterBar     from './components/FilterBar'
import ResultsHeader from './components/ResultsHeader'

import { generateMockLeads, SAMPLES } from './data/sampleData'
import { formatMoney, formatDate, exportCSV } from './utils/formatters'

const SCREENS = { INPUT: 'input', LOADING: 'loading', RESULTS: 'results' }

export default function App() {
  // Form state
  const [bizType,   setBizType]   = useState('')
  const [target,    setTarget]    = useState('')
  const [service,   setService]   = useState('')
  const [location,  setLocation]  = useState('')
  const [dealSize,  setDealSize]  = useState('medium')

  // App state
  const [screen,     setScreen]   = useState(SCREENS.INPUT)
  const [leads,      setLeads]    = useState([])
  const [filtered,   setFiltered] = useState([])
  const [saved,      setSaved]    = useState([])
  const [showDB,     setShowDB]   = useState(false)
  const [activeFilter, setActiveFilter] = useState('all')
  const [meta,       setMeta]     = useState({})

  // Nav stats
  const totalPipeline = leads.reduce((s, l) => s + l.annual, 0)
  const avgScore      = leads.length ? Math.round(leads.reduce((s, l) => s + l.score, 0) / leads.length) : 0
  const hotCount      = leads.filter(l => l.score >= 85).length

  // Canvas ref
  const canvasRef = useRef(null)

  // Animated background canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx  = canvas.getContext('2d')
    let W, H, nodes = [], animId

    const resize = () => {
      W = canvas.width  = window.innerWidth
      H = canvas.height = window.innerHeight
      nodes = Array.from({ length: 38 }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        r:  Math.random() * 1.5 + 0.5
      }))
    }

    const tick = (t) => {
      ctx.clearRect(0, 0, W, H)
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy
        if (n.x < 0 || n.x > W) n.vx *= -1
        if (n.y < 0 || n.y > H) n.vy *= -1
      })
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const d  = Math.sqrt(dx * dx + dy * dy)
          if (d < 130) {
            ctx.beginPath()
            ctx.moveTo(nodes[i].x, nodes[i].y)
            ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.strokeStyle = `rgba(0,212,255,${(1 - d / 130) * 0.1})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }
      nodes.forEach(n => {
        const p = 0.5 + 0.5 * Math.sin(t * 0.001 + n.x)
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(0,212,255,${0.15 + 0.25 * p})`
        ctx.fill()
      })
      animId = requestAnimationFrame(tick)
    }

    window.addEventListener('resize', resize)
    resize()
    animId = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  // ── GENERATE LEADS ────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!bizType || !target || !service) {
      alert('Please fill in Business Type, Target Customer, and Service Offered.')
      return
    }
    setScreen(SCREENS.LOADING)

    try {
      // Try Flask backend first
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ biz_type: bizType, target, service, location, deal_size: dealSize })
      })
      if (!res.ok) throw new Error('Backend unavailable')
      const data = await res.json()
      finishLoading(data.leads, { bizType, location })
    } catch {
      // Fallback to mock data
      setTimeout(() => {
        const mockLeads = generateMockLeads(bizType, target, service, location, dealSize)
        finishLoading(mockLeads, { bizType, location })
      }, 2800)
    }
  }

  const finishLoading = (newLeads, newMeta) => {
    setLeads(newLeads)
    setFiltered(newLeads)
    setMeta(newMeta)
    setActiveFilter('all')
    setScreen(SCREENS.RESULTS)
  }

  // ── FILTER & SORT ─────────────────────────────────────────────────
  const handleFilter = (type) => {
    setActiveFilter(type)
    const map = { all: () => true, hot: l => l.score >= 85, strong: l => l.score >= 70, warm: l => l.score >= 55 }
    setFiltered(leads.filter(map[type] || map.all))
  }

  const handleSort = (by) => {
    const sorters = {
      score: (a, b) => b.score - a.score,
      deal:  (a, b) => b.annual - a.annual,
      name:  (a, b) => a.name.localeCompare(b.name)
    }
    setFiltered(f => [...f].sort(sorters[by] || sorters.score))
  }

  // ── SAVE TO DB ────────────────────────────────────────────────────
  const handleSave = async () => {
    const newSaved = leads.filter(l => !saved.find(s => s.name === l.name))
    setSaved(prev => [...prev, ...newSaved.map(l => ({ ...l, savedAt: new Date().toLocaleTimeString() }))])

    // Try to persist via API
    try {
      await Promise.all(leads.map(l =>
        fetch('/api/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lead_id: l.id || 0, notes: '' })
        })
      ))
    } catch { /* backend optional */ }

    setShowDB(true)
  }

  // ── LOAD SAMPLE ───────────────────────────────────────────────────
  const loadSample = (i) => {
    const s = SAMPLES[i]
    setBizType(s.bizType)
    setTarget(s.target)
    setService(s.service)
    setLocation(s.location)
    setDealSize(s.dealSize)
  }

  // ── RESET ─────────────────────────────────────────────────────────
  const handleReset = () => {
    setScreen(SCREENS.INPUT)
    setLeads([])
    setFiltered([])
    setShowDB(false)
    setActiveFilter('all')
  }

  return (
    <div className="app">
      {/* Animated background */}
      <canvas ref={canvasRef} style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, opacity:0.5 }} />
      <div className="orb orb1" />
      <div className="orb orb2" />

      <div className="app-content">
        <Navbar
          totalPipeline={leads.length ? formatMoney(totalPipeline) : '$0'}
          leadsFound={leads.length}
        />

        {/* ── INPUT SCREEN ── */}
        {screen === SCREENS.INPUT && (
          <div className="input-screen screen">
            <div className="hero-layout">
              <div className="hero-left">
                <div className="hero-eyebrow">Business Lead Intelligence</div>
                <h1 className="hero-title">
                  Find your<br />
                  <span className="hero-accent">next client.</span>
                </h1>
                <p className="hero-desc">
                  SmartLead uses AI to discover, score, and qualify the highest-value leads for your business — with personalized outreach strategies ready to go.
                </p>
                <div className="hero-pills">
                  <span className="pill">⚡ AI-Powered Scoring</span>
                  <span className="pill">🎯 Smart Qualification</span>
                  <span className="pill">📊 Deal Forecasting</span>
                </div>
                <div className="hero-metrics">
                  <div className="hmetric"><div className="hmetric-val">94<span>%</span></div><div className="hmetric-label">Match accuracy</div></div>
                  <div className="hmetric-div" />
                  <div className="hmetric"><div className="hmetric-val">5<span>x</span></div><div className="hmetric-label">Faster discovery</div></div>
                  <div className="hmetric-div" />
                  <div className="hmetric"><div className="hmetric-val">$2M<span>+</span></div><div className="hmetric-label">Pipeline generated</div></div>
                </div>
              </div>

              <div className="hero-right">
                <div className="form-card">
                  <div className="form-card-bar" />
                  <div className="form-header">
                    <span className="fdot red" /><span className="fdot yellow" /><span className="fdot green" />
                    <span className="form-file-label">lead_search.config</span>
                  </div>

                  <div className="field">
                    <label>Business Type</label>
                    <input value={bizType} onChange={e => setBizType(e.target.value)} placeholder="e.g. Digital Marketing Agency" />
                  </div>
                  <div className="field">
                    <label>Target Customer</label>
                    <input value={target} onChange={e => setTarget(e.target.value)} placeholder="e.g. Small restaurants and cafés" />
                  </div>
                  <div className="field">
                    <label>Service Offered</label>
                    <input value={service} onChange={e => setService(e.target.value)} placeholder="e.g. Social media management & paid ads" />
                  </div>
                  <div className="field-row">
                    <div className="field">
                      <label>Location (optional)</label>
                      <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Miami, FL" />
                    </div>
                    <div className="field">
                      <label>Deal Size</label>
                      <select value={dealSize} onChange={e => setDealSize(e.target.value)}>
                        <option value="small">$500–$2K/mo</option>
                        <option value="medium">$2K–$10K/mo</option>
                        <option value="large">$10K–$50K/mo</option>
                        <option value="enterprise">$50K+/mo</option>
                      </select>
                    </div>
                  </div>

                  <button className="forge-btn" onClick={handleGenerate}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                    </svg>
                    Discover Leads
                  </button>

                  <div className="sample-row">
                    <span className="sample-label">Quick fill:</span>
                    <button className="chip" onClick={() => loadSample(0)}>🏪 Local Agency</button>
                    <button className="chip" onClick={() => loadSample(1)}>💻 SaaS Startup</button>
                    <button className="chip" onClick={() => loadSample(2)}>🏥 Healthcare</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── LOADING SCREEN ── */}
        {screen === SCREENS.LOADING && <LoadingScreen />}

        {/* ── RESULTS SCREEN ── */}
        {screen === SCREENS.RESULTS && (
          <div className="results-screen screen">
            <ResultsHeader
              title={`Lead Report — ${meta.bizType}`}
              meta={`${leads.length} leads · ${meta.location || 'Nationwide'} · Generated ${formatDate()}`}
              onExport={() => exportCSV(leads)}
              onSave={handleSave}
              onReset={handleReset}
            />

            {/* Summary cards */}
            <div className="summary-grid">
              <SummaryCard label="Total Pipeline"  value={formatMoney(totalPipeline)} colorClass="c-green"  sub="Annual potential" />
              <SummaryCard label="Avg Lead Score"  value={`${avgScore}/100`}          colorClass="c-accent" sub="Quality index" />
              <SummaryCard label="Hot Leads"       value={hotCount}                   colorClass="c-gold"   sub="Score ≥ 85" />
              <SummaryCard label="Top Opportunity" value={formatMoney(leads[0]?.annual || 0)} colorClass="c-purple" sub={leads[0]?.name || ''} />
            </div>

            {/* Filter bar */}
            <FilterBar
              activeFilter={activeFilter}
              onFilter={handleFilter}
              onSort={handleSort}
            />

            {/* Lead cards */}
            <div className="leads-grid">
              {filtered.map((lead, i) => (
                <LeadCard key={lead.name} lead={lead} rank={i + 1} animDelay={(i * 0.07).toFixed(2)} />
              ))}
              {filtered.length === 0 && (
                <p style={{ color: 'var(--text3)', fontFamily: 'var(--font-mono)', fontSize: '13px', padding: '2rem 0' }}>
                  No leads match this filter.
                </p>
              )}
            </div>

            {/* Saved leads DB panel */}
            {showDB && saved.length > 0 && (
              <div className="db-panel">
                <div className="db-panel-header">
                  <div className="db-title">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <ellipse cx="12" cy="5" rx="9" ry="3"/>
                      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
                      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
                    </svg>
                    Saved Leads — {saved.length} records
                  </div>
                  <button className="db-close" onClick={() => setShowDB(false)}>✕</button>
                </div>
                <div className="db-table-wrap">
                  <table className="db-table">
                    <thead>
                      <tr><th>Company</th><th>Score</th><th>Industry</th><th>Deal/mo</th><th>Saved</th></tr>
                    </thead>
                    <tbody>
                      {saved.map((l, i) => (
                        <tr key={i}>
                          <td style={{ color: 'var(--text)' }}>{l.name}</td>
                          <td style={{ color: l.score >= 85 ? 'var(--green)' : l.score >= 70 ? 'var(--accent)' : 'var(--gold)', fontFamily: 'var(--font-mono)' }}>{l.score}</td>
                          <td>{l.industry}</td>
                          <td style={{ color: 'var(--green)' }}>{formatMoney(l.monthly)}</td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text3)' }}>{l.savedAt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
