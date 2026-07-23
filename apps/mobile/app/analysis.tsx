import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { supabase } from '../utils/supabase';

interface Draw { draw_number: string; draw_date: string; numbers: number[]; sum_value: number; odd_count: number; big_count: number; }
interface Stat { number: number; hot_score: number; current_miss: number; total_appearances: number; }

export default function AnalysisScreen() {
  const [draws, setDraws] = useState<Draw[]>([]);
  const [stats, setStats] = useState<Stat[]>([]);

  useEffect(() => {
    supabase.from('draws').select('*').order('draw_date', { ascending: false }).limit(30).then(({ data }) => { if (data) setDraws(data as Draw[]); });
    supabase.from('number_stats').select('*').order('number').then(({ data }) => { if (data) setStats(data as Stat[]); });
  }, []);

  const hotTop10 = [...stats].sort((a, b) => b.hot_score - a.hot_score).slice(0, 10);
  const coldTop10 = [...stats].sort((a, b) => b.current_miss - a.current_miss).slice(0, 10);
  const recentSums = draws.slice(0, 15).map(d => ({ k: d.draw_number.slice(-3), s: d.sum_value }));

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>趋势分析</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🔥 热号 TOP 10</Text>
        <View style={styles.grid}>
          {hotTop10.map(s => (
            <View key={s.number} style={styles.statItem}>
              <View style={[styles.miniBall, { backgroundColor: '#ef4444' }]}>
                <Text style={styles.miniBallText}>{s.number}</Text>
              </View>
              <Text style={styles.statRate}>{s.hot_score.toFixed(0)}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>❄️ 冷号 TOP 10</Text>
        <View style={styles.grid}>
          {coldTop10.map(s => (
            <View key={s.number} style={styles.statItem}>
              <View style={[styles.miniBall, { backgroundColor: '#3b82f6' }]}>
                <Text style={styles.miniBallText}>{s.number}</Text>
              </View>
              <Text style={styles.statRate}>{s.current_miss}期</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>📊 和值走势（近15期）</Text>
        <View style={styles.sumChart}>
          {recentSums.slice().reverse().map((item, i) => {
            const min = Math.min(...recentSums.map(x => x.s));
            const max = Math.max(...recentSums.map(x => x.s));
            const range = max - min || 1;
            const h = ((item.s - min) / range) * 80;
            return (
              <View key={i} style={styles.sumBar}>
                <Text style={styles.sumVal}>{item.s}</Text>
                <View style={[styles.sumFill, { height: Math.max(4, h) }]} />
                <Text style={styles.sumLabel}>{item.k.slice(-2)}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <Text style={styles.footer}>数据分析仅供参考</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 12 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#f8fafc', marginBottom: 16 },
  card: { backgroundColor: '#1e293b', marginBottom: 12, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#334155' },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#f8fafc', marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statItem: { alignItems: 'center', width: 55 },
  miniBall: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  miniBallText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  statRate: { fontSize: 10, color: '#94a3b8', marginTop: 4 },
  sumChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 100 },
  sumBar: { flex: 1, alignItems: 'center' },
  sumVal: { fontSize: 7, color: '#64748b' },
  sumFill: { width: '80%', backgroundColor: '#f59e0b', borderRadius: 3 },
  sumLabel: { fontSize: 8, color: '#64748b', marginTop: 2 },
  footer: { textAlign: 'center', color: '#475569', fontSize: 10, padding: 20 },
});
