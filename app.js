/**
 * SmartLead — app.js
 * Person 2 (Backend/Logic) owns this file
 * Handles: lead generation, scoring, rendering, DB, canvas, exports
 */

'use strict';

// ── CONFIG ─────────────────────────────────────────────────────────────
const CONFIG = {
  SIMULATE_DELAY_MS: 2800,
  STEP_INTERVAL_MS:  520,
  NUM_LEADS:         5,
  API_KEY:           'YOUR_API_KEY_HERE',  // Replace for AI-powered mode
  USE_AI:            false                 // Set true after adding API key
};

// ── DATA LIBRARY ───────────────────────────────────────────────────────
const DATA = {
  prefixes: ['Apex','Summit','Pinnacle','Nexus','Vantage','Sterling','Crest','Meridian','Horizon','Zenith','Cascade','Vertex','Luminary','Ironclad','Eclipse'],
  suffixes: ['Solutions','Group','Partners','Co','Ventures','Collective','Studio','Works','Labs','Agency','Consulting','Dynamics','Systems','Enterprises','Capital'],
  industries: ['Technology','Hospitality','Healthcare','Finance','Retail','Real Estate','Education','Manufacturing','Legal','Logistics','Media','Construction','Fashion','Food & Beverage','Automotive'],
  sizes: ['2–10 employees','11–50 employees','51–200 employees','201–500 employees'],
  decisionMakers: ['CEO','Founder','Marketing Director','COO','Head of Growth','VP of Operations','CMO','Managing Director','Director of Sales','Chief Revenue Officer'],
  cities: ['New York, NY','Los Angeles, CA','Chicago, IL','Houston, TX','Miami, FL','Seattle, WA','Austin, TX','Boston, MA','Denver, CO','Atlanta, GA','Phoenix, AZ','San Diego, CA','Nashville, TN','Portland, OR','Charlotte, NC'],
  signals: ['Recently raised funding','Actively hiring','New product launched','Rebranding underway','Expanding to new markets','High review volume','Featured in industry press','Won recent award','Opened new location','Signed major partnership'],
  painPoints: [
    'struggling with inconsistent lead generation and client acquisition',
    'lacking a strong digital presence in an increasingly competitive market',
    'spending too much time on manual processes that could be automated',
    'losing customers to competitors with stronger online visibility',
    'unable to scale operations without better systems',
    'experiencing declining engagement with their current marketing strategy',
    'facing high customer churn due to poor onboarding experiences',
    'missing revenue targets due to an unoptimized sales funnel'
  ]
};

const DEAL_RANGES = {
  small:      [500,    2000],
  medium:     [2000,   10000],
  large:      [10000,  50000],
  enterprise: [50000,  200000]
};

// ── UTILITIES ──────────────────────────────────────────────────────────
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const unique = (arr, key) => arr.filter((v, i, s) => s.findIndex(x => x[key] === v[key]) === i);

function formatMoney(n) {
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return '$' + (n / 1_000).toFixed(0) + 'K';
  return '$' + n;
}

function formatDate(d = new Date()) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getScoreMeta(score) {
  if (score >= 85) return { label: 'Hot Lead',  stroke: '#10b981', color: '#10b981' };
  if (score >= 70) return { label: 'Strong',    stroke: '#00d4ff', color: '#00d4ff' };
  if (score >= 55) return { label: 'Warm',      stroke: '#f59e0b', color: '#f59e0b' };
  return               { label: 'Cold',      stroke: '#ef4444', color: '#ef4444' };
}

// ── SCORING ENGINE ─────────────────────────────────────────────────────
function scoreLeadIntelligence(biz, target, service, dealSize, leadData) {
  // Simulate intelligent multi-factor scoring
  let base = randInt(48, 96);

  // Boost score for enterprise deals
  if (dealSize === 'large' || dealSize === 'enterprise') base = Math.max(base, randInt(65, 97));

  // Signal boost: certain signals indicate stronger buying intent
  const hotSignals = ['Recently raised funding','Actively hiring','New product launched','Expanding to new markets'];
  const hasHotSignal = leadData.signals.some(s => hotSignals.includes(s));
  if (hasHotSignal) base = Math.min(100, base + randInt(3, 8));

  return Math.min(100, base);
}

// ── LEAD BUILDER ───────────────────────────────────────────────────────
function buildLeads(biz, target, service, location, dealSize) {
  const usedNames = new Set();
  const leads = [];

  for (let i = 0; i < CONFIG.NUM_LEADS; i++) {
    // Generate unique company name
    let name;
    do {
      name = `${rand(DATA.prefixes)} ${rand(DATA.suffixes)}`;
    } while (usedNames.has(name));
    usedNames.add(name);

    const industry       = rand(DATA.industries);
    const size           = rand(DATA.sizes);
    const city           = location ? location : rand(DATA.cities);
    const decisionMaker  = rand(DATA.decisionMakers);
    const painPoint      = rand(DATA.painPoints);
    const signals        = shuffle(DATA.signals).slice(0, randInt(2, 4));

    const leadData = { signals };
    const score    = scoreLeadIntelligence(biz, target, service, dealSize, leadData);

    const [min, max] = DEAL_RANGES[dealSize] || DEAL_RANGES.medium;
    const monthly    = Math.round((min + (max - min) * (score / 100)) / 100) * 100;
    const annual     = monthly * 12;

    const reason = buildReason(name, size, industry, city, painPoint, service, signals[0]);
    const outreach = buildOutreach(biz, target, service, decisionMaker, industry, signals);

    leads.push({ name, score, industry, size, city, decisionMaker, painPoint, signals, monthly, annual, reason, outreach });
  }

  return leads.sort((a, b) => b.score - a.score);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildReason(name, size, industry, city, painPoint, service, topSignal) {
  return `${name} is a ${size} ${industry.toLowerCase()} company based in ${city} that is currently ${painPoint}. Their recent ${topSignal.toLowerCase()} is a strong indicator of budget availability and active vendor evaluation, making them an ideal fit for ${service}.`;
}

function buildOutreach(biz, target, service, decisionMaker, industry, signals) {
  return [
    `Connect with their ${decisionMaker} on LinkedIn — mention their ${signals[0].toLowerCase()} as a conversation opener`,
    `Send a personalised cold email with a subject line referencing a pain point common in the ${industry.toLowerCase()} space`,
    `Offer a free 20-minute strategy call or audit — lead with value before pitching`,
    `Follow up in 3–5 days with a case study showing ROI for a similar client in their industry`
  ];
}

// ── STATE ──────────────────────────────────────────────────────────────
const State = {
  leads:     [],
  filtered:  [],
  saved:     [],
  meta:      {},
  loadTimer: null,
  step:      0,

  set(leads, meta) {
    this.leads    = leads;
    this.filtered = [...leads];
    this.meta     = meta;
  }
};

// ── SCREENS ────────────────────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── LOADING SEQUENCE ───────────────────────────────────────────────────
const LOG_STEPS = [
  { sub: 'Analyzing your business profile...',        pct: 15 },
  { sub: 'Cross-referencing 50,000+ companies...',    pct: 35 },
  { sub: 'Running qualification algorithms...',       pct: 58 },
  { sub: 'Generating personalized strategies...',     pct: 78 },
  { sub: 'Calculating deal valuations...',            pct: 95 }
];

function startLoading() {
  State.step = 0;
  LOG_STEPS.forEach((_, i) => {
    const el = document.getElementById(`log-${i}`);
    if (el) el.className = 'log-item';
  });
  setProgress(8);
  document.getElementById('loading-sub').textContent = 'Initializing lead discovery engine...';
  activateLogStep(0);

  State.loadTimer = setInterval(() => {
    if (State.step < LOG_STEPS.length - 1) {
      doneLogStep(State.step);
      State.step++;
      activateLogStep(State.step);
    }
  }, CONFIG.STEP_INTERVAL_MS);
}

function activateLogStep(i) {
  const el = document.getElementById(`log-${i}`);
  if (el) el.className = 'log-item active';
  const s = LOG_STEPS[i];
  if (s) {
    document.getElementById('loading-sub').textContent = s.sub;
    setProgress(s.pct);
  }
}

function doneLogStep(i) {
  const el = document.getElementById(`log-${i}`);
  if (el) el.className = 'log-item done';
}

function stopLoading() {
  clearInterval(State.loadTimer);
  LOG_STEPS.forEach((_, i) => doneLogStep(i));
  setProgress(100);
}

function setProgress(pct) {
  const el = document.getElementById('progress-fill');
  if (el) el.style.width = pct + '%';
}

// ── RENDER RESULTS ─────────────────────────────────────────────────────
function renderResults(leads, meta) {
  const { biz, location, dealSize } = meta;
  const loc = location || 'Nationwide';
  const totalPipeline = leads.reduce((s, l) => s + l.annual, 0);
  const avgScore      = Math.round(leads.reduce((s, l) => s + l.score, 0) / leads.length);
  const hotCount      = leads.filter(l => l.score >= 85).length;

  // Nav
  document.getElementById('nav-leads-found').textContent     = leads.length;
  document.getElementById('nav-total-pipeline').textContent  = formatMoney(totalPipeline);

  // Header
  document.getElementById('results-title').textContent = `Lead Report — ${biz}`;
  document.getElementById('results-meta').textContent  = `${leads.length} leads · ${loc} · Generated ${formatDate()}`;

  // Summary cards
  document.getElementById('summary-grid').innerHTML = [
    { label: 'Total Pipeline',  val: formatMoney(totalPipeline), cls: 'c-green',  sub: 'Annual potential' },
    { label: 'Avg Lead Score',  val: `${avgScore}/100`,          cls: 'c-accent', sub: 'Quality index' },
    { label: 'Hot Leads',       val: hotCount,                   cls: 'c-gold',   sub: 'Score ≥ 85' },
    { label: 'Top Opportunity', val: formatMoney(leads[0].annual), cls: 'c-purple', sub: leads[0].name }
  ].map(s => `
    <div class="scard">
      <div class="scard-label">${s.label}</div>
      <div class="scard-val ${s.cls}">${s.val}</div>
      <div class="scard-sub">${s.sub}</div>
    </div>
  `).join('');

  // Lead cards
  renderLeadCards(leads);
}

function renderLeadCards(leads) {
  const grid = document.getElementById('leads-grid');
  grid.innerHTML = '';

  leads.forEach((lead, i) => {
    const meta   = getScoreMeta(lead.score);
    const circ   = 2 * Math.PI * 30;
    const offset = circ * (1 - lead.score / 100);
    const isTop  = i === 0;
    const delay  = (i * 0.07).toFixed(2);

    const card = document.createElement('div');
    card.className = 'lead-card';
    card.style.animationDelay = delay + 's';
    card.dataset.index  = i;
    card.dataset.score  = lead.score;
    card.dataset.annual = lead.annual;
    card.dataset.name   = lead.name;

    card.innerHTML = `
      <div class="lead-rank">
        <div class="rank-num ${isTop ? 'is-top' : ''}">0${i + 1}</div>
      </div>
      <div class="lead-body">
        <div class="lead-name">${lead.name}</div>
        <div class="lead-sub">${lead.decisionMaker} · ${lead.size}</div>
        <div class="lead-tags">
          <span class="ltag t-industry">${lead.industry}</span>
          <span class="ltag t-location">📍 ${lead.city}</span>
          <span class="ltag t-size">${lead.size}</span>
          ${lead.signals.slice(0, 2).map(s => `<span class="ltag t-signal">⚡ ${s}</span>`).join('')}
        </div>
        <div class="lead-reason">${lead.reason}</div>
        <div class="lead-expand" id="expand-${i}">
          <div class="expand-grid">
            <div class="ebox">
              <div class="ebox-label">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                Deal Valuation
              </div>
              <div class="deal-val">${formatMoney(lead.monthly)}<span>/mo</span></div>
              <div class="deal-annual">${formatMoney(lead.annual)} annual potential</div>
            </div>
            <div class="ebox">
              <div class="ebox-label">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                Outreach Strategy
              </div>
              <div class="outreach-list">
                ${lead.outreach.map((step, si) => `
                  <div class="ostep">
                    <div class="ostep-n">${si + 1}</div>
                    <div>${step}</div>
                  </div>`).join('')}
              </div>
            </div>
            <div class="ebox">
              <div class="ebox-label">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                Buying Signals
              </div>
              <div class="signals-list">
                ${lead.signals.map(s => `
                  <div class="signal-row">
                    <div class="signal-dot"></div>
                    ${s}
                  </div>`).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="lead-score-col">
        <div class="score-ring-wrap">
          <svg width="72" height="72" viewBox="0 0 72 72">
            <circle class="score-track" cx="36" cy="36" r="30"/>
            <circle class="score-fill" cx="36" cy="36" r="30"
              stroke="${meta.stroke}"
              stroke-dasharray="${circ.toFixed(2)}"
              stroke-dashoffset="${circ.toFixed(2)}"
              id="ring-${i}"/>
          </svg>
          <div class="score-num" style="color:${meta.color}">${lead.score}</div>
        </div>
        <div class="score-badge-label" style="color:${meta.color}">${meta.label}</div>
      </div>
    `;

    card.addEventListener('click', () => SmartLead.toggleExpand(i, card));
    grid.appendChild(card);

    // Animate ring after paint
    requestAnimationFrame(() => {
      setTimeout(() => {
        const ring = document.getElementById(`ring-${i}`);
        if (ring) ring.style.strokeDashoffset = (2 * Math.PI * 30 * (1 - lead.score / 100)).toFixed(2);
      }, 80 + i * 120);
    });
  });
}

// ── SMARTLEAD PUBLIC API ────────────────────────────────────────────────
const SmartLead = {

  generate() {
    const biz      = document.getElementById('biz-type').value.trim();
    const target   = document.getElementById('target').value.trim();
    const service  = document.getElementById('service').value.trim();
    const location = document.getElementById('location').value.trim();
    const dealSize = document.getElementById('deal-size').value;

    if (!biz || !target || !service) {
      alert('Please fill in Business Type, Target Customer, and Service Offered.');
      return;
    }

    document.getElementById('forge-btn').disabled = true;
    showScreen('loading-screen');
    startLoading();

    const meta = { biz, target, service, location, dealSize };

    setTimeout(() => {
      stopLoading();
      setTimeout(() => {
        const leads = buildLeads(biz, target, service, location, dealSize);
        State.set(leads, meta);
        showScreen('results-screen');
        renderResults(leads, meta);
      }, 350);
    }, CONFIG.SIMULATE_DELAY_MS);
  },

  loadSample(i) {
    const samples = [
      { biz: 'Digital Marketing Agency', target: 'Small restaurants and cafés', service: 'Social media management & paid ads', location: 'Miami, FL', deal: 'medium' },
      { biz: 'SaaS Product Company',     target: 'Mid-size B2B tech teams',      service: 'Project management software',       location: 'Austin, TX', deal: 'large' },
      { biz: 'Healthcare Consultancy',   target: 'Private clinics and GP surgeries', service: 'Operations & compliance consulting', location: 'New York, NY', deal: 'large' }
    ];
    const s = samples[i];
    document.getElementById('biz-type').value  = s.biz;
    document.getElementById('target').value    = s.target;
    document.getElementById('service').value   = s.service;
    document.getElementById('location').value  = s.location;
    document.getElementById('deal-size').value = s.deal;
  },

  toggleExpand(index, card) {
    const expand  = document.getElementById(`expand-${index}`);
    const isOpen  = expand.style.display === 'block';

    // Close all
    document.querySelectorAll('.lead-expand').forEach(e => e.style.display = 'none');
    document.querySelectorAll('.lead-card').forEach(c => c.classList.remove('expanded'));

    if (!isOpen) {
      expand.style.display = 'block';
      card.classList.add('expanded');
    }
  },

  filter(type, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const map = { all: () => true, hot: l => l.score >= 85, strong: l => l.score >= 70, warm: l => l.score >= 55 };
    State.filtered = State.leads.filter(map[type] || map.all);
    renderLeadCards(State.filtered);
  },

  sort(by) {
    const sorters = {
      score:  (a, b) => b.score - a.score,
      deal:   (a, b) => b.annual - a.annual,
      name:   (a, b) => a.name.localeCompare(b.name)
    };
    State.filtered = [...State.filtered].sort(sorters[by] || sorters.score);
    renderLeadCards(State.filtered);
  },

  saveToDB() {
    if (!State.leads.length) return;
    State.leads.forEach(lead => {
      if (!State.saved.find(s => s.name === lead.name)) {
        State.saved.push({ ...lead, savedAt: new Date().toLocaleTimeString() });
      }
    });
    this.renderDB();
    document.getElementById('db-panel').style.display = 'block';
    document.getElementById('db-panel').scrollIntoView({ behavior: 'smooth' });
  },

  renderDB() {
    const body = document.getElementById('db-body');
    const meta = getScoreMeta;
    body.innerHTML = State.saved.map(l => {
      const m = meta(l.score);
      return `<tr>
        <td style="color:var(--text)">${l.name}</td>
        <td style="color:${m.color};font-family:var(--font-mono)">${l.score}</td>
        <td>${l.industry}</td>
        <td style="color:var(--green)">${formatMoney(l.monthly)}</td>
        <td style="font-family:var(--font-mono);font-size:10px;color:var(--text3)">${l.savedAt}</td>
      </tr>`;
    }).join('');
  },

  exportCSV() {
    if (!State.leads.length) return;
    const headers = ['Rank','Company','Score','Industry','Location','Size','Decision Maker','Monthly Value','Annual Value','Pain Point'];
    const rows = State.leads.map((l, i) => [
      i + 1, l.name, l.score, l.industry, l.city, l.size,
      l.decisionMaker, formatMoney(l.monthly), formatMoney(l.annual), `"${l.painPoint}"`
    ]);
    const csv  = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `smartlead-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  },

  reset() {
    State.leads    = [];
    State.filtered = [];
    document.getElementById('forge-btn').disabled = false;
    document.getElementById('nav-leads-found').textContent    = '0';
    document.getElementById('nav-total-pipeline').textContent = '$0';
    document.getElementById('db-panel').style.display = 'none';
    showScreen('input-screen');
  }
};

// ── ANIMATED CANVAS BACKGROUND ─────────────────────────────────────────
(function initCanvas() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, nodes = [], edges = [];
  const MAX_NODES = 40;
  const CONNECT_DIST = 140;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    buildGraph();
  }

  function buildGraph() {
    nodes = Array.from({ length: MAX_NODES }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r:  Math.random() * 1.5 + 0.5
    }));
  }

  function tick(t) {
    ctx.clearRect(0, 0, W, H);

    // Move nodes
    nodes.forEach(n => {
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > W) n.vx *= -1;
      if (n.y < 0 || n.y > H) n.vy *= -1;
    });

    // Draw edges
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx   = nodes[i].x - nodes[j].x;
        const dy   = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONNECT_DIST) {
          const alpha = (1 - dist / CONNECT_DIST) * 0.12;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = `rgba(0,212,255,${alpha})`;
          ctx.lineWidth   = 0.5;
          ctx.stroke();
        }
      }
    }

    // Draw nodes
    nodes.forEach(n => {
      const pulse = 0.5 + 0.5 * Math.sin(t * 0.001 + n.x);
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,212,255,${0.2 + 0.3 * pulse})`;
      ctx.fill();
    });

    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(tick);
})();
