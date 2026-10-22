import React, { useState, useEffect } from 'react';
import { 
  Clock, BookOpen, GraduationCap, 
  ChevronDown, ChevronRight, Loader2, Target, 
  CheckCircle2, ListChecks, FileText, Sparkles, ArrowRight, PlayCircle
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { examService } from '../../services/examService';

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
  
  const [exams, setExams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('Đề theo bài');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

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