# Cloudflare Pages 部署（2分钟搞定）

## 方法一：命令行部署（推荐）

### 1. 安装 Wrangler
```powershell
npm install -g wrangler
```

### 2. 登录 Cloudflare
```powershell
wrangler login
```
会打开浏览器，用你的 Cloudflare 账号登录。

### 3. 构建并部署
```powershell
cd C:\Users\pengkai\Desktop\quantum8\quantum8\apps\web
npm install
npm run build
npx wrangler pages deploy dist --project-name=quantum8
```

部署完成后会给你一个地址，类似：
`https://quantum8.pages.dev`

### 4. 绑定自定义域名（可选）
在 Cloudflare Dashboard → Pages → quantum8 → Custom domains 添加你的域名。

## 方法二：GitHub 自动部署

1. 登录 https://dash.cloudflare.com
2. Pages → Create a project → Connect to Git
3. 选择 `cuic7797-debug/quantum8`
4. 构建设置：
   - Framework: Vite
   - Build command: `cd apps/web && npm install && npm run build`
   - Build output: `apps/web/dist`
5. 环境变量：
   ```
   VITE_SUPABASE_URL=https://gomowvpstlmwcvvgnujo.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_7Sl3_rntp_65_3xK4nDu2g_KXqMdgbq
   ```
6. Save and Deploy

以后每次 push 到 main 自动部署。
