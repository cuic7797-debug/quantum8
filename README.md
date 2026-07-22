# Quantum8 - 快乐八数据分析平台

一个围绕数据分析、策略研究和历史验证构建的专业快乐八分析工具。

## 功能

- **首页** - 最新开奖、号码热力图、走势概览、数据刷新
- **走势分析** - 热号/冷号排行、频次图、和值/奇偶/大小/跨度/区间趋势、遗漏排行、遗漏趋势
- **智能选号** - 选一到选十，3种预设策略 + 自定义模式，AI 评分排序
- **策略实验室** - 创建/编辑/删除自定义策略，运行生成，策略对比
- **策略回测** - 随机/策略两种模式，命中分布、奖金对照、ROI 计算
- **AI 分析报告** - 自动生成数据摘要、热冷号分析、走势判断、常见组合
- **历史记录** - 核奖验奖、选号记录管理、导出 TXT

## 技术栈

- **Web**: React + TypeScript + Vite + Tailwind CSS
- **Mobile**: Expo (规划中)
- **后端**: Supabase (PostgreSQL + Edge Functions)
- **算法**: Quantum Engine (概率、遗漏、网络、过滤、评分)
- **部署**: Cloudflare Pages

## 开发

```bash
pnpm install
pnpm dev:web
```

## 部署

1. 在 Cloudflare 创建 Pages 项目
2. 在 GitHub Secrets 添加 `CLOUDFLARE_API_TOKEN` 和 `CLOUDFLARE_ACCOUNT_ID`
3. Push 到 main 分支自动部署

## 免责声明

⚠ 本工具仅提供历史数据统计分析，不构成投注建议。彩票有风险，投注需理性。
