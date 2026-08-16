<script setup>
import { ref, computed } from 'vue'
import { useImport } from '../composables/useImport'
import { useRecords } from '../composables/useRecords'
import { INCOME_CATEGORIES, getCustomSubs } from '../lib/categories'
import { fmtMoney } from '../lib/format'
import CategoryPicker from './CategoryPicker.vue'

const emit = defineEmits(['close', 'toast'])
const { format, preview, importing, progress, report, parseFile, applySmartCategory, toggleAll, doImport, resetImport } =
  useImport()
const { load: loadRecords } = useRecords()

const step = ref('pick')
const errMsg = ref('')
const busy = ref(false)
const expanded = ref(-1)
const fileEl = ref(null)

const formatName = computed(() => (format.value === 'wechat' ? '微信支付' : '支付宝'))

const selectedCount = computed(() => preview.value.filter((p) => p.selected && p.type !== 'ignore').length)
const allSelected = computed(
  () => selectedCount.value === preview.value.filter((p) => p.type !== 'ignore').length
)

const previewStats = computed(() => {
  let expense = 0
  let income = 0
  let ignore = 0
  for (const p of preview.value) {
    if (p.type === 'ignore') ignore++
    else if (p.type === 'expense') expense++
    else income++
  }
  return { expense, income, ignore }
})

async function onFile(e) {
  const file = e.target.files && e.target.files[0]
  e.target.value = ''
  if (!file) return
  errMsg.value = ''
  busy.value = true
  try {
    await parseFile(file)
    step.value = 'preview'
  } catch (err) {
    errMsg.value = err.message || String(err)
  } finally {
    busy.value = false
  }
}

function setType(p, t) {
  p.type = t
  if (t === 'ignore') {
    p.selected = false
    return
  }
  p.selected = true
  if (t === 'income' && !INCOME_CATEGORIES.includes(p.sub) && !getCustomSubs('收入').includes(p.sub)) {
    p.sub = '其他'
  }
  if (t === 'expense' && !p.main) p.main = '生存'
}

async function onImport() {
  const result = await doImport()
  if (result) {
    step.value = 'done'
    loadRecords().then(() => {})
    emit('toast', `导入完成：新增 ${result.added} 笔`, true)
  } else if (!report.value) {
    emit('toast', '没有可导入的记录', false)
  }
}

function again() {
  resetImport()
  expanded.value = -1
  step.value = 'pick'
}

function done() {
  resetImport()
  expanded.value = -1
  emit('close')
}
</script>

<template>
  <div class="overlay-page">
    <header class="overlay-head">
      <button class="icon-btn" @click="done">‹ 返回</button>
      <div class="overlay-title">导入账单</div>
      <div class="overlay-head-spacer"></div>
    </header>
    <div class="overlay-body">
      <!-- 第一步：选文件 -->
      <div v-if="step === 'pick'" class="imp-pick">
        <p class="overlay-tip">
          把微信支付 / 支付宝的账单导出成 CSV 文件，导入后过去的花销也能进账本。重复导入同一份账单不会记重。
        </p>
        <details class="export-guide">
          <summary>怎么导出账单？点开看步骤</summary>
          <p><b>微信：</b>我 → 服务 → 钱包 → 账单 → 右上角「常见问题」→ 下载账单 → 用于个人对账 → 选时间段 → 填邮箱。去邮箱下载压缩包，解压出 CSV。</p>
          <p><b>支付宝：</b>我的 → 账单 → 右上角「…」→ 开具交易流水证明 → 用于个人对账 → 选时间段 → 填邮箱。解压密码在支付宝里查看，解压出 CSV。</p>
        </details>
        <input ref="fileEl" type="file" accept=".csv" style="display: none" @change="onFile" />
        <button class="save-btn" :disabled="busy" @click="fileEl.click()">
          {{ busy ? '解析中…' : '选择账单 CSV 文件' }}
        </button>
        <div v-if="errMsg" class="auth-error imp-error">{{ errMsg }}</div>
      </div>

      <!-- 第二步：预览编辑 -->
      <div v-else-if="step === 'preview'">
        <div class="imp-info">
          <span class="badge badge-src">{{ formatName }}</span>
          <span>共 {{ preview.length }} 笔</span>
          <span class="muted">
            支出 {{ previewStats.expense }} · 收入 {{ previewStats.income }} · 忽略 {{ previewStats.ignore }}
          </span>
        </div>
        <div class="imp-actions">
          <button class="chip" @click="applySmartCategory">✨ 智能分类</button>
          <button class="chip" @click="toggleAll(!allSelected)">{{ allSelected ? '全不选' : '全选' }}</button>
        </div>

        <div v-for="(p, i) in preview" :key="i" class="imp-row" :class="{ unselected: !p.selected }">
          <div class="imp-row-top">
            <button
              class="imp-check"
              :class="{ on: p.selected }"
              :disabled="p.type === 'ignore'"
              @click="p.selected = !p.selected"
            ></button>
            <button class="imp-body" @click="expanded = expanded === i ? -1 : i">
              <div class="imp-line1">
                <span class="imp-amount" :class="p.type">
                  {{ p.type === 'expense' ? '-' : p.type === 'income' ? '+' : '' }}¥{{ fmtMoney(p.amount) }}
                </span>
                <span
                  class="badge"
                  :class="p.type === 'ignore' ? 'badge-src' : p.type === 'expense' ? 'badge-warn' : 'badge-ok'"
                >
                  {{ p.type === 'ignore' ? '忽略' : p.type === 'expense' ? '支出' : '收入' }}
                </span>
                <span v-if="p.type !== 'ignore'" class="imp-cat">
                  {{ p.type === 'expense' ? p.main + '·' + p.sub : p.sub }}
                </span>
                <span v-if="p.isAdvance" class="badge badge-warn">垫付</span>
              </div>
              <div class="imp-note">
                {{ p.note || '（无备注）' }}<span v-if="p.ignoreReason" class="imp-why"> · {{ p.ignoreReason }}</span>
              </div>
            </button>
          </div>

          <div v-if="expanded === i" class="imp-edit">
            <div class="sub-chips">
              <button class="chip" :class="{ active: p.type === 'expense' }" @click="setType(p, 'expense')">支出</button>
              <button class="chip" :class="{ active: p.type === 'income' }" @click="setType(p, 'income')">收入</button>
              <button class="chip" :class="{ active: p.type === 'ignore' }" @click="setType(p, 'ignore')">忽略</button>
            </div>
            <CategoryPicker
              v-if="p.type === 'expense'"
              type="expense"
              :main="p.main"
              :sub="p.sub"
              @update:main="p.main = $event"
              @update:sub="p.sub = $event"
            />
            <CategoryPicker v-else-if="p.type === 'income'" type="income" main="" :sub="p.sub" @update:sub="p.sub = $event" />
            <button
              v-if="p.type === 'expense'"
              class="advance-toggle small"
              :class="{ on: p.isAdvance }"
              @click="p.isAdvance = !p.isAdvance"
            >
              <span class="toggle-track"><span class="toggle-thumb"></span></span>
              代付
            </button>
            <input v-if="p.type !== 'ignore'" v-model="p.note" class="imp-note-input" type="text" placeholder="备注" />
          </div>
        </div>

        <div v-if="importing" class="imp-progress">正在导入… {{ progress.done }}/{{ progress.total }}</div>

        <div class="imp-sticky-bar">
          <span class="muted">已选 {{ selectedCount }} 笔</span>
          <button class="save-btn narrow" :disabled="importing || selectedCount === 0" @click="onImport">
            {{ importing ? '导入中…' : `导入选中 ${selectedCount} 笔` }}
          </button>
        </div>
      </div>

      <!-- 第三步：结果 -->
      <div v-else-if="step === 'done' && report" class="imp-done">
        <div class="imp-report">
          <div class="imp-report-num">{{ report.added }}</div>
          <div class="imp-report-label">新增</div>
          <div class="imp-report-num muted-num">{{ report.skipped }}</div>
          <div class="imp-report-label">跳过（已导入过）</div>
          <div v-if="report.failed > 0" class="imp-report-num warn-num">{{ report.failed }}</div>
          <div v-if="report.failed > 0" class="imp-report-label">失败</div>
        </div>
        <p class="overlay-tip">明细和统计已经更新，可以去「明细」页看看。</p>
        <div class="sheet-actions">
          <button class="btn btn-plain" @click="again">再导一笔</button>
          <button class="btn btn-primary" @click="done">完成</button>
        </div>
      </div>
    </div>
  </div>
</template>
