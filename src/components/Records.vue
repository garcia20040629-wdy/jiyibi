<script setup>
import { ref, computed } from 'vue'
import { useRecords } from '../composables/useRecords'
import { monthKey, monthLabel, dayLabel, timeLabel, fmtMoney } from '../lib/format'
import { EXPENSE_CATEGORIES, categoryLabel } from '../lib/categories'

const emit = defineEmits(['open'])
const { records, loading, error } = useRecords()

const month = ref(monthKey(new Date()))
const typeFilter = ref('all')
const mainFilter = ref('')

const TYPE_FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'expense', label: '支出' },
  { key: 'income', label: '收入' },
  { key: 'advance_refund', label: '收回' },
]

const months = computed(() => {
  const s = new Set(records.value.map((r) => monthKey(new Date(r.happened_at))))
  return [...s].sort().reverse()
})

const filtered = computed(() =>
  records.value.filter((r) => {
    if (monthKey(new Date(r.happened_at)) !== month.value) return false
    if (typeFilter.value !== 'all' && r.type !== typeFilter.value) return false
    if (typeFilter.value === 'expense' && mainFilter.value && r.main_category !== mainFilter.value) return false
    return true
  })
)

const totals = computed(() => {
  let expense = 0
  let income = 0
  for (const r of filtered.value) {
    const amt = Number(r.amount) || 0
    if (r.type === 'expense') expense += amt
    else income += amt
  }
  return { expense, income }
})

const grouped = computed(() => {
  const byDay = new Map()
  for (const r of filtered.value) {
    const d = new Date(r.happened_at)
    const key = d.toDateString()
    if (!byDay.has(key)) byDay.set(key, { date: d, items: [] })
    byDay.get(key).items.push(r)
  }
  return [...byDay.values()].map((g) => {
    g.expense = g.items.reduce((s, r) => s + (r.type === 'expense' ? Number(r.amount) || 0 : 0), 0)
    return g
  })
})

function shiftMonth(delta) {
  const [y, m] = month.value.split('-').map(Number)
  const key = monthKey(new Date(y, m - 1 + delta, 1))
  if (delta > 0 && key > monthKey(new Date())) return
  if (delta < 0 && months.value.length && key < months.value[months.value.length - 1]) return
  month.value = key
}
</script>

<template>
  <div class="records">
    <div class="filter-bar">
      <button class="month-btn" @click="shiftMonth(-1)">‹</button>
      <div class="month-title">{{ monthLabel(month) }}</div>
      <button class="month-btn" :class="{ dim: month >= monthKey(new Date()) }" @click="shiftMonth(1)">›</button>
    </div>

    <div class="sub-chips filter-chips">
      <button
        v-for="t in TYPE_FILTERS"
        :key="t.key"
        class="chip"
        :class="{ active: typeFilter === t.key }"
        @click="typeFilter = t.key; mainFilter = ''"
      >
        {{ t.label }}
      </button>
    </div>
    <div v-if="typeFilter === 'expense'" class="sub-chips filter-chips">
      <button
        v-for="c in EXPENSE_CATEGORIES"
        :key="c.key"
        class="chip"
        :class="{ active: mainFilter === c.key }"
        @click="mainFilter = mainFilter === c.key ? '' : c.key"
      >
        {{ c.key }}
      </button>
    </div>

    <div v-if="filtered.length" class="totals-bar">
      <span v-if="totals.expense > 0">支出 ¥{{ fmtMoney(totals.expense) }}</span>
      <span v-if="totals.income > 0">收入 ¥{{ fmtMoney(totals.income) }}</span>
      <span class="muted">共 {{ filtered.length }} 笔</span>
    </div>

    <div v-if="loading" class="loading">加载中…</div>
    <div v-else-if="error" class="empty">{{ error }}</div>
    <div v-else-if="!grouped.length" class="empty">这个月还没有记录。&#10;回「记一笔」页补上第一笔吧。</div>

    <div v-for="g in grouped" :key="g.date.toISOString()" class="day-group">
      <div class="day-head">
        {{ dayLabel(g.date) }}
        <span v-if="g.expense > 0" class="day-total">支出 ¥{{ fmtMoney(g.expense) }}</span>
      </div>
      <button v-for="r in g.items" :key="r.id" class="rec-row" @click="emit('open', r)">
        <span class="rec-dot" :class="r.type"></span>
        <span class="rec-main">
          <span class="rec-cat">{{ categoryLabel(r) }}</span>
          <span v-if="r.note" class="rec-note">{{ r.note }}</span>
          <span v-if="r.is_advance || r.type === 'advance_refund' || r.source !== 'manual'" class="rec-badges">
            <span v-if="r.is_advance" class="badge badge-warn">垫付</span>
            <span v-if="r.type === 'advance_refund'" class="badge badge-ok">收回</span>
            <span v-if="r.source === 'wechat'" class="badge badge-src">微信</span>
            <span v-if="r.source === 'alipay'" class="badge badge-src">支付宝</span>
          </span>
        </span>
        <span class="rec-side">
          <span class="rec-amount" :class="r.type">{{ r.type === 'expense' ? '-' : '+' }}¥{{ fmtMoney(r.amount) }}</span>
          <span class="rec-time">{{ timeLabel(new Date(r.happened_at)) }}</span>
        </span>
      </button>
    </div>
  </div>
</template>
