import React, { useState, useEffect } from 'react';
import { 
  X, Trash2, ArrowUp, ArrowDown, Save, Loader2, Sparkles, 
  HelpCircle, CheckCircle2, AlertCircle, Layers
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';
import { supabase } from '../../config/supabase';
import { examService } from '../../services/examService';

interface AdminExamQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: any | null;
  onQuestionsUpdated?: () => void;
  onOpenAnalysis?: (exam: any, questions: any[]) => void;
}

export const AdminExamQuestionsModal: React.FC<AdminExamQuestionsModalProps> = ({
  isOpen,
  onClose,
  exam,
  onQuestionsUpdated,
  onOpenAnalysis
}) => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen || !exam) {
      setQuestions([]);
      return;
    }

    const loadQuestions = async () => {
      setIsLoading(true);
      try {
        const { questions: loaded } = await examService.getExamFullQuestions(exam.id);
        setQuestions(loaded || []);
      } catch (err) {
        console.error("Lỗi tải câu hỏi đề thi:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadQuestions();
  }, [isOpen, exam]);

  const handleRemoveQuestion = (indexToRemove: number) => {
    if (!window.confirm(`Xác nhận xóa câu hỏi số ${indexToRemove + 1} khỏi đề thi này?`)) return;
    setQuestions(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    const newQuestions = [...questions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newQuestions.length) return;

    const temp = newQuestions[index];
    newQuestions[index] = newQuestions[targetIndex];
    newQuestions[targetIndex] = temp;
    setQuestions(newQuestions);
  };

  const handleSaveChanges = async () => {
    if (!exam) return;
    setIsSaving(true);
    try {
      // 1. Xóa liên kết câu hỏi cũ
      await supabase.from('exam_questions').delete().eq('exam_id', exam.id);

      // 2. Chèn lại liên kết câu hỏi mới theo đúng thứ tự
      if (questions.length > 0) {
        const payload = questions.map((q, idx) => ({
          exam_id: exam.id,
          exercise_id: q.id,
          sort_order: idx + 1
        }));
        const { error } = await supabase.from('exam_questions').insert(payload);
        if (error) throw error;
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);

      if (onQuestionsUpdated) {
        onQuestionsUpdated();
      }
    } catch (err: any) {
      alert("Lỗi lưu cấu hình câu hỏi: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !exam) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                Quản lý số lượng câu hỏi đề thi
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-black bg-blue-600 text-white">
                {questions.length} câu hỏi
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-heading mt-1 line-clamp-1">
              {exam.title}
            </h2>
          </div>

          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Action bar */}
        <div className="p-3 sm:p-4 bg-slate-50/70 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 dark:text-slate-400">
            Admin có thể kéo, đổi vị trí hoặc xóa bớt câu hỏi để điều chỉnh đúng cấu hình đề (chuẩn 22 câu, 34 câu hoặc 40 câu).
          </div>
          <div className="flex items-center gap-2">
            {onOpenAnalysis && questions.length > 0 && (
              <button 
                onClick={() => onOpenAnalysis(exam, questions)}
                className="btn-secondary py-1.5 px-3 rounded-lg flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 cursor-pointer"
              >
                <Sparkles size={13} className="text-indigo-600"/> Phân tích AI tất cả câu
              </button>
            )}
          </div>
        </div>

        {/* Question List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-3">
          {isLoading ? (
            <div className="py-14 text-center">
              <Loader2 size={28} className="animate-spin text-primary mx-auto mb-2" />
              <p className="text-xs text-slate-500">Đang tải danh sách câu hỏi của đề...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="py-14 text-center text-slate-400">
              <Layers size={36} className="mx-auto opacity-30 mb-2" />
              <p className="text-xs">Đề thi này hiện chưa có câu hỏi nào gắn vào.</p>
            </div>
          ) : (
            questions.map((q, idx) => {
              const levelBadge = q.level === 'Vận dụng cao' 
                ? 'bg-rose-100 text-rose-800 border-rose-200' 
                : q.level === 'Vận dụng' 
                ? 'bg-amber-100 text-amber-800 border-amber-200' 
                : q.level === 'Nhận biết'
                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                : 'bg-blue-100 text-blue-800 border-blue-200';

              return (
                <div 
                  key={q.id || idx}
                  className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-2xs flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold text-xs flex items-center justify-center shrink-0 text-slate-700 dark:text-slate-300 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${levelBadge}`}>
                          {q.level || 'Thông hiểu'}
                        </span>
                        <span className="text-[11px] font-bold text-slate-400">
                          {q.qType === 'tf' ? 'Đúng/Sai' : q.qType === 'saq' ? 'Trả lời ngắn' : 'Trắc nghiệm 4 lựa chọn'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-800 dark:text-slate-200 prose prose-xs max-w-none line-clamp-2">
                        <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                          {q.content || '(Nội dung trống)'}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>

                  {/* Actions for each question */}
                  <div className="flex items-center gap-1 shrink-0 pt-0.5">
                    <button 
                      onClick={() => handleMoveQuestion(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg disabled:opacity-30 cursor-pointer"
                      title="Chuyển lên"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button 
                      onClick={() => handleMoveQuestion(idx, 'down')}
                      disabled={idx === questions.length - 1}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg disabled:opacity-30 cursor-pointer"
                      title="Chuyển xuống"
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button 
                      onClick={() => handleRemoveQuestion(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg cursor-pointer"
                      title="Xóa câu này khỏi đề"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
          <div className="text-xs font-semibold text-slate-500">
            Hiện có: <strong className="text-slate-800 dark:text-white">{questions.length}</strong> câu hỏi trong đề
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="btn-primary py-2 px-5 text-xs flex items-center gap-1.5 font-bold cursor-pointer"
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : saveSuccess ? <CheckCircle2 size={14} /> : <Save size={14} />}
              {isSaving ? 'Đang lưu...' : saveSuccess ? 'Đã cập nhật số câu!' : 'Lưu thay đổi số câu'}
            </button>
            <button
              onClick={onClose}
              className="btn-secondary py-2 px-4 text-xs cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
