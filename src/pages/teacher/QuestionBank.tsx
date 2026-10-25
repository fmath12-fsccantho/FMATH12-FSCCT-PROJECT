import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, PlusCircle, ChevronDown, ChevronRight, FileText, 
  Database, FileJson, Plus, Loader2, Save, AlertTriangle, X, 
  LayoutList, Trash2, CheckCircle2, Edit3, Image as ImageIcon, 
  Maximize, Minimize, Copy, Check, BrainCircuit, Sparkles,
  Layers, Compass, HelpCircle, Zap
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm'; 
import { supabase } from '../../config/supabase';
import { useAppStore } from '../../store/useAppStore';
import { questionAiAnalyzer, QuestionAnalysisResult } from '../../services/questionAiAnalyzer';
import { CURRICULUM_FRAMEWORK, COGNITIVE_LEVELS } from '../../config/curriculumFramework';
import { canEditTheoryContent } from '../../utils/permissionUtils';
import { Eye } from 'lucide-react';

const AI_EXERCISE_PROMPT = `Bạn là một chuyên gia Toán học và kỹ sư dữ liệu giáo dục cho hệ thống FMATH12 PRO.
Nhiệm vụ: Đọc toàn bộ danh sách bài tập/câu hỏi được cung cấp bên dưới, chuẩn hóa và chuyển đổi 100% thành mảng JSON để nạp vào Ngân hàng câu hỏi của Bài học.

QUY TẮC BẮT BUỘC TUÂN THỦ:
1. ĐÁP ÁN ĐÚNG & LỜI GIẢI CHI TIẾT:
   - Giáo viên có thể đã đánh dấu đáp án đúng trong đề (in đậm, gạch chân, bôi đỏ, có dấu * ở phương án đúng, hoặc để bảng đáp án ở cuối). Bạn PHẢI trích xuất chính xác đáp án này làm \`correct_answer\`.
   - Nếu đề chưa có đáp án, bạn hãy tự giải chính xác để xác định \`correct_answer\`.
   - BẮT BUỘC viết \`explanation\` (lời giải chi tiết từng bước) sư phạm, logic, rõ ràng và dẫn đến đúng đáp án đó.

2. CÔNG THỨC TOÁN & BẢNG BIỂU (LATEX):
   - BẮT BUỘC dùng dấu $ cho công thức trong dòng: ví dụ $y = x^3 - 3x$, $\\frac{a}{b}$, $\\int_0^1 f(x)dx$.
   - BẮT BUỘC dùng dấu $$ cho khối công thức riêng: ví dụ $$\\Delta = b^2 - 4ac$$.
   - TUYỆT ĐỐI KHÔNG dùng \\( và \\).
   - Trong chuỗi JSON, PHẢI escape dấu gạch chéo ngược: viết \\\\frac, \\\\sqrt, \\\\alpha, \\\\in.
   - Bảng biến thiên / bảng xét dấu: Dùng cú pháp Markdown Table chuẩn (kèm \\n giữa các dòng, không viết dính trên 1 dòng).

3. HÌNH ẢNH MINH HỌA: Nếu câu hỏi có hình minh họa/đồ thị, BẮT BUỘC chèn đúng cụm từ [CẦN CHÈN ẢNH] vào vị trí đó.

4. CẤU TRÚC 3 DẠNG THỨC CHUẨN GDPT 2018:
   - Dạng 1: Trắc nghiệm 4 lựa chọn (type: "mcq"):
     {
       "type": "mcq",
       "level": "Nhận biết" (hoặc "Thông hiểu", "Vận dụng", "Vận dụng cao"),
       "content": "Nội dung câu hỏi...",
       "options": [
         { "id": "A", "text": "Phương án A" },
         { "id": "B", "text": "Phương án B" },
         { "id": "C", "text": "Phương án C" },
         { "id": "D", "text": "Phương án D" }
       ],
       "correct_answer": "A",
       "explanation": "Lời giải chi tiết..."
     }

   - Dạng 2: Trắc nghiệm Đúng / Sai (type: "tf"):
     {
       "type": "tf",
       "level": "Thông hiểu",
       "content": "Nội dung câu hỏi...",
       "options": [
         { "id": "a", "text": "Ý mệnh đề a" },
         { "id": "b", "text": "Ý mệnh đề b" },
         { "id": "c", "text": "Ý mệnh đề c" },
         { "id": "d", "text": "Ý mệnh đề d" }
       ],
       "correct_answer": { "a": true, "b": false, "c": true, "d": false },
       "explanation": "Lời giải chi tiết từng ý a, b, c, d..."
     }

   - Dạng 3: Trắc nghiệm Trả lời ngắn (type: "saq"):
     {
       "type": "saq",
       "level": "Vận dụng",
       "content": "Nội dung câu hỏi...",
       "options": [],
       "correct_answer": "12.5",
       "explanation": "Lời giải chi tiết..."
     }

TRẢ VỀ DUY NHẤT MẢNG JSON BẮT ĐẦU BẰNG [ VÀ KẾT THÚC BẰNG ]. KHÔNG VIẾT THÊM LỜI DẪN NGOÀI JSON.

BÀI TẬP CẦN CHUYỂN ĐỔI:
[DÁN BÀI TẬP CỦA THẦY/CÔ VÀO ĐÂY]`;

const QuestionBank = () => {
  const { currentUser } = useAppStore();
  const canEditTheory = canEditTheoryContent(currentUser);
  
  // States cho Dữ liệu
  const [chapters, setChapters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'theory' | 'practice'>('practice'); 
  const [exercises, setExercises] = useState<any[]>([]);
  const [isFetchingEx, setIsFetchingEx] = useState(false);

  // States cho Lý thuyết (Theory)
  const [theoryInput, setTheoryInput] = useState("");
  const [isEditingTheory, setIsEditingTheory] = useState(false);
  const [isSavingTheory, setIsSavingTheory] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  // States Upload Ảnh Theory
  const [isUploadingImg, setIsUploadingImg] = useState(false);
  const theoryFileInputRef = useRef<HTMLInputElement>(null);

  // States Upload Ảnh Bài tập (Question)
  const [isUploadingQuestionImg, setIsUploadingQuestionImg] = useState(false);
  const questionFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<{ id: string, field: 'content' | 'explanation' | 'option', optId?: string } | null>(null);

  // States cho Modal Nhập JSON
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [jsonError, setJsonError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isPromptCopied, setIsPromptCopied] = useState(false);

  const handleCopyExercisePrompt = () => {
    navigator.clipboard.writeText(AI_EXERCISE_PROMPT);
    setIsPromptCopied(true);
    setTimeout(() => setIsPromptCopied(false), 2000);
  };

  // States cho AI Phân Tích Câu Hỏi (Chuẩn GDPT 2018)
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [analyzingQuestion, setAnalyzingQuestion] = useState<any | null>(null);
  const [analysisResult, setAnalysisResult] = useState<QuestionAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [customQuestionText, setCustomQuestionText] = useState("");
  const [isCustomAnalysis, setIsCustomAnalysis] = useState(false);
  const [isUpdatingLevel, setIsUpdatingLevel] = useState(false);

  // Hàm mở phân tích câu hỏi có sẵn
  const handleOpenAiAnalysis = async (question: any) => {
    setAnalyzingQuestion(question);
    setIsCustomAnalysis(false);
    setShowAnalysisModal(true);
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const result = await questionAiAnalyzer.analyzeQuestion({
        content: question.content,
        options: question.options,
        correct_answer: question.correct_answer,
        explanation: question.explanation,
        type: question.type
      });
      setAnalysisResult(result);
    } catch (err) {
      console.error("Lỗi phân tích AI:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Hàm mở modal phân tích tự do
  const handleOpenCustomAnalysis = () => {
    setAnalyzingQuestion(null);
    setIsCustomAnalysis(true);
    setCustomQuestionText("");
    setAnalysisResult(null);
    setShowAnalysisModal(true);
  };

  // Hàm thực hiện phân tích tự do
  const handleRunCustomAnalysis = async () => {
    if (!customQuestionText.trim()) return;
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const result = await questionAiAnalyzer.analyzeQuestion({
        content: customQuestionText
      });
      setAnalysisResult(result);
    } catch (err) {
      console.error("Lỗi phân tích AI tự do:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Hàm áp dụng mức độ do AI đề xuất vào cơ sở dữ liệu
  const handleApplyLevelToQuestion = async (newLevel: string) => {
    if (!analyzingQuestion) return;
    setIsUpdatingLevel(true);
    try {
      const { error } = await supabase
        .from('exercises')
        .update({ level: newLevel })
        .eq('id', analyzingQuestion.id);

      if (error) throw error;
      setExercises(prev => prev.map(ex => ex.id === analyzingQuestion.id ? { ...ex, level: newLevel } : ex));
      setAnalyzingQuestion((prev: any) => ({ ...prev, level: newLevel }));
      alert(`Đã cập nhật mức độ câu hỏi thành công sang: "${newLevel}"`);
    } catch (err: any) {
      alert("Lỗi cập nhật mức độ: " + err.message);
    } finally {
      setIsUpdatingLevel(false);
    }
  };

  // Hàm tạo Chương mới
  const handleCreateChapter = async () => {
    const title = window.prompt("Nhập tên Chương học mới (ví dụ: Chương 4: Nguyên hàm và Tích phân):");
    if (!title || !title.trim()) return;

    try {
      const { data, error } = await supabase
        .from('chapters')
        .insert({ title: title.trim() })
        .select('*')
        .single();

      if (error) throw error;

      alert(`Đã tạo thành công Chương: "${data.title}"`);
      fetchCurriculum();
    } catch (err: any) {
      alert("Lỗi tạo Chương mới: " + err.message);
    }
  };

  // Hàm tạo Bài học mới trong Chương đang chọn
  const handleCreateLesson = async (chapterId: string) => {
    const title = window.prompt("Nhập tên Bài học mới (ví dụ: Bài 1: Nguyên hàm cơ bản):");
    if (!title || !title.trim()) return;

    try {
      const { data, error } = await supabase
        .from('lessons')
        .insert({ 
          chapter_id: chapterId,
          title: title.trim(),
          theory_content: "### Nội dung bài giảng đang được soạn thảo...\n\nNhấn 'Sửa bài giảng' để bắt đầu soạn thảo nội dung."
        })
        .select('*')
        .single();

      if (error) throw error;

      alert(`Đã thêm thành công Bài học: "${data.title}"`);
      await fetchCurriculum();
      handleSelectLesson(data);
    } catch (err: any) {
      alert("Lỗi tạo Bài học mới: " + err.message);
    }
  };

  // ==========================================
  // FETCH DATA VÀ SẮP XẾP
  // ==========================================
  const fetchCurriculum = async () => {
    setIsLoading(true);
    const { data: chaptersData } = await supabase
      .from('chapters')
      .select('*, lessons(*)')
      .order('created_at', { ascending: true });
      
    if (chaptersData) {
      const sortedChapters = chaptersData
        .filter(chapter => {
          const t = (chapter.title || '').toLowerCase();
          return !t.includes('kho đề') && !t.includes('kho de');
        })
        .map(chapter => {
          if (chapter.lessons && chapter.lessons.length > 0) {
            chapter.lessons.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          }
          return chapter;
        });

      setChapters(sortedChapters);
      
      if (sortedChapters.length > 0 && !activeChapterId) {
        setActiveChapterId(sortedChapters[0].id);
        if (sortedChapters[0].lessons?.length > 0 && !activeLesson) {
          handleSelectLesson(sortedChapters[0].lessons[0]);
        }
      }
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchCurriculum(); }, []);

  const fetchExercises = async (lessonId: string) => {
    setIsFetchingEx(true);
    const { data } = await supabase.from('exercises').select('*').eq('lesson_id', lessonId).order('created_at', { ascending: true });
    if (data) setExercises(data);
    setIsFetchingEx(false);
  };

  const handleSelectLesson = (lesson: any) => {
    setActiveLesson(lesson);
    setTheoryInput(lesson.theory_content || "");
    setIsEditingTheory(false);
    setIsFullScreen(false);
    fetchExercises(lesson.id);
  };

  // ==========================================
  // HÀM UPLOAD ẢNH CHUNG CLOUDINARY
  // ==========================================
  const uploadToCloudinary = async (file: File): Promise<string> => {
    try {
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
      if (!cloudName || !uploadPreset) throw new Error("Chưa cấu hình Cloudinary.");

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error("Tải ảnh thất bại.");
      const data = await res.json();
      return data.secure_url;
    } catch (err) {
      console.warn("Lỗi upload Cloudinary, dùng Base64.", err);
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
      });
    }
  };

  // ==========================================
  // UPLOAD ẢNH CHO THEORY
  // ==========================================
  const handleTheoryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImg(true);
    
    const imageUrl = await uploadToCloudinary(file);
    const imgMarkdown = `\n![Ảnh minh hoạ](${imageUrl})\n`;
    
    if (theoryInput.includes('[CẦN CHÈN ẢNH]')) {
      setTheoryInput(prev => prev.replace('[CẦN CHÈN ẢNH]', imgMarkdown));
    } else {
      setTheoryInput(prev => prev + imgMarkdown);
    }
    
    setIsUploadingImg(false);
    if (e.target) e.target.value = '';
  };

  // ==========================================
  // UPLOAD ẢNH CHO BÀI TẬP (QUESTION)
  // ==========================================
  const handleQuestionImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTarget) return;

    setIsUploadingQuestionImg(true);
    try {
      const imageUrl = await uploadToCloudinary(file);
      const imgMarkdown = `\n![Ảnh minh hoạ](${imageUrl})\n`;

      const qIndex = exercises.findIndex(q => q.id === uploadTarget.id);
      if (qIndex === -1) return;
      const qToUpdate = { ...exercises[qIndex] };

      // Thay thế chuỗi
      if (uploadTarget.field === 'content') {
        qToUpdate.content = qToUpdate.content.replace('[CẦN CHÈN ẢNH]', imgMarkdown);
      } else if (uploadTarget.field === 'explanation') {
        qToUpdate.explanation = qToUpdate.explanation.replace('[CẦN CHÈN ẢNH]', imgMarkdown);
      } else if (uploadTarget.field === 'option') {
        const optIndex = qToUpdate.options.findIndex((o: any) => o.id === uploadTarget.optId);
        if (optIndex !== -1) {
          qToUpdate.options[optIndex].text = qToUpdate.options[optIndex].text.replace('[CẦN CHÈN ẢNH]', imgMarkdown);
        }
      }

      // Lưu thẳng vào Database
      const { error } = await supabase.from('exercises').update({
        content: qToUpdate.content,
        explanation: qToUpdate.explanation,
        options: qToUpdate.options
      }).eq('id', qToUpdate.id);

      if (error) throw error;

      // Cập nhật giao diện
      setExercises(prev => {
        const next = [...prev];
        next[qIndex] = qToUpdate;
        return next;
      });

    } catch (err) {
      alert("Lỗi khi chèn ảnh vào câu hỏi.");
    } finally {
      setIsUploadingQuestionImg(false);
      setUploadTarget(null);
      if (e.target) e.target.value = '';
    }
  };

  // ==========================================
  // XỬ LÝ LƯU LÝ THUYẾT & JSON TỪ AI
  // ==========================================
  const handleSaveTheory = async () => {
    if (!activeLesson) return;
    if (!canEditTheory) {
      return alert("Thầy/Cô không có quyền sửa đổi nội dung lý thuyết chuẩn của hệ thống.");
    }
    setIsSavingTheory(true);
    const { error } = await supabase.from('lessons').update({ theory_content: theoryInput }).eq('id', activeLesson.id);
    setIsSavingTheory(false);

    if (error) {
      alert("Lỗi lưu bài giảng: " + error.message);
    } else {
      alert("Đã lưu nội dung lý thuyết thành công!");
      setActiveLesson({ ...activeLesson, theory_content: theoryInput });
      setIsEditingTheory(false);
      setIsFullScreen(false);
      setChapters(prev => prev.map(c => ({ ...c, lessons: c.lessons?.map((l: any) => l.id === activeLesson.id ? { ...l, theory_content: theoryInput } : l) })));
    }
  };

  const sanitizeJSONString = (rawStr: string) => {
    let cleanStr = rawStr.replace(/```json/gi, '').replace(/```/g, '').trim();
    const firstBracket = cleanStr.indexOf('[');
    const lastBracket = cleanStr.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1) cleanStr = cleanStr.substring(firstBracket, lastBracket + 1);
    cleanStr = cleanStr.replace(/,\s*([\]}])/g, '$1');
    return cleanStr;
  };

  const handleParseAndSaveJSON = async () => {
    setJsonError("");
    try {
      if (!jsonInput.trim()) throw new Error("Vui lòng dán kết quả từ AI vào ô trống.");
      const safeJsonString = sanitizeJSONString(jsonInput);
      let parsed;
      try { parsed = JSON.parse(safeJsonString); } catch (e) { throw new Error("Dữ liệu sai cấu trúc JSON nghiêm trọng."); }

      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("Mảng JSON rỗng hoặc không hợp lệ.");

      parsed.forEach((q, index) => {
        if (!q.type || !['mcq', 'tf', 'saq'].includes(q.type)) throw new Error(`Câu ${index + 1}: Trường 'type' không hợp lệ.`);
        if (!q.content || !q.correct_answer) throw new Error(`Câu ${index + 1}: Thiếu nội dung hoặc đáp án.`);
      });

      setIsSaving(true);
      const questionsToInsert = parsed.map(q => ({
        lesson_id: activeLesson.id,
        type: q.type,
        level: q.level || 'Nhận biết',
        content: q.content,
        options: q.options || [],
        correct_answer: typeof q.correct_answer === 'object' ? JSON.stringify(q.correct_answer) : q.correct_answer.toString(),
        explanation: q.explanation || ''
      }));

      const { error } = await supabase.from('exercises').insert(questionsToInsert);
      if (error) throw error;

      alert(`Đã thêm thành công ${questionsToInsert.length} bài tập.`);
      setShowJsonModal(false);
      setJsonInput("");
      fetchExercises(activeLesson.id); 
    } catch (error: any) {
      setJsonError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!window.confirm("Xóa câu hỏi này?")) return;
    const { error } = await supabase.from('exercises').delete().eq('id', id);
    if (!error) setExercises(prev => prev.filter(q => q.id !== id));
  };

  const parseTFAnswer = (ans: any) => {
    if (typeof ans === 'string') { try { return JSON.parse(ans); } catch { return {}; } }
    return ans || {};
  };

  const MarkdownComponents = {
    img: ({ node, ...props }: any) => <img {...props} className="max-w-full h-auto rounded-xl border border-slate-200 dark:border-slate-700 my-4 block shadow-sm" alt={props.alt || "Ảnh"} loading="lazy" />,
    table: ({ node, ...props }: any) => (
      <div className="w-full overflow-x-auto my-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-900 dark:bg-slate-900">
        <table className="w-full text-center border-collapse text-[14px] text-slate-800 dark:text-slate-100" {...props} />
      </div>
    ),
    thead: ({ node, ...props }: any) => <thead className="bg-slate-50 dark:bg-slate-800 border-b-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100" {...props} />,
    tbody: ({ node, ...props }: any) => <tbody className="divide-y divide-slate-200 dark:divide-slate-700" {...props} />,
    tr: ({ node, ...props }: any) => <tr className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/50" {...props} />,
    th: ({ node, ...props }: any) => <th className="p-3 border-r border-slate-200 dark:border-slate-700 last:border-r-0 font-bold whitespace-nowrap align-middle text-slate-800 dark:text-slate-100" {...props} />,
    td: ({ node, ...props }: any) => <td className="p-3 border-r border-slate-200 dark:border-slate-700 last:border-r-0 align-middle first:font-bold first:bg-slate-50 dark:first:bg-slate-800 first:border-r-2 text-slate-700 dark:text-slate-200" {...props} />,
  };

  // ==========================================
  // RENDER GIAO DIỆN
  // ==========================================
  return (
    <div className="page-container relative animate-in fade-in">
      <div className="page-content custom-scrollbar">
        <div className="max-w-screen-2xl mx-auto w-full">
          
          <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2 font-heading flex items-center gap-2">
                <LayoutList className="text-primary"/> Trung tâm Soạn giảng
              </h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-[14px]">Quản lý Lý thuyết và Ngân hàng câu hỏi chi tiết theo từng chương/bài.</p>
            </div>
            <button onClick={handleCreateChapter} className="btn-primary py-2.5 px-6 rounded-lg text-[14px] flex items-center justify-center gap-2 shadow-sm">
              <PlusCircle size={18} /> Tạo Chương mới
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)]">
            
            {/* ==========================================
                CỘT TRÁI: DANH SÁCH CHƯƠNG & BÀI HỌC
                ========================================== */}
            <div className="w-full lg:w-[320px] shrink-0 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[13px] flex items-center justify-between bg-slate-50 dark:bg-slate-800/80">
                <span className="flex items-center gap-2"><BookOpen size={16}/> Lộ trình học</span>
                <button onClick={handleCreateChapter} className="text-primary hover:underline text-[12px] font-bold flex items-center gap-1">
                  <Plus size={14}/> Chương
                </button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                {isLoading ? (
                  <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary"/></div>
                ) : chapters.length === 0 ? (
                  <div className="text-center text-slate-400 dark:text-slate-500 text-[13px] py-10 font-medium">Chưa có chương nào.</div>
                ) : (
                  chapters.map(chapter => {
                    const isExpanded = activeChapterId === chapter.id;
                    return (
                      <div key={chapter.id} className="mb-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                        <button 
                          onClick={() => setActiveChapterId(isExpanded ? null : chapter.id)}
                          className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/60 font-bold text-slate-900 dark:text-slate-100 text-[14px] transition-colors text-left"
                        >
                          <span className="truncate pr-2">{chapter.title}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            {isExpanded ? <ChevronDown size={16} className="text-slate-400 dark:text-slate-500"/> : <ChevronRight size={16} className="text-slate-400 dark:text-slate-500"/>}
                          </div>
                        </button>
                        
                        {isExpanded && (
                          <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                            {chapter.lessons?.map((lesson: any) => {
                              const isActive = activeLesson?.id === lesson.id;
                              return (
                                <button 
                                  key={lesson.id} 
                                  onClick={() => handleSelectLesson(lesson)}
                                  className={`w-full text-left px-4 py-3 flex flex-col gap-1 transition-colors ${isActive ? 'bg-blue-50 dark:bg-blue-950/60 border-l-4 border-l-primary' : 'hover:bg-slate-50 dark:bg-slate-800/80 border-l-4 border-l-transparent'}`}
                                >
                                  <div className={`text-[13px] font-medium line-clamp-2 flex items-start gap-2 ${isActive ? 'text-primary font-bold' : 'text-slate-700 dark:text-slate-300'}`}>
                                    <FileText size={14} className="shrink-0 mt-0.5"/> {lesson.title}
                                  </div>
                                </button>
                              );
                            })}
                            {canEditTheory && (
                              <button
                                onClick={() => handleCreateLesson(chapter.id)}
                                className="w-full text-left px-4 py-2 text-[12px] font-bold text-primary hover:bg-blue-50 dark:bg-blue-950/60 transition-colors flex items-center gap-1.5"
                              >
                                <Plus size={14} /> + Thêm Bài học mới
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* ==========================================
                CỘT PHẢI: NỘI DUNG CHI TIẾT BÀI HỌC
                ========================================== */}
            <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
              {activeLesson ? (
                <>
                  <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80">
                    <div className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-1.5">Đang soạn thảo bài học</div>
                    <h3 className="text-[20px] font-bold font-heading text-slate-900 dark:text-slate-100 m-0 line-clamp-2">{activeLesson.title}</h3>
                  </div>

                  <div className="flex px-2 pt-2 border-b border-slate-200 dark:border-slate-800 gap-2 shrink-0 bg-slate-50 dark:bg-slate-800/80 overflow-x-auto custom-scrollbar">
                    <button onClick={() => setActiveTab('theory')} className={`px-4 py-2.5 font-bold text-[13px] uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap rounded-t-lg ${activeTab === 'theory' ? 'border-primary text-primary bg-white dark:bg-slate-900' : 'border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60'}`}>
                      <BookOpen size={16}/> Lý thuyết
                    </button>
                    <button onClick={() => setActiveTab('practice')} className={`px-4 py-2.5 font-bold text-[13px] uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap rounded-t-lg ${activeTab === 'practice' ? 'border-primary text-primary bg-white dark:bg-slate-900' : 'border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60'}`}>
                      <Database size={16}/> Bài tập ({exercises.length})
                    </button>
                  </div>

                  <div className={`flex-1 custom-scrollbar ${isFullScreen ? 'fixed inset-0 z-[100] bg-slate-50 dark:bg-slate-800/80 p-4 flex flex-col' : 'overflow-y-auto p-4 md:p-6 relative bg-white dark:bg-slate-900'}`}>
                    
                    {/* ========================================== */}
                    {/* TAB: LÝ THUYẾT                             */}
                    {/* ========================================== */}
                    {activeTab === 'theory' ? (
                      <div className="animate-in fade-in h-full flex flex-col min-h-[400px]">
                        
                        <div className="flex flex-wrap justify-between items-center mb-4 shrink-0 gap-4">
                          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                            <BookOpen size={18}/>
                            <h4 className="font-bold text-[15px] m-0">Bài giảng lý thuyết</h4>
                            {isEditingTheory && theoryInput.includes('[CẦN CHÈN ẢNH]') && (
                              <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 rounded text-[11px] font-bold animate-pulse flex items-center gap-1 border border-amber-200 dark:border-amber-800 ml-2">
                                <AlertTriangle size={12}/> Vị trí trống ảnh
                              </span>
                            )}
                          </div>

                          {!isEditingTheory ? (
                            canEditTheory ? (
                              <button onClick={() => setIsEditingTheory(true)} className="btn-secondary py-2 px-4 text-[13px] flex items-center gap-2">
                                <Edit3 size={14}/> Sửa bài giảng
                              </button>
                            ) : (
                              <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-3 py-1.5 rounded-xl font-medium">
                                <Eye size={13} /> Giáo trình chuẩn (Chỉ xem)
                              </div>
                            )
                          ) : (
                            <div className="flex flex-wrap items-center gap-2">
                              <input type="file" accept="image/*" ref={theoryFileInputRef} className="hidden" onChange={handleTheoryImageUpload} />
                              
                              <button onClick={() => theoryFileInputRef.current?.click()} disabled={isUploadingImg} className="btn-outline px-3 py-2 text-[12px] flex items-center gap-1.5 disabled:opacity-50">
                                {isUploadingImg ? <Loader2 size={14} className="animate-spin"/> : <ImageIcon size={14}/>} 
                                Thay thế [CẦN CHÈN ẢNH]
                              </button>
                              
                              <button onClick={() => setIsFullScreen(!isFullScreen)} className="btn-outline p-2" title={isFullScreen ? "Thu nhỏ" : "Toàn màn hình"}>
                                {isFullScreen ? <Minimize size={16}/> : <Maximize size={16}/>}
                              </button>

                              <div className="w-px h-6 bg-[#dee2e6] mx-1"></div>

                              <button onClick={() => { setIsEditingTheory(false); setIsFullScreen(false); setTheoryInput(activeLesson.theory_content || ""); }} className="btn-outline px-4 py-2 text-[13px]">
                                Hủy
                              </button>
                              <button onClick={handleSaveTheory} disabled={isSavingTheory} className="btn-primary py-2 px-4 text-[13px] flex items-center gap-1.5 disabled:opacity-50">
                                {isSavingTheory ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>} Lưu
                              </button>
                            </div>
                          )}
                        </div>

                        {isEditingTheory ? (
                          <div className={`flex-1 flex gap-4 ${isFullScreen ? 'flex-row' : 'flex-col'}`}>
                            <div className="flex-1 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col bg-white dark:bg-slate-900">
                              <div className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 px-3 py-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Trình soạn thảo (Markdown + LaTeX)
                              </div>
                              <textarea
                                value={theoryInput}
                                onChange={e => setTheoryInput(e.target.value)}
                                placeholder="Soạn bài giảng Markdown tại đây...&#10;Dùng $...$ cho công thức nội tuyến, $$...$$ cho khối công thức."
                                className="flex-1 w-full p-4 font-mono text-[14px] leading-relaxed outline-none resize-none custom-scrollbar text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900"
                                spellCheck="false"
                              />
                            </div>
                            
                            {isFullScreen && (
                              <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col">
                                <div className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 px-3 py-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                  Xem trước giao diện
                                </div>
                                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                                  <div className="prose prose-sm max-w-none text-slate-900 dark:text-slate-100 leading-[1.8] [&_.katex-display]:my-4">
                                    <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]} components={MarkdownComponents}>
                                      {theoryInput || '*Chưa có nội dung...*'}
                                    </ReactMarkdown>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex-1 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 overflow-y-auto custom-scrollbar shadow-sm">
                            {activeLesson.theory_content ? (
                              <div className="prose prose-sm max-w-none text-slate-900 dark:text-slate-100 leading-[1.8] [&_.katex-display]:my-4">
                                <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]} components={MarkdownComponents}>
                                  {activeLesson.theory_content}
                                </ReactMarkdown>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-slate-400 dark:text-slate-500">
                                <BookOpen size={48} className="mb-3 opacity-30" />
                                <p className="font-bold text-[14px]">Chưa có nội dung lý thuyết.</p>
                                <p className="text-[12px] mt-1">Bấm "Sửa bài giảng" để bắt đầu soạn giáo án.</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (

                    /* ========================================== */
                    /* TAB: BÀI TẬP                               */
                    /* ========================================== */
                      <div className="animate-in fade-in">
                        {/* Input ẩn để upload ảnh bài tập */}
                        <input type="file" accept="image/*" ref={questionFileInputRef} className="hidden" onChange={handleQuestionImageUpload} />

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-[15px] m-0 flex items-center gap-2">
                            <Database size={18} className="text-primary"/> Ngân hàng câu hỏi
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            <button onClick={handleOpenCustomAnalysis} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg font-bold text-[13px] flex items-center gap-2 transition-all shadow-xs">
                              <Sparkles size={16}/> AI Giám định câu hỏi
                            </button>
                            <button 
                              onClick={handleCopyExercisePrompt} 
                              className={`px-3.5 py-2 rounded-lg font-bold text-[13px] flex items-center gap-1.5 transition-colors border shadow-2xs ${
                                isPromptCopied 
                                  ? 'bg-emerald-600 text-white border-emerald-600' 
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                              }`}
                              title="Sao chép Prompt AI chuẩn hóa bài tập để gửi cho ChatGPT / Claude / Gemini"
                            >
                              {isPromptCopied ? <Check size={16}/> : <Copy size={16}/>}
                              <span>{isPromptCopied ? 'Đã Copy Prompt' : 'Copy Prompt AI'}</span>
                            </button>
                            <button onClick={() => setShowJsonModal(true)} className="bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-primary px-4 py-2 rounded-lg font-bold text-[13px] flex items-center gap-2 transition-colors border border-blue-200 dark:border-blue-800">
                              <FileJson size={16}/> Nhập từ AI (JSON)
                            </button>
                            <button className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg font-bold text-[13px] flex items-center gap-2 transition-colors">
                              <Plus size={16}/> Tạo thủ công
                            </button>
                          </div>
                        </div>

                        {isFetchingEx ? (
                          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" size={32}/></div>
                        ) : exercises.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/80">
                            <Database size={48} className="mb-4 opacity-20" />
                            <p className="font-medium text-sm">Bài học này chưa có câu hỏi nào.</p>
                            <p className="text-xs mt-2">Hãy copy JSON sinh ra từ AI và bấm "Nhập từ AI" nhé.</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {exercises.map((q, idx) => {
                              let typeLabel = "Trắc nghiệm 4 đáp án";
                              let badgeColor = "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800";
                              if (q.type === 'tf') { typeLabel = "Trắc nghiệm Đúng/Sai"; badgeColor = "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800"; }
                              if (q.type === 'saq') { typeLabel = "Trả lời ngắn"; badgeColor = "bg-[#e2e3e5] text-[#41464b] border-[#d3d6d8]"; }

                              return (
                                <div key={q.id} className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative group hover:border-blue-200 dark:border-blue-800 transition-colors">
                                  
                                  <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleDeleteQuestion(q.id)} className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-[#dc3545] hover:bg-[#f8d7da] hover:border-[#f5c2c7] rounded transition-colors" title="Xóa câu hỏi">
                                      <Trash2 size={14}/>
                                    </button>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2 mb-4 pb-3 border-b border-[#e9ecef] pr-12">
                                    <span className="badge-primary">Câu {idx + 1}</span>
                                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded">
                                      {q.level}
                                    </span>
                                    <button 
                                      onClick={() => handleOpenAiAnalysis(q)}
                                      className="p-1 px-2.5 text-[11px] font-bold rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 flex items-center gap-1.5 border border-indigo-200 transition-colors shadow-xs"
                                      title="AI Phân tích mức độ nhận thức & vị trí khung kiến thức"
                                    >
                                      <Sparkles size={12} className="text-indigo-600"/> AI Phân tích
                                    </button>
                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${badgeColor}`}>
                                      {typeLabel}
                                    </span>
                                  </div>
                                  
                                  {/* HIỂN THỊ VÀ CHÈN ẢNH VÀO NỘI DUNG */}
                                  <div className="prose prose-sm max-w-none text-slate-900 dark:text-slate-100 mb-4 leading-[1.8] [&_.katex-display]:my-2 overflow-x-auto">
                                    <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]} components={MarkdownComponents}>{q.content}</ReactMarkdown>
                                  </div>

                                  {q.content?.includes('[CẦN CHÈN ẢNH]') && (
                                    <button 
                                      onClick={() => { setUploadTarget({ id: q.id, field: 'content' }); questionFileInputRef.current?.click(); }}
                                      disabled={isUploadingQuestionImg}
                                      className="mb-4 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 border-dashed hover:border-primary hover:text-primary px-3 py-1.5 rounded text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                                    >
                                      {isUploadingQuestionImg && uploadTarget?.id === q.id && uploadTarget.field === 'content' ? <Loader2 size={12} className="animate-spin text-primary"/> : <ImageIcon size={12}/>}
                                      Click tải ảnh thay thế [CẦN CHÈN ẢNH]
                                    </button>
                                  )}

                                  {/* HIỂN THỊ OPTIONS (MCQ) */}
                                  {q.type === 'mcq' && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                      {Array.isArray(q.options) && q.options.map((opt: any) => (
                                        <div key={opt.id} className={`p-3 rounded-lg border text-[14px] flex items-start gap-2.5 ${opt.id === q.correct_answer ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-600' : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-800'}`}>
                                          <strong className={`shrink-0 font-ui text-[13px] ${opt.id === q.correct_answer ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'}`}>{opt.id}.</strong> 
                                          <div className={`prose prose-sm max-w-none flex-1 overflow-x-auto leading-relaxed m-0 ${opt.id === q.correct_answer ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-900 dark:text-slate-100'}`}>
                                            <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]} components={MarkdownComponents}>{opt.text}</ReactMarkdown>
                                          </div>
                                          {opt.text?.includes('[CẦN CHÈN ẢNH]') && (
                                            <button 
                                              onClick={() => { setUploadTarget({ id: q.id, field: 'option', optId: opt.id }); questionFileInputRef.current?.click(); }}
                                              disabled={isUploadingQuestionImg}
                                              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors shrink-0"
                                            >
                                              <ImageIcon size={12}/> Chèn ảnh
                                            </button>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* HIỂN THỊ OPTIONS (TF) */}
                                  {q.type === 'tf' && (
                                    <div className="space-y-2 mb-4">
                                      {Array.isArray(q.options) && q.options.map((opt: any, idx: number) => {
                                        const rawOptId = opt.id || ['a', 'b', 'c', 'd'][idx] || String(idx);
                                        const optId = String(rawOptId).toLowerCase().trim();
                                        const tfAns = parseTFAnswer(q.correct_answer);
                                        const isTrue = tfAns[optId] === true;
                                        
                                        return (
                                          <div key={opt.id} className={`p-3 rounded-lg border text-[14px] flex items-start gap-2.5 ${isTrue ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-600' : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-800'}`}>
                                            <strong className={`shrink-0 font-ui text-[13px] ${isTrue ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'}`}>{optId})</strong> 
                                            <div className={`prose prose-sm max-w-none flex-1 overflow-x-auto leading-relaxed m-0 ${isTrue ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-900 dark:text-slate-100'}`}>
                                              <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]} components={MarkdownComponents}>{opt.text}</ReactMarkdown>
                                            </div>
                                            <div className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${isTrue ? 'bg-white dark:bg-slate-900 text-[#198754] border-[#a3cfbb]' : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800'}`}>
                                              {isTrue ? 'ĐÚNG' : 'SAI'}
                                            </div>
                                            {opt.text?.includes('[CẦN CHÈN ẢNH]') && (
                                              <button 
                                                onClick={() => { setUploadTarget({ id: q.id, field: 'option', optId: opt.id }); questionFileInputRef.current?.click(); }}
                                                disabled={isUploadingQuestionImg}
                                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors shrink-0"
                                              >
                                                <ImageIcon size={12}/> Chèn ảnh
                                              </button>
                                            )}
                                          </div>
                                        )
                                      })}
                                    </div>
                                  )}

                                  {/* HIỂN THỊ SAQ */}
                                  {q.type === 'saq' && (
                                    <div className="mb-4 flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                                      <span className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Đáp án điền khuyết: </span>
                                      <span className="font-bold text-[16px] text-[#198754]">{q.correct_answer}</span>
                                    </div>
                                  )}

                                  {/* LỜI GIẢI VÀ CHÈN ẢNH VÀO LỜI GIẢI */}
                                  {q.explanation && (
                                    <div className="bg-amber-50 dark:bg-amber-950/40 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                                      <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5"><BrainCircuit size={14}/> Lời giải hệ thống</span>
                                      <div className="prose prose-sm max-w-none text-amber-800 dark:text-amber-200 leading-[1.8] [&_.katex-display]:my-2">
                                        <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]} components={MarkdownComponents}>{q.explanation}</ReactMarkdown>
                                      </div>
                                      {q.explanation.includes('[CẦN CHÈN ẢNH]') && (
                                        <button 
                                          onClick={() => { setUploadTarget({ id: q.id, field: 'explanation' }); questionFileInputRef.current?.click(); }}
                                          disabled={isUploadingQuestionImg}
                                          className="mt-3 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded text-[11px] font-bold flex items-center gap-1.5 transition-colors animate-pulse w-fit"
                                        >
                                          {isUploadingQuestionImg && uploadTarget?.id === q.id && uploadTarget.field === 'explanation' ? <Loader2 size={12} className="animate-spin"/> : <ImageIcon size={12}/>}
                                          Click tải ảnh thay thế [CẦN CHÈN ẢNH]
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-10 bg-white dark:bg-slate-900">
                  <BookOpen size={64} className="mb-4 opacity-30"/>
                  <p className="font-bold text-[16px] text-slate-700 dark:text-slate-300 mb-2 font-heading">Chưa chọn bài học</p>
                  <p className="text-[13px] text-center">Bấm vào một bài học ở danh sách bên trái để bắt đầu soạn giảng.</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* MODAL NHẬP JSON TỪ AI                      */}
      {/* ========================================== */}
      {showJsonModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 lg:p-6 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-6xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 relative flex flex-col max-h-[92vh] overflow-hidden">
            
            {/* MODAL HEADER */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-850 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <FileJson size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white m-0">
                    Công cụ nạp bài tập từ AI (Chuẩn hóa tự động)
                  </h3>
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 m-0 mt-0.5 flex items-center gap-1.5">
                    <CheckCircle2 size={13} /> Đang nạp vào: <b>{activeLesson?.title}</b>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowJsonModal(false)} 
                className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400 transition-colors"
              >
                <X size={18}/>
              </button>
            </div>
            
            {/* MODAL BODY (2 CỘT: PROMPT & DÁN JSON) */}
            <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
              
              {/* CỘT TRÁI: BƯỚC 1 - PROMPT CHUYỂN BÀI TẬP */}
              <div className="w-full lg:w-1/2 p-6 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <label className="text-xs font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400 font-heading block">
                      Bước 1: Prompt AI Chuyển bài tập
                    </label>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Gửi kèm bài tập của Thầy/Cô cho ChatGPT / Gemini / Claude
                    </span>
                  </div>
                  <button 
                    onClick={handleCopyExercisePrompt} 
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all shrink-0 shadow-2xs ${
                      isPromptCopied 
                        ? 'bg-emerald-600 text-white border-emerald-600' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {isPromptCopied ? <><Check size={14}/> Đã Copy Prompt</> : <><Copy size={14}/> Sao chép Prompt</>}
                  </button>
                </div>

                <div className="mb-3 p-3 bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/50 rounded-xl text-xs text-purple-800 dark:text-purple-300 leading-relaxed font-sans">
                  💡 <b>Cách làm:</b> Bấm <b>"Sao chép Prompt"</b> bên trên $\rightarrow$ Dán vào AI $\rightarrow$ Dán danh sách câu hỏi/bài tập ở cuối $\rightarrow$ AI sẽ trả về mảng JSON chuẩn.
                </div>
                
                <div className="flex-1 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-xs leading-[1.6] text-slate-700 dark:text-slate-300 select-all overflow-y-auto custom-scrollbar min-h-[220px]">
                  {AI_EXERCISE_PROMPT.split('\n').map((line, i) => <div key={i}>{line || <br/>}</div>)}
                </div>
              </div>

              {/* CỘT PHẢI: BƯỚC 2 - DÁN KẾT QUẢ JSON */}
              <div className="w-full lg:w-1/2 p-6 flex flex-col bg-slate-950">
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-800">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-blue-400 font-heading">
                    Bước 2: Dán mã JSON kết quả từ AI
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Hỗ trợ tự động lọc sạch thẻ markdown
                  </span>
                </div>

                {jsonError && (
                  <div className="mb-3 p-3 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-xl text-xs font-bold flex items-start gap-2 shadow-sm animate-in fade-in">
                    <AlertTriangle size={15} className="shrink-0 mt-0.5 text-rose-400"/>
                    <span>{jsonError}</span>
                  </div>
                )}

                <div className="flex-1 min-h-[260px] flex flex-col">
                  <textarea 
                    value={jsonInput}
                    onChange={e => setJsonInput(e.target.value)}
                    placeholder="Dán mã JSON mảng [...] từ AI vào đây...&#10;Hệ thống sẽ tự động bóc tách và phân loại dạng thức, công thức toán LaTeX."
                    className="flex-1 w-full bg-slate-900 text-emerald-400 font-mono text-xs p-4 rounded-xl border border-slate-800 outline-none focus:border-blue-500 resize-none custom-scrollbar shadow-inner"
                    spellCheck="false"
                  />
                </div>
              </div>

            </div>

            {/* MODAL FOOTER */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850 flex items-center justify-between gap-3 shrink-0">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Hỗ trợ đầy đủ: Trắc nghiệm 4 lựa chọn, Đúng / Sai, Trả lời ngắn & công thức LaTeX
              </span>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowJsonModal(false)} 
                  className="btn-outline px-5 py-2 text-xs font-bold"
                >
                  Hủy
                </button>
                <button 
                  onClick={handleParseAndSaveJSON} 
                  disabled={isSaving || !jsonInput.trim()} 
                  className="btn-primary px-6 py-2 text-xs font-bold flex items-center gap-2 disabled:opacity-50 shadow-sm"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} LƯU BÀI TẬP VÀO BÀI HỌC
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL PHÂN TÍCH & GIÁM ĐỊNH CÂU HỎI BẰNG AI */}
      {/* ========================================== */}
      {showAnalysisModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 relative flex flex-col max-h-[92vh] overflow-hidden">
            
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-blue-50/80 via-white to-indigo-50/80 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-[17px] font-bold font-heading text-slate-900 dark:text-slate-100 m-0 flex items-center gap-2">
                    AI Giám Định & Định Vị Khung Kiến Thức
                  </h3>
                  <p className="text-[11px] font-medium text-slate-500 m-0 mt-0.5">
                    Chuẩn hóa theo Khung Chương trình GDPT 2018 môn Toán 12
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowAnalysisModal(false)} 
                className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/60 rounded-lg text-slate-500 dark:text-slate-400 transition-colors"
              >
                <X size={18}/>
              </button>
            </div>
            
            {/* Body Modal */}
            <div className="p-6 flex-1 overflow-y-auto space-y-5 custom-scrollbar text-slate-900 dark:text-slate-100">
              
              {/* Chế độ nhập câu hỏi tự do */}
              {isCustomAnalysis && (
                <div className="bg-slate-50 dark:bg-slate-800/80 border border-[#e9ecef] rounded-xl p-4">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Nhập hoặc dán nội dung câu hỏi (hỗ trợ công thức LaTeX $...$):
                  </label>
                  <textarea 
                    value={customQuestionText}
                    onChange={e => setCustomQuestionText(e.target.value)}
                    placeholder="Ví dụ: Cho hàm số y = f(x) có đạo hàm f'(x) = x(x-1)^2(x+2). Số điểm cực trị của hàm số đã cho là:&#10;A. 1   B. 2   C. 3   D. 4"
                    rows={4}
                    className="w-full bg-white dark:bg-slate-900 text-slate-800 text-[13px] p-3 rounded-lg border border-slate-300 outline-none focus:border-blue-500 transition-colors shadow-inner font-sans resize-y"
                  />
                  <div className="mt-3 flex justify-end">
                    <button 
                      onClick={handleRunCustomAnalysis}
                      disabled={isAnalyzing || !customQuestionText.trim()}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2 rounded-lg font-bold text-xs flex items-center gap-2 shadow-sm disabled:opacity-50 transition-all"
                    >
                      {isAnalyzing ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14}/>}
                      {isAnalyzing ? "Đang phân tích..." : "Bắt đầu AI Phân tích"}
                    </button>
                  </div>
                </div>
              )}

              {/* Xem trước câu hỏi đang giám định (nếu chọn từ danh sách câu hỏi) */}
              {!isCustomAnalysis && analyzingQuestion && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Câu hỏi đang kiểm tra</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-300 text-slate-700">
                      Mức hiện tại: {analyzingQuestion.level || "Chưa gán"}
                    </span>
                  </div>
                  <div className="prose prose-sm max-w-none text-slate-800 text-[13px] leading-relaxed [&_.katex-display]:my-1">
                    <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]} components={MarkdownComponents}>
                      {analyzingQuestion.content}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {/* Trạng thái Loading khi AI đang chạy */}
              {isAnalyzing && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin flex items-center justify-center"></div>
                    <Sparkles size={20} className="absolute inset-0 m-auto text-blue-600 animate-pulse" />
                  </div>
                  <p className="font-bold text-sm text-slate-800 mt-4">AI đang phân tích câu hỏi...</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-md">
                    Đối chiếu dữ liệu với 4 mức độ nhận thức và xác định chính xác vị trí trong Khung chuẩn GDPT 2018 môn Toán 12
                  </p>
                </div>
              )}

              {/* Kết quả Phân tích từ AI */}
              {analysisResult && !isAnalyzing && (
                <div className="space-y-4 animate-in fade-in">
                  
                  {/* Card Mức độ Nhận thức */}
                  <div className="border border-blue-100 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 rounded-xl p-5 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-blue-100">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-600 uppercase">Mức độ nhận thức:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase shadow-xs border ${
                          analysisResult.level === 'Nhận biết' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                          analysisResult.level === 'Thông hiểu' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                          analysisResult.level === 'Vận dụng' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                          'bg-purple-100 text-purple-800 border-purple-300'
                        }`}>
                          {analysisResult.level}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-500 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-md border border-slate-200 shadow-xs">
                        Độ tin cậy: {analysisResult.confidence}%
                      </span>
                    </div>

                    <div className="mt-3">
                      <p className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                        <Zap size={13} className="text-blue-600"/> Căn cứ phân loại:
                      </p>
                      <p className="text-xs text-slate-600 leading-relaxed bg-white dark:bg-slate-900/80 p-3 rounded-lg border border-blue-100/60">
                        {analysisResult.levelExplanation}
                      </p>
                    </div>

                    {!isCustomAnalysis && analyzingQuestion && analyzingQuestion.level !== analysisResult.level && (
                      <div className="mt-3 flex items-center justify-between bg-amber-50 border border-amber-200 p-2.5 rounded-lg text-xs">
                        <span className="text-amber-800 font-medium">
                          Mức độ câu hỏi đang lưu là <strong>"{analyzingQuestion.level}"</strong>, khác với kết quả AI phân loại <strong>"{analysisResult.level}"</strong>.
                        </span>
                        <button
                          onClick={() => handleApplyLevelToQuestion(analysisResult.level)}
                          disabled={isUpdatingLevel}
                          className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-md text-[11px] shrink-0 transition-colors shadow-xs"
                        >
                          {isUpdatingLevel ? <Loader2 size={12} className="animate-spin"/> : "Áp dụng mức này"}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Card Vị trí trong Khung Kiến Thức Chuẩn GDPT 2018 */}
                  <div className="border border-slate-200 rounded-xl p-5 bg-white dark:bg-slate-900 shadow-xs">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Layers size={14} className="text-indigo-600"/>
                      Vị trí trong Khung Chương Trình GDPT 2018
                    </h4>

                    <div className="space-y-2.5 text-xs">
                      <div className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <span className="font-bold text-slate-500 shrink-0 min-w-[90px]">Mạch kiến thức:</span>
                        <span className="font-semibold text-slate-800">{analysisResult.domain}</span>
                      </div>

                      <div className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <span className="font-bold text-slate-500 shrink-0 min-w-[90px]">Chuyên đề:</span>
                        <span className="font-semibold text-slate-800">{analysisResult.topic}</span>
                      </div>

                      <div className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <span className="font-bold text-slate-500 shrink-0 min-w-[90px]">Mục chi tiết:</span>
                        <span className="font-semibold text-slate-800">{analysisResult.subTopic}</span>
                      </div>

                      <div className="mt-3 bg-emerald-50/70 border border-emerald-200/80 p-3 rounded-lg">
                        <span className="font-bold text-emerald-900 block mb-1 flex items-center gap-1.5">
                          <Compass size={13} className="text-emerald-700"/> Yêu cầu cần đạt / Năng lực trọng tâm:
                        </span>
                        <span className="text-emerald-800 leading-relaxed font-medium">
                          {analysisResult.competency}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Bẫy lỗi & Lời khuyên */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-rose-50/60 border border-rose-200/70 rounded-xl p-4">
                      <h5 className="text-xs font-bold text-rose-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <AlertTriangle size={13} className="text-rose-600"/> Cạm bẫy học sinh hay mắc:
                      </h5>
                      <p className="text-xs text-rose-800 leading-relaxed">
                        {analysisResult.trapsAndMistakes || "Học sinh dễ nhầm lẫn điều kiện biên hoặc đọc sai dấu đạo hàm trên các khoảng liên tục."}
                      </p>
                    </div>

                    <div className="bg-sky-50/60 border border-sky-200/70 rounded-xl p-4">
                      <h5 className="text-xs font-bold text-sky-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <HelpCircle size={13} className="text-sky-600"/> Gợi ý phương pháp:
                      </h5>
                      <p className="text-xs text-sky-800 leading-relaxed">
                        {analysisResult.solutionHint || "Áp dụng định lý đạo hàm cấp 1, lập bảng biến thiên hoặc giải nhanh bằng phương pháp đồ thị."}
                      </p>
                    </div>
                  </div>

                </div>
              )}

            </div>

            {/* Footer Modal */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-500">
                FMATH12 AI Academic Engine &bull; GDPT 2018
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowAnalysisModal(false)}
                  className="px-5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300 font-bold rounded-lg transition-colors text-xs"
                >
                  Đóng
                </button>
                {!isCustomAnalysis && analyzingQuestion && analysisResult && (
                  <button 
                    onClick={() => handleApplyLevelToQuestion(analysisResult.level)}
                    disabled={isUpdatingLevel}
                    className="bg-primary hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-lg text-xs flex items-center gap-2 transition-colors shadow-xs disabled:opacity-50"
                  >
                    {isUpdatingLevel ? <Loader2 size={13} className="animate-spin"/> : <CheckCircle2 size={13}/>}
                    Lưu mức độ này
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default QuestionBank;