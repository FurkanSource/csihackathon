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
  if (score >= 85) return { label: 'Hot Lead', stroke: '#10b981', color: '#10b981' }
  if (score >= 70) return { label: 'Strong',   stroke: '#00d4ff', color: '#00d4ff' }
  if (score >= 55) return { label: 'Warm',     stroke: '#f59e0b', color: '#f59e0b' }
  return               { label: 'Cold',     stroke: '#ef4444', color: '#ef4444' }
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
