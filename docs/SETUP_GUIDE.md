# Quantum8 项目下载与运行指南

## 方式一：从 GitHub 克隆（推荐）

### 前置条件
- 安装 Node.js（>=18）：https://nodejs.org
- 安装 pnpm：终端运行 `npm install -g pnpm`
- 有 GitHub 账号

### 步骤

1. 在 GitHub 上创建一个新仓库（名字随便起，比如 quantum8）
2. 在你的电脑终端运行：

```bash
# 克隆仓库
git clone https://github.com/你的用户名/quantum8.git
cd quantum8

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev:web
```

3. 打开浏览器访问 http://localhost:3000

---

## 方式二：直接下载 ZIP

1. 如果代码已经在 GitHub 上，点 Code → Download ZIP
2. 解压到任意文件夹
3. 打开终端，进入文件夹：

```bash
cd 你解压的文件夹路径

# 安装依赖
pnpm install

# 启动
pnpm dev:web
```

4. 打开浏览器访问 http://localhost:3000

---

## 环境变量

项目根目录下需要一个 .env 文件（已经在项目里配好了），内容：

```
VITE_SUPABASE_URL=https://gomowvpstlmwcvvgnujo.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_7Sl3_rntp_65_3xK4nDu2g_KXqMdgbq
```

如果 .env 文件丢失，手动创建一个放在 apps/web/ 目录下。

---

## 常见问题

### pnpm install 报错？
确保 Node.js >= 18，运行 `node -v` 检查版本。

### 端口 3000 被占用？
运行 `pnpm dev:web -- --port 3001`，然后访问 http://localhost:3001

### 页面空白？
检查 .env 文件是否在 apps/web/ 目录下。
