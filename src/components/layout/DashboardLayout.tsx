import React, { useEffect, useState, useRef, Suspense } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNav from './BottomNav';
import { useAppStore } from '../../store/useAppStore';
import { auth } from '../../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { studentService } from '../../services/studentService';
import { Loader2, BellRing, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../config/supabase'; 
import ReactMarkdown from 'react-markdown';

const PageContentLoading = () => (
  <div className="flex flex-col items-center justify-center h-full min-h-[500px] w-full animate-in fade-in">
    <div className="w-8 h-8 border-4 border-[#dee2e6] border-t-primary rounded-full animate-spin mb-3"></div>
    <p className="text-[14px] font-medium text-[#6c757d]">Đang tải nội dung...</p>
  </div>
);

const DashboardLayout = () => {
  const { currentUser, setUser } = useAppStore();
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [popupNotifs, setPopupNotifs] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const location = useLocation();
  const mainScrollRef = useRef<HTMLElement>(null);

  // Tự động kéo lên trên đầu trang khi truy cập hoặc chuyển trang
  useEffect(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname]);

  const hideMenu = location.pathname.includes('/live-exam') || 
                   location.pathname.includes('/live-monitor') ||
                   location.search.includes('embed=true');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && firebaseUser.email) {
        setIsAuthenticated(true);
        try {
          let profile = await studentService.getProfileByEmail(firebaseUser.email);
          let currentUserId = ''; 
          const userEmail = firebaseUser.email.toLowerCase();
          
          let targetRole = 'student';
          if (userEmail === '5phutcungpy@gmail.com') targetRole = 'admin';
          else if (userEmail === 'aiquizfct@gmail.com' || userEmail.endsWith('@fpt.edu.vn')) targetRole = 'teacher'; 
          else if (userEmail.includes('fct')) targetRole = 'student'; 

          if (profile) {
            // Giữ nguyên role đã được phân quyền trong Database
            if (userEmail === '5phutcungpy@gmail.com' && profile.role !== 'admin') {
              await supabase.from('users').update({ role: 'admin' }).eq('id', profile.id);
              profile.role = 'admin';
            }
            setUser(profile);
            currentUserId = profile.id; 
          } else {
            // Sinh tài khoản học sinh mới
            const fallbackName = firebaseUser.displayName || firebaseUser.email.split('@')[0] || "Học sinh";
            const fallbackStudentCode = `TS_${Math.floor(Date.now() / 1000)}`; 

            const { data, error } = await supabase.from('users').insert({
              email: firebaseUser.email, 
              full_name: fallbackName, 
              role: targetRole, 
              avatar_url: firebaseUser.photoURL || null,
              student_code: fallbackStudentCode 
            }).select().single();

            if (error) console.error("Lỗi tạo người dùng mới:", error);

            if (data) { 
              setUser(data); 
              currentUserId = data.id; 
            } else { 
              currentUserId = firebaseUser.uid; 
            }
          }

          if (currentUserId) {
            await studentService.syncClassMembership(firebaseUser.email, currentUserId);

            const { data: unreadNotifs } = await supabase
              .from('notifications')
              .select('*')
              .eq('user_id', currentUserId)
              .eq('is_read', false)
              .order('created_at', { ascending: true }); 
            
            if (unreadNotifs && unreadNotifs.length > 0) {
              setPopupNotifs(unreadNotifs);
            }
          }
        } catch (error) { 
          console.error("Lỗi đồng bộ dữ liệu Layout:", error); 
        }
      } else {
        setIsAuthenticated(false);
      }
      setIsAuthChecking(false);
    });

    return () => unsubscribe();
  }, [setUser]);

  const handleAcknowledgePopup = async (notifId: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', notifId);
    setPopupNotifs(prev => prev.filter(n => n.id !== notifId));
  };

  if (isAuthChecking) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#f8f9fa] text-[#6c757d]">
        <Loader2 size={32} className="animate-spin mb-4 text-primary" />
        <p className="font-medium text-[14px]">Đang đồng bộ dữ liệu...</p>
      </div>
    );
  }

  // Nếu chưa đăng nhập thì chuyển hướng sang trang Login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const getPageTitle = (pathname: string) => {
    if (pathname === '/dashboard' || pathname === '/overview') return 'Bảng Điều Khiển';
    if (pathname.startsWith('/theory')) return 'Lý Thuyết Trực Quan';
    if (pathname.startsWith('/resources')) return 'Bài Giảng & Học Liệu';
    if (pathname.startsWith('/quiz')) return 'Luyện Tập Chuyên Đề';
    if (pathname.startsWith('/classroom')) return 'Lớp Học Của Tôi';
    if (pathname.startsWith('/leaderboard')) return 'Bảng Vàng Vinh Danh';
    if (pathname.startsWith('/class-manager')) return 'Quản Lý Lớp Học';
    if (pathname.startsWith('/exam-bank')) return 'Kho Đề & Tự Luyện';
    if (pathname.startsWith('/question-bank')) return 'Ngân Hàng Câu Hỏi';
    if (pathname.startsWith('/profile')) return 'Hồ Sơ Cá Nhân';
    if (pathname.startsWith('/user-management')) return 'Quản Trị Người Dùng';
    return 'Bảng Điều Khiển';
  };

  return (
    <div className="h-screen w-full flex bg-[#f8fafc] dark:bg-[#090d16] text-slate-700 dark:text-slate-200 overflow-hidden">
      {!hideMenu && (
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      )}
      <div className="flex-1 flex flex-col min-w-0 z-10 relative h-screen">
        {!hideMenu && (
          <Header
            title={getPageTitle(location.pathname)}
            onMenuClick={() => setSidebarOpen(true)}
          />
        )}
        <main ref={mainScrollRef} className="flex-1 relative overflow-y-auto custom-scrollbar pb-20 md:pb-0">
          <Suspense fallback={<PageContentLoading />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      {/* Bottom Navigation cho mobile */}
      {!hideMenu && <BottomNav />}

      {popupNotifs.length > 0 && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800 relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-4 mb-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center rounded-xl shrink-0 border border-indigo-200/60 dark:border-indigo-800">
                <BellRing size={20}/>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight font-heading">{popupNotifs[0].title}</h3>
                <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mt-1 uppercase tracking-wider">THÔNG BÁO TỪ HỆ THỐNG</div>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200/70 dark:border-slate-700 mb-5 max-h-[40vh] overflow-y-auto custom-scrollbar">
              <div className="prose prose-sm prose-slate max-w-none text-slate-700 dark:text-slate-300 leading-relaxed">
                <ReactMarkdown>{popupNotifs[0].message}</ReactMarkdown>
              </div>
            </div>
            <button onClick={() => handleAcknowledgePopup(popupNotifs[0].id)} className="btn-primary w-full py-2.5">
              <CheckCircle2 size={18} /> TÔI ĐÃ HIỂU
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;
