export function gammaFromBeta(beta) {
  const clampedBeta = Math.max(-0.999999, Math.min(0.999999, beta))
  return 1 / Math.sqrt(1 - clampedBeta * clampedBeta)
}

export function transform({ ct, x, y = 0, z = 0, beta, inverse = false }) {
  const gamma = gammaFromBeta(beta)
  const sign = inverse ? -1 : 1

  return {
    ct: gamma * (ct - sign * beta * x),
    x: gamma * (x - sign * beta * ct),
    y,
    z,
  }
}

export function xPrimeAxis(beta, xMin, xMax) {
  const points = []
  for (let x = xMin; x <= xMax; x += 0.25) {
    points.push({ x, ct: beta * x })
  }
  return points
}

export function ctPrimeAxis(beta, ctMin, ctMax) {
  if (Math.abs(beta) < 1e-6) {
    return [
      { x: 0, ct: ctMin },
      { x: 0, ct: ctMax },
    ]
  }

  const points = []
  for (let ct = ctMin; ct <= ctMax; ct += 0.25) {
    points.push({ x: beta * ct, ct })
  }
  return points
}
