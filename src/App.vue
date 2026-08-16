<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from './lib/supabase'
import { useRecords } from './composables/useRecords'
import { useAccounts } from './composables/useAccounts'
import AuthView from './components/AuthView.vue'
import TabBar from './components/TabBar.vue'
import QuickAdd from './components/QuickAdd.vue'
import Records from './components/Records.vue'
import Assets from './components/Assets.vue'
import Me from './components/Me.vue'
import RecordSheet from './components/RecordSheet.vue'
import AdvanceSheet from './components/AdvanceSheet.vue'
import AccountSheet from './components/AccountSheet.vue'
import Advances from './components/Advances.vue'
import ImportView from './components/ImportView.vue'

const { load, update, remove, settle, advances, reset } = useRecords()
const { add: addAccount, update: updateAccount, remove: removeAccount } = useAccounts()

const base = import.meta.env.BASE_URL

const session = ref(null)
const ready = ref(false)
const tab = ref('quick')
const sheetRecord = ref(null)
const advanceSheet = ref(null)
const accountSheet = ref(null) // null | 'new' | account 对象
const importOpen = ref(false)
const advancesOpen = ref(false)
const toast = ref('')
const toastOk = ref(false)
let toastTimer = null

const TABS = [
  { key: 'quick', label: '记一笔' },
  { key: 'records', label: '明细' },
  { key: 'assets', label: '资产' },
  { key: 'me', label: '我的' },
]

const tabsWithCount = computed(() =>
  TABS.map((t) => ({ ...t, count: t.key === 'me' ? advances.value.length : 0 }))
)

function showToast(msg, ok = false) {
  toast.value = msg
  toastOk.value = ok
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = ''), 3000)
}

async function onSaveRecord(patch) {
  try {
    await update(sheetRecord.value.id, patch)
    sheetRecord.value = null
    showToast('已保存', true)
  } catch (e) {
    showToast('保存失败：' + (e.message || e))
  }
}

async function onRemoveRecord() {
  if (!confirm('确定删除这笔记录吗？')) return
  try {
    await remove(sheetRecord.value.id)
    sheetRecord.value = null
    showToast('已删除', true)
  } catch (e) {
    showToast('删除失败：' + (e.message || e))
  }
}

async function onSettle(payload) {
  try {
    await settle(payload.id, payload)
    advanceSheet.value = null
    showToast('已销账，垫付收回了', true)
  } catch (e) {
    showToast('保存失败：' + (e.message || e))
  }
}

async function onSaveAccount(payload) {
  try {
    if (accountSheet.value === 'new') await addAccount(payload)
    else await updateAccount(accountSheet.value.id, payload)
    accountSheet.value = null
    showToast('已保存', true)
  } catch (e) {
    showToast('保存失败：' + (e.message || e))
  }
}

async function onRemoveAccount() {
  if (!confirm('确定删除这个账户吗？')) return
  try {
    await removeAccount(accountSheet.value.id)
    accountSheet.value = null
    showToast('已删除', true)
  } catch (e) {
    showToast('删除失败：' + (e.message || e))
  }
}

async function signOut() {
  await supabase.auth.signOut()
  reset()
  tab.value = 'quick'
  importOpen.value = false
  advancesOpen.value = false
  sheetRecord.value = null
  accountSheet.value = null
}

onMounted(async () => {
  const { data } = await supabase.auth.getSession()
  if (data.session) {
    session.value = data.session
    await load()
  }
  ready.value = true

  supabase.auth.onAuthStateChange((_event, s) => {
    session.value = s
    if (s) load()
    else reset()
  })
})
</script>

<template>
  <div v-if="!ready" class="loading">加载中…</div>

  <AuthView v-else-if="!session" @authed="load" />

  <div v-else class="app">
    <header class="app-header">
      <div class="app-title">
        <img class="logo" :src="base + 'icons/pwa-192.png'" alt="" />
        记一笔
      </div>
    </header>

    <TabBar :tabs="tabsWithCount" :active="tab" @change="tab = $event" />

    <QuickAdd v-if="tab === 'quick'" @toast="showToast" />
    <Records v-else-if="tab === 'records'" @open="sheetRecord = $event" />
    <Assets
      v-else-if="tab === 'assets'"
      @edit="accountSheet = $event"
      @add="accountSheet = 'new'"
      @toast="showToast"
    />
    <Me
      v-else
      :email="session.user.email"
      :advance-count="advances.length"
      @import="importOpen = true"
      @advances="advancesOpen = true"
      @signout="signOut"
    />

    <p class="footer-hint">付完随手记一笔 · 电脑手机自动同步</p>

    <RecordSheet
      v-if="sheetRecord"
      :record="sheetRecord"
      @close="sheetRecord = null"
      @save="onSaveRecord"
      @remove="onRemoveRecord"
    />

    <AdvanceSheet
      v-if="advanceSheet"
      :advance="advanceSheet"
      @close="advanceSheet = null"
      @settle="onSettle"
    />

    <AccountSheet
      v-if="accountSheet"
      :account="accountSheet === 'new' ? null : accountSheet"
      @close="accountSheet = null"
      @save="onSaveAccount"
      @remove="onRemoveAccount"
    />

    <Advances v-if="advancesOpen" @close="advancesOpen = false" @settle="advanceSheet = $event" />

    <ImportView v-if="importOpen" @close="importOpen = false" @toast="showToast" />

    <div v-if="toast" class="toast" :class="{ ok: toastOk }">{{ toast }}</div>
  </div>
</template>
