# Quantum8 - 快乐八数据分析平台

> 专业的快乐八数据分析、智能选号、策略回测平台  
> 基于 17 种算法模型，提供科学的数据分析工具

## 功能概览

### 数据中心
- 自动抓取福彩官网开奖数据（快乐8/双色球/大乐透）
- 200+ 期历史数据存储与分析
- 数据质量监控与异常检测

### 智能分析
- **走势分析**：15种专业图表（热力图/频率/遗漏/冷热转换/生命周期）
- **时序分析**：自相关/布林带/趋势回归/分解分析
- **号码预测评分**：5维度评分（马尔可夫/贝叶斯/熵值/趋势/集成）
- **异常检测**：和值异常/连号爆发/区偏态/奇偶偏态

### 智能工具
- **智能选号**：单式/复式/胆拖，3种策略模板 + 自定义
- **AI 策略生成器**：6种预设策略，集成全部算法评分
- **杀号工具**：6种杀号策略，支持手动排除40个号码
- **旋转矩阵**：贪心算法覆盖，最多100注
- **智能缩水**：频率/遗漏/集成三种模式

### 策略研究
- **策略实验室**：创建/保存/回测策略
- **策略回测**：滑动窗口回测 + 蒙特卡洛模拟
- **策略市场**：6个社区策略一键回测对比
- **策略排行榜**：人气/命中率/ROI排序

### 号码研究
- **号码画像**：单个号码的全维度分析
- **号码图谱**：80号码力导向共现图
- **号码对比**：2-6个号码深度对比

## 技术栈

| 层级 | 技术 |
|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS |
| 后端 | Supabase (PostgreSQL + Edge Functions) |
| 算法 | 17个独立算法模块 (马尔可夫/贝叶斯/熵/聚类/遗传/时序等) |
| 部署 | Cloudflare Pages (自动构建) |
| 数据源 | 中国福彩官网公开API |

## 本地开发

```bash
# 克隆仓库
git clone https://github.com/cuic7797-debug/quantum8.git
cd quantum8

# 安装依赖
pnpm install

# 构建类型和算法包
pnpm --filter @quantum8/types build
pnpm --filter @quantum8/algorithm build

# 启动开发服务器
pnpm dev:web
# 访问 http://localhost:3000
```

## 部署

Cloudflare Pages 自动从 main 分支构建部署。  
线上地址：https://5811938f.quantum8.pages.dev/

## 项目结构

```
quantum8/
├── apps/web/          # Web 应用 (React + Vite)
│   ├── src/
│   │   ├── pages/     # 25个页面
│   │   ├── components/# 45个组件
│   │   ├── hooks/     # 6个钩子
│   │   └── utils/     # 工具函数
│   └── public/        # 静态资源 + PWA
├── packages/
│   ├── types/         # TypeScript 类型定义
│   └── algorithm/     # 14个算法模块
├── supabase/          # 数据库迁移
├── workers/           # Cloudflare Workers
└── scripts/           # 数据种子脚本
```

## 免责声明

本工具仅用于数据分析研究，不构成任何投注建议。彩票开奖结果为随机事件，请理性购彩。
