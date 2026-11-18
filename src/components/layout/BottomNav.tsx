import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, PenTool, Users, User,
  Video, Library, Shield
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  roles: string[];
}

const studentNav: NavItem[] = [
  { icon: <LayoutDashboard size={20} />, label: 'Tổng quan', path: '/dashboard', roles: ['student'] },
  { icon: <BookOpen size={20} />, label: 'Lý thuyết', path: '/theory', roles: ['student'] },
  { icon: <PenTool size={20} />, label: 'Luyện tập', path: '/quiz', roles: ['student'] },
  { icon: <Users size={20} />, label: 'Lớp học', path: '/classroom', roles: ['student'] },
  { icon: <User size={20} />, label: 'Hồ sơ', path: '/profile', roles: ['student'] },
];

const teacherNav: NavItem[] = [
  { icon: <LayoutDashboard size={20} />, label: 'Tổng quan', path: '/dashboard', roles: ['teacher', 'admin'] },
  { icon: <Users size={20} />, label: 'Lớp học', path: '/class-manager', roles: ['teacher', 'admin'] },
  { icon: <Library size={20} />, label: 'Kho đề', path: '/exam-bank', roles: ['teacher', 'admin'] },
  { icon: <Video size={20} />, label: 'Học liệu', path: '/resources', roles: ['teacher', 'admin'] },
  { icon: <User size={20} />, label: 'Hồ sơ', path: '/profile', roles: ['teacher', 'admin'] },
];

const adminNav: NavItem[] = [
  { icon: <LayoutDashboard size={20} />, label: 'Tổng quan', path: '/dashboard', roles: ['admin'] },
  { icon: <Users size={20} />, label: 'Lớp học', path: '/class-manager', roles: ['admin'] },
  { icon: <Library size={20} />, label: 'Kho đề', path: '/exam-bank', roles: ['admin'] },
  { icon: <Shield size={20} />, label: 'Tài khoản', path: '/user-management', roles: ['admin'] },
  { icon: <User size={20} />, label: 'Hồ sơ', path: '/profile', roles: ['admin'] },
];

const BottomNav = () => {
  const location = useLocation();
  const { currentUser } = useAppStore();
  const role = currentUser?.role || 'student';

  const navItems = role === 'admin' ? adminNav : role === 'teacher' ? teacherNav : studentNav;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 safe-area-pb shadow-[0_-4px_25px_rgba(0,0,0,0.06)]">
      <div className="flex items-stretch h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-all relative ${
                isActive ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              {/* Active top pill indicator */}
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-b-full shadow-sm" />
              )}
              {/* Icon */}
              <div className={`p-1.5 rounded-xl transition-all ${
                isActive ? 'bg-indigo-50 dark:bg-indigo-950/70' : ''
              }`}>
                {item.icon}
              </div>
              <span className="text-[10px] leading-none tracking-tight">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
      <div className="h-safe-area-inset-bottom" />
    </nav>
  );
};

export default BottomNav;
