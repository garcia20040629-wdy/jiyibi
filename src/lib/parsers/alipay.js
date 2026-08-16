import { normCol } from './detect.js'

function parseAmount(s) {
  const n = Math.abs(Number(String(s).replace(/[^\d.-]/g, '')))
  return Number.isFinite(n) ? n : NaN
}

export function parseAlipay(rows, headerIdx) {
  const header = rows[headerIdx].map(normCol)
  const col = (...names) => header.findIndex((c) => names.some((n) => c.includes(n)))

  const iTxn = col('交易号')
  const iTime = col('交易创建时间', '付款时间')
  const iPeer = col('交易对方')
  const iGoods = col('商品名称')
  const iAmount = col('金额')
  const iInOut = col('收/支')
  const iStatus = col('交易状态')
  const iRemark = col('备注')

  if (iInOut < 0 || iAmount < 0 || iTime < 0) {
    throw new Error('支付宝账单缺少必要列（时间 / 收/支 / 金额），可能是导出格式变了')
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
    if (type !== 'ignore' && (status.includes('退款') || status.includes('关闭'))) {
      type = 'ignore'
      ignoreReason = status
    } else if (inOut !== '收入' && inOut !== '支出') {
      ignoreReason = inOut || '不计收支'
    }

    const d = new Date((r[iTime] || '').trim())
    if (Number.isNaN(d.getTime())) continue

    const peer = (r[iPeer] || '').trim()
    const goods = (r[iGoods] || '').trim()
    const remark = (r[iRemark] || '').trim()
    const note = [peer, goods, remark].filter(Boolean).join(' · ')

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
