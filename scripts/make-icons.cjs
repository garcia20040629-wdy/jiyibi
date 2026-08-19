// 生成 PWA 图标（SVG → PNG），运行：node scripts/make-icons.cjs
const sharp = require('sharp')
const path = require('path')
const fs = require('fs')

const outDir = path.join(__dirname, '..', 'public', 'icons')
fs.mkdirSync(outDir, { recursive: true })

// 渐变绿底 + 硬币圆环 + 白色 ¥（描边构成）
function svg(maskable = false) {
  const s = maskable ? 0.62 : 1
  const cx = 256
  const cy = 256
  const ringR = 150 * s
  const ringW = 13 * s
  const ySw = 34 * s
  const top = cy - 100 * s
  const mid = cy + 22 * s
  const bot = cy + 108 * s
  const dx = 70 * s
  const barHalf = 56 * s
  const bar1y = cy - 16 * s
  const bar2y = cy + 62 * s
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#4ade80"/>
      <stop offset="1" stop-color="#15803d"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="${maskable ? 0 : 115}" fill="url(#g)"/>
  <circle cx="${cx}" cy="${cy}" r="${ringR}" fill="none" stroke="#ffffff" stroke-width="${ringW}" opacity="0.45"/>
  <path d="M ${cx - dx} ${top} L ${cx} ${mid} L ${cx + dx} ${top}" fill="none" stroke="#ffffff" stroke-width="${ySw}" stroke-linecap="round" stroke-linejoin="round"/>
  <line x1="${cx}" y1="${mid}" x2="${cx}" y2="${bot}" stroke="#ffffff" stroke-width="${ySw}" stroke-linecap="round"/>
  <line x1="${cx - barHalf}" y1="${bar1y}" x2="${cx + barHalf}" y2="${bar1y}" stroke="#ffffff" stroke-width="${ySw}" stroke-linecap="round"/>
  <line x1="${cx - barHalf}" y1="${bar2y}" x2="${cx + barHalf}" y2="${bar2y}" stroke="#ffffff" stroke-width="${ySw}" stroke-linecap="round"/>
</svg>`
}

const targets = [
  ['pwa-192.png', 192, false],
  ['pwa-512.png', 512, false],
  ['maskable-192.png', 192, true],
  ['maskable-512.png', 512, true],
  ['apple-touch-icon.png', 180, false],
]

;(async () => {
  fs.writeFileSync(path.join(outDir, 'favicon.svg'), svg())
  for (const [name, size, maskable] of targets) {
    await sharp(Buffer.from(svg(maskable)))
      .resize(size, size)
      .png()
      .toFile(path.join(outDir, name))
    console.log('generated', name)
  }
})()
