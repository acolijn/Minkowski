import React, { useMemo, useState } from 'react'
import ControlsPanel from './components/ControlsPanel'
import MinkowskiDiagram from './components/MinkowskiDiagram'
import { buildPrimeGridLines, buildSGridLines, computePrimeExtent } from './math/diagram'
import { ctPrimeAxis, gammaFromBeta, xPrimeAxis } from './math/lorentz'
import { createPlotTransform } from './utils/plot'

const WIDTH = 760
const HEIGHT = 760
const STEP = 1

export default function App() {
  const [beta, setBeta] = useState(0.5)
  const [range, setRange] = useState(5)
  const [eventPoints, setEventPoints] = useState([])
  const [eventLines, setEventLines] = useState([])

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

  return (
    <main className="app">
      <h1>Minkowski Diagram</h1>

      <ControlsPanel
        beta={beta}
        gamma={gamma}
        range={range}
        onBetaChange={setBeta}
        onRangeChange={setRange}
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

      <MinkowskiDiagram
        range={range}
        beta={beta}
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
      />
    </main>
  )
}
