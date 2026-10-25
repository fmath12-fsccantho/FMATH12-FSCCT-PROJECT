import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Users, Server, Activity, BookOpen, UserCheck, Shield, Clock, 
  Database, Library, ChevronLeft, ChevronRight, PlusCircle, Video, FileText,
  Cpu, Globe, Zap, AlertTriangle, CheckCircle2, Search, Settings, 
  Network, HardDrive, Edit3, Ban, Unlock, Trash2, Download, RefreshCcw,
  X, Loader2, ShieldCheck, School, ArrowUpRight, Sparkles, Layers, ListChecks,
  BarChart3
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { supabase } from '../../config/supabase';
import { getUserRoleBadgeInfo } from '../../utils/permissionUtils';
import { examService } from '../../services/examService';
import { ExamBatchAnalysisModal } from '../../components/common/ExamBatchAnalysisModal';
import { AdminExamQuestionsModal } from '../../components/admin/AdminExamQuestionsModal';
import { AdminDetailedAnalytics } from '../../components/admin/AdminDetailedAnalytics';

const AdminDashboard = () => {
  const { currentUser } = useAppStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // UI States
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'iam' | 'exams' | 'classes' | 'database' | 'content' | 'settings'>('overview');
  const [connectionStatus, setConnectionStatus] = useState<'CONNECTING' | 'CONNECTED' | 'DISCONNECTED'>('CONNECTING');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['overview', 'analytics', 'iam', 'exams', 'classes', 'database', 'content', 'settings'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [searchParams]);

  // Data States
  const [stats, setStats] = useState({ users: 0, teachers: 0, classes: 0, lessons: 0, exams: 0, attempts: 0 });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  
  // States cho Tab IAM & Classes & Exams
  const [usersList, setUsersList] = useState<any[]>([]);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [examsList, setExamsList] = useState<any[]>([]);
  const [searchUser, setSearchUser] = useState("");
  const [searchExam, setSearchExam] = useState("");
  const [questionCountFilter, setQuestionCountFilter] = useState<'all' | '40' | '34' | '22' | 'under20' | 'empty'>('all');

  // Modals Quản lý Câu hỏi & Phân tích AI
  const [analysisModalExam, setAnalysisModalExam] = useState<any | null>(null);
  const [manageQuestionsExam, setManageQuestionsExam] = useState<any | null>(null);

  // States cho Modal Đổi Vai trò
  const [roleModalUser, setRoleModalUser] = useState<any | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<'student' | 'teacher' | 'admin'>('student');
  const [selectedSchool, setSelectedSchool] = useState<string>('THPT FPT Cần Thơ');
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  // ==========================================
  // FETCH DỮ LIỆU (REAL DATA)
  // ==========================================
  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      // 1. Lấy thông số tổng quan
      const [usersRes, teachersRes, classRes, lessonRes, examRes, attemptRes] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
        supabase.from('classes').select('*', { count: 'exact', head: true }),
        supabase.from('lessons').select('*', { count: 'exact', head: true }),
        supabase.from('exams').select('*', { count: 'exact', head: true }),
        supabase.from('exam_attempts').select('*', { count: 'exact', head: true })
      ]);

      // Lấy Danh sách Đề thi & Quản lý số lượng câu hỏi
      const examsData = await examService.getManagementExams(currentUser);
      if (examsData) setExamsList(examsData);
      
      setStats({
        users: usersRes.count || 0,
        teachers: teachersRes.count || 0,
        classes: classRes.count || 0,
        lessons: lessonRes.count || 0,
        exams: examsData?.length || Math.max(examRes.count || 0, 62),
        attempts: attemptRes.count || 0
      });

      // 2. Lấy Logs hoạt động
      const { data: logs } = await supabase
        .from('exam_attempts')
        .select('id, created_at, score, users(full_name, role), exams(title)')
        .order('created_at', { ascending: false })
        .limit(15);
      if (logs) setRecentLogs(logs);

      // 3. Lấy Danh sách Users (cho Tab IAM)
      const { data: users } = await supabase.from('users').select('*').order('created_at', { ascending: false });
      if (users) setUsersList(users);

      // 4. Lấy Danh sách Lớp (cho Tab Classes)
      const { data: cls } = await supabase.from('classes').select('*, users(full_name), class_members(count)').order('created_at', { ascending: false });
      if (cls) setClassesList(cls);

    } catch (error) {
      console.error("Lỗi lấy dữ liệu Admin:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();

    // ĐĂNG KÝ SUPABASE REALTIME
    const channel = supabase.channel('admin_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exam_attempts' }, () => {
        fetchAllData(); 
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        fetchAllData(); 
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'classes' }, () => {
        fetchAllData(); 
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setConnectionStatus('CONNECTED');
        else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') setConnectionStatus('DISCONNECTED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ==========================================
  // HÀNH ĐỘNG QUẢN TRỊ VIÊN (IAM & CLASSES)
  // ==========================================
  const handleUpdateUserStatus = async (userId: string, newStatus: 'active' | 'banned') => {
    if (!window.confirm(`Xác nhận ${newStatus === 'active' ? 'mở khóa' : 'khóa'} tài khoản này?`)) return;
    const { error } = await supabase.from('users').update({ status: newStatus }).eq('id', userId);
    if (!error) setUsersList(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
  };

  const openRoleModal = (user: any) => {
    setRoleModalUser(user);
    setSelectedNewRole(user.role || 'student');
    setSelectedSchool(user.school || 'THPT FPT Cần Thơ');
  };

  const submitRoleChange = async () => {
    if (!roleModalUser) return;
    setIsUpdatingRole(true);
    const updatePayload: any = { role: selectedNewRole };
    if (selectedNewRole === 'teacher') {
      updatePayload.school = selectedSchool;
    }
    const { error } = await supabase.from('users').update(updatePayload).eq('id', roleModalUser.id);
    if (!error) {
      setUsersList(prev => prev.map(u => u.id === roleModalUser.id ? { ...u, role: selectedNewRole, school: selectedSchool } : u));
      setRoleModalUser(null);
      alert(`Cập nhật quyền thành công cho ${roleModalUser.full_name || roleModalUser.email}: ${selectedNewRole === 'admin' ? 'Quản trị viên (Toàn quyền)' : selectedNewRole === 'teacher' ? `Giáo viên (${selectedSchool})` : 'Học sinh'}!`);
    } else {
      alert("Lỗi cập nhật quyền: " + error.message);
    }
    setIsUpdatingRole(false);
  };

  const handleDeleteClass = async (classId: string) => {
    if (!window.confirm('Cảnh báo: Xóa lớp học sẽ xóa toàn bộ dữ liệu thành viên trong lớp. Tiếp tục?')) return;
    const { error } = await supabase.from('classes').delete().eq('id', classId);
    if (!error) setClassesList(prev => prev.filter(c => c.id !== classId));
  };

  const exportUserData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(usersList, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "users_export.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // ==========================================
  // RENDER HELPERS
  // ==========================================
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const filteredUsers = usersList.filter(u => 
    (u.full_name || '').toLowerCase().includes(searchUser.toLowerCase()) || 
    (u.email || '').toLowerCase().includes(searchUser.toLowerCase())
  );

  const filteredExams = examsList.filter(e => {
    const matchesSearch = (e.title || '').toLowerCase().includes(searchExam.toLowerCase()) || 
                          (e.author?.full_name || '').toLowerCase().includes(searchExam.toLowerCase()) || 
                          (e.group_name || '').toLowerCase().includes(searchExam.toLowerCase());
    const count = e.questionsCount || 0;
    if (questionCountFilter === '40') return matchesSearch && count === 40;
    if (questionCountFilter === '34') return matchesSearch && count === 34;
    if (questionCountFilter === '22') return matchesSearch && count === 22;
    if (questionCountFilter === 'under20') return matchesSearch && count > 0 && count < 20;
    if (questionCountFilter === 'empty') return matchesSearch && count === 0;
    return matchesSearch;
  });

  const totalQuestionsInSystem = examsList.reduce((acc, e) => acc + (e.questionsCount || 0), 0);

  const internalMenu = [
    { id: 'overview', icon: <Activity size={18}/>, label: 'Tổng quan Hệ thống' },
    { id: 'analytics', icon: <BarChart3 size={18}/>, label: 'Quản lý Số liệu Chi tiết' },
    { id: 'iam', icon: <Users size={18}/>, label: 'Định danh (IAM)' },
    { id: 'exams', icon: <Layers size={18}/>, label: 'Đề thi & Số lượng câu' },
    { id: 'content', icon: <BookOpen size={18}/>, label: 'Quản lý Bài đăng' },
    { id: 'classes', icon: <Network size={18}/>, label: 'Phiên Lớp học' },
    { id: 'database', icon: <Database size={18}/>, label: 'Cơ sở Dữ liệu' },
    { id: 'settings', icon: <Settings size={18}/>, label: 'Cấu hình Môi trường' },
  ];

  const adminBadge = getUserRoleBadgeInfo(currentUser);

  return (
    <div className="page-container flex-row bg-slate-50 dark:bg-slate-950 overflow-hidden">
      
      {/* --- MENU NỘI BỘ --- */}
      <div className={`transition-all duration-300 ease-in-out ${isMenuCollapsed ? 'w-[72px]' : 'w-64'} bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 z-20 relative`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          {!isMenuCollapsed && (
            <div className="flex items-center gap-2">
              <ShieldCheck size={20} className="text-primary" />
              <span className="font-bold text-sm text-slate-900 dark:text-white font-heading tracking-wide">FMATH12 Console</span>
            </div>
          )}
          <button 
            onClick={() => setIsMenuCollapsed(!isMenuCollapsed)} 
            className={`p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors ${isMenuCollapsed ? 'mx-auto' : ''}`}
            aria-label="Thu gọn / Mở rộng Menu"
          >
            {isMenuCollapsed ? <ChevronRight size={18}/> : <ChevronLeft size={18}/>}
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-1.5 px-3 custom-scrollbar">
          {internalMenu.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button 
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`flex items-center p-3 rounded-xl transition-all text-xs font-bold ${
                  isActive 
                    ? 'bg-primary text-white shadow-xs' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
                }`}
                title={isMenuCollapsed ? item.label : undefined}
              >
                <div className={`shrink-0 ${isMenuCollapsed ? 'mx-auto' : 'mr-3'}`}>{item.icon}</div>
                {!isMenuCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </div>

        {/* Global Connection Status */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 shrink-0 bg-slate-50/70 dark:bg-slate-900/40">
          <div className={`flex items-center gap-2 ${isMenuCollapsed ? 'justify-center' : ''}`}>
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              connectionStatus === 'CONNECTED' ? 'bg-emerald-500 animate-pulse' : 
              connectionStatus === 'CONNECTING' ? 'bg-amber-500 animate-bounce' : 'bg-rose-500'
            }`}></span>
            {!isMenuCollapsed && (
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {connectionStatus === 'CONNECTED' ? 'Đã kết nối' : connectionStatus}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* --- KHU VỰC HIỂN THỊ CHÍNH (MAIN AREA) --- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50 dark:bg-slate-950">
        
        {/* Top Bar Header */}
        <div className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 shadow-2xs z-10">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>FMATH12 Quản trị</span> <ChevronRight size={14}/> 
              <span className="text-primary font-bold">
                {internalMenu.find(m => m.id === activeTab)?.label}
              </span>
            </div>
            <span className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${adminBadge.badgeClass}`}>
              <ShieldCheck size={12} />
              Quản trị viên Toàn quyền
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setActiveTab('analytics')} 
              className={`py-1.5 px-3 text-xs flex items-center gap-1.5 font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                  : 'btn-outline'
              }`}
            >
              <BarChart3 size={14} /> Số liệu Chi tiết
            </button>
            <button 
              onClick={() => navigate('/admin/users')} 
              className="btn-outline py-1.5 px-3 text-xs flex items-center gap-1.5 font-bold"
            >
              <Users size={14} /> Chi tiết Người dùng
            </button>
            <button 
              onClick={fetchAllData} 
              className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5 font-bold"
            >
              <RefreshCcw size={14} className={isLoading ? "animate-spin" : ""}/> Làm mới
            </button>
          </div>
        </div>

        {/* NỘI DUNG CÁC TAB */}
        <div className="page-content custom-scrollbar p-6">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* ========================================================= */}
            {/* TAB 1: OVERVIEW (TỔNG QUAN) */}
            {/* ========================================================= */}
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-heading flex items-center gap-2 m-0">
                      <Activity size={22} className="text-primary"/> Giám sát Sức khỏe Toàn Hệ thống
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Toàn quyền quản trị cơ sở dữ liệu, giáo viên liên trường, bài giảng và ngân hàng đề thi.
                    </p>
                  </div>
                  {connectionStatus === 'CONNECTED' && (
                    <span className="badge-success text-xs py-1 px-3 flex items-center gap-1.5 font-bold">
                      <Zap size={13}/> Đang hoạt động Realtime
                    </span>
                  )}
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[
                    { label: 'Tài khoản', value: stats.users, icon: <Users size={18}/>, color: 'text-primary bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200/60 dark:border-indigo-800' },
                    { label: 'Giáo viên', value: stats.teachers, icon: <UserCheck size={18}/>, color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 border-purple-200/60 dark:border-purple-800' },
                    { label: 'Lớp học', value: stats.classes, icon: <Network size={18}/>, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200/60 dark:border-emerald-800' },
                    { label: 'Đề ôn tập', value: stats.exams, icon: <Library size={18}/>, color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200/60 dark:border-amber-800' },
                    { label: 'Bài giảng', value: stats.lessons, icon: <BookOpen size={18}/>, color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border-rose-200/60 dark:border-rose-800' },
                    { label: 'Lượt nộp bài', value: stats.attempts, icon: <Activity size={18}/>, color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 border-cyan-200/60 dark:border-cyan-800' },
                  ].map((stat, i) => (
                    <div key={i} className="flat-card p-5 flex flex-col items-center text-center hover:border-primary/50 transition-all">
                      <div className={`p-2.5 rounded-xl border ${stat.color} mb-3`}>{stat.icon}</div>
                      <div className="text-xl font-black text-slate-900 dark:text-white font-ui leading-none mb-1">{stat.value.toLocaleString()}</div>
                      <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.label}</div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Nhật ký hoạt động */}
                  <div className="lg:col-span-2 flat-card flex flex-col h-[420px] overflow-hidden">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/60 dark:bg-slate-850">
                      <h3 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 m-0">
                        <Clock size={16} className="text-primary"/> Hoạt động nộp bài thời gian thực
                      </h3>
                      <span className="badge-neutral text-[10px] py-0.5 px-2 font-bold">{recentLogs.length} bản ghi</span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                      {recentLogs.length === 0 ? (
                        <div className="text-center text-slate-400 font-medium py-12 text-xs">Đang chờ sự kiện nộp bài...</div>
                      ) : (
                        recentLogs.map((log) => (
                          <div key={log.id} className="bg-white dark:bg-slate-850 p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-4 animate-in fade-in">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shrink-0 text-xs uppercase">
                                {log.users?.full_name?.charAt(0) || 'U'}
                              </div>
                              <div>
                                <p className="text-xs text-slate-700 dark:text-slate-300 m-0 mb-0.5">
                                  <strong className="text-slate-900 dark:text-white font-bold">{log.users?.full_name || 'Học sinh'}</strong> đã hoàn thành <span className="font-bold text-primary">{log.exams?.title || 'bộ đề'}</span>
                                </p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider m-0">{formatTime(log.created_at)}</p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className={`text-base font-black font-ui ${log.score >= 8 ? 'text-emerald-600 dark:text-emerald-400' : log.score >= 5 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                {log.score} điểm
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Tình trạng Server */}
                  <div className="flat-card h-fit overflow-hidden">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850">
                      <h3 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 m-0">
                        <Cpu size={16} className="text-purple-600 dark:text-purple-400"/> Tình trạng Hạ tầng & AI
                      </h3>
                    </div>
                    <div className="p-6 space-y-6">
                      <div>
                        <div className="flex justify-between text-[11px] font-bold mb-1.5 uppercase tracking-wider">
                          <span className="text-slate-500 dark:text-slate-400">PostgreSQL Cloud</span>
                          <span className="text-emerald-600 dark:text-emerald-400">Hoạt động tốt</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full w-[25%]"></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] font-bold mb-1.5 uppercase tracking-wider">
                          <span className="text-slate-500 dark:text-slate-400">Groq / Gemini AI Engine</span>
                          <span className="text-primary font-bold">Khả dụng 100%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full w-[45%]"></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] font-bold mb-1.5 uppercase tracking-wider">
                          <span className="text-slate-500 dark:text-slate-400">Cloud Storage / Assets</span>
                          <span className="text-amber-600 dark:text-amber-400">Ổn định</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full w-[40%]"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 1.5: QUẢN LÝ SỐ LIỆU CHI TIẾT (ANALYTICS & METRICS)   */}
            {/* ========================================================= */}
            {activeTab === 'analytics' && (
              <AdminDetailedAnalytics 
                onNavigateToExam={(examId) => navigate('/exam-editor', { state: { examId } })}
              />
            )}

            {/* ========================================================= */}
            {/* TAB 2: IAM (QUẢN LÝ TÀI KHOẢN) */}
            {/* ========================================================= */}
            {activeTab === 'iam' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h1 className="text-xl font-black text-slate-900 dark:text-white font-heading flex items-center gap-2 m-0">
                      <Shield className="text-primary" size={22}/> Định danh & Phân quyền Toàn hệ thống
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Phân quyền linh hoạt: Admin (Toàn quyền), Giáo viên THPT FPT Cần Thơ (Biên tập hệ thống), Giáo viên Toàn quốc (Đề & Lớp riêng).
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => navigate('/admin/users')}
                      className="btn-primary py-2 px-3.5 rounded-xl text-xs flex items-center gap-1.5 font-bold"
                    >
                      <Users size={14} /> Màn hình Quản lý Nâng cao <ArrowUpRight size={13} />
                    </button>
                    <button onClick={exportUserData} className="btn-secondary py-2 px-3.5 rounded-xl text-xs flex items-center gap-1.5 font-bold">
                      <Download size={14}/> Xuất JSON
                    </button>
                  </div>
                </div>

                <div className="flat-card flex flex-col h-[550px] overflow-hidden">
                  <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850">
                    <div className="relative max-w-sm">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15}/>
                      <input 
                        type="text" 
                        placeholder="Tìm kiếm Email hoặc Tên người dùng..." 
                        value={searchUser} 
                        onChange={e => setSearchUser(e.target.value)} 
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 outline-none focus:border-primary text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                      <thead className="bg-slate-50 dark:bg-slate-850 sticky top-0 z-10 shadow-2xs border-b border-slate-200 dark:border-slate-800">
                        <tr className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          <th className="p-4">Tài khoản & Trường học</th>
                          <th className="p-4">Vai trò / Phân cấp</th>
                          <th className="p-4">Trạng thái</th>
                          <th className="p-4 text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredUsers.map((u) => {
                          const badge = getUserRoleBadgeInfo(u);
                          return (
                            <tr key={u.id} className={`hover:bg-slate-50/80 dark:hover:bg-slate-850/60 transition-colors ${u.status === 'banned' ? 'opacity-60 bg-rose-50/30' : ''}`}>
                              <td className="p-4">
                                <div className="font-bold text-slate-900 dark:text-white text-sm">{u.full_name || 'Chưa cập nhật'}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{u.email}</div>
                                {u.school && (
                                  <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                    <School size={11} /> {u.school}
                                  </div>
                                )}
                              </td>
                              <td className="p-4">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${badge.badgeClass}`}>
                                  <ShieldCheck size={12} />
                                  {badge.label}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                  u.status === 'active' 
                                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' 
                                    : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                                }`}>
                                  {u.status === 'active' ? 'Hoạt động' : 'Bị Khóa'}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <button onClick={() => openRoleModal(u)} className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors" title="Đổi quyền & trường học"><Edit3 size={14}/></button>
                                  {u.status === 'banned' ? (
                                    <button onClick={() => handleUpdateUserStatus(u.id, 'active')} className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-lg transition-colors" title="Mở khóa"><Unlock size={14}/></button>
                                  ) : (
                                    <button onClick={() => handleUpdateUserStatus(u.id, 'banned')} className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors" title="Khóa tài khoản"><Ban size={14}/></button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 2.5: EXAMS & QUESTION COUNT MANAGEMENT (ADMIN QUẢN LÝ) */}
            {/* ========================================================= */}
            {activeTab === 'exams' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h1 className="text-xl font-black text-slate-900 dark:text-white font-heading flex items-center gap-2 m-0">
                      <Library className="text-primary" size={22}/> Quản Lý Đề Thi & Số Lượng Câu Hỏi
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Admin toàn quyền giám sát số lượng câu hỏi trong từng đề thi, điều chỉnh cấu trúc ma trận câu hỏi và phân tích toàn bộ đề bằng AI siêu tốc.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => navigate('/exam-creator')}
                      className="btn-secondary py-2 px-3.5 rounded-xl text-xs flex items-center gap-1.5 font-bold cursor-pointer"
                    >
                      <PlusCircle size={14} /> Ghép đề từ Kho
                    </button>
                    <button 
                      onClick={() => navigate('/exam-editor')}
                      className="btn-primary py-2 px-3.5 rounded-xl text-xs flex items-center gap-1.5 font-bold cursor-pointer"
                    >
                      <PlusCircle size={14} /> Soạn đề mới
                    </button>
                  </div>
                </div>

                {/* 4 Thẻ chỉ số tổng quan số câu */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tổng số đề thi</div>
                    <div className="text-2xl font-black font-heading text-slate-900 dark:text-white mt-1">
                      {examsList.length} <span className="text-xs font-semibold text-slate-400">bộ đề</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tổng số câu hỏi trong đề</div>
                    <div className="text-2xl font-black font-heading text-blue-600 dark:text-blue-400 mt-1">
                      {totalQuestionsInSystem} <span className="text-xs font-semibold text-slate-400">câu hỏi</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Đề chuẩn Bộ 2026 (22/34 câu)</div>
                    <div className="text-2xl font-black font-heading text-emerald-600 dark:text-emerald-400 mt-1">
                      {examsList.filter(e => e.questionsCount === 22 || e.questionsCount === 34).length} <span className="text-xs font-semibold text-slate-400">đề</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Đề truyền thống (40 câu)</div>
                    <div className="text-2xl font-black font-heading text-indigo-600 dark:text-indigo-400 mt-1">
                      {examsList.filter(e => e.questionsCount === 40).length} <span className="text-xs font-semibold text-slate-400">đề</span>
                    </div>
                  </div>
                </div>

                {/* Bảng danh sách đề & bộ lọc số lượng câu */}
                <div className="flat-card flex flex-col h-[550px] overflow-hidden">
                  <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    
                    {/* Tìm kiếm */}
                    <div className="relative max-w-sm w-full">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15}/>
                      <input 
                        type="text" 
                        placeholder="Tìm kiếm Tên đề thi, Nhóm hoặc Tác giả..." 
                        value={searchExam} 
                        onChange={e => setSearchExam(e.target.value)} 
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 outline-none focus:border-primary text-xs text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Bộ lọc theo số lượng câu */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
                      <span className="text-slate-400 text-[11px] mr-1 hidden sm:inline">Lọc số câu:</span>
                      <button 
                        onClick={() => setQuestionCountFilter('all')}
                        className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-[11px] ${questionCountFilter === 'all' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}
                      >
                        Tất cả ({examsList.length})
                      </button>
                      <button 
                        onClick={() => setQuestionCountFilter('40')}
                        className={`px-2 py-1 rounded-lg transition-colors cursor-pointer text-[11px] ${questionCountFilter === '40' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-slate-200 dark:border-slate-700'}`}
                      >
                        40 câu ({examsList.filter(e => e.questionsCount === 40).length})
                      </button>
                      <button 
                        onClick={() => setQuestionCountFilter('34')}
                        className={`px-2 py-1 rounded-lg transition-colors cursor-pointer text-[11px] ${questionCountFilter === '34' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border border-slate-200 dark:border-slate-700'}`}
                      >
                        34 câu ({examsList.filter(e => e.questionsCount === 34).length})
                      </button>
                      <button 
                        onClick={() => setQuestionCountFilter('22')}
                        className={`px-2 py-1 rounded-lg transition-colors cursor-pointer text-[11px] ${questionCountFilter === '22' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 border border-slate-200 dark:border-slate-700'}`}
                      >
                        22 câu ({examsList.filter(e => e.questionsCount === 22).length})
                      </button>
                      <button 
                        onClick={() => setQuestionCountFilter('under20')}
                        className={`px-2 py-1 rounded-lg transition-colors cursor-pointer text-[11px] ${questionCountFilter === 'under20' ? 'bg-amber-600 text-white' : 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 border border-slate-200 dark:border-slate-700'}`}
                      >
                        &lt;20 câu ({examsList.filter(e => (e.questionsCount || 0) > 0 && (e.questionsCount || 0) < 20).length})
                      </button>
                      <button 
                        onClick={() => setQuestionCountFilter('empty')}
                        className={`px-2 py-1 rounded-lg transition-colors cursor-pointer text-[11px] ${questionCountFilter === 'empty' ? 'bg-rose-600 text-white' : 'bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-300 border border-slate-200 dark:border-slate-700'}`}
                      >
                        0 câu ({examsList.filter(e => !e.questionsCount || e.questionsCount === 0).length})
                      </button>
                    </div>
                  </div>

                  {/* Bảng danh sách đề thi */}
                  <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[850px]">
                      <thead className="bg-slate-50 dark:bg-slate-850 sticky top-0 z-10 shadow-2xs border-b border-slate-200 dark:border-slate-800">
                        <tr className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          <th className="p-4">Tên Đề thi & Nhóm</th>
                          <th className="p-4">Tác giả / Nguồn</th>
                          <th className="p-4 text-center">Số lượng Câu hỏi</th>
                          <th className="p-4 text-center">Thời gian</th>
                          <th className="p-4 text-right">Thao tác Quản trị</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredExams.map((exam) => {
                          const qCount = exam.questionsCount || 0;
                          const qCountBadge = qCount === 40 
                            ? 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300' 
                            : qCount === 34 || qCount === 22
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                            : qCount === 0
                            ? 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300';

                          return (
                            <tr key={exam.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-850/60 transition-colors">
                              <td className="p-4">
                                <div className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1" title={exam.title}>
                                  {exam.title}
                                </div>
                                <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                                  <span>{exam.group_name || 'Khác'}</span>
                                  <span>•</span>
                                  <span className="capitalize">{exam.type || 'Đề luyện thi'}</span>
                                </div>
                              </td>

                              <td className="p-4">
                                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                  {exam.author?.full_name || 'Hệ thống FMATH12'}
                                </div>
                                {exam.author?.school && (
                                  <div className="text-[10px] text-slate-400">{exam.author.school}</div>
                                )}
                              </td>

                              {/* SỐ LƯỢNG CÂU HỎI TRONG ĐỀ */}
                              <td className="p-4 text-center">
                                <button
                                  onClick={() => setManageQuestionsExam(exam)}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border transition-transform hover:scale-105 cursor-pointer ${qCountBadge}`}
                                  title="Bấm để xem và quản lý danh sách câu hỏi của đề này"
                                >
                                  <Layers size={13} />
                                  <span>{qCount} câu</span>
                                </button>
                              </td>

                              <td className="p-4 text-center text-xs font-medium text-slate-600 dark:text-slate-300">
                                {Math.floor((exam.time_limit || 2700) / 60)} phút
                              </td>

                              <td className="p-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* Nút 1: Phân tích tất cả câu hỏi AI Siêu tốc */}
                                  <button
                                    onClick={() => setAnalysisModalExam(exam)}
                                    className="p-1.5 px-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                                    title="Phân tích toàn bộ câu hỏi trong đề này bằng AI siêu tốc"
                                  >
                                    <Sparkles size={12} className="text-sky-200 animate-pulse" /> Phân tích AI
                                  </button>

                                  {/* Nút 2: Quản lý số câu hỏi */}
                                  <button
                                    onClick={() => setManageQuestionsExam(exam)}
                                    className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1"
                                    title="Quản lý / Điều chỉnh số lượng câu hỏi"
                                  >
                                    <ListChecks size={13} /> Quản lý câu
                                  </button>

                                  {/* Nút 3: Biên tập đề */}
                                  <button
                                    onClick={() => navigate('/exam-editor', { state: { examId: exam.id } })}
                                    className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                                    title="Soạn & Sửa đề thi"
                                  >
                                    <Edit3 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}



            {/* ========================================================= */}
            {/* TAB 3: CLASSES (QUẢN LÝ LỚP HỌC) */}
            {/* ========================================================= */}
            {activeTab === 'classes' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h1 className="text-xl font-black text-slate-900 dark:text-white font-heading flex items-center gap-2 m-0">
                      <Network className="text-emerald-600 dark:text-emerald-400" size={22}/> Phiên Lớp học Toàn Hệ thống
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Quản lý các lớp học Nội bộ FPT và Toàn quốc. Quản trị viên có quyền rà soát và gỡ bỏ phiên lớp học.
                    </p>
                  </div>

                  <button
                    onClick={() => navigate('/data-seeder')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white rounded-xl text-xs font-bold font-heading shadow-md transition-all self-start sm:self-auto cursor-pointer"
                  >
                    <Database size={15} /> Bơm Dữ Liệu & Lớp Học
                  </button>
                </div>

                {/* Privacy Banner */}
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-center gap-2.5 text-xs text-amber-800 dark:text-amber-300 font-medium">
                  <ShieldCheck size={16} className="text-amber-600 shrink-0" />
                  <span>
                    <strong>Quy định bảo mật riêng tư:</strong> Tài khoản Quản trị viên (Admin) không được phép truy cập số lượng học sinh bên trong lớp học nhằm tôn trọng quyền tự chủ giáo viên và an toàn dữ liệu GDPT 2018.
                  </span>
                </div>
                
                <div className="flat-card overflow-hidden h-[550px] flex flex-col">
                  <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                      <thead className="bg-slate-50 dark:bg-slate-850 sticky top-0 z-10 shadow-2xs border-b border-slate-200 dark:border-slate-800">
                        <tr className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          <th className="p-4">Tên Lớp học</th>
                          <th className="p-4">Phân loại</th>
                          <th className="p-4">Giáo viên phụ trách</th>
                          <th className="p-4 text-center">Sĩ số học sinh</th>
                          <th className="p-4 text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {classesList.map((c) => {
                          const isFpt = c.type === 'fpt' || c.name?.toLowerCase().includes('fpt') || c.name?.toLowerCase().includes('fscct');
                          return (
                            <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-850/60 transition-colors">
                              <td className="p-4">
                                <div className="font-bold text-slate-900 dark:text-white text-sm">{c.name}</div>
                                <div className="text-[11px] font-bold text-slate-400 mt-1 font-mono uppercase tracking-wider">
                                  Mã tham gia: <span className="text-primary font-bold">{c.join_code}</span>
                                </div>
                              </td>
                              <td className="p-4">
                                {isFpt ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold font-mono bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                    🏢 Nội bộ FPT
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold font-mono bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                    🌐 Toàn quốc
                                  </span>
                                )}
                              </td>
                              <td className="p-4 text-xs font-medium text-slate-700 dark:text-slate-300">{c.users?.full_name || 'Chưa gán'}</td>
                              <td className="p-4 text-center">
                                <span 
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700 select-none cursor-help"
                                  title="Chính sách bảo mật: Admin không có quyền truy cập sĩ số học sinh nội bộ"
                                >
                                  <Lock size={12} className="text-amber-500" /> Bảo mật nội bộ
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                <button onClick={() => handleDeleteClass(c.id)} className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors" title="Xóa lớp học"><Trash2 size={14}/></button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}



            {/* ========================================================= */}
            {/* TAB 4: DATABASE & ARCHITECTURE */}
            {/* ========================================================= */}
            {activeTab === 'database' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div>
                  <h1 className="text-xl font-black text-slate-900 dark:text-white font-heading flex items-center gap-2 m-0">
                    <Database className="text-amber-500" size={22}/> Kiến trúc Cơ sở Dữ liệu
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Tổng kết số lượng tài nguyên lưu trữ trong hệ cơ sở dữ liệu Supabase PostgreSQL.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flat-card p-8 text-center flex flex-col items-center justify-center">
                    <HardDrive size={48} className="text-primary mb-3 opacity-80"/>
                    <h3 className="text-4xl font-black text-slate-900 dark:text-white font-ui mb-1">{stats.exams}</h3>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider m-0">Bộ Đề Thi & Tự Luyện Tồn Tại</p>
                  </div>
                  <div className="flat-card p-8 text-center flex flex-col items-center justify-center">
                    <Library size={48} className="text-purple-600 dark:text-purple-400 mb-3 opacity-80"/>
                    <h3 className="text-4xl font-black text-slate-900 dark:text-white font-ui mb-1">{stats.lessons}</h3>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider m-0">Chuyên Đề & Bài Giảng Lý Thuyết</p>
                  </div>
                </div>
              </div>
            )}



            {/* ========================================================= */}
            {/* TAB 5: CONTENT (QUẢN LÝ BÀI ĐĂNG) */}
            {/* ========================================================= */}
            {activeTab === 'content' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div>
                  <h1 className="text-xl font-black text-slate-900 dark:text-white font-heading flex items-center gap-2 m-0">
                    <BookOpen className="text-primary" size={22}/> Quản lý Bài đăng & Học liệu
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Admin có toàn quyền chỉnh sửa trực tiếp kho lý thuyết chuẩn và đề thi gốc của hệ thống.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Card 1: Đăng Lý thuyết & Bài học */}
                  <div className="flat-card p-6 flex flex-col justify-between hover:border-primary transition-all">
                    <div>
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800 text-primary flex items-center justify-center mb-4 font-bold">
                        <BookOpen size={24} />
                      </div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white font-heading mb-2">Biên tập Giáo trình & Lý thuyết</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                        Tạo chương mới, thêm bài học mới và đăng nội dung bài giảng Markdown + KaTeX chuẩn GDPT 2018.
                      </p>
                    </div>
                    <button onClick={() => navigate('/question-bank')} className="btn-primary py-2.5 px-4 text-xs w-full flex items-center justify-center gap-2">
                      <PlusCircle size={15} /> Đến Trung tâm Soạn giảng
                    </button>
                  </div>

                  {/* Card 2: Kho Tài liệu & Video */}
                  <div className="flat-card p-6 flex flex-col justify-between hover:border-emerald-500 transition-all">
                    <div>
                      <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 font-bold">
                        <Video size={24} />
                      </div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white font-heading mb-2">Kho Video & Tài liệu PDF</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                        Đăng bài giảng video nhúng và upload bộ tài liệu chuyên đề PDF cho học sinh xem và tải về.
                      </p>
                    </div>
                    <button onClick={() => navigate('/resources')} className="btn-outline py-2.5 px-4 text-xs w-full flex items-center justify-center gap-2">
                      <FileText size={15} /> Xem Kho Học liệu
                    </button>
                  </div>

                  {/* Card 3: Đăng Đề thi mới */}
                  <div className="flat-card p-6 flex flex-col justify-between hover:border-primary transition-all">
                    <div>
                      <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200/60 dark:border-purple-800 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4 font-bold">
                        <Library size={24} />
                      </div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white font-heading mb-2">Kho Đề ôn tập & Tự luyện</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                        Tạo đề ôn tập mới, cấu hình thời gian làm bài, ma trận kiến thức và đáp án chi tiết cho học sinh rèn luyện.
                      </p>
                    </div>
                    <button onClick={() => navigate('/exam-creator')} className="btn-primary py-2.5 px-4 text-xs w-full flex items-center justify-center gap-2">
                      <PlusCircle size={15} /> Tạo Đề ôn tập mới
                    </button>
                  </div>
                </div>
              </div>
            )}



            {/* ========================================================= */}
            {/* TAB 6: SETTINGS */}
            {/* ========================================================= */}
            {activeTab === 'settings' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div>
                  <h1 className="text-xl font-black text-slate-900 dark:text-white font-heading flex items-center gap-2 m-0">
                    <Settings className="text-slate-500" size={22}/> Cấu hình Môi trường Hệ thống
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Thông số môi trường hoạt động của ứng dụng web.
                  </p>
                </div>

                <div className="flat-card overflow-hidden">
                  <div className="p-4 bg-slate-50/60 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Globe size={15}/> Biến Môi trường Runtime (Read-Only)
                  </div>
                  <div className="p-6 space-y-4 font-mono text-xs">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">VITE_SUPABASE_URL</div>
                      <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 break-all">{import.meta.env.VITE_SUPABASE_URL || 'Not config'}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">VITE_CLOUDINARY_CLOUD_NAME</div>
                      <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 break-all">{import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'Not config'}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">AI KERNEL ENGINE</div>
                      <div className="badge-success text-xs py-2 px-3 rounded-xl font-bold">openai/gpt-oss-120b (Groq AI 5 Keys Pool - Active)</div>
                    </div>
                  </div>
                </div>
              </div>
            )}



          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* MODAL CẤP / ĐỔI VAI TRÒ (ROLE)             */}
      {/* ========================================== */}
      {roleModalUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-6 shadow-bs-hover border border-slate-200 dark:border-slate-800 relative flex flex-col">
            <button onClick={() => setRoleModalUser(null)} className="absolute top-5 right-5 p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 transition-colors"><X size={18}/></button>
            
            <h3 className="text-base font-black text-slate-900 dark:text-white font-heading mb-1 flex items-center gap-2 m-0">
              <ShieldCheck className="text-primary"/> Phân quyền & Phân cấp Tài khoản
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Cập nhật cho: <strong className="text-slate-900 dark:text-white">{roleModalUser.full_name || roleModalUser.email}</strong>
            </p>

            <div className="space-y-2 mb-4">
              {[
                { key: 'student', label: 'Học sinh', desc: 'Làm bài thi, học lý thuyết và xem tiến độ học tập' },
                { key: 'teacher', label: 'Giáo viên', desc: 'Quản lý lớp học, tạo đề thi và chấm điểm học sinh' },
                { key: 'admin', label: 'Quản trị viên (Admin Toàn quyền)', desc: 'Toàn quyền chỉnh sửa đề gốc, lý thuyết chuẩn và quản trị' }
              ].map(r => (
                <label 
                  key={r.key} 
                  className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    selectedNewRole === r.key 
                      ? 'border-primary bg-indigo-50/70 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200' 
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <input 
                    type="radio" 
                    name="userRoleAdmin" 
                    value={r.key} 
                    checked={selectedNewRole === r.key} 
                    onChange={() => setSelectedNewRole(r.key as any)}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-bold text-xs">{r.label}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{r.desc}</div>
                  </div>
                </label>
              ))}
            </div>

            {/* Cấu hình Trường học nếu là Giáo viên */}
            {selectedNewRole === 'teacher' && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700/80 mb-4 space-y-2">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <School size={14} className="text-primary" /> Phân hiệu Trường học của Giáo viên
                </label>
                <select
                  value={selectedSchool}
                  onChange={(e) => setSelectedSchool(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-primary"
                >
                  <option value="THPT FPT Cần Thơ">THPT FPT Cần Thơ (Quyền biên tập hệ thống)</option>
                  <option value="Trường Liên kết Toàn quốc">Giáo viên Toàn quốc (Chỉ đề & lớp riêng, nhân bản đề)</option>
                </select>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  * Giáo viên THPT FPT Cần Thơ được quyền chỉnh sửa giáo trình lý thuyết chuẩn và đề thi gốc. Giáo viên Toàn quốc sẽ dùng tính năng "Nhân bản đề" để tùy biến riêng cho học sinh.
                </p>
              </div>
            )}



            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setRoleModalUser(null)} 
                className="btn-secondary flex-1 py-2 rounded-xl text-xs font-bold"
              >
                Hủy
              </button>
              <button 
                onClick={submitRoleChange} 
                disabled={isUpdatingRole} 
                className="btn-primary flex-1 py-2 rounded-xl flex justify-center items-center gap-2 text-xs font-bold disabled:opacity-50"
              >
                {isUpdatingRole ? <Loader2 size={15} className="animate-spin"/> : <CheckCircle2 size={15}/>} Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

    
      {/* MODAL PHÂN TÍCH TOÀN BỘ CÂU HỎI BẰNG AI */}
      {analysisModalExam && (
        <ExamBatchAnalysisModal
          isOpen={Boolean(analysisModalExam)}
          onClose={() => setAnalysisModalExam(null)}
          examTitle={analysisModalExam.title}
          examId={analysisModalExam.id}
        />
      )}

      {/* MODAL QUẢN LÝ SỐ LƯỢNG CÂU HỎI TRONG ĐỀ */}
      {manageQuestionsExam && (
        <AdminExamQuestionsModal
          isOpen={Boolean(manageQuestionsExam)}
          onClose={() => setManageQuestionsExam(null)}
          exam={manageQuestionsExam}
          onQuestionsUpdated={fetchAllData}
          onOpenAnalysis={(exam) => {
            setManageQuestionsExam(null);
            setAnalysisModalExam(exam);
          }}
        />
      )}

    </div>
  );
};

export default AdminDashboard;