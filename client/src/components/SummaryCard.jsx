import React from 'react'
import './SummaryCard.css'

export default function SummaryCard({ label, value, colorClass, sub }) {
  return (
    <div className="scard">
      <div className="scard-label">{label}</div>
      <div className={`scard-val ${colorClass}`}>{value}</div>
      <div className="scard-sub">{sub}</div>
    </div>
  )
}
