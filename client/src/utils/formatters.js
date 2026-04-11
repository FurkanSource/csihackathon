/**
 * SmartLead — utils/formatters.js
 * Shared utility functions used across components
 */

export function formatMoney(n) {
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000)     return '$' + (n / 1_000).toFixed(0) + 'K'
  return '$' + n
}

export function formatDate(d = new Date()) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function getScoreMeta(score) {
  if (score >= 85) return { label: 'Hot Lead', stroke: '#05FFA1', color: '#05FFA1' }
  if (score >= 70) return { label: 'Strong',   stroke: '#00FFFF', color: '#00FFFF' }
  if (score >= 55) return { label: 'Warm',     stroke: '#FFD700', color: '#FFD700' }
  return               { label: 'Cold',     stroke: '#FF3B5C', color: '#FF3B5C' }
}

export function exportCSV(leads) {
  const headers = ['Rank','Company','Score','Industry','Location','Size','Decision Maker','Monthly Value','Annual Value','Pain Point']
  const rows = leads.map((l, i) => [
    i + 1, l.name, l.score, l.industry, l.city, l.size,
    l.decisionMaker, formatMoney(l.monthly), formatMoney(l.annual), `"${l.painPoint}"`
  ])
  const csv  = [headers, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url
  a.download = `smartlead-${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
