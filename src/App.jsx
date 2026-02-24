import React, { useCallback, useMemo, useState, lazy, Suspense } from 'react'
import ControlsPanel from './components/ControlsPanel'
import MinkowskiDiagram from './components/MinkowskiDiagram'
import { buildPrimeGridLines, buildSGridLines, computePrimeExtent } from './math/diagram'
import { ctPrimeAxis, gammaFromBeta, transform, xPrimeAxis } from './math/lorentz'
import { createPlotTransform } from './utils/plot'

const MinkowskiDiagram3D = lazy(() => import('./components/MinkowskiDiagram3D'))

const WIDTH = 760
const HEIGHT = 760
const STEP = 1

export default function App() {
  const [beta, setBeta] = useState(0.5)
  const [range, setRange] = useState(5)
  const [eventPoints, setEventPoints] = useState([])
  const [eventLines, setEventLines] = useState([])
  const [restFrame, setRestFrame] = useState('S')
  const [viewMode, setViewMode] = useState('2d')

  const gamma = useMemo(() => gammaFromBeta(beta), [beta])
  const xPrime = useMemo(() => xPrimeAxis(beta, -range, range), [beta, range])
  const ctPrime = useMemo(() => ctPrimeAxis(beta, -range, range), [beta, range])

  const primeExtent = useMemo(() => {
    return computePrimeExtent({ gamma, range, beta })
  }, [gamma, range, beta])

  const sGridLines = useMemo(() => {
    return buildSGridLines({ range, step: STEP })
  }, [range])

  const primeGridLines = useMemo(() => {
    return buildPrimeGridLines({ range, step: STEP, beta, gamma, primeExtent })
  }, [range, beta, gamma, primeExtent])

  const { toScreenX, toScreenY } = useMemo(() => {
    return createPlotTransform({ range, width: WIDTH, height: HEIGHT })
  }, [range])

  const handleFrameToggle = useCallback(() => {
    const transformPoint = (point) => {
      const result = transform({ ct: point.ct, x: point.x, beta })
      return { x: result.x, ct: result.ct }
    }

    setEventPoints((previous) => previous.map(transformPoint))
    setEventLines((previous) =>
      previous.map((line) => ({
        start: transformPoint(line.start),
        end: transformPoint(line.end),
      }))
    )
    setBeta(-beta)
    setRestFrame((previous) => (previous === 'S' ? 'SPrime' : 'S'))
  }, [beta])

  return (
    <main className="app">
      <h1>Minkowski Play</h1>

      <ControlsPanel
        beta={beta}
        gamma={gamma}
        range={range}
        restFrame={restFrame}
        viewMode={viewMode}
        onBetaChange={setBeta}
        onRangeChange={setRange}
        onFrameToggle={handleFrameToggle}
        onViewModeChange={setViewMode}
        onClearPoints={() => {
          setEventPoints([])
        }}
        onClearLines={() => {
          setEventLines([])
        }}
        onClearAll={() => {
          setEventPoints([])
          setEventLines([])
        }}
      />

      {viewMode === '2d' ? (
        <MinkowskiDiagram
          range={range}
          beta={beta}
          restFrame={restFrame}
          sGridLines={sGridLines}
          primeGridLines={primeGridLines}
          xPrime={xPrime}
          ctPrime={ctPrime}
          toScreenX={toScreenX}
          toScreenY={toScreenY}
          eventPoints={eventPoints}
          eventLines={eventLines}
          onAddPoint={(point) => {
            setEventPoints((previous) => [...previous, point])
          }}
          onAddLine={(line) => {
            setEventLines((previous) => [...previous, line])
          }}
          onDeletePoint={(indexToDelete) => {
            setEventPoints((previous) => previous.filter((_, index) => index !== indexToDelete))
          }}
          onUpdatePoint={(indexToUpdate, updatedPoint) => {
            setEventPoints((previous) =>
              previous.map((point, index) => (index === indexToUpdate ? updatedPoint : point))
            )
          }}
          onUpdateLineEndpoint={(indexToUpdate, endpoint, updatedPoint) => {
            setEventLines((previous) =>
              previous.map((line, index) => {
                if (index !== indexToUpdate) {
                  return line
                }

                if (endpoint === 'start') {
                  return {
                    ...line,
                    start: updatedPoint,
                  }
                }

                return {
                  ...line,
                  end: updatedPoint,
                }
              })
            )
          }}
        >
          <Suspense fallback={<div className="loading-3d mini">Loading 3D…</div>}>
            <MinkowskiDiagram3D
              range={range}
              beta={beta}
              restFrame={restFrame}
              eventPoints={eventPoints}
              eventLines={eventLines}
              mini
            />
          </Suspense>
        </MinkowskiDiagram>
      ) : (
        <Suspense fallback={<div className="loading-3d">Loading 3D view…</div>}>
          <MinkowskiDiagram3D
            range={range}
            beta={beta}
            restFrame={restFrame}
            eventPoints={eventPoints}
            eventLines={eventLines}
          />
        </Suspense>
      )}
    </main>
  )
}
