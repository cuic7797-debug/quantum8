# 自动数据同步设置（一次性操作）

## 你需要做什么

在你的电脑 PowerShell 里依次执行以下命令：

### 第一步：安装 Supabase CLI

```powershell
npm install -g supabase
```

### 第二步：登录 Supabase

```powershell
supabase login
```

会打开浏览器，用你的 Supabase 账号登录即可。

### 第三步：链接项目

```powershell
cd C:\Users\pengkai\Desktop\quantum8\quantum8
supabase link --project-ref gomowvpstlmwcvvgnujo
```

### 第四步：部署 Edge Function

```powershell
supabase functions deploy sync-draws
```

### 第五步：设置每天自动同步

登录 Supabase Dashboard → 你的项目 → SQL Editor，执行：

```sql
-- 先启用 pg_cron 扩展
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 每天 22:30 自动同步（快乐八每天 21:30 开奖，留1小时缓冲）
SELECT cron.schedule(
  'auto-sync-kl8',
  '30 22 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/sync-draws',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    )
  );
  $$
);
```

如果上面的 pg_cron 方式不行，用这个替代方案：

```sql
-- 替代方案：直接在 SQL 里设置定时 HTTP 请求
SELECT cron.schedule(
  'auto-sync-kl8',
  '30 22 * * *',
  $$
  SELECT net.http_post(
    url := 'https://gomowvpstlmwcvvgnujo.supabase.co/functions/v1/sync-draws',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer 你的SERVICE_ROLE_KEY"}'::jsonb
  );
  $$
);
```

**SERVICE_ROLE_KEY 获取方式：**
Supabase Dashboard → Settings → API → `service_role` key（⚠️ 这个key不要泄露）

## 验证

部署完成后，手动触发一次测试：

```powershell
curl -X POST "https://gomowvpstlmwcvvgnujo.supabase.co/functions/v1/sync-draws" -H "Authorization: Bearer 你的ANON_KEY"
```

应该返回：`{"message":"ok","inserted":0,"skipped":10,"fetched":10}`

## 工作原理

1. Edge Function 每天 22:30 自动运行
2. 从福彩官网 API 获取最近 10 期数据
3. 跳过已存在的期号，只插入新的
4. 自动更新 80 个号码的统计数据
5. 前端刷新页面就能看到最新数据
