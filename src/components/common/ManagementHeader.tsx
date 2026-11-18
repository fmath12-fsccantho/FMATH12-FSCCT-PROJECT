import React from 'react';
import { ShieldCheck, Award, Globe, UserCheck, Sparkles } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { getUserRoleBadgeInfo } from '../../utils/permissionUtils';

interface ManagementHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  badgeExtra?: React.ReactNode;
}

export const ManagementHeader: React.FC<ManagementHeaderProps> = ({
  title,
  subtitle,
  icon,
  actions,
  badgeExtra
}) => {
  const { currentUser } = useAppStore();
  const badgeInfo = getUserRoleBadgeInfo(currentUser);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-xs mb-6 transition-colors">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Tiêu đề & Vai trò người dùng */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            {icon && (
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200/80 dark:border-blue-800 shadow-2xs">
                {icon}
              </div>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black font-heading tracking-tight text-slate-900 dark:text-white m-0">
                  {title}
                </h1>

                {/* Badge Phân quyền người dùng */}
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider font-heading border shadow-2xs ${
                  badgeInfo.type === 'admin'
                    ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                    : badgeInfo.type === 'fpt_teacher'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                    : 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                }`}>
                  {badgeInfo.type === 'admin' ? (
                    <ShieldCheck size={13} className="text-rose-600 dark:text-rose-400" />
                  ) : badgeInfo.type === 'fpt_teacher' ? (
                    <Award size={13} className="text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Globe size={13} className="text-sky-600 dark:text-sky-400" />
                  )}
                  <span>{badgeInfo.label}</span>
                </span>

                {badgeExtra}
              </div>

              {subtitle && (
                <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium m-0 mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Các nút thao tác nhanh (Actions) */}
        {actions && (
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
            {actions}
          </div>
        )}

      </div>
    </div>
  );
};

export default ManagementHeader;
