import React from 'react'

const IconFlame = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
  </svg>
)
const IconGem = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/>
  </svg>
)
const IconBolt = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>
  </svg>
)

export default function FilterBar({ activeFilter, onFilter, onSort }) {
  const filters = [
    { key: 'all',    label: 'All',          icon: null },
    { key: 'hot',    label: 'Hot (85+)',     icon: <IconFlame /> },
    { key: 'strong', label: 'Strong (70+)',  icon: <IconGem /> },
    { key: 'warm',   label: 'Warm (55+)',    icon: <IconBolt /> },
  ]

  return (
    <div className="filter-bar">
      <span className="filter-label">Filter:</span>
      {filters.map(f => (
        <button
          key={f.key}
          className={`filter-btn ${activeFilter === f.key ? 'active' : ''}`}
          onClick={() => onFilter(f.key)}
        >
          {f.icon} {f.label}
        </button>
      ))}
      <div className="filter-right">
        <span className="filter-label">Sort:</span>
        <select className="filter-select" onChange={e => onSort(e.target.value)}>
          <option value="score">Score</option>
          <option value="deal">Deal Value</option>
          <option value="name">Name A-Z</option>
        </select>
      </div>
    </div>
  )
}
