import { View, Text, StyleSheet } from 'react-native';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>👤</Text>
      </View>
      <Text style={styles.title}>个人中心</Text>
      <Text style={styles.subtitle}>登录后可云端同步策略和选号</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>功能说明</Text>
        <Text style={styles.item}>📊 数据中心 — 200+期开奖数据自动同步</Text>
        <Text style={styles.item}>🎯 智能选号 — 多策略AI推荐</Text>
        <Text style={styles.item}>🧪 策略实验室 — 创建/回测/对比策略</Text>
        <Text style={styles.item}>📈 趋势分析 — 热冷号/遗漏/共现矩阵</Text>
        <Text style={styles.item}>🚨 智能预警 — 异常检测与提醒</Text>
      </View>

      <Text style={styles.footer}>v1.0 · 数据分析工具</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 20, alignItems: 'center' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  avatarText: { fontSize: 36 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#f8fafc', marginTop: 12 },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 4 },
  card: { backgroundColor: '#1e293b', width: '100%', marginTop: 24, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#334155' },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#f8fafc', marginBottom: 12 },
  item: { fontSize: 13, color: '#94a3b8', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#334155' },
  footer: { fontSize: 10, color: '#475569', marginTop: 40 },
});
