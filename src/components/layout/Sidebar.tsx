import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, BookOpen, PenTool, Trophy, 
  User, Users, LogOut, ShieldCheck, Database, Library, Shield, Video, FolderOpen, X, Sparkles, Flame, Cpu, Activity,
  BarChart3, ExternalLink, Award, FileText
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { fmathEngineService } from '../../services/fmathEngineService';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAppStore();
  const role = currentUser.role || 'student';
  const isMobileDrawer = onClose !== undefined;
  const [isPythonActive, setIsPythonActive] = useState(false);

  useEffect(() => {
    fmathEngineService.checkHealth().then(setIsPythonActive);
    const interval = setInterval(() => {
      fmathEngineService.checkHealth().then(setIsPythonActive);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const menuGroups = [
    {
      title: 'TỔNG QUAN',
      roles: ['student', 'teacher', 'admin'],
      items: [
        { icon: <LayoutDashboard size={19} />, label: 'Tổng quan học tập', path: '/dashboard', roles: ['student', 'teacher', 'admin'] }
      ]
    },
    {
      title: 'KHÔNG GIAN HỌC TẬP',
      roles: ['student'],
      items: [
        { icon: <BookOpen size={19} />, label: 'Bài học Lý thuyết', path: '/theory', roles: ['student'] },
        { icon: <PenTool size={19} />, label: 'Luyện tập Thích ứng', path: '/quiz', roles: ['student'] },
        { icon: <Video size={19} />, label: 'Tài nguyên Học liệu', path: '/resources', roles: ['student'] },
        { icon: <Users size={19} />, label: 'Không gian Lớp học', path: '/classroom', roles: ['student'] },
        { icon: <Trophy size={19} />, label: 'Bảng xếp hạng', path: '/leaderboard', roles: ['student'] },
      ]
    },
    {
      title: 'QUẢN TRỊ GIẢNG DẠY',
      roles: ['teacher', 'admin'],
      items: [
        { icon: <ShieldCheck size={19} />, label: 'Quản lý Lớp học', path: '/class-manager', roles: ['teacher', 'admin'] },
        { icon: <Flame size={19} />, label: 'Bản đồ Nhiệt Lớp', path: '/class-manager?tab=heatmap', roles: ['teacher', 'admin'] },
        { icon: <Sparkles size={19} />, label: 'Biên soạn bằng AI', path: '/content-creator', roles: ['teacher', 'admin'] },
        { icon: <CheckCircle2 size={19} />, label: 'Giao bài & Tiến độ', path: '/grading', roles: ['teacher', 'admin'] },
        { icon: <Library size={19} />, label: 'Ngân hàng Bài tập', path: '/exam-bank', roles: ['teacher', 'admin'] },
        { icon: <Database size={19} />, label: 'Ngân hàng Câu hỏi', path: '/question-bank', roles: ['teacher', 'admin'] },
        { icon: <FolderOpen size={19} />, label: 'Kho Học liệu Số', path: '/resources', roles: ['teacher', 'admin'] },
      ]
    },
    {
      title: 'HỆ THỐNG',
      roles: ['admin'],
      items: [
        { icon: <BarChart3 size={19} />, label: 'Quản lý Số liệu Chi tiết', path: '/admin-analytics', roles: ['admin'] },
        { icon: <Shield size={19} />, label: 'Quản lý Người dùng', path: '/user-management', roles: ['admin'] },
      ]
    },
    {
      title: 'KHOA HỌC KỸ THUẬT',
      roles: ['student', 'teacher', 'admin'],
      items: [
        { icon: <Award size={19} />, label: 'Báo cáo KHKT Dự án', path: 'https://drive.google.com/file/d/1XTo9OtOVqcLvXoa31zOGYAlkeACGy7-k/view?usp=sharing', roles: ['student', 'teacher', 'admin'], isExternal: true },
        { icon: <FileText size={19} />, label: 'Cổng Dữ liệu KHKT', path: 'http://localhost:5174', roles: ['student', 'teacher', 'admin'], isExternal: true }
      ]
    },
    {
      title: 'TÀI KHOẢN',
      roles: ['student', 'teacher', 'admin'],
      items: [
        { icon: <User size={19} />, label: 'Hồ sơ Cá nhân', path: '/profile', roles: ['student', 'teacher', 'admin'] },
      ]
    }
  ];

  const handleLogout = async () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất khỏi FMATH12?')) {
      try {
        await signOut(auth);
      } catch (err) {
        console.warn("Signout error:", err);
      }
      localStorage.removeItem('demo_mode');
      navigate('/login');
    }
  };

  const handleNavClick = () => {
    if (isMobileDrawer && onClose) onClose();
  };

  const sidebarContent = (
    <>
      {/* Brand Logo Header */}
      <div className="h-[76px] flex items-center px-6 border-b border-slate-200/80 dark:border-slate-800 shrink-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md">
        <Link to="/dashboard" onClick={handleNavClick} className="flex items-center gap-3.5 group flex-1">
          <div className="relative">
            <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 opacity-40 blur-sm group-hover:opacity-75 transition-opacity"></div>
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-sky-500 text-white flex items-center justify-center font-black text-xl shadow-md border border-white/20">
              <span className="font-heading tracking-tighter">∑</span>
            </div>
          </div>
          <div>
            <h1 className="text-[21px] font-extrabold font-heading text-slate-900 dark:text-white tracking-tight mb-0 leading-tight">
              FMATH<span className="bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 bg-clip-text text-transparent">12</span>
            </h1>
          </div>
        </Link>
        {isMobileDrawer && (
          <button 
            onClick={onClose} 
            className="md:hidden p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
            aria-label="Đóng menu"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar py-5 px-3.5 flex flex-col gap-1.5">
        {menuGroups.map((group, groupIdx) => {
          if (!group.roles.includes(role)) return null;
          const visibleItems = group.items.filter(item => item.roles.includes(role));
          if (visibleItems.length === 0) return null;

          return (
            <div key={groupIdx} className={groupIdx !== 0 ? 'mt-4' : ''}>
              <div className="px-3 mb-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-heading">
                {group.title}
              </div>
              <div className="flex flex-col gap-1">
                {visibleItems.map((item) => {
                  const isActive = location.pathname === item.path ||
                    (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
                  if ((item as any).isExternal) {
                    return (
                      <a 
                        key={item.label} 
                        href={item.path} 
                        target="_blank"
                        rel="noreferrer"
                        onClick={handleNavClick}
                        className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-150 group text-[13.5px] font-heading text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white font-medium border border-transparent"
                      >
                        <div className="transition-transform duration-150 group-hover:scale-105 shrink-0 text-slate-400 group-hover:text-blue-500">
                          {item.icon}
                        </div>
                        <span className="flex-1 truncate">{item.label}</span>
                        <ExternalLink size={13} className="text-slate-400 opacity-60 group-hover:opacity-100" />
                      </a>
                    );
                  }

                  return (
                    <Link 
                      key={item.label} 
                      to={item.path} 
                      onClick={handleNavClick}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-150 group text-[13.5px] font-heading ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold border border-blue-200/80 dark:border-blue-800/80 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white font-medium border border-transparent'
                      }`}
                    >
                      <div className={`transition-transform duration-150 group-hover:scale-105 shrink-0 ${
                        isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 group-hover:text-blue-500'
                      }`}>
                        {item.icon}
                      </div>
                      <span className="flex-1 truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Gamification mini status for Student */}
      {role === 'student' && (
        <div className="px-3.5 pb-2">
          <div className="p-3 bg-gradient-to-br from-blue-50/80 via-sky-50/50 to-indigo-50/30 dark:from-slate-800/80 dark:to-blue-950/40 rounded-xl border border-blue-100 dark:border-slate-700">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                <Sparkles size={14} /> FMATH Cấp {currentUser.level || 1}
              </span>
              <span className="flex items-center gap-1 text-amber-500">
                <Flame size={14} /> {currentUser.streak || 0} ngày
              </span>
            </div>
            <div className="h-1.5 bg-slate-200/70 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-600 to-sky-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(((currentUser.xp || 0) % 500) / 5, 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Logout Footer */}
      <div className="p-3.5 border-t border-slate-200/80 dark:border-slate-800 shrink-0">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] font-medium text-slate-500 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors group"
        >
          <div className="text-slate-400 group-hover:text-rose-600 transition-colors">
            <LogOut size={18} />
          </div>
          <span>Đăng xuất</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      <aside className="w-[260px] h-screen bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex-col shrink-0 relative z-40 hidden md:flex font-ui select-none shadow-sm">
        {sidebarContent}
      </aside>

      {isMobileDrawer && (
        <>
          <div
            className={`md:hidden fixed inset-0 z-[60] bg-slate-950/50 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={onClose}
          />
          <aside
            className={`md:hidden fixed top-0 left-0 h-full w-[280px] bg-white dark:bg-slate-900 z-[70] flex flex-col shadow-2xl transition-transform duration-300 ease-out font-ui ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
          >
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
};

export default Sidebar;