// src/components/teacher/QuestionBankPickerModal.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Search, Filter, CheckSquare, Plus, Check, Loader2, 
  ChevronRight, BookOpen, Layers, CheckCircle2, RefreshCw 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';
import { supabase } from '../../config/supabase';
import { 
  normalizeQuestionType, 
  normalizeQuestionLevel, 
  QUESTION_FORMAT_LABELS, 
  COGNITIVE_LEVEL_LABELS 
} from '../../utils/examMatrixUtils';

interface QuestionBankPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  alreadySelectedIds?: string[];
  onAddQuestions: (selectedQuestions: any[]) => void;
}

const MarkdownComponents = {
  img: ({ node, ...props }: any) => <img {...props} className="max-w-full h-auto rounded border border-slate-200 dark:border-slate-800 my-2 block shadow-xs" alt={props.alt || "Ảnh"} loading="lazy" />,
  table: ({ node, ...props }: any) => <div className="w-full overflow-x-auto my-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"><table className="w-full text-center border-collapse text-xs" {...props} /></div>,
  thead: ({ node, ...props }: any) => <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100" {...props} />,
  tbody: ({ node, ...props }: any) => <tbody className="divide-y divide-slate-200 dark:divide-slate-800" {...props} />,
  tr: ({ node, ...props }: any) => <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50" {...props} />,
  th: ({ node, ...props }: any) => <th className="p-2 border-r border-slate-200 dark:border-slate-800 last:border-r-0 font-bold whitespace-nowrap" {...props} />,
  td: ({ node, ...props }: any) => <td className="p-2 border-r border-slate-200 dark:border-slate-800 last:border-r-0" {...props} />,
};

export const QuestionBankPickerModal: React.FC<QuestionBankPickerModalProps> = ({
  isOpen,
  onClose,
  alreadySelectedIds = [],
  onAddQuestions
}) => {
  const [chapters, setChapters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChapterId, setSelectedChapterId] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<'all' | 'mcq' | 'tf' | 'saq'>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');

  // Currently checked questions in this modal
  const [checkedQuestions, setCheckedQuestions] = useState<any[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchBank = async () => {
      setIsLoading(true);
      const { data } = await supabase
        .from('chapters')
        .select(`
          id, title, sort_order, 
          lessons (
            id, title, sort_order, 
            exercises (id, content, options, correct_answer, explanation, level, type, image_url)
          )
        `)
        .order('sort_order', { ascending: true });

      if (data) setChapters(data);
      setIsLoading(false);
    };

    fetchBank();
  }, [isOpen]);

  // Flatten all exercises with chapter & lesson titles
  const allExercises = useMemo(() => {
    const list: any[] = [];
    chapters.forEach(chap => {
      chap.lessons?.forEach((les: any) => {
        les.exercises?.forEach((ex: any) => {
          list.push({
            ...ex,
            chapterId: chap.id,
            chapterTitle: chap.title,
            lessonId: les.id,
            lessonTitle: les.title,
          });
        });
      });
    });
    return list;
  }, [chapters]);

  // Filter exercises
  const filteredExercises = useMemo(() => {
    return allExercises.filter(ex => {
      if (selectedChapterId !== 'all' && ex.chapterId !== selectedChapterId) return false;
      
      const qType = normalizeQuestionType(ex);
      if (typeFilter !== 'all' && qType !== typeFilter) return false;

      const qLevel = normalizeQuestionLevel(ex.level);
      if (levelFilter !== 'all' && qLevel !== levelFilter) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const contentMatch = (ex.content || '').toLowerCase().includes(query);
        const explanationMatch = (ex.explanation || '').toLowerCase().includes(query);
        if (!contentMatch && !explanationMatch) return false;
      }

      return true;
    });
  }, [allExercises, selectedChapterId, typeFilter, levelFilter, searchQuery]);

  if (!isOpen) return null;

  const toggleCheck = (q: any) => {
    const isChecked = checkedQuestions.some(item => item.id === q.id);
    if (isChecked) {
      setCheckedQuestions(prev => prev.filter(item => item.id !== q.id));
    } else {
      setCheckedQuestions(prev => [...prev, q]);
    }
  };

  const handleSelectAllFiltered = () => {
    const newItems = filteredExercises.filter(q => 
      !checkedQuestions.some(cq => cq.id === q.id) && 
      !alreadySelectedIds.includes(q.id)
    );
    setCheckedQuestions(prev => [...prev, ...newItems]);
  };

  const handleDeselectAll = () => {
    setCheckedQuestions([]);
  };

  const handleConfirmAdd = () => {
    if (checkedQuestions.length === 0) {
      alert("Vui lòng tick chọn ít nhất 1 câu hỏi để thêm vào đề!");
      return;
    }
    onAddQuestions(checkedQuestions);
    setCheckedQuestions([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col h-[90vh] overflow-hidden animate-in zoom-in-95">
        
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <BookOpen size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight font-heading">
                Thêm câu hỏi từ Ngân hàng câu hỏi
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
                Lọc nhanh theo Chương trình, Dạng thức câu hỏi và Mức độ năng lực chuẩn GDPT 2018
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* FILTERS TOOLBAR */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            
            {/* TÌM KIẾM TỪ KHÓA */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm nội dung, công thức..."
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* LỌC THEO CHƯƠNG */}
            <div>
              <select
                value={selectedChapterId}
                onChange={e => setSelectedChapterId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">📚 Tất cả các Chương</option>
                {chapters.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>

            {/* LỌC THEO DẠNG THỨC */}
            <div>
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">📝 Tất cả dạng thức</option>
                <option value="mcq">Phần I: Trắc nghiệm 4 lựa chọn (MCQ)</option>
                <option value="tf">Phần II: Trắc nghiệm Đúng / Sai (TF)</option>
                <option value="saq">Phần III: Trắc nghiệm Trả lời ngắn (SAQ)</option>
              </select>
            </div>

            {/* LỌC THEO MỨC ĐỘ NĂNG LỰC */}
            <div>
              <select
                value={levelFilter}
                onChange={e => setLevelFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">🎯 Tất cả mức độ năng lực</option>
                <option value="Nhận biết">🟢 Nhận biết (NB)</option>
                <option value="Thông hiểu">🔵 Thông hiểu (TH)</option>
                <option value="Vận dụng">🟠 Vận dụng (VD)</option>
                <option value="Vận dụng cao">🔴 Vận dụng cao (VDC)</option>
              </select>
            </div>
          </div>

          {/* DÒNG TIỆN ÍCH CHỌN NHANH */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
            <div className="text-slate-500 dark:text-slate-400 font-medium">
              Tìm thấy <b className="text-slate-900 dark:text-white">{filteredExercises.length}</b> câu hỏi phù hợp
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="btn-outline py-1 px-2.5 text-xs text-blue-600 dark:text-blue-400 font-bold"
              >
                + Chọn tất cả ({filteredExercises.length})
              </button>
              {checkedQuestions.length > 0 && (
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="btn-outline py-1 px-2.5 text-xs text-rose-600 font-bold"
                >
                  Bỏ chọn tất cả
                </button>
              )}
            </div>
          </div>
        </div>

        {/* QUESTION LIST */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-3 bg-slate-50/50 dark:bg-slate-950/40">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-slate-400">
              <Loader2 size={36} className="animate-spin text-blue-500 mb-3" />
              <p className="text-sm font-medium">Đang tải câu hỏi từ Ngân hàng...</p>
            </div>
          ) : filteredExercises.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-slate-400 text-center">
              <Layers size={40} className="opacity-40 mb-3" />
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Không tìm thấy câu hỏi phù hợp với bộ lọc</p>
              <p className="text-xs text-slate-400">Hãy thử đổi từ khóa tìm kiếm hoặc chọn "Tất cả dạng thức"</p>
            </div>
          ) : (
            filteredExercises.map(q => {
              const isAlreadyInExam = alreadySelectedIds.includes(q.id);
              const isChecked = checkedQuestions.some(cq => cq.id === q.id);
              const qType = normalizeQuestionType(q);
              const qLevel = normalizeQuestionLevel(q.level);
              const typeInfo = QUESTION_FORMAT_LABELS[qType];
              const levelInfo = COGNITIVE_LEVEL_LABELS[qLevel];

              return (
                <div
                  key={q.id}
                  onClick={() => !isAlreadyInExam && toggleCheck(q)}
                  className={`p-4 rounded-xl border transition-all ${
                    isAlreadyInExam
                      ? 'border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/40 opacity-60 cursor-not-allowed'
                      : isChecked
                      ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/40 shadow-xs cursor-pointer'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer shadow-2xs'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1 shrink-0">
                      {isAlreadyInExam ? (
                        <div className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-500">
                          Đã có trong đề
                        </div>
                      ) : isChecked ? (
                        <div className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center">
                          <Check size={14} />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-md border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850"></div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* BADGES */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${typeInfo.badgeClass}`}>
                          {typeInfo.short}
                        </span>
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${levelInfo.badgeClass}`}>
                          {levelInfo.label}
                        </span>
                        {q.lessonTitle && (
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs">
                            Bài: {q.lessonTitle}
                          </span>
                        )}
                      </div>

                      {/* NỘI DUNG CÂU HỎI */}
                      <div className="prose prose-sm max-w-none text-slate-800 dark:text-slate-200 text-xs leading-relaxed line-clamp-3 m-0 [&_.katex-display]:my-1">
                        <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]} components={MarkdownComponents}>
                          {q.content || ''}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/80 dark:bg-slate-850 shrink-0">
          <div className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2">
            <span>Đã chọn:</span>
            <span className="text-base font-black text-blue-600 dark:text-blue-400 font-ui px-2.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800">
              {checkedQuestions.length} câu hỏi
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline px-4 py-2 text-xs flex-1 sm:flex-none justify-center"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirmAdd}
              disabled={checkedQuestions.length === 0}
              className="btn-primary px-6 py-2 text-xs flex-1 sm:flex-none justify-center gap-2 shadow-sm font-bold disabled:opacity-50"
            >
              <Plus size={16} /> Thêm {checkedQuestions.length > 0 ? `${checkedQuestions.length} câu` : ''} vào đề
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
