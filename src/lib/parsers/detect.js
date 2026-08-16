import { parseCsv } from '../csv.js'

// 列名归一化：去空格、全角括号转半角、小写，方便模糊匹配
export function normCol(name) {
  return String(name || '')
    .trim()
    .replace(/（/g, '(')
    .replace(/）/g, ')')
    .replace(/[\s ]+/g, '')
    .toLowerCase()
}

export function findHeaderRow(rows) {
  for (let i = 0; i < Math.min(rows.length, 40); i++) {
    const cells = (rows[i] || []).map(normCol)
    const hasTime = cells.some(
      (c) => c.includes('交易时间') || c.includes('交易创建时间') || c.includes('付款时间')
    )
    const hasAmount = cells.some((c) => c.includes('金额'))
    if (hasTime && hasAmount) return i
  }
  return -1
}

export function detectFormat(rows, headerIdx) {
  const cells = (rows[headerIdx] || []).map(normCol)
  if (cells.some((c) => c.includes('交易单号'))) return 'wechat'
  if (cells.some((c) => c.includes('交易号'))) return 'alipay'
  return null
}

function decode(buf, encoding) {
  let text = new TextDecoder(encoding).decode(buf)
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1)
  return text
}

// 读文件 → 识别微信/支付宝格式（UTF-8 失败回退 GBK，支付宝账单是 GBK 编码）
export async function loadCsvFile(file) {
  if (file.size > 10 * 1024 * 1024) throw new Error('文件超过 10MB，太大了')
  const buf = await file.arrayBuffer()

  const utf8Text = decode(buf, 'utf-8')
  let rows = parseCsv(utf8Text)
  let headerIdx = findHeaderRow(rows)
  let format = headerIdx >= 0 ? detectFormat(rows, headerIdx) : null

  if (!format || utf8Text.includes('�')) {
    rows = parseCsv(decode(buf, 'gbk'))
    headerIdx = findHeaderRow(rows)
    format = headerIdx >= 0 ? detectFormat(rows, headerIdx) : null
  }

  if (!format) throw new Error('认不出这个文件，请确认是微信支付或支付宝导出的账单 CSV')
  return { format, headerIdx, rows }
}
