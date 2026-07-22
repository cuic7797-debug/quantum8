-- ============================================
-- Quantum8 用户系统表
-- 执行位置：Supabase Dashboard → SQL Editor
-- ============================================

-- 1. 用户资料表（自动创建，关联 auth.users）
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 自动创建 profile（新用户注册时）
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 2. 用户策略表
CREATE TABLE IF NOT EXISTS user_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_strategies_user_id ON user_strategies(user_id);

-- 3. 用户选号记录表
CREATE TABLE IF NOT EXISTS user_picks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  numbers INTEGER[] NOT NULL,
  strategy_label TEXT DEFAULT '',
  play_type TEXT DEFAULT '选十',
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_picks_user_id ON user_picks(user_id);

-- 4. RLS 策略（用户只能访问自己的数据）
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_picks ENABLE ROW LEVEL SECURITY;

-- profiles: 用户只能读写自己的
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- user_strategies: 用户只能读写自己的
CREATE POLICY "Users can view own strategies" ON user_strategies
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own strategies" ON user_strategies
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own strategies" ON user_strategies
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own strategies" ON user_strategies
  FOR DELETE USING (auth.uid() = user_id);

-- user_picks: 用户只能读写自己的
CREATE POLICY "Users can view own picks" ON user_picks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own picks" ON user_picks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own picks" ON user_picks
  FOR DELETE USING (auth.uid() = user_id);
