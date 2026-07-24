import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserPicks } from '@/hooks/useUserPicks';
import { useUserStrategies } from '@/hooks/useUserStrategies';
import NumberBall from '@/components/common/NumberBall';
import NumberGroups from '@/components/selection/NumberGroups';
import CopyButton from '@/components/common/CopyButton';
import Collapsible from '@/components/common/Collapsible';
import PredictionTracker from '@/components/analysis/PredictionTracker';
import { useDraws } from '@/hooks/useDraws';
import { Trash2, CheckSquare, Square, Download } from 'lucide-react';

interface SavedPick { numbers: number[]; playType: string; score: number; risk: string; time: string; strategy: string; }

export default function FavoritesPage() {
  const { user } = useAuth();
  const { picks: cloudPicks, deletePick } = useUserPicks();
  const { strategies: cloudStrategies } = useUserStrategies();
  const { draws, loading: drawsLoading } = useDraws(200);
  const [localPicks, setLocalPicks] = useState<SavedPick[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<Set<number>>(new Set());
  const [selectMode, setSelectMode] = useState(false);

  useEffect(() => {
    try { setLocalPicks(JSON.parse(localStorage.getItem('quantum8_picks') || '[]')); } catch { setLocalPicks([]); }
  }, []);
  if (drawsLoading) return <div className="flex items-center justify-center h-64"><div className="flex flex-col items-center gap-3"><div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" /><span className="text-base text-[var(--color-muted)]">加载中...</span></div></div>;

  const picks = user ? cloudPicks.map(cp => ({
    numbers: cp.numbers, playType: cp.play_type, score: 0, risk: '中',
    time: cp.created_at, strategy: cp.strategy_label,
  })) : localPicks;

  const savedStrats = JSON.parse(localStorage.getItem('quantum8_strategies') || '[]');
  const stratCount = user ? cloudStrategies.length : savedStrats.length;
  const killedNums = JSON.parse(localStorage.getItem('quantum8_killed_numbers') || '[]');
  const groups = (() => { try { return JSON.parse(localStorage.getItem('quantum8_number_groups') || '[]'); } catch { return []; } })();

  function toggleSelect(idx: number) {
    const next = new Set(selectedIdx);
    if (next.has(idx)) next.delete(idx); else next.add(idx);
    setSelectedIdx(next);
  }

  function selectAll() {
    if (selectedIdx.size === picks.length) {
      setSelectedIdx(new Set());
    } else {
      setSelectedIdx(new Set(picks.map((_, i) => i)));
    }
  }

  function batchDelete() {
    if (!user) {
      const remaining = localPicks.filter((_, i) => !selectedIdx.has(i));
      localStorage.setItem('quantum8_picks', JSON.stringify(remaining));
      setLocalPicks(remaining);
    } else {
      selectedIdx.forEach(i => { const cp = cloudPicks[i]; if (cp) deletePick(cp.id); });
    }
    setSelectedIdx(new Set());
    setSelectMode(false);
  }

  function exportCSV() {
    const header = '号码,玩法,策略,评分,风险,时间';
    const rows = picks.map(p => `${p.numbers.join(' ')},${p.playType},${p.strategy},${p.score},${p.risk},${p.time}`);
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'quantum8_picks.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold gradient-text-primary">⭐ 我的收藏</h2>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="text-xs px-3 py-1.5 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-white/5 flex items-center gap-1 transition-all">
            <Download size={12} /> 导出
          </button>
        </div>
      </div>

      {/* 统计概览 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: '选号记录', value: picks.length, icon: '🎯', color: 'text-blue-400' },
          { label: '自定义策略', value: stratCount, icon: '🧪', color: 'text-purple-400' },
          { label: '杀号列表', value: killedNums.length, icon: '🔪', color: 'text-red-400' },
          { label: '号码分组', value: groups.length, icon: '📁', color: 'text-emerald-400' },
        ].map(item => (
          <div key={item.label} className="glass-card p-3 text-center">
            <div className="text-lg">{item.icon}</div>
            <div className={'font-bold text-lg ' + item.color}>{item.value}</div>
            <div className="text-sm text-[var(--color-muted)]">{item.label}</div>
          </div>
        ))}
      </div>

      {/* 号码分组 */}
      <Collapsible title="📁 号码分组" step={1} badge="自定义分组">
        <NumberGroups />
      </Collapsible>

      {/* 选号记录 */}
      <Collapsible title={`🎯 选号记录（${picks.length}组）`} step={2} badge={`${picks.length}组`}>
        {picks.length === 0 ? (
          <div className="text-center py-6 text-[var(--color-muted)] text-sm">暂无选号记录，去智能选号页面生成吧</div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-3">
              <button onClick={() => { setSelectMode(!selectMode); setSelectedIdx(new Set()); }}
                className={`text-xs px-3 py-1.5 rounded-lg transition-all ${selectMode ? 'bg-red-500/15 text-red-400' : 'text-[var(--color-muted)] hover:bg-white/5'}`}>
                {selectMode ? '取消选择' : '☑️ 批量操作'}
              </button>
              {selectMode && (
                <>
                  <button onClick={selectAll} className="text-xs px-2 py-1 rounded text-[var(--color-muted)] hover:bg-white/5">
                    {selectedIdx.size === picks.length ? '取消全选' : '全选'}
                  </button>
                  <button onClick={batchDelete} disabled={selectedIdx.size === 0}
                    className="text-xs px-2 py-1 rounded text-red-400 hover:bg-red-500/10 disabled:opacity-40">
                    🗑️ 删除 ({selectedIdx.size})
                  </button>
                </>
              )}
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {picks.map((p, i) => (
                <div key={i} className={`flex items-center justify-between py-2 px-3 glass-inset transition-all ${selectMode && selectedIdx.has(i) ? 'ring-1 ring-red-500/50 bg-red-500/5' : ''}`}
                  onClick={() => selectMode && toggleSelect(i)}>
                  <div className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm text-[var(--color-muted)]">{new Date(p.time).toLocaleDateString('zh-CN')}</span>
                      <span className="text-xs bg-[var(--color-primary)]/20 text-[var(--color-primary)] px-1.5 py-0.5 rounded">{p.playType}</span>
                      {p.strategy && <span className="text-sm text-[var(--color-muted)]">{p.strategy}</span>}
                    </div>
                    <div className="flex gap-0.5 flex-wrap">{p.numbers.map(n => <NumberBall key={n} number={n} size="sm" />)}</div>
                  </div>
                  {!selectMode && (
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <CopyButton text={p.numbers.map(n => n.toString().padStart(2, '0')).join(' ')} label="复制" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </Collapsible>

      {/* 保存的策略 */}
      <Collapsible title={`🧪 保存的策略（${stratCount}个）`} step={3} badge={`${stratCount}个`}>
        {stratCount === 0 ? (
          <div className="text-center py-6 text-[var(--color-muted)] text-sm">暂无策略，去策略实验室创建吧</div>
        ) : (
          <div className="space-y-2">
            {(user ? cloudStrategies : savedStrats).map((s: any) => (
              <div key={s.id || s.name} className="flex items-center justify-between py-2 px-3 glass-inset">
                <div>
                  <div className="text-sm font-semibold">{s.name}</div>
                  <div className="text-sm text-[var(--color-muted)]">
                    {(s.config || s).playType || '选十'} · 热{(s.config || s).hotCount || 4}/冷{(s.config || s).coldCount || 4}/平{(s.config || s).balanceCount || 2}
                  </div>
                </div>
                <CopyButton text={s.name + ': 热' + ((s.config || s).hotCount || 4) + ' 冷' + ((s.config || s).coldCount || 4) + ' 平' + ((s.config || s).balanceCount || 2)} label="复制" />
              </div>
            ))}
          </div>
        )}
      </Collapsible>

      {/* 杀号列表 */}
      {killedNums.length > 0 && (
        <Collapsible title={`🔪 杀号列表（${killedNums.length}个）`} step={4} badge={`${killedNums.length}个`}>
          <div className="flex flex-wrap gap-1">
            {killedNums.map((n: number) => <NumberBall key={n} number={n} size="sm" />)}
          </div>
          <div className="mt-2">
            <CopyButton text={killedNums.join(' ')} label="复制杀号列表" />
          </div>
        </Collapsible>
      )}

      {/* 预测追踪 */}
      <Collapsible title="📊 预测追踪" step={5} badge="命中率分析" defaultOpen={false}>
        <PredictionTracker 
          picks={picks.map(p => ({ numbers: p.numbers, strategy: p.strategy, playType: p.playType, createdAt: p.time }))}
          draws={draws}
        />
      </Collapsible>
    </div>
  );
}
