# Cloudflare Pages 部署

## 已配置
- 项目名: quantum8
- 地址: https://5811938f.quantum8.pages.dev/
- GitHub 仓库: cuic7797-debug/quantum8

## 构建设置
- Framework preset: Vite
- Build command: `pnpm install && pnpm --filter @quantum8/types build && pnpm --filter @quantum8/algorithm build && pnpm --filter @quantum8/web build`
- Build output directory: `apps/web/dist`
- Root directory: (留空)

## 环境变量
在 Cloudflare Dashboard → Pages → quantum8 → Settings → Environment variables 中设置：
- VITE_SUPABASE_URL = https://gomowvpstlmwcvvgnujo.supabase.co
- VITE_SUPABASE_ANON_KEY = sb_publishable_7Sl3_rntp_65_3xK4nDu2g_KXqMdgbq

## 自动部署
每次 push 到 main 分支会自动触发构建部署。

## 手动重新部署
在 Cloudflare Dashboard → Pages → quantum8 → Deployments → Retry deployment
