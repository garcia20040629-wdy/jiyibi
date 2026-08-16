import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'
import { monthKey } from '../lib/format'
import { EXPENSE_CATEGORIES } from '../lib/categories'

const records = ref([])
const loading = ref(false)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data, error: e } = await supabase
      .from('jy_records')
      .select('*')
      .order('happened_at', { ascending: false })
      .limit(5000)
    if (e) throw e
    records.value = data || []
  } catch (e) {
    error.value = '加载失败：' + (e.message || e)
  } finally {
    loading.value = false
  }
}

async function add(payload) {
  const { data, error: e } = await supabase.from('jy_records').insert(payload).select()
  if (e) throw e
  if (data && data.length) records.value = [...data, ...records.value]
}

async function update(id, patch) {
  const { error: e } = await supabase.from('jy_records').update(patch).eq('id', id)
  if (e) throw e
  const idx = records.value.findIndex((r) => r.id === id)
  if (idx >= 0) records.value[idx] = { ...records.value[idx], ...patch }
}

async function remove(id) {
  const { error: e } = await supabase.from('jy_records').delete().eq('id', id)
  if (e) throw e
  records.value = records.value.filter((r) => r.id !== id)
}

// 销账：只插一条收回记录，关联垫付记录
async function settle(advanceId, { amount, note, happenedAt }) {
  const { error: e } = await supabase
    .from('jy_records')
    .insert({
      type: 'advance_refund',
      main_category: '',
      sub_category: '其他',
      amount,
      note,
      happened_at: happenedAt,
      is_advance: false,
      advance_refund_id: advanceId,
    })
    .select()
  if (e) throw e
  await load()
}

// 已被收回销账的垫付 id 集合
const settledIds = computed(() => {
  const s = new Set()
  for (const r of records.value) {
    if (r.type === 'advance_refund' && r.advance_refund_id) s.add(r.advance_refund_id)
  }
  return s
})

// 垫付中：代付且还没有收回记录
const advances = computed(() =>
  records.value.filter((r) => r.type === 'expense' && r.is_advance && !settledIds.value.has(r.id))
)

// 本月统计：真实支出（不含代付）、真实收入、垫付中、三大类金额
const monthStats = computed(() => {
  const key = monthKey(new Date())
  const cats = {}
  for (const c of EXPENSE_CATEGORIES) cats[c.key] = 0
  let expense = 0
  let income = 0
  let advancePending = 0
  for (const r of records.value) {
    if (monthKey(new Date(r.happened_at)) !== key) continue
    const amt = Number(r.amount) || 0
    if (r.type === 'expense') {
      if (r.is_advance) {
        if (!settledIds.value.has(r.id)) advancePending += amt
      } else {
        expense += amt
        if (cats[r.main_category] !== undefined) cats[r.main_category] += amt
      }
    } else if (r.type === 'income') {
      income += amt
    }
  }
  return { expense, income, advancePending, cats, total: expense }
})

function reset() {
  records.value = []
  error.value = ''
  loading.value = false
}

export function useRecords() {
  return { records, loading, error, load, add, update, remove, settle, advances, monthStats, reset }
}
