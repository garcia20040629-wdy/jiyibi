// 生成 PWA 图标（SVG → PNG），运行：node scripts/make-icons.cjs
const sharp = require('sharp')
const path = require('path')
const fs = require('fs')

const outDir = path.join(__dirname, '..', 'public', 'icons')
fs.mkdirSync(outDir, { recursive: true })

function svg(maskable = false) {
  // 512 画布；maskable 图标内容缩到中心 62% 安全区
  const s = maskable ? 0.62 : 1
  const cx = 256
  const cy = 256
  const w = 176 * s
  const h = 216 * s
  const x = cx - w / 2
  const y = cy - h / 2
  const lines = [cy - 42 * s, cy, cy + 42 * s]
    .map(
      (ly) =>
        `<line x1="${cx - 52 * s}" y1="${ly}" x2="${cx + 52 * s}" y2="${ly}" stroke="#ffffff" stroke-width="${22 * s}" stroke-linecap="round"/>`
    )
    .join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
  <rect width="512" height="512" rx="${maskable ? 0 : 115}" fill="#16a34a"/>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${26 * s}" fill="none" stroke="#ffffff" stroke-width="${26 * s}"/>
  ${lines}
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
