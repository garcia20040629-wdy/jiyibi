<script setup>
import { ref } from 'vue'
import { localDateStr, datePlusNow, fmtMoney } from '../lib/format'

const props = defineProps({ advance: { type: Object, required: true } })
const emit = defineEmits(['close', 'settle'])

const amount = ref(String(props.advance.amount))
const note = ref('')
const dateStr = ref(localDateStr(new Date()))
const errMsg = ref('')

function onAmountInput(e) {
  let v = e.target.value.replace(/[^\d.]/g, '')
  const dot = v.indexOf('.')
  if (dot >= 0) v = v.slice(0, dot + 1) + v.slice(dot + 1).replace(/\./g, '').slice(0, 2)
  amount.value = v
}

function submit() {
  const v = Number(amount.value)
  if (!v || v <= 0) {
    errMsg.value = '金额不对'
    return
  }
  emit('settle', {
    id: props.advance.id,
    amount: v,
    note: note.value.trim(),
    happenedAt: datePlusNow(dateStr.value).toISOString(),
  })
}
</script>

<template>
  <div class="sheet-overlay" @click.self="emit('close')">
    <div class="sheet">
      <div class="sheet-handle"></div>
      <h3>收回垫付</h3>
      <p class="advance-origin">
        原垫付：{{ advance.note || advance.main_category + '·' + advance.sub_category }} ·
        ¥{{ fmtMoney(advance.amount) }}
      </p>
      <div class="field">
        <label>收回金额</label>
        <input :value="amount" type="text" inputmode="decimal" @input="onAmountInput" />
      </div>
      <div class="field">
        <label>备注（可选）</label>
        <input v-model="note" type="text" placeholder="比如：小王的份" />
      </div>
      <div class="field">
        <label>日期</label>
        <input v-model="dateStr" type="date" />
      </div>
      <div v-if="errMsg" class="auth-error">{{ errMsg }}</div>
      <div class="sheet-actions">
        <button class="btn btn-plain" @click="emit('close')">取消</button>
        <button class="btn btn-primary" @click="submit">确认收回</button>
      </div>
    </div>
  </div>
</template>
