import React from 'react'
import './Navbar.css'

export default function Navbar({ totalPipeline, leadsFound, onHome }) {
  return (
    <nav className="navbar">
      <button className="nav-logo" onClick={onHome} type="button">
        <div className="nav-dot" />
        SmartLead
      </button>

      <span className="nav-badge">AI LEAD ENGINE v2.0</span>

      <div className="nav-right">
        <div className="nav-stat">
          <div className="nav-stat-num">{totalPipeline}</div>
          <div className="nav-stat-label">pipeline value</div>
        </div>
        <div className="nav-divider" />
        <div className="nav-stat">
          <div className="nav-stat-num">{leadsFound}</div>
          <div className="nav-stat-label">leads found</div>
        </div>
      </div>
    </nav>
  )
}
