import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, Clock, Users, ArrowLeft, Search, Filter, 
  FileSpreadsheet, Award, Calendar, ChevronRight, Eye, RefreshCw, 
  ShieldCheck, AlertCircle, BarChart3, BookOpen, Send
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { supabase } from '../../config/supabase';
import { useAppStore } from '../../store/useAppStore';

export const AssignmentGrader: React.FC = () => {
  const { currentUser } = useAppStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [assignments, setAssignments] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExamId, setSelectedExamId] = useState<string>('all');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Lấy danh sách lớp
      const { data: clsData } = await supabase
        .from('classes')
        .select('id, name, code, class_members(count)')
        .order('name');
      if (clsData) setClasses(clsData);

      // 2. Lấy danh sách bài tập đã giao
      const { data: classExams } = await supabase
        .from('class_exams')
        .select(`
          id,
          class_id,
          exam_id,
          due_date,
          created_at,
          classes (id, name),
          exams (id, title, time_limit, type)
        `)
        .order('created_at', { ascending: false });

      if (classExams) {
        setAssignments(classExams);
      }

      // 3. Lấy toàn bộ lượt nộp bài
      const { data: attData } = await supabase
        .from('exam_attempts')
        .select(`
          id,
          exam_id,
          user_id,
          score,
          time_spent,
          created_at,
          users (id, full_name, email, school, student_code),
          exams (id, title)
        `)
        .order('created_at', { ascending: false });

      if (attData) {
        setAttempts(attData);
      }
    } catch (err) {
      console.error('Lỗi lấy dữ liệu giao bài:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered Assignments
  const filteredAssignments = assignments.filter((a) => {
    if (selectedClassId !== 'all' && a.class_id !== selectedClassId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const title = (a.exams?.title || '').toLowerCase();
      const clsName = (a.classes?.name || '').toLowerCase();
      if (!title.includes(q) && !clsName.includes(q)) return false;
    }
    return true;
  });

  // Export Progress to Excel
  const handleExportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      const rows = attempts.map((att, idx) => ({
        'STT': idx + 1,
        'Họ và tên': att.users?.full_name || 'Không rõ',
        'MSHS': att.users?.student_code || '---',
        'Email': att.users?.email || '',
        'Bài tập / Đề thi': att.exams?.title || 'Không rõ',
        'Điểm số': att.score,
        'Thời gian làm (giây)': att.time_spent || 0,
        'Thời điểm nộp': new Date(att.created_at).toLocaleString('vi-VN')
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Tien_Do_Nop_Bai');
      XLSX.writeFile(wb, `Tien_Do_Nop_Bai_FMATH12_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (e) {
      alert('Lỗi xuất Excel: ' + e);
    }
  };

  return (
    <div className="page-container p-6 bg-slate-50 dark:bg-slate-950 overflow-y-auto custom-scrollbar">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-xs font-bold font-heading mb-2">
              <CheckCircle2 size={13} />
              <span>Quản Lý Tiến Độ Học Tập & Giao Bài LMS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-heading m-0">
              Giao Bài & Theo Dõi Tiến Độ Nộp Bài
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Theo dõi thời gian thực tỷ lệ nộp bài, phổ điểm của từng lớp học ảo và chi tiết từng bài thi.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5 font-bold cursor-pointer rounded-xl"
            >
              <FileSpreadsheet size={14} className="text-emerald-600" /> Xuất Excel Tiến Độ
            </button>
            <button
              onClick={() => navigate('/class-manager')}
              className="btn-primary py-2 px-3.5 text-xs flex items-center gap-1.5 font-bold cursor-pointer rounded-xl"
            >
              <Users size={14} /> Quản Lý Lớp Học
            </button>
          </div>
        </div>

        {/* Toolbar lọc */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <Search size={15} className="text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo tên đề thi hoặc tên lớp..."
              className="w-full text-xs bg-transparent outline-none text-slate-800 dark:text-slate-200"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Chọn lớp:</span>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="text-xs font-bold py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-200 outline-none focus:border-primary"
            >
              <option value="all">Tất cả các lớp học</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>{cls.name} ({cls.code})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Danh sách bài tập đã giao */}
        <div className="space-y-4">
          {filteredAssignments.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-10 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center">
              <BookOpen size={36} className="text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Chưa có bài tập nào được giao</h3>
              <p className="text-xs text-slate-400 mt-1">
                Hãy vào mục Quản lý lớp học &rarr; Chọn lớp &rarr; Tab Bài tập để giao bài cho học sinh.
              </p>
            </div>
          ) : (
            filteredAssignments.map((assign) => {
              const examAttempts = attempts.filter((att) => att.exam_id === assign.exam_id);
              const scores = examAttempts.map((a) => Number(a.score || 0));
              const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '---';
              const isPastDue = assign.due_date && new Date(assign.due_date) < new Date();

              return (
                <div 
                  key={assign.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs hover:border-primary/40 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="badge-primary text-[10px] py-0.5 px-2 font-bold">
                          {assign.classes?.name || 'Lớp học'}
                        </span>
                        <span className={`text-[10px] font-bold py-0.5 px-2 rounded-full border ${
                          isPastDue 
                            ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:border-rose-900' 
                            : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900'
                        }`}>
                          {isPastDue ? 'Đã hết hạn nộp' : 'Đang mở nộp bài'}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading m-0">
                        {assign.exams?.title || 'Đề kiểm tra'}
                      </h3>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <div>
                        Hạn nộp: <strong className="text-slate-800 dark:text-slate-200">{assign.due_date ? new Date(assign.due_date).toLocaleDateString('vi-VN') : 'Không giới hạn'}</strong>
                      </div>
                      <div>
                        Điểm TB: <strong className="text-emerald-600 font-mono text-sm">{avgScore}</strong>
                      </div>
                      <div>
                        Đã nộp: <strong className="text-primary font-mono text-sm">{examAttempts.length}</strong> bài
                      </div>
                    </div>
                  </div>

                  {/* Danh sách học sinh nộp bài gần đây */}
                  {examAttempts.length > 0 && (
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Các bài nộp gần đây:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {examAttempts.slice(0, 6).map((att) => (
                          <div key={att.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 text-xs flex items-center justify-between">
                            <div>
                              <div className="font-bold text-slate-800 dark:text-slate-200">{att.users?.full_name || 'Học sinh'}</div>
                              <div className="text-[10px] text-slate-400">{new Date(att.created_at).toLocaleDateString('vi-VN')}</div>
                            </div>
                            <div className="font-mono font-black text-sm text-emerald-600">
                              {att.score}đ
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};

export default AssignmentGrader;
