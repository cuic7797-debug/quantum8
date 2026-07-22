# Quantum8 部署指南

## 方案一：Cloudflare Pages（推荐）

### 1. 创建 Cloudflare Pages 项目
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 Pages → Create a project
3. 连接 GitHub 仓库 `cuic7797-debug/quantum8`
4. 构建设置：
   - Framework preset: `Vite`
   - Build command: `cd apps/web && npm install && npm run build`
   - Build output: `apps/web/dist`
5. 环境变量：
   ```
   VITE_SUPABASE_URL=https://gomowvpstlmwcvvgnujo.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_7Sl3_rntp_65_3xK4nDu2g_KXqMdgbq
   ```
6. 点击 Save and Deploy

### 2. 自动部署
以后每次 push 到 main 分支会自动部署。

## 方案二：Vercel

1. 登录 [vercel.com](https://vercel.com)
2. Import GitHub 仓库
3. 框架选 Vite，根目录填 `apps/web`
4. 添加环境变量（同上）
5. Deploy

## 方案三：GitHub Pages

1. 在 `apps/web/vite.config.ts` 添加 `base: '/quantum8/'`
2. 运行 `pnpm build:web`
3. 把 `apps/web/dist` 推到 `gh-pages` 分支

## 数据同步（Edge Function）

### 部署 sync-draws
```bash
# 安装 Supabase CLI
npm install -g supabase

# 登录
supabase login

# 链接项目
supabase link --project-ref gomowvpstlmwcvvgnujo

# 部署 Edge Function
supabase functions deploy sync-draws
```

### 设置定时触发（Cron）
在 Supabase Dashboard → Database → SQL Editor 执行：
```sql
-- 每天晚上 22:30 自动同步（快乐八每天21:30开奖）
SELECT cron.schedule(
  'sync-kl8-draws',
  '30 22 * * *',
  $$
  SELECT net.http_post(
    url := 'https://gomowvpstlmwcvvgnujo.supabase.co/functions/v1/sync-draws',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  );
  $$
);
```

## 环境变量

| 变量名 | 说明 | 获取方式 |
|--------|------|----------|
| VITE_SUPABASE_URL | Supabase 项目 URL | Supabase Dashboard → Settings → API |
| VITE_SUPABASE_ANON_KEY | Supabase 匿名密钥 | Supabase Dashboard → Settings → API |
| SUPABASE_SERVICE_ROLE_KEY | 服务角色密钥（Edge Function用）| 同上 |

## 免费额度

- **Cloudflare Pages**: 无限站点，500次构建/月
- **Supabase Free**: 500MB 数据库，1GB 文件存储，50万行
- **快乐八数据**: 200期约 200KB，完全在免费额度内
