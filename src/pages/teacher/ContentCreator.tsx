import React, { useState } from 'react';
import { 
  Sparkles, BrainCircuit, Save, Copy, Check, RefreshCw, Layers, 
  BookOpen, CheckCircle2, AlertCircle, FileText, ArrowRight, Eye, 
  HelpCircle, Lightbulb, ChevronRight, CheckSquare, PlusCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';
import { supabase } from '../../config/supabase';
import { askGroqAI } from '../../services/groqAI';
import { useAppStore } from '../../store/useAppStore';
import { formatMathAndSteps } from '../../utils/mathLatexUtils';

const TOPIC_OPTIONS = [
  'Ứng dụng đạo hàm khảo sát và vẽ đồ thị hàm số',
  'Nguyên hàm, tích phân và ứng dụng hình học',
  'Tọa độ vecto và các phép toán vecto trong không gian',
  'Phương trình mặt phẳng, đường thẳng và mặt cầu',
  'Các số đặc trưng đo độ phân tán của mẫu số liệu ghép nhóm',
  'Xác suất có điều kiện và công thức Bayes',
  'Tối ưu kinh tế, vật lý, kỹ thuật và mô hình hóa'
];

const LEVEL_OPTIONS = ['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao'];

export const ContentCreator: React.FC = () => {
  const { currentUser } = useAppStore();
  const navigate = useNavigate();

  // Inputs
  const [rawText, setRawText] = useState('');
  const [teacherHint, setTeacherHint] = useState('');
  const [selectedTopic, setSelectedTopic] = useState(TOPIC_OPTIONS[0]);
  const [selectedLevel, setSelectedLevel] = useState('Thông hiểu');
  const [targetFormat, setTargetFormat] = useState<'auto' | 'mcq' | 'tf' | 'saq'>('auto');

  // Generation States
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestion, setGeneratedQuestion] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGenerateAI = async () => {
    if (!rawText.trim()) {
      setErrorMsg('Vui lòng nhập nội dung câu hỏi hoặc bài toán thô!');
      return;
    }

    setErrorMsg(null);
    setIsGenerating(true);
    setIsSaved(false);

    try {
      const systemPrompt = `Bạn là Chuyên gia Khảo thí và Biên soạn Học liệu Toán 12 hàng đầu chuẩn Bộ GD&ĐT (GDPT 2018).
Nhiệm vụ của bạn:
1. Đọc nội dung bài toán/câu hỏi do giáo viên cung cấp.
2. TỰ ĐỘNG TRÍCH XUẤT sang 1 trong 3 cấu trúc trắc nghiệm chuẩn mới năm 2026:
   - "mcq": Trắc nghiệm 4 phương án lựa chọn A, B, C, D (Phần I).
   - "tf": Trắc nghiệm Đúng/Sai với 4 ý a, b, c, d (Phần II).
   - "saq": Trả lời ngắn - học sinh điền số thực, phân số hoặc tọa độ (Phần III).
3. ĐẶC BIỆT LƯU Ý Ý ĐỒ CỦA GIÁO VIÊN:
   - Nếu giáo viên có cung cấp "GỢI Ý GIẢI / ĐÁP ÁN CỦA GIÁO VIÊN", bạn PHẢI tuân thủ tuyệt đối logic và đáp án này làm \`correct_answer\`.
   - Dùng chính gợi ý giải đó để viết phần \`explanation\` (Lời giải chi tiết từng bước) rõ ràng, khoa học, đầy đủ công thức toán học bằng LaTeX.
4. QUY TẮC CÔNG THỨC TOÁN (LATEX):
   - BẮT BUỘC mọi công thức toán inline bọc bằng dấu đô-la $: $y = f(x)$, $\\frac{d}{dx}(x^n) = n x^{n-1}$.
   - BẮT BUỘC công thức toán display dòng riêng bọc bằng $$: $$\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$$.
   - TUYỆT ĐỐI KHÔNG dùng \\[ hoặc \\] hoặc [ ... ] hoặc \\( hoặc \\) để bao quanh công thức toán học.
   - Trình bày lời giải chi tiết: mỗi bước phải xuống dòng rõ ràng, bắt đầu bằng "Bước 1: ...", "Bước 2: ...", "Bước 3: ...".
5. ĐỊNH DẠNG ĐẦU RA BẮT BUỘC:
   Chỉ trả về DUY NHẤT 1 chuỗi JSON hợp lệ (không kèm markdown \`\`\`json ở ngoài), theo mẫu sau:
{
  "type": "mcq" | "tf" | "saq",
  "level": "${selectedLevel}",
  "content": "Nội dung câu hỏi đầy đủ...",
  "options": [
    {"id": "A", "text": "Phương án A..."},
    {"id": "B", "text": "Phương án B..."},
    {"id": "C", "text": "Phương án C..."},
    {"id": "D", "text": "Phương án D..."}
  ],
  "correct_answer": "A" (với mcq) HOẶC {"a": true, "b": false, "c": true, "d": false} (với tf) HOẶC "12.5" (với saq),
  "explanation": "Bước 1: Viết hàm số...\\n\\nBước 2: Áp dụng quy tắc đạo hàm...\\n\\nBước 3: ...\\n\\nVậy đáp án đúng là..."
}`;

      const userPrompt = `[CHUYÊN ĐỀ MỤC TIÊU]: ${selectedTopic}
[MỨC ĐỘ NHẬN THỨC]: ${selectedLevel}
[DẠNG THỨC MỤC TIÊU]: ${targetFormat === 'auto' ? 'Tự động phát hiện cấu trúc phù hợp nhất' : targetFormat}
[GỢI Ý GIẢI / ĐÁP ÁN CỦA GIÁO VIÊN]:
${teacherHint.trim() ? teacherHint : '(Giáo viên chưa nhập gợi ý riêng, hãy tự giải chi tiết theo chuẩn mực sư phạm)'}

[NỘI DUNG BÀI TOÁN GỐC]:
${rawText}`;

      const aiResponse = await askGroqAI(systemPrompt, userPrompt);
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('AI không trả về định dạng JSON hợp lệ. Vui lòng thử lại!');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Chuẩn hóa và làm sạch toàn bộ công thức toán học & các bước giải
      const cleanedQuestion = {
        ...parsed,
        content: formatMathAndSteps(parsed.content),
        explanation: formatMathAndSteps(parsed.explanation),
        options: Array.isArray(parsed.options)
          ? parsed.options.map((opt: any) => ({ ...opt, text: formatMathAndSteps(opt.text) }))
          : parsed.options
      };

      setGeneratedQuestion(cleanedQuestion);
    } catch (err: any) {
      console.error('Lỗi sinh bài tập bằng AI:', err);
      setErrorMsg(err.message || 'Không thể tạo bài tập lúc này, vui lòng kiểm tra lại kết nối mạng!');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToBank = async () => {
    if (!generatedQuestion) return;
    setIsSaving(true);
    try {
      const newExercise = {
        content: generatedQuestion.content,
        options: generatedQuestion.options || [],
        correct_answer: typeof generatedQuestion.correct_answer === 'object' 
          ? JSON.stringify(generatedQuestion.correct_answer)
          : String(generatedQuestion.correct_answer),
        explanation: generatedQuestion.explanation || '',
        type: generatedQuestion.type || 'mcq',
        level: generatedQuestion.level || selectedLevel,
        sort_order: 0
      };

      const { data, error } = await supabase.from('exercises').insert(newExercise).select().single();
      if (error) throw error;

      setIsSaved(true);
      alert('🎉 Đã lưu câu hỏi thành công vào Ngân hàng 2.060 Câu hỏi hệ thống!');
    } catch (err: any) {
      console.error('Lỗi lưu câu hỏi:', err);
      alert('Lỗi khi lưu câu hỏi vào cơ sở dữ liệu: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="page-container p-6 bg-slate-50 dark:bg-slate-950 overflow-y-auto custom-scrollbar">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-bold font-heading mb-2">
              <Sparkles size={13} className="text-indigo-600 animate-pulse" />
              <span>Bộ Công Cụ Giáo Viên LMS • FMATH12 PRO</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-heading m-0">
              Biên Soạn Bài Tập Bằng AI
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Tự động trích xuất cấu trúc thi mới BGD 2026 (MCQ, Đúng/Sai, Điền số) và tạo lời giải chi tiết từ gợi ý giải của giáo viên.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/exam-creator')}
              className="btn-outline py-2 px-3 text-xs flex items-center gap-1.5 font-bold cursor-pointer rounded-xl"
            >
              <Layers size={14} /> Soạn Bộ Đề Thi
            </button>
            <button
              onClick={() => navigate('/question-bank')}
              className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5 font-bold cursor-pointer rounded-xl"
            >
              <BookOpen size={14} /> Ngân Hàng Câu Hỏi
            </button>
          </div>
        </div>

        {/* Studio Grid: Input (Trái) & Live Preview (Phải) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* CỘT TRÁI: FORM NHẬP LIỆU GIÁO VIÊN */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white font-heading uppercase">
                <BrainCircuit size={17} className="text-primary" />
                <span>1. Thông Tin & Đề Bài Gốc</span>
              </div>
              <span className="text-[11px] text-slate-400">Groq LLM 120B Engine</span>
            </div>

            {/* Chuyên đề & Mức độ nhận thức */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Chuyên đề trọng tâm:
                </label>
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="w-full text-xs font-semibold py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-200 outline-none focus:border-primary"
                >
                  {TOPIC_OPTIONS.map((t, idx) => (
                    <option key={idx} value={t}>{idx + 1}. {t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Mức độ nhận thức (Bloom):
                </label>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full text-xs font-semibold py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-200 outline-none focus:border-primary"
                >
                  {LEVEL_OPTIONS.map((lvl) => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dạng thức mục tiêu */}
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Dạng thức trắc nghiệm BGD 2026:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'auto', label: 'Tự động' },
                  { id: 'mcq', label: 'Phần I: MCQ' },
                  { id: 'tf', label: 'Phần II: Đúng/Sai' },
                  { id: 'saq', label: 'Phần III: Điền số' },
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setTargetFormat(fmt.id as any)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                      targetFormat === fmt.id
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Nội dung câu hỏi thô */}
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center justify-between mb-1">
                <span>Nội dung bài toán / Đề bài copy từ Word/PDF:</span>
                <span className="text-[11px] text-slate-400 font-normal">Hỗ trợ LaTeX</span>
              </label>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Ví dụ: Cho hàm số y = (2x - 1)/(x + 1). Tìm phương trình đường tiệm cận đứng và tiệm cận ngang..."
                rows={5}
                className="w-full text-xs font-sans p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 custom-scrollbar"
              />
            </div>

            {/* GỢI Ý GIẢI CỦA GIÁO VIÊN (TÍNH NĂNG TRỌNG TÂM) */}
            <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/70">
              <label className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5 mb-1">
                <Lightbulb size={14} className="text-amber-600" />
                <span>Gợi ý giải của giáo viên (Ý đồ đáp án & Hướng giải):</span>
              </label>
              <p className="text-[11px] text-amber-800/80 dark:text-amber-400/80 mb-2">
                Giáo viên có thể nhập đáp án đúng, gợi ý đặt ẩn phụ, công thức chủ đạo. AI sẽ tuân thủ tuyệt đối và triển khai lời giải chi tiết theo hướng này.
              </p>
              <textarea
                value={teacherHint}
                onChange={(e) => setTeacherHint(e.target.value)}
                placeholder="Ví dụ: Tiệm cận đứng x = -1, tiệm cận ngang y = 2. Hãy giải thích chi tiết bằng cách tính giới hạn khi x tiến tới vô cực và -1..."
                rows={3}
                className="w-full text-xs font-sans p-2.5 rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-amber-500"
              />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Nút bấm AI sinh bài tập */}
            <button
              onClick={handleGenerateAI}
              disabled={isGenerating}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold font-heading bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>Đang phân tích cấu trúc thi mới & Sinh lời giải...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>AI Trích Xuất Cấu Trúc Thi Mới & Tạo Lời Giải</span>
                </>
              )}
            </button>
          </div>

          {/* CỘT PHẢI: KẾT QUẢ XUẤT BẢN & XEM TRƯỚC (LIVE PREVIEW) */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white font-heading uppercase">
                  <Eye size={17} className="text-emerald-600" />
                  <span>2. Xem Trước Trực Quan (KaTeX)</span>
                </div>
                {generatedQuestion && (
                  <span className="badge-primary text-[10px] py-0.5 px-2 font-bold uppercase">
                    {generatedQuestion.type === 'mcq' ? 'Phần I: MCQ' : generatedQuestion.type === 'tf' ? 'Phần II: Đúng/Sai' : 'Phần III: Điền số'}
                  </span>
                )}
              </div>

              {!generatedQuestion ? (
                <div className="h-80 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-primary flex items-center justify-center mb-3">
                    <BrainCircuit size={28} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white m-0">
                    Sẵn sàng trích xuất bài tập
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    Nhập nội dung bài toán ở cột bên trái và bấm nút AI để xem trước cấu trúc trắc nghiệm chuẩn hóa 2026.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Nội dung câu hỏi */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-800">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                      Đề bài ({generatedQuestion.level || selectedLevel}):
                    </span>
                    <div className="text-sm text-slate-900 dark:text-white leading-relaxed font-serif prose dark:prose-invert max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                        {formatMathAndSteps(generatedQuestion.content)}
                      </ReactMarkdown>
                    </div>
                  </div>

                  {/* Các phương án (Nếu là MCQ) */}
                  {generatedQuestion.options && generatedQuestion.options.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                        Các phương án lựa chọn:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {generatedQuestion.options.map((opt: any, idx: number) => {
                          const isCorrect = String(generatedQuestion.correct_answer).toUpperCase() === String(opt.id).toUpperCase();
                          return (
                            <div 
                              key={idx}
                              className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                                isCorrect 
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 font-bold text-emerald-900 dark:text-emerald-200' 
                                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 font-mono ${
                                isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                              }`}>
                                {opt.id}
                              </span>
                              <div className="prose dark:prose-invert text-xs">
                                <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                                  {formatMathAndSteps(opt.text)}
                                </ReactMarkdown>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Lời giải chi tiết từ AI dựa trên gợi ý giáo viên */}
                  {generatedQuestion.explanation && (
                    <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wide mb-2">
                        <CheckCircle2 size={14} className="text-emerald-600" />
                        <span>Lời giải chi tiết từng bước:</span>
                      </div>
                      <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans prose dark:prose-invert max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                          {formatMathAndSteps(generatedQuestion.explanation)}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Nút Lưu bài tập vào ngân hàng */}
            {generatedQuestion && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 mt-4">
                <span className="text-xs text-slate-400">
                  {isSaved ? '✅ Đã lưu vào ngân hàng' : 'Sẵn sàng nạp vào hệ thống'}
                </span>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(generatedQuestion, null, 2));
                      alert('Đã sao chép JSON câu hỏi vào Clipboard!');
                    }}
                    className="btn-outline py-2 px-3 text-xs flex items-center gap-1.5 font-bold cursor-pointer rounded-xl"
                  >
                    <Copy size={13} /> Copy JSON
                  </button>
                  <button
                    onClick={handleSaveToBank}
                    disabled={isSaving || isSaved}
                    className="btn-primary py-2 px-4 text-xs flex items-center gap-2 font-bold cursor-pointer rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Đang lưu...</span>
                      </>
                    ) : isSaved ? (
                      <>
                        <Check size={14} />
                        <span>Đã lưu thành công!</span>
                      </>
                    ) : (
                      <>
                        <Save size={14} />
                        <span>Lưu Vào Ngân Hàng 2.060 Câu</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default ContentCreator;
