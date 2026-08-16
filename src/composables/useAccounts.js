import { ref } from 'vue'
import { supabase } from '../lib/supabase'

const accounts = ref([])
const loading = ref(false)
const error = ref('')

export const ACCOUNT_KINDS = [
  { key: 'wallet', label: '微信钱包', icon: '💚' },
  { key: 'alipay', label: '支付宝', icon: '🅰️' },
  { key: 'bank', label: '银行卡', icon: '🏦' },
  { key: 'fund', label: '基金', icon: '📈' },
  { key: 'gold', label: '黄金', icon: '🥇' },
  { key: 'other', label: '其他', icon: '🧾' },
]

export function kindMeta(kind) {
  return ACCOUNT_KINDS.find((k) => k.key === kind) || ACCOUNT_KINDS[ACCOUNT_KINDS.length - 1]
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data, error: e } = await supabase
      .from('jy_accounts')
      .select('*')
      .order('sort_order', { ascending: true })
    if (e) throw e
    accounts.value = data || []
  } catch (e) {
    error.value = '加载失败：' + (e.message || e)
  } finally {
    loading.value = false
  }
}

async function add({ name, kind, balance }) {
  const { data, error: e } = await supabase
    .from('jy_accounts')
    .insert({ name, kind, balance, sort_order: accounts.value.length })
    .select()
  if (e) throw e
  if (data && data.length) accounts.value = [...accounts.value, data[0]]
}

async function update(id, patch) {
  const { error: e } = await supabase.from('jy_accounts').update(patch).eq('id', id)
  if (e) throw e
  const idx = accounts.value.findIndex((a) => a.id === id)
  if (idx >= 0) accounts.value[idx] = { ...accounts.value[idx], ...patch }
}

async function remove(id) {
  const { error: e } = await supabase.from('jy_accounts').delete().eq('id', id)
  if (e) throw e
  accounts.value = accounts.value.filter((a) => a.id !== id)
}

// 首次进入：自动建 5 个默认账户；用户删光后不会再生
async function ensureSeeded() {
  if (localStorage.getItem('jy_seeded')) return
  if (!loading.value && !error.value && accounts.value.length === 0) {
    const defaults = [
      { name: '微信零钱', kind: 'wallet' },
      { name: '支付宝', kind: 'alipay' },
      { name: '银行卡', kind: 'bank' },
      { name: '基金', kind: 'fund' },
      { name: '黄金', kind: 'gold' },
    ].map((d, i) => ({ ...d, balance: 0, sort_order: i }))
    const { error: e } = await supabase.from('jy_accounts').insert(defaults)
    if (e) throw e
    await load()
  }
  localStorage.setItem('jy_seeded', '1')
}

export function useAccounts() {
  return { accounts, loading, error, load, add, update, remove, ensureSeeded }
}
