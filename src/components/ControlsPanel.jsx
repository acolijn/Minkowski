import React from 'react'

export default function ControlsPanel({
  beta,
  gamma,
  range,
  restFrame,
  viewMode,
  onBetaChange,
  onRangeChange,
  onFrameToggle,
  onViewModeChange,
  onClearPoints,
  onClearLines,
  onClearAll,
}) {
  const restLabel = restFrame === 'S' ? 'S' : "S\u2032"
  const movingLabel = restFrame === 'S' ? "S\u2032" : 'S'

  return (
    <section className="controls">
      <div className="frame-toggle">
        <span className="frame-toggle-label">Rest frame:</span>
        <button type="button" className="frame-toggle-btn" onClick={onFrameToggle}>
          {restLabel} → {movingLabel}
        </button>
        <span className="frame-toggle-info">
          {restLabel} at rest, {movingLabel} moves with β = {beta.toFixed(2)}, γ = {gamma.toFixed(4)}
        </span>
      </div>

      <div className="slider-row">
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
      </div>

      <div className="slider-row">
        <label htmlFor="range">Range ±{range}</label>
        <input
          id="range"
          type="range"
          min={4}
          max={10}
          step={1}
          value={range}
          onChange={(event) => onRangeChange(Number(event.target.value))}
        />
      </div>

      <div className="control-actions">
        <div className="view-tabs">
          <button
            type="button"
            className={`view-tab${viewMode === '2d' ? ' view-tab-active' : ''}`}
            onClick={() => onViewModeChange('2d')}
          >
            2D
          </button>
          <button
            type="button"
            className={`view-tab${viewMode === '3d' ? ' view-tab-active' : ''}`}
            onClick={() => onViewModeChange('3d')}
          >
            3D
          </button>
        </div>
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
