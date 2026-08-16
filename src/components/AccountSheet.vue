<script setup>
import { ref } from 'vue'
import { ACCOUNT_KINDS } from '../composables/useAccounts'

const props = defineProps({
  account: { type: Object, default: null }, // null = 新增
})
const emit = defineEmits(['close', 'save', 'remove'])

const name = ref(props.account?.name || '')
const kind = ref(props.account?.kind || 'other')
const balance = ref(props.account ? String(props.account.balance) : '')
const errMsg = ref('')

function onAmountInput(e) {
  let v = e.target.value.replace(/[^\d.-]/g, '')
  const dot = v.indexOf('.')
  if (dot >= 0) v = v.slice(0, dot + 1) + v.slice(dot + 1).replace(/\./g, '').slice(0, 2)
  balance.value = v
}

function submit() {
  if (!name.value.trim()) {
    errMsg.value = '给账户起个名字'
    return
  }
  const b = Number(balance.value)
  emit('save', { name: name.value.trim(), kind: kind.value, balance: Number.isFinite(b) ? b : 0 })
}
</script>

<template>
  <div class="sheet-overlay" @click.self="emit('close')">
    <div class="sheet">
      <div class="sheet-handle"></div>
      <h3>{{ account ? '编辑账户' : '添加账户' }}</h3>
      <div class="field">
        <label>名称</label>
        <input v-model="name" type="text" placeholder="比如：招行卡、余额宝" />
      </div>
      <div class="field">
        <label>类型</label>
        <div class="sub-chips">
          <button
            v-for="k in ACCOUNT_KINDS"
            :key="k.key"
            class="chip"
            :class="{ active: kind === k.key }"
            @click="kind = k.key"
          >
            {{ k.icon }} {{ k.label }}
          </button>
        </div>
      </div>
      <div class="field">
        <label>当前余额</label>
        <input :value="balance" type="text" inputmode="decimal" placeholder="0.00" @input="onAmountInput" />
      </div>
      <div v-if="errMsg" class="auth-error">{{ errMsg }}</div>
      <div class="sheet-actions">
        <button v-if="account" class="btn btn-danger" @click="emit('remove')">删除</button>
        <button class="btn btn-plain" @click="emit('close')">取消</button>
        <button class="btn btn-primary" @click="submit">保存</button>
      </div>
    </div>
  </div>
</template>
