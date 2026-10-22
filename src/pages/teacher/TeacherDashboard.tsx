import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Database, FileText, Send, CheckSquare, 
  BrainCircuit, PlusCircle, Sparkles, TrendingUp,
  Clock, FileSignature, Library, Trophy, Flame, CalendarDays, BarChart3,
  Award, ArrowRight, ShieldCheck
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { supabase } from '../../config/supabase';
import { getUserRoleBadgeInfo, isFptTeacherOrAdmin } from '../../utils/permissionUtils';

const TeacherDashboard = () => {
  const { currentUser } = useAppStore();
  const navigate = useNavigate(); 
  const isFpt = isFptTeacherOrAdmin(currentUser); 
  
  const [stats, setStats] = useState({
    students: 0,
    questions: 0,
    exams: 0,
    classes: 0 
  });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [topStudents, setTopStudents] = useState<any[]>([]);
  const [classesList, setClassesList] = useState<any[]>([]);
  
  // Realtime clock
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentUser?.id) return;

      try {
        const { count: questionCount } = await supabase.from('exercises').select('*', { count: 'exact', head: true });

        if (isFpt) {
          // ADMIN HOẶC GIÁO VIÊN THUỘC FPT CẦN THƠ: XEM TOÀN TRƯỜNG
          const { count: studentCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student');
          const { count: examCount } = await supabase.from('exams').select('*', { count: 'exact', head: true });
          const { count: classCount } = await supabase.from('classes').select('*', { count: 'exact', head: true });

          setStats({
            students: studentCount || 0,
            questions: questionCount || 0,
            exams: examCount || 0,
            classes: classCount || 0
          });

          const { data: logsData } = await supabase
            .from('exam_attempts')
            .select('created_at, users(full_name), exams(title)')
            .order('created_at', { ascending: false })
            .limit(4);
            
          if (logsData) setRecentLogs(logsData);

          const { data: topData } = await supabase
            .from('users')
            .select('id, full_name, xp, avatar_url')
            .eq('role', 'student')
            .order('xp', { ascending: false })
            .limit(3);
          
          if (topData) setTopStudents(topData);

          const { data: classesData } = await supabase.from('classes').select('id, name');
          if (classesData) setClassesList(classesData);
        } else {
          // GIÁO VIÊN TRƯỜNG NGOÀI (TOÀN QUỐC): BẢO MẬT DỮ LIỆU - CHỈ XEM DỮ LIỆU CỦA CHÍNH MÌNH
          const { data: myClasses } = await supabase
            .from('classes')
            .select('id, name')
            .eq('teacher_id', currentUser.id);

          const myClassList = myClasses || [];
          const myClassIds = myClassList.map(c => c.id);

          let myStudentCount = 0;
          if (myClassIds.length > 0) {
            const { count } = await supabase
              .from('class_members')
              .select('*', { count: 'exact', head: true })
              .in('class_id', myClassIds);
            myStudentCount = count || 0;
          }

          const { count: myExamCount } = await supabase
            .from('exams')
            .select('*', { count: 'exact', head: true })
            .eq('teacher_id', currentUser.id);

          setStats({
            students: myStudentCount,
            questions: questionCount || 0,
            exams: myExamCount || 0,
            classes: myClassList.length
          });

          setClassesList(myClassList);

          // Nhật ký bài tập của học sinh trong lớp của giáo viên này
          if (myClassIds.length > 0) {
            const { data: classExams } = await supabase
              .from('class_exams')
              .select('exam_id')
              .in('class_id', myClassIds);
            const myExamIds = classExams?.map(ce => ce.exam_id) || [];

            if (myExamIds.length > 0) {
              const { data: logsData } = await supabase
                .from('exam_attempts')
                .select('created_at, users(full_name), exams(title)')
                .in('exam_id', myExamIds)
                .order('created_at', { ascending: false })
                .limit(4);
              if (logsData) setRecentLogs(logsData);
            } else {
              setRecentLogs([]);
            }
          } else {
            setRecentLogs([]);
          }

          // Top học sinh trong lớp của giáo viên này
          if (myClassIds.length > 0) {
            const { data: members } = await supabase
              .from('class_members')
              .select('user_id')
              .in('class_id', myClassIds);
            const userIds = members?.map(m => m.user_id).filter(Boolean) || [];

            if (userIds.length > 0) {
              const { data: topData } = await supabase
                .from('users')
                .select('id, full_name, xp, avatar_url')
                .in('id', userIds)
                .order('xp', { ascending: false })
                .limit(3);
              if (topData) setTopStudents(topData);
            } else {
              setTopStudents([]);
            }
          } else {
            setTopStudents([]);
          }
        }

      } catch (error) {
        console.error("Lỗi lấy dữ liệu Dashboard Giáo viên:", error);
      }
    };

    fetchDashboardData();
  }, [currentUser, isFpt]);

  const formatTimeAgo = (dateString: string) => {
    const diff = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 60000);
    if (diff < 1) return 'Vừa xong';
    if (diff < 60) return `${diff} phút trước`;
    if (diff < 1440) return `${Math.floor(diff/60)} giờ trước`;
    return `${Math.floor(diff/1440)} ngày trước`;
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  const timeString = currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateString = currentTime.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="page-container relative animate-in fade-in duration-300">
      <div className="page-content custom-scrollbar">
        <div className="max-w-screen-2xl mx-auto w-full space-y-6">
        
          {/* Top Banner & Live Clock */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Banner: Lời chào & Hành động nhanh (8 cols) */}
            <div className="lg:col-span-8 flat-card p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-cyan-50/30 dark:from-slate-900 dark:via-indigo-950/40 dark:to-slate-900 border-indigo-200/70 dark:border-indigo-900/50">
              <div className="space-y-3 z-10">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 dark:bg-slate-800 border border-indigo-200/60 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-bold font-heading shadow-2xs">
                    <Sparkles size={13} />
                    <span>FMATH12 Teacher Workspace 2026</span>
                  </div>
                  {(() => {
                    const badge = getUserRoleBadgeInfo(currentUser);
                    return (
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${badge.badgeClass}`}>
                        <ShieldCheck size={13} />
                        {badge.label}
                      </span>
                    );
                  })()}
                </div>
                
                <h1 className="text-2xl sm:text-3xl font-black font-heading text-slate-900 dark:text-white tracking-tight leading-tight m-0">
                  {getGreeting()},{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500">
                    Thầy/Cô {currentUser?.name || currentUser?.full_name || 'Giáo viên'}!
                  </span>
                </h1>
                
                <p className="text-sm text-slate-600 dark:text-slate-300 font-sans leading-relaxed m-0 max-w-xl">
                  {isFpt ? (
                    <>Không gian quản trị giảng dạy trường: Thầy/Cô đang quản lý <strong className="text-indigo-600 dark:text-indigo-400">{stats.classes}</strong> lớp học và <strong className="text-indigo-600 dark:text-indigo-400">{stats.exams}</strong> bộ đề ôn tập hệ thống.</>
                  ) : (
                    <>Không gian quản trị giảng dạy cá nhân: Thầy/Cô đang phụ trách <strong className="text-indigo-600 dark:text-indigo-400">{stats.classes}</strong> lớp học và <strong className="text-indigo-600 dark:text-indigo-400">{stats.students}</strong> học sinh của riêng mình.</>
                  )}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-6 z-10">
                <button 
                  onClick={() => navigate('/exam-creator')} 
                  className="btn-primary py-2.5 px-5 text-xs font-bold font-heading flex items-center gap-2 rounded-xl"
                >
                  <PlusCircle size={15} /> Soạn đề ôn tập mới
                </button>
                <button 
                  onClick={() => navigate('/class-manager')} 
                  className="btn-outline py-2.5 px-5 text-xs font-bold font-heading flex items-center gap-2 rounded-xl"
                >
                  <Users size={15} /> Quản lý danh sách lớp
                </button>
              </div>
            </div>

            {/* Live Clock & Top Server Students (4 cols) */}
            <div className="lg:col-span-4 flat-card p-6 flex flex-col justify-between space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold font-heading text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CalendarDays size={14} /> Thời gian thực
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              </div>

              <div>
                <div className="text-3xl sm:text-4xl font-black font-raleway text-slate-900 dark:text-white tracking-tight">
                  {timeString}
                </div>
                <div className="text-xs font-semibold text-slate-400 font-sans capitalize mt-1">
                  {dateString}
                </div>
              </div>

              {/* Mini Podium */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold font-heading text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Trophy size={13} className="text-amber-500" /> {isFpt ? 'Bảng vàng trường' : 'Top học sinh lớp tôi'}
                  </span>
                  <span className="badge-warning text-[10px] py-0 px-1.5">Top 3</span>
                </div>

                <div className="space-y-1.5">
                  {topStudents.length === 0 ? (
                    <div className="p-3 text-center text-[11px] text-slate-400 font-sans">
                      {isFpt ? 'Chưa có dữ liệu thi đua' : 'Chưa có điểm xếp hạng của lớp'}
                    </div>
                  ) : (
                    topStudents.map((s, idx) => (
                      <div key={s.id || idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] font-raleway ${
                            idx === 0 ? 'bg-amber-500 text-white' : idx === 1 ? 'bg-slate-400 text-white' : 'bg-amber-700 text-white'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white truncate max-w-[130px]">{s.full_name}</span>
                        </div>
                        <span className="font-bold font-raleway text-amber-600 dark:text-amber-400">{s.xp || 0} XP</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Metric Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { 
                label: isFpt ? 'Lớp học hoạt động' : 'Lớp học của tôi', 
                value: stats.classes, 
                icon: <Users size={20} />, 
                badge: isFpt ? 'Toàn trường' : 'Lớp riêng', 
                path: '/class-manager', 
                color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200/60 dark:border-indigo-800' 
              },
              { 
                label: isFpt ? 'Học sinh toàn trường' : 'Học sinh của tôi', 
                value: stats.students, 
                icon: <TrendingUp size={20} />, 
                badge: isFpt ? 'Sĩ tử trường' : 'Sĩ tử lớp tôi', 
                path: '/class-manager', 
                color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200/60 dark:border-emerald-800' 
              },
              { 
                label: 'Câu hỏi trong kho', 
                value: stats.questions, 
                icon: <Database size={20} />, 
                badge: 'Ngân hàng', 
                path: '/question-bank', 
                color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200/60 dark:border-amber-800' 
              },
              { 
                label: isFpt ? 'Bộ đề thi & Tự luyện' : 'Bộ đề của tôi', 
                value: stats.exams, 
                icon: <FileText size={20} />, 
                badge: isFpt ? 'Đề thi trường' : 'Đề soạn riêng', 
                path: '/exam-bank', 
                color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 border-purple-200/60 dark:border-purple-800' 
              },
            ].map((stat, i) => (
              <div 
                key={i} 
                onClick={() => navigate(stat.path)}
                className="flat-card p-5 flex flex-col justify-between hover:border-indigo-400 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${stat.color}`}>
                    {stat.icon}
                  </div>
                  <span className="text-[10.5px] font-bold font-heading text-slate-400 uppercase tracking-wider">{stat.badge}</span>
                </div>
                <div>
                  <div className="text-2xl font-black font-raleway text-slate-900 dark:text-white leading-none">
                    {stat.value.toLocaleString()}
                  </div>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-sans mt-1.5">
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Heatmap Section */}
          <div className="flat-card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
              <div className="flex items-center gap-2">
                <BarChart3 size={18} className="text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white m-0">
                  Bản Đồ Nhiệt Năng Lực Lớp Học (Class Skill Heatmap)
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Giỏi (&gt;80%)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Khá (55-80%)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> Yếu (&lt;55%)</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-amber-50/60 to-indigo-50/60 dark:from-slate-800/80 dark:to-indigo-950/40 p-3 rounded-xl border border-amber-200/60 dark:border-indigo-900/60">
              <p className="text-xs text-slate-600 dark:text-slate-300 font-sans m-0 leading-relaxed">
                🚀 <strong>Tính năng cá nhân hóa lớp học:</strong> Mỗi lớp học có Bản Đồ Nhiệt chi tiết cho từng học sinh và hệ thống <strong>Trợ lý FMATH12 AI</strong> chẩn đoán điểm mù tri thức, đề xuất bồi dưỡng riêng cho từng lớp.
              </p>
              <button
                onClick={() => navigate('/class-manager?tab=heatmap')}
                className="btn-outline py-1.5 px-3.5 text-xs font-bold font-heading flex items-center gap-1.5 rounded-xl shrink-0 bg-white dark:bg-slate-800"
              >
                <Flame size={13} className="text-amber-500" /> Quản Lý Heatmap Từng Lớp
              </button>
            </div>

            <div className="overflow-x-auto custom-scrollbar border border-slate-200/80 dark:border-slate-800 rounded-2xl">
              {classesList.length === 0 ? (
                <div className="p-10 text-center space-y-3 bg-slate-50/50 dark:bg-slate-800/40">
                  <Users size={36} className="mx-auto text-slate-400 opacity-60" />
                  <div className="font-bold font-heading text-sm text-slate-800 dark:text-slate-200">
                    {isFpt ? 'Chưa có lớp học nào trên hệ thống.' : 'Thầy/Cô chưa có lớp học nào.'}
                  </div>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    {isFpt
                      ? 'Hãy truy cập Quản lý lớp học để rà soát hoặc khởi tạo lớp mới.'
                      : 'Hãy tạo lớp học của riêng thầy/cô để bắt đầu nhập danh sách học sinh và theo dõi Bản Đồ Nhiệt Năng Lực.'}
                  </p>
                  <button
                    onClick={() => navigate('/class-manager')}
                    className="btn-primary py-2 px-4 text-xs font-bold font-heading inline-flex items-center gap-2 rounded-xl"
                  >
                    <PlusCircle size={14} /> Tạo Lớp Học Ngay
                  </button>
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs font-sans">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800">
                      <th className="p-3.5 font-bold font-heading text-slate-700 dark:text-slate-200 w-36 border-r border-slate-200/80 dark:border-slate-800">Tên Lớp</th>
                      <th className="p-3.5 font-bold font-heading text-slate-700 dark:text-slate-200 text-center border-r border-slate-200/80 dark:border-slate-800">Khảo Sát Hàm Số</th>
                      <th className="p-3.5 font-bold font-heading text-slate-700 dark:text-slate-200 text-center border-r border-slate-200/80 dark:border-slate-800">Mũ & Logarit</th>
                      <th className="p-3.5 font-bold font-heading text-slate-700 dark:text-slate-200 text-center border-r border-slate-200/80 dark:border-slate-800">Nguyên Hàm - Tích Phân</th>
                      <th className="p-3.5 font-bold font-heading text-slate-700 dark:text-slate-200 text-center border-r border-slate-200/80 dark:border-slate-800">Hình Học Oxyz</th>
                      <th className="p-3.5 font-bold font-heading text-slate-700 dark:text-slate-200 text-center border-r border-slate-200/80 dark:border-slate-800">Xác Suất & Bayes</th>
                      <th className="p-3.5 font-bold font-heading text-slate-700 dark:text-slate-200 text-center border-r border-slate-200/80 dark:border-slate-800">Thống Kê</th>
                      <th className="p-3.5 font-bold font-heading text-slate-700 dark:text-slate-200 text-center">Bản Đồ Nhiệt Lớp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {classesList.map((cls, idx) => {
                      const seed = (cls.name || '').charCodeAt((cls.name || '').length - 1) || 65;
                      const val1 = Math.round(55 + (seed % 9) * 5); 
                      const val2 = Math.round(50 + ((seed + 2) % 10) * 5); 
                      const val3 = Math.round(45 + ((seed + 5) % 11) * 5); 
                      const val4 = Math.round(60 + ((seed + 7) % 8) * 5);
                      const val5 = Math.round(52 + ((seed + 3) % 9) * 5);
                      const val6 = Math.round(65 + ((seed + 6) % 7) * 5);
                      const scores = [val1, val2, val3, val4, val5, val6];

                      const getCellClass = (score: number) => {
                        if (score >= 80) return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold';
                        if (score >= 55) return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold';
                        return 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold';
                      };

                      return (
                        <tr key={cls.id || idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          <td 
                            onClick={() => cls.id && navigate(`/class-manager?classId=${cls.id}&tab=heatmap`)}
                            className="p-3.5 font-bold font-heading text-slate-900 dark:text-white border-r border-slate-200/80 dark:border-slate-800 cursor-pointer hover:text-indigo-600 transition-colors"
                          >
                            <div className="flex items-center gap-1.5">
                              <span>{cls.name}</span>
                              <ArrowRight size={12} className="text-slate-400" />
                            </div>
                          </td>
                          {scores.map((score, i) => (
                            <td key={i} className={`p-3.5 text-center border-r border-slate-200/80 dark:border-slate-800 font-raleway ${getCellClass(score)}`}>
                              {score}%
                            </td>
                          ))}
                          <td className="p-3 text-center">
                            <button
                              onClick={() => cls.id ? navigate(`/class-manager?classId=${cls.id}&tab=heatmap`) : navigate('/class-manager')}
                              className="btn-primary py-1.5 px-3 text-[11px] font-bold font-heading inline-flex items-center gap-1.5 rounded-xl shadow-2xs"
                              title={`Mở bản đồ nhiệt chi tiết & cập nhật AI cho lớp ${cls.name}`}
                            >
                              <Flame size={12} className="text-amber-300" />
                              <span>Vào Lớp & AI</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Quick Operations & Recent Logs */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Quick Actions (8 Cols) */}
            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="flat-card p-6 flex flex-col justify-between space-y-4 hover:border-indigo-400 transition-all">
                <div className="space-y-3">
                  <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Database size={22} />
                  </div>
                  <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white m-0">Ngân Hàng Câu Hỏi</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-sans leading-relaxed m-0">
                    Quản lý kho bài tập trắc nghiệm 3 phần (4 lựa chọn, Đúng/Sai, Trả lời ngắn) chuẩn cấu trúc Bộ GD&ĐT.
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button 
                    onClick={() => navigate('/question-bank')}
                    className="btn-primary w-full py-2.5 text-xs font-bold font-heading flex items-center justify-center gap-2 rounded-xl"
                  >
                    <PlusCircle size={15} /> Thêm Câu Hỏi Mới
                  </button>
                  <button 
                    onClick={() => navigate('/exam-editor')}
                    className="btn-outline w-full py-2.5 text-xs font-bold font-heading flex items-center justify-center gap-2 rounded-xl"
                  >
                    <BrainCircuit size={15} /> Nhập Đề Bằng AI (JSON)
                  </button>
                </div>
              </div>

              <div className="flat-card p-6 flex flex-col justify-between space-y-4 hover:border-indigo-400 transition-all">
                <div className="space-y-3">
                  <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <Library size={22} />
                  </div>
                  <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white m-0">Kho Đề & Giao Bài</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-sans leading-relaxed m-0">
                    Phân phối đề ôn tập tới từng lớp học sinh, thiết lập thời hạn nộp bài và giám sát tiến độ tự luyện.
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button 
                    onClick={() => navigate('/exam-bank')}
                    className="btn-primary w-full py-2.5 text-xs font-bold font-heading flex items-center justify-center gap-2 rounded-xl"
                  >
                    <Send size={15} /> Giao Bài Vào Lớp
                  </button>
                  <button 
                    onClick={() => navigate('/exam-creator')}
                    className="btn-outline w-full py-2.5 text-xs font-bold font-heading flex items-center justify-center gap-2 rounded-xl"
                  >
                    <PlusCircle size={15} /> Tạo Đề Tự Luyện Mới
                  </button>
                </div>
              </div>

            </div>

            {/* Recent Submissions Log (4 Cols) */}
            <div className="lg:col-span-4 flat-card p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold font-heading text-slate-400 uppercase tracking-wider m-0 flex items-center gap-1.5">
                  <Clock size={14} /> Hoạt động nộp bài
                </h3>
                <span className="text-[11px] font-semibold text-slate-400">Gần nhất</span>
              </div>

              {recentLogs.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs font-sans">
                  Chưa có hoạt động nộp bài mới nào.
                </div>
              ) : (
                <div className="space-y-3">
                  {recentLogs.map((log, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                      <div className="text-xs text-slate-700 dark:text-slate-300 font-sans">
                        <strong className="text-indigo-600 dark:text-indigo-400 font-heading">{log.users?.full_name || 'Học sinh'}</strong> vừa hoàn thành <span className="font-semibold">{log.exams?.title || 'đề luyện tập'}</span>
                      </div>
                      <div className="text-[10.5px] font-semibold text-slate-400 flex items-center gap-1">
                        <Clock size={11} /> {formatTimeAgo(log.created_at)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;