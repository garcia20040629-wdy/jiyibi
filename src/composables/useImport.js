import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { loadCsvFile } from '../lib/parsers/detect.js'
import { parseWechat } from '../lib/parsers/wechat.js'
import { parseAlipay } from '../lib/parsers/alipay.js'
import { suggestCategory, suggestAdvance, suggestIncome } from '../lib/categories.js'

const format = ref('')
const preview = ref([])
const importing = ref(false)
const progress = ref({ done: 0, total: 0 })
const report = ref(null)

function rowPayload(p) {
  return {
    type: p.type,
    main_category: p.main,
    sub_category: p.sub,
    amount: p.amount,
    note: p.note,
    happened_at: p.happenedAt,
    source: format.value,
    external_id: p.externalId || null,
    is_advance: !!p.isAdvance,
  }
}

export async function parseFile(file) {
  const { format: fmt, headerIdx, rows } = await loadCsvFile(file)
  const rawItems = fmt === 'wechat' ? parseWechat(rows, headerIdx) : parseAlipay(rows, headerIdx)
  if (!rawItems.length) throw new Error('文件里没有找到有效的账单记录')

  format.value = fmt
  report.value = null
  const seen = new Set()
  const list = []
  for (const it of rawItems) {
    if (it.externalId) {
      if (seen.has(it.externalId)) continue
      seen.add(it.externalId)
    }
    const p = {
      selected: it.type !== 'ignore',
      type: it.type,
      amount: it.amount,
      note: it.note,
      happenedAt: it.happenedAt,
      externalId: it.externalId,
      ignoreReason: it.ignoreReason || '',
      main: '',
      sub: '其他',
      isAdvance: false,
    }
    if (it.type === 'expense') {
      const sug = suggestCategory(it.note)
      p.main = sug ? sug.main : '生存'
      p.sub = sug ? sug.sub : '其他'
      p.isAdvance = suggestAdvance(it.note)
    } else if (it.type === 'income') {
      p.sub = suggestIncome(it.note) || '其他'
    }
    list.push(p)
  }
  preview.value = list
  return { count: list.length, format: fmt === 'wechat' ? '微信支付' : '支付宝' }
}

// 对所有行按关键词重新建议分类（覆盖式，用户可再逐行改）
export function applySmartCategory() {
  for (const p of preview.value) {
    if (p.type === 'expense') {
      const sug = suggestCategory(p.note)
      if (sug) {
        p.main = sug.main
        p.sub = sug.sub
      }
      p.isAdvance = suggestAdvance(p.note)
    } else if (p.type === 'income') {
      p.sub = suggestIncome(p.note) || '其他'
    }
  }
}

export function toggleAll(select) {
  for (const p of preview.value) {
    if (p.type !== 'ignore') p.selected = select
  }
}

export async function doImport() {
  const items = preview.value.filter((p) => p.selected && p.type !== 'ignore')
  importing.value = true
  report.value = null
  let added = 0
  let skipped = 0
  let failed = 0
  const BATCH = 400
  try {
    for (let i = 0; i < items.length; i += BATCH) {
      const batch = items.slice(i, i + BATCH)
      progress.value = { done: i, total: items.length }

      const ids = batch.map((p) => p.externalId).filter(Boolean)
      let existing = new Set()
      if (ids.length) {
        const { data } = await supabase.from('jy_records').select('external_id').in('external_id', ids)
        existing = new Set((data || []).map((r) => r.external_id))
      }
      const fresh = batch.filter((p) => !p.externalId || !existing.has(p.externalId))
      skipped += batch.length - fresh.length

      for (let j = 0; j < fresh.length; j += 100) {
        const chunk = fresh.slice(j, j + 100)
        const { error: e } = await supabase.from('jy_records').insert(chunk.map(rowPayload))
        if (!e) {
          added += chunk.length
        } else if (e.code === '23505') {
          for (const p of chunk) {
            const { error: e2 } = await supabase.from('jy_records').insert(rowPayload(p))
            if (!e2) added++
            else if (e2.code === '23505') skipped++
            else failed++
          }
        } else {
          failed += chunk.length
        }
      }
      progress.value = { done: i + batch.length, total: items.length }
    }
    report.value = { added, skipped, failed }
  } finally {
    importing.value = false
  }
  return report.value
}

export function resetImport() {
  format.value = ''
  preview.value = []
  report.value = null
  progress.value = { done: 0, total: 0 }
}

export function useImport() {
  return {
    format,
    preview,
    importing,
    progress,
    report,
    parseFile,
    applySmartCategory,
    toggleAll,
    doImport,
    resetImport,
  }
}
