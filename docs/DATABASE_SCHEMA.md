# Quantum8 数据库 Schema

> PostgreSQL (Supabase) · 零成本 · 快乐八量化分析系统

---

## 前言

快乐八规则：从1-80中开出20个号码。玩家选1-10个号码，匹配越多奖金越高。
玩法：选一 ~ 选十。

---

## 1. 开奖数据表 `draws`

所有算法的根基。每期一行。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | 主键 |
| draw_number | text UNIQUE NOT NULL | 期号，如 "20260721001" |
| draw_date | date NOT NULL | 开奖日期 |
| numbers | integer[] NOT NULL | 开出的20个号码，升序 |
| sum_value | integer NOT NULL | 和值 |
| span | integer NOT NULL | 跨度（最大-最小） |
| odd_count | integer NOT NULL | 奇数个数 |
| even_count | integer NOT NULL | 偶数个数 |
| big_count | integer NOT NULL | 大号个数(≥41) |
| small_count | integer NOT NULL | 小号个数(≤40) |
| zone1_count | integer NOT NULL | 一区(1-20)个数 |
| zone2_count | integer NOT NULL | 二区(21-40)个数 |
| zone3_count | integer NOT NULL | 三区(41-60)个数 |
| zone4_count | integer NOT NULL | 四区(61-80)个数 |
| consecutive_count | integer NOT NULL | 连号组数 |
| repeat_count | integer NOT NULL | 与上期重复号码数 |
| created_at | timestamptz DEFAULT now() | 创建时间 |

索引：
- UNIQUE(draw_number)
- INDEX(draw_date)
- INDEX(created_at)

---

## 2. 号码统计表 `number_stats`

每个号码的实时统计。每次新开奖后更新。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | 主键 |
| number | integer UNIQUE NOT NULL | 号码 1-80 |
| total_appearances | integer DEFAULT 0 | 总出现次数 |
| recent_10_rate | numeric(5,2) | 近10期出现率 |
| recent_20_rate | numeric(5,2) | 近20期出现率 |
| recent_50_rate | numeric(5,2) | 近50期出现率 |
| current_miss | integer DEFAULT 0 | 当前遗漏期数 |
| avg_miss | numeric(5,2) | 平均遗漏 |
| max_miss | integer | 历史最大遗漏 |
| miss_ratio | numeric(5,2) | 遗漏回补指数 |
| hot_score | numeric(5,2) | 热度评分 (0-100) |
| cold_score | numeric(5,2) | 冷度评分 (0-100) |
| updated_at | timestamptz DEFAULT now() | 更新时间 |

索引：
- UNIQUE(number)
- INDEX(hot_score)
- INDEX(current_miss)

---

## 3. 号码关系表 `number_pairs`

80×80 伴随关系矩阵。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | 主键 |
| number_a | integer NOT NULL | 号码A |
| number_b | integer NOT NULL | 号码B |
| co_appear_count | integer DEFAULT 0 | 同期出现次数 |
| co_appear_rate | numeric(5,2) | 同期出现率 |
| updated_at | timestamptz DEFAULT now() | 更新时间 |

约束：
- UNIQUE(number_a, number_b) WHERE number_a < number_b

索引：
- INDEX(number_a)
- INDEX(number_b)
- INDEX(co_appear_count DESC)

---

## 4. 用户表 `profiles`

与 Supabase Auth 联动。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK FK → auth.users | 用户ID |
| nickname | text | 昵称 |
| avatar_url | text | 头像 |
| is_premium | boolean DEFAULT false | 是否会员 |
| daily_used | integer DEFAULT 0 | 今日已用次数 |
| daily_reset_at | date | 次数重置日期 |
| created_at | timestamptz DEFAULT now() | 注册时间 |
| updated_at | timestamptz DEFAULT now() | 更新时间 |

---

## 5. 选号记录表 `selections`

用户每次选号的历史。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | 主键 |
| user_id | uuid FK → profiles | 用户ID |
| play_type | text NOT NULL | 玩法：选一~选十 |
| note_type | text NOT NULL | 注类：单式/复式/胆拖 |
| numbers | integer[] NOT NULL | 选择的号码 |
| dan_numbers | integer[] | 胆码（胆拖时） |
| tuo_numbers | integer[] | 拖码（胆拖时） |
| strategy | text | 使用的策略名称 |
| score | numeric(5,2) | 评分 |
| risk_level | text | 风险等级 |
| created_at | timestamptz DEFAULT now() | 创建时间 |

索引：
- INDEX(user_id)
- INDEX(created_at DESC)

---

## 6. 策略表 `strategies`

用户自定义策略。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | 主键 |
| user_id | uuid FK → profiles | 用户ID |
| name | text NOT NULL | 策略名称 |
| description | text | 策略描述 |
| config | jsonb NOT NULL | 策略配置（JSON） |
| is_public | boolean DEFAULT false | 是否公开 |
| backtest_result | jsonb | 最近一次回测结果 |
| created_at | timestamptz DEFAULT now() | 创建时间 |
| updated_at | timestamptz DEFAULT now() | 更新时间 |

索引：
- INDEX(user_id)
- INDEX(is_public)

策略 config JSON 示例：
```json
{
  "hot_count": 5,
  "cold_count": 3,
  "balance_count": 2,
  "zone_balance": true,
  "sum_range": [600, 1000],
  "odd_even_range": [8, 12],
  "max_consecutive": 2
}
```

---

## 7. 回测记录表 `backtests`

策略回测的历史记录。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | 主键 |
| user_id | uuid FK → profiles | 用户ID |
| strategy_id | uuid FK → strategies | 策略ID |
| play_type | text NOT NULL | 玩法 |
| test_rounds | integer NOT NULL | 测试期数 |
| total_bets | integer NOT NULL | 总注数 |
| hit_count | integer NOT NULL | 命中次数 |
| hit_rate | numeric(5,4) | 命中率 |
| total_cost | numeric(12,2) | 总投入 |
| total_prize | numeric(12,2) | 总奖金 |
| roi | numeric(8,4) | 收益率 |
| max_prize | numeric(12,2) | 最高单次奖金 |
| detail | jsonb | 详细回测数据 |
| created_at | timestamptz DEFAULT now() | 创建时间 |

索引：
- INDEX(user_id)
- INDEX(strategy_id)

---

## 8. 数据同步日志表 `sync_logs`

记录数据更新状态。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | 主键 |
| source | text NOT NULL | 数据来源 |
| status | text NOT NULL | success/failed |
| records_added | integer DEFAULT 0 | 新增记录数 |
| latest_draw | text | 最新期号 |
| error_message | text | 错误信息 |
| created_at | timestamptz DEFAULT now() | 创建时间 |

---

## 9. RLS 策略（行级安全）

| 表 | 策略 |
|----|------|
| draws | 所有人可读 |
| number_stats | 所有人可读 |
| number_pairs | 所有人可读 |
| profiles | 仅本人可读写 |
| selections | 仅本人可读写 |
| strategies | 本人可读写，公开的所有人可读 |
| backtests | 仅本人可读写 |
| sync_logs | 仅管理员可读 |

---

## 10. 数据更新流程

```
每天定时 → Edge Function 触发
  → 调用福彩公开API获取最新开奖
  → 写入 draws 表
  → 触发器自动更新 number_stats
  → 触发器自动更新 number_pairs
  → 写入 sync_logs
```

