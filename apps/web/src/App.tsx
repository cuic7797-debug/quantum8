import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ScrollToTop from './components/common/ScrollToTop';
import PageTransition from './components/common/PageTransition';
import KeyboardHelp from './components/common/KeyboardHelp';
import RequireAuth from './components/common/RequireAuth';
import PointsGate from './components/common/PointsGate';

const HomePage = lazy(() => import('./pages/HomePage'));
const AnalysisPage = lazy(() => import('./pages/AnalysisPage'));
const SelectionPage = lazy(() => import('./pages/SelectionPage'));
const BacktestPage = lazy(() => import('./pages/BacktestPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const StrategyPage = lazy(() => import('./pages/StrategyPage'));
const ReportPage = lazy(() => import('./pages/ReportPage'));
const DataPage = lazy(() => import('./pages/DataPage'));
const KillPage = lazy(() => import('./pages/KillPage'));
const MatrixPage = lazy(() => import('./pages/MatrixPage'));
const ShrinkPage = lazy(() => import('./pages/ShrinkPage'));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'));
const NumberProfilePage = lazy(() => import('./pages/NumberProfilePage'));
const NumberGraphPage = lazy(() => import('./pages/NumberGraphPage'));
const TimeSeriesPage = lazy(() => import('./pages/TimeSeriesPage'));
const ComparePage = lazy(() => import('./pages/ComparePage'));
const AdvancedStatsPage = lazy(() => import('./pages/AdvancedStatsPage'));
const StrategyMarketPage = lazy(() => import('./pages/StrategyMarketPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const AIPlaybookPage = lazy(() => import('./pages/AIPlaybookPage'));
const PredictionScorePage = lazy(() => import('./pages/PredictionScorePage'));
const StrategyLeaderboardPage = lazy(() => import('./pages/StrategyLeaderboardPage'));
const CheckinPage = lazy(() => import("./pages/CheckinPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const PointsStorePage = lazy(() => import("./pages/PointsStorePage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));

function Loading() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
        <span className="text-base text-[var(--color-muted)]">加载中...</span>
      </div>
    </div>
  );
}

function Auth({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}

function Paid({ cost, action, children }: { cost: number; action: string; children: React.ReactNode }) {
  return (
    <RequireAuth>
      <PointsGate cost={cost} action={action}>
        {children}
      </PointsGate>
    </RequireAuth>
  );
}

export default function App() {
  return (
    <Layout>
      <Suspense fallback={<Loading />}>
        <PageTransition>
          <Routes>
            {/* Free - no login */}
            <Route path="/" element={<HomePage />} />
            <Route path="/auth" element={<AuthPage />} />

            {/* Free - login required */}
            <Route path="/analysis" element={<Auth><AnalysisPage /></Auth>} />
            <Route path="/data" element={<Auth><DataPage /></Auth>} />
            <Route path="/history" element={<Auth><HistoryPage /></Auth>} />
            <Route path="/number-profile" element={<Auth><NumberProfilePage /></Auth>} />
            <Route path="/number-graph" element={<Auth><NumberGraphPage /></Auth>} />
            <Route path="/compare" element={<Auth><ComparePage /></Auth>} />
            <Route path="/time-series" element={<Auth><TimeSeriesPage /></Auth>} />
            <Route path="/favorites" element={<Auth><FavoritesPage /></Auth>} />
            <Route path="/strategy" element={<Auth><StrategyPage /></Auth>} />
            <Route path="/strategy-market" element={<Auth><StrategyMarketPage /></Auth>} />
            <Route path="/leaderboard" element={<Auth><StrategyLeaderboardPage /></Auth>} />
            <Route path="/dashboard" element={<Auth><DashboardPage /></Auth>} />
            <Route path="/checkin" element={<Auth><CheckinPage /></Auth>} />
            <Route path="/profile" element={<Auth><ProfilePage /></Auth>} />
            <Route path="/points-store" element={<Auth><PointsStorePage /></Auth>} />
            <Route path="/admin" element={<Auth><AdminPage /></Auth>} />

            {/* Paid - login + points required */}
            <Route path="/selection" element={<Paid cost={5} action="智能选号"><SelectionPage /></Paid>} />
            <Route path="/ai-playbook" element={<Paid cost={10} action="AI策略生成"><AIPlaybookPage /></Paid>} />
            <Route path="/report" element={<Paid cost={20} action="AI分析报告"><ReportPage /></Paid>} />
            <Route path="/backtest" element={<Paid cost={10} action="策略回测"><BacktestPage /></Paid>} />
            <Route path="/prediction-score" element={<Paid cost={8} action="号码预测评分"><PredictionScorePage /></Paid>} />
            <Route path="/kill" element={<Paid cost={3} action="杀号工具"><KillPage /></Paid>} />
            <Route path="/matrix" element={<Paid cost={5} action="旋转矩阵"><MatrixPage /></Paid>} />
            <Route path="/shrink" element={<Paid cost={5} action="智能缩水"><ShrinkPage /></Paid>} />
            <Route path="/advanced-stats" element={<Paid cost={3} action="高级统计"><AdvancedStatsPage /></Paid>} />
          </Routes>
        </PageTransition>
      </Suspense>
      <ScrollToTop />
      <KeyboardHelp />
    </Layout>
  );
}
