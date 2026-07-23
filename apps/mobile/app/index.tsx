import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { supabase } from '../utils/supabase';

interface Draw {
  draw_number: string;
  draw_date: string;
  numbers: number[];
  sum_value: number;
  odd_count: number;
  even_count: number;
  big_count: number;
  small_count: number;
}

export default function IndexScreen() {
  const [draws, setDraws] = useState<Draw[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    const { data } = await supabase.from('draws').select('*').order('draw_date', { ascending: false }).limit(20);
    if (data) setDraws(data as Draw[]);
  }

  useEffect(() => { load(); }, []);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const latest = draws[0];

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}>
      <View style={styles.header}>
        <Text style={styles.logo}>Quantum8</Text>
        <Text style={styles.sub}>快乐八数据分析平台</Text>
      </View>

      {latest && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>最新一期 {latest.draw_number}</Text>
          <Text style={styles.date}>{latest.draw_date}</Text>
          <View style={styles.numbers}>
            {latest.numbers.map((n: number) => (
              <View key={n} style={styles.ball}>
                <Text style={styles.ballText}>{n}</Text>
              </View>
            ))}
          </View>
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>和值</Text>
              <Text style={styles.statValue}>{latest.sum_value}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>奇偶</Text>
              <Text style={styles.statValue}>{latest.odd_count}:{latest.even_count}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>大小</Text>
              <Text style={styles.statValue}>{latest.big_count}:{latest.small_count}</Text>
            </View>
          </View>
        </View>
      )}

      {draws.length > 1 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>近期开奖</Text>
          {draws.slice(1, 10).map(d => (
            <View key={d.draw_number} style={styles.drawRow}>
              <Text style={styles.drawNum}>{d.draw_number.slice(-3)}</Text>
              <Text style={styles.drawDate}>{d.draw_date.slice(5)}</Text>
              <Text style={styles.drawSum}>和{d.sum_value}</Text>
              <Text style={styles.drawOE}>{d.odd_count}:{d.even_count}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.footer}>数据分析工具，不构成投注建议</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { padding: 20, alignItems: 'center' },
  logo: { fontSize: 28, fontWeight: 'bold', color: '#3b82f6' },
  sub: { fontSize: 12, color: '#64748b', marginTop: 4 },
  card: { backgroundColor: '#1e293b', margin: 12, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#334155' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#f8fafc', marginBottom: 4 },
  date: { fontSize: 12, color: '#64748b', marginBottom: 12 },
  numbers: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  ball: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center' },
  ballText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  stats: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
  statItem: { alignItems: 'center' },
  statLabel: { fontSize: 10, color: '#64748b' },
  statValue: { fontSize: 14, fontWeight: 'bold', color: '#f8fafc', marginTop: 2 },
  drawRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#334155', alignItems: 'center' },
  drawNum: { width: 40, fontSize: 13, fontWeight: 'bold', color: '#3b82f6' },
  drawDate: { flex: 1, fontSize: 12, color: '#64748b' },
  drawSum: { width: 50, fontSize: 11, color: '#f8fafc', textAlign: 'right' },
  drawOE: { width: 40, fontSize: 11, color: '#94a3b8', textAlign: 'right' },
  footer: { textAlign: 'center', color: '#475569', fontSize: 10, padding: 20 },
});
