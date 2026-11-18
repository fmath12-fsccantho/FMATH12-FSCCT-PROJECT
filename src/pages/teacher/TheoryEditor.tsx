import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Save, Image as ImageIcon, Bold, Italic, 
  Heading, List, Sigma, Loader2, LayoutTemplate, SplitSquareHorizontal,
  ShieldCheck, AlertCircle, Award, Eye
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm'; 
import 'katex/dist/katex.min.css';
import { supabase } from '../../config/supabase';
import { useAppStore } from '../../store/useAppStore';
import { canEditTheoryContent, getUserRoleBadgeInfo } from '../../utils/permissionUtils';

const TheoryEditor = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAppStore();
  
  const [lesson, setLesson] = useState<any>(null);
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canEdit = canEditTheoryContent(currentUser);
  const badgeInfo = getUserRoleBadgeInfo(currentUser);

  useEffect(() => {
    const fetchLesson = async () => {
      if (!lessonId) return;
      setIsLoading(true);
      const { data, error } = await supabase
        .from('lessons')
        .select('id, title, theory_content, chapters(title)')
        .eq('id', lessonId)
        .single();

      if (data) {
        setLesson(data);
        setContent(data.theory_content || "");
      } else {
        alert("Không tìm thấy bài học!");
        navigate('/question-bank');
      }
      setIsLoading(false);
    };
    fetchLesson();
  }, [lessonId, navigate]);

  const handleSave = async () => {
    if (!canEdit) {
      return alert("Thầy/Cô không có quyền sửa đổi nội dung lý thuyết chuẩn của hệ thống.");
    }

    setIsSaving(true);
    const { error } = await supabase
      .from('lessons')
      .update({ theory_content: content })
      .eq('id', lessonId);

    setIsSaving(false);
    if (error) {
      alert("Lỗi lưu bài: " + error.message);
    } else {
      alert("Lưu nội dung lý thuyết thành công!");
      navigate('/question-bank');
    }
  };

  const insertText = (before: string, after: string = '') => {
    if (!canEdit) return;
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText = content.substring(0, start) + before + selectedText + after + content.substring(end);
    
    setContent(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canEdit) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME; 
      const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET; 
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { 
        method: 'POST', 
        body: formData 
      });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error?.message);
      
      const imageUrl = data.secure_url;
      insertText(`\n![Hình ảnh](${imageUrl})\n`, '');
      
    } catch (error: any) {
      alert('Lỗi Upload ảnh: ' + error.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Tùy chỉnh hiển thị Bảng, Ảnh cho thẻ Markdown
  const MarkdownComponents = {
    img: ({ node, ...props }: any) => (
      <img {...props} className="max-w-full h-auto rounded-2xl border border-slate-200 dark:border-slate-800 my-4 block shadow-sm mx-auto" alt={props.alt || "Ảnh minh họa"} loading="lazy" />
    ),
    table: ({ node, ...props }: any) => (
      <div className="w-full overflow-x-auto my-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
        <table className="w-full text-center border-collapse text-sm" {...props} />
      </div>
    ),
    thead: ({ node, ...props }: any) => <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-bold" {...props} />,
    tbody: ({ node, ...props }: any) => <tbody className="divide-y divide-slate-100 dark:divide-slate-800" {...props} />,
    tr: ({ node, ...props }: any) => <tr className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-850/50" {...props} />,
    th: ({ node, ...props }: any) => <th className="p-3 font-bold whitespace-nowrap align-middle" {...props} />,
    td: ({ node, ...props }: any) => <td className="p-3 align-middle text-slate-700 dark:text-slate-300" {...props} />,
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-72px)] text-blue-600 bg-slate-50 dark:bg-slate-950">
        <Loader2 size={40} className="animate-spin mb-3" />
        <p className="font-semibold text-xs text-slate-500">Đang tải trình soạn thảo lý thuyết...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-72px)] w-full bg-slate-50 dark:bg-slate-950 overflow-hidden animate-in fade-in">
      
      {/* HEADER BAR ĐỒNG BỘ */}
      <div className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 flex justify-between items-center px-4 md:px-6 shrink-0 relative z-10 shadow-xs">
        <div className="flex items-center gap-3">
          <Link 
            to="/question-bank" 
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-200/80 dark:border-slate-700"
            title="Quay lại ngân hàng câu hỏi"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 font-heading">
                {lesson?.chapters?.title || 'Toán 12'}
              </span>
              <span className="text-slate-400 text-xs">•</span>
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                canEdit 
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800' 
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800'
              }`}>
                {canEdit ? <Award size={11} /> : <Eye size={11} />}
                <span>{canEdit ? 'Quyền Biên tập' : 'Chỉ xem tham khảo'}</span>
              </span>
            </div>
            <h2 className="font-bold text-slate-900 dark:text-white truncate max-w-sm sm:max-w-md text-sm md:text-base font-heading m-0">
              {lesson?.title}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canEdit ? (
            <button 
              onClick={handleSave} 
              disabled={isSaving}
              className="btn-primary py-2 px-5 text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-sm"
            >
              {isSaving ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>} 
              <span>Lưu nội dung</span>
            </button>
          ) : (
            <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-3 py-1.5 rounded-xl font-medium hidden sm:flex items-center gap-1.5">
              <Eye size={14} /> Chế độ chỉ đọc
            </div>
          )}
        </div>
      </div>

      {/* BANNER THÔNG BÁO CHO GIÁO VIÊN TOÀN QUỐC (NẾU KHÔNG CÓ QUYỀN SỬA LÝ THUYẾT GỐC) */}
      {!canEdit && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/60 px-4 md:px-6 py-2.5 flex items-center justify-between text-xs text-amber-800 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <AlertCircle size={15} className="text-amber-600 shrink-0" />
            <span>
              <strong>Thông báo bản quyền:</strong> Bài học này là Giáo trình Chuẩn của THPT FPT Cần Thơ. Thầy/Cô có quyền xem và tham khảo. Chỉ Quản trị viên hoặc Giáo viên THPT FPT Cần Thơ mới có quyền lưu chỉnh sửa vào nội dung gốc.
            </span>
          </div>
          <Link to="/exam-editor" className="font-bold text-amber-700 dark:text-amber-300 hover:underline shrink-0 ml-3">
            Tạo đề thi riêng →
          </Link>
        </div>
      )}

      {/* THANH CÔNG CỤ SOẠN THẢO */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 p-2 flex flex-wrap gap-2 px-4 md:px-6 shrink-0 items-center justify-between">
        
        <div className="flex items-center gap-1">
          <button 
            disabled={!canEdit} 
            onClick={() => insertText('**', '**')} 
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg transition-colors disabled:opacity-40" 
            title="In đậm"
          >
            <Bold size={15}/>
          </button>
          <button 
            disabled={!canEdit} 
            onClick={() => insertText('*', '*')} 
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg transition-colors disabled:opacity-40" 
            title="In nghiêng"
          >
            <Italic size={15}/>
          </button>
          <button 
            disabled={!canEdit} 
            onClick={() => insertText('### ', '')} 
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg transition-colors disabled:opacity-40" 
            title="Tiêu đề mục (Heading)"
          >
            <Heading size={15}/>
          </button>
          
          <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-1"></div>
          
          <button 
            disabled={!canEdit} 
            onClick={() => insertText('- ', '')} 
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg transition-colors disabled:opacity-40" 
            title="Danh sách gạch đầu dòng"
          >
            <List size={15}/>
          </button>
          <button 
            disabled={!canEdit} 
            onClick={() => insertText('$$ ', ' $$')} 
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg transition-colors disabled:opacity-40" 
            title="Công thức Toán học KaTeX ($$...$$)"
          >
            <Sigma size={15}/>
          </button>
          
          <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-1"></div>
          
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
          <button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={!canEdit || isUploading}
            className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 rounded-lg font-bold text-xs transition-colors disabled:opacity-40 ml-1 cursor-pointer"
          >
            {isUploading ? <Loader2 size={13} className="animate-spin"/> : <ImageIcon size={13}/>}
            <span>Chèn ảnh</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <SplitSquareHorizontal size={14} className="text-blue-500"/>
          <span className="hidden sm:inline">Chia đôi màn hình (Soạn thảo & Xem trước)</span>
        </div>

      </div>

      {/* KHÔNG GIAN LÀM VIỆC CHÍNH (CHIA 2 CỘT) */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        
        {/* Cột trái: Trình soạn thảo */}
        <div className="flex-1 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 flex flex-col min-h-[300px] bg-slate-900 text-slate-100">
          <textarea
            ref={textareaRef}
            value={content}
            readOnly={!canEdit}
            onChange={(e) => setContent(e.target.value)}
            placeholder={canEdit ? "Bắt đầu soạn thảo lý thuyết bằng Markdown và LaTeX..." : "Chế độ chỉ đọc..."}
            className={`flex-1 w-full p-6 bg-transparent text-emerald-300 dark:text-emerald-300 font-mono text-xs md:text-sm leading-relaxed outline-none resize-none custom-scrollbar ${
              !canEdit ? 'cursor-not-allowed opacity-90' : ''
            }`}
            spellCheck={false}
          />
        </div>

        {/* Cột phải: Xem trước (Preview) */}
        <div className="flex-1 bg-white dark:bg-slate-900 overflow-y-auto custom-scrollbar p-6 md:p-8 relative">
          {content.trim() ? (
            <div className="prose prose-sm md:prose-base dark:prose-invert max-w-3xl mx-auto leading-relaxed overflow-x-auto [&_.katex-display]:my-4 [&_.katex-display]:overflow-x-auto [&_.katex-display]:py-2">
              <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]} components={MarkdownComponents}>
                {content}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
              <LayoutTemplate size={44} className="mb-3 text-blue-500" />
              <p className="font-bold text-xs m-0">Bản xem trước lý thuyết sẽ hiển thị tại đây</p>
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
};

export default TheoryEditor;