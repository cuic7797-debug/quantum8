-- Quantum8 数据库迁移脚本
-- Supabase PostgreSQL

-- ========================================
-- 1. 开奖数据表
-- ========================================
CREATE TABLE IF NOT EXISTS draws (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_number text UNIQUE NOT NULL,
  draw_date date NOT NULL,
  numbers integer[] NOT NULL,
  sum_value integer NOT NULL,
  span integer NOT NULL,
  odd_count integer NOT NULL,
  even_count integer NOT NULL,
  big_count integer NOT NULL,
  small_count integer NOT NULL,
  zone1_count integer NOT NULL,
  zone2_count integer NOT NULL,
  zone3_count integer NOT NULL,
  zone4_count integer NOT NULL,
  consecutive_count integer NOT NULL DEFAULT 0,
  repeat_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_draws_date ON draws(draw_date);
CREATE INDEX IF NOT EXISTS idx_draws_created ON draws(created_at);

-- ========================================
-- 2. 号码统计表
-- ========================================
CREATE TABLE IF NOT EXISTS number_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number integer UNIQUE NOT NULL CHECK (number >= 1 AND number <= 80),
  total_appearances integer DEFAULT 0,
  recent_10_rate numeric(5,2) DEFAULT 0,
  recent_20_rate numeric(5,2) DEFAULT 0,
  recent_50_rate numeric(5,2) DEFAULT 0,
  current_miss integer DEFAULT 0,
  avg_miss numeric(5,2) DEFAULT 0,
  max_miss integer DEFAULT 0,
  miss_ratio numeric(5,2) DEFAULT 0,
  hot_score numeric(5,2) DEFAULT 0,
  cold_score numeric(5,2) DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_number_stats_hot ON number_stats(hot_score DESC);
CREATE INDEX IF NOT EXISTS idx_number_stats_miss ON number_stats(current_miss DESC);

-- ========================================
-- 3. 号码关系表
-- ========================================
CREATE TABLE IF NOT EXISTS number_pairs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number_a integer NOT NULL CHECK (number_a >= 1 AND number_a <= 80),
  number_b integer NOT NULL CHECK (number_b >= 1 AND number_b <= 80),
  co_appear_count integer DEFAULT 0,
  co_appear_rate numeric(5,2) DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT chk_pair_order CHECK (number_a < number_b),
  CONSTRAINT uq_pair UNIQUE (number_a, number_b)
);

CREATE INDEX IF NOT EXISTS idx_pairs_a ON number_pairs(number_a);
CREATE INDEX IF NOT EXISTS idx_pairs_b ON number_pairs(number_b);
CREATE INDEX IF NOT EXISTS idx_pairs_count ON number_pairs(co_appear_count DESC);

-- ========================================
-- 4. 用户资料表
-- ========================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname text,
  avatar_url text,
  is_premium boolean DEFAULT false,
  daily_used integer DEFAULT 0,
  daily_reset_at date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ========================================
-- 5. 选号记录表
-- ========================================
CREATE TABLE IF NOT EXISTS selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  play_type text NOT NULL CHECK (play_type IN ('选一','选二','选三','选四','选五','选六','选七','选八','选九','选十')),
  note_type text NOT NULL CHECK (note_type IN ('单式','复式','胆拖')),
  numbers integer[] NOT NULL,
  dan_numbers integer[],
  tuo_numbers integer[],
  strategy text,
  score numeric(5,2),
  risk_level text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_selections_user ON selections(user_id);
CREATE INDEX IF NOT EXISTS idx_selections_created ON selections(created_at DESC);

-- ========================================
-- 6. 策略表
-- ========================================
CREATE TABLE IF NOT EXISTS strategies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  config jsonb NOT NULL DEFAULT '{}',
  is_public boolean DEFAULT false,
  backtest_result jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_strategies_user ON strategies(user_id);
CREATE INDEX IF NOT EXISTS idx_strategies_public ON strategies(is_public) WHERE is_public = true;

-- ========================================
-- 7. 回测记录表
-- ========================================
CREATE TABLE IF NOT EXISTS backtests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  strategy_id uuid REFERENCES strategies(id) ON DELETE CASCADE NOT NULL,
  play_type text NOT NULL,
  test_rounds integer NOT NULL,
  total_bets integer NOT NULL,
  hit_count integer NOT NULL DEFAULT 0,
  hit_rate numeric(5,4) DEFAULT 0,
  total_cost numeric(12,2) DEFAULT 0,
  total_prize numeric(12,2) DEFAULT 0,
  roi numeric(8,4) DEFAULT 0,
  max_prize numeric(12,2) DEFAULT 0,
  detail jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_backtests_user ON backtests(user_id);
CREATE INDEX IF NOT EXISTS idx_backtests_strategy ON backtests(strategy_id);

-- ========================================
-- 8. 数据同步日志表
-- ========================================
CREATE TABLE IF NOT EXISTS sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  status text NOT NULL CHECK (status IN ('success', 'failed')),
  records_added integer DEFAULT 0,
  latest_draw text,
  error_message text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sync_logs_created ON sync_logs(created_at DESC);

-- ========================================
-- 9. RLS 策略（行级安全）
-- ========================================
ALTER TABLE draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE number_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE number_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE backtests ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- 公共数据：所有人可读
CREATE POLICY "draws_select_all" ON draws FOR SELECT USING (true);
CREATE POLICY "number_stats_select_all" ON number_stats FOR SELECT USING (true);
CREATE POLICY "number_pairs_select_all" ON number_pairs FOR SELECT USING (true);

-- 用户数据：仅本人
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "selections_select_own" ON selections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "selections_insert_own" ON selections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "selections_delete_own" ON selections FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "strategies_select_own_or_public" ON strategies FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);
CREATE POLICY "strategies_insert_own" ON strategies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "strategies_update_own" ON strategies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "strategies_delete_own" ON strategies FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "backtests_select_own" ON backtests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "backtests_insert_own" ON backtests FOR INSERT WITH CHECK (auth.uid() = user_id);

-- sync_logs 仅服务端
CREATE POLICY "sync_logs_service_role" ON sync_logs FOR ALL USING (auth.role() = 'service_role');

-- ========================================
-- 10. 号码统计自动更新触发器
-- ========================================
CREATE OR REPLACE FUNCTION update_number_stats_on_draw()
RETURNS TRIGGER AS $$
DECLARE
  num integer;
  i integer;
BEGIN
  FOR i IN 1..array_length(NEW.numbers, 1) LOOP
    num := NEW.numbers[i];
    INSERT INTO number_stats (number, total_appearances, current_miss)
    VALUES (num, 1, 0)
    ON CONFLICT (number) DO UPDATE SET
      total_appearances = number_stats.total_appearances + 1,
      current_miss = 0,
      updated_at = now();
  END LOOP;

  -- 更新其他号码的遗漏
  UPDATE number_stats SET
    current_miss = current_miss + 1,
    updated_at = now()
  WHERE number != ALL(NEW.numbers);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_number_stats
  AFTER INSERT ON draws
  FOR EACH ROW
  EXECUTE FUNCTION update_number_stats_on_draw();

