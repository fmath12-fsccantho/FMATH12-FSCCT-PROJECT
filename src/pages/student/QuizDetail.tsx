import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Loader2, ArrowLeft, Clock, ListChecks, Target, 
  PlayCircle, History, AlertCircle, FileText, Trophy, Medal, User,
  CheckCircle2, Sparkles, Award
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { examService } from '../../services/examService';

const QuizDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAppStore();
  
  const [exam, setExam] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!id || !currentUser?.id) {
        if (isMounted) {
          setError("Không tìm thấy mã đề thi hoặc bạn chưa đăng nhập.");
          setIsLoading(false);
        }
        return;
      }
      
      try {
        if (isMounted) {
          setIsLoading(true);
          setError(null);
        }
        
        const [examData, historyData, leaderboardData] = await Promise.all([
          examService.getExamById(id),
          examService.getExamHistory(id, currentUser.id),
          examService.getExamLeaderboard(id)
        ]);

        if (!examData) {
          throw new Error("Đề thi này không tồn tại hoặc đã bị ẩn.");
        }
        
        if (isMounted) {
          setExam(examData);
          setHistory(historyData || []);
          setLeaderboard(leaderboardData || []);
        }

      } catch (err: any) {
        console.error("Lỗi khi tải chi tiết đề thi:", err);
        if (isMounted) setError(err.message || "Đã xảy ra lỗi khi tải dữ liệu.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [id, currentUser?.id]);

  const handleStartQuiz = () => {
    if (!exam) return;
    navigate(`/quiz/${exam.id}/take`);
  };

  const formatTime = (seconds: number) => {
    if (!seconds) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const tags = exam ? (Array.isArray(exam.tags) ? exam.tags : (typeof exam.tags === 'string' ? JSON.parse(exam.tags) : [])) : [];

  if (isLoading) {
    return (
      <div className="page-container items-center justify-center">
        <Loader2 size={36} className="animate-spin text-indigo-600 mb-3" />
        <p className="font-medium text-sm text-slate-500 font-sans">Đang chuẩn bị phòng luyện tập...</p>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="page-container items-center justify-center p-4">
        <div className="flat-card text-center p-8 max-w-md w-full space-y-3">
          <AlertCircle size={40} className="mx-auto text-rose-500" />
          <h2 className="text-lg font-bold font-heading text-slate-900 dark:text-white m-0">Không tìm thấy đề thi</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-sans m-0">{error || 'Đề thi không tồn tại.'}</p>
          <button 
            onClick={() => navigate('/quiz')} 
            className="btn-primary py-2.5 px-6 rounded-xl font-bold font-heading text-xs"
          >
            Quay lại danh sách đề
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container animate-in fade-in duration-300">
      <div className="page-content custom-scrollbar">
        <div className="max-w-5xl mx-auto w-full space-y-6">
          
          {/* Back button */}
          <button 
            onClick={() => navigate('/quiz')} 
            className="inline-flex items-center gap-1.5 text-xs font-bold font-heading text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
          >
            <ArrowLeft size={15} /> Quay lại danh sách đề
          </button>

          {/* Exam Header Hero Card */}
          <div className="flat-card p-6 sm:p-8 space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge-primary">
                {exam.type || 'Đề kiểm tra'}
              </span>
              {tags.map((tag: string, i: number) => (
                <span key={i} className="badge-info">
                  {tag}
                </span>
              ))}
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-black font-heading text-slate-900 dark:text-white tracking-tight leading-snug m-0">
                {exam.title}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 font-sans leading-relaxed m-0 max-w-3xl">
                {exam.description || 'Đề thi được biên soạn chuẩn cấu trúc ma trận Bộ GD&ĐT mới nhất. Hãy chuẩn bị giấy nháp và máy tính Casio trước khi bắt đầu.'}
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
                  <ListChecks size={15} className="text-indigo-500" /> Tổng số câu
                </div>
                <div className="text-lg font-black font-raleway text-slate-900 dark:text-white">
                  {exam.questionsCount || 40} <span className="text-xs font-sans font-medium text-slate-400">câu</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
                  <Clock size={15} className="text-cyan-500" /> Thời gian
                </div>
                <div className="text-lg font-black font-raleway text-slate-900 dark:text-white">
                  {Math.floor((exam.time_limit || 2400) / 60)} <span className="text-xs font-sans font-medium text-slate-400">phút</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
                  <History size={15} className="text-purple-500" /> Lượt bạn làm
                </div>
                <div className="text-lg font-black font-raleway text-slate-900 dark:text-white">
                  {history.length} <span className="text-xs font-sans font-medium text-slate-400">lần</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
                  <Award size={15} className="text-amber-500" /> Điểm cao nhất
                </div>
                <div className="text-lg font-black font-raleway text-emerald-600 dark:text-emerald-400">
                  {history.length > 0 ? Math.max(...history.map(h => h.score || 0)) : '--'}
                </div>
              </div>
            </div>

            {/* Start Button */}
            <div className="pt-2">
              <button
                onClick={handleStartQuiz}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold font-heading text-sm shadow-xl shadow-indigo-600/25 active:scale-95 transition-all cursor-pointer"
              >
                <PlayCircle size={18} />
                <span>{history.length > 0 ? 'Bắt đầu làm lại đề' : 'Bắt đầu làm bài ngay'}</span>
              </button>
            </div>
          </div>

          {/* 2 Columns: Leaderboard & History */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Top 5 Leaderboard (7 Cols) */}
            <div className="lg:col-span-7 flat-card space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Trophy size={18} className="text-amber-500" />
                  <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white m-0">
                    Bảng Vàng Vinh Danh (Top 5)
                  </h3>
                </div>
                <span className="badge-warning">Thời gian thực</span>
              </div>

              {leaderboard.length === 0 ? (
                <div className="text-center py-10 text-slate-400 space-y-2">
                  <Trophy size={28} className="mx-auto opacity-30" />
                  <p className="text-xs font-sans m-0">Chưa có ai hoàn thành đề thi này. Hãy là người đầu tiên ghi danh bảng vàng!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((rank, index) => {
                    const isTop1 = index === 0;
                    const isTop2 = index === 1;
                    const isTop3 = index === 2;

                    return (
                      <div 
                        key={index} 
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                          isTop1 
                            ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-900/60' 
                            : isTop2 
                            ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700' 
                            : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs font-raleway ${
                            isTop1 ? 'bg-amber-500 text-white' : isTop2 ? 'bg-slate-400 text-white' : isTop3 ? 'bg-amber-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}>
                            {index + 1}
                          </div>

                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                              {rank.users?.full_name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <div className="text-xs sm:text-[13px] font-bold font-heading text-slate-900 dark:text-white line-clamp-1">
                                {rank.users?.full_name || 'Sĩ tử ẩn danh'}
                              </div>
                              <div className="text-[10.5px] text-slate-400 font-sans">
                                Thời gian: {Math.floor((rank.time_spent || 0) / 60)}p {(rank.time_spent || 0) % 60}s
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-base font-black font-raleway text-emerald-600 dark:text-emerald-400">
                            {rank.score}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block font-heading">Điểm</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* History of Attempts (5 Cols) */}
            <div className="lg:col-span-5 flat-card space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <History size={18} className="text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white m-0">
                    Lịch Sử Của Bạn
                  </h3>
                </div>
                <span className="text-xs font-semibold text-slate-400">{history.length} lượt</span>
              </div>

              {history.length === 0 ? (
                <div className="text-center py-10 text-slate-400 space-y-2">
                  <FileText size={28} className="mx-auto opacity-30" />
                  <p className="text-xs font-sans m-0">Bạn chưa từng làm đề thi này.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map((att, i) => (
                    <div 
                      key={att.id || i}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold font-heading text-slate-900 dark:text-white">
                          Lần làm thứ {history.length - i}
                        </div>
                        <div className="text-[10.5px] text-slate-400 font-sans">
                          {new Date(att.created_at).toLocaleDateString('vi-VN')} • {formatTime(att.time_spent)}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-black font-raleway text-indigo-600 dark:text-indigo-400">
                          {att.score}
                        </span>
                        <span className="text-[9.5px] uppercase font-bold text-slate-400 block font-heading">Điểm</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default QuizDetail;