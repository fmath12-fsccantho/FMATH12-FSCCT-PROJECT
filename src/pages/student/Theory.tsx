import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  BookOpen, FileText, ChevronRight, CheckCircle2, PlayCircle, BookA, Target, 
  BrainCircuit, XCircle, Loader2, Flame, Trophy, Menu, X, ArrowRight, Check, Send, 
  Sparkles, User, Lightbulb, ChevronDown, MessageCircle, Layers, Search, Filter,
  Maximize2, Minimize2, ZoomIn, ZoomOut, Bookmark, Share2, HelpCircle, FileCheck,
  Clock, Zap, Award, Sun, Moon, Compass, BarChart2, RefreshCcw, ShieldCheck, ChevronLeft, HelpCircle as HintIcon
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';
import { useAppStore } from '../../store/useAppStore';
import { courseService } from '../../services/courseService';
import { supabase } from '../../config/supabase';
import { askGroqAI } from '../../services/groqAI';
import { calculateStreakUpdate } from '../../utils/streakUtils';
import { MathGraphPlotter } from '../../components/common/MathGraphPlotter';

// 4 Bậc kiến thức chuẩn sư phạm Toán học 12
const SCAFFOLDING_TIERS = [
  {
    tier: 1,
    title: 'Bậc 1: Trực quan & Bản chất Ý niệm',
    badge: 'Nền tảng',
    color: 'emerald',
    desc: 'Bản chất ý nghĩa hình học & thực tế, giúp não bộ kết nối tri thức trực quan trước khi nhớ công thức.',
    prompt: 'Thầy hãy giải thích bản chất trực quan và ý nghĩa thực tế của bài học này giúp em, không dùng công thức phức tạp nhé.'
  },
  {
    tier: 2,
    title: 'Bậc 2: Khung Định lý & Công thức Chuẩn',
    badge: 'Cốt lõi',
    color: 'blue',
    desc: 'Hệ thống hóa định lý trọng tâm, điều kiện xác định và công thức bắt buộc cho kỳ thi THPTQG.',
    prompt: 'Thầy hãy tổng hợp khung định lý và bảng công thức cốt lõi của bài học này theo chuẩn SGK GDPT 2018.'
  },
  {
    tier: 3,
    title: 'Bậc 3: Ví dụ Dẫn dắt & Thủ thuật Casio',
    badge: 'Phương pháp',
    color: 'amber',
    desc: 'Phương pháp giải mẫu có hướng dẫn từng bước (Bước 1, Bước 2) kèm kỹ thuật bấm máy tính cầm tay bứt tốc.',
    prompt: 'Thầy hãy hướng dẫn 1 ví dụ mẫu dạng bài tập trọng tâm và chỉ cho em mẹo bấm máy tính Casio nếu có nhé.'
  },
  {
    tier: 4,
    title: 'Bậc 4: Giải mã Bẫy Đề Thi & Chinh Phục 9+',
    badge: 'Nâng cao',
    color: 'rose',
    desc: 'Nhận diện các bẫy đề thi hay lừa, điểm mấu chốt tránh mất điểm oan và hướng tới điểm 9+.',
    prompt: 'Trong phần này học sinh thường hay mắc bẫy sai lầm nào nhất và cách nhận diện đề thi lừa đảo ra sao hả thầy?'
  }
];

const getQuestionType = (q: any) => {
  if (!q) return 'mcq';
  if (typeof q.correct_answer === 'object' && q.correct_answer !== null) return 'tf';
  if (typeof q.correct_answer === 'string') {
    const cleanCA = q.correct_answer.toLowerCase().trim();
    if (cleanCA.includes('true') || cleanCA.includes('false')) return 'tf';
  }
  const typeStr = String(q.type || '').toLowerCase().trim();
  if (['mcq', 'tf', 'saq'].includes(typeStr)) return typeStr;
  const hasOptions = Array.isArray(q.options) && q.options.length > 0;
  if (!hasOptions) return 'saq';
  return 'mcq';
};

const parseTFAnswer = (ans: any) => {
  let parsed: any = {};
  if (typeof ans === 'string') { try { parsed = JSON.parse(ans); } catch { return {}; } } 
  else if (typeof ans === 'object' && ans !== null) { parsed = ans; }
  
  let normalized: any = {};
  Object.keys(parsed).forEach(k => {
    normalized[String(k).toLowerCase().trim()] = parsed[k];
  });
  return normalized;
};

const isMcqCorrect = (userAns: any, correctAns: any) => {
  if (userAns == null || correctAns == null) return false;
  return String(userAns).trim().toLowerCase() === String(correctAns).trim().toLowerCase();
};

const isSaqCorrect = (userAns: any, correctAns: any) => {
  if (userAns == null || correctAns == null) return false;
  return String(userAns).trim().replace(/,/g, '.').toLowerCase() === String(correctAns).trim().replace(/,/g, '.').toLowerCase();
};

const Theory = () => {
  const { currentUser, setUser } = useAppStore();
  const [chapters, setChapters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // States Lựa chọn
  const [selectedChapterId, setSelectedChapterId] = useState<number | string>("all");
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'theory' | 'scaffolding' | 'practice'>('theory');
  const [activeScaffoldingTier, setActiveScaffoldingTier] = useState<number>(1);

  // New Design UI States
  const [searchQuery, setSearchQuery] = useState<string>(''); 
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal'); 
  const [readingTheme, setReadingTheme] = useState<'light' | 'sepia' | 'dark'>('light');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isZenMode, setIsZenMode] = useState<boolean>(false); // Chế độ tập trung tối đa
  const [contentWidth, setContentWidth] = useState<'standard' | 'wide'>('standard'); // Chiều rộng bài đọc

  // State Bài tập & Reward
  const [currentExIndex, setCurrentExIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submittedQuestions, setSubmittedQuestions] = useState<Record<string, boolean>>({});
  const [showRewardModal, setShowRewardModal] = useState(false);

  // --- TRỢ GIẢNG AI SCAFFOLDING ---
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [aiChatHistory, setAiChatHistory] = useState<{role: string, content: string}[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null); 
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const aiInputRef = useRef<HTMLTextAreaElement>(null);

  // --- NỘI DUNG AI CHO 4 BẬC HỌC TẬP TÍCH HỢP TRỰC TIẾP (KHÔNG Ở GÓC) ---
  const [tierAiContent, setTierAiContent] = useState<Record<number, string>>({});
  const [isGeneratingTierAi, setIsGeneratingTierAi] = useState<Record<number, boolean>>({});
  const [tierConversations, setTierConversations] = useState<Record<number, { role: 'user' | 'ai'; content: string }[]>>({});
  const [tierInputText, setTierInputText] = useState("");
  const [isTierReplying, setIsTierReplying] = useState(false);

  // --- BÔI ĐEN HỎI AI ---
  const [selectedText, setSelectedText] = useState("");
  const [selectionPos, setSelectionPos] = useState<{ top: number, left: number } | null>(null);

  // Tự động rà soát và thanh lọc bộ nhớ cache chứa mã ảnh quicklatex lỗi thời
  useEffect(() => {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('fmath12_tier_lesson_')) {
          const val = localStorage.getItem(key) || '';
          if (val.includes('quicklatex') || val.includes('latex3.f') || val.includes('![Đồ thị')) {
            keysToRemove.push(key);
          }
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (e) {}
  }, []);

  useEffect(() => {
    const fetchCourse = async () => {
      setIsLoading(true);
      const data = await courseService.getCurriculum(currentUser.id);
      setChapters(data);
      if (data.length > 0) {
        setSelectedChapterId("all");
        if (data[0].lessons?.length > 0) handleSelectLesson(data[0].lessons[0]);
      }
      setIsLoading(false);
      if (window.innerWidth < 1024) setIsSidebarOpen(false);
    };
    fetchCourse();
  }, [currentUser.id]);

  useEffect(() => { 
    if (chatEndRef.current && isAiChatOpen) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [aiChatHistory, isAiTyping, isAiChatOpen]);

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      setSelectedText(selection.toString().trim());
      setSelectionPos({
        top: rect.top - 40,
        left: rect.left + rect.width / 2
      });
    } else {
      setSelectionPos(null);
      setSelectedText("");
    }
  };

  const handleAskSelectedText = () => {
    setIsAiChatOpen(true);
    setAiInput(`Thầy giải thích và hướng dẫn giúp em đoạn văn bản này với ạ:\n"${selectedText}"\n`);
    setSelectionPos(null);
    setSelectedText("");
    setTimeout(() => aiInputRef.current?.focus(), 100);
  };

  const handleSelectLesson = async (lesson: any) => {
    setActiveLesson(lesson);
    setActiveTab('theory'); 
    setActiveScaffoldingTier(1);
    setAnswers({});
    setSubmittedQuestions({});
    setCurrentExIndex(0);
    setSelectionPos(null); 
    
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
    if (contentScrollRef.current) contentScrollRef.current.scrollTop = 0;

    // AI Chào mừng bài học
    setAiChatHistory([]);
    setIsAiTyping(true); 
    try {
      const sysPrompt = `================================================================================
BẠN LÀ FMATH12 AI TUTOR - CHUYÊN GIA SƯ PHẠM TOÁN 12 CHUẨN BỘ GIÁO DỤC & ĐÀO TẠO
================================================================================
[THÔNG TIN HỌC SINH]
- Học sinh: ${currentUser.name}
- Bài học vừa mở: "${lesson.title}"

[NGUYÊN TẮC SƯ PHẠM DẪN DẮT TỪNG BƯỚC]
1. Viết đúng 1 câu chào thân thiện, khích lệ học sinh bắt đầu bài học.
2. Nêu đúng 1 câu ý niệm trực quan cốt lõi của bài "${lesson.title}".
3. Khuyến khích học sinh học tập theo 4 Bậc kiến thức để khắc sâu bản chất.
4. TUYỆT ĐỐI KHÔNG dùng các từ ngữ kỹ thuật như "Scaffolding", "giàn giáo", "đơn thuốc", "nấc" khi nói chuyện với học sinh.
5. Bọc công thức toán học trong ký tự $...$ hoặc $$...$$. Tổng độ dài KHÔNG quá 3 câu ngắn.
================================================================================`;
      
      const greeting = await askGroqAI(sysPrompt, `Hãy chào và mở đầu hướng dẫn bài "${lesson.title}".`);
      setAiChatHistory([{ role: 'ai', content: greeting }]);
    } catch (e) {
      setAiChatHistory([{ role: 'ai', content: `Chào ${currentUser.name}, thầy là FMATH12 AI Tutor. Thầy sẽ đồng hành hướng dẫn em từng bước chinh phục bài "${lesson.title}" nhé!` }]);
    } finally { setIsAiTyping(false); }
  };

  const handleSendAiMessage = async (customMsg?: string, tierContext?: number) => {
    const userMsg = customMsg || aiInput;
    if (!userMsg.trim() || isAiTyping) return;
    setAiInput(""); 
    setAiChatHistory(prev => [...prev, { role: 'user', content: userMsg }]); 
    setIsAiTyping(true);

    try {
      const tierGuide = tierContext ? `[YÊU CẦU BẬC ${tierContext}] Hãy trả lời bám sát Bậc ${tierContext}: ${SCAFFOLDING_TIERS[tierContext - 1]?.title}` : '';
      const sysPrompt = `================================================================================
BẠN LÀ FMATH12 AI TUTOR - CHUYÊN GIA SƯ PHẠM TOÁN 12 CHUẨN BỘ GIÁO DỤC & ĐÀO TẠO
================================================================================
[BỐ CẢNH BÀI HỌC]
- Học sinh: ${currentUser.name}
- Chuyên đề bài học: "${activeLesson?.title || 'Toán học 12'}"
${tierGuide}

[QUY TẮC GIẢNG DẠY DẪN DẮT TỪNG BƯỚC]
1. Nếu học sinh hỏi gợi ý hoặc đang bí bài: TUYỆT ĐỐI KHÔNG đưa ngay đáp số cuối cùng. Hãy gợi mở ý niệm trực quan, nhắc lại định lý và hướng dẫn bước đầu tiên.
2. TUYỆT ĐỐI KHÔNG dùng các từ ngữ kỹ thuật như "Scaffolding", "giàn giáo", "đơn thuốc", "nấc" trong câu trả lời.
3. Nếu học sinh yêu cầu giải chi tiết (Bậc 3): Trình bày mạch lạc từng bước (Bước 1, Bước 2, Bước 3) với tiêu đề in đậm rõ ràng, giải thích cặn kẽ TẠI SAO lại tư duy như vậy.
4. Luôn bọc toàn bộ công thức và biến số toán trong ký tự $...$ hoặc $$...$$ để hiển thị KaTeX đẹp mắt.
5. Xưng hô chuẩn mực: "Thầy" - "Em". Giữ phong thái ân cần, động viên, dẫn dắt học sinh tự chủ.
6. Nếu câu hỏi ngoài lề môn Toán 12, lịch sự từ chối: "Thầy là trợ lý chuyên sâu môn Toán 12 của FMATH12. Thầy chỉ có thể hỗ trợ em các nội dung liên quan đến Toán học thôi nhé."
================================================================================`;

      const aiReply = await askGroqAI(sysPrompt, userMsg);
      setAiChatHistory(prev => [...prev, { role: 'ai', content: aiReply }]);
    } catch (e) {
      setAiChatHistory(prev => [...prev, { role: 'ai', content: "Xin lỗi em, đường truyền mạng đang bận. Em đợi một chút rồi hỏi lại thầy nhé!" }]);
    } finally { setIsAiTyping(false); }
  };

  // ==========================================
  // HỆ THỐNG GIẢNG DẠY AI NHÚNG TRỰC TIẾP VÀO 4 BẬC (KHÔNG NẰM Ở GÓC)
  // ==========================================
  const sanitizeAiMarkdown = (content: string): string => {
    if (!content) return '';
    let cleaned = content;
    // 1. Chỉ xóa các thẻ ảnh markdown chứa link quicklatex / codecogs / latex3 lỗi
    cleaned = cleaned.replace(/!\[[^\]]*\]\([^\n)]*(?:quicklatex|codecogs|latex3)[^\n)]*?\)/gi, '');
    // 2. Xóa URL trần quicklatex
    cleaned = cleaned.replace(/https?:\/\/[^\s)]*quicklatex\.com[^\s)]*/gi, '');
    // 3. Tự động phục hồi thẻ ảnh markdown chuẩn cho các link ảnh Cloudinary hợp lệ (kể cả khi bị trần hoặc dính dấu ngoặc cuối)
    cleaned = cleaned.replace(/(?<!\()https?:\/\/(res\.cloudinary\.com\/[^\s)]+\.(?:png|jpg|jpeg|webp))\)?/gi, '\n\n![Hình ảnh minh họa](https://$1)\n\n');
    
    // 4. TỰ ĐỘNG CHUYỂN ĐỔI CÔNG THỨC NGOẶC VUÔNG [ ... ] THÀNH $$ ... $$ ĐỂ KATEX HIỂN THỊ CHUẨN
    cleaned = cleaned.replace(/\\\[([\s\S]*?)\\\]/g, (m, p1) => `\n$$${p1.trim()}$$\n`);
    cleaned = cleaned.replace(/(?:^|\n)\[\s*(\\begin\{[\s\S]*?\\end\{[^}]+\})\s*\]/g, (m, p1) => `\n$$${p1.trim()}$$\n`);
    cleaned = cleaned.replace(/(?:^|\n)\[\s*([^\n\[\]]{5,})\s*\](?=\n|$)/g, (match, p1) => {
      if (/[\\^_=]|x\{|\\bigl|\\frac|\\text|\\mathbb|\\Longleftrightarrow|\\Longrightarrow/i.test(p1)) {
        return `\n$$${p1.trim()}$$\n`;
      }
      return match;
    });

    // 5. Dọn các dòng trích dẫn rỗng sau khi xóa ảnh
    cleaned = cleaned.replace(/^\s*>\s*$/gm, '');
    return cleaned.trim();
  };

  const fetchTierAiLesson = async (tier: number, lesson: any, force = false) => {
    if (!lesson) return;
    if (!force && tierAiContent[tier]) return;

    const cacheKey = `fmath12_tier_lesson_${lesson.id}_${tier}`;
    if (!force) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        // Tự động xóa cache nếu trước đây lưu trúng link ảnh lỗi quicklatex hoặc ![Đồ thị
        if (cached.includes('quicklatex') || cached.includes('latex3.f') || cached.includes('![Đồ thị')) {
          localStorage.removeItem(cacheKey);
        } else {
          setTierAiContent(prev => ({ ...prev, [tier]: sanitizeAiMarkdown(cached) }));
          return;
        }
      }
    }

    setIsGeneratingTierAi(prev => ({ ...prev, [tier]: true }));

    const commonGuidelines = `
QUY TẮC ĐỊNH DẠNG & MINH HỌA ĐỒ THỊ CHUẨN XÁC 100%:
- CÔNG THỨC TOÁN: BẮT BUỘC dùng $...$ cho công thức trên dòng và $$...$$ cho công thức khối riêng. TUYỆT ĐỐI KHÔNG dùng dấu ngoặc vuông [ ... ] để bọc công thức hoặc \\begin{aligned}.
- TUYỆT ĐỐI KHÔNG sinh thẻ ảnh markdown ![...](...) hay chèn link ảnh từ bên thứ ba (quicklatex, codecogs,...).
- ĐỂ VẼ ĐỒ THỊ HÀM SỐ (BẬC BA, PARABOL, PHÂN THỨC...): HÃY DÙNG KHỐI MÃ function-plot:
  \`\`\`function-plot
  fn: x^3 - 3*x + 2
  domain: -3, 3
  extrema: (-1, 4, Cực đại), (1, 0, Cực tiểu)
  title: Đồ thị hàm số f(x) = x³ - 3x + 2
  \`\`\`
  (Hệ thống FMATH12 Math Engine sẽ tự động dựng đồ thị hàm số chuẩn xác 100% từng pixel, đúng tuyệt đối hình dạng và các điểm cực trị).
- Để minh họa bảng biến thiên: DÙNG BẢNG MARKDOWN CHUẨN (| $x$ | $-\\infty$ | $x_0$ | $+\\infty$ |) kết hợp mũi tên KaTeX ($\\nearrow$, $\\searrow$).
- TUYỆT ĐỐI không dùng các từ "Scaffolding", "giàn giáo", "đơn thuốc", "nấc".`;

    let tierPrompt = '';
    if (tier === 1) {
      tierPrompt = `Bạn là FMATH12 AI - Chuyên gia Sư phạm Toán 12 Chuẩn Bộ GD&ĐT.
Hãy giảng giải BẬC 1: TRỰC QUAN & BẢN CHẤT Ý NIỆM cho bài học: "${lesson.title}".

YÊU CẦU NỘI DUNG:
1. **Ý niệm trực quan & Ý nghĩa thực tế**: Giải thích bản chất hình học hoặc hiện tượng đời sống dẫn tới khái niệm này, dùng ví dụ đời thực (chuyển động, đồ thị, thực tế kinh tế/vật lý).
2. **Hình vẽ minh họa trực quan (BẮT BUỘC DÙNG KHỐI MÃ \`\`\`function-plot ... \`\`\` HOẶC \`\`\`svg ... \`\`\`)**:
   - Dùng khối mã function-plot với hàm số cụ thể và các điểm cực trị để hệ thống dựng đồ thị toán học chuẩn xác 100%.
3. **Logic cốt lõi (Vì sao quy tắc lại đúng?)**: Giúp học sinh hiểu sâu bản chất thay vì học vẹt công thức.
4. **Mẹo tư duy trực quan nhanh**: Cách nhìn hình vẽ / đồ thị / bảng biến thiên để nhận diện nhanh quy luật (vẽ bảng biến thiên bằng Bảng Markdown chuẩn).
${commonGuidelines}`;
    } else if (tier === 2) {
      tierPrompt = `Bạn là FMATH12 AI - Chuyên gia Sư phạm Toán 12 Chuẩn Bộ GD&ĐT.
Hãy giảng giải BẬC 2: KHUNG ĐỊNH LÝ & CÔNG THỨC CHUẨN cho bài học: "${lesson.title}".

YÊU CẦU NỘI DUNG:
1. **Khung Định lý Trọng tâm (Chuẩn SGK 2018)**: Các định lý bắt buộc nhớ, điều kiện cần và đủ.
2. **Bảng Công thức Cốt lõi**: Hệ thống hóa toàn bộ công thức bằng KaTeX $...$ hoặc $$...$$.
3. **Điều kiện xác định & Điểm dễ quên**: Các điểm biên, điểm không xác định, dấu bằng xảy ra khi nào.
${commonGuidelines}`;
    } else if (tier === 3) {
      tierPrompt = `Bạn là FMATH12 AI - Chuyên gia Sư phạm Toán 12 Chuẩn Bộ GD&ĐT.
Hãy giảng giải BẬC 3: VÍ DỤ DẪN DẮT & THỦ THUẬT CASIO cho bài học: "${lesson.title}".

YÊU CẦU NỘI DUNG:
1. **Ví dụ Mẫu Tiêu chuẩn (Phân tích 3 bước)**:
   - Bài toán mẫu điển hình trong đề thi THPTQG.
   - Trình bày 3 bước: Bước 1 (Tìm TXĐ, tính đạo hàm/biến đổi bằng $$...$$), Bước 2 (Lập phương trình/BBT dạng Markdown Table), Bước 3 (Kết luận).
   - Dùng khối mã function-plot để minh họa trực quan đồ thị nếu bài toán có hàm số.
2. **Thủ thuật Bấm máy tính Casio fx-580VN X**:
   - Hướng dẫn cụ thể thao tác phím (Mode 8 Table, Shift Solve, d/dx).
   - Thiết lập Start, End, Step tối ưu để không sót nghiệm.
${commonGuidelines}`;
    } else {
      tierPrompt = `Bạn là FMATH12 AI - Chuyên gia Sư phạm Toán 12 Chuẩn Bộ GD&ĐT.
Hãy giảng giải BẬC 4: GIẢI MÃ BẪY ĐỀ THI & CHINH PHỤC 9+ cho bài học: "${lesson.title}".

YÊU CẦU NỘI DUNG:
1. **Top 3 Bẫy Đề Thi "Hiểm hóc"**: Những điểm gài bẫy học sinh hay mất điểm nhất (khoảng vs đoạn, đồ thị f'(x) vs f(x), điều kiện mẫu số).
2. **Kỹ năng chiến thuật cho dạng Đúng/Sai (Phần II) & Trả lời ngắn (Phần III)**: Cách kiểm tra tính chính xác của các mệnh đề phụ.
3. **Tư duy Bài toán Phân hóa 9+**: Hướng dẫn tư duy giải quyết câu hỏi vận dụng cao (ghép trục, đổi biến, hàm đặc trưng hoặc tham số m).
${commonGuidelines}`;
    }

    try {
      const response = await askGroqAI(
        "Bạn là Thầy Trợ Giảng FMATH12 AI - Chuyên gia Sư phạm Toán 12 Chuẩn Bộ GD&ĐT.",
        tierPrompt
      );
      if (response) {
        const cleaned = sanitizeAiMarkdown(response);
        setTierAiContent(prev => ({ ...prev, [tier]: cleaned }));
        localStorage.setItem(cacheKey, cleaned);
      }
    } catch (err) {
      console.warn("Lỗi fetch AI tier lesson:", err);
      setTierAiContent(prev => ({
        ...prev,
        [tier]: `### Bài giảng Bậc ${tier}: ${SCAFFOLDING_TIERS[tier - 1]?.title}\n\nTrong bài học **${lesson.title}**, học sinh cần nắm vững các nguyên tắc tư duy sư phạm để chinh phục điểm cao kỳ thi THPTQG.`
      }));
    } finally {
      setIsGeneratingTierAi(prev => ({ ...prev, [tier]: false }));
    }
  };

  const handleSendTierMessage = async (customQuestion?: string) => {
    const q = customQuestion || tierInputText;
    if (!q.trim() || isTierReplying || !activeLesson) return;
    setTierInputText("");

    const currentTier = activeScaffoldingTier;
    const newHistory = [...(tierConversations[currentTier] || []), { role: 'user' as const, content: q }];
    setTierConversations(prev => ({ ...prev, [currentTier]: newHistory }));
    setIsTierReplying(true);

    try {
      const sysPrompt = `Bạn là Thầy Trợ Giảng FMATH12 AI phụ trách BẬC ${currentTier} (${SCAFFOLDING_TIERS[currentTier - 1]?.title}) của bài học "${activeLesson.title}".
Hãy trả lời ân cần, sư phạm, dẫn dắt học sinh tự hiểu bản chất. Bọc công thức trong $...$ hoặc $$...$$. TUYỆT ĐỐI không dùng từ Scaffolding, giàn giáo, đơn thuốc, nấc.`;

      const reply = await askGroqAI(sysPrompt, q);
      setTierConversations(prev => ({
        ...prev,
        [currentTier]: [...(prev[currentTier] || []), { role: 'ai' as const, content: reply }]
      }));
    } catch (e) {
      setTierConversations(prev => ({
        ...prev,
        [currentTier]: [...(prev[currentTier] || []), { role: 'ai' as const, content: "Xin lỗi em, đường truyền mạng đang bận. Em thử lại nhé!" }]
      }));
    } finally {
      setIsTierReplying(false);
    }
  };

  // Tự động kích hoạt tải bài giảng AI khi học sinh chọn Bậc
  useEffect(() => {
    if (activeLesson && activeTab === 'scaffolding') {
      fetchTierAiLesson(activeScaffoldingTier, activeLesson);
    }
  }, [activeLesson?.id, activeTab, activeScaffoldingTier]);

  const currentExercise = activeLesson?.exercises?.[currentExIndex];
  const qType = getQuestionType(currentExercise);

  const handleAnswerMCQ = (optionId: string) => {
    if (submittedQuestions[currentExercise.id]) return;
    setAnswers(prev => ({ ...prev, [currentExercise.id]: String(optionId).toLowerCase().trim() }));
  };

  const handleAnswerTF = (subId: string, value: boolean) => {
    if (submittedQuestions[currentExercise.id]) return;
    const normSubId = String(subId).toLowerCase().trim();
    setAnswers(prev => ({ ...prev, [currentExercise.id]: { ...(prev[currentExercise.id] || {}), [normSubId]: value } }));
  };

  const handleAnswerSAQ = (value: string) => {
    if (submittedQuestions[currentExercise.id]) return;
    setAnswers(prev => ({ ...prev, [currentExercise.id]: value }));
  };

  const handleCheckAnswer = async () => {
    const qId = currentExercise.id;
    const userAns = answers[qId];
    if (userAns == null || submittedQuestions[qId]) return;

    setSubmittedQuestions(prev => ({ ...prev, [qId]: true }));
    let isCorrect = false;
    
    if (qType === 'tf') {
      let correctCount = 0;
      const parsedCorrect = parseTFAnswer(currentExercise.correct_answer);
      currentExercise.options?.forEach((opt: any, idx: number) => {
        const optId = String(opt.id || ['a', 'b', 'c', 'd'][idx] || idx).toLowerCase().trim();
        if (userAns[optId] === parsedCorrect[optId]) correctCount++;
      });
      isCorrect = correctCount === (currentExercise.options?.length || 4);
    } 
    else if (qType === 'saq') {
      isCorrect = isSaqCorrect(userAns, currentExercise.correct_answer);
    } 
    else {
      isCorrect = isMcqCorrect(userAns, currentExercise.correct_answer);
    }

    if (isCorrect && !activeLesson.isCompleted && currentUser.id) {
        const newXP = (currentUser.xp || 0) + 10;
        const newLevel = Math.floor(newXP / 100) + 1;
        supabase.from('users').update({ xp: newXP, level: newLevel }).eq('id', currentUser.id).select().single().then(({data}) => { if(data) setUser(data); });
    }
  };

  const handleNextQuestion = () => { 
    if (currentExIndex < activeLesson.exercises.length - 1) setCurrentExIndex(prev => prev + 1); 
  };

  const handleCompleteLesson = async () => {
    if (!currentUser?.id || activeLesson.isCompleted) return;
    courseService.markLessonCompleted(currentUser.id, activeLesson.id);
    
    const newXP = (currentUser.xp || 0) + 50;
    const newLevel = Math.floor(newXP / 100) + 1;
    const streakResult = calculateStreakUpdate(currentUser.streak, currentUser.last_active_date);

    supabase.from('users').update({ 
      xp: newXP, 
      level: newLevel, 
      streak: streakResult.streak,
      last_active_date: streakResult.lastActiveDate 
    }).eq('id', currentUser.id).select().single().then(({data}) => { if(data) setUser(data); });

    setChapters(prevChaps => prevChaps.map(c => ({...c, lessons: c.lessons.map((l: any) => l.id === activeLesson.id ? { ...l, isCompleted: true } : l)})));
    setActiveLesson((prev: any) => ({ ...prev, isCompleted: true }));
    setShowRewardModal(true);
  };

  const MarkdownComponents = {
    img: ({ node, ...props }: any) => {
      const src = props.src || '';
      // Ngăn chặn các URL hỏng hoặc hallucinated link quicklatex/codecogs
      if (!src || src.includes('quicklatex') || src.includes('latex3.f') || src.includes('codecogs')) {
        return null;
      }
      return (
        <span className="block my-6 text-center">
          <span className="inline-block p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md max-w-full">
            <img 
              {...props} 
              className="max-w-full max-h-[380px] h-auto rounded-xl mx-auto block object-contain" 
              alt={props.alt || "Hình vẽ minh họa Toán 12"} 
              loading="lazy" 
              onError={(e) => {
                // Tự động ẩn figure nếu link ảnh lỗi mạng hoặc không tải được
                const target = e.currentTarget as HTMLElement;
                const parent = target.closest('span.block');
                if (parent) (parent as HTMLElement).style.display = 'none';
              }}
            />
          </span>
          {props.alt && props.alt !== 'Hình ảnh' && (
            <span className="block text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium italic">{props.alt}</span>
          )}
        </span>
      );
    },
    a: ({ node, ...props }: any) => (
      <a {...props} className="text-blue-600 dark:text-blue-400 hover:underline font-semibold" target="_blank" rel="noopener noreferrer" />
    ),
    blockquote: ({ node, ...props }: any) => (
      <div className="my-6 p-5 rounded-2xl bg-gradient-to-r from-blue-50/80 via-sky-50/40 to-transparent dark:from-blue-950/40 dark:to-slate-900 border-l-4 border-blue-600 dark:border-blue-500 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 font-heading mb-1.5">
          <Lightbulb size={15} /> Điểm trọng tâm / Định lý
        </div>
        <div className="text-slate-800 dark:text-slate-200 text-[14.5px] leading-relaxed">
          {props.children}
        </div>
      </div>
    ),
    table: ({ node, ...props }: any) => (
      <div className="my-6 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <table className="w-full text-left border-collapse text-sm" {...props} />
      </div>
    ),
    code: ({ node, inline, className, children, ...props }: any) => {
      const text = String(children || '').trim();
      const match = /language-(\w+)/.exec(className || '');
      const lang = match ? match[1].toLowerCase() : '';

      // 1. Nhận diện đồ thị hàm số chuẩn xác 100% bằng Math Engine
      if (!inline && (lang === 'function-plot' || lang === 'math-plot' || lang === 'graph' || text.startsWith('fn:') || text.startsWith('f(x) =') || text.startsWith('y ='))) {
        return <MathGraphPlotter rawText={text} />;
      }

      // 2. Tự động nhận diện và hiển thị hình vẽ minh họa SVG chuẩn sắc nét
      if (!inline && (lang === 'svg' || lang === 'xml' || text.startsWith('<svg'))) {
        const svgMatch = text.match(/<svg[\s\S]*?<\/svg>/i);
        let svgContent = svgMatch ? svgMatch[0] : (text.startsWith('<svg') ? text : '');
        if (svgContent) {
          // Chuẩn hóa kích thước SVG đảm bảo không bao giờ bị co lại thành hộp trắng trống
          if (!svgContent.includes('viewBox') && svgContent.includes('width=') && svgContent.includes('height=')) {
            const wMatch = svgContent.match(/width="?(\d+)"?/);
            const hMatch = svgContent.match(/height="?(\d+)"?/);
            if (wMatch && hMatch) {
              svgContent = svgContent.replace('<svg', `<svg viewBox="0 0 ${wMatch[1]} ${hMatch[1]}"`);
            }
          }
          // Thêm style kích cỡ tối ưu hiển thị rõ ràng
          svgContent = svgContent.replace('<svg', '<svg style="width: 100%; min-width: 320px; max-width: 500px; min-height: 220px; height: auto; display: block; margin: 0 auto;"');

          return (
            <span className="block my-6 text-center">
              <span className="inline-block p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm max-w-full overflow-x-auto">
                <span 
                  className="flex items-center justify-center w-full min-w-[320px] max-w-[500px] min-h-[220px]"
                  dangerouslySetInnerHTML={{ __html: svgContent }}
                />
              </span>
              <span className="block text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium italic">
                Hình vẽ minh họa trực quan (FMATH12 AI Vector Engine)
              </span>
            </span>
          );
        }
      }

      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
    th: ({ node, ...props }: any) => (
      <th className="bg-slate-100 dark:bg-slate-800 p-3 font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 font-heading" {...props} />
    ),
    td: ({ node, ...props }: any) => (
      <td className="p-3 border-b border-slate-100 dark:border-slate-800/60 text-slate-700 dark:text-slate-300" {...props} />
    )
  };

  // Làm sạch văn bản để loại bỏ tiêu đề bị lặp nhiều lần ở đầu file và các ảnh lỗi
  const cleanedTheoryContent = useMemo(() => {
    if (!activeLesson?.theory_content) return "Nội dung bài giảng đang được cập nhật...";
    let text = sanitizeAiMarkdown(activeLesson.theory_content.trim());
    const lines = text.split('\n');
    let startIndex = 0;
    while (startIndex < lines.length && startIndex < 4) {
      const line = lines[startIndex].trim();
      if (!line) { startIndex++; continue; }
      if (/^(#+\s*)?(Chương\s*\d+|Bài\s*\d+)/i.test(line)) {
        startIndex++;
      } else {
        break;
      }
    }
    const clean = lines.slice(startIndex).join('\n').trim();
    return clean || text;
  }, [activeLesson?.theory_content]);

  const renderedTheoryContent = useMemo(() => {
    if (!activeLesson) return null;
    return (
      <ReactMarkdown 
        remarkPlugins={[remarkMath, remarkGfm]} 
        rehypePlugins={[rehypeKatex]} 
        components={MarkdownComponents}
      >
        {cleanedTheoryContent}
      </ReactMarkdown>
    );
  }, [cleanedTheoryContent]);

  // Danh sách phẳng tất cả bài học để điều hướng tuần tự
  const allLessons = useMemo(() => {
    const list: any[] = [];
    chapters.forEach(c => {
      c.lessons?.forEach((l: any) => list.push({ ...l, chapterTitle: c.title }));
    });
    return list;
  }, [chapters]);

  const { prevLesson, nextLesson } = useMemo(() => {
    if (!activeLesson) return { prevLesson: null, nextLesson: null };
    const idx = allLessons.findIndex(l => l.id === activeLesson.id);
    return {
      prevLesson: idx > 0 ? allLessons[idx - 1] : null,
      nextLesson: idx >= 0 && idx < allLessons.length - 1 ? allLessons[idx + 1] : null
    };
  }, [allLessons, activeLesson]);

  // Tính tổng tiến độ hoàn thành khóa học
  const courseStats = useMemo(() => {
    let totalLessons = 0;
    let completedLessons = 0;
    chapters.forEach(c => {
      c.lessons?.forEach((l: any) => {
        totalLessons++;
        if (l.isCompleted) completedLessons++;
      });
    });
    const percent = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);
    return { totalLessons, completedLessons, percent };
  }, [chapters]);

  // Lọc danh sách chương & bài học theo từ khóa tìm kiếm
  const filteredChapters = useMemo(() => {
    if (!searchQuery.trim()) {
      if (selectedChapterId === 'all') return chapters;
      return chapters.filter(c => String(c.id) === String(selectedChapterId));
    }
    const query = searchQuery.toLowerCase().trim();
    return chapters.map(c => {
      const matchLessons = c.lessons?.filter((l: any) => l.title.toLowerCase().includes(query));
      if (c.title.toLowerCase().includes(query) || (matchLessons && matchLessons.length > 0)) {
        return { ...c, lessons: matchLessons && matchLessons.length > 0 ? matchLessons : c.lessons };
      }
      return null;
    }).filter(Boolean);
  }, [chapters, selectedChapterId, searchQuery]);

  const currentChapterInfo = useMemo(() => {
    if (!activeLesson) return null;
    return chapters.find(c => c.lessons?.some((l: any) => l.id === activeLesson.id));
  }, [chapters, activeLesson]);

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-72px)] bg-slate-50 dark:bg-slate-900 text-slate-500">
      <Loader2 size={32} className="animate-spin mb-3 text-blue-600" />
      <p className="font-medium text-[14px]">Đang khởi tạo FMATH12...</p>
    </div>
  );
  
  if (chapters.length === 0 || !activeLesson) return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-72px)] bg-slate-50 dark:bg-slate-900 text-slate-500">
      <BookOpen size={48} className="mb-4 opacity-30 text-blue-500" />
      <p className="font-medium text-[14px]">Chưa có bài học nào được mở trong chuyên đề này.</p>
    </div>
  );

  const themeContainerClasses = {
    light: 'bg-white text-slate-800 border-slate-200',
    sepia: 'bg-[#fbf0d9] text-[#433225] border-[#e4d4b9]',
    dark: 'bg-slate-900 text-slate-200 border-slate-800'
  };

  const fontSizeClasses = {
    normal: 'text-[15px] leading-[2.1]',
    large: 'text-[17px] leading-[2.2]',
    xlarge: 'text-[19px] leading-[2.3]'
  };

  return (
    <div className="flex flex-col h-[calc(100vh-72px)] w-full relative overflow-hidden bg-slate-50 dark:bg-slate-950 animate-in fade-in">
      
      {/* ==========================================
          1. TOP NAVIGATION / ZEN HEADER
          ========================================== */}
      {isZenMode ? (
        <div className="bg-slate-900 text-white px-3 sm:px-6 py-2 flex items-center justify-between z-30 border-b border-slate-800 shadow-sm shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-heading">Tập trung</span>
              <span className="text-slate-600">•</span>
              <span className="text-xs font-bold text-white truncate max-w-xs font-heading">{activeLesson.title}</span>
            </div>
          </div>

          {/* 3 Tabs trong Zen Mode */}
          <div className="flex bg-slate-800 p-0.5 rounded-xl border border-slate-700">
            <button
              onClick={() => setActiveTab('theory')}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                activeTab === 'theory' ? 'bg-slate-700 text-blue-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              Toàn văn
            </button>
            <button
              onClick={() => setActiveTab('scaffolding')}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                activeTab === 'scaffolding' ? 'bg-blue-600 text-white shadow-xs' : 'text-blue-400 hover:text-white'
              }`}
            >
              4 Bậc trọng tâm
            </button>
            <button
              onClick={() => setActiveTab('practice')}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                activeTab === 'practice' ? 'bg-slate-700 text-blue-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              Bài tập ({activeLesson.exercises?.length || 0})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center bg-slate-800 border border-slate-700 rounded-xl p-0.5">
              <button onClick={() => setFontSize('normal')} className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer ${fontSize === 'normal' ? 'bg-slate-700 text-blue-400' : 'text-slate-400'}`}>A</button>
              <button onClick={() => setFontSize('large')} className={`px-2 py-0.5 rounded-lg text-[11px] font-bold cursor-pointer ${fontSize === 'large' ? 'bg-slate-700 text-blue-400' : 'text-slate-400'}`}>A+</button>
              <button onClick={() => setFontSize('xlarge')} className={`px-2 py-0.5 rounded-lg text-[12px] font-bold cursor-pointer ${fontSize === 'xlarge' ? 'bg-slate-700 text-blue-400' : 'text-slate-400'}`}>A++</button>
            </div>

            <button
              onClick={() => setIsZenMode(false)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold flex items-center gap-1.5 text-slate-200 transition-colors cursor-pointer border border-slate-700"
            >
              <Minimize2 size={13} /> Thoát tập trung
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-3 sm:px-6 py-2 shrink-0 shadow-2xs z-20">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            
            {/* Vùng trái: Nút mở sidebar + Tiêu đề bài */}
            <div className="flex items-center gap-2.5 min-w-0">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={`p-1.5 sm:px-3 sm:py-1.5 rounded-xl border transition-all flex items-center gap-1.5 shrink-0 text-xs font-bold cursor-pointer ${
                  isSidebarOpen 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs' 
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                }`}
                title="Mở / Đóng mục lục bài học"
              >
                <BookOpen size={14} /> 
                <span className="hidden sm:inline">{isSidebarOpen ? 'Thu gọn' : 'Mục lục'}</span>
              </button>

              <div className="flex items-center gap-2 truncate">
                <span className="hidden md:inline bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-blue-200/80 dark:border-blue-800 font-heading shrink-0">
                  {currentChapterInfo?.title || 'Toán 12'}
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate font-heading" title={activeLesson.title}>
                  {activeLesson.title}
                </span>
              </div>
            </div>

            {/* Vùng giữa: 3 Tabs học tập */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 sm:p-1 rounded-xl border border-slate-200/80 dark:border-slate-700">
              <button
                onClick={() => setActiveTab('theory')}
                className={`px-2.5 sm:px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer font-heading ${
                  activeTab === 'theory' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BookOpen size={13} />
                <span className="hidden sm:inline">Toàn văn bài học</span>
                <span className="sm:hidden">Lý thuyết</span>
              </button>

              <button
                onClick={() => setActiveTab('scaffolding')}
                className={`px-2.5 sm:px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer font-heading ${
                  activeTab === 'scaffolding' ? 'bg-blue-600 text-white shadow-xs' : 'text-blue-600 dark:text-blue-400 hover:text-blue-700 font-extrabold'
                }`}
              >
                <Layers size={13} />
                <span>4 Bậc trọng tâm</span>
              </button>

              <button
                onClick={() => setActiveTab('practice')}
                className={`px-2.5 sm:px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer font-heading ${
                  activeTab === 'practice' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Target size={13} />
                <span>Bài tập ({activeLesson.exercises?.length || 0})</span>
              </button>
            </div>

            {/* Vùng phải: Các công cụ đọc (Theme, Font, Width, Focus mode) */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Theme Selector */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl p-0.5 gap-0.5">
                <button
                  onClick={() => setReadingTheme('light')}
                  className={`p-1 rounded-lg text-xs font-bold flex items-center cursor-pointer ${readingTheme === 'light' ? 'bg-white dark:bg-slate-700 shadow-2xs text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}
                  title="Giao diện Sáng"
                >
                  <Sun size={13} />
                </button>
                <button
                  onClick={() => setReadingTheme('sepia')}
                  className={`px-1.5 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer ${readingTheme === 'sepia' ? 'bg-[#f5e5c9] text-[#5c4033] shadow-2xs font-extrabold' : 'text-slate-500'}`}
                  title="Chế độ đọc Giấy Sepia êm mắt"
                >
                  Giấy
                </button>
                <button
                  onClick={() => setReadingTheme('dark')}
                  className={`p-1 rounded-lg text-xs font-bold flex items-center cursor-pointer ${readingTheme === 'dark' ? 'bg-slate-950 text-white shadow-2xs' : 'text-slate-500'}`}
                  title="Giao diện Đêm dịu mắt"
                >
                  <Moon size={13} />
                </button>
              </div>

              {/* Font Size Selector */}
              <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl p-0.5">
                <button
                  onClick={() => setFontSize('normal')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer ${fontSize === 'normal' ? 'bg-white dark:bg-slate-700 shadow-2xs text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}
                  title="Cỡ chữ chuẩn"
                >
                  A
                </button>
                <button
                  onClick={() => setFontSize('large')}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold cursor-pointer ${fontSize === 'large' ? 'bg-white dark:bg-slate-700 shadow-2xs text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}
                  title="Cỡ chữ lớn"
                >
                  A+
                </button>
                <button
                  onClick={() => setFontSize('xlarge')}
                  className={`px-2 py-0.5 rounded-lg text-[12px] font-bold cursor-pointer ${fontSize === 'xlarge' ? 'bg-white dark:bg-slate-700 shadow-2xs text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}
                  title="Cỡ chữ rất lớn"
                >
                  A++
                </button>
              </div>

              {/* Width toggle */}
              <button
                onClick={() => setContentWidth(contentWidth === 'standard' ? 'wide' : 'standard')}
                className={`p-1 sm:px-2 sm:py-1 rounded-xl border text-[11px] font-bold hidden md:flex items-center gap-1 cursor-pointer transition-colors ${
                  contentWidth === 'wide'
                    ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
                title={contentWidth === 'wide' ? 'Thu gọn độ rộng vừa mắt' : 'Mở rộng toàn trang'}
              >
                <span>{contentWidth === 'wide' ? 'Rộng' : 'Vừa'}</span>
              </button>

              {/* Focus Mode button */}
              <button
                onClick={() => {
                  setIsZenMode(true);
                  setIsSidebarOpen(false);
                }}
                className="px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:bg-slate-50 transition-all cursor-pointer"
                title="Bật chế độ tập trung toàn màn hình"
              >
                <Maximize2 size={13} />
                <span className="hidden md:inline">Tập trung</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ==========================================
          2. WORKSPACE CONTAINER
          ========================================== */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* CỘT TRÁI: KHUNG ĐIỀU HƯỚNG LỘ TRÌNH */}
        <aside className={`${(!isZenMode && isSidebarOpen) ? 'w-full md:w-80' : 'w-0'} shrink-0 flex flex-col transition-all duration-300 ease-in-out h-full overflow-hidden bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 z-30 absolute md:relative`}>
          
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-heading">
                <BookA size={15} className="text-blue-600 dark:text-blue-400" /> Lộ trình bài giảng
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white md:hidden cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="relative">
              <select
                value={selectedChapterId}
                onChange={(e) => setSelectedChapterId(e.target.value)}
                className="w-full text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 transition-colors shadow-2xs"
              >
                <option value="all">Tất cả các chương Toán 12</option>
                {chapters.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm bài học..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200 shadow-2xs"
              />
            </div>
          </div>

          {/* Danh sách bài học */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
            {filteredChapters.map((chap: any) => {
              return (
                <div key={chap.id} className="space-y-1">
                  <div className="px-2 py-1 text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-heading">
                    {chap.title}
                  </div>
                  
                  <div className="space-y-1">
                    {chap.lessons?.map((les: any) => {
                      const isSelected = activeLesson?.id === les.id;
                      return (
                        <button
                          key={les.id}
                          onClick={() => handleSelectLesson(les)}
                          className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 font-bold shadow-2xs' 
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate pr-2">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${les.isCompleted ? 'bg-emerald-500' : isSelected ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`} />
                            <span className="truncate">{les.title}</span>
                          </div>
                          <div className="shrink-0 flex items-center gap-1.5">
                            {les.isCompleted && <CheckCircle2 size={13} className="text-emerald-500" />}
                            <span className="text-[10px] text-slate-400">{les.exercises?.length || 0}bt</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

        </aside>

        {/* CỘT PHẢI: TRUNG TÂM HỌC TẬP CHÍNH */}
        <main className="flex-1 flex flex-col min-w-0 bg-slate-50/70 dark:bg-slate-950 overflow-hidden relative">
          
          {/* NÚT "HỎI AI" KHI BÔI ĐEN */}
          {selectionPos && (
            <button
              onClick={handleAskSelectedText}
              style={{ top: selectionPos.top, left: selectionPos.left, transform: 'translateX(-50%)' }}
              className="fixed z-50 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 text-xs font-bold font-ui animate-in zoom-in-95 cursor-pointer"
            >
              <BrainCircuit size={14} /> Hỏi FMATH AI
            </button>
          )}



          {/* KHUNG CUỘN BÀI GIẢNG LÝ THUYẾT / SCAFFOLDING / BÀI TẬP */}
          <div ref={contentScrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar pb-32">
            <div className={`mx-auto transition-all duration-300 ${contentWidth === 'wide' ? 'max-w-6xl' : 'max-w-4xl'}`}>
              
              {/* TAB 1: LÝ THUYẾT TOÀN VĂN */}
              {activeTab === 'theory' && (
                <article 
                  className={`p-6 md:p-12 rounded-3xl shadow-sm border transition-all duration-300 animate-in fade-in ${themeContainerClasses[readingTheme]}`}
                  onMouseUp={handleTextSelection}
                >
                  {/* HERO HEADER BÀI ĐỌC SANG TRỌNG */}
                  <header className="border-b border-current/15 pb-6 mb-8">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full inline-flex items-center gap-1.5 font-heading border border-blue-500/20">
                        <Compass size={13} /> {currentChapterInfo?.title || 'Chuyên đề Toán 12'}
                      </span>
                      <div className="flex items-center gap-2">
                        {activeLesson.isCompleted ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 size={13} /> Đã hoàn thành
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                            <Clock size={12} /> ~15 phút học lý thuyết
                          </span>
                        )}
                      </div>
                    </div>

                    <h1 className="text-2xl md:text-4xl font-extrabold font-heading m-0 leading-tight tracking-tight text-slate-900 dark:text-white">
                      {activeLesson.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-3 mt-4 text-xs opacity-75 font-medium">
                      <span>🎯 Chuẩn SGK GDPT 2018</span>
                      <span>•</span>
                      <span>🪜 4 Bậc kiến thức cốt lõi</span>
                      <span>•</span>
                      <span>✍️ {activeLesson.exercises?.length || 0} bài tập tự luyện</span>
                    </div>
                  </header>

                  {/* NỘI DUNG BÀI ĐỌC ĐÃ ĐƯỢC LÀM SẠCH VÀ CALLOUT CAO CẤP */}
                  <div className={`prose prose-base max-w-none prose-headings:font-heading prose-headings:text-slate-900 dark:prose-headings:text-white prose-p:mb-5 prose-li:mb-2 prose-ul:mb-5 [&_.katex-display]:my-6 overflow-x-auto selection:bg-blue-100 selection:text-blue-900 ${fontSizeClasses[fontSize]}`}>
                    {renderedTheoryContent}
                  </div>
                  
                  {/* SMART BOTTOM LESSON NAVIGATOR */}
                  <div className="mt-12 pt-8 border-t border-current/15 flex flex-col sm:flex-row items-center justify-between gap-4">
                    {prevLesson ? (
                      <button
                        onClick={() => handleSelectLesson(prevLesson)}
                        className="btn-secondary w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 group transition-all"
                      >
                        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        <div className="text-left">
                          <div className="text-[10px] text-slate-400 uppercase">Bài trước</div>
                          <div className="truncate max-w-[180px]">{prevLesson.title}</div>
                        </div>
                      </button>
                    ) : <div />}

                    <button
                      onClick={handleCompleteLesson}
                      disabled={activeLesson.isCompleted}
                      className={`w-full sm:w-auto px-6 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
                        activeLesson.isCompleted
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 cursor-default'
                          : 'btn-primary shadow-blue-500/25 hover:-translate-y-0.5'
                      }`}
                    >
                      {activeLesson.isCompleted ? (
                        <>
                          <CheckCircle2 size={16} className="text-emerald-500" /> Đã hoàn thành bài học
                        </>
                      ) : (
                        <>
                          <Check size={16} /> Đánh dấu đã hiểu bài (+50 XP)
                        </>
                      )}
                    </button>

                    {nextLesson ? (
                      <button
                        onClick={() => handleSelectLesson(nextLesson)}
                        className="btn-secondary w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 group transition-all justify-end text-right"
                      >
                        <div className="text-right">
                          <div className="text-[10px] text-slate-400 uppercase">Bài tiếp theo</div>
                          <div className="truncate max-w-[180px]">{nextLesson.title}</div>
                        </div>
                        <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setActiveTab('practice')}
                        className="btn-primary w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Target size={16} /> Làm bài tập ôn luyện <ArrowRight size={15} />
                      </button>
                    )}
                  </div>
                </article>
              )}

              {/* TAB 2: LỘ TRÌNH HỌC TẬP 4 BẬC TRỌNG TÂM - TÍCH HỢP AI TRỰC TIẾP */}
              {activeTab === 'scaffolding' && (
                <div className="space-y-6 animate-in fade-in max-w-5xl mx-auto pb-12">
                  
                  {/* 1. THANH CHỌN 4 BẬC HỌC TẬP */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
                      <div>
                        <h2 className="text-base sm:text-lg font-bold font-heading text-slate-900 dark:text-white m-0 flex items-center gap-2">
                          <Layers size={18} className="text-blue-600 dark:text-blue-400" />
                          Lộ Trình Học Tập 4 Bậc Trọng Tâm
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
                          Học theo từng bậc tiếp thu: từ Bản chất trực quan đến Vận dụng bứt phá
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-800">
                          Chuẩn Bộ GD&ĐT
                        </span>
                        <button
                          onClick={() => fetchTierAiLesson(activeScaffoldingTier, activeLesson, true)}
                          disabled={isGeneratingTierAi[activeScaffoldingTier]}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-colors cursor-pointer text-xs flex items-center gap-1"
                          title="Tạo lại bài giảng AI cho Bậc này"
                        >
                          <RefreshCcw size={13} className={isGeneratingTierAi[activeScaffoldingTier] ? 'animate-spin' : ''} />
                          <span className="hidden sm:inline text-[11px]">Làm mới bài giảng AI</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                      {SCAFFOLDING_TIERS.map((tier) => {
                        const isCurrent = activeScaffoldingTier === tier.tier;
                        const tierBorder = tier.tier === 1 ? 'border-emerald-200 dark:border-emerald-900' :
                                           tier.tier === 2 ? 'border-blue-200 dark:border-blue-900' :
                                           tier.tier === 3 ? 'border-amber-200 dark:border-amber-900' :
                                           'border-rose-200 dark:border-rose-900';
                        const tierActiveBg = tier.tier === 1 ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white' :
                                             tier.tier === 2 ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white' :
                                             tier.tier === 3 ? 'bg-gradient-to-br from-amber-600 to-orange-700 text-white' :
                                             'bg-gradient-to-br from-rose-600 to-pink-700 text-white';
                        return (
                          <button
                            key={tier.tier}
                            onClick={() => setActiveScaffoldingTier(tier.tier)}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                              isCurrent 
                                ? `${tierActiveBg} shadow-md ring-2 ring-blue-400/40 border-transparent` 
                                : `bg-slate-50 dark:bg-slate-800/60 ${tierBorder} hover:border-blue-400 text-slate-700 dark:text-slate-200`
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                isCurrent ? 'bg-white/20 text-white' : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                              }`}>
                                {tier.badge}
                              </span>
                              <span className="text-xs font-black opacity-80">#{tier.tier}</span>
                            </div>
                            <div className="text-xs font-bold font-heading line-clamp-1 mb-1">
                              {tier.title}
                            </div>
                            <div className={`text-[11px] line-clamp-2 leading-tight ${isCurrent ? 'text-white/90' : 'text-slate-500 dark:text-slate-400'}`}>
                              {tier.desc}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. KHUNG BÀI GIẢNG SƯ PHẠM AI (NHÚNG TRỰC TIẾP TẠI ĐÂY) */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black font-heading text-lg shadow-xs ${
                          activeScaffoldingTier === 1 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                          activeScaffoldingTier === 2 ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' :
                          activeScaffoldingTier === 3 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                          'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          {activeScaffoldingTier}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] uppercase tracking-wider font-extrabold text-blue-600 dark:text-blue-400">
                              Bài giảng Sư phạm AI Bậc {activeScaffoldingTier}
                            </span>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          </div>
                          <h3 className="text-base sm:text-lg font-bold font-heading text-slate-900 dark:text-white m-0">
                            {SCAFFOLDING_TIERS[activeScaffoldingTier - 1]?.title}
                          </h3>
                        </div>
                      </div>

                      <button
                        onClick={() => fetchTierAiLesson(activeScaffoldingTier, activeLesson, true)}
                        disabled={isGeneratingTierAi[activeScaffoldingTier]}
                        className="btn-secondary text-xs py-2 px-3 self-start sm:self-auto flex items-center gap-1.5"
                      >
                        <RefreshCcw size={13} className={isGeneratingTierAi[activeScaffoldingTier] ? 'animate-spin' : ''} />
                        <span>Làm mới bài giảng</span>
                      </button>
                    </div>

                    {/* Nội dung bài giảng AI */}
                    {isGeneratingTierAi[activeScaffoldingTier] ? (
                      <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-3">
                        <Loader2 size={32} className="text-blue-600 animate-spin" />
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          FMATH12 AI đang biên soạn bài giảng Bậc {activeScaffoldingTier} chuyên sâu...
                        </p>
                        <p className="text-xs text-slate-500 max-w-md">
                          Hệ thống đang cấu trúc hóa kiến thức theo chuẩn sư phạm Toán 12 GDPT 2018 và tích hợp ví dụ, công thức KaTeX.
                        </p>
                      </div>
                    ) : (
                      <div className="p-5 sm:p-7 rounded-2xl bg-slate-50/70 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800/80">
                        <div className="prose prose-blue dark:prose-invert max-w-none text-[15px] leading-relaxed">
                          <ReactMarkdown
                            remarkPlugins={[remarkMath, remarkGfm]}
                            rehypePlugins={[rehypeKatex]}
                            components={MarkdownComponents}
                          >
                            {sanitizeAiMarkdown(tierAiContent[activeScaffoldingTier]) || `Đang chuẩn bị nội dung Bậc ${activeScaffoldingTier}...`}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {/* 3. KHUNG HỎI ĐÁP TRỰC TIẾP VỚI THẦY TRỢ GIẢNG AI CHO BẬC NÀY (INLINE - KHÔNG CẦN BẤM GÓC) */}
                    <div className="rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-gradient-to-b from-blue-50/40 to-white dark:from-slate-850 dark:to-slate-900 p-5 space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-blue-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <BrainCircuit size={18} className="text-blue-600 dark:text-blue-400" />
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white m-0 font-heading">
                            Hỏi đáp trực tiếp với Thầy trợ giảng AI cho Bậc {activeScaffoldingTier}
                          </h4>
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">Phản hồi sư phạm tức thì 24/7</span>
                      </div>

                      {/* Gợi ý câu hỏi nhanh theo Bậc */}
                      <div className="flex flex-wrap gap-2">
                        {activeScaffoldingTier === 1 && [
                          'Cho em ví dụ trực quan đời thực',
                          'Tại sao lại có định nghĩa này?',
                          'Giải thích bằng ngôn ngữ giản dị'
                        ].map((prompt, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendTierMessage(prompt)}
                            className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                          >
                            💡 {prompt}
                          </button>
                        ))}
                        {activeScaffoldingTier === 2 && [
                          'Tóm tắt các công thức cốt lõi',
                          'Điều kiện áp dụng định lý này là gì?',
                          'Lập bảng so sánh nhanh'
                        ].map((prompt, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendTierMessage(prompt)}
                            className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                          >
                            📐 {prompt}
                          </button>
                        ))}
                        {activeScaffoldingTier === 3 && [
                          'Cho em 1 ví dụ mẫu kèm lời giải',
                          'Cách bấm máy Casio fx-580VN X',
                          'Các bước tư duy khi đọc đề'
                        ].map((prompt, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendTierMessage(prompt)}
                            className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                          >
                            ⚡ {prompt}
                          </button>
                        ))}
                        {activeScaffoldingTier === 4 && [
                          'Các bẫy đề thi hay gặp nhất',
                          'Ví dụ câu hỏi 9+ vận dụng cao',
                          'Những lỗi sai ngớ ngẩn cần tránh'
                        ].map((prompt, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendTierMessage(prompt)}
                            className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          >
                            🎯 {prompt}
                          </button>
                        ))}
                      </div>

                      {/* Lịch sử hội thoại của Bậc này */}
                      {(tierConversations[activeScaffoldingTier]?.length || 0) > 0 && (
                        <div className="space-y-3 max-h-80 overflow-y-auto pr-1 custom-scrollbar bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
                          {tierConversations[activeScaffoldingTier]?.map((msg, i) => (
                            <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              {msg.role === 'ai' && (
                                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-xs">
                                  AI
                                </div>
                              )}
                              <div className={`p-3 rounded-xl text-xs max-w-[85%] leading-relaxed ${
                                msg.role === 'user'
                                  ? 'bg-blue-600 text-white font-medium rounded-tr-none'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-700'
                              }`}>
                                {msg.role === 'user' ? (
                                  msg.content
                                ) : (
                                  <div className="prose prose-xs dark:prose-invert max-w-none">
                                    <ReactMarkdown
                                      remarkPlugins={[remarkMath, remarkGfm]}
                                      rehypePlugins={[rehypeKatex]}
                                      components={MarkdownComponents}
                                    >
                                      {sanitizeAiMarkdown(msg.content)}
                                    </ReactMarkdown>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                          {isTierReplying && (
                            <div className="flex gap-2.5 items-center text-xs text-slate-500">
                              <Loader2 size={14} className="animate-spin text-blue-600" />
                              <span>Thầy đang giải đáp cho em...</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Ô nhập câu hỏi inline */}
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleSendTierMessage();
                        }}
                        className="flex gap-2"
                      >
                        <input
                          type="text"
                          value={tierInputText}
                          onChange={(e) => setTierInputText(e.target.value)}
                          placeholder={`Hỏi Thầy Trợ Giảng về Bậc ${activeScaffoldingTier} (${SCAFFOLDING_TIERS[activeScaffoldingTier - 1]?.title})...`}
                          className="flex-1 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-2xs"
                        />
                        <button
                          type="submit"
                          disabled={!tierInputText.trim() || isTierReplying}
                          className="btn-primary px-4 py-2.5 text-xs flex items-center gap-1.5 shrink-0 disabled:opacity-40"
                        >
                          <Send size={13} />
                          <span className="hidden sm:inline">Gửi câu hỏi</span>
                        </button>
                      </form>
                    </div>

                    {/* 4. ĐIỀU HƯỚNG BẬC */}
                    <div className="flex justify-between items-center pt-2">
                      <button
                        disabled={activeScaffoldingTier === 1}
                        onClick={() => setActiveScaffoldingTier(prev => Math.max(1, prev - 1))}
                        className="btn-secondary text-xs px-4 py-2.5 font-bold disabled:opacity-40 flex items-center gap-1.5"
                      >
                        <ChevronLeft size={14} /> Bậc trước
                      </button>

                      {activeScaffoldingTier < 4 ? (
                        <button
                          onClick={() => setActiveScaffoldingTier(prev => Math.min(4, prev + 1))}
                          className="btn-primary text-xs px-5 py-2.5 font-bold flex items-center gap-1.5"
                        >
                          <span>Lên Bậc {activeScaffoldingTier + 1}</span>
                          <ChevronRight size={14} />
                        </button>
                      ) : (
                        <button
                          onClick={() => setActiveTab('practice')}
                          className="btn-primary text-xs px-5 py-2.5 font-bold bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1.5"
                        >
                          <Check size={14} /> Chinh phục Bài tập ngay
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: BÀI TẬP VẬN DỤNG */}
              {activeTab === 'practice' && (
                <div className="flat-card p-6 md:p-8 space-y-6 animate-in fade-in">
                  {(!activeLesson.exercises || activeLesson.exercises.length === 0) ? (
                    <div className="text-center py-12 text-slate-400">
                      <Target size={40} className="mx-auto mb-3 opacity-30 text-blue-500" />
                      <p className="font-semibold text-sm">Chưa có bài tập nào trong phần này.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      
                      {/* Header câu hỏi */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-2">
                        <div className="flex items-center gap-2">
                          <span className="badge-primary">Câu {currentExIndex + 1}/{activeLesson.exercises.length}</span>
                          <span className="text-xs text-slate-500 font-medium">
                            {qType === 'mcq' ? 'Trắc nghiệm 4 lựa chọn' : qType === 'tf' ? 'Trắc nghiệm Đúng/Sai' : 'Trả lời ngắn'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setIsAiChatOpen(true);
                              handleSendAiMessage(`Thầy cho em gợi ý Bậc 1 (Hint) cho bài tập này mà không giải hộ nhé:\n"${currentExercise.content}"`, 1);
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors"
                          >
                            <BrainCircuit size={14} /> Gợi ý giải bài
                          </button>
                        </div>
                      </div>

                      {/* Nội dung câu hỏi */}
                      <div className="prose prose-base max-w-none text-slate-900 dark:text-white text-[15px] leading-relaxed">
                        <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]} components={MarkdownComponents}>
                          {currentExercise.content}
                        </ReactMarkdown>
                      </div>

                      {/* Lựa chọn đáp án */}
                      <div className="pt-2">
                        {qType === 'mcq' && currentExercise.options && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {currentExercise.options.map((opt: any, idx: number) => {
                              const rawOptId = opt.id || ['A', 'B', 'C', 'D'][idx] || String(idx);
                              const optId = String(rawOptId).toLowerCase().trim();
                              const displayId = String(rawOptId).toUpperCase().trim();
                              
                              const isSubmitted = submittedQuestions[currentExercise.id];
                              const selectedOpt = String(answers[currentExercise.id] || '').toLowerCase().trim();
                              const isSelected = selectedOpt === optId;
                              const isCorrect = isMcqCorrect(optId, currentExercise.correct_answer);
                              
                              let optionClass = "border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800/80";
                              if (isSubmitted) {
                                if (isCorrect) optionClass = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300";
                                else if (isSelected && !isCorrect) optionClass = "border-rose-500 bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300";
                                else optionClass = "border-slate-200 dark:border-slate-800 opacity-50 bg-slate-50 dark:bg-slate-900";
                              } else if (isSelected) {
                                optionClass = "border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold shadow-2xs";
                              }

                              return (
                                <div key={optId} onClick={() => { if(!isSubmitted) handleAnswerMCQ(optId) }} className={`w-full text-left p-3.5 rounded-xl border transition-colors flex items-start gap-3 cursor-pointer ${optionClass}`}>
                                  <div className={`w-7 h-7 mt-0.5 shrink-0 rounded-full flex items-center justify-center font-bold text-[12px] font-ui ${isSubmitted && isCorrect ? 'bg-emerald-600 text-white' : isSubmitted && isSelected && !isCorrect ? 'bg-rose-600 text-white' : isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>{displayId}</div>
                                  <div className="prose prose-sm flex-1 text-[14px] leading-relaxed overflow-x-auto m-0 pt-1"><ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]} components={MarkdownComponents}>{opt.text}</ReactMarkdown></div>
                                  {isSubmitted && isCorrect && <CheckCircle2 className="text-emerald-600 shrink-0 mt-1" size={20}/>}
                                  {isSubmitted && isSelected && !isCorrect && <XCircle className="text-rose-600 shrink-0 mt-1" size={20}/>}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        
                        {qType === 'tf' && currentExercise.options && (
                          <div className="flex flex-col gap-3">
                            {currentExercise.options.map((opt: any, idx: number) => {
                              const rawOptId = opt.id || ['a', 'b', 'c', 'd'][idx] || String(idx);
                              const optId = String(rawOptId).toLowerCase().trim();
                              
                              const isSubmitted = submittedQuestions[currentExercise.id];
                              const userVal = answers[currentExercise.id]?.[optId];
                              const parsedCorrect = parseTFAnswer(currentExercise.correct_answer);
                              const isCorrectVal = parsedCorrect[optId];
                              const isUserCorrect = userVal === isCorrectVal;

                              return (
                                <div key={optId} className={`p-3.5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${isSubmitted ? (isUserCorrect ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300' : 'border-rose-500 bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300') : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850'}`}>
                                  <div className="flex items-start gap-3 flex-1 overflow-x-auto">
                                    <div className="w-6 h-6 mt-0.5 shrink-0 rounded flex items-center justify-center font-bold text-[12px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-ui">{rawOptId}</div>
                                    <div className="prose prose-sm m-0 text-[14px] text-slate-800 dark:text-slate-200"><ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]} components={MarkdownComponents}>{opt.text}</ReactMarkdown></div>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <button disabled={isSubmitted} onClick={() => handleAnswerTF(optId, true)} className={`px-4 py-1.5 rounded-lg font-semibold text-[13px] transition-colors cursor-pointer ${userVal === true ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>Đúng</button>
                                    <button disabled={isSubmitted} onClick={() => handleAnswerTF(optId, false)} className={`px-4 py-1.5 rounded-lg font-semibold text-[13px] transition-colors cursor-pointer ${userVal === false ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>Sai</button>
                                  </div>
                                  {isSubmitted && <div className="shrink-0 flex items-center">
                                    {isUserCorrect ? <CheckCircle2 className="text-emerald-600" size={20}/> : <XCircle className="text-rose-600" size={20}/>}
                                  </div>}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {qType === 'saq' && (
                          <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                            <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-2 block font-heading">Nhập đáp án (Dùng "." cho số thập phân)</label>
                            <input 
                              type="text" 
                              value={answers[currentExercise.id] || ""} 
                              onChange={(e) => handleAnswerSAQ(e.target.value)} 
                              disabled={submittedQuestions[currentExercise.id]} 
                              className={`w-full max-w-xs px-4 py-3 rounded-xl font-bold text-[16px] outline-none transition-colors border ${submittedQuestions[currentExercise.id] ? (isSaqCorrect(answers[currentExercise.id], currentExercise.correct_answer) ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-500' : 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border-rose-500') : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-blue-500 text-slate-900 dark:text-white'}`} 
                              placeholder="VD: 12.5"
                            />
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex-1 w-full md:w-auto">
                          {submittedQuestions[currentExercise.id] && (
                             <div className="flex items-center gap-2 text-emerald-600 font-bold text-[14px]"><CheckCircle2 size={18}/> Đã ghi nhận đáp án!</div> 
                          )}
                        </div>
                        
                        <div className="shrink-0 flex gap-3 w-full md:w-auto">
                          {!submittedQuestions[currentExercise.id] ? (
                            <button disabled={!answers[currentExercise.id]} onClick={handleCheckAnswer} className="btn-primary w-full md:w-auto px-6 py-2.5 rounded-xl shadow-sm cursor-pointer">Kiểm tra đáp án</button>
                          ) : (currentExIndex < activeLesson.exercises.length - 1 ? (
                            <button onClick={handleNextQuestion} className="w-full md:w-auto bg-slate-900 dark:bg-slate-700 text-white hover:bg-slate-800 dark:hover:bg-slate-600 px-6 py-2.5 rounded-xl shadow-sm flex items-center justify-center gap-2 font-bold text-[14px] cursor-pointer">Câu tiếp theo <ArrowRight size={16}/></button>
                          ) : (
                            <button onClick={handleCompleteLesson} disabled={activeLesson.isCompleted} className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl shadow-sm flex items-center justify-center gap-2 font-bold text-[14px] cursor-pointer"><Check size={16}/> HOÀN THÀNH</button>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

        </main>
      </div>

      {/* ==========================================
          CỤM NÚT NỔI (FAB) ĐỂ GỌI TRỢ GIẢNG AI (Ẩn khi đang ở tab 4 Bậc vì AI đã nhúng trực tiếp in-place)
          ========================================== */}
      {activeTab !== 'scaffolding' && (
        <button 
          onClick={() => setIsAiChatOpen(!isAiChatOpen)}
          className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white px-4 py-3 rounded-2xl shadow-xl shadow-blue-500/30 hover:scale-105 transition-all flex items-center gap-2 cursor-pointer font-bold text-xs font-heading"
          aria-label="Mở trợ giảng FMATH AI"
        >
          {isAiChatOpen ? <X size={18} /> : <BrainCircuit size={18} />}
          <span>{isAiChatOpen ? 'Đóng Trợ giảng' : 'Hỏi Thầy Trợ Giảng AI'}</span>
        </button>
      )}

      {/* ==========================================
          CỬA SỔ CHAT AI TRỢ GIẢNG (POPUP MODAL)
          ========================================== */}
      {isAiChatOpen && activeTab !== 'scaffolding' && (
        <div className="fixed bottom-20 right-6 w-[380px] h-[550px] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-blue-200/90 dark:border-slate-800 z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4">
          
          {/* Header Chat */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-blue-50/80 to-sky-50/50 dark:from-slate-850 dark:to-slate-900">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-500 flex items-center justify-center text-white shadow-xs">
                <BrainCircuit size={18} />
              </div>
              <div>
                <div className="font-bold text-[14px] text-slate-900 dark:text-white font-heading">FMATH12 AI Tutor</div>
                <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Trợ Giảng Sẵn Sàng 24/7
                </div>
              </div>
            </div>
            <button onClick={() => setIsAiChatOpen(false)} className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer p-1 rounded-lg">
              <X size={18}/>
            </button>
          </div>

          {/* Quick 4-Tier Buttons */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex gap-1.5 overflow-x-auto custom-scrollbar">
            <button
              onClick={() => handleSendAiMessage("Thầy cho em gợi ý Bậc 1: ý niệm trực quan và bản chất của bài này.", 1)}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 whitespace-nowrap hover:bg-emerald-100 transition-colors"
            >
              💡 Bậc 1: Ý niệm
            </button>
            <button
              onClick={() => handleSendAiMessage("Thầy hướng dẫn em Bậc 2: khung công thức chuẩn mực cần nhớ.", 2)}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 whitespace-nowrap hover:bg-blue-100 transition-colors"
            >
              📐 Bậc 2: Định lý
            </button>
            <button
              onClick={() => handleSendAiMessage("Thầy hướng dẫn em Bậc 3: phương pháp từng bước giải bài mẫu & Casio.", 3)}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 whitespace-nowrap hover:bg-amber-100 transition-colors"
            >
              ⚡ Bậc 3: Ví dụ mẫu
            </button>
            <button
              onClick={() => handleSendAiMessage("Thầy chỉ cho em Bậc 4: các bẫy đề thi hay gặp trong phần này.", 4)}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 whitespace-nowrap hover:bg-rose-100 transition-colors"
            >
              🎯 Bậc 4: Vượt bẫy
            </button>
          </div>

          {/* Danh sách tin nhắn */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4 bg-white dark:bg-slate-900">
            {aiChatHistory.length === 0 && (
               <div className="text-center text-slate-400 text-[12px] mt-4 font-sans">
                 Bôi đen đoạn văn bản hoặc chọn Bậc kiến thức ở trên để hỏi thầy nhé!
               </div>
            )}
            {aiChatHistory.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in`}>
                {msg.role === 'ai' && (
                  <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/70 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 mr-2 mt-1 border border-blue-200 dark:border-blue-800">
                    <BrainCircuit size={12} />
                  </div>
                )}
                <div className={`max-w-[85%] rounded-2xl p-3 text-[13px] leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white font-medium rounded-br-sm' : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-sm'}`}>
                  {msg.role === 'user' ? msg.content : (
                    <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1">
                      <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]} components={MarkdownComponents}>
                        {sanitizeAiMarkdown(msg.content)}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isAiTyping && (
              <div className="flex justify-start">
                <div className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0 mr-2 mt-1 border border-slate-200 dark:border-slate-700"><BrainCircuit size={12} /></div>
                <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl rounded-bl-sm flex items-center gap-1"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span><span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span><span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span></div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Ô nhập tin nhắn */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
            <div className="flex items-end bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl focus-within:border-blue-500 transition-colors p-1">
              <textarea 
                ref={aiInputRef} 
                rows={1} 
                value={aiInput} 
                onChange={(e) => setAiInput(e.target.value)} 
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendAiMessage(); } }} 
                placeholder="Nhập câu hỏi môn Toán cho thầy..." 
                className="flex-1 max-h-24 bg-transparent outline-none px-2 py-1.5 text-[13px] text-slate-900 dark:text-white resize-none custom-scrollbar" 
                disabled={isAiTyping}
              />
              <button 
                onClick={() => handleSendAiMessage()} 
                disabled={isAiTyping || !aiInput.trim()} 
                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg mb-0.5 mr-0.5 disabled:opacity-50 cursor-pointer transition-colors shadow-xs"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HOÀN THÀNH BÀI HỌC */}
      {showRewardModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in px-4">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl border border-slate-200 dark:border-slate-800">
            <CheckCircle2 size={56} className="mx-auto text-emerald-500 mb-4" />
            <h2 className="text-xl font-bold font-heading text-slate-900 dark:text-white mb-2">Hoàn thành bài học!</h2>
            <p className="text-slate-600 dark:text-slate-400 text-[14px] mb-6">Bạn đã hoàn thành xuất sắc lý thuyết bài học và các bài tập thử thách.</p>
            <button onClick={() => setShowRewardModal(false)} className="btn-primary w-full py-2.5 text-[14px] rounded-xl shadow-sm cursor-pointer">
              TIẾP TỤC HỌC TẬP
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Theory;