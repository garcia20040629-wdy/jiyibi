import { createClient } from '@supabase/supabase-js'

// anon key 本来就是公开的（数据安全由数据库行级权限 RLS 保证），可直接放进构建
const url = import.meta.env.VITE_SUPABASE_URL || 'https://PLACEHOLDER.supabase.co'
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key'

export const supabase = createClient(url, anonKey)
