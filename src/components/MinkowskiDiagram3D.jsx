import React, { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Text, Line } from '@react-three/drei'
import * as THREE from 'three'
import { gammaFromBeta } from '../math/lorentz'

/**
 * 3D Minkowski diagram: (x, y, ct)
 * Three.js uses (x, y, z) — we map ct → Three.js Y-axis, x → X, y → Z.
 */

function LightCone({ range, segments = 64 }) {
  // Future cone (ct > 0): tip at origin, wide end at ct = +range
  const futureCone = useMemo(() => {
    const geo = new THREE.ConeGeometry(range, range, segments, 1, true)
    // ConeGeometry has tip at +Y and base at -Y; flip it so tip is at bottom (origin)
    geo.rotateX(Math.PI)
    geo.translate(0, range / 2, 0)
    return geo
  }, [range, segments])

  // Past cone (ct < 0): tip at origin, wide end at ct = -range
  const pastCone = useMemo(() => {
    const geo = new THREE.ConeGeometry(range, range, segments, 1, true)
    // Tip already at +Y; translate down so tip sits at origin
    geo.translate(0, -range / 2, 0)
    return geo
  }, [range, segments])

  return (
    <>
      <mesh geometry={futureCone}>
        <meshBasicMaterial
          color="#2563eb"
          transparent
          opacity={0.12}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh geometry={pastCone}>
        <meshBasicMaterial
          color="#2563eb"
          transparent
          opacity={0.12}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* Wireframe rings at integer ct levels */}
      {Array.from({ length: 2 * range + 1 }, (_, i) => i - range).map((ct) => {
        if (ct === 0) return null
        const r = Math.abs(ct)
        return (
          <mesh key={`ring-${ct}`} position={[0, ct, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[r - 0.02, r + 0.02, 64]} />
            <meshBasicMaterial
              color="#2563eb"
              transparent
              opacity={0.3}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        )
      })}
    </>
  )
}

function Axes({ range, restFrame }) {
  const sColor = '#111827'
  const sPrimeColor = '#dc2626'

  const orthoColor = restFrame === 'S' ? sColor : sPrimeColor

  const xLabel = restFrame === 'S' ? 'x' : "x'"
  const yLabel = restFrame === 'S' ? 'y' : "y'"
  const ctLabel = restFrame === 'S' ? 'ct' : "ct'"

  const labelOffset = 0.4

  return (
    <>
      {/* X axis */}
      <Line
        points={[[-range, 0, 0], [range, 0, 0]]}
        color={orthoColor}
        lineWidth={2}
      />
      <Text
        position={[range + labelOffset, 0, 0]}
        fontSize={0.4}
        color={orthoColor}
        anchorX="center"
        anchorY="middle"
      >
        {xLabel}
      </Text>

      {/* Y axis (our physics y, Three.js z) */}
      <Line
        points={[[0, 0, -range], [0, 0, range]]}
        color={orthoColor}
        lineWidth={2}
      />
      <Text
        position={[0, 0, range + labelOffset]}
        fontSize={0.4}
        color={orthoColor}
        anchorX="center"
        anchorY="middle"
      >
        {yLabel}
      </Text>

      {/* ct axis (Three.js y) */}
      <Line
        points={[[0, -range, 0], [0, range, 0]]}
        color={orthoColor}
        lineWidth={2}
      />
      <Text
        position={[0, range + labelOffset, 0]}
        fontSize={0.4}
        color={orthoColor}
        anchorX="center"
        anchorY="middle"
      >
        {ctLabel}
      </Text>
    </>
  )
}

function BoostAxes({ range, beta, restFrame }) {
  const gamma = gammaFromBeta(beta)
  const sColor = '#111827'
  const sPrimeColor = '#dc2626'

  const tiltedColor = restFrame === 'S' ? sPrimeColor : sColor

  const xLabel = restFrame === 'S' ? "x'" : 'x'
  const ctLabel = restFrame === 'S' ? "ct'" : 'ct'

  const labelOffset = 0.4

  // x' axis direction in S coordinates: (1, beta, 0)
  // ct' axis direction in S coordinates: (beta, 1, 0)
  // both normalized for display
  const xDir = [1, beta, 0]
  const ctDir = [beta, 1, 0]

  function scaleToRange(dir) {
    const maxComp = Math.max(Math.abs(dir[0]), Math.abs(dir[1]), Math.abs(dir[2])) || 1
    const t = range / maxComp
    return [dir[0] * t, dir[1] * t, dir[2] * t]
  }

  const xEnd = scaleToRange(xDir)
  const xStart = [-xEnd[0], -xEnd[1], -xEnd[2]]
  const ctEnd = scaleToRange(ctDir)
  const ctStart = [-ctEnd[0], -ctEnd[1], -ctEnd[2]]

  return (
    <>
      {/* Boosted x' axis */}
      <Line points={[xStart, xEnd]} color={tiltedColor} lineWidth={2} />
      <Text
        position={[xEnd[0] + labelOffset * xDir[0] / Math.hypot(...xDir),
                   xEnd[1] + labelOffset * xDir[1] / Math.hypot(...xDir),
                   0]}
        fontSize={0.35}
        color={tiltedColor}
        anchorX="center"
        anchorY="middle"
      >
        {xLabel}
      </Text>

      {/* Boosted ct' axis */}
      <Line points={[ctStart, ctEnd]} color={tiltedColor} lineWidth={2} />
      <Text
        position={[ctEnd[0] + labelOffset * ctDir[0] / Math.hypot(...ctDir),
                   ctEnd[1] + labelOffset * ctDir[1] / Math.hypot(...ctDir),
                   0]}
        fontSize={0.35}
        color={tiltedColor}
        anchorX="center"
        anchorY="middle"
      >
        {ctLabel}
      </Text>
    </>
  )
}

function GridPlanes({ range, restFrame }) {
  const sColor = '#111827'
  const sPrimeColor = '#dc2626'
  const orthoColor = restFrame === 'S' ? sColor : sPrimeColor

  const lines = []
  for (let v = -range; v <= range; v += 1) {
    if (v === 0) continue
    // Vertical grid lines in x-ct plane (at y=0)
    lines.push(
      <Line
        key={`xct-x-${v}`}
        points={[[v, -range, 0], [v, range, 0]]}
        color={orthoColor}
        lineWidth={0.5}
        transparent
        opacity={0.2}
      />
    )
    lines.push(
      <Line
        key={`xct-ct-${v}`}
        points={[[-range, v, 0], [range, v, 0]]}
        color={orthoColor}
        lineWidth={0.5}
        transparent
        opacity={0.2}
        dashed
        dashSize={0.15}
        gapSize={0.12}
      />
    )
    // Grid in y-ct plane (at x=0)
    lines.push(
      <Line
        key={`yct-y-${v}`}
        points={[[0, -range, v], [0, range, v]]}
        color={orthoColor}
        lineWidth={0.5}
        transparent
        opacity={0.15}
      />
    )
    lines.push(
      <Line
        key={`yct-ct-${v}`}
        points={[[0, v, -range], [0, v, range]]}
        color={orthoColor}
        lineWidth={0.5}
        transparent
        opacity={0.15}
        dashed
        dashSize={0.15}
        gapSize={0.12}
      />
    )
  }
  return <>{lines}</>
}

function EventPoints3D({ points }) {
  return (
    <>
      {points.map((point, index) => (
        <mesh
          key={`ep-${index}`}
          position={[point.x, point.ct, point.y || 0]}
        >
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color="#16a34a" />
        </mesh>
      ))}
    </>
  )
}

function EventLines3D({ lines }) {
  return (
    <>
      {lines.map((line, index) => (
        <Line
          key={`el-${index}`}
          points={[
            [line.start.x, line.start.ct, line.start.y || 0],
            [line.end.x, line.end.ct, line.end.y || 0],
          ]}
          color="#16a34a"
          lineWidth={2.5}
        />
      ))}
    </>
  )
}

function TickMarks({ range, restFrame }) {
  const sColor = '#111827'
  const sPrimeColor = '#dc2626'
  const color = restFrame === 'S' ? sColor : sPrimeColor

  const ticks = []
  for (let v = -range; v <= range; v += 1) {
    if (v === 0) continue
    // X-axis ticks
    ticks.push(
      <Text
        key={`xt-${v}`}
        position={[v, -0.3, 0]}
        fontSize={0.22}
        color={color}
        anchorX="center"
        anchorY="top"
      >
        {v}
      </Text>
    )
    // ct-axis ticks
    ticks.push(
      <Text
        key={`ctt-${v}`}
        position={[0.25, v, 0]}
        fontSize={0.22}
        color={color}
        anchorX="left"
        anchorY="middle"
      >
        {v}
      </Text>
    )
  }
  return <>{ticks}</>
}

export default function MinkowskiDiagram3D({
  range,
  beta,
  restFrame,
  eventPoints,
  eventLines,
  mini = false,
}) {
  const containerClass = mini ? 'diagram-3d-container diagram-3d-mini' : 'diagram-3d-container'
  const cameraDistance = mini ? 2.8 : 2.2

  return (
    <div className={containerClass}>
      <Canvas
        camera={{ position: [range * cameraDistance, range * (cameraDistance * 0.8), range * cameraDistance], fov: 45, near: 0.1, far: 200 }}
        style={{ background: '#ffffff' }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 10, 5]} intensity={0.5} />

        <Axes range={range} restFrame={restFrame} />
        <BoostAxes range={range} beta={beta} restFrame={restFrame} />
        {!mini && <GridPlanes range={range} restFrame={restFrame} />}
        {!mini && <TickMarks range={range} restFrame={restFrame} />}
        <LightCone range={range} />
        <EventPoints3D points={eventPoints} />
        <EventLines3D lines={eventLines} />

        <OrbitControls
          enableDamping
          dampingFactor={0.15}
          minDistance={3}
          maxDistance={range * 5}
        />
      </Canvas>
    </div>
  )
}
