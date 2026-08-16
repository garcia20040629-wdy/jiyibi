<script setup>
import { ref, computed, watch } from 'vue'
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  getCustomSubs,
  addCustomSub,
} from '../lib/categories'

const props = defineProps({
  type: { type: String, required: true },
  main: { type: String, default: '' },
  sub: { type: String, default: '' },
})
const emit = defineEmits(['update:main', 'update:sub'])

const current = computed(() => EXPENSE_CATEGORIES.find((c) => c.key === props.main))
const group = computed(() => (props.type === 'income' ? '收入' : props.main))
const customSubs = computed(() => getCustomSubs(group.value))
const editing = ref(false)
const customText = ref('')

watch(
  () => props.main,
  () => {
    editing.value = false
    customText.value = ''
  }
)

function toggleCustom() {
  editing.value = !editing.value
  customText.value = ''
}

function confirmCustom() {
  const v = customText.value.trim()
  if (!v) {
    editing.value = false
    return
  }
  addCustomSub(group.value, v)
  emit('update:sub', v)
  customText.value = ''
  editing.value = false
}
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
      <button
        v-for="s in customSubs"
        :key="'c' + s"
        class="chip"
        :class="{ active: sub === s }"
        @click="$emit('update:sub', sub === s ? '' : s)"
      >
        {{ s }}
      </button>
      <button class="chip custom-chip" :class="{ active: editing }" @click="toggleCustom">
        {{ editing ? '取消' : '✏️ 自定义' }}
      </button>
    </div>
    <input
      v-if="editing"
      v-model="customText"
      class="custom-sub-input"
      type="text"
      placeholder="输入新分类，回车确认"
      @keyup.enter="confirmCustom"
      @blur="confirmCustom"
    />
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
    <button
      v-for="s in customSubs"
      :key="'c' + s"
      class="chip"
      :class="{ active: sub === s }"
      @click="$emit('update:sub', s)"
    >
      {{ s }}
    </button>
    <button class="chip custom-chip" :class="{ active: editing }" @click="toggleCustom">
      {{ editing ? '取消' : '✏️ 自定义' }}
    </button>
    <input
      v-if="editing"
      v-model="customText"
      class="custom-sub-input"
      type="text"
      placeholder="输入新分类，回车确认"
      @keyup.enter="confirmCustom"
      @blur="confirmCustom"
    />
  </div>

  <p v-else class="advance-note">朋友还你的钱，记在这里 · 不算收入 · 会用来把「垫付中」的那笔销掉</p>
</template>
