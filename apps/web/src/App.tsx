import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ScrollToTop from './components/common/ScrollToTop';

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
const AuthPage = lazy(() => import('./pages/AuthPage'));

function Loading() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-[var(--color-muted)]">加载中...</span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Layout>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/analysis" element={<AnalysisPage />} />
          <Route path="/selection" element={<SelectionPage />} />
          <Route path="/strategy" element={<StrategyPage />} />
          <Route path="/backtest" element={<BacktestPage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/data" element={<DataPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/kill" element={<KillPage />} />
          <Route path="/matrix" element={<MatrixPage />} />
          <Route path="/shrink" element={<ShrinkPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/number-profile" element={<NumberProfilePage />} />
          <Route path="/number-graph" element={<NumberGraphPage />} />
          <Route path="/time-series" element={<TimeSeriesPage />} />
          <Route path="/auth" element={<AuthPage />} />
        </Routes>
      </Suspense>
      <ScrollToTop />
    </Layout>
  );
}
