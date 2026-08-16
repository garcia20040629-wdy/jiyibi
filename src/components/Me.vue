<script setup>
defineProps({
  email: { type: String, default: '' },
  advanceCount: { type: Number, default: 0 },
})
defineEmits(['import', 'advances', 'signout'])
</script>

<template>
  <div class="me">
    <div class="me-email">{{ email }}</div>
    <div class="me-menu">
      <button class="me-item" @click="$emit('import')">
        <span>📥 导入账单</span>
        <span class="me-arrow">›</span>
      </button>
      <button class="me-item" @click="$emit('advances')">
        <span>🤝 垫付中</span>
        <span v-if="advanceCount > 0" class="me-badge">{{ advanceCount }}</span>
        <span class="me-arrow">›</span>
      </button>
    </div>
    <p class="me-about">记一笔 · 数据只存在你自己的账号里，别人看不到</p>
    <button class="signout-btn" @click="$emit('signout')">退出登录</button>
  </div>
</template>
