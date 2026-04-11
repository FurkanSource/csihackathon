/**
 * SmartLead — data/sampleData.js
 * Mock lead generation engine used when backend is unavailable
 */

const PREFIXES  = ['Apex','Summit','Pinnacle','Nexus','Vantage','Sterling','Crest','Meridian','Horizon','Zenith','Cascade','Vertex','Luminary','Ironclad','Eclipse']
const SUFFIXES  = ['Solutions','Group','Partners','Co','Ventures','Collective','Studio','Works','Labs','Agency','Consulting','Dynamics','Systems','Enterprises']
const INDUSTRIES = ['Technology','Hospitality','Healthcare','Finance','Retail','Real Estate','Education','Manufacturing','Legal','Logistics','Media','Construction']
const SIZES     = ['2–10 employees','11–50 employees','51–200 employees','201–500 employees']
const ROLES     = ['CEO','Founder','Marketing Director','COO','Head of Growth','VP of Operations','CMO','Managing Director','Director of Sales','Chief Revenue Officer']
const CITIES    = ['New York, NY','Los Angeles, CA','Chicago, IL','Houston, TX','Miami, FL','Seattle, WA','Austin, TX','Boston, MA','Denver, CO','Atlanta, GA']
const SIGNALS   = ['Recently raised funding','Actively hiring','New product launched','Rebranding underway','Expanding to new markets','High review volume','Featured in industry press','Won recent award','Opened new location','Signed major partnership']
const PAINS     = [
  'struggling with inconsistent lead generation and client acquisition',
  'lacking a strong digital presence in an increasingly competitive market',
  'spending too much time on manual processes that could be automated',
  'losing customers to competitors with stronger online visibility',
  'unable to scale operations without better systems and tools',
  'experiencing declining engagement with their current marketing strategy',
  'facing high customer churn due to poor onboarding experiences',
  'missing revenue targets due to an unoptimized sales funnel'
]

const DEAL_RANGES = {
  small:      [500,    2000],
  medium:     [2000,   10000],
  large:      [10000,  50000],
  enterprise: [50000,  200000]
}

function rand(arr)         { return arr[Math.floor(Math.random() * arr.length)] }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function generateMockLeads(biz, target, service, location, dealSize) {
  const used   = new Set()
  const leads  = []
  const [min, max] = DEAL_RANGES[dealSize] || DEAL_RANGES.medium

  for (let i = 0; i < 5; i++) {
    let name
    do { name = `${rand(PREFIXES)} ${rand(SUFFIXES)}` } while (used.has(name))
    used.add(name)

    const industry      = rand(INDUSTRIES)
    const size          = rand(SIZES)
    const city          = location || rand(CITIES)
    const decisionMaker = rand(ROLES)
    const painPoint     = rand(PAINS)
    const signals       = shuffle(SIGNALS).slice(0, randInt(2, 4))

    let score = randInt(52, 97)
    if (dealSize === 'large' || dealSize === 'enterprise') score = Math.max(score, randInt(65, 97))
    const hotSignals = ['Recently raised funding','Actively hiring','New product launched']
    if (signals.some(s => hotSignals.includes(s))) score = Math.min(100, score + randInt(3, 8))

    const monthly = Math.round((min + (max - min) * (score / 100)) / 100) * 100
    const annual  = monthly * 12

    const reason = `${name} is a ${size} ${industry.toLowerCase()} company in ${city} that is currently ${painPoint}. Their ${signals[0].toLowerCase()} signal indicates strong buying intent and budget availability for ${service}.`

    const outreach = [
      `Connect with their ${decisionMaker} on LinkedIn — reference their recent ${signals[0].toLowerCase()}`,
      `Send a personalised cold email highlighting ROI from similar ${industry.toLowerCase()} clients`,
      `Offer a free 20-minute strategy call or audit to demonstrate immediate value`,
      `Follow up in 3–5 days with a relevant case study from your portfolio`
    ]

    leads.push({ name, score, industry, size, city, decisionMaker, painPoint, signals, monthly, annual, reason, outreach })
  }

  return leads.sort((a, b) => b.score - a.score)
}

export const SAMPLES = [
  { bizType: 'Digital Marketing Agency', target: 'Small restaurants and cafés', service: 'Social media management & paid ads', location: 'Miami, FL', dealSize: 'medium' },
  { bizType: 'SaaS Product Company',     target: 'Mid-size B2B tech teams',     service: 'Project management software',        location: 'Austin, TX', dealSize: 'large'  },
  { bizType: 'Healthcare Consultancy',   target: 'Private clinics and GP surgeries', service: 'Operations & compliance consulting', location: 'New York, NY', dealSize: 'large' }
]
