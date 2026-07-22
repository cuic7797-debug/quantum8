import React from 'react';

interface Props { children: React.ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] p-4">
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-8 max-w-md text-center space-y-4">
            <div className="text-4xl">⚠️</div>
            <h2 className="text-xl font-bold">页面出错了</h2>
            <p className="text-sm text-[var(--color-muted)]">
              {this.state.error?.message || '发生了未知错误'}
            </p>
            <button onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/'; }}
              className="px-6 py-2.5 rounded-xl bg-[var(--color-primary)] text-white font-semibold hover:bg-[var(--color-primary)]/80 transition-all">
              返回首页
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
