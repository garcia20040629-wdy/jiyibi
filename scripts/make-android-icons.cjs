// 生成安卓 App 图标（渐变绿 + 硬币 + ¥），输出到安卓项目 res 目录
// 运行：node scripts/make-android-icons.cjs
const sharp = require('sharp')
const path = require('path')
const fs = require('fs')

const resDir = 'C:/Users/garcia/AndroidStudioProjects/Jiyibi/app/src/main/res'

function svgIcon(size, round = false) {
  const cx = size / 2
  const cy = size / 2
  const k = size / 512
  const ringR = 158 * k
  const ringW = 14 * k
  const ySw = 36 * k
  const top = cy - 104 * k
  const mid = cy + 24 * k
  const bot = cy + 112 * k
  const dx = 74 * k
  const barHalf = 58 * k
  const bar1y = cy - 18 * k
  const bar2y = cy + 64 * k
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#4ade80"/>
      <stop offset="1" stop-color="#15803d"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${round ? size / 2 : size * 0.18}" fill="url(#g)"/>
  <circle cx="${cx}" cy="${cy}" r="${ringR}" fill="none" stroke="#ffffff" stroke-width="${ringW}" opacity="0.45"/>
  <path d="M ${cx - dx} ${top} L ${cx} ${mid} L ${cx + dx} ${top}" fill="none" stroke="#ffffff" stroke-width="${ySw}" stroke-linecap="round" stroke-linejoin="round"/>
  <line x1="${cx}" y1="${mid}" x2="${cx}" y2="${bot}" stroke="#ffffff" stroke-width="${ySw}" stroke-linecap="round"/>
  <line x1="${cx - barHalf}" y1="${bar1y}" x2="${cx + barHalf}" y2="${bar1y}" stroke="#ffffff" stroke-width="${ySw}" stroke-linecap="round"/>
  <line x1="${cx - barHalf}" y1="${bar2y}" x2="${cx + barHalf}" y2="${bar2y}" stroke="#ffffff" stroke-width="${ySw}" stroke-linecap="round"/>
</svg>`
}

// 状态栏小图标：白色 ¥ 描边，透明底
function svgStat(size) {
  const cx = size / 2
  const cy = size / 2
  const k = size / 96
  const top = cy - 26 * k
  const mid = cy + 8 * k
  const bot = cy + 32 * k
  const dx = 22 * k
  const barHalf = 17 * k
  const bar1y = cy - 8 * k
  const bar2y = cy + 18 * k
  const w = 9 * k
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <path d="M ${cx - dx} ${top} L ${cx} ${mid} L ${cx + dx} ${top}" fill="none" stroke="#ffffff" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>
  <line x1="${cx}" y1="${mid}" x2="${cx}" y2="${bot}" stroke="#ffffff" stroke-width="${w}" stroke-linecap="round"/>
  <line x1="${cx - barHalf}" y1="${bar1y}" x2="${cx + barHalf}" y2="${bar1y}" stroke="#ffffff" stroke-width="${w}" stroke-linecap="round"/>
  <line x1="${cx - barHalf}" y1="${bar2y}" x2="${cx + barHalf}" y2="${bar2y}" stroke="#ffffff" stroke-width="${w}" stroke-linecap="round"/>
</svg>`
}

const mipmaps = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
}

;(async () => {
  for (const [dir, size] of Object.entries(mipmaps)) {
    const out = path.join(resDir, dir)
    fs.mkdirSync(out, { recursive: true })
    await sharp(Buffer.from(svgIcon(size))).png().toFile(path.join(out, 'ic_launcher.png'))
    await sharp(Buffer.from(svgIcon(size, true))).png().toFile(path.join(out, 'ic_launcher_round.png'))
    console.log('generated', dir)
  }
  const drawable = path.join(resDir, 'drawable')
  fs.mkdirSync(drawable, { recursive: true })
  await sharp(Buffer.from(svgStat(96))).png().toFile(path.join(drawable, 'ic_stat_pay.png'))
  console.log('generated ic_stat_pay')
})()
