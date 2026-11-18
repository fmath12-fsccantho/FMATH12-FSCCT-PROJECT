import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AdminDetailedAnalytics } from '../../components/admin/AdminDetailedAnalytics';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class AdminErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Admin Analytics Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 rounded-3xl border border-red-200 dark:border-red-900/50 text-center shadow-sm my-6">
          <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/60 text-red-500 flex items-center justify-center mb-4">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Đã xảy ra sự cố khi tải số liệu</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6">
            Hệ thống gặp sự cố kết nối hoặc dữ liệu chưa sẵn sàng. Bạn có thể tải lại trang hoặc thử lại ngay.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="btn-primary py-2.5 px-6 flex items-center gap-2 rounded-xl text-sm font-bold cursor-pointer"
          >
            <RefreshCcw size={16} /> Tải lại dữ liệu
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const AdminAnalyticsPage: React.FC = () => {
  return (
    <div className="page-container p-4 sm:p-6 bg-slate-50 dark:bg-slate-950 overflow-y-auto custom-scrollbar min-h-screen">
      <div className="max-w-7xl mx-auto">
        <AdminErrorBoundary>
          <AdminDetailedAnalytics />
        </AdminErrorBoundary>
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;
