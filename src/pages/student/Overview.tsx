import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';
import { 
  Trophy, TrendingUp, BookOpen, Target, 
  Zap, ArrowRight, BrainCircuit, PlayCircle, Loader2, Users,
  Flame, Award, Video, Compass, Sparkles, ChevronRight, CheckCircle2,
  AlertCircle, BarChart3, School, Cpu, Layers, Activity, ShieldCheck, RefreshCw,
  Send, X, MessageSquare, HelpCircle, Lightbulb, CornerDownLeft,
  Clock, Calendar, History, FileText
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { courseService } from '../../services/courseService';
import { supabase } from '../../config/supabase';
import { askGroqAI } from '../../services/groqAI';
import { fmathEngineService, CognitiveDiagnosticResult } from '../../services/fmathEngineService';
import { CORE_TOPICS } from '../../config/curriculumFramework';
import { MathGraphPlotter } from '../../components/common/MathGraphPlotter';

const Dashboard = () => {
  const { currentUser } = useAppStore();
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState('Xin chào');
  
  // Tự động cuộn lên đầu trang khi truy cập trang Tổng quan
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, []);
  
  const [chapters, setChapters] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [aiTutorMessage, setAiTutorMessage] = useState<string>('');
  const [aiGoals, setAiGoals] = useState<any[]>([]);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [diagnosticData, setDiagnosticData] = useState<CognitiveDiagnosticResult | null>(null);
  const [isPythonActive, setIsPythonActive] = useState<boolean>(false);

  // States cho 2 khối AI Đánh giá Tổng quan
  const [aiDiagnosticAssessment, setAiDiagnosticAssessment] = useState<{
    overviewText: string;
    strategicAdvice: string;
    keyStrength: string;
    criticalBlindspot: string;
    focusTopicRecommendation: string;
  } | null>(null);

  const [aiCurriculumAssessment, setAiCurriculumAssessment] = useState<{
    summary: string;
    highestImpactArea: string;
    matrixCoverage: string;
    domainBreakdown: {
      giai_tich: string;
      hinh_hoc: string;
      thong_ke_xac_suat: string;
    };
  } | null>(null);

  const [isRefreshingAiAssessment, setIsRefreshingAiAssessment] = useState<boolean>(false);

  // States cho FMATH AI Tutor Widget tương tác thời gian thực
  const [tutorChatHistory, setTutorChatHistory] = useState<Array<{ role: 'user' | 'ai'; content: string }>>([]);
  const [tutorInputText, setTutorInputText] = useState('');
  const [isTutorReplying, setIsTutorReplying] = useState(false);
  const tutorChatEndRef = useRef<HTMLDivElement | null>(null);

  // States cho Modal Tư Vấn Năng Lực & Kế Hoạch Cá Nhân Hóa (Toán 12 - 2026)
  const [showDiagnosticModal, setShowDiagnosticModal] = useState(false);
  const [diagnosticChatHistory, setDiagnosticChatHistory] = useState<Array<{ role: 'user' | 'ai'; content: string }>>([]);
  const [diagnosticInputText, setDiagnosticInputText] = useState('');
  const [isDiagnosticReplying, setIsDiagnosticReplying] = useState(false);
  const diagnosticChatEndRef = useRef<HTMLDivElement | null>(null);

  // States cho Modal AI Phân Tích Chuyên Đề (Bản Đồ Năng Lực 2018)
  const [selectedTopicForAi, setSelectedTopicForAi] = useState<any | null>(null);
  const [topicAiAnalysis, setTopicAiAnalysis] = useState<string>('');
  const [isAnalyzingTopic, setIsAnalyzingTopic] = useState<boolean>(false);

  // Tự động cuộn xuống cuối khung chat AI Tutor khi có tin nhắn mới hoặc đang trả lời
  useEffect(() => {
    if (tutorChatHistory.length > 0 || isTutorReplying) {
      tutorChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [tutorChatHistory, isTutorReplying]);

  useEffect(() => {
    if (diagnosticChatHistory.length > 0 || isDiagnosticReplying) {
      diagnosticChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [diagnosticChatHistory, isDiagnosticReplying]);
  // Component tùy biến render Markdown và đồ họa SVG sắc nét từ FMATH12 AI
  const SvgMarkdownComponents = useMemo(() => ({
    img: ({ node, ...props }: any) => {
      const src = props.src || '';
      if (!src || src.includes('quicklatex') || src.includes('latex3.f') || src.includes('codecogs')) {
        return null;
      }
      return (
        <span className="block my-4 text-center">
          <img {...props} className="max-w-full h-auto rounded-xl mx-auto block shadow-sm" loading="lazy" onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }} />
          {props.alt && props.alt !== 'Hình ảnh' && <span className="block text-xs text-slate-500 mt-1 italic">{props.alt}</span>}
        </span>
      );
    },
    code: ({ node, inline, className, children, ...props }: any) => {
      const text = String(children || '').trim();
      const match = /language-(\w+)/.exec(className || '');
      const lang = match ? match[1].toLowerCase() : '';
      if (!inline && (lang === 'function-plot' || lang === 'math-plot' || lang === 'graph' || text.startsWith('fn:') || text.startsWith('f(x) =') || text.startsWith('y ='))) {
        return <MathGraphPlotter rawText={text} />;
      }
      if (!inline && (lang === 'svg' || lang === 'xml' || text.startsWith('<svg'))) {
        const svgMatch = text.match(/<svg[\s\S]*?<\/svg>/i);
        let svgContent = svgMatch ? svgMatch[0] : (text.startsWith('<svg') ? text : '');
        if (svgContent) {
          svgContent = svgContent.replace('<svg', '<svg style="width: 100%; min-width: 300px; max-width: 480px; min-height: 200px; height: auto; display: block; margin: 0 auto;"');
          return (
            <span className="block my-4 text-center">
              <span className="inline-block p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm max-w-full overflow-x-auto">
                <span className="flex items-center justify-center [&>svg]:max-w-full [&>svg]:h-auto [&>svg]:mx-auto" dangerouslySetInnerHTML={{ __html: svgContent }} />
              </span>
              <span className="block text-[11px] text-slate-500 mt-1.5 italic font-medium">Hình vẽ minh họa trực quan (FMATH12 AI Vector Engine)</span>
            </span>
          );
        }
      }
      return <code className={className} {...props}>{children}</code>;
    }
  }), []);

  // Fetch lộ trình học tập và lịch sử thi cử của học sinh
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentUser?.id) return;
      setIsLoading(true);
      try {
        const curriculumData = await courseService.getCurriculum(currentUser.id);
        setChapters(curriculumData || []);

        const attemptsResponse = await supabase
          .from('exam_attempts')
          .select('*')
          .eq('user_id', currentUser.id);

        let finalAttempts: any[] = [];
        if (attemptsResponse?.data && attemptsResponse.data.length > 0) {
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          const examIds = Array.from(new Set(
            attemptsResponse.data
              .map(att => att.exam_id)
              .filter(id => id && uuidRegex.test(id))
          ));
          if (examIds.length > 0) {
            const { data: examsData } = await supabase
              .from('exams')
              .select('id, title, category, tags')
              .in('id', examIds);

            const examsMap = new Map(examsData?.map(e => [e.id, e]) || []);
            finalAttempts = attemptsResponse.data.map(att => ({
              ...att,
              exams: examsMap.get(att.exam_id) || null
            }));
          } else {
            finalAttempts = attemptsResponse.data;
          }
        }
        setAttempts(finalAttempts);

        // Check Python Engine Health
        const pyHealth = await fmathEngineService.checkHealth();
        setIsPythonActive(pyHealth);

      } catch (error) {
        console.error("Lỗi lấy dữ liệu học sinh:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [currentUser.id]);

  // Tính toán bản đồ năng lực chuẩn GDPT 2018 dựa trên dữ liệu làm bài THẬT
  const getAdaptiveSkills = () => {
    // Nếu học sinh chưa làm bài test nào: hiển thị trung thực 0%, không giả lập số liệu
    if (!attempts || attempts.length === 0) {
      return CORE_TOPICS.map((topic, idx) => ({
        id: topic.id,
        topic: `Chuyên đề 0${idx + 1}`,
        name: topic.name,
        domain: topic.domain,
        score: 0,
        weight: topic.weight,
        isAiAnalyzed: false,
        hasTested: false
      }));
    }

    // Khi đã có bài làm: tính toán điểm thực tế dựa trên các bài nộp
    return CORE_TOPICS.map((topic, idx) => {
      // Lọc các bài kiểm tra có nội dung hoặc tiêu đề liên quan chuyên đề này
      const matchingAttempts = attempts.filter(att => {
        const title = (att.exams?.title || '').toLowerCase();
        const category = (att.exams?.category || '').toLowerCase();
        const tags = Array.isArray(att.exams?.tags) ? att.exams.tags.join(' ').toLowerCase() : '';
        const meta = `${category} ${tags}`;
        if (topic.id === 'dao_ham') return title.includes('đạo hàm') || title.includes('khảo sát') || meta.includes('đạo hàm');
        if (topic.id === 'tich_phan') return title.includes('tích phân') || title.includes('nguyên hàm') || meta.includes('tích phân');
        if (topic.id === 'oxyz') return title.includes('oxyz') || title.includes('tọa độ') || title.includes('vectơ') || title.includes('mặt phẳng');
        if (topic.id === 'thong_ke') return title.includes('thống kê') || title.includes('ghép nhóm');
        if (topic.id === 'xac_suat') return title.includes('xác suất') || title.includes('bayes');
        if (topic.id === 'thuc_te') return title.includes('thực tế') || title.includes('tối ưu') || title.includes('thực hành');
        return false;
      });

      let topicScore = 0;
      let hasTested = false;

      if (matchingAttempts.length > 0) {
        const sum = matchingAttempts.reduce((acc, a) => acc + (a.score || 0), 0);
        topicScore = Math.round((sum / matchingAttempts.length) * 10); // Thang 10 -> %
        hasTested = true;
      } else {
        // Đã thi các chuyên đề khác, tính điểm quy đổi từ kết quả thi tổng quát của học sinh
        const totalAvg = attempts.reduce((acc, a) => acc + (a.score || 0), 0) / attempts.length;
        topicScore = Math.round(totalAvg * 10);
        hasTested = true;
      }

      return {
        id: topic.id,
        topic: `Chuyên đề 0${idx + 1}`,
        name: topic.name,
        domain: topic.domain,
        score: Math.min(Math.max(topicScore, 0), 100),
        weight: topic.weight,
        isAiAnalyzed: true,
        hasTested: true
      };
    });
  };

  const skills = getAdaptiveSkills();

  // Khởi chạy AI Chẩn đoán cá nhân hoá qua FMATH Engine
  useEffect(() => {
    const runEvaluation = async () => {
      if (skills.length === 0) return;
      try {
        const result = await fmathEngineService.getPersonalizedEvaluation(currentUser.id, skills, attempts);
        setDiagnosticData(result);
      } catch (err) {
        console.warn('Lỗi chẩn đoán:', err);
      }
    };
    runEvaluation();
  }, [skills.length, attempts.length, currentUser.id]);

  const getFallbackTutorMessage = (currentSkills: any[]) => {
    if (!attempts || attempts.length === 0) {
      return "Chào bạn! Tôi là FMATH12 AI Tutor. Hãy làm bài test khởi động đầu tiên để tôi đo lường chính xác năng lực và cá nhân hóa lộ trình bứt phá điểm số chuẩn GDPT 2018 cho bạn nhé!";
    }
    const tested = currentSkills.filter(s => s.hasTested);
    if (tested.length === 0) return "Chào bạn! Hãy tiếp tục luyện tập để hoàn thiện bản đồ năng lực chuẩn GDPT 2018 nhé.";
    const sorted = [...tested].sort((a, b) => a.score - b.score);
    const weakest = sorted[0];
    const strongest = sorted[sorted.length - 1];
    return `FMATH12 AI nhận thấy bạn làm tốt nhất phần [${strongest.name}] (${strongest.score}%). Để tối ưu điểm thi THPTQG, hãy tập trung củng cố và nâng cao điểm số cho phần [${weakest.name}] (${weakest.score}%) ngay nhé!`;
  };

  const generateAiPersonalization = async (currentSkills: any[]) => {
    if (!currentSkills || currentSkills.length === 0) return;

    const cacheKey = `fmath12_ai_pers_${currentUser.id}`;
    const cachedDataStr = localStorage.getItem(cacheKey);

    if (cachedDataStr) {
      try {
        const cached = JSON.parse(cachedDataStr);
        const hasStaleWords = /scaff|nấc|giàn giáo|đơn thuốc/i.test(JSON.stringify(cached));
        if (hasStaleWords) {
          localStorage.removeItem(cacheKey);
        } else if (Date.now() - cached.timestamp < 1000 * 60 * 30) {
          setAiTutorMessage(cached.tutorMessage);
          setAiGoals(cached.goals);
          return;
        }
      } catch (e) {
        console.warn("Cache parse error", e);
      }
    }

    setIsAiLoading(true);

    const isNewStudent = attempts.length === 0;
    const skillsSummary = currentSkills.map(s => `${s.topic} (${s.name} - ${s.domain}): ${s.hasTested ? `${s.score}%` : 'Chưa kiểm tra'}`).join('\n');
    const recentScore = attempts.length > 0 ? `${attempts[attempts.length - 1]?.score || 0}/10` : 'Chưa có bài thi nào';

    const prompt = isNewStudent
      ? `Học sinh lớp 12: ${currentUser.name || 'Học sinh'}.
Tình trạng: Học sinh mới, chưa làm bài kiểm tra nào trong hệ thống.
Chương trình: Toán 12 Chuẩn GDPT 2018 (Giải tích, Hình học Oxyz, Thống kê số liệu ghép nhóm, Xác suất Bayes).

Hãy đóng vai FMATH12 AI Tutor (Chuyên gia Sư phạm Toán 12 Chuẩn Bộ GD&ĐT), đưa ra:
1. Lời khuyên định hướng học tập ngắn gọn (1-2 câu súc tích, chào mừng và khuyến khích học sinh làm bài test khởi động đầu tiên để kích hoạt đo lường năng lực, TUYỆT ĐỐI không dùng các từ như "Scaffolding", "giàn giáo", "đơn thuốc").
2. Đúng 2 mục tiêu hành động ban đầu theo từng bậc tiếp nhận (Bậc 1, Bậc 2).

Trả về định dạng JSON thuần túy (không markdown block):
{
  "tutorMessage": "Chào mừng bạn đến với FMATH12! Hãy làm bài test chẩn đoán đầu tiên để AI xây dựng lộ trình bứt phá điểm số chuẩn GDPT 2018 cho bạn.",
  "goals": [
    { "title": "Bậc 1: Làm bài test khởi động", "desc": "Kiểm tra nhanh năng lực để hệ thống đo lường chính xác", "action": "Luyện tập ngay", "path": "/quiz" },
    { "title": "Bậc 2: Nắm vững khung lý thuyết", "desc": "Xem sơ đồ kiến thức trọng tâm các chuyên đề lớp 12", "action": "Ôn Lý thuyết", "path": "/theory" }
  ]
}`
      : `Học sinh lớp 12: ${currentUser.name || 'Học sinh'}.
Dữ liệu năng lực thực tế từ các bài kiểm tra đã làm theo Khung chuẩn GDPT 2018:
${skillsSummary}
Điểm bài thi gần nhất: ${recentScore}.
Tổng số lượt làm bài: ${attempts.length}.

Hãy đóng vai FMATH12 AI Tutor (Chuyên gia Sư phạm Toán 12 Chuẩn Bộ GD&ĐT), đưa ra:
1. Lời khuyên định hướng học tập ngắn gọn (1-2 câu súc tích, truyền động lực, chỉ rõ chuyên đề mạnh/yếu dựa trên dữ liệu thật, TUYỆT ĐỐI không dùng các từ như "Scaffolding", "giàn giáo", "đơn thuốc").
2. Đúng 2 mục tiêu hành động cụ thể theo từng bậc tiếp nhận kiến thức (Bậc 1, Bậc 2).

Trả về định dạng JSON thuần túy (không markdown block):
{
  "tutorMessage": "Nội dung lời nhắn sư phạm",
  "goals": [
    { "title": "Bậc 1: Củng cố bản chất", "desc": "Mô tả ngắn", "action": "Luyện tập ngay", "path": "/quiz" },
    { "title": "Bậc 2: Nâng cao năng lực", "desc": "Mô tả ngắn", "action": "Ôn Lý thuyết", "path": "/theory" }
  ]
}`;

    try {
      const responseText = await askGroqAI(
        "Bạn là FMATH12 AI, trợ lý học tập cá nhân hóa lộ trình Toán 12 chuẩn Bộ GD&ĐT cho học sinh THPT toàn quốc. Bạn chỉ trả về JSON theo đúng cấu trúc yêu cầu. Tuyệt đối không dùng các từ như Scaffolding, giàn giáo, đơn thuốc.", 
        prompt, 
        true
      );

      if (responseText) {
        let cleanText = responseText.trim();
        if (cleanText.startsWith('```')) {
          cleanText = cleanText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
        }
        const parsed = JSON.parse(cleanText);
        if (parsed.tutorMessage && Array.isArray(parsed.goals)) {
          setAiTutorMessage(parsed.tutorMessage);
          setAiGoals(parsed.goals);
          localStorage.setItem(cacheKey, JSON.stringify({
            tutorMessage: parsed.tutorMessage,
            goals: parsed.goals,
            timestamp: Date.now()
          }));
        }
      }
    } catch (e) {
      console.warn("Lỗi tạo AI gợi ý:", e);
      setAiTutorMessage(getFallbackTutorMessage(currentSkills));
    } finally {
      setIsAiLoading(false);
    }
  };

  useEffect(() => {
    if (skills.length > 0) {
      if (!aiTutorMessage) {
        generateAiPersonalization(skills);
      }
      if (!aiDiagnosticAssessment || !aiCurriculumAssessment) {
        generateComprehensiveAiAssessments(skills, attempts);
      }
    }
  }, [skills.length, attempts.length]);

  // Sinh 2 đánh giá tổng quan AI chuyên sâu: Năng lực cá nhân & Bản đồ kiến thức 2018
  const generateComprehensiveAiAssessments = async (currentSkills: any[], currentAttempts: any[], forceRefresh = false) => {
    const isNew = !currentAttempts || currentAttempts.length === 0;
    const cacheKey = `fmath12_ai_assessments_${currentUser.id}`;

    if (!forceRefresh) {
      const cachedStr = localStorage.getItem(cacheKey);
      if (cachedStr) {
        try {
          const parsed = JSON.parse(cachedStr);
          if (parsed.diagnosticAssessment && parsed.curriculumAssessment) {
            setAiDiagnosticAssessment(parsed.diagnosticAssessment);
            setAiCurriculumAssessment(parsed.curriculumAssessment);
            return;
          }
        } catch (e) {
          console.warn("Parse cached assessments error:", e);
        }
      }
    }

    if (isNew) {
      const defaultDiagnostic = {
        overviewText: "Hồ sơ năng lực đang ở giai đoạn khởi động. Bạn chưa hoàn thành bài kiểm tra nào trong hệ thống.",
        strategicAdvice: "Hãy hoàn thành bài test chẩn đoán đầu tiên (10-15 câu) để AI xác định chính xác thang đo 4 mức độ nhận thức (Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao).",
        keyStrength: "Sẵn sàng tiếp cận lộ trình học tập cá nhân hóa chuẩn cấu trúc Bộ GD&ĐT 2026.",
        criticalBlindspot: "Chưa ghi nhận - Cần làm tối thiểu 1 bài test để phát hiện bẫy câu hỏi thường gặp.",
        focusTopicRecommendation: "Khởi động ngay với Chuyên đề 01: Ứng dụng đạo hàm & Khảo sát hàm số (chiếm 25% đề thi)."
      };

      const defaultCurriculum = {
        summary: "Khung chương trình GDPT 2018 Toán 12 phân bổ theo 4 mạch kiến thức: Giải tích (~45%), Hình học Oxyz (~25%), Thống kê & Xác suất (~20%), Thực hành & Ứng dụng (~10%).",
        highestImpactArea: "Ứng dụng Đạo hàm & Khảo sát đồ thị hàm số",
        matrixCoverage: "0/6 Chuyên đề đã thi",
        domainBreakdown: {
          giai_tich: "Gồm Đạo hàm khảo sát và Nguyên hàm, Tích phân. Đây là trụ cột chiếm gần nửa tổng số điểm thi.",
          hinh_hoc: "Trọng tâm là phương pháp tọa độ Oxyz, phương trình mặt phẳng, đường thẳng và mặt cầu.",
          thong_ke_xac_suat: "Nội dung mới gồm Số đặc trưng mẫu số liệu ghép nhóm và Quy tắc tính xác suất Bayes."
        }
      };

      setAiDiagnosticAssessment(defaultDiagnostic);
      setAiCurriculumAssessment(defaultCurriculum);
      return;
    }

    setIsRefreshingAiAssessment(true);
    const skillsSummary = currentSkills.map(s => `${s.topic} (${s.name} - ${s.domain}): ${s.hasTested ? `${s.score}%` : 'Chưa kiểm tra'}`).join('\n');
    const recentScore = currentAttempts.length > 0 ? `${currentAttempts[currentAttempts.length - 1]?.score || 0}/10` : 'Chưa có';

    const prompt = `Học sinh lớp 12: ${currentUser.name || 'Học sinh'}.
Dữ liệu năng lực 6 chuyên đề Toán 12 Chuẩn GDPT 2018:
${skillsSummary}
Số bài thi đã làm: ${currentAttempts.length}.
Điểm bài gần nhất: ${recentScore}.

Hãy thực hiện ĐÁNH GIÁ TỔNG QUAN SƯ PHẠM TOÁN 12 THEO MA TRẬN ĐỀ THI 2025/2026 CỦA BỘ GD&ĐT:
1. Đánh giá tổng quan năng lực và chiến lược cá nhân hóa (điểm mạnh, điểm mù kiến thức thực tế, chiến thuật tối ưu bứt phá điểm số).
2. Đánh giá tổng quan Bản đồ năng lực 6 chuyên đề (so sánh 4 mạch kiến thức: Giải tích ~45%, Hình học Oxyz ~25%, Thống kê & Xác suất ~20%).
3. TUYỆT ĐỐI không dùng các từ "Scaffolding", "giàn giáo", "đơn thuốc", "nấc". Dùng giọng điệu sư phạm chuyên nghiệp, khích lệ, chính xác.

Trả về ĐÚNG định dạng JSON thuần túy (không bọc markdown block):
{
  "diagnosticAssessment": {
    "overviewText": "Nhận xét tổng quát 2-3 câu về trình độ hiện tại của học sinh",
    "strategicAdvice": "Lời khuyên chiến lược cụ thể để tăng điểm thi THPTQG",
    "keyStrength": "Điểm mạnh rõ ràng nhất dựa trên dữ liệu làm bài",
    "criticalBlindspot": "Phần kiến thức học sinh hay sai sót hoặc điểm thấp nhất",
    "focusTopicRecommendation": "Tên chuyên đề cụ thể cần tập trung cải thiện nhất"
  },
  "curriculumAssessment": {
    "summary": "Đánh giá mức độ đồng đều và độ bao phủ giữa các mạch kiến thức",
    "highestImpactArea": "Tên chuyên đề mang lại nhiều điểm số nhất nếu ôn luyện thêm",
    "matrixCoverage": "Ví dụ: Đã đánh giá 4/6 Chuyên đề",
    "domainBreakdown": {
      "giai_tich": "Nhận xét mạch Giải tích (Đạo hàm, Tích phân)",
      "hinh_hoc": "Nhận xét mạch Hình học không gian Oxyz",
      "thong_ke_xac_suat": "Nhận xét mạch Thống kê & Xác suất"
    }
  }
}`;

    try {
      const responseText = await askGroqAI(
        "Bạn là Chuyên gia Cố vấn Học tập và Sư phạm Toán 12 Chuẩn Bộ GD&ĐT. Hãy đánh giá trung thực, sắc bén, mang tính xây dựng cao. Bạn chỉ trả về JSON hợp lệ.",
        prompt,
        true
      );

      if (responseText) {
        let cleanText = responseText.trim();
        if (cleanText.startsWith('```')) {
          cleanText = cleanText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
        }
        const parsed = JSON.parse(cleanText);
        if (parsed.diagnosticAssessment && parsed.curriculumAssessment) {
          setAiDiagnosticAssessment(parsed.diagnosticAssessment);
          setAiCurriculumAssessment(parsed.curriculumAssessment);
          localStorage.setItem(cacheKey, JSON.stringify(parsed));
        }
      }
    } catch (err) {
      console.warn("Lỗi sinh đánh giá tổng quan AI:", err);
      // Fallback
      setAiDiagnosticAssessment({
        overviewText: `Học sinh đã hoàn thành ${currentAttempts.length} lượt làm bài với điểm trung bình ${Math.round(currentAttempts.reduce((acc: number, c: any) => acc + (c.score || 0), 0) / currentAttempts.length * 10) / 10}/10. Năng lực đang có xu hướng phát triển ổn định.`,
        strategicAdvice: "Tập trung giải quyết dứt điểm các câu hỏi mức Thông hiểu và Vận dụng trước khi chuyển sang các bài toán phân hóa cực trị tham số.",
        keyStrength: "Khả năng nắm bắt công thức cơ bản và làm quen nhanh với định dạng trắc nghiệm Đúng/Sai.",
        criticalBlindspot: "Bài toán thực tế liên môn và các trường hợp biên của hình học không gian Oxyz.",
        focusTopicRecommendation: "Củng cố chuyên đề Tọa độ không gian Oxyz và Số đặc trưng thống kê ghép nhóm."
      });

      setAiCurriculumAssessment({
        summary: `Học sinh đã bắt đầu làm chủ các chuyên đề trọng tâm với ${currentSkills.filter(s => s.hasTested).length}/6 chuyên đề được đánh giá dữ liệu thật.`,
        highestImpactArea: "Ứng dụng Đạo hàm & Khảo sát hàm số",
        matrixCoverage: `${currentSkills.filter(s => s.hasTested).length}/6 Chuyên đề đã thi`,
        domainBreakdown: {
          giai_tich: "Đóng góp 4.5 điểm trong ma trận. Cần đặc biệt chú ý phần ứng dụng tích phân tính diện tích, thể tích.",
          hinh_hoc: "Đóng góp 2.5 - 3.0 điểm. Cần rèn kỹ năng viết phương trình mặt phẳng và mặt cầu.",
          thong_ke_xac_suat: "Nội dung có tính phân hóa cao. Cần nắm chắc công thức xác suất toàn phần và Bayes."
        }
      });
    } finally {
      setIsRefreshingAiAssessment(false);
    }
  };

  const handleManualRefreshAiAssessment = () => {
    generateComprehensiveAiAssessments(skills, attempts, true);
  };

  // 1. Xử lý nhắn tin trực tiếp với FMATH AI Tutor Widget
  const handleSendTutorMessage = async (customText?: string) => {
    const text = (customText || tutorInputText).trim();
    if (!text || isTutorReplying) return;
    setTutorInputText('');
    const newHistory = [...tutorChatHistory, { role: 'user' as const, content: text }];
    setTutorChatHistory(newHistory);
    setIsTutorReplying(true);

    try {
      const sysPrompt = `Bạn là FMATH12 AI Tutor - Trợ lý Trí tuệ Nhân tạo Sư phạm Toán 12 độc quyền chuẩn Bộ GD&ĐT Việt Nam dành cho học sinh THPT toàn quốc.
[THÔNG TIN HỌC SINH]: ${currentUser.name || 'Học sinh'}
[LỊCH SỬ THI]: Đã làm ${attempts.length} bài thi.
[NGUYÊN TẮC GIẢNG DẠY]:
- Xưng hô: "Thầy" - "Em".
- Ngắn gọn, súc tích (dưới 4 câu nếu câu hỏi định hướng, hoặc từng bước cụ thể nếu hỏi bài toán).
- Hướng dẫn tư duy bản chất, chỉ ra mẹo thực chiến bám sát cấu trúc đề thi tốt nghiệp THPT 2026.
- Mọi công thức Toán học bọc trong $...$ hoặc $$...$$.
- TUYỆT ĐỐI không dùng các từ như Scaffolding, giàn giáo, đơn thuốc, nấc.`;

      const reply = await askGroqAI(sysPrompt, text, false, newHistory);
      setTutorChatHistory(prev => [...prev, { role: 'ai' as const, content: reply }]);
    } catch (err) {
      setTutorChatHistory(prev => [...prev, { role: 'ai' as const, content: "Xin lỗi em, đường truyền mạng đang bận. Em hỏi lại sau giây lát nhé!" }]);
    } finally {
      setIsTutorReplying(false);
    }
  };

  // 2. Xử lý Mở & Trò chuyện trong Modal Tư Vấn Năng Lực & Chiến Lược Học Tập 2026
  const handleOpenDiagnosticModal = () => {
    setShowDiagnosticModal(true);
    if (diagnosticChatHistory.length === 0) {
      const initialMsg = `Chào ${currentUser.name || 'em'}! Thầy là **FMATH12 AI** phụ trách **Phân Tích & Chẩn Đoán Năng Lực Toán 12 Chuẩn Cấu Trúc 2026**.

Dựa trên dữ liệu học tập thực tế của em:
- **Dự phóng điểm thi THPTQG 2026**: **${diagnosticData?.predictedScore || '---'}** điểm (Dải năng lực: ${diagnosticData?.scoreRange || 'Khởi động'}).
- **Thang đo 4 tầng nhận thức**: Nhận biết (${diagnosticData?.cognitiveDistribution.nhan_biet || 0}%), Thông hiểu (${diagnosticData?.cognitiveDistribution.thong_hieu || 0}%), Vận dụng (${diagnosticData?.cognitiveDistribution.van_dung || 0}%), Vận dụng cao (${diagnosticData?.cognitiveDistribution.van_dung_cao || 0}%).
- **Điểm mạnh nổi bật**: ${aiDiagnosticAssessment?.keyStrength || 'Sẵn sàng tiếp cận kiến thức chuẩn cấu trúc 2026'}.
- **Điểm mù cần củng cố**: ${aiDiagnosticAssessment?.criticalBlindspot || 'Cần luyện tập thêm đề kiểm tra để phát hiện bẫy câu hỏi'}.

Em muốn thầy tư vấn chiến lược tăng điểm, kế hoạch ôn tập tuần này hay giải đáp thắc mắc về bất kỳ phần kiến thức nào?`;
      setDiagnosticChatHistory([{ role: 'ai' as const, content: initialMsg }]);
    }
  };

  const handleSendDiagnosticMessage = async (customText?: string) => {
    const text = (customText || diagnosticInputText).trim();
    if (!text || isDiagnosticReplying) return;
    setDiagnosticInputText('');
    const newHistory = [...diagnosticChatHistory, { role: 'user' as const, content: text }];
    setDiagnosticChatHistory(newHistory);
    setIsDiagnosticReplying(true);

    try {
      const sysPrompt = `Bạn là FMATH12 AI - Cố vấn Sư phạm và Chiến lược Ôn thi THPT Quốc gia Toán 12 Chuẩn Cấu Trúc 2026 Bộ GD&ĐT.
[HỌC SINH]: ${currentUser.name || 'Học sinh'}
[DỰ PHÓNG ĐIỂM]: ${diagnosticData?.predictedScore} điểm.
[4 TẦNG NHẬN THỨC]: NB: ${diagnosticData?.cognitiveDistribution.nhan_biet}%, TH: ${diagnosticData?.cognitiveDistribution.thong_hieu}%, VD: ${diagnosticData?.cognitiveDistribution.van_dung}%, VDC: ${diagnosticData?.cognitiveDistribution.van_dung_cao}%.
[NGUYÊN TẮC TƯ VẤN]:
- Xưng hô: "Thầy" - "Em".
- Đưa ra lời khuyên chiến lược tự học và luyện thi thực tế: phân bổ thời gian 50 phút (Phần I: 12 câu trắc nghiệm 4 lựa chọn - 3.0 điểm, Phần II: 4 câu Đúng/Sai - 4.0 điểm, Phần III: 6 câu Trả lời ngắn - 3.0 điểm).
- Chỉ ra cách khắc phục bẫy đề thi và các công thức Toán trọng tâm bọc bằng KaTeX $...$.
- Tuyệt đối không dùng các từ như Scaffolding, giàn giáo, đơn thuốc, nấc.`;

      const reply = await askGroqAI(sysPrompt, text, false, newHistory);
      setDiagnosticChatHistory(prev => [...prev, { role: 'ai' as const, content: reply }]);
    } catch (err) {
      setDiagnosticChatHistory(prev => [...prev, { role: 'ai' as const, content: "Xin lỗi em, đường truyền mạng đang bận. Em hỏi lại sau giây lát nhé!" }]);
    } finally {
      setIsDiagnosticReplying(false);
    }
  };

  // 3. Xử lý AI Phân Tích Chuyên Đề Chuyên Sâu (Bản Đồ Năng Lực 2018)
  const handleOpenTopicAiAnalysis = async (topic: any) => {
    setSelectedTopicForAi(topic);
    setTopicAiAnalysis('');
    setIsAnalyzingTopic(true);

    try {
      const sysPrompt = `Bạn là FMATH12 AI - Cố vấn Sư phạm và Giảng dạy Toán 12 Chuẩn GDPT 2018 Bộ GD&ĐT.
Hãy phân tích toàn diện chuyên đề: "${topic.name}" (Mạch kiến thức: ${topic.domain}).
Học sinh: ${currentUser.name || 'Học sinh'}, độ thông thạo hiện tại: ${topic.score || 0}%.

YÊU CẦU NỘI DUNG PHÂN TÍCH:
1. **Vị trí & Tỷ trọng điểm trong đề thi 2026**: Xuất hiện ở những phần nào (Phần I trắc nghiệm, Phần II Đúng/Sai 4 ý, hay Phần III Trả lời ngắn), đóng góp khoảng bao nhiêu điểm.
2. **Top 3 Bẫy Đề Thi "Hiểm hóc"**: Những sai lầm chết người học sinh hay mắc phải ở chuyên đề này (ví dụ: điều kiện xác định, dấu bằng xảy ra, nhầm lẫn đồ thị f' và f).
3. **Chiến lược Ôn Luyện 4 Bậc Trọng Tâm**: Gợi ý học từ Bản chất trực quan (Bậc 1), Khung định lý (Bậc 2), Ví dụ mẫu & Casio (Bậc 3), đến Chinh phục 9+ (Bậc 4).
4. **Lời khuyên bứt phá**: 1 câu động viên chiến thuật.

Định dạng Markdown đẹp mắt, công thức Toán học bọc trong $...$ hoặc $$...$$. Tuyệt đối không dùng các từ Scaffolding, giàn giáo, đơn thuốc, nấc.`;

      const analysis = await askGroqAI(sysPrompt, `Phân tích chuyên đề ${topic.name} môn Toán 12`);
      setTopicAiAnalysis(analysis);
    } catch (err) {
      setTopicAiAnalysis(`Chuyên đề **${topic.name}** là một trong những nội dung trọng tâm của đề thi Tốt nghiệp THPT 2026. Em hãy ôn tập kỹ các dạng bài tập và lý thuyết theo 4 Bậc để nắm chắc điểm số!`);
    } finally {
      setIsAnalyzingTopic(false);
    }
  };

  const getWeakSpots = () => {
    if (aiGoals && aiGoals.length > 0) return aiGoals;

    if (!attempts || attempts.length === 0) {
      return [
        {
          title: "Bậc 1: Làm bài test khởi động",
          desc: "Thực hiện bài kiểm tra trắc nghiệm đầu tiên để hệ thống đo lường chính xác các chuyên đề Toán 12.",
          action: "Luyện tập ngay",
          path: "/quiz"
        },
        {
          title: "Bậc 2: Khám phá lý thuyết trực quan",
          desc: "Đọc sơ đồ tóm tắt kiến thức trọng tâm GDPT 2018 (Giải tích, Hình học Oxyz, Xác suất).",
          action: "Ôn Lý thuyết",
          path: "/theory"
        }
      ];
    }

    const spots = [];
    const tested = skills.filter(s => s.hasTested);
    const sortedSkills = [...tested].sort((a, b) => a.score - b.score);
    
    if (sortedSkills[0]) {
      spots.push({
        title: `Bậc 1: Củng cố ${sortedSkills[0].name}`,
        desc: `Độ thạo hiện tại: ${sortedSkills[0].score}%. Hệ thống hỗ trợ từng bước giúp vượt qua bẫy sai lầm phần này.`,
        action: 'Luyện tập ngay',
        path: '/quiz'
      });
    }

    if (sortedSkills[1]) {
      spots.push({
        title: `Bậc 2: Ôn lý thuyết ${sortedSkills[1].name}`,
        desc: `Bổ trợ kiến thức trực quan & khung công thức trọng điểm (Điểm thạo: ${sortedSkills[1].score}%).`,
        action: 'Ôn Lý thuyết',
        path: '/theory'
      });
    }

    return spots;
  };

  const weakSpots = getWeakSpots();

  return (
    <div className="page-container animate-in fade-in duration-300">
      <div className="page-content">
        <div className="max-w-7xl mx-auto space-y-6">
        
          {/* ========================================================================= */}
          {/* 1. HERO BANNER CHÀO MỪNG - MODERN FMATH BLUE THEME                        */}
          {/* ========================================================================= */}
          <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-blue-900 via-blue-800 to-slate-900 text-white shadow-xl border border-blue-700/40">
            {/* Ambient Cyan/Blue Orbs */}
            <div className="absolute -top-24 -right-24 w-88 h-88 rounded-full bg-sky-400/25 blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-24 -left-24 w-88 h-88 rounded-full bg-blue-600/30 blur-3xl pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-sky-300 text-xs font-bold font-heading border border-white/15">
                    <Sparkles size={13} className="text-sky-300 animate-pulse" />
                    <span>FMATH12 • GDPT 2018</span>
                  </div>
                </div>
                
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-heading text-white tracking-tight leading-tight m-0">
                  {greeting || 'Xin chào'}, {currentUser.name ? currentUser.name.split(' ').pop() : 'Bạn'}! 👋
                </h1>
                
                <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-300 font-sans pt-1">
                  <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg">
                    <School size={14} className="text-sky-300" />
                    {currentUser.school || 'Học sinh Tự do'}
                  </span>
                  <span>•</span>
                  <span>Lộ trình học tập cá nhân hoá đã kích hoạt</span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button 
                  onClick={() => navigate('/quiz')}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-400 to-blue-600 hover:from-sky-300 hover:to-blue-500 text-slate-950 font-bold font-heading text-sm px-5 py-3 rounded-xl shadow-lg shadow-sky-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  <PlayCircle size={18} /> Bắt đầu luyện tập
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 2. CHỈ SỐ METRICS FMATH12                                                 */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard 
              title="Điểm Tích Lũy" 
              value={(currentUser.xp || 0).toLocaleString()} 
              suffix="XP"
              icon={<Zap size={22} />} 
              colorClass="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800" 
            />
            <MetricCard 
              title="Cấp Độ Năng Lực" 
              value={currentUser.level || 1} 
              suffix="Level"
              icon={<Award size={22} />} 
              colorClass="text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 border border-sky-200/80 dark:border-sky-800" 
            />
            <MetricCard 
              title="Chuỗi Chuyên Cần" 
              value={currentUser.streak || 0} 
              suffix="Ngày liên tục"
              icon={<Flame size={22} className="text-amber-500 animate-pulse" />} 
              colorClass="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800" 
            />
            <MetricCard 
              title="Dự Báo Điểm Thi 2026" 
              value={diagnosticData && diagnosticData.predictedScore !== '---' ? diagnosticData.predictedScore : '---'} 
              suffix={diagnosticData && diagnosticData.predictedScore !== '---' ? 'Điểm' : 'Chưa có bài nộp'} 
              icon={<Trophy size={22} />} 
              colorClass="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800" 
            />
          </div>

          {/* ========================================================================= */}
          {/* 3. ĐÁNH GIÁ CÁ NHÂN HÓA NĂNG LỰC NGƯỜI HỌC (KHỐI MỚI TOÀN DIỆN)           */}
          {/* ========================================================================= */}
          {diagnosticData && (
            <div className="flat-card bg-gradient-to-br from-blue-50/80 via-white to-sky-50/60 dark:from-slate-900 dark:to-blue-950/40 border-blue-200/90 dark:border-blue-800/80 p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-blue-100 dark:border-blue-900/60 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-500 text-white flex items-center justify-center shadow-md">
                    <Activity size={20} />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold font-heading text-slate-900 dark:text-white m-0">
                      Đánh Giá Năng Lực & Kế Hoạch Học Tập Cá Nhân Hóa
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
                      Mô hình Phân Tích & Chẩn Đoán Năng Lực Chuẩn Cấu Trúc 2026
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleOpenDiagnosticModal}
                    className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 rounded-xl font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all"
                  >
                    <Sparkles size={14} className="text-amber-300" />
                    <span>Tư Vấn Năng Lực Cùng FMATH12 AI</span>
                  </button>
                  <span className="badge-primary font-bold text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-full">
                    <ShieldCheck size={14} className="text-blue-600" /> {diagnosticData.scaffoldingStep?.replace(/Nấc/gi, 'Bậc').replace(/Scaffolding/gi, '').trim()}
                  </span>
                </div>
              </div>

              {/* KHỐI AI NHẬN ĐỊNH TỔNG QUAN NĂNG LỰC & CHIẾN LƯỢC HỌC TẬP */}
              {aiDiagnosticAssessment && (
                <div className="rounded-2xl p-4 sm:p-5 bg-white/95 dark:bg-slate-800/90 border border-blue-200/80 dark:border-blue-800/80 space-y-4 shadow-xs animate-in fade-in">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-700/60">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-blue-600 animate-pulse" />
                      <h3 className="text-xs sm:text-sm font-bold font-heading text-slate-900 dark:text-white m-0">
                        AI Nhận Định Tổng Quan Năng Lực & Chiến Lược Thi Đấu
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        FMATH12 AI Powered
                      </span>
                      <button
                        onClick={handleManualRefreshAiAssessment}
                        disabled={isRefreshingAiAssessment}
                        className="p-1 text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-1 text-[11px] font-medium"
                        title="Phân tích lại với AI"
                      >
                        <RefreshCw size={12} className={isRefreshingAiAssessment ? "animate-spin" : ""} />
                        <span className="hidden sm:inline">Làm mới</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-xs sm:text-[13px] text-slate-700 dark:text-slate-200 leading-relaxed m-0 font-medium">
                    {aiDiagnosticAssessment.overviewText}
                  </p>

                  {/* 2 Cột: Điểm Mạnh Thực Tế & Điểm Mù Cần Khắc Phục */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/60">
                      <span className="text-[10.5px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide flex items-center gap-1.5 mb-1">
                        <CheckCircle2 size={13} className="text-emerald-600" /> Điểm mạnh nổi trội:
                      </span>
                      <p className="text-xs text-emerald-900 dark:text-emerald-200 m-0 leading-relaxed font-medium">
                        {aiDiagnosticAssessment.keyStrength}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/60 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[10.5px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                            <AlertCircle size={13} className="text-amber-600" /> Điểm mù cần củng cố:
                          </span>
                          <button
                            onClick={() => navigate('/quiz', { state: { activeTab: 'Chuyên đề' } })}
                            className="px-2 py-0.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] transition-all flex items-center gap-1 shadow-2xs cursor-pointer shrink-0"
                            title="Tự động lọc đề củng cố điểm mù kiến thức"
                          >
                            <Target size={11} /> Luyện tập khắc phục ngay
                          </button>
                        </div>
                        <p className="text-xs text-amber-900 dark:text-amber-200 m-0 leading-relaxed font-medium">
                          {aiDiagnosticAssessment.criticalBlindspot}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Lời khuyên chiến thuật & Chuyên đề trọng tâm */}
                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/60 flex items-start gap-2.5">
                      <Compass size={16} className="text-blue-600 shrink-0 mt-0.5" />
                      <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        <span className="font-bold text-blue-900 dark:text-blue-300">Chiến thuật tối ưu điểm số: </span>
                        {aiDiagnosticAssessment.strategicAdvice}
                      </div>
                    </div>

                    {aiDiagnosticAssessment.focusTopicRecommendation && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs bg-slate-50 dark:bg-slate-800/60 px-3 py-2.5 rounded-lg border border-slate-200/70 dark:border-slate-700/70">
                        <span className="text-slate-500 font-medium">
                          Khuyến nghị ưu tiên tuần này: <strong className="text-blue-600 dark:text-blue-400">{aiDiagnosticAssessment.focusTopicRecommendation}</strong>
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <button 
                            onClick={() => navigate('/quiz', { state: { activeTab: 'Chuyên đề' } })} 
                            className="px-3 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                          >
                            <Target size={12} /> Luyện đề tương tự &rarr;
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 4 Tầng Phân Phối Nhận Thức (Cognitive Distribution) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300 font-heading">
                  <span className="flex items-center gap-1.5">
                    <Layers size={14} className="text-blue-600" />
                    Thang Đo 4 Tầng Nhận Thức (Ma trận Đề Bộ GD&ĐT)
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">Dải dự báo: {diagnosticData.scoreRange} điểm</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                    <div className="flex justify-between items-center text-[11px] font-semibold text-slate-500">
                      <span>1. Nhận biết</span>
                      <span className="font-bold text-emerald-600">{diagnosticData.cognitiveDistribution.nhan_biet}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${diagnosticData.cognitiveDistribution.nhan_biet}%` }} />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                    <div className="flex justify-between items-center text-[11px] font-semibold text-slate-500">
                      <span>2. Thông hiểu</span>
                      <span className="font-bold text-blue-600">{diagnosticData.cognitiveDistribution.thong_hieu}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${diagnosticData.cognitiveDistribution.thong_hieu}%` }} />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                    <div className="flex justify-between items-center text-[11px] font-semibold text-slate-500">
                      <span>3. Vận dụng</span>
                      <span className="font-bold text-amber-600">{diagnosticData.cognitiveDistribution.van_dung}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${diagnosticData.cognitiveDistribution.van_dung}%` }} />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                    <div className="flex justify-between items-center text-[11px] font-semibold text-slate-500">
                      <span>4. Vận dụng cao</span>
                      <span className="font-bold text-rose-600">{diagnosticData.cognitiveDistribution.van_dung_cao}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500 rounded-full" style={{ width: `${diagnosticData.cognitiveDistribution.van_dung_cao}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Lời khuyên hành động */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-blue-200 dark:border-blue-900/60 gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                    <BrainCircuit size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white m-0 font-heading">
                      Kế Hoạch Khắc Phục Điểm Mù Kiến Thức:
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 m-0 mt-1 leading-relaxed">
                      {(diagnosticData.recommendedAction || '')
                        .replace(/rèn giàn giáo Scaffolding/gi, 'rèn luyện')
                        .replace(/bài tập Scaffolding/gi, 'bài tập')
                        .replace(/Scaffolding/gi, '')
                        .replace(/Nấc/gi, 'Bậc')
                        .trim()}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => navigate('/quiz')}
                  className="btn-primary shrink-0 text-xs py-2.5 px-4 font-bold shadow-md shadow-blue-500/20"
                >
                  Bắt đầu Luyện tập <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 4. KHỐI CHÍNH: BẢN ĐỒ THÍCH ỨNG & AI TUTOR WIDGET                         */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* CỘT TRÁI (8 COLS): BẢN ĐỒ NĂNG LỰC 7 CHUYÊN ĐỀ & LỘ TRÌNH */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* BẢN ĐỒ NĂNG LỰC THÍCH ỨNG 7 CHUYÊN ĐỀ */}
              <div className="flat-card space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <Compass size={18} />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold font-heading text-slate-900 dark:text-white m-0">
                        Bản Đồ Năng Lực Chuẩn GDPT 2018 (Toán 12)
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
                        Đánh giá mức độ thuần thục bám sát 4 mạch kiến thức Bộ GD&ĐT 2025/2026
                      </p>
                    </div>
                  </div>
                  <span className="badge-fmath self-start sm:self-auto">Chuẩn Khung Bộ GD&ĐT</span>
                </div>

                {/* AI ĐÁNH GIÁ TỔNG QUAN BẢN ĐỒ NĂNG LỰC */}
                {aiCurriculumAssessment && (
                  <div className="rounded-xl p-4 bg-gradient-to-r from-blue-50/90 via-sky-50/50 to-indigo-50/70 dark:from-slate-800/80 dark:to-blue-950/50 border border-blue-200/80 dark:border-blue-800/80 space-y-3 shadow-2xs animate-in fade-in">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center shadow-xs">
                          <Sparkles size={13} />
                        </div>
                        <span className="text-xs font-bold font-heading text-slate-800 dark:text-white uppercase tracking-wider">
                          AI Đánh Giá Tổng Quan 4 Mạch Kiến Thức (Chuẩn 2026)
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-white dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-blue-200/70 shadow-2xs">
                        {aiCurriculumAssessment.matrixCoverage}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed m-0 font-medium">
                      {aiCurriculumAssessment.summary}
                    </p>

                    {/* 3 Chip Phân Tích Mạch Kiến Thức */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                      <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70">
                        <span className="font-bold text-blue-700 dark:text-blue-400 block mb-0.5">📐 Giải tích (~45%)</span>
                        <p className="text-[11.5px] text-slate-600 dark:text-slate-300 m-0 leading-normal">
                          {aiCurriculumAssessment.domainBreakdown.giai_tich}
                        </p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70">
                        <span className="font-bold text-indigo-700 dark:text-indigo-400 block mb-0.5">🌐 Hình học Oxyz (~25%)</span>
                        <p className="text-[11.5px] text-slate-600 dark:text-slate-300 m-0 leading-normal">
                          {aiCurriculumAssessment.domainBreakdown.hinh_hoc}
                        </p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70">
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 block mb-0.5">📊 Thống kê & Xác suất (~20%)</span>
                        <p className="text-[11.5px] text-slate-600 dark:text-slate-300 m-0 leading-normal">
                          {aiCurriculumAssessment.domainBreakdown.thong_ke_xac_suat}
                        </p>
                      </div>
                    </div>

                    {/* Chuyên đề ưu tiên bứt phá điểm */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs bg-white/90 dark:bg-slate-800/90 p-2.5 rounded-lg border border-blue-200/60 dark:border-blue-800/60 gap-2">
                      <div className="flex items-center gap-2">
                        <Target size={14} className="text-rose-600 shrink-0" />
                        <span className="font-bold text-slate-800 dark:text-slate-200">Khu vực tạo bứt phá điểm số cao nhất:</span>
                        <span className="text-blue-600 dark:text-blue-400 font-semibold">{aiCurriculumAssessment.highestImpactArea}</span>
                      </div>
                      <button onClick={() => navigate('/quiz')} className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1 shrink-0">
                        Luyện đề chuyên sâu <ArrowRight size={12}/>
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                  {skills.map((skill, index) => {
                    let statusLabel = 'Chưa thi';
                    let badgeClass = 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700';
                    let barGradient = 'from-slate-300 to-slate-400';

                    if (skill.hasTested) {
                      if (skill.score >= 80) {
                        statusLabel = 'Thuần thục';
                        badgeClass = 'badge-success';
                        barGradient = 'from-emerald-500 to-teal-500';
                      } else if (skill.score >= 65) {
                        statusLabel = 'Đạt chuẩn';
                        badgeClass = 'badge-primary';
                        barGradient = 'from-blue-600 to-sky-400';
                      } else if (skill.score >= 50) {
                        statusLabel = 'Trung bình';
                        badgeClass = 'badge-warning';
                        barGradient = 'from-amber-500 to-orange-500';
                      } else {
                        statusLabel = 'Cần luyện';
                        badgeClass = 'badge-danger';
                        barGradient = 'from-rose-500 to-red-500';
                      }
                    }

                    return (
                      <div 
                        key={index} 
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 space-y-2 hover:border-blue-400 transition-all cursor-pointer group"
                        onClick={() => navigate('/quiz')}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-[10.5px] font-bold text-slate-400 font-heading uppercase tracking-wide">
                            {skill.topic} &bull; {skill.domain}
                          </span>
                          <span className={badgeClass}>{statusLabel}</span>
                        </div>
                        
                        <h4 className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white m-0 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {skill.name}
                        </h4>

                        <div className="space-y-1 pt-1">
                          <div className="flex justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            <span>Độ thông thạo</span>
                            <span className="font-heading font-bold text-slate-900 dark:text-white">
                              {skill.hasTested ? `${skill.score}%` : 'Chưa kiểm tra'}
                            </span>
                          </div>
                          <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full bg-gradient-to-r ${barGradient} rounded-full transition-all duration-700`} 
                              style={{ width: `${skill.score}%` }}
                            />
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenTopicAiAnalysis(skill);
                            }}
                            className="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 hover:underline"
                          >
                            <Sparkles size={11} className="text-amber-500" />
                            <span>FMATH12 AI Phân Tích</span>
                          </button>
                          <span className="text-slate-400 font-semibold group-hover:text-blue-500 transition-colors">
                            Luyện tập &rarr;
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* LỘ TRÌNH CHƯƠNG TRÌNH */}
              <div className="flat-card space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                      <Target size={18} />
                    </div>
                    <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white m-0">
                      Tiến Độ Chương Trình Lớp 12
                    </h3>
                  </div>
                  <button onClick={() => navigate('/theory')} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
                    Xem toàn bộ lộ trình học tập →
                  </button>
                </div>

                {isLoading ? (
                  <div className="py-8 flex flex-col items-center justify-center text-slate-400">
                    <Loader2 size={24} className="animate-spin text-blue-600 mb-2" />
                    <span className="text-xs">Đang đồng bộ dữ liệu chương trình...</span>
                  </div>
                ) : chapters.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs border border-dashed rounded-2xl">
                    Chưa có bài học nào được hoàn thành. Hãy bắt đầu học ngay!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {chapters.slice(0, 4).map((chap, idx) => {
                      const totalLessons = chap.lessons?.length || 0;
                      const completedLessons = chap.lessons?.filter((l: any) => l.isCompleted).length || 0;
                      const progress = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);

                      return (
                        <div key={chap.id || idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70 flex flex-col gap-1.5">
                          <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                            <span className="truncate pr-3">{chap.title}</span>
                            <span className="font-heading font-bold text-blue-600 dark:text-blue-400">{progress}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-600 to-sky-400 rounded-full transition-all duration-700" 
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* CỘT PHẢI (4 COLS): AI TUTOR WIDGET & CÁ NHÂN HÓA MỤC TIÊU */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* FMATH AI TUTOR CARD (INTERACTIVE LIVE ASSISTANT) */}
              <div className="flat-card bg-gradient-to-br from-blue-500/10 via-sky-500/5 to-cyan-500/10 border-blue-200 dark:border-blue-800/80 p-5 space-y-3.5 shadow-md">
                <div className="flex items-center justify-between pb-3 border-b border-blue-100 dark:border-blue-900/60">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-500 text-white flex items-center justify-center shadow-xs">
                      <BrainCircuit size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold font-heading text-slate-900 dark:text-white text-sm m-0">FMATH12 AI Tutor</h3>
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Trợ lý Sư phạm 24/7
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    Trực tiếp
                  </span>
                </div>

                {/* Khung tin nhắn hội thoại với FMATH12 AI Tutor */}
                <div className="h-56 overflow-y-auto space-y-2.5 p-3 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-blue-100 dark:border-slate-800 custom-scrollbar text-xs">
                  {tutorChatHistory.length === 0 ? (
                    <div className="space-y-2 p-2">
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                          AI
                        </div>
                        <div className="p-2.5 rounded-xl rounded-tl-none bg-blue-50 dark:bg-blue-950/50 text-slate-800 dark:text-slate-200 border border-blue-100 dark:border-blue-900/50">
                          {isAiLoading ? (
                            <div className="flex items-center gap-1.5 text-blue-600">
                              <Loader2 size={13} className="animate-spin" />
                              <span>FMATH12 AI đang phân tích hồ sơ năng lực của em...</span>
                            </div>
                          ) : (
                            <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]} components={SvgMarkdownComponents}>
                              {aiTutorMessage || `Chào em! Thầy là **FMATH12 AI Tutor**. Thầy đã sẵn sàng giải đáp mọi thắc mắc Toán 12, phân tích phương pháp giải và chỉ ra bẫy đề thi 2026. Em muốn hỏi điều gì nào?`}
                            </ReactMarkdown>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    tutorChatHistory.map((msg, i) => (
                      <div key={i} className={`flex items-start gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'ai' && (
                          <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                            AI
                          </div>
                        )}
                        <div className={`p-2.5 rounded-xl text-xs max-w-[85%] leading-relaxed ${
                          msg.role === 'user' 
                            ? 'bg-blue-600 text-white rounded-tr-none font-medium' 
                            : 'bg-blue-50 dark:bg-blue-950/50 text-slate-800 dark:text-slate-200 rounded-tl-none border border-blue-100 dark:border-blue-900/50'
                        }`}>
                          <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]} components={SvgMarkdownComponents}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    ))
                  )}

                  {isTutorReplying && (
                    <div className="flex items-center gap-2 p-2 text-blue-600 dark:text-blue-400">
                      <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                        AI
                      </div>
                      <div className="p-2 rounded-xl rounded-tl-none bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 flex items-center gap-1.5 text-[11px] font-medium">
                        <Loader2 size={13} className="animate-spin" />
                        <span>Thầy FMATH12 AI đang soạn lời giải...</span>
                      </div>
                    </div>
                  )}
                  <div ref={tutorChatEndRef} />
                </div>

                {/* Gợi ý câu hỏi nhanh 1-chạm */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Mẹo làm câu Đúng/Sai 4 ý?",
                    "Chiến lược đạt 8+ Toán 2026?",
                    "Bẫy thường gặp trong Oxyz?",
                    "Cách phân bổ thời gian 50 phút?"
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendTutorMessage(chip)}
                      disabled={isTutorReplying}
                      className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-blue-200/60 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition-colors"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Hộp nhập tin nhắn gửi FMATH12 AI */}
                <div className="flex items-center gap-1.5 pt-1">
                  <input
                    type="text"
                    value={tutorInputText}
                    onChange={e => setTutorInputText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSendTutorMessage();
                    }}
                    placeholder="Hỏi Thầy FMATH12 AI bất kỳ bài toán nào..."
                    className="flex-1 text-xs py-2 px-3 rounded-xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-slate-700 outline-none focus:border-blue-600 text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleSendTutorMessage()}
                    disabled={isTutorReplying || !tutorInputText.trim()}
                    className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white transition-all shrink-0 active:scale-95"
                    title="Gửi câu hỏi"
                  >
                    <Send size={14} />
                  </button>
                </div>

                <button 
                  onClick={() => navigate('/theory')}
                  className="btn-outline w-full py-2 text-xs font-bold font-heading flex items-center justify-center gap-1.5 rounded-xl"
                >
                  <BookOpen size={13} /> Mở Trợ Giảng Trong Bài Học <ArrowRight size={13} />
                </button>
              </div>

              {/* MỤC TIÊU CÁ NHÂN HÓA THEO CẤP ĐỘ */}
              <div className="flat-card space-y-3.5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="font-bold font-heading text-slate-900 dark:text-white text-sm m-0 flex items-center gap-1.5">
                    <Target size={16} className="text-amber-500" /> Bậc Mục Tiêu Cần Đạt
                  </h3>
                  <span className="badge-primary text-[10px] font-bold">Cá nhân hóa</span>
                </div>

                <div className="space-y-2.5">
                  {weakSpots.map((spot, idx) => (
                    <div 
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 space-y-1.5 hover:border-blue-400 transition-all"
                    >
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white m-0 line-clamp-1">{spot.title}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 m-0 leading-normal">{spot.desc}</p>
                      <button 
                        onClick={() => navigate(spot.path)}
                        className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 pt-1 hover:underline"
                      >
                        {spot.action} <ChevronRight size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* MỤC TIÊU TUẦN NÀY */}
              <div className="p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Trophy size={20} />
                </div>
                <div>
                  <h4 className="font-bold font-heading text-xs text-amber-950 dark:text-amber-200 m-0">Nhiệm vụ tuần: Cán mốc 500 XP</h4>
                  <p className="text-[11px] text-amber-800 dark:text-amber-400 m-0 leading-tight">Giải 10 bài tập bất kỳ để nhận huy hiệu tuần!</p>
                </div>
              </div>

            </div>

          </div>

          {/* ========================================================================= */}
          {/* 4.5. LỊCH SỬ LÀM BÀI & THỐNG KÊ TIẾN ĐỘ THEO THỜI GIAN (CN4)             */}
          {/* ========================================================================= */}
          <div className="flat-card space-y-4 p-5 border border-slate-200/80 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
                  <History size={18} />
                </div>
                <div>
                  <h3 className="font-bold font-heading text-slate-900 dark:text-white text-base m-0 flex items-center gap-2">
                    Lịch Sử Làm Bài &amp; Thống Kê Tiến Độ
                    <span className="badge-primary text-[10px] font-bold">Tiêu chí CN4</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
                    Theo dõi tiến trình làm bài, điểm số thực tế và xem lại lời giải chi tiết từng bài thi.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Đã hoàn thành: <strong className="text-indigo-600 dark:text-indigo-400 font-raleway">{attempts.length}</strong> bài
                </span>
                <button
                  onClick={() => navigate('/quiz')}
                  className="btn-outline py-1.5 px-3 text-xs font-bold font-heading rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Target size={13} /> Luyện bài mới
                </button>
              </div>
            </div>

            {attempts.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-850/50 border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 mx-auto flex items-center justify-center">
                  <Clock size={24} />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 m-0">Chưa ghi nhận lịch sử bài làm</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
                    Em hãy thử sức với một bài kiểm tra để hệ thống lưu trữ lịch sử, tính toán ma trận năng lực và đưa ra lộ trình bồi dưỡng cá nhân hóa.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/quiz')}
                  className="btn-primary py-2 px-4 text-xs font-bold rounded-xl cursor-pointer"
                >
                  <PlayCircle size={14} /> Khởi động bài test đầu tiên
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200/80 dark:border-slate-800 text-slate-400 uppercase font-heading text-[10.5px]">
                      <th className="py-2.5 px-3 font-bold">STT</th>
                      <th className="py-2.5 px-3 font-bold">Tên bài kiểm tra / Đề thi</th>
                      <th className="py-2.5 px-3 font-bold">Chuyên đề</th>
                      <th className="py-2.5 px-3 font-bold">Thời gian nộp</th>
                      <th className="py-2.5 px-3 font-bold text-center">Điểm số</th>
                      <th className="py-2.5 px-3 font-bold text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
                    {attempts.slice(-5).reverse().map((att: any, idx: number) => {
                      const score = Number(att.score || 0);
                      const isHigh = score >= 8;
                      const isMedium = score >= 5 && score < 8;
                      const examTitle = att.exams?.title || att.exam_title || `Đề luyện thi môn Toán #${att.exam_id ? String(att.exam_id).substring(0, 6) : idx + 1}`;
                      const category = att.exams?.category || 'Chuyên đề GDPT 2018';
                      const submitDate = att.created_at ? new Date(att.created_at).toLocaleDateString('vi-VN', {
                        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      }) : 'Vừa xong';

                      return (
                        <tr key={att.id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-3 font-semibold text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-100 max-w-xs truncate">
                            {examTitle}
                          </td>
                          <td className="py-3 px-3 text-slate-500 dark:text-slate-400">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-medium">
                              {category}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            <span className="flex items-center gap-1.5">
                              <Calendar size={12} className="text-slate-400" />
                              {submitDate}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-heading font-black text-xs ${
                              isHigh 
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800'
                                : isMedium
                                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800'
                                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800'
                            }`}>
                              {score.toFixed(1)}/10
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <button
                              onClick={() => {
                                if (att.exam_id) {
                                  navigate(`/quiz/${att.exam_id}`);
                                } else {
                                  navigate('/quiz');
                                }
                              }}
                              className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 font-bold text-[11px] transition-colors inline-flex items-center gap-1 cursor-pointer"
                            >
                              <FileText size={12} /> Xem lời giải chi tiết &rarr;
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* 5. PHÂN HỆ HỌC TẬP NHANH FMATH12                                         */}
          {/* ========================================================================= */}
          <div className="space-y-3 pt-2">
            <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white m-0">
              Phân Hệ Học Tập FMATH12
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
              <ActionCard 
                icon={<BookOpen size={20} />} 
                title="Lý Thuyết" 
                desc="Lý thuyết 4 Cấp độ" 
                onClick={() => navigate('/theory')} 
              />
              <ActionCard 
                icon={<Target size={20} />} 
                title="Luyện Tập" 
                desc="Chuyên đề & Đề 3 phần" 
                badge="Hot" 
                onClick={() => navigate('/quiz')} 
              />
              <ActionCard 
                icon={<Sparkles size={20} />} 
                title="Đề Ngẫu Nhiên" 
                desc="Bốc đề thông minh tự động" 
                badge="Adaptive" 
                onClick={() => navigate('/quiz', { state: { activeTab: 'Đề luyện thi' } })} 
              />
              <ActionCard 
                icon={<Video size={20} />} 
                title="Bài Giảng" 
                desc="Video & Học liệu chuẩn" 
                onClick={() => navigate('/resources')} 
              />
              <ActionCard 
                icon={<Users size={20} />} 
                title="Lớp Học" 
                desc="Không gian lớp của bạn" 
                onClick={() => navigate('/classroom')} 
              />
              <ActionCard 
                icon={<Trophy size={20} />} 
                title="Bảng Vàng" 
                desc="Vinh danh toàn quốc" 
                onClick={() => navigate('/leaderboard')} 
              />
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: TƯ VẤN NĂNG LỰC & CHIẾN LƯỢC ÔN TẬP 2026 CÙNG FMATH12 AI          */}
      {/* ========================================================================= */}
      {showDiagnosticModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl border border-blue-200 dark:border-blue-900/80 flex flex-col max-h-[90vh] overflow-hidden">
            {/* Header Modal */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-blue-50/80 via-white to-sky-50/60 dark:from-slate-850 dark:to-blue-950/40 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold font-heading text-slate-900 dark:text-white m-0">
                    FMATH12 AI &bull; Chẩn Đoán Năng Lực & Chiến Lược Ôn Tập 2026
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 m-0">
                    Tư vấn lộ trình bứt phá điểm thi Tốt nghiệp THPT môn Toán 12
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDiagnosticModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Đóng modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Thống kê năng lực nhanh */}
            <div className="p-4 bg-slate-50/90 dark:bg-slate-850/60 border-b border-slate-100 dark:border-slate-800 shrink-0 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Dự phóng 2026</span>
                <span className="font-heading font-black text-blue-600 text-sm">{diagnosticData?.predictedScore || '---'} điểm</span>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Nhận biết & Thông hiểu</span>
                <span className="font-heading font-black text-emerald-600 text-sm">
                  {Math.round(((diagnosticData?.cognitiveDistribution.nhan_biet || 0) + (diagnosticData?.cognitiveDistribution.thong_hieu || 0)) / 2)}%
                </span>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Vận dụng</span>
                <span className="font-heading font-black text-amber-600 text-sm">{diagnosticData?.cognitiveDistribution.van_dung || 0}%</span>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Vận dụng cao</span>
                <span className="font-heading font-black text-rose-600 text-sm">{diagnosticData?.cognitiveDistribution.van_dung_cao || 0}%</span>
              </div>
            </div>

            {/* Nội dung hội thoại tư vấn */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 custom-scrollbar text-xs">
              {diagnosticChatHistory.map((msg, i) => (
                <div key={i} className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'ai' && (
                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      AI
                    </div>
                  )}
                  <div className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none font-medium' 
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200/70 dark:border-slate-700'
                  }`}>
                    <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]} components={SvgMarkdownComponents}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}

              {isDiagnosticReplying && (
                <div className="flex items-center gap-2 p-2 text-blue-600 dark:text-blue-400">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    AI
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-xs">
                    <Loader2 size={14} className="animate-spin" />
                    <span>FMATH12 AI đang phân tích dữ liệu và lập chiến lược...</span>
                  </div>
                </div>
              )}
              <div ref={diagnosticChatEndRef} />
            </div>

            {/* Gợi ý câu hỏi nhanh */}
            <div className="p-3 bg-slate-50/70 dark:bg-slate-850/40 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-1.5 shrink-0">
              {[
                "Làm sao nâng điểm từ 6 lên 8+?",
                "Chiến lược phân bổ 50 phút trong phòng thi?",
                "Khắc phục bẫy phần Đúng/Sai (Phần II)?",
                "Phần kiến thức nào dễ lấy điểm nhất?"
              ].map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendDiagnosticMessage(q)}
                  disabled={isDiagnosticReplying}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-600 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input gửi tin nhắn */}
            <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2 shrink-0">
              <input
                type="text"
                value={diagnosticInputText}
                onChange={e => setDiagnosticInputText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSendDiagnosticMessage();
                }}
                placeholder="Hỏi FMATH12 AI về năng lực, điểm mù hoặc chiến lược ôn thi 2026..."
                className="flex-1 text-xs py-2.5 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-blue-600 text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => handleSendDiagnosticMessage()}
                disabled={isDiagnosticReplying || !diagnosticInputText.trim()}
                className="btn-primary py-2.5 px-4 text-xs font-bold shrink-0 flex items-center gap-1.5"
              >
                <Send size={14} /> Gửi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: FMATH12 AI PHÂN TÍCH CHUYÊN ĐỀ (BẢN ĐỒ NĂNG LỰC CHUẨN 2018)       */}
      {/* ========================================================================= */}
      {selectedTopicForAi && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-blue-200 dark:border-blue-900/80 flex flex-col max-h-[85vh] overflow-hidden">
            {/* Header Modal */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-blue-50/80 via-white to-indigo-50/60 dark:from-slate-850 dark:to-blue-950/40 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Compass size={18} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold font-heading text-slate-900 dark:text-white m-0">
                    FMATH12 AI &bull; Phân Tích Chuyên Đề 2026
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 m-0">
                    {selectedTopicForAi.name} ({selectedTopicForAi.domain})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTopicForAi(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Đóng modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Thông số nhanh */}
            <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900/40 flex items-center justify-between text-xs shrink-0">
              <span className="text-slate-600 dark:text-slate-300 font-medium">
                Mạch: <strong className="text-slate-900 dark:text-white">{selectedTopicForAi.domain}</strong>
              </span>
              <span className="badge-primary text-[11px] font-bold">
                Độ thông thạo: {selectedTopicForAi.score || 0}%
              </span>
            </div>

            {/* Nội dung phân tích AI */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar text-xs leading-relaxed space-y-3">
              {isAnalyzingTopic ? (
                <div className="py-12 flex flex-col items-center justify-center text-blue-600 gap-3">
                  <Loader2 size={28} className="animate-spin" />
                  <span className="font-semibold text-xs text-slate-600 dark:text-slate-300">
                    FMATH12 AI đang bóc tách ma trận đề thi và giải mã bẫy chuyên đề...
                  </span>
                </div>
              ) : (
                <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]} components={SvgMarkdownComponents}>
                  {topicAiAnalysis}
                </ReactMarkdown>
              )}
            </div>

            {/* Footer hành động */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedTopicForAi(null)}
                className="btn-secondary py-2 px-4 text-xs font-bold"
              >
                Đóng
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTopicForAi(null);
                    navigate('/theory');
                  }}
                  className="btn-outline py-2 px-3.5 text-xs font-bold"
                >
                  <BookOpen size={13} /> Học Lý Thuyết 4 Bậc
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTopicForAi(null);
                    navigate('/quiz');
                  }}
                  className="btn-primary py-2 px-3.5 text-xs font-bold"
                >
                  <Target size={13} /> Luyện Đề Chuyên Đề Này
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Component Thẻ Chỉ Số
const MetricCard = ({ title, value, suffix, icon, colorClass }: any) => (
  <div className="flat-card flex items-center gap-3.5 p-4 border border-slate-200/80 dark:border-slate-800">
    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${colorClass}`}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-[10.5px] font-bold text-slate-400 font-heading uppercase tracking-wider mb-0.5 truncate">{title}</div>
      <div className="text-lg sm:text-xl font-black font-heading text-slate-900 dark:text-white leading-tight">
        {value} <span className="text-xs text-slate-400 font-medium font-sans">{suffix}</span>
      </div>
    </div>
  </div>
);

// Component Thẻ Hành Động Nhanh
const ActionCard = ({ icon, title, desc, onClick, badge }: any) => (
  <button 
    onClick={onClick} 
    className="flat-card-interactive flex flex-col items-start p-4 text-left relative group cursor-pointer border hover:border-blue-400 dark:hover:border-blue-500"
  >
    {badge && (
      <span className="absolute top-3 right-3 badge-primary">
        {badge}
      </span>
    )}
    <div className="text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2">
      {icon}
    </div>
    <span className="font-bold font-heading text-slate-900 dark:text-white text-xs sm:text-[13px] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
      {title}
    </span>
    <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-sans leading-tight">
      {desc}
    </span>
  </button>
);

export default Dashboard;