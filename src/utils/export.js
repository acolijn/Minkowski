// Inline SVG CSS so the exported file is self-contained (external stylesheets
// are not applied when an SVG is serialised to a Blob / data-URL).
const DIAGRAM_CSS = `
  svg { background: white; }
  .plot-frame { fill: none; stroke: #d1d5db; stroke-width: 1.2; }
  .grid { stroke: #d1d5db; stroke-width: 1; }
  .time-grid { stroke: #d1d5db; stroke-width: 1; stroke-dasharray: 6 5; }
  .axis { stroke: #111827; stroke-width: 2; }
  .lightcone { stroke: #2563eb; stroke-width: 2; }
  .prime-axis { stroke: #dc2626; stroke-width: 2.5; }
  .prime-grid { stroke: #fca5a5; stroke-width: 1; }
  .prime-time-grid { stroke: #fca5a5; stroke-width: 1; stroke-dasharray: 6 5; }
  .axis-label { fill: #111827; font-size: 20px; font-weight: 600; }
  .margin-label { dominant-baseline: middle; text-anchor: middle; }
  .axis-tick { fill: #4b5563; font-size: 11px; font-weight: 500; text-anchor: middle; dominant-baseline: middle; }
  .x-tick { dominant-baseline: auto; }
  .ct-tick { text-anchor: start; }
  .prime-tick { fill: #dc2626; font-size: 11px; font-weight: 600; text-anchor: middle; dominant-baseline: middle; }
  .x-prime-tick { dominant-baseline: auto; }
  .ct-prime-tick { text-anchor: start; }
  .prime-label { fill: #dc2626; font-size: 20px; font-weight: 700; }
  .event-point { fill: #16a34a; stroke: #14532d; stroke-width: 1.5; }
  .event-line { stroke: #16a34a; stroke-width: 2.5; }
  .event-endpoint { fill: #16a34a; stroke: #14532d; stroke-width: 1.2; }
  .hover-box { fill: rgba(255,255,255,0.95); stroke: #cbd5e1; stroke-width: 1; }
  .hover-text { fill: #1f2937; font-size: 14px; font-weight: 600; }
`

/**
 * Clone the SVG element and inject inline styles + a white background so that
 * the exported image looks identical to the on-screen diagram.
 */
function prepareSvg(svgElement) {
  const svgNS = 'http://www.w3.org/2000/svg'
  const clone = svgElement.cloneNode(true)

  // Remove any event listeners / interactive attributes that are irrelevant
  clone.removeAttribute('role')
  clone.removeAttribute('aria-label')

  // White background rect
  const bg = document.createElementNS(svgNS, 'rect')
  bg.setAttribute('width', '100%')
  bg.setAttribute('height', '100%')
  bg.setAttribute('fill', 'white')
  clone.insertBefore(bg, clone.firstChild)

  // Inline stylesheet
  const style = document.createElementNS(svgNS, 'style')
  style.textContent = DIAGRAM_CSS
  clone.insertBefore(style, clone.firstChild)

  const vb = svgElement.viewBox.baseVal
  const width = vb.width || 760
  const height = vb.height || 760
  clone.setAttribute('width', width)
  clone.setAttribute('height', height)

  return { clone, width, height }
}

/**
 * Render the SVG onto an off-screen canvas at 2× resolution and return the
 * canvas element.
 */
function svgToCanvas(svgElement) {
  return new Promise((resolve, reject) => {
    const { clone, width, height } = prepareSvg(svgElement)
    const svgString = new XMLSerializer().serializeToString(clone)
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)

    const scale = 2 // retina / high-DPI
    const canvas = document.createElement('canvas')
    canvas.width = width * scale
    canvas.height = height * scale

    const ctx = canvas.getContext('2d')
    ctx.scale(scale, scale)
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, width, height)

    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height)
      URL.revokeObjectURL(url)
      resolve(canvas)
    }
    img.onerror = (err) => {
      URL.revokeObjectURL(url)
      reject(err)
    }
    img.src = url
  })
}

function triggerDownload(dataUrl, filename) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

export async function exportAsPng(svgElement) {
  const canvas = await svgToCanvas(svgElement)
  triggerDownload(canvas.toDataURL('image/png'), 'minkowski-diagram.png')
}

export async function exportAsJpg(svgElement) {
  const canvas = await svgToCanvas(svgElement)
  triggerDownload(canvas.toDataURL('image/jpeg', 0.95), 'minkowski-diagram.jpg')
}

export async function exportAsPdf(svgElement) {
  const canvas = await svgToCanvas(svgElement)
  const dataUrl = canvas.toDataURL('image/png')

  const win = window.open('', '_blank')
  if (!win) {
    alert('Pop-up blocked. Please allow pop-ups for this page to export as PDF.')
    return
  }
  win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Minkowski Diagram</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: white; display: flex; justify-content: center; align-items: flex-start; }
    img { max-width: 100%; height: auto; display: block; }
    @media print {
      body { margin: 0; }
      img { width: 100%; page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <img src="${dataUrl}" alt="Minkowski Diagram" />
  <script>window.addEventListener('load', () => { window.print() })<\/script>
</body>
</html>`)
  win.document.close()
}
