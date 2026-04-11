import React, { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'

import Navbar        from './components/Navbar'
import LoadingScreen from './components/LoadingScreen'
import LeadCard      from './components/LeadCard'
import SummaryCard   from './components/SummaryCard'
import FilterBar     from './components/FilterBar'
import ResultsHeader from './components/ResultsHeader'
import ChatBot       from './components/ChatBot'

import { generateMockLeads, SAMPLES } from './data/sampleData'
import { formatMoney, formatDate, exportCSV } from './utils/formatters'

/* ── SVG Icon Components ── */
const IconBolt = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>
  </svg>
)
const IconTarget = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
)
const IconChart = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>
  </svg>
)
const IconStore = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2 2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7"/>
  </svg>
)
const IconLaptop = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16"/>
  </svg>
)
const IconHeart = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
  </svg>
)
const IconSearch = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
)
const IconDB = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <ellipse cx="12" cy="5" rx="9" ry="3"/>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
  </svg>
)
const IconX = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
)
const IconLocate = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m2 12 2 0"/><path d="m20 12 2 0"/>
  </svg>
)

/* ── Input Validation ── */
function validateField(value, fieldName) {
  const v = value.trim()
  if (!v) return ''
  if (v.length < 3) return `${fieldName} must be at least 3 characters`
  if (!/[a-zA-Z]/.test(v)) return `${fieldName} must contain letters`
  const clean = v.replace(/\s/g, '')
  if (clean.length > 4 && new Set(clean.toLowerCase()).size <= 2) return `Please enter a valid ${fieldName.toLowerCase()}`
  if (clean.length > 6) {
    const vowels = (v.match(/[aeiouAEIOU]/g) || []).length
    if (vowels === 0) return `Please enter a valid ${fieldName.toLowerCase()}`
  }
  return ''
}

/* ── Particle Burst Effect ── */
function spawnBurst(x, y, container) {
  const colors = ['#6C63FF', '#8B5CF6', '#E879A8', '#4ADE80', '#FACC15']
  for (let i = 0; i < 24; i++) {
    const p = document.createElement('div')
    p.className = 'particle-burst'
    const angle = (Math.PI * 2 * i) / 24 + (Math.random() - 0.5) * 0.5
    const dist = 60 + Math.random() * 80
    const size = 3 + Math.random() * 5
    p.style.cssText = `
      left:${x}px; top:${y}px; width:${size}px; height:${size}px;
      background:${colors[i % colors.length]};
      --tx:${Math.cos(angle) * dist}px; --ty:${Math.sin(angle) * dist}px;
    `
    container.appendChild(p)
    p.addEventListener('animationend', () => p.remove())
  }
}

/* ── Ripple Effect ── */
function spawnRipple(e, element) {
  const rect = element.getBoundingClientRect()
  const ripple = document.createElement('div')
  ripple.className = 'click-ripple'
  ripple.style.left = (e.clientX - rect.left) + 'px'
  ripple.style.top = (e.clientY - rect.top) + 'px'
  element.appendChild(ripple)
  ripple.addEventListener('animationend', () => ripple.remove())
}

const SCREENS = { INPUT: 'input', LOADING: 'loading', RESULTS: 'results' }

export default function App() {
  // Form state
  const [bizType,   setBizType]   = useState('')
  const [target,    setTarget]    = useState('')
  const [service,   setService]   = useState('')
  const [location,  setLocation]  = useState('')
  const [dealSize,  setDealSize]  = useState('medium')
  const [radius,    setRadius]    = useState(25)
  const [detecting, setDetecting] = useState(false)
  const [errors,    setErrors]    = useState({})

  // App state
  const [screen,     setScreen]   = useState(SCREENS.INPUT)
  const [leads,      setLeads]    = useState([])
  const [filtered,   setFiltered] = useState([])
  const [saved,      setSaved]    = useState([])
  const [showDB,     setShowDB]   = useState(false)
  const [activeFilter, setActiveFilter] = useState('all')
  const [meta,       setMeta]     = useState({})
  const [transitioning, setTransitioning] = useState(false)
  const [transitionType, setTransitionType] = useState('')

  // Nav stats
  const totalPipeline = leads.reduce((s, l) => s + l.annual, 0)
  const avgScore      = leads.length ? Math.round(leads.reduce((s, l) => s + l.score, 0) / leads.length) : 0
  const hotCount      = leads.filter(l => l.score >= 85).length

  // Refs
  const canvasRef = useRef(null)
  const appRef = useRef(null)

  // ── Screen transition wrapper ──
  const transitionTo = useCallback((newScreen, type = 'wipe') => {
    setTransitionType(type)
    setTransitioning(true)
    setTimeout(() => {
      setScreen(newScreen)
      setTimeout(() => setTransitioning(false), 50)
    }, 500)
  }, [])

  // Animated background canvas with floating bubbles
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx  = canvas.getContext('2d')
    let W, H, nodes = [], bubbles = [], animId

    const resize = () => {
      W = canvas.width  = window.innerWidth
      H = canvas.height = window.innerHeight
      nodes = Array.from({ length: 50 }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r:  Math.random() * 2 + 0.5,
        phase: Math.random() * Math.PI * 2
      }))
      // Floating bubbles
      bubbles = Array.from({ length: 18 }, () => ({
        x: Math.random() * W,
        y: H + Math.random() * 200,
        r: 4 + Math.random() * 12,
        speed: 0.3 + Math.random() * 0.6,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.01 + Math.random() * 0.02,
        color: Math.floor(Math.random() * 4)
      }))
    }

    const tick = (t) => {
      ctx.clearRect(0, 0, W, H)

      // Draw floating bubbles
      const bubbleColors = ['108,99,255', '139,92,246', '232,121,168', '74,222,128']
      bubbles.forEach(b => {
        b.y -= b.speed
        b.wobble += b.wobbleSpeed
        const wx = b.x + Math.sin(b.wobble) * 20
        if (b.y < -b.r * 2) { b.y = H + b.r * 2; b.x = Math.random() * W }

        const c = bubbleColors[b.color]
        // Outer glow
        const grad = ctx.createRadialGradient(wx, b.y, 0, wx, b.y, b.r * 2)
        grad.addColorStop(0, `rgba(${c},0.08)`)
        grad.addColorStop(1, `rgba(${c},0)`)
        ctx.beginPath()
        ctx.arc(wx, b.y, b.r * 2, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()

        // Bubble ring
        ctx.beginPath()
        ctx.arc(wx, b.y, b.r, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(${c},${0.15 + 0.1 * Math.sin(t * 0.002 + b.wobble)})`
        ctx.lineWidth = 1
        ctx.stroke()

        // Inner highlight
        ctx.beginPath()
        ctx.arc(wx - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.25, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${0.1 + 0.05 * Math.sin(t * 0.003)})`
        ctx.fill()
      })

      // Draw network nodes
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
          if (d < 150) {
            ctx.beginPath()
            ctx.moveTo(nodes[i].x, nodes[i].y)
            ctx.lineTo(nodes[j].x, nodes[j].y)
            const lineColors = ['108,99,255', '139,92,246', '232,121,168', '74,222,128']
            const lc = lineColors[(i + j) % lineColors.length]
            ctx.strokeStyle = `rgba(${lc},${(1 - d / 150) * 0.15})`
            ctx.lineWidth = 0.6
            ctx.stroke()
          }
        }
      }
      nodes.forEach((n, i) => {
        const p = 0.5 + 0.5 * Math.sin(t * 0.0015 + n.phase)
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r * (0.8 + 0.4 * p), 0, Math.PI * 2)
        const colors = ['108,99,255', '139,92,246', '232,121,168', '74,222,128']
        const c = colors[i % colors.length]
        ctx.fillStyle = `rgba(${c},${0.25 + 0.35 * p})`
        ctx.fill()
        if (n.r > 1.5) {
          ctx.beginPath()
          ctx.arc(n.x, n.y, n.r * 3, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(${c},${0.04 * p})`
          ctx.fill()
        }
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

  // ── DETECT LOCATION ─────────────────────────────────────────────
  const detectLocation = () => {
    if (!navigator.geolocation) { alert('Geolocation not supported by your browser.'); return }
    setDetecting(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`, { headers: { 'Accept': 'application/json' } })
          const data = await res.json()
          const city = data.address?.city || data.address?.town || data.address?.village || ''
          const state = data.address?.state || ''
          if (city) setLocation(`${city}${state ? ', ' + state : ''}`)
        } catch { setLocation(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`) }
        setDetecting(false)
      },
      () => { alert('Location access denied. Please type your location manually.'); setDetecting(false) },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // ── VALIDATE & GENERATE LEADS ─────────────────────────────────────
  const handleGenerate = async (e) => {
    const newErrors = {}
    const bizErr = validateField(bizType, 'Business Type')
    const tgtErr = validateField(target, 'Target Customer')
    const svcErr = validateField(service, 'Service Offered')
    if (!bizType.trim()) newErrors.bizType = 'Business Type is required'
    else if (bizErr) newErrors.bizType = bizErr
    if (!target.trim()) newErrors.target = 'Target Customer is required'
    else if (tgtErr) newErrors.target = tgtErr
    if (!service.trim()) newErrors.service = 'Service Offered is required'
    else if (svcErr) newErrors.service = svcErr
    if (Object.keys(newErrors).length) { setErrors(newErrors); return }
    setErrors({})
    // Particle burst on button click
    if (appRef.current) {
      const rect = e.currentTarget.getBoundingClientRect()
      spawnBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, appRef.current)
    }
    transitionTo(SCREENS.LOADING, 'wipe')

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ biz_type: bizType, target, service, location, deal_size: dealSize, radius })
      })
      if (!res.ok) throw new Error('Backend unavailable')
      const data = await res.json()
      finishLoading(data.leads, { bizType, location })
    } catch {
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
    transitionTo(SCREENS.RESULTS, 'bubble')
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
  const handleSave = async (e) => {
    if (appRef.current) {
      const rect = e.currentTarget.getBoundingClientRect()
      spawnBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, appRef.current)
    }

    const newSaved = leads.filter(l => !saved.find(s => s.name === l.name))
    setSaved(prev => [...prev, ...newSaved.map(l => ({ ...l, savedAt: new Date().toLocaleTimeString() }))])

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
    transitionTo(SCREENS.INPUT, 'bubble')
    setLeads([])
    setFiltered([])
    setShowDB(false)
    setActiveFilter('all')
  }

  return (
    <div className="app" ref={appRef}>
      {/* Animated background */}
      <canvas ref={canvasRef} style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, opacity:0.6 }} />
      <div className="orb orb1" />
      <div className="orb orb2" />
      <div className="orb orb3" />

      {/* Screen transition overlay */}
      {transitioning && (
        <div className={`screen-transition ${transitionType}`}>
          {transitionType === 'bubble' && (
            <>
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="transition-bubble" style={{
                  left: `${10 + (i % 4) * 25}%`,
                  top: `${10 + Math.floor(i / 4) * 30}%`,
                  animationDelay: `${i * 0.04}s`,
                  '--size': `${80 + Math.random() * 120}vmax`
                }} />
              ))}
            </>
          )}
        </div>
      )}

      <div className="app-content">
        <Navbar
          totalPipeline={leads.length ? formatMoney(totalPipeline) : '$0'}
          leadsFound={leads.length}
          onHome={handleReset}
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
                  <span className="pill"><IconBolt size={12} /> AI-Powered Scoring</span>
                  <span className="pill"><IconTarget size={12} /> Smart Qualification</span>
                  <span className="pill"><IconChart size={12} /> Deal Forecasting</span>
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

                  <div className={`field ${errors.bizType ? 'has-error' : ''}`}>
                    <label htmlFor="biz-type">Business Type</label>
                    <input id="biz-type" value={bizType} onChange={e => { setBizType(e.target.value); setErrors(er => ({...er, bizType: ''})) }} placeholder="e.g. Digital Marketing Agency" />
                    {errors.bizType && <div className="field-error">{errors.bizType}</div>}
                  </div>
                  <div className={`field ${errors.target ? 'has-error' : ''}`}>
                    <label htmlFor="target">Target Customer</label>
                    <input id="target" value={target} onChange={e => { setTarget(e.target.value); setErrors(er => ({...er, target: ''})) }} placeholder="e.g. Small restaurants and cafes" />
                    {errors.target && <div className="field-error">{errors.target}</div>}
                  </div>
                  <div className={`field ${errors.service ? 'has-error' : ''}`}>
                    <label htmlFor="service">Service Offered</label>
                    <input id="service" value={service} onChange={e => { setService(e.target.value); setErrors(er => ({...er, service: ''})) }} placeholder="e.g. Social media management & paid ads" />
                    {errors.service && <div className="field-error">{errors.service}</div>}
                  </div>

                  <div className="field location-field">
                    <label htmlFor="location">Location</label>
                    <div className="location-input-wrap">
                      <input id="location" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Miami, FL" />
                      <button type="button" className="detect-btn" onClick={detectLocation} disabled={detecting} title="Use my location">
                        {detecting ? <span className="detect-spinner" /> : <IconLocate size={14} />}
                      </button>
                    </div>
                  </div>

                  <div className="field radius-field">
                    <label htmlFor="radius">Search Radius: <span className="radius-value">{radius} miles</span></label>
                    <input type="range" id="radius" className="radius-slider" min="5" max="100" step="5" value={radius} onChange={e => setRadius(Number(e.target.value))} />
                    <div className="radius-labels">
                      <span>5 mi</span><span>50 mi</span><span>100 mi</span>
                    </div>
                  </div>

                  <div className="field-row">
                    <div className="field">
                      <label htmlFor="deal-size">Deal Size</label>
                      <select id="deal-size" value={dealSize} onChange={e => setDealSize(e.target.value)}>
                        <option value="small">$500-$2K/mo</option>
                        <option value="medium">$2K-$10K/mo</option>
                        <option value="large">$10K-$50K/mo</option>
                        <option value="enterprise">$50K+/mo</option>
                      </select>
                    </div>
                  </div>

                  <button className="forge-btn ripple-btn" onClick={handleGenerate} onMouseDown={e => spawnRipple(e, e.currentTarget)}>
                    <IconSearch />
                    Discover Leads
                  </button>

                  <div className="sample-row">
                    <span className="sample-label">Quick fill:</span>
                    <button className="chip" onClick={() => loadSample(0)}><IconStore size={12} /> Local Agency</button>
                    <button className="chip" onClick={() => loadSample(1)}><IconLaptop size={12} /> SaaS Startup</button>
                    <button className="chip" onClick={() => loadSample(2)}><IconHeart size={12} /> Healthcare</button>
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
              <SummaryCard label="Hot Leads"       value={hotCount}                   colorClass="c-gold"   sub="Score >= 85" />
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
                <LeadCard key={lead.name} lead={lead} rank={i + 1} animDelay={(i * 0.08).toFixed(2)} />
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
                    <IconDB />
                    Saved Leads — {saved.length} records
                  </div>
                  <button className="db-close" onClick={() => setShowDB(false)} aria-label="Close saved leads panel"><IconX /></button>
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

      {/* ChatBot Widget */}
      <ChatBot />
    </div>
  )
}
