import React, { useState, useRef, useEffect } from 'react';
import { Bell, Sun, Moon, Info, BookOpen, AlertTriangle, Trophy, CheckCheck, Menu, Sparkles } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { supabase } from '../../config/supabase';

const Header = ({ title, onMenuClick }: { title: string; onMenuClick?: () => void }) => {
  const { isDark, toggleDark, currentUser } = useAppStore();
  
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  // Lấy dữ liệu thông báo
  const fetchNotifs = async () => {
    if (!currentUser?.id) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false });
      
    if (data) setNotifications(data);
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 60000);
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setIsNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const handleMarkAllAsRead = async () => {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', currentUser.id);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getNotifIcon = (type: string) => {
    switch(type) {
      case 'system': return <div className="bg-blue-50 text-blue-600 p-2 rounded-xl border border-blue-100"><Info size={16} /></div>;
      case 'class': return <div className="bg-sky-50 text-sky-600 p-2 rounded-xl border border-sky-100"><BookOpen size={16} /></div>;
      case 'warning': return <div className="bg-rose-50 text-rose-600 p-2 rounded-xl border border-rose-100"><AlertTriangle size={16} /></div>;
      case 'achievement': return <div className="bg-amber-50 text-amber-600 p-2 rounded-xl border border-amber-100"><Trophy size={16} /></div>;
      default: return <div className="bg-slate-50 text-slate-600 p-2 rounded-xl border border-slate-200"><Bell size={16} /></div>;
    }
  };

  return (
    <header className="h-[76px] bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between px-4 md:px-8 shrink-0 relative z-50">
      
      {/* Mobile hamburger & Title */}
      <div className="flex items-center gap-3.5">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
          aria-label="Mở menu"
        >
          <Menu size={22} />
        </button>

        <div className="flex items-center gap-2">
          <h2 className="text-base sm:text-lg md:text-xl font-bold font-heading text-slate-900 dark:text-white tracking-tight truncate max-w-[200px] sm:max-w-none">{title}</h2>
          <span className="hidden lg:inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800 px-2.5 py-0.5 rounded-full">
            <Sparkles size={12} /> FMATH12
          </span>
        </div>
      </div>

      {/* Actions & Profile */}
      <div className="flex items-center gap-3 md:gap-5 relative">
        <div className="flex items-center gap-2">
          
          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 border ${
                isNotifOpen 
                  ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/70 dark:border-blue-700' 
                  : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-600 shadow-sm'
              }`}
              aria-label="Thông báo"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-md animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {isNotifOpen && (
              <div className="absolute top-full right-0 mt-3 w-80 md:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/90 dark:border-slate-800 overflow-hidden animate-in fade-in slide-in-from-top-2 origin-top-right z-50">
                
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800 dark:text-white text-sm m-0">Thông báo</h3>
                    {unreadCount > 0 && (
                      <span className="badge-primary">{unreadCount} mới</span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllAsRead} className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1 transition-colors">
                      <CheckCheck size={14}/> Đã đọc tất cả
                    </button>
                  )}
                </div>

                <div className="max-h-[380px] overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                      <Bell size={32} className="mx-auto mb-3 opacity-25" />
                      <p className="text-sm font-medium">Bạn chưa có thông báo nào.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {notifications.map((notif) => (
                        <div key={notif.id} className={`p-4 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50 group ${!notif.is_read ? 'bg-blue-50/30 dark:bg-blue-950/20' : ''}`}>
                          <div onClick={() => handleMarkAsRead(notif.id)} className="flex items-start gap-3.5 cursor-pointer">
                            <div className="shrink-0 mt-0.5">{getNotifIcon(notif.type)}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <div className={`text-sm font-bold truncate ${!notif.is_read ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                                  {notif.title}
                                </div>
                                <div className="text-[10px] font-medium text-slate-400 whitespace-nowrap shrink-0">
                                  {formatTime(notif.created_at)}
                                </div>
                              </div>
                              <p className={`text-xs leading-relaxed line-clamp-2 ${!notif.is_read ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400'}`}>
                                {notif.message}
                              </p>
                            </div>
                            {!notif.is_read && <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 shrink-0"></div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-center">
                  <button onClick={() => setIsNotifOpen(false)} className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors">
                    Đóng
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Theme toggle */}
          <button 
            onClick={toggleDark} 
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-600 transition-colors shadow-sm"
            aria-label="Chuyển đổi giao diện Sáng/Tối"
          >
            {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
          </button>
        </div>

        {/* Separator */}
        <div className="h-7 w-px bg-slate-200 dark:bg-slate-800"></div>

        {/* User Profile */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <div className="font-bold text-[13.5px] text-slate-900 dark:text-white leading-tight">{currentUser.name}</div>
            <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
              {currentUser.role === 'admin' 
                ? 'Quản trị viên hệ thống' 
                : currentUser.role === 'teacher' 
                  ? 'Giảng viên Toán' 
                  : (currentUser.student_code || currentUser.studentId) ? `${currentUser.student_code || currentUser.studentId} • Học viên` : 'Học viên'}
            </div>
          </div>
          
          {/* Avatar with blue ring */}
          <div className="relative group cursor-pointer">
            <div className="w-10 h-10 p-[2px] rounded-full bg-gradient-to-tr from-blue-600 via-sky-500 to-cyan-400 shadow-sm">
              <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 overflow-hidden flex items-center justify-center font-bold text-slate-800 dark:text-white text-sm">
                {currentUser.avatar_url ? (
                  <img src={currentUser.avatar_url} className="w-full h-full object-cover" alt="Avatar"/>
                ) : (
                  currentUser.name.charAt(0).toUpperCase()
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;