import { normCol } from './detect.js'

function parseAmount(s) {
  const n = Math.abs(Number(String(s).replace(/[^\d.-]/g, '')))
  return Number.isFinite(n) ? n : NaN
}

// 微信 CSV 里时间是文本，xlsx 里是 Excel 日期序列号（无时区的墙上时间）
function parseTime(s) {
  const raw = String(s).trim()
  if (/^\d+(\.\d+)?$/.test(raw)) {
    const serial = Number(raw)
    if (serial > 0) {
      const ms = Math.round((serial - 25569) * 86400000)
      const d = new Date(ms)
      if (!Number.isNaN(d.getTime())) {
        return new Date(
          d.getUTCFullYear(),
          d.getUTCMonth(),
          d.getUTCDate(),
          d.getUTCHours(),
          d.getUTCMinutes(),
          d.getUTCSeconds()
        )
      }
    }
  }
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? null : d
}

export function parseWechat(rows, headerIdx) {
  const header = rows[headerIdx].map(normCol)
  const col = (...names) => header.findIndex((c) => names.some((n) => c.includes(n)))

  const iTime = col('交易时间')
  const iPeer = col('交易对方')
  const iGoods = col('商品')
  const iInOut = col('收/支')
  const iAmount = col('金额')
  const iStatus = col('当前状态')
  const iTxn = col('交易单号')
  const iRemark = col('备注')

  if (iInOut < 0 || iAmount < 0 || iTime < 0) {
    throw new Error('微信账单缺少必要列（交易时间 / 收/支 / 金额），可能是导出格式变了')
  }

  const items = []
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const r = rows[i] || []
    if (r.length === 0) continue
    const inOut = (r[iInOut] || '').trim()
    const status = (r[iStatus] || '').trim()
    const amount = parseAmount(r[iAmount])
    if (!inOut || Number.isNaN(amount) || amount === 0) continue

    let type = inOut === '收入' ? 'income' : inOut === '支出' ? 'expense' : 'ignore'
    let ignoreReason = ''
    if (type !== 'ignore' && (status.includes('退款') || status.includes('退还'))) {
      type = 'ignore'
      ignoreReason = '已退款'
    } else if (inOut !== '收入' && inOut !== '支出') {
      ignoreReason = inOut || '不计收支'
    }

    const d = parseTime(r[iTime])
    if (!d) continue

    const peer = (r[iPeer] || '').trim()
    const goods = (r[iGoods] || '').trim()
    const remark = (r[iRemark] || '').trim()
    const note = [peer, goods, remark]
      .filter((x) => x && !['/', '-', '\\'].includes(x))
      .join(' · ')

    items.push({
      type,
      amount,
      note,
      happenedAt: d.toISOString(),
      externalId: (r[iTxn] || '').trim() || null,
      ignoreReason,
    })
  }
  return items
}
