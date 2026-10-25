import React, { useState, useEffect } from 'react';
import { 
  Clock, BookOpen, GraduationCap, 
  ChevronDown, ChevronRight, Loader2, Target, 
  CheckCircle2, ListChecks, FileText, Sparkles, ArrowRight, PlayCircle,
  Zap, Flame, Award, RefreshCw
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { examService } from '../../services/examService';
import { supabase } from '../../config/supabase';
import { EXAM_MATRIX_PRESETS, pickQuestionsByMatrix } from '../../utils/examMatrixUtils';

const TABS = [
  { label: 'Đề theo bài', icon: BookOpen },
  { label: 'Chuyên đề', icon: Target },
  { label: 'Đề luyện thi', icon: GraduationCap },
  { label: 'ĐGNL', icon: Sparkles },
  { label: 'VSAT', icon: FileText }
];

const QuizList = () => {
  const { currentUser } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [exams, setExams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('Đề theo bài');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const [isGeneratingMatrix, setIsGeneratingMatrix] = useState(false);
  const [isGeneratingFixErrors, setIsGeneratingFixErrors] = useState(false);

  // Tạo đề ngẫu nhiên chuẩn Ma trận Bộ GD&ĐT 2026 (22 câu)
  const handleGenerateMatrixExam = async () => {
    if (isGeneratingMatrix) return;
    setIsGeneratingMatrix(true);
    try {
      // Tải câu hỏi từ kho 2,060 câu
      const { data: exercises, error } = await supabase
        .from('exercises')
        .select('*')
        .limit(200);

      if (error || !exercises || exercises.length === 0) {
        throw new Error("Không thể tải ngân hàng câu hỏi.");
      }

      const standardPreset = EXAM_MATRIX_PRESETS[0]; // 22 câu chuẩn Bộ GD&ĐT
      const picked = pickQuestionsByMatrix(exercises, standardPreset.matrix);
      
      const customId = `matrix-exam-${Date.now()}`;
      const examTitle = `Đề Thi Thử Chuẩn Ma Trận Bộ GD&ĐT 2026 (#${Math.floor(Math.random() * 900 + 100)})`;
      const customExam = {
        id: customId,
        title: examTitle,
        description: 'Đề ngẫu nhiên chuẩn ma trận: 12 câu MCQ (Phần I) + 4 câu Đúng/Sai (Phần II) + 6 câu Trả lời ngắn (Phần III).',
        time_limit: 90 * 60,
        total_marks: 10,
        type: 'Đề luyện thi'
      };

      sessionStorage.setItem(`fmath_custom_exam_${customId}`, JSON.stringify({
        exam: customExam,
        questions: picked.picked.length > 0 ? picked.picked : exercises.slice(0, 22)
      }));

      navigate(`/quiz/${customId}/take`);
    } catch (err: any) {
      alert("Lỗi tạo đề ngẫu nhiên: " + (err.message || 'Vui lòng thử lại'));
    } finally {
      setIsGeneratingMatrix(false);
    }
  };

  // Luyện tập khắc phục lỗi sai & bẫy tư duy
  const handleFixErrorsPractice = async () => {
    if (isGeneratingFixErrors) return;
    setIsGeneratingFixErrors(true);
    try {
      // Lấy 10-12 câu hỏi vận dụng / vận dụng cao dễ gặp bẫy
      const { data: exercises, error } = await supabase
        .from('exercises')
        .select('*')
        .in('level', ['Vận dụng', 'Vận dụng cao'])
        .limit(100);

      const pool = exercises && exercises.length > 0 ? exercises : [];
      const shuffled = [...pool].sort(() => 0.5 - Math.random()).slice(0, 10);

      const customId = `error-fix-${Date.now()}`;
      const customExam = {
        id: customId,
        title: `Luyện Tập Khắc Phục Lỗi Sai & Giải Mã Bẫy Đề (#${Math.floor(Math.random() * 900 + 100)})`,
        description: 'Tập trung rèn luyện các dạng toán có bẫy nhiễu trắc nghiệm mới, củng cố điều kiện và tối ưu phản xạ.',
        time_limit: 40 * 60,
        total_marks: 10,
        type: 'Chuyên đề'
      };

      sessionStorage.setItem(`fmath_custom_exam_${customId}`, JSON.stringify({
        exam: customExam,
        questions: shuffled
      }));

      navigate(`/quiz/${customId}/take`);
    } catch (err: any) {
      alert("Lỗi khởi tạo bài luyện tập: " + (err.message || 'Vui lòng thử lại'));
    } finally {
      setIsGeneratingFixErrors(false);
    }
  };

  useEffect(() => {
    const fetchExams = async () => {
      if (!currentUser?.id) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const data = await examService.getActiveExams(currentUser.id);
        setExams(data || []);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách đề thi:", error);
      } finally {
        setIsLoading(false);
      }

      if (location.state && (location.state as any).activeTab) {
        setActiveTab((location.state as any).activeTab);
      }

      // Xử lý chuyển hướng trực tiếp từ Dashboard nếu có yêu cầu
      if (location.state && (location.state as any).mode === 'matrix_2026') {
        handleGenerateMatrixExam();
      } else if (location.state && (location.state as any).mode === 'fix_errors') {
        handleFixErrorsPractice();
      }
    };
    
    fetchExams();
  }, [currentUser, location.key]);

  const filteredExams = exams.filter(exam => exam.type === activeTab);

  const groupedExams = filteredExams.reduce((acc, exam) => {
    const group = exam.group_name?.trim() || 'Chuyên Đề Trọng Tâm';
    if (!acc[group]) acc[group] = [];
    acc[group].push(exam);
    return acc;
  }, {} as Record<string, any[]>);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupName]: prev[groupName] === false ? true : false }));
  };

  return (
    <div className="page-container animate-in fade-in duration-300">
      <div className="page-content custom-scrollbar">
        <div className="max-w-7xl mx-auto w-full space-y-6">
        
          {/* HEADER BANNER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-bold font-heading mb-2">
                <Target size={13} />
                <span>Kho Đề Tự Luyện Toán 12 Chuẩn 2026</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black font-heading text-slate-900 dark:text-white tracking-tight m-0">
                Luyện Tập Chuyên Đề & Đề Thi
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-sans mt-1">
                Lựa chọn bộ đề phù hợp theo từng chủ điểm để rèn luyện phản xạ và làm chủ ma trận đề thi mới.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Tổng số: <strong className="text-slate-900 dark:text-white font-raleway">{exams.length}</strong> đề thi</span>
            </div>
          </div>

          {/* 2 KHỐI TÍNH NĂNG ĐỘC QUYỀN CHUẨN 2026 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Đề ngẫu nhiên theo ma trận 2026 */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-50/90 via-blue-50/70 to-white dark:from-slate-900 dark:to-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 flex flex-col justify-between space-y-4 shadow-sm group">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
                    <Sparkles size={20} />
                  </div>
                  <span className="badge-fmath text-[10.5px]">Chuẩn BGD 2026</span>
                </div>
                <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white m-0">
                  Tạo Đề Ngẫu Nhiên Theo Ma Trận Thi 2026
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 m-0 leading-relaxed">
                  Tự động bốc ngẫu nhiên 22 câu từ ngân hàng 2,060 câu: 12 MCQ (Phần I) + 4 Đúng/Sai (Phần II) + 6 Trả lời ngắn (Phần III) theo đúng tỉ lệ 4 tầng nhận thức.
                </p>
              </div>

              <button
                onClick={handleGenerateMatrixExam}
                disabled={isGeneratingMatrix}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold font-heading text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-50"
              >
                {isGeneratingMatrix ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Đang bốc 22 câu chuẩn ma trận...</span>
                  </>
                ) : (
                  <>
                    <PlayCircle size={16} />
                    <span>Bắt Đầu Làm Đề Ngẫu Nhiên 2026</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>

            {/* Luyện tập khắc phục lỗi sai */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-50/90 via-rose-50/60 to-white dark:from-slate-900 dark:to-rose-950/40 border border-amber-200/80 dark:border-rose-900/60 flex flex-col justify-between space-y-4 shadow-sm group">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-rose-600 text-white flex items-center justify-center shadow-md shadow-amber-600/20">
                    <Target size={20} />
                  </div>
                  <span className="text-[10.5px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-200/70">
                    Xóa Bỏ Điểm Mù
                  </span>
                </div>
                <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white m-0">
                  Luyện Tập Khắc Phục Lỗi Sai & Bẫy Đề
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 m-0 leading-relaxed">
                  Luyện tập 10 câu hỏi có tỉ lệ sai cao, tập trung giải mã bẫy trắc nghiệm mới, củng cố điều kiện và phương pháp biến đổi nhanh.
                </p>
              </div>

              <button
                onClick={handleFixErrorsPractice}
                disabled={isGeneratingFixErrors}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 text-white font-bold font-heading text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-amber-600/25 transition-all cursor-pointer disabled:opacity-50"
              >
                {isGeneratingFixErrors ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Đang tổng hợp 10 bài tập bẫy đề...</span>
                  </>
                ) : (
                  <>
                    <Flame size={16} />
                    <span>Bắt Đầu Khắc Phục Lỗi Sai</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* TABS PHÂN LOẠI */}
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 border-b border-slate-200/80 dark:border-slate-800">
            {TABS.map(({ label, icon: Icon }) => (
              <button 
                key={label}
                onClick={() => setActiveTab(label)}
                className={`shrink-0 px-4 py-2.5 rounded-xl font-bold font-heading text-[13.5px] transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === label 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>

          {/* LOADING & EMPTY STATES */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
              <Loader2 className="animate-spin mb-3 text-indigo-600" size={34}/>
              <p className="text-sm font-medium font-sans">Đang tải danh sách bộ đề...</p>
            </div>
          ) : filteredExams.length === 0 ? (
            <div className="text-center py-16 px-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs max-w-lg mx-auto space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                <FileText size={26} />
              </div>
              <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white m-0">Chưa có đề trong danh mục này</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-sans m-0 leading-relaxed">
                Hệ thống đang liên tục cập nhật thêm các đề thi chất lượng cao cho danh mục <strong className="text-indigo-600 dark:text-indigo-400">{activeTab}</strong>.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedExams).map(([groupName, groupExams]) => {
                const isExpanded = expandedGroups[groupName] !== false;
                
                return (
                  <div key={groupName} className="space-y-3 animate-in fade-in">
                    
                    {/* Header Nhóm Đề */}
                    <div 
                      onClick={() => toggleGroup(groupName)}
                      className="flex items-center justify-between cursor-pointer py-3 px-4.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400/80 transition-all select-none shadow-2xs group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400"></div>
                        <h3 className="text-[14.5px] font-bold font-heading text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 m-0 transition-colors">
                          {groupName}
                        </h3>
                        <span className="text-[11px] font-bold font-heading px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                          {groupExams.length} đề
                        </span>
                      </div>
                      
                      <div className="text-slate-400 group-hover:text-indigo-600 transition-colors">
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </div>
                    </div>

                    {/* Grid Thẻ Đề Thi */}
                    {isExpanded && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {groupExams.map(exam => {
                          const hasAttempted = exam.myAttemptCount > 0;

                          return (
                            <div 
                              key={exam.id} 
                              className="flat-card flex flex-col justify-between hover:border-indigo-400 dark:hover:border-indigo-600 transition-all group"
                            >
                              
                              <div>
                                {/* Badges */}
                                <div className="flex justify-between items-start mb-3">
                                  <span className="badge-primary">
                                    {exam.type}
                                  </span>
                                  {hasAttempted && (
                                    <span className="badge-success flex items-center gap-1">
                                      <CheckCircle2 size={12}/> Đã làm
                                    </span>
                                  )}
                                </div>
                                
                                {/* Tên Đề Thi */}
                                <h4 className="text-[15px] font-bold font-heading text-slate-900 dark:text-white line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug mb-3">
                                  {exam.title}
                                </h4>
                                
                                {/* Meta: Số câu, Thời gian */}
                                <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-4">
                                  <span className="flex items-center gap-1.5">
                                    <ListChecks size={15} className="text-indigo-500" /> 
                                    {exam.questionsCount || 40} câu
                                  </span>
                                  <span className="flex items-center gap-1.5">
                                    <Clock size={15} className="text-cyan-500" /> 
                                    {Math.floor(exam.time_limit / 60)} phút
                                  </span>
                                </div>
                              </div>

                              {/* Footer Action */}
                              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
                                <Link 
                                  to={`/quiz/${exam.id}`} 
                                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-700 dark:text-slate-200 font-bold font-heading text-xs transition-all cursor-pointer group-hover:bg-indigo-600 group-hover:text-white shadow-2xs"
                                >
                                  <PlayCircle size={15} />
                                  <span>{hasAttempted ? 'Làm lại đề' : 'Bắt đầu làm'}</span>
                                </Link>
                                
                                {hasAttempted && (
                                  <div className="text-right px-2">
                                    <span className="block text-[9.5px] uppercase font-bold text-slate-400 font-heading">Cao nhất</span>
                                    <span className="block text-sm font-black font-raleway text-emerald-600 dark:text-emerald-400">
                                      {exam.myHighestScore || 0}
                                    </span>
                                  </div>
                                )}
                              </div>

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
    </div>
  );
};

export default QuizList;