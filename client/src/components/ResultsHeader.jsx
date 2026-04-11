import React from 'react'

export default function ResultsHeader({ title, meta, onExport, onSave, onReset }) {
  return (
    <div className="results-topbar screen">
      <div>
        <div className="results-eyebrow">Lead Intelligence Report</div>
        <h2 className="results-title">{title}</h2>
        <p className="results-meta">{meta}</p>
      </div>
      <div className="results-actions">
        <button className="action-btn" onClick={onExport}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export CSV
        </button>
        <button className="action-btn" onClick={onSave}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <ellipse cx="12" cy="5" rx="9" ry="3"/>
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
          </svg>
          Save to DB
        </button>
        <button className="action-btn primary" onClick={onReset}>← New Search</button>
      </div>
    </div>
  )
}
