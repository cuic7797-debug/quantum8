import ExportButton from '@/components/common/ExportButton';
import { useState } from 'react';
import { useDraws } from '@/hooks/useDraws';
import { useNumberStats } from '@/hooks/useNumberStats';
import { supabase } from '@/utils/supabase';
import { fetchFromCWL, cacheDraws, getCachedDraws, getCacheTime } from '@/utils/dataFetch';
import { t } from '@/hooks/useI18n';

function calcFeatures(numbers: number[]) {
  const sorted = [...numbers].sort((a, b) => a - b);
  const sum_value = numbers.reduce((a, b) => a + b, 0);
  const span = sorted[sorted.length - 1] - sorted[0];
  const odd_count = numbers.filter(n => n % 2 === 1).length;
  const even_count = numbers.length - odd_count;
  const big_count = numbers.filter(n => n > 40).length;
  const small_count = numbers.length - big_count;
  const zone1_count = numbers.filter(n => n <= 20).length;
  const zone2_count = numbers.filter(n => n > 20 && n <= 40).length;
  const zone3_count = numbers.filter(n => n > 40 && n <= 60).length;
  const zone4_count = numbers.filter(n => n > 60).length;
  let consecutive_count = 0, streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) streak++;
    else { if (streak >= 2) consecutive_count++; streak = 1; }
  }
  if (streak >= 2) consecutive_count++;
  const repeat_count = numbers.length - new Set(numbers).size;
  return { numbers, sum_value, span, odd_count, even_count, big_count, small_count,
    zone1_count, zone2_count, zone3_count, zone4_count, consecutive_count, repeat_count };
}

export default function DataPage() {
  const { draws, refetch: refetchDraws } = useDraws(500);
  const { stats, refetch: refetchStats } = useNumberStats();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [importText, setImportText] = useState('');
  const [importMsg, setImportMsg] = useState('');

  const cachedTime = getCacheTime();
  const cachedDraws = getCachedDraws();

  // Export functions
  const exportDraws = () => {
    const exportData = draws.map(d => ({
      draw_number: d.draw_number, draw_date: d.draw_date,
      numbers: d.numbers.join(' '), sum_value: d.sum_value,
      odd_count: d.odd_count, even_count: d.even_count,
      big_count: d.big_count, small_count: d.small_count,
    }));
    return exportData;
  };

  async function syncFromAPI() {
    setLoading(true);
    setMsg('正在从福彩官网获取数据...');

    // Try Edge Function first
    try {
      const resp = await fetch('https://gomowvpstlmwcvvgnujo.supabase.co/functions/v1/sync-draws', {
        method: 'POST',
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
      });
      const data = await resp.json();
      if (!data.error) {
        setMsg(`✅ Edge Function 同步完成: 新增 ${data.inserted} 期`);
        refetchDraws(); refetchStats();
        setLoading(false);
        setTimeout(() => setMsg(''), 5000);
        return;
      }
    } catch {}

    // Fallback: direct CWL API
    setMsg('Edge Function 不可用，直接从福彩官网抓取...');
    const result = await fetchFromCWL(200);
    if (result.error) {
      setMsg(`❌ 抓取失败: ${result.error}`);
      setLoading(false);
      return;
    }

    cacheDraws(result.draws);
    setMsg(`✅ 获取到 ${result.count} 期数据`);

    // Try insert to Supabase
    let inserted = 0;
    const { data: existing } = await supabase.from('draws').select('draw_number');
    const existSet = new Set((existing || []).map((d: any) => d.draw_number));

    for (const draw of result.draws) {
      if (existSet.has(draw.draw_number)) continue;
      const { error } = await supabase.from('draws').insert(draw);
      if (!error) inserted++;
    }

    setMsg(`✅ 获取 ${result.count} 期 | 新增 ${inserted} 期到数据库`);
    refetchDraws(); refetchStats();
    setLoading(false);
    setTimeout(() => setMsg(''), 5000);
  }

  function importCSV() {
    if (!importText.trim()) return;
    setImportMsg('');
    const lines = importText.trim().split('\n');
    let inserted = 0;
    let errors = 0;

    for (const line of lines) {
      // Format: 2026162,2026-07-20,1,5,12,23,34,45,56,67,78,80,11,22,33,44,55,66,77,79
      const parts = line.split(/[,，\s\t]+/).filter(Boolean);
      if (parts.length < 22) { errors++; continue; }

      const drawNumber = parts[0];
      const drawDate = parts[1];
      const numbers = parts.slice(2, 22).map(Number).filter(n => n >= 1 && n <= 80);

      if (numbers.length !== 20) { errors++; continue; }

      const features = calcFeatures(numbers);
      supabase.from('draws').insert({ draw_number: drawNumber, draw_date: drawDate, ...features })
        .then(({ error }) => { if (!error) inserted++; else errors++; });
    }

    setImportMsg(`导入完成: 成功 ${inserted} 期，失败 ${errors} 期`);
    setTimeout(() => { refetchDraws(); refetchStats(); }, 1000);
  }

  function clearCache() {
    localStorage.removeItem('quantum8_cached_draws');
    localStorage.removeItem('quantum8_cache_time');
    setMsg('✅ 本地缓存已清除');
    setTimeout(() => setMsg(''), 3000);
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">数据管理</h2>

      {/* Status */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5 space-y-3">
        <h3 className="font-semibold text-sm">📊 数据状态</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-[var(--color-bg)] rounded-lg p-3">
            <div className="text-xs text-[var(--color-muted)]">数据库期数</div>
            <div className="text-xl font-bold">{draws.length}</div>
          </div>
          <div className="bg-[var(--color-bg)] rounded-lg p-3">
            <div className="text-xs text-[var(--color-muted)]">号码统计</div>
            <div className="text-xl font-bold">{stats.length}</div>
          </div>
          <div className="bg-[var(--color-bg)] rounded-lg p-3">
            <div className="text-xs text-[var(--color-muted)]">本地缓存</div>
            <div className="text-xl font-bold">{cachedDraws?.length || 0}</div>
          </div>
          <div className="bg-[var(--color-bg)] rounded-lg p-3">
            <div className="text-xs text-[var(--color-muted)]">最新数据</div>
            <div className="text-sm font-mono">{draws[0]?.draw_date || '-'}</div>
          </div>
        </div>
        {cachedTime && (
          <div className="text-xs text-[var(--color-muted)]">
            本地缓存时间: {new Date(cachedTime).toLocaleString()}
          </div>
        )}
      </div>

      {msg && (
        <div className={`text-sm text-center py-3 rounded-lg ${msg.includes('❌') ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
          {msg}
        </div>
      )}

      {/* Sync Button */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5 space-y-3">
        <h3 className="font-semibold text-sm">🔄 从福彩官网同步</h3>
        <p className="text-xs text-[var(--color-muted)]">
          自动从中国福彩官网 API 获取最新开奖数据，先尝试 Edge Function，失败后直接从 API 抓取。
        </p>
        <div className="flex gap-3">
          <button onClick={syncFromAPI} disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-[var(--color-primary)] text-white font-semibold hover:bg-[var(--color-primary)]/80 disabled:opacity-50 transition-all shadow">
            {loading ? '⏳ 同步中...' : '🔄 同步数据'}
          </button>
          <button onClick={clearCache}
            className="px-4 py-2.5 rounded-xl bg-[var(--color-bg)] text-[var(--color-muted)] hover:bg-[var(--color-border)] transition-all text-sm">
            清除缓存
          </button>
        </div>
      </div>

      {/* CSV Import */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5 space-y-3">
        <h3 className="font-semibold text-sm">📋 手动导入（CSV格式）</h3>
        <p className="text-xs text-[var(--color-muted)]">
          每行一期，格式: 期号,日期,20个号码（逗号分隔）<br />
          示例: 2026162,2026-07-20,1,5,12,23,34,45,56,67,78,80,11,22,33,44,55,66,77,79
        </p>
        <textarea value={importText} onChange={e => setImportText(e.target.value)}
          placeholder="2026162,2026-07-20,1,5,12,23,34,45,56,67,78,80,11,22,33,44,55,66,77,79&#10;2026161,2026-07-19,3,8,15,22,31,44,53,61,72,79,2,19,36,48,57,63,74,80"
          className="w-full h-32 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm font-mono resize-none" />
        <button onClick={importCSV} disabled={!importText.trim()}
          className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-600/80 disabled:opacity-50 transition-all shadow">
          📥 导入数据
        </button>
        {importMsg && <div className="text-xs text-emerald-400">{importMsg}</div>}
      </div>

      <div className="text-center text-[10px] text-[var(--color-muted)] py-4">
        Quantum8 v1.0 · 数据管理
      </div>
    </div>
  );
}
