<script setup>
import { ref } from 'vue'
import { supabase } from '../lib/supabase'

const emit = defineEmits(['authed'])
const base = import.meta.env.BASE_URL

const mode = ref('login')
const email = ref('')
const password = ref('')
const busy = ref(false)
const errMsg = ref('')

async function submit() {
  if (!email.value || !password.value) {
    errMsg.value = '请填写邮箱和密码'
    return
  }
  busy.value = true
  errMsg.value = ''
  const { error } =
    mode.value === 'login'
      ? await supabase.auth.signInWithPassword({ email: email.value, password: password.value })
      : await supabase.auth.signUp({ email: email.value, password: password.value })
  if (error) {
    const msg = error.message || String(error)
    errMsg.value = msg.includes('Invalid login credentials')
      ? '邮箱或密码不正确'
      : msg.includes('already registered')
        ? '这个邮箱已注册过，直接登录即可'
        : msg.includes('Password should be')
          ? '密码至少需要 6 位'
          : msg
  } else {
    emit('authed')
  }
  busy.value = false
}
</script>

<template>
  <div class="auth-wrap">
    <div class="auth-card">
      <img class="logo" :src="base + 'icons/pwa-192.png'" alt="记一笔" />
      <h1>记一笔</h1>
      <p class="sub">付完随手记一笔，钱花得明明白白</p>

      <div v-if="errMsg" class="auth-error">{{ errMsg }}</div>

      <div class="field">
        <label>邮箱</label>
        <input v-model.trim="email" type="email" autocomplete="email" placeholder="you@example.com" />
      </div>
      <div class="field">
        <label>密码</label>
        <input
          v-model="password"
          type="password"
          autocomplete="current-password"
          placeholder="至少 6 位"
          @keyup.enter="submit"
        />
      </div>
      <button class="auth-submit" :disabled="busy" @click="submit">
        {{ busy ? '请稍候…' : mode === 'login' ? '登录' : '注册并开始使用' }}
      </button>
      <p class="auth-switch">
        <template v-if="mode === 'login'">第一次用？</template>
        <template v-else>已有账号？</template>
        <button @click="mode = mode === 'login' ? 'signup' : 'login'; errMsg = ''">
          {{ mode === 'login' ? '注册一个账号' : '直接登录' }}
        </button>
      </p>
    </div>
  </div>
</template>
