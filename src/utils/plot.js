export function createPlotTransform({ range, width, height }) {
  const toScreenX = (x) => ((x + range) / (2 * range)) * width
  const toScreenY = (ct) => height - ((ct + range) / (2 * range)) * height

  return { toScreenX, toScreenY }
}

export function polylinePath(points, toScreenX, toScreenY) {
  return points.map((point) => `${toScreenX(point.x)},${toScreenY(point.ct)}`).join(' ')
}
