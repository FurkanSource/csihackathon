import React from 'react'

export default function FilterBar({ activeFilter, onFilter, onSort }) {
  const filters = [
    { key: 'all',    label: 'All' },
    { key: 'hot',    label: '🔥 Hot (85+)' },
    { key: 'strong', label: '💎 Strong (70+)' },
    { key: 'warm',   label: '⚡ Warm (55+)' },
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
          {f.label}
        </button>
      ))}
      <div className="filter-right">
        <span className="filter-label">Sort:</span>
        <select className="filter-select" onChange={e => onSort(e.target.value)}>
          <option value="score">Score ↓</option>
          <option value="deal">Deal Value ↓</option>
          <option value="name">Name A–Z</option>
        </select>
      </div>
    </div>
  )
}
