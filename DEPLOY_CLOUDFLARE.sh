#!/bin/bash
# Quantum8 Cloudflare Pages 部署脚本
# 使用前先安装: npm install -g wrangler

echo "🚀 开始部署 Quantum8 到 Cloudflare Pages..."

# 1. Build
echo "📦 构建项目..."
cd apps/web
npm install
npm run build

# 2. Deploy
echo "🌐 部署到 Cloudflare Pages..."
npx wrangler pages deploy dist --project-name=quantum8

echo "✅ 部署完成！"
echo "📍 访问地址: https://quantum8.pages.dev"
