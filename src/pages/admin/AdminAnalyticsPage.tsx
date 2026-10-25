import React from 'react';
import { AdminDetailedAnalytics } from '../../components/admin/AdminDetailedAnalytics';

const AdminAnalyticsPage: React.FC = () => {
  return (
    <div className="page-container p-6 bg-slate-50 dark:bg-slate-950 overflow-y-auto custom-scrollbar">
      <div className="max-w-7xl mx-auto">
        <AdminDetailedAnalytics />
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;
