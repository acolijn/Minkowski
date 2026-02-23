export function computePrimeExtent({ gamma, range, beta }) {
  return Math.ceil(gamma * range * (1 + Math.abs(beta)))
}

export function buildSGridLines({ range, step }) {
  const lines = []
  for (let value = -range; value <= range; value += step) {
    lines.push({
      key: `vx-${value}`,
      kind: value === 0 ? 'axis' : 'space',
      x1: value,
      ct1: -range,
      x2: value,
      ct2: range,
    })

    lines.push({
      key: `hy-${value}`,
      kind: value === 0 ? 'axis' : 'time',
      x1: -range,
      ct1: value,
      x2: range,
      ct2: value,
    })
  }
  return lines
}

export function buildPrimeGridLines({ range, step, beta, gamma, primeExtent }) {
  const lines = []

  for (let constant = -primeExtent; constant <= primeExtent; constant += step) {
    lines.push({
      key: `xp-${constant}`,
      kind: constant === 0 ? 'axis' : 'space',
      points: [
        { ct: -range, x: beta * -range + constant / gamma },
        { ct: range, x: beta * range + constant / gamma },
      ],
    })

    lines.push({
      key: `ctp-${constant}`,
      kind: constant === 0 ? 'axis' : 'time',
      points: [
        { x: -range, ct: beta * -range + constant / gamma },
        { x: range, ct: beta * range + constant / gamma },
      ],
    })
  }

  return lines
}
