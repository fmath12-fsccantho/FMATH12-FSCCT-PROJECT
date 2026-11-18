import React, { useState, useEffect } from 'react';
import { 
  X, Sparkles, Loader2, CheckCircle2, AlertTriangle, Lightbulb, 
  Layers, BarChart3, ChevronDown, ChevronUp, Save, Check, Filter
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';
import { 
  questionAiAnalyzer, 
  QuestionAnalysisResult, 
  ExamMatrixSummary 
} from '../../services/questionAiAnalyzer';
import { examService } from '../../services/examService';

interface ExamBatchAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  examTitle: string;
  examId?: string;
  questions?: any[];
  onApplyAnalysis?: (results: QuestionAnalysisResult[], matrix: ExamMatrixSummary) => void;
}

export const ExamBatchAnalysisModal: React.FC<ExamBatchAnalysisModalProps> = ({
  isOpen,
  onClose,
  examTitle,
  examId,
  questions: propQuestions,
  onApplyAnalysis
}) => {
  const [loadedQuestions, setLoadedQuestions] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [analysisResults, setAnalysisResults] = useState<QuestionAnalysisResult[] | null>(null);
  const [matrix, setMatrix] = useState<ExamMatrixSummary | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'Nhận biết' | 'Thông hiểu' | 'Vận dụng' | 'Vận dụng cao' | 'traps'>('all');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [isSavingDb, setIsSavingDb] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setAnalysisResults(null);
      setMatrix(null);
      setIsSaved(false);
      return;
    }

    const initAndAnalyze = async () => {
      let targetQuestions = propQuestions || [];

      // Nếu chưa có sẵn danh sách câu hỏi, lấy từ examService
      if ((!targetQuestions || targetQuestions.length === 0) && examId) {
        setIsAnalyzing(true);
        const { questions } = await examService.getExamFullQuestions(examId);
        targetQuestions = questions || [];
        setLoadedQuestions(targetQuestions);
      } else {
        setLoadedQuestions(targetQuestions);
      }

      if (targetQuestions.length > 0) {
        startAnalysis(targetQuestions);
      } else {
        setIsAnalyzing(false);
      }
    };

    initAndAnalyze();
  }, [isOpen, examId, propQuestions]);

  const startAnalysis = async (questionsList: any[]) => {
    setIsAnalyzing(true);
    setProgress({ current: 0, total: questionsList.length });

    try {
      const { results, matrix } = await questionAiAnalyzer.batchAnalyzeExamQuestions(
        questionsList,
        (current, total) => {
          setProgress({ current, total });
        }
      );
      setAnalysisResults(results);
      setMatrix(matrix);

      if (onApplyAnalysis) {
        onApplyAnalysis(results, matrix);
      }
    } catch (error) {
      console.error("Lỗi phân tích đề thi:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveToDatabase = async () => {
    if (!analysisResults) return;
    setIsSavingDb(true);
    const success = await questionAiAnalyzer.saveAnalysisToExercises(analysisResults);
    setIsSavingDb(false);
    if (success) {
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }
  };

  if (!isOpen) return null;

  const filteredResults = (analysisResults || []).map((res, idx) => ({
    result: res,
    originalQuestion: loadedQuestions[idx] || {},
    index: idx + 1
  })).filter(item => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'traps') return Boolean(item.result.trapsAndMistakes);
    return item.result.level === activeFilter;
  });

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* --- HEADER --- */}
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-purple-50/50 dark:from-slate-850 dark:via-indigo-950/20 dark:to-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25 shrink-0">
              <Sparkles size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  ⚡ AI Siêu Tốc (GDPT 2018)
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {loadedQuestions.length} câu hỏi
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-heading mt-1 line-clamp-1">
                Phân Tích Toàn Bộ Câu Hỏi Đề Thi: {examTitle}
              </h2>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* --- BODY --- */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-6">
          
          {/* TRẠNG THÁI ĐANG PHÂN TÍCH */}
          {isAnalyzing && (
            <div className="py-14 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <div className="absolute inset-0 rounded-2xl bg-blue-500/20 blur-xl animate-pulse"></div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xl">
                  <Loader2 size={28} className="animate-spin" />
                </div>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">
                  Đang phân tích ma trận đề thi bằng AI...
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Đang quét độ khó, bẫy sai lầm và vị trí chuẩn GDPT 2018 ({progress.current}/{progress.total} câu)
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full max-w-md bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                <div 
                  className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          {/* KẾT QUẢ PHÂN TÍCH TOÀN BỘ ĐỀ */}
          {!isAnalyzing && matrix && (
            <>
              {/* 1. KHỐI THỐNG KÊ 4 MỨC ĐỘ NHẬN THỨC */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-heading flex items-center gap-1.5">
                    <BarChart3 size={15} className="text-primary"/> Phân Bố Mức Độ Nhận Thức (Ma Trận Đề)
                  </h3>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {matrix.standardCompliance}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Nhận biết */}
                  <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300">
                    <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">Nhận biết</div>
                    <div className="text-2xl font-black font-heading mt-1">
                      {matrix.levels.nb} <span className="text-xs font-semibold opacity-75">câu ({matrix.levelPercentages.nb}%)</span>
                    </div>
                  </div>

                  {/* Thông hiểu */}
                  <div className="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800 text-blue-800 dark:text-blue-300">
                    <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">Thông hiểu</div>
                    <div className="text-2xl font-black font-heading mt-1">
                      {matrix.levels.th} <span className="text-xs font-semibold opacity-75">câu ({matrix.levelPercentages.th}%)</span>
                    </div>
                  </div>

                  {/* Vận dụng */}
                  <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800 text-amber-800 dark:text-amber-300">
                    <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">Vận dụng</div>
                    <div className="text-2xl font-black font-heading mt-1">
                      {matrix.levels.vd} <span className="text-xs font-semibold opacity-75">câu ({matrix.levelPercentages.vd}%)</span>
                    </div>
                  </div>

                  {/* Vận dụng cao */}
                  <div className="p-3.5 rounded-2xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800 text-rose-800 dark:text-rose-300">
                    <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">Vận dụng cao</div>
                    <div className="text-2xl font-black font-heading mt-1">
                      {matrix.levels.vdc} <span className="text-xs font-semibold opacity-75">câu ({matrix.levelPercentages.vdc}%)</span>
                    </div>
                  </div>
                </div>

                {/* Thanh ma trận trực quan */}
                <div className="mt-3 h-3 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div style={{ width: `${matrix.levelPercentages.nb}%` }} className="bg-emerald-500" title={`Nhận biết: ${matrix.levelPercentages.nb}%`}></div>
                  <div style={{ width: `${matrix.levelPercentages.th}%` }} className="bg-blue-500" title={`Thông hiểu: ${matrix.levelPercentages.th}%`}></div>
                  <div style={{ width: `${matrix.levelPercentages.vd}%` }} className="bg-amber-500" title={`Vận dụng: ${matrix.levelPercentages.vd}%`}></div>
                  <div style={{ width: `${matrix.levelPercentages.vdc}%` }} className="bg-rose-500" title={`Vận dụng cao: ${matrix.levelPercentages.vdc}%`}></div>
                </div>
              </div>

              {/* 2. KHỐI ĐÁNH GIÁ SƯ PHẠM */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-800/80 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-3">
                <Lightbulb size={20} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-[13px] text-indigo-950 dark:text-white">
                    Đánh giá từ Hội đồng Khảo thí FMATH12 AI:
                  </div>
                  <p className="leading-relaxed m-0 text-indigo-800 dark:text-indigo-300">
                    {matrix.recommendation}
                  </p>
                </div>
              </div>

              {/* 3. DANH SÁCH CHI TIẾT TỪNG CÂU HỎI */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-heading flex items-center gap-1.5">
                    <Layers size={15} className="text-primary"/> Chi Tiết Phân Tích Từng Câu ({filteredResults.length}/{matrix.totalQuestions})
                  </h3>

                  {/* Bộ lọc nhanh */}
                  <div className="flex flex-wrap gap-1 text-[11px] font-bold">
                    <button 
                      onClick={() => setActiveFilter('all')}
                      className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${activeFilter === 'all' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                    >
                      Tất cả ({matrix.totalQuestions})
                    </button>
                    <button 
                      onClick={() => setActiveFilter('Nhận biết')}
                      className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${activeFilter === 'Nhận biết' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'}`}
                    >
                      NB ({matrix.levels.nb})
                    </button>
                    <button 
                      onClick={() => setActiveFilter('Thông hiểu')}
                      className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${activeFilter === 'Thông hiểu' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'}`}
                    >
                      TH ({matrix.levels.th})
                    </button>
                    <button 
                      onClick={() => setActiveFilter('Vận dụng')}
                      className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${activeFilter === 'Vận dụng' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'}`}
                    >
                      VD ({matrix.levels.vd})
                    </button>
                    <button 
                      onClick={() => setActiveFilter('Vận dụng cao')}
                      className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${activeFilter === 'Vận dụng cao' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'}`}
                    >
                      VDC ({matrix.levels.vdc})
                    </button>
                    <button 
                      onClick={() => setActiveFilter('traps')}
                      className={`px-2 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${activeFilter === 'traps' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300'}`}
                    >
                      <AlertTriangle size={11} /> Có bẫy
                    </button>
                  </div>
                </div>

                {/* Danh sách Accordion */}
                <div className="space-y-2">
                  {filteredResults.map(({ result, originalQuestion, index }) => {
                    const isExpanded = expandedIndex === index;
                    const levelColors: Record<string, string> = {
                      'Nhận biết': 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
                      'Thông hiểu': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
                      'Vận dụng': 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
                      'Vận dụng cao': 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800'
                    };

                    return (
                      <div 
                        key={index}
                        className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-850 overflow-hidden shadow-2xs transition-all"
                      >
                        <div 
                          onClick={() => setExpandedIndex(isExpanded ? null : index)}
                          className="p-3 sm:p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 font-black text-xs flex items-center justify-center shrink-0 text-slate-700 dark:text-slate-300">
                              {index}
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider shrink-0 ${levelColors[result.level] || ''}`}>
                              {result.level}
                            </span>
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                              {result.topic} • <span className="text-slate-400 font-normal">{result.subTopic}</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {result.trapsAndMistakes && (
                              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">
                                <AlertTriangle size={11} /> Có bẫy
                              </span>
                            )}
                            {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="p-4 pt-1 border-t border-slate-100 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-900/40 text-xs">
                            {/* Nội dung câu hỏi */}
                            <div className="p-3 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-750">
                              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Đề bài:</div>
                              <div className="text-slate-800 dark:text-slate-200 prose prose-xs max-w-none">
                                <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                                  {originalQuestion.content || '(Nội dung câu hỏi)'}
                                </ReactMarkdown>
                              </div>
                            </div>

                            {/* Bẫy và Gợi ý giải */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {result.trapsAndMistakes && (
                                <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800 text-amber-900 dark:text-amber-200">
                                  <div className="font-bold flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1">
                                    <AlertTriangle size={13} /> Bẫy học sinh hay mắc:
                                  </div>
                                  <p className="m-0 leading-relaxed">{result.trapsAndMistakes}</p>
                                </div>
                              )}

                              {result.solutionHint && (
                                <div className="p-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800 text-blue-900 dark:text-blue-200">
                                  <div className="font-bold flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-1">
                                    <Lightbulb size={13} /> Gợi ý hướng xử lý then chốt:
                                  </div>
                                  <p className="m-0 leading-relaxed">{result.solutionHint}</p>
                                </div>
                              )}
                            </div>

                            {/* Lý giải mức độ & Tiêu chí năng lực */}
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                              <span><strong>Lý do xếp mức độ:</strong> {result.levelExplanation}</span>
                              <span><strong>Năng lực:</strong> {result.competency}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {!isAnalyzing && loadedQuestions.length === 0 && (
            <div className="py-12 text-center text-slate-400">
              <Layers size={32} className="mx-auto opacity-30 mb-2" />
              <p className="text-xs">Không tìm thấy câu hỏi nào trong đề thi này để phân tích.</p>
            </div>
          )}
        </div>

        {/* --- FOOTER ACTIONS --- */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-850">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {matrix && `Đã phân tích ${matrix.totalQuestions} câu hỏi chuẩn khung GDPT 2018`}
          </div>

          <div className="flex items-center gap-2">
            {matrix && (
              <button
                onClick={handleSaveToDatabase}
                disabled={isSavingDb}
                className="btn-primary py-2 px-4 text-xs flex items-center gap-1.5 cursor-pointer"
              >
                {isSavingDb ? <Loader2 size={14} className="animate-spin" /> : isSaved ? <Check size={14} /> : <Save size={14} />}
                {isSavingDb ? 'Đang lưu...' : isSaved ? 'Đã lưu CSDL!' : 'Lưu mức độ vào hệ thống'}
              </button>
            )}
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
