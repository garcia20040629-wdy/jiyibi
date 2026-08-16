<script setup>
import { ref } from 'vue'
import CategoryPicker from './CategoryPicker.vue'
import { localDateStr, datePlusNow } from '../lib/format'

const props = defineProps({ record: { type: Object, required: true } })
const emit = defineEmits(['close', 'save', 'remove'])

const TYPES = [
  { key: 'expense', label: '支出' },
  { key: 'income', label: '收入' },
  { key: 'advance_refund', label: '代付收回' },
]

const type = ref(props.record.type)
const main = ref(props.record.main_category || '生存')
const sub = ref(props.record.sub_category === '其他' ? '' : props.record.sub_category || '')
const amount = ref(String(props.record.amount))
const note = ref(props.record.note || '')
const dateStr = ref(localDateStr(new Date(props.record.happened_at)))
const isAdvance = ref(!!props.record.is_advance)
const errMsg = ref('')

function switchType(t) {
  if (t === type.value) return
  type.value = t
  if (t === 'expense') {
    sub.value = ''
  } else {
    sub.value = '其他'
    isAdvance.value = false
  }
}

function onAmountInput(e) {
  let v = e.target.value.replace(/[^\d.-]/g, '')
  const dot = v.indexOf('.')
  if (dot >= 0) v = v.slice(0, dot + 1) + v.slice(dot + 1).replace(/\./g, '').slice(0, 2)
  amount.value = v
}

function save() {
  const v = Number(amount.value)
  if (!v || v <= 0) {
    errMsg.value = '金额不对'
    return
  }
  emit('save', {
    type: type.value,
    amount: v,
    note: note.value.trim(),
    happened_at: datePlusNow(dateStr.value).toISOString(),
    is_advance: type.value === 'expense' && isAdvance.value,
    main_category: type.value === 'expense' ? main.value : '',
    sub_category:
      type.value === 'expense' ? sub.value || '其他' : type.value === 'income' ? sub.value || '其他' : '其他',
    advance_refund_id: type.value === 'advance_refund' ? props.record.advance_refund_id : null,
  })
}
</script>

<template>
  <div class="sheet-overlay" @click.self="emit('close')">
    <div class="sheet">
      <div class="sheet-handle"></div>
      <h3>编辑这笔记录</h3>

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

      <div class="field">
        <label>金额</label>
        <input :value="amount" type="text" inputmode="decimal" @input="onAmountInput" />
      </div>

      <CategoryPicker :type="type" :main="main" :sub="sub" @update:main="main = $event" @update:sub="sub = $event" />

      <button
        v-if="type === 'expense'"
        class="advance-toggle"
        :class="{ on: isAdvance }"
        @click="isAdvance = !isAdvance"
      >
        <span class="toggle-track"><span class="toggle-thumb"></span></span>
        代付
      </button>

      <div class="field">
        <label>备注</label>
        <input v-model="note" type="text" placeholder="可选" />
      </div>
      <div class="field">
        <label>日期</label>
        <input v-model="dateStr" type="date" />
      </div>

      <div v-if="errMsg" class="auth-error">{{ errMsg }}</div>

      <div class="sheet-actions">
        <button class="btn btn-danger" @click="emit('remove')">删除</button>
        <button class="btn btn-plain" @click="emit('close')">取消</button>
        <button class="btn btn-primary" @click="save">保存</button>
      </div>
    </div>
  </div>
</template>
