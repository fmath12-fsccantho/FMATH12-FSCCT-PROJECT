import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Save, Database, Target, CheckSquare, Trash2, Loader2, 
  ChevronRight, PlusCircle, Sparkles, RefreshCcw, FileCode2, X, Copy, 
  Check, LayoutTemplate, Settings, Search, Filter, Layers, ListFilter
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';
import { supabase } from '../../config/supabase';
import { useAppStore } from '../../store/useAppStore';
import { canApproveExam } from '../../utils/permissionUtils';
import { 
  calculateQuestionMatrix, 
  normalizeQuestionType, 
  normalizeQuestionLevel,
  QUESTION_FORMAT_LABELS,
  COGNITIVE_LEVEL_LABELS
} from '../../utils/examMatrixUtils';
import { ExamMatrixSummary } from '../../components/teacher/ExamMatrixSummary';
import { AutoExamMatrixModal } from '../../components/teacher/AutoExamMatrixModal';

const AI_PROMPT = `Bạn là một chuyên gia Toán học và kỹ sư dữ liệu. 
Nhiệm vụ: Đọc đề thi dưới đây. ĐẶC BIỆT LƯU Ý: Giáo viên đã cung cấp sẵn đáp án đúng trong đề (bằng cách gạch chân, in đậm, bôi đỏ, có dấu * ở phương án đúng, hoặc để bảng đáp án ở cuối file). 
Bạn PHẢI dò tìm và trích xuất chính xác đáp án này làm \`correct_answer\`. TUYỆT ĐỐI KHÔNG tự giải và chọn đáp án khác với ý đồ của giáo viên. 
Sau khi lấy được đáp án của giáo viên, hãy tự động soạn phần \`explanation\` (lời giải chi tiết) sao cho logic và dẫn đến đúng đáp án đó. 
Cuối cùng chuyển 100% nội dung sang mảng JSON. 

QUY ƯỚC QUAN TRỌNG CẦN TUÂN THỦ:
1. BẢNG BIỂU & CÔNG THỨC (LATEX): 
   - ĐƯỢC PHÉP dùng LaTeX để vẽ Bảng biến thiên, Bảng xét dấu. LƯU Ý TỐI QUAN TRỌNG: Bạn PHẢI escape dấu gạch chéo ngược (VD: viết \\\\sqrt thay vì \\sqrt, \\\\begin thay vì \\begin).
   - TUYỆT ĐỐI KHÔNG SỬ DỤNG \\( VÀ \\) ĐỂ BỌC CÔNG THỨC TOÁN. BẮT BUỘC PHẢI DÙNG DẤU $ CHO CÔNG THỨC NGẮN VÀ $$ CHO KHỐI CÔNG THỨC. (Ví dụ ĐÚNG: $y = x^2$, $\\frac{1}{2}$. Ví dụ SAI: \\( y = x^2 \\))
   - NẾU CÓ BẢNG BIỂU: Phải dùng định dạng Markdown Table chuẩn và BẮT BUỘC dùng \\n để xuống dòng giữa các hàng. (VD: | Cột 1 | Cột 2 |\\n|---|---|\\n| A | B |). Tuyệt đối không viết liền bảng trên 1 dòng.
2. CHÈN ẢNH: Nếu câu hỏi có hình minh họa/đồ thị, BẮT BUỘC chèn đúng cụm từ "CẦN CHÈN ẢNH" vào vị trí đó.

CẤU TRÚC JSON CHUẨN 2025:
1. Trắc nghiệm 4 đáp án (type: "mcq")
{ "type": "mcq", "level": "Nhận biết", "content": "Nội dung...", "image_url": null, "options": [ {"id": "A", "text": "..."} ], "correct_answer": "A", "explanation": "..." }

2. Trắc nghiệm Đúng/Sai (type: "tf")
{ "type": "tf", "level": "Thông hiểu", "content": "Nội dung...", "image_url": null, "options": [ {"id": "a", "text": "..."} ], "correct_answer": { "a": true, "b": false, "c": true, "d": false }, "explanation": "..." }

3. Trả lời ngắn (type: "saq")
{ "type": "saq", "level": "Vận dụng", "content": "Nội dung...", "image_url": null, "options": [], "correct_answer": "12.5", "explanation": "..." }

TRẢ VỀ DUY NHẤT MẢNG JSON BẮT ĐẦU BẰNG [ VÀ KẾT THÚC BẰNG ].
ĐỀ THI:
[DÁN ĐỀ THI VÀO ĐÂY]`;

const TABS = ['Đề theo bài', 'Chuyên đề', 'Đề luyện thi', 'ĐGNL', 'VSAT'];

const MarkdownComponents = {
  img: ({ node, ...props }: any) => <img {...props} className="max-w-full h-auto rounded border border-slate-200 dark:border-slate-800 my-4 block shadow-sm" alt={props.alt || "Ảnh"} loading="lazy" />,
  table: ({ node, ...props }: any) => <div className="w-full overflow-x-auto my-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900"><table className="w-full text-center border-collapse text-[14px]" {...props} /></div>,
  thead: ({ node, ...props }: any) => <thead className="bg-slate-50 dark:bg-slate-800 border-b-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100" {...props} />,
  tbody: ({ node, ...props }: any) => <tbody className="divide-y divide-slate-200 dark:divide-slate-800" {...props} />,
  tr: ({ node, ...props }: any) => <tr className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50" {...props} />,
  th: ({ node, ...props }: any) => <th className="p-2 border-r border-slate-200 dark:border-slate-800 last:border-r-0 font-bold whitespace-nowrap align-middle" {...props} />,
  td: ({ node, ...props }: any) => <td className="p-2 border-r border-slate-200 dark:border-slate-800 last:border-r-0 align-middle first:font-bold first:bg-slate-50 dark:first:bg-slate-800 first:border-r-2" {...props} />,
};

const ExamCreator = () => {
  const navigate = useNavigate();
  const { currentUser } = useAppStore();
  
  const [chapters, setChapters] = useState<any[]>([]);
  const [expandedChapterId, setExpandedChapterId] = useState<string>("");
  const [expandedLessonId, setExpandedLessonId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // States Bộ lọc Ngân hàng Câu hỏi
  const [bankSearch, setBankSearch] = useState("");
  const [bankTypeFilter, setBankTypeFilter] = useState<'all' | 'mcq' | 'tf' | 'saq'>('all');
  const [bankLevelFilter, setBankLevelFilter] = useState<string>('all');

  // States Đề thi đang tạo
  const [examConfig, setExamConfig] = useState({
    title: '',
    type: 'Đề theo bài', 
    timeLimit: 15,
    groupName: '',
    gradingType: 'standard'
  });
  const [selectedQuestions, setSelectedQuestions] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // States Modal Ma trận & JSON
  const [showAutoMatrixModal, setShowAutoMatrixModal] = useState(false);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const fetchBank = async () => {
      setIsLoading(true);
      const { data } = await supabase
        .from('chapters')
        .select(`id, title, sort_order, lessons (id, title, sort_order, exercises (id, content, options, correct_answer, explanation, level, type, image_url))`)
        .order('sort_order', { ascending: true });
      if (data) {
        setChapters(data);
        if (data.length > 0) setExpandedChapterId(data[0].id);
      }
      setIsLoading(false);
    };
    fetchBank();
  }, []);

  // Tính toán ma trận số lượng câu hỏi trong đề hiện tại
  const matrixStats = useMemo(() => {
    return calculateQuestionMatrix(selectedQuestions);
  }, [selectedQuestions]);

  // Toàn bộ câu hỏi phẳng trong kho dữ liệu phục vụ bộ sinh Ma trận
  const allAvailableQuestions = useMemo(() => {
    const pool: any[] = [];
    chapters.forEach(chap => {
      chap.lessons?.forEach((les: any) => {
        if (les.exercises && les.exercises.length > 0) {
          les.exercises.forEach((ex: any) => {
            pool.push({
              ...ex,
              chapterTitle: chap.title,
              lessonTitle: les.title
            });
          });
        }
      });
    });
    return pool;
  }, [chapters]);

  // Lọc câu hỏi trong từng bài học theo bộ lọc dạng thức và mức độ
  const filterQuestionItem = (q: any) => {
    const qType = normalizeQuestionType(q);
    if (bankTypeFilter !== 'all' && qType !== bankTypeFilter) return false;

    const qLevel = normalizeQuestionLevel(q.level);
    if (bankLevelFilter !== 'all' && qLevel !== bankLevelFilter) return false;

    if (bankSearch.trim()) {
      const query = bankSearch.toLowerCase();
      const contentMatch = (q.content || '').toLowerCase().includes(query);
      const explanationMatch = (q.explanation || '').toLowerCase().includes(query);
      if (!contentMatch && !explanationMatch) return false;
    }
    return true;
  };

  const toggleQuestion = (question: any) => {
    const isExists = selectedQuestions.find(q => q.id === question.id);
    if (isExists) setSelectedQuestions(prev => prev.filter(q => q.id !== question.id));
    else setSelectedQuestions(prev => [...prev, question]);
  };

  const removeQuestion = (questionId: string) => {
    setSelectedQuestions(prev => prev.filter(q => q.id !== questionId));
  };

  const handleApplyMatrixQuestions = (picked: any[], matrixTitle: string) => {
    setSelectedQuestions(picked);
    if (!examConfig.title) {
      setExamConfig(prev => ({
        ...prev,
        title: matrixTitle,
        type: 'Đề luyện thi',
        timeLimit: picked.length >= 40 ? 90 : picked.length >= 20 ? 60 : 45
      }));
    }
  };

  const handleSelectAllInLesson = (exercises: any[]) => {
    const filtered = exercises.filter(filterQuestionItem);
    const newItems = filtered.filter(f => !selectedQuestions.some(sq => sq.id === f.id));
    setSelectedQuestions(prev => [...prev, ...newItems]);
  };

  const handleSaveExam = async () => {
    if (!examConfig.title.trim()) return alert("Vui lòng nhập Tên đề thi!");
    if (selectedQuestions.length === 0) return alert("Vui lòng chọn ít nhất 1 câu hỏi vào đề!");
    
    setIsSaving(true);
    try {
      const isAutoApproved = canApproveExam(currentUser);
      const initialStatus = isAutoApproved ? 'active' : 'pending';
      const approvalTag = isAutoApproved ? 'approved' : 'pending_approval';

      const { data: newExam, error: examError } = await supabase.from('exams').insert({
        teacher_id: currentUser?.id, 
        title: examConfig.title, 
        type: examConfig.type,
        time_limit: examConfig.timeLimit * 60, 
        status: initialStatus, 
        group_name: examConfig.groupName,
        tags: [examConfig.type, `${selectedQuestions.length} câu`, `grading_type:${examConfig.gradingType}`, approvalTag]
      }).select().single();
      if (examError) throw examError;

      const examQuestionsData = selectedQuestions.map((q, index) => ({ exam_id: newExam.id, exercise_id: q.id, sort_order: index + 1 }));
      const { error: eqError } = await supabase.from('exam_questions').insert(examQuestionsData);
      if (eqError) throw eqError;

      if (isAutoApproved) {
        alert("Lưu Đề thi thành công!");
      } else {
        alert("🎉 Đề thi đã được tạo và gửi tới Ban Quản Trị (Admin) để duyệt lại trước khi xuất bản chính thức vào Ngân hàng đề thi chung!");
      }
      navigate('/exam-bank', { state: { activeTab: examConfig.type } }); 
    } catch (error: any) { 
      console.error("Lỗi khi lưu đề:", error);
      if (error?.message?.includes('row-level security') || error?.code === '42501') {
        alert("Lỗi lưu đề: Bảng 'exams' trên Supabase đang bật Row-Level Security (RLS) chặn ghi dữ liệu.\n\nCách xử lý nhanh nhất (30 giây):\nVào Supabase Dashboard -> SQL Editor -> Chạy câu lệnh:\nALTER TABLE exams DISABLE ROW LEVEL SECURITY;");
      } else {
        alert("Lỗi khi lưu đề: " + error.message); 
      }
    } finally { setIsSaving(false); }
  };

  const handleCopyPrompt = () => { navigator.clipboard.writeText(AI_PROMPT); setIsCopied(true); setTimeout(() => setIsCopied(false), 2000); };
  
  const handleImportExamJson = async () => {
    if (!examConfig.title.trim()) return alert("Vui lòng đặt Tên đề thi trước khi Xuất bản!");
    if (!jsonInput.trim()) return alert("Vui lòng dán kết quả JSON từ AI vào!");
    setIsSaving(true);

    try {
      const jsonMatch = jsonInput.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (!jsonMatch) throw new Error("JSON không hợp lệ.");
      const parsedQuestions = JSON.parse(jsonMatch[0]);

      const isAutoApproved = canApproveExam(currentUser);
      const initialStatus = isAutoApproved ? 'active' : 'pending';
      const approvalTag = isAutoApproved ? 'approved' : 'pending_approval';

      const { data: newExam, error: examError } = await supabase.from('exams').insert({
        teacher_id: currentUser?.id, 
        title: examConfig.title, 
        type: examConfig.type,
        time_limit: examConfig.timeLimit * 60, 
        status: initialStatus, 
        group_name: examConfig.groupName, 
        tags: [examConfig.type, `${parsedQuestions.length} câu`, "Chuẩn 2025", `grading_type:${examConfig.gradingType}`, approvalTag]
      }).select().single();
      if (examError) throw examError;

      const { data: fallbackLesson } = await supabase.from('lessons').select('id').limit(1).maybeSingle();
      const targetLessonId = fallbackLesson?.id || null;

      const insertPayload = parsedQuestions.map((q: any, index: number) => ({
        lesson_id: targetLessonId, content: q.content, type: q.type || 'mcq', level: q.level || 'Nhận biết',
        options: q.options || [], correct_answer: q.correct_answer, explanation: q.explanation || '', 
        image_url: q.image_url || null, sort_order: index + 1
      }));

      const { data: insertedExs, error: exError } = await supabase.from('exercises').insert(insertPayload).select();
      if (exError) throw exError;

      const eqPayload = insertedExs.map((ex, i) => ({ exam_id: newExam.id, exercise_id: ex.id, sort_order: i + 1 }));
      await supabase.from('exam_questions').insert(eqPayload);

      if (isAutoApproved) {
        alert(`Tuyệt vời! Đã xuất bản thành công Đề thi với ${insertedExs.length} câu.`);
      } else {
        alert(`🎉 Đóng góp Đề thi thành công với ${insertedExs.length} câu! Đề thi đã được gửi tới Ban Quản Trị (Admin) để duyệt lại.`);
      }
      setShowJsonModal(false); 
      navigate('/exam-bank', { state: { activeTab: examConfig.type } });
    } catch (error: any) { 
      console.error("Lỗi xuất bản đề:", error);
      if (error?.message?.includes('row-level security') || error?.code === '42501') {
        alert("Lỗi xuất bản: Bảng 'exams' trên Supabase đang bật Row-Level Security (RLS) chặn ghi dữ liệu.\n\nCách xử lý nhanh nhất (30 giây):\nVào Supabase Dashboard -> SQL Editor -> Chạy câu lệnh:\nALTER TABLE exams DISABLE ROW LEVEL SECURITY;");
      } else {
        alert("Lỗi: " + error.message); 
      }
    } finally { setIsSaving(false); }
  };

  return (
    <div className="page-container relative animate-in fade-in">
      <div className="page-content custom-scrollbar">
        <div className="max-w-screen-2xl mx-auto w-full">
          
          {/* HEADER TRANG */}
          <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <Link to="/exam-bank" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold transition-colors text-sm">
              <ArrowLeft size={16} /> Về Ngân hàng Đề
            </Link>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowAutoMatrixModal(true)}
                className="btn-primary px-4 py-2 flex items-center justify-center gap-2 text-xs font-bold shadow-sm"
              >
                <Sparkles size={16} /> Sinh đề theo Ma trận
              </button>
              <button 
                type="button"
                onClick={() => setShowJsonModal(true)} 
                className="btn-outline px-4 py-2 flex items-center justify-center gap-2 text-xs font-bold"
              >
                <FileCode2 size={16} /> Nhập đề AI (JSON)
              </button>
            </div>
          </div>

          {/* =========================================================
              THÔNG KÊ MA TRẬN SỐ LƯỢNG CÂU HỎI TRONG ĐỀ (REAL-TIME)
              ========================================================= */}
          <ExamMatrixSummary 
            stats={matrixStats}
            targetStandard={examConfig.gradingType === 'standard' || examConfig.type === 'Đề luyện thi'}
            onOpenAutoMatrix={() => setShowAutoMatrixModal(true)}
            className="mb-6"
          />

          <div className="flex flex-col lg:flex-row gap-6 h-full min-h-[70vh]">
            
            {/* ==========================================
                CỘT TRÁI: KHO CÂU HỎI TỪ CƠ SỞ DỮ LIỆU
                ========================================== */}
            <div className="w-full lg:w-1/2 shrink-0 flex flex-col">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 h-full flex flex-col max-h-[82vh]">
                
                {/* TIÊU ĐỀ KHO */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                    <Database className="text-blue-600 dark:text-blue-400" size={20} />
                    <h3 className="font-bold text-base font-heading m-0 uppercase tracking-wider">Ngân hàng Câu hỏi</h3>
                  </div>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Kho: <b className="text-slate-900 dark:text-white">{allAvailableQuestions.length} câu</b>
                  </span>
                </div>

                {/* BỘ LỌC DẠNG THỨC & MỨC ĐỘ NĂNG LỰC */}
                <div className="mb-4 space-y-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={bankSearch}
                      onChange={e => setBankSearch(e.target.value)}
                      placeholder="Tìm từ khóa, công thức câu hỏi..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Dạng thức</label>
                      <select
                        value={bankTypeFilter}
                        onChange={e => setBankTypeFilter(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">Tất cả dạng thức</option>
                        <option value="mcq">Phần I: MCQ (4 lựa chọn)</option>
                        <option value="tf">Phần II: Đúng / Sai (TF)</option>
                        <option value="saq">Phần III: Trả lời ngắn (SAQ)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mức độ năng lực</label>
                      <select
                        value={bankLevelFilter}
                        onChange={e => setBankLevelFilter(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">Tất cả mức độ</option>
                        <option value="Nhận biết">🟢 Nhận biết (NB)</option>
                        <option value="Thông hiểu">🔵 Thông hiểu (TH)</option>
                        <option value="Vận dụng">🟠 Vận dụng (VD)</option>
                        <option value="Vận dụng cao">🔴 Vận dụng cao (VDC)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* DANH SÁCH CHƯƠNG / BÀI HỌC / CÂU HỎI */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2.5">
                  {isLoading ? ( 
                    <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-500" size={28}/></div>
                  ) : chapters.length === 0 ? ( 
                    <div className="text-center p-8 text-xs font-medium text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-850">
                      Kho dữ liệu trống. Hãy tạo câu hỏi trong Lý Thuyết trước.
                    </div>
                  ) : chapters.map(chapter => {
                    const isChapterExpanded = expandedChapterId === chapter.id;

                    return (
                      <div key={chapter.id} className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                        
                        {/* Tiêu đề Chương */}
                        <button 
                          onClick={() => setExpandedChapterId(isChapterExpanded ? "" : chapter.id)} 
                          className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border-b border-slate-200 dark:border-slate-800"
                        >
                          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white text-left truncate">{chapter.title}</span>
                          <ChevronRight size={16} className={`transform transition-transform text-slate-400 shrink-0 ${isChapterExpanded ? 'rotate-90' : ''}`} />
                        </button>
                        
                        {/* Nội dung Chương (Danh sách Bài học) */}
                        {isChapterExpanded && (
                          <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                            {chapter.lessons.map((lesson: any) => {
                              const isLessonExpanded = expandedLessonId === lesson.id;
                              const filteredInLesson = (lesson.exercises || []).filter(filterQuestionItem);

                              return (
                                <div key={lesson.id}>
                                  
                                  {/* Tiêu đề Bài học */}
                                  <button 
                                    onClick={() => setExpandedLessonId(isLessonExpanded ? "" : lesson.id)} 
                                    className="w-full flex items-center justify-between p-2.5 pl-5 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors"
                                  >
                                    <span className="font-semibold text-xs text-slate-700 dark:text-slate-300 text-left truncate">{lesson.title}</span>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <span className="text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                                        {filteredInLesson.length} câu
                                      </span>
                                      <ChevronRight size={14} className={`text-slate-400 transition-transform ${isLessonExpanded ? 'rotate-90' : ''}`} />
                                    </div>
                                  </button>
                                  
                                  {/* Nội dung Bài học (Danh sách Câu hỏi) */}
                                  {isLessonExpanded && (
                                    <div className="bg-slate-50/70 dark:bg-slate-950/50 p-2.5 space-y-2 border-t border-slate-100 dark:border-slate-800">
                                      {filteredInLesson.length > 0 && (
                                        <div className="flex justify-end pb-1">
                                          <button
                                            type="button"
                                            onClick={() => handleSelectAllInLesson(lesson.exercises)}
                                            className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                                          >
                                            + Chọn tất cả câu trong bài ({filteredInLesson.length})
                                          </button>
                                        </div>
                                      )}

                                      {filteredInLesson.length === 0 ? (
                                        <div className="p-3 text-center text-xs text-slate-400 italic">
                                          Không có câu hỏi nào khớp với bộ lọc dạng thức/mức độ này.
                                        </div>
                                      ) : (
                                        filteredInLesson.map((q: any) => {
                                          const isSelected = selectedQuestions.some(sq => sq.id === q.id);
                                          const qType = normalizeQuestionType(q);
                                          const qLevel = normalizeQuestionLevel(q.level);
                                          const typeInfo = QUESTION_FORMAT_LABELS[qType];
                                          const levelInfo = COGNITIVE_LEVEL_LABELS[qLevel];

                                          return (
                                            <div 
                                              key={q.id} 
                                              onClick={() => toggleQuestion(q)} 
                                              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                                                isSelected 
                                                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 shadow-xs' 
                                                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-600'
                                              }`}
                                            >
                                              <div className="flex gap-3">
                                                <div className="mt-0.5 shrink-0">
                                                  {isSelected ? (
                                                    <CheckSquare size={16} className="text-emerald-600 dark:text-emerald-400"/>
                                                  ) : (
                                                    <div className="w-4 h-4 rounded-[4px] border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"></div>
                                                  )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                  <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                                                    <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${typeInfo.badgeClass}`}>
                                                      {typeInfo.short}
                                                    </span>
                                                    <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${levelInfo.badgeClass}`}>
                                                      {levelInfo.short}
                                                    </span>
                                                  </div>
                                                  <div className="prose prose-sm max-w-none text-slate-800 dark:text-slate-200 text-xs line-clamp-2 m-0 leading-relaxed [&_.katex-display]:my-1">
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
              </div>
            </div>

            {/* ==========================================
                CỘT PHẢI: CẤU HÌNH ĐỀ & GIỎ HÀNG
                ========================================== */}
            <div className="w-full lg:w-1/2 flex flex-col gap-6 h-full">
              
              {/* Box 1: Cấu hình */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 shrink-0">
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading mb-4 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 uppercase tracking-wider">
                  <Target size={18} className="text-blue-500"/> Thiết lập Đề thi
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Tên đề thi</label>
                    <input 
                      type="text" 
                      value={examConfig.title} 
                      onChange={e => setExamConfig({...examConfig, title: e.target.value})} 
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold" 
                      placeholder="VD: Đề thi thử Toán THPT QG 2025"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Bộ đề / Nhóm đề (Tùy chọn)</label>
                    <input 
                      type="text" 
                      value={examConfig.groupName} 
                      onChange={e => setExamConfig({...examConfig, groupName: e.target.value})} 
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold" 
                      placeholder="VD: Bộ đề thi thử Sở Hà Nội"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Phân loại</label>
                    <select 
                      value={examConfig.type} 
                      onChange={e => setExamConfig({...examConfig, type: e.target.value})} 
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold"
                    >
                      {TABS.map(tab => (
                        <option key={tab} value={tab}>{tab}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Thời gian làm bài (Phút)</label>
                    <input 
                      type="number" 
                      value={examConfig.timeLimit} 
                      onChange={e => setExamConfig({...examConfig, timeLimit: Number(e.target.value)})} 
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Cách chia điểm</label>
                    <select 
                      value={examConfig.gradingType} 
                      onChange={e => setExamConfig({...examConfig, gradingType: e.target.value})} 
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold"
                    >
                      <option value="standard">Đề thi chuẩn (Định mức câu hỏi theo cấu trúc Bộ 2025)</option>
                      <option value="custom">Đề thi tuỳ chỉnh (Chia điểm đều cho tất cả câu)</option>
                    </select>
                  </div>
                </div>
                <button 
                  onClick={handleSaveExam} 
                  disabled={isSaving} 
                  className="btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-2 font-bold shadow-sm disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} 
                  {isSaving ? 'Đang khởi tạo...' : `LƯU ĐỀ THI (${selectedQuestions.length} CÂU)`}
                </button>
              </div>

              {/* Box 2: Giỏ hàng */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col flex-1 min-h-[300px] overflow-hidden max-h-[80vh]">
                <div className="flex justify-between items-center mb-4 border-b border-slate-200 dark:border-slate-800 pb-3 shrink-0">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider font-heading m-0">Giỏ hàng câu hỏi trong đề</h3>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setSelectedQuestions([])} 
                      className="text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1"
                    >
                      <RefreshCcw size={12}/> Làm trống
                    </button>
                    <div className="font-bold text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-2.5 py-1 rounded-lg font-ui">
                      {selectedQuestions.length} câu
                    </div>
                  </div>
                </div>

                {selectedQuestions.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 bg-slate-50 dark:bg-slate-850">
                    <PlusCircle size={32} className="mb-2 opacity-50"/>
                    <p className="font-medium text-center text-xs m-0">
                      Hãy tick chọn câu hỏi ở kho bên trái,<br/>hoặc dùng chức năng <b>"Sinh đề theo Ma trận"</b>.
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2.5">
                    {selectedQuestions.map((q, i) => {
                      const qType = normalizeQuestionType(q);
                      const qLevel = normalizeQuestionLevel(q.level);
                      const typeInfo = QUESTION_FORMAT_LABELS[qType];
                      const levelInfo = COGNITIVE_LEVEL_LABELS[qLevel];

                      return (
                        <div key={q.id || i} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-3 group hover:border-blue-400 dark:hover:border-blue-600 transition-colors shadow-2xs">
                          <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                              <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${typeInfo.badgeClass}`}>
                                {typeInfo.short}
                              </span>
                              <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${levelInfo.badgeClass}`}>
                                {levelInfo.short}
                              </span>
                            </div>
                            <div className="prose prose-sm max-w-none text-xs text-slate-800 dark:text-slate-200 mb-0 leading-relaxed [&_.katex-display]:my-1">
                              <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]} components={MarkdownComponents}>
                                {q.content || ''}
                              </ReactMarkdown>
                            </div>
                          </div>
                          <button 
                            onClick={() => removeQuestion(q.id)} 
                            className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-fit shrink-0"
                            title="Xóa câu hỏi khỏi đề"
                          >
                            <Trash2 size={16}/>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==========================================
          MODAL SINH ĐỀ THEO MA TRẬN & ĐỊNH MỨC
          ========================================== */}
      <AutoExamMatrixModal
        isOpen={showAutoMatrixModal}
        onClose={() => setShowAutoMatrixModal(false)}
        allAvailableQuestions={allAvailableQuestions}
        onApplyMatrixQuestions={handleApplyMatrixQuestions}
      />

      {/* ==========================================
          MODAL NHẬP JSON AI
          ========================================== */}
      {showJsonModal && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 lg:p-8 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-7xl h-[95vh] lg:h-[90vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
            
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-850 shrink-0">
              <div>
                <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-white m-0">Công cụ nạp đề thi tự động (AI JSON)</h3>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 m-0 mt-1">Cấu hình thông tin Đề thi và dán mã JSON vào bên dưới.</p>
              </div>
              <button onClick={() => setShowJsonModal(false)} className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-colors"><X size={18}/></button>
            </div>
            
            <div className="flex-1 flex flex-col lg:flex-row min-h-0">
              
              {/* CỘT TRÁI: CẤU HÌNH & PROMPT */}
              <div className="w-full lg:w-[45%] p-6 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-y-auto custom-scrollbar">
                
                <label className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-2 mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <Settings size={16}/> Bước 1: Thông tin Đề thi
                </label>
                
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Tên đề thi</label>
                    <input 
                      type="text" 
                      value={examConfig.title} 
                      onChange={e => setExamConfig({...examConfig, title: e.target.value})} 
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold" 
                      placeholder="VD: Đề ôn tập chuyên đề Toán 12 FMATH12"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Bộ đề / Nhóm đề (Tùy chọn)</label>
                    <input 
                      type="text" 
                      value={examConfig.groupName} 
                      onChange={e => setExamConfig({...examConfig, groupName: e.target.value})} 
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold" 
                      placeholder="VD: Đề thi thử các Sở 2024"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Loại đề</label>
                    <select 
                      value={examConfig.type} 
                      onChange={e => setExamConfig({...examConfig, type: e.target.value})} 
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold"
                    >
                      {TABS.map(tab => <option key={tab} value={tab}>{tab}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Thời gian (Phút)</label>
                    <input 
                      type="number" 
                      value={examConfig.timeLimit} 
                      onChange={e => setExamConfig({...examConfig, timeLimit: Number(e.target.value)})} 
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Cách chia điểm</label>
                    <select 
                      value={examConfig.gradingType} 
                      onChange={e => setExamConfig({...examConfig, gradingType: e.target.value})} 
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold"
                    >
                      <option value="standard">Đề thi chuẩn (Định mức câu hỏi theo cấu trúc Bộ 2025)</option>
                      <option value="custom">Đề thi tuỳ chỉnh (Chia điểm đều cho tất cả câu)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-3 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-2">
                    <LayoutTemplate size={16}/> Bước 2: Prompt tạo JSON
                  </label>
                  <button 
                    onClick={handleCopyPrompt} 
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider transition-colors ${
                      isCopied 
                        ? 'bg-emerald-600 text-white border-emerald-600' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {isCopied ? <><Check size={14}/> Đã Copy</> : <><Copy size={14}/> Copy Prompt</>}
                  </button>
                </div>
                
                <div className="flex-1 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-xs leading-[1.6] text-slate-700 dark:text-slate-300 select-all overflow-y-auto custom-scrollbar min-h-[150px]">
                  {AI_PROMPT.split('\n').map((line, i) => <div key={i}>{line || <br/>}</div>)}
                </div>
              </div>

              {/* CỘT PHẢI: KẾT QUẢ JSON */}
              <div className="w-full lg:w-[55%] p-6 flex flex-col bg-slate-950">
                <label className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2 mb-3">
                  <Database size={16}/> Bước 3: Dán kết quả JSON vào đây
                </label>
                <textarea 
                  value={jsonInput} 
                  onChange={e => setJsonInput(e.target.value)} 
                  className="flex-1 w-full p-4 rounded-xl border border-slate-800 bg-slate-900 text-emerald-400 font-mono text-xs leading-relaxed outline-none focus:border-blue-500 resize-none custom-scrollbar" 
                  placeholder="[{...}, {...}]"
                  spellCheck="false"
                />
              </div>
            </div>

            {/* FOOTER */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex justify-end gap-3 shrink-0">
              <button 
                onClick={() => setShowJsonModal(false)} 
                className="btn-outline px-6 py-2 text-sm font-bold"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleImportExamJson} 
                disabled={isSaving} 
                className="btn-primary px-8 py-2 text-sm flex items-center gap-2 disabled:opacity-50 font-bold"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} XUẤT BẢN ĐỀ THI TỪ JSON
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default ExamCreator;
