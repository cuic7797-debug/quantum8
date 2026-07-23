import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../utils/supabase';

interface Stat { number: number; hot_score: number; current_miss: number; }

const STRATS = [
  { name: '保守型', icon: '🛡️', hot: 4, cold: 4, balance: 2 },
  { name: '均衡型', icon: '⚖️', hot: 6, cold: 3, balance: 1 },
  { name: '激进型', icon: '🔥', hot: 8, cold: 1, balance: 1 },
];

export default function SelectionScreen() {
  const [stats, setStats] = useState<Stat[]>([]);
  const [playType, setPlayType] = useState(10);
  const [strategy, setStrategy] = useState(1);
  const [result, setResult] = useState<number[]>([]);

  useEffect(() => {
    supabase.from('number_stats').select('number, hot_score, current_miss').order('number').then(({ data }) => {
      if (data) setStats(data as Stat[]);
    });
  }, []);

  function generate() {
    if (!stats.length) { Alert.alert('提示', '数据加载中...'); return; }
    const sorted = [...stats].sort((a, b) => b.hot_score - a.hot_score);
    const s = STRATS[strategy];
    const hotPool = sorted.slice(0, Math.min(s.hot, playType)).map(x => x.number);
    const coldPool = sorted.slice(-Math.min(s.cold, playType)).map(x => x.number);
    const remaining = stats.filter(x => !hotPool.includes(x.number) && !coldPool.includes(x.number));
    const balCount = Math.max(0, playType - hotPool.length - coldCount(s, playType));
    const balPool = remaining.sort(() => Math.random() - 0.5).slice(0, balCount).map(x => x.number);
    const all = [...hotPool, ...coldPool, ...balPool].sort((a, b) => a - b);
    setResult(all.slice(0, playType));
  }

  function coldCount(s: { cold: number }, pc: number) { return Math.min(s.cold, pc); }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>智能选号</Text>

      <Text style={styles.label}>选择玩法</Text>
      <View style={styles.row}>
        {[5, 6, 7, 8, 9, 10].map(n => (
          <TouchableOpacity key={n} onPress={() => setPlayType(n)}
            style={[styles.ptBtn, playType === n && styles.ptBtnActive]}>
            <Text style={[styles.ptBtnText, playType === n && styles.ptBtnTextActive]}>选{n}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>选择策略</Text>
      <View style={styles.row}>
        {STRATS.map((s, i) => (
          <TouchableOpacity key={s.name} onPress={() => setStrategy(i)}
            style={[styles.stratBtn, strategy === i && styles.stratBtnActive]}>
            <Text style={styles.stratIcon}>{s.icon}</Text>
            <Text style={[styles.stratName, strategy === i && styles.stratNameActive]}>{s.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.genBtn} onPress={generate}>
        <Text style={styles.genBtnText}>🎯 生成推荐号码</Text>
      </TouchableOpacity>

      {result.length > 0 && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>AI 推荐 · 选{playType} · {STRATS[strategy].name}</Text>
          <View style={styles.resultNums}>
            {result.map(n => (
              <View key={n} style={styles.ball}>
                <Text style={styles.ballText}>{n}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.disclaimer}>仅供参考，不构成投注建议</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#f8fafc', marginBottom: 16 },
  label: { fontSize: 13, color: '#94a3b8', marginBottom: 8, marginTop: 8 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  ptBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
  ptBtnActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  ptBtnText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  ptBtnTextActive: { color: '#fff' },
  stratBtn: { flex: 1, alignItems: 'center', padding: 12, borderRadius: 12, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', minWidth: 80 },
  stratBtnActive: { borderColor: '#3b82f6', backgroundColor: '#1e293b' },
  stratIcon: { fontSize: 20 },
  stratName: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  stratNameActive: { color: '#3b82f6', fontWeight: 'bold' },
  genBtn: { backgroundColor: '#3b82f6', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  genBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  resultCard: { backgroundColor: '#1e293b', marginTop: 16, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#334155' },
  resultTitle: { fontSize: 13, color: '#64748b', marginBottom: 12 },
  resultNums: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  ball: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center' },
  ballText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  disclaimer: { fontSize: 10, color: '#475569', textAlign: 'center', marginTop: 12 },
});
