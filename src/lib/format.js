export function fmtMoney(n) {
  return Number(n || 0).toFixed(2)
}

export function localDateStr(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function monthKey(d) {
  return localDateStr(d).slice(0, 7)
}

export function monthLabel(key) {
  const [y, m] = key.split('-')
  return `${Number(y)}年${Number(m)}月`
}

const WEEK = ['日', '一', '二', '三', '四', '五', '六']

export function dayLabel(d) {
  return `${d.getMonth() + 1}月${d.getDate()}日 · 周${WEEK[d.getDay()]}`
}

export function timeLabel(d) {
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

// 用指定日期 + 当前时刻构造本地时间
export function datePlusNow(dateStr) {
  const now = new Date()
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds())
}
