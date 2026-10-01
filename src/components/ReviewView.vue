<script setup>
import { ref, computed } from 'vue'
import { useRecords } from '../composables/useRecords'
import { fmtMoney, monthKey, monthLabel } from '../lib/format'
import { EXPENSE_CATEGORIES } from '../lib/categories'

const emit = defineEmits(['close'])
const { monthSummary } = useRecords()

const month = ref(new Date())
const summary = computed(() => monthSummary(month.value))
const label = computed(() => monthLabel(monthKey(month.value)))
const isCurrentMonth = computed(() => monthKey(month.value) === monthKey(new Date()))

function shiftMonth(delta) {
  month.value = new Date(month.value.getFullYear(), month.value.getMonth() + delta, 1)
}

const pct = (n) => (summary.value.expense > 0 ? Math.round((n / summary.value.expense) * 100) : 0)

// 每个大类下的小类按金额降序
const subList = (main) =>
  Object.entries(summary.value.subs[main] || {})
    .map(([sub, amt]) => ({ sub, amt }))
    .sort((a, b) => b.amt - a.amt)
</script>

<template>
  <div class="overlay-page">
    <header class="overlay-head">
      <button class="icon-btn" @click="emit('close')">‹ 返回</button>
      <div class="overlay-title">{{ isCurrentMonth ? '本月回顾' : label }}</div>
      <div class="overlay-head-spacer"></div>
    </header>
    <div class="overlay-body">
      <div class="review-month-nav">
        <button class="icon-btn" @click="shiftMonth(-1)">‹</button>
        <span class="review-month-label">{{ label }}</span>
        <button class="icon-btn" :disabled="isCurrentMonth" @click="shiftMonth(1)">›</button>
      </div>

      <div class="review-total">
        <div class="review-total-item">
          <div class="stat-label">支出</div>
          <div class="stat-num">¥{{ fmtMoney(summary.expense) }}</div>
        </div>
        <div class="review-total-item">
          <div class="stat-label">收入</div>
          <div class="stat-num income">¥{{ fmtMoney(summary.income) }}</div>
        </div>
        <div v-if="summary.advancePending > 0" class="review-total-item">
          <div class="stat-label">垫付中</div>
          <div class="stat-num warn">¥{{ fmtMoney(summary.advancePending) }}</div>
        </div>
      </div>

      <p v-if="summary.expense === 0" class="stat-empty">这个月还没有支出记录</p>

      <template v-else>
        <div v-for="c in EXPENSE_CATEGORIES" :key="c.key" class="review-cat">
          <div class="cat-bar-row">
            <span class="cat-bar-label">{{ c.key }}</span>
            <div class="cat-bar-track">
              <div class="cat-bar-fill" :style="{ width: pct(summary.cats[c.key]) + '%', background: c.color }"></div>
            </div>
            <span class="cat-bar-num">{{ pct(summary.cats[c.key]) }}% · ¥{{ fmtMoney(summary.cats[c.key]) }}</span>
          </div>
          <div v-if="subList(c.key).length" class="review-subs">
            <div v-for="s in subList(c.key)" :key="s.sub" class="review-sub-row">
              <span class="review-sub-dot" :style="{ background: c.color }"></span>
              <span class="review-sub-name">{{ s.sub }}</span>
              <span class="review-sub-amt">¥{{ fmtMoney(s.amt) }}</span>
              <span class="review-sub-pct">{{ pct(s.amt) }}%</span>
            </div>
          </div>
        </div>
      </template>

      <p class="overlay-tip">只统计真实支出：垫付、已退款的不计入。小类占比是占本月总支出的比例。</p>
    </div>
  </div>
</template>
