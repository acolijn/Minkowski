import React from 'react'

export default function ControlsPanel({
  beta,
  gamma,
  range,
  onBetaChange,
  onRangeChange,
  onClearPoints,
  onClearLines,
  onClearAll,
}) {
  return (
    <section className="controls">
      <label htmlFor="beta">β (v/c)</label>
      <input
        id="beta"
        type="range"
        min={-0.95}
        max={0.95}
        step={0.01}
        value={beta}
        onChange={(event) => onBetaChange(Number(event.target.value))}
      />
      <div className="values">
        <span>β = {beta.toFixed(2)}</span>
        <span>γ = {gamma.toFixed(4)}</span>
      </div>

      <label htmlFor="range">Range</label>
      <input
        id="range"
        type="range"
        min={4}
        max={10}
        step={1}
        value={range}
        onChange={(event) => onRangeChange(Number(event.target.value))}
      />
      <div className="values">
        <span>Range = ±{range}</span>
      </div>

      <div className="control-actions">
        <button type="button" onClick={onClearPoints}>
          Clear points
        </button>
        <button type="button" onClick={onClearLines}>
          Clear lines
        </button>
        <button type="button" onClick={onClearAll}>
          Clear all
        </button>
      </div>
    </section>
  )
}
