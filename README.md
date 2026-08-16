# 记一笔

付完随手记一笔，钱花得明明白白。个人记账网页应用（PWA，可安装到手机桌面）。

- 网站：https://garcia20040629-wdy.github.io/jiyibi/
- 数据：存自己的 Supabase（与安心清单同项目），表 `jy_records`、`jy_accounts`，RLS 行级隔离，只有本人能读

## 使用

1. 邮箱注册 / 登录
2. 「记一笔」：支出分 生存/情绪/价值 三大类（可选细分小类），收入按来源，朋友转账记「代付收回」
3. 「明细」：按月/类型/大类筛选，点记录可编辑或删除
4. 「资产」：手动维护各账户余额（微信零钱/支付宝/银行卡/基金/黄金），看总资产
5. 「我的」：导入微信/支付宝账单 CSV、垫付中、退出登录

## 架构

- Vue3 + Vite + vite-plugin-pwa + supabase-js，无其他依赖；无路由，ref 状态切换
- 分类常量在 src/lib/categories.js；统计口径：真实支出不含代付，真实收入不含代付收回
- 账单导入：手写 CSV 解析（src/lib/csv.js + parsers/），微信 UTF-8、支付宝 GBK，按交易单号去重
- 部署：GitHub Actions → GitHub Pages（push main 自动发布）

## 维护备忘

- 改分类：编辑 src/lib/categories.js 后 push
- 数据库结构变更：更新 sql/schema.sql，到 Supabase SQL Editor 执行（全幂等）
- 图标再生成：npm run icons
- 仓库 Settings → Pages 需选择 gh-pages 分支（同安心清单）
