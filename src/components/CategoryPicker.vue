<script setup>
import { computed } from 'vue'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../lib/categories'

const props = defineProps({
  type: { type: String, required: true },
  main: { type: String, default: '' },
  sub: { type: String, default: '' },
})
defineEmits(['update:main', 'update:sub'])

const current = computed(() => EXPENSE_CATEGORIES.find((c) => c.key === props.main))
</script>

<template>
  <div v-if="type === 'expense'" class="cat-picker">
    <div class="cat-mains">
      <button
        v-for="c in EXPENSE_CATEGORIES"
        :key="c.key"
        class="cat-main"
        :class="{ active: main === c.key }"
        @click="$emit('update:main', c.key)"
      >
        <span class="cat-dot" :style="{ background: c.color }"></span>
        <span class="cat-name">{{ c.key }}</span>
        <span class="cat-hint">{{ c.hint }}</span>
      </button>
    </div>
    <div v-if="current" class="sub-chips">
      <button
        v-for="s in current.subs"
        :key="s"
        class="chip"
        :class="{ active: sub === s }"
        @click="$emit('update:sub', sub === s ? '' : s)"
      >
        {{ s }}
      </button>
    </div>
    <p v-if="current && !sub" class="cat-tip">不选小类也行，会记成「其他」，别纠结</p>
  </div>

  <div v-else-if="type === 'income'" class="sub-chips">
    <button
      v-for="s in INCOME_CATEGORIES"
      :key="s"
      class="chip"
      :class="{ active: sub === s }"
      @click="$emit('update:sub', s)"
    >
      {{ s }}
    </button>
  </div>

  <p v-else class="advance-note">朋友还你的钱，记在这里 · 不算收入 · 会用来把「垫付中」的那笔销掉</p>
</template>
