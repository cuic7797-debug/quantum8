import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { supabase } from '../utils/supabase';

interface Draw { numbers: number[]; }

const PRIZE: Record<number, Record<number, number>> = {
  5: { 5: 1000, 4: 30, 3: 3 },
  6: { 6: 3000, 5: 200, 4: 10, 3: 1 },
  7: { 7: 10000, 6: 800, 5: 50, 4: 5, 3: 1 },
  8: { 8: 50000, 7: 3000, 6: 200, 5: 20, 4: 3 },
  9: { 9: 200000, 8: 3000, 7: 200, 6: 20, 5: 5, 4: 1 },
  10: { 10: 500000, 9: 10000, 8: 500, 7: 30, 6: 5, 5: 1 },
};

export default function BacktestScreen() {
  const [draws, setDraws] = useState<Draw[]>([]);
  const [pc, setPc] = useState(10);
  const [result, setResult] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    supabase.from('draws').select('numbers').order('draw_date', { ascending: false }).limit(500).then(({ data }) => {
      if (data) setDraws(data as Draw[]);
    });
  }, []);

  function run() {
    if (draws.length < 10) return;
    setRunning(true);
    setTimeout(() => {
      const prize = PRIZE[pc] || {};
      const cost = pc * 2;
      let totalCost = 0, totalPrize = 0, wins = 0;
      const testDraws = draws.slice(1);

      for (let i = 0; i < testDraws.length; i++) {
        const pool = Array.from({ length: 80 }, (_, j) => j + 1);
        const picked: number[] = [];
        for (let j = 0; j < pc; j++) {
          const idx = Math.floor(Math.random() * pool.length);
          picked.push(pool[idx]);
          pool.splice(idx, 1);
        }
        const hits = picked.filter(n => testDraws[i].numbers.includes(n)).length;
        totalCost += cost;
        totalPrize += prize[hits] || 0;
        if (hits >= 3) wins++;
      }

      const roi = totalCost > 0 ? ((totalPrize - totalCost) / totalCost * 100) : 0;
      setResult(
        '选' + pc + ' · ' + testDraws.length + '期回测\n' +
        '投入: ' + totalCost + '元\n' +
        '中奖: ' + totalPrize + '元\n' +
        'ROI: ' + roi.toFixed(1) + '%\n' +
        '中奖次数: ' + wins
      );
      setRunning(false);
    }, 100);
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>回测中心</Text>

      <Text style={styles.label}>选择玩法</Text>
      <View style={styles.row}>
        {[5, 6, 7, 8, 9, 10].map(n => (
          <TouchableOpacity key={n} onPress={() => setPc(n)}
            style={[styles.ptBtn, pc === n && styles.ptBtnActive]}>
            <Text style={[styles.ptBtnText, pc === n && styles.ptBtnTextActive]}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.runBtn} onPress={run} disabled={running}>
        <Text style={styles.runBtnText}>{running ? '回测中...' : '开始回测'}</Text>
      </TouchableOpacity>

      {result && (
        <View style={styles.resultCard}>
          <Text style={styles.resultText}>{result}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#f8fafc', marginBottom: 16 },
  label: { fontSize: 13, color: '#94a3b8', marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8 },
  ptBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', justifyContent: 'center', alignItems: 'center' },
  ptBtnActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  ptBtnText: { color: '#94a3b8', fontSize: 14, fontWeight: 'bold' },
  ptBtnTextActive: { color: '#fff' },
  runBtn: { backgroundColor: '#3b82f6', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  runBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  resultCard: { backgroundColor: '#1e293b', marginTop: 16, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#334155' },
  resultText: { color: '#f8fafc', fontSize: 14, lineHeight: 24, fontFamily: 'monospace' },
});
