<script setup>
defineProps({
  tabs: { type: Array, required: true },
  active: { type: String, required: true },
})
defineEmits(['change'])
</script>

<template>
  <nav class="tab-bar">
    <button
      v-for="t in tabs"
      :key="t.key"
      class="tab"
      :class="{ active: t.key === active }"
      @click="$emit('change', t.key)"
    >
      {{ t.label }}<span v-if="t.count > 0" class="count">{{ t.count }}</span>
    </button>
  </nav>
</template>
