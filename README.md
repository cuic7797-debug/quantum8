# ⚡ Quantum8

快乐八智能量化分析系统

> 基于概率统计的多层数据分析工具。本工具仅提供数据分析，不构成投注建议。彩票有风险，投注需理性。

## 技术栈

- **Web**: React + Vite + TypeScript + Tailwind CSS
- **Mobile**: Expo (React Native)
- **Backend**: Supabase (PostgreSQL + Edge Functions + Auth)
- **Algorithm**: 自研 Quantum Engine 五层分析模型
- **Deploy**: Cloudflare Pages (Web) / EAS (Mobile)
- **CI/CD**: GitHub Actions

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动 Web
pnpm dev:web

# 启动 Mobile
pnpm dev:mobile
```

## 项目结构

```
quantum8/
├── apps/
│   ├── web/          # React + Vite 前端
│   ├── mobile/       # Expo 移动端
│   └── supabase/     # Edge Functions
├── packages/
│   ├── algorithm/    # Quantum Engine 核心算法
│   ├── types/        # 共享类型定义
│   └── ui/           # 共享 UI 组件
├── scripts/          # 数据种子、工具脚本
└── docs/             # 设计文档
```

## 许可

私有项目。版权所有。
