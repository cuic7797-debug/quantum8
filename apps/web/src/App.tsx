import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import AnalysisPage from './pages/AnalysisPage';
import SelectionPage from './pages/SelectionPage';
import BacktestPage from './pages/BacktestPage';
import HistoryPage from './pages/HistoryPage';
import StrategyPage from './pages/StrategyPage';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/analysis" element={<AnalysisPage />} />
        <Route path="/selection" element={<SelectionPage />} />
        <Route path="/strategy" element={<StrategyPage />} />
        <Route path="/backtest" element={<BacktestPage />} />
        <Route path="/history" element={<HistoryPage />} />
      </Routes>
    </Layout>
  );
}
