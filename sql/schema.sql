-- 记一笔 数据库结构
-- 使用方法：Supabase Dashboard → SQL Editor → 粘贴本文件全部内容 → Run
-- 全部幂等，重复执行安全

-- ==================== 记账记录 ====================
create table if not exists public.jy_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  type text not null check (type in ('expense','income','advance_refund')),
  main_category text not null default '',      -- 支出: 生存/情绪/价值；收入与代付收回为空
  sub_category text not null default '其他',   -- 支出小类或收入分类；未选默认"其他"
  amount numeric(12,2) not null check (amount > 0),
  note text not null default '',
  happened_at timestamptz not null default now(),
  source text not null default 'manual' check (source in ('manual','wechat','alipay')),
  external_id text,                            -- 微信交易单号/支付宝交易号，用于导入去重
  is_advance boolean not null default false,   -- 支出=代付垫付
  advance_refund_id uuid,                      -- 收回记录上：关联被销账的垫付记录 id
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jy_records_not_self_ref check (advance_refund_id is null or advance_refund_id <> id)
);

alter table public.jy_records enable row level security;

drop policy if exists "own records" on public.jy_records;
create policy "own records" on public.jy_records
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 触发器函数与安心清单共用（幂等）
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists jy_records_set_updated_at on public.jy_records;
create trigger jy_records_set_updated_at
  before update on public.jy_records
  for each row execute function public.set_updated_at();

-- 去重核心：同一用户同一交易单号只允许一条
create unique index if not exists jy_records_user_external_idx
  on public.jy_records (user_id, external_id) where external_id is not null;
create index if not exists jy_records_user_time_idx
  on public.jy_records (user_id, happened_at desc);
create index if not exists jy_records_user_type_idx
  on public.jy_records (user_id, type);
create index if not exists jy_records_user_advance_idx
  on public.jy_records (user_id) where is_advance = true;
create index if not exists jy_records_user_refund_idx
  on public.jy_records (user_id, advance_refund_id) where advance_refund_id is not null;

-- ==================== 资产账户 ====================
create table if not exists public.jy_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  name text not null check (char_length(name) > 0),
  kind text not null default 'other'
    check (kind in ('wallet','alipay','bank','fund','gold','other')),
  balance numeric(12,2) not null default 0,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.jy_accounts enable row level security;

drop policy if exists "own accounts" on public.jy_accounts;
create policy "own accounts" on public.jy_accounts
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists jy_accounts_set_updated_at on public.jy_accounts;
create trigger jy_accounts_set_updated_at
  before update on public.jy_accounts
  for each row execute function public.set_updated_at();

create index if not exists jy_accounts_user_idx on public.jy_accounts (user_id, sort_order);
