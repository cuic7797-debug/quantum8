import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDraws } from '@/hooks/useDraws';
import { useNumberStats } from '@/hooks/useNumberStats';
import NumberBall from '@/components/common/NumberBall';
import Collapsible from '@/components/common/Collapsible';
import { t } from '@/hooks/useI18n';

interface UserActivity {
  date: string;
  type: 'pick' | 'strategy' | 'backtest';
  detail: string;
  numbers?: number[];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { draws, loading: ld } = useDraws(50);
  const { stats, loading: ls } = useNumberStats();
  const [activities, setActivities] = useState<UserActivity[]>([]);

  useEffect(() => {
    // Load user activities from localStorage
    try {
      const picks = JSON.parse(localStorage.getItem('quantum8_picks') || '[]');
      const strats = JSON.parse(localStorage.getItem('quantum8_strategies') || '[]');
      
      const actList: UserActivity[] = [];
      picks.slice(0, 20).forEach((p: any) => {
        actList.push({
          date: p.time || new Date().toISOString(),
          type: 'pick',
          detail: `${p.playType || '选八'} - ${p.strategy || 'AI推荐'}`,
          numbers: p.numbers,
        });
      });
      strats.slice(0, 10).forEach((s: any) => {
        actList.push({
          date: s.createdAt || new Date().toISOString(),
          type: 'strategy',
          detail: s.name,
        });
      });
      actList.sort((a, b) => b.date.localeCompare(a.date));
      setActivities(actList.slice(0, 15));
    } catch {}
  }, []);

  if (ld || ls) return <div className="flex items-center justify-center h-64 text-[var(--color-muted)]">{t('loading')}</div>;

  // User stats
  const picks = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('quantum8_picks') || '[]'); } catch { return []; }
  }, []);
  const strategies = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('quantum8_strategies') || '[]'); } catch { return []; }
  }, []);
  const killedNums = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('quantum8_killed_numbers') || '[]'); } catch { return []; }
  }, []);

  // Recent draw insights
  const latestDraw = draws[0];
  const hotNumbers = [...stats].sort((a, b) => b.hotScore - a.hotScore).slice(0, 5);
  const coldNumbers = [...stats].sort((a, b) => b.currentMiss - a.currentMiss).slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold gradient-text-primary">📊 我的仪表盘</h2>
        {user && (
          <div className="text-xs text-[var(--color-muted)]">
            欢迎回来，<span className="text-[var(--color-primary)] font-bold">{user.email?.split('@')[0]}</span>
          </div>
        )}
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: '选号记录', value: picks.length, icon: '🎯', color: 'text-blue-400' },
          { label: '自定义策略', value: strategies.length, icon: '🧪', color: 'text-purple-400' },
          { label: '杀号列表', value: killedNums.length, icon: '🔪', color: 'text-red-400' },
          { label: '数据期数', value: draws.length, icon: '📊', color: 'text-emerald-400' },
        ].map(item => (
          <div key={item.label} className="glass-card p-3 text-center">
            <div className="text-lg">{item.icon}</div>
            <div className={`font-bold text-lg ${item.color}`}>{item.value}</div>
            <div className="text-[10px] text-[var(--color-muted)]">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Insights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Collapsible title="🔥 今日热号 TOP 5" step={1}>
          <div className="flex gap-2 flex-wrap">
            {hotNumbers.map(s => (
              <div key={s.number} className="glass-inset p-2 text-center">
                <NumberBall number={s.number} size="md" />
                <div className="text-[10px] text-[var(--color-muted)] mt-1">{s.hotScore}分</div>
              </div>
            ))}
          </div>
        </Collapsible>

        <Collapsible title="❄️ 今日冷号 TOP 5" step={2}>
          <div className="flex gap-2 flex-wrap">
            {coldNumbers.map(s => (
              <div key={s.number} className="glass-inset p-2 text-center">
                <NumberBall number={s.number} size="md" />
                <div className="text-[10px] text-[var(--color-muted)] mt-1">遗漏{s.currentMiss}期</div>
              </div>
            ))}
          </div>
        </Collapsible>
      </div>

      {/* Recent Activity */}
      <Collapsible title="📋 最近活动" step={3}>
        {activities.length === 0 ? (
          <div className="text-center py-6 text-[var(--color-muted)] text-sm">
            暂无活动记录，去智能选号或策略实验室开始吧
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {activities.map((act, i) => (
              <div key={i} className="flex items-center gap-3 py-2 px-3 glass-inset">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                  act.type === 'pick' ? 'bg-blue-500/15 text-blue-400'
                  : act.type === 'strategy' ? 'bg-purple-500/15 text-purple-400'
                  : 'bg-emerald-500/15 text-emerald-400'
                }`}>
                  {act.type === 'pick' ? '🎯' : act.type === 'strategy' ? '🧪' : '📊'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate">{act.detail}</div>
                  <div className="text-[10px] text-[var(--color-muted)]">{new Date(act.date).toLocaleDateString('zh-CN')}</div>
                </div>
                {act.numbers && (
                  <div className="flex gap-0.5 shrink-0">
                    {act.numbers.slice(0, 5).map(n => (
                      <NumberBall key={n} number={n} size="sm" />
                    ))}
                    {act.numbers.length > 5 && <span className="text-[10px] text-[var(--color-muted)]">+{act.numbers.length - 5}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Collapsible>

      {/* Latest Draw Quick View */}
      {latestDraw && (
        <Collapsible title="🎱 最新开奖" step={4}>
          <div className="flex items-center gap-3 mb-3">
            <div className="font-mono text-sm font-bold">{latestDraw.draw_number}</div>
            <div className="text-xs text-[var(--color-muted)]">{latestDraw.draw_date}</div>
          </div>
          <div className="flex flex-wrap gap-1 mb-3">
            {latestDraw.numbers.map((n: number) => (
              <NumberBall key={n} number={n} size="md" />
            ))}
          </div>
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="glass-inset p-2">
              <div className="text-[var(--color-muted)]">和值</div>
              <div className="font-bold font-mono">{latestDraw.sum_value}</div>
            </div>
            <div className="glass-inset p-2">
              <div className="text-[var(--color-muted)]">奇偶</div>
              <div className="font-bold font-mono">{latestDraw.odd_count}:{latestDraw.even_count}</div>
            </div>
            <div className="glass-inset p-2">
              <div className="text-[var(--color-muted)]">大小</div>
              <div className="font-bold font-mono">{latestDraw.big_count}:{latestDraw.small_count}</div>
            </div>
            <div className="glass-inset p-2">
              <div className="text-[var(--color-muted)]">跨度</div>
              <div className="font-bold font-mono">{latestDraw.span}</div>
            </div>
          </div>
        </Collapsible>
      )}
    </div>
  );
}
