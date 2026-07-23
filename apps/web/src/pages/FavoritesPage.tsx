import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserPicks } from '@/hooks/useUserPicks';
import { useUserStrategies } from '@/hooks/useUserStrategies';
import NumberBall from '@/components/common/NumberBall';
import NumberGroups from '@/components/selection/NumberGroups';
import CopyButton from '@/components/common/CopyButton';
import Collapsible from '@/components/common/Collapsible';
import { Trash2 } from 'lucide-react';

interface SavedPick { numbers: number[]; playType: string; score: number; risk: string; time: string; strategy: string; }

export default function FavoritesPage() {
  const { user } = useAuth();
  const { picks: cloudPicks, deletePick } = useUserPicks();
  const { strategies: cloudStrategies } = useUserStrategies();
  const [localPicks, setLocalPicks] = useState<SavedPick[]>([]);

  useEffect(() => {
    try { setLocalPicks(JSON.parse(localStorage.getItem('quantum8_picks') || '[]')); } catch { setLocalPicks([]); }
  }, []);

  const picks = user ? cloudPicks.map(cp => ({
    numbers: cp.numbers, playType: cp.play_type, score: 0, risk: '中',
    time: cp.created_at, strategy: cp.strategy_label,
  })) : localPicks;

  const savedStrats = JSON.parse(localStorage.getItem('quantum8_strategies') || '[]');
  const stratCount = user ? cloudStrategies.length : savedStrats.length;
  const killedNums = JSON.parse(localStorage.getItem('quantum8_killed_numbers') || '[]');

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">⭐ 我的收藏</h2>

      {/* 统计概览 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: '选号记录', value: picks.length, icon: '🎯', color: 'text-blue-400' },
          { label: '自定义策略', value: stratCount, icon: '🧪', color: 'text-purple-400' },
          { label: '杀号列表', value: killedNums.length, icon: '🔪', color: 'text-red-400' },
          { label: '号码分组', value: (() => { try { return JSON.parse(localStorage.getItem('quantum8_number_groups') || '[]').length; } catch { return 0; } })(), icon: '📁', color: 'text-emerald-400' },
        ].map(item => (
          <div key={item.label} className="glass-card p-3 text-center">
            <div className="text-lg">{item.icon}</div>
            <div className={'font-bold text-lg ' + item.color}>{item.value}</div>
            <div className="text-[10px] text-[var(--color-muted)]">{item.label}</div>
          </div>
        ))}
      </div>

      {/* 号码分组 */}
      <Collapsible title="📁 号码分组" step={1} badge="自定义分组">
        <NumberGroups />
      </Collapsible>

      {/* 选号记录 */}
      <Collapsible title={'🎯 选号记录（' + picks.length + '组）'} step={2} badge={picks.length + '组'}>
        {picks.length === 0 ? (
          <div className="text-center py-6 text-[var(--color-muted)] text-sm">暂无选号记录，去智能选号页面生成吧</div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {picks.map((p, i) => (
              <div key={i} className="flex items-center justify-between py-2 px-3 glass-inset">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[10px] text-[var(--color-muted)]">{new Date(p.time).toLocaleDateString()}</span>
                    <span className="text-[10px] bg-[var(--color-primary)]/20 text-[var(--color-primary)] px-1.5 py-0.5 rounded">{p.playType}</span>
                    {p.strategy && <span className="text-[10px] text-[var(--color-muted)]">{p.strategy}</span>}
                  </div>
                  <div className="flex gap-0.5 flex-wrap">{p.numbers.map(n => <NumberBall key={n} number={n} size="sm" />)}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <CopyButton text={p.numbers.join(' ')} label="复制" />
                </div>
              </div>
            ))}
          </div>
        )}
      </Collapsible>

      {/* 保存的策略 */}
      <Collapsible title={'🧪 保存的策略（' + stratCount + '个）'} step={3} badge={stratCount + '个'}>
        {stratCount === 0 ? (
          <div className="text-center py-6 text-[var(--color-muted)] text-sm">暂无策略，去策略实验室创建吧</div>
        ) : (
          <div className="space-y-2">
            {(user ? cloudStrategies : savedStrats).map((s: any) => (
              <div key={s.id || s.name} className="flex items-center justify-between py-2 px-3 glass-inset">
                <div>
                  <div className="text-sm font-semibold">{s.name}</div>
                  <div className="text-[10px] text-[var(--color-muted)]">{(s.config || s).playType || '选十'} · 热{(s.config || s).hotCount || 4}/冷{(s.config || s).coldCount || 4}/平{(s.config || s).balanceCount || 2}</div>
                </div>
                <CopyButton text={s.name + ': 热' + ((s.config || s).hotCount || 4) + ' 冷' + ((s.config || s).coldCount || 4) + ' 平' + ((s.config || s).balanceCount || 2)} label="复制" />
              </div>
            ))}
          </div>
        )}
      </Collapsible>

      {/* 杀号列表 */}
      {killedNums.length > 0 && (
        <Collapsible title={'🔪 杀号列表（' + killedNums.length + '个）'} step={4} badge={killedNums.length + '个'}>
          <div className="flex flex-wrap gap-1">
            {killedNums.map((n: number) => <NumberBall key={n} number={n} size="sm" />)}
          </div>
          <div className="mt-2">
            <CopyButton text={killedNums.join(' ')} label="复制杀号列表" />
          </div>
        </Collapsible>
      )}
    </div>
  );
}
