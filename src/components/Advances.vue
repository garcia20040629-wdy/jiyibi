<script setup>
import { useRecords } from '../composables/useRecords'
import { dayLabel, fmtMoney } from '../lib/format'

const emit = defineEmits(['close', 'settle'])
const { advances, loading, error } = useRecords()
</script>

<template>
  <div class="overlay-page">
    <header class="overlay-head">
      <button class="icon-btn" @click="emit('close')">‹ 返回</button>
      <div class="overlay-title">垫付中</div>
      <div class="overlay-head-spacer"></div>
    </header>
    <div class="overlay-body">
      <p class="overlay-tip">帮朋友垫付的钱都在这，钱收回来了就点「收回」销掉。</p>
      <div v-if="loading" class="loading">加载中…</div>
      <div v-else-if="error" class="empty">{{ error }}</div>
      <div v-else-if="!advances.length" class="empty">
        没有垫付中的钱。&#10;朋友转账也可以在「记一笔」里选「代付收回」直接记。
      </div>
      <div v-for="a in advances" :key="a.id" class="advance-card">
        <div class="advance-info">
          <div class="advance-note">{{ a.note || a.main_category + '·' + a.sub_category }}</div>
          <div class="advance-meta">{{ dayLabel(new Date(a.happened_at)) }}</div>
        </div>
        <div class="advance-side">
          <div class="advance-amount">¥{{ fmtMoney(a.amount) }}</div>
          <button class="settle-btn" @click="emit('settle', a)">收回</button>
        </div>
      </div>
    </div>
  </div>
</template>
