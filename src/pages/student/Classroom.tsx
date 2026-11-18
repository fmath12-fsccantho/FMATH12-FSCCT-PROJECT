import React, { useState, useEffect } from 'react';
import { 
  Users, MessageSquare, FileText, Bell, Send, User, 
  Trophy, Calendar, CheckCircle2, AlertCircle, PlayCircle,
  GraduationCap, Loader2, ArrowRight, BrainCircuit, ExternalLink, X, Mail
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabase';

const Classroom = () => {
  const { currentUser } = useAppStore();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'feed' | 'assignments' | 'members'>('feed');

  // States Dữ liệu
  const [isLoading, setIsLoading] = useState(true);
  const [classInfo, setClassInfo] = useState<any>(null);
  const [teacherInfo, setTeacherInfo] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  // Quản lý nhiều lớp
  const [joinedClasses, setJoinedClasses] = useState<any[]>([]);
  const [currentClassId, setCurrentClassId] = useState<string | null>(null);

  // Modal Giáo viên
  const [showTeacherProfile, setShowTeacherProfile] = useState(false);

  // 1. Fetch danh sách lớp
  useEffect(() => {
    const fetchMyClasses = async () => {
      if (!currentUser?.id) return;
      setIsLoading(true);

      try {
        const { data: memberData } = await supabase
          .from('class_members')
          .select('class_id, classes(*)') 
          .eq('user_id', currentUser.id)
          .eq('status', 'joined');

        if (memberData && memberData.length > 0) {
          const classes = memberData.map(m => {
            const classObj = Array.isArray(m.classes) ? m.classes[0] : m.classes;
            return classObj;
          }).filter(Boolean);
          setJoinedClasses(classes);
          if (!currentClassId && classes.length > 0) setCurrentClassId(classes[0].id);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Lỗi lấy danh sách lớp:", error);
        setIsLoading(false);
      }
    };

    fetchMyClasses();
  }, [currentUser]);

  // 2. Fetch chi tiết lớp
  useEffect(() => {
    const fetchClassDetails = async () => {
      if (!currentClassId || !currentUser?.id) return;
      setIsLoading(true);

      try {
        const classData = joinedClasses.find(c => c.id === currentClassId);
        setClassInfo(classData);

        if (classData?.teacher_id) {
          const { data: teacherData } = await supabase.from('users').select('*').eq('id', classData.teacher_id).maybeSingle();
          setTeacherInfo(teacherData);
        }

        const { data: classMembers } = await supabase
          .from('class_members')
          .select('users(id, full_name, email, role, xp, avatar_url)')
          .eq('class_id', currentClassId)
          .eq('status', 'joined');
        
        if (classMembers) {
          const formattedMembers = classMembers.map((m: any) => {
            const userObj = Array.isArray(m.users) ? m.users[0] : m.users;
            return userObj;
          }).filter(Boolean);
          formattedMembers.sort((a: any, b: any) => (b.xp || 0) - (a.xp || 0));
          setMembers(formattedMembers);
        }

        const { data: assignsData } = await supabase
          .from('class_exams')
          .select('due_date, exams(id, title, type)')
          .eq('class_id', currentClassId)
          .order('due_date', { ascending: true });

        const { data: attemptsData } = await supabase
          .from('exam_attempts')
          .select('exam_id, score')
          .eq('user_id', currentUser.id);

        const attemptsMap = new Map();
        attemptsData?.forEach(att => {
          const current = attemptsMap.get(att.exam_id) || { count: 0, highest: 0 };
          attemptsMap.set(att.exam_id, {
            count: current.count + 1,
            highest: Math.max(current.highest, att.score || 0)
          });
        });

        if (assignsData) {
          const formattedAssigns = assignsData.map((item: any) => {
            const examObj = Array.isArray(item.exams) ? item.exams[0] : item.exams;
            if (!examObj) return null;

            const myAttempt = attemptsMap.get(examObj.id);
            const isDone = !!myAttempt;
            const now = new Date();
            const dueDate = item.due_date ? new Date(item.due_date) : null;
            const isOverdue = dueDate && dueDate < now;

            let status: 'todo' | 'done' | 'overdue' = 'todo';
            if (isDone) status = 'done';
            else if (isOverdue) status = 'overdue';

            return {
              id: examObj.id,
              title: examObj.title,
              type: examObj.type,
              dueDate: dueDate ? dueDate.toLocaleDateString('vi-VN') : 'Không giới hạn',
              status,
              score: myAttempt ? myAttempt.highest : null,
              attemptsCount: myAttempt ? myAttempt.count : 0
            };
          }).filter(Boolean);
          setAssignments(formattedAssigns);
        }

        const { data: newsData } = await supabase
          .from('class_announcements')
          .select('*')
          .eq('class_id', currentClassId)
          .order('created_at', { ascending: false });

        if (newsData) setAnnouncements(newsData);

      } catch (error) {
        console.error("Lỗi lấy chi tiết lớp:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClassDetails();
  }, [currentClassId, joinedClasses]);

  if (isLoading) {
    return (
      <div className="page-container items-center justify-center text-slate-400">
        <Loader2 size={36} className="animate-spin mb-3 text-indigo-600" />
        <p className="font-medium text-sm font-sans">Đang tải không gian lớp học...</p>
      </div>
    );
  }

  if (joinedClasses.length === 0 || !classInfo) {
    return (
      <div className="page-container items-center justify-center p-4">
        <div className="flat-card text-center p-8 max-w-md w-full space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
            <GraduationCap size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white font-heading m-0">Chưa tham gia lớp học</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-sans leading-relaxed m-0">
            Bạn hiện chưa được xếp vào lớp học nào. Vui lòng xin Mã lớp từ giáo viên bộ môn hoặc dùng tài khoản học sinh đã kết nối nhé!
          </p>
          <button 
            onClick={() => navigate('/dashboard')} 
            className="btn-primary py-2.5 px-6 rounded-xl text-xs font-bold font-heading"
          >
            Về trang tổng quan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container relative animate-in fade-in duration-300">
      <div className="page-content custom-scrollbar">
        <div className="max-w-5xl mx-auto w-full space-y-6">
          
          {/* Multiple Classes Switcher */}
          {joinedClasses.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
              <span className="text-xs font-bold text-slate-400 font-heading uppercase tracking-wider mr-1">Lớp của bạn:</span>
              {joinedClasses.map((cls) => (
                <button
                  key={cls.id}
                  onClick={() => setCurrentClassId(cls.id)}
                  className={`px-3.5 py-1.5 rounded-xl font-bold font-heading text-xs transition-all cursor-pointer ${
                    currentClassId === cls.id 
                      ? 'bg-indigo-600 text-white shadow-xs' 
                      : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-400'
                  }`}
                >
                  {cls.name}
                </button>
              ))}
            </div>
          )}

          {/* Class Banner Card */}
          <div className="flat-card p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="space-y-3 z-10">
              <span className="badge-primary">
                <GraduationCap size={13} /> Không Gian Lớp Học Toán 12
              </span>
              
              <h1 className="text-2xl sm:text-3xl font-black font-heading text-slate-900 dark:text-white tracking-tight m-0 leading-tight">
                {classInfo.name}
              </h1>

              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-200/70 dark:border-slate-700/70">
                  <Users size={15} className="text-indigo-500" /> {members.length} Sĩ tử trong lớp
                </span>
                <span>•</span>
                <span>Học kỳ II năm học 2025 - 2026</span>
              </div>
            </div>

            {/* Quick Teacher Card */}
            <div 
              onClick={() => { setActiveTab('members'); setTimeout(() => setShowTeacherProfile(true), 100); }}
              className="shrink-0 flex items-center gap-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 p-3.5 rounded-2xl cursor-pointer hover:border-indigo-400 transition-all group w-full md:w-auto z-10"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 overflow-hidden flex items-center justify-center font-bold text-sm text-indigo-600 dark:text-indigo-400 shrink-0">
                {teacherInfo?.avatar_url ? <img src={teacherInfo.avatar_url} alt="GV" className="w-full h-full object-cover"/> : teacherInfo?.full_name?.charAt(0) || 'GV'}
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 font-heading uppercase tracking-wider">Giáo viên phụ trách</div>
                <div className="text-[13.5px] font-bold font-heading text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {teacherInfo?.full_name || 'Đang cập nhật'}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-1 overflow-x-auto custom-scrollbar">
            <button 
              onClick={() => setActiveTab('feed')} 
              className={`px-4 py-2.5 rounded-xl font-bold font-heading text-[13px] flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'feed' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <MessageSquare size={15} /> Bảng tin lớp
            </button>
            <button 
              onClick={() => setActiveTab('assignments')} 
              className={`px-4 py-2.5 rounded-xl font-bold font-heading text-[13px] flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'assignments' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <FileText size={15} /> Bài tập ({assignments.length})
            </button>
            <button 
              onClick={() => setActiveTab('members')} 
              className={`px-4 py-2.5 rounded-xl font-bold font-heading text-[13px] flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'members' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <Users size={15} /> Thành viên ({members.length})
            </button>
          </div>

          {/* TAB 1: BẢNG TIN */}
          {activeTab === 'feed' && (
            <div className="space-y-4 animate-in fade-in">
              {announcements.length === 0 ? (
                <div className="flat-card text-center py-16 space-y-3">
                  <Bell size={36} className="mx-auto text-slate-300 dark:text-slate-600" />
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 font-sans m-0">Chưa có thông báo mới nào từ Thầy/Cô.</p>
                </div>
              ) : (
                announcements.map(ann => (
                  <div key={ann.id} className="flat-card p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                        {teacherInfo?.avatar_url ? <img src={teacherInfo.avatar_url} alt="GV" className="w-full h-full object-cover rounded-full"/> : <User size={18}/>}
                      </div>
                      <div>
                        <div className="font-bold font-heading text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                          {teacherInfo?.full_name || 'Giáo viên bộ môn'} <CheckCircle2 size={14} className="text-indigo-600"/>
                        </div>
                        <div className="text-[11px] text-slate-400 font-sans">
                          {new Date(ann.created_at).toLocaleString('vi-VN')}
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-sans m-0 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/60 dark:border-slate-700/60 whitespace-pre-line">
                      {ann.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: BÀI TẬP */}
          {activeTab === 'assignments' && (
            <div className="space-y-3.5 animate-in fade-in">
              {assignments.length === 0 ? (
                <div className="flat-card text-center py-16 space-y-3">
                  <FileText size={36} className="mx-auto text-slate-300 dark:text-slate-600" />
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 font-sans m-0">Thầy cô chưa giao bài tập nào cho lớp.</p>
                </div>
              ) : (
                assignments.map(assignment => {
                  let badge = <span className="badge-warning">Chưa làm</span>;
                  if (assignment.status === 'done') badge = <span className="badge-success">Đã hoàn thành</span>;
                  else if (assignment.status === 'overdue') badge = <span className="badge-danger">Quá hạn nộp</span>;

                  return (
                    <div 
                      key={assignment.id} 
                      className="flat-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-indigo-400 transition-all"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="badge-primary">{assignment.type || 'Luyện tập'}</span>
                          {badge}
                        </div>

                        <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white m-0">
                          {assignment.title}
                        </h3>

                        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-sans">
                          <Calendar size={13} />
                          <span>Hạn nộp: {assignment.dueDate}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                        {assignment.status === 'done' && (
                          <div className="text-right">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block font-heading">Điểm cao nhất</span>
                            <span className="text-base font-black font-raleway text-emerald-600 dark:text-emerald-400">
                              {assignment.score}
                            </span>
                          </div>
                        )}

                        <Link 
                          to={`/quiz/${assignment.id}`}
                          className={`px-5 py-2.5 rounded-xl font-bold font-heading text-xs transition-all text-center ${
                            assignment.status === 'todo'
                              ? 'btn-primary'
                              : 'btn-outline'
                          }`}
                        >
                          {assignment.status === 'done' ? 'Làm lại đề' : 'Bắt đầu làm'}
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 3: THÀNH VIÊN */}
          {activeTab === 'members' && (
            <div className="space-y-6 animate-in fade-in">
              
              {/* Teacher Info */}
              <div>
                <h3 className="text-xs font-bold font-heading text-slate-400 uppercase tracking-wider mb-3">
                  Giáo viên phụ trách
                </h3>
                {teacherInfo ? (
                  <div 
                    onClick={() => setShowTeacherProfile(true)}
                    className="flat-card p-4 flex items-center gap-4 max-w-md cursor-pointer hover:border-indigo-400 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg font-heading shrink-0 overflow-hidden">
                      {teacherInfo.avatar_url ? <img src={teacherInfo.avatar_url} alt="GV" className="w-full h-full object-cover"/> : teacherInfo.full_name?.charAt(0) || 'G'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold font-heading text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                        {teacherInfo.full_name}
                      </div>
                      <div className="text-xs text-slate-400 font-sans truncate">
                        {teacherInfo.email || 'Giảng viên FMATH12'}
                      </div>
                    </div>
                    <ExternalLink size={16} className="text-slate-400 group-hover:text-indigo-600" />
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Đang cập nhật...</p>
                )}
              </div>

              {/* Classmates Podium & List */}
              <div className="flat-card space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-bold font-heading text-slate-900 dark:text-white m-0">
                    Danh Sách Sĩ Tử Trong Lớp ({members.length})
                  </h3>
                  <span className="badge-warning">Xếp hạng theo XP</span>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {members.map((student, idx) => {
                    const isTop1 = idx === 0;
                    const isTop2 = idx === 1;
                    const isTop3 = idx === 2;

                    return (
                      <div key={student.id} className="py-3 px-1 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs font-raleway ${
                            isTop1 ? 'bg-amber-500 text-white' : isTop2 ? 'bg-slate-400 text-white' : isTop3 ? 'bg-amber-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}>
                            {idx + 1}
                          </div>

                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 overflow-hidden">
                            {student.avatar_url ? <img src={student.avatar_url} alt="Ava" className="w-full h-full object-cover"/> : student.full_name?.charAt(0) || 'U'}
                          </div>

                          <div>
                            <div className="text-xs sm:text-sm font-bold font-heading text-slate-900 dark:text-white flex items-center gap-1.5">
                              {student.full_name}
                              {currentUser.id === student.id && (
                                <span className="badge-success text-[10px] py-0 px-1.5">Bạn</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-black font-raleway text-amber-600 dark:text-amber-400">
                            {student.xp || 0}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block font-heading">XP</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* Teacher Profile Modal */}
      {showTeacherProfile && teacherInfo && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm animate-in fade-in px-4">
          <div className="bg-white dark:bg-slate-900 p-7 rounded-3xl max-w-sm w-full text-center shadow-2xl border border-slate-200 dark:border-slate-800 relative space-y-4">
            <button 
              onClick={() => setShowTeacherProfile(false)} 
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X size={18}/>
            </button>

            <div className="w-20 h-20 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-2xl overflow-hidden shadow-sm">
              {teacherInfo.avatar_url ? <img src={teacherInfo.avatar_url} alt="Ava" className="w-full h-full object-cover"/> : teacherInfo.full_name?.charAt(0) || 'GV'}
            </div>

            <div>
              <h2 className="text-lg font-bold font-heading text-slate-900 dark:text-white m-0">{teacherInfo.full_name}</h2>
              <span className="badge-primary mt-1.5 inline-block">Giáo viên phụ trách</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 text-left space-y-1">
              <span className="text-[10.5px] font-bold font-heading text-slate-400 uppercase tracking-wider">Hòm thư liên hệ</span>
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <Mail size={15} className="text-indigo-500 shrink-0" />
                <span className="truncate">{teacherInfo.email || 'Chưa cập nhật email'}</span>
              </div>
            </div>

            <a
              href={`mailto:${teacherInfo.email}`}
              className="btn-primary w-full py-2.5 text-xs font-bold font-heading flex items-center justify-center gap-2 rounded-xl"
            >
              <Send size={15} /> Gửi Email Trao Đổi
            </a>
          </div>
        </div>
      )}

    </div>
  );
};

export default Classroom;