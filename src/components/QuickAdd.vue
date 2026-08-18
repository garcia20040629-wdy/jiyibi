<script setup>
import { ref, onMounted } from 'vue'
import CategoryPicker from './CategoryPicker.vue'
import { useRecords } from '../composables/useRecords'
import { localDateStr, datePlusNow, fmtMoney } from '../lib/format'
import { EXPENSE_CATEGORIES, categoryLabel } from '../lib/categories'

const emit = defineEmits(['toast'])
const { add, monthStats, advances } = useRecords()

const TYPES = [
  { key: 'expense', label: '支出' },
  { key: 'income', label: '收入' },
]

const type = ref('expense')
const main = ref('生存')
const sub = ref('')
const amount = ref('')
const note = ref('')
const dateStr = ref(localDateStr(new Date()))
const isAdvance = ref(false)
const settleTarget = ref(null)
const showExtra = ref(false)
const saving = ref(false)
const amountEl = ref(null)

onMounted(() => {
  try {
    const last = JSON.parse(localStorage.getItem('jy_last') || 'null')
    if (last) {
      type.value = last.type || 'expense'
      main.value = last.main || '生存'
      sub.value = last.sub || ''
    }
  } catch {
    /* 本地记忆损坏就忽略 */
  }
})

function onAmountInput(e) {
  let v = e.target.value.replace(/[^\d.]/g, '')
  const dot = v.indexOf('.')
  if (dot >= 0) v = v.slice(0, dot + 1) + v.slice(dot + 1).replace(/\./g, '').slice(0, 2)
  amount.value = v
}

function switchType(t) {
  if (t === type.value) return
  type.value = t
  if (t === 'expense') {
    sub.value = ''
  } else {
    sub.value = '其他'
    isAdvance.value = false
  }
  settleTarget.value = null
}

function pickAdvance(a) {
  if (settleTarget.value?.id === a.id) {
    settleTarget.value = null
    amount.value = ''
  } else {
    settleTarget.value = a
    amount.value = String(a.amount)
  }
}

function pickMain(m) {
  main.value = m
  sub.value = ''
}

async function save() {
  const v = Number(amount.value)
  if (!v || v <= 0) {
    emit('toast', '先输入金额', false)
    amountEl.value?.focus()
    return
  }
  const payload = {
    type: type.value,
    amount: v,
    note: note.value.trim(),
    happened_at: datePlusNow(dateStr.value).toISOString(),
    is_advance: type.value === 'expense' && isAdvance.value,
    main_category: type.value === 'expense' ? main.value : '',
    sub_category:
      type.value === 'expense' ? sub.value || '其他' : type.value === 'income' ? sub.value || '其他' : '其他',
    advance_refund_id: type.value === 'advance_refund' ? settleTarget.value?.id || null : null,
  }
  saving.value = true
  try {
    await add(payload)
    localStorage.setItem('jy_last', JSON.stringify({ type: type.value, main: main.value, sub: sub.value }))
    amount.value = ''
    note.value = ''
    settleTarget.value = null
    emit('toast', `已记下 ¥${fmtMoney(v)}`, true)
    amountEl.value?.focus()
  } catch (e) {
    emit('toast', '保存失败：' + (e.message || e), false)
  } finally {
    saving.value = false
  }
}

const pct = (n) => (monthStats.total > 0 ? Math.round((n / monthStats.total) * 100) : 0)
</script>

<template>
  <div class="quick-add">
    <div class="type-seg">
      <button
        v-for="t in TYPES"
        :key="t.key"
        class="seg"
        :class="{ active: type === t.key }"
        @click="switchType(t.key)"
      >
        {{ t.label }}
      </button>
    </div>

    <div class="amount-row">
      <span class="amount-symbol">¥</span>
      <input
        ref="amountEl"
        :value="amount"
        class="amount-input"
        type="text"
        inputmode="decimal"
        placeholder="0.00"
        autofocus
        @input="onAmountInput"
        @keyup.enter="save"
      />
    </div>

    <CategoryPicker :type="type" :main="main" :sub="sub" @update:main="pickMain" @update:sub="sub = $event" />

    <button v-if="type === 'income'" class="refund-link" @click="switchType('advance_refund')">
      朋友还的垫付钱？记成代付收回 ›
    </button>

    <div v-if="type === 'advance_refund'" class="settle-pick">
      <button class="refund-link" @click="switchType('income')">‹ 返回普通收入</button>
      <div v-if="advances.length" class="settle-label">销掉这笔垫付（可不选）</div>
      <div v-if="advances.length" class="sub-chips">
        <button
          v-for="a in advances"
          :key="a.id"
          class="chip"
          :class="{ active: settleTarget?.id === a.id }"
          @click="pickAdvance(a)"
        >
          {{ a.note || categoryLabel(a) }} · ¥{{ fmtMoney(a.amount) }}
        </button>
      </div>
    </div>

    <div class="extra-row">
      <button class="extra-btn" @click="showExtra = !showExtra">
        {{ showExtra ? '收起备注' : '备注（可选）' }}
      </button>
      <input v-if="showExtra" v-model="note" class="note-input" type="text" placeholder="记几个字，以后好回忆" />
      <button
        v-if="type === 'expense'"
        class="chip"
        :class="{ active: isAdvance }"
        @click="isAdvance = !isAdvance"
      >
        代付
      </button>
      <input v-model="dateStr" class="date-input" type="date" aria-label="日期" />
    </div>

    <button class="save-btn" :disabled="saving" @click="save">{{ saving ? '记下中…' : '记下了' }}</button>

    <div class="stat-card">
      <div class="stat-row">
        <div class="stat-item">
          <div class="stat-label">本月支出</div>
          <div class="stat-num">¥{{ fmtMoney(monthStats.expense) }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">本月收入</div>
          <div class="stat-num income">¥{{ fmtMoney(monthStats.income) }}</div>
        </div>
        <div v-if="monthStats.advancePending > 0" class="stat-item">
          <div class="stat-label">垫付中</div>
          <div class="stat-num warn">¥{{ fmtMoney(monthStats.advancePending) }}</div>
        </div>
      </div>
      <div class="cat-bars">
        <div v-for="c in EXPENSE_CATEGORIES" :key="c.key" class="cat-bar-row">
          <span class="cat-bar-label">{{ c.key }}</span>
          <div class="cat-bar-track">
            <div class="cat-bar-fill" :style="{ width: pct(monthStats.cats[c.key]) + '%', background: c.color }"></div>
          </div>
          <span class="cat-bar-num">¥{{ fmtMoney(monthStats.cats[c.key]) }}</span>
        </div>
      </div>
      <p v-if="monthStats.total === 0" class="stat-empty">这个月还没记支出，从上面记第一笔吧</p>
    </div>
  </div>
</template>
