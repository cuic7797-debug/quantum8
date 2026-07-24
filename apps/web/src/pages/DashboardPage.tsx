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

  const picks = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('quantum8_picks') || '[]'); } catch { return []; }
  }, []);
  const strategies = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('quantum8_strategies') || '[]'); } catch { return []; }
  }, []);
  const killedNums = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('quantum8_killed_numbers') || '[]'); } catch { return []; }
  }, []);

  if (ld || ls) return <div className="flex items-center justify-center h-64 text-base text-[var(--color-muted)]">{t('loading')}</div>;

  const latestDraw = draws[0];
  const hotNumbers = [...stats].sort((a, b) => b.hotScore - a.hotScore).slice(0, 5);
  const coldNumbers = [...stats].sort((a, b) => b.currentMiss - a.currentMiss).slice(0, 5);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold gradient-text-primary">我的仪表盘</h2>
        {user && (
          <div className="text-sm text-[var(--color-muted)]">
            欢迎回来，<span className="text-[var(--color-primary)] font-bold">{user.email?.split('@')[0]}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: '选号记录', value: picks.length, icon: '🎯', color: 'text-blue-400' },
          { label: '自定义策略', value: strategies.length, icon: '🧪', color: 'text-purple-400' },
          { label: '杀号列表', value: killedNums.length, icon: '🔪', color: 'text-red-400' },
          { label: '数据期数', value: draws.length, icon: '📊', color: 'text-emerald-400' },
        ].map(item => (
          <div key={item.label} className="glass-card text-center" style={{ padding: '16px 12px' }}>
            <div className="text-2xl mb-2">{item.icon}</div>
            <div className={`font-bold text-2xl ${item.color}`}>{item.value}</div>
            <div className="text-sm text-[var(--color-muted)] mt-1">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Collapsible title="今日热号 TOP 5" step={1}>
          <div className="flex gap-4 flex-wrap">
            {hotNumbers.map(s => (
              <div key={s.number} className="glass-inset p-3 text-center" style={{ padding: '12px 16px' }}>
                <NumberBall number={s.number} size="md" />
                <div className="text-sm text-[var(--color-muted)] mt-2">{s.hotScore}分</div>
              </div>
            ))}
          </div>
        </Collapsible>

        <Collapsible title="今日冷号 TOP 5" step={2}>
          <div className="flex gap-4 flex-wrap">
            {coldNumbers.map(s => (
              <div key={s.number} className="glass-inset p-3 text-center" style={{ padding: '12px 16px' }}>
                <NumberBall number={s.number} size="md" />
                <div className="text-sm text-[var(--color-muted)] mt-2">遗漏{s.currentMiss}期</div>
              </div>
            ))}
          </div>
        </Collapsible>
      </div>

      <Collapsible title="最近活动" step={3}>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-[var(--color-muted)] text-base">
            暂无活动记录，去智能选号或策略实验室开始吧
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {activities.map((act, i) => (
              <div key={i} className="flex items-center gap-4 py-3 px-4 glass-inset">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-base ${
                  act.type === 'pick' ? 'bg-blue-500/15 text-blue-400'
                  : act.type === 'strategy' ? 'bg-purple-500/15 text-purple-400'
                  : 'bg-emerald-500/15 text-emerald-400'
                }`}>
                  {act.type === 'pick' ? '🎯' : act.type === 'strategy' ? '🧪' : '📊'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{act.detail}</div>
                  <div className="text-sm text-[var(--color-muted)]">{new Date(act.date).toLocaleDateString('zh-CN')}</div>
                </div>
                {act.numbers && (
                  <div className="flex gap-1 shrink-0">
                    {act.numbers.slice(0, 5).map(n => (
                      <NumberBall key={n} number={n} size="sm" />
                    ))}
                    {act.numbers.length > 5 && <span className="text-sm text-[var(--color-muted)]">+{act.numbers.length - 5}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Collapsible>

      {latestDraw && (
        <Collapsible title="最新开奖" step={4}>
          <div className="flex items-center gap-4 mb-4">
            <div className="font-mono text-base font-bold">{latestDraw.draw_number}</div>
            <div className="text-sm text-[var(--color-muted)]">{latestDraw.draw_date}</div>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {latestDraw.numbers.map((n: number) => (
              <NumberBall key={n} number={n} size="md" />
            ))}
          </div>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="glass-inset p-3">
              <div className="text-sm text-[var(--color-muted)]">和值</div>
              <div className="text-lg font-bold font-mono">{latestDraw.sum_value}</div>
            </div>
            <div className="glass-inset p-3">
              <div className="text-sm text-[var(--color-muted)]">奇偶</div>
              <div className="text-lg font-bold font-mono">{latestDraw.odd_count}:{latestDraw.even_count}</div>
            </div>
            <div className="glass-inset p-3">
              <div className="text-sm text-[var(--color-muted)]">大小</div>
              <div className="text-lg font-bold font-mono">{latestDraw.big_count}:{latestDraw.small_count}</div>
            </div>
            <div className="glass-inset p-3">
              <div className="text-sm text-[var(--color-muted)]">跨度</div>
              <div className="text-lg font-bold font-mono">{latestDraw.span}</div>
            </div>
          </div>
        </Collapsible>
      )}
    </div>
  );
}
