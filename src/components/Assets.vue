<script setup>
import { computed, onMounted } from 'vue'
import { useAccounts, kindMeta } from '../composables/useAccounts'
import { fmtMoney } from '../lib/format'

const emit = defineEmits(['edit', 'add', 'toast'])
const { accounts, loading, error, load, ensureSeeded } = useAccounts()

const total = computed(() => accounts.value.reduce((s, a) => s + (Number(a.balance) || 0), 0))

onMounted(async () => {
  await load()
  try {
    await ensureSeeded()
  } catch (e) {
    emit('toast', '初始化失败：' + (e.message || e), false)
  }
})

function updatedLabel(iso) {
  if (!iso) return '还没填过余额'
  const d = new Date(iso)
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${d.getMonth() + 1}月${d.getDate()}日 ${h}:${m} 更新`
}
</script>

<template>
  <div class="assets">
    <div class="asset-total-card">
      <div class="asset-total-label">总资产</div>
      <div class="asset-total-num">¥{{ fmtMoney(total) }}</div>
      <div class="asset-total-tip">余额手动更新 · 看看自己攒下了多少</div>
    </div>

    <div v-if="loading" class="loading">加载中…</div>
    <div v-else-if="error" class="empty">{{ error }}</div>
    <template v-else>
      <button v-for="a in accounts" :key="a.id" class="account-card" @click="emit('edit', a)">
        <span class="account-icon">{{ kindMeta(a.kind).icon }}</span>
        <span class="account-main">
          <span class="account-name">{{ a.name }}</span>
          <span class="account-updated">{{ updatedLabel(a.updated_at) }}</span>
        </span>
        <span class="account-balance">¥{{ fmtMoney(a.balance) }}</span>
      </button>
      <button class="add-account-btn" @click="emit('add')">+ 添加账户</button>
    </template>
  </div>
</template>
