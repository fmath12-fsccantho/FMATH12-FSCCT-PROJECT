import React, { useState, useEffect, useMemo } from 'react';
import { 
  Library, PlusCircle, FileText, Clock, Users, PlayCircle, 
  Edit3, Trash2, Send, Loader2, BookOpen, GraduationCap, X, 
  Save, CalendarClock, History, LayoutTemplate, ListChecks, 
  Folder, ChevronDown, ChevronRight, Copy, ShieldCheck, Award, 
  Globe, Search, Sparkles, AlertCircle, CheckCircle2, Filter,
  CheckCircle, XCircle, Clock4, FileCheck, ThumbsUp, ThumbsDown
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { examService } from '../../services/examService';
import { supabase } from '../../config/supabase';
import { 
  isAdminUser, 
  isFptTeacherOrAdmin, 
  canEditExam, 
  canDeleteExam,
  canApproveExam
} from '../../utils/permissionUtils';
import ManagementHeader from '../../components/common/ManagementHeader';

const ExamBank = () => {
  const { currentUser } = useAppStore();
  const location = useLocation(); 
  const navigate = useNavigate(); 
  
  const [exams, setExams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('Đề theo bài');
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<'all' | 'official' | 'mine'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'rejected'>('all');

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [teacherClasses, setTeacherClasses] = useState<any[]>([]);
  
  const [assignForm, setAssignForm] = useState({ classId: '', dueDate: '' });
  const [isAssigning, setIsAssigning] = useState(false);
  
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
  const [editDates, setEditDates] = useState<Record<string, string>>({});

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const [showEditModal, setShowEditModal] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editingExam, setEditingExam] = useState({
    id: '', title: '', type: 'Đề theo bài', timeLimit: 45, group_name: ''
  });

  const isFptOrAdmin = isFptTeacherOrAdmin(currentUser);
  const isAdmin = isAdminUser(currentUser);
  const canApprove = canApproveExam(currentUser);

  // Đếm số lượng đề chờ duyệt
  const pendingCount = useMemo(() => exams.filter(e => e.status === 'pending').length, [exams]);
  const myPendingCount = useMemo(() => exams.filter(e => e.status === 'pending' && String(e.teacher_id) === String(currentUser?.id)).length, [exams, currentUser?.id]);

  const fetchExamsData = async () => {
    if (!currentUser?.id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const [examsData, classesData] = await Promise.all([
      examService.getManagementExams(currentUser),
      examService.getTeacherClasses(currentUser.id)
    ]);
    setExams(examsData || []);
    setTeacherClasses(classesData || []);
    if (classesData && classesData.length > 0) {
      setAssignForm(prev => ({ ...prev, classId: classesData[0].id }));
    }
    setIsLoading(false);

    if (location.state && (location.state as any).activeTab) {
      setActiveTab((location.state as any).activeTab);
    }
  };

  useEffect(() => {
    fetchExamsData();
  }, [currentUser?.id, location.key]); 

  // XỬ LÝ PHÊ DUYỆT ĐỀ THI
  const handleApproveExam = async (exam: any) => {
    if (!canApprove) return;
    const isConfirmed = window.confirm(`Xác nhận PHÊ DUYỆT đề thi "${exam.title}" do Thầy/Cô ${exam.author?.full_name || 'giáo viên'} đóng góp?\n\nSau khi duyệt, đề thi sẽ chính thức xuất hiện trên Ngân hàng đề thi và học sinh toàn hệ thống có thể luyện tập.`);
    if (!isConfirmed) return;

    const res = await examService.approveExam(exam.id);
    if (res.success) {
      alert(`Đã phê duyệt đề thi "${exam.title}" thành công!`);
      setExams(prev => prev.map(e => e.id === exam.id ? { 
        ...e, 
        status: 'active', 
        tags: Array.from(new Set([...(e.tags || []).filter((t: string) => t !== 'pending_approval'), 'approved'])) 
      } : e));
    } else {
      alert("Lỗi khi phê duyệt đề: " + res.error);
    }
  };

  // XỬ LÝ TỪ CHỐI / YÊU CẦU CHỈNH SỬA ĐỀ THI
  const handleRejectExam = async (exam: any) => {
    if (!canApprove) return;
    const reason = window.prompt(`Nhập lý do từ chối hoặc yêu cầu điều chỉnh cho đề thi "${exam.title}":`, "Cần kiểm tra lại định dạng đáp án hoặc công thức câu hỏi");
    if (reason === null) return;

    const res = await examService.rejectExam(exam.id, reason);
    if (res.success) {
      alert(`Đã chuyển trạng thái đề thi sang Từ chối / Cần chỉnh sửa.`);
      setExams(prev => prev.map(e => e.id === exam.id ? { 
        ...e, 
        status: 'rejected',
        tags: [...(e.tags || []).filter((t: string) => !t.startsWith('reason:') && t !== 'pending_approval' && t !== 'approved'), 'rejected', `reason:${reason}`] 
      } : e));
    } else {
      alert("Lỗi khi từ chối đề: " + res.error);
    }
  };

  const formatToLocalDatetime = (isoString: string) => {
    if (!isoString) return "";
    const d = new Date(isoString);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  const loadAssignments = async (examId: string) => {
    setIsLoadingAssignments(true);
    const { data } = await supabase
      .from('class_exams')
      .select(`class_id, due_date, classes (name)`)
      .eq('exam_id', examId);
    
    if (data) {
      setAssignments(data);
      const initialDates: Record<string, string> = {};
      data.forEach(item => { initialDates[item.class_id] = formatToLocalDatetime(item.due_date); });
      setEditDates(initialDates);
    }
    setIsLoadingAssignments(false);
  };

  const handleOpenAssignModal = (exam: any) => {
    if (teacherClasses.length === 0) {
      return alert("Thầy/Cô chưa có lớp học nào. Hãy vào mục 'Quản lý Lớp học' để tạo lớp trước khi giao bài!");
    }
    setSelectedExam(exam);
    setShowAssignModal(true);
    loadAssignments(exam.id); 
  };

  const handleAssignExam = async () => {
    if (!assignForm.classId || !assignForm.dueDate) return alert("Vui lòng chọn Lớp học và đặt Hạn chót!");
    if (assignments.some(a => a.class_id === assignForm.classId)) {
      return alert("Lớp này đã được giao đề rồi! Vui lòng chỉnh sửa hạn chót ở danh sách bên dưới.");
    }

    setIsAssigning(true);
    const { error } = await supabase.from('class_exams').insert({
      class_id: assignForm.classId,
      exam_id: selectedExam.id,
      due_date: new Date(assignForm.dueDate).toISOString()
    });

    if (error) {
      alert("Lỗi giao bài: " + error.message);
    } else {
      alert("Giao đề thi tới lớp thành công!"); 
      loadAssignments(selectedExam.id); 
    }
    setIsAssigning(false);
  };

  const handleUpdateAssignment = async (classId: string) => {
    const newDate = editDates[classId];
    if (!newDate) return;

    const { error } = await supabase.from('class_exams')
      .update({ due_date: new Date(newDate).toISOString() })
      .eq('exam_id', selectedExam.id)
      .eq('class_id', classId);

    if (error) alert("Lỗi cập nhật: " + error.message);
    else alert("Đã cập nhật Hạn chót mới thành công!");
  };

  const handleDeleteAssignment = async (classId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn thu hồi đề thi khỏi lớp này? Các học sinh chưa làm sẽ không thấy đề nữa.")) return;
    
    const { error } = await supabase.from('class_exams')
      .delete()
      .eq('exam_id', selectedExam.id)
      .eq('class_id', classId);

    if (error) alert("Lỗi thu hồi: " + error.message);
    else loadAssignments(selectedExam.id);
  };

  const handleDeleteExam = async (exam: any) => {
    if (!canDeleteExam(currentUser, exam)) {
      return alert("Thầy/Cô không có quyền xóa đề chuẩn hệ thống. Chỉ Quản trị viên hoặc Giáo viên THPT FPT Cần Thơ mới có quyền này.");
    }

    if (!window.confirm(`CẢNH BÁO: Xóa đề thi "${exam.title}" sẽ xóa toàn bộ câu hỏi và kết quả làm bài của học sinh. Chắc chắn xóa?`)) return;
    
    const { error } = await supabase.from('exams').delete().eq('id', exam.id);
    if (!error) {
      setExams(prev => prev.filter(e => e.id !== exam.id));
      alert("Đã xóa đề thi thành công.");
    } else {
      alert("Lỗi khi xóa: " + error.message);
    }
  };

  const openEditModal = (exam: any) => {
    if (!canEditExam(currentUser, exam)) {
      return alert("Thầy/Cô không có quyền sửa cấu hình đề chuẩn hệ thống. Hãy dùng tính năng 'Nhân bản đề' để tạo bản sao riêng.");
    }

    setEditingExam({ 
      id: exam.id, 
      title: exam.title, 
      type: exam.type, 
      timeLimit: Math.floor(exam.time_limit / 60),
      group_name: exam.group_name || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateExam = async () => {
    if (!editingExam.title.trim()) return alert("Vui lòng nhập tên đề thi!");
    setIsSavingEdit(true);
    const { error } = await supabase.from('exams').update({
      title: editingExam.title, 
      type: editingExam.type, 
      time_limit: editingExam.timeLimit * 60,
      group_name: editingExam.group_name
    }).eq('id', editingExam.id);

    if (!error) {
      setExams(prev => prev.map(e => e.id === editingExam.id ? { 
        ...e, 
        title: editingExam.title, 
        type: editingExam.type, 
        time_limit: editingExam.timeLimit * 60,
        group_name: editingExam.group_name
      } : e));
      setShowEditModal(false);
      if (editingExam.type !== activeTab) setActiveTab(editingExam.type);
    } else {
      alert("Lỗi cập nhật: " + error.message);
    }
    setIsSavingEdit(false);
  };

  // NHÂN BẢN ĐỀ THI CHO GIÁO VIÊN TOÀN QUỐC
  const handleCloneExam = async (exam: any) => {
    if (!currentUser?.id) return alert("Vui lòng đăng nhập để nhân bản đề thi!");
    
    const confirmClone = window.confirm(`Nhân bản đề "${exam.title}" thành đề riêng của Thầy/Cô để tự do tùy biến câu hỏi và giao bài cho lớp?`);
    if (!confirmClone) return;

    setIsLoading(true);
    try {
      const newTitle = `${exam.title} (Bản sao riêng)`;
      const { data: newExam, error: examError } = await supabase.from('exams').insert({
        title: newTitle,
        type: exam.type || 'Đề luyện thi',
        time_limit: exam.time_limit || 2700,
        teacher_id: currentUser.id,
        status: 'active',
        group_name: 'Đề riêng của tôi',
        tags: [...(exam.tags || []).filter((t: string) => t !== 'official'), 'cloned']
      }).select().single();

      if (examError || !newExam) throw examError || new Error("Không thể tạo bản sao đề");

      // Sao chép các câu hỏi vào đề mới
      const { data: eqData } = await supabase
        .from('exam_questions')
        .select('exercise_id, sort_order')
        .eq('exam_id', exam.id)
        .order('sort_order', { ascending: true });

      if (eqData && eqData.length > 0) {
        const questionsToInsert = eqData.map(q => ({
          exam_id: newExam.id,
          exercise_id: q.exercise_id,
          sort_order: q.sort_order
        }));
        await supabase.from('exam_questions').insert(questionsToInsert);
      }

      setExams(prev => [newExam, ...prev]);
      alert(`Nhân bản thành công! Đề thi riêng "${newTitle}" đã được thêm vào kho đề của Thầy/Cô.`);
      navigate('/exam-editor', { state: { examId: newExam.id } });
    } catch (err: any) {
      alert("Lỗi khi nhân bản đề: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateLiveSession = async (exam: any) => {
    try {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));

      const startTime = new Date();
      const endTime = new Date(Date.now() + 3 * 3600000); 

      const { data, error } = await supabase.from('live_sessions').insert({
        exam_id: exam.id,
        exam_title: exam.title,
        access_code: code,
        status: 'PENDING',
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        is_active: true,
        created_by: currentUser.id
      }).select().single();

      if (error) throw error;

      alert(`Đã khởi tạo Ca thi Live thành công!\nMã phòng thi (Code): ${code}`);
      navigate(`/live-monitor/${data.id}`);
    } catch (err: any) {
      alert("Lỗi tạo Ca thi Live: " + err.message);
    }
  };

  const TABS = ['Đề theo bài', 'Chuyên đề', 'Đề luyện thi', 'ĐGNL', 'VSAT'];

  // Lọc đề thi theo tab, từ khóa tìm kiếm, nguồn gốc và trạng thái duyệt
  const filteredExams = useMemo(() => {
    return exams.filter(exam => {
      // 1. Tìm kiếm từ khóa
      const matchesSearch = !searchQuery.trim() || 
        exam.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exam.group_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exam.author?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());

      // 2. Chế độ lọc trạng thái Chờ duyệt (Pending)
      if (statusFilter === 'pending') {
        const isPending = exam.status === 'pending';
        if (canApprove) return isPending && matchesSearch;
        return isPending && String(exam.teacher_id) === String(currentUser?.id) && matchesSearch;
      }

      // 3. Chế độ lọc trạng thái Bị từ chối (Rejected)
      if (statusFilter === 'rejected') {
        const isRejected = exam.status === 'rejected';
        if (canApprove) return isRejected && matchesSearch;
        return isRejected && String(exam.teacher_id) === String(currentUser?.id) && matchesSearch;
      }

      // 4. Chế độ xem theo Tab môn học thông thường
      const matchesTab = exam.type === activeTab;

      // Nguồn gốc (Tất cả / Chuẩn hệ thống / Đề của tôi)
      const isMyExam = String(exam.teacher_id) === String(currentUser?.id);
      let matchesSource = true;
      if (sourceFilter === 'official') matchesSource = !isMyExam && exam.status === 'active';
      if (sourceFilter === 'mine') matchesSource = isMyExam;

      // Nếu không bật filter riêng thì mặc định chỉ hiển thị đề active trong tab (cộng thêm đề pending của chính mình để giáo viên theo dõi)
      let matchesStatus = true;
      if (statusFilter === 'active') {
        matchesStatus = exam.status === 'active';
      } else if (statusFilter === 'all') {
        matchesStatus = exam.status === 'active' || isMyExam || canApprove;
      }

      return matchesTab && matchesSearch && matchesSource && matchesStatus;
    });
  }, [exams, activeTab, searchQuery, sourceFilter, statusFilter, currentUser?.id, canApprove]);

  const groupedExams = useMemo(() => {
    return filteredExams.reduce((acc, exam) => {
      const group = exam.group_name?.trim() || 'Khác (Chưa phân nhóm)';
      if (!acc[group]) acc[group] = [];
      acc[group].push(exam);
      return acc;
    }, {} as Record<string, any[]>);
  }, [filteredExams]);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupName]: prev[groupName] === false ? true : false }));
  };

  return (
    <div className="page-container relative animate-in fade-in">
      <div className="page-content custom-scrollbar">
        <div className="max-w-7xl mx-auto w-full pb-16">
          
          {/* HEADER ĐỒNG BỘ GIÁO VIÊN & ADMIN */}
          <ManagementHeader
            title="Ngân Hàng Đề Thi & Bài Kiểm Tra"
            subtitle="Khởi tạo, đóng góp, kiểm duyệt và giao bài kiểm tra tới các lớp học trực thuộc"
            icon={<Library size={22} />}
            actions={
              <>
                <Link 
                  to="/exam-creator" 
                  className="btn-secondary text-xs px-3.5 py-2 flex items-center gap-1.5"
                >
                  <LayoutTemplate size={14} /> Ghép đề từ Kho
                </Link>
                <Link 
                  to="/exam-editor" 
                  className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 shadow-sm"
                >
                  <PlusCircle size={14} /> Tạo đề / Đóng góp đề
                </Link>
              </>
            }
          />

          {/* BANNER THÔNG BÁO CHO ADMIN KHI CÓ ĐỀ ĐÓNG GÓP ĐANG CHỜ DUYỆT */}
          {canApprove && pendingCount > 0 && statusFilter !== 'pending' && (
            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                  <Clock4 size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200 m-0">
                    Có {pendingCount} đề thi do giáo viên đóng góp đang chờ Admin duyệt!
                  </h4>
                  <p className="text-xs text-amber-700 dark:text-amber-300/80 m-0 mt-0.5">
                    Quản trị viên vui lòng kiểm tra nội dung, đáp án và phê duyệt để xuất bản cho học sinh.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setStatusFilter('pending')}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-xs shrink-0 self-start sm:self-auto cursor-pointer"
              >
                Xem & Duyệt Ngay ({pendingCount})
              </button>
            </div>
          )}

          {/* THANH CÔNG CỤ TÌM KIẾM & BỘ LỌC ĐỒNG BỘ */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-xs mb-6 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              
              {/* Tabs danh mục */}
              <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
                {TABS.map(tab => (
                  <button 
                    key={tab}
                    onClick={() => { setActiveTab(tab); if (statusFilter === 'pending' || statusFilter === 'rejected') setStatusFilter('all'); }}
                    className={`shrink-0 px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer font-heading border ${
                      activeTab === tab && statusFilter !== 'pending' && statusFilter !== 'rejected'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs' 
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:border-blue-400'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {tab === 'Đề theo bài' || tab === 'Chuyên đề' ? <BookOpen size={13} /> : <GraduationCap size={13} />}
                      <span>{tab}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Bộ lọc nguồn gốc & trạng thái kiểm duyệt */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                  <button
                    onClick={() => { setStatusFilter('all'); setSourceFilter('all'); }}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${statusFilter === 'all' && sourceFilter === 'all' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs' : 'text-slate-500'}`}
                  >
                    Tất cả ({exams.filter(e => e.type === activeTab && e.status === 'active').length})
                  </button>
                  <button
                    onClick={() => { setStatusFilter('all'); setSourceFilter('official'); }}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${sourceFilter === 'official' && statusFilter === 'all' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs' : 'text-slate-500'}`}
                  >
                    Chuẩn hệ thống
                  </button>
                  <button
                    onClick={() => { setStatusFilter('all'); setSourceFilter('mine'); }}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${sourceFilter === 'mine' && statusFilter === 'all' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs' : 'text-slate-500'}`}
                  >
                    Đề của tôi
                  </button>
                </div>

                {/* NÚT LỌC ĐỀ CHỜ DUYỆT (PENDING APPROVAL) */}
                <button
                  onClick={() => setStatusFilter(prev => prev === 'pending' ? 'all' : 'pending')}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all border cursor-pointer ${
                    statusFilter === 'pending'
                      ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                      : (canApprove ? pendingCount > 0 : myPendingCount > 0)
                        ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700 hover:bg-amber-100'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                  }`}
                  title={canApprove ? "Xem danh sách đề giáo viên đóng góp đang chờ Admin duyệt" : "Xem đề của bạn đang chờ duyệt"}
                >
                  <Clock4 size={13} className={statusFilter === 'pending' ? 'text-white' : 'text-amber-500'} />
                  <span>Chờ duyệt</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    statusFilter === 'pending'
                      ? 'bg-white text-amber-700'
                      : 'bg-amber-500 text-white'
                  }`}>
                    {canApprove ? pendingCount : myPendingCount}
                  </span>
                </button>
              </div>

            </div>

            {/* Ô tìm kiếm đề */}
            <div className="relative">
              <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder={statusFilter === 'pending' ? "Tìm kiếm đề đang chờ duyệt theo tên hoặc tên giáo viên đóng góp..." : "Tìm kiếm theo tên đề thi hoặc tên nhóm bài học..."}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200 transition-colors"
              />
            </div>
          </div>

          {/* DANH SÁCH ĐỀ THI */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-3">
              <Loader2 className="animate-spin text-blue-600" size={32}/>
              <p className="text-xs text-slate-400">Đang tải kho đề thi...</p>
            </div>
          ) : filteredExams.length === 0 ? (
            <div className="text-center p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-3">
              <Library size={44} className="mx-auto opacity-25 text-blue-500"/>
              <p className="font-bold text-sm text-slate-700 dark:text-slate-300 m-0">
                Chưa có đề thi nào phù hợp trong danh mục <span className="text-blue-600 dark:text-blue-400">{activeTab}</span>.
              </p>
              <p className="text-xs text-slate-400 m-0 max-w-sm mx-auto">
                Thầy/Cô có thể tự tạo đề mới hoặc chuyển sang danh mục khác để xem ngân hàng đề có sẵn.
              </p>
              <div className="pt-2">
                <Link to="/exam-editor" className="btn-primary text-xs px-4 py-2 inline-flex items-center gap-1.5">
                  <PlusCircle size={14} /> Soạn đề mới ngay
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedExams).map(([groupName, groupExams]) => {
                const isExpanded = expandedGroups[groupName] !== false; 
                return (
                  <div key={groupName} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
                    
                    {/* Header Nhóm Đề */}
                    <div 
                      onClick={() => toggleGroup(groupName)}
                      className="flex items-center justify-between p-4 bg-slate-50/80 dark:bg-slate-850/80 border-b border-slate-200/80 dark:border-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Folder className="text-blue-600 dark:text-blue-400 shrink-0" size={18} />
                        <h3 className="text-sm md:text-base font-bold text-slate-900 dark:text-white font-heading m-0 flex items-center gap-2">
                          <span>{groupName}</span>
                          <span className="text-xs font-semibold text-slate-400 bg-slate-200/80 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                            {groupExams.length} đề
                          </span>
                        </h3>
                      </div>
                      <div className="text-slate-400">
                        {isExpanded ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
                      </div>
                    </div>

                    {/* Lưới đề trong nhóm */}
                    {isExpanded && (
                      <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {groupExams.map(exam => {
                          const isMyExam = String(exam.teacher_id) === String(currentUser?.id);
                          const canEdit = canEditExam(currentUser, exam);
                          const canDelete = canDeleteExam(currentUser, exam);
                          const isPending = exam.status === 'pending';
                          const isRejected = exam.status === 'rejected';
                          const reasonTag = (exam.tags || []).find((t: string) => t.startsWith('reason:'));
                          const reasonText = reasonTag ? reasonTag.replace('reason:', '') : '';

                          return (
                            <div 
                              key={exam.id} 
                              className={`bg-white dark:bg-slate-850 rounded-2xl border shadow-2xs transition-all flex flex-col group relative ${
                                isPending 
                                  ? 'border-amber-300 dark:border-amber-700/80 ring-1 ring-amber-400/30' 
                                  : isRejected 
                                    ? 'border-rose-300 dark:border-rose-800' 
                                    : 'border-slate-200 dark:border-slate-750 hover:border-blue-400 dark:hover:border-blue-600'
                              }`}
                            >
                              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                                <div>
                                  <div className="flex items-start justify-between gap-2 mb-2.5">
                                    {isPending ? (
                                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700 flex items-center gap-1 shadow-2xs">
                                        <Clock4 size={11} className="text-amber-600" /> Chờ Admin duyệt
                                      </span>
                                    ) : isRejected ? (
                                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-700 flex items-center gap-1">
                                        <XCircle size={11} className="text-rose-600" /> Cần chỉnh sửa
                                      </span>
                                    ) : isMyExam ? (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                                        <CheckCircle2 size={10} /> Đề của tôi (Đã duyệt)
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                                        <Award size={10} /> Chuẩn hệ thống
                                      </span>
                                    )}

                                    {/* Action buttons góc trên */}
                                    <div className="flex items-center gap-1">
                                      {/* Nút Sửa nội dung câu hỏi */}
                                      {canEdit ? (
                                        <button 
                                          onClick={() => navigate('/exam-editor', { state: { examId: exam.id } })} 
                                          className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer" 
                                          title="Sửa nội dung câu hỏi đề thi"
                                        >
                                          <ListChecks size={14}/>
                                        </button>
                                      ) : (
                                        <button 
                                          onClick={() => handleCloneExam(exam)} 
                                          className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                                          title="Nhân bản đề thi này thành đề riêng"
                                        >
                                          <Copy size={13} />
                                        </button>
                                      )}

                                      {/* Nút Sửa cấu hình tên/thời gian */}
                                      {canEdit && (
                                        <button 
                                          onClick={() => openEditModal(exam)} 
                                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer" 
                                          title="Cấu hình tên/thời gian"
                                        >
                                          <Edit3 size={14}/>
                                        </button>
                                      )}

                                      {/* Nút Xóa đề */}
                                      {canDelete && (
                                        <button 
                                          onClick={() => handleDeleteExam(exam)} 
                                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer" 
                                          title="Xóa đề thi"
                                        >
                                          <Trash2 size={14}/>
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  <h4 className="text-sm font-bold text-slate-900 dark:text-white font-heading line-clamp-2 leading-snug mb-1" title={exam.title}>
                                    {exam.title}
                                  </h4>

                                  {/* Hiển thị tác giả đóng góp */}
                                  {exam.author?.full_name && (
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans mb-2 flex items-center gap-1">
                                      <span>Đóng góp:</span> <span className="font-bold text-slate-700 dark:text-slate-300">{exam.author.full_name}</span>
                                      {exam.author.school && <span className="text-slate-400">({exam.author.school})</span>}
                                    </p>
                                  )}

                                  {/* Hiển thị lý do nếu bị từ chối */}
                                  {isRejected && reasonText && (
                                    <div className="mb-2 p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-[11px] text-rose-700 dark:text-rose-300 font-sans">
                                      <strong>Góp ý điều chỉnh:</strong> {reasonText}
                                    </div>
                                  )}
                                </div>

                                <div className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                                  <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1.5"><Clock size={13}/> Thời gian</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200">{Math.floor((exam.time_limit || 2700)/60)} phút</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1.5"><Users size={13}/> Lượt thi</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200">{exam.participants || 0} lượt</span>
                                  </div>
                                </div>
                              </div>

                              {/* Footer card: PHÂN BIỆT THEO TRẠNG THÁI DUYỆT */}
                              {isPending ? (
                                canApprove ? (
                                  /* ADMIN: NÚT DUYỆT & TỪ CHỐI */
                                  <div className="border-t border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/40 rounded-b-2xl overflow-hidden text-xs font-bold divide-y divide-amber-200 dark:divide-amber-900/60">
                                    <Link 
                                      to={`/quiz/${exam.id}`}
                                      className="py-1.5 text-center block text-blue-600 dark:text-blue-400 hover:underline text-[11px]"
                                    >
                                      Xem trước toàn bộ câu hỏi & đáp án →
                                    </Link>
                                    <div className="grid grid-cols-2 divide-x divide-amber-200 dark:divide-amber-900/60">
                                      <button 
                                        onClick={() => handleApproveExam(exam)} 
                                        className="py-2.5 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-black"
                                        title="Phê duyệt đề thi này"
                                      >
                                        <CheckCircle size={14} className="text-emerald-600" /> PHÊ DUYỆT
                                      </button>
                                      
                                      <button 
                                        onClick={() => handleRejectExam(exam)} 
                                        className="py-2.5 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-bold"
                                        title="Từ chối hoặc yêu cầu sửa đổi"
                                      >
                                        <XCircle size={14} className="text-rose-600" /> TỪ CHỐI
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  /* GIÁO VIÊN: THÔNG BÁO CHỜ DUYỆT & NÚT XEM/SỬA */
                                  <div className="border-t border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/30 rounded-b-2xl overflow-hidden text-xs font-bold p-2.5 text-center">
                                    <p className="text-[11px] text-amber-700 dark:text-amber-400 mb-2 font-medium m-0">
                                      ⏳ Đang chờ Admin xét duyệt. Chưa thể giao cho học sinh.
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                      <button 
                                        onClick={() => navigate('/exam-editor', { state: { examId: exam.id } })}
                                        className="py-1.5 px-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] hover:border-blue-400 cursor-pointer"
                                      >
                                        Sửa câu hỏi
                                      </button>
                                      <Link 
                                        to={`/quiz/${exam.id}`} 
                                        className="py-1.5 px-2 bg-blue-50 dark:bg-blue-950/50 rounded-lg border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-[11px] text-center"
                                      >
                                        Xem trước
                                      </Link>
                                    </div>
                                  </div>
                                )
                              ) : isRejected ? (
                                /* BỊ TỪ CHỐI: HƯỚNG DẪN SỬA LẠI */
                                <div className="grid grid-cols-2 border-t border-rose-200 dark:border-rose-900/60 divide-x divide-rose-200 dark:divide-rose-900/60 bg-rose-50/70 dark:bg-rose-950/40 rounded-b-2xl overflow-hidden text-xs font-bold">
                                  <button 
                                    onClick={() => navigate('/exam-editor', { state: { examId: exam.id } })} 
                                    className="py-2.5 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    <Edit3 size={13} /> Chỉnh sửa lại
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteExam(exam)} 
                                    className="py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    <Trash2 size={13} /> Xóa đề
                                  </button>
                                </div>
                              ) : (
                                /* ĐÃ DUYỆT (ACTIVE): 3 NÚT CHUẨN */
                                <div className="grid grid-cols-3 border-t border-slate-100 dark:border-slate-800 divide-x divide-slate-100 dark:divide-slate-800 bg-slate-50/80 dark:bg-slate-800/60 rounded-b-2xl overflow-hidden text-xs font-bold">
                                  <button 
                                    onClick={() => handleOpenAssignModal(exam)} 
                                    className="py-2.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                    title="Giao đề tới các lớp học"
                                  >
                                    <Send size={12} /> Giao bài
                                  </button>
                                  
                                  <button 
                                    onClick={() => handleCreateLiveSession(exam)} 
                                    className="py-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                    title="Tổ chức ca thi trực tiếp (Live Contest)"
                                  >
                                    <PlayCircle size={13} className="text-emerald-500" /> Ca Live
                                  </button>

                                  {!canEdit ? (
                                    <button 
                                      onClick={() => handleCloneExam(exam)} 
                                      className="py-2.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                      title="Nhân bản đề này thành đề riêng của Thầy/Cô"
                                    >
                                      <Copy size={12} /> Nhân bản
                                    </button>
                                  ) : (
                                    <Link 
                                      to={`/quiz/${exam.id}`} 
                                      className="py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1 text-center"
                                    >
                                      Xem đề
                                    </Link>
                                  )}
                                </div>
                              )}

                            </div>
                          );
                        })}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>

      {/* ==========================================
          MODAL SỬA CẤU HÌNH ĐỀ 
          ========================================== */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-6 md:p-8 shadow-xl border border-slate-200 dark:border-slate-800 relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-heading m-0 flex items-center gap-2">
                <Edit3 size={18} className="text-blue-600" /> Sửa Cấu Hình Đề Thi
              </h3>
              <button 
                onClick={() => setShowEditModal(false)} 
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X size={18}/>
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tên đề thi</label>
                <input 
                  type="text" 
                  value={editingExam.title} 
                  onChange={e => setEditingExam({...editingExam, title: e.target.value})} 
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tên Nhóm / Bộ đề</label>
                <input 
                  type="text" 
                  value={editingExam.group_name} 
                  onChange={e => setEditingExam({...editingExam, group_name: e.target.value})} 
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 shadow-2xs" 
                  placeholder="VD: Khảo sát hàm số, Bộ đề THPTQG..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Phân loại</label>
                  <select 
                    value={editingExam.type} 
                    onChange={e => setEditingExam({...editingExam, type: e.target.value})}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 shadow-2xs"
                  >
                    {TABS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Thời gian (phút)</label>
                  <input 
                    type="number" 
                    value={editingExam.timeLimit} 
                    onChange={e => setEditingExam({...editingExam, timeLimit: Number(e.target.value)})} 
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 shadow-2xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2.5">
              <button 
                onClick={() => setShowEditModal(false)} 
                className="btn-secondary flex-1 py-2.5 text-xs font-bold"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleUpdateExam} 
                disabled={isSavingEdit}
                className="btn-primary flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                {isSavingEdit ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                <span>Lưu thay đổi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL GIAO ĐỀ TỚI LỚP HỌC
          ========================================== */}
      {showAssignModal && selectedExam && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl p-6 md:p-8 shadow-xl border border-slate-200 dark:border-slate-800 relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-heading m-0 flex items-center gap-2">
                  <Send size={16} className="text-blue-600" /> Giao Đề Cho Lớp Học
                </h3>
                <p className="text-xs text-slate-400 m-0 mt-0.5 truncate max-w-sm">{selectedExam.title}</p>
              </div>
              <button 
                onClick={() => setShowAssignModal(false)} 
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X size={18}/>
              </button>
            </div>

            {/* Form Giao Đề Mới */}
            <div className="space-y-4 mb-6 bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Chọn Lớp học nhận đề</label>
                <select
                  value={assignForm.classId}
                  onChange={e => setAssignForm({ ...assignForm, classId: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 shadow-2xs"
                >
                  {teacherClasses.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Hạn chót nộp bài</label>
                <input
                  type="datetime-local"
                  value={assignForm.dueDate}
                  onChange={e => setAssignForm({ ...assignForm, dueDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 shadow-2xs"
                />
              </div>

              <button
                onClick={handleAssignExam}
                disabled={isAssigning}
                className="btn-primary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                {isAssigning ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                <span>Xác nhận Giao đề</span>
              </button>
            </div>

            {/* Danh sách lớp đã được giao đề */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                Các lớp đã được giao đề ({assignments.length})
              </h4>
              {isLoadingAssignments ? (
                <div className="text-center py-4"><Loader2 size={18} className="animate-spin text-blue-600 mx-auto" /></div>
              ) : assignments.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Đề thi này chưa được giao cho lớp nào.</p>
              ) : (
                <div className="space-y-2">
                  {assignments.map(item => (
                    <div key={item.class_id} className="p-3 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl flex items-center justify-between gap-2 text-xs">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{item.classes?.name || 'Lớp học'}</div>
                        <div className="text-[11px] text-slate-400">Hạn: {new Date(item.due_date).toLocaleString('vi-VN')}</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleDeleteAssignment(item.class_id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Thu hồi đề khỏi lớp"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default ExamBank;