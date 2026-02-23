import React, { useRef, useState } from 'react'
import { transform } from '../math/lorentz'
import { polylinePath } from '../utils/plot'

const WIDTH = 760
const HEIGHT = 760
const PADDING = 44
const PLOT_WIDTH = WIDTH - 2 * PADDING
const PLOT_HEIGHT = HEIGHT - 2 * PADDING

function lineClass(kind, frame) {
  if (kind === 'axis') {
    return frame === 'prime' ? 'prime-axis' : 'axis'
  }
  if (kind === 'time') {
    return frame === 'prime' ? 'prime-time-grid' : 'time-grid'
  }
  return frame === 'prime' ? 'prime-grid' : 'grid'
}

export default function MinkowskiDiagram({
  range,
  beta,
  sGridLines,
  primeGridLines,
  xPrime,
  ctPrime,
  toScreenX,
  toScreenY,
  eventPoints,
  eventLines,
  onAddPoint,
  onAddLine,
  onDeletePoint,
  onUpdatePoint,
  onUpdateLineEndpoint,
}) {
  const svgRef = useRef(null)
  const dragStartRef = useRef(null)
  const dragTargetRef = useRef(null)
  const movedRef = useRef(false)
  const [dragCurrent, setDragCurrent] = useState(null)
  const [cursorReadout, setCursorReadout] = useState(null)
  const [hoveredPointReadout, setHoveredPointReadout] = useState(null)
  const [hoveredLineInvariant, setHoveredLineInvariant] = useState(null)
  const gamma = 1 / Math.sqrt(1 - beta * beta)

  function toSvgX(x) {
    return PADDING + (toScreenX(x) / WIDTH) * PLOT_WIDTH
  }

  function toSvgY(ct) {
    return PADDING + (toScreenY(ct) / HEIGHT) * PLOT_HEIGHT
  }

  function invariantIntervalSquared(line) {
    const dx = line.end.x - line.start.x
    const dct = line.end.ct - line.start.ct
    return dct * dct - dx * dx
  }

  function formatNumber(value) {
    return Number(value.toFixed(2))
  }

  function xPrimeTickPosition(value) {
    const base = {
      x: gamma * value,
      ct: gamma * beta * value,
    }
    const normalScale = Math.sqrt(1 + beta * beta)
    const offset = 0.1

    return {
      x: base.x + (-beta / normalScale) * offset,
      ct: base.ct + (1 / normalScale) * offset,
    }
  }

  function ctPrimeTickPosition(value) {
    const base = {
      x: gamma * beta * value,
      ct: gamma * value,
    }
    const normalScale = Math.sqrt(1 + beta * beta)
    const offset = 0.18

    return {
      x: base.x + (1 / normalScale) * offset,
      ct: base.ct + (-beta / normalScale) * offset,
    }
  }

  function positiveAxisLabelPosition(vx, vct, offset) {
    const epsilon = 1e-9
    const tx = range / Math.max(Math.abs(vx), epsilon)
    const tct = range / Math.max(Math.abs(vct), epsilon)
    const t = Math.min(tx, tct)

    const end = {
      x: t * vx,
      ct: t * vct,
    }

    const length = Math.hypot(vx, vct) || 1
    const ux = vx / length
    const uct = vct / length

    return {
      x: end.x + ux * offset,
      ct: end.ct + uct * offset,
    }
  }

  const xPrimeLabel = positiveAxisLabelPosition(1, beta, 0.35)
  const ctPrimeLabel = positiveAxisLabelPosition(beta, 1, 0.35)

  function handlePointHover(point) {
    const transformed = transform({ ct: point.ct, x: point.x, beta })
    setHoveredPointReadout({
      s: point,
      sPrime: {
        x: transformed.x,
        ct: transformed.ct,
      },
    })
  }

  function setCoordinateReadout(point) {
    if (!point) {
      setCursorReadout(null)
      return
    }

    const transformed = transform({ ct: point.ct, x: point.x, beta })

    setCursorReadout({
      s: point,
      sPrime: {
        x: transformed.x,
        ct: transformed.ct,
      },
    })
  }

  function toWorldPoint(clientX, clientY) {
    if (!svgRef.current) {
      return null
    }

    const bounds = svgRef.current.getBoundingClientRect()
    if (bounds.width === 0 || bounds.height === 0) {
      return null
    }

    const svgX = ((clientX - bounds.left) / bounds.width) * WIDTH
    const svgY = ((clientY - bounds.top) / bounds.height) * HEIGHT

    if (svgX < PADDING || svgX > PADDING + PLOT_WIDTH || svgY < PADDING || svgY > PADDING + PLOT_HEIGHT) {
      return null
    }

    const x = ((svgX - PADDING) / PLOT_WIDTH) * (2 * range) - range
    const ct = range - ((svgY - PADDING) / PLOT_HEIGHT) * (2 * range)

    return { x, ct }
  }

  function handlePointerDown(event) {
    if (event.button !== 0) {
      return
    }

    event.preventDefault()

    const start = toWorldPoint(event.clientX, event.clientY)
    if (!start) {
      return
    }

    event.currentTarget.setPointerCapture(event.pointerId)
    dragStartRef.current = start
    movedRef.current = false
    setDragCurrent(start)
    setCoordinateReadout(start)
  }

  function startPointDrag(event, index) {
    if (event.button !== 0) {
      return
    }

    event.stopPropagation()

    if (event.detail === 2) {
      dragTargetRef.current = null
      setHoveredPointReadout(null)
      onDeletePoint(index)
      return
    }

    dragTargetRef.current = { type: 'point', index }
    movedRef.current = true
    svgRef.current?.setPointerCapture(event.pointerId)
  }

  function startLineEndpointDrag(event, index, endpoint) {
    if (event.button !== 0) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    dragTargetRef.current = { type: 'line-endpoint', index, endpoint }
    movedRef.current = true
    svgRef.current?.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event) {
    const current = toWorldPoint(event.clientX, event.clientY)

    if (dragTargetRef.current) {
      if (!current) {
        return
      }

      setCoordinateReadout(current)

      if (dragTargetRef.current.type === 'point') {
        onUpdatePoint(dragTargetRef.current.index, current)
        return
      }

      onUpdateLineEndpoint(dragTargetRef.current.index, dragTargetRef.current.endpoint, current)
      return
    }

    if (!current) {
      if (!dragStartRef.current) {
        setCoordinateReadout(null)
      }
      return
    }

    setCoordinateReadout(current)

    if (!dragStartRef.current || (event.buttons & 1) !== 1) {
      return
    }

    const dx = current.x - dragStartRef.current.x
    const dct = current.ct - dragStartRef.current.ct
    if (Math.hypot(dx, dct) > 0.03) {
      movedRef.current = true
    }

    setDragCurrent(current)
  }

  function handlePointerUp(event) {
    if (event.button !== 0) {
      return
    }

    if (dragTargetRef.current) {
      dragTargetRef.current = null
      return
    }

    if (!dragStartRef.current) {
      return
    }

    const end = toWorldPoint(event.clientX, event.clientY) ?? dragCurrent ?? dragStartRef.current
    const start = dragStartRef.current

    if (movedRef.current) {
      onAddLine({ start, end })
    } else {
      onAddPoint(start)
    }

    setCoordinateReadout(end)

    dragStartRef.current = null
    movedRef.current = false
    setDragCurrent(null)
  }

  return (
    <section className="plot-layout">
      <section className="plot-shell">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label="Minkowski diagram"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={() => {
            if (!dragStartRef.current) {
              setCoordinateReadout(null)
            }
          }}
        >
        <defs>
          <clipPath id="plot-clip">
            <rect x={PADDING} y={PADDING} width={PLOT_WIDTH} height={PLOT_HEIGHT} />
          </clipPath>
        </defs>

        <g clipPath="url(#plot-clip)">
          {sGridLines.map((line) => (
            <line
              key={line.key}
              x1={toSvgX(line.x1)}
              y1={toSvgY(line.ct1)}
              x2={toSvgX(line.x2)}
              y2={toSvgY(line.ct2)}
              className={lineClass(line.kind, 's')}
            />
          ))}

          {primeGridLines.map((line) => (
            <polyline
              key={line.key}
              points={polylinePath(line.points, toSvgX, toSvgY)}
              className={lineClass(line.kind, 'prime')}
              fill="none"
            />
          ))}

          <line
            x1={toSvgX(-range)}
            y1={toSvgY(-range)}
            x2={toSvgX(range)}
            y2={toSvgY(range)}
            className="lightcone"
          />
          <line
            x1={toSvgX(-range)}
            y1={toSvgY(range)}
            x2={toSvgX(range)}
            y2={toSvgY(-range)}
            className="lightcone"
          />

          <polyline points={polylinePath(xPrime, toSvgX, toSvgY)} className="prime-axis" fill="none" />
          <polyline points={polylinePath(ctPrime, toSvgX, toSvgY)} className="prime-axis" fill="none" />

          {eventLines.map((line, index) => (
            <line
              key={`event-line-${index}`}
              x1={toSvgX(line.start.x)}
              y1={toSvgY(line.start.ct)}
              x2={toSvgX(line.end.x)}
              y2={toSvgY(line.end.ct)}
              className="event-line"
              onMouseEnter={() => {
                setHoveredLineInvariant(invariantIntervalSquared(line))
              }}
              onMouseLeave={() => {
                setHoveredLineInvariant(null)
              }}
            />
          ))}

          {dragStartRef.current && dragCurrent && (
            <line
              x1={toSvgX(dragStartRef.current.x)}
              y1={toSvgY(dragStartRef.current.ct)}
              x2={toSvgX(dragCurrent.x)}
              y2={toSvgY(dragCurrent.ct)}
              className="event-line preview"
            />
          )}

          {eventPoints.map((point, index) => (
            <circle
              key={`event-point-${index}`}
              cx={toSvgX(point.x)}
              cy={toSvgY(point.ct)}
              r={5}
              className="event-point"
              onPointerDown={(event) => {
                startPointDrag(event, index)
              }}
              onMouseEnter={() => {
                handlePointHover(point)
              }}
              onMouseLeave={() => {
                setHoveredPointReadout(null)
              }}
            >
              <title>Double-click to delete point</title>
            </circle>
          ))}

          {eventLines.map((line, index) => (
            <React.Fragment key={`event-line-endpoints-${index}`}>
              <circle
                cx={toSvgX(line.start.x)}
                cy={toSvgY(line.start.ct)}
                r={4}
                className="event-endpoint"
                onPointerDown={(event) => {
                  startLineEndpointDrag(event, index, 'start')
                }}
              />
              <circle
                cx={toSvgX(line.end.x)}
                cy={toSvgY(line.end.ct)}
                r={4}
                className="event-endpoint"
                onPointerDown={(event) => {
                  startLineEndpointDrag(event, index, 'end')
                }}
              />
            </React.Fragment>
          ))}
        </g>

        <rect x={PADDING} y={PADDING} width={PLOT_WIDTH} height={PLOT_HEIGHT} className="plot-frame" />

        {Array.from({ length: 2 * range + 1 }, (_, index) => index - range)
          .filter((value) => value !== 0)
          .map((value) => (
            <text key={`x-tick-${value}`} x={toSvgX(value)} y={toSvgY(-0.16)} className="axis-tick x-tick">
              {value}
            </text>
          ))}

        {Array.from({ length: 2 * range + 1 }, (_, index) => index - range)
          .filter((value) => value !== 0)
          .map((value) => (
            <text key={`ct-tick-${value}`} x={toSvgX(0.16)} y={toSvgY(value)} className="axis-tick ct-tick">
              {value}
            </text>
          ))}

        {Array.from({ length: 2 * range + 1 }, (_, index) => index - range)
          .filter((value) => value !== 0)
          .map((value) => {
            const position = xPrimeTickPosition(value)
            if (
              position.x < -range ||
              position.x > range ||
              position.ct < -range ||
              position.ct > range
            ) {
              return null
            }

            return (
              <text
                key={`x-prime-tick-${value}`}
                x={toSvgX(position.x)}
                y={toSvgY(position.ct)}
                className="prime-tick x-prime-tick"
              >
                {value}
              </text>
            )
          })}

        {Array.from({ length: 2 * range + 1 }, (_, index) => index - range)
          .filter((value) => value !== 0)
          .map((value) => {
            const position = ctPrimeTickPosition(value)
            if (
              position.x < -range ||
              position.x > range ||
              position.ct < -range ||
              position.ct > range
            ) {
              return null
            }

            return (
              <text
                key={`ct-prime-tick-${value}`}
                x={toSvgX(position.x)}
                y={toSvgY(position.ct)}
                className="prime-tick ct-prime-tick"
              >
                {value}
              </text>
            )
          })}

        {hoveredPointReadout && (
          <>
            <rect x={14} y={90} width={334} height={68} rx={8} className="hover-box" />
            <text x={24} y={116} className="hover-text">
              S: (x, ct) = ({hoveredPointReadout.s.x.toFixed(2)}, {hoveredPointReadout.s.ct.toFixed(2)})
            </text>
            <text x={24} y={142} className="hover-text">
              S′: (x′, ct′) = ({hoveredPointReadout.sPrime.x.toFixed(2)}, {hoveredPointReadout.sPrime.ct.toFixed(2)})
            </text>
          </>
        )}

        {hoveredLineInvariant !== null && (
          <>
            <rect x={14} y={166} width={334} height={42} rx={8} className="hover-box" />
            <text x={24} y={193} className="hover-text">
              Line invariant: Δs² = Δct² - Δx² = {formatNumber(hoveredLineInvariant)}
            </text>
          </>
        )}

        <text x={toSvgX(range + 0.3)} y={toSvgY(0)} className="axis-label margin-label">
          x
        </text>
        <text x={toSvgX(0)} y={toSvgY(range + 0.3)} className="axis-label margin-label">
          ct
        </text>
        <text x={toSvgX(xPrimeLabel.x)} y={toSvgY(xPrimeLabel.ct)} className="prime-label margin-label">
          x′
        </text>
        <text x={toSvgX(ctPrimeLabel.x)} y={toSvgY(ctPrimeLabel.ct)} className="prime-label margin-label">
          ct′
        </text>
        </svg>
      </section>

      <aside className="coordinates-panel" aria-live="polite">
        <h2>Coordinates</h2>
        {cursorReadout ? (
          <>
            <p className="coordinates-row">
              <span className="coordinates-label">S:</span>
              <span>(x, ct) = ({cursorReadout.s.x.toFixed(2)}, {cursorReadout.s.ct.toFixed(2)})</span>
            </p>
            <p className="coordinates-row coordinates-row-prime">
              <span className="coordinates-label">S′:</span>
              <span>(x′, ct′) = ({cursorReadout.sPrime.x.toFixed(2)}, {cursorReadout.sPrime.ct.toFixed(2)})</span>
            </p>
          </>
        ) : (
          <p className="coordinates-empty">Move over the diagram</p>
        )}
      </aside>
    </section>
  )
}
