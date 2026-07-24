import Collapsible from '@/components/common/Collapsible';

const API_ENDPOINTS = [
  {
    method: 'GET',
    path: '/rest/v1/draws',
    description: '获取快乐8开奖数据',
    params: [
      { name: 'select', type: 'string', required: false, desc: '指定返回字段，如 "*" 或 "draw_number,numbers"' },
      { name: 'order', type: 'string', required: false, desc: '排序方式，如 "draw_number.desc"' },
      { name: 'limit', type: 'number', required: false, desc: '返回数量，默认100' },
    ],
    example: 'https://gomowvpstlmwcvvgnujo.supabase.co/rest/v1/draws?select=*&order=draw_number.desc&limit=10',
  },
  {
    method: 'GET',
    path: '/rest/v1/draws',
    description: '获取特定期号的开奖数据',
    params: [
      { name: 'draw_number', type: 'string', required: true, desc: '期号，如 "2026001"' },
    ],
    example: 'https://gomowvpstlmwcvvgnujo.supabase.co/rest/v1/draws?draw_number=eq.2026001',
  },
  {
    method: 'GET',
    path: '/rest/v1/number_stats',
    description: '获取号码统计分析数据',
    params: [
      { name: 'select', type: 'string', required: false, desc: '返回字段' },
      { name: 'order', type: 'string', required: false, desc: '排序方式，如 "hotScore.desc"' },
    ],
    example: 'https://gomowvpstlmwcvvgnujo.supabase.co/rest/v1/number_stats?select=number,hotScore,currentMiss&order=hotScore.desc',
  },
  {
    method: 'GET',
    path: '/rest/v1/lottery_draws',
    description: '获取多彩票开奖数据（双色球/大乐透）',
    params: [
      { name: 'lottery_type', type: 'string', required: true, desc: '彩票类型："kl8" | "ssq" | "dlt"' },
      { name: 'limit', type: 'number', required: false, desc: '返回数量' },
    ],
    example: 'https://gomowvpstlmwcvvgnujo.supabase.co/rest/v1/lottery_draws?lottery_type=eq.ssq&limit=20',
  },
  {
    method: 'POST',
    path: '/functions/v1/sync-draws',
    description: '触发数据同步（Edge Function）',
    params: [
      { name: 'apikey', type: 'header', required: true, desc: 'Supabase anon key' },
    ],
    example: 'POST https://gomowvpstlmwcvvgnujo.supabase.co/functions/v1/sync-draws',
  },
];

const ALGORITHM_DOCS = [
  { name: '马尔可夫链分析', module: 'markovTransition', desc: '分析号码出现的状态转移概率，预测下一期出现概率' },
  { name: '贝叶斯推断', module: 'bayesianInference', desc: '结合先验概率和观测数据计算后验概率' },
  { name: '信息熵分析', module: 'calculateEntropy', desc: '评估号码出现的不确定性/混乱度' },
  { name: '关联规则挖掘', module: 'findAssociationRules', desc: '发现号码之间的频繁共现模式（Apriori算法）' },
  { name: '集成评分', module: 'ensembleScoring', desc: '综合多种算法的评分，类似随机森林的思想' },
  { name: '趋势回归', module: 'trendRegression', desc: '线性回归预测号码出现趋势' },
  { name: '遗传算法选号', module: 'geneticAlgorithm', desc: '使用遗传算法进化生成最优号码组合' },
  { name: '号码聚类', module: 'clusterNumbers', desc: '将号码分为热/温/凉/冷四个聚类' },
  { name: '自相关分析', module: 'autocorrelation', desc: '分析号码出现的时间序列自相关性' },
  { name: '布林带分析', module: 'bollingerBands', desc: '使用布林带识别号码出现的异常区间' },
  { name: '策略回测', module: 'runBacktest', desc: '基于历史数据回测策略表现' },
  { name: '蒙特卡洛模拟', module: 'monteCarloSimulation', desc: '随机模拟评估策略风险和期望收益' },
];

export default function ApiDocsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold gradient-text-primary">📖 API 文档</h2>
        <div className="text-xs text-[var(--color-muted)]">v1.0</div>
      </div>

      <div className="glass-card p-4 text-sm">
        <p className="text-[var(--color-muted)] mb-2">Quantum8 提供基于 Supabase 的 RESTful API，支持直接查询开奖数据和统计数据。</p>
        <p className="text-[10px] text-[var(--color-muted)]">
          Base URL: <code className="text-[var(--color-primary)]">https://gomowvpstlmwcvvgnujo.supabase.co</code>
        </p>
        <p className="text-[10px] text-[var(--color-muted)] mt-1">
          所有请求需携带 Header: <code className="text-[var(--color-primary)]">apikey: {`${'{YOUR_ANON_KEY}'}`}</code>
        </p>
      </div>

      {/* Data Endpoints */}
      <Collapsible title="📡 数据接口" step={1} defaultOpen>
        <div className="space-y-4">
          {API_ENDPOINTS.map((ep, i) => (
            <div key={i} className="glass-card p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                  ep.method === 'GET' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-blue-500/15 text-blue-400'
                }`}>{ep.method}</span>
                <code className="text-sm font-mono text-[var(--color-primary)]">{ep.path}</code>
              </div>
              <div className="text-xs text-[var(--color-muted)] mb-2">{ep.description}</div>
              {ep.params.length > 0 && (
                <table className="w-full text-[10px] mb-2">
                  <thead>
                    <tr className="border-b border-[var(--glass-border)]">
                      <th className="py-1 text-left text-[var(--color-muted)] font-normal">参数</th>
                      <th className="py-1 text-left text-[var(--color-muted)] font-normal">类型</th>
                      <th className="py-1 text-left text-[var(--color-muted)] font-normal">必填</th>
                      <th className="py-1 text-left text-[var(--color-muted)] font-normal">说明</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ep.params.map(p => (
                      <tr key={p.name} className="border-b border-[var(--glass-border)]/30">
                        <td className="py-1 font-mono text-[var(--color-primary)]">{p.name}</td>
                        <td className="py-1 text-[var(--color-muted)]">{p.type}</td>
                        <td className="py-1">{p.required ? '✅' : '❌'}</td>
                        <td className="py-1 text-[var(--color-muted)]">{p.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div className="text-[10px] text-[var(--color-muted)] bg-black/20 rounded p-2 font-mono break-all">
                示例: {ep.example}
              </div>
            </div>
          ))}
        </div>
      </Collapsible>

      {/* Algorithm Docs */}
      <Collapsible title="🧮 算法文档" step={2} defaultOpen={false}>
        <div className="space-y-2">
          {ALGORITHM_DOCS.map((algo, i) => (
            <div key={i} className="glass-card p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold">{algo.name}</span>
                <code className="text-[10px] text-[var(--color-primary)] font-mono">{algo.module}()</code>
              </div>
              <div className="text-[11px] text-[var(--color-muted)]">{algo.desc}</div>
            </div>
          ))}
        </div>
      </Collapsible>

      {/* Usage Example */}
      <Collapsible title="💻 使用示例" step={3} defaultOpen={false}>
        <div className="space-y-3">
          <div className="glass-card p-3">
            <div className="text-xs font-bold mb-2">JavaScript / Fetch</div>
            <pre className="text-[10px] font-mono text-[var(--color-muted)] bg-black/20 rounded p-3 overflow-x-auto">
{`const response = await fetch(
  'https://gomowvpstlmwcvvgnujo.supabase.co/rest/v1/draws?order=draw_number.desc&limit=10',
  { headers: { 'apikey': 'YOUR_ANON_KEY' } }
);
const data = await response.json();
console.log(data);`}
            </pre>
          </div>
          <div className="glass-card p-3">
            <div className="text-xs font-bold mb-2">Python / requests</div>
            <pre className="text-[10px] font-mono text-[var(--color-muted)] bg-black/20 rounded p-3 overflow-x-auto">
{`import requests
url = 'https://gomowvpstlmwcvvgnujo.supabase.co/rest/v1/draws'
headers = {'apikey': 'YOUR_ANON_KEY'}
params = {'order': 'draw_number.desc', 'limit': '10'}
resp = requests.get(url, headers=headers, params=params)
data = resp.json()
print(data)`}
            </pre>
          </div>
        </div>
      </Collapsible>
    </div>
  );
}
