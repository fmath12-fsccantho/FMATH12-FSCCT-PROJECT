import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, Loader2, ArrowLeft, ArrowRight, BrainCircuit, 
  Send, Trophy, Flame, Calendar, CheckCircle2, XCircle, 
  MessageSquare, LayoutGrid, ChevronLeft, CheckSquare, RefreshCcw, BookOpen, AlertTriangle, WifiOff
} from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';
import { supabase } from '../../config/supabase';
import { useAppStore, useExamStore } from '../../store/useAppStore';
import { askGroqAI } from '../../services/groqAI';
import { calculateStreakUpdate } from '../../utils/streakUtils';
import { SUPPLEMENTAL_SYSTEM_EXAMS } from '../../config/systemExams';
import { formatMathAndSteps } from '../../utils/mathLatexUtils';

// --- HÀM TIỆN ÍCH ---
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
  Object.keys(parsed).forEach(k => { normalized[String(k).toLowerCase().trim()] = parsed[k]; });
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

// --- COMPONENT CHÍNH ---
const QuizTaking = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Lấy sessionId nếu học sinh đi từ Sảnh chờ (Khảo thí Online)
  const searchParams = new URLSearchParams(location.search);
  const sessionId = searchParams.get('sessionId');
  
  const { currentUser, setUser, isOnline, setOnlineStatus, setOfflineAnswer, syncAnswersToDB, clearOfflineAnswers } = useAppStore();
  const { clearCache } = useExamStore();

  const [examData, setExamData] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [isPreparing, setIsPreparing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null); 
  const [aiReview, setAiReview] = useState("");
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const [chatInputs, setChatInputs] = useState<Record<string, string>>({});
  const [chatHistory, setChatHistory] = useState<Record<string, {role: string, content: string}[]>>({});
  const [isAiReplying, setIsAiReplying] = useState<Record<string, boolean>>({});
  const [openChatId, setOpenChatId] = useState<string | null>(null);

  const questionBodyRef = useRef<HTMLDivElement>(null);

  // ==========================================
  // 1. TẢI DỮ LIỆU ĐỀ THI
  // ==========================================
  useEffect(() => {
    let isMounted = true;
    const prepareQuiz = async () => {
      if (!id) return;
      if (!currentUser?.id) {
        const timer = setTimeout(() => { if (isMounted) setIsPreparing(false); }, 3000); 
        return () => clearTimeout(timer);
      }

      setIsPreparing(true);
      try {
        let fetchedExam: any = null;
        let extractedQuestions: any[] = [];

        // 1. Kiểm tra session đề ngẫu nhiên Ma trận 2026 hoặc Đề khắc phục lỗi sai
        const cachedCustom = sessionStorage.getItem(`fmath_custom_exam_${id}`);
        if (cachedCustom) {
          try {
            const parsed = JSON.parse(cachedCustom);
            fetchedExam = parsed.exam;
            extractedQuestions = parsed.questions || [];
          } catch (e) {}
        }

        // 2. Kiểm tra bộ đề bổ sung chuẩn hệ thống (SUPPLEMENTAL_SYSTEM_EXAMS)
        if (!fetchedExam) {
          const sysExam = SUPPLEMENTAL_SYSTEM_EXAMS.find(e => e.id === id);
          if (sysExam) {
            fetchedExam = {
              id: sysExam.id,
              title: sysExam.title,
              description: sysExam.description,
              time_limit: (sysExam.duration || 90) * 60,
              total_marks: 10
            };
            const { data: exData } = await supabase.from('exercises').select('*').limit(34);
            extractedQuestions = exData || [];
          }
        }

        // 3. Nếu chưa có, tải từ Supabase exams table
        if (!fetchedExam) {
          const { data, error: examError } = await supabase.from('exams').select('*').eq('id', id).single();
          if (examError || !data) throw new Error("Không thể tải dữ liệu đề thi.");
          fetchedExam = data;

          const { data: eqData, error: qError } = await supabase
            .from('exam_questions')
            .select('sort_order, exercises(*)')
            .eq('exam_id', id)
            .order('sort_order', { ascending: true });

          if (qError) throw new Error("Lỗi tải danh sách câu hỏi.");
          extractedQuestions = eqData?.map((item: any) => item.exercises).filter(Boolean) || [];
        }

        if (isMounted) {
          setExamData(fetchedExam);
          setQuestions(extractedQuestions);

          let restoredTime = fetchedExam.time_limit || 2400;
          if (currentUser?.id) {
            const draftStr = localStorage.getItem(`fmath_draft_${currentUser.id}_${fetchedExam.id}`);
            if (draftStr) {
              try {
                const draft = JSON.parse(draftStr);
                if (draft.answers) {
                  setAnswers(draft.answers);
                  Object.keys(draft.answers).forEach(k => setOfflineAnswer(k, draft.answers[k]));
                }
                if (draft.timeLeft !== undefined && draft.timeLeft > 0) restoredTime = draft.timeLeft;
              } catch(e) {}
            }
          }
          setTimeLeft(restoredTime);
          setTimeout(() => { if (isMounted) setIsPreparing(false); }, 500);
        }
      } catch (err: any) {
        if (isMounted) { setError(err.message || "Có lỗi xảy ra khi tải dữ liệu."); setIsPreparing(false); }
      }
    };
    prepareQuiz();
    return () => { isMounted = false; };
  }, [id, currentUser?.id]);

  // ==========================================
  // 2. ĐỒNG BỘ REALTIME VỚI GIÁM THỊ (LIVE MONITOR)
  // ==========================================
  useEffect(() => {
    if (!sessionId || !currentUser?.id || isPreparing || result) return;

    // 2.1. Đăng ký vào phòng thi trên DB
    const joinRoom = async () => {
      await supabase.from('room_members').upsert({
        session_id: sessionId,
        student_id: currentUser.id,
        status: 'ONLINE',
        last_ping: new Date().toISOString()
      }, { onConflict: 'session_id, student_id' });
    };
    joinRoom();

    // 2.2. Lắng nghe lệnh từ Giám thị
    const channel = supabase.channel(`monitor_room_${sessionId}`)
      .on('broadcast', { event: 'add_time' }, (payload: any) => {
        if (payload.payload.student_id === currentUser.id) {
          setTimeLeft(prev => prev + (payload.payload.minutes * 60));
          alert(`Giám thị vừa cộng thêm cho bạn ${payload.payload.minutes} phút!`);
        }
      })
      .on('broadcast', { event: 'force_lock' }, (payload: any) => {
        if (payload.payload.student_id === currentUser.id) {
          setIsLocked(true);
          alert("Giám thị đã ép thu bài của bạn!");
          handleSubmit(true); 
        }
      })
      .subscribe();

    // 2.3. BẮN NHỊP TIM (HEARTBEAT) SIÊU TỐC QUA WEBSOCKET
    let heartbeatTimer: NodeJS.Timeout;
    
    // Kiểm tra xem đây có phải kì thi lớn không
    const isHighStakes = examData?.type === 'Thi Thử' || examData?.type === 'Kiểm tra';

    const sendFastHeartbeat = () => {
      if (isOnline && !isLocked && !result) {
        // Chỉ gửi Broadcast (cực nhẹ và siêu tốc, không lưu DB)
        channel.send({ type: 'broadcast', event: 'heartbeat', payload: { student_id: currentUser.id } });
        
        // Tính toán độ trễ tiếp theo theo yêu cầu
        let nextDelay = 0;
        if (isHighStakes) {
          // Kỳ thi lớn: Max 2s, Min 0.5s (500ms -> 2000ms)
          nextDelay = Math.random() * (2000 - 500) + 500;
        } else {
          // Bình thường: Max 2s, Min 0.1s (100ms -> 2000ms)
          nextDelay = Math.random() * (2000 - 100) + 100;
        }
        
        heartbeatTimer = setTimeout(sendFastHeartbeat, nextDelay);
      }
    };

    // Bắt đầu vòng lặp bắn nhịp tim
    sendFastHeartbeat();

    // 2.4. ĐỒNG BỘ DB CHẬM (Lưu vết DB 15s/lần để chống sập Server)
    const dbBackupInterval = setInterval(async () => {
      if (isOnline && !isLocked && !result) {
        await supabase.from('room_members')
          .update({ last_ping: new Date().toISOString(), status: 'ONLINE' })
          .eq('session_id', sessionId).eq('student_id', currentUser.id);
      }
    }, 15000);

    return () => {
      supabase.removeChannel(channel);
      clearTimeout(heartbeatTimer);
      clearInterval(dbBackupInterval);
    };
  }, [sessionId, currentUser?.id, isPreparing, isOnline, isLocked, result, examData]);

  // ==========================================
  // 3. LƯU NHÁP & MẠNG (ONLINE/OFFLINE)
  // ==========================================
  useEffect(() => {
    if (examData?.id && currentUser?.id && !result && questions.length > 0 && timeLeft > 0) {
      localStorage.setItem(`fmath_draft_${currentUser.id}_${examData.id}`, JSON.stringify({ answers, timeLeft }));
    }
  }, [answers, timeLeft, examData?.id, currentUser?.id, result, questions.length]);

  useEffect(() => {
    const handleOnline = () => {
      setOnlineStatus(true);
      if (examData?.id && currentUser?.id) syncAnswersToDB(examData.id, currentUser.id);
    };
    const handleOffline = () => setOnlineStatus(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, [examData, currentUser]);

  // ==========================================
  // 4. ĐẾM NGƯỢC
  // ==========================================
  useEffect(() => {
    if (isPreparing || result || isSubmitting || isLocked || timeLeft <= 0 || questions.length === 0) {
      if (timeLeft <= 0 && !result && questions.length > 0 && !isPreparing && !isLocked) handleSubmit(true);
      return;
    }
    const timerId = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, isPreparing, result, isSubmitting, isLocked, questions.length]);

  // Luyện tập tự do & không áp dụng ràng buộc khảo thí
  const isHighStakes = false;
  const violationCount = 0;

  // ==========================================
  // 6. XỬ LÝ CHỌN ĐÁP ÁN
  // ==========================================
  const handleAnswerMCQ = (questionId: string, optionId: string) => { 
    if(result || isLocked) return;
    const val = String(optionId).toLowerCase().trim();
    setAnswers(prev => ({ ...prev, [questionId]: val })); 
    setOfflineAnswer(questionId, val);
  };
  const handleAnswerTF = (questionId: string, subId: string, value: boolean) => { 
    if(result || isLocked) return;
    const normSubId = String(subId).toLowerCase().trim();
    setAnswers(prev => {
      const newVal = { ...(prev[questionId] || {}), [normSubId]: value };
      setOfflineAnswer(questionId, newVal);
      return { ...prev, [questionId]: newVal };
    }); 
  };
  const handleAnswerSAQ = (questionId: string, value: string) => { 
    if(result || isLocked) return;
    setAnswers(prev => ({ ...prev, [questionId]: value })); 
    setOfflineAnswer(questionId, value);
  };

  const isQuestionAnswered = (q: any) => {
    const qType = getQuestionType(q);
    const ans = answers[q.id];
    if (ans == null) return false;
    if (qType === 'tf') return Object.keys(ans).length === (q.options?.length || 4);
    if (qType === 'saq') return String(ans).trim() !== "";
    return true;
  };

  // ==========================================
  // 7. NỘP BÀI VÀ CHẤM ĐIỂM
  // ==========================================
  const gradingType = examData?.tags?.find((t: string) => t.startsWith('grading_type:'))?.split(':')[1] || 'standard';

  const maxScore = gradingType === 'custom' ? 10 : questions.reduce((acc, q) => {
    const qType = getQuestionType(q);
    if (qType === 'tf') return acc + 1.0;
    if (qType === 'saq') return acc + 0.5;
    return acc + 0.25;
  }, 0);

  const handleSubmit = async (isAutoSubmit = false) => {
    if (!isAutoSubmit && !isLocked) {
      const unanswered = questions.filter(q => !isQuestionAnswered(q)).length;
      if (unanswered > 0) {
        if (!window.confirm(`Bạn còn ${unanswered} câu chưa làm. Xác nhận nộp bài sớm?`)) return;
      } else {
        if (!window.confirm("Xác nhận hoàn thành và nộp bài?")) return;
      }
    }

    setIsSubmitting(true);
    
    if (currentUser?.id && examData?.id) {
      localStorage.removeItem(`fmath_draft_${currentUser.id}_${examData.id}`);
      clearOfflineAnswers();
    }

    let totalScore = 0;
    let correctCountMCQ = 0;

    if (gradingType === 'custom') {
      let correctQuestionsCount = 0;
      questions.forEach(q => {
        const userAns = answers[q.id];
        if (userAns == null) return;
        const qType = getQuestionType(q);

        if (qType === 'tf') {
          let correctSubs = 0;
          const parsedCorrect = parseTFAnswer(q.correct_answer);
          q.options?.forEach((opt: any, idx: number) => { 
            const optId = String(opt.id || ['a', 'b', 'c', 'd'][idx] || idx).toLowerCase().trim();
            if (userAns[optId] === parsedCorrect[optId]) correctSubs++; 
          });
          if (correctSubs === 4) { correctQuestionsCount += 1.0; correctCountMCQ++; }
          else if (correctSubs === 3) correctQuestionsCount += 0.5;
          else if (correctSubs === 2) correctQuestionsCount += 0.25;
          else if (correctSubs === 1) correctQuestionsCount += 0.1;
        } 
        else if (qType === 'saq') {
          if (isSaqCorrect(userAns, q.correct_answer)) { correctQuestionsCount += 1; correctCountMCQ++; }
        } 
        else {
          if (isMcqCorrect(userAns, q.correct_answer)) { correctQuestionsCount += 1; correctCountMCQ++; }
        }
      });
      totalScore = (correctQuestionsCount / questions.length) * 10;
    } else {
      questions.forEach(q => {
        const userAns = answers[q.id];
        if (userAns == null) return;
        const qType = getQuestionType(q);

        if (qType === 'tf') {
          let correctCount = 0;
          const parsedCorrect = parseTFAnswer(q.correct_answer);
          q.options?.forEach((opt: any, idx: number) => { 
            const optId = String(opt.id || ['a', 'b', 'c', 'd'][idx] || idx).toLowerCase().trim();
            if (userAns[optId] === parsedCorrect[optId]) correctCount++; 
          });
          if (correctCount === 1) totalScore += 0.1;
          else if (correctCount === 2) totalScore += 0.25;
          else if (correctCount === 3) totalScore += 0.5;
          else if (correctCount === 4) { totalScore += 1.0; correctCountMCQ++; }
        } 
        else if (qType === 'saq') {
          if (isSaqCorrect(userAns, q.correct_answer)) { totalScore += 0.5; correctCountMCQ++; }
        } 
        else {
          if (isMcqCorrect(userAns, q.correct_answer)) { totalScore += 0.25; correctCountMCQ++; }
        }
      });
    }

    totalScore = Math.round(totalScore * 100) / 100;
    const timeSpent = (examData?.time_limit || 2400) - timeLeft;

    try {
      const prompt = `Học sinh lớp 12 vừa nộp bài thi môn Toán. Bộ đề: "${examData?.title}". Điểm số đạt được: ${totalScore}/${maxScore}. Hãy viết đúng 2 câu nhận xét sư phạm ngắn gọn, ấm áp, ghi nhận nỗ lực và động viên định hướng ôn tập cho học sinh. Tuyệt đối không dùng các từ kỹ thuật như Scaffolding, giàn giáo, đơn thuốc, nấc.`;
      const aiResponse = await askGroqAI("Bạn là Thầy giáo Toán 12 giàu kinh nghiệm, ân cần của FMATH12.", prompt);
      setAiReview(aiResponse);
    } catch (e) {
      setAiReview("Hệ thống AI đang bận. Kết quả của bạn đã được ghi nhận thành công!");
    }

    if (currentUser?.id && id) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isDbExam = examData?.id && uuidRegex.test(examData.id);

      if (isDbExam) {
        const { data: attempt } = await supabase
          .from('exam_attempts')
          .insert({ 
            exam_id: examData.id, 
            user_id: currentUser.id, 
            score: totalScore, 
            time_spent: timeSpent > 0 ? timeSpent : 0 
          })
          .select()
          .single();
        
        if (attempt) {
          await supabase.from('exam_logs').insert({
            session_id: sessionId || null,
            student_id: currentUser.id,
            action: 'SUBMIT_ANSWERS',
            description: JSON.stringify({
              exam_id: examData.id,
              attempt_id: attempt.id,
              answers: answers
            })
          });
        }
      } else {
        try {
          const historyKey = `fmath_attempts_${currentUser.id}`;
          const localHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
          localHistory.unshift({
            exam_id: examData?.id || id,
            exam_title: examData?.title || 'Đề luyện tập Ma trận 2026',
            score: totalScore,
            time_spent: timeSpent > 0 ? timeSpent : 0,
            created_at: new Date().toISOString()
          });
          localStorage.setItem(historyKey, JSON.stringify(localHistory.slice(0, 50)));
        } catch(e) {}
      }
      
      // Báo nộp bài cho Giám thị
      if (sessionId) {
        await supabase.from('room_members').update({ status: 'SUBMITTED', score: totalScore }).eq('session_id', sessionId).eq('student_id', currentUser.id);
        await supabase.from('exam_logs').insert({ session_id: sessionId, student_id: currentUser.id, action: 'SUBMIT', description: `Đã nộp bài, đạt ${totalScore} điểm.` });
      }

      const earnedXP = Math.round(totalScore * 10); 
      if (earnedXP > 0 || currentUser.id) {
        const newXP = (currentUser.xp || 0) + (earnedXP > 0 ? earnedXP : 0);
        const newLevel = Math.floor(newXP / 100) + 1;
        const streakResult = calculateStreakUpdate(currentUser.streak, currentUser.last_active_date);
        
        const { data: updatedUser } = await supabase.from('users').update({ 
          xp: newXP, 
          level: newLevel, 
          streak: streakResult.streak,
          last_active_date: streakResult.lastActiveDate
        }).eq('id', currentUser.id).select('*').single();

        if (updatedUser) setUser(updatedUser);
      }
    }

    setResult({ score: totalScore, correctCount: correctCountMCQ, total: questions.length, timeSpent });
    setIsSubmitting(false);
    setIsLocked(false); 
    setShowRewardModal(true);
    setCurrentIdx(0); 
    clearCache(); 
  };

  const handleAskQuestionAI = async (q: any, customPrompt?: string) => {
    const input = customPrompt || chatInputs[q.id];
    if (!input?.trim() || isAiReplying[q.id]) return;
    const newHistory = [...(chatHistory[q.id] || []), { role: 'user', content: input }];
    setChatHistory(prev => ({ ...prev, [q.id]: newHistory }));
    if (!customPrompt) {
      setChatInputs(prev => ({ ...prev, [q.id]: "" }));
    }
    setIsAiReplying(prev => ({ ...prev, [q.id]: true }));
    try {
      const studentCurrentAns = answers[q.id] ? JSON.stringify(answers[q.id]) : 'Chưa chọn';
      const sysPrompt = `================================================================================
BẠN LÀ FMATH12AI - CHUYÊN GIA SƯ PHẠM TOÁN 12 THEO PHƯƠNG PHÁP SOCRATIC
================================================================================
[THÔNG TIN BÀI TOÁN]
- Đề bài câu hỏi: "${q.content}"
- Đáp án đúng của hệ thống: "${q.correct_answer}"
- Lời giải tham khảo: "${q.explanation || ''}"
- Lựa chọn hiện tại của học sinh: ${studentCurrentAns}

[QUY TẮC SƯ PHẠM DẪN DẮT TỪNG BƯỚC - TUYỆT ĐỐI KHÔNG GIẢI HỘ]
1. TUYỆT ĐỐI KHÔNG giải hộ hay đưa ra kết quả cuối cùng (ví dụ: A, B, C, D hoặc con số cụ thể) cho học sinh một cách thụ động. 
2. NẾU HỌC SINH HỎI GỢI Ý BƯỚC ĐẦU:
   - Chỉ chỉ ra hướng tiếp cận, bản chất hình học/đại số.
   - Nêu câu hỏi gợi mở để học sinh tự đặt bút làm bước 1.
3. NẾU HỌC SINH HỎI PHÂN TÍCH LỖI SAI:
   - Chỉ ra các bẫy đề kinh điển (quên điều kiện xác định, nhầm dấu đạo hàm, nhầm vectơ pháp tuyến với chỉ phương, chia cho 0,...).
   - Hỏi học sinh xem mình có bỏ sót điều kiện nào không.
4. Trình bày các bước tư duy siêu cấu trúc. Phân tách rõ ràng từng bước bằng tiêu đề in đậm \`### BƯỚC 1: [TÊN BƯỚC]\`...
5. Mọi công thức Toán học bắt buộc bọc trong $...$ hoặc $$...$$.
6. Xưng hô Thầy - Em thân thiện, tôn trọng và khích lệ tư duy độc lập.
================================================================================`;

      const aiReply = await askGroqAI(sysPrompt, input, false, newHistory);
      setChatHistory(prev => ({ ...prev, [q.id]: [...(prev[q.id] || []), { role: 'ai', content: aiReply }] }));
    } catch (error) {
      setChatHistory(prev => ({ ...prev, [q.id]: [...(prev[q.id] || []), { role: 'ai', content: "Xin lỗi em, đường truyền mạng đang chậm. Hỏi lại sau nhé!" }] }));
    } finally {
      setIsAiReplying(prev => ({ ...prev, [q.id]: false }));
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2,'0');
    const s = (sec % 60).toString().padStart(2,'0');
    return `${m}:${s}`;
  };

  const MarkdownComponents = {
    img: ({ node, ...props }: any) => <img {...props} className="max-w-full h-auto rounded-xl border border-slate-200 dark:border-slate-700 my-4 mx-auto block shadow-sm" alt={props.alt || "Ảnh"} loading="lazy" />,
    table: ({ node, ...props }: any) => <div className="w-full overflow-x-auto my-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs bg-white dark:bg-slate-800"><table className="w-full text-center border-collapse text-[14px]" {...props} /></div>,
    thead: ({ node, ...props }: any) => <thead className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200" {...props} />,
    tbody: ({ node, ...props }: any) => <tbody className="divide-y divide-slate-200 dark:divide-slate-700" {...props} />,
    tr: ({ node, ...props }: any) => <tr className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/50" {...props} />,
    th: ({ node, ...props }: any) => <th className="p-3 border-r border-slate-200 dark:border-slate-700 last:border-r-0 font-bold whitespace-nowrap align-middle" {...props} />,
    td: ({ node, ...props }: any) => <td className="p-3 border-r border-slate-200 dark:border-slate-700 last:border-r-0 align-middle first:font-bold first:bg-slate-50 dark:first:bg-slate-850 first:border-r-2" {...props} />,
  };

  const partMCQ = questions.map((q, i) => ({ q, i })).filter(item => getQuestionType(item.q) === 'mcq');
  const partTF = questions.map((q, i) => ({ q, i })).filter(item => getQuestionType(item.q) === 'tf');
  const partSAQ = questions.map((q, i) => ({ q, i })).filter(item => getQuestionType(item.q) === 'saq');

  const renderNavButton = (fq: any, globalIndex: number) => {
    const done = isQuestionAnswered(fq);
    const active = currentIdx === globalIndex;
    let btnClass = "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer";
    
    if (result) {
      let isFullyCorrect = false;
      const fqType = getQuestionType(fq);
      const userAns = answers[fq.id];
      if (fqType === 'tf') {
        let cCount = 0;
        const parsedCorrect = parseTFAnswer(fq.correct_answer);
        fq.options?.forEach((o:any, idx: number) => { 
          const optId = String(o.id || ['a', 'b', 'c', 'd'][idx] || idx).toLowerCase().trim();
          if(userAns?.[optId] === parsedCorrect[optId]) cCount++; 
        });
        isFullyCorrect = cCount === (fq.options?.length || 4); 
      } else if (fqType === 'saq') {
        isFullyCorrect = isSaqCorrect(userAns, fq.correct_answer);
      } else {
        isFullyCorrect = isMcqCorrect(userAns, fq.correct_answer);
      }
      if (isFullyCorrect) btnClass = "bg-emerald-600 text-white border-emerald-600 cursor-pointer";
      else if (done) btnClass = "bg-rose-600 text-white border-rose-600 cursor-pointer";
      else btnClass = "bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800 opacity-60 cursor-pointer";
      if (active) btnClass += " ring-2 ring-indigo-500 ring-offset-2";
    } else if (active) {
      btnClass = "bg-indigo-600 text-white border-indigo-600 shadow-2xs cursor-pointer";
    } else if (done) {
      btnClass = "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200/80 dark:border-indigo-800 font-bold cursor-pointer";
    }

    return (
      <button 
        key={fq.id} 
        onClick={() => setCurrentIdx(globalIndex)} 
        className={`relative w-full h-10 flex items-center justify-center rounded-xl border font-bold text-[13px] font-ui transition-all outline-none ${btnClass}`}
      >
        {globalIndex + 1}
      </button>
    );
  };

  // ==========================================
  // RENDER UI 
  // ==========================================
  if (isPreparing) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-500">
      <Loader2 size={40} className="animate-spin mb-4 text-indigo-600" />
      <p className="font-medium text-[15px]">Đang thiết lập phòng thi bảo mật...</p>
    </div>
  );
  
  if (error || !examData || questions.length === 0) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-500 p-8">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center max-w-md w-full shadow-sm">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 font-heading">Lỗi tải đề thi</h3>
        <p className="text-[14px] mb-6">{error || "Đề thi trống hoặc bạn chưa đăng nhập."}</p>
        <button onClick={() => navigate('/dashboard')} className="btn-secondary w-full cursor-pointer">Về trang chủ</button>
      </div>
    </div>
  );

  const q = questions[currentIdx];
  const qType = getQuestionType(q);
  let typeLabel = qType === 'tf' ? "Đúng/Sai" : qType === 'saq' ? "Trả lời ngắn" : "Trắc nghiệm";

  return (
    <div className="fixed inset-0 z-[100] flex flex-col lg:flex-row gap-0 lg:gap-6 w-full p-0 lg:p-6 bg-slate-100/80 dark:bg-slate-950 overflow-hidden animate-in fade-in">
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 lg:rounded-2xl shadow-2xs h-full overflow-hidden relative">
        {!isOnline && !result && (
          <div className="absolute top-0 left-0 right-0 bg-rose-600 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm font-bold z-10 animate-in slide-in-from-top-4">
            <WifiOff size={16} /> MẤT KẾT NỐI MẠNG! (Đáp án vẫn được lưu tạm, vui lòng không tắt tab)
          </div>
        )}

        <div className={`flex items-center justify-between px-5 md:px-8 py-4 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 shrink-0 ${!isOnline && !result ? 'pt-12' : ''}`}>
          <div className="min-w-0 pr-4">
            <div className="text-indigo-600 dark:text-indigo-400 font-bold text-[11px] uppercase tracking-wider mb-1 font-ui">
              {examData.type || 'Luyện tập'} {isHighStakes && " • (Kỳ thi được giám sát)"}
            </div>
            <h2 className="text-[16px] font-bold text-slate-900 dark:text-white truncate font-heading m-0">{examData.title}</h2>
          </div>
          <div className="flex gap-2 shrink-0">
            <button disabled={currentIdx === 0} onClick={() => setCurrentIdx(i => i-1)} className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-40 transition-colors shadow-2xs cursor-pointer"><ArrowLeft size={18}/></button>
            <button disabled={currentIdx === questions.length-1} onClick={() => setCurrentIdx(i => i+1)} className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-40 transition-colors shadow-2xs cursor-pointer"><ArrowRight size={18}/></button>
          </div>
        </div>

        <div ref={questionBodyRef} className="flex-1 overflow-y-auto custom-scrollbar p-5 md:p-8 bg-white dark:bg-slate-900">
          <div className="max-w-4xl mx-auto">
            {result && currentIdx === 0 && (
              <div className="mb-8 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-2xs animate-in slide-in-from-top-4">
                <div className="bg-indigo-50/70 dark:bg-indigo-950/40 p-5 border-b border-indigo-100 dark:border-indigo-800 flex items-start gap-4">
                  <div className="shrink-0 w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-2xs text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50"><BrainCircuit size={24} /></div>
                  <div>
                    <h3 className="text-[15px] font-bold text-blue-700 dark:text-blue-300 mb-1 font-heading">FMATH12 AI Đánh giá Cá Nhân Hóa</h3>
                    <div className="prose prose-sm max-w-none text-slate-800 dark:text-slate-200 font-medium leading-relaxed m-0"><ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]} components={MarkdownComponents}>{aiReview || "Đang phân tích bài làm..."}</ReactMarkdown></div>
                  </div>
                </div>
                <div className="grid grid-cols-3 divide-x divide-slate-200 dark:divide-slate-700 bg-slate-50 dark:bg-slate-800/40 text-center">
                  <div className="p-4"><div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-heading">Điểm số</div><div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-ui">{result.score}/{maxScore}</div></div>
                  <div className="p-4"><div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-heading">Thời gian</div><div className="text-2xl font-black text-slate-900 dark:text-white font-ui">{Math.floor(result.timeSpent / 60)}p {result.timeSpent % 60}s</div></div>
                  <div className="p-4"><div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-heading">Câu đúng</div><div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-ui">{result.correctCount}/{result.total}</div></div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <span className="bg-indigo-600 text-white text-[13px] font-bold px-3 py-1.5 rounded-lg font-ui shadow-2xs">Câu {currentIdx + 1}</span>
              <span className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[12px] font-bold px-3 py-1.5 rounded-lg font-ui uppercase">{q.level || 'Nhận biết'}</span>
              <span className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 text-amber-700 dark:text-amber-400 text-[12px] font-bold px-3 py-1.5 rounded-lg font-ui ml-auto">{typeLabel}</span>
            </div>

            <div className="prose prose-base max-w-none text-slate-900 dark:text-slate-100 mb-8 font-medium leading-[2.2] overflow-x-auto [&_.katex-display]:my-4 [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_.katex-display]:py-2">
              <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]} components={MarkdownComponents}>{q.content || ''}</ReactMarkdown>
            </div>

            <div className="mb-8">
              {qType === 'mcq' && q.options && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {q.options.map((opt:any, idx: number) => {
                    const optId = String(opt.id || ['a', 'b', 'c', 'd'][idx] || idx).toLowerCase().trim();
                    const displayId = String(opt.id || ['A', 'B', 'C', 'D'][idx] || idx).toUpperCase().trim();
                    const isSelected = String(answers[q.id] || '').toLowerCase().trim() === optId;
                    const isCorrect = isMcqCorrect(optId, q.correct_answer);
                    
                    let boxClass = "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-500 cursor-pointer shadow-2xs";
                    let letterClass = "bg-slate-100 dark:bg-slate-850 border-r border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300";
                    let textClass = "text-slate-750 dark:text-slate-200";

                    if (result) {
                      if (isCorrect) { boxClass = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 ring-1 ring-emerald-500"; letterClass = "bg-emerald-600 text-white border-r-0"; textClass = "text-emerald-900 dark:text-emerald-200 font-semibold"; } 
                      else if (isSelected && !isCorrect) { boxClass = "border-rose-500 bg-rose-50 dark:bg-rose-950/50 ring-1 ring-rose-500"; letterClass = "bg-rose-600 text-white border-r-0"; textClass = "text-rose-900 dark:text-rose-200 font-semibold"; } 
                      else { boxClass = "opacity-50 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 cursor-default shadow-none"; }
                    } else if (isSelected) {
                      boxClass = "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 ring-1 ring-indigo-500 shadow-2xs"; letterClass = "bg-indigo-600 text-white border-r-0"; textClass = "text-indigo-900 dark:text-indigo-200 font-semibold";
                    }

                    const rawOptText = typeof opt === 'string' ? opt : (opt.text ?? opt.content ?? opt.label ?? '');
                    const optText = (rawOptText.trim() === '.' || !rawOptText.trim()) ? `Phương án ${displayId}` : rawOptText;

                    return (
                      <div key={optId} onClick={() => handleAnswerMCQ(q.id, optId)} className={`w-full flex items-stretch rounded-xl border overflow-hidden transition-all ${boxClass}`}>
                        <div className={`w-12 shrink-0 flex items-center justify-center font-bold text-[15px] font-ui transition-colors ${letterClass}`}>{displayId}</div>
                        <div className={`flex-1 p-3.5 prose prose-sm max-w-none overflow-x-auto leading-relaxed m-0 flex items-center ${textClass}`}><ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]} components={MarkdownComponents}>{optText}</ReactMarkdown></div>
                      </div>
                    );
                  })}
                </div>
              )}

              {qType === 'tf' && q.options && (
                <div className="flex flex-col gap-4">
                  {q.options.map((opt:any, idx: number) => {
                    const rawOptId = opt.id || ['a', 'b', 'c', 'd'][idx] || String(idx);
                    const optId = String(rawOptId).toLowerCase().trim();
                    const userVal = answers[q.id]?.[optId];
                    const isCorrectVal = parseTFAnswer(q.correct_answer)[optId];
                    const isUserCorrect = userVal === isCorrectVal;
                    
                    const rawOptText = typeof opt === 'string' ? opt : (opt.text ?? opt.content ?? opt.label ?? '');
                    const optText = (rawOptText.trim() === '.' || !rawOptText.trim()) ? `Mệnh đề ${rawOptId}` : rawOptText;
                    
                    return (
                      <div key={optId} className={`rounded-xl border shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 transition-colors ${result ? (isUserCorrect ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/50' : 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/50') : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 hover:border-indigo-500'}`}>
                        <div className="flex items-start gap-4 flex-1 overflow-x-auto">
                          <div className="w-8 h-8 shrink-0 rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center font-bold text-[14px] font-ui text-slate-600 dark:text-slate-300">{rawOptId}</div>
                          <div className="prose prose-sm max-w-none m-0 pt-1 leading-[1.8] text-slate-800 dark:text-slate-200"><ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]} components={MarkdownComponents}>{optText}</ReactMarkdown></div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 self-end md:self-center bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                          <button disabled={result} onClick={() => handleAnswerTF(q.id, optId, true)} className={`px-5 py-2 rounded-lg font-semibold text-[13px] transition-colors cursor-pointer ${userVal === true ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>Đúng</button>
                          <button disabled={result} onClick={() => handleAnswerTF(q.id, optId, false)} className={`px-5 py-2 rounded-lg font-semibold text-[13px] transition-colors cursor-pointer ${userVal === false ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>Sai</button>
                        </div>
                        {result && <div className="shrink-0 flex items-center">{isUserCorrect ? <CheckCircle2 className="text-emerald-600" size={24}/> : <XCircle className="text-rose-600" size={24}/>}{!isUserCorrect && <div className="text-[12px] font-bold text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900/60 px-2 py-1 rounded-md ml-2 shadow-2xs">Đ.án: {isCorrectVal ? 'Đúng' : 'Sai'}</div>}</div>}
                      </div>
                    );
                  })}
                </div>
              )}

              {qType === 'saq' && (
                <div className="bg-slate-50 dark:bg-slate-850 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                  <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-3 block font-heading">Nhập đáp án của bạn:</label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <input 
                      type="text" value={answers[q.id] || ""} onChange={(e) => handleAnswerSAQ(q.id, e.target.value)} disabled={result} 
                      className={`w-full max-w-sm px-5 py-3.5 rounded-xl border font-bold text-[18px] outline-none transition-colors shadow-inner ${result ? (isSaqCorrect(answers[q.id], q.correct_answer) ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-500' : 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border-rose-500') : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-indigo-500 text-slate-900 dark:text-white'}`} 
                      placeholder="Nhập số thập phân dùng dấu chấm (.)"
                    />
                    {result && !isSaqCorrect(answers[q.id], q.correct_answer) && (
                      <div className="px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col justify-center shadow-2xs shrink-0 min-w-[120px]">
                        <span className="text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wider font-heading">Đáp án đúng:</span><span className="font-black text-[18px] text-emerald-600 dark:text-emerald-400 leading-none">{q.correct_answer}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Trợ lý AI Socratic & Lời giải */}
            <div className="mt-8 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-2xs animate-in slide-in-from-bottom-3">
              <div className="flex flex-wrap justify-between items-center gap-3 px-5 py-3.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-sm uppercase font-heading tracking-wider">
                  <BrainCircuit size={17} className="text-blue-600 dark:text-blue-400" />
                  <span>FMATH12AI</span>
                  <span className="text-[11px] font-medium text-slate-400 lowercase font-sans">(không giải hộ • gợi ý từng bước)</span>
                </div>
                <button 
                  onClick={() => setOpenChatId(openChatId === q.id ? null : q.id)} 
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors border shadow-2xs cursor-pointer ${
                    openChatId === q.id 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950/50'
                  }`}
                >
                  <MessageSquare size={13} /> {openChatId === q.id ? 'Thu gọn AI' : 'Hỏi FMATH12AI'}
                </button>
              </div>

              {/* Lời giải chi tiết khi đã nộp bài */}
              {result && (
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 font-heading flex items-center gap-1.5">
                    <BookOpen size={14} className="text-indigo-600" /> Lời giải chi tiết
                  </div>
                  <div className="prose prose-sm max-w-none text-slate-750 dark:text-slate-300 leading-relaxed overflow-x-auto [&_.katex-display]:my-3">
                    {q.explanation ? (
                      <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]} components={MarkdownComponents}>
                        {formatMathAndSteps(q.explanation)}
                      </ReactMarkdown>
                    ) : (
                      <div className="text-slate-400 italic text-xs py-2">Câu hỏi này chưa có lời giải mẫu. Bấm "Hỏi Trợ lý AI" bên trên để nhận phân tích phương pháp nhé!</div>
                    )}
                  </div>
                </div>
              )}

              {/* Khung chat Socratic AI Tutor */}
              {openChatId === q.id && (
                <div className="bg-slate-50/70 dark:bg-slate-800/40 p-4 sm:p-5 border-t border-slate-200/80 dark:border-slate-700/80 space-y-3">
                  
                  {/* 3 Quick Chips Socratic */}
                  <div className="flex flex-wrap items-center gap-2 pb-1">
                    <button
                      type="button"
                      onClick={() => handleAskQuestionAI(q, "Thầy hãy gợi ý bước đầu và phương hướng tiếp cận bài này giúp em, xin đừng giải hộ hay nói đáp án nhé!")}
                      disabled={isAiReplying[q.id]}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-semibold hover:bg-blue-100 transition-colors cursor-pointer"
                    >
                      💡 Gợi ý bước đầu (Bản chất)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAskQuestionAI(q, "Thầy hãy phân tích các lỗi sai và bẫy tư duy mà học sinh dễ mắc phải ở câu này để em tự kiểm tra lại!")}
                      disabled={isAiReplying[q.id]}
                      className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] font-semibold hover:bg-amber-100 transition-colors cursor-pointer"
                    >
                      🔍 Phân tích lỗi sai & bẫy đề
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAskQuestionAI(q, "Thầy nhắc lại công thức và định lý cốt lõi cần dùng cho dạng bài này với ạ!")}
                      disabled={isAiReplying[q.id]}
                      className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[11px] font-semibold hover:bg-purple-100 transition-colors cursor-pointer"
                    >
                      📐 Công thức & Định lý cốt lõi
                    </button>
                  </div>

                  {/* Lịch sử hội thoại */}
                  <div className="space-y-3 max-h-[320px] overflow-y-auto custom-scrollbar pr-1">
                    {(!chatHistory[q.id] || chatHistory[q.id].length === 0) ? (
                      <div className="text-center py-6">
                        <BrainCircuit size={32} className="mx-auto text-blue-400 mb-2 opacity-70" />
                        <div className="text-slate-500 text-xs font-medium">
                          Em chưa rõ bước nào? Chọn một gợi ý nhanh bên trên hoặc nhắn tin để Thầy hướng dẫn từng bước nhé!
                        </div>
                      </div>
                    ) : (
                      chatHistory[q.id].map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          {msg.role === 'ai' && (
                            <div className="shrink-0 w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center mr-2 shadow-2xs mt-0.5">
                              <BrainCircuit size={14} />
                            </div>
                          )}
                          <div className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-2xs ${
                            msg.role === 'user' 
                              ? 'bg-blue-600 text-white font-medium rounded-tr-sm' 
                              : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-tl-sm'
                          }`}>
                            {msg.role === 'user' ? msg.content : (
                              <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 [&_.katex-display]:my-2">
                                <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]} components={MarkdownComponents}>
                                  {formatMathAndSteps(msg.content)}
                                </ReactMarkdown>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                    {isAiReplying[q.id] && (
                      <div className="flex justify-start items-center gap-2 mt-2">
                        <div className="shrink-0 w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-2xs">
                          <BrainCircuit size={14} />
                        </div>
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-2xl text-slate-400 flex items-center gap-2 shadow-2xs text-xs">
                          <Loader2 size={14} className="animate-spin text-blue-600" />
                          <span>Thầy đang phân tích và dẫn dắt từng bước...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input gửi tin nhắn */}
                  <div className="flex items-end gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1 shadow-2xs focus-within:border-blue-500 transition-colors">
                    <textarea 
                      rows={1} 
                      value={chatInputs[q.id] || ""} 
                      onChange={(e) => setChatInputs(prev => ({...prev, [q.id]: e.target.value}))} 
                      onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAskQuestionAI(q); } }} 
                      placeholder="Em muốn Thầy gợi ý bước nào tiếp theo?..." 
                      className="flex-1 bg-transparent px-3 py-2 outline-none text-xs sm:text-sm text-slate-900 dark:text-white resize-none max-h-24 custom-scrollbar" 
                      disabled={isAiReplying[q.id]} 
                    />
                    <button 
                      onClick={() => handleAskQuestionAI(q)} 
                      disabled={isAiReplying[q.id] || !chatInputs[q.id]?.trim()} 
                      className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-lg transition-colors disabled:opacity-50 shrink-0 cursor-pointer"
                    >
                      <Send size={15} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-[340px] flex flex-col gap-0 lg:gap-6 shrink-0 h-auto lg:h-full bg-white dark:bg-slate-900 lg:bg-transparent border-t lg:border-t-0 border-slate-200 dark:border-slate-800">
        <div className={`lg:bg-white dark:lg:bg-slate-900 lg:border p-4 lg:p-6 lg:rounded-2xl flex flex-row lg:flex-col items-center justify-between lg:justify-center shadow-none lg:shadow-2xs shrink-0 border-b lg:border-b-0 ${result ? 'border-indigo-200/80 dark:border-indigo-800/80 lg:bg-indigo-50/60 dark:lg:bg-indigo-950/40' : 'border-slate-200 dark:border-slate-800'}`}>
          {result ? (
            <>
              <div className="text-[12px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider mb-0 lg:mb-2 font-ui">Điểm của bạn</div>
              <div className="text-[36px] lg:text-[48px] font-black text-indigo-600 dark:text-indigo-400 font-ui leading-none">{result.score} <span className="text-[16px] lg:text-[20px] text-indigo-400 dark:text-indigo-500">/{maxScore}</span></div>
            </>
          ) : (
            <>
              <div className="text-[12px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 font-ui mb-0 lg:mb-2"><Clock size={16}/> Thời gian còn lại</div>
              <div className={`text-[36px] lg:text-[48px] font-black font-ui tabular-nums leading-none tracking-tight ${timeLeft < 60 ? 'text-rose-600 animate-pulse' : 'text-slate-900 dark:text-white'}`}>{formatTime(timeLeft)}</div>
            </>
          )}
        </div>

        <div className="lg:bg-white dark:lg:bg-slate-900 lg:border lg:border-slate-200/80 dark:border-slate-800 p-4 lg:p-6 lg:rounded-2xl lg:shadow-2xs flex-1 flex flex-col min-h-[30vh] lg:min-h-0 overflow-hidden">
          <div className="font-bold text-slate-900 dark:text-white uppercase text-[14px] mb-4 lg:mb-5 tracking-wider flex items-center gap-2 font-heading"><LayoutGrid size={18}/> Bảng điều khiển</div>
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4 space-y-6">
            {partMCQ.length > 0 && <div><div className="text-[12px] font-bold text-slate-500 mb-3 uppercase tracking-wide font-heading">Phần I: Trắc nghiệm</div><div className="grid grid-cols-5 gap-2 md:gap-2.5">{partMCQ.map(item => renderNavButton(item.q, item.i))}</div></div>}
            {partTF.length > 0 && <div><div className="text-[12px] font-bold text-slate-500 mb-3 uppercase tracking-wide font-heading">Phần II: Đúng/Sai</div><div className="grid grid-cols-5 gap-2 md:gap-2.5">{partTF.map(item => renderNavButton(item.q, item.i))}</div></div>}
            {partSAQ.length > 0 && <div><div className="text-[12px] font-bold text-slate-500 mb-3 uppercase tracking-wide font-heading">Phần III: Trả lời ngắn</div><div className="grid grid-cols-5 gap-2 md:gap-2.5">{partSAQ.map(item => renderNavButton(item.q, item.i))}</div></div>}
          </div>

          <div className="pt-4 lg:pt-5 border-t border-slate-100 dark:border-slate-800 mt-2 shrink-0">
            {!result ? (
              <button disabled={isSubmitting} onClick={() => handleSubmit(false)} className="btn-primary w-full py-3.5 text-[15px] cursor-pointer">
                {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <CheckSquare size={20}/>} NỘP BÀI THI
              </button>
            ) : (
              <div className="flex flex-col gap-3">
                <button onClick={() => navigate('/dashboard')} className="w-full py-3 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white rounded-xl font-bold text-[14px] shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"><ChevronLeft size={18}/> Về trang chủ</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showRewardModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in px-4">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl max-w-sm w-full text-center shadow-2xl border border-slate-200 dark:border-slate-800">
            <Trophy size={64} className="mx-auto text-amber-500 mb-4" />
            <h2 className="text-2xl font-bold font-heading text-slate-900 dark:text-white mb-2">Nộp bài thành công!</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6 font-medium text-[15px]">Kết quả của bạn là <strong className="text-indigo-600 dark:text-indigo-400 text-[18px]">{result?.score}/{maxScore}</strong>.</p>
            {result?.score > 0 ? (
              <div className="flex justify-center gap-4 mb-8">
                <div className="flex-1 bg-amber-50 dark:bg-amber-950/40 p-4 rounded-xl border border-amber-200/60 dark:border-amber-800/60"><Flame size={28} className="mx-auto text-amber-500 mb-2" /><div className="text-[20px] font-black text-amber-700 dark:text-amber-400 font-ui leading-tight">+{Math.round(result.score * 10)}</div><div className="text-[11px] font-bold text-amber-600 dark:text-amber-500 uppercase mt-1">XP</div></div>
                <div className="flex-1 bg-indigo-50/70 dark:bg-indigo-950/40 p-4 rounded-xl border border-indigo-200/60 dark:border-indigo-800/60"><Calendar size={28} className="mx-auto text-indigo-600 dark:text-indigo-400 mb-2" /><div className="text-[20px] font-black text-indigo-700 dark:text-indigo-300 font-ui leading-tight">+1</div><div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase mt-1">Chuỗi</div></div>
              </div>
            ) : (
              <div className="mb-8 p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/60 rounded-xl text-rose-700 dark:text-rose-300 text-[14px] font-medium">Hãy xem lại giải thích chi tiết nhé!</div>
            )}
            <button onClick={() => setShowRewardModal(false)} className="btn-primary w-full py-3 text-[15px] cursor-pointer">XEM ĐÁP ÁN CHI TIẾT</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizTaking;