import { useDraws } from '@/hooks/useDraws';
import { useNumberStats } from '@/hooks/useNumberStats';
import NumberGrid from '@/components/analysis/NumberGrid';
import HotColdRanking from '@/components/analysis/HotColdRanking';
import NumberBall from '@/components/common/NumberBall';
import { t } from '@/hooks/useI18n';

export default function AnalysisPage() {
  const { draws, loading: ld } = useDraws(50);
  const { stats, loading: ls } = useNumberStats();
  if (ld || ls) return <div className="flex items-center justify-center h-64 text-[var(--color-muted)]">{t('loading')}</div>;
  if (!draws.length || !stats.length) return <div className="flex items-center justify-center h-64 text-[var(--color-muted)]">{t('no_data')}</div>;
  let h2=0,h3=0,n=0;
  draws.forEach(d=>{const nums=[...d.numbers].sort((a,b)=>a-b);let mx=1,s=1;for(let i=1;i<nums.length;i++){if(nums[i]===nums[i-1]+1){s++;mx=Math.max(mx,s)}else s=1}if(mx>=3)h3++;else if(mx>=2)h2++;else n++});
  const trend=draws.slice(0,15).map(d=>({k:d.draw_number.slice(-3),o:d.odd_count,e:d.even_count}));
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">{t('trend_analysis')}</h2>
      <NumberGrid stats={stats} />
      <HotColdRanking stats={stats} />
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
        <h3 className="text-sm font-semibold text-[var(--color-muted)] mb-3">{t('consec_stats')} ({draws.length})</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center bg-[var(--color-bg)] rounded-lg p-3"><div className="text-2xl font-bold">{h2}</div><div className="text-xs text-[var(--color-muted)]">{t('has_2consec')} {((h2/draws.length)*100).toFixed(1)}%</div></div>
          <div className="text-center bg-[var(--color-bg)] rounded-lg p-3"><div className="text-2xl font-bold">{h3}</div><div className="text-xs text-[var(--color-muted)]">{t('has_3consec')} {((h3/draws.length)*100).toFixed(1)}%</div></div>
          <div className="text-center bg-[var(--color-bg)] rounded-lg p-3"><div className="text-2xl font-bold">{n}</div><div className="text-xs text-[var(--color-muted)]">{t('no_consec')} {((n/draws.length)*100).toFixed(1)}%</div></div>
        </div>
      </div>
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
        <h3 className="text-sm font-semibold text-[var(--color-muted)] mb-3">{t('odd_even_trend')}</h3>
        <div className="space-y-1">{trend.map(t2=>(<div key={t2.k} className="flex items-center gap-2 text-sm"><span className="font-mono text-xs text-[var(--color-muted)] w-8">{t2.k}</span><div className="flex-1 flex items-center"><div className="h-4 bg-blue-500 rounded-l" style={{width:`${(t2.o/20)*100}%`}}/><div className="h-4 bg-rose-500 rounded-r" style={{width:`${(t2.e/20)*100}%`}}/></div><span className="text-xs font-mono w-10 text-right">{t2.o}:{t2.e}</span></div>))}</div>
        <div className="flex justify-between mt-2 text-[10px] text-[var(--color-muted)]"><span>{t('odd')}</span><span>{t('even')}</span></div>
      </div>
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
        <h3 className="text-sm font-semibold text-[var(--color-muted)] mb-3">{t('miss_ranking')}</h3>
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">{[...stats].sort((a,b)=>b.currentMiss-a.currentMiss).slice(0,20).map((s,i)=>(<div key={s.number} className="flex items-center gap-2 text-sm"><span className="text-xs text-[var(--color-muted)] w-4">{i+1}</span><NumberBall number={s.number} size="sm"/><span className="font-mono text-xs">{s.currentMiss}{t('periods')}</span></div>))}</div>
      </div>
    </div>
  );
}
